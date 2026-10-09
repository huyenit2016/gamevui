// Sách nói: nạp TXT/DOCX/EPUB/PDF, lật trang tự đọc (giọng giả lập), tô sáng câu, lưu vị trí, thư viện.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const BOOKS = process.env.BOOKS || path.join(__dirname, 'fixtures');
(async () => {
  const mt = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/json' };
  const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', mt[path.extname(f)] || 'application/octet-stream'); r.end(d); }); }).listen(8124);
  const b = await chromium.launch(), errs = [], ctx = await b.newContext({ viewport: { width: 430, height: 900 } }), p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.stack.split('\n').slice(0, 2).join(' | ')));
  await p.addInitScript(() => { window.__spoken = []; const tts = { speaking: false, spoke: [], getVoices: () => [{ name: 'Giọng thử', lang: 'vi-VN', voiceURI: 'vi1' }], cancel() { this._t && clearTimeout(this._t); }, speak(u) { window.__spoken.push(u.text); this._t = setTimeout(() => u.onend && u.onend({}), 250); }, onvoiceschanged: null }; Object.defineProperty(window, 'speechSynthesis', { value: tts, configurable: true }); window.SpeechSynthesisUtterance = function (t) { this.text = t; }; });
  await p.goto('http://localhost:8124/index.html#/tool/audiobook'); await p.evaluate(() => indexedDB.deleteDatabase('gv_books')); await p.reload(); await p.waitForTimeout(500);
  const spoken = () => p.evaluate(() => window.__spoken.length);
  for (const f of ['test.txt', 'test.docx', 'test.epub', 'test.pdf']) {
    const fp = path.join(BOOKS, f); if (!fs.existsSync(fp)) { console.log(f, ': (không có tệp thử)'); continue; }
    await p.evaluate(() => { document.querySelector('.rd').hidden = true; document.querySelector('.home').hidden = false; }); await p.setInputFiles('.fi', fp); await p.waitForSelector('.rd:not([hidden]) .s', { timeout: 20000 });
    const info = await p.evaluate(() => ({ t: document.querySelector('.tt').textContent, pages: GV.abT.st.bk.pages.length, first: document.querySelector('.s').textContent.trim().slice(0, 40) }));
    console.log(f, '→', JSON.stringify(info));
  }
  // mẫu: lật trang tự đọc + tô sáng
  await p.evaluate(() => { document.querySelector('.rbk').click(); }); console.log('errs trước demo:', errs.join(' || ') || 'none', '| home hidden =', await p.evaluate(() => document.querySelector('.home').hidden), await p.evaluate(() => document.querySelector('.home').innerHTML.slice(0, 80))); await p.evaluate(() => GV.abT.open(GV.abT.lib.find(b => b.type === 'pdf'))); await p.waitForSelector('.s'); const n0 = await spoken();
  await p.click('.pl'); await p.waitForTimeout(400); console.log('phát → đọc câu, có tô sáng:', (await spoken()) > n0, await p.locator('.s.cur').count());
  const pages = await p.evaluate(() => GV.abT.st.bk.pages.length); const before = await p.evaluate(() => GV.abT.st.pg);
  await p.click('.pl'); const n1 = await spoken(); await p.click('.nx'); await p.waitForTimeout(300); console.log('lật trang tự đọc:', (await p.evaluate(() => GV.abT.st.pg)) === Math.min(before + 1, pages - 1), (await spoken()) > n1, 'đang phát =', await p.evaluate(() => GV.abT.st.playing));
  await p.waitForTimeout(3000); console.log('hết trang tự sang trang kế / dừng ở cuối:', await p.evaluate(() => GV.abT.st.pg), 'của', pages);
  await p.click('.spd'); console.log('tốc độ:', await p.locator('.spd').innerText());
  await p.click('.x'); console.log('thư viện sách:', await p.locator('.bkl').count());
  console.log(errs.join('\n') || 'no errors'); await b.close(); srv.close();
})();
