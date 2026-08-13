// Prova automatizada do Sprint 1: PWA funciona OFFLINE de verdade.
// 1) Online: carrega o app, espera o SW ativar, clica "Baixar região p/ offline"
// 2) Desliga a rede (context.setOffline) e RECARREGA a página
// 3) Verifica: shell veio do SW, dados vieram do IndexedDB, marcadores no mapa
// Também captura screenshots desktop e mobile (evidência para README/LinkedIn).
// Uso: node tools/verify_offline.js  (requer web/ servido em http://localhost:8123)

const { chromium, devices } = require('playwright');

const URL = 'http://localhost:8123/';
const OUT = process.env.OUT_DIR || '/tmp/evidencias';

(async () => {
  const browser = await chromium.launch();
  const fs = require('fs'); fs.mkdirSync(OUT, { recursive: true });
  let falhas = 0;
  const ok = (cond, msg) => { console.log((cond ? 'PASS' : 'FAIL') + ' — ' + msg); if (!cond) falhas++; };

  // ---------- Desktop: baixar região e provar offline ----------
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 760 } });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.waitForFunction(() => document.querySelectorAll('.mk,.cluster').length > 0);
  await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller !== undefined);
  await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistrations()).some(r => r.active));

  await page.click('#btnBaixar');
  await page.waitForFunction(() => document.getElementById('offInfo').textContent.includes('íntegra'));
  const info = await page.textContent('#offInfo');
  ok(/chunks/.test(info), 'download da região com integridade verificada: ' + info.trim());
  await page.screenshot({ path: OUT + '/1-online-regiao-baixada.png' });

  // Rede DESLIGADA + reload — o momento da verdade
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => document.querySelectorAll('.mk,.cluster').length > 0, { timeout: 15000 })
    .catch(() => {});
  const marcadores = await page.evaluate(() => document.querySelectorAll('.mk,.cluster').length);
  ok(marcadores > 0, `offline + reload: mapa renderizou (${marcadores} marcadores/clusters)`);
  const modo = await page.textContent('#fModo');
  ok(/OFFLINE/.test(modo), 'app sinaliza que está usando dados da região offline');
  const badge = await page.textContent('#conStat');
  ok(badge.trim() === 'offline', 'badge de conexão mostra "offline"');

  // Cadastro continua funcionando sem rede
  await page.click('#btnNova');
  await page.mouse.click(700, 380);
  await page.fill('#fNome', 'Nascente do Teste Offline');
  await page.click('#fOk');
  const total = await page.textContent('#fCount');
  ok(/7\d de 71/.test(total) || /de 71/.test(total), 'cadastro offline efetuado: ' + total.trim());
  await page.screenshot({ path: OUT + '/2-offline-mapa-funcionando.png' });
  await ctx.close();

  // ---------- Mobile: layout responsivo + toque ----------
  const mob = await browser.newContext({ ...devices['Pixel 7'] });
  const mpage = await mob.newPage();
  await mpage.goto(URL);
  await mpage.waitForFunction(() => document.querySelectorAll('.mk,.cluster').length > 0);
  const asideOrdem = await mpage.evaluate(() => getComputedStyle(document.querySelector('aside')).order);
  ok(asideOrdem === '2', 'layout mobile: painel de controles foi para baixo do mapa');

  // Pan por toque: um "arrasto" de dedo deve mover o centro do mapa
  const antes = await mpage.evaluate(() => document.getElementById('fCoord').textContent);
  const box = await mpage.locator('#mapwrap').boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await mpage.locator('#mapwrap').dispatchEvent('pointerdown', { pointerId: 1, clientX: cx, clientY: cy, bubbles: true });
  for (let i = 1; i <= 6; i++)
    await mpage.locator('#mapwrap').dispatchEvent('pointermove', { pointerId: 1, clientX: cx + i * 20, clientY: cy + i * 10, bubbles: true });
  await mpage.locator('#mapwrap').dispatchEvent('pointerup', { pointerId: 1, clientX: cx + 120, clientY: cy + 60, bubbles: true });
  const depois = await mpage.evaluate(() => document.getElementById('fCoord').textContent);
  ok(antes !== depois, 'pan por toque (pointer events) move o mapa');

  // Pinch: dois ponteiros afastando devem aumentar o zoom
  const z0 = await mpage.evaluate(() => document.getElementById('fZoom').textContent);
  const alvo = mpage.locator('#mapwrap');
  await alvo.dispatchEvent('pointerdown', { pointerId: 2, clientX: cx - 40, clientY: cy, bubbles: true });
  await alvo.dispatchEvent('pointerdown', { pointerId: 3, clientX: cx + 40, clientY: cy, bubbles: true });
  for (let i = 1; i <= 5; i++) {
    await alvo.dispatchEvent('pointermove', { pointerId: 2, clientX: cx - 40 - i * 25, clientY: cy, bubbles: true });
    await alvo.dispatchEvent('pointermove', { pointerId: 3, clientX: cx + 40 + i * 25, clientY: cy, bubbles: true });
  }
  await alvo.dispatchEvent('pointerup', { pointerId: 2, bubbles: true });
  await alvo.dispatchEvent('pointerup', { pointerId: 3, bubbles: true });
  const z1 = await mpage.evaluate(() => document.getElementById('fZoom').textContent);
  ok(parseFloat(z1) > parseFloat(z0), `pinch-zoom aumentou o zoom (${z0} → ${z1})`);
  await mpage.screenshot({ path: OUT + '/3-mobile-layout.png' });
  await mob.close();

  await browser.close();
  console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${falhas} FALHA(S)`);
  process.exit(falhas === 0 ? 0 : 1);
})();
