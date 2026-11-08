"""Máy chủ nhỏ bọc VieNeu-TTS cho trang Sách nói của GameVui — 2 giọng tiếng Việt:
  • "Adam bựa"  → engine VieNeu v3 Turbo (48 kHz)
  • "Minh Quân" → engine VieNeu v3 Nano  (24 kHz)
Chạy:  pip install vieneu fastapi uvicorn
       python server.py            (mặc định cổng 8000; lần đầu tải mô hình vài trăm MB)
Biến môi trường: PORT, VIENEU_DIR (thư mục lưu mô hình), ALLOW_ORIGINS, ENGINES=turbo,nano (chỉ nạp engine cần dùng, đỡ RAM).
API:  GET /health · GET /voices · POST /tts {"text": "...", "voice": "Adam bựa" | "Minh Quân" | tên giọng khác (tuỳ chọn)} -> audio/wav
"""
import os, tempfile, unicodedata
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from vieneu import Vieneu

# Chỉ cho phép trang web của bạn gọi (đổi nếu cần); thêm http://localhost để thử cục bộ.
ORIGINS = os.environ.get("ALLOW_ORIGINS", "https://huyenit2016.github.io,http://localhost:8080,http://127.0.0.1:8080").split(",")
BASE = os.environ.get("VIENEU_DIR", os.path.join(os.path.expanduser("~"), "vieneu_models"))
WANT = [x.strip() for x in os.environ.get("ENGINES", "turbo,nano").split(",") if x.strip()]
# Giọng mặc định theo tên trên giao diện -> (engine, tên preset trong VieNeu)
DEFAULT = {"adam bựa": ("turbo", "Adam bựa"), "minh quân": ("nano", "Minh Quân")}

app = FastAPI(title="VieNeu cho GameVui")
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_methods=["*"], allow_headers=["*"])


def norm(s):
    return unicodedata.normalize("NFC", (s or "").strip()).casefold()


def load_turbo():
    """Tải mô hình về thư mục thật (không symlink): onnxruntime mới từ chối đọc dữ liệu ngoài (*.data)
    khi file là symlink trong cache Hugging Face -> lỗi "External data path escapes model directory"."""
    from huggingface_hub import snapshot_download
    m = snapshot_download("pnnbao-ump/VieNeu-TTS-v3-Turbo", allow_patterns=["onnx_update/*", "*.json"], local_dir=os.path.join(BASE, "turbo"))
    c = snapshot_download("OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX", local_dir=os.path.join(BASE, "codec"))
    return Vieneu(onnx_dir=os.path.join(m, "onnx_update"), codec_dir=c)


def load_nano():
    try:
        return Vieneu(mode="v3nano")
    except Exception as e:  # cache Hugging Face dùng symlink -> thử tải thủ công vào thư mục thật
        print("Nano: cách mặc định lỗi, thử tải thủ công:", repr(e))
        from huggingface_hub import snapshot_download
        d = snapshot_download("pnnbao-ump/VieNeu-TTS-v3-Nano", local_dir=os.path.join(BASE, "nano"))
        c = snapshot_download("OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX", local_dir=os.path.join(BASE, "codec"))
        return Vieneu(mode="v3nano", onnx_dir=d, codec_dir=c)


ENG = {}
for name, fn in (("turbo", load_turbo), ("nano", load_nano)):
    if name in WANT:
        try:
            ENG[name] = fn()
            print("Đã nạp engine", name)
        except Exception as e:
            print("Không nạp được engine", name, ":", repr(e))
if not ENG:
    raise SystemExit("Không nạp được engine VieNeu nào — kiểm tra mạng / thư viện vieneu.")


def voices():
    out = []
    for en, t in ENG.items():
        try:
            for v in t.list_preset_voices():
                out.append({"name": v[1] if isinstance(v, (tuple, list)) else str(v), "engine": en})
        except Exception:
            pass
    return out


def resolve(voice):
    """Tên giọng -> (engine, tên preset). Giọng mặc định tìm theo bảng DEFAULT, còn lại tìm trong danh sách preset."""
    k = norm(voice)
    if k in DEFAULT and DEFAULT[k][0] in ENG:
        return ENG[DEFAULT[k][0]], DEFAULT[k][1]
    for v in voices():
        if norm(v["name"]) == k:
            return ENG[v["engine"]], v["name"]
    if not voice:
        e = next(iter(ENG.values()))
        return e, None
    raise HTTPException(404, "Không có giọng: " + voice)


class Req(BaseModel):
    text: str
    voice: str | None = None


@app.get("/health")
def health():
    return {"ok": True, "engines": list(ENG)}


@app.get("/voices")
def list_voices():
    vs = voices()
    pick = [{"name": v, "engine": e} for k, (e, v) in DEFAULT.items() if e in ENG]
    return {"featured": pick, "voices": vs}


@app.post("/tts")
def synth(r: Req):
    text = r.text.strip()
    if not text or len(text) > 600:
        raise HTTPException(400, "Văn bản rỗng hoặc quá dài")
    eng, vname = resolve(r.voice)
    kw = {"text": text}
    if vname:
        kw["voice"] = eng.get_preset_voice(vname)
    audio = eng.infer(**kw)
    fd, path = tempfile.mkstemp(suffix=".wav"); os.close(fd)
    try:
        eng.save(audio, path)
        with open(path, "rb") as f:
            return Response(f.read(), media_type="audio/wav")
    finally:
        os.remove(path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT", 8000)))
