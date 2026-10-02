# GameVui – bộ nhớ dự án (đọc file này trước khi làm tiếp)

> File này để Claude/dev nắm nhanh dự án khi phát triển thêm. Cập nhật mỗi khi có thay đổi lớn.
> Việc để làm sau: xem `ROADMAP.md`. Hướng dẫn Firebase: `FIREBASE.md`. Giấy phép: `LICENSE` (bảo lưu mọi quyền).

## 1. Dự án là gì
Website tĩnh (GitHub Pages) gồm **game, tiện ích, học tập, chơi online cùng bạn bè** và **CMS** phân quyền. Người dùng khách **không cần đăng nhập**. Giao diện tiếng Việt. Chủ dự án: tài khoản GitHub `huyenit2016` (repo `huyenit2016/gamevui`, site `https://huyenit2016.github.io/gamevui/`).

## 2. Kiến trúc
- **JavaScript thuần, không framework, không build khi chạy** (`index.html` nạp lần lượt các file `js/*.js`). Router theo hash: `#/game/<id>`, `#/tool/<id>`.
- Mỗi game/tiện ích đăng ký bằng `GV.register({id, type:'game'|'tool', cat, name, icon, desc, mount(el)})`; `mount` trả về hàm dọn dẹp. Giao diện dựng bằng `innerHTML` + `<style>` riêng trong `el`.
- Tiện ích dùng chung: `GV.store` (localStorage, tiền tố `gv_`), `GV.esc` (escape HTML), `GV.safeUrl` (chỉ cho http/https), `GV.ic(name,size,fill)` (icon SVG, `js/icons.js`), `GV.toast` (snackbar), `GV.go(key)` (chuyển bộ lọc trang chủ), `GV.account` (đăng nhập/quyền), `GV.fbInfo()` (Firebase).
- Dữ liệu màu/kiểu: biến CSS ở `css/style.css` (xem mục 6). Tên biến cũ (`--bg --card --card2 --line --inp --fg --mut --acc --acc2 --ok --bad --grad`) **phải giữ** vì các game tự nhúng CSS dùng chúng.

### Bản đồ file
| File | Vai trò |
|---|---|
| `index.html`, `css/style.css`, `js/app.js` | Trang chủ, router, thẻ game, bộ lọc, tìm kiếm |
| `js/icons.js`, `js/material.js`, `js/toast.js` | Icon SVG · ripple + FAB · snackbar |
| `js/games-*.js`, `js/tools-*.js` | Game & tiện ích đơn (mới: `games-new.js` canvas hành động/thể thao, `games-brain.js` trí tuệ & mô phỏng, `games-battle.js` (xe tăng, bắn tỉa, không chiến, phòng thủ tháp, câu cá, người que, đặt bom, nhà ma), `games-avatarfarm.js` + `town.js` + `games-cotyphu.js` (**Làng Nông Vui**, id `avatarfarm`, lưu `gv_avfarm`: lõi = nông trại + nhân vật + nhiệm vụ; `town.js` đăng ký các khu vào `GV.townZones` {id,ico,n,lock,mount(host,T)}: chăn nuôi, ngôi nhà, cày xu, câu cá/đua xe/cờ tỷ phú/trò chơi nhúng, hàng xóm; **30 phút chơi thật (`S.play`) mới mở khoá các khu `lock:true`**, hoặc 10 💎; game nhúng thưởng xu qua `GV.hooks.score` do `GV.setBest` gọi; hàng xóm dùng Firebase `villages/<uid>/info|likes`, chỉ khi người chơi bật chia sẻ; `GV.townT` là tay cầm kiểm thử), `games-word.js` (từ vựng, ghép chữ, vẽ, thời trang, nhà bếp, IQ), `games-season.js` thể thao (bóng rổ, bida, bowling) & lễ hội (lì xì, bầu cua, Valentine, Noel, Halloween), `tools-new.js` sổ chi tiêu/thói quen/vay/metronome) |
| `js/mp-core.js`, `js/mp-*.js` | Game nhiều người (Firebase): loto, uno, tiến lên, ma sói, cờ tướng, cờ vua |
| `js/learn-*.js` | Học tập: ngoại ngữ, tạo khoá học, gia sư AI, dịch, họp, lớp học 1-1, thư viện khoá |
| `js/media.js` | Nghe nhạc (Openverse CC), Karaoke (mic/echo/thu âm), Xem TV (iptv-org) |
| `js/fb.js`, `js/firebase-config.js` | Firebase (Realtime DB + Auth, SDK compat 10.12.2) |
| `js/account.js`, `cms.html`, `js/cms.js`, `css/cms.css` | Đăng nhập, phân quyền, CMS |
| `js/ads.js`, `js/ads-config.js`, `js/stats.js` | Quảng cáo, bộ đếm lượt (IP băm) |
| `js/registry.js` | Danh sách mục cho CMS — **tạo lại** bằng `node tools/genreg.js` khi thêm game |
| `404.html`, `500.html`, `privacy.html` | Trang lỗi phong cách Tết, quyền riêng tư |
| `database.rules.json` | Rules Firebase — sinh từ `tools/make_rules.py` (chạy lại, đừng sửa tay) |
| `tools/build.mjs`, `.github/workflows/deploy.yml` | Build làm rối mã + deploy Pages |

