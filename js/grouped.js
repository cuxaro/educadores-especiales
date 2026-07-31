(()=>{
const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const uniq=a=>[...new Set(a.filter(v=>v!==null&&v!==undefined&&v!==''))];
let data=null;
async function getJSON(url){const r=await fetch(url,{cache:'no-store'});return r.ok?r.json():[]}
async function loadGrouped(){
 const [centros,apariciones,adscripciones,recursos,recursosIes]=await Promise.all([
  getJSON('data/centros.json'),getJSON('data/apariciones.json'),getJSON('data/adscripciones.json'),getJSON('data/recursos.json'),getJSON('data/recursos_ies.json')
 ]);
 const allRec=[...recursos,...recursosIes], cm=Object.fromEntries(centros.map(c=>[c.id,c]));
 allRec.forEach(r=>{if(!cm[r.centro]&&r.nombre)cm[r.centro]={id:r.centro,nombre:r.nombre,provincia:r.provincia,localidad:r.localidad,tipo:r.tipo||'Centro',codigo:r.codigo||null}});
 const apps=[...apariciones,...adscripciones], byCentre={};
 apps.forEach(a=>{if(a.centro){(byCentre[a.centro]??=[]).push(a)}});
 const resources=Object.fromEntries(allRec.map(r=>[r.centro,r]));
 data={centros:Object.values(cm),apps,byCentre,resources};
 renderGrouped();
}
function filters(){return{provincia:q('#filter-provincia')?.value||'',localidad:q('#filter-localidad')?.value||'',tipo:q('#filter-tipo-centro')?.value||'',recurso:q('#filter-recurso')?.value||'',fuente:q('#filter-fuente')?.value||'',anio:+(q('#filter-anio')?.value||0)||null}}
function includeCentre(c,f){
 const r=data.resources[c.id]?.recurso||'', apps=data.byCentre[c.id]||[];
 if(f.provincia&&c.provincia!==f.provincia)return false;
 if(f.localidad&&c.localidad!==f.localidad)return false;
 if(f.tipo&&c.tipo!==f.tipo)return false;
 if(f.recurso&&(f.recurso==='SIN_CONFIRMAR'?!!r:r!==f.recurso))return false;
 if(f.fuente&&!apps.some(a=>a.tipo===f.fuente))return false;
 if(f.anio&&!apps.some(a=>(a.anio||0)>=f.anio))return false;
 return apps.length||r;
}
function badge(c){const r=data.resources[c.id];return r?`<span class="group-resource group-${String(r.recurso).toLowerCase()}">${esc(r.recurso)}</span>`:''}
function renderGrouped(){
 const root=q('#destinos-tree');if(!root||!data)return;const f=filters(),tree={};
 data.centros.filter(c=>includeCentre(c,f)).forEach(c=>{const p=c.provincia||'Sin provincia',l=c.localidad||'Sin localidad';tree[p]??={};tree[p][l]??=[];tree[p][l].push(c)});
 root.innerHTML='';
 Object.keys(tree).sort((a,b)=>a.localeCompare(b,'es')).forEach(prov=>{
  const provApps=Object.values(tree[prov]).flat();
  const province=document.createElement('section');province.className='group-province';
  province.innerHTML=`<div class="group-province-head"><div><span class="group-kicker">Provincia</span><h3>${esc(prov)}</h3></div><span>${Object.keys(tree[prov]).length} localidades · ${provApps.length} centros</span></div>`;
  Object.keys(tree[prov]).sort((a,b)=>a.localeCompare(b,'es')).forEach(loc=>{
   const centres=tree[prov][loc].sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
   const locPuestos=uniq(centres.flatMap(c=>(data.byCentre[c.id]||[]).map(a=>a.puesto)));
   const dl=document.createElement('details');dl.className='group-locality';
   dl.innerHTML=`<summary><span><strong>${esc(loc)}</strong><small>${centres.length} centros · ${locPuestos.length} puestos conocidos</small></span><span class="group-chevron">⌄</span></summary><div class="group-centres"></div>`;
   const holder=dl.querySelector('.group-centres');
   centres.forEach(c=>{
    const apps=data.byCentre[c.id]||[], puestos=uniq(apps.map(a=>a.puesto)).sort((a,b)=>a-b), latest=[...apps].sort((a,b)=>(b.anio||0)-(a.anio||0))[0];
    const dc=document.createElement('details');dc.className='group-centre';
    dc.innerHTML=`<summary><span class="group-centre-main"><span><strong>${esc(c.nombre)}</strong><small>${esc(c.tipo||'Centro')}${c.codigo?` · ${esc(c.codigo)}`:''}${latest?` · última evidencia ${latest.anio}`:''}</small></span>${badge(c)}</span><span class="group-count">${puestos.length} puesto${puestos.length===1?'':'s'}</span></summary><div class="group-posts">${puestos.length?puestos.map(n=>`<button class="group-post history-btn" data-puesto="${n}"><strong>${n}</strong><span>Ver historial →</span></button>`).join(''):'<p class="group-empty">Recurso oficial confirmado, pero todavía no tenemos un número C1-04-03 vinculado.</p>'}<button class="group-centre-link centre-btn" data-centro="${esc(c.id)}">Ver ficha completa del centro →</button></div>`;
    holder.appendChild(dc);
   });
   province.appendChild(dl);
  });
  root.appendChild(province);
 });
 if(!root.children.length)root.innerHTML='<div class="group-empty-state">No hay destinos que coincidan con los filtros.</div>';
}
function bind(){['#filter-provincia','#filter-localidad','#filter-tipo-centro','#filter-recurso','#filter-fuente','#filter-anio'].forEach(s=>q(s)?.addEventListener('change',renderGrouped));q('#clear-filters')?.addEventListener('click',()=>setTimeout(renderGrouped,0));}
window.addEventListener('DOMContentLoaded',()=>{bind();loadGrouped().catch(console.error)});
})();