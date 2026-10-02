# GameVui – app Android / iOS (Capacitor)

App chỉ là "vỏ" bọc bản web đã build (`../dist`), nên sửa web xong chỉ cần build + sync lại.

## Android (chạy được trên Windows/Mac/Linux, cần Android Studio hoặc JDK 17)
```
npm run build            # ở thư mục gốc -> dist/
cd mobile && npm install
npx cap add android      # chỉ lần đầu
npx cap sync android
npx cap open android     # Android Studio: Build > Build APK / Generate Signed Bundle (AAB để lên Google Play)
```
Hoặc không cần cài gì: GitHub → Actions → **Build Android APK** → Run workflow → tải file `gamevui-debug.apk` ở mục Artifacts.

## iOS (bắt buộc máy Mac + Xcode + tài khoản Apple Developer 99$/năm để lên App Store)
```
npm run build && cd mobile && npm install
npx cap add ios && npx cap sync ios && npx cap open ios
```
Trong Xcode: chọn Team ký, đổi Bundle Id nếu cần, Product > Archive.

## Ghi chú
- `appId` (`vn.gamevui.app`) đổi được trước khi `cap add`; sau khi lên store thì không đổi nữa.
- Chưa có icon/splash riêng cho app: dùng `@capacitor/assets` với `icons/icon-512.png` khi cần.
- Chưa thử trên máy thật / chưa thử upload store. Firebase Auth ẩn danh chạy trong WebView (cần thêm domain `localhost` vào Authorized domains nếu bị chặn).
