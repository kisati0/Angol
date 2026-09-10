// Szómondó 1 v72. Only this application's resources belong in this cache.
const PREFIX='szomondo-1-';
const CACHE=PREFIX+'v72';
const ASSETS=[
  './','./index.html','./core.js','./manifest.json',
  './icon-192.png','./icon-512.png','./icon-maskable.png',
  './vendor/jszip-3.10.0.min.js','./vendor/epub-0.3.93.min.js'
];
const assetUrls=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(PREFIX) && key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
async function networkFirst(request,event){
  const cache=await caches.open(CACHE);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),4000);
  try{
    const response=await fetch(request,{signal:controller.signal});
    if(response.status>=500) throw new Error('Server unavailable');
    if(response.ok && assetUrls.has(request.url)) event.waitUntil(cache.put(request,response.clone()).catch(()=>{}));
    return response;
  }catch(error){
    const cached=await cache.match(request,{ignoreSearch:true});
    if(cached) return cached;
    if(request.mode==='navigate'){
      const index=await cache.match('./index.html');
      if(index) return index;
    }
    return new Response('A fájl offline nem érhető el.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
  }finally{clearTimeout(timer);}
}
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin || !/^https?:$/.test(url.protocol)) return;
  const asset=assetUrls.has(url.origin+url.pathname);
  if(!asset && request.mode!=='navigate') return;
  if(url.pathname.includes('/vendor/') || /icon-(?:192|512|maskable)\.png$/.test(url.pathname)){
    event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(request,{ignoreSearch:true})) || networkFirst(request,event)));
  }else event.respondWith(networkFirst(request,event));
});
self.addEventListener('message',event=>{
  if(event.data && event.data.type==='SKIP_WAITING') event.waitUntil(self.skipWaiting());
});
