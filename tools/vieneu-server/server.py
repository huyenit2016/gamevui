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


def load_model():
    """Tải mô hình về thư mục thật (không symlink). onnxruntime mới từ chối đọc dữ liệu ngoài
    (*.data) khi file là symlink trong cache Hugging Face -> lỗi "External data path escapes model directory"."""
    from huggingface_hub import snapshot_download
    base = os.environ.get("VIENEU_DIR", os.path.join(os.path.expanduser("~"), "vieneu_models"))
    m = snapshot_download("pnnbao-ump/VieNeu-TTS-v3-Turbo", allow_patterns=["onnx_update/*", "*.json"], local_dir=os.path.join(base, "model"))
    c = snapshot_download("OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX", local_dir=os.path.join(base, "codec"))
    return Vieneu(onnx_dir=os.path.join(m, "onnx_update"), codec_dir=c)


try:
    tts = load_model()
except Exception as e:  # dự phòng: cách tải mặc định của thư viện
    print("Tải thủ công lỗi, thử cách mặc định:", repr(e))
    tts = Vieneu()


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
