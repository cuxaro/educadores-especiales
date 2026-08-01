(()=>{
  const escRegex=value=>String(value||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

  function tableApi(){
    try{
      if(typeof DataTable==='undefined') return null;
      return new DataTable.Api('#tabla-jerarquia');
    }catch(error){
      console.error('No se pudo obtener la tabla de destinos',error);
      return null;
    }
  }

  function showCentre(name){
    const api=tableApi();
    if(!api||!name) return;

    api.search('');
    api.columns().search('');
    // La columna Centro principal contiene también, de forma oculta, los centros históricos.
    api.column(2).search(escRegex(name),true,false).draw();

    const banner=document.querySelector('#centre-nav-banner');
    const label=document.querySelector('#centre-nav-name');
    const reset=document.querySelector('#hierarchy-reset-nav');
    if(label) label.textContent=name;
    if(banner) banner.hidden=false;
    if(reset) reset.hidden=false;
    document.querySelector('.hierarchy-table-wrap')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function clearCentre(){
    const api=tableApi();
    if(!api) return;
    api.search('');
    api.columns().search('');
    api.draw();
    const banner=document.querySelector('#centre-nav-banner');
    const reset=document.querySelector('#hierarchy-reset-nav');
    if(banner) banner.hidden=true;
    if(reset) reset.hidden=true;
  }

  document.addEventListener('click',event=>{
    const centre=event.target.closest('.centre-filter');
    if(centre){
      event.preventDefault();
      event.stopImmediatePropagation();
      showCentre(centre.dataset.centro||centre.textContent.trim());
      return;
    }

    if(event.target.closest('#centre-nav-clear, #hierarchy-reset-nav')){
      event.preventDefault();
      event.stopImmediatePropagation();
      clearCentre();
    }
  },true);
})();