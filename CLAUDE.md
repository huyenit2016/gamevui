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
| `js/games-*.js`, `js/tools-*.js` | Game & tiện ích đơn (mới: `games-new.js` canvas hành động/thể thao, `games-brain.js` trí tuệ & mô phỏng, `games-battle.js` (xe tăng, bắn tỉa, không chiến, phòng thủ tháp, câu cá, người que, đặt bom, nhà ma), `games-avatarfarm.js` + `town.js` + `games-cotyphu.js` (**Làng Nông Vui**, id `avatarfarm`, lưu `gv_avfarm`: lõi = nông trại + nhân vật + nhiệm vụ; `town.js` đăng ký các khu vào `GV.townZones` {id,ico,n,lock,mount(host,T)}: chăn nuôi, ngôi nhà, cày xu, câu cá/đua xe/cờ tỷ phú/trò chơi nhúng, hàng xóm; **30 phút chơi thật (`S.play`) mới mở khoá các khu `lock:true`**, hoặc 10 💎; game nhúng thưởng xu qua `GV.hooks.score` do `GV.setBest` gọi; hàng xóm dùng Firebase `villages/<uid>/info|likes`, chỉ khi người chơi bật chia sẻ; `GV.townT` là tay cầm kiểm thử; **tab `plaza` = Khu vui chơi**: bản đồ canvas 5 điểm (hồ câu, đua xe, cờ tỷ phú, trò chơi, hàng xóm) + quảng trường/đài phun nước, chạm điểm → nhân vật chạy tới rồi `show(zone)`; **xe bus**: chạm bến xe cuối cảnh nông trại/khu vui chơi → `ride(to)` chụp ảnh cảnh cũ và mới, phủ canvas overlay cho cảnh trượt ngang + xe bus chạy ngang (test `bus.test.js`); xe/đường/công trình vẽ trong `chibi.js`), `games-word.js` (từ vựng, ghép chữ, vẽ, thời trang, nhà bếp, IQ), `games-season.js` thể thao (bóng rổ, bida, bowling) & lễ hội (lì xì, bầu cua, Valentine, Noel, Halloween), `tools-new.js` sổ chi tiêu/thói quen/vay/metronome) |
| `js/chibi.js` | Đồ hoạ chibi vẽ bằng code (`GV.chibi`: `char` nhân vật, `animal` 7 vật nuôi (hen/chick/duck/cow/pig/sheep/goat, kiểu sticker nhìn ngang) + `animalIcon` (dataURL), `tree2/haystack/bale/picket/ropefence/bush` cho cảnh chuồng trại (tab Chăn nuôi là canvas có bong bóng sản phẩm, chạm con vật để cho ăn/thu hoạch; test `barn.test.js`), `crop` 11 loại cây × 4 giai đoạn, `soil`, `house`, `bigTree`, `fence`, `locked`); nạp trước `games-avatarfarm.js`, canvas nông trại nhân theo devicePixelRatio (tối đa 2x; toạ độ logic 420 px) |
| `css/gameui.css` | Skin game hoạt hình cho Làng Nông Vui (`.af.gvu`): font Baloo 2 tự host (`css/fonts`, OFL), nút 3D, viên thuốc trắng, thẻ kem, khung gỗ; ghi đè biến `--fg/--mut/--line/--md-sc-high…` cục bộ để zone (town.js) tự đổi sang nền kem. Tránh tên class `.pill/.res` (đã dùng ở style.css) |
| `js/games-blocks.js` | **Xây Khối 3D** (id `blocks`, lưu `gv_blocks`): sandbox voxel 12×12×10, renderer 3D tự vẽ (painter + dò trúng bằng đa giác), đặt/xoá/tô/lấy màu, 4 hình khối (khối/nửa/cột/tấm), tối đa 8 màu riêng, cắt tầng, undo/redo, mẫu, mã chia sẻ `RLE(g).RLE(shape).hex màu riêng`, xuất PNG; test `blocks.test.js` |
| `js/mp-core.js`, `js/mp-*.js` | Game nhiều người (Firebase): loto, uno, tiến lên, ma sói, cờ tướng, cờ vua |
| `js/learn-*.js` | Học tập: ngoại ngữ, tạo khoá học, gia sư AI, dịch, họp, lớp học 1-1, thư viện khoá; `learn-thpt.js` + `thpt-10.js` + `thpt-10b.js` (bổ sung bài qua `GV.thpt.extend`; trắc nghiệm bốc ngẫu nhiên 10 câu) = **THPT lớp 10** (id `thpt`, test `thpt.test.js`; engine đọc `GV.thpt.add(lớp, môn[])`; môn → chương → bài {theory, ex[{q,s,a}]} + quiz; thêm lớp 11/12 = tạo `thpt-11.js`/`thpt-12.js` và bật nút lớp; nội dung tự biên soạn bám CT GDPT 2018, KHÔNG chép sách giáo khoa); `learn-aiboard.js` = **Bảng đen AI** (id `aiboard`, lưu `gv_aiboard`: 2 canvas chồng (nền + mực), phấn/đường thẳng/chữ/tẩy, hoàn tác, nhiều trang; AI trả JSON khối nội dung (h/p/li/step/f/tri/rect/circ/plot/tbl) → `parseBoard` lọc an toàn → `layout` → `play` viết dần + đọc lời giảng; "Giải bài trên bảng" gửi ảnh qua `GV.learn.ai.vision` (Claude/OpenAI/Gemini); bài mẫu `LIB` dùng không cần khoá; font Patrick Hand trong gameui.css; test `aiboard.test.js`); `learn-cuuchuong.js` = Bé học cửu chương (id `cuuchuong`, lưu `gv_cuuchuong`, đọc số tiếng Việt, luyện thích ứng theo phép hay sai, thi 10 câu, báo cáo phụ huynh; test `cuuchuong.test.js`); `learn-blockcode.js` = **Lập trình khối lệnh** kiểu Scratch tự viết (id `blockcode`, lưu `gv_blockcode`: khối là cây JSON, trình thông dịch bằng generator mỗi khối 1 khung hình, kéo thả bằng pointer events + ô `.slot`, mã chia sẻ base64; tránh class `.stop/.tur/.ghost` – trùng CSS toàn cục; test `blockcode.test.js`); `learn-convo.js` = Đàm thoại song ngữ (id `convo`, test `convo.test.js`; tránh class `.big`/`.lg`); `learn-piano.js` = Học chơi Piano (id `piano`, test `piano.test.js`); `learn-textrans.js` = Dịch văn bản (id `texttrans`, test `textrans.test.js`); `learn-rubik.js` = **Học giải Rubik 3D** (id `rubik`: canvas 3D tự vẽ, lõi 54 sticker + hoán vị sinh từ hình học, bộ giải từng lớp 7 bước `GV.rubik.solve`, test `tools/tests/rubik.test.js`; công thức đặt góc trắng tầng 1 là `R U R' U'` vì chữ thập ở mặt D) |
| `js/tools-chip.js` | **Thiết kế mạch số** (id `chipdesign`, lưu `gv_chipdesign`): sơ đồ SVG kéo thả (IN/CLK/OUT/NOT/AND/OR/NAND/NOR/XOR/XNOR/D-FF), mô phỏng ổn định lặp + bắt cạnh lên xung nhịp, giản đồ sóng, bảng chân trị + rút gọn Quine–McCluskey, biểu thức → mạch (`parseExprs`/`circuitFromExprs`), xuất Verilog + testbench, mã mạch base64; ví dụ cộng/mux/so sánh/chốt SR/bộ đếm; test `chipdesign.test.js`. Chỉ là logic số giáo dục, KHÔNG phải EDA layout/tape-out |
| `js/learn-audiobook.js`, `vendor/` | **Sách nói** (id `audiobook`): tải PDF/DOCX/EPUB/TXT/HTML → tách chữ ngay trong trình duyệt (pdf.js 3.11 UMD, mammoth, JSZip nạp lười từ `vendor/`, KHÔNG làm rối – `build.mjs` chép nguyên) → chia trang → đọc bằng `speechSynthesis` từng câu (tô sáng, tự sang trang, lật trang tự đọc, hẹn giờ, Media Session); thư viện lưu trong IndexedDB `gv_books`; PDF ảnh quét chưa hỗ trợ (cần OCR); **giọng VieNeu AI**: chọn trong ô giọng + nút ⚙ VieNeu (lưu `vnUrl/vnVoice`), gọi `POST <url>/tts` → WAV từng câu có prefetch câu kế; cần chạy `tools/vieneu-server/server.py` (Python, VieNeu ONNX CPU) vì trang tĩnh không chứa được mô hình, chưa thử với VieNeu thật; test `audiobook.test.js` (chạy qua http, fixtures trong `tools/tests/fixtures`); tránh class `.back` (trùng nút của site) |
| `js/media.js` | Nghe nhạc (Openverse CC), Karaoke (mic/echo/thu âm), Xem TV (iptv-org) |
| `js/fb.js`, `js/firebase-config.js` | Firebase (Realtime DB + Auth, SDK compat 10.12.2) |
| `js/account.js`, `cms.html`, `js/cms.js`, `css/cms.css` | Đăng nhập, phân quyền, CMS |
| `js/ads.js`, `js/ads-config.js`, `js/stats.js` | Quảng cáo, bộ đếm lượt (IP băm) |
| `js/registry.js` | Danh sách mục cho CMS — **tạo lại** bằng `node tools/genreg.js` khi thêm game |
| `404.html`, `500.html`, `privacy.html` | Trang lỗi phong cách Tết, quyền riêng tư |
| `database.rules.json` | Rules Firebase — sinh từ `tools/make_rules.py` (chạy lại, đừng sửa tay) |
| `tools/build.mjs`, `.github/workflows/deploy.yml` | Build làm rối mã + deploy Pages |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA (cài lên màn hình chính iOS/Android, network-first + ngoại tuyến) |
| `mobile/`, `.github/workflows/android.yml` | Vỏ Capacitor đóng gói app Android/iOS từ `dist/` (xem `mobile/README.md`; APK build thủ công trên Actions; iOS cần Mac) |

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
- **Mobile đang chơi (`body.ingame`, <600px)**: giữ bottom bar, cả trang cố định 1 màn hình (`100dvh`, không cuộn trang; `main` có `flex:none` + chiều cao cố định, `.stage` cuộn nội bộ nếu thừa, canvas `width/height:auto!important` + `max-height`); ẩn quảng cáo/footer/aurora. Làng Nông Vui: canvas có hạt, ngày/đêm theo giờ máy, chim/bướm/gà, khói, cỏ lay, vòng chạm, bong bóng "Chín rồi".
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
