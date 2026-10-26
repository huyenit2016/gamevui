const ROOT = require('path').resolve(__dirname, '..', '..');
const fs = require('fs'); const { check, setAt } = require('./rulesim');
const rules = JSON.parse(fs.readFileSync(ROOT + '/database.rules.json', 'utf8'));
const NOW = 1.8e12; let pass = 0, fail = 0;
const A = (uid, email) => ({ uid, token: { email: email || (uid + '@x.com') } });
const who = { guest: A('g1', undefined), adm: A('adm1', 'adm@x.com'), col: A('col1', 'col@x.com'), tea: A('tea1', 'tea@x.com'), stu: A('stu1', 'stu@x.com'), stu2: A('stu2', 'stu2@x.com') };
let T = { admins: { adm1: { k: 'by-admin' } }, users: { adm1: { role: 'student', name: 'A' }, col1: { role: 'collab' }, tea1: { role: 'teacher' }, stu1: { role: 'student' }, stu2: { role: 'student' }, g1: undefined }, setup: { secret: 'S3cretPhrase' } };
T = JSON.parse(JSON.stringify(T));
function t(name, expectOk, op, path, val, who_, tree = T) { const r = check(rules, tree, op, path, val, who_, NOW); const good = r.ok === expectOk; good ? pass++ : fail++; console.log((good ? 'OK   ' : 'FAIL ') + name.padEnd(62) + (good ? '' : ' -> got ' + r.ok + ' (' + r.why + ')')); }
const W = (n, e, p, v, w, tr) => t(n, e, 'write', p, v, w, tr), R = (n, e, p, w, tr) => t(n, e, 'read', p, undefined, w, tr);

console.log('--- Khách (ẩn danh) ---');
R('khách đọc config/site', true, 'config/site', who.guest); W('khách KHÔNG ghi config/site', false, 'config/site', { pill: 'x' }, who.guest);
W('khách KHÔNG ghi config/announce', false, 'config/announce', { text: 'x' }, who.guest);
R('khách KHÔNG đọc users', false, 'users', who.guest); R('khách KHÔNG đọc hồ sơ người khác', false, 'users/stu1', who.guest);
W('khách KHÔNG tự thành admin (không mã)', false, 'admins/g1', { k: 'x' }, who.guest); W('khách KHÔNG tự thành admin (mã sai)', false, 'admins/g1', { k: 'wrong' }, who.guest);
W('khách KHÔNG tự thành admin (thiếu trường k)', false, 'admins/g1', { x: 1 }, who.guest);
W('khách KHÔNG đăng thư viện', false, 'library/meta/l1', { name: 'n', lang: 'en', by: 'g1', at: 1 }, who.guest);
R('khách đọc thư viện meta', true, 'library/meta', who.guest);
W('khách tạo phòng (host)', true, 'mprooms/1234/host', 'g1', who.guest); W('khách KHÔNG chiếm host phòng người khác', false, 'mprooms/1234/host', 'g1', who.guest, setAt(T, ['mprooms', '1234', 'host'], 'other'));
R('khách KHÔNG đọc toàn bộ mprooms', false, 'mprooms', who.guest); R('khách đọc 1 phòng', true, 'mprooms/1234', who.guest);
W('khách KHÔNG xoá phòng của người khác', false, 'mprooms/1234', null, who.guest, setAt(T, ['mprooms', '1234'], { host: 'other', meta: {}, players: { other: { online: true } } }));

console.log('--- Voice chat phòng (tín hiệu WebRTC) ---');
{ const VT = setAt(T, ['mprooms', '1234'], { host: 'other', meta: {}, players: { other: { online: true }, g1: { online: true } } });
  W('thành viên gửi tín hiệu voice cho người khác', true, 'mprooms/1234/voice/other/g1/k1', { t: 'offer', d: 'sdp' }, who.guest, VT);
  W('KHÔNG giả danh người gửi khác', false, 'mprooms/1234/voice/g1/other/k1', { t: 'offer', d: 'x' }, who.guest, VT);
  W('người ngoài phòng KHÔNG gửi tín hiệu', false, 'mprooms/1234/voice/other/stu1/k1', { t: 'ice', d: 'x' }, who.stu, VT);
  W('người nhận được xoá hộp thư của mình', true, 'mprooms/1234/voice/g1', null, who.guest, setAt(VT, ['mprooms', '1234', 'voice', 'g1', 'other', 'k1'], { t: 'ice', d: 'x' }));
  W('người nhận xoá từng tin đã xử lý', true, 'mprooms/1234/voice/g1/other/k1', null, who.guest, setAt(VT, ['mprooms', '1234', 'voice', 'g1', 'other'], { k1: { t: 'ice', d: 'x' }, k2: { t: 'ice', d: 'y' } }));
  W('người nhận KHÔNG sửa nội dung tin', false, 'mprooms/1234/voice/g1/other/k1', { t: 'offer', d: 'fake' }, who.guest, setAt(VT, ['mprooms', '1234', 'voice', 'g1', 'other', 'k1'], { t: 'ice', d: 'x' }));
  W('tín hiệu thiếu loại t bị chặn', false, 'mprooms/1234/voice/other/g1/k2', { d: 'x' }, who.guest, VT); }

