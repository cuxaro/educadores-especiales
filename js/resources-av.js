(()=>{
const UECO_URL='https://documentos.anpecomunidadvalenciana.es/docs/centros/2025-26/CENTRES_AULES_UECO_2025-26.pdf';
const CEE_URL='https://documentos.anpecomunidadvalenciana.es/docs/centros/2025-26/CENTRES_EDUCACIO_ESPECIAL_2025-26.pdf';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\b(CEIP|IES|CEE|CR|PUB|PUBLIC|PUBLICA|SECCIO|EDUCACIO|SECUNDARIA|DE|DEL|LA|EL|L)\b/g,' ').replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const normLoc=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const compatible=(r,c)=>{if(r.provincia!==c.provincia)return false;const a=normLoc(r.localidad),b=normLoc(c.localidad);if(!(a.includes(b)||b.includes(a)))return false;const rn=norm(r.nombre),cn=norm(c.nombre);return rn===cn||rn.includes(cn)||cn.includes(rn)};
const mkUeco=([codigo,nombre,localidad],provincia)=>({centro:`gva-${codigo}`,nombre,provincia,localidad,tipo:/^(IES|Secció)/.test(nombre)?'IES':'CEIP',codigo,recurso:'UECO',estado:'confirmada',curso:'2025-2026',fuente:'Listado centros con aula UECO 2025-2026',url:UECO_URL});
const mkCee=([codigo,nombre,provincia,localidad])=>({centro:`gva-${codigo}`,nombre,provincia,localidad,tipo:'CEE',codigo,recurso:'CEE',estado:'confirmada',curso:'2025-2026',fuente:'Listado centros de Educación Especial 2025-2026',url:CEE_URL});
window.loadAdditionalResourcesAV=async(baseFetch,competitionCentres=[])=>{
 const [ra,rv,rc]=await Promise.all([
  baseFetch('data/recursos_ueco_2025_26_alicante.json',{cache:'no-store'}),
  baseFetch('data/recursos_ueco_2025_26_valencia.json',{cache:'no-store'}),
  baseFetch('data/recursos_cee_2025_26_alicante_valencia.json',{cache:'no-store'})
 ]);
 const a=ra.ok?await ra.json():[];
 const v=(rv.ok?await rv.json():[]).map(x=>mkUeco(x,'Valencia'));
 const cee=(rc.ok?await rc.json():[]).map(mkCee);
 return a.concat(v,cee).map(r=>{const c=competitionCentres.find(c=>compatible(r,c));return c?{...r,centro:c.id,nombre_fuente:r.nombre}:r});
};
})();