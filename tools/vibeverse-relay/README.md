# VIBEVERSE chat relay (tuỳ chọn)
Mặc định VIBEVERSE 3D đồng bộ chat giữa các tab cùng trình duyệt (BroadcastChannel). Muốn chat giữa nhiều máy:
```
npm i ws && node server.js        # cổng 8080 (đổi bằng PORT=...)
```
Mở game bằng `games/vibeverse/index.html?ws=ws://localhost:8080&room=neon-arena`. Triển khai thật: đặt sau HTTPS/WSS và dùng `?ws=wss://domain`.
