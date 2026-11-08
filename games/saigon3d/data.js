// Dữ liệu du lịch: địa danh, câu hỏi nhanh, món ăn đường phố. Nội dung tự biên soạn (giới thiệu ngắn, mang tính tham khảo).
// Toạ độ là bản đồ CÁCH ĐIỆU (không theo tỷ lệ thật): x sang đông (về phía sông Sài Gòn), z về phía nam.
export const LM = [
  { id: 'benthanh', n: 'Chợ Bến Thành', icon: '🏪', x: -45, z: 92, fx: -45, fz: 56, yr: '1914',
    info: 'Chợ Bến Thành là biểu tượng của Sài Gòn. Công trình hiện nay hoàn thành năm 1914 với tháp đồng hồ ở cổng chính. Bên trong là vô số quầy vải vóc, quà lưu niệm, đặc sản và ẩm thực; buổi tối quanh chợ còn có khu chợ đêm.',
    tips: 'Đi buổi sáng cho mát, hỏi giá trước và mặc cả nhẹ nhàng; giữ gìn túi xách nơi đông người.',
    q: { q: 'Cổng chính của chợ Bến Thành nổi tiếng với kiến trúc nào?', a: ['Tháp đồng hồ', 'Cầu thang xoắn ốc', 'Mái vòm kính'], c: 0 } },
  { id: 'ducba', n: 'Nhà thờ Đức Bà', icon: '⛪', x: -120, z: -98, fx: -120, fz: -72, yr: '1863–1880',
    info: 'Nhà thờ Chính toà Đức Bà Sài Gòn được xây từ năm 1863, hoàn thành vào khoảng năm 1880. Mặt ngoài dùng gạch đỏ nhập từ Pháp, hai tháp chuông cao khoảng 58 m. Trước nhà thờ là tượng Đức Mẹ Hòa Bình giữa quảng trường.',
    tips: 'Hãy ăn mặc lịch sự và giữ yên lặng khi vào khu vực hành lễ; chụp ảnh đẹp nhất vào buổi sáng sớm hoặc chiều muộn.',
    q: { q: 'Hai tháp chuông của Nhà thờ Đức Bà cao khoảng bao nhiêu?', a: ['Khoảng 58 m', 'Khoảng 20 m', 'Khoảng 120 m'], c: 0 } },
  { id: 'buudien', n: 'Bưu điện Thành phố', icon: '📮', x: -120, z: -40, fx: -120, fz: -55, yr: '1886–1891',
    info: 'Bưu điện Thành phố được xây từ năm 1886 đến 1891 theo phong cách Pháp, nổi bật với sảnh vòm cao, bản đồ cổ trên tường và dãy bàn viết xưa. Đây vẫn là bưu điện đang hoạt động: bạn có thể gửi bưu thiếp về cho người thân.',
    tips: 'Mua một tấm bưu thiếp và viết vài dòng gửi về nhà; sảnh chính rất đẹp để chụp ảnh.',
    q: { q: 'Bưu điện Thành phố được xây dựng vào thời kỳ nào?', a: ['Cuối thế kỷ 19', 'Đầu thế kỷ 21', 'Thế kỷ 15'], c: 0 } },
  { id: 'dinhdoclap', n: 'Dinh Độc Lập', icon: '🏛️', x: -236, z: -60, fx: -190, fz: -60, yr: '1966',
    info: 'Dinh Độc Lập (nay là Dinh Thống Nhất) được xây trên nền Dinh Norodom cũ, khánh thành năm 1966 theo thiết kế của kiến trúc sư Ngô Viết Thụ. Ngày 30/4/1975 nơi đây gắn với sự kiện kết thúc chiến tranh, thống nhất đất nước. Hiện là di tích quốc gia đặc biệt.',
    tips: 'Nên dành 1–2 giờ để xem phòng khánh tiết, phòng làm việc và hầm chỉ huy.',
    q: { q: 'Dinh Độc Lập hiện nay còn được gọi là gì?', a: ['Dinh Thống Nhất', 'Dinh Thượng Thư', 'Phủ Chủ tịch'], c: 0 } },
  { id: 'nguyenhue', n: 'Phố đi bộ Nguyễn Huệ', icon: '🚶', x: 85, z: 0, fx: 40, fz: 0, yr: '2015',
    info: 'Phố đi bộ Nguyễn Huệ khánh thành năm 2015, dài khoảng 670 m, nối trụ sở Ủy ban nhân dân Thành phố với bến Bạch Đằng bên sông Sài Gòn. Đây là nơi diễn ra nhiều lễ hội và sự kiện lớn trong năm, nhất là dịp Tết.',
    tips: 'Buổi tối phố sáng đèn, rất hợp để dạo bộ, ngắm sông và thưởng thức cà phê.',
    q: { q: 'Phố đi bộ Nguyễn Huệ nối Ủy ban nhân dân Thành phố với nơi nào?', a: ['Bến Bạch Đằng ven sông Sài Gòn', 'Sân bay Tân Sơn Nhất', 'Chợ Bến Thành'], c: 0 } },
  { id: 'bitexco', n: 'Tháp Bitexco', icon: '🏙️', x: 104, z: 58, fx: 104, fz: 28, yr: '2010',
    info: 'Bitexco Financial Tower hoàn thành năm 2010, cao khoảng 262 m với 68 tầng; thiết kế gợi hình búp sen. Bãi đáp trực thăng nhô ra từ thân tháp ở tầng 52, còn đài quan sát Saigon Skydeck nằm ở tầng 49.',
    tips: 'Lên đài quan sát vào lúc hoàng hôn để thấy thành phố chuyển từ nắng sang đèn.',
    q: { q: 'Thiết kế của tháp Bitexco gợi hình ảnh loài hoa nào?', a: ['Hoa sen (búp sen)', 'Hoa mai', 'Hoa phượng'], c: 0 } },
  { id: 'landmark81', n: 'Landmark 81', icon: '🗼', x: 236, z: -196, fx: 200, fz: -160, yr: '2018',
    info: 'Landmark 81 hoàn thành năm 2018, cao khoảng 461 m với 81 tầng, là một trong những tòa nhà cao nhất Việt Nam. Tòa tháp nằm trong khu Vinhomes Central Park bên bờ sông Sài Gòn.',
    tips: 'Dạo công viên ven sông bên cạnh để ngắm toàn cảnh tòa tháp, đẹp nhất lúc lên đèn.',
    q: { q: 'Landmark 81 có bao nhiêu tầng?', a: ['81 tầng', '68 tầng', '100 tầng'], c: 0 } },
  { id: 'chuaba', n: 'Chùa Bà Thiên Hậu', icon: '🏮', x: -236, z: 165, fx: -196, fz: 165, yr: 'hơn 200 năm',
    info: 'Chùa Bà Thiên Hậu ở khu Chợ Lớn do cộng đồng người Hoa xây dựng, có lịch sử hơn 200 năm, thờ Bà Thiên Hậu – vị thần che chở người đi biển. Điểm nhấn là những vòng hương xoắn treo cao và mái ngói gốm trang trí tinh xảo.',
    tips: 'Hãy giữ yên lặng, thắp hương nhẹ nhàng; đi vào buổi sáng để tránh đông người.',
    q: { q: 'Chùa Bà Thiên Hậu nằm ở khu vực nào của Thành phố Hồ Chí Minh?', a: ['Chợ Lớn', 'Thủ Thiêm', 'Củ Chi'], c: 0 } },
  { id: 'nharong', n: 'Bến Nhà Rồng', icon: '⚓', x: 138, z: 118, fx: 160, fz: 118, yr: '1863',
    info: 'Bến Nhà Rồng (nay là Bảo tàng Hồ Chí Minh – chi nhánh Thành phố Hồ Chí Minh) được xây dựng năm 1863. Ngày 5/6/1911, từ bến này, thanh niên Nguyễn Tất Thành lên tàu Latouche-Tréville ra đi tìm đường cứu nước.',
    tips: 'Bảo tàng trưng bày hiện vật về hành trình của Bác; ngoài sân có thể ngắm sông Sài Gòn.',
    q: { q: 'Năm 1911, ai đã rời Bến Nhà Rồng ra đi tìm đường cứu nước?', a: ['Nguyễn Tất Thành', 'Phan Châu Trinh', 'Phan Bội Châu'], c: 0 } }
];

