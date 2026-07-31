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
      const functional = fy ? uniqNums(c.apps.filter(a=>a.tipo==='ADSCRIPCION' && a.anio===fy)) : [];
      const historic = uniqNums(c.apps);
      summary.innerHTML = `
        <div><span>Puestos estructurales 25/2026</span><strong>${structural.length||'—'}</strong></div>
        <div><span>Adscripción funcional${fy?` ${fy}`:''}</span><strong>${functional.length||'—'}</strong></div>
        <div><span>Puestos distintos observados</span><strong>${historic.length||'—'}</strong></div>
        <div><span>ADC documentados</span><strong>${c.apps.filter(a=>a.tipo==='ADC').length}</strong></div>`;
      const note = document.createElement('p');
      note.className='muted';
      note.innerHTML='<strong>Cómo leer estas cifras:</strong> “estructurales” procede del concurso 25/2026; “adscripción funcional” es la última fotografía funcional disponible en la base; “observados” acumula números distintos de todas las fuentes y no equivale a plantilla actual.';
      summary.insertAdjacentElement('afterend',note);
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
