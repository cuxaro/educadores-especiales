(()=>{
  const uniqNums = apps => [...new Set(apps.map(a=>a.puesto).filter(Boolean))].sort((a,b)=>a-b);
  const latestFunctional = apps => {
    const years = apps.filter(a=>a.tipo==='ADSCRIPCION').map(a=>a.anio||0);
    return years.length ? Math.max(...years) : null;
  };
  const addMetrics = id => {
    try {
      const c = state?.m?.centros?.find(x=>x.id===id);
      if(!c) return;
      const summary = document.querySelector('#centre-content .centre-summary');
      if(!summary) return;
      const structural = uniqNums(c.apps.filter(a=>a.tipo==='CONCURSO_TRASLADOS'));
      const fy = latestFunctional(c.apps);
      const fapps = fy ? c.apps.filter(a=>a.tipo==='ADSCRIPCION' && a.anio===fy) : [];
      const principal = uniqNums(fapps.filter(a=>a.rol_funcional!=='atiende_tambien'));
      const secondary = uniqNums(fapps.filter(a=>a.rol_funcional==='atiende_tambien'));
      const functional = uniqNums(fapps);
      const historic = uniqNums(c.apps);
      summary.innerHTML = `
        <div><span>Puestos estructurales 25/2026</span><strong>${structural.length||'—'}</strong></div>
        <div><span>Adscripción funcional${fy?` ${fy}`:''}</span><strong>${functional.length||'—'}</strong></div>
        <div><span>Puestos distintos observados</span><strong>${historic.length||'—'}</strong></div>
        <div><span>ADC documentados</span><strong>${c.apps.filter(a=>a.tipo==='ADC').length}</strong></div>`;
      const note = document.createElement('p');
      note.className='muted';
      note.innerHTML='<strong>Cómo leer estas cifras:</strong> “estructurales” procede del concurso 25/2026; “adscripción funcional” es la última fotografía funcional disponible; “observados” acumula todas las fuentes y no equivale a plantilla actual.';
      summary.insertAdjacentElement('afterend',note);
      if(fy){
        const old=document.querySelector('#centre-content .functional-current-card'); if(old) old.remove();
        const box=document.createElement('section');box.className='centre-section resource-card functional-current-card';
        box.innerHTML=`<p class="eyebrow">Adscripción funcional · ${fy}</p><h3>${principal.length} principal${principal.length===1?'':'es'}${secondary.length?` + ${secondary.length} “Atén també”`:''}</h3><p>${principal.map(n=>`<button class="text-link history-btn" data-puesto="${n}">${n}</button>`).join(' · ')||'—'}${secondary.length?`</p><p class="muted"><strong>Atiende también:</strong> ${secondary.map(n=>`<button class="text-link history-btn" data-puesto="${n}">${n}</button>`).join(' · ')}`:''}</p><p class="muted">Fotografía informativa de 12/03/2026; la propia fuente advierte que las adscripciones pueden modificarse según las necesidades educativas.</p>`;
        note.insertAdjacentElement('afterend',box);
      }
    } catch(e) { console.warn('metrics',e); }
  };
  const patch = () => {
    if(typeof openCentre!=='function') return setTimeout(patch,50);
    const original = openCentre;
    window.openCentre = function(id){ original(id); addMetrics(id); };
    try { openCentre = window.openCentre; } catch(_) {}
  };
  patch();
})();
