// Khung giao diện dùng chung cho game online (GV.mpShell.make(theme)): trang đầu game, phòng chờ kiểu "máy chủ game"
// (avatar, sẵn sàng, thông tin phòng, thiết lập, hành động nhanh, thanh sẵn sàng), cột phải (hồ sơ, voice chat, điều phối, Chat/Lịch sử/Hướng dẫn),
// thông báo sự kiện vào chat và voice chat WebRTC. Mỗi game chỉ khai báo chủ đề (màu, cảnh, lời giới thiệu) và tuỳ chọn hook cấu hình.
(function () {
  /* ---------- hình chân dung (SVG tự vẽ, theo seed) ---------- */
  const SKIN = ['#f1c9a5', '#e0ac85', '#c98e64', '#a86f4c', '#f5d6bd'], HAIR = ['#2b1d14', '#4a2f1d', '#6b4a2b', '#1c1c22', '#8a6a3c', '#5a3a4a', '#c9c2b8'], CLOTH = ['#3d5a5b', '#5b4a3a', '#4a3d5b', '#2f4a3a', '#5b3a3a', '#3a4a5b'];
  function face(seed, st) {
    let h = 0; for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const s = SKIN[h % 5], hr = HAIR[(h >> 3) % 7], cl = CLOTH[(h >> 6) % 6], style = (h >> 9) % 3;
    const hair = style === 0 ? `<path d="M22 44c0-16 9-25 18-25s18 9 18 25c-3-9-9-13-18-13s-15 4-18 13z" fill="${hr}"/>`
      : style === 1 ? `<path d="M20 50c-1-20 8-31 20-31s21 11 20 31l-4-1c0-12-6-18-16-19-10 1-16 7-16 19z" fill="${hr}"/>`
        : `<path d="M24 40c1-13 8-20 16-20 9 0 15 7 16 20-5-5-10-7-16-7s-11 2-16 7z" fill="${hr}"/><path d="M22 34q18-20 36 0q-2-12-18-14q-16 2-18 14z" fill="${hr}" opacity=".8"/>`;
    return `<svg viewBox="0 0 80 80" class="lsface${st === 'dead' ? ' dead' : ''}" aria-hidden="true"><defs><radialGradient id="g${h}" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#2a4048"/><stop offset="1" stop-color="#0f1b22"/></radialGradient></defs>
<circle cx="40" cy="40" r="39" fill="url(#g${h})"/><path d="M14 80c2-15 12-22 26-22s24 7 26 22z" fill="${cl}"/><rect x="35" y="50" width="10" height="10" rx="4" fill="${s}"/><ellipse cx="40" cy="41" rx="14" ry="16" fill="${s}"/>${hair}
<circle cx="35" cy="42" r="1.6" fill="#2a1e18"/><circle cx="45" cy="42" r="1.6" fill="#2a1e18"/><path d="M36 50q4 2.5 8 0" stroke="#7a4a3a" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>`;
  }


  /* ---------- voice chat (WebRTC mesh, tín hiệu qua mprooms/<mã>/voice/<nhận>/<gửi>) ---------- */
  const ICE = () => ({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }].concat(window.GV_TURN || []) });
  const VC = { on: false, stream: null, pcs: {}, auds: {}, muted: false, ref: null, me: null, off: null, seen: {}, level: 0, ac: null, forced: false };
  function vcSend(to, msg) { VC.ref.child(`voice/${to}/${VC.me}`).push(msg).catch(() => {}); }
  function vcPeer(id, initiator) {
    if (VC.pcs[id]) return VC.pcs[id];
    const pc = new RTCPeerConnection(ICE()); VC.pcs[id] = pc;
    VC.stream.getTracks().forEach(t => pc.addTrack(t, VC.stream));
    pc.onicecandidate = e => { if (e.candidate) vcSend(id, { t: 'ice', d: JSON.stringify(e.candidate) }); };
    pc.ontrack = e => { let a = VC.auds[id]; if (!a) { a = VC.auds[id] = new Audio(); a.autoplay = true; a.playsInline = true; } a.srcObject = e.streams[0]; a.play().catch(() => {}); };
    pc.onconnectionstatechange = () => { if (['failed', 'closed'].includes(pc.connectionState)) vcDrop(id); };
    if (initiator) pc.createOffer().then(o => pc.setLocalDescription(o)).then(() => vcSend(id, { t: 'offer', d: JSON.stringify(pc.localDescription) })).catch(() => {});
    return pc;
  }
  function vcDrop(id) { const pc = VC.pcs[id]; if (pc) try { pc.close(); } catch (e) {} delete VC.pcs[id]; const a = VC.auds[id]; if (a) { a.srcObject = null; delete VC.auds[id]; } }
  async function vcInbox(snap) {
    const box = snap.val() || {};
    for (const from in box) for (const k in box[from] || {}) {
      if (VC.seen[k]) continue; VC.seen[k] = 1; const m = box[from][k]; VC.ref.child(`voice/${VC.me}/${from}/${k}`).remove().catch(() => {});
      try {
        if (m.t === 'offer') { vcDrop(from); const pc = vcPeer(from, false); await pc.setRemoteDescription(JSON.parse(m.d)); const an = await pc.createAnswer(); await pc.setLocalDescription(an); vcSend(from, { t: 'answer', d: JSON.stringify(pc.localDescription) }); }
        else if (m.t === 'answer' && VC.pcs[from]) await VC.pcs[from].setRemoteDescription(JSON.parse(m.d));
        else if (m.t === 'ice' && VC.pcs[from]) await VC.pcs[from].addIceCandidate(JSON.parse(m.d));
      } catch (e) { console.warn('voice', e); }
    }
  }
  async function vcJoin(L) {
    if (VC.on) return;
    if (!navigator.mediaDevices || !window.RTCPeerConnection) { L.toast('Trình duyệt không hỗ trợ voice chat.'); return; }
    try { VC.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
    catch (e) { L.toast('Không mở được micro: ' + (e.name === 'NotAllowedError' ? 'bạn chưa cho phép' : e.message)); return; }
    VC.on = true; VC.ref = L.roomRef; VC.me = L.me; VC.seen = {};
    const inbox = VC.ref.child('voice/' + VC.me); inbox.on('value', vcInbox); VC.off = () => inbox.off('value', vcInbox);
    VC.ref.child(`players/${VC.me}/vc`).set(true); VC.ref.child(`players/${VC.me}/vc`).onDisconnect().remove();
    try { const ac = VC.ac = new (window.AudioContext || window.webkitAudioContext)(), an = ac.createAnalyser(); an.fftSize = 256; ac.createMediaStreamSource(VC.stream).connect(an); const buf = new Uint8Array(an.frequencyBinCount);
      VC.lt = setInterval(() => { an.getByteFrequencyData(buf); VC.level = buf.reduce((a, b) => a + b, 0) / buf.length; const sp = VC.level > 18 && !VC.muted && !VC.forced; if (sp !== VC.sp) { VC.sp = sp; VC.ref.child(`players/${VC.me}/sp`).set(sp || null).catch(() => {}); } }, 300); } catch (e) {}
    vcApply(); L.toast('🎙 Đã vào voice chat');
  }
  function vcLeave() {
    if (!VC.on) return; VC.on = false; clearInterval(VC.lt); if (VC.off) VC.off(); Object.keys(VC.pcs).forEach(vcDrop);
    if (VC.stream) VC.stream.getTracks().forEach(t => t.stop()); VC.stream = null; if (VC.ac) VC.ac.close().catch(() => {}); VC.ac = null;
    if (VC.ref) { VC.ref.child(`players/${VC.me}/vc`).remove().catch(() => {}); VC.ref.child(`players/${VC.me}/sp`).remove().catch(() => {}); VC.ref.child(`voice/${VC.me}`).remove().catch(() => {}); }
  }
  const vcApply = () => { if (VC.stream) VC.stream.getAudioTracks().forEach(t => { t.enabled = !VC.muted && !VC.forced; }); };
  // mỗi lần phòng thay đổi: nối/ngắt với ai đang bật voice; người có id nhỏ hơn chủ động gọi
  function vcSync(L, lock) {
    if (!VC.on) return;
    const peers = Object.entries(L.R.players || {}).filter(([id, p]) => id !== VC.me && p && p.vc && p.online !== false).map(([id]) => id);
    Object.keys(VC.pcs).filter(id => !peers.includes(id)).forEach(vcDrop);
    peers.forEach(id => { if (!VC.pcs[id] && VC.me < id) vcPeer(id, true); });
    // luật phòng (tuỳ game), ví dụ Ma Sói: ban đêm tắt mic, người đã chết chỉ được nghe
    const f = !!(lock && lock(L)); if (f !== VC.forced) { VC.forced = f; vcApply(); }
  }

  /* ---------- thông báo sự kiện vào chat (chỉ chủ phòng đăng, khoá idempotent) ---------- */
  const EV = { seats: null, logN: {} };
  function events(L, logEv) {
    if (!L.isHost) return;
    const chat = L.roomRef.child('chat'), say = (k, text) => chat.child(k).set({ uid: L.me, name: 'Hệ thống', sys: 1, text: text.slice(0, 200), at: Date.now() }).catch(() => {});
    const cur = Object.fromEntries(L.seats.filter(s => !s.bot).map(s => [s.id, s]));
    if (EV.seats && EV.code === L.code) {
      Object.values(cur).forEach(s => { if (!EV.seats[s.id]) say('sj_' + s.id.slice(0, 12) + '_' + (s.at || 0), `${s.name} đã tham gia phòng`); else if (EV.seats[s.id].online && !s.online) say('so_' + s.id.slice(0, 12) + '_' + Date.now(), `${s.name} mất kết nối`); });
      Object.keys(EV.seats).forEach(id => { if (!cur[id]) say('sl_' + id.slice(0, 12) + '_' + Date.now(), `${EV.seats[id].name} đã rời phòng`); });
    }
    EV.seats = cur; EV.code = L.code;
    const lg = (L.pub && L.pub.log) || []; EV.done = EV.done || new Set();
    // log công khai (30 dòng cuối) → chat; khoá theo nội dung nên tải lại trang cũng không đăng trùng
    if (logEv && L.status !== 'lobby') lg.forEach(t => { let h = 0; for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0; const k = `se_${L.code}_${L.round}_${h.toString(36)}`; if (!EV.done.has(k)) { EV.done.add(k); say(k.replace('se_' + L.code + '_', 'se_'), t); } });
  }


  /* ---------- CSS chung (màu theo biến --s0/--s1/--s2 nền, --sa nhấn, --sb phụ) ---------- */
  const RCSS = `
.lsroom{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:14px;align-items:start;text-align:left;color:#e6e8e4;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}
.lsroom .lsr-box{background:var(--s1);border:1px solid #ffffff14;border-radius:14px}
.lsroom .lsr-head{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;padding:12px 16px}.lsroom .lsr-head h2{margin:0;font-size:1.25rem;color:#f1ece2}.lsroom .lsr-head .code{font:700 1.25rem system-ui;color:#f1ece2;letter-spacing:.04em}
.lsroom .lsr-cd{display:inline-flex;gap:6px;align-items:center;font-size:.85rem;color:#98a8ae}.lsroom .lsr-cd b{background:var(--sb2);border:1px solid var(--sb3);color:var(--sb);padding:2px 8px;border-radius:6px;letter-spacing:.08em}
.lsroom .lsr-sp{flex:1}.lsroom .lsr-pl{display:inline-flex;gap:6px;align-items:center;font-size:.86rem}.lsroom .lsr-st{background:#10b98122;color:#4ade80;border-radius:99px;padding:3px 10px;font-size:.8rem;font-weight:600}.lsroom .lsr-st.play{background:color-mix(in srgb,var(--sa) 13%,transparent);color:var(--sa)}
.lsroom .lsr-ib{width:38px;height:38px;border-radius:50%;border:1px solid #ffffff24;background:var(--s2);color:#cfe;cursor:pointer;font-size:1rem;display:inline-grid;place-items:center;padding:0}.lsroom .lsr-ib.rd{color:#f87171;border-color:#f8717155}
.lsroom .lsr-scene{position:relative;overflow:hidden;border-radius:14px;margin-top:12px;min-height:300px;padding:22px 12px 18px;text-align:center;border:1px solid #ffffff14}
.lsroom .lsr-bg{position:absolute;inset:0;width:100%;height:100%;z-index:0}.lsroom .lsr-scene>*:not(svg){position:relative;z-index:1}
.lsroom .lsfog{animation:lsfog 18s linear infinite}.lsroom .lsfog.b{animation-duration:26s;animation-direction:reverse}@keyframes lsfog{50%{transform:translateX(120px)}}
.lsroom .lsr-scene h3{margin:0;font:600 1.15rem system-ui;color:#f3efe6;text-shadow:0 2px 8px #000}.lsroom .lsr-scene p{margin:4px 0 14px;font-size:.86rem;color:#c8d2d6;text-shadow:0 1px 4px #000}
.lsroom .lsr-ppl{display:grid;grid-template-columns:repeat(4,minmax(0,120px));justify-content:center;gap:14px 18px}
.lsroom .lsr-pp{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0}.lsroom .lsr-av{position:relative;width:74px;height:74px;border-radius:50%;padding:3px;background:linear-gradient(#6aa7d8,#3a5f86)}
.lsroom .lsr-av.h{background:linear-gradient(var(--sa3),var(--sa2))}.lsroom .lsr-av svg{width:100%;height:100%;display:block;border-radius:50%}.lsroom .lsr-av .dot{position:absolute;right:3px;bottom:3px;width:13px;height:13px;border-radius:50%;background:#22c55e;border:2px solid var(--s1)}.lsroom .lsr-av .dot.off{background:#6b7280}
.lsroom .lsr-av .ok{position:absolute;left:-2px;bottom:0;background:#22c55e;color:#04140a;border-radius:50%;width:18px;height:18px;font-size:11px;display:grid;place-items:center;font-weight:900}
.lsroom .lsr-pp b{font-size:.88rem;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 1px 4px #000}.lsroom .lsr-pp small{font-size:.74rem;color:#b9c4c8}.lsroom .lsr-pp small.h{color:var(--sa)}
.lsroom .lsr-pp.empty .lsr-av{background:#ffffff10;border:1px dashed #ffffff40}.lsroom .lsr-pp.empty .lsr-av span{display:grid;place-items:center;height:100%;color:#ffffff55;font-size:1.4rem}
.lsroom .lobby{margin-top:12px}.lsroom .lsr-row{display:grid;grid-template-columns:1fr 1.5fr 1fr;gap:0}.lsroom .lsr-row>div{padding:14px 16px;border-right:1px solid #ffffff12}.lsroom .lsr-row>div:last-child{border:0}
.lsroom h4{margin:0 0 10px;font-size:.95rem;color:#f1ece2}.lsroom .lsr-kv{display:grid;grid-template-columns:auto 1fr;gap:8px 12px;font-size:.85rem}.lsroom .lsr-kv span{color:#98a8ae}.lsroom .lsr-kv b{text-align:right;font-weight:500;color:#e6e8e4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lsroom .lsr-roles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.lsroom .lsr-rc{background:var(--s2);border:1px solid #ffffff14;border-radius:12px;padding:8px 4px;text-align:center}.lsroom .lsr-rc i{font-style:normal;font-size:1.6rem;display:block}
.lsroom .lsr-rc small{display:block;font-size:.76rem;color:#cfd6d4}.lsroom .lsr-rc .n{display:flex;justify-content:center;align-items:center;gap:6px;margin-top:4px;font-weight:700}.lsroom .lsr-rc button{width:24px;height:24px;border-radius:50%;border:1px solid #ffffff30;background:var(--s1);color:#e6e8e4;cursor:pointer;padding:0;line-height:1}
.lsroom .lsr-rc button:disabled{opacity:.3;cursor:default}.lsroom .lsr-note{font-size:.76rem;color:#98a8ae;margin-top:8px}.lsroom .lsr-warn{color:#fca5a5;font-size:.8rem;margin-top:6px}
.lsroom .lsr-mode{display:flex;gap:6px;margin-bottom:8px}.lsroom .lsr-mode button{flex:1;border-radius:8px;border:1px solid #ffffff24;background:none;color:#cfd6d4;padding:5px;font-size:.78rem;cursor:pointer}.lsroom .lsr-mode button.on{background:color-mix(in srgb,var(--sa) 13%,transparent);border-color:var(--sa);color:var(--sa)}
.lsroom .lsr-qa{display:flex;flex-direction:column;gap:8px}.lsroom .lsr-qa button{border-radius:8px;border:1px solid #2f4a66;background:#0f1d2b;color:#e6e8e4;padding:9px 10px;font-size:.86rem;cursor:pointer;font-weight:600}
.lsroom .lsr-qa .go{background:linear-gradient(#22a565,#15804c);border-color:#22c55e;font-size:1rem;padding:12px}.lsroom .lsr-qa .rdy{background:#15804c33;border-color:#22c55e;color:#86efac}.lsroom .lsr-qa .rdy.on{background:#22c55e;color:#04140a}
.lsroom .lsr-qa .out{color:#fca5a5;border-color:#7f1d1d}.lsroom .hostctl{display:flex;gap:6px;flex-wrap:wrap}.lsroom .hostctl button{flex:1;font-size:.76rem;padding:6px}
.lsroom .lsr-rb{display:flex;align-items:center;gap:14px;padding:14px 16px;margin-top:12px;flex-wrap:wrap}.lsroom .lsr-rb .bar{flex:1;min-width:120px;height:10px;background:#1f2d3a;border-radius:99px;overflow:hidden}.lsroom .lsr-rb .bar i{display:block;height:100%;background:linear-gradient(90deg,#22c55e,#4ade80)}
.lsroom .lsr-rb .avs{display:flex;gap:4px;flex-wrap:wrap}.lsroom .lsr-rb .avs span{position:relative;width:34px;height:34px}.lsroom .lsr-rb .avs svg{width:34px;height:34px;border-radius:50%}.lsroom .lsr-rb .avs span.no svg{opacity:.4;filter:grayscale(1)}.lsroom .lsr-rb .avs span.y:after{content:'✓';position:absolute;right:-2px;bottom:-2px;background:#22c55e;color:#04140a;border-radius:50%;width:14px;height:14px;font-size:9px;display:grid;place-items:center;font-weight:900}
.lsroom .lsr-rb .all{color:#4ade80;font-size:.8rem;border:1px solid #22c55e55;border-radius:8px;padding:5px 10px}
.lsroom .lsr-side{display:flex;flex-direction:column;gap:12px;position:sticky;top:8px}.lsroom .lsr-me{display:flex;gap:12px;align-items:center;padding:14px}.lsroom .lsr-me svg{width:58px;height:58px;border-radius:50%;border:2px solid var(--sa)}.lsroom .lsr-me b{font-size:1.05rem}.lsroom .lsr-me small{display:block;color:var(--sa);font-size:.8rem}
.lsroom .lsr-tabs{display:flex;margin:10px 10px 0;border-bottom:1px solid #ffffff14}.lsroom .lsr-tabs button{flex:1;background:none;border:0;color:#98a8ae;padding:9px 4px;cursor:pointer;font-weight:600;border-radius:8px 8px 0 0}.lsroom .lsr-tabs button.on{background:var(--sb2);color:#f1ece2}
.lsroom .lsr-pane{padding:10px}.lsroom .lsr-pane[hidden]{display:none}.lsroom .chat .cl{max-height:420px;min-height:220px;overflow:auto;font-size:.88rem}.lsroom .lsr-msg{display:flex;gap:9px;padding:7px 2px}.lsroom .lsr-msg svg{width:34px;height:34px;border-radius:50%;flex:none}
.lsroom .lsr-msg b{color:var(--sb);font-weight:600}.lsroom .lsr-msg time{color:#6b7c86;font-size:.72rem;margin-left:6px}.lsroom .lsr-msg p{margin:2px 0 0;color:#e6e8e4;word-break:break-word}
.lsroom .lsr-in{display:flex;gap:6px;margin-top:8px}.lsroom .lsr-in input{flex:1;background:var(--s0);border:1px solid #ffffff24;border-radius:10px;color:#e6e8e4;padding:9px 10px;font-size:16px}.lsroom .lsr-in button{border-radius:10px;border:0;background:var(--sb2);color:var(--sb);padding:0 14px;cursor:pointer;font-size:1.1rem}
.lsroom .err{color:#fca5a5;min-height:1em;text-align:center;font-weight:600}.lsroom .hl{font-size:.84rem}.lsroom .hostend{margin-top:10px;text-align:center}
.lsroom .lsr-rl div{display:flex;gap:8px;padding:7px 0;border-bottom:1px solid #ffffff12;font-size:.82rem}.lsroom .lsr-rl i{font-style:normal;font-size:1.3rem}.lsroom .lsr-rl p{margin:2px 0 0;color:#b9c4c8}
.lsroom .lsr-pp small.y{color:#4ade80}.lsroom .lsr-pp small.off{color:#9ca3af;letter-spacing:.06em;text-transform:uppercase;font-size:.66rem}.lsroom .lsr-pp .vcb{font-size:.7rem;opacity:.6}.lsroom .lsr-pp .vcb.sp{opacity:1;filter:drop-shadow(0 0 4px #4ade80)}
.lsroom .lsr-fire{position:relative;width:60px;height:46px;margin:6px auto 0}.lsroom .lsr-fire:before{content:'';position:absolute;left:-60px;right:-60px;bottom:-14px;height:60px;background:radial-gradient(closest-side,#f59e0b66,#f59e0b00);animation:lsglow 2s ease-in-out infinite}
.lsroom .lsr-fire i{position:absolute;bottom:4px;left:50%;width:22px;height:34px;margin-left:-11px;border-radius:50% 50% 45% 45%/60% 60% 40% 40%;background:radial-gradient(circle at 50% 80%,#fff4c2,#fbbf24 40%,#f97316 70%,#f9731600);transform-origin:50% 100%;animation:lsfl2 .9s ease-in-out infinite alternate}
.lsroom .lsr-fire i:nth-child(2){width:16px;height:24px;margin-left:-20px;animation-delay:.2s}.lsroom .lsr-fire i:nth-child(3){width:16px;height:26px;margin-left:4px;animation-delay:.45s}.lsroom .lsr-fire:after{content:'';position:absolute;left:8px;right:8px;bottom:0;height:7px;border-radius:4px;background:#5b3a1e;box-shadow:0 -2px 0 #3b2612}
@keyframes lsfl2{to{transform:scaleY(1.18) skewX(4deg)}}@keyframes lsglow{50%{opacity:.6}}
.lsroom .lsr-vc,.lsroom .lsr-ctl{padding:12px}.lsroom .lsr-vc .vh{display:flex;justify-content:space-between;font-size:.9rem}.lsroom .lsr-vc .vst{color:#98a8ae;font-size:.78rem}.lsroom .lsr-vc .vl{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.lsroom .lsr-vc .vl span.vnote{width:auto;display:block;font-size:.76rem}.lsroom .lsr-vc .vl span:not(.vnote){display:flex;flex-direction:column;align-items:center;font-size:.7rem;width:48px}.lsroom .lsr-vc .vl svg{width:36px;height:36px;border-radius:50%;border:2px solid transparent}.lsroom .lsr-vc .vl span.sp svg{border-color:#4ade80;box-shadow:0 0 10px #4ade80}.lsroom .lsr-vc .vl em{font-style:normal;max-width:48px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lsroom .lsr-vc .vb{display:flex;gap:6px}.lsroom .lsr-vc button,.lsroom .lsr-ctl button{flex:1;border-radius:8px;border:1px solid #2f4a66;background:#0f1d2b;color:#e6e8e4;padding:8px;cursor:pointer;font-weight:600;font-size:.84rem}.lsroom .lsr-vc .vnote{font-size:.72rem;color:#6b7c86;margin-top:6px}
.lsroom .lsr-ctl .cinfo{font-size:.82rem;color:#cfd6d4;margin:6px 0 8px}.lsroom .lsr-ctl button{width:100%;border-color:color-mix(in srgb,var(--sa) 47%,transparent);color:var(--sa)}
.lsroom .lsr-msg.sys{background:#10b98114;border-radius:8px;padding:6px 8px}.lsroom .lsr-msg.sys b{color:#4ade80}.lsroom .lsr-msg .si{width:34px;text-align:center;font-size:1.2rem}
@media(max-width:980px){.lsroom{grid-template-columns:1fr}.lsroom .lsr-side{position:static}}
@media(max-width:700px){.lsroom .lsr-row{grid-template-columns:1fr}.lsroom .lsr-row>div{border-right:0;border-bottom:1px solid #ffffff12}.lsroom .lsr-ppl{grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 6px}.lsroom .lsr-av{width:56px;height:56px}.lsroom .lsr-scene{min-height:0;padding:16px 8px}
.lsroom .lsr-head{padding:10px 12px}.lsroom .lsr-head .lsr-sp{display:none}.lsroom .lsr-me{padding:10px}}`;
  const ECSS = `
.lse{position:relative;overflow:hidden;border-radius:20px;color:#e6e8e4;text-align:left;background:var(--s0);border:1px solid #ffffff14;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}
.lse .lsr-bg{position:absolute;inset:0;width:100%;height:100%;opacity:.75}.lse .lsfog{animation:lsfog 18s linear infinite}.lse .lsfog.b{animation-duration:26s;animation-direction:reverse}
.lse:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,color-mix(in srgb,var(--s0) 95%,transparent) 0,color-mix(in srgb,var(--s0) 80%,transparent) 45%,color-mix(in srgb,var(--s0) 33%,transparent) 100%),linear-gradient(0deg,var(--s0) 0,color-mix(in srgb,var(--s0) 0%,transparent) 40%);pointer-events:none}
.lse>.in{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:28px;padding:44px 40px 34px;align-items:center}
.lse>.in>*{min-width:0}.lse .k{font:700 .72rem/1.6 system-ui;letter-spacing:.32em;color:var(--sa);text-transform:uppercase}
.lse h1{font:400 clamp(2.3rem,5.2vw,4.1rem)/1.04 Georgia,'Times New Roman',serif;margin:.25em 0 .1em;color:#f1ece2;letter-spacing:-.01em}
.lse h1 em{display:block;font-style:italic;color:var(--sa);font-size:.62em;margin-top:.2em}
.lse .lead{font-size:1rem;line-height:1.75;color:#b9c4c8;max-width:34em;margin:14px 0 20px}
.lse .feat{display:flex;flex-wrap:wrap;gap:10px}.lse .feat span{border:1px solid #ffffff1f;background:#ffffff08;border-radius:99px;padding:6px 12px;font-size:.8rem;color:#cfd6d4}
.lse .cardx{background:color-mix(in srgb,var(--s1) 90%,transparent);backdrop-filter:blur(6px);border:1px solid color-mix(in srgb,var(--sa) 20%,transparent);border-radius:18px;padding:20px;box-shadow:0 18px 70px #0006}
.lse .cardx h3{margin:0 0 12px;font:400 1.3rem Georgia,serif;color:#f1ece2}.lse label{display:block;font-size:.8rem;color:#98a8ae;margin:8px 0 4px}
.lse input{width:100%;box-sizing:border-box;background:var(--s0);border:1px solid #ffffff24;border-radius:10px;color:#e6e8e4;padding:11px 12px;font-size:16px}
.lse input:focus{outline:none;border-color:var(--sa)}.lse .mk{width:100%;margin-top:14px;background:linear-gradient(var(--sa3),var(--sa));color:#1b1408;border:0;border-radius:12px;padding:13px;font:700 1rem system-ui;cursor:pointer;box-shadow:0 8px 24px color-mix(in srgb,var(--sa) 20%,transparent)}
.lse .mk:hover{filter:brightness(1.06)}.lse .or{display:flex;align-items:center;gap:10px;color:#6b7c86;font-size:.76rem;margin:16px 0 8px}.lse .or:before,.lse .or:after{content:'';flex:1;height:1px;background:#ffffff1a}
.lse .jr{display:flex;gap:8px}.lse .jr input{text-align:center;letter-spacing:.3em;font-weight:700;font-size:1.15rem}.lse .jn{flex:none;background:var(--sb2);border:1px solid var(--sb3);color:var(--sb);border-radius:10px;padding:0 16px;font-weight:700;cursor:pointer}
.lse .rl{max-height:190px;overflow:auto;display:flex;flex-direction:column;gap:6px;font-size:.84rem}.lse .rli{display:flex;align-items:center;gap:10px;background:var(--s2);border:1px solid #ffffff14;border-radius:12px;padding:8px 10px}
.lse .rli b{display:block;color:#f1ece2}.lse .rli small{color:#98a8ae}.lse .rli .st{margin-left:auto;font-size:.72rem;border-radius:99px;padding:2px 8px;background:#10b98122;color:#4ade80}.lse .rli .st.p{background:color-mix(in srgb,var(--sa) 13%,transparent);color:var(--sa)}
.lse .rli button{background:none;border:1px solid color-mix(in srgb,var(--sa) 47%,transparent);color:var(--sa);border-radius:8px;padding:6px 12px;cursor:pointer;font-weight:700}.lse .msg{color:#fca5a5;min-height:1.2em;font-size:.86rem;margin-top:8px}
.lse .how{position:relative;z-index:1;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:0 40px 34px}.lse .how div{background:color-mix(in srgb,var(--s1) 80%,transparent);border:1px solid #ffffff14;border-radius:14px;padding:14px}
.lse .how i{font-style:normal;font-size:1.4rem}.lse .how b{display:block;margin:6px 0 4px;font:400 1.05rem Georgia,serif;color:var(--sa)}.lse .how p{margin:0;font-size:.8rem;color:#b9c4c8;line-height:1.5}
.lse .wolf{position:absolute;right:4%;bottom:0;width:min(30%,260px);opacity:.5;z-index:0}
@media(max-width:860px){.lse>.in{grid-template-columns:1fr;padding:28px 18px 18px;gap:18px}.lse .how{grid-template-columns:1fr 1fr;padding:0 18px 18px}.lse:after{background:linear-gradient(0deg,var(--s0) 10%,color-mix(in srgb,var(--s0) 70%,transparent) 60%,color-mix(in srgb,var(--s0) 50%,transparent))}.lse .lead{font-size:.92rem;margin:10px 0 14px}}
@media(max-width:480px){.lse{border-radius:14px}.lse>.in{padding:20px 14px 14px;gap:14px}.lse .k{font-size:.6rem;letter-spacing:.2em}.lse h1{font-size:2rem}.lse .lead{display:none}.lse .feat{flex-wrap:nowrap;overflow-x:auto;margin-top:10px;padding-bottom:2px}.lse .feat span{font-size:.72rem;white-space:nowrap}.lse .cardx{padding:14px}.lse .cardx h3{display:none}.lse .how{grid-template-columns:1fr 1fr;gap:8px;padding:0 14px 14px}.lse .how p{display:none}.lse .how div{padding:10px}}`;

  const lobbyItem = (c, r, esc) => `<div class="rli"><div><b>${esc(r.name || 'Phòng ' + c)}</b><small>#${c} · ${esc(r.hostName || '')} · ${r.count || 0} người</small></div><span class="st${r.status === 'lobby' ? '' : ' p'}">${r.status === 'lobby' ? 'Đang chờ' : 'Đang chơi'}</span>${r.status === 'lobby' ? `<button data-c="${c}">Vào</button>` : ''}</div>`;
  const hm = t => { const d = new Date(t); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const chatItem = (m, esc) => m.sys ? `<div class="lsr-msg sys"><span class="si">📣</span><div><b>Hệ thống</b><time>${hm(m.at)}</time><p>${esc(m.text)}</p></div></div>` : `<div class="lsr-msg">${face(m.uid)}<div><b>${esc(m.name)}</b><time>${hm(m.at)}</time><p>${esc(m.text)}</p></div></div>`;
  const VARS = { s0: '#0b141b', s1: '#0f1a24', s2: '#132232', sa: '#dfbc7a', sa2: '#9e7944', sa3: '#ecd09a', sb: '#8fc8ff', sb2: '#16304a', sb3: '#2f5d86' };

  // cuộn trong khung .stage (không cuộn cả trang: trên mobile đang chơi trang bị khoá 1 màn hình, scrollIntoView làm trang trượt lên và che nội dung)
  const inView = (n, block) => { const st = n.closest('.stage'); if (!st) return n.scrollIntoView({ behavior: 'smooth', block }); const a = n.getBoundingClientRect(), b = st.getBoundingClientRect(); st.scrollTo({ top: st.scrollTop + (a.top - b.top) - (block === 'center' ? (b.height - a.height) / 2 : 8), behavior: 'smooth' }); };
  function make(T) {
    T = Object.assign({ min: 2, max: 8, bots: true, fire: false, skip: false, logEvents: false, waitTitle: 'Phòng đang chờ…', cfgTitle: 'Thiết lập ván', cfgNote: 'Chủ phòng bắt đầu khi mọi người đã sẵn sàng.', rulesBrief: '', mode: 'Cơ bản',
      voiceNote: 'Bật voice để nói chuyện trực tiếp với cả phòng.', guideTab: 'Hướng dẫn', guide: [], feats: [], steps: [], formTitle: 'Mở phòng chơi', roomPh: 'Ví dụ: Nhóm tối thứ 7', cta: '▶ Tạo phòng ngay' }, T);
    T.vars = Object.entries(Object.assign({}, VARS, T.colors || {})).map(([k, v]) => `--${k}:${v}`).join(';');
    function entryTpl({ esc, name, room, code, err }) {
      return `<div class="lse" style="${T.vars}">${T.scene}${T.mascot || ''}<div class="in"><div>
  <div class="k">${T.kicker}</div>
  <h1>${T.h1}<em>${T.em}</em></h1>
  <p class="lead">${T.lead}</p>
  <div class="feat">${T.feats.map(f => `<span>${f}</span>`).join('')}</div></div>
  <div class="cardx"><h3>${T.formTitle}</h3>
  <label>Tên của bạn</label><input class="nm" maxlength="16" placeholder="Ví dụ: Huyền" value="${esc(name)}">
  <label>Tên phòng / nhóm</label><input class="rn" maxlength="24" placeholder="${T.roomPh}" value="${esc(room)}">
  <button class="mk">${T.cta}</button>
  <div class="or">hoặc vào bằng mã phòng</div><div class="jr"><input class="cd" inputmode="numeric" maxlength="4" placeholder="0000" value="${esc(code)}"><button class="jn">Vào phòng</button></div>
  <div class="or">phòng đang mở</div><div class="rl"><div class="hint">Đang tải danh sách phòng…</div></div>
  <p class="msg">${esc(err)}</p></div></div>
  <div class="how">${T.steps.map(([i, b, p]) => `<div><i>${i}</i><b>${b}</b><p>${p}</p></div>`).join('')}</div></div>`;
    }
    const lobbyItem = (c, r, esc) => `<div class="rli"><div><b>${esc(r.name || 'Phòng ' + c)}</b><small>#${c} · ${esc(r.hostName || '')} · ${r.count || 0} người</small></div><span class="st${r.status === 'lobby' ? '' : ' p'}">${r.status === 'lobby' ? 'Đang chờ' : 'Đang chơi'}</span>${r.status === 'lobby' ? `<button data-c="${c}">Vào</button>` : ''}</div>`;


    function roomTpl({ code, opts }) {
      return `<div class="mp lsroom" style="${T.vars}"><div class="lsr-main">
  <div class="lsr-box lsr-head"><h2>Phòng #<span class="code">${code}</span></h2><span class="lsr-cd">Mã phòng: <b>${code}</b><button class="lsr-ib lsr-copy" title="Sao chép mã phòng" style="width:28px;height:28px">⧉</button></span><span class="lsr-sp"></span>
  <span class="lsr-pl">👥 <span class="lsr-cnt"></span></span><span class="lsr-st">● Đang chờ</span><button class="lsr-ib share" title="Chia sẻ link mời">🔗</button><button class="lsr-ib lsr-gear" title="${T.cfg ? 'Cấu hình vai' : 'Thiết lập ván'}">⚙</button><button class="lsr-ib rd leave" title="Rời phòng">⎋</button></div>
  <div class="lsr-scene">${T.scene}<h3 class="lsr-ttl">${T.waitTitle}</h3><p class="lsr-sub"></p><div class="lsr-ppl"></div>${T.fire ? '<div class="lsr-fire" aria-hidden="true"><i></i><i></i><i></i></div>' : ''}</div>
  <div class="seats" hidden></div><div class="err"></div><div class="game" hidden></div>
  <div class="lobby" hidden><div class="lsr-box lsr-row">
   <div><h4>Thông tin phòng</h4><div class="lsr-kv"><span>🏷 Tên phòng</span><b class="rname"></b><span>🔑 Mã phòng</span><b style="color:#8fc8ff">${code}</b><span>👥 Số người</span><b class="lsr-cnt2"></b><span>⏱ Trạng thái</span><b class="lsr-st2">Đang chờ</b><span>🎮 Chế độ</span><b class="lsr-md"></b></div></div>
   <div class="lsr-cfg"><h4>${T.cfgTitle}</h4>${T.cfg ? '<div class="lsr-mode"></div><div class="lsr-roles"></div>' : `<div class="lsr-rules">${T.rulesBrief}</div>`}${(opts || []).map(o => `<label class="optl lsr-opt">${GV.esc(o.label)} <select class="opt" data-k="${o.k}">${o.values.map(v => `<option>${v}</option>`).join('')}</select></label>`).join('')}<div class="lsr-warn"></div><div class="lsr-note">${T.cfgNote}</div></div>
   <div><h4>Hành động nhanh</h4><div class="lsr-qa"><button class="go lsr-go">▶ Bắt đầu trò chơi</button><button class="rdy lsr-rdy">✋ Tôi đã sẵn sàng</button><button class="lsr-guide">📖 Xem hướng dẫn</button><button class="lsr-copy2">⧉ Sao chép link mời</button><button class="out lsr-out">⎋ Rời phòng</button>
   <div class="hostctl" hidden><button class="btn ghost addbot">🤖 + Bot</button><button class="btn ghost rmbot">🤖 − Bot</button><button class="btn bad closeroom">⛔ Đóng</button><button class="start" hidden></button></div></div><div class="msg wait" style="font-size:.8rem;color:#98a8ae;margin-top:6px"></div></div>
  </div><div class="lsr-box lsr-rb"><b style="font-size:.92rem">Trạng thái sẵn sàng</b><div class="bar"><i></i></div><span class="lsr-rn"></span><div class="avs"></div><span class="all"></span></div></div>
  <div class="hostend" hidden><button class="btn newg">🔄 Ván mới (về phòng chờ)</button></div></div>
  <div class="lsr-side"><div class="lsr-box lsr-me"></div><div class="lsr-box lsr-vc"><div class="vh"><b>🎙 Voice chat</b><span class="vst"></span></div><div class="vl"></div><div class="vb"><button class="vjoin">🎧 Tham gia voice</button><button class="vmute" hidden>🎙 Tắt mic</button></div><div class="vnote">${T.voiceNote}</div></div><div class="lsr-box lsr-ctl" hidden><b>🎛 Điều phối ván (chủ phòng)</b><div class="cinfo"></div>${T.skip ? '<button class="vskip">⏭ Chuyển pha ngay</button>' : ''}</div><div class="lsr-box"><div class="lsr-tabs"><button data-st="chat" class="on">Chat</button><button data-st="hist">Lịch sử</button><button data-st="roles">${T.guideTab}</button></div>
  <div class="lsr-pane chat" data-sp="chat"><div class="cl"></div><div class="lsr-in"><input class="ci" maxlength="200" placeholder="Nhập tin nhắn…"><button class="cs" title="Gửi">➤</button></div></div>
  <div class="lsr-pane hst" data-sp="hist" hidden><div class="hl hint">Chưa có ván nào.</div><div class="row hostclr" hidden style="margin-top:6px"><button class="btn ghost clh" style="padding:5px 12px">🗑 Xoá lịch sử</button></div></div>
  <div class="lsr-pane" data-sp="roles" hidden><div class="lsr-rl">${T.guide.map(([i, b, p]) => `<div><i>${i}</i><div><b>${b}</b><p>${p}</p></div></div>`).join('')}</div></div></div></div></div>`;
    }
    let bound = null;
    function roomRender(el, L) {
      const $ = q => el.querySelector(q), st = L.status, sl = L.seats, n = sl.length, lobby = st === 'lobby';
      const err = T.cfg ? T.cfg.err(L) : '', MIN = T.min, MAX = T.max;
      const ready = s => s.bot || s.id === L.host || s.ready, rc = sl.filter(ready).length;
      $('.lsr-cnt').textContent = `${n} / ${MAX} người`; $('.lsr-cnt2').textContent = `${n} / ${MAX}`;
      const stTxt = lobby ? '● Đang chờ' : st === 'playing' ? '● Đang chơi' : '● Đã kết thúc';
      $('.lsr-st').textContent = stTxt; $('.lsr-st').classList.toggle('play', !lobby); $('.lsr-st2').textContent = stTxt.slice(2);
      $('.lsr-md').textContent = T.cfg ? T.cfg.mode(L) : T.mode;
      $('.lsr-scene').hidden = !lobby;
      $('.lsr-sub').textContent = n < MIN ? `Cần ít nhất ${MIN} người (đang có ${n}). Mời thêm bạn${T.bots ? ' hoặc thêm bot' : ''}.` : rc === n ? 'Tất cả đã sẵn sàng. Chủ phòng có thể bắt đầu trò chơi.' : `Đang chờ ${n - rc} người sẵn sàng…`;
      const faceOf = s => s.bot ? face('bot' + s.name) : face(s.id);
      const cards = sl.map(s => `<div class="lsr-pp"><div class="lsr-av${s.id === L.host ? ' h' : ''}">${faceOf(s)}<span class="dot${s.online ? '' : ' off'}"></span>${ready(s) && s.id !== L.host ? '<span class="ok">✓</span>' : ''}</div><b>${s.id === L.host ? '👑 ' : s.bot ? '🤖 ' : ''}${L.esc(s.name)}${s.id === L.me ? ' (bạn)' : ''}</b><small class="${s.id === L.host ? 'h' : !s.online ? 'off' : ready(s) ? 'y' : ''}">${!s.online ? 'Mất kết nối' : s.id === L.host ? 'Chủ phòng' : s.bot ? 'Bot' : ready(s) ? 'Sẵn sàng!' : 'Chưa sẵn sàng'}</small>${(L.R.players[s.id] || {}).vc ? `<small class="vcb${(L.R.players[s.id] || {}).sp ? ' sp' : ''}">🎙</small>` : ''}</div>`);
      const empty = Math.max(0, Math.min(MAX, 8) - n); for (let i = 0; i < empty; i++) cards.push('<div class="lsr-pp empty"><div class="lsr-av"><span>+</span></div><b style="opacity:.5">Trống</b><small>Mời bạn</small></div>');
      $('.lsr-ppl').innerHTML = cards.join('');
      if (T.cfg) T.cfg.render(el, L, $);
      $('.lsr-warn').textContent = err || '';
      // hành động
      $('.lsr-go').hidden = !L.isHost; $('.lsr-rdy').hidden = L.isHost; const meS = sl.find(s => s.id === L.me) || {};
      $('.lsr-rdy').classList.toggle('on', !!meS.ready); $('.lsr-rdy').textContent = meS.ready ? '✓ Đã sẵn sàng (bấm để huỷ)' : '✋ Tôi đã sẵn sàng';
      $('.lsr-go').disabled = n < MIN || n > MAX || !!err;
      $('.lsr-rb .bar i').style.width = (n ? rc / n * 100 : 0) + '%'; $('.lsr-rn').textContent = `${rc}/${n}`;
      $('.lsr-rb .avs').innerHTML = sl.map(s => `<span class="${ready(s) ? 'y' : 'no'}" title="${L.esc(s.name)}">${faceOf(s)}</span>`).join('');
      $('.lsr-rb .all').textContent = n && rc === n ? '✓ Tất cả đã sẵn sàng!' : `Còn ${n - rc} người chưa sẵn sàng`;
      const meSeat = sl.find(s => s.id === L.me);
      $('.lsr-me').innerHTML = `${face(L.me)}<div><b>${L.esc(meSeat ? meSeat.name : '')}</b>${L.isHost ? ' 👑' : ''}<small>${L.isHost ? 'Chủ phòng' : 'Người chơi'}</small></div>`;
      events(L, T.logEvents); vcSync(L, T.voiceLock);
      const vp = sl.filter(s => (L.R.players[s.id] || {}).vc);
      $('.lsr-vc .vst').textContent = VC.on ? (VC.forced ? '🌙 mic bị khoá' : VC.muted ? 'mic đang tắt' : 'đang nói được') : `${vp.length} người đang trong voice`;
      $('.lsr-vc .vl').innerHTML = vp.map(s => `<span class="${(L.R.players[s.id] || {}).sp ? 'sp' : ''}" title="${L.esc(s.name)}">${face(s.id)}<em>${L.esc(s.name)}</em></span>`).join('') || '<span class="vnote">Chưa ai bật voice.</span>';
      $('.lsr-vc .vjoin').textContent = VC.on ? '📴 Rời voice' : '🎧 Tham gia voice'; $('.lsr-vc .vmute').hidden = !VC.on; $('.lsr-vc .vmute').textContent = VC.muted ? '🔇 Bật mic' : '🎙 Tắt mic'; $('.lsr-vc .vmute').disabled = VC.forced;
      const pb = L.pub || {}; $('.lsr-ctl').hidden = !(L.isHost && L.status === 'playing' && !pb.over);
      if (!$('.lsr-ctl').hidden) $('.lsr-ctl .cinfo').innerHTML = T.ctl ? T.ctl(pb, L) : 'Ván đang diễn ra. Máy của bạn đang làm máy chủ: giữ trang này mở để mọi người chơi tiếp.';
      if (bound === el) return; bound = el;
      const copy = async (t, b) => { try { await navigator.clipboard.writeText(t); L.toast('Đã sao chép ✓'); } catch (e) { prompt('Sao chép:', t); } };
      const cur = () => roomRender.L;
      el.addEventListener('click', e => {
        const L2 = cur(), t = e.target.closest('button'); if (!t) return;
        if (t.classList.contains('lsr-copy')) return copy(L2.code);
        if (t.classList.contains('lsr-copy2')) return copy(L2.inviteUrl);
        if (t.classList.contains('lsr-out')) return el.querySelector('.leave').click();
        if (t.classList.contains('vjoin')) { VC.on ? vcLeave() : vcJoin(L2).then(() => roomRender(el, cur())); return roomRender(el, L2); }
        if (t.classList.contains('vmute')) { VC.muted = !VC.muted; vcApply(); return roomRender(el, L2); }
        if (t.classList.contains('vskip') && L2.isHost) { L2.roomRef.child('act/' + L2.me).set({ n: Date.now(), a: { t: 'skip' } }); return; }
        if (t.classList.contains('lsr-gear')) { inView(el.querySelector('.lsr-cfg'), 'center'); if (!L2.isHost) L2.toast('Chỉ chủ phòng chỉnh được thiết lập.'); return; }
        if (t.classList.contains('lsr-guide')) { el.querySelector('[data-st=roles]').click(); inView(el.querySelector('.lsr-side'), 'start'); return; }
        if (t.classList.contains('lsr-rdy')) { const m = L2.seats.find(s => s.id === L2.me) || {}; return L2.setReady(!m.ready); }
        if (t.dataset.st) { el.querySelectorAll('.lsr-tabs button').forEach(b => b.classList.toggle('on', b === t)); el.querySelectorAll('.lsr-pane').forEach(p => { p.hidden = p.dataset.sp !== t.dataset.st; }); return; }
        if (T.cfg && T.cfg.click(t, L2)) return;
        if (t.classList.contains('lsr-go') && L2.isHost) {
          const sl2 = L2.seats, notR = sl2.filter(s => !(s.bot || s.id === L2.host || s.ready));
          if (notR.length && !confirm(`Còn ${notR.length} người chưa sẵn sàng (${notR.map(s => s.name).join(', ')}). Vẫn bắt đầu?`)) return;
          L2.start();
        }
      });
    }
    function roomCleanup() { vcLeave(); EV.seats = null; bound = null; }
    function roomRenderWrap(el, L) { roomRender.L = L; if (bound && !document.body.contains(bound)) bound = null; roomRender(el, L); }



    return { css: RCSS + ECSS, entryTpl, lobbyItem, roomTpl, roomRender: roomRenderWrap, roomCleanup, chatItem };
  }
  const VILLAGE = `<svg class="lsr-bg" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="lsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1a2b"/><stop offset="1" stop-color="#1b2c3a"/></linearGradient><radialGradient id="lsmo"><stop offset="0" stop-color="#f4f1e2"/><stop offset=".6" stop-color="#d9d6c4"/><stop offset="1" stop-color="#d9d6c400"/></radialGradient></defs>
<rect width="800" height="300" fill="url(#lsk)"/><circle cx="660" cy="60" r="46" fill="url(#lsmo)" opacity=".35"/><circle cx="660" cy="60" r="24" fill="#ecead8"/>
${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 137) % 800}" cy="${(i * 53) % 130}" r="${i % 3 ? .7 : 1.2}" fill="#fff" opacity="${.3 + (i % 4) * .15}"/>`).join('')}
<path d="M0 190 L80 120 L150 170 L240 95 L330 165 L420 110 L520 175 L610 120 L700 170 L800 130 V300 H0Z" fill="#16222d"/>
<path d="M0 230 L40 200 L70 215 L110 180 L150 220 L200 195 L260 225 L320 200 L380 230 L450 205 L520 232 L590 200 L660 228 L730 205 L800 225 V300 H0Z" fill="#101a22"/>
<g fill="#0b1218">${[30, 95, 160, 610, 690, 760].map((x, i) => `<path d="M${x} 300 L${x + 14} ${190 + i % 3 * 12} L${x + 28} 300Z"/>`).join('')}<rect x="560" y="150" width="14" height="90"/><path d="M552 152 L567 108 L582 152Z"/>
<path d="M210 300V232l30-22 30 22v68z"/><path d="M300 300V240l22-16 22 16v60z"/><path d="M470 300V228l34-24 34 24v72z"/><path d="M380 300V246l18-13 18 13v54z"/></g>
<g fill="#f0b45a">${[[232, 250], [250, 250], [316, 258], [492, 246], [514, 246], [396, 262], [565, 175]].map(([x, y]) => `<rect x="${x}" y="${y}" width="7" height="9" opacity=".9"/>`).join('')}</g>
<rect class="lsfog" x="-200" y="215" width="1200" height="60" fill="#c9d6dc" opacity=".09"/><rect class="lsfog b" x="-200" y="245" width="1200" height="50" fill="#c9d6dc" opacity=".08"/></svg>`;

  /* ---------- cảnh nền cho từng game (SVG tự vẽ) ---------- */
  const stars = (n, h, c) => Array.from({ length: n }, (_, i) => `<circle cx="${(i * 137) % 800}" cy="${(i * 53) % h}" r="${i % 3 ? .7 : 1.2}" fill="${c || '#fff'}" opacity="${.3 + (i % 4) * .15}"/>`).join('');
  const sv = (body, id) => `<svg class="lsr-bg" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}<rect class="lsfog" x="-200" y="230" width="1200" height="60" fill="#fff" opacity=".05"/></svg>`;
  const FAIR = sv(`<defs><linearGradient id="fa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0b24"/><stop offset="1" stop-color="#3a1426"/></linearGradient></defs><rect width="800" height="300" fill="url(#fa)"/>${stars(30, 110)}
