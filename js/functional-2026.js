(()=>{
const FILES=['data/af26_alicante_1.json','data/af26_alicante_2.json','data/af26_alicante_3.json','data/af26_valencia_1.json','data/af26_valencia_2.json','data/af26_valencia_3.json','data/af26_valencia_4.json','data/af26_castellon_1.json','data/af26_castellon_2.json'];
const URL='https://ceice.gva.es/documents/169149987/356630015/20260312_AF_EE.pdf';
const n=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\b(CEIP|CEP|IES|CEE|CR|PUB|PUBLIC|PUBLICA|EI|CRA|SECCIO|DE|DEL|LA|EL|L)\b/g,' ').replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const nl=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const locOk=(a,b)=>{a=nl(a);b=nl(b);return a===b||a.includes(b)||b.includes(a)||a.replace(/\bLA\b/g,'').trim()===b.replace(/\bLA\b/g,'').trim()};
const match=(x,c)=>{if(!c||x.provincia!==c.provincia||!locOk(x.localidad,c.localidad))return false;const a=n(x.nombre),b=n(c.nombre);return a===b||a.includes(b)||b.includes(a)};
window.loadFunctional2026=async(baseFetch,candidates=[])=>{
 const rs=await Promise.all(FILES.map(f=>baseFetch(f,{cache:'no-store'})));
 const chunks=await Promise.all(rs.map(async r=>r.ok?await r.json():[]));
 const provFor=f=>f.includes('alicante')?'Alicante':f.includes('valencia')?'Valencia':'Castellón';
 const rows=[];chunks.forEach((chunk,i)=>chunk.forEach(([id,nombre,localidad,puestos])=>rows.push({id,nombre,localidad,provincia:provFor(FILES[i]),puestos})));
 const mapped=rows.map(x=>{const c=candidates.find(c=>match(x,c));return{...x,centro:c?(c.id||c.centro):x.id}});
 const apps=mapped.flatMap(x=>x.puestos.map(([puesto,jornada,rol])=>({puesto,tipo:'ADSCRIPCION',referencia:'Adscripción funcional 12/03/2026',anio:2026,centro:x.centro,centro_nombre:x.nombre,provincia:x.provincia,localidad:x.localidad,tipo_centro:/^CEE/.test(x.nombre)?'CEE':/^IES/.test(x.nombre)?'IES':/^CRA/.test(x.nombre)?'CRA':/^EI/.test(x.nombre)?'EI':'CEIP',jornada,rol_funcional:rol?'atiende_tambien':'principal',nota:rol?'El documento indica «Atén també»: el puesto atiende también este centro.':'Adscripción funcional principal informada a fecha 12 de marzo de 2026.',url:URL})));
 window.functional2026={rows:mapped,apps};return window.functional2026;
};

/* Carga tardía: normaliza el desplegable de localidades cuando app.js ya ha construido los modelos. */
if(!document.querySelector('script[data-locality-filter]')){
 const s=document.createElement('script');
 s.src='js/locality-filter.js?v=1.5.5';
 s.dataset.localityFilter='1';
 document.head.appendChild(s);
}
})();