(()=>{
const q=s=>document.querySelector(s);
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const uniq=a=>[...new Set(a.filter(v=>v!==null&&v!==undefined&&v!==''))];
let dt=null,data={apps:[],centros:{},recursos:{}};
let quick='all';
async function getJSON(url){const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`${url}: ${r.status}`);return r.json();}
function ensureMarkup(){
 const view=q('#view-destinos');if(!view)return;
 view.innerHTML=`<div class="hierarchy-head"><div><p class="eyebrow">Navegación principal</p><h2>Provincia → localidad → centro → puestos</h2><p>Listado jerárquico en DataTables. Por defecto muestra la adscripción funcional a fecha 12/03/2026.</p></div><div class="hierarchy-mode-box"><label>Ubicación<select id="hierarchy-mode"><option value="functional">Adscripción funcional 2026</option><option value="structural">Centro estructural 25/2026</option><option value="all">Todo el histórico</option></select></label><p id="hierarchy-count" class="muted"></p></div></div>
 <div class="hierarchy-toolbar" aria-label="Accesos rápidos"><button class="hierarchy-chip is-active" data-quick="all">Todos</button><button class="hierarchy-chip" data-quick="CEE">CEE</button><button class="hierarchy-chip" data-quick="UECO">UECO</button><button class="hierarchy-chip" data-quick="50">Jornada 50%</button><button class="hierarchy-chip" data-quick="secondary">Atén també</button><button id="hierarchy-reset-nav" class="hierarchy-reset" hidden>Limpiar navegación</button></div>
 <div class="table-wrap hierarchy-table-wrap"><table id="tabla-jerarquia" class="display hierarchy-table" style="width:100%"><colgroup><col class="col-prov"><col class="col-loc"><col class="col-centro"><col class="col-id"><col class="col-recurso"><col class="col-ref"><col class="col-jornada"><col class="col-actions"></colgroup><thead><tr><th>Provincia</th><th>Localidad</th><th>Centro</th><th>ID puesto</th><th>Recurso</th><th>Referencia</th><th>Jornada</th><th>Acciones</th></tr></thead><tbody></tbody></table></div>`;
 const footer=document.querySelector('footer strong');if(footer)footer.textContent='v1.4.0';
}
function filt(){return{provincia:q('#filter-provincia')?.value||'',localidad:q('#filter-localidad')?.value||'',tipo:q('#filter-tipo-centro')?.value||'',recurso:q('#filter-recurso')?.value||'',fuente:q('#filter-fuente')?.value||'',anio:+(q('#filter-anio')?.value||0)||null};}
function mode(){return q('#hierarchy-mode')?.value||'functional';}
function resourcesFor(id){return uniq((data.recursos[id]||[]).map(r=>r.recurso));}
function refLabel(a){if(a.tipo==='ADSCRIPCION')return a.atiende_tambien||a.secundario||a.rol==='ATEN_TAMBE'?'Funcional · Atén també':'Funcional 2026';if(a.tipo==='CONCURSO_TRASLADOS')return'Estructural 25/2026';if(a.tipo==='ADC')return'ADC';if(a.tipo==='RPT')return'RPT';if(a.tipo==='DESTINO_OPOSICION')return'Oposición';return a.tipo||'Histórico';}
function rows(){
 const f=filt();let aa=data.apps;
 if(mode()==='functional')aa=aa.filter(a=>a.tipo==='ADSCRIPCION'&&a.anio===2026);
 else if(mode()==='structural')aa=aa.filter(a=>a.tipo==='CONCURSO_TRASLADOS'&&a.anio===2026);
 else aa=aa.filter(a=>a.centro&&a.puesto);
 const map=new Map();
 aa.forEach(a=>{
   if(!a.puesto)return;
   const c=(a.centro&&data.centros[a.centro])||{id:a.centro||'',provincia:a.provincia||'—',localidad:a.localidad||'—',nombre:a.centro_nombre||'Centro pendiente de vincular',tipo:a.tipo_centro||'Centro'};
   const recursos=resourcesFor(a.centro);
   if(f.provincia&&c.provincia!==f.provincia)return;if(f.localidad&&c.localidad!==f.localidad)return;if(f.tipo&&c.tipo!==f.tipo)return;if(f.fuente&&a.tipo!==f.fuente)return;if(f.anio&&(a.anio||0)<f.anio)return;
   if(f.recurso){if(f.recurso==='SIN_CONFIRMAR'&&recursos.length)return;if(f.recurso!=='SIN_CONFIRMAR'&&!recursos.includes(f.recurso))return;}
   const sec=!!a.atiende_tambien||!!a.secundario||a.rol==='ATEN_TAMBE';
   if(quick==='CEE'&&!recursos.includes('CEE'))return;if(quick==='UECO'&&!recursos.includes('UECO'))return;if(quick==='50'&&+a.jornada!==50)return;if(quick==='secondary'&&!sec)return;
   const key=[c.provincia,c.localidad,c.nombre,a.puesto,sec?'S':'P',a.tipo,a.anio||0].join('|');
   if(!map.has(key))map.set(key,{provincia:c.provincia||'—',localidad:c.localidad||'—',centro:c.nombre||'—',centroId:a.centro||'',puesto:+a.puesto,secundario:sec,jornada:a.jornada||null,recursos,ref:refLabel(a),anio:a.anio||null});
 });
 return [...map.values()].sort((a,b)=>a.provincia.localeCompare(b.provincia,'es')||a.localidad.localeCompare(b.localidad,'es')||a.centro.localeCompare(b.centro,'es')||a.puesto-b.puesto);
}
function drawGroups(){
 const tb=q('#tabla-jerarquia tbody');if(!tb)return;let pp=null,pl=null,pc=null;
 [...tb.rows].forEach(tr=>{const cells=tr.cells;if(cells.length<8)return;tr.classList.remove('new-province','new-locality','new-centre');[0,1,2].forEach(i=>cells[i].classList.remove('hierarchy-repeat'));const p=cells[0].textContent.trim(),l=cells[1].textContent.trim(),c=cells[2].querySelector('.centre-name')?.textContent.trim()||cells[2].textContent.trim();
   if(p===pp)cells[0].classList.add('hierarchy-repeat');else{tr.classList.add('new-province');pp=p;pl=null;pc=null;}
   if(l===pl&&p===pp)cells[1].classList.add('hierarchy-repeat');else{tr.classList.add('new-locality');pl=l;pc=null;}
   if(c===pc&&l===pl&&p===pp)cells[2].classList.add('hierarchy-repeat');else{tr.classList.add('new-centre');pc=c;}
 });
}
function badge(text,cls=''){return`<span class="hierarchy-badge ${cls}">${esc(text)}</span>`;}
function build(){
 const tbody=q('#tabla-jerarquia tbody');if(!tbody)return;const rr=rows();if(dt){dt.destroy();dt=null;}tbody.innerHTML='';
 rr.forEach(r=>{const tr=document.createElement('tr');const recursoHtml=r.recursos.length?r.recursos.map(x=>badge(x,`is-${x.toLowerCase()}`)).join(' '):'<span class="muted">—</span>';const refClass=r.ref.startsWith('Funcional')?'is-functional':r.ref.startsWith('Estructural')?'is-structural':'is-history';tr.innerHTML=`<td>${esc(r.provincia)}</td><td>${esc(r.localidad)}</td><td><button class="centre-name centre-filter" data-centro="${esc(r.centro)}">${esc(r.centro)}</button>${r.secundario?` ${badge('Atén també','is-secondary')}`:''}</td><td data-order="${r.puesto}"><button class="puesto-link history-open" data-puesto="${r.puesto}">${r.puesto}</button></td><td>${recursoHtml}</td><td>${badge(r.ref,refClass)}</td><td>${r.jornada?`${esc(r.jornada)}%`:'—'}</td><td><div class="row-actions"><button class="action-btn centre-filter" data-centro="${esc(r.centro)}">Centro</button><button class="action-btn action-primary history-open" data-puesto="${r.puesto}">Historial</button></div></td>`;tbody.appendChild(tr)});
 if(typeof DataTable!=='undefined')dt=new DataTable('#tabla-jerarquia',{pageLength:50,order:[[0,'asc'],[1,'asc'],[2,'asc'],[3,'asc']],autoWidth:false,language:{search:'Buscar:',lengthMenu:'Mostrar _MENU_',info:'_START_–_END_ de _TOTAL_',infoEmpty:'Sin resultados',zeroRecords:'No hay coincidencias',emptyTable:'No hay datos',paginate:{next:'›',previous:'‹'}},drawCallback:drawGroups,columnDefs:[{targets:7,orderable:false,searchable:false}]});else drawGroups();
 q('#hierarchy-count').textContent=`${rr.length} relaciones`;
}
function filterCentre(name){if(!dt)return;dt.search(name).draw();q('#hierarchy-reset-nav').hidden=false;}
function clearNavigation(){if(!dt)return;dt.search('').columns().search('').draw();q('#hierarchy-reset-nav').hidden=true;}
function openHistory(puesto){
 const apps=data.apps.filter(a=>+a.puesto===+puesto).sort((a,b)=>(b.anio||0)-(a.anio||0));const dialog=q('#history-dialog');if(!dialog)return;
 q('#history-title').textContent=`Puesto ${puesto}`;
 q('#history-content').innerHTML=apps.length?apps.map(a=>{const c=(a.centro&&data.centros[a.centro])||{nombre:a.centro_nombre||'Centro pendiente',localidad:a.localidad||'—',provincia:a.provincia||'—'};const sec=!!a.atiende_tambien||!!a.secundario||a.rol==='ATEN_TAMBE';return`<article class="history-item"><div class="history-top"><h3>${a.anio||'—'} · ${esc(a.referencia||a.tipo||'Evidencia')}</h3>${badge(refLabel(a),a.tipo==='ADSCRIPCION'?'is-functional':'is-history')}</div><p><strong>${esc(c.nombre)}</strong> · ${esc(c.localidad)}, ${esc(c.provincia)}</p>${a.jornada?`<p>Jornada: <strong>${esc(a.jornada)}%</strong></p>`:''}${sec?`<p>${badge('Atén també','is-secondary')}</p>`:''}${a.nota?`<p class="muted">${esc(a.nota)}</p>`:''}</article>`;}).join(''):'<p class="muted">Sin histórico disponible.</p>';
 if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
}
async function boot(){
 ensureMarkup();
 try{
   const [centros,apariciones,adscripciones,recursos]=await Promise.all([getJSON('data/centros.json'),getJSON('data/apariciones.json'),getJSON('data/adscripciones.json'),getJSON('data/recursos.json')]);
   data.centros=Object.fromEntries(centros.map(c=>[c.id,c]));
   data.apps=[...apariciones,...adscripciones];
   data.recursos={};recursos.forEach(r=>(data.recursos[r.centro]??=[]).push(r));
   data.apps.forEach(a=>{if(a.centro&&!data.centros[a.centro]&&a.centro_nombre)data.centros[a.centro]={id:a.centro,nombre:a.centro_nombre,provincia:a.provincia||'—',localidad:a.localidad||'—',tipo:a.tipo_centro||'Centro'};});
   q('#hierarchy-mode')?.addEventListener('change',build);
   ['#filter-provincia','#filter-localidad','#filter-tipo-centro','#filter-recurso','#filter-fuente','#filter-anio'].forEach(s=>q(s)?.addEventListener('change',build));
   q('#clear-filters')?.addEventListener('click',()=>setTimeout(()=>{quick='all';document.querySelectorAll('.hierarchy-chip').forEach(b=>b.classList.toggle('is-active',b.dataset.quick==='all'));build();},0));
   q('#view-destinos')?.addEventListener('click',e=>{const chip=e.target.closest('.hierarchy-chip');if(chip){quick=chip.dataset.quick;document.querySelectorAll('.hierarchy-chip').forEach(b=>b.classList.toggle('is-active',b===chip));build();return;}const centre=e.target.closest('.centre-filter');if(centre){filterCentre(centre.dataset.centro);return;}const hist=e.target.closest('.history-open');if(hist){openHistory(hist.dataset.puesto);return;}});
   q('#hierarchy-reset-nav')?.addEventListener('click',clearNavigation);
   q('#history-dialog')?.addEventListener('click',e=>{if(e.target.closest('[data-close="history-dialog"]'))q('#history-dialog').close();});
   build();
 }catch(e){console.error(e);const view=q('#view-destinos');if(view)view.insertAdjacentHTML('beforeend',`<p class="app-status">Error cargando destinos: ${esc(e.message)}</p>`);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();