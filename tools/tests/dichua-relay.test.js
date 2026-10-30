// Relay quà TikTok: chuẩn hoá sự kiện, chuỗi quà liên tiếp chỉ báo 1 lần, SSE phát cho trình duyệt (không cần thư viện TikTok).
process.env.DICHUA_NO_CONNECT = '1'; process.env.PORT = '8793';
const http = require('http'); const R = require('../dichua-relay/relay.js');
let pass = 0, fail = 0; const ok = (n, c, x) => { c ? pass++ : fail++; console.log((c ? 'OK   ' : 'FAIL ') + n + (c ? '' : ' -> ' + x)); };
const a = R.normalizeGift({ nickname: 'Lan', uniqueId: 'lan1', profilePictureUrl: 'https://p16.tiktokcdn.com/a.jpg', giftName: 'Rose', giftType: 1, repeatCount: 3, repeatEnd: true, diamondCount: 1 });
ok('chuẩn hoá quà: tên, avatar, tổng kim cương', a && a.u === 'Lan' && a.av.startsWith('https://') && a.n === 3 && a.d === 3 && a.g === 'Rose', JSON.stringify(a));
ok('quà liên tiếp đang chạy (chưa kết thúc) bị bỏ qua', R.normalizeGift({ nickname: 'Lan', giftName: 'Rose', giftType: 1, repeatCount: 2, repeatEnd: false }) === null);
ok('quà không liên tiếp báo ngay', R.normalizeGift({ nickname: 'Bo', giftName: 'Lion', giftType: 2, diamondCount: 29999 }).d === 29999);
ok('avatar http bị loại', R.normalizeGift({ nickname: 'X', giftName: 'G', profilePictureUrl: 'http://x/y.jpg' }).av === '');
R.start();
setTimeout(() => {
  let got = ''; const req = http.get('http://localhost:8793/events', res => { res.on('data', d => { got += d; }); });
  setTimeout(() => { R.broadcast({ u: 'Hà', id: 'ha', av: '', g: 'Hoa', n: 1, d: 5, at: Date.now() }); }, 300);
  setTimeout(() => { ok('SSE phát sự kiện quà cho client', /"type":"gift"/.test(got) && /"u":"Hà"/.test(got), got); req.destroy(); console.log(`\n${pass} đạt, ${fail} lỗi`); R.server.close(); process.exit(fail ? 1 : 0); }, 900);
}, 300);
