import { PAGE } from "./page.js";

const json = (d) => Response.json(d, { headers: { "access-control-allow-origin": "*" } });
const LISTED = "(COALESCE(c.ase_symbol,'')<>'')";

// partners of non-ASE-listed companies, with share value = shares x book value per share
const PARTNER_ROWS = `SELECT p.national_id, c.name AS company, p.partner, p.role, p.nationality, p.shares,
  ROUND(p.shares * c.book_value_per_share, 2) AS value
  FROM partners p JOIN companies c USING(national_id) WHERE NOT ${LISTED}`;

const ENTITY_RE = /شركة|شركه|مؤسسة|مؤسسه|ليميتد|محدود|مجموعة|صندوق|بنك|مصرف|شركاه|شريك|لتجارة|للاستثمار|لاستثمار|للخدمات|لخدمات|للصناعة|ش\.ذ|م\.م|[()/]|فرع|[ء-ي]-[ء-ي]/;
const PERSON_L = new Set(["لقمان", "لطفي", "لبيب", "لؤي", "لجين", "لبنى", "ليث", "لينا", "ليلى", "لافي"]);
// entity = name has a company word, or a later word starting with "ل" (e.g. "التوكيلات الذكية للمركبات")
const ENTITY = { test: (n) => ENTITY_RE.test(n) || n.split(/\s+/).slice(1).some((t) => t.startsWith("ل") && t.length >= 4 && !PERSON_L.has(t)) };
const norm = (s) => s.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").trim();
const familyOf = (name) => { const t = norm(name).split(/\s+/); return t.length > 1 ? t[t.length - 1] : null; };

