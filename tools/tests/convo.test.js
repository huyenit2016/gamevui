// Đàm thoại song ngữ với API dịch giả: gửi tin hai phía, sổ tay offline, phóng to bản dịch.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/api.mymemory.translated.net/**', r => { const u = new URL(r.request().url()); r.fulfill({ json: { responseStatus: 200, responseData: { translatedText: '(' + u.searchParams.get('langpair') + ')' } } }); });
  await p.goto('file://' + ROOT + '/index.html#/tool/convo'); await p.evaluate(() => localStorage.removeItem('gv_convo_log')); await p.reload(); await p.waitForTimeout(300);
  await p.fill('.tx', 'Xin chào bạn'); await p.click('.go'); await p.waitForTimeout(400);
  await p.click('[data-w=th]'); await p.fill('.tx', 'Nice to meet you'); await p.press('.tx', 'Enter'); await p.waitForTimeout(400);
  console.log('bong bóng:', (await p.locator('.bb').allInnerTexts()).map(s => s.replace(/\n/g, ' / ')));
  await p.click('.bb >> nth=0'); console.log('phóng to:', await p.locator('.zm').innerText()); await p.click('.zm');
  await p.click('[data-t=book]'); await p.locator('.ph').nth(2).click(); await p.waitForTimeout(200);
  console.log('sổ tay:', (await p.locator('.bb').last().innerText()).replace(/\n/g, ' / '));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