console.log('--- Làng Nông Vui (hàng xóm) ---');
const V = { n: 'Bác Tư', lv: 5, at: 1 };
W('chủ ghi làng của mình', true, 'villages/g1/info', V, who.guest); W('KHÔNG ghi làng của người khác', false, 'villages/stu1/info', V, who.guest);
W('tên quá dài bị chặn', false, 'villages/g1/info', { n: 'x'.repeat(40), lv: 5, at: 1 }, who.guest); W('thiếu trường bắt buộc bị chặn', false, 'villages/g1/info', { n: 'a' }, who.guest);
R('khách đọc danh sách làng', true, 'villages', who.guest);
W('thả tim +1 (làng người khác)', true, 'villages/stu1/likes', 1, who.guest); W('KHÔNG tự đặt tim = 99', false, 'villages/stu1/likes', 99, who.guest, setAt(T, ['villages', 'stu1', 'likes'], 3));
W('thả tim tăng đúng 1', true, 'villages/stu1/likes', 4, who.guest, setAt(T, ['villages', 'stu1', 'likes'], 3));

console.log('--- Bootstrap quản trị ---');
W('chủ web nhập đúng mã → admin', true, 'admins/stu2', { k: 'S3cretPhrase' }, who.stu2);
W('nhập mã cho người KHÁC bị chặn', false, 'admins/stu1', { k: 'S3cretPhrase' }, who.stu2);
const noSecret = JSON.parse(JSON.stringify(T)); delete noSecret.setup;
W('chưa đặt setup/secret → không ai tự lên admin (null===null)', false, 'admins/g1', { k: 'x' }, who.guest, noSecret); W('chưa đặt secret, k rỗng', false, 'admins/g1', { x: 1 }, who.guest, noSecret);
R('không ai đọc được setup/secret', false, 'setup/secret', who.adm);

console.log('--- Đăng ký & hồ sơ ---');
W('tự tạo hồ sơ vai trò student', true, 'users/g1', { email: 'g1@x.com', name: 'G', role: 'student', createdAt: 1 }, who.guest);
W('tự tạo hồ sơ vai trò teacher bị chặn', false, 'users/g1', { email: 'g1@x.com', name: 'G', role: 'teacher' }, who.guest);
W('tự tạo hồ sơ vai trò admin bị chặn', false, 'users/g1', { name: 'G', role: 'admin' }, who.guest);
W('học sinh KHÔNG tự đổi role thành teacher', false, 'users/stu1/role', 'teacher', who.stu); W('học sinh đổi tên của mình', true, 'users/stu1/name', 'Mới', who.stu);
W('học sinh xin nâng quyền teacher', true, 'users/stu1/requested', 'teacher', who.stu); W('xin quyền "admin" bị chặn (validate)', false, 'users/stu1/requested', 'admin', who.stu);
W('học sinh KHÔNG sửa hồ sơ người khác', false, 'users/stu2/name', 'hack', who.stu);
W('admin đổi role người khác', true, 'users/stu1/role', 'teacher', who.adm); W('admin gán admins/stu1', true, 'admins/stu1', { k: 'by-admin' }, who.adm);
R('admin đọc toàn bộ users', true, 'users', who.adm); R('học sinh đọc hồ sơ của mình', true, 'users/stu1', who.stu); R('giáo viên đọc tên học sinh', true, 'users/stu1/name', who.tea); R('giáo viên KHÔNG đọc email/hồ sơ đầy đủ', false, 'users/stu1', who.tea);
W('userIndex đúng email của mình', true, 'userIndex/stu@x,com', 'stu1', who.stu); W('userIndex chiếm email người khác bị chặn', false, 'userIndex/victim@x,com', 'stu1', who.stu);
R('giáo viên đọc userIndex', true, 'userIndex/stu1@x,com', who.tea); R('học sinh KHÔNG đọc userIndex', false, 'userIndex/stu2@x,com', who.stu);