async function people(env, mode) {
  const { results } = await env.DB.prepare(PARTNER_ROWS).all();
  const groups = new Map();
  for (const r of results) {
    const entity = ENTITY.test(r.partner);
    const fam = entity ? null : familyOf(r.partner);
    let key;
    if (mode === "ent") { if (!entity) continue; key = r.partner; }
    else if (entity) continue;
    else if (mode === "fam") { if (!fam) continue; key = fam; }
    else key = norm(r.partner);
    let g = groups.get(key);
    if (!g) groups.set(key, (g = { name: mode === "ind" ? r.partner : key, members: new Set(), companies: new Set(), shares: 0, value: 0 }));
    g.members.add(norm(r.partner)); g.companies.add(r.national_id);
    g.shares += r.shares || 0; g.value += r.value || 0;
  }
  return [...groups.values()]
    .map((g) => ({ name: g.name, members: g.members.size, companies: g.companies.size, shares: g.shares, value: Math.round(g.value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);
}

async function stats(env) {
  const db = env.DB;
  const all = (sql) => db.prepare(sql).all().then((r) => r.results);
  const [byListed, partners, byPartnerType, byType, byStatus, byGov, bySrc, topAse, topUnlisted] = await Promise.all([
    all(`SELECT ${LISTED} AS listed, COUNT(*) n, COUNT(capital_jd) ncap, SUM(capital_jd) cap, AVG(capital_jd) avgcap,
         COUNT(market_cap_jd) nprice, SUM(market_cap_jd) mcap, AVG(market_price_jd) avgprice,
         SUM(CASE WHEN market_cap_jd IS NOT NULL THEN capital_jd END) cap_priced,
         SUM(CASE WHEN market_cap_jd > capital_jd THEN 1 ELSE 0 END) above_par,
         SUM(CASE WHEN market_cap_jd < capital_jd THEN 1 ELSE 0 END) below_par
         FROM companies c GROUP BY 1`),
    all(`SELECT COUNT(*) rows, COUNT(DISTINCT partner) people, COUNT(DISTINCT national_id) companies,
         (SELECT COUNT(*) FROM companies c WHERE NOT ${LISTED}) unlisted
         FROM (${PARTNER_ROWS})`),
    all(`SELECT nationality k, COUNT(*) n FROM (${PARTNER_ROWS}) GROUP BY 1 ORDER BY 2 DESC LIMIT 6`),
    all(`SELECT type k, COUNT(*) n, SUM(${LISTED}) listed, SUM(capital_jd) cap FROM companies c GROUP BY 1 ORDER BY 2 DESC`),
    all(`SELECT status k, COUNT(*) n, SUM(${LISTED}) listed, SUM(capital_jd) cap FROM companies c GROUP BY 1 ORDER BY 2 DESC`),
    all(`SELECT governorate k, COUNT(*) n, SUM(${LISTED}) listed, SUM(capital_jd) cap FROM companies c GROUP BY 1 ORDER BY 2 DESC`),
    all(`SELECT shares_source k, COUNT(*) n, SUM(${LISTED}) listed, SUM(capital_jd) cap FROM companies c GROUP BY 1 ORDER BY 2 DESC`),
    all(`SELECT national_id,name,ase_symbol,market_price_jd,market_cap_jd FROM companies c WHERE market_cap_jd IS NOT NULL ORDER BY market_cap_jd DESC LIMIT 10`),
    all(`SELECT national_id,name,type,capital_jd FROM companies c WHERE NOT ${LISTED} AND capital_jd IS NOT NULL ORDER BY capital_jd DESC LIMIT 10`),
  ]);
  return { byListed, partners: partners[0], byPartnerType, byType, byStatus, byGov, bySrc, topAse, topUnlisted };
}

async function list(env, sp) {
  const where = ["(?1 IS NULL OR 1=1)"], args = [];
  const eq = (param, col) => { if (sp.has(param)) { where.push(`${col} IS ?`); args.push(sp.get(param) === "" ? null : sp.get(param)); } };
  if (sp.get("listed") === "1") where.push(LISTED);
  if (sp.get("listed") === "0") where.push(`NOT ${LISTED}`);
  eq("type", "c.type"); eq("status", "c.status"); eq("gov", "c.governorate"); eq("src", "c.shares_source");
  if (sp.get("priced") === "1") where.push("c.market_cap_jd IS NOT NULL");
  if (sp.get("capital") === "1") where.push("c.capital_jd IS NOT NULL");
  if (sp.get("haspartners") === "1") where.push("EXISTS (SELECT 1 FROM partners p WHERE p.national_id=c.national_id)");
  if (sp.get("q")) { where.push("(c.name LIKE ?1 OR c.national_id IN (SELECT national_id FROM partners WHERE partner LIKE ?1))"); }
  const sorts = { capital: "c.capital_jd", mcap: "c.market_cap_jd", name: "c.name", partners: "npartners" };
  const order = (sorts[sp.get("sort")] || "c.capital_jd") + (sp.get("dir") === "asc" ? " ASC" : " DESC");
  const w = where.length ? "WHERE " + where.join(" AND ") : "";
  // positional ? params can't mix with ?1, so number everything
  let i = 0;
  const numbered = w.replace(/\?(?!\d)/g, () => `?${++i + 1}`);
  const binds = [sp.get("q") ? `%${sp.get("q")}%` : null, ...args];
  const offset = Math.max(0, parseInt(sp.get("offset")) || 0);
  const base = `FROM companies c ${numbered}`;
  const [{ total }, { results }] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) total ${base}`).bind(...binds).first().then((r) => ({ total: r.total })),
    env.DB.prepare(`SELECT c.national_id,c.name,c.type,c.status,c.governorate,c.capital_jd,c.ase_symbol,c.market_price_jd,c.market_cap_jd,
        (SELECT COUNT(*) FROM partners p WHERE p.national_id=c.national_id) npartners
        ${base} ORDER BY ${order} LIMIT 100 OFFSET ${offset}`).bind(...binds).all(),
  ]);
  return { total, offset, rows: results };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;
    try {
      if (path === "/") return new Response(PAGE, { headers: { "content-type": "text/html;charset=utf-8" } });
      if (path === "/api/stats") return json(await stats(env));
      if (path === "/api/list") return json(await list(env, url.searchParams));
      if (path === "/api/people") return json(await people(env, url.searchParams.get("mode") || "fam"));
      if (path === "/api/person") {
        // members of a family (?family=) or one individual/entity (?name=): their holdings per company
        const { results } = await env.DB.prepare(PARTNER_ROWS).all();
        const fam = url.searchParams.get("family"), name = url.searchParams.get("name");
        const rows = results.filter((r) => fam ? !ENTITY.test(r.partner) && familyOf(r.partner) === fam : norm(r.partner) === norm(name));
        return json(rows.sort((a, b) => (b.value || 0) - (a.value || 0)));
      }
      if (path === "/api/companies") {
        const q = `%${url.searchParams.get("q") ?? ""}%`;
        const { results } = await env.DB.prepare(
          `SELECT national_id,name,type,status,governorate,capital_jd FROM companies
           WHERE name LIKE ?1 OR national_id IN (SELECT national_id FROM partners WHERE partner LIKE ?1)
           ORDER BY capital_jd DESC LIMIT 100`).bind(q).all();
        return json(results);
      }
      const m = path.match(/^\/api\/companies\/(\w+)$/);
      if (m) {
        const company = await env.DB.prepare("SELECT * FROM companies WHERE national_id=?").bind(m[1]).first();
        if (!company) return new Response("Not found", { status: 404 });
        const { results: partners } = await env.DB.prepare("SELECT partner,role,shares,nationality FROM partners WHERE national_id=? ORDER BY shares DESC").bind(m[1]).all();
        return json({ ...company, partners });
      }
      if (path === "/api/partner-worth") {
        const { results } = await env.DB.prepare("SELECT * FROM partner_worth LIMIT 100").all();
        return json(results);
      }
    } catch (e) {
      return new Response(String(e), { status: 500 });
    }
    return new Response("Not found", { status: 404 });
  },
};

