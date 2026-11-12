// Test Cảng Đen (games/cangden): menu, vào game, di chuyển, bắn/hạ gục, nạp đạn, cắt trạm, kẻ địch bắn trả, thắng/thua, cài đặt, bloom, cảm ứng.
// Chạy: THREE_PATH=<three.module.js cục bộ> NODE_PATH=$(npm root -g) node tools/tests/cangden.test.js   (CDN bị chặn nên cần THREE_PATH; thư mục examples/jsm nằm cạnh build/)
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const THREE = process.env.THREE_PATH || require.resolve('three/build/three.module.js'), JSM = path.join(path.dirname(THREE), '..', 'examples', 'jsm');
let pass = 0, fail = 0; const ok = (n, c, x) => { c ? pass++ : fail++; console.log((c ? 'OK   ' : 'FAIL ') + n + (c ? '' : ' -> ' + x)); };
const MT = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
(async () => {
  const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', MT[path.extname(f)] || 'application/octet-stream'); r.end(d); }); }).listen(8181 + 1);
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }), errs = [];
  const mk = async (name, o = {}) => { const ctx = await b.newContext({ viewport: { width: o.w || 1100, height: o.h || 680 }, hasTouch: !!o.touch, isMobile: !!o.touch }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('console', m => m.type() === 'error' && !/ERR_|Failed to load|404/.test(m.text()) && errs.push(name + ': ' + m.text()));
    await p.route(/^https?:\/\/(?!localhost)/, r => r.abort()); await p.route('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js', r => r.fulfill({ path: THREE, contentType: 'text/javascript' }));
    await p.route('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/**', r => { const f = path.join(JSM, new URL(r.request().url()).pathname.split('/examples/jsm/')[1]); fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'text/javascript' }) : r.abort(); });
    await p.addInitScript(() => { window.__noPause = true; }); await p.goto('http://localhost:8182/games/cangden/index.html' + (o.q || '?q=low')); await p.waitForFunction(() => window.PR, null, { timeout: 60000 }); return p; };
  const st = p => p.evaluate(() => PR.state());
  const A = await mk('a');
  ok('menu hiện tiêu đề, nút Triển khai', await A.isVisible('#menu') && /Cảng Đen/.test(await A.title()) && await A.isVisible('#bGo'));
  await A.click('#bSet'); ok('mở cài đặt (độ nhạy, âm lượng, chất lượng)', await A.isVisible('#sQ') && await A.isVisible('#sSens')); await A.click('#bCtl'); ok('mở điều khiển', await A.isVisible('#pCtl'));
  await A.click('#bGo'); await A.waitForTimeout(600); let s = await st(A);
  ok('vào game: trạng thái play, HUD hiện', (await A.evaluate(() => PR.stateName)) === 'play' && await A.isVisible('#hud') && await A.isVisible('#cross'));
  ok('kẻ địch được tạo (robot + drone)', await A.evaluate(() => PR.enemies.filter(e => e.type === 'walker').length >= 6 && PR.enemies.filter(e => e.type === 'drone').length >= 4));
  ok('có vật cản container, 3 trạm điều khiển', await A.evaluate(() => PR.boxes.length > 60 && PR.RELAYS.length === 3));
  const m = await A.evaluate(() => { let n = 0; PR.scene.traverse(o => o.isMesh && n++); return n; }); ok('cảnh 3D đủ chi tiết', m > 200, m);
  // di chuyển bằng bàn phím
  const z0 = await A.evaluate(() => PR.P.z), x0 = await A.evaluate(() => PR.P.x); await A.keyboard.down('w'); await A.waitForFunction(([x, z]) => Math.hypot(PR.P.x - x, PR.P.z - z) > 1.5, [x0, z0], { timeout: 40000 }).catch(() => {}); await A.keyboard.up('w');
  ok('đi bộ bằng W', await A.evaluate(([x, z]) => Math.hypot(PR.P.x - x, PR.P.z - z) > 1.5, [x0, z0]));
  // va chạm: đứng trong container bị đẩy ra
  const bx = await A.evaluate(() => { const b = PR.boxes.find(b => b.h > 2 && b.x1 - b.x0 > 5 && b.x0 > -60 && b.x1 < 60); PR.P.x = (b.x0 + b.x1) / 2; PR.P.z = (b.z0 + b.z1) / 2; return b; }); await A.waitForTimeout(500);
  ok('va chạm: bị đẩy ra khỏi container', await A.evaluate(b => !(PR.P.x > b.x0 + .3 && PR.P.x < b.x1 - .3 && PR.P.z > b.z0 + .3 && PR.P.z < b.z1 - .3), bx));
  // bắn hạ gục: đặt 1 robot ngay trước mặt, ngắm thẳng
  await A.evaluate(() => { PR.enemies.forEach(e => { e.alert = false; }); PR.P.x = -60; PR.P.z = 40; PR.P.yaw = 0; PR.P.pitch = -.05; const e = PR.spawn('walker', -60, 30, {}); e.hp = 60; e.max = 60; e.testMe = true; e.cd = 99; window.__t = e; });
  await A.waitForTimeout(300); const a0 = await A.evaluate(() => PR.P.mag); await A.evaluate(() => { PR.keys.lmb = true; }); await A.waitForFunction(() => window.__t.dead, null, { timeout: 40000 }).catch(() => {}); await A.evaluate(() => { PR.keys.lmb = false; });
  s = await st(A); ok('bắn trúng và hạ gục robot', await A.evaluate(() => window.__t.dead) && s.kills >= 1 && s.hits >= 1 && s.shots >= 1, JSON.stringify(s));
  ok('đạn trong băng giảm khi bắn', (await A.evaluate(() => PR.P.mag)) < a0);
  // nạp đạn
  await A.evaluate(() => { PR.P.mag = 5; PR.keys.r = true; }); await A.waitForTimeout(300); await A.evaluate(() => { PR.keys.r = false; }); await A.waitForFunction(() => PR.P.mag === 30, null, { timeout: 40000 }).catch(() => {}); ok('nạp đạn đầy băng 30', (await A.evaluate(() => PR.P.mag)) === 30);
  // ngắm (chuột phải) đổi FOV
  await A.evaluate(() => { PR.keys.rmb = true; }); await A.waitForFunction(() => PR.camera.fov < 60, null, { timeout: 30000 }).catch(() => {}); ok('ngắm: FOV thu hẹp', await A.evaluate(() => PR.camera.fov < 60)); await A.evaluate(() => { PR.keys.rmb = false; });
  // kẻ địch bắn trả: đặt drone gần, chờ mất máu
  await A.evaluate(() => { PR.enemies.forEach(e => { e.dead = true; e.dt = 99; }); PR.P.hp = 100; PR.P.x = -60; PR.P.z = 40; PR.P.yaw = Math.PI; const e = PR.spawn('drone', -60, 28, { alert: true }); e.cd = .1; window.__d = e; });
  await A.waitForFunction(() => PR.P.hp < 100, null, { timeout: 60000 }).catch(() => {}); ok('drone bắn trúng làm mất máu', (await A.evaluate(() => PR.P.hp)) < 100, await A.evaluate(() => PR.P.hp));
  // cắt trạm: đứng cạnh trạm giữ E
  await A.evaluate(() => { PR.enemies.forEach(e => { e.dead = true; e.dt = 99; }); PR.P.hp = 100; const r = PR.RELAYS[0]; PR.P.x = r.x + 2; PR.P.z = r.z + 2; PR.P.vx = PR.P.vz = 0; });
  await A.evaluate(() => { PR.keys.e = true; }); await A.waitForFunction(() => PR.RELAYS[0].prog > .5 || PR.RELAYS[0].cut, null, { timeout: 60000 }).catch(() => {}); const pr = await A.evaluate(() => PR.RELAYS[0].prog); ok('giữ E làm tiến độ cắt tăng', pr > .5 || (await A.evaluate(() => PR.RELAYS[0].cut)), pr);
  await A.evaluate(() => { PR.keys.e = false; PR.cutRelay(PR.RELAYS[0].cut ? PR.RELAYS[1] : PR.RELAYS[0]); }); s = await st(A); ok('cắt xong trạm → đếm + quân tiếp viện', s.relaysCut >= 1 && await A.evaluate(() => PR.enemies.some(e => !e.dead && e.alert)), JSON.stringify(s));
  ok('HUD cập nhật nhiệm vụ', /trạm điều khiển 1\/3|trạm điều khiển 2\/3/.test(await A.textContent('#objT')));
  // chưa đủ trạm thì không thắng ở tàu
  await A.evaluate(() => { PR.P.x = 82; PR.P.z = -33; }); await A.waitForTimeout(500); ok('chưa cắt đủ 3 trạm thì ra tàu chưa thắng', (await A.evaluate(() => PR.stateName)) === 'play');
  await A.evaluate(() => { PR.RELAYS.forEach(r => { if (!r.cut) PR.cutRelay(r); }); PR.P.x = 60; PR.P.z = -33; }); await A.waitForTimeout(300); ok('cắt đủ 3 trạm → hiện lời nhắc chạy ra tàu', /tàu/.test(await A.textContent('#objT')));
  await A.evaluate(() => { PR.enemies.forEach(e => { e.dead = true; e.dt = 99; }); PR.P.x = 82; PR.P.z = -33; }); await A.waitForFunction(() => PR.stateName === 'win', null, { timeout: 30000 }).catch(() => {});
  ok('tới tàu sau khi cắt đủ → thắng, hiện kết quả', (await A.evaluate(() => PR.stateName)) === 'win' && await A.isVisible('#over') && /Thoát được/.test(await A.textContent('#oT')) && /Hạ gục/.test(await A.textContent('#stats')));
  ok('lưu kỷ lục thời gian', await A.evaluate(() => PR.cfg.best > 0));
  await A.screenshot({ path: process.env.SHOT_WIN || '/tmp/cangden-win.png' });
  // chơi lại + thua
  await A.click('#bAgain'); await A.waitForTimeout(400); ok('chơi lại: reset trạm/kẻ địch', (await st(A)).relaysCut === 0 && (await A.evaluate(() => PR.enemies.length)) >= 12);
  await A.evaluate(() => PR.hurtP(500)); await A.waitForTimeout(300); ok('hết máu → thua, hiện màn kết quả', (await A.evaluate(() => PR.stateName)) === 'dead' && /Thất bại/.test(await A.textContent('#oT')));
  // ảnh trong game
  await A.click('#bAgain'); await A.waitForTimeout(2500); await A.evaluate(() => { PR.enemies.forEach(e => e.alert = false); PR.P.yaw = -1.9; PR.P.pitch = -.05; }); await A.waitForTimeout(1500); await A.screenshot({ path: process.env.SHOT || '/tmp/cangden.png' });
  await A.context().close();
  // chất lượng cao: bloom
  const H = await mk('h', { q: '?q=high' }); await H.waitForFunction(() => PR.state().comp, null, { timeout: 20000 }).catch(() => {}); ok('chất lượng cao: bật bloom (composer)', (await st(H)).comp); await H.click('#bGo'); await H.waitForTimeout(3000); ok('chất lượng cao vẫn chạy khung hình', (await st(H)).frames > 3); await H.screenshot({ path: process.env.SHOT_HI || '/tmp/cangden-hi.png' }); await H.context().close();
  // điện thoại
  const M = await mk('m', { touch: true, w: 740, h: 360 }); await M.click('#bGo'); await M.waitForTimeout(800);
  ok('điện thoại: có nút Bắn/Ngắm/Nạp/Nhảy/Cúi', await M.isVisible('#bF') && await M.isVisible('#bA') && await M.isVisible('#bR') && await M.isVisible('#bJ') && await M.isVisible('#bC'));
  await M.evaluate(() => { const b = document.getElementById('bF'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 5 })); }); await M.waitForFunction(() => PR.state().shots > 0, null, { timeout: 30000 }).catch(() => {}); await M.evaluate(() => document.getElementById('bF').dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 5 })));
  ok('điện thoại: nút Bắn khai hoả', (await st(M)).shots > 0); await M.evaluate(() => { const r = PR.RELAYS[1]; PR.P.x = r.x + 2; PR.P.z = r.z + 2; }); await M.waitForTimeout(500); ok('điện thoại: gần trạm hiện nút Cắt', await M.isVisible('#bE'));
  ok('không có lỗi script', errs.length === 0, errs.slice(0, 4).join(' | '));
  console.log(`\n${pass} đạt, ${fail} lỗi`); await b.close(); srv.close(); process.exit(fail ? 1 : 0);
})();