console.log('--- CMS: cấu hình & thông báo ---');
W('admin ghi config/site', true, 'config/site', { pill: 'x' }, who.adm); W('CTV KHÔNG ghi config/site', false, 'config/site', { pill: 'x' }, who.col);
W('CTV ghi thông báo', true, 'config/announce', { text: 'hi' }, who.col); W('giáo viên KHÔNG ghi thông báo', false, 'config/announce', { text: 'hi' }, who.tea); W('admin ghi autoclean', true, 'config/autoclean', true, who.adm); W('CTV KHÔNG ghi autoclean', false, 'config/autoclean', true, who.col);

console.log('--- Thư viện khoá học ---');
const meta = (by) => ({ name: 'N', lang: 'en', by, at: 1, n: 3 });
W('giáo viên đăng meta (by=mình)', true, 'library/meta/l1', meta('tea1'), who.tea); W('giáo viên đăng giả mạo by=người khác', false, 'library/meta/l1', meta('col1'), who.tea);
W('học sinh KHÔNG đăng', false, 'library/meta/l1', meta('stu1'), who.stu);
const lib = setAt(setAt(T, ['library', 'meta', 'l1'], meta('tea1')), ['library', 'data', 'l1'], '{}');
W('giáo viên ghi data khi sở hữu meta', true, 'library/data/l1', '{"a":1}', who.tea, lib); W('giáo viên KHÁC không ghi đè data', false, 'library/data/l1', '{"a":1}', A('tea2'), setAt(lib, ['users', 'tea2'], { role: 'teacher' }));
W('data > 300KB bị chặn', false, 'library/data/l1', 'x'.repeat(300001), who.tea, lib); W('CTV ghi data mới (kiểm duyệt)', true, 'library/data/l9', '{}', who.col, lib);
W('giáo viên xoá khoá của mình', true, 'library/meta/l1', null, who.tea, lib); W('CTV xoá khoá của người khác', true, 'library/meta/l1', null, who.col, lib); W('học sinh KHÔNG xoá', false, 'library/meta/l1', null, who.stu, lib);
W('giáo viên KHÁC không xoá khoá người khác', false, 'library/meta/l1', null, A('tea2'), setAt(lib, ['users', 'tea2'], { role: 'teacher' }));

console.log('--- Giao bài & kết quả ---');
W('giáo viên giao bài (by=mình)', true, 'assign/stu1/l1', { name: 'N', by: 'tea1', at: 1 }, who.tea); W('giáo viên giả mạo by', false, 'assign/stu1/l1', { name: 'N', by: 'col1', at: 1 }, who.tea);
W('học sinh KHÔNG tự giao bài', false, 'assign/stu1/l1', { name: 'N', by: 'stu1' }, who.stu); R('học sinh đọc bài được giao', true, 'assign/stu1', who.stu); R('học sinh KHÔNG đọc bài của bạn', false, 'assign/stu2', who.stu);
W('giáo viên thêm học sinh vào danh sách', true, 'teacherStudents/tea1/stu1', { email: 'a', name: 'b' }, who.tea); W('giáo viên KHÔNG sửa danh sách GV khác', false, 'teacherStudents/tea2/stu1', { email: 'a' }, who.tea); W('học sinh KHÔNG có danh sách', false, 'teacherStudents/stu1/stu2', { email: 'a' }, who.stu);
W('học sinh lưu kết quả của mình', true, 'results/stu1/r1', { c: 'x', ok: 3, n: 5, at: 1 }, who.stu); W('học sinh KHÔNG ghi kết quả hộ bạn', false, 'results/stu2/r1', { c: 'x', ok: 5, n: 5, at: 1 }, who.stu);
W('kết quả thiếu trường bị chặn', false, 'results/stu1/r2', { ok: 1 }, who.stu); R('giáo viên đọc kết quả HS', true, 'results/stu1', who.tea); R('học sinh KHÔNG đọc kết quả bạn', false, 'results/stu1', who.stu2); R('CTV KHÔNG đọc kết quả', false, 'results/stu1', who.col);

