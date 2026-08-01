(()=>{
  const q = selector => document.querySelector(selector);
  const escRegex = value => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function dataTableApi(){
    try{
      if(window.jQuery?.fn?.dataTable?.isDataTable?.('#tabla-jerarquia')){
        return window.jQuery('#tabla-jerarquia').DataTable();
      }
      if(typeof window.DataTable !== 'undefined'){
        return new window.DataTable.Api('#tabla-jerarquia');
      }
    }catch(error){
      console.warn('Navegación por centro: DataTables no disponible; se usa el modo DOM.', error);
    }
    return null;
  }

  function rowMatchesCentre(row, centreName){
    const centreCell = row.cells?.[2];
    if(!centreCell) return false;
    return centreCell.textContent.toLocaleLowerCase('es').includes(String(centreName).toLocaleLowerCase('es'));
  }

  function showBanner(centreName){
    const banner = q('#centre-nav-banner');
    const label = q('#centre-nav-name');
    const reset = q('#hierarchy-reset-nav');
    if(label) label.textContent = centreName;
    if(banner) banner.hidden = false;
    if(reset) reset.hidden = false;
  }

  function filterCentre(centreName){
    if(!centreName) return;
    const api = dataTableApi();
    if(api){
      api.search('');
      api.columns().search('');
      api.column(2).search(escRegex(centreName), true, false).draw();
    }else{
      document.querySelectorAll('#tabla-jerarquia tbody tr').forEach(row => {
        row.hidden = !rowMatchesCentre(row, centreName);
      });
    }
    showBanner(centreName);
    q('.hierarchy-table-wrap')?.scrollIntoView({behavior:'smooth', block:'start'});
  }

  function clearCentre(){
    const api = dataTableApi();
    if(api){
      api.search('');
      api.columns().search('');
      api.draw();
    }
    document.querySelectorAll('#tabla-jerarquia tbody tr').forEach(row => { row.hidden = false; });
    const banner = q('#centre-nav-banner');
    const reset = q('#hierarchy-reset-nav');
    if(banner) banner.hidden = true;
    if(reset) reset.hidden = true;
  }

  document.addEventListener('click', event => {
    const centreButton = event.target.closest('.centre-filter');
    if(centreButton){
      event.preventDefault();
      filterCentre(centreButton.dataset.centro || centreButton.textContent.trim());
      return;
    }
    if(event.target.closest('#centre-nav-clear, #hierarchy-reset-nav')){
      event.preventDefault();
      clearCentre();
    }
  });
})();
