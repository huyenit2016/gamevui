// Sinh mã mở khoá bản đầy đủ cho Đà Lạt Phố Hội 3D.
//   node tools/dalat-codes.js 20        -> in 20 mã (đưa cho người mua) và cập nhật games/dalat3d/codes.json (chỉ lưu băm SHA-256)
// Lưu ý: kiểm tra mã chạy ở trình duyệt nên chỉ chống dùng chung ở mức cơ bản; muốn chắc chắn cần máy chủ/cổng thanh toán xác nhận.
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'games', 'dalat3d', 'codes.json'), n = +process.argv[2] || 10;
const cur = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { h: [] };
const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', rnd = k => Array.from(crypto.randomBytes(k), b => A[b % A.length]).join('');
for (let i = 0; i < n; i++) { const code = `DL${rnd(4)}${rnd(4)}${rnd(4)}`, h = crypto.createHash('sha256').update('dalat3d:' + code).digest('hex'); cur.h.push(h); console.log(code); }
fs.writeFileSync(file, JSON.stringify(cur) + '\n'); console.error('Đã ghi', cur.h.length, 'băm vào', file);
