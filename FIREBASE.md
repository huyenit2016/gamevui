# Bật chơi nhiều người (Lô tô online)

Game **Lô tô online** dùng Firebase Realtime Database + đăng nhập ẩn danh (miễn phí gói Spark).

## 1. Tạo dự án
1. `console.firebase.google.com` → **Create a project** (tắt Analytics).
2. Biểu tượng web **`</>`** → đặt tên → **Register app** → copy khối `firebaseConfig`.
3. **Build → Realtime Database → Create Database** (vị trí Singapore) → cứ chọn *test mode*, rồi làm bước 4.
4. **Build → Authentication → Sign-in method → Anonymous → Enable**.
5. **Authentication → Settings → Authorized domains**: thêm `<user>.github.io` nếu chưa có.

## 2. Dán cấu hình
Mở `js/firebase-config.js`, thay `window.GV_FIREBASE = null;` bằng:

```js
window.GV_FIREBASE = {
  apiKey: "...", authDomain: "...", databaseURL: "https://...firebasedatabase.app",
  projectId: "...", appId: "..."
};
```
(Các giá trị này công khai, không phải mật khẩu. Bảo mật nằm ở Rules bên dưới.)

## 3. Rules (Realtime Database → Rules → dán → Publish)
```json
{
  "rules": {
    "rooms": {
      "$room": {
        ".read": "auth != null",
        ".validate": "$room.matches(/^[0-9]{4}$/)",
        "host": { ".write": "auth != null && !data.exists() && newData.val() === auth.uid" },
        "createdAt": { ".write": "auth != null && !data.exists()" },
        "name": { ".write": "auth != null && root.child('rooms').child($room).child('host').val() === auth.uid" },
        "closed": { ".write": "auth != null && root.child('rooms').child($room).child('host').val() === auth.uid" },
        "round": { ".write": "auth != null && root.child('rooms').child($room).child('host').val() === auth.uid" },
        "status": { ".write": "auth != null && root.child('rooms').child($room).child('host').val() === auth.uid" },
        "called": { ".write": "auth != null && root.child('rooms').child($room).child('host').val() === auth.uid" },
        "winners": {
          ".write": "auth != null && root.child('rooms').child($room).child('host').val() === auth.uid",
          "$w": { ".write": "auth != null && !data.exists() && newData.child('uid').val() === auth.uid" }
        },
        "players": { "$uid": { ".write": "auth != null && auth.uid === $uid" } }
      }
    },
    "lobby": {
      ".read": "auth != null",
      ".indexOn": ["at"],
      "$code": { ".write": "auth != null && root.child('rooms').child($code).child('host').val() === auth.uid" }
    }
  }
}
```

## Cách chơi
- Nhiều nhóm chơi song song: mỗi nhóm **Tạo phòng** riêng (đặt tên nhóm) → được mã 4 số. Phòng đang mở hiện trong danh sách ở màn hình đầu để mọi người bấm **Vào**; cũng có thể bấm **Chia sẻ** gửi link hoặc nhập mã. Chủ phòng có nút **Đóng phòng**.
- Mọi người vào sảnh, chọn số vé (2/4/8/16; mỗi cặp cùng màu không trùng số). Chủ phòng bấm **Bắt đầu** rồi **Gọi số** hoặc **Tự động**.
- Số đã gọi tự đánh dấu; ai đủ một hàng sẽ tự báo **KINH!** và cả phòng thấy ngay. Các máy khác tự kiểm tra lại vé nên báo gian sẽ không được tính.
- Ai vào giữa ván chỉ xem, ván sau mới có vé. Chủ phòng thoát thì phòng dừng gọi số.
