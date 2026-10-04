// Lập trình khối lệnh: ví dụ chạy được, kéo thả từ bảng màu, chạm để thêm, phím, mã chia sẻ.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await (await b.newContext({ viewport: { width: 430, height: 900 } })).newPage();
  p.on('pageerror', e => errs.push(e.stack.split('\n').slice(0, 2).join(' | ')));
  await p.goto('file://' + ROOT + '/index.html#/tool/blockcode'); await p.evaluate(() => localStorage.removeItem('gv_blockcode')); await p.reload(); await p.waitForTimeout(400);
  const sp = () => p.evaluate(() => { const s = GV.bcT.sp; return [Math.round(s.x), Math.round(s.y), Math.round(s.dir)]; });
  await p.click('.go'); await p.waitForTimeout(2500); console.log('hình vuông (về gần điểm đầu):', await sp(), '| luồng còn:', await p.evaluate(() => GV.bcT.threads));
  await p.evaluate(() => GV.bcT.load('bounce')); await p.click('.go'); await p.click('.btrb'); await p.waitForTimeout(1500); const q = await sp(); console.log('nảy: trong sân khấu =', Math.abs(q[0]) <= 240 && Math.abs(q[1]) <= 180, q);
  await p.click('.bstp'); await p.click('.btrb');
  await p.selectOption('.ex', 'keys'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200); await p.keyboard.press('ArrowUp'); await p.waitForTimeout(300); console.log('phím → ↑:', await sp());
  await p.click('.clr', { force: true }).catch(() => {}); p.once('dialog', d => d.accept());
  // chạm thêm khối từ bảng màu
  await p.evaluate(() => { GV.bcT.scripts.length = 0; }); await p.click('[data-cat=ctl]'); await p.locator('.pal .bk').first().click({ position: { x: 8, y: 8 } }); await p.click('[data-cat=mot]'); await p.locator('.pal .bk').first().click({ position: { x: 8, y: 8 } }); console.log('chạm thêm: số script =', await p.evaluate(() => GV.bcT.scripts.length), 'khối trong script đầu =', await p.evaluate(() => GV.bcT.scripts[0].length));
  // kéo từ bảng màu vào vùng làm việc (giữa các khối)
  const pb = await p.locator('.pal .bk').first().boundingBox(), wb = await p.locator('.ws').boundingBox();
  await p.mouse.move(pb.x + 10, pb.y + 8); await p.mouse.down(); await p.mouse.move(wb.x + 60, wb.y + 60, { steps: 8 }); await p.mouse.move(wb.x + 70, wb.y + 70, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(200);
  console.log('kéo thả: tổng khối =', await p.evaluate(() => GV.bcT.scripts.reduce((a, l) => a + l.length, 0)));
  // xoá bằng cách kéo ra bảng màu
  const bk = await p.locator('.ws .bk').last().boundingBox(), pb2 = await p.locator('.pal').boundingBox(); const before = await p.evaluate(() => GV.bcT.scripts.reduce((a, l) => a + l.length, 0));
  await p.mouse.move(bk.x + 8, bk.y + 8); await p.mouse.down(); await p.mouse.move(pb2.x + 40, pb2.y + 20, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(150);
  console.log('xoá bằng kéo ra bảng màu:', before, '→', await p.evaluate(() => GV.bcT.scripts.reduce((a, l) => a + l.length, 0)));
  console.log('mã khứ hồi:', await p.evaluate(() => { const c = GV.bcT.enc(); return GV.bcT.dec(c).s.length === GV.bcT.scripts.length; }));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
