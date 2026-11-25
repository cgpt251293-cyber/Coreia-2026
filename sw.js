// Coreia 2026 — versão offline-first. Nunca consulta a rede para abrir a app.
// Apenas os comandos MANUAL_UPDATE / pedidos marcados manual_update consultam a rede.
const CACHE='coreia-2026-offline-manual-v32';
const ASSETS=['./','./index.html','./style.css?v=32','./data.js?v=32','./app.js?v=32','./manifest.json','./version.json','./shared-overrides.json','./lembretes_coreia_2026.ics','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
 self.skipWaiting();
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('coreia-2026-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return; // Links externos acionados pelo utilizador são normais.
 if(url.searchParams.has('manual_update')){event.respondWith(fetch(event.request,{cache:'no-store'}));return;}
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const response=await cache.match(event.request,{ignoreSearch:event.request.mode==='navigate'});
  if(response)return response;
  if(event.request.mode==='navigate')return await cache.match('./index.html')||Response.error();
  // Nunca devolver HTML como JavaScript/CSS; não consumir dados para preencher falhas.
  return new Response('Ficheiro indisponível offline. Abrir a app online e atualizar manualmente.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
 })());
});
self.addEventListener('message',event=>{
 if(event.data?.type!=='MANUAL_UPDATE')return;
 const port=event.ports[0];
 event.waitUntil((async()=>{
  try{
   const version=event.data.version;
   if(!/^v[0-9]+$/.test(version))throw new Error('Versão inválida');
   const q=version.slice(1);
   const paths=['./','./index.html',`./style.css?v=${q}`,`./data.js?v=${q}`,`./app.js?v=${q}`,'./manifest.json','./version.json','./shared-overrides.json','./lembretes_coreia_2026.ics','./icon-192.png','./icon-512.png'];
   const cache=await caches.open(CACHE);
   // Buscar primeiro todos os ficheiros: se algum falhar, não substituir a app atual.
   const updated=await Promise.all(paths.map(async path=>{
    const bust=new URL(path,self.registration.scope);
    bust.searchParams.set('manual_update',Date.now().toString());
    const response=await fetch(bust.toString(),{cache:'no-store'});
    if(!response.ok)throw new Error(path+': HTTP '+response.status);
    return [new Request(new URL(path,self.registration.scope)),response];
   }));
   await Promise.all(updated.map(([req,response])=>cache.put(req,response)));
   const keep=new Set(paths.map(p=>new URL(p,self.registration.scope).href));
   const keys=await cache.keys();
   await Promise.all(keys.filter(k=>!keep.has(k.url)).map(k=>cache.delete(k)));
   port?.postMessage({ok:true,version});
  }catch(err){port?.postMessage({ok:false,error:err.message})}
 })());
});
