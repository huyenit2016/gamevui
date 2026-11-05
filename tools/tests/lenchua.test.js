// Test game 3D Lên Chùa Cầu An (games/lenchua). three.js lấy từ biến THREE_PATH (CDN bị chặn trong môi trường test).
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const THREE = process.env.THREE_PATH || require.resolve('three/build/three.module.js');
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); r.end(d); }); }).listen(8151);
let ok = 0, bad = 0; const t = (c, m) => { c ? ok++ : bad++; console.log((c ? '✓ ' : '✗ ') + m); };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const vp of [{ width: 390, height: 844, hasTouch: true, isMobile: true }, { width: 1280, height: 800 }]) {
    console.log('— khung', vp.width + 'x' + vp.height);
    const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: !!vp.hasTouch, isMobile: !!vp.isMobile, acceptDownloads: true });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/ERR_FAILED/.test(m.text()) && errs.push(m.text())); p.on('requestfailed', r => !/fonts\.(googleapis|gstatic)/.test(r.url()) && errs.push('tải lỗi ' + r.url()));
    await p.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await p.route('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js', r => r.fulfill({ path: THREE, contentType: 'text/javascript' }));
    await p.goto('http://localhost:8151/games/lenchua/index.html');
    await p.waitForFunction(() => window.LCA, null, { timeout: 15000 });
    t(true, 'nạp xong, có window.LCA');
    await p.screenshot({ path: process.env.SHOT_DIR ? process.env.SHOT_DIR + '/lc-splash-' + vp.width + '.png' : '/dev/null' }).catch(() => {});
    console.log(await p.evaluate(() => [...document.querySelectorAll('button')].filter(x => x.offsetParent).map(x => x.id + ':' + x.textContent.trim().slice(0, 20)).join(' | ')));
    const W = vp.width, shot = n => process.env.SHOT_DIR && p.screenshot({ path: process.env.SHOT_DIR + '/lc-' + n + '-' + W + '.png' });
    await p.fill('#nameIn', 'Minh An'); await p.click('#bEnter'); await p.waitForTimeout(600);
    t(await p.isVisible('#tut'), 'hiện hướng dẫn 3 bước');
    await p.click('#tNext'); await p.click('#tNext'); await p.click('#tNext');
    t(!(await p.isVisible('#tut')), 'xong hướng dẫn');
    // tạo nhân vật lần đầu
    t(await p.isVisible('#pc #avOk') && /Tạo nhân vật/.test(await p.textContent('#pc h2')), 'mở màn tạo nhân vật sau hướng dẫn');
    const meshes = () => p.evaluate(() => { let n = 0; LCA.player && LCA.rig.hips.parent.traverse(o => o.isMesh && n++); return n; });
    const m0 = await meshes();
    await p.click('#pc [data-k="g"][data-v="nu"]'); await p.click('#pc [data-k="hair"][data-v="dai"]'); await p.click('#pc [data-k="face"][data-v="cuoi"]');
    await p.click('#pc [data-k="skin"][data-v="2"]'); await p.click('#pc [data-k="bag"]'); await p.fill('#avPhap', 'Diệu Tâm');
    const av = await p.evaluate(() => JSON.parse(localStorage.getItem('lenchuacauan_v1')).av);
    t(av.g === 'nu' && av.hair === 'dai' && av.face === 'cuoi' && av.skin === 2 && av.bag === 1 && av.phap === 'Diệu Tâm', 'lưu tuỳ chỉnh nhân vật ' + JSON.stringify(av));
    t((await meshes()) !== m0, 'mô hình 3D dựng lại theo tuỳ chỉnh');
    await p.click('#pc [data-k="g"][data-v="db"]'); t(/quản trị/.test(await p.textContent('#pc')), 'nhân vật đặc biệt bị khoá khi chưa được cấp vai trò');
    await p.click('#pc [data-k="g"][data-v="nu"]');
    if (process.env.SHOT_DIR) await shot('avatar');
    await p.click('#avOk'); await p.waitForTimeout(300);
    t(/Diệu Tâm/.test(await p.textContent('#plate')), 'bảng tên có pháp danh: ' + (await p.textContent('#plate')));
    await p.waitForTimeout(800); await shot('start');
    // đi bằng phím, đâm vào lư hương thì không xuyên qua
    const p0 = await p.evaluate(() => [LCA.player.pos.x, LCA.player.pos.z]);
    await p.keyboard.down('w'); await p.waitForTimeout(1500); await p.keyboard.up('w');
    const p1 = await p.evaluate(() => [LCA.player.pos.x, LCA.player.pos.z]);
    t(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > 1, 'đi được bằng phím W ' + p0.map(x => x.toFixed(1)) + ' → ' + p1.map(x => x.toFixed(1)));
    await p.evaluate(() => LCA.go(0, 14)); await p.keyboard.down('w'); await p.waitForTimeout(3500); await p.keyboard.up('w');
    const pz = await p.evaluate(() => LCA.player.pos.z); await p.evaluate(() => LCA.go(0, -15.2)); await p.waitForTimeout(2000); await shot('hall'); t(pz > 8.3, 'không đi xuyên lư hương (z=' + pz.toFixed(2) + ')');
    // tới từng điểm → nút hành động
    const spot = async (x, z, name) => { await p.evaluate(([x, z]) => LCA.go(x, z), [x, z]); await p.waitForTimeout(300); const id = await p.evaluate(() => LCA.current()); t(id === name && await p.isVisible('#act'), 'nút hành động ở ' + name + ' (' + id + ')'); if (id === name) await p.click('#act'); await p.waitForTimeout(200); };
    // 1. thắp hương
    await spot(0, 11, 'incense'); await p.click('#pc [data-n="3"]'); await p.waitForTimeout(2500);
    t(await p.evaluate(() => LCA.player.bow > .05 || LCA.player.pray > .5), 'nhân vật chắp tay / lạy'); await p.waitForTimeout(3600);
    t(await p.evaluate(() => LCA.bloomS.t >= 0), 'thắp hương xong: sen vàng nở'); await p.waitForTimeout(1200); await shot('lotus');
    t(await p.evaluate(() => LCA.save.incense) >= 1, 'thắp 3 nén hương, đếm lần thắp'); await shot('incense');
    // 2. chuông
    await spot(16, -10.5, 'bell'); for (let i = 0; i < 3; i++) { await p.click('#bg'); await p.waitForTimeout(500); }
    t((await p.textContent('#bj')).trim().length > 2, 'thỉnh chuông có lời chấm: ' + await p.textContent('#bj')); await p.click('#bx');
    // 3. mõ: gõ đúng nhịp theo đồng hồ âm thanh
    await spot(9.4, -15.6, 'mo');
    if (await p.isVisible('#mg')) {
      const tap = () => p.evaluate(() => { const c = document.getElementById('mg'); if (c) c.dispatchEvent(new PointerEvent('pointerdown')); });
      await tap(); for (let i = 0; i < 8; i++) { await p.waitForTimeout(720); await tap(); }
      const j = await p.evaluate(() => (document.getElementById('mj') || {}).textContent); if (await p.$('#mx')) await p.click('#mx'); await p.waitForTimeout(200);
      const sc = await p.textContent('#pc .big').catch(() => null); t(sc !== null && /^\d+$/.test(sc.trim()), 'gõ mõ ra điểm Tâm an ' + sc + ' (nhịp cuối: ' + j + ')'); await shot('mo'); await p.click('#mok');
    }
    // 4. lời cầu: từ tục bị chặn, lời lành treo lên cây
    await spot(-15, 7.5, 'wish'); await p.fill('#wt', 'đồ chó má'); await p.fill('#wt', 'mẹ mày'); await p.click('#wok');
    t((await p.textContent('#we')).length > 5, 'bộ lọc từ tục chặn lời không phù hợp');
    await p.fill('#wt', 'Con xin cầu cho cha mẹ mạnh khoẻ'); await p.click('#wok');
    t(await p.evaluate(() => LCA.save.wishes.length) === 1 && await p.evaluate(() => LCA.rib.some(r => r.mine)), 'treo dải lụa đỏ trên cây bồ đề');
    await p.waitForTimeout(1300); const bl = await p.textContent('#blessT'); t(await p.evaluate(() => document.getElementById('bless').classList.contains('on')) && /khoẻ/.test(bl), 'lời chúc theo chủ đề sức khoẻ: ' + bl); await shot('bless'); await p.click('#bless');
    t(await p.evaluate(() => /thi|kiến thức/.test(LCA.blessingFor('Con xin cầu thi đỗ đại học')) ), 'lời chúc chủ đề thi cử');
    await spot(9.2, 7, 'wish'); await p.click('#pc [data-p="pond"]'); await p.click('#pc .chip'); await p.click('#wok');
    t(await p.evaluate(() => LCA.hd.some(h => h.mine)), 'thả đèn hoa đăng trên hồ'); await p.waitForTimeout(400); await shot('pond');
    // 5. xin quẻ
    await spot(-6, -6.6, 'que'); await p.dispatchEvent('#qh', 'pointerdown'); await p.waitForTimeout(1900); await p.dispatchEvent('#qh', 'pointerup');
    t(await p.isVisible('#pc .slip') && /giải trí/.test(await p.textContent('#pc')), 'xin quẻ ra thẻ, có ghi "Mang tính giải trí"'); await shot('que'); await p.click('#qok');
    // sổ + chia sẻ
    await p.click('#bBook'); t(/cha mẹ mạnh khoẻ/.test(await p.textContent('#pc')), 'Sổ cầu an có lời cầu'); await p.click('#bkx');
    const dl = p.waitForEvent('download', { timeout: 8000 }).catch(() => null); await p.click('#bShare'); const d = await dl;
    const sz = await p.evaluate(() => window.__lastShare && window.__lastShare.size); t(sz > 20000 && !!d, 'chia sẻ: tạo ảnh ' + sz + ' byte, tải xuống ' + (d && d.suggestedFilename()));
    if (d && process.env.SHOT_DIR) await d.saveAs(process.env.SHOT_DIR + '/lc-share-' + W + '.png');
    // lưu lại & ban đêm
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem('lenchuacauan_v1'))); t(st.name === 'Minh An' && st.incense >= 1 && st.fortunes.length === 1, 'đã lưu localStorage');
    // hệ thống hành động 3D
    await p.click('#bActs'); t(await p.$$eval('#pc .atile', a => a.length) === 11, 'menu Hành động có đủ 11 hành động'); await p.click('#pc .atile[data-act="lay"]');
    await p.waitForTimeout(3200); const ly = await p.evaluate(() => [LCA.Act.id, LCA.pose.y.toFixed(2), LCA.pose.tor.toFixed(2)]);
    t(ly[0] === 'lay' && +ly[1] < -.15, 'lạy Phật: quỳ xuống/cúi lạy ' + ly);
    await p.waitForFunction(() => !LCA.Act.id, null, { timeout: 20000 }).catch(() => {}); t(await p.evaluate(() => LCA.save.stats.lay === 1), 'lạy đủ 3 lạy, ghi vào sổ');
    await p.evaluate(() => LCA.startAction('thien')); await p.waitForTimeout(2500);
    t(await p.evaluate(() => LCA.Act.id === 'thien' && LCA.rig.L.h.rotation.x < -1 && document.getElementById('actbar').classList.contains('on')), 'ngồi thiền kiết già + thanh thời gian');
    await p.click('#abStop'); await p.waitForTimeout(400); t(await p.evaluate(() => !LCA.Act.id && LCA.save.stats.thien >= 2), 'dừng thiền, cộng thời gian thiền');
    await p.evaluate(() => LCA.startAction('niem')); await p.waitForTimeout(6000);
    t(await p.evaluate(() => LCA.Act.count >= 1 && LCA.rig.handBeads.visible) && /Nam mô/.test(await p.textContent('#pbub')), 'niệm Phật: lần chuỗi + câu niệm');
    await p.keyboard.down('s'); await p.waitForTimeout(400); await p.keyboard.up('s'); t(await p.evaluate(() => !LCA.Act.id && LCA.save.stats.niem >= 1), 'tự đi bằng phím thì dừng niệm Phật');
    await p.evaluate(() => LCA.startAction('chao')); await p.waitForTimeout(800); t(await p.evaluate(() => LCA.Act.id === 'chao' && LCA.pose.tor > .2), 'chắp tay chào (cúi người)');
    await p.waitForFunction(() => !LCA.Act.id, null, { timeout: 10000 }).catch(() => {});
    await p.evaluate(() => LCA.go(0, -15.7)); await p.waitForTimeout(400); await p.evaluate(() => LCA.startAction('hoa')); await p.waitForTimeout(2200);
    t(await p.evaluate(() => LCA.rig.flower.visible), 'dâng hoa: cầm hoa sen nâng lên'); if (process.env.SHOT_DIR) await shot('offer');
    await p.waitForFunction(() => !LCA.Act.id, null, { timeout: 15000 }).catch(() => {}); t(await p.evaluate(() => LCA.altarFlowers.some(f => f.visible) && LCA.save.stats.hoa === 1), 'hoa sen hiện trên bàn thờ');
    await p.evaluate(() => LCA.startAction('nghe')); await p.waitForFunction(() => LCA.Act.id === 'nghe', null, { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(1500);
    t(await p.evaluate(() => LCA.Act.id === 'nghe') && /\S/.test(await p.textContent('#capT')), 'ngồi nghe pháp trên bồ đoàn, có lời nhắc: ' + (await p.textContent('#capT')).slice(0, 40)); if (process.env.SHOT_DIR) await shot('nghe');
    await p.click('#abStop');
    await p.evaluate(() => LCA.go(0, 14.2)); await p.waitForTimeout(300); await p.evaluate(() => LCA.startAction('kinh')); await p.waitForTimeout(3000);
    const kh = await p.evaluate(() => [LCA.Act.id, Math.hypot(LCA.player.pos.x, LCA.player.pos.z - 8).toFixed(2)]); t(kh[0] === 'kinh' && Math.abs(kh[1] - 5.6) < 1.5, 'đi kinh hành quanh lư hương ' + kh); await p.click('#abStop');
    await p.evaluate(() => LCA.go(8, 3)); await p.waitForTimeout(300); await p.evaluate(() => LCA.startAction('hoadang'));
    await p.waitForSelector('#pc #wt', { timeout: 30000 }).catch(() => {}); t(await p.isVisible('#pc #wt') && await p.evaluate(() => document.querySelector('#pc .seg [data-p="pond"]').classList.contains('on')), 'thả hoa đăng: tự đi ra hồ, quỳ rồi mở lời cầu (đã chọn hồ sen)');
    await p.fill('#wt', 'Cầu cho mọi người bình an'); await p.click('#wok'); await p.waitForTimeout(400);
    await p.evaluate(() => LCA.go(0, 12)); await p.waitForTimeout(300); await p.evaluate(() => LCA.startAction('nhang')); await p.waitForSelector('#pc [data-n="1"]', { timeout: 30000 }).catch(() => {});
    t(await p.isVisible('#pc [data-n="1"]'), 'đốt nhang: mở bảng thắp hương'); await p.click('#pc [data-n="1"]'); await p.waitForFunction(() => !LCA.player.busy, null, { timeout: 15000 }).catch(() => {});
    await p.evaluate(() => LCA.go(14, -9)); await p.waitForTimeout(300); await p.evaluate(() => LCA.startAction('chuong')); await p.waitForSelector('#pc #bg', { timeout: 30000 }).catch(() => {}); t(await p.isVisible('#pc #bg'), 'thỉnh chuông qua menu hành động'); await p.click('#bx');
    await p.evaluate(() => LCA.go(9.4, -15)); await p.waitForTimeout(300); await p.evaluate(() => LCA.startAction('mo')); await p.waitForSelector('#pc #mg', { timeout: 30000 }).catch(() => {}); t(await p.isVisible('#pc #mg'), 'gõ mõ qua menu hành động'); await p.click('#mx');
    await p.click('#bBook'); t(/lần lạy Phật/.test(await p.textContent('#pc')) && /Diệu Tâm/.test(await p.textContent('#pc')), 'Sổ cầu an có thống kê hành động và pháp danh'); await p.click('#bkx');
    await p.evaluate(() => { LCA.cranesFly(); LCA.flight.t = 9; }); await p.waitForTimeout(500); t(await p.evaluate(() => LCA.cranes[0].visible), 'hạc bay ngang trời');
    await p.evaluate(() => LCA.skipNight()); await p.waitForTimeout(800); await shot('night');
    t(await p.evaluate(() => LCA.visitors()) > 600, 'bộ đếm người lên chùa');
    t(errs.length === 0, 'không lỗi JS ' + errs.join(' / '));
    await ctx.close();
  }
  await b.close(); srv.close();
  console.log(`\n${ok} đạt, ${bad} lỗi`); process.exit(bad ? 1 : 0);
})();
