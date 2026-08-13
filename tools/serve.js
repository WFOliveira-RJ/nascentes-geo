// Servidor estático sem dependências, para testar a demo localmente.
// Uso: node tools/serve.js <pasta> <porta>     (ex.: node tools/serve.js web-demo 8124)
// Necessário porque fetch() e service worker exigem http:// — abrir o index.html
// direto do disco (file://) não funciona em nenhum navegador.
const http = require('http');
const fs = require('fs');
const path = require('path');

const dir = path.resolve(process.argv[2] || '.');
const porta = parseInt(process.argv[3] || '8124', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.mp4': 'video/mp4',
};

http.createServer((req, res) => {
  let alvo = decodeURIComponent(req.url.split('?')[0]);
  if (alvo.endsWith('/')) alvo += 'index.html';
  const arq = path.join(dir, path.normalize(alvo));
  if (!arq.startsWith(dir)) { res.writeHead(403); res.end(); return; }
  fs.readFile(arq, (err, dados) => {
    if (err) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(arq).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(dados);
  });
}).listen(porta, () => {
  console.log(`Servindo ${dir}`);
  console.log(`Abra:   http://localhost:${porta}/`);
  console.log('Parar:  Ctrl+C');
});
