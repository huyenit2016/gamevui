// THPT lớp 10: dữ liệu đủ 5 môn, mở bài, xem lời giải, đánh dấu đã học, trắc nghiệm.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await (await b.newContext({ viewport: { width: 390, height: 800 }, isMobile: true })).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + ROOT + '/index.html#/tool/thpt'); await p.evaluate(() => localStorage.removeItem('gv_thpt')); await p.reload(); await p.waitForTimeout(400);
  const st = await p.evaluate(() => GV.thpt.grades[10].map(s => [s.id, s.chapters.reduce((a, c) => a + c.lessons.length, 0), s.chapters.reduce((a, c) => a + c.lessons.reduce((x, l) => x + l.ex.length, 0), 0), s.quiz.length]));
  console.log('môn [id, bài, bài tập, trắc nghiệm]:', JSON.stringify(st));
  await p.click('[data-s=toan]'); await p.click('.ls >> nth=0'); await p.click('[data-sol="0"]'); console.log('lời giải hiện:', await p.locator('.sol.open').count());
  await p.click('[data-done]'); console.log('đã học:', await p.evaluate(() => Object.keys(GV.thptT.st.done).length));
  await p.click('[data-s2=toan]'); await p.click('[data-quiz=toan]');
  for (let i = 0; i < 6; i++) { await p.locator('.opt').first().click(); await p.click('[data-nextq]'); }
  console.log('kết quả:', await p.locator('h3').first().innerText());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
