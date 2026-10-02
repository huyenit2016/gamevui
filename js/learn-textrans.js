// Dịch văn bản: gõ/dán/tải tệp .txt → dịch tự động, tự nhận diện ngôn ngữ, đảo chiều, đọc to, sao chép, lịch sử.
(function () {
  const L = GV.learn, esc = GV.esc, $ = (r, s) => r.querySelector(s);
  const detect = t => {
    if (/[぀-ヿ]/.test(t)) return 'ja'; if (/[가-힯]/.test(t)) return 'ko'; if (/[一-鿿]/.test(t)) return 'zh';
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(t)) return 'vi';
    return /[a-z]/i.test(t) ? 'en' : null;
  };
  // cắt văn bản thành các đoạn ≤ 450 ký tự (theo câu) để dịch miễn phí không bị cắt cụt
  const chunks = t => { const out = []; t.split(/\n/).forEach(line => { if (!line.trim()) return out.push(''); let cur = ''; (line.match(/[^.!?。！？]+[.!?。！？]*\s*/g) || [line]).forEach(s => { if ((cur + s).length > 450) { if (cur) out.push(cur); while (s.length > 450) { out.push(s.slice(0, 450)); s = s.slice(450); } cur = s; } else cur += s; }); if (cur) out.push(cur); out.push('\n'); }); return out; };

  GV.register({
    id: 'texttrans', type: 'tool', cat: 'Học tập', name: 'Dịch văn bản', icon: '🌐', desc: 'Dịch đoạn văn Anh·Nhật·Hàn·Trung ⇄ Việt: tự nhận diện ngôn ngữ, đọc to, sao chép, tải tệp .txt, lưu lịch sử.',
    mount(el) {
      const st = Object.assign({ from: 'auto', to: 'vi' }, GV.store.get('textrans', {}));
      let hist = GV.store.get('textrans_h', []), seq = 0, timer = 0, dead = false;
      const opts = (auto) => (auto ? '<option value="auto">✨ Tự nhận diện</option>' : '') + Object.keys(L.LANGS).map(k => `<option value="${k}">${L.LANGS[k].flag} ${L.LANGS[k].name}</option>`).join('');
      el.innerHTML = `<style>.tt textarea{width:100%;min-height:110px;resize:vertical;box-sizing:border-box;font:inherit;font-size:16px;padding:10px 12px;border-radius:14px;border:1px solid var(--line);background:var(--inp,#1c1b1f);color:var(--fg)}.tt .out{min-height:110px;white-space:pre-wrap;text-align:left;padding:10px 12px;border-radius:14px;background:var(--md-sc-high,#2b292d);width:100%;box-sizing:border-box;font-size:16px}.tt .hs{width:100%;text-align:left}.tt .hs div{padding:8px 10px;border-radius:10px;background:var(--md-sc-high,#2b292d);margin:4px 0;cursor:pointer;font-size:13px}.tt select{flex:1;min-width:0}</style>
<div class="tool tt" style="max-width:640px">${L.ai.panelHTML()}
<div class="row" style="flex-wrap:nowrap"><select class="fr">${opts(true)}</select><button class="btn ghost sw" title="Đảo chiều" aria-label="Đảo chiều">⇄</button><select class="to">${opts(false)}</select></div>
<textarea class="src" placeholder="Nhập hoặc dán văn bản cần dịch…" maxlength="5000"></textarea>
<div class="row"><span class="hint cnt">0/5000</span><span class="hint dt" style="flex:1"></span><button class="btn ghost up">📄 Tải tệp .txt</button><button class="btn ghost cl">🗑 Xoá</button></div>
<div class="out" aria-live="polite"></div>
<div class="row"><button class="btn ghost sp">🔊 Đọc</button><button class="btn ghost cp">📋 Sao chép</button><button class="btn ghost dl">⬇️ Tải .txt</button></div>
<p class="hint eng"></p><details class="hs"><summary>🕘 Lịch sử dịch</summary><div class="hl"></div><button class="btn ghost hc" style="margin-top:6px">Xoá lịch sử</button></details></div>`;
      const src = $(el, '.src'), out = $(el, '.out'), fr = $(el, '.fr'), to = $(el, '.to');
      fr.value = st.from; to.value = st.to;
      const sync = () => { GV.store.set('textrans', st); $(el, '.eng').textContent = L.ai.ready() ? '🤖 Đang dùng AI để dịch (chính xác hơn).' : 'Đang dùng dịch miễn phí (MyMemory). Nhập khóa AI ở trên để dịch tự nhiên hơn.'; };
      L.ai.bindPanel(el, sync); sync();
      const drawHist = () => { $(el, '.hl').innerHTML = hist.length ? hist.map((h, i) => `<div data-i="${i}">${L.LANGS[h.f].flag}→${L.LANGS[h.t].flag} ${esc(h.s.slice(0, 60))}<br><b>${esc(h.d.slice(0, 80))}</b></div>`).join('') : '<span class="hint">Chưa có.</span>'; };
      drawHist();
      async function run() {
        const text = src.value.trim(); $(el, '.cnt').textContent = src.value.length + '/5000';
        if (!text) { out.textContent = ''; $(el, '.dt').textContent = ''; return; }
        const f = st.from === 'auto' ? (detect(text) || 'en') : st.from; $(el, '.dt').textContent = st.from === 'auto' ? 'Nhận diện: ' + L.LANGS[f].flag + ' ' + L.LANGS[f].name : '';
        if (f === st.to) { out.textContent = text; return; }
        const me = ++seq; out.textContent = '…đang dịch'; let res = '';
        try { for (const c of chunks(text)) { if (me !== seq || dead) return; res += c.trim() ? (await L.translate(c, f, st.to)) : c; if (c === '\n') res += ''; } } catch (e) { if (me === seq) out.textContent = '⚠️ ' + e.message; return; }
        if (me !== seq || dead) return; out.textContent = res.trim();
        hist = [{ s: text, d: res.trim(), f, t: st.to }].concat(hist.filter(h => h.s !== text)).slice(0, 20); GV.store.set('textrans_h', hist); drawHist();
      }
      const later = () => { clearTimeout(timer); timer = setTimeout(run, 700); };
      src.oninput = later; fr.onchange = () => { st.from = fr.value; sync(); run(); }; to.onchange = () => { st.to = to.value; sync(); run(); };
      el.addEventListener('click', e => {
        const b = e.target.closest('button'), h = e.target.closest('.hl [data-i]');
        if (h) { const x = hist[+h.dataset.i]; src.value = x.s; st.from = x.f; st.to = x.t; fr.value = x.f; to.value = x.t; sync(); run(); return; }
        if (!b) return;
        if (b.classList.contains('sw')) { const f = st.from === 'auto' ? (detect(src.value) || 'en') : st.from; st.from = st.to; st.to = f === st.to ? 'vi' : f; fr.value = st.from; to.value = st.to; if (out.textContent && !out.textContent.startsWith('⚠') && !out.textContent.startsWith('…')) src.value = out.textContent; sync(); run(); }
        else if (b.classList.contains('cl')) { src.value = ''; run(); }
        else if (b.classList.contains('cp')) { const t = out.textContent; if (t) (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => GV.toast && GV.toast('Đã sao chép', { type: 'success' })).catch(() => {}); }
        else if (b.classList.contains('sp')) { L.speak(out.textContent, st.to); }
        else if (b.classList.contains('dl')) { const t = out.textContent; if (!t) return; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/plain;charset=utf-8' })); a.download = 'ban-dich.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
        else if (b.classList.contains('up')) { const i = document.createElement('input'); i.type = 'file'; i.accept = '.txt,text/plain'; i.onchange = () => { const f = i.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { src.value = String(r.result).slice(0, 5000); run(); }; r.readAsText(f); }; i.click(); }
        else if (b.classList.contains('hc')) { hist = []; GV.store.set('textrans_h', hist); drawHist(); }
      });
      return () => { dead = true; clearTimeout(timer); };
    }
  });
})();
