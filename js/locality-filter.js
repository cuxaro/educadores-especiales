(()=>{
  const q=s=>document.querySelector(s);
  const uniq=a=>[...new Set(a.filter(Boolean))];
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[’'`´]/g,"'").replace(/[^A-Z0-9'()\/ -]+/g,' ').replace(/\s+/g,' ').trim();
  const moveArticle=s=>{const m=String(s||'').trim().match(/^(.+?)\s*\((EL|LA|ELS|LES|L')\)$/i);return m?`${m[2]} ${m[1]}`.replace(/^L'\s+/i,"L'"):String(s||'').trim()};
  const variants=raw=>{const base=moveArticle(raw),parts=String(base).split('/').map(x=>moveArticle(x.trim())).filter(Boolean);return uniq([base,...parts].map(norm))};
  const title=raw=>{
    const lower=new Set(['de','del','la','el','els','les','i','y','d']);
    const one=part=>part.toLocaleLowerCase('es').split(/([ -])/).map((w,i)=>{
      if(!w||w===' '||w==='-')return w;
      if(/^l'/.test(w))return "L'"+w.slice(2).charAt(0).toLocaleUpperCase('es')+w.slice(3);
      if(i>0&&lower.has(w))return w;
      return w.charAt(0).toLocaleUpperCase('es')+w.slice(1);
    }).join('');
    return moveArticle(String(raw||'').replace(/\s+/g,' ').trim()).split('/').map(one).join(' / ');
  };

  let aliasToDisplay=new Map();
  let provinceGroups=new Map();

  function buildMaps(){
    const rows=[];
    const centres=window.state?.m?.centros||window.state?.centros||[];
    centres.forEach(c=>{if(c?.localidad)rows.push({provincia:c.provincia||'—',raw:c.localidad})});
    (window.state?.apariciones||[]).forEach(a=>{if(a?.localidad)rows.push({provincia:a.provincia||'—',raw:a.localidad})});

    aliasToDisplay=new Map(); provinceGroups=new Map();
    const byProvince=new Map();
    rows.forEach(r=>{if(!byProvince.has(r.provincia))byProvince.set(r.provincia,[]);byProvince.get(r.provincia).push(r.raw)});

    byProvince.forEach((raws,provincia)=>{
      const parent=new Map();
      const find=x=>{if(!parent.has(x))parent.set(x,x);const p=parent.get(x);if(p!==x)parent.set(x,find(p));return parent.get(x)};
      const union=(a,b)=>{const ra=find(a),rb=find(b);if(ra!==rb)parent.set(rb,ra)};
      const owner=new Map();
      uniq(raws).forEach(raw=>{const vs=variants(raw);if(!vs.length)return;vs.forEach(v=>{if(owner.has(v))union(owner.get(v),vs[0]);else owner.set(v,vs[0]);union(vs[0],v)})});
      const groups=new Map();
      uniq(raws).forEach(raw=>{const vs=variants(raw);if(!vs.length)return;const root=find(vs[0]);if(!groups.has(root))groups.set(root,[]);groups.get(root).push(raw)});
      const displays=[];
      groups.forEach(names=>{
        const u=uniq(names);
        const preferred=[...u].sort((a,b)=>((b.includes('/')?1:0)-(a.includes('/')?1:0))||(b.length-a.length)||a.localeCompare(b,'es'))[0];
        const display=title(preferred);
        displays.push(display);
        u.forEach(n=>variants(n).forEach(v=>aliasToDisplay.set(`${provincia}|${v}`,display)));
      });
      provinceGroups.set(provincia,uniq(displays).sort((a,b)=>a.localeCompare(b,'es')));
    });
  }

  function canonicalFor(provincia,raw){for(const v of variants(raw)){const x=aliasToDisplay.get(`${provincia}|${v}`);if(x)return x}return title(raw)}

  function rebuildLocalities(){
    const province=q('#filter-provincia')?.value||'';
    const select=q('#filter-localidad'); if(!select)return;
    const previous=select.value;
    let values=[];
    if(province) values=provinceGroups.get(province)||[];
    else values=uniq([...provinceGroups.values()].flat()).sort((a,b)=>a.localeCompare(b,'es'));
    select.innerHTML='<option value="">Todas</option>'+values.map(v=>`<option value="${v.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${v}</option>`).join('');
    if(values.includes(previous))select.value=previous;else select.value='';
  }

  function patchFiltering(){
    if(typeof window.geoPass==='function'){
      window.geoPass=(c,f)=>(!f.provincia||c.provincia===f.provincia)&&(!f.localidad||canonicalFor(c.provincia,c.localidad)===f.localidad)&&(!f.tipo||c.tipo===f.tipo);
      try{geoPass=window.geoPass}catch(_){}
    }
  }

  function start(){
    if(!window.state?.m||!q('#filter-localidad'))return setTimeout(start,80);
    buildMaps(); patchFiltering(); rebuildLocalities();
    q('#filter-provincia')?.addEventListener('change',()=>{rebuildLocalities();setTimeout(()=>window.refresh?.(),0)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();