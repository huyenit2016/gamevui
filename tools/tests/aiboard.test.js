// Bảng đen AI: bài mẫu viết dần, phân tích JSON an toàn, vẽ tay, hoàn tác, AI (giả lập) soạn bài và giải bài từ ảnh.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await (await b.newContext({ viewport: { width: 430, height: 900 } })).newPage();
  p.on('pageerror', e => errs.push(e.stack.split('\n').slice(0, 2).join(' | ')));
  let calls = [];
  await p.route('https://api.anthropic.com/**', r => { const body = JSON.parse(r.request().postData()); const img = JSON.stringify(body.messages[0].content).includes('"image"'); calls.push(img ? 'vision' : 'text'); r.fulfill({ json: { content: [{ type: 'text', text: 'Đây là bài:\n{"title":"Giải thử","blocks":[{"t":"h","x":"Bài giải","c":"yellow"},{"t":"step","x":"2x + 3 = 7","c":"blue"},{"t":"step","x":"x = 2","c":"green"},{"t":"plot","f":"2*x+3","xr":[-3,3],"lab":"y = 2x + 3"},{"t":"bad","x":"bỏ qua"},{"t":"plot","f":"alert(1)","xr":[0,1]}]}'}] } }); });
  await p.goto('file://' + ROOT + '/index.html#/tool/aiboard'); await p.evaluate(() => { localStorage.removeItem('gv_aiboard'); localStorage.setItem('gv_ai', JSON.stringify({ provider: 'claude', key: 'test-key', models: {} })); }); await p.reload(); await p.waitForTimeout(500);
  const inkPx = () => p.evaluate(() => { const c = GV.aibT.ink(), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 3; i < d.length; i += 40) if (d[i] > 40) k++; return k; });
  console.log('safeF:', await p.evaluate(() => [!!GV.aibT.safeF('x^2-4*x+3'), !!GV.aibT.safeF('sin(x)*2'), GV.aibT.safeF('alert(1)'), GV.aibT.safeF('constructor')].join()));
  console.log('parse (bỏ khối lạ + hàm nguy hiểm):', await p.evaluate(() => GV.aibT.parseBoard('{"blocks":[{"t":"h","x":"A"},{"t":"zzz"},{"t":"plot","f":"alert(1)"},{"t":"p","x":"B"}]}').map(x => x.t).join()));
  // vẽ tay
  const ib = await p.locator('canvas.ink').boundingBox();
  await p.mouse.move(ib.x + 60, ib.y + 60); await p.mouse.down(); await p.mouse.move(ib.x + 200, ib.y + 120, { steps: 8 }); await p.mouse.up(); const a1 = await inkPx();
  await p.click('.un'); const a2 = await inkPx(); await p.click('.re'); const a3 = await inkPx(); console.log('vẽ → hoàn tác → làm lại:', a1 > 0, a2 === 0, a3 > 0);
  // bài mẫu viết dần
  await p.click('.clr'); p.once('dialog', d => d.accept());
  await p.evaluate(() => { document.querySelector('.narr').checked = false; });
  await p.selectOption('.lib', 'parabol'); await p.waitForTimeout(500); const mid = await inkPx(); await p.waitForFunction(() => !document.querySelector('.skipb').offsetParent, null, { timeout: 30000 }); console.log('bài mẫu viết dần: giữa chừng', mid, '→ xong', await inkPx(), '| số trang', await p.evaluate(() => GV.aibT.pages));
  // AI soạn bài (giả lập) và giải bài từ ảnh
  await p.fill('.q', 'Giải phương trình 2x + 3 = 7'); await p.click('.gen'); await p.waitForFunction(() => !document.querySelector('.skipb').offsetParent && document.querySelector('.msg3').textContent === '', null, { timeout: 40000 });
  await p.click('.solve'); await p.waitForFunction(() => !document.querySelector('.skipb').offsetParent && document.querySelector('.msg3').textContent === '', null, { timeout: 40000 });
  console.log('gọi AI:', calls.join(','), '| trang:', await p.evaluate(() => GV.aibT.pages));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
