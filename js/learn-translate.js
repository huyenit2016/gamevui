// Dịch giọng nói trực tiếp: nói → nhận dạng → dịch → đọc bản dịch. Hỗ trợ Anh/Nhật/Hàn/Trung ⇄ Việt và chế độ hội thoại hai bên.
(function () {
  const L = GV.learn, esc = GV.esc, $ = (r, s) => r.querySelector(s);
  const PRESETS = [['en', 'vi'], ['vi', 'en'], ['ja', 'vi'], ['vi', 'ja'], ['ko', 'vi'], ['vi', 'ko'], ['zh', 'vi'], ['vi', 'zh']];

  GV.register({
    id: 'translator', type: 'tool', cat: 'Học tập', name: 'Dịch giọng nói tự động', icon: '🎙️', desc: 'Nói vào mic → dịch ngay Anh·Nhật·Hàn·Trung ⇄ Việt, đọc bản dịch.',
    mount(el) {
      const st = Object.assign({ from: 'en', to: 'vi', speak: true, ai: true }, GV.store.get('tr', {}));
      let rec = null, log = [], side = null, pending = Promise.resolve(), dead = false;
      el.innerHTML = `<div class="tool" style="max-width:760px">${L.ai.panelHTML()}
        <div class="row pre">${PRESETS.map(([a, b], i) => `<button class="pbtn" data-p="${i}">${L.LANGS[a].flag}→${L.LANGS[b].flag} ${L.LANGS[a].name.replace('Tiếng ', '')}→${L.LANGS[b].name.replace('Tiếng ', '')}</button>`).join('')}</div>
        <div class="row"><select class="fr">${Object.keys(L.LANGS).map(k => `<option value="${k}">${L.LANGS[k].flag} ${L.LANGS[k].name}</option>`).join('')}</select><button class="pbtn sw" title="Đảo chiều">⇄</button><select class="to">${Object.keys(L.LANGS).map(k => `<option value="${k}">${L.LANGS[k].flag} ${L.LANGS[k].name}</option>`).join('')}</select></div>
        <div class="row"><button class="btn mic" style="font-size:18px;padding:14px 22px">🎤 Bấm để nói</button><button class="btn ghost conv" style="padding:14px 18px">🗣️ Chế độ hội thoại</button></div>
        <div class="hint live" style="min-height:1.4em"></div>
        <div class="row"><input class="tx" placeholder="…hoặc gõ chữ để dịch" style="flex:1;min-width:160px"><button class="btn tr">Dịch</button></div>
        <div class="row"><label><input type="checkbox" class="sp"> 🔊 Đọc bản dịch</label><label><input type="checkbox" class="uai"> Dùng AI (nếu có khóa) để dịch chính xác hơn</label></div>
        <div class="hint eng"></div><div class="log" style="text-align:left"></div>
        <div class="row"><button class="pbtn cp">📋 Sao chép</button><button class="pbtn ex">⬇️ Tải .txt</button><button class="pbtn cl">🗑 Xoá</button></div></div>`;
      const sync = () => { $(el, '.fr').value = st.from; $(el, '.to').value = st.to; $(el, '.sp').checked = st.speak; $(el, '.uai').checked = st.ai; GV.store.set('tr', st); $(el, '.eng').textContent = (st.ai && L.ai.ready() ? 'Bộ dịch: AI ' + L.ai.cfg().provider : 'Bộ dịch: miễn phí (MyMemory – giới hạn lượt/ngày; nhập khóa AI để dịch tốt hơn, không giới hạn)') + (L.hasSTT() ? '' : ' · ⚠️ Trình duyệt này chưa hỗ trợ nhận giọng nói, hãy gõ chữ hoặc dùng Chrome/Safari mới.'); };
      L.ai.bindPanel(el, sync);
      const draw = () => {
        $(el, '.log').innerHTML = log.slice().reverse().map(x => `<div class="box" style="margin:6px 0"><div class="hint">${L.LANGS[x.f].flag} ${esc(x.s)}</div><div style="font-size:1.15rem;font-weight:700">${L.LANGS[x.t].flag} ${x.d == null ? '<i>đang dịch…</i>' : esc(x.d)} ${x.d ? `<a href="#" data-sp="${x.id}" style="text-decoration:none">🔊</a>` : ''}</div></div>`).join('');
      };
      async function handle(text, f, t) {
        text = text.trim(); if (!text) return;
        const item = { id: Date.now() + Math.random(), s: text, f, t, d: null }; log.push(item); draw();
        try { item.d = await L.translate(text, f, t, { ai: st.ai }); } catch (e) { item.d = '⚠️ ' + e.message; }
        draw();
        if (st.speak && item.d && !item.d.startsWith('⚠️')) { const was = rec; if (was) was.pause(); await L.speakAsync(item.d, t); if (was && !dead) was.resume(); }
      }
      // điều khiển nhận giọng nói (tạm dừng khi đang đọc để mic không thu lại tiếng loa)
      function startRec(f, t, which) {
        stopRec();
        if (!L.hasSTT()) { $(el, '.live').textContent = 'Trình duyệt chưa hỗ trợ nhận giọng nói – hãy dùng ô gõ chữ.'; return; }
        let ctl = null, paused = false;
        const open = () => { ctl = L.listen(f, { onText: (fin, it) => { if (paused) return; $(el, '.live').textContent = it ? '… ' + it : ''; if (fin.trim()) { $(el, '.live').textContent = ''; pending = pending.then(() => handle(fin, f, t)); } }, onError: m => { $(el, '.live').textContent = m; } }); };
        open(); side = which;
        rec = { pause() { paused = true; ctl && ctl.stop(); }, resume() { paused = false; if (side === which) open(); }, stop() { paused = false; ctl && ctl.stop(); } };
        paint();
      }
      function stopRec() { if (rec) rec.stop(); rec = null; side = null; paint(); }
      function paint() {
        const m = $(el, '.mic'), c = $(el, '.conv');
        m.textContent = side === 'one' ? '⏹ Đang nghe… bấm để dừng' : '🎤 Bấm để nói'; m.style.background = side === 'one' ? 'var(--bad)' : '';
        if (!el.querySelector('.convbox')) return;
        el.querySelector('[data-side=A]').style.outline = side === 'A' ? '3px solid var(--ok)' : ''; el.querySelector('[data-side=B]').style.outline = side === 'B' ? '3px solid var(--ok)' : '';
      }
      $(el, '.fr').onchange = e => { st.from = e.target.value; sync(); stopRec(); convUI(); };
      $(el, '.to').onchange = e => { st.to = e.target.value; sync(); stopRec(); convUI(); };
      $(el, '.sw').onclick = () => { [st.from, st.to] = [st.to, st.from]; sync(); stopRec(); convUI(); };
      el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const [a, c] = PRESETS[+b.dataset.p]; st.from = a; st.to = c; sync(); stopRec(); convUI(); });
      $(el, '.sp').onchange = e => { st.speak = e.target.checked; sync(); }; $(el, '.uai').onchange = e => { st.ai = e.target.checked; sync(); };
      $(el, '.mic').onclick = () => { L.unlock(); side === 'one' ? stopRec() : startRec(st.from, st.to, 'one'); };
      const tr = () => { const t = $(el, '.tx').value; $(el, '.tx').value = ''; handle(t, st.from, st.to); };
      $(el, '.tr').onclick = tr; $(el, '.tx').onkeydown = e => { if (e.key === 'Enter') tr(); };
      el.querySelector('.log').onclick = e => { const a = e.target.closest('[data-sp]'); if (!a) return; e.preventDefault(); const x = log.find(v => String(v.id) === a.dataset.sp); if (x) { L.unlock(); L.speak(x.d, x.t); } };
      $(el, '.cl').onclick = () => { log = []; draw(); };
      const plain = () => log.map(x => `[${L.LANGS[x.f].name}] ${x.s}\n[${L.LANGS[x.t].name}] ${x.d}\n`).join('\n');
      $(el, '.cp').onclick = async e => { try { await navigator.clipboard.writeText(plain()); e.target.textContent = 'Đã chép ✓'; setTimeout(() => e.target.textContent = '📋 Sao chép', 1200); } catch (x) {} };
      $(el, '.ex').onclick = () => L.download('ban-dich.txt', plain());
      // chế độ hội thoại: hai nút, mỗi bên nói ngôn ngữ của mình
      let conv = false;
      function convUI() {
        let box = el.querySelector('.convbox'); if (box) box.remove(); if (!conv) return;
        box = document.createElement('div'); box.className = 'convbox row';
        box.innerHTML = `<button class="btn" data-side="A" style="padding:16px 22px">🎤 Bên A nói ${L.LANGS[st.from].flag} ${L.LANGS[st.from].name}</button><button class="btn" data-side="B" style="padding:16px 22px;background:linear-gradient(135deg,#3ddc97,#3b82f6)">🎤 Bên B nói ${L.LANGS[st.to].flag} ${L.LANGS[st.to].name}</button>`;
        $(el, '.conv').parentNode.insertAdjacentElement('afterend', box);
        box.onclick = e => { const b = e.target.closest('[data-side]'); if (!b) return; L.unlock(); const w = b.dataset.side; side === w ? stopRec() : (w === 'A' ? startRec(st.from, st.to, 'A') : startRec(st.to, st.from, 'B')); };
      }
      $(el, '.conv').onclick = () => { conv = !conv; stopRec(); $(el, '.conv').classList.toggle('ghost', !conv); convUI(); };
      sync(); draw();
      return () => { dead = true; stopRec(); try { speechSynthesis.cancel(); } catch (e) {} };
    }
  });
})();
