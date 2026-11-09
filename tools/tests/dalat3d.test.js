// Test Đà Lạt Phố Hội 3D (games/dalat3d): điều khiển, chợ, chế biến, bán cho khách NPC, thời tiết/giá chợ, giới hạn bản thử, mở khoá bằng mã,
// online 2 người (quầy hiện cho nhau, dời ô khi trùng, chat), điện thoại.
// Chạy: THREE_PATH=<three.module.js cục bộ> NODE_PATH=$(npm root -g) node tools/tests/dalat3d.test.js   (CDN bị chặn nên cần THREE_PATH)
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright'); const { makeHub } = require('./hub');
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const THREE = process.env.THREE_PATH || require.resolve('three/build/three.module.js');
let pass = 0, fail = 0; const ok = (n, c, x) => { c ? pass++ : fail++; console.log((c ? 'OK   ' : 'FAIL ') + n + (c ? '' : ' -> ' + x)); };
const MT = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
const CODE = 'DLTEST9999', HASH = crypto.createHash('sha256').update('dalat3d:' + CODE).digest('hex');
(async () => {
  const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', MT[path.extname(f)] || 'application/octet-stream'); r.end(d); }); }).listen(8171);
  const URL = 'http://localhost:8171/games/dalat3d/index.html', b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }), hub = makeHub(), errs = [];
  const mk = async (name, o = {}) => {
    const ctx = await b.newContext({ viewport: { width: o.w || 1200, height: o.h || 800 }, hasTouch: !!o.touch, isMobile: !!o.touch, acceptDownloads: true }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('console', m => m.type() === 'error' && !/ERR_|Failed to load|404/.test(m.text()) && errs.push(name + ': ' + m.text()));
    await p.route(/^https?:\/\/(?!localhost)/, r => r.abort()); await p.route('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js', r => r.fulfill({ path: THREE, contentType: 'text/javascript' }));
    await p.route('**/games/dalat3d/codes.json', r => r.fulfill({ json: { h: [HASH] } }));
    if (o.save) await p.addInitScript(s => localStorage.setItem('dalat3d_v1', JSON.stringify(s)), o.save);
    if (o.hub !== false) { await hub.attach(p, 'anon-' + name); await p.addInitScript({ path: path.join(__dirname, 'mock_shared.js') }); }
    await p.goto(URL); await p.waitForFunction(() => window.DL, null, { timeout: 40000 }); return p;
  };
  const start = async (p, name) => { await p.fill('#nameIn', name); await p.click('#bEnter'); await p.waitForTimeout(400); };
  const tp = async (p, x, z) => { await p.evaluate(([x, z]) => DL.P.pos.set(x, 0, z), [x, z]); await p.waitForTimeout(400); };
  const sv = (p, k) => p.evaluate(k => DL.save[k], k);
  const panel = p => p.evaluate(() => document.getElementById('panel').classList.contains('on'));
  const skipIntro = async p => { await p.click('#avOk'); await p.waitForTimeout(400); if (await panel(p)) await p.click('#pb [data-a="s"]'); await p.waitForTimeout(300); };

  const A = await mk('a');
  ok('tải trang, thanh 8 biểu tượng + 3 nút cử chỉ', await A.locator('#bar button').count() === 8 && await A.locator('#acts .tile').count() === 3 && /Đà Lạt Phố Hội/.test(await A.title()));
  await start(A, 'Quầy Mai'); ok('tên lưu + mở màn tạo nhân vật', (await sv(A, 'name')) === 'Quầy Mai' && /Tạo nhân vật/.test(await A.textContent('#pt'))); await skipIntro(A);
  ok('bảng đóng, đã vào game', !(await panel(A)) && (await A.evaluate(() => DL.state().started)));
  const m0 = await A.evaluate(() => { let n = 0; DL.scene.traverse(o => o.isMesh && n++); return n; }); ok('thế giới 3D dựng đủ (nhiều mesh)', m0 > 150, m0);
  // đi bộ
  const z0 = await A.evaluate(() => DL.P.pos.z); await A.keyboard.down('w'); await A.waitForFunction(z => Math.abs(DL.P.pos.z - z) > 1.2, z0, { timeout: 30000 }).catch(() => {}); await A.keyboard.up('w'); ok('đi bộ bằng phím W', Math.abs((await A.evaluate(() => DL.P.pos.z)) - z0) > 1.2);
  // va chạm: không chui vào đài phun nước, không ra ngoài biên
  await A.evaluate(() => DL.P.pos.set(22, 0, -8)); await A.waitForTimeout(100); await A.keyboard.down('w'); await A.waitForTimeout(300); await A.keyboard.up('w'); await tp(A, 500, 500); await A.evaluate(() => DL.W.collide(DL.P.pos));
  ok('va chạm + giới hạn bản đồ', await A.evaluate(() => Math.abs(DL.P.pos.x) <= 96 && DL.P.pos.z <= 90));
  // chợ: ở xa thì báo, đến gần mới mở
  await tp(A, 0, 10); await A.click('#bar [data-b="market"]'); ok('ở xa chợ → nhắc đi tới chợ', !(await panel(A)) && /chợ đầu mối/.test(await A.textContent('#toast')));
  await tp(A, -76, 28); await A.waitForTimeout(600); ok('đến gần chợ → hiện nút Vào chợ', await A.isVisible('#bMarket'));
  const xu0 = await sv(A, 'xu'); await A.click('#bMarket'); ok('mở chợ có giá + nút mua', /Chợ đầu mối/.test(await A.textContent('#pt')) && await A.locator('#pb [data-b="khoai"]').count() === 3);
  await A.click('#pb [data-b="khoai"][data-n="10"]'); await A.click('#pb [data-b="banh"][data-n="5"]');
  ok('mua nguyên liệu: kho tăng, xu giảm', (await A.evaluate(() => DL.save.ing.khoai)) === 10 && (await sv(A, 'xu')) < xu0 && (await A.evaluate(() => DL.save.ing.banh)) === 5);
  ok('món khoá theo cấp/bản thử không có trong chợ', await A.locator('#pb [data-b="caphe"]').count() === 0);
  // giá chợ/thời tiết đồng bộ theo thời gian, nằm trong khoảng
  const mm = await A.evaluate(async () => { const m = await import('./data.js'); const v = m.PRODUCTS.map(p => m.marketMul(p.id)); return { lo: Math.min(...v), hi: Math.max(...v), same: m.marketMul('khoai', 1e12) === m.marketMul('khoai', 1e12), w: m.weatherAt().id }; });
  ok('giá chợ trong khoảng 0.75–1.35, xác định theo thời gian', mm.lo >= .75 && mm.hi <= 1.35 && mm.same && /sun|mist|rain/.test(mm.w), JSON.stringify(mm));
  // chế biến: phải đứng gần quầy
  await A.click('#px'); await A.evaluate(() => DL.openCraft()); ok('xa quầy không chế biến được', !(await panel(A)));
  await A.click('#bar [data-b="home"]'); await A.waitForTimeout(500); ok('nút Về quầy đưa nhân vật tới quầy', await A.evaluate(async () => { const m = await import('./data.js'), p = m.PLOTS[DL.save.slot]; return Math.hypot(DL.P.pos.x - p.x, DL.P.pos.z - p.z) < 9; }));
  await A.waitForTimeout(400); ok('gần quầy → hiện nút Chế biến', await A.isVisible('#bCraft')); await A.click('#bCraft');
  ok('bảng chế biến liệt kê món có nguyên liệu', await A.locator('#pb [data-c]:not([disabled])').count() === 2);
  await A.click('#pb [data-c="khoai"]'); await A.waitForSelector('#stop'); await A.waitForTimeout(250); await A.click('#stop');
  const stock = await A.evaluate(() => DL.save.stock.khoai); ok('chế biến xong có 2 phần, có chất lượng 1–3 sao', stock && stock.n === 2 && stock.q >= 1 && stock.q <= 3 && (await A.evaluate(() => DL.save.ing.khoai)) === 8, JSON.stringify(stock));
  await A.click('#px');
  // sức chứa
  await A.evaluate(() => { DL.save.stock.banh = { n: 4, q: 2 }; }); ok('sức chứa quầy cấp 0 là 6', (await A.evaluate(() => DL.stockN())) === 6 && (await A.evaluate(() => DL.cap())) === 6);
  await A.evaluate(() => DL.craftGame(DL.PRODUCTS[1])); ok('quầy đầy → không mở trò chế biến', !(await A.locator('#stop').count()) || !(await panel(A)));
  await A.evaluate(() => { document.getElementById('px').click(); DL.save.stock.banh = { n: 0, q: 2 }; delete DL.save.stock.banh; });
  // mở quầy → khách NPC mua
  await A.click('#bOpen'); ok('mở quầy', await sv(A, 'open') && /đang mở/.test(await A.textContent('#bOpen')));
  const sold0 = await sv(A, 'sold'), xu1 = await sv(A, 'xu'); await A.evaluate(() => { DL.save.price.khoai = 8; DL.spawnCustomer(); DL.spawnCustomer(); });
  ok('khách NPC xuất hiện', (await A.evaluate(() => DL.cust.length)) >= 1);
  await A.waitForFunction(s => DL.save.sold > s, sold0, { timeout: 90000 }).catch(() => {}); const sold1 = await sv(A, 'sold');
  ok('khách mua → bán được, xu + doanh thu tăng, kho giảm', sold1 > sold0 && (await sv(A, 'xu')) > xu1 && (await sv(A, 'rev')) > 0 && (await A.evaluate(() => DL.stockN())) < 6, `${sold0}->${sold1}`);
  // khách chê đắt
  await A.evaluate(() => { DL.save.price.khoai = 999; DL.save.stock.khoai = DL.save.stock.khoai || { n: 3, q: 2 }; }); const n1 = await A.evaluate(() => DL.save.stock.khoai.n); await A.evaluate(() => { for (let i = 0; i < 4; i++) DL.spawnCustomer(); }); await A.waitForTimeout(300);
  ok('giá quá cao → khách bỏ đi không mua (kho không giảm)', (await A.evaluate(() => DL.save.stock.khoai.n)) === n1);
  // bản thử: món/quầy bị khoá
  await A.evaluate(() => { DL.save.xp = 5000; DL.save.xu = 99999; DL.save.price.khoai = 14; }); await A.click('#bar [data-b="stall"]');
  ok('bản thử: món cần bản đầy đủ hiện khoá + nút mở khoá', /Cần bản đầy đủ/.test(await A.textContent('#pb')) && await A.locator('#pb [data-a="pay"]').count() >= 1);
  await A.click('#pb [data-up="tier"]'); ok('nâng quầy cấp 1 (lều) được trong bản thử', (await sv(A, 'tier')) === 1);
  await A.click('#pb [data-up="tier"]'); ok('nâng quầy cấp 2 yêu cầu mở khoá → mở bảng mua', /Mở khoá/.test(await A.textContent('#pt')) && (await sv(A, 'tier')) === 1);
  ok('bản thử chơi một mình, chưa vào mạng', !(await A.evaluate(() => DL.Net.joined)) && /Bản thử/.test(await A.textContent('#net')));
  await A.click('#px'); await A.click('#bar [data-b="chat"]'); ok('bản thử: chat bị khoá', /bản đầy đủ/.test(await A.textContent('#pb'))); await A.click('#px');
  // mã sai / đúng
  await A.click('#bar [data-b="more"]'); await A.click('#pb [data-m="pay"]'); await A.fill('#code', 'SAI123'); await A.click('#codeOk'); await A.waitForTimeout(400); ok('mã sai bị từ chối', /không đúng/.test(await A.textContent('#codeMsg')) && !(await sv(A, 'unlock')));
  await A.fill('#code', ' dltest 9999 '); await A.click('#codeOk'); await A.waitForTimeout(600); ok('mã đúng → mở khoá bản đầy đủ', await sv(A, 'unlock') === true);
  await A.click('#bar [data-b="stall"]'); ok('sau mở khoá: hết khoá món, có huy hiệu', !/Cần bản đầy đủ/.test(await A.textContent('#pb')) && /Bản đầy đủ/.test(await A.textContent('#pb')));
  await A.click('#pb [data-up="tier"]'); ok('nâng quầy gỗ (cấp 2) sau khi mở khoá', (await sv(A, 'tier')) === 2); await A.click('#px');
  // địa danh
  await tp(A, -30, -24); await A.waitForTimeout(600); ok('đến hoa dã quỳ → nút Tìm hiểu', await A.isVisible('#bInfo')); const xu2 = await sv(A, 'xu'); await A.click('#bInfo'); ok('lần đầu ghé địa danh: +60 xu', (await sv(A, 'xu')) === xu2 + 60 && /Hoa dã quỳ/.test(await A.textContent('#pt')));
  await A.click('#px'); ok('ghi nhận địa danh đã ghé', (await A.evaluate(() => Object.keys(DL.save.seen).length)) === 1);
  // ảnh
  await A.click('#bPhoto'); await A.waitForFunction(() => window.__lastShot, null, { timeout: 20000 }).catch(() => {}); ok('chụp ảnh tạo PNG', (await A.evaluate(() => window.__lastShot && window.__lastShot.size)) > 20000);
  // cài đặt + thống kê
  await A.click('#bar [data-b="more"]'); await A.click('#pb [data-m="stat"]'); ok('thống kê hiện số phần đã bán', /phần đã bán/.test(await A.textContent('#pb'))); await A.click('#px');

  await A.context().close();
  // ===== Online 2 người (đã mở khoá) =====
  const base = { name: 'x', av: {}, unlock: true, avDone: true, tutDone: true, slot: 3, xp: 200 };
  const P1 = await mk('p1', { save: Object.assign({}, base, { name: 'Lan', slot: 3 }) }), P2 = await mk('p2', { save: Object.assign({}, base, { name: 'Hùng', slot: 3 }) });
  await start(P1, 'Lan'); await start(P2, 'Hùng');
  await P1.waitForFunction(() => DL.R.size >= 1 && [...DL.R.values()][0].stall, null, { timeout: 30000 }).catch(() => {}); await P2.waitForFunction(() => DL.R.size >= 1, null, { timeout: 30000 }).catch(() => {});
  ok('hai người thấy nhau', await P1.evaluate(() => DL.R.size) === 1 && await P2.evaluate(() => DL.R.size) === 1 && /Online/.test(await P1.textContent('#net')));
  ok('thấy quầy của người kia', await P1.evaluate(() => [...DL.R.values()][0].stall != null));
  await P1.waitForTimeout(1500); const s1 = await sv(P1, 'slot'), s2 = await sv(P2, 'slot'); ok('trùng ô quầy → một người được dời sang ô khác', s1 !== s2, s1 + ' ' + s2);
  await P1.click('#bar [data-b="chat"]'); await P1.fill('#chi', 'xin chào Đà Lạt'); await P1.press('#chi', 'Enter'); await P2.waitForFunction(() => document.getElementById('chatlog').textContent.includes('xin chào'), null, { timeout: 15000 }).catch(() => {});
  ok('chat online tới người kia', /xin chào Đà Lạt/.test(await P2.textContent('#chatlog')));
  await P1.click('#px'); await P1.evaluate(() => { DL.save.rev = 777; DL.save.xu += 0; }); await P1.evaluate(() => DL.setOpen(true)); await P2.waitForFunction(() => [...DL.R.values()][0] && [...DL.R.values()][0].open === 1, null, { timeout: 20000 }).catch(() => {});
  ok('trạng thái mở quầy đồng bộ', await P2.evaluate(() => [...DL.R.values()][0].open) === 1);
  await P1.click('#bar [data-b="rank"]'); await P1.waitForTimeout(800); ok('bảng xếp hạng mở được', /Tiểu thương/.test(await P1.textContent('#pt')));
  await P1.context().close(); await P2.context().close();
  // ===== điện thoại =====
  const M = await mk('m', { w: 390, h: 760, touch: true, hub: false, save: Object.assign({}, base, { slot: 1 }) }); await start(M, 'Mobi');
  ok('điện thoại: HUD không tràn ngang, có nút Mở quầy', await M.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1) && await M.isVisible('#bOpen'));
  ok('không có lỗi script', errs.length === 0, errs.slice(0, 4).join(' | '));
  console.log(`\n${pass} đạt, ${fail} lỗi`); await b.close(); srv.close(); process.exit(fail ? 1 : 0);
})();
