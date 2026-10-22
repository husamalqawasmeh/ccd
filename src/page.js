export const PAGE = String.raw`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>Jordan Companies Overview</title>
<style>
:root{--bg:#f6f7f9;--fg:#1c2330;--mut:#667085;--card:#fff;--line:#e2e5ea;--acc:#1f6feb}
@media(prefers-color-scheme:dark){:root{--bg:#0f1218;--fg:#e6e9ef;--mut:#9aa3b2;--card:#171c26;--line:#262d3a;--acc:#5b9dff}}
body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--fg);margin:0}
main{max-width:1100px;margin:0 auto;padding:1rem}
a{color:var(--acc);text-decoration:none}a:hover{text-decoration:underline}
h1{font-size:1.4rem;margin:.5rem 0}h2{font-size:1.1rem;margin:1.6rem 0 .6rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.7rem}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:.8rem;display:block;color:inherit}
a.card:hover{border-color:var(--acc);text-decoration:none}
.card .l{color:var(--mut);font-size:.8rem}.card .v{font-size:1.5rem;font-weight:600;margin:.15rem 0}.card .s{color:var(--mut);font-size:.8rem}
table{border-collapse:collapse;width:100%;background:var(--card);border:1px solid var(--line);border-radius:10px;font-size:.9rem}
th,td{padding:.45rem .6rem;border-bottom:1px solid var(--line);text-align:start}th{color:var(--mut);font-weight:500;cursor:default}
th.s{cursor:pointer}td.n,th.n{text-align:end;font-variant-numeric:tabular-nums}
.bar{height:6px;background:var(--acc);border-radius:3px;min-width:1px}
.top{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem}.tabs button{border:1px solid var(--line);background:var(--card);color:var(--fg);padding:.35rem .8rem;border-radius:6px;cursor:pointer;margin-inline-end:.3rem}
.tabs button.on{background:var(--acc);color:#fff;border-color:var(--acc)}
input{padding:.5rem;font-size:1rem;width:100%;box-sizing:border-box;background:var(--card);color:var(--fg);border:1px solid var(--line);border-radius:6px}
.panel{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:1rem;margin-top:1.4rem}.panel h2{margin:0 0 .8rem}.panel .card{background:var(--bg)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:1rem}@media(max-width:800px){.two{grid-template-columns:1fr}}
.note{color:var(--mut);font-size:.8rem}
.scroll{overflow-x:auto}
</style>
<main><div class=top><h1><a href="#/">Jordan Companies Overview</a></h1><div class=tabs id=units></div></div><div id=app>Loading…</div></main>
<script>
var app=document.getElementById('app'),$=function(s){return document.querySelector(s)};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var UNITS={x:[1,''],k:[1e3,'K'],m:[1e6,'M'],b:[1e9,'B']},unit='x';
try{unit=localStorage.getItem('unit')||'x'}catch(e){}
function num(x,d){if(x==null)return '–';var u=UNITS[unit];
if(u[0]>1&&Math.abs(x)>=u[0])return (x/u[0]).toLocaleString('en-US',{maximumFractionDigits:1})+u[1];
return Number(x).toLocaleString('en-US',{maximumFractionDigits:d||0})}
function unitBar(){return [['x','Exact'],['k','Thousands'],['m','Millions'],['b','Billions']].map(function(t){return '<button data-u='+t[0]+(t[0]==unit?' class=on':'')+'>'+t[1]+'</button>'}).join('')}
function pct(a,b){return b?(100*a/b).toFixed(1)+'%':'–'}
function qs(o){return Object.keys(o).map(function(k){return k+'='+encodeURIComponent(o[k])}).join('&')}
function card(l,v,s,href){return '<'+(href?'a href="'+href+'"':'div')+' class=card><div class=l>'+l+'</div><div class=v>'+v+'</div><div class=s>'+(s||'')+'</div></'+(href?'a':'div')+'>'}
function get(u){return fetch(u).then(function(r){return r.json()})}
function L(p){return '#/list?'+qs(p)}

function breakdown(title,rows,key,total){
  var max=Math.max.apply(null,rows.map(function(r){return r.n}));
  return '<h3>'+title+'</h3><table><tr><th>'+esc(title)+'<th class=n>Companies<th class=n>%<th class=n>ASE-listed<th class=n>Capital (JD)<th style="width:15%"></tr>'+
  rows.map(function(r){var p={};p[key]=r.k==null?'':r.k;return '<tr><td><a href="'+L(p)+'">'+esc(r.k||'(none)')+'</a><td class=n>'+num(r.n)+'<td class=n>'+pct(r.n,total)+'<td class=n>'+num(r.listed)+'<td class=n>'+num(r.cap)+'<td><div class=bar style="width:'+(100*r.n/max)+'%"></div></tr>'}).join('')+'</table>'}

function dashboard(){
  app.innerHTML='Loading…';
  Promise.all([get('/api/stats'),get('/api/people?mode=fam'),get('/api/people?mode=ind')]).then(function(x){
    var s=x[0],by={};s.byListed.forEach(function(r){by[r.listed]=r});
    var A=by[1],U=by[0],tot=A.n+U.n,cap=A.cap+U.cap,ncap=A.ncap+U.ncap,P=s.partners;
    var h='<div class=panel><h2>Companies</h2><div class=grid>'+
      card('Total companies',num(tot),'all registered',L({}))+
      card('Listed on ASE',num(A.n),pct(A.n,tot)+' of all',L({listed:1}))+
      card('Not listed',num(U.n),pct(U.n,tot)+' of all',L({listed:0}))+
      card('Total capital (JD)',num(cap),'across '+num(ncap)+' companies with capital',L({capital:1}))+
      card('Average capital (JD)',num(cap/ncap),'all with capital',L({capital:1}))+
      card('Listed capital (JD)',num(A.cap),pct(A.cap,cap)+' of total · avg '+num(A.avgcap),L({listed:1}))+
      card('Unlisted capital (JD)',num(U.cap),pct(U.cap,cap)+' of total · avg '+num(U.avgcap)+' · '+num(U.ncap)+' with capital',L({listed:0,capital:1}))+
    '</div></div><h2>ASE statistics</h2><div class=grid>'+
      card('Listed companies',num(A.n),'ASE symbol on record',L({listed:1}))+
      card('With market price',num(A.nprice),pct(A.nprice,A.n)+' of listed',L({listed:1,priced:1,sort:'mcap'}))+
      card('Total market cap (JD)',num(A.mcap),'priced companies only',L({listed:1,priced:1,sort:'mcap'}))+
      card('Market cap / capital',(A.mcap/A.cap_priced).toFixed(2)+'x','price vs 1 JD par, priced only',L({listed:1,priced:1,sort:'mcap'}))+
      card('Avg share price (JD)',num(A.avgprice,2),'simple average',L({listed:1,priced:1,sort:'mcap'}))+
      card('Trading above par',num(A.above_par),'market cap &gt; capital',L({listed:1,priced:1}))+
      card('Trading below par',num(A.below_par),'market cap &lt; capital',L({listed:1,priced:1,dir:'asc',sort:'mcap'}))+
    '</div><h2>Partners in unlisted companies</h2><div class=grid>'+
      card('Companies with partner data',num(P.companies),pct(P.companies,P.unlisted)+' of '+num(P.unlisted)+' unlisted',L({listed:0,haspartners:1,sort:'partners'}))+
      card('Partner records',num(P.rows),'',L({listed:0,haspartners:1,sort:'partners'}))+
      card('Avg partners / company',(P.rows/P.companies).toFixed(2),'among companies with partner data',L({listed:0,haspartners:1,sort:'partners'}))+
      card('Distinct partners',num(P.people),'unique names','#/people')+
    '</div><div class=two><div>'+
      breakdown('Type',s.byType,'type',tot)+'</div><div>'+breakdown('Status',s.byStatus,'status',tot)+'</div></div>'+
    '<div class=two><div>'+breakdown('Governorate',s.byGov,'gov',tot)+'</div><div>'+breakdown('Share data source',s.bySrc,'src',tot)+'</div></div>'+
    '<div class=two><div><h3>Top ASE by market cap</h3><table><tr><th>Company<th>Symbol<th class=n>Market cap (JD)</tr>'+
      s.topAse.map(function(r){return '<tr><td><a href="#/c/'+r.national_id+'">'+esc(r.name)+'</a><td>'+esc(r.ase_symbol)+'<td class=n>'+num(r.market_cap_jd)+'</tr>'}).join('')+'</table></div>'+
    '<div><h3>Largest unlisted by capital</h3><table><tr><th>Company<th class=n>Capital (JD)</tr>'+
      s.topUnlisted.map(function(r){return '<tr><td><a href="#/c/'+r.national_id+'">'+esc(r.name)+'</a><td class=n>'+num(r.capital_jd)+'</tr>'}).join('')+'</table></div></div>'+
    '<h2 id=ps>Partner shares — unlisted companies</h2><div class=tabs id=tabs></div><p class=note id=pnote></p><div id=ptable class=scroll></div>';
    app.innerHTML=h;
    var data={fam:x[1],ind:x[2]},mode=location.hash.indexOf('mode=ind')>0?'ind':'fam';
    function render(){
      $('#tabs').innerHTML=[['fam','Families'],['ind','Individuals'],['ent','Entities']].map(function(t){return '<button data-m='+t[0]+(t[0]==mode?' class=on':'')+'>'+t[1]+'</button>'}).join('');
      $('#pnote').innerHTML=mode=='fam'?'Family = last name token (heuristic). Value = shares × book value per share.':mode=='ent'?'Companies and other entities holding shares.':'Value = shares × book value per share.';
      var d=data[mode];
      if(!d){$('#ptable').innerHTML='Loading…';get('/api/people?mode='+mode).then(function(r){data[mode]=r;render()});return}
      var tv=d.reduce(function(a,r){return a+r.value},0),ts=d.reduce(function(a,r){return a+r.shares},0);
      $('#ptable').innerHTML='<table><tr><th>'+(mode=='fam'?'Family':mode=='ent'?'Entity':'Individual')+(mode=='fam'?'<th class=n>Members':'')+'<th class=n>Companies<th class=n>Total shares<th class=n>Share value (JD)<th class=n>% of total</tr>'+
        '<tr><td><b>Total ('+num(d.length)+')</b>'+(mode=='fam'?'<td class=n>'+num(d.reduce(function(a,r){return a+r.members},0)):'')+'<td><td class=n><b>'+num(ts)+'</b><td class=n><b>'+num(tv)+'</b><td></tr>'+
        d.slice(0,300).map(function(r){var h=mode=='fam'?'#/person?family='+encodeURIComponent(r.name):'#/person?name='+encodeURIComponent(r.name);
          return '<tr><td><a href="'+h+'">'+esc(r.name)+'</a>'+(mode=='fam'?'<td class=n>'+r.members:'')+'<td class=n>'+r.companies+'<td class=n>'+num(r.shares)+'<td class=n>'+num(r.value)+'<td class=n>'+pct(r.value,tv)+'</tr>'}).join('')+'</table>'+(d.length>300?'<p class=note>Showing top 300 of '+d.length+'.</p>':'');
    }
    $('#tabs').onclick=function(e){if(e.target.dataset.m){mode=e.target.dataset.m;render()}};
    render();
  })}

var titles={listed:{1:'ASE-listed',0:'Not listed'}};
function listView(sp){
  var p={};sp.split('&').forEach(function(kv){if(kv){var a=kv.split('=');p[a[0]]=decodeURIComponent(a[1]||'')}});
  var off=+p.offset||0,chips=Object.keys(p).filter(function(k){return k!='offset'&&k!='sort'&&k!='dir'}).map(function(k){return esc(k)+': '+esc(k=='listed'?titles.listed[p[k]]:p[k]||'(none)')}).join(' · ');
  app.innerHTML='Loading…';
  get('/api/list?'+qs(p)).then(function(d){
    function sortLink(k,l,cls){var asc=p.sort==k&&p.dir!='asc';var q=Object.assign({},p,{sort:k,dir:asc?'asc':'desc',offset:0});return '<th class="s '+(cls||'')+'"><a href="'+L(q)+'">'+l+(p.sort==k?(p.dir=='asc'?' ▲':' ▼'):'')+'</a>'}
    var nav='';
    if(off>0)nav+='<a href="'+L(Object.assign({},p,{offset:Math.max(0,off-100)}))+'">← Prev</a> ';
    if(off+100<d.total)nav+='<a href="'+L(Object.assign({},p,{offset:off+100}))+'">Next →</a>';
    app.innerHTML='<p><a href="#/">← Overview</a></p><h2>'+num(d.total)+' companies</h2><p class=note>'+(chips||'All companies')+'</p>'+
    '<div class=scroll><table><tr>'+sortLink('name','Company')+'<th>Type<th>Status<th>Governorate'+sortLink('capital','Capital (JD)','n')+'<th>ASE'+sortLink('mcap','Market cap (JD)','n')+sortLink('partners','Partners','n')+'</tr>'+
    d.rows.map(function(r){return '<tr><td><a href="#/c/'+r.national_id+'">'+esc(r.name)+'</a><td>'+esc(r.type)+'<td>'+esc(r.status)+'<td>'+esc(r.governorate)+'<td class=n>'+num(r.capital_jd)+'<td>'+esc(r.ase_symbol)+'<td class=n>'+num(r.market_cap_jd)+'<td class=n>'+(r.npartners||'')+'</tr>'}).join('')+'</table></div><p>'+nav+'</p>'})}

function company(id){
  app.innerHTML='Loading…';
  get('/api/companies/'+id).then(function(c){
    var f=[['National ID',c.national_id],['Type',c.type],['Status',c.status],['Governorate',c.governorate],['Capital (JD)',num(c.capital_jd)],['Shares',num(c.shares)],['Shares source',c.shares_source],['Book value / share',c.book_value_per_share],['ASE symbol',c.ase_symbol],['Market price (JD)',c.market_price_jd],['Market cap (JD)',num(c.market_cap_jd)]];
    app.innerHTML='<p><a href="javascript:history.back()">← Back</a></p><h2>'+esc(c.name)+'</h2><table>'+f.map(function(r){return '<tr><th>'+r[0]+'<td>'+esc(r[1])+'</tr>'}).join('')+'</table>'+
    (c.partners.length?'<h3>Partners ('+c.partners.length+')</h3><table><tr><th>Name<th>Role<th>Nationality<th class=n>Shares<th class=n>%</tr>'+c.partners.map(function(p){return '<tr><td><a href="#/person?name='+encodeURIComponent(p.partner)+'">'+esc(p.partner)+'</a><td>'+esc(p.role)+'<td>'+esc(p.nationality)+'<td class=n>'+num(p.shares)+'<td class=n>'+pct(p.shares,c.shares)+'</tr>'}).join('')+'</table>':'<p class=note>No partner data.</p>')})}

function person(sp){
  var p={};sp.split('&').forEach(function(kv){var a=kv.split('=');if(a[0])p[a[0]]=decodeURIComponent(a[1]||'')});
  app.innerHTML='Loading…';
  get('/api/person?'+qs(p)).then(function(rows){
    var tv=rows.reduce(function(a,r){return a+(r.value||0)},0),ts=rows.reduce(function(a,r){return a+(r.shares||0)},0),fam=!!p.family;
    app.innerHTML='<p><a href="javascript:history.back()">← Back</a></p><h2>'+esc(p.family?'Family: '+p.family:p.name)+'</h2>'+
    '<div class=grid>'+card('Holdings',num(rows.length),'')+card('Total shares',num(ts),'')+card('Share value (JD)',num(tv),'')+'</div><br>'+
    '<div class=scroll><table><tr>'+(fam?'<th>Partner':'')+'<th>Company<th>Role<th class=n>Shares<th class=n>Value (JD)</tr>'+
    rows.map(function(r){return '<tr>'+(fam?'<td><a href="#/person?name='+encodeURIComponent(r.partner)+'">'+esc(r.partner)+'</a>':'')+'<td><a href="#/c/'+r.national_id+'">'+esc(r.company)+'</a><td>'+esc(r.role)+'<td class=n>'+num(r.shares)+'<td class=n>'+num(r.value)+'</tr>'}).join('')+'</table></div>'})}

function setUnits(){$('#units').innerHTML='<span class=note>Round numbers to: </span>'+unitBar()}
$('#units').onclick=function(e){if(e.target.dataset.u){unit=e.target.dataset.u;try{localStorage.setItem('unit',unit)}catch(x){}route()}};
function route(){setUnits();
  var h=location.hash||'#/',m;
  if(m=h.match(/^#\/list\?(.*)$/))listView(m[1]);
  else if(h=='#/list')listView('');
  else if(m=h.match(/^#\/c\/(\w+)$/))company(m[1]);
  else if(m=h.match(/^#\/person\?(.*)$/))person(m[1]);
  else if(h=='#/people'){location.hash='#/';setTimeout(function(){var e=document.getElementById('ps');e&&e.scrollIntoView()},600)}
  else dashboard();
  window.scrollTo(0,0)}
window.onhashchange=route;route();
</script>`;
