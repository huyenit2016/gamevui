// Thông báo nổi (toast) dùng chung: GV.toast('Nội dung', { type:'success|info|warn|error', ttl:4000, action:{ label, fn } })
(function () {
  let box = null;
  const ICON = { success: '✅', info: 'ℹ️', warn: '⚠️', error: '⛔' };
  const CSS = `#toasts{position:fixed;right:14px;top:70px;z-index:9999;display:flex;flex-direction:column;gap:10px;width:min(360px,calc(100vw - 28px));pointer-events:none}
  .toast{pointer-events:auto;position:relative;overflow:hidden;display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:14px;background:var(--card);color:var(--fg);border:1px solid var(--line);box-shadow:0 14px 40px #0006;animation:tin .28s cubic-bezier(.2,.9,.3,1.2) both;backdrop-filter:blur(10px);font-size:14px;line-height:1.4}
  .toast.out{animation:tout .22s ease-in forwards}
  .toast::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--tc,#6c8cff)}
  .toast.success{--tc:#3ddc97}.toast.warn{--tc:#ffb020}.toast.error{--tc:#ff5c6c}.toast.info{--tc:#6c8cff}
  .toast .ti{font-size:20px}.toast .tb{flex:1;padding-left:2px}.toast .tx{cursor:pointer;opacity:.6;background:none;border:0;color:inherit;font-size:16px}
  .toast .ta{margin-top:6px;border:0;border-radius:8px;padding:4px 12px;background:var(--tc);color:#111;font-weight:800;cursor:pointer}
  .toast .bar{position:absolute;left:0;bottom:0;height:3px;background:var(--tc);opacity:.7;animation:tbar linear forwards}
  @keyframes tin{from{opacity:0;transform:translateX(40px) scale(.96)}to{opacity:1;transform:none}}
  @keyframes tout{to{opacity:0;transform:translateX(40px)}}
  @keyframes tbar{from{width:100%}to{width:0}}
  @media(max-width:520px){#toasts{right:50%;transform:translateX(50%);top:64px}}`;
  function ensure() {
    if (box) return box;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); return box;
  }
  GV.toast = function (msg, o = {}) {
    const type = o.type || 'info', ttl = o.ttl === 0 ? 0 : (o.ttl || (type === 'error' || o.action ? 8000 : 4500));
    const el = document.createElement('div'); el.className = 'toast ' + type; el.setAttribute('role', 'status');
    el.innerHTML = `<span class="ti">${o.icon || ICON[type]}</span><div class="tb">${o.html ? msg : GV.esc(msg)}${o.action ? `<div><button class="ta">${GV.esc(o.action.label)}</button></div>` : ''}</div><button class="tx" aria-label="Đóng">✕</button>${ttl ? `<i class="bar" style="animation-duration:${ttl}ms"></i>` : ''}`;
    const close = () => { if (!el.parentNode) return; el.classList.add('out'); setTimeout(() => el.remove(), 230); };
    el.querySelector('.tx').onclick = close;
    if (o.action) el.querySelector('.ta').onclick = () => { try { o.action.fn(); } catch (e) { console.error(e); } close(); };
    const b = ensure(); b.appendChild(el); while (b.children.length > 5) b.firstChild.remove();
    if (ttl) setTimeout(close, ttl);
    return { close, el };
  };
})();
