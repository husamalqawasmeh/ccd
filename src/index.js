const json = (d) => Response.json(d, { headers: { "access-control-allow-origin": "*" } });

const PAGE = `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>Jordan Companies</title>
<style>body{font-family:system-ui;max-width:900px;margin:2rem auto;padding:0 1rem}input{width:100%;padding:.6rem;font-size:1rem}
table{border-collapse:collapse;width:100%;margin-top:1rem}td,th{border-bottom:1px solid #ccc;padding:.4rem;text-align:start}</style>
<h1>Jordan Companies</h1><input id=q placeholder="Search company or partner / ابحث" autofocus>
<table id=t></table>
<script>
const q=document.getElementById('q'),t=document.getElementById('t');
let h;async function go(){const r=await fetch('/api/companies?q='+encodeURIComponent(q.value));const d=await r.json();
t.innerHTML='<tr><th>Name<th>Type<th>Governorate<th>Capital (JD)<th>ID</tr>'+d.map(c=>'<tr><td>'+esc(c.name)+'<td>'+esc(c.type)+'<td>'+esc(c.governorate)+'<td>'+(c.capital_jd??'')+'<td><a href="/api/companies/'+c.national_id+'">'+c.national_id+'</a></tr>').join('')}
function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
q.oninput=()=>{clearTimeout(h);h=setTimeout(go,200)};go();
</script>`;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;
    if (path === "/") return new Response(PAGE, { headers: { "content-type": "text/html;charset=utf-8" } });
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
      const { results: partners } = await env.DB.prepare("SELECT partner,role,shares,nationality FROM partners WHERE national_id=?").bind(m[1]).all();
      return json({ ...company, partners });
    }
    if (path === "/api/partner-worth") {
      const { results } = await env.DB.prepare("SELECT * FROM partner_worth LIMIT 100").all();
      return json(results);
    }
    return new Response("Not found", { status: 404 });
  },
};
