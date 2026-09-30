const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright'); const { makeHub } = require('./hub');
(async () => {
  const b = await chromium.launch(); const hub = makeHub(), errs = []; const URL = 'file://' + ROOT + '/';
  const mk = async name => { const ctx = await b.newContext({ viewport: { width: 1200, height: 900 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('console', m => m.type() === 'error' && !/ERR_|Failed to load/.test(m.text()) && errs.push(name + ': ' + m.text())); p.on('dialog', d => d.accept()); await hub.attach(p, 'anon-' + name); await p.addInitScript({ path: require('path').join(__dirname, 'mock_shared.js') }); return p; };
  const A = await mk('admin'), T = await mk('teacher'), S = await mk('student'), G = await mk('guest');
  const signup = async (p, name, email, role, secret) => { await p.goto(URL + 'cms.html'); await p.waitForSelector('[data-m=up]'); await p.click('[data-m=up]'); await p.fill('.nm', name); await p.fill('.em', email); await p.fill('.pw', '123456'); if (role) await p.selectOption('.rq', role); if (secret) await p.fill('.sc', secret); await p.click('.go'); await p.waitForSelector('.tabsx', { timeout: 8000 }); };
  // 1. admin signup + claim
  await signup(A, 'Admin Huyền', 'a@x.com', 'student', 'S3cretPhrase');
  await A.waitForTimeout(400); console.log('1) admin tabs:', await A.locator('.tabsx button').allInnerTexts().then(a => a.map(x => x.replace(/\s+/g, ' ')).join(' | ')));
  // 2. seed junk + a healthy room
  const NOW = Date.now(), old = NOW - 3 * 3600e3;
  const seed = { mprooms: { 1111: { host: 'hx', meta: { game: 'uno', name: 'Phòng cũ', status: 'lobby', createdAt: old }, players: { hx: { name: 'Bob', online: false } } }, 4444: { host: 'h4', meta: { game: 'masoi', name: 'Phòng đang chơi', status: 'playing', createdAt: NOW }, players: { h4: { name: 'Cô Lan', online: true } } } }, mplobby: { 1111: { at: old, name: 'Phòng cũ', game: 'uno' }, 4444: { at: NOW, name: 'Phòng đang chơi', game: 'masoi' }, 7777: { at: old, name: 'Mồ côi', game: 'chess' } }, calls: { 2222: { host: 'hy', hostName: 'GV Cũ', title: 'Lớp cũ', createdAt: old } }, calllobby: { 2222: { at: old } }, rooms: { 3333: { x: 1 } } };
  Object.entries(seed).forEach(([k, v]) => { hub.tree[k] = JSON.parse(JSON.stringify(v)); });
  // 3. rooms tab
  await A.click('[data-t=rooms]'); await A.waitForTimeout(1500);
  const toasts = await A.locator('.toast').allInnerTexts(); console.log('3) toasts:', toasts.map(t => t.replace(/\s+/g, ' ').slice(0, 60)).join(' || '));
  console.log('   rows:', await A.locator('.rl2 tbody tr:not(.pv)').count() - 1, '| summary:', (await A.locator('.rl2 .hint').first().innerText()).trim());
  await A.click('.cj'); await A.waitForTimeout(1500);
  console.log('   after clean -> tree keys:', JSON.stringify({ mprooms: Object.keys(hub.tree.mprooms || {}), mplobby: Object.keys(hub.tree.mplobby || {}), calls: Object.keys(hub.tree.calls || {}), calllobby: Object.keys(hub.tree.calllobby || {}), rooms: Object.keys(hub.tree.rooms || {}) }));
  // auto clean toggle
  hub.tree.mplobby['8888'] = { at: old, name: 'Rác mới', game: 'uno' }; await A.check('.au'); await A.waitForTimeout(300); await A.click('.rf'); await A.waitForTimeout(800);
  // 4. teacher + student signup
  await signup(T, 'Cô Lan', 't@x.com', 'teacher'); await signup(S, 'Minh', 's@x.com', 'student');
  console.log('4) teacher chip before approval:', (await T.locator('.card2 .tag').allInnerTexts()).join(' / ').replace(/\s+/g, ' '));
  await A.click('[data-t=users]'); await A.waitForTimeout(800); console.log('   admin sees pending:', (await A.locator('.ul').innerText()).replace(/\s+/g, ' ').slice(0, 180));
  await A.locator('button[data-a]').first().click(); await A.waitForTimeout(800);
  const uT = Object.entries(hub.tree.users).find(([, u]) => u.email === 't@x.com')[1]; console.log('   teacher role now:', uT.role, '| requested:', uT.requested);
  // 5. teacher publishes + assigns
  await T.click('.rr'); await T.waitForTimeout(1200); await T.click('[data-t=library]'); await T.waitForSelector('.ta'); console.log('   teacher tabs:', (await T.locator('.tabsx button').allInnerTexts()).map(x => x.replace(/\s+/g, ' ')).join(' | '));
  await T.fill('.ta', 'unit,term,reading,meaning\nBài 1,apple,,quả táo\nBài 1,banana,,quả chuối\nBài 1,cat,,con mèo\nBài 1,dog,,con chó'); await T.fill('.nm', 'Từ vựng động vật'); await T.click('.pb'); await T.waitForTimeout(1200);
  console.log('5) library meta:', JSON.stringify(Object.values(hub.tree.library.meta).map(m => [m.name, m.n, m.byName])), '| data stored:', Object.keys(hub.tree.library.data).length);
  await T.click('[data-t=class]'); await T.waitForTimeout(800); await T.fill('.em', 's@x.com'); await T.click('.add'); await T.waitForTimeout(800); await T.click('.as'); await T.waitForTimeout(800);
  const libId = Object.keys(hub.tree.library.meta)[0], stuUid = Object.entries(hub.tree.users).find(([, u]) => u.email === 's@x.com')[0];
  console.log('   assign written:', JSON.stringify(hub.tree.assign && hub.tree.assign[stuUid] && Object.keys(hub.tree.assign[stuUid])), 'libId ok:', !!(hub.tree.assign[stuUid] || {})[libId]);
  // 6. student receives
  await S.click('[data-t=mywork]'); await S.waitForTimeout(1000); console.log('6) tab content:', (await S.locator('#tabc').innerText()).replace(/\s+/g,' ').slice(0,200)); console.log('6) student assigned list:', (await S.locator('.as').innerText()).replace(/\s+/g, ' ').slice(0, 90));
  await S.click('[data-g]'); await S.waitForTimeout(800); console.log('   imported local courses:', await S.evaluate(() => JSON.parse(localStorage.getItem('gv_learn_courses') || '[]').map(c => c.name)));
  // 7. student studies on main site & result saved
  await S.goto(URL + 'index.html#/tool/lang'); await S.waitForTimeout(2500);
  console.log('   main site: account chip:', (await S.locator('#acct').innerText()).trim(), '| library block:', (await S.locator('.ll').innerText()).replace(/\s+/g, ' ').slice(0, 80));
  await S.click('[data-l=en]'); await S.waitForTimeout(300); await S.locator('[data-c]').filter({ hasText: 'Học' }).last().click(); await S.waitForTimeout(300);
  await S.click('[data-m=test]'); await S.selectOption('.nq', '5'); await S.click('.go');
  for (let i = 0; i < 5; i++) { if (await S.locator('.opt').count()) await S.locator('.opt').first().click(); else { await S.fill('.ti', 'x'); await S.click('.sub'); } await S.click('.nx'); }
  await S.waitForTimeout(600); console.log('   results saved:', JSON.stringify(Object.values(hub.tree.results || {}).flatMap(o => Object.values(o)).map(r => [r.c, r.ok, r.n])));
  await T.click('[data-t=class]'); await T.waitForTimeout(600); await T.click('[data-r]'); await T.waitForTimeout(800); console.log('   teacher sees results:', (await T.locator('.rs').innerText()).replace(/\s+/g, ' ').slice(0, 100));
  // 8. admin config + announcement → guest sees
  await A.click('[data-t=config]'); await A.waitForTimeout(1000);
  await A.fill('.foot', 'Câu chân trang TEST từ CMS'); await A.fill('.pill', 'PILL TEST'); await A.fill('.lead', 'Lead TEST,'); await A.fill('.grad', 'Grad TEST'); await A.fill('.hot', 'tetris, snake'); await A.fill('.off', 'sudoku'); await A.click('.sv'); await A.waitForTimeout(500);
  await A.click('[data-t=announce]'); await A.waitForTimeout(400); await A.fill('.tx', 'Bảo trì lúc 23:00 tối nay!'); await A.selectOption('.ty', 'warn'); await A.click('.sv'); await A.waitForTimeout(500);
  await G.goto(URL + 'index.html'); await G.waitForTimeout(2800);
  console.log('8) guest sees -> footer:', (await G.locator('#foot').innerText()).trim(), '| pill:', (await G.locator('#pill').innerText()).trim(), '| h1:', (await G.locator('#htitle').innerText()).trim());
  console.log('   hot rail ids start:', await G.locator('#hot .card h3').allInnerTexts().then(a => a.slice(0, 2).join(', ')), '| sudoku hidden:', (await G.locator('#grid .card h3').allInnerTexts()).includes('Sudoku') === false, '| announce:', (await G.locator('#announce').innerText()).trim().slice(0, 40), '| toast:', (await G.locator('.toast').first().innerText()).trim().slice(0, 40));
  console.log('   guest header button:', (await G.locator('#acct').innerText()).trim());
  await G.evaluate(() => { location.hash = '#/game/sudoku'; }); await G.waitForTimeout(300); console.log('   guest opens disabled game:', (await G.locator('#stage').innerText()).trim().slice(0, 50));
  await A.goto(URL + 'index.html#/game/sudoku'); await A.waitForTimeout(2500); console.log('   admin can still open it:', (await A.locator('#stage .bd').count()) > 0);
  console.log(errs); await b.close();
})();
