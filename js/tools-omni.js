// 4 công cụ lấy từ thiết kế OmniHub v2: Live HTML/CSS Code Sandbox, 3D Glass Calculator, 3D QR Generator, Key Generator.
// Viết lại bằng JS/CSS thuần (không Tailwind/CDN). QR dùng vendor/qrcode.js (MIT, nạp lười). Nhãn đổi theo EN/VI qua GV.lang().
(function () {
  const $ = (r, s) => r.querySelector(s), esc = GV.esc, L = (en, vi) => (GV.lang && GV.lang() === 'vi') ? vi : en;
  const CSS = `<style>
.om{width:100%;max-width:760px;margin:0 auto;text-align:left;color:#e2e8f0}.om *{box-sizing:border-box}
.om .omc{position:relative;padding:22px;border-radius:24px;background:rgba(15,23,42,.65);backdrop-filter:blur(16px);border:1px solid #ffffff14;box-shadow:0 20px 44px #0007,inset 0 1px 1px #ffffff26;transition:transform .15s ease-out;will-change:transform}
.om .omh{display:flex;align-items:center;gap:12px;margin-bottom:16px}.om .omh i{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;font-style:normal;font-size:1.25rem;border:1px solid}
.om h3{margin:0;font:700 1.05rem var(--font);color:#fff}.om .oms{font-size:.76rem;color:#94a3b8;margin:2px 0 0}
.om.c .omh i{background:#00f2fe1a;border-color:#00f2fe4d}.om.p .omh i{background:#7928ca26;border-color:#a855f74d}.om.g .omh i{background:#10b9811a;border-color:#10b9814d}.om.s .omh i{background:#00f2fe1a;border-color:#00f2fe4d}
.om input[type=text],.om textarea,.om select{width:100%;background:#0b1220;color:#e2e8f0;border:1px solid #334155;border-radius:12px;padding:10px 12px;font:inherit;font-size:14px;outline:none}
.om input:focus,.om textarea:focus,.om select:focus{border-color:#00f2fe;box-shadow:0 0 0 3px #00f2fe26}
.om button{font:inherit;cursor:pointer}.om .omb{border:0;border-radius:12px;padding:10px 16px;font-weight:700;font-size:13px;color:#04141a;background:linear-gradient(135deg,#06b6d4,#00f2fe);box-shadow:0 0 18px #00f2fe4d;transition:filter .2s,transform .1s}
.om .omb:hover{filter:brightness(1.1)}.om .omb:active{transform:scale(.97)}.om .omb.pu{background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;box-shadow:0 0 18px #7928ca66}.om .omb.em{background:linear-gradient(135deg,#10b981,#34d399);box-shadow:0 0 18px #10b98166}
.om .omb.gh{background:#1e293b;color:#cbd5e1;box-shadow:none;border:1px solid #334155}.om .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.om .row>*{min-width:0}
.om .hint{font-size:.76rem;color:#94a3b8}.om .err{color:#fca5a5;font-size:.8rem;min-height:1.2em}
/* calculator */
.om .cd{padding:14px 16px;border-radius:16px;background:#020617;border:1px solid #1e293b;text-align:right;min-height:84px;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden}
.om .cd small{color:#64748b;font:500 .8rem ui-monospace,Menlo,monospace;min-height:1.1em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.om .cd b{font:600 2.1rem ui-monospace,Menlo,monospace;color:#22d3ee;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.om .ck{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:14px}.om .ck button{padding:15px 0;border-radius:14px;border:1px solid #ffffff0f;background:#1e293b99;color:#e2e8f0;font-weight:700;font-size:1.05rem;box-shadow:0 5px 0 #0b1220,0 8px 14px #0006;transition:transform .08s,box-shadow .08s,background .2s}
.om .ck button:hover{background:#334155}.om .ck button:active{transform:translateY(4px);box-shadow:0 1px 0 #0b1220}.om .ck .op{color:#22d3ee;background:#0f172a}.om .ck .cl{background:#f43f5e33;color:#fb7185}.om .ck .eq{grid-row:span 2;background:linear-gradient(180deg,#06b6d4,#00f2fe);color:#04141a;box-shadow:0 5px 0 #0e7490,0 0 20px #00f2fe66}.om .ck .z{grid-column:span 2}
/* qr */
.om .qbox{margin-top:16px;display:grid;place-items:center;min-height:240px;padding:16px;border-radius:18px;background:#0b1220cc;border:1px solid #1e293b;perspective:700px}
.om .qbox canvas{max-width:100%;height:auto;border-radius:14px;box-shadow:0 20px 40px #000a,0 0 30px #7928ca55;transform:rotateX(8deg) rotateY(-10deg);transition:transform .25s;image-rendering:pixelated}.om .qbox:hover canvas{transform:rotateX(0) rotateY(0)}
/* keygen */
.om .ko{position:relative}.om .ko input{font:600 .95rem ui-monospace,Menlo,monospace;color:#34d399;padding-right:84px}.om .ko button{position:absolute;right:6px;top:6px;padding:6px 12px;border-radius:9px;border:1px solid #334155;background:#1e293b;color:#cbd5e1;font-size:12px}
.om .ks{height:8px;border-radius:99px;background:#1e293b;overflow:hidden;margin-top:12px}.om .ks i{display:block;height:100%;width:0;transition:width .3s,background .3s}
.om .kopt{display:flex;gap:14px;flex-wrap:wrap;margin:12px 0;font-size:.85rem;color:#cbd5e1}.om .kopt label{display:flex;gap:6px;align-items:center;cursor:pointer}.om .kopt input{width:auto;accent-color:#10b981}
/* sandbox */
.om.wide{max-width:1100px}.om .sg{display:grid;grid-template-columns:1fr 1fr;gap:14px}.om .sg textarea{height:340px;resize:vertical;font:13px/1.5 ui-monospace,Menlo,monospace;color:#22d3ee;background:#020617;tab-size:2;white-space:pre}
.om .sp{height:340px;border-radius:12px;border:1px solid #1e293b;background:#fff;overflow:hidden}.om .sp iframe{width:100%;height:100%;border:0;background:#fff}
@media(max-width:760px){.om .sg{grid-template-columns:1fr}.om .sg textarea,.om .sp{height:240px}.om .omc{padding:16px;border-radius:20px}.om .cd b{font-size:1.7rem}}
</style>`;
  const tilt = el => { const c = $(el, '.omc'); if (!c || matchMedia('(hover:none)').matches || matchMedia('(prefers-reduced-motion:reduce)').matches) return () => {}; const mv = e => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = `perspective(1000px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg)`; }, lv = () => { c.style.transform = ''; }; c.addEventListener('mousemove', mv); c.addEventListener('mouseleave', lv); return () => {}; };
  const copy = async (t, el, btn) => { try { await navigator.clipboard.writeText(t); } catch (e) { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e2) {} ta.remove(); } if (btn) { const o = btn.textContent; btn.textContent = L('Copied ✓', 'Đã chép ✓'); setTimeout(() => { btn.textContent = o; }, 1200); } };

  /* ---------- 1. 3D Glass Calculator (bộ phân tích biểu thức tự viết, không dùng eval) ---------- */
  function calc(expr) {
    const src = String(expr).replace(/×/g, '*').replace(/÷/g, '/').replace(/\s/g, ''), tk = src.match(/\d*\.?\d+|[-+*/%()]/g);
    if (!tk || tk.join('') !== src) throw 0;
    let p = 0; const peek = () => tk[p], nx = () => tk[p++];
    const prim = () => { const t = nx(); if (t === undefined) throw 0; if (t === '(') { const v = add(); if (nx() !== ')') throw 0; return v; } if (t === '-') return -prim(); if (t === '+') return prim(); if (!/^\d|^\./.test(t)) throw 0; let v = parseFloat(t); while (peek() === '%') { nx(); v /= 100; } return v; };
    const mul = () => { let v = prim(); while (peek() === '*' || peek() === '/') { const o = nx(), r = prim(); if (o === '/' && r === 0) throw 0; v = o === '*' ? v * r : v / r; } return v; };
    const add = () => { let v = mul(); while (peek() === '+' || peek() === '-') { const o = nx(), r = mul(); v = o === '+' ? v + r : v - r; } return v; };
    const v = add(); if (p < tk.length || !isFinite(v)) throw 0; return +v.toPrecision(12);
  }
  GV.register({
    id: 'omni-calc', type: 'tool', cat: 'Tính toán', name: '3D Glass Calculator', icon: '🧮', desc: 'Máy tính kính 3D: + − × ÷ % ngoặc, gõ bàn phím, lịch sử phép tính gần nhất.',
    mount(el) {
      let ex = '', last = '';
      el.innerHTML = CSS + `<div class="om c"><div class="omc"><div class="omh"><i>🧮</i><div><h3>3D Glass Calculator</h3><p class="oms">${L('Type or tap – keyboard supported', 'Gõ hoặc chạm – hỗ trợ bàn phím')}</p></div></div>
<div class="cd" aria-live="polite"><small class="hs"></small><b class="ds">0</b></div>
<div class="ck">${[['C', 'cl'], ['(', 'op'], [')', 'op'], ['/', 'op'], ['7'], ['8'], ['9'], ['*', 'op'], ['4'], ['5'], ['6'], ['-', 'op'], ['1'], ['2'], ['3'], ['+', 'op'], ['0', 'z'], ['.'], ['⌫', 'op'], ['%', 'op'], ['=', 'eq']].map(([k, c]) => `<button data-k="${k}" class="${c || ''}">${k === '/' ? '÷' : k === '*' ? '×' : k}</button>`).join('')}</div></div></div>`;
      const show = () => { $(el, '.ds').textContent = (ex || '0').replace(/\*/g, '×').replace(/\//g, '÷'); $(el, '.hs').textContent = last; };
      const press = k => {
        if (k === 'C') { ex = ''; last = ''; }
        else if (k === '⌫' || k === 'Backspace') ex = ex === 'Error' ? '' : ex.slice(0, -1);
        else if (k === '=' || k === 'Enter') { if (!ex) return; try { const r = String(calc(ex)); last = ex.replace(/\*/g, '×').replace(/\//g, '÷') + ' ='; ex = r; } catch (e) { last = ex.replace(/\*/g, '×').replace(/\//g, '÷'); ex = 'Error'; } }
        else if (/^[0-9.+\-*/%()]$/.test(k)) { if (ex === 'Error') ex = ''; if (/^[+*/%]$/.test(k) && !ex) { if (k !== '%') return; } if (ex.length < 40) ex += k; }
        show();
      };
      el.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) press(b.dataset.k); });
      const kd = e => { if (e.ctrlKey || e.metaKey || e.altKey) return; const t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return; const k = e.key === 'x' ? '*' : e.key === 'Escape' ? 'C' : e.key; if (/^([0-9.+\-*/%()]|Enter|Backspace|C)$/.test(k) || k === 'C') { e.preventDefault(); press(k); } };
      document.addEventListener('keydown', kd); show(); const t = tilt(el);
      return () => { document.removeEventListener('keydown', kd); t(); };
    }
  });

  /* ---------- 2. 3D QR Generator ---------- */
  let qrLib = null;
  const loadQR = () => qrLib ? Promise.resolve(qrLib) : new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'vendor/qrcode.js'; s.onload = () => { try { window.qrcode.stringToBytes = t => Array.from(new TextEncoder().encode(t)); qrLib = window.qrcode; ok(qrLib); } catch (e) { no(e); } }; s.onerror = () => no(new Error('qrcode.js')); document.head.appendChild(s); });
  GV.register({
    id: 'omni-qr', type: 'tool', cat: 'Tính toán', name: '3D QR Generator', icon: '🔳', desc: 'Tạo mã QR từ văn bản/liên kết (hỗ trợ tiếng Việt), chọn mức sửa lỗi, tải PNG.',
    mount(el) {
      el.innerHTML = CSS + `<div class="om p"><div class="omc"><div class="omh"><i>🔳</i><div><h3>3D QR Generator</h3><p class="oms">${L('Text, links, Wi-Fi… generated on your device', 'Văn bản, liên kết, Wi-Fi… tạo ngay trên máy bạn')}</p></div></div>
<input type="text" class="qi" maxlength="1000" value="https://huyenit2016.github.io/gamevui/" aria-label="QR content">
<div class="row" style="margin-top:10px"><select class="qe" style="width:auto"><option value="L">ECC L</option><option value="M" selected>ECC M</option><option value="Q">ECC Q</option><option value="H">ECC H</option></select>
<button class="omb pu qg">${L('Generate QR', 'Tạo mã QR')}</button><button class="omb gh qd">${L('Download PNG', 'Tải PNG')}</button></div><div class="err qm"></div>
<div class="qbox"><canvas class="qc" width="10" height="10"></canvas></div></div></div>`;
      const gen = async () => {
        const m = $(el, '.qm'), txt = $(el, '.qi').value; m.textContent = '';
        if (!txt.trim()) { m.textContent = L('Enter some content first.', 'Hãy nhập nội dung trước.'); return; }
        try {
          const q = await loadQR(), qr = q(0, $(el, '.qe').value); qr.addData(txt, 'Byte'); qr.make();
          const n = qr.getModuleCount(), px = Math.max(4, Math.floor(300 / (n + 8))), size = (n + 8) * px, c = $(el, '.qc'); c.width = c.height = size; const g = c.getContext('2d');
          g.fillStyle = '#fff'; g.fillRect(0, 0, size, size); g.fillStyle = '#0b1220';
          for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) g.fillRect((k + 4) * px, (r + 4) * px, px, px);
          c.style.width = Math.min(size, 300) + 'px';
        } catch (e) { m.textContent = L('Content too long for this error-correction level.', 'Nội dung quá dài so với mức sửa lỗi đã chọn.'); }
      };
      $(el, '.qg').onclick = gen; $(el, '.qi').addEventListener('keydown', e => { if (e.key === 'Enter') gen(); }); $(el, '.qe').onchange = gen;
      $(el, '.qd').onclick = () => { const a = document.createElement('a'); a.href = $(el, '.qc').toDataURL('image/png'); a.download = 'omnihub-qr.png'; a.click(); };
      gen(); const t = tilt(el); return t;
    }
  });

  /* ---------- 3. Key Generator ---------- */
  GV.register({
    id: 'omni-keygen', type: 'tool', cat: 'Đời sống', name: 'Key Generator', icon: '🔑', desc: 'Tạo khoá/mật khẩu ngẫu nhiên an toàn (crypto.getRandomValues), chọn độ dài và loại ký tự, đo độ mạnh.',
    mount(el) {
      el.innerHTML = CSS + `<div class="om g"><div class="omc"><div class="omh"><i>🔑</i><div><h3>Key Generator</h3><p class="oms">${L('Cryptographically secure – never leaves your device', 'Ngẫu nhiên mật mã – không rời khỏi máy bạn')}</p></div></div>
<div class="ko"><input type="text" class="ky" readonly placeholder="${L('Generated Key', 'Khoá được tạo')}" aria-label="Generated key"><button class="kc">${L('Copy', 'Chép')}</button></div>
<div class="ks"><i class="kb"></i></div><p class="hint km" style="margin:6px 0 0"></p>
<div class="row" style="margin-top:14px;justify-content:space-between"><span class="hint">${L('Length', 'Độ dài')}: <b class="kl" style="color:#fff">20</b></span><input type="range" class="kr" min="8" max="64" value="20" style="flex:1;max-width:260px;accent-color:#34d399"></div>
<div class="kopt"><label><input type="checkbox" class="o1" checked>A–Z</label><label><input type="checkbox" class="o2" checked>a–z</label><label><input type="checkbox" class="o3" checked>0–9</label><label><input type="checkbox" class="o4" checked>!@#$</label><label><input type="checkbox" class="o5">${L('No look-alikes (0 O l 1 I)', 'Bỏ ký tự dễ nhầm (0 O l 1 I)')}</label></div>
<button class="omb em kg" style="width:100%">${L('Generate Vault Key', 'Tạo khoá mới')}</button></div></div>`;
      const SETS = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789', '!@#$%^&*()-_=+[]{};:,.?'];
      const rnd = n => { const a = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n; let v; do { crypto.getRandomValues(a); v = a[0]; } while (v >= lim); return v % n; };
      const gen = () => {
        const on = [1, 2, 3, 4].map(i => $(el, '.o' + i).checked), nl = $(el, '.o5').checked, len = +$(el, '.kr').value;
        let sets = SETS.filter((_, i) => on[i]).map(s => nl ? s.replace(/[0OIl1]/g, '') : s); if (!sets.length) { sets = [SETS[1], SETS[2]]; $(el, '.o2').checked = $(el, '.o3').checked = true; }
        const pool = sets.join(''), out = sets.map(s => s[rnd(s.length)]); while (out.length < len) out.push(pool[rnd(pool.length)]);
        for (let i = out.length - 1; i > 0; i--) { const j = rnd(i + 1); [out[i], out[j]] = [out[j], out[i]]; }
        const key = out.slice(0, len).join(''); $(el, '.ky').value = key;
        const bits = Math.round(len * Math.log2(pool.length)), lv = bits < 50 ? [L('Weak', 'Yếu'), '#f43f5e'] : bits < 80 ? [L('Fair', 'Trung bình'), '#f59e0b'] : bits < 120 ? [L('Strong', 'Mạnh'), '#34d399'] : [L('Excellent', 'Rất mạnh'), '#22d3ee'];
        const b = $(el, '.kb'); b.style.width = Math.min(100, bits / 1.6) + '%'; b.style.background = lv[1]; $(el, '.km').textContent = `${lv[0]} · ~${bits} bits`;
      };
      $(el, '.kr').oninput = e => { $(el, '.kl').textContent = e.target.value; gen(); }; el.querySelectorAll('.kopt input').forEach(i => { i.onchange = gen; });
      $(el, '.kg').onclick = gen; $(el, '.kc').onclick = e => { const v = $(el, '.ky').value; if (v) copy(v, el, e.target); }; gen(); return tilt(el);
    }
  });

  /* ---------- 4. Live HTML/CSS Code Sandbox ---------- */
  const TPL = {
    hello: `<div style="color:#00f2fe;text-align:center;font-family:sans-serif;padding:24px">\n  <h2>Hello OmniHub 3D!</h2>\n  <p style="color:#a855f7">Live HTML Rendering Sandbox</p>\n</div>`,
    card: `<style>\n  body{margin:0;display:grid;place-items:center;height:100vh;background:#0b1220;font-family:sans-serif;perspective:700px}\n  .c{width:200px;height:260px;border-radius:24px;background:linear-gradient(135deg,#00f2fe55,#7928ca55);border:1px solid #00f2fe88;color:#fff;display:grid;place-items:center;transform:rotateY(-18deg) rotateX(8deg);transition:.4s;box-shadow:0 30px 50px #0009}\n  .c:hover{transform:none}\n</style>\n<div class="c"><h3>3D Card</h3></div>`,
    anim: `<style>\n  body{margin:0;height:100vh;display:grid;place-items:center;background:#020617}\n  .cube{width:90px;height:90px;border:2px solid #00f2fe;box-shadow:0 0 30px #00f2fe99;animation:s 4s linear infinite}\n  @keyframes s{to{transform:rotate(360deg) scale(1.3)}}\n</style>\n<div class="cube"></div>`
  };
  GV.register({
    id: 'omni-sandbox', type: 'tool', cat: 'Lập trình', name: 'Live HTML/CSS Code Sandbox', icon: '🧪', desc: 'Viết HTML/CSS/JS và xem kết quả trực tiếp trong khung cách ly an toàn, có mẫu 3D sẵn.',
    mount(el) {
      const saved = GV.store.get('omni_sandbox', null);
      el.innerHTML = CSS + `<div class="om s wide"><div class="omc"><div class="omh"><i>🧪</i><div style="flex:1"><h3>Live HTML/CSS Code Sandbox</h3><p class="oms">${L('Runs in an isolated frame – no access to this site', 'Chạy trong khung cách ly – không truy cập được dữ liệu của trang')}</p></div>
<select class="st" style="width:auto"><option value="">${L('Templates…', 'Mẫu…')}</option><option value="hello">Hello</option><option value="card">3D Card</option><option value="anim">Animation</option></select>
<label class="hint" style="display:flex;gap:6px;align-items:center"><input type="checkbox" class="sa" checked style="width:auto">${L('Auto-run', 'Tự chạy')}</label><button class="omb sr">${L('Run Preview', 'Chạy')}</button></div>
<div class="sg"><textarea class="sc" spellcheck="false" aria-label="Code"></textarea><div class="sp"><iframe class="sf" sandbox="allow-scripts allow-forms allow-modals" title="Preview"></iframe></div></div>
<div class="row" style="margin-top:12px"><button class="omb gh scp">${L('Copy code', 'Chép mã')}</button><button class="omb gh srs">${L('Reset', 'Đặt lại')}</button><span class="hint">${L('Ctrl+Enter to run', 'Ctrl+Enter để chạy')}</span></div></div></div>`;
      const ta = $(el, '.sc'), fr = $(el, '.sf'); ta.value = saved != null ? saved : TPL.hello;
      const run = () => { fr.srcdoc = ta.value; GV.store.set('omni_sandbox', ta.value); };
      let tm = null; ta.addEventListener('input', () => { if ($(el, '.sa').checked) { clearTimeout(tm); tm = setTimeout(run, 400); } });
      ta.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); } });
      $(el, '.sr').onclick = run; $(el, '.st').onchange = e => { if (TPL[e.target.value]) { ta.value = TPL[e.target.value]; run(); } e.target.value = ''; };
      $(el, '.srs').onclick = () => { ta.value = TPL.hello; run(); }; $(el, '.scp').onclick = e => copy(ta.value, el, e.target);
      run(); return () => clearTimeout(tm);
    }
  });
  GV.omniT = { calc };
})();