console.log('--- Admin & phòng rác ---');
const rooms = { mprooms: { 1111: { host: 'hx', meta: { game: 'uno' }, players: { hx: { online: false } } } }, mplobby: { 1111: { at: NOW - 3 * 3600e3 } }, calls: { 2222: { host: 'hx' } }, calllobby: { 2222: { at: NOW - 3 * 3600e3 } }, rooms: { 3333: { x: 1 } }, lobby: { 3333: { y: 1 } } };
const RT = Object.assign(JSON.parse(JSON.stringify(T)), rooms);
R('admin đọc toàn bộ mprooms', true, 'mprooms', who.adm, RT); R('admin đọc toàn bộ calls', true, 'calls', who.adm, RT); R('admin đọc dữ liệu cũ rooms', true, 'rooms', who.adm, RT); R('khách KHÔNG đọc toàn bộ calls', false, 'calls', who.guest, RT); R('giáo viên KHÔNG đọc toàn bộ mprooms', false, 'mprooms', who.tea, RT);
W('admin xoá phòng mprooms của người khác', true, 'mprooms/1111', null, who.adm, RT); W('admin xoá mplobby', true, 'mplobby/1111', null, who.adm, RT); W('admin xoá mpstate', true, 'mpstate/1111', null, who.adm, RT); W('admin xoá mpprivate', true, 'mpprivate/1111', null, who.adm, RT);
W('admin xoá calls + calllobby', true, 'calls/2222', null, who.adm, RT); W('admin xoá calllobby', true, 'calllobby/2222', null, who.adm, RT); W('admin xoá rooms cũ', true, 'rooms/3333', null, who.adm, RT); W('admin xoá lobby cũ', true, 'lobby/3333', null, who.adm, RT);
W('khách dọn mplobby quá 2 giờ (janitor)', true, 'mplobby/1111', null, who.guest, RT); W('khách KHÔNG xoá mplobby còn mới', false, 'mplobby/1111', null, who.guest, setAt(RT, ['mplobby', '1111', 'at'], NOW - 60000));
W('khách KHÔNG xoá calls mới của người khác', false, 'calls/2222', null, who.guest, setAt(RT, ['calllobby', '2222', 'at'], NOW - 60000)); W('janitor dọn calls quá hạn? (chỉ calllobby)', true, 'calllobby/2222', null, who.guest, RT);
console.log('--- Story (trang kể chuyện) ---');
const sm = (by, pub) => ({ title: 'Chuyện A', slug: 'chuyen-a', by, at: 1, pub });
W('CTV tạo meta story', true, 'stories/meta/s1', sm('col1', false), who.col); W('admin tạo meta story', true, 'stories/meta/s1', sm('adm1', true), who.adm);
W('giáo viên KHÔNG tạo story', false, 'stories/meta/s1', sm('tea1', false), who.tea); W('khách KHÔNG tạo story', false, 'stories/meta/s1', sm('g1', true), who.guest);
W('slug sai định dạng bị chặn', false, 'stories/meta/s1', Object.assign(sm('col1', false), { slug: 'Chuyen A' }), who.col);
W('thiếu tiêu đề bị chặn', false, 'stories/meta/s1', { slug: 'a', by: 'col1', at: 1 }, who.col);
R('khách đọc danh sách meta', true, 'stories/meta', who.guest);
const st = setAt(setAt(setAt(T, ['stories', 'meta', 's1'], sm('col1', true)), ['stories', 'data', 's1'], '{"blocks":[]}'), ['stories', 'meta', 's2'], sm('col1', false));
const st2 = setAt(st, ['stories', 'data', 's2'], '{"blocks":[]}');
R('khách đọc nội dung story đã xuất bản', true, 'stories/data/s1', who.guest, st2); R('khách KHÔNG đọc bản nháp', false, 'stories/data/s2', who.guest, st2); R('CTV đọc bản nháp', true, 'stories/data/s2', who.col, st2);
W('CTV ghi nội dung story', true, 'stories/data/s1', '{"blocks":[{}]}', who.col, st2); W('khách KHÔNG sửa nội dung story', false, 'stories/data/s1', '{}', who.guest, st2);
W('nội dung quá 400KB bị chặn', false, 'stories/data/s1', 'x'.repeat(400001), who.col, st2);
R('khách tra slug', true, 'stories/slugs/chuyen-a', who.guest);
W('CTV đăng ký slug mới', true, 'stories/slugs/chuyen-b', 's2', who.col, st2); W('slug viết hoa bị chặn', false, 'stories/slugs/Chuyen-B', 's2', who.col, st2);
const sl = setAt(st2, ['stories', 'slugs', 'chuyen-a'], 's1');
W('KHÔNG chiếm slug đã có cho story khác', false, 'stories/slugs/chuyen-a', 's2', who.col, sl); W('cùng story ghi lại slug của mình', true, 'stories/slugs/chuyen-a', 's1', who.col, sl); W('gỡ slug khi xoá story', true, 'stories/slugs/chuyen-a', null, who.col, sl);
W('khách KHÔNG xoá slug', false, 'stories/slugs/chuyen-a', null, who.guest, sl);
// update đa đường dẫn: Firebase kiểm từng đường dẫn con nên mô phỏng từng ghi
W('lưu: meta mới', true, 'stories/meta/s9', sm('col1', true), who.col, T); W('lưu: data mới', true, 'stories/data/s9', '{"blocks":[]}', who.col, T); W('lưu: slug mới', true, 'stories/slugs/chuyen-z', 's9', who.col, T);

console.log(`\n${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
