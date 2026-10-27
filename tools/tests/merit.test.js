// Trang Tích đức (accumulating-merit): menu riêng, gõ mõ, chuỗi, cảnh giới, lịch âm, quẻ, vườn, thiệp, lưu.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
let pass = 0, fail = 0; const ok = (n, c, x) => { c ? pass++ : fail++; console.log((c ? 'OK   ' : 'FAIL ') + n + (c ? '' : ' -> ' + x)); };
(async () => {
  const b = await chromium.launch(), errs = [], ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }), p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/ERR_|Failed to load/.test(m.text()) && errs.push(m.text())); p.on('dialog', d => d.accept());
  await p.goto('file://' + ROOT + '/index.html'); await p.waitForTimeout(500);
  ok('menu thanh bên là TV Online (Tích đức đã bỏ khỏi menu)', await p.locator('#rail a[href="#/tool/tv"]').count() === 1 && await p.locator('#rail a[href="#/tool/accumulating-merit"]').count() === 0);
  await p.goto('file://' + ROOT + '/index.html#/tool/accumulating-merit'); await p.waitForSelector('.mr .main'); await p.waitForTimeout(300);
  ok('mở đúng trang #/tool/accumulating-merit', /accumulating-merit/.test(p.url()) && await p.locator('.mr h1').innerText() === 'Mỗi nhịp gõ, một niềm an.');
  ok('có lịch âm hôm nay + giờ hoàng đạo', /Âm lịch: \d+ tháng \d+ năm/.test(await p.locator('.mr .cal').innerText()) && /Giờ hoàng đạo: .*\(\d+h/.test(await p.locator('.mr .hr').innerText()));
  ok('9 mốc hành trình, mốc 1 là hiện tại', await p.locator('.mr .ms').count() === 9 && await p.locator('.mr .ms.cur').count() === 1);
  const m0 = await p.evaluate(() => GV.mrT.D.tot); await p.click('.mr .tap'); await p.waitForTimeout(100);
  ok('Gõ mõ tích đức: +công đức, chuỗi = 1 ngày', await p.evaluate(() => GV.mrT.D.tot) > m0 && await p.evaluate(() => GV.mrT.D.streak) === 1 && (await p.locator('.v-s').innerText()).trim() === '1 ngày', await p.locator('.v-s').innerText());
  await p.click('.mr .mrh'); await p.keyboard.press('Space'); ok('Space gõ mõ', await p.evaluate(() => GV.mrT.D.taps) === 2, await p.evaluate(() => GV.mrT.D.taps));
  await p.evaluate(() => { GV.mrT.D.tot = 1280; }); await p.click('.mr .tap'); await p.waitForTimeout(100);
  ok('1.280 công đức → Tĩnh tâm, tiến độ x / 2.000', (await p.locator('.v-r').innerText()).trim() === 'Tĩnh tâm' && /2\.000/.test(await p.locator('.v-pg').innerText()), await p.locator('.v-pg').innerText());
  // chuỗi liên tiếp / mất chuỗi
  await p.evaluate(() => { const d = new Date(); d.setDate(d.getDate() - 1); const k = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); const s = JSON.parse(localStorage.getItem('gv_merit')); s.last = k; s.streak = 6; localStorage.setItem('gv_merit', JSON.stringify(s)); });
  await p.reload(); await p.waitForSelector('.mr .tap'); await p.click('.mr .tap'); ok('hôm qua có gõ → chuỗi tăng 7', await p.evaluate(() => GV.mrT.D.streak) === 7);
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('gv_merit')); s.last = '2020-1-1'; s.streak = 9; localStorage.setItem('gv_merit', JSON.stringify(s)); }); await p.reload(); await p.waitForSelector('.mr .tap'); ok('bỏ qua nhiều ngày → mất chuỗi', await p.evaluate(() => GV.mrT.D.streak) === 0);
  // các tab
  await p.click('nav [data-v=que]'); await p.click('.gq'); ok('gieo quẻ 1 lần/ngày', await p.locator('.gq').isDisabled());
  await p.click('nav [data-v=garden]'); await p.click('.wt'); ok('tưới vườn +15 và khoá trong ngày', await p.locator('.wt').isDisabled());
  await p.click('nav [data-v=rank]'); ok('thành tích có biểu đồ 7 ngày', await p.locator('.chart > div').count() === 7);
  await p.click('nav [data-v=about]'); ok('giới thiệu', /điểm ảo/.test(await p.locator('.mrp').innerText()));
  // thiệp
  await p.click('nav [data-v=home]'); await p.click('h3 .mk'); await p.waitForSelector('.modal.on canvas'); await p.fill('.modal .to', 'Mẹ');
  const px = await p.evaluate(() => { const c = document.querySelector('.modal canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 64) if (d[i + 1] < 120) n++; return n; }); ok('thiệp có vẽ chữ/viền', px > 100, px);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('.modal .dl')]); ok('tải ảnh thiệp PNG', dl.suggestedFilename() === 'thiep-hoi-huong.png');
  await p.click('.modal .cl');
  // mobile: thanh dưới đã bỏ Tích đức (chủ yêu cầu)
  await p.setViewportSize({ width: 390, height: 780 }); await p.goto('file://' + ROOT + '/index.html'); await p.waitForTimeout(300); ok('thanh dưới điện thoại không còn Tích đức', await p.locator('#bnav a[href="#/tool/accumulating-merit"]').count() === 0);
  console.log(errs.join('\n') || 'không có lỗi JS'); console.log(`\n${pass} đạt, ${fail} lỗi`); await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();
