const state={centros:[],puestos:[],apariciones:[],dtPuestos:null,dtCentros:null};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],uniq=a=>[...new Set(a.filter(Boolean))],byId=a=>Object.fromEntries(a.map(x=>[x.id,x]));
const esc=(s='')=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
const latest=a=>[...a].sort((x,y)=>(y.anio||0)-(x.anio||0))[0];
const tags=a=>uniq(a).map(t=>`<span class="tag tag-${String(t).toLowerCase()}">${esc(t)}</span>`).join(' ');

async function load(){
  const names=['centros','puestos','apariciones'];
  const responses=await Promise.all(names.map(n=>fetch(`data/${n}.json`,{cache:'no-store'})));
  responses.forEach((r,i)=>{if(!r.ok)throw new Error(`No se pudo cargar ${names[i]}.json (${r.status})`)});
  [state.centros,state.puestos,state.apariciones]=await Promise.all(responses.map(r=>r.json()));
}

function models(){
  const cm=byId(state.centros),bp=new Map(),bc=new Map();
  state.apariciones.forEach(a=>{
    bp.set(a.puesto,[...(bp.get(a.puesto)||[]),a]);
    if(a.centro)bc.set(a.centro,[...(bc.get(a.centro)||[]),a]);
  });
  const cf=a=>a?.centro&&cm[a.centro]?cm[a.centro]:{id:null,nombre:'Centro pendiente de vincular',provincia:a?.provincia||'—',localidad:a?.localidad||'—',tipo:'Pendiente'};
  return{
    cm,cf,
    puestos:state.puestos.map(p=>{const apps=bp.get(p.numero)||[],last=latest(apps);return{...p,apps,last,centro:cf(last),fuentes:uniq(apps.map(a=>a.tipo))}}),
    centros:state.centros.map(c=>{const apps=bc.get(c.id)||[];return{...c,apps,puestos:uniq(apps.map(a=>a.puesto)).sort((a,b)=>a-b),fuentes:uniq(apps.map(a=>a.tipo)),last:latest(apps)}}).filter(c=>c.apps.length)
  };
}

function fill(id,vals){vals.forEach(v=>$(id)?.insertAdjacentHTML('beforeend',`<option value="${esc(v)}">${esc(v)}</option>`))}
function selected(){return{provincia:$('#filter-provincia')?.value||'',localidad:$('#filter-localidad')?.value||'',tipo:$('#filter-tipo-centro')?.value||'',fuente:$('#filter-fuente')?.value||'',anio:+($('#filter-anio')?.value||0)||null}}
function pass(a,f,m){const c=m.cf(a);return(!f.provincia||c.provincia===f.provincia)&&(!f.localidad||c.localidad===f.localidad)&&(!f.tipo||c.tipo===f.tipo)&&(!f.fuente||a.tipo===f.fuente)&&(!f.anio||a.anio>=f.anio)}
function lang(){return{search:'Buscar:',lengthMenu:'Mostrar _MENU_',info:'_START_–_END_ de _TOTAL_',infoEmpty:'Sin resultados',zeroRecords:'No hay coincidencias',emptyTable:'No hay datos',paginate:{next:'›',previous:'‹'}}}