## 3. Firebase & phân quyền
- Khách: đăng nhập **ẩn danh** (Anonymous). Tài khoản CMS: Email/Password.
- Vai trò: `admin` (node `admins/<uid>`), `collab`, `teacher`, `student` (`users/<uid>/role`). Đăng ký mới luôn là `student`, có thể xin `requested`; admin duyệt ở CMS.
- Lên admin lần đầu: ghi `admins/<uid> = {k: <mã>}` khớp `setup/secret` (chỉ đọc được trong Console). **Sau khi có admin nên đổi/xoá `setup/secret`.**
- Các nhánh: `mprooms/mpprivate/mpstate/mplobby` (nhiều người), `calls/calllobby` (lớp 1-1), `rooms/lobby` (cũ), `config/site|announce|autoclean`, `users`, `userIndex`, `teacherStudents`, `assign`, `results`, `library/meta|data`, `stats`, `villages` (Làng Nông Vui: `info` chỉ chủ ghi, `likes` ai cũng +1).
- Phòng "rác": không còn người online, bị bỏ quá 2 giờ (TTL 7200000 ms), thiếu dữ liệu, hoặc dữ liệu cũ. CMS tab Phòng quét 20 giây/lần **chỉ khi admin đang mở**; chưa có dọn phía server.
- **Quy tắc vàng khi xoá phòng:** xoá `calls` và `calllobby` (hay `mprooms/...`) bằng **một lệnh `update` đa đường dẫn** (và `onDisconnect().update`), vì Rules của lobby kiểm tra phòng chính còn tồn tại.
- Firebase **bỏ mảng rỗng / key null** khi lưu → code phải chịu được (`x || []`).
- `stats/ips` chỉ admin đọc được; chat phòng giới hạn 200 ký tự (Rules).

## 4. Build, deploy, kiểm thử
- Push lên `main` → GitHub Actions: `npm ci && npm run build` (`tools/build.mjs`: terser + javascript-obfuscator + clean-css + html-minifier, copy `css/fonts`, `LICENSE`, `ads.txt`) → `dist/` → Pages (Settings → Pages → Source = **GitHub Actions**, đã bật).
- Obfuscator: **`renameGlobals:false`**, `transformObjectKeys:false` (bắt buộc, các file dùng chung biến toàn cục `GV`, khoá Firebase). Hai file `firebase-config.js`, `ads-config.js` chỉ nén. Không sửa trong `dist/` (bị xoá mỗi lần build).
- Chạy thử cục bộ: `npm install && npm run build`, mở `dist/index.html`.
- **Test** (Playwright, cần cài global; mạng bị chặn nên dùng mock): `NODE_PATH=$(npm root -g) node tools/tests/<file>`
  - `mount-all.test.js` — mở cả 100 mục, báo lỗi (luôn chạy sau khi sửa UI)
  - `rules.test.js` — mô phỏng Firebase Rules (kỳ vọng `94 đạt, 0 lỗi`)
  - `cms-e2e.test.js` — CMS end-to-end với Firebase giả (`hub.js`, `mock_shared.js`)
  - `town.test.js` — Làng Nông Vui: khoá/mở khoá, chuồng, nhà, cày xu, game nhúng, cờ tỷ phú, hàng xóm, thưởng xu
  - `new-games.test.js` — 35 game + 4 tiện ích mới (thao tác cơ bản, kiểm tra canvas có vẽ)
  - `media.test.js` — Nghe nhạc/Karaoke/TV với API giả
  - Chưa thử được: Firebase thật, API AI thật, micro/điện thoại thật.
