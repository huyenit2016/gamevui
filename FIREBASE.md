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
Bản này dùng cho tất cả game nhiều người (Lô tô online, Uno, Tiến lên, Ma sói, Cờ tướng, Cờ vua). **Mỗi khi repo cập nhật luật, hãy dán lại.** (Bản này có thêm quyền xoá phòng khi rời/đóng phòng và tự dọn phòng bỏ hoang quá 2 giờ.)
```json
{
  "rules": {
    "mprooms": {
      "$room": {
        ".read": "auth != null",
        "host": {
          ".write": "auth != null && !data.exists() && newData.val() === auth.uid"
        },
        "meta": {
          ".write": "auth != null && (!data.exists() || root.child('mprooms').child($room).child('host').val() === auth.uid)"
        },
        "pub": {
          ".write": "auth != null && root.child('mprooms').child($room).child('host').val() === auth.uid"
        },
        "bots": {
          ".write": "auth != null && root.child('mprooms').child($room).child('host').val() === auth.uid"
        },
        "players": {
          "$uid": {
            ".write": "auth != null && (auth.uid === $uid || root.child('mprooms').child($room).child('host').val() === auth.uid)"
          }
        },
        "act": {
          ".write": "auth != null && root.child('mprooms').child($room).child('host').val() === auth.uid",
          "$uid": {
            ".write": "auth != null && auth.uid === $uid"
          }
        },
        "chat": {
          ".write": "auth != null && root.child('mprooms').child($room).child('host').val() === auth.uid",
          "$id": {
            ".write": "auth != null && !data.exists() && newData.child('uid').val() === auth.uid"
          }
        },
        ".write": "auth != null && !newData.exists() && (root.child('mprooms').child($room).child('host').val() === auth.uid || root.child('mprooms').child($room).child('players').child(auth.uid).exists() || root.child('mplobby').child($room).child('at').val() < now - 7200000)",
        "history": {
          ".write": "auth != null && root.child('mprooms').child($room).child('host').val() === auth.uid"
        }
      }
    },
    "mpprivate": {
      "$room": {
        ".write": "auth != null && (root.child('mprooms').child($room).child('host').val() === auth.uid || (!newData.exists() && (root.child('mprooms').child($room).child('host').val() === auth.uid || root.child('mprooms').child($room).child('players').child(auth.uid).exists() || root.child('mplobby').child($room).child('at').val() < now - 7200000)))",
        "$uid": {
          ".read": "auth != null && auth.uid === $uid",
          ".write": "auth != null && auth.uid === $uid && !newData.exists()"
        }
      }
    },
    "mpstate": {
      "$room": {
        ".read": "auth != null && root.child('mprooms').child($room).child('host').val() === auth.uid",
        ".write": "auth != null && (root.child('mprooms').child($room).child('host').val() === auth.uid || (!newData.exists() && (root.child('mprooms').child($room).child('host').val() === auth.uid || root.child('mprooms').child($room).child('players').child(auth.uid).exists() || root.child('mplobby').child($room).child('at').val() < now - 7200000)))"
      }
    },
    "mplobby": {
      ".read": "auth != null",
      ".indexOn": [
        "at"
      ],
      "$code": {
        ".write": "auth != null && (root.child('mprooms').child($code).child('host').val() === auth.uid || (!newData.exists() && data.child('at').val() < now - 7200000))"
      }
    },
    "stats": {
      ".read": "auth != null",
      "total": {
        ".write": "auth != null && newData.isNumber() && newData.val() === (data.exists() ? data.val() : 0) + 1"
      },
      "unique": {
        ".write": "auth != null && newData.isNumber() && newData.val() === (data.exists() ? data.val() : 0) + 1"
      },
      "ips": {
        "$h": {
          ".write": "auth != null && $h.length === 16",
          "first": {
            ".validate": "!data.exists() && newData.isNumber()"
          },
          "last": {
            ".validate": "newData.isNumber()"
          },
          "n": {
            ".validate": "newData.isNumber() && newData.val() === (data.exists() ? data.val() : 0) + 1"
          },
          "$other": {
            ".validate": "false"
          }
        }
      }
    }
  }
}
```

## Cách chơi
- Nhiều nhóm chơi song song: mỗi nhóm **Tạo phòng** riêng (đặt tên nhóm) → được mã 4 số. Phòng đang mở hiện trong danh sách ở màn hình đầu để mọi người bấm **Vào**; cũng có thể bấm **Chia sẻ** gửi link hoặc nhập mã. Chủ phòng có nút **Đóng phòng**.
- Mọi người vào sảnh, chọn số vé (từ 1 đến 16; vé cùng màu nằm cạnh nhau và không trùng số). Chủ phòng bấm **Bắt đầu** rồi **Gọi số** hoặc **Tự động**.
- Bạn tự dò: nghe số nào có trên vé thì bấm vào ô để đánh dấu. Đủ 5 số một hàng thì bấm **KINH!**; cả phòng thấy ngay và các máy tự kiểm tra lại vé nên báo gian sẽ không được tính.
- Đọc số bằng tiếng Việt / English / 日本語 (chọn ở màn hình đầu hoặc trong phòng).
- Bấm **Ván mới** thì kết quả ván trước được lưu vào **Lịch sử các ván**; chủ phòng có thể xoá từng ván hoặc **Xoá lịch sử kinh**.
- Ai vào giữa ván chỉ xem, ván sau mới có vé. Chủ phòng thoát thì phòng dừng gọi số.

## Game nhiều người (Uno / Tiến lên / Ma sói)
- Vào game → Tạo phòng (hoặc chọn phòng đang mở / nhập mã 4 số) → chủ phòng bấm **+ Bot** để thêm máy chơi cho đủ người → **Bắt đầu**.
- Chủ phòng là "máy chủ" của ván: xử lý luật, bot và thời gian. Nếu chủ phòng thoát hẳn thì ván dừng (chủ phòng tải lại trang vẫn tiếp tục được).
- Người chơi bị mất kết nối sẽ được máy chơi hộ để ván không bị kẹt.
- Bài trên tay / vai trò chỉ người chơi đó đọc được (nằm ở `mpprivate`), nên không xem trộm được bằng công cụ dev của trình duyệt.

## Dọn dữ liệu & thống kê truy cập
- Rời phòng sẽ xoá dữ liệu của bạn trong phòng; phòng trống/đóng bị xoá hẳn; phòng bỏ hoang quá 2 giờ tự bị dọn khi có người mở danh sách phòng. Chat giữ tối đa 50 tin, lịch sử tối đa 30 ván.
- Nếu trước đây bạn đã chạy bản Lô tô online cũ, trong Firebase Console → Realtime Database → tab **Data** còn hai nhánh cũ `rooms` và `lobby`: hãy xoá thủ công (đã không dùng nữa).
- **Đếm lượt truy cập:** mỗi lần mở web (mỗi phiên) cộng 1 vào `stats/total`; mỗi IP mới cộng 1 vào `stats/unique`. IP được băm SHA-256 và chỉ lưu 16 ký tự đầu, **không lưu IP gốc**. Nếu trình duyệt chặn dịch vụ lấy IP (api.ipify.org) thì tính theo mã thiết bị ẩn danh.
