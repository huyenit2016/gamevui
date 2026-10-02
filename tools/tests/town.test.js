// Kiểm thử Làng Nông Vui: các khu mở rộng, mở khoá 30 phút, thưởng xu từ game nhúng.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], out = [];
  const p = await (await b.newContext({ viewport: { width: 430, height: 900 } })).newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/ERR_|Failed to load/.test(m.text()) && errs.push(m.text()));
  const log = (n, v) => out.push(n + ': ' + v), S = () => p.evaluate(() => JSON.parse(localStorage.getItem('gv_avfarm')));
  await p.goto('file://' + ROOT + '/index.html#/game/avatarfarm'); await p.evaluate(() => localStorage.removeItem('gv_avfarm')); await p.goto('file://' + ROOT + '/index.html#/game/avatarfarm'); await p.waitForTimeout(500);
  log('tab ban đầu', (await p.locator('.tb button').allInnerTexts()).join(' | '));
  await p.click('[data-t=house]'); log('nhà bị khoá', (await p.locator('.pane').innerText()).replace(/\s+/g, ' ').slice(0, 70));
  await p.click('[data-t=barn]'); await p.locator('[data-buy^="0:hen"]').click(); await p.locator('[data-feed="0"]').click(); log('chuồng: gà', (await p.locator('.pens').innerText()).replace(/\s+/g, ' ').slice(0, 60));
  // mở sớm bằng 10 kim cương
  await p.click('[data-t=house]'); await p.click('.ue'); await p.waitForTimeout(300); log('sau mở khoá', (await p.locator('.tb button').allInnerTexts()).join(' | '));
  await p.evaluate(() => { GV.townT.S.coins = 5000; GV.townT.hud(); }); await p.click('[data-t=house]'); await p.waitForTimeout(300); const cb = await p.locator('canvas').boundingBox(); await p.mouse.click(cb.x + cb.width * .45, cb.y + cb.height * .45); log('nhà: đồ đặt', (await S()).house.items.length + ' | hạnh phúc ' + (await S()).happy);
  await p.click('[data-t=biz]'); await p.locator('[data-b="0"]').click(); await p.waitForTimeout(1300); log('cày xu', (await p.locator('.pool').innerText()).replace(/\s+/g, ' ').slice(0, 70));
  await p.click('[data-t=fish]'); await p.click('.go'); await p.waitForTimeout(500); log('câu cá nhúng', await p.locator('canvas').count());
  await p.click('[data-t=race]'); await p.click('.go'); await p.waitForTimeout(500); log('đua xe nhúng', await p.locator('canvas').count());
  await p.click('[data-t=board]'); await p.click('.go'); await p.waitForTimeout(500); await p.click('.roll'); await p.waitForTimeout(2600); log('cờ tỷ phú', (await p.locator('.lgx').innerText()).slice(0, 60));
  await p.click('[data-t=games]'); await p.waitForTimeout(300); log('danh sách game', await p.locator('[data-g]').count());
  await p.click('[data-t=neighbors]'); await p.waitForTimeout(800); log('hàng xóm', await p.locator('[data-v]').count()); await p.locator('[data-v]').first().click(); await p.waitForTimeout(300); await p.click('.lk'); log('thả tim', (await p.locator('.lc').innerText()));
  // thưởng xu từ game nhúng
  await p.click('[data-t=games]'); await p.locator('[data-g="mathrush"]').click(); const c0 = (await S()).coins; await p.evaluate(() => GV.setBest('mathrush', 120)); await p.waitForTimeout(300); log('thưởng xu từ game', ((await S()).coins - c0));
  console.log(out.join('\n')); console.log(errs.join('\n') || 'no errors'); await b.close();
})();
