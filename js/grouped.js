(()=>{
  function boot(){
    const footer=document.querySelector('footer strong');
    if(footer)footer.textContent='v1.3.1';
    const s=document.createElement('script');
    s.src='js/hierarchy-table.js?v=1.3.1';
    document.body.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();