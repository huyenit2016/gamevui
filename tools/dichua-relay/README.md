# Relay quà TikTok LIVE → Đi Chùa Online

Khi có người **tặng quà** trong phòng TikTok LIVE của bạn, trang `app/dichuaonline` hiện **tên + ảnh đại diện TikTok + một lời nguyện lành tự tạo** (đọc to nếu bật). Trang web tĩnh không tự nối được vào TikTok, nên cần một chương trình nhỏ (relay) chạy trên **máy bạn phát LIVE** (hoặc một máy chủ nhỏ).

> ⚠️ Relay dùng thư viện cộng đồng **không chính thức** [`tiktok-live-connector`](https://github.com/zerodytrash/TikTok-Live-Connector) (đọc luồng dữ liệu công khai của phòng LIVE). TikTok có thể đổi giao thức bất cứ lúc nào, và việc dùng công cụ không chính thức có rủi ro với điều khoản dịch vụ; chỉ dùng cho kênh của chính bạn. Chưa được kiểm chứng với TikTok thật trong repo này.

## Cần chuẩn bị (thông tin cấu hình)
| Cần | Dùng để |
|---|---|
| **Tên kênh TikTok** (`@tenkenh`) – kênh đang LIVE | relay nối vào đúng phòng LIVE (`TIKTOK_USER`) và nút "Xem trực tiếp" trên trang |
| **Node.js ≥ 18** trên máy phát LIVE | chạy relay |
| **Địa chỉ relay** (`http://localhost:8787` nếu cùng máy) | CMS → Chùa Online → "Địa chỉ relay" – trang sẽ nối SSE để nhận quà |
| (Tuỳ chọn) **Firebase Database URL + Database secret** | đẩy quà lên Firebase để *mọi* trang đang mở đều thấy (`FIREBASE_DB_URL`, `FIREBASE_SECRET`) – dùng khi không muốn mở relay ra ngoài |
| (Tuỳ chọn) **TikTok sessionId** (cookie đăng nhập của chính bạn) | giảm bị TikTok giới hạn khi kết nối (`TIKTOK_SESSION_ID`) – giữ bí mật |
| **TikTok LIVE Studio** (hoặc OBS) trên máy tính | thêm cửa sổ trình duyệt mở `…/app/dichuaonline/?live=1` làm "màn hình website" trong LIVE |
| Rules Firebase mới (`database.rules.json`, nhánh `dichua`) | cho phép lời nguyện/đếm/hiện diện; nhớ **Publish** |

## Chạy
```bash
cd tools/dichua-relay
npm install
TIKTOK_USER=tenkenh node relay.js
# mở rộng: PORT=8787 ALLOW_ORIGIN=https://huyenit2016.github.io FIREBASE_DB_URL=... FIREBASE_SECRET=...
```
Thử không cần LIVE: `curl -X POST http://localhost:8787/test` → trang đang nối relay sẽ hiện quà thử.

## Cách ghép với TikTok LIVE
1. Bật LIVE trên TikTok LIVE Studio, thêm nguồn **Window/Browser capture** = cửa sổ mở `…/app/dichuaonline/?live=1` (cảnh 16:9 sạch: tượng Phật, bàn thờ, khói nhang, lịch, lời nguyện chạy chữ).
2. Chạy relay trên cùng máy, điền địa chỉ relay vào CMS (hoặc mở trang với `?relay=http://localhost:8787`).
3. Người xem tặng quà → relay nhận → trang hiện thẻ "tên + avatar + lời nguyện lành" kèm tiếng chuông; ảnh/âm thanh đó nằm trong cảnh bạn đang phát nên người xem TikTok cũng thấy.

## Bảo mật
- Relay chỉ phát dữ liệu quà (tên hiển thị, ảnh https, tên quà, số lượng) – không chứa khoá nào. `FIREBASE_SECRET` và `TIKTOK_SESSION_ID` chỉ nằm trên máy bạn, **đừng commit**.
- Trang chỉ nhận ảnh `https://`; mọi chữ đều được escape.
