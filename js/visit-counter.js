(()=>{
  const COUNTER_URL='https://api.counterapi.dev/v1/cuxaro-educadores-especiales/visitas';
  const SESSION_KEY='educadores-especiales-visita-contada';

  const counterElement=()=>document.querySelector('#visit-count');
  const format=value=>new Intl.NumberFormat('es-ES').format(Number(value)||0);
  const extractValue=data=>data?.value ?? data?.count ?? data?.data?.value ?? data?.data?.count;

  async function request(url){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),6000);
    try{
      const response=await fetch(url,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal});
      if(!response.ok) throw new Error(`CounterAPI ${response.status}`);
      return response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  async function updateCounter(){
    const element=counterElement();
    if(!element) return;
    element.textContent='…';

    let alreadyCounted=false;
    try{alreadyCounted=sessionStorage.getItem(SESSION_KEY)==='1';}catch(_){/* almacenamiento no disponible */}

    try{
      const data=await request(`${COUNTER_URL}${alreadyCounted?'':'/up'}`);
      const value=extractValue(data);
      if(value===undefined||value===null) throw new Error('Respuesta del contador no reconocida');
      element.textContent=format(value);
      element.title='Visitas registradas desde agosto de 2026';
      if(!alreadyCounted){try{sessionStorage.setItem(SESSION_KEY,'1');}catch(_){/* almacenamiento no disponible */}}
    }catch(error){
      console.warn('No se pudo cargar el contador de visitas',error);
      element.textContent='—';
      element.title='Contador temporalmente no disponible';
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',updateCounter,{once:true});
  else updateCounter();
})();
