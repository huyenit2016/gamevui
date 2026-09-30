const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs=[]; const p = await b.newPage({viewport:{width:430,height:900}});
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && !/ERR_|Failed to load/.test(m.text()) && errs.push(m.text()));
  await p.addInitScript({path:require('path').join(__dirname,'mock.js')});
  await p.goto('file://' + ROOT + '/index.html'); await p.waitForTimeout(300);
  const ids = await p.evaluate(() => GV.items.map(i => i.type + '/' + i.id)); console.log(ids.length, 'items;', 'learn:', await p.evaluate(()=>GV.items.filter(i=>i.cat==='Học tập').map(i=>i.id).join(',')));
  for (const id of ids) { await p.evaluate(h => location.hash = '#/' + h, id); await p.waitForTimeout(60); if (!await p.evaluate(() => document.querySelector('#stage').children.length)) errs.push('empty '+id); }
  await p.evaluate(()=>location.hash='#/'); await p.waitForTimeout(400);
  console.log('sections:', await p.locator('#grid .sec').allTextContents());
  await p.locator('#grid .sec').nth(1).scrollIntoViewIfNeeded(); await p.screenshot({path:'home_learn.png'});
  console.log(errs); await b.close();
})();
