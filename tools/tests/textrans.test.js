// Dịch văn bản với API giả: dịch, nhận diện, đảo chiều, lịch sử.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/api.mymemory.translated.net/**', r => { const u = new URL(r.request().url()); r.fulfill({ json: { responseStatus: 200, responseData: { translatedText: '[' + u.searchParams.get('langpair') + '] ' + u.searchParams.get('q') } } }); });
  await p.goto('file://' + ROOT + '/index.html#/tool/texttrans'); await p.waitForTimeout(300);
  await p.fill('.src', 'Hello world. How are you?'); await p.waitForTimeout(1600); console.log('en→vi:', await p.locator('.out').innerText(), '|', await p.locator('.dt').innerText());
  await p.fill('.src', 'こんにちは'); await p.waitForTimeout(1600); console.log('ja:', await p.locator('.out').innerText());
  await p.click('.sw'); await p.waitForTimeout(1600); console.log('đảo:', await p.locator('.fr').inputValue(), await p.locator('.to').inputValue(), '|', await p.locator('.src').inputValue());
  console.log('lịch sử:', await p.locator('.hl [data-i]').count());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
