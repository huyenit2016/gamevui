// Chuồng trại: cảnh canvas có vật nuôi, chạm con vật có bong bóng để cho ăn / thu hoạch.
const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errs = [], p = await (await b.newContext({ viewport: { width: 430, height: 900 } })).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + ROOT + '/index.html#/game/avatarfarm'); await p.evaluate(() => localStorage.removeItem('gv_avfarm')); await p.reload(); await p.waitForTimeout(400);
  await p.evaluate(() => { const S = GV.townT.S; S.coins = 1000; S.lv = 8; S.pens = [{ a: 'hen', fed: 0 }, { a: 'cow', fed: Date.now() - 1e7 }]; GV.townT.save(); });
  await p.click('[data-t=barn]'); await p.waitForTimeout(600);
  const px = await p.evaluate(() => { const c = document.querySelector('canvas.bsc'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 0; i < d.length; i += 40) if (d[i + 3] > 200) k++; return k; });
  console.log('canvas px:', px, '| ảnh con vật ở thẻ:', await p.locator('.tw img').count());
  const tapAnimal = async kindIdx => { const bb = await p.locator('canvas.bsc').boundingBox(); const pos = await p.evaluate(i => ({ x: 0 }), 0); void pos; return bb; };
  // chạm trung tâm chuồng gia súc nhiều điểm đến khi bò được thu hoạch (sữa vào kho)
  const bb = await p.locator('canvas.bsc').boundingBox(), sc = bb.width / 420;
  for (let y = 110; y <= 215 && !(await p.evaluate(() => GV.townT.S.inv['🥛Sữa tươi'])); y += 8) for (let x = 205; x <= 395; x += 12) { await p.mouse.click(bb.x + x * sc, bb.y + y * sc); if (await p.evaluate(() => GV.townT.S.inv['🥛Sữa tươi'])) break; }
  console.log('thu hoạch sữa bằng chạm vào bò:', await p.evaluate(() => GV.townT.S.inv['🥛Sữa tươi'] || 0));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
