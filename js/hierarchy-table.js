(()=>{
const q=s=>document.querySelector(s);
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
let dt=null;
function wait(){if(typeof state==='undefined'||!state.m)return setTimeout(wait,80);init();}
function mode(){return q('#hierarchy-mode')?.value||'functional';}
function rows(){
 const apps=state.apariciones||[], cm=state.m.cm||{}; let aa=[];
 if(mode()==='functional') aa=apps.filter(a=>a.tipo==='ADSCRIPCION'&&a.anio===2026);
 else if(mode()==='structural') aa=apps.filter(a=>a.tipo==='CONCURSO_TRASLADOS'&&a.anio===2026);
 else aa=apps.filter(a=>a.centro&&a.puesto);
 const map=new Map();
 aa.forEach(a=>{
   if(!a.centro||!a.puesto)return;
   const c=cm[a.centro]||{provincia:a.provincia||'—',localidad:a.localidad||'—',nombre:a.centro_nombre||'Centro pendiente de vincular'};
   const key=[c.provincia,c.localidad,c.nombre,a.puesto].join('|');
   if(!map.has(key))map.set(key,{provincia:c.provincia||'—',localidad:c.localidad||'—',centro:c.nombre||'—',centroId:a.centro,puesto:+a.puesto,secundario:!!a.atiende_tambien||!!a.secundario||a.rol==='ATEN_TAMBE',jornada:a.jornada||null});
 });
 return [...map.values()].sort((a,b)=>a.provincia.localeCompare(b.provincia,'es')||a.localidad.localeCompare(b.localidad,'es')||a.centro.localeCompare(b.centro,'es')||a.puesto-b.puesto);
}
function build(){
 const tbody=q('#tabla-jerarquia tbody'); if(!tbody)return; const rr=rows();
 if(dt){dt.destroy();dt=null;} tbody.innerHTML='';
 rr.forEach(r=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${esc(r.provincia)}</td><td>${esc(r.localidad)}</td><td><button class="text-link centre-btn" data-centro="${esc(r.centroId)}">${esc(r.centro)}</button>${r.secundario?' <span class="tag">Atén també</span>':''}</td><td data-order="${r.puesto}"><button class="text-link history-btn" data-puesto="${r.puesto}"><strong>${r.puesto}</strong></button>${r.jornada&&r.jornada!==100?` <small>${r.jornada}%</small>`:''}</td>`;tbody.appendChild(tr)});
 if(typeof DataTable!=='undefined'){
  dt=new DataTable('#tabla-jerarquia',{pageLength:50,order:[[0,'asc'],[1,'asc'],[2,'asc'],[3,'asc']],language:typeof lang==='function'?lang():{search:'Buscar:',lengthMenu:'Mostrar _MENU_',info:'_START_–_END_ de _TOTAL_',zeroRecords:'No hay coincidencias',paginate:{next:'›',previous:'‹'}},drawCallback:function(){
    const trs=[...q('#tabla-jerarquia tbody').rows];let pp='',pl='',pc='';
    trs.forEach(tr=>{const cells=tr.cells;if(cells.length<4)return;const p=cells[0].textContent.trim(),l=cells[1].textContent.trim(),c=cells[2].querySelector('button')?.textContent.trim()||cells[2].textContent.trim();
      if(p===pp)cells[0].classList.add('hierarchy-repeat');else{pp=p;pl='';pc=''}
      if(p===pp&&l===pl)cells[1].classList.add('hierarchy-repeat');else{pl=l;pc=''}
      if(p===pp&&l===pl&&c===pc)cells[2].classList.add('hierarchy-repeat');else pc=c;
    });
  }});
 }
 q('#hierarchy-count').textContent=`${rr.length} relaciones`;
}
function init(){q('#hierarchy-mode')?.addEventListener('change',build);['#filter-provincia','#filter-localidad'].forEach(s=>q(s)?.addEventListener('change',()=>setTimeout(build,0)));build();}
window.addEventListener('DOMContentLoaded',wait);
})();