// Món ăn đường phố (thưởng thức tại các quầy trên bản đồ)
export const FOOD = [
  { id: 'banhmi', n: 'Bánh mì', icon: '🥖', x: -14, z: 82, info: 'Ổ bánh mì giòn kẹp pa-tê, thịt nguội, đồ chua và rau thơm – món ăn đường phố nổi tiếng nhất Sài Gòn.' },
  { id: 'cafe', n: 'Cà phê sữa đá', icon: '☕', x: -142, z: -64, info: 'Cà phê phin đậm đà pha sữa đặc rồi rót lên đá – thức uống quen thuộc của người Sài Gòn mỗi sáng.' },
  { id: 'nuocmia', n: 'Nước mía', icon: '🧃', x: -98, z: -66, info: 'Nước mía ép tươi, thường thêm chút quất – ly nước giải khát bình dân ở khắp vỉa hè.' },
  { id: 'pho', n: 'Phở', icon: '🍜', x: 58, z: 27, info: 'Nước dùng ninh xương thơm dịu, bánh phở mềm; phở Sài Gòn thường ăn kèm giá, rau thơm, tương đen và tương ớt.' },
  { id: 'comtam', n: 'Cơm tấm', icon: '🍚', x: -18, z: 130, info: 'Cơm làm từ gạo tấm, ăn cùng sườn nướng, bì, chả và trứng ốp la, kèm nước mắm chua ngọt.' },
  { id: 'hutieu', n: 'Hủ tiếu', icon: '🍲', x: -214, z: 128, info: 'Sợi hủ tiếu dai mềm trong nước dùng ngọt thanh; có hủ tiếu nước và hủ tiếu khô, là món quen thuộc ở miền Nam.' },
  { id: 'che', n: 'Chè', icon: '🍧', x: -204, z: 196, info: 'Các loại chè ngọt mát như chè bưởi, chè đậu xanh – giải nhiệt giữa trưa nắng.' }
];

