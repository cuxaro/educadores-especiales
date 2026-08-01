(()=>{
  const q = selector => document.querySelector(selector);
  const esc = (value='') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const uniq = values => [...new Set(values.filter(value => value !== null && value !== undefined && value !== ''))];
  const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const centreBase = value => norm(value).replace(/\b(CEE|CR|PUB|PUBLIC|PUBLICA|PUBLICO)\b/g,' ').replace(/\s+/g,' ').trim();
  const localityKey = value => norm(value).split(' ').filter(Boolean).sort().join(' ');
  const sourceLabel = app => app.tipo === 'ADSCRIPCION' ? 'Funcional 2026' : app.tipo === 'CONCURSO_TRASLADOS' ? 'Estructural 25/2026' : app.tipo === 'DESTINO_OPOSICION' ? 'Oposición' : app.tipo || 'Histórico';
  const isSecondary = app => Boolean(app.atiende_tambien || app.secundario || app.rol === 'ATEN_TAMBE' || app.rol_funcional === 'atiende_tambien');
  let cataloguePromise = null;

  async function getJSON(url){
    const response = await fetch(url,{cache:'no-store'});
    if(!response.ok) throw new Error(`${url}: ${response.status}`);
    return response.json();
  }

  function loadCatalogue(){
    if(!cataloguePromise){
      cataloguePromise = Promise.all([
        getJSON('data/centros.json'),
        getJSON('data/apariciones.json'),
        getJSON('data/adscripciones.json'),
        getJSON('data/recursos.json')
      ]).then(([centres,appearances,assignments,resources]) => ({
        centres,
        apps:[...appearances,...assignments],
        resources,
        centreMap:new Map(centres.map(centre => [centre.id,centre]))
      }));
    }
    return cataloguePromise;
  }

  function sameLocality(a,b){
    const na = norm(a), nb = norm(b);
    return na === nb || na.split('/').some(part => norm(part) === nb) || nb.split('/').some(part => norm(part) === na) || localityKey(a) === localityKey(b);
  }

  function matchingCentres(catalogue,{name,province,locality}){
    const exact = catalogue.centres.filter(centre =>
      (!province || norm(centre.provincia) === norm(province)) &&
      (!locality || sameLocality(centre.localidad,locality)) &&
      norm(centre.nombre) === norm(name)
    );
    const base = centreBase(name);
    const aliases = catalogue.centres.filter(centre =>
      (!province || norm(centre.provincia) === norm(province)) &&
      (!locality || sameLocality(centre.localidad,locality)) &&
      centreBase(centre.nombre) === base
    );
    return uniq([...exact,...aliases].map(centre => centre.id)).map(id => catalogue.centreMap.get(id)).filter(Boolean);
  }

  function postsFor(apps,predicate=()=>true){
    return uniq(apps.filter(predicate).map(app => Number(app.puesto)).filter(Number.isFinite)).sort((a,b) => a-b);
  }

  function numberButtons(numbers){
    if(!numbers.length) return '<span class="muted">—</span>';
    return numbers.map(number => `<button class="number-card centre-post-history" data-puesto="${number}"><span>${number}</span><small>Ver historial</small></button>`).join('');
  }

  function sourceSection(title,numbers,open=false){
    return `<details class="centre-section"${open?' open':''}><summary><strong>${esc(title)}</strong> · ${numbers.length} puesto${numbers.length===1?'':'s'}</summary><div class="number-grid">${numberButtons(numbers)}</div></details>`;
  }

  async function openCentre(button){
    const row = button.closest('tr');
    const request = {
      name:button.dataset.centro || button.textContent.trim(),
      province:row?.cells?.[0]?.textContent.trim() || '',
      locality:row?.cells?.[1]?.textContent.trim() || ''
    };
    const dialog = q('#centre-dialog');
    if(!dialog) return;
    q('#centre-title').textContent = request.name;
    q('#centre-subtitle').textContent = 'Cargando ficha del centro…';
    q('#centre-content').innerHTML = '<p class="muted">Cargando evidencias y puestos…</p>';
    dialog.showModal ? dialog.showModal() : dialog.setAttribute('open','');

    try{
      const catalogue = await loadCatalogue();
      const centres = matchingCentres(catalogue,request);
      const ids = new Set(centres.map(centre => centre.id));
      const apps = catalogue.apps.filter(app => ids.has(app.centro));
      const resources = catalogue.resources.filter(resource => ids.has(resource.centro));
      const representative = centres.find(centre => norm(centre.nombre) === norm(request.name)) || centres[0];
      if(!representative){
        q('#centre-subtitle').textContent = `${request.locality || 'Localidad no indicada'} · ${request.province || 'Provincia no indicada'}`;
        q('#centre-content').innerHTML = '<p class="muted">No se ha podido vincular este nombre con una ficha de centro.</p>';
        return;
      }

      const allPosts = postsFor(apps);
      const functional = postsFor(apps,app => app.tipo === 'ADSCRIPCION' && app.anio === 2026 && !isSecondary(app));
      const secondary = postsFor(apps,app => app.tipo === 'ADSCRIPCION' && app.anio === 2026 && isSecondary(app));
      const structural = postsFor(apps,app => app.tipo === 'CONCURSO_TRASLADOS' && app.anio === 2026);
      const opposition = postsFor(apps,app => app.tipo === 'DESTINO_OPOSICION');
      const adc = postsFor(apps,app => app.tipo === 'ADC');
      const rpt = postsFor(apps,app => app.tipo === 'RPT');
      const resourceNames = uniq(resources.map(resource => resource.recurso));
      const aliases = uniq(centres.map(centre => centre.nombre));
      const codes = uniq(centres.map(centre => centre.codigo).filter(Boolean));

      q('#centre-title').textContent = representative.nombre || request.name;
      q('#centre-subtitle').textContent = `${representative.localidad || request.locality} · ${representative.provincia || request.province} · ${representative.tipo || 'Centro'}${codes.length ? ` · código ${codes.join(' / ')}` : ''}`;
      q('#centre-content').innerHTML = `
        <div class="centre-summary">
          <div><span>Puestos distintos</span><strong>${allPosts.length}</strong></div>
          <div><span>Funcionales 2026</span><strong>${functional.length}</strong></div>
          <div><span>Estructurales 25/2026</span><strong>${structural.length}</strong></div>
          <div><span>Evidencias</span><strong>${apps.length}</strong></div>
        </div>
        ${resourceNames.length ? `<section class="centre-section resource-card"><p class="eyebrow">Recursos confirmados</p><h3>${resourceNames.map(name => `<span class="tag tag-${esc(name.toLowerCase())}">${esc(name)}</span>`).join(' ')}</h3></section>` : ''}
        ${aliases.length > 1 ? `<section class="centre-section"><p class="eyebrow">Nombres vinculados</p><p>${aliases.map(esc).join(' · ')}</p><p class="muted">Se agrupan porque coinciden provincia, localidad e identidad normalizada del centro.</p></section>` : ''}
        ${sourceSection('Adscripción funcional principal 2026',functional,true)}
        ${secondary.length ? sourceSection('Atén també 2026',secondary) : ''}
        ${sourceSection('Centro estructural 25/2026',structural,true)}
        ${sourceSection('Destino de oposición',opposition)}
        ${sourceSection('ADC',adc)}
        ${sourceSection('RPT',rpt)}
        ${sourceSection('Todo el histórico',allPosts)}
        <p class="muted"><strong>Interpretación:</strong> la adscripción funcional indica dónde presta servicio el puesto; la referencia estructural indica su adscripción administrativa. El histórico conserva ambas.</p>`;
    }catch(error){
      console.error('Error abriendo la ficha del centro',error);
      q('#centre-content').innerHTML = `<p class="app-status">No se pudo cargar la ficha del centro: ${esc(error.message)}</p>`;
    }
  }

  async function openPostHistory(number){
    const catalogue = await loadCatalogue();
    const apps = catalogue.apps.filter(app => Number(app.puesto) === Number(number)).sort((a,b) => (b.anio||0)-(a.anio||0));
    const dialog = q('#history-dialog');
    if(!dialog) return;
    q('#centre-dialog')?.close?.();
    q('#history-title').textContent = `Puesto ${number}`;
    q('#history-content').innerHTML = apps.length ? apps.map(app => {
      const centre = catalogue.centreMap.get(app.centro) || {nombre:app.centro_nombre || 'Centro pendiente de vincular',localidad:app.localidad || '—',provincia:app.provincia || '—'};
      return `<article class="history-item"><div class="history-top"><h3>${app.anio || '—'} · ${esc(app.referencia || app.tipo || 'Evidencia')}</h3><span class="tag">${esc(sourceLabel(app))}</span></div><p><strong>${esc(centre.nombre)}</strong> · ${esc(centre.localidad)}, ${esc(centre.provincia)}</p>${app.jornada?`<p>Jornada: <strong>${esc(app.jornada)}%</strong></p>`:''}${isSecondary(app)?'<p><span class="tag">Atén també</span></p>':''}${app.nota?`<p class="muted">${esc(app.nota)}</p>`:''}</article>`;
    }).join('') : '<p class="muted">Sin histórico disponible.</p>';
    dialog.showModal ? dialog.showModal() : dialog.setAttribute('open','');
  }

  document.addEventListener('click',event => {
    const centre = event.target.closest('.centre-filter');
    if(centre){
      event.preventDefault();
      event.stopImmediatePropagation();
      openCentre(centre);
      return;
    }
    const post = event.target.closest('.centre-post-history');
    if(post){
      event.preventDefault();
      openPostHistory(post.dataset.puesto);
      return;
    }
    if(event.target.closest('[data-close="centre-dialog"]')){
      q('#centre-dialog')?.close?.();
    }
  },true);
})();
