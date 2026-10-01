// Kiểm thử các game/tiện ích mới: mở, thao tác cơ bản, kiểm tra không lỗi JS.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], out = [];
  const p = await (await b.newContext({ viewport: { width: 430, height: 900 } })).newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/ERR_|Failed to load/.test(m.text()) && errs.push(m.text()));
  const open = async id => { await p.goto('file://' + ROOT + '/index.html#/' + id); await p.waitForTimeout(350); };
  const log = (n, v) => out.push(n + ': ' + v);
  const nonBlank = async () => p.evaluate(() => { const c = document.querySelector('canvas'); if (!c) return 'no-canvas'; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 0; i < d.length; i += 400) if (d[i] > 40 || d[i + 1] > 40 || d[i + 2] > 40) k++; return k; });

  await open('game/pong2'); await p.keyboard.down('w'); await p.waitForTimeout(500); await p.keyboard.up('w'); log('pong2 canvas px', await nonBlank());
  await open('game/goldminer'); await p.keyboard.press(' '); await p.waitForTimeout(1500); log('goldminer canvas px', await nonBlank());
  await open('game/racing'); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(1200); log('racing canvas px', await nonBlank());
  await open('game/zombie'); await p.waitForTimeout(2500); await p.locator('canvas').click({ position: { x: 200, y: 150 } }); log('zombie canvas px', await nonBlank());
  await open('game/penalty'); await p.keyboard.press(' '); await p.waitForTimeout(300); await p.keyboard.press(' '); await p.waitForTimeout(1500); log('penalty msg', await p.locator('.msg').innerText());
  await open('game/archery'); await p.locator('canvas').click({ position: { x: 100, y: 180 } }); log('archery msg', await p.locator('.msg').innerText());
  await open('game/mathrush'); const t = await p.locator('.q').innerText(); await p.locator('.opts button').first().click(); log('mathrush q', t + ' | score ' + await p.locator('.sc').innerText());
  await open('game/maze'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowDown'); log('maze canvas px', await nonBlank());
  await open('game/candyman'); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(900); log('candyman score', await p.locator('.sc').innerText());
  await open('game/colornum'); const first = p.locator('.cn [data-p]').first(); const num = await first.getAttribute('data-c'); await p.locator(`.pal [data-k="${num}"]`).click(); await first.click(); log('colornum pc', await p.locator('.pc').innerText());
  await open('game/farm'); await p.evaluate(() => localStorage.removeItem('gv_farm')); await open('game/farm'); await p.locator('.fm [data-i]').first().click(); log('farm coins', await p.locator('.co').innerText());
  await open('game/bakery'); const want = await p.locator('.want').innerText(); log('bakery want', want); await p.locator('.ing button').first().click(); log('bakery msg', await p.locator('.msg').innerText());
  await open('tool/expense'); await p.fill('.am', '50000'); await p.click('.add'); log('expense summary', (await p.locator('.sm').innerText()).replace(/\s+/g, ' '));
  await open('tool/habit'); await p.fill('.nm', 'Uống nước'); await p.click('.add'); await p.locator('.xt [data-t]:not([disabled])').first().click(); log('habit streak', (await p.locator('.ls .it span[title]').first().innerText()));
  await open('tool/loan'); log('loan out', (await p.locator('.out').innerText()).replace(/\s+/g, ' ').slice(0, 110)); await p.click('[data-m=save]'); log('save out', (await p.locator('.out').innerText()).replace(/\s+/g, ' ').slice(0, 90));
  await open('tool/metronome'); await p.click('.go'); await p.waitForTimeout(700); log('metronome btn', await p.locator('.go').innerText()); await p.click('.go');
  console.log(out.join('\n')); console.log(errs.join('\n') || 'no errors'); await b.close();
})();