// Đường cho xe máy chạy (đoạn thẳng, mỗi đoạn có 2 làn ngược chiều) và vị trí vỉa hè đi bộ
export const ROADS = [
  [-170, -130, 170, -130], [-170, 150, 170, 150], [-170, -130, -170, 150], [170, -130, 170, 150],
  [-75, -130, -75, 150], [-170, -15, -75, -15]
];
export const RW = 14; // bề rộng đường

export const EMOTES = [
  { id: 'wave', n: 'Vẫy tay', icon: '🙋' }, { id: 'cheer', n: 'Reo mừng', icon: '🙌' },
  { id: 'point', n: 'Chỉ tay', icon: '👉' }, { id: 'selfie', n: 'Tự chụp', icon: '🤳' }
];

export const TITLES = [[0, 'Du khách'], [40, 'Lữ khách'], [100, 'Người khám phá'], [180, 'Hướng dẫn viên'], [260, 'Đại sứ Sài Gòn']];
export const titleOf = pts => { let t = TITLES[0][1]; for (const [p, n] of TITLES) if (pts >= p) t = n; return t; };

const BAD = ['địt', 'đụ', 'lồn', 'cặc', 'buồi', 'đéo', 'đĩ', 'dm', 'đm', 'dmm', 'đmm', 'dcm', 'đcm', 'vcl', 'vkl', 'clm', 'cmm', 'dkm', 'đkm', 'cc', 'loz', 'fuck', 'shit', 'bitch', 'dit', 'lon'];
const BAD_PHRASE = ['óc chó', 'đồ chó', 'con chó má', 'mẹ mày', 'má mày'];
// bộ lọc từ tục đơn giản cho tên và chat (không thay được kiểm duyệt của người thật)
export function dirty(text) {
  const t = String(text).toLowerCase(); if (BAD_PHRASE.some(p => t.includes(p))) return true;
  const words = t.split(/[^a-zA-Zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ0-9]+/).filter(Boolean);
  return words.some(w => BAD.includes(w) && !(w === 'lon' && /lớn|lon\s*(bia|nước|sữa)/.test(t)));
}
