(()=>{
const q=s=>document.querySelector(s);
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
let dt=null, data={apps:[],centros:{}};
async function getJSON(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`${url}: ${r.status}`);return r.json();}
function ensureMarkup(){
 const view=q('#view-destinos');if(!view)return;
 view.innerHTML=`<div class="panel-heading"><div><p class="eyebrow">Navegación principal</p><h2>Provincia → localidad → centro → puestos</h2><p>Listado jerárquico en DataTables. Por defecto muestra la adscripción funcional a fecha 12/03/2026.</p></div><div><label>Ubicación<select id="hierarchy-mode"><option value="functional">Adscripción funcional 2026</option><option value="structural">Centro estructural 25/2026</option><option value="all">Todo el histórico</option></select></label><p id="hierarchy-count" class="muted"></p></div></div><div class="table-wrap"><table id="tabla-jerarquia" class="display" style="width:100%"><thead><tr><th>Provincia</th><th>Localidad</th><th>Centro</th><th>ID puesto</th></tr></thead><tbody></tbody></table></div>`;
 const style=document.createElement('style');style.textContent=`#tabla-jerarquia td{vertical-align:top}.hierarchy-repeat{color:transparent!important;border-top-color:transparent!important}.hierarchy-repeat>*{visibility:hidden}.panel-heading label{display:grid;gap:.35rem;font-size:.82rem}.panel-heading select{min-width:220px}`;document.head.appendChild(style);
 const footer=document.querySelector('footer strong');if(footer)footer.textContent='v1.3.2';
}
function filt(){return{provincia:q('#filter-provincia')?.value||'',localidad:q('#filter-localidad')?.value||'',tipo:q('#filter-tipo-centro')?.value||'',fuente:q('#filter-fuente')?.value||'',anio:+(q('#filter-anio')?.value||0)||null};}
function mode(){return q('#hierarchy-mode')?.value||'functional';}
function rows(){
 const f=filt();let aa=data.apps;
 if(mode()==='functional')aa=aa.filter(a=>a.tipo==='ADSCRIPCION'&&a.anio===2026);
 else if(mode()==='structural')aa=aa.filter(a=>a.tipo==='CONCURSO_TRASLADOS'&&a.anio===2026);
 else aa=aa.filter(a=>a.centro&&a.puesto);
 const map=new Map();
 aa.forEach(a=>{
   if(!a.puesto)return;
   const c=(a.centro&&data.centros[a.centro])||{provincia:a.provincia||'—',localidad:a.localidad||'—',nombre:a.centro_nombre||'Centro pendiente de vincular',tipo:a.tipo_centro||'Centro'};
   if(f.provincia&&c.provincia!==f.provincia)return;if(f.localidad&&c.localidad!==f.localidad)return;if(f.tipo&&c.tipo!==f.tipo)return;if(f.fuente&&a.tipo!==f.fuente)return;if(f.anio&&(a.anio||0)<f.anio)return;
   const sec=!!a.atiende_tambien||!!a.secundario||a.rol==='ATEN_TAMBE';
   const key=[c.provincia,c.localidad,c.nombre,a.puesto,sec?'S':'P'].join('|');
   if(!map.has(key))map.set(key,{provincia:c.provincia||'—',localidad:c.localidad||'—',centro:c.nombre||'—',puesto:+a.puesto,secundario:sec,jornada:a.jornada||null});
 });
 return [...map.values()].sort((a,b)=>a.provincia.localeCompare(b.provincia,'es')||a.localidad.localeCompare(b.localidad,'es')||a.centro.localeCompare(b.centro,'es')||a.puesto-b.puesto);
}
function drawGroups(){
 const tb=q('#tabla-jerarquia tbody');if(!tb)return;let pp=null,pl=null,pc=null;
 [...tb.rows].forEach(tr=>{const cells=tr.cells;if(cells.length<4)return;[0,1,2].forEach(i=>cells[i].classList.remove('hierarchy-repeat'));const p=cells[0].textContent.trim(),l=cells[1].textContent.trim(),c=cells[2].textContent.replace('Atén també','').trim();if(p===pp)cells[0].classList.add('hierarchy-repeat');else{pp=p;pl=null;pc=null}if(l===pl&&p===pp)cells[1].classList.add('hierarchy-repeat');else{pl=l;pc=null}if(c===pc&&l===pl&&p===pp)cells[2].classList.add('hierarchy-repeat');else pc=c;});
}
function build(){
 const tbody=q('#tabla-jerarquia tbody');if(!tbody)return;const rr=rows();if(dt){dt.destroy();dt=null;}tbody.innerHTML='';
 rr.forEach(r=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${esc(r.provincia)}</td><td>${esc(r.localidad)}</td><td>${esc(r.centro)}${r.secundario?' <span class="tag">Atén també</span>':''}</td><td data-order="${r.puesto}"><strong>${r.puesto}</strong>${r.jornada&&r.jornada!==100?` <small>${r.jornada}%</small>`:''}</td>`;tbody.appendChild(tr)});
 if(typeof DataTable!=='undefined')dt=new DataTable('#tabla-jerarquia',{pageLength:50,order:[[0,'asc'],[1,'asc'],[2,'asc'],[3,'asc']],language:{search:'Buscar:',lengthMenu:'Mostrar _MENU_',info:'_START_–_END_ de _TOTAL_',infoEmpty:'Sin resultados',zeroRecords:'No hay coincidencias',emptyTable:'No hay datos',paginate:{next:'›',previous:'‹'}},drawCallback:drawGroups});else drawGroups();
 q('#hierarchy-count').textContent=`${rr.length} relaciones`;
}
async function boot(){
 ensureMarkup();
 try{
   const [centros,apariciones,adscripciones]=await Promise.all([getJSON('data/centros.json'),getJSON('data/apariciones.json'),getJSON('data/adscripciones.json')]);
   data.centros=Object.fromEntries(centros.map(c=>[c.id,c]));
   data.apps=[...apariciones,...adscripciones];
   data.apps.forEach(a=>{if(a.centro&&!data.centros[a.centro]&&a.centro_nombre)data.centros[a.centro]={id:a.centro,nombre:a.centro_nombre,provincia:a.provincia||'—',localidad:a.localidad||'—',tipo:a.tipo_centro||'Centro'};});
   q('#hierarchy-mode')?.addEventListener('change',build);
   ['#filter-provincia','#filter-localidad','#filter-tipo-centro','#filter-fuente','#filter-anio'].forEach(s=>q(s)?.addEventListener('change',build));
   q('#clear-filters')?.addEventListener('click',()=>setTimeout(build,0));
   build();
 }catch(e){console.error(e);const view=q('#view-destinos');if(view)view.insertAdjacentHTML('beforeend',`<p class="app-status">Error cargando destinos: ${esc(e.message)}</p>`);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();