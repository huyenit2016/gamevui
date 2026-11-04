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
    await p.waitForTimeout(800); await shot('start');
    // đi bằng phím, đâm vào lư hương thì không xuyên qua
    const p0 = await p.evaluate(() => [LCA.player.pos.x, LCA.player.pos.z]);
    await p.keyboard.down('w'); await p.waitForTimeout(1500); await p.keyboard.up('w');
    const p1 = await p.evaluate(() => [LCA.player.pos.x, LCA.player.pos.z]);
    t(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > 1, 'đi được bằng phím W ' + p0.map(x => x.toFixed(1)) + ' → ' + p1.map(x => x.toFixed(1)));
    await p.evaluate(() => LCA.go(0, 14)); await p.keyboard.down('w'); await p.waitForTimeout(3500); await p.keyboard.up('w');
    const pz = await p.evaluate(() => LCA.player.pos.z); t(pz > 8.3, 'không đi xuyên lư hương (z=' + pz.toFixed(2) + ')');
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
    await spot(4.3, -14.2, 'mo');
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
    await p.evaluate(() => { LCA.cranesFly(); LCA.flight.t = 9; }); await p.waitForTimeout(500); t(await p.evaluate(() => LCA.cranes[0].visible), 'hạc bay ngang trời');
    await p.evaluate(() => LCA.skipNight()); await p.waitForTimeout(800); await shot('night');
    t(await p.evaluate(() => LCA.visitors()) > 600, 'bộ đếm người lên chùa');
    t(errs.length === 0, 'không lỗi JS ' + errs.join(' / '));
    await ctx.close();
  }
  await b.close(); srv.close();
  console.log(`\n${ok} đạt, ${bad} lỗi`); process.exit(bad ? 1 : 0);
})();
