(()=>{
const q=s=>document.querySelector(s);
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
let dt=null, cache=null;
async function getJSON(url){const r=await fetch(url,{cache:'no-store'});return r.ok?r.json():[]}
function ensureMarkup(){
 const view=q('#view-destinos');if(!view||q('#tabla-jerarquia'))return;
 view.innerHTML=`<div class="panel-heading"><div><p class="eyebrow">Navegación principal</p><h2>Provincia → localidad → centro → puesto</h2><p>Vista principal en DataTables, agrupada visualmente como en el listado original.</p></div><div><label>Ubicación<select id="hierarchy-mode"><option value="functional">Adscripción funcional 2026</option><option value="structural">Centro estructural 25/2026</option><option value="all">Todo el histórico</option></select></label><p id="hierarchy-count" class="muted"></p></div></div><div class="table-wrap"><table id="tabla-jerarquia" class="display" style="width:100%"><thead><tr><th>Provincia</th><th>Localidad</th><th>Centro</th><th>ID puesto</th></tr></thead><tbody></tbody></table></div><details class="tree-secondary"><summary>Ver también vista árbol</summary><div id="destinos-tree" class="group-tree"><p class="muted">Cargando destinos…</p></div></details>`;
 const style=document.createElement('style');style.textContent=`#tabla-jerarquia td{vertical-align:top}.hierarchy-repeat{color:transparent!important;border-top-color:transparent!important}.hierarchy-repeat>*{visibility:hidden}.tree-secondary{margin-top:1.5rem}.tree-secondary>summary{cursor:pointer;font-weight:700}.panel-heading label{display:grid;gap:.35rem;font-size:.82rem}.panel-heading select{min-width:220px}`;document.head.appendChild(style);
}
async function load(){
 ensureMarkup();
 const [centros,apariciones,adscripciones]=await Promise.all([getJSON('data/centros.json'),getJSON('data/apariciones.json'),getJSON('data/adscripciones.json')]);
 const cm=Object.fromEntries(centros.map(c=>[c.id,c]));
 const apps=[...apariciones,...adscripciones];
 apps.forEach(a=>{if(a.centro&&!cm[a.centro]&&a.centro_nombre)cm[a.centro]={id:a.centro,nombre:a.centro_nombre,provincia:a.provincia||'—',localidad:a.localidad||'—',tipo:a.tipo_centro||'Centro'};});
 cache={apps,cm};bind();build();
}
function mode(){return q('#hierarchy-mode')?.value||'functional';}
function rows(){
 const {apps,cm}=cache;let aa=[];
 if(mode()==='functional')aa=apps.filter(a=>a.tipo==='ADSCRIPCION'&&a.anio===2026);
 else if(mode()==='structural')aa=apps.filter(a=>a.tipo==='CONCURSO_TRASLADOS'&&a.anio===2026);
 else aa=apps.filter(a=>a.centro&&a.puesto);
 const fp=q('#filter-provincia')?.value||'',fl=q('#filter-localidad')?.value||'';
 const map=new Map();
 aa.forEach(a=>{if(!a.centro||!a.puesto)return;const c=cm[a.centro]||{provincia:a.provincia||'—',localidad:a.localidad||'—',nombre:a.centro_nombre||'Centro pendiente de vincular'};if(fp&&c.provincia!==fp)return;if(fl&&c.localidad!==fl)return;const key=[c.provincia,c.localidad,c.nombre,a.puesto,!!a.atiende_tambien].join('|');if(!map.has(key))map.set(key,{provincia:c.provincia||'—',localidad:c.localidad||'—',centro:c.nombre||'—',puesto:+a.puesto,secundario:!!a.atiende_tambien||!!a.secundario||a.rol==='ATEN_TAMBE',jornada:a.jornada||null});});
 return [...map.values()].sort((a,b)=>a.provincia.localeCompare(b.provincia,'es')||a.localidad.localeCompare(b.localidad,'es')||a.centro.localeCompare(b.centro,'es')||a.puesto-b.puesto);
}
function drawGroups(){const trs=[...q('#tabla-jerarquia tbody').rows];let pp='',pl='',pc='';trs.forEach(tr=>{const c=tr.cells;if(c.length<4)return;[0,1,2].forEach(i=>c[i].classList.remove('hierarchy-repeat'));const p=c[0].textContent.trim(),l=c[1].textContent.trim(),cn=c[2].textContent.replace('Atén també','').trim();if(p===pp)c[0].classList.add('hierarchy-repeat');else{pp=p;pl='';pc=''}if(l===pl&&p===pp)c[1].classList.add('hierarchy-repeat');else{pl=l;pc=''}if(cn===pc&&l===pl&&p===pp)c[2].classList.add('hierarchy-repeat');else pc=cn;});}
function build(){const tbody=q('#tabla-jerarquia tbody');if(!tbody||!cache)return;const rr=rows();if(dt){dt.destroy();dt=null}tbody.innerHTML='';rr.forEach(r=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${esc(r.provincia)}</td><td>${esc(r.localidad)}</td><td>${esc(r.centro)}${r.secundario?' <span class="tag">Atén també</span>':''}</td><td data-order="${r.puesto}"><strong>${r.puesto}</strong>${r.jornada&&r.jornada!==100?` <small>${r.jornada}%</small>`:''}</td>`;tbody.appendChild(tr)});if(typeof DataTable!=='undefined')dt=new DataTable('#tabla-jerarquia',{pageLength:50,order:[[0,'asc'],[1,'asc'],[2,'asc'],[3,'asc']],language:{search:'Buscar:',lengthMenu:'Mostrar _MENU_',info:'_START_–_END_ de _TOTAL_',infoEmpty:'Sin resultados',zeroRecords:'No hay coincidencias',emptyTable:'No hay datos',paginate:{next:'›',previous:'‹'}},drawCallback:drawGroups});else drawGroups();const count=q('#hierarchy-count');if(count)count.textContent=`${rr.length} relaciones`;}
function bind(){q('#hierarchy-mode')?.addEventListener('change',build);['#filter-provincia','#filter-localidad'].forEach(s=>q(s)?.addEventListener('change',()=>setTimeout(build,0)));q('#clear-filters')?.addEventListener('click',()=>setTimeout(build,20));}
window.addEventListener('DOMContentLoaded',()=>load().catch(console.error));
})();