<path d="M0 80 Q200 140 400 90 T800 85" stroke="#ffffff33" fill="none"/><path d="M0 120 Q220 175 420 125 T800 120" stroke="#ffffff22" fill="none"/>
${Array.from({ length: 14 }, (_, i) => { const x = 30 + i * 56, y = 90 + Math.sin(i * .9) * 18 + 22; return `<g class="lsl"><line x1="${x}" y1="${y - 14}" x2="${x}" y2="${y - 6}" stroke="#ffffff55"/><ellipse cx="${x}" cy="${y + 4}" rx="11" ry="13" fill="${['#ef4444', '#f59e0b', '#ef4444', '#fb7185'][i % 4]}" opacity=".9"/><rect x="${x - 5}" y="${y - 8}" width="10" height="3" fill="#7c2d12"/><ellipse cx="${x}" cy="${y + 4}" rx="16" ry="18" fill="#fbbf24" opacity=".12"/></g>`; }).join('')}
<path d="M250 300V210l150-60 150 60v90z" fill="#120614"/><path d="M230 212l170-70 170 70z" fill="#2a0d1c"/><rect x="330" y="230" width="140" height="70" fill="#f59e0b" opacity=".18"/>
<text x="400" y="262" text-anchor="middle" font-family="Georgia,serif" font-size="26" fill="#fde68a" opacity=".55">LÔ TÔ</text><path d="M0 300V250h800v50z" fill="#0d0410"/>`);
  const CARDS = sv(`<defs><radialGradient id="ca" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#2a1050"/><stop offset="1" stop-color="#0c0618"/></radialGradient></defs><rect width="800" height="300" fill="url(#ca)"/>${stars(24, 300, '#c4b5fd')}