- Commit xong chạy thêm `node --check js/*.js`.

## 5. Quy ước làm việc với chủ dự án
- **Trả lời bằng tiếng Việt**, ngắn gọn, nói rõ cái gì đã kiểm tra / chưa kiểm tra.
- **Commit**: tác giả `Huyen <huyenit2016@gmail.com>` (đã cấu hình `git config` trong repo). **KHÔNG** thêm dòng `Co-Authored-By`, `Claude-Session` hay bất kỳ tên Claude nào trong commit/PR. (Lịch sử cũ đã được viết lại để bỏ Claude khỏi Contributors.)
- Không tự đăng email/số điện thoại của chủ lên web công khai. Thông tin liên hệ quảng cáo để chủ tự điền (`js/ads-config.js`).
- Web **không có link sang GitHub** (chủ yêu cầu). Không thêm quảng cáo YouTube/nguồn có bản quyền.
- Thao tác phá huỷ (force-push, xoá dữ liệu) phải được chủ đồng ý rõ ràng trước.
- Chỉ tạo PR khi được yêu cầu.

## 6. Thiết kế giao diện hiện tại
- **Material Design 3** thuần CSS (không MUI/React): token `--md-*` (màu, surface 5 tầng), biến cũ ánh xạ sang token; font **Roboto** tự host (`css/fonts`); dark mặc định, light qua nút đổi (`data-theme=light`, lưu `gv_theme`).
- Bố cục: top app bar + ô tìm kiếm (`#q`) · **navigation rail** trái (≥600px) · **bottom bar 5 mục** (<600px, ẩn khi đang chơi, class `body.ingame`) · FAB "Chơi ngẫu nhiên" · hero gọn có 4 thẻ game · "Đang hot" dạng bento (thẻ đầu 2×2, tối đa 9) · "Chơi gần đây" thẻ ngang · lưới thẻ game.
- **Nút/chip/banner dùng màu rgba trong suốt** (biến `--t-p`, `--t-n`, `--t-ok`, `--t-bad`…), banner `.annc` info/warn/success dạng rgba. **Nền thẻ `.card .art .bg` dùng pastel trong suốt** theo hue thể loại (`--h`).
- Nhãn nút thẻ theo loại: game → **Chơi / Chơi ngay**, học tập → **Học / Học ngay**, tiện ích → **Dùng thử** (`verbOf` trong `app.js`).
- Cạm bẫy: **không đặt class `.ad` cho nút/phần tử không phải quảng cáo** (`ads.js` điền quảng cáo vào mọi `.ad`; tool dùng `.add`). Class `.big` (số to, căn giữa) trùng với `.card.big` → đã có rule reset; id `#q` thuộc ô tìm kiếm header (tool dùng `#mq`); CMS có biến/skin riêng trong `#cms` (sidebar tối, nội dung trắng) và override `.btn` trong `css/cms.css`.
- Icon UI là SVG nét Lucide (`js/icons.js`, thêm icon = thêm path). Emoji chỉ còn là biểu tượng của từng game và nội dung bên trong game.

## 7. Giới hạn đã biết
- Phụ thuộc dịch vụ ngoài chưa kiểm chứng trên môi trường thật: Openverse (giới hạn lượt ẩn danh), iptv-org (nhiều kênh chặn CORS/khu vực), hls.js từ cdnjs (chưa gắn SRI), Firebase.
- Email đăng ký chưa bắt xác minh; tài khoản Firebase Auth không xoá được từ trình duyệt.
- Mã nguồn gốc vẫn công khai trên GitHub (repo public); làm rối chỉ gây khó cho người xem bản deploy.
- Một số màu canvas trong game giữ màu cũ, emoji quân cờ đen hơi chìm trên nền tối; tên trên thẻ hero bị thẻ kề che một phần.

## 8. Quy trình thêm game/tiện ích mới
1. Tạo/sửa file trong `js/`, `GV.register(...)`; thêm `<script>` vào `index.html` (trước `account.js`).
2. `node --check js/<file>.js`, chạy `mount-all.test.js`.
3. `node tools/genreg.js` để cập nhật `js/registry.js` (CMS bật/tắt, mục hot/new).
4. Cập nhật `ROADMAP.md`, commit, push (Actions tự deploy).
