// Bé học cửu chương: đọc số tiếng Việt, học, luyện (đúng/sai), thi, báo cáo phụ huynh.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await (await b.newContext({ viewport: { width: 390, height: 800 }, isMobile: true })).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + ROOT + '/index.html#/game/cuuchuong'); await p.evaluate(() => localStorage.removeItem('gv_cuuchuong')); await p.reload(); await p.waitForTimeout(400);
  console.log('đọc:', await p.evaluate(() => [GV.cuuT.say(21), GV.cuuT.say(15), GV.cuuT.say(45), GV.cuuT.say(100), GV.cuuT.speakEq(7, 8)].join(' | ')));
  await p.click('[data-n="7"]'); await p.click('[data-r="8"]'); console.log('hình minh hoạ 7×8:', await p.locator('.arr span').count());
  await p.click('[data-t=practice]'); await p.click('[data-n="6"]');
  for (let i = 0; i < 10; i++) { const ans = await p.evaluate(() => GV.cuuT.q.ans); await p.locator(`[data-o="${ans}"]`).click(); await p.waitForTimeout(1000); }
  console.log('sao sau luyện 10 câu đúng:', await p.locator('.st').innerText());
  await p.click('[data-t=exam]'); await p.click('[data-act=exam]');
  for (let i = 0; i < 10; i++) { const ans = await p.evaluate(() => GV.cuuT.q.ans); await p.locator(`[data-o="${ans}"]`).click(); }
  console.log('thi:', (await p.locator('h3').innerText()), '| sao', await p.locator('.st').innerText());
  await p.click('[data-t=parent]'); console.log('báo cáo ô màu:', await p.locator('.hm b').count());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
