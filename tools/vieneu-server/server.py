"""Máy chủ nhỏ bọc VieNeu-TTS cho trang Sách nói của GameVui.
Chạy:  pip install vieneu fastapi uvicorn
       python server.py            (mặc định cổng 8000)
Trang gọi:  POST /tts  {"text": "...", "voice": "tên giọng (tuỳ chọn)"}  ->  audio/wav
"""
import os, tempfile
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from vieneu import Vieneu

# Chỉ cho phép trang web của bạn gọi (đổi nếu cần); thêm http://localhost để thử cục bộ.
ORIGINS = os.environ.get("ALLOW_ORIGINS", "https://huyenit2016.github.io,http://localhost:8080,http://127.0.0.1:8080").split(",")

app = FastAPI(title="VieNeu cho GameVui")
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_methods=["*"], allow_headers=["*"])
tts = Vieneu()  # tải mô hình ONNX chạy CPU lần đầu


class Req(BaseModel):
    text: str
    voice: str | None = None


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/tts")
def synth(r: Req):
    text = r.text.strip()
    if not text or len(text) > 600:
        raise HTTPException(400, "Văn bản rỗng hoặc quá dài")
    kw = {"text": text}
    if r.voice:
        kw["voice"] = tts.get_preset_voice(r.voice)
    audio = tts.infer(**kw)
    fd, path = tempfile.mkstemp(suffix=".wav"); os.close(fd)
    try:
        tts.save(audio, path)
        return Response(open(path, "rb").read(), media_type="audio/wav")
    finally:
        os.remove(path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT", 8000)))
