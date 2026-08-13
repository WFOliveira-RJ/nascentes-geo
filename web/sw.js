// Service worker do NascentesGeo — cacheia apenas o APP SHELL.
// Os dados vetoriais (base cartográfica e nascentes) NÃO passam por aqui:
// são baixados em chunks verificados por SHA-256 e guardados em IndexedDB
// pelo próprio app ("Baixar região p/ offline"). Essa separação mantém o
// shell sempre atualizável e o pacote de dados sob controle do usuário.

const CACHE = 'nascentesgeo-shell-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  // Navegação: shell do cache primeiro (garante abrir offline), rede atualiza em 2º plano.
  if (e.request.mode === 'navigate'){
    e.respondWith(
      caches.match('./index.html').then(hit => {
        const rede = fetch(e.request).then(r => {
          if (r.ok) caches.open(CACHE).then(c => c.put('./index.html', r.clone()));
          return r;
        }).catch(() => hit);
        return hit || rede;
      })
    );
    return;
  }

  // Demais ativos do shell: cache-first.
  const rel = '.' + url.pathname.slice(url.pathname.lastIndexOf('/web/') >= 0 ? url.pathname.indexOf('/web/') + 4 : url.pathname.lastIndexOf('/'));
  if (SHELL.includes(rel) || SHELL.some(s => url.pathname.endsWith(s.slice(1)) && s !== './')){
    e.respondWith(
      caches.match(e.request, {ignoreSearch:true}).then(hit => hit || fetch(e.request).then(r => {
        if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone()));
        return r;
      }))
    );
  }
  // JSONs de dados: passam direto (network); o fallback offline é o IndexedDB no app.
});
