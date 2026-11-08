// Test game Sài Gòn Du Ký 3D (games/saigon3d): điều khiển, va chạm, check-in, hỏi đáp, ẩm thực, ảnh, hộ chiếu, taxi, ngày đêm,
// online 2 người (hiện diện, cử chỉ, chat, xếp hạng, dọn rác), offline, giao diện điện thoại.
// Chạy: THREE_PATH=<three.module.js cục bộ> NODE_PATH=$(npm root -g) node tools/tests/saigon3d.test.js   (CDN bị chặn nên cần THREE_PATH)
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright'); const { makeHub } = require('./hub');
const http = require('http'), fs = require('fs'), path = require('path');
const THREE = process.env.THREE_PATH || require.resolve('three/build/three.module.js');
let pass = 0, fail = 0; const ok = (n, c, x) => { c ? pass++ : fail++; console.log((c ? 'OK   ' : 'FAIL ') + n + (c ? '' : ' -> ' + x)); };
const MT = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
(async () => {
  const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', MT[path.extname(f)] || 'application/octet-stream'); r.end(d); }); }).listen(8161);
  const URL = 'http://localhost:8161/games/saigon3d/index.html', b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }), hub = makeHub(), errs = [];
  const mk = async (name, o = {}) => {
    const ctx = await b.newContext({ viewport: { width: o.w || 1200, height: o.h || 800 }, hasTouch: !!o.touch, isMobile: !!o.touch, acceptDownloads: true }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('console', m => m.type() === 'error' && !/ERR_|Failed to load|404/.test(m.text()) && errs.push(name + ': ' + m.text()));
    await p.route(/^https?:\/\/(?!localhost)/, r => r.abort()); await p.route('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js', r => r.fulfill({ path: THREE, contentType: 'text/javascript' }));
    if (o.hub !== false) { await hub.attach(p, 'anon-' + name); await p.addInitScript({ path: path.join(__dirname, 'mock_shared.js') }); }
    await p.goto(URL); await p.waitForFunction(() => window.SG, null, { timeout: 40000 }); return p;
  };
  const start = async (p, name) => { await p.fill('#nameIn', name); await p.click('#bEnter'); await p.waitForTimeout(400); };
  const tp = (p, x, z) => p.evaluate(([x, z]) => { SG.P.pos.set(x, 0, z); }, [x, z]);
  const tpl = async (p, id) => { await p.evaluate(id => { const l = SG.LM.find(l => l.id === id); SG.P.pos.set(l.fx, 0, l.fz); }, id); await p.waitForTimeout(500); };
  const st = (p, k) => p.evaluate(k => SG.save[k], k);

  const A = await mk('a');
  ok('tải trang, có thanh biểu tượng + 3 nút cử chỉ', await A.locator('#bar button').count() === 8 && await A.locator('#acts .tile').count() === 3 && /Sài Gòn Du Ký/.test(await A.title()));
  // tên có từ tục bị loại, mở màn tạo nhân vật lần đầu
  await start(A, 'đm');
  ok('tên chứa từ tục bị xoá', (await st(A, 'name')) === '');
  ok('lần đầu: mở màn tạo nhân vật', /Tạo nhân vật/.test(await A.textContent('#pt')) && await A.isVisible('#avOk'));
  const meshes = () => A.evaluate(() => { let n = 0; SG.scene.traverse(o => o.isMesh && n++); return n; });
  const m0 = await meshes();
  await A.fill('#avN', 'Minh An'); await A.click('#pb [data-k="hair"][data-v="3"]'); await A.click('#pb [data-k="hat"][data-v="2"]'); await A.click('#pb [data-k="skin"][data-v="2"]'); await A.click('#pb [data-k="top"][data-v="2"]');
  const av = await A.evaluate(() => SG.save.av); ok('lưu tuỳ chỉnh nhân vật', av.hair === 3 && av.hat === 2 && av.skin === 2 && av.top === 2 && (await st(A, 'name')) === 'Minh An', JSON.stringify(av));
  ok('mô hình 3D dựng lại (tóc bím + nón lá)', (await meshes()) !== m0);
  await A.click('#avOk'); await A.waitForTimeout(500);
  ok('xong nhân vật → hiện hướng dẫn', /Hướng dẫn 1\/3/.test(await A.textContent('#pt'))); await A.click('#pb [data-a="s"]'); await A.waitForTimeout(300);
  ok('hướng dẫn xong, bảng đóng', !(await A.evaluate(() => document.getElementById('panel').classList.contains('on'))) && await st(A, 'tutDone'));
  // đi bộ + va chạm
  const x0 = await A.evaluate(() => SG.P.pos.x); await A.keyboard.down('w'); await A.waitForFunction(x => SG.P.pos.x - x > 2.5, x0, { timeout: 30000 }).catch(() => {}); await A.keyboard.up('w');
  ok('đi bằng phím W', await A.evaluate(x => SG.P.pos.x - x, x0) > 2.5);
  await tp(A, -45, 50); await A.evaluate(() => { SG.cam.yaw = Math.PI; }); await A.keyboard.down('w'); await A.waitForFunction(() => SG.P.pos.z > 64, null, { timeout: 60000 }).catch(() => {}); await A.waitForTimeout(2500); await A.keyboard.up('w');
  const z = await A.evaluate(() => SG.P.pos.z); ok('không đi xuyên chợ Bến Thành (z=' + z.toFixed(1) + ')', z > 62 && z < 67);
  await tp(A, 176, 30); await A.evaluate(() => { SG.cam.yaw = -Math.PI / 2; }); await A.keyboard.down('w'); await A.waitForFunction(() => SG.P.pos.x > 180, null, { timeout: 40000 }).catch(() => {}); await A.waitForTimeout(1500); await A.keyboard.up('w');
  ok('không đi xuống sông ngoài bến', await A.evaluate(() => SG.P.pos.x) <= 181.1);
  // check-in
  await tpl(A, 'benthanh'); ok('đến Chợ Bến Thành: hiện nút Check-in/Tìm hiểu/Hỏi đáp', (await A.evaluate(() => SG.state().cur)) === 'benthanh' && await A.isVisible('#bCheck') && await A.isVisible('#bInfo') && await A.isVisible('#bQuiz'));
  ok('tiêu đề vị trí', /Bến Thành/.test(await A.textContent('#loc')));
  await A.click('#bCheck'); await A.waitForTimeout(300);
  ok('check-in: +60 xu, +10 điểm, mở cẩm nang', (await st(A, 'xu')) === 160 && (await st(A, 'pts')) === 10 && /Bến Thành/.test(await A.textContent('#pt')) && /1914/.test(await A.textContent('#pb')));
  ok('vòng chỉ điểm đổi sang đã đến', await A.evaluate(() => SG.W.beacons.benthanh.visited === true));
  ok('hiển thị số xu', /160/.test(await A.textContent('#cXu')));
  await A.click('#pb [data-a="qz"]'); await A.waitForTimeout(200);
  const wrong = await A.$$eval('#pb [data-i]', bs => bs.find(x => x.dataset.i !== '0').dataset.i); await A.click(`#pb [data-i="${wrong}"]`);
  ok('trả lời sai: không thưởng, báo thử lại', /Chưa đúng/.test(await A.textContent('#qm')) && (await st(A, 'xu')) === 160);
  await A.click('#pb [data-i="0"]'); await A.waitForTimeout(300);
  ok('trả lời đúng: +40 xu +5 điểm', (await st(A, 'xu')) === 200 && (await st(A, 'pts')) === 15 && await A.evaluate(() => SG.save.quiz.benthanh === 1));
  // ảnh
  await A.click('#px'); const dl = A.waitForEvent('download', { timeout: 15000 }).catch(() => null); await A.click('#bPhoto'); const d = await dl;
  ok('chụp ảnh: tạo ảnh PNG và tải về', !!d && /\.png$/.test(d.suggestedFilename()) && await A.evaluate(() => window.__lastShot && window.__lastShot.size > 20000 && /Bến Thành/.test(window.__lastShot.place)), d ? '' : 'không có tải xuống');
  ok('ảnh đầu tiên tại điểm đến: thưởng +10 xu', (await st(A, 'xu')) === 210 && (await st(A, 'photos')) === 1);
  // ẩm thực
  const cafe = await A.evaluate(() => SG.FOOD.find(f => f.id === 'cafe')); await tp(A, cafe.x, cafe.z + 3); await A.waitForTimeout(500);
  ok('đến quầy cà phê: hiện nút Thưởng thức', await A.isVisible('#bEat') && (await A.evaluate(() => SG.state().curFood)) === 'cafe');
  await A.click('#bEat'); await A.waitForTimeout(300); ok('thưởng thức: +15 xu, ghi sổ ẩm thực', (await st(A, 'xu')) === 225 && await A.evaluate(() => !!SG.save.foods.cafe) && /Cà phê/.test(await A.textContent('#pt')));
  await A.click('#px'); await A.click('#bar [data-b="food"]'); ok('Sổ ẩm thực liệt kê 7 món', await A.$$eval('#pb .li', a => a.length) === 7); await A.click('#px');
  // bản đồ + taxi
  await A.click('#bar [data-b="map"]'); await A.waitForTimeout(200);
  ok('bản đồ: có canvas và 9 địa danh', await A.isVisible('#map') && await A.$$eval('#pb .li', a => a.length) === 9);
  await A.click('#pb [data-id="bitexco"]'); await A.waitForTimeout(1000);
  const bx = await A.evaluate(() => { const l = SG.LM.find(l => l.id === 'bitexco'); return [Math.hypot(SG.P.pos.x - l.fx, SG.P.pos.z - l.fz), SG.save.xu]; });
  ok('taxi tới Bitexco: trừ 10 xu, đứng trước cổng', bx[0] < 6 && bx[1] === 215, JSON.stringify(bx));
  // ngày đêm
  // cử chỉ
  await A.click('#acts [data-e="wave"]'); ok('cử chỉ vẫy tay', (await A.evaluate(() => SG.emoteNow())) === 'wave'); await A.click('#acts [data-e="cheer"]'); ok('cử chỉ reo mừng', (await A.evaluate(() => SG.emoteNow())) === 'cheer');
  await A.keyboard.down('w'); await A.waitForTimeout(250); await A.keyboard.up('w'); ok('đi thì huỷ cử chỉ', (await A.evaluate(() => SG.emoteNow())) === '');
  // đủ 9 điểm đến → thưởng và hộ chiếu
  await A.evaluate(() => { SG.LM.forEach(l => SG.checkIn(l)); }); await A.click('#px').catch(() => {}); const xuBefore = await st(A, 'xu');
  ok('đủ 9 điểm: thưởng 300 xu', await A.evaluate(() => SG.save.bonus & 1) === 1 && Object.keys(await A.evaluate(() => SG.save.visited)).length === 9, xuBefore);
  await A.click('#bar [data-b="passport"]'); await A.waitForTimeout(200);
  ok('hộ chiếu: 9 con dấu đã đóng', await A.$$eval('#pb .stamp.on', a => a.length) === 9);
  const dl2 = A.waitForEvent('download', { timeout: 15000 }).catch(() => null); await A.click('#pb [data-a="sh"]'); const d2 = await dl2; ok('chia sẻ hộ chiếu: tải ảnh PNG', !!d2 && /ho-chieu/.test(d2.suggestedFilename())); await A.click('#px');
  ok('lưu vào localStorage', await A.evaluate(() => { const v = JSON.parse(localStorage.getItem('saigon3d_v1')); return v.name === 'Minh An' && Object.keys(v.visited).length === 9 && v.av.hair === 3; }));
  // cài đặt
  await A.click('#bar [data-b="more"]'); await A.click('#pb [data-m="set"]'); await A.click('#pb [data-t="night"]'); await A.waitForTimeout(500);
  ok('cài đặt: chọn ban đêm', await A.evaluate(() => SG.state().todH > 20 && SG.save.tod === 'night'));
  ok('ban đêm: cửa sổ nhà phát sáng', await A.evaluate(() => { let mx = 0; SG.scene.traverse(o => { if (o.isMesh && o.material && o.material.emissiveMap) mx = Math.max(mx, o.material.emissiveIntensity); }); return SG.W.night === 1 && mx > .5; }));
  await A.click('#pb [data-t="day"]'); await A.waitForTimeout(400); ok('ban ngày: cửa sổ tắt đèn', await A.evaluate(() => SG.W.night === 0)); await A.click('#pb [data-t="auto"]'); await A.click('#px');

  // ===== online: hai người chơi =====
  const B = await mk('b'); await start(B, 'Bảo'); await B.click('#avOk'); await B.waitForTimeout(300); await B.click('#pb [data-a="s"]').catch(() => {});
  await A.waitForFunction(() => SG.R.size >= 1, null, { timeout: 15000 }).catch(() => {}); await B.waitForFunction(() => SG.R.size >= 1, null, { timeout: 15000 }).catch(() => {});
  ok('online: hai người thấy nhau', await A.evaluate(() => SG.R.size) === 1 && await B.evaluate(() => SG.R.size) === 1 && /Online · 2/.test(await A.textContent('#net')));
  const pl = Object.values((hub.tree.saigon || {}).players || {}); ok('máy chủ có 2 bản ghi hiện diện hợp lệ', pl.length === 2 && pl.every(v => typeof v.x === 'number' && typeof v.av === 'string' && v.av.split(',').length === 7 && v.n));
  await tp(B, 100, 5); await A.waitForFunction(() => [...SG.R.values()][0].tx > 60, null, { timeout: 20000 }).catch(() => {}); await A.waitForTimeout(2500); const rb = await A.evaluate(() => { const r = [...SG.R.values()][0]; return [r.name, +r.pos.x.toFixed(0), +r.pos.z.toFixed(0)]; });
  ok('thấy vị trí và tên của người kia', rb[0] === 'Bảo' && Math.abs(rb[1] - 100) < 8 && Math.abs(rb[2] - 5) < 8, JSON.stringify(rb));
  await B.click('#acts [data-e="cheer"]'); await A.waitForFunction(() => [...SG.R.values()][0].e === 'cheer', null, { timeout: 5000 }).catch(() => {}); ok('thấy cử chỉ của người kia', await A.evaluate(() => [...SG.R.values()][0].e) === 'cheer');
  await A.click('#bar [data-b="friends"]'); ok('danh sách bạn bè có Bảo', /Bảo/.test(await A.textContent('#pb')) && /Đang online: 2/.test(await A.textContent('#pb'))); await A.click('#px');
  // chat
  await A.click('#bar [data-b="chat"]'); await A.fill('#chi', 'địt'); await A.click('#chf button'); ok('chat: tin có từ tục bị chặn', !(hub.tree.saigon || {}).chat);
  await A.fill('#chi', 'Chào <b>Bảo</b>!'); await A.click('#chf button'); await B.waitForFunction(() => SG.chat.length >= 1, null, { timeout: 8000 }).catch(() => {});
  ok('chat: người kia nhận được', await B.evaluate(() => SG.chat.some(m => /Chào/.test(m.t) && m.n === 'Minh An')));
  await B.click('#bar [data-b="chat"]'); ok('chat: thoát HTML (không dựng thẻ)', await B.$$eval('#chl b', a => a.length) === 1 && /<b>Bảo<\/b>/.test(await B.textContent('#chl'))); await B.click('#px'); await A.click('#px');
  // xếp hạng
  await A.waitForTimeout(3000); ok('xếp hạng: điểm được báo lên', ((hub.tree.saigon || {}).rank || {})['anon-a'] && hub.tree.saigon.rank['anon-a'].s > 100 && hub.tree.saigon.rank['anon-a'].k === 9, JSON.stringify((hub.tree.saigon || {}).rank));
  await B.click('#bar [data-b="rank"]'); await B.waitForTimeout(800); ok('bảng xếp hạng hiện người đứng đầu', /Minh An/.test(await B.textContent('#pb'))); await B.click('#px');
  // dọn bản ghi quá hạn (Rules cho phép xoá mục cũ hơn 90 giây)
  hub.tree.saigon.players.ma = { n: 'Ma', x: 0, z: 0, a: 0, e: '', av: '1,0,0,0,0,0,0', at: Date.now() - 200000 }; await hub.notify(); await A.waitForTimeout(1500);
  ok('bản ghi hiện diện quá hạn bị dọn', !hub.tree.saigon.players.ma);
  // người kia thoát → biến mất
  await B.context().close(); await A.waitForFunction(() => SG.R.size === 0, null, { timeout: 8000 }).catch(() => {}); ok('người kia thoát → biến khỏi cảnh', await A.evaluate(() => SG.R.size) === 0);
  const fr = await A.evaluate(() => SG.state().frames); await A.waitForTimeout(1500); ok('vòng lặp 3D vẫn chạy', await A.evaluate(f => SG.state().frames - f, fr) > 5);

  // ===== điện thoại: bố cục + cần ảo =====
  const M = await mk('m', { w: 390, h: 844, touch: true }); await start(M, 'Lan'); await M.click('#avOk'); await M.waitForTimeout(300); await M.click('#pb [data-a="s"]').catch(() => {});
  const lay = await M.evaluate(() => ({ ov: document.documentElement.scrollWidth - innerWidth, bar: [...document.querySelectorAll('#bar button')].map(b => b.getBoundingClientRect()).every(r => r.left >= 0 && r.right <= innerWidth && r.width >= 30), acts: document.getElementById('acts').getBoundingClientRect().right <= innerWidth }));
  ok('điện thoại: không tràn ngang, thanh biểu tượng vừa màn hình', lay.ov <= 1 && lay.bar && lay.acts, JSON.stringify(lay));
  const mx0 = await M.evaluate(() => [SG.P.pos.x, SG.P.pos.z]);
  await M.evaluate(() => { const c = document.getElementById('c'), o = { pointerId: 7, pointerType: 'touch', bubbles: true, isPrimary: true }; c.dispatchEvent(new PointerEvent('pointerdown', Object.assign({ clientX: 100, clientY: 600 }, o))); c.dispatchEvent(new PointerEvent('pointermove', Object.assign({ clientX: 100, clientY: 540 }, o))); });
  await M.waitForTimeout(1200); const mx1 = await M.evaluate(() => [SG.P.pos.x, SG.P.pos.z]); ok('điện thoại: cần ảo kéo lên → đi tới', Math.hypot(mx1[0] - mx0[0], mx1[1] - mx0[1]) > 2, JSON.stringify([mx0, mx1]));
  await M.evaluate(() => { const c = document.getElementById('c'); c.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, pointerType: 'touch', bubbles: true })); });
  await M.evaluate(() => SG.Net.fail(new Error('permission_denied'))); await M.waitForTimeout(300); ok('máy chủ từ chối (Rules chưa cập nhật) → báo chơi một mình, không giả online', /một mình/.test(await M.textContent('#net')) && !(await M.evaluate(() => SG.Net.on)));
  await M.click('#bar [data-b="passport"]'); ok('điện thoại: bảng hộ chiếu vừa màn hình', await M.evaluate(() => { const r = document.querySelector('#panel .sheet').getBoundingClientRect(); return r.right <= innerWidth + 1 && r.left >= -1; })); await M.click('#px');

  // ===== offline (không có máy chủ) =====
  const O = await mk('o', { hub: false }); await start(O, 'Một mình'); await O.click('#avOk'); await O.waitForTimeout(300); await O.click('#pb [data-a="s"]').catch(() => {}); await O.waitForTimeout(500);
  ok('offline: báo chơi một mình, game vẫn chạy', /một mình/.test(await O.textContent('#net')) && (await O.evaluate(() => SG.state().frames)) > 3);
  await O.click('#bar [data-b="chat"]'); await O.fill('#chi', 'Xin chào'); await O.click('#chf button'); ok('offline: chat chỉ hiện cho mình', await O.evaluate(() => SG.chat.length) === 1); await O.click('#px');
  await O.click('#bar [data-b="rank"]'); await O.waitForTimeout(300); ok('offline: xếp hạng báo cần kết nối', /kết nối/.test(await O.textContent('#pb'))); await O.click('#px');
  ok('không lỗi JS', errs.length === 0, errs.join(' | '));
  console.log(`\n${pass} đạt, ${fail} lỗi`); await b.close(); srv.close(); process.exit(fail ? 1 : 0);
})();
