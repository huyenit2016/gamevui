// Piano: mở, bấm phím, chế độ tập theo bài (đúng/sai), nghe mẫu.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + ROOT + '/index.html#/tool/piano'); await p.waitForTimeout(300);
  console.log('phím:', await p.locator('[data-m]').count());
  await p.locator('[data-m="60"]').click(); await p.keyboard.press('s');
  await p.selectOption('.md', 'learn'); await p.waitForTimeout(200);
  console.log('nốt gợi ý có viền:', await p.locator('.nx').count());
  await p.locator('[data-m="61"]').click({ force: true }); console.log('bấm sai:', await p.locator('.msg').innerText());
  for (const m of [60, 60, 67, 67, 69, 69, 67]) await p.locator(`[data-m="${m}"]`).click({ force: true });
  console.log('tiến độ idx:', await p.evaluate(() => GV.pianoT.idx));
  await p.selectOption('.md', 'listen'); await p.waitForTimeout(1500); console.log('nghe mẫu idx:', await p.evaluate(() => GV.pianoT.idx));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
