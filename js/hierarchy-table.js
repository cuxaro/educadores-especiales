(()=>{
const q=s=>document.querySelector(s);
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
let dt=null;
function wait(){if(typeof state==='undefined'||!state.m)return setTimeout(wait,80);init();}
function ensureMarkup(){
 const view=q('#view-destinos');if(!view||q('#tabla-jerarquia'))return;
 const old=q('#destinos-tree');
 view.innerHTML=`<div class="panel-heading"><div><p class="eyebrow">Navegación principal</p><h2>Provincia → localidad → centro → puesto</h2><p>Vista agrupada en DataTables. Las celdas repetidas se ocultan visualmente para leer el listado como una jerarquía.</p></div><div><label>Ubicación<select id="hierarchy-mode"><option value="functional">Adscripción funcional 2026</option><option value="structural">Centro estructural 25/2026</option><option value="all">Todo el histórico</option></select></label><p id="hierarchy-count" class="muted"></p></div></div><div class="table-wrap"><table id="tabla-jerarquia" class="display" style="width:100%"><thead><tr><th>Provincia</th><th>Localidad</th><th>Centro</th><th>ID puesto</th></tr></thead><tbody></tbody></table></div><details class="tree-secondary"><summary>Ver también vista árbol</summary><div id="destinos-tree" class="group-tree"><p class="muted">Cargando destinos…</p></div></details>`;
 const style=document.createElement('style');style.textContent=`#tabla-jerarquia td{vertical-align:top}.hierarchy-repeat{color:transparent!important;border-top-color:transparent!important}.hierarchy-repeat>*{visibility:hidden}.tree-secondary{margin-top:1.5rem}.tree-secondary>summary{cursor:pointer;font-weight:700}.panel-heading label{display:grid;gap:.35rem;font-size:.82rem}.panel-heading select{min-width:220px}`;document.head.appendChild(style);
 const footer=document.querySelector('footer strong');if(footer)footer.textContent='v1.3.0';
}
function mode(){return q('#hierarchy-mode')?.value||'functional';}
function selected(){return{provincia:q('#filter-provincia')?.value||'',localidad:q('#filter-localidad')?.value||'',tipo:q('#filter-tipo-centro')?.value||'',recurso:q('#filter-recurso')?.value||'',fuente:q('#filter-fuente')?.value||'',anio:+(q('#filter-anio')?.value||0)||null};}
function rows(){
 const apps=state.apariciones||[], cm=state.m.cm||{}, f=selected(); let aa=[];
 if(mode()==='functional') aa=apps.filter(a=>a.tipo==='ADSCRIPCION'&&a.anio===2026);
 else if(mode()==='structural') aa=apps.filter(a=>a.tipo==='CONCURSO_TRASLADOS'&&a.anio===2026);
 else aa=apps.filter(a=>a.centro&&a.puesto);
 const map=new Map();
 aa.forEach(a=>{
   if(!a.centro||!a.puesto)return;
   const c=cm[a.centro]||{provincia:a.provincia||'—',localidad:a.localidad||'—',nombre:a.centro_nombre||'Centro pendiente de vincular',tipo:a.tipo_centro||'Centro'};
   if(f.provincia&&c.provincia!==f.provincia)return;if(f.localidad&&c.localidad!==f.localidad)return;if(f.tipo&&c.tipo!==f.tipo)return;if(f.fuente&&a.tipo!==f.fuente)return;if(f.anio&&(a.anio||0)<f.anio)return;
   const key=[c.provincia,c.localidad,c.nombre,a.puesto].join('|');
   if(!map.has(key))map.set(key,{provincia:c.provincia||'—',localidad:c.localidad||'—',centro:c.nombre||'—',centroId:a.centro,puesto:+a.puesto,secundario:!!a.atiende_tambien||!!a.secundario||a.rol==='ATEN_TAMBE',jornada:a.jornada||null});
 });
 return [...map.values()].sort((a,b)=>a.provincia.localeCompare(b.provincia,'es')||a.localidad.localeCompare(b.localidad,'es')||a.centro.localeCompare(b.centro,'es')||a.puesto-b.puesto);
}
function drawGroups(){const trs=[...q('#tabla-jerarquia tbody').rows];let pp=null,pl=null,pc=null;trs.forEach(tr=>{const cells=tr.cells;if(cells.length<4)return;cells[0].classList.remove('hierarchy-repeat');cells[1].classList.remove('hierarchy-repeat');cells[2].classList.remove('hierarchy-repeat');const p=cells[0].textContent.trim(),l=cells[1].textContent.trim(),c=cells[2].querySelector('button')?.textContent.trim()||cells[2].textContent.trim();if(p===pp)cells[0].classList.add('hierarchy-repeat');else{pp=p;pl=null;pc=null}if(p===pp&&l===pl)cells[1].classList.add('hierarchy-repeat');else{pl=l;pc=null}if(p===pp&&l===pl&&c===pc)cells[2].classList.add('hierarchy-repeat');else pc=c;});}
function build(){
 const tbody=q('#tabla-jerarquia tbody'); if(!tbody)return; const rr=rows();
 if(dt){dt.destroy();dt=null;} tbody.innerHTML='';
 rr.forEach(r=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${esc(r.provincia)}</td><td>${esc(r.localidad)}</td><td><button class="text-link centre-btn" data-centro="${esc(r.centroId)}">${esc(r.centro)}</button>${r.secundario?' <span class="tag">Atén també</span>':''}</td><td data-order="${r.puesto}"><button class="text-link history-btn" data-puesto="${r.puesto}"><strong>${r.puesto}</strong></button>${r.jornada&&r.jornada!==100?` <small>${r.jornada}%</small>`:''}</td>`;tbody.appendChild(tr)});
 if(typeof DataTable!=='undefined')dt=new DataTable('#tabla-jerarquia',{pageLength:50,order:[[0,'asc'],[1,'asc'],[2,'asc'],[3,'asc']],language:typeof lang==='function'?lang():{search:'Buscar:',lengthMenu:'Mostrar _MENU_',info:'_START_–_END_ de _TOTAL_',zeroRecords:'No hay coincidencias',paginate:{next:'›',previous:'‹'}},drawCallback:drawGroups});else drawGroups();
 q('#hierarchy-count').textContent=`${rr.length} relaciones`;
}
function init(){ensureMarkup();q('#hierarchy-mode')?.addEventListener('change',build);['#filter-provincia','#filter-localidad','#filter-tipo-centro','#filter-recurso','#filter-fuente','#filter-anio'].forEach(s=>q(s)?.addEventListener('change',()=>setTimeout(build,0)));q('#clear-filters')?.addEventListener('click',()=>setTimeout(build,0));build();}
window.addEventListener('DOMContentLoaded',wait);
})();