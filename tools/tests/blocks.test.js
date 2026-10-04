// Xây Khối 3D: mở, đặt/xoá/tô/lấy màu bằng chạm, hoàn tác, mẫu, cắt tầng, mã chia sẻ, canvas có vẽ.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await (await b.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true })).newPage();
  p.on('pageerror', e => errs.push(e.stack.split('\n').slice(0, 3).join(' | ')));
  await p.goto('file://' + ROOT + '/index.html#/game/blocks'); await p.evaluate(() => localStorage.removeItem('gv_blocks')); await p.reload(); await p.waitForTimeout(500);
  const cnt = () => p.evaluate(() => GV.blocksT.g.reduce((a, v) => a + (v ? 1 : 0), 0));
  const tap = async (fx, fy) => { const bb = await p.locator('canvas').boundingBox(); await p.mouse.click(bb.x + bb.width * fx, bb.y + bb.height * fy); await p.waitForTimeout(100); };
  await p.selectOption('.tp', 'clear'); await p.waitForTimeout(200); const c0 = await cnt();
  // tìm 1 điểm trên nền để đặt: thử các điểm cho tới khi số khối tăng
  let placed = false; for (const [fx, fy] of [[.5, .6], [.45, .65], [.55, .55], [.5, .7], [.4, .6]]) { await tap(fx, fy); if (await cnt() > c0) { placed = true; break; } }
  console.log('đặt khối bằng chạm:', placed, await cnt() - c0);
  await p.click('.un'); console.log('hoàn tác ->', await cnt() === c0); await p.click('.re'); console.log('làm lại ->', await cnt() === c0 + 1);
  await p.selectOption('.tp', 'house'); await p.waitForTimeout(200); const ch = await cnt(); console.log('nhà:', ch, 'khối');
  await p.fill('.ly', '2'); await p.dispatchEvent('.ly', 'input'); console.log('cắt tầng:', await p.locator('.lyv').innerText());
  await p.fill('.ly', '9'); await p.dispatchEvent('.ly', 'input');
  await p.click('[data-tool=erase]'); await tap(.5, .5); console.log('xoá bớt:', (await cnt()) <= ch);
  const px = await p.evaluate(() => { const c = document.querySelector('canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 0; i < d.length; i += 40) if (d[i + 3] > 200) k++; return k; });
  console.log('canvas px:', px);
  await p.selectOption('.tp', 'terrain'); await p.waitForTimeout(200); console.log('địa hình:', await cnt() > 100);
  await p.screenshot({ path: process.env.SHOT || '/tmp/blocks.png' });
  // hình khối + màu riêng + khôi phục từ bộ nhớ
  await p.selectOption('.tp', 'clear'); await p.waitForTimeout(150);
  await p.click('[data-shp="1"]'); await p.fill('.cc', '#12ab34'); await p.click('.addc');
  const before = await cnt(); for (const [fx, fy] of [[.5, .6], [.45, .65], [.55, .55], [.5, .7], [.4, .6]]) { await tap(fx, fy); if (await cnt() > before) break; }
  console.log('nửa khối + màu riêng:', await p.evaluate(() => { const t = GV.blocksT; let ok = false; for (let i = 0; i < t.g.length; i++) if (t.g[i] === 21) ok = true; return ok; }), 'màu riêng ở bảng:', await p.locator('.sw').count());
  await p.waitForTimeout(600); await p.reload(); await p.waitForTimeout(500);
  console.log('sau tải lại: màu riêng còn', await p.locator('.sw').count() === 21, 'khối còn', await cnt());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
