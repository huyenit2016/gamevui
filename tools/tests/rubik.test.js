// Rubik: bộ giải đúng với nhiều khối xáo trộn ngẫu nhiên + giao diện 3D (xoay, xáo, giải, chạy từng bước).
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + ROOT + '/index.html#/tool/rubik'); await p.waitForTimeout(400);
  const bad = await p.evaluate(() => { const R = GV.rubik; let bad = 0; for (let k = 0; k < 200; k++) { let s = R.solvedState(); R.scramble(25).forEach(m => s = R.applyP(s, R.PERM[m])); try { const pl = R.solve(s); pl.forEach(x => x.moves.forEach(m => s = R.applyP(s, R.PERM[m]))); if (!R.isSolved(s)) bad++; } catch (e) { bad++; } } return bad; });
  console.log('giải sai /200:', bad);
  const px = () => p.evaluate(() => { const c = document.querySelector('canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) k++; return k; });
  console.log('canvas px', await px());
  await p.click('[data-m=R]'); await p.waitForTimeout(500); await p.click('.sc'); await p.waitForTimeout(2800);
  await p.click('.sv'); console.log('plan', await p.evaluate(() => GV.rubikT.plan && GV.rubikT.plan.length));
  await p.click('.nx'); await p.waitForTimeout(700); console.log('pos sau 1 bước', await p.evaluate(() => GV.rubikT.pos));
  await p.click('.au'); await p.waitForFunction(() => GV.rubik.isSolved(GV.rubikT.col), null, { timeout: 90000 }); console.log('tự chạy xong, đã giải: true');
  await p.screenshot({ path: process.env.SHOT || '/tmp/rubik.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
