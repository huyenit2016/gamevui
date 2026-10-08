// Thiết kế mạch số: biểu thức → mạch, bảng chân trị + QM, mô phỏng tổ hợp/tuần tự (chốt SR, bộ đếm), Verilog, kéo nối dây.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await (await b.newContext({ viewport: { width: 430, height: 900 } })).newPage();
  p.on('pageerror', e => errs.push(e.stack.split('\n').slice(0, 2).join(' | ')));
  await p.goto('file://' + ROOT + '/index.html#/tool/chipdesign'); await p.evaluate(() => localStorage.removeItem('gv_chipdesign')); await p.reload(); await p.waitForTimeout(400);
  const ev = (f, a) => p.evaluate(f, a);
  console.log('QM XOR:', await ev(() => GV.chipT.sopText(GV.chipT.qm(2, [1, 2]), ['A', 'B'])), '| QM (0,1,2,3 phủ hết):', await ev(() => JSON.stringify(GV.chipT.qm(2, [0, 1, 2, 3]))), '| QM 3 biến m(1,3,5,7)=', await ev(() => GV.chipT.sopText(GV.chipT.qm(3, [1, 3, 5, 7]), ['A', 'B', 'C'])));
  console.log('lỗi cú pháp:', await ev(() => { try { GV.chipT.parseExprs('A & (B |'); return 'không lỗi'; } catch (e) { return e.message; } }));
  // toàn cộng: kiểm tra mọi tổ hợp
  await p.selectOption('.ex', 'full'); await p.waitForTimeout(200);
  console.log('toàn cộng đúng:', await ev(() => { const t = GV.chipT.truth(); return t.rows.every(r => { const a = (r.m >> 2) & 1, bb = (r.m >> 1) & 1, c = r.m & 1, s = a + bb + c; const names = t.outs.map(o => o.l); return r.o[names.indexOf('S')] === (s & 1) && r.o[names.indexOf('Cout')] === (s >> 1); }); }));
  await p.click('[data-tab=tt]'); console.log('bảng chân trị có rút gọn:', /Quine/.test(await p.locator('.pn').innerText()), '| hàng', await p.locator('.pn table tr').count());
  await p.click('[data-tab=vl]'); const vl = await p.locator('.vo').innerText(); console.log('Verilog:', /module chip\(/.test(vl), /assign/.test(vl), /endmodule/.test(vl));
  await p.click('[data-v="1"]'); console.log('Testbench:', /chip_tb/.test(await p.locator('.vo').innerText()));
  // chốt SR
  await p.selectOption('.ex', 'sr'); await p.waitForTimeout(200);
  const sr = () => ev(() => { const o = GV.chipT.C.nodes.filter(n => n.t === 'OUT'); return o.map(n => { const w = GV.chipT.C.wires.find(w => w.b === n.id); return GV.chipT.val(GV.chipT.C.nodes.find(k => k.id === w.a)); }).join(''); });
  const setv = (l, v) => ev(([l, v]) => { GV.chipT.C.nodes.find(n => n.l === l).v = v; GV.chipT.simulate(); }, [l, v]);
  await setv('S', 1); const s1 = await sr(); await setv('S', 0); const s2 = await sr(); await setv('R', 1); const s3 = await sr(); await setv('R', 0); const s4 = await sr();
  console.log('SR (Q,Qn): set', s1, 'giữ', s2, 'reset', s3, 'giữ', s4);
  // bộ đếm 2 bit
  await p.selectOption('.ex', 'cnt'); await p.waitForTimeout(200);
  const seq = []; for (let i = 0; i < 5; i++) { await p.click('.step'); seq.push(await ev(() => { const f = GV.chipT.C.nodes.filter(n => n.t === 'DFF').sort((a, b) => a.id - b.id); return f[1].q + '' + f[0].q; })); }
  console.log('đếm 2 bit sau mỗi xung (Q1Q0):', seq.join(' '));
  // kéo nối dây bằng chuột: IN → NOT → OUT
  await p.click('.clr'); p.once('dialog', d => d.accept()); await p.evaluate(() => { GV.chipT.setCircuit({ nodes: [], wires: [] }); });
  await p.click('[data-add=IN]'); await p.click('[data-add=NOT]'); await p.click('[data-add=OUT]');
  const pins = await ev(() => ({ out: [...document.querySelectorAll('[data-out]')].map(e => { const r = e.getBoundingClientRect(); return [e.dataset.out, r.x + r.width / 2, r.y + r.height / 2]; }), inn: [...document.querySelectorAll('[data-in]')].map(e => { const r = e.getBoundingClientRect(); return [e.dataset.in, r.x + r.width / 2, r.y + r.height / 2]; }) }));
  const types = await ev(() => GV.chipT.C.nodes.map(n => n.t + n.id).join(','));
  const [iN, nO, nI, oI] = [pins.out[0], pins.out[1], pins.inn[0], pins.inn[1]];
  await p.mouse.move(iN[1], iN[2]); await p.mouse.down(); await p.mouse.move(nI[1], nI[2], { steps: 6 }); await p.mouse.up();
  await p.mouse.move(nO[1], nO[2]); await p.mouse.down(); await p.mouse.move(oI[1], oI[2], { steps: 6 }); await p.mouse.up();
  console.log('nút:', types, '| dây nối bằng kéo:', await ev(() => GV.chipT.C.wires.length));
  await ev(() => { GV.chipT.C.nodes[0].v = 0; GV.chipT.simulate(); }); console.log('IN=0 → NOT → OUT =', await ev(() => { const o = GV.chipT.C.nodes.find(n => n.t === 'OUT'); const w = GV.chipT.C.wires.find(w => w.b === o.id); return GV.chipT.val(GV.chipT.C.nodes.find(k => k.id === w.a)); }));
  console.log('mã khứ hồi:', await ev(() => GV.chipT.fromCode(GV.chipT.bytes()).nodes.length));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
