const ROOT = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({viewport:{width:1100,height:900},permissions:['microphone']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/api.openverse.org/**',r=>r.fulfill({json:{results:[{id:'1',title:'Piano Dream',creator:'Tester',url:'https://example.com/a.mp3',duration:123000,license:'by',license_version:'4.0',license_url:'https://creativecommons.org/licenses/by/4.0/',foreign_landing_url:'https://example.com/p',thumbnail:''},{id:'2',title:'Lofi Night',creator:'Bob',url:'https://example.com/b.mp3',duration:200000,license:'cc0',license_version:'1.0',license_url:'',foreign_landing_url:''}]},headers:{'access-control-allow-origin':'*'}}));
await p.route('**/iptv-org.github.io/**',r=>r.fulfill({body:'#EXTM3U\n#EXTINF:-1 tvg-logo="https://x/l.png" group-title="News",VTV Test\nhttps://example.com/vtv.m3u8\n#EXTINF:-1,Bad Http\nhttp://example.com/x.m3u8\n#EXTINF:-1,Needs Header\n#EXTVLCOPT:http-referrer=https://a\nhttps://example.com/h.m3u8\n#EXTINF:-1,Kênh Hai\nhttps://example.com/two.m3u8\n',headers:{'access-control-allow-origin':'*','content-type':'text/plain'}}));
await p.route('**/example.com/**',r=>r.abort());
// music
await p.goto('file://' + ROOT + '/index.html#/tool/music');await p.waitForTimeout(1200);
console.log('music items:',await p.locator('#ls .it').count(),'status:',(await p.locator('#st').innerText()));
await p.locator('#ls .it').first().click();await p.waitForTimeout(400);console.log('now:',await p.locator('#ti').innerText(),'|',(await p.locator('#lc').innerText()).slice(0,80));
await p.screenshot({path:'md_music.png'});
// karaoke
await p.goto('file://' + ROOT + '/index.html#/tool/karaoke');await p.waitForTimeout(500);
await p.selectOption('#sg','twinkle');await p.click('#pl');await p.waitForTimeout(4500);
console.log('kara active:',await p.locator('#lyr p.on').innerText());
await p.click('#mic');await p.waitForTimeout(600);console.log('mic btn:',await p.locator('#mic').innerText(),'rec disabled:',await p.locator('#rec').isDisabled());
await p.click('#rec');await p.waitForTimeout(1500);await p.click('#rec');await p.waitForTimeout(800);console.log('rec result audio:',await p.locator('#rr audio').count(),'dl:',await p.locator('#rr a').count());
// LRC
await p.fill('#tx','[00:01.00]Dòng một\n[00:03.50]Dòng hai\n[ar:x]');await p.waitForTimeout(200);console.log('lrc lines:',await p.locator('#lyr p').count());
await p.screenshot({path:'md_karaoke.png',fullPage:true});
// tv
await p.goto('file://' + ROOT + '/index.html#/tool/tv');await p.waitForTimeout(800);
console.log('tv channels:',await p.locator('#ls .it').count(),'|',(await p.locator('#st').innerText()));
await p.locator('#ls .it').first().click();await p.waitForTimeout(800);console.log('tv status:',(await p.locator('#vs').innerText()).slice(0,60));
await p.click('#fv');console.log('fav:',await p.locator('#fv').innerText());
await p.screenshot({path:'md_tv.png',fullPage:true});
// home
await p.goto('file://' + ROOT + '/index.html');await p.waitForTimeout(500);console.log('home cards with new tools:',await p.locator('.card:has-text("Karaoke"), .card:has-text("Nghe nhạc"), .card:has-text("Xem TV")').count());
console.log(errs.join('\n')||'no page errors');await b.close()})();
