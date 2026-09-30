// Thông báo nổi (toast) dùng chung: GV.toast('Nội dung', { type:'success|info|warn|error', ttl:4000, action:{ label, fn } })
(function () {
  let box = null;
  const ICON = { success: 'ok', info: 'info', warn: 'warn', error: 'err' }, ic = t => GV.ic ? GV.ic(ICON[t], 20) : '';
  const CSS = `#toasts{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;width:min(480px,calc(100vw - 24px));pointer-events:none}
  .toast{pointer-events:auto;position:relative;overflow:hidden;display:flex;gap:12px;align-items:center;padding:14px 16px;border-radius:12px;background:var(--md-inverse-surface,#E6E1E5);color:var(--md-inverse-on-surface,#313033);box-shadow:0 3px 6px rgba(0,0,0,.3),0 6px 14px 4px rgba(0,0,0,.2);font-size:14px;letter-spacing:.25px;animation:tin .25s cubic-bezier(.2,0,0,1)}
  .toast.out{animation:tout .2s ease-in forwards}
  .toast .ti{flex:0 0 auto;display:grid;place-items:center;line-height:0;color:var(--tc)}
  .toast.success{--tc:#1B6E3A}.toast.warn{--tc:#B26A00}.toast.error{--tc:#B3261E}.toast.info{--tc:#6750A4}
  .toast .tb{flex:1;line-height:1.4}.toast .tx{cursor:pointer;opacity:.7;background:none;border:0;color:inherit;display:grid;place-items:center;padding:4px;border-radius:50%}.toast .tx:hover{opacity:1}
  .toast .ta{margin-top:0;border:0;border-radius:20px;padding:6px 14px;background:transparent;color:var(--md-inverse-primary,#6750A4);font:inherit;font-weight:500;cursor:pointer}.toast .ta:hover{background:rgba(103,80,164,.14)}
  .toast .bar{position:absolute;left:0;bottom:0;height:3px;background:var(--tc);opacity:.6;animation:tbar linear forwards}
  @keyframes tin{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}
  @keyframes tout{to{opacity:0;transform:translateY(8px)}}
  @keyframes tbar{from{width:100%}to{width:0}}
  @media(min-width:600px){#toasts{left:104px;transform:none}}
  @media(max-width:599px){#toasts{bottom:92px}}`;
  function ensure() {
    if (box) return box;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); return box;
  }
  GV.toast = function (msg, o = {}) {
    const type = o.type || 'info', ttl = o.ttl === 0 ? 0 : (o.ttl || (type === 'error' || o.action ? 8000 : 4500));
    const el = document.createElement('div'); el.className = 'toast ' + type; el.setAttribute('role', 'status');
    el.innerHTML = `<span class="ti">${o.icon || ic(type)}</span><div class="tb">${o.html ? msg : GV.esc(msg)}${o.action ? `<div><button class="ta">${GV.esc(o.action.label)}</button></div>` : ''}</div><button class="tx" aria-label="Đóng">${GV.ic ? GV.ic("x", 16) : "✕"}</button>${ttl ? `<i class="bar" style="animation-duration:${ttl}ms"></i>` : ''}`;
    const close = () => { if (!el.parentNode) return; el.classList.add('out'); setTimeout(() => el.remove(), 230); };
    el.querySelector('.tx').onclick = close;
    if (o.action) el.querySelector('.ta').onclick = () => { try { o.action.fn(); } catch (e) { console.error(e); } close(); };
    const b = ensure(); b.appendChild(el); while (b.children.length > 5) b.firstChild.remove();
    if (ttl) setTimeout(close, ttl);
    return { close, el };
  };
})();
