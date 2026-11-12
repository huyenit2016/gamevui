// Đà Lạt Phố Hội 3D: dữ liệu trò chơi (món hàng, cấp quầy, địa danh, thời tiết, cấu hình mua bản đầy đủ).
export { dirty } from '../saigon3d/data.js';
// Món hàng: cost = giá nguyên liệu gốc, price = giá bán tham chiếu, hot = bán chạy khi trời lạnh/mưa, cold = bán chạy khi nắng. free = có trong bản thử.
export const PRODUCTS = [
  { id: 'khoai', n: 'Khoai lang nướng', ic: '🍠', cost: 5, price: 14, hot: 1, lv: 1, free: 1, kw: ['khoai', '🍠'] },
  { id: 'banh', n: 'Bánh tráng nướng', ic: '🫓', cost: 6, price: 16, hot: 1, lv: 1, free: 1, kw: ['banh', '🫓'] },
  { id: 'sua', n: 'Sữa đậu nành nóng', ic: '🥛', cost: 4, price: 11, hot: 1, lv: 1, free: 1, kw: ['sua', 'dau nanh', '🥛'] },
  { id: 'caphe', n: 'Cà phê Cầu Đất', ic: '☕', cost: 8, price: 22, hot: 1, lv: 2, kw: ['ca phe', 'caphe', 'cafe', 'coffee', '☕'] },
  { id: 'dau', n: 'Dâu tây Đà Lạt', ic: '🍓', cost: 10, price: 26, cold: 1, lv: 2, kw: ['dau', '🍓'] },
  { id: 'atiso', n: 'Trà atiso', ic: '🍵', cost: 5, price: 13, lv: 3, kw: ['atiso', 'tra', '🍵'] },
  { id: 'kem', n: 'Kem bơ', ic: '🍦', cost: 9, price: 24, cold: 1, lv: 3, kw: ['kem', '🍦'] },
  { id: 'mut', n: 'Mứt dâu hộp', ic: '🍯', cost: 12, price: 30, lv: 4, kw: ['mut', '🍯'] }
];
// Cấp quầy (cap = số phần tối đa trong quầy, rate = tốc độ khách đến)
export const TIERS = [
  { n: 'Xe đẩy', cost: 0, cap: 6, rate: 1, ic: '🛒', free: 1 },
  { n: 'Lều mái sọc', cost: 400, cap: 12, rate: 1.4, ic: '⛺', free: 1 },
  { n: 'Quầy gỗ', cost: 1800, cap: 22, rate: 2, ic: '🛖' },
  { n: 'Tiệm nhỏ', cost: 6000, cap: 40, rate: 3, ic: '🏠' }
];
export const DECOR = [
  { id: 'lan', n: 'Đèn lồng', ic: '🏮', cost: 150, rate: .1, free: 1 },
  { id: 'hoa', n: 'Chậu hoa', ic: '🌸', cost: 120, rate: .1, free: 1 },
  { id: 'ban', n: 'Bàn ghế ngồi ăn', ic: '🪑', cost: 300, rate: .25 }
];
export const WEATHER = [
  { id: 'sun', n: 'Nắng đẹp', ic: '☀️', hot: .8, cold: 1.5 },
  { id: 'mist', n: 'Sương mù se lạnh', ic: '🌫️', hot: 1.5, cold: .8 },
  { id: 'rain', n: 'Mưa nhẹ', ic: '🌦️', hot: 1.7, cold: .6 }
];
export const LAND = [
  { id: 'dome', n: 'Hoa dã quỳ khổng lồ', ic: '🌼', x: -30, z: -24, r: 19, info: 'Công trình mái vòm hình bông hoa dã quỳ, biểu tượng của quảng trường Lâm Viên bên hồ Xuân Hương.' },
  { id: 'ring', n: 'Vòng tròn bạc', ic: '⭕', x: 2, z: -28, r: 15, info: 'Vòng tròn kim loại khổng lồ dựng đứng, địa điểm chụp ảnh được yêu thích.' },
  { id: 'ball', n: 'Quả cầu xanh nhà kính', ic: '🟢', x: 42, z: -26, r: 15, info: 'Công trình hình khối cầu sọc xanh gợi nhớ những nhà kính trồng rau, hoa của Đà Lạt.' },
  { id: 'fount', n: 'Đài phun nước', ic: '⛲', x: 22, z: -8, r: 14, info: 'Đài phun nước giữa quảng trường, nơi mọi người nghỉ chân giữa những chuyến dạo phố.' }
];
// Mua bản đầy đủ MỘT LẦN. buyUrl: đường dẫn thanh toán (để trống nếu chưa gắn cổng). Mã mở khoá kiểm bằng SHA-256 so với codes.json (sinh bằng tools/dalat-codes.js).
export const PAY = { price: '99.000đ', buyUrl: '' };
export const PLOTS = Array.from({ length: 12 }, (_, i) => ({ x: -55 + (i % 6) * 22, z: 40 + Math.floor(i / 6) * 17 }));
export const NPC_STALLS = [{ x: -52, z: 22, n: 'Bánh Tráng Nướng', ic: '🫓' }, { x: -20, z: 26, n: 'Cà Phê', ic: '☕' }, { x: 22, z: 26, n: 'Vé Số', ic: '🎟️' }, { x: 54, z: 22, n: 'Khoai Lang Nướng', ic: '🍠' }];
export const MARKET = { x: -76, z: 24, n: 'Chợ đầu mối Đà Lạt' };
export const BOUNDS = { x0: -96, x1: 96, z0: -62, z1: 90 };
export const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
// Giá nguyên liệu chợ: dao động theo thời gian, giống nhau với mọi người chơi (đổi mỗi 90 giây)
export const marketMul = (pid, now = Date.now()) => .75 + (hashStr(pid + ':' + Math.floor(now / 90000)) % 1000) / 1000 * .6;
// Thời tiết đổi mỗi 4 phút, cũng đồng bộ theo giờ
export const weatherAt = (now = Date.now()) => WEATHER[hashStr('w' + Math.floor(now / 240000)) % 3];
export const levelOf = xp => 1 + Math.floor(Math.sqrt(xp / 60));
export const xpFor = lv => (lv - 1) * (lv - 1) * 60;
export const plain = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
