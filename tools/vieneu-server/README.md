# Giọng đọc VieNeu cho Sách nói

Trang web chạy tĩnh trên GitHub Pages nên **không chứa được mô hình VieNeu** (thư viện Python/ONNX). Bạn chạy máy chủ nhỏ này trên máy mình (CPU là đủ), rồi nhập địa chỉ vào nút **⚙ VieNeu** trong Sách nói.

```
pip install vieneu fastapi uvicorn
python server.py
```
Trong Sách nói: ⚙ VieNeu → địa chỉ `http://localhost:8000` → tên giọng (vd `Hải Đăng`, để trống = mặc định).

- Nếu đặt máy chủ lên mạng, dùng HTTPS (trang chạy HTTPS không gọi được http ngoài localhost) và đặt `ALLOW_ORIGINS`.
- API: `POST /tts {text, voice?}` → `audio/wav`. Chưa kiểm tra với VieNeu thật; nếu tên hàm của phiên bản bạn cài khác (`infer`, `save`, `get_preset_voice`), sửa trong `server.py`.
