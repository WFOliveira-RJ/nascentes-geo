// Grava a demonstração do NascentesGeo em frames PNG (para GIF/MP4)
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const dir = '/tmp/frames';
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  let i = 0;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--force-device-scale-factor=1'] });
  const page = await browser.newPage({ viewport: { width: 1100, height: 660 } });

  const shot = async (n = 1) => { for (let k = 0; k < n; k++) await page.screenshot({ path: `${dir}/f${String(i++).padStart(4, '0')}.png` }); };
  const mapa = () => page.locator('#mapwrap');

  await page.goto('http://localhost:8765/index.html');
  await page.waitForTimeout(900);
  await shot(10);                                     // visão geral

  // zoom por botão (2x) com pausas
  for (let z = 0; z < 2; z++) { await page.click('#zin'); await page.waitForTimeout(250); await shot(6); }

  // clica num cluster (primeiro visível)
  const cl = page.locator('.cluster').first();
  if (await cl.count()) { await cl.click(); await page.waitForTimeout(300); await shot(8); }

  // abre popup de um marcador
  const mk = page.locator('.mk').first();
  if (await mk.count()) { await mk.click(); await page.waitForTimeout(300); await shot(12); }
  await page.locator('#popup .x').click().catch(() => {});
  await shot(3);

  // filtros: desmarca "Validada" e "Rejeitada"
  const boxes = page.locator('#filtros .filtro input');
  await boxes.nth(2).click(); await shot(6);
  await boxes.nth(3).click(); await shot(8);
  await boxes.nth(2).click(); await boxes.nth(3).click(); await shot(5);

  // modo cadastro: clique no mapa + salvar
  await page.click('#btnNova'); await shot(5);
  const bb = await mapa().boundingBox();
  await page.mouse.click(bb.x + bb.width * 0.62, bb.y + bb.height * 0.38);
  await page.waitForTimeout(250); await shot(5);
  await page.fill('#fNome', 'Nascente Portfólio 01'); await shot(6);
  await page.click('#fOk'); await page.waitForTimeout(250); await shot(10);

  // ajustar mapa (visão final)
  await page.click('#btnFit'); await page.waitForTimeout(300); await shot(12);

  await browser.close();
  console.log('frames:', i);
})();