function init(m){
  fill('#filter-provincia',uniq(state.centros.map(c=>c.provincia).concat(state.apariciones.map(a=>a.provincia))).sort());
  fill('#filter-localidad',uniq(state.centros.map(c=>c.localidad).concat(state.apariciones.map(a=>a.localidad))).sort());
  fill('#filter-tipo-centro',uniq(state.centros.map(c=>c.tipo)).sort());
  fill('#filter-anio',uniq(state.apariciones.map(a=>a.anio)).sort((a,b)=>b-a));

  const tp=$('#tabla-puestos tbody');
  m.puestos.forEach(p=>{
    const tr=document.createElement('tr'),c=p.centro,l=p.last;
    tr.dataset.puesto=p.numero;
    const centreCell=c.id?`<button class="text-link centre-btn" data-centro="${esc(c.id)}">${esc(c.nombre)}</button>`:esc(c.nombre);
    tr.innerHTML=`<td data-order="${p.numero}"><span class="number-chip">${p.numero}</span></td><td>${esc(c.provincia)}</td><td>${centreCell}</td><td>${esc(c.localidad)}</td><td>${tags(p.fuentes)}</td><td data-order="${l?.anio||0}">${l?`${l.anio} · ${esc(l.referencia)}`:'—'}</td><td>${p.apps.length}</td><td><button class="button button-link history-btn" data-puesto="${p.numero}">Historial</button></td>`;
    tp.appendChild(tr);
  });

  const tc=$('#tabla-centros tbody');
  m.centros.forEach(c=>{
    const tr=document.createElement('tr');tr.dataset.centro=c.id;
    tr.innerHTML=`<td>${esc(c.provincia)}</td><td>${esc(c.localidad)}</td><td><button class="text-link centre-btn" data-centro="${esc(c.id)}"><strong>${esc(c.nombre)}</strong></button></td><td>${esc(c.tipo)}</td><td>${c.puestos.join(', ')}</td><td data-order="${c.last?.anio||0}">${c.last?`${c.last.anio} · ${esc(c.last.referencia)}`:'—'}</td><td>${tags(c.fuentes)}</td>`;
    tc.appendChild(tr);
  });

  state.dtPuestos=new DataTable('#tabla-puestos',{pageLength:25,order:[[0,'asc']],language:lang(),columnDefs:[{targets:7,orderable:false,searchable:false}]});
  state.dtCentros=new DataTable('#tabla-centros',{pageLength:25,order:[[0,'asc'],[1,'asc'],[2,'asc']],language:lang()});

  if(DataTable.ext?.search){
    DataTable.ext.search.push((settings,data,i)=>{
      const f=selected(),tr=settings.aoData?.[i]?.nTr;
      if(!tr)return true;
      if(settings.nTable.id==='tabla-puestos'){
        const p=m.puestos.find(x=>x.numero===+tr.dataset.puesto);
        return p?p.apps.some(a=>pass(a,f,m)):true;
      }
      if(settings.nTable.id==='tabla-centros'){
        const c=m.centros.find(x=>x.id===tr.dataset.centro);
        return c?c.apps.some(a=>pass(a,f,m)):true;
      }
      return true;
    });
  }

  ['#filter-provincia','#filter-localidad','#filter-tipo-centro','#filter-fuente','#filter-anio'].forEach(s=>$(s)?.addEventListener('change',()=>refresh(m)));
  $('#clear-filters').onclick=()=>{['#filter-provincia','#filter-localidad','#filter-tipo-centro','#filter-fuente','#filter-anio'].forEach(s=>{if($(s))$(s).value=''});refresh(m)};
  refresh(m);
}

function filtered(m){const f=selected();return state.apariciones.filter(a=>pass(a,f,m))}
function refresh(m){
  try{state.dtPuestos?.draw(false)}catch(e){console.warn('No se pudo refrescar la tabla de puestos',e)}
  try{state.dtCentros?.draw(false)}catch(e){console.warn('No se pudo refrescar la tabla de centros',e)}
  const apps=filtered(m);
  $('#stat-puestos').textContent=uniq(apps.map(a=>a.puesto)).length;
  $('#stat-centros').textContent=uniq(apps.map(a=>a.centro)).length;
  $('#stat-localidades').textContent=uniq(apps.map(a=>`${m.cf(a).provincia}|${m.cf(a).localidad}`)).length;
  $('#stat-apariciones').textContent=apps.length;
  renderLoc(m,apps);
}

function renderLoc(m,apps){
  const root=$('#localidades-list'),tree={};root.innerHTML='';
  apps.filter(a=>a.centro&&m.cm[a.centro]).forEach(a=>{
    const c=m.cm[a.centro];
    tree[c.provincia]??={};tree[c.provincia][c.localidad]??={};tree[c.provincia][c.localidad][c.id]??={c,apps:[]};tree[c.provincia][c.localidad][c.id].apps.push(a);
  });
  Object.keys(tree).sort().forEach(p=>{
    const b=document.createElement('div');b.className='province-block';b.innerHTML=`<h3>${esc(p)}</h3>`;
    Object.keys(tree[p]).sort().forEach(l=>{
      const cs=Object.values(tree[p][l]),d=document.createElement('details');d.className='location-card';
      const ns=uniq(cs.flatMap(x=>x.apps.map(a=>a.puesto)));
      d.innerHTML=`<summary><span class="location-name">${esc(l)}</span><span class="location-meta">${cs.length} centros · ${ns.length} puestos</span></summary><div class="centres-inside">${cs.sort((a,b)=>a.c.nombre.localeCompare(b.c.nombre)).map(x=>{const xp=uniq(x.apps.map(a=>a.puesto)).sort((a,b)=>a-b),la=latest(x.apps);return`<button class="centre-row centre-btn" data-centro="${esc(x.c.id)}"><span><strong>${esc(x.c.nombre)}</strong><small>${esc(x.c.tipo)} · última aparición ${la?.anio||'—'}</small></span><span class="centre-row-right"><span class="puestos-inline">${xp.join(' · ')}</span><span class="open-label">Ver ficha →</span></span></button>`}).join('')}</div>`;
      b.appendChild(d);
    });
    root.appendChild(b);
  });
  if(!root.children.length)root.innerHTML='<p class="muted">No hay centros que coincidan con los filtros.</p>';
}