${[['#ef4444', 90, 60, -18], ['#facc15', 180, 190, 12], ['#22c55e', 620, 70, 16], ['#3b82f6', 700, 200, -10], ['#ef4444', 520, 220, 24], ['#3b82f6', 260, 40, 8], ['#facc15', 450, 30, -26], ['#22c55e', 60, 220, 20]].map(([c, x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})" opacity=".75"><rect x="-26" y="-38" width="52" height="76" rx="7" fill="${c}"/><rect x="-21" y="-33" width="42" height="66" rx="5" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/><ellipse rx="15" ry="24" transform="rotate(30)" fill="#fff" opacity=".9"/></g>`).join('')}`);
  const FELT = sv(`<rect width="800" height="300" fill="#07140e"/><ellipse cx="400" cy="250" rx="470" ry="210" fill="#3b2412"/><ellipse cx="400" cy="250" rx="440" ry="190" fill="url(#fe)"/><defs><radialGradient id="fe" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#1f7a4c"/><stop offset="1" stop-color="#0b3d25"/></radialGradient></defs>
${[-30, -15, 0, 15, 30].map((r, i) => `<g transform="translate(400 300) rotate(${r})"><rect x="-22" y="-190" width="44" height="64" rx="5" fill="#fafaf9" stroke="#d6d3d1"/><text x="0" y="-162" text-anchor="middle" font-size="18" font-family="Georgia" fill="${i % 2 ? '#dc2626' : '#111'}">${['♠', '♥', '♣', '♦', '♠'][i]}</text></g>`).join('')}
${[[140, 220, '#ef4444'], [170, 230, '#3b82f6'], [640, 225, '#f59e0b'], [665, 212, '#ef4444']].map(([x, y, c]) => `<ellipse cx="${x}" cy="${y}" rx="18" ry="7" fill="${c}"/><ellipse cx="${x}" cy="${y - 4}" rx="18" ry="7" fill="${c}" stroke="#fff" stroke-dasharray="4 4"/>`).join('')}`);
  const PALACE = sv(`<defs><linearGradient id="pa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b0a0a"/><stop offset="1" stop-color="#3a1210"/></linearGradient></defs><rect width="800" height="300" fill="url(#pa)"/>${stars(26, 120)}<circle cx="140" cy="70" r="30" fill="#fde68a" opacity=".85"/>
<g stroke="#f59e0b" stroke-opacity=".12">${Array.from({ length: 9 }, (_, i) => `<line x1="${180 + i * 55}" y1="150" x2="${180 + i * 55}" y2="300"/>`).join('')}${Array.from({ length: 4 }, (_, i) => `<line x1="180" y1="${160 + i * 45}" x2="620" y2="${160 + i * 45}"/>`).join('')}</g>
<g fill="#0e0404"><path d="M560 300V190h160v110z"/><path d="M530 195q110-50 220 0l-20-18q-90-36-180 0z"/><path d="M575 150h130v40H575z"/><path d="M550 155q90-45 180 0l-16-15q-74-28-148 0z"/><path d="M40 300V230h110v70z"/><path d="M20 234q75-34 150 0l-14-12q-61-24-122 0z"/></g>
${[[600, 205], [680, 205], [95, 245]].map(([x, y]) => `<rect x="${x - 6}" y="${y}" width="12" height="16" rx="3" fill="#ef4444"/><circle cx="${x}" cy="${y + 8}" r="16" fill="#f97316" opacity=".15"/>`).join('')}`);
  const HALL = sv(`<defs><linearGradient id="ha" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1022"/><stop offset="1" stop-color="#18203a"/></linearGradient></defs><rect width="800" height="300" fill="url(#ha)"/>
<path d="M330 150V60a70 70 0 0 1 140 0v90z" fill="#1d2b4f"/><circle cx="400" cy="70" r="26" fill="#e5e7eb" opacity=".85"/>${stars(14, 120)}
<g>${Array.from({ length: 6 }, (_, r) => Array.from({ length: 12 }, (_, c) => { const y0 = 170 + r * r * 6 + r * 12, y1 = 170 + (r + 1) * (r + 1) * 6 + (r + 1) * 12, w0 = 300 + r * 90, w1 = 300 + (r + 1) * 90, x0 = 400 - w0 / 2 + c * w0 / 12, x1 = 400 - w1 / 2 + c * w1 / 12; return `<path d="M${x0} ${y0}L${x0 + w0 / 12} ${y0}L${x1 + w1 / 12} ${y1}L${x1} ${y1}Z" fill="${(r + c) % 2 ? '#c7cbd6' : '#20263a'}" opacity="${.25 + r * .08}"/>`; }).join('')).join('')}</g>
<rect x="0" y="0" width="60" height="300" fill="#060a16"/><rect x="740" y="0" width="60" height="300" fill="#060a16"/>`);
  const glyph = (g, c) => `<svg class="wolf" viewBox="0 0 200 200" aria-hidden="true"><text x="100" y="170" text-anchor="middle" font-size="190" fill="${c || '#000'}" opacity=".55">${g}</text></svg>`;

  const WOLF = '<svg class="wolf" viewBox="0 0 200 200" aria-hidden="true"><path fill="#05090d" d="M40 200c6-30 14-52 30-66-10-6-16-16-17-28 8 3 15 3 20 0-4-10-4-22 2-34l12 18c6-6 14-10 22-11l-4-20 16 16c14 4 24 14 28 30 8 2 14 8 16 16-10-2-18 0-24 6 6 14 8 34 6 73z"/><circle cx="118" cy="62" r="2.4" fill="#dfbc7a"/></svg>';
  // cho phép khai báo gọn: scene là tên cảnh (S.fair…) hoặc chuỗi SVG; mascotG = [ký tự, màu]; mascot: 'wolf'
  function themeFor(t) { const o = Object.assign({}, t); if (t.mascotG) o.mascot = glyph(t.mascotG[0], t.mascotG[1]); else if (t.mascot === 'wolf') o.mascot = WOLF; delete o.mascotG; return o; }
  GV.mpShell = { themeFor, make, face, VC, glyph, scenes: { village: VILLAGE, fair: FAIR, cards: CARDS, felt: FELT, palace: PALACE, hall: HALL }, mascots: { wolf: WOLF } };
})();
