// Làng Nông Vui: đi xe bus nông trại ↔ khu vui chơi, chạm điểm vui chơi để mở khu (có mở khoá).
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await (await b.newContext({ viewport: { width: 430, height: 900 } })).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + ROOT + '/index.html#/game/avatarfarm'); await p.evaluate(() => localStorage.removeItem('gv_avfarm')); await p.reload(); await p.waitForTimeout(500);
  const cur = () => p.evaluate(() => document.querySelector('.tb .on') && document.querySelector('.tb .on').dataset.t);
  const tap = async (x, y) => { const bb = await p.locator('canvas').first().boundingBox(), sc = bb.width / 420; await p.mouse.click(bb.x + x * sc, bb.y + y * sc); };
  await tap(100, 420); await p.waitForTimeout(500); console.log('đang đi xe (overlay):', await p.locator('.pane canvas').count() >= 1);
  await p.waitForFunction(() => document.querySelectorAll('.pane canvas').length === 1 && document.querySelector('.tb .on').dataset.t === 'plaza', null, { timeout: 8000 }); await p.waitForTimeout(3200);
  console.log('đã tới khu vui chơi:', await cur());
  await p.evaluate(() => { GV.townT.S.unlocked = true; GV.townT.save(); }); await p.reload(); await p.waitForTimeout(300); await p.click('[data-t=plaza]'); await p.waitForTimeout(3300);
  await tap(212, 150); await p.waitForTimeout(2500); console.log('chạm Đua xe →', await cur());
  await p.click('[data-t=plaza]'); await p.waitForTimeout(500); await p.click('[data-t=farm]'); await p.waitForTimeout(3300); console.log('về nông trại:', await cur());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
