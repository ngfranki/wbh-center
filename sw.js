// WBH 戰略中心 service worker
// 作用：令 Android Chrome 可以「安裝應用程式」（真獨立視窗）＋斷網時仲有圖示。
// 🔴 鐵律：HTML 一律行網絡，永遠唔准食快取——唔係版本自檢會見唔到新版，
//    就會翻返 09-06 嗰個「手機死抱舊版」嘅坑。
const CACHE = 'wbh-assets-v1';

self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  const req = e.request;
  if(req.method !== 'GET') return;

  // ① 頁面本身：淨係行網絡；真係斷晒網先攞快取頂住
  if(req.mode === 'navigate' || req.destination === 'document'){
    e.respondWith(fetch(req).catch(function(){ return caches.match(req); }));
    return;
  }

  // ② 靜態檔（icon／manifest）：網絡優先，順手更新快取
  e.respondWith(
    fetch(req).then(function(res){
      try{
        if(res && res.ok && new URL(req.url).origin === self.location.origin){
          const copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
      }catch(err){}
      return res;
    }).catch(function(){ return caches.match(req); })
  );
});