function history(m,n){
  const p=m.puestos.find(x=>x.numero===+n);if(!p)return;
  $('#history-title').textContent=`Puesto ${p.numero}`;
  $('#history-content').innerHTML=[...p.apps].sort((a,b)=>(b.anio||0)-(a.anio||0)).map(a=>{
    const c=m.cf(a),admin=a.centro_administrativo&&m.cm[a.centro_administrativo];
    return`<article class="history-item"><div class="history-top"><h3>${a.anio} · ${esc(a.referencia)}</h3>${tags([a.tipo])}</div><p>${c.id?`<button class="text-link centre-btn" data-centro="${esc(c.id)}"><strong>${esc(c.nombre)}</strong></button>`:`<strong>${esc(c.nombre)}</strong>`} · ${esc(c.localidad)}, ${esc(c.provincia)}</p>${admin?`<p>Centro administrativo: ${esc(admin.nombre)}</p>`:''}${a.nota?`<p>${esc(a.nota)}</p>`:''}${a.url?`<p><a class="source-link" href="${esc(a.url)}" target="_blank" rel="noopener">Abrir fuente ↗</a></p>`:''}</article>`;
  }).join('');
  $('#history-dialog').showModal();
}

function centre(m,id){
  const c=m.centros.find(x=>x.id===id)||m.cm[id];if(!c)return;
  const apps=(c.apps||state.apariciones.filter(a=>a.centro===id)).slice().sort((a,b)=>(b.anio||0)-(a.anio||0));
  const puestos=uniq(apps.map(a=>a.puesto)).sort((a,b)=>a-b),fuentes=uniq(apps.map(a=>a.tipo)),last=latest(apps);
  $('#centre-title').textContent=c.nombre;
  $('#centre-subtitle').textContent=`${c.localidad} · ${c.provincia}${c.tipo?` · ${c.tipo}`:''}`;
  const puestosHtml=puestos.map(n=>`<button class="number-card history-btn" data-puesto="${n}"><span>${n}</span><small>Ver historial</small></button>`).join('');
  const timeline=apps.map(a=>`<article class="timeline-row"><div><strong>${a.anio}</strong><span>${esc(a.referencia)}</span></div><div><span class="number-chip">${a.puesto}</span> ${tags([a.tipo])}${a.nota?`<p>${esc(a.nota)}</p>`:''}</div></article>`).join('');
  $('#centre-content').innerHTML=`<div class="centre-summary"><div><span>Puestos conocidos</span><strong>${puestos.length}</strong></div><div><span>Apariciones</span><strong>${apps.length}</strong></div><div><span>Fuentes</span><strong class="summary-tags">${tags(fuentes)||'—'}</strong></div><div><span>Última aparición</span><strong>${last?last.anio:'—'}</strong></div></div><section class="centre-section"><p class="eyebrow">Números de puesto</p><div class="number-grid">${puestosHtml||'<p class="muted">Sin números vinculados.</p>'}</div></section><section class="centre-section"><p class="eyebrow">Histórico documentado</p><div class="timeline">${timeline||'<p class="muted">Sin apariciones documentadas.</p>'}</div></section>`;
  $('#centre-dialog').showModal();
}

function nav(){
  $$('.nav-tab:not(:disabled)').forEach(b=>b.onclick=()=>{
    $$('.nav-tab').forEach(x=>x.classList.remove('is-active'));b.classList.add('is-active');
    $$('.view').forEach(v=>v.classList.remove('is-active'));$(`#view-${b.dataset.view}`)?.classList.add('is-active');
    if(b.dataset.view==='centros')setTimeout(()=>state.dtCentros?.columns?.adjust?.(),0);
    if(b.dataset.view==='puestos')setTimeout(()=>state.dtPuestos?.columns?.adjust?.(),0);
  });
}

function bindActions(m){
  document.addEventListener('click',e=>{
    const h=e.target.closest('.history-btn');if(h){const openCentre=$('#centre-dialog')?.open;if(openCentre)$('#centre-dialog').close();history(m,h.dataset.puesto);return}
    const c=e.target.closest('.centre-btn');if(c){const openHistory=$('#history-dialog')?.open;if(openHistory)$('#history-dialog').close();centre(m,c.dataset.centro);return}
    const close=e.target.closest('[data-close]');if(close)document.getElementById(close.dataset.close)?.close();
  });
  $$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
}

(async()=>{
  const status=$('#app-status');
  try{
    await load();
  }catch(e){
    console.error(e);status.hidden=false;status.className='app-status is-error';status.textContent='No se pudieron cargar los datos. Prueba a recargar la página.';return;
  }
  try{
    const m=models();init(m);nav();bindActions(m);
  }catch(e){
    console.error('Error al iniciar la interfaz',e);
    status.hidden=false;status.className='app-status is-warning';status.textContent='Los datos se han cargado, pero alguna función de la interfaz no ha podido iniciarse correctamente.';
  }
})();