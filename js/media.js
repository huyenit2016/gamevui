// Giải trí: Nghe nhạc · Karaoke · Xem TV
// Nguyên tắc pháp lý: KHÔNG phát lại nội dung có bản quyền. Nhạc lấy từ kho Creative Commons / phạm vi công cộng (Openverse),
// hoặc file chính người dùng sở hữu (chạy cục bộ, không tải lên đâu). TV chỉ liệt kê luồng công khai do chính đài cung cấp (iptv-org).
(function () {
  const $ = (el, s) => el.querySelector(s), $$ = (el, s) => [...el.querySelectorAll(s)];
  const esc = GV.esc;
  const fmt = s => { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const CSS = `.md{width:100%;max-width:860px;display:flex;flex-direction:column;gap:14px;text-align:left}
  .md h3{margin:0 0 6px;font-size:1rem}.md .box{background:var(--card2);border:1px solid var(--line);border-radius:var(--r);padding:14px}
  .md .seg{display:flex;gap:6px;flex-wrap:wrap}.md .seg button,.md .chip{border:1px solid var(--line);background:var(--card);color:var(--mut);border-radius:99px;padding:6px 14px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:.15s}
  .md .seg button:hover,.md .chip:hover{color:var(--fg);border-color:var(--acc)}.md .seg button.on{background:rgba(124,58,237,.2);color:var(--fg);border-color:var(--acc)}
  .md .sr{display:flex;gap:8px}.md .sr input{flex:1}
  .md .lst{display:flex;flex-direction:column;gap:6px;max-height:340px;overflow:auto;margin-top:10px}
  .md .it{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--line);border-radius:12px;background:var(--card);cursor:pointer;transition:.15s;text-align:left;font:inherit;color:var(--fg);width:100%}
  .md .it:hover{border-color:var(--acc)}.md .it.on{border-color:var(--acc);background:rgba(124,58,237,.14)}
  .md .it img,.md .it .th{width:42px;height:42px;border-radius:9px;object-fit:cover;background:var(--inp);flex:0 0 auto;display:grid;place-items:center;font-size:20px}
  .md .it .tx{min-width:0;flex:1}.md .it b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.md .it small{color:var(--mut);font-size:12px}
  .md .np{display:flex;gap:14px;align-items:center}.md .np .art{width:84px;height:84px;border-radius:16px;background:linear-gradient(135deg,#7C3AED,#06B6D4);display:grid;place-items:center;font-size:2.4rem;flex:0 0 auto;overflow:hidden}.md .np .art img{width:100%;height:100%;object-fit:cover}
  .md .np .inf{min-width:0;flex:1}.md .np .inf b{font-size:1.05rem;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .md audio,.md video{width:100%;margin-top:10px;border-radius:12px}.md video{background:#000;aspect-ratio:16/9}
  .md .ctl{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center}.md .ctl .btn{padding:7px 14px}.md .ctl .on{outline:2px solid var(--acc)}
  .md .lic{font-size:12px;color:var(--mut)}.md .lic a{text-decoration:underline}
  .md .note{font-size:12.5px;color:var(--mut);line-height:1.5}
  .md .lyr{height:300px;overflow:auto;scroll-behavior:smooth;text-align:center;padding:110px 12px;background:radial-gradient(120% 100% at 50% 0,rgba(124,58,237,.25),transparent 70%),var(--inp);border:1px solid var(--line);border-radius:var(--r)}
  .md .lyr p{margin:0 0 10px;font-size:1.05rem;color:var(--mut);transition:.25s;line-height:1.4}.md .lyr p.on{color:#fff;font-size:1.5rem;font-weight:800;text-shadow:0 0 22px rgba(124,58,237,.9)}.md .lyr p.past{opacity:.45}
  :root[data-theme=light] .md .lyr p.on{color:#4c1d95;text-shadow:none}
  .md .sl{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.md .sl label{display:flex;flex-direction:column;gap:2px;font-size:12.5px}
  .md .meter{height:8px;border-radius:9px;background:var(--inp);overflow:hidden;border:1px solid var(--line)}.md .meter i{display:block;height:100%;width:0;background:linear-gradient(90deg,#22C55E,#F59E0B,#EF4444);transition:width .06s}
  .md .tvg{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:14px}.md .tvl{max-height:430px}
  .md .tvw{position:relative}.md .tvs{position:absolute;inset:0;display:none;place-items:center;text-align:center;padding:20px;background:rgba(0,0,0,.72);color:#fff;border-radius:12px;font-size:14px}.md .tvs.show{display:grid}
  @media(max-width:760px){.md .tvg{grid-template-columns:1fr}.md .tvl{max-height:300px}.md .np .art{width:64px;height:64px;font-size:1.8rem}.md .lyr{height:260px}}`;
  const ready = el => { if (!el.querySelector('style.mdcss')) { const s = document.createElement('style'); s.className = 'mdcss'; s.textContent = CSS; el.prepend(s); } };
  const jfetch = async (url, ms = 12000) => {
    const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
    try { const r = await fetch(url, { signal: c.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return r; } finally { clearTimeout(t); }
  };

  /* ---------- Kho nhạc miễn phí (Openverse: Creative Commons / phạm vi công cộng) ---------- */
  async function searchFree(q, page = 1) {
    const r = await jfetch(`https://api.openverse.org/v1/audio/?q=${encodeURIComponent(q)}&page_size=20&page=${page}&license=cc0,pdm,by,by-sa&mature=false`);
    const j = await r.json();
    return (j.results || []).filter(x => x.url).map(x => ({
      id: x.id, title: x.title || 'Không tên', artist: x.creator || 'Không rõ', src: x.url, dur: (x.duration || 0) / 1000,
      lic: (x.license || '').toUpperCase() + (x.license_version ? ' ' + x.license_version : ''), licUrl: x.license_url || '', page: x.foreign_landing_url || '', thumb: x.thumbnail || '', src_name: x.source || x.provider || ''
    }));
  }
  const licHTML = t => t.local ? '<span class="lic">File của bạn – chỉ phát trên máy này.</span>' :
    `<span class="lic">Giấy phép ${esc(t.lic)}${t.licUrl ? ` (<a href="${esc(GV.safeUrl(t.licUrl))}" target="_blank" rel="noopener">chi tiết</a>)` : ''} · Tác giả: ${esc(t.artist)}${t.page ? ` · <a href="${esc(GV.safeUrl(t.page))}" target="_blank" rel="noopener">Nguồn${t.src_name ? ' ' + esc(t.src_name) : ''}</a>` : ''}</span>`;
  const row = (t, i, on) => `<button class="it${on ? ' on' : ''}" data-i="${i}"><span class="th">${t.thumb ? `<img src="${esc(GV.safeUrl(t.thumb))}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '🎵'}</span><span class="tx"><b>${esc(t.title)}</b><small>${esc(t.artist)}${t.dur ? ' · ' + fmt(t.dur) : ''}${t.lic ? ' · ' + esc(t.lic) : ''}</small></span></button>`;
  const CHIPS = ['nhạc không lời', 'piano', 'lofi', 'acoustic', 'guitar', 'ambient', 'jazz', 'classical', 'folk', 'instrumental'];

  /* =============== NGHE NHẠC =============== */
  GV.register({
    id: 'music', type: 'tool', cat: 'Giải trí', name: 'Nghe nhạc', icon: '🎧', desc: 'Kho nhạc miễn phí bản quyền (CC/phạm vi công cộng) hoặc nhạc của bạn. Không quảng cáo.',
    mount(el) {
      el.innerHTML = `<div class="md"><div class="box"><div class="np"><div class="art" id="art">🎧</div><div class="inf"><b id="ti">Chọn một bài để nghe</b><span class="lic" id="ar"></span><div id="lc"></div></div></div>
        <audio id="au" controls preload="none"></audio>
        <div class="ctl"><button class="btn ghost" id="pv" aria-label="Bài trước">⏮</button><button class="btn ghost" id="nx" aria-label="Bài sau">⏭</button><button class="btn ghost" id="sh">🔀 Ngẫu nhiên</button><button class="btn ghost" id="rp">🔁 Lặp</button></div></div>
        <div class="box"><div class="seg" id="tabs"><button class="on" data-m="free">Kho nhạc miễn phí</button><button data-m="mine">Nhạc của tôi</button></div>
          <div id="pf"><div class="sr" style="margin-top:10px"><input id="mq" type="search" placeholder="Tìm nhạc (vd: piano, lofi, acoustic)…"><button class="btn" id="go">Tìm</button></div>
            <div class="seg" style="margin-top:8px">${CHIPS.map(c => `<button class="chip" data-c="${c}">${c}</button>`).join('')}</div></div>
          <div id="pm" hidden><p class="note" style="margin:10px 0 6px">Chọn file nhạc trong máy (mp3, m4a, wav, ogg…). File chỉ phát ngay trên trình duyệt, không tải lên đâu cả.</p><input id="fi" type="file" accept="audio/*" multiple></div>
          <div class="lst" id="ls" role="list"></div><p class="note" id="st" style="margin-top:8px"></p></div>
        <p class="note">Nguồn nhạc: <a href="https://openverse.org" target="_blank" rel="noopener" style="text-decoration:underline">Openverse</a> (tổng hợp nhạc Creative Commons, CC0 và phạm vi công cộng). Bài CC-BY cần ghi công tác giả — GameVui hiển thị sẵn dưới mỗi bài. GameVui không lưu hay phát lại nhạc có bản quyền, và không chèn quảng cáo vào trình phát.</p></div>`;
      ready(el);
      const au = $(el, '#au'), ls = $(el, '#ls'), st = $(el, '#st'); let list = [], cur = -1, shuf = false, rep = 0, mode = 'free', urls = [], dead = false, mine = [];
      const show = () => { ls.innerHTML = list.map((t, i) => row(t, i, i === cur)).join('') || ''; };
      function play(i) {
        const t = list[i]; if (!t) return; cur = i; au.src = t.src; au.play().catch(() => {});
        $(el, '#ti').textContent = t.title; $(el, '#ar').textContent = t.local ? '' : '' ; $(el, '#lc').innerHTML = licHTML(t);
        $(el, '#art').innerHTML = t.thumb ? `<img src="${esc(GV.safeUrl(t.thumb))}" alt="" referrerpolicy="no-referrer">` : '🎧'; show();
        if ('mediaSession' in navigator) try { navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist }); } catch (e) {}
      }
      const next = d => { if (!list.length) return; let i = shuf ? GV.rnd(list.length) : (cur + d + list.length) % list.length; play(i); };
      au.onended = () => { if (rep === 2) play(cur); else if (rep === 1 || cur < list.length - 1 || shuf) next(1); };
      au.onerror = () => { st.textContent = 'Không phát được bài này (nguồn có thể đã gỡ). Đang chuyển bài khác…'; if (list.length > 1) setTimeout(() => { if (!dead) next(1); }, 1200); };
      $(el, '#nx').onclick = () => next(1); $(el, '#pv').onclick = () => next(-1);
      $(el, '#sh').onclick = e => { shuf = !shuf; e.currentTarget.classList.toggle('on', shuf); };
      $(el, '#rp').onclick = e => { rep = (rep + 1) % 3; e.currentTarget.textContent = ['🔁 Lặp', '🔁 Lặp tất cả', '🔂 Lặp 1 bài'][rep]; e.currentTarget.classList.toggle('on', rep > 0); };
      ls.onclick = e => { const b = e.target.closest('[data-i]'); if (b) play(+b.dataset.i); };
      async function search(q) {
        q = (q || '').trim(); if (!q) return; st.textContent = 'Đang tìm…'; ls.innerHTML = '';
        try { list = await searchFree(q); cur = -1; show(); st.textContent = list.length ? `${list.length} bài – bấm để nghe.` : 'Không tìm thấy, thử từ khoá khác (tiếng Anh thường có nhiều kết quả hơn).'; }
        catch (e) { st.textContent = 'Không kết nối được kho nhạc (' + (e.message || 'lỗi mạng') + '). Kiểm tra mạng hoặc thử lại sau.'; }
      }
      $(el, '#go').onclick = () => search($(el, '#mq').value);
      $(el, '#mq').onkeydown = e => { if (e.key === 'Enter') search(e.target.value); };
      $(el, '.seg:not(#tabs)').onclick = e => { const c = e.target.dataset.c; if (c) { $(el, '#mq').value = c; search(c); } };
      $(el, '#tabs').onclick = e => {
        const m = e.target.dataset.m; if (!m) return; mode = m; $$(el, '#tabs button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
        $(el, '#pf').hidden = m !== 'free'; $(el, '#pm').hidden = m !== 'mine'; st.textContent = '';
        if (m === 'mine') { list = mine; cur = -1; show(); } else { list = []; ls.innerHTML = ''; }
      };
      $(el, '#fi').onchange = e => {
        mine = [...e.target.files].filter(f => f.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg|flac|aac)$/i.test(f.name)).map(f => { const u = URL.createObjectURL(f); urls.push(u); return { title: f.name.replace(/\.[^.]+$/, ''), artist: 'File của bạn', src: u, local: true }; });
        list = mine; cur = -1; show(); st.textContent = mine.length ? mine.length + ' bài – bấm để nghe.' : 'Không có file nhạc hợp lệ.'; if (mine.length) play(0);
      };
      search('nhạc không lời');
      return () => { dead = true; au.pause(); au.removeAttribute('src'); urls.forEach(u => URL.revokeObjectURL(u)); };
    }
  });

  /* =============== KARAOKE =============== */
  // Lời bài hát mẫu thuộc phạm vi công cộng. Lời/nhạc của bài khác: tự dán hoặc mở file .lrc / .txt của bạn.
  const SONGS = {
    twinkle: { n: 'Twinkle, Twinkle, Little Star (PD)', l: 'Twinkle, twinkle, little star\nHow I wonder what you are\nUp above the world so high\nLike a diamond in the sky\nTwinkle, twinkle, little star\nHow I wonder what you are' },
    jingle: { n: 'Jingle Bells (PD)', l: 'Dashing through the snow\nIn a one-horse open sleigh\nO\'er the fields we go\nLaughing all the way\nBells on bobtail ring\nMaking spirits bright\nWhat fun it is to ride and sing\nA sleighing song tonight\nOh, jingle bells, jingle bells\nJingle all the way\nOh, what fun it is to ride\nIn a one-horse open sleigh' },
    auld: { n: 'Auld Lang Syne (PD)', l: 'Should auld acquaintance be forgot\nAnd never brought to mind?\nShould auld acquaintance be forgot\nAnd auld lang syne?\nFor auld lang syne, my dear\nFor auld lang syne\nWe\'ll take a cup of kindness yet\nFor auld lang syne' },
    hbd: { n: 'Chúc mừng sinh nhật (lời chung)', l: 'Chúc mừng sinh nhật, chúc mừng sinh nhật\nChúc bạn luôn vui, chúc bạn thật vui\nChúc mừng sinh nhật, chúc mừng sinh nhật\nChúc bạn luôn khỏe, hạnh phúc bên mọi người' }
  };
  function parseLyrics(txt) {
    const out = [];
    String(txt || '').split(/\r?\n/).forEach(raw => {
      const stamps = [...raw.matchAll(/\[(\d{1,2}):(\d{1,2}(?:[.:]\d{1,3})?)\]/g)];
      const text = raw.replace(/\[[^\]]*\]/g, '').trim();
      if (stamps.length) { if (text) stamps.forEach(m => out.push({ t: +m[1] * 60 + parseFloat(m[2].replace(':', '.')), text })); }
      else if (text && !/^\[.*\]$/.test(raw.trim())) out.push({ t: null, text });
    });
    if (out.some(x => x.t != null)) return out.filter(x => x.t != null).sort((a, b) => a.t - b.t);
    return out;
  }
  GV.register({
    id: 'karaoke', type: 'tool', cat: 'Giải trí', name: 'Karaoke', icon: '🎤', desc: 'Hát karaoke: lời chạy theo nhạc (.lrc), mic có vang/echo, thu âm lại. Nhạc & lời do bạn chọn.',
    mount(el) {
      el.innerHTML = `<div class="md">
        <div class="box"><h3>1. Lời bài hát</h3><div class="sr"><select id="sg" style="flex:1"><option value="">— Dán lời của bạn —</option>${Object.entries(SONGS).map(([k, v]) => `<option value="${k}">${esc(v.n)}</option>`).join('')}</select><label class="btn ghost" style="cursor:pointer;margin:0">Mở file .lrc/.txt<input id="lf" type="file" accept=".lrc,.txt,text/plain" hidden></label></div>
          <textarea id="tx" style="min-height:110px;margin-top:8px" placeholder="Dán lời bài hát ở đây (mỗi dòng một câu). Nếu có dấu thời gian dạng [01:23.45] lời sẽ chạy đúng nhịp theo nhạc."></textarea>
          <p class="note">GameVui không cung cấp lời/nhạc có bản quyền. Hãy dùng lời và nhạc bạn có quyền sử dụng (tự sáng tác, phạm vi công cộng, hoặc bạn sở hữu).</p></div>
        <div class="box"><h3>2. Nhạc nền (tuỳ chọn)</h3><div class="seg" id="bk"><button class="on" data-b="none">Không có nhạc</button><button data-b="file">File của tôi</button><button data-b="free">Kho nhạc miễn phí</button></div>
          <div id="bf" hidden style="margin-top:8px"><input id="af" type="file" accept="audio/*,video/*"><p class="note">File beat/karaoke của bạn chạy ngay trên máy, có thể thu âm lẫn giọng.</p></div>
          <div id="bs" hidden style="margin-top:8px"><div class="sr"><input id="mq" placeholder="Tìm nhạc nền (vd: instrumental)" value="instrumental"><button class="btn" id="go">Tìm</button></div><div class="lst" id="ls"></div><p class="note" id="sm"></p></div>
          <p class="note" id="bn" style="margin-top:8px"></p></div>
        <div class="box"><div class="lyr" id="lyr" aria-live="polite"><p>Nhấn “Bắt đầu” để hát</p></div>
          <audio id="au" controls preload="auto"></audio><audio id="ar" hidden></audio>
          <div class="ctl"><button class="btn" id="pl">▶ Bắt đầu</button><button class="btn ghost" id="rs">⏮ Từ đầu</button><label class="note" id="spw" style="display:flex;gap:6px;align-items:center">Tốc độ <input id="sp" type="range" min="1.5" max="8" step="0.5" value="4" style="width:110px"> <b id="spv">4s/dòng</b></label></div></div>
        <div class="box"><h3>3. Micro &amp; thu âm</h3><div class="ctl" style="margin-top:0"><button class="btn" id="mic">🎙 Bật micro</button><button class="btn ghost" id="rec" disabled>⏺ Thu âm</button><label class="note"><input type="checkbox" id="mon"> Nghe lại giọng mình (nên đeo tai nghe)</label></div>
          <div class="meter" style="margin:10px 0"><i id="lv"></i></div>
          <div class="sl"><label>Giọng<input type="range" id="vg" min="0" max="1.5" step="0.05" value="1"></label><label>Nhạc nền<input type="range" id="vm" min="0" max="1" step="0.05" value="0.8"></label><label>Echo<input type="range" id="ve" min="0" max="0.8" step="0.05" value="0.25"></label><label>Vang (reverb)<input type="range" id="vr" min="0" max="1" step="0.05" value="0.3"></label></div>
          <p class="note" id="mn" style="margin-top:8px"></p><div id="rr"></div></div></div>`;
      ready(el);
      const au = $(el, '#au'), ar = $(el, '#ar'), lyr = $(el, '#lyr'), tx = $(el, '#tx'); let lines = [], idx = -1, raf = 0, running = false, t0 = 0, tBase = 0, ctx = null, g = {}, mixable = false, micStream = null, rec = null, chunks = [], urls = [], dead = false, src = 'none', lastRec = '';
      au.hidden = true; const cur = () => (src === 'free' ? ar : au);
      const hasAudio = () => src !== 'none' && cur().src;
      function render() {
        lines = parseLyrics(tx.value); idx = -1;
        lyr.innerHTML = lines.length ? lines.map((l, i) => `<p data-i="${i}">${esc(l.text)}</p>`).join('') : '<p>Dán lời bài hát để bắt đầu</p>'; lyr.scrollTop = 0;
      }
      const synced = () => lines.length && lines[0].t != null;
      function timeNow() { return hasAudio() ? cur().currentTime : tBase + (running ? (performance.now() - t0) / 1000 : 0); }
      function lineAt(t) {
        if (!lines.length) return -1;
        if (synced()) { let k = -1; for (let i = 0; i < lines.length; i++) { if (lines[i].t <= t + 0.15) k = i; else break; } return k; }
        const spl = +$(el, '#sp').value, d = hasAudio() && isFinite(cur().duration) && cur().duration > 0 ? cur().duration / lines.length : spl;
        return Math.min(lines.length - 1, Math.floor(t / d));
      }
      function tick() {
        const k = lineAt(timeNow());
        if (k !== idx) { idx = k; $$(lyr, 'p').forEach((p, i) => { p.classList.toggle('on', i === k); p.classList.toggle('past', i < k); }); const p = lyr.children[k]; if (p) lyr.scrollTo({ top: p.offsetTop - lyr.clientHeight / 2 + p.clientHeight / 2 }); }
        if (g.an) { const d = new Uint8Array(g.an.fftSize); g.an.getByteTimeDomainData(d); let m = 0; for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i] - 128)); $(el, '#lv').style.width = Math.min(100, m * 2.2) + '%'; }
        if (lines.length && k >= lines.length - 1 && !hasAudio() && timeNow() > (lines.length) * +$(el, '#sp').value) stop();
        raf = requestAnimationFrame(tick);
      }
      function start() { if (running) return; running = true; t0 = performance.now(); if (hasAudio()) cur().play().catch(() => {}); $(el, '#pl').textContent = '⏸ Tạm dừng'; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
      function stop() { if (!running) return; running = false; tBase += (performance.now() - t0) / 1000; if (hasAudio()) cur().pause(); $(el, '#pl').textContent = '▶ Tiếp tục'; }
      $(el, '#pl').onclick = () => { if (!lines.length) { render(); if (!lines.length) return; } running ? stop() : start(); };
      $(el, '#rs').onclick = () => { const was = running; if (running) stop(); tBase = 0; idx = -1; if (hasAudio()) cur().currentTime = 0; $$(lyr, 'p').forEach(p => p.classList.remove('on', 'past')); lyr.scrollTop = 0; if (was) start(); };
      au.onended = ar.onended = () => { running = false; $(el, '#pl').textContent = '▶ Hát lại'; tBase = 0; if (rec && rec.state === 'recording') $(el, '#rec').click(); };
      $(el, '#sp').oninput = e => { $(el, '#spv').textContent = e.target.value + 's/dòng'; };
      tx.oninput = render; $(el, '#sg').onchange = e => { const s = SONGS[e.target.value]; if (s) { tx.value = s.l; render(); } };
      $(el, '#lf').onchange = async e => { const f = e.target.files[0]; if (!f) return; tx.value = await f.text(); $(el, '#sg').value = ''; render(); };
      // nhạc nền
      function setSrc(kind) {
        src = kind; [au, ar].forEach(a => a.pause()); $$(el, '#bk button').forEach(b => b.classList.toggle('on', b.dataset.b === kind));
        $(el, '#bf').hidden = kind !== 'file'; $(el, '#bs').hidden = kind !== 'free'; mixable = kind === 'file'; tBase = 0; running = false; $(el, '#pl').textContent = '▶ Bắt đầu';
        $(el, '#bn').textContent = kind === 'free' ? 'Nhạc từ kho miễn phí phát qua loa; bản thu âm sẽ chỉ có giọng của bạn (trình duyệt không cho trộn nhạc từ máy chủ khác).' : '';
      }
      $(el, '#bk').onclick = e => { const b = e.target.dataset.b; if (b) setSrc(b); };
      $(el, '#af').onchange = e => { const f = e.target.files[0]; if (!f) return; const u = URL.createObjectURL(f); urls.push(u); au.src = u; au.load(); $(el, '#bn').textContent = 'Đã nạp: ' + f.name; wire(au, 'vm'); };
      let free = [];
      async function sfree() {
        const sm = $(el, '#sm'); sm.textContent = 'Đang tìm…';
        try { free = await searchFree($(el, '#mq').value || 'instrumental'); $(el, '#ls').innerHTML = free.map((t, i) => row(t, i, false)).join(''); sm.textContent = free.length ? 'Bấm một bài để dùng làm nhạc nền.' : 'Không tìm thấy.'; } catch (e) { sm.textContent = 'Không kết nối được kho nhạc.'; }
      }
      $(el, '#go').onclick = sfree;
      $(el, '#ls').onclick = e => { const b = e.target.closest('[data-i]'); if (!b) return; const t = free[+b.dataset.i]; ar.src = t.src; ar.load(); $$(el, '#ls .it').forEach(x => x.classList.toggle('on', x === b)); $(el, '#bn').textContent = 'Nhạc nền: ' + t.title + ' — ' + t.artist + ' (' + t.lic + ')'; ar.volume = +$(el, '#vm').value; };
      // Web Audio: mic + hiệu ứng
      function impulse(c, sec = 1.8) { const n = c.sampleRate * sec, b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); } return b; }
      function wire(a) { // nối nhạc nền (file cục bộ) vào đồ thị âm thanh để thu lẫn giọng
        if (!ctx || a._src) return; try { a._src = ctx.createMediaElementSource(a); a._src.connect(g.music); } catch (e) {}
      }
      async function micOn() {
        const mb = $(el, '#mic');
        if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; g.mon && g.mon.disconnect(); mb.textContent = '🎙 Bật micro'; $(el, '#rec').disabled = true; $(el, '#lv').style.width = '0'; return; }
        try { micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch (e) { $(el, '#mn').textContent = 'Không mở được micro: hãy cho phép quyền micro cho trang này (cần HTTPS).'; return; }
        if (!ctx) {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
          g.mic = ctx.createGain(); g.music = ctx.createGain(); g.dry = ctx.createGain(); g.dl = ctx.createDelay(1); g.fb = ctx.createGain(); g.echo = ctx.createGain(); g.cv = ctx.createConvolver(); g.rv = ctx.createGain(); g.mix = ctx.createGain(); g.mon = ctx.createGain(); g.dst = ctx.createMediaStreamDestination(); g.an = ctx.createAnalyser(); g.an.fftSize = 512; g.cv.buffer = impulse(ctx); g.dl.delayTime.value = 0.26; g.fb.gain.value = 0.35;
          g.mic.connect(g.an); g.mic.connect(g.dry); g.dry.connect(g.mix);
          g.mic.connect(g.dl); g.dl.connect(g.fb); g.fb.connect(g.dl); g.dl.connect(g.echo); g.echo.connect(g.mix);
          g.mic.connect(g.cv); g.cv.connect(g.rv); g.rv.connect(g.mix);
          g.mix.connect(g.dst); g.mix.connect(g.mon); g.music.connect(g.dst); g.music.connect(ctx.destination);
          const set = () => { g.mic.gain.value = +$(el, '#vg').value; g.music.gain.value = +$(el, '#vm').value; g.echo.gain.value = +$(el, '#ve').value; g.rv.gain.value = +$(el, '#vr').value; ar.volume = +$(el, '#vm').value; g.mon.gain.value = $(el, '#mon').checked ? 1 : 0; };
          ['vg', 'vm', 've', 'vr'].forEach(id => $(el, '#' + id).oninput = set); $(el, '#mon').onchange = () => { g.mon.gain.value = $(el, '#mon').checked ? 1 : 0; if ($(el, '#mon').checked) g.mon.connect(ctx.destination); else try { g.mon.disconnect(ctx.destination); } catch (e) {} }; set(); g.set = set;
        }
        if (ctx.state === 'suspended') await ctx.resume();
        if (g.micSrc) try { g.micSrc.disconnect(); } catch (e) {}
        g.micSrc = ctx.createMediaStreamSource(micStream); g.micSrc.connect(g.mic);
        if (src === 'file') wire(au);
        mb.textContent = '🎙 Tắt micro'; $(el, '#rec').disabled = false; $(el, '#mn').textContent = 'Micro đang bật. Đeo tai nghe để tránh tiếng hú khi bật “Nghe lại giọng mình”.';
        if (!raf) raf = requestAnimationFrame(tick);
      }
      $(el, '#mic').onclick = micOn;
      ['vm'].forEach(id => $(el, '#' + id).addEventListener('input', () => { ar.volume = +$(el, '#vm').value; if (!ctx) au.volume = +$(el, '#vm').value; }));
      $(el, '#rec').onclick = () => {
        const b = $(el, '#rec');
        if (rec && rec.state === 'recording') { rec.stop(); return; }
        if (!g.dst) return; chunks = [];
        const mt = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
        try { rec = new MediaRecorder(g.dst.stream, mt ? { mimeType: mt } : undefined); } catch (e) { $(el, '#mn').textContent = 'Trình duyệt này chưa hỗ trợ thu âm.'; return; }
        rec.ondataavailable = e => e.data.size && chunks.push(e.data);
        rec.onstop = () => { if (dead) return; const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' }), u = URL.createObjectURL(blob); urls.push(u); const ext = /mp4/.test(blob.type) ? 'm4a' : /ogg/.test(blob.type) ? 'ogg' : 'webm'; $(el, '#rr').innerHTML = `<audio controls src="${u}"></audio><div class="ctl"><a class="btn" download="karaoke-gamevui.${ext}" href="${u}">⬇ Tải bản thu</a></div>`; b.textContent = '⏺ Thu âm'; };
        rec.start(); b.textContent = '⏹ Dừng thu'; $(el, '#mn').textContent = src === 'file' ? 'Đang thu: giọng + nhạc nền.' : 'Đang thu: chỉ có giọng của bạn.';
        if (!running) start();
      };
      setSrc('none'); render();
      return () => { dead = true; running = false; cancelAnimationFrame(raf); [au, ar].forEach(a => { a.pause(); a.removeAttribute('src'); }); if (rec && rec.state === 'recording') try { rec.stop(); } catch (e) {} if (micStream) micStream.getTracks().forEach(t => t.stop()); if (ctx) try { ctx.close(); } catch (e) {} urls.forEach(u => URL.revokeObjectURL(u)); };
    }
  });

  /* =============== XEM TV =============== */
  // Danh sách kênh: iptv-org (luồng công khai do chính đài/nhà phát hành cung cấp). GameVui không lưu trữ hay phát lại nội dung.
  const TV_COUNTRIES = [['vn', 'Việt Nam'], ['us', 'Hoa Kỳ'], ['gb', 'Anh'], ['jp', 'Nhật Bản'], ['kr', 'Hàn Quốc'], ['sg', 'Singapore'], ['au', 'Úc'], ['fr', 'Pháp'], ['de', 'Đức'], ['th', 'Thái Lan']];
  function parseM3U(txt) {
    const out = []; let cur = null;
    String(txt).split(/\r?\n/).forEach(l => {
      l = l.trim();
      if (l.startsWith('#EXTINF')) { const name = (l.match(/,(.*)$/) || [])[1] || '', logo = (l.match(/tvg-logo="([^"]*)"/) || [])[1] || '', grp = (l.match(/group-title="([^"]*)"/) || [])[1] || ''; cur = { name: name.trim(), logo, group: grp, need: false }; }
      else if (l.startsWith('#EXTVLCOPT') && cur) cur.need = true; // cần header riêng -> trình duyệt không phát được
      else if (l && !l.startsWith('#') && cur) { if (/^https:\/\//i.test(l) && !cur.need && cur.name) { cur.url = l; out.push(cur); } cur = null; }
    });
    const seen = new Set(); return out.filter(c => { const k = c.url; if (seen.has(k)) return false; seen.add(k); return true; });
  }
  let hlsLoad = null;
  const loadHls = () => hlsLoad || (hlsLoad = new Promise((res, rej) => { if (window.Hls) return res(window.Hls); const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.13/hls.min.js'; s.onload = () => res(window.Hls); s.onerror = () => { hlsLoad = null; rej(new Error('hls')); }; document.head.appendChild(s); }));
  GV.register({
    id: 'tv', type: 'tool', cat: 'Giải trí', name: 'Xem TV', icon: '📺', desc: 'Xem kênh truyền hình trực tuyến công khai (Việt Nam & quốc tế). Không chèn quảng cáo.',
    mount(el) {
      el.innerHTML = `<div class="md"><div class="tvg"><div><div class="tvw"><video id="v" controls playsinline></video><div class="tvs" id="vs"></div></div><div class="np" style="margin-top:10px"><div class="inf"><b id="cn">Chọn một kênh</b><span class="lic" id="ci"></span></div><button class="btn ghost" id="fv" aria-label="Yêu thích">☆</button></div></div>
        <div class="box"><div class="sr"><select id="co" style="flex:1">${TV_COUNTRIES.map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}<option value="news">Tin tức quốc tế</option><option value="fav">★ Kênh yêu thích / của tôi</option></select></div><input id="mq" type="search" placeholder="Tìm kênh…" style="width:100%;margin-top:8px"><div class="lst tvl" id="ls"></div><p class="note" id="st" style="margin-top:6px"></p></div></div>
        <details class="box"><summary style="cursor:pointer;font-weight:700">Thêm kênh của tôi (link .m3u8 / .mp4)</summary><div class="sr" style="margin-top:8px"><input id="nn" placeholder="Tên kênh"><input id="nu" placeholder="https://…/playlist.m3u8"></div><div class="ctl"><button class="btn" id="na">Thêm</button></div></details>
        <p class="note">Danh sách lấy từ <a href="https://github.com/iptv-org/iptv" target="_blank" rel="noopener" style="text-decoration:underline">iptv-org</a> – chỉ các luồng công khai do chính đài/nhà phát hành cung cấp. GameVui không lưu trữ hay phát lại nội dung và không chèn quảng cáo; kênh có thể tạm ngưng, bị chặn theo khu vực hoặc không cho phát trên trình duyệt. Tôn trọng bản quyền của các đài.</p></div>`;
      ready(el);
      const v = $(el, '#v'), vs = $(el, '#vs'), ls = $(el, '#ls'), st = $(el, '#st'); let list = [], hls = null, curCh = null, dead = false, cache = {};
      const favs = () => GV.store.get('tv_fav', []), mineCh = () => GV.store.get('tv_mine', []);
      const msg = t => { vs.textContent = t; vs.classList.toggle('show', !!t); };
      function paintList() {
        const q = $(el, '#mq').value.trim().toLowerCase(), f = favs().map(x => x.url);
        const arr = list.filter(c => !q || c.name.toLowerCase().includes(q)).slice(0, 300);
        ls.innerHTML = arr.map((c, i) => `<button class="it${curCh && curCh.url === c.url ? ' on' : ''}" data-u="${esc(c.url)}"><span class="th">${c.logo ? `<img src="${esc(GV.safeUrl(c.logo))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : '📺'}</span><span class="tx"><b>${esc(c.name)}</b><small>${esc(c.group || '')}${f.includes(c.url) ? ' · ★' : ''}</small></span></button>`).join('');
        st.textContent = arr.length ? `${arr.length}${list.length > arr.length ? '+' : ''} kênh` : 'Không có kênh phù hợp.';
      }
      async function load(k) {
        ls.innerHTML = ''; if (k === 'fav') { list = [...mineCh(), ...favs().filter(f => !mineCh().some(m => m.url === f.url))]; paintList(); if (!list.length) st.textContent = 'Chưa có kênh yêu thích. Bấm ☆ khi đang xem, hoặc thêm kênh của bạn bên dưới.'; return; }
        if (cache[k]) { list = cache[k]; return paintList(); }
        st.textContent = 'Đang tải danh sách kênh…';
        try { const url = k === 'news' ? 'https://iptv-org.github.io/iptv/categories/news.m3u' : `https://iptv-org.github.io/iptv/countries/${k}.m3u`; const r = await jfetch(url, 20000); list = cache[k] = parseM3U(await r.text()); if (k === 'news') list = cache[k] = list.slice(0, 600); paintList(); }
        catch (e) { st.textContent = 'Không tải được danh sách kênh (' + (e.message || 'lỗi mạng') + '). Thử lại sau hoặc thêm link kênh của bạn.'; }
      }
      async function play(c) {
        curCh = c; $(el, '#cn').textContent = c.name; $(el, '#ci').textContent = [c.group, 'Nguồn: iptv-org'].filter(Boolean).join(' · '); $(el, '#fv').textContent = favs().some(f => f.url === c.url) ? '★' : '☆'; paintList();
        msg('Đang kết nối…'); if (hls) { try { hls.destroy(); } catch (e) {} hls = null; } v.removeAttribute('src'); v.load();
        const fail = () => { if (!dead) msg('Không phát được kênh này (có thể tạm ngưng, chặn theo khu vực hoặc không cho phát trên trình duyệt). Hãy thử kênh khác.'); };
        try {
          if (/\.m3u8(\?|$)/i.test(c.url) || !/\.(mp4|webm)(\?|$)/i.test(c.url)) {
            if (v.canPlayType('application/vnd.apple.mpegurl')) { v.src = c.url; }
            else { const H = await loadHls(); if (dead) return; if (!H.isSupported()) return fail(); hls = new H({ lowLatencyMode: true }); hls.on(H.Events.ERROR, (_, d) => { if (d.fatal) fail(); }); hls.loadSource(c.url); hls.attachMedia(v); }
          } else v.src = c.url;
          v.onplaying = () => msg(''); v.onerror = fail; await v.play().catch(() => {});
        } catch (e) { fail(); }
      }
      ls.onclick = e => { const b = e.target.closest('[data-u]'); if (!b) return; const c = list.find(x => x.url === b.dataset.u); if (c) play(c); };
      $(el, '#co').onchange = e => load(e.target.value); $(el, '#mq').oninput = paintList;
      $(el, '#fv').onclick = () => { if (!curCh) return; let f = favs(); const i = f.findIndex(x => x.url === curCh.url); i >= 0 ? f.splice(i, 1) : f.push({ name: curCh.name, url: curCh.url, logo: curCh.logo, group: curCh.group }); GV.store.set('tv_fav', f); $(el, '#fv').textContent = i >= 0 ? '☆' : '★'; if ($(el, '#co').value === 'fav') load('fav'); };
      $(el, '#na').onclick = () => {
        const n = $(el, '#nn').value.trim(), u = $(el, '#nu').value.trim();
        if (!n || !/^https:\/\/.+/i.test(u)) { st.textContent = 'Nhập tên kênh và link bắt đầu bằng https://'; return; }
        const m = mineCh(); m.push({ name: n, url: u, logo: '', group: 'Kênh của tôi' }); GV.store.set('tv_mine', m); $(el, '#nn').value = $(el, '#nu').value = ''; $(el, '#co').value = 'fav'; load('fav');
      };
      load('vn');
      return () => { dead = true; if (hls) try { hls.destroy(); } catch (e) {} v.pause(); v.removeAttribute('src'); };
    }
  });
})();
