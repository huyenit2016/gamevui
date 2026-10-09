// Sách nói: tải ebook (PDF, DOCX, EPUB, TXT, HTML) → tách chữ trong trình duyệt → lật trang nào tự đọc trang đó (giọng đọc của thiết bị).
(function () {
  const $ = (r, s) => r.querySelector(s), esc = GV.esc;
  const loadScript = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('Không tải được thư viện đọc tệp.')); document.head.appendChild(s); });
  const libs = {};
  const need = k => libs[k] || (libs[k] = ({ pdf: () => loadScript('vendor/pdf.min.js'), docx: () => loadScript('vendor/mammoth.browser.min.js'), zip: () => loadScript('vendor/jszip.min.js') })[k]());
  /* ---------- kho sách (IndexedDB) ---------- */
  const idb = (() => { let db = null; const open = () => db ? Promise.resolve(db) : new Promise((ok, no) => { try { const r = indexedDB.open('gv_books', 1); r.onupgradeneeded = () => r.result.createObjectStore('books', { keyPath: 'id' }); r.onsuccess = () => ok(db = r.result); r.onerror = () => no(r.error); } catch (e) { no(e); } });
    const tx = (m, f) => open().then(d => new Promise((ok, no) => { const t = d.transaction('books', m), s = t.objectStore('books'), r = f(s); t.oncomplete = () => ok(r && r.result); t.onerror = () => no(t.error); }));
    return { all: () => tx('readonly', s => s.getAll()), put: b => tx('readwrite', s => s.put(b)), del: id => tx('readwrite', s => s.delete(id)) }; })();
  /* ---------- tách chữ từ tệp ---------- */
  const PAGE_CH = 1300;
  function paginate(text) { // chia văn bản liền thành "trang" theo đoạn, ~1300 ký tự
    const paras = String(text).replace(/\r/g, '').split(/\n\s*\n|\n/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean), pages = []; let cur = [], n = 0;
    paras.forEach(p => { if (n + p.length > PAGE_CH && cur.length) { pages.push(cur.join('\n')); cur = []; n = 0; } cur.push(p); n += p.length; if (p.length > PAGE_CH * 1.6) { pages.push(cur.join('\n')); cur = []; n = 0; } });
    if (cur.length) pages.push(cur.join('\n')); return pages;
  }
  async function readPDF(buf, prog) {
    await need('pdf'); pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise, pages = [], N = Math.min(pdf.numPages, 1500); let title = '';
    try { const m = await pdf.getMetadata(); title = (m.info && m.info.Title) || ''; } catch (e) {}
    for (let i = 1; i <= N; i++) {
      const pg = await pdf.getPage(i), tc = await pg.getTextContent(), rows = [];
      tc.items.forEach(it => { if (!it.str) return; const y = Math.round(it.transform[5]), h = Math.abs(it.transform[3]) || 10; let r = rows.find(r => Math.abs(r.y - y) < h * .5); if (!r) rows.push(r = { y, h, it: [] }); r.it.push(it); });
      rows.sort((a, b) => b.y - a.y); const lines = rows.map(r => ({ y: r.y, h: r.h, t: r.it.sort((a, b) => a.transform[4] - b.transform[4]).map(x => x.str).join(' ').replace(/\s+/g, ' ').trim() })).filter(l => l.t);
      const hs = lines.map(l => l.h).sort((a, b) => a - b), mh = hs[Math.floor(hs.length / 2)] || 10; let out = '', prev = null;
      lines.forEach(l => { if (prev) { const gap = prev.y - l.y; if (gap > mh * 1.9) out += '\n'; else if (/-$/.test(prev.t)) out = out.replace(/-$/, ''); else out += ' '; } out += l.t; prev = l; });
      pages.push(out.replace(/ +\n/g, '\n').trim()); prog && prog(i, N);
    }
    return { title, pages, scanned: pages.every(p => p.length < 20) };
  }
  async function readDOCX(buf) { await need('docx'); const r = await mammoth.extractRawText({ arrayBuffer: buf }); return { title: '', pages: paginate(r.value) }; }
  const htmlText = html => { const d = new DOMParser().parseFromString(html, 'text/html'); d.querySelectorAll('script,style,nav').forEach(e => e.remove()); const out = []; d.body.querySelectorAll('h1,h2,h3,h4,p,li,blockquote,div').forEach(e => { if (e.querySelector('p,li,div,h1,h2,h3,blockquote')) return; const t = e.textContent.replace(/\s+/g, ' ').trim(); if (t) out.push(t); }); return out.length ? out.join('\n') : d.body.textContent; };
  async function readEPUB(buf) {
    await need('zip'); const z = await JSZip.loadAsync(buf), rd = async p => { const f = z.file(p); return f ? f.async('string') : ''; };
    const cont = await rd('META-INF/container.xml'), m = /full-path="([^"]+)"/.exec(cont); if (!m) throw new Error('EPUB không hợp lệ.');
    const opfPath = m[1], dir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '', opf = new DOMParser().parseFromString(await rd(opfPath), 'application/xml');
    const man = {}; opf.querySelectorAll('manifest > item').forEach(i => { man[i.getAttribute('id')] = i.getAttribute('href'); });
    const title = (opf.querySelector('metadata > *|title, title') || {}).textContent || '', texts = [];
    for (const ir of opf.querySelectorAll('spine > itemref')) { const href = man[ir.getAttribute('idref')]; if (!href) continue; const path = (dir + decodeURIComponent(href)).replace(/[^/]+\/\.\.\//g, ''); texts.push(htmlText(await rd(path))); }
    return { title: title.trim(), pages: paginate(texts.join('\n\n')) };
  }
  async function parseFile(f, prog) {
    const name = f.name || 'Sách', ext = (name.split('.').pop() || '').toLowerCase(), base = name.replace(/\.[^.]+$/, '');
    if (f.size > 60e6) throw new Error('Tệp quá lớn (tối đa 60 MB).'); let r;
    if (ext === 'pdf') r = await readPDF(await f.arrayBuffer(), prog);
    else if (ext === 'docx') r = await readDOCX(await f.arrayBuffer());
    else if (ext === 'epub') r = await readEPUB(await f.arrayBuffer());
    else if (['txt', 'md', 'text'].includes(ext)) r = { pages: paginate(await f.text()) };
    else if (['html', 'htm', 'xhtml'].includes(ext)) r = { pages: paginate(htmlText(await f.text())) };
    else if (ext === 'doc') throw new Error('Định dạng .doc cũ chưa hỗ trợ – hãy lưu lại thành .docx hoặc PDF.');
    else throw new Error('Chưa hỗ trợ định dạng .' + ext + ' (dùng PDF, DOCX, EPUB, TXT, HTML).');
    if (r.scanned) throw new Error('PDF này là ảnh quét, không có chữ để đọc (cần OCR).');
    r.pages = r.pages.filter(Boolean); if (!r.pages.length) throw new Error('Không tìm thấy chữ trong tệp.');
    return { id: 'b' + Date.now().toString(36), title: (r.title || base).slice(0, 120), pages: r.pages, pos: { p: 0, s: 0 }, added: Date.now(), type: ext };
  }
  const SAMPLE = `Truyện Kiều (trích)\nTrăm năm trong cõi người ta, chữ tài chữ mệnh khéo là ghét nhau. Trải qua một cuộc bể dâu, những điều trông thấy mà đau đớn lòng.\nLạ gì bỉ sắc tư phong, trời xanh quen thói má hồng đánh ghen.\nKhông gì bằng lúc ta ngồi lại, nhẩm đọc từng câu thơ cũ, để thấy chữ nghĩa ông cha ta dạy vẫn còn nguyên vẹn đến hôm nay.\n\nĐây là bản dùng thử của ứng dụng sách nói. Khi bạn lật sang trang tiếp theo, hệ thống sẽ tự động đọc trang đó. Bạn có thể đổi giọng đọc, tốc độ đọc và cỡ chữ ở thanh điều khiển phía dưới.\nHãy tải lên tệp PDF, Word hoặc EPUB của bạn để nghe cả cuốn sách. Mỗi câu đang đọc sẽ được tô sáng để bạn dễ theo dõi.\n\nBạn cũng có thể chạm vào một câu bất kì để bắt đầu nghe từ chính câu đó. Chúc bạn có những giờ phút nghe sách thật thư giãn.`;
  const splitSentences = para => { const out = []; String(para).split(/(?<=[.!?…;:])\s+/).forEach(s => { s = s.trim(); if (!s) return; while (s.length > 220) { let k = s.lastIndexOf(',', 200); if (k < 60) k = s.lastIndexOf(' ', 200); if (k < 40) k = 200; out.push(s.slice(0, k + 1).trim()); s = s.slice(k + 1).trim(); } if (s) out.push(s); }); return out; };

  GV.register({
    id: 'audiobook', type: 'tool', cat: 'Học tập', name: 'Sách nói – nghe ebook', icon: '🎧', desc: 'Tải lên PDF, Word, EPUB hoặc TXT rồi nghe: lật sang trang nào, hệ thống tự động đọc trang đó. Tô sáng câu đang đọc, đổi giọng, tốc độ, lưu vị trí.',
    mount(el) {
      const st = Object.assign({ rate: 1, voice: '', size: 19, theme: 'cream', auto: true, vnUrl: '', vnVoice: '' }, GV.store.get('audiobook', {}));
      let lib = [], bk = null, pg = 0, si = 0, sents = [], playing = false, tok = 0, dead = false, voices = [], wl = null;
      const saveSt = () => GV.store.set('audiobook', st);
      el.innerHTML = `<style>.ak{width:100%;max-width:760px;font-family:inherit}body.ingame .ak{flex:1;min-height:0;display:flex;flex-direction:column}body.ingame .ak .rd{flex:1;min-height:0;height:auto}body.ingame .ak .home{overflow:auto}.ak .drop{border:2px dashed var(--line);border-radius:18px;padding:22px;text-align:center;cursor:pointer;background:var(--md-sc-low,#211f23)}.ak .drop.on{border-color:var(--md-primary,#D0BCFF)}.ak .bkl{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;background:var(--md-sc-high,#2b292d);margin:6px 0;cursor:pointer;text-align:left}.ak .bkl .pr{height:4px;border-radius:3px;background:var(--line);margin-top:5px;overflow:hidden}.ak .bkl .pr i{display:block;height:100%;background:var(--ok)}.ak .rd{display:flex;flex-direction:column;border-radius:18px;overflow:hidden;height:min(80vh,760px);position:relative}.ak .rd.cream{background:#f6efdd;color:#2b2823}.ak .rd.white{background:#fff;color:#222}.ak .rd.dark{background:#17181a;color:#d9d6cf}.ak .hd{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;font-size:13px;opacity:.75;gap:8px}.ak .hd b{flex:1;text-align:center;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ak .hd button,.ak .ctl button,.ak .ctl select{background:none;border:0;color:inherit;font:inherit;cursor:pointer}.ak .tx{position:relative;flex:1;min-height:0;overflow-y:auto;padding:6px 20px 24px;font-family:Georgia,"Noto Serif","Times New Roman",serif;line-height:1.75;text-align:justify;hyphens:auto;-webkit-overflow-scrolling:touch}.ak .tx p{margin:0 0 .9em}.ak .s{border-radius:4px;cursor:pointer;transition:background .2s}.ak .cream .s.cur{background:#f3dcab}.ak .white .s.cur{background:#ffe9a8}.ak .dark .s.cur{background:#4a3f1f}.ak .ctl{display:flex;align-items:center;gap:6px;padding:10px 12px;border-top:1px solid #0001;background:inherit}.ak .ctl .vc{flex:1;min-width:0;text-align:left;line-height:1.2}.ak .ctl .vc small{display:block;opacity:.6;font-size:11px}.ak .ctl select{max-width:100%;padding:0;font-weight:700;font-size:14px;appearance:none;-webkit-appearance:none;text-overflow:ellipsis}.ak .ctl .ib{width:42px;height:42px;border-radius:50%;font-size:18px;display:grid;place-items:center}.ak .ctl .pl{width:58px;height:58px;border-radius:50%;background:#b5761d;color:#fff;font-size:22px;box-shadow:0 3px 8px #0003}.ak .pgn{display:flex;align-items:center;gap:8px;padding:0 14px 6px;font-size:12px;opacity:.75}.ak .pgn input{flex:1}.ak .set{display:flex;gap:6px;flex-wrap:wrap;padding:6px 12px;font-size:13px;justify-content:center;border-top:1px solid #0001}.ak .set button{border:1px solid #0003;border-radius:12px;padding:3px 10px;background:none;color:inherit;cursor:pointer}.ak .set button.on{background:#b5761d;color:#fff;border-color:#b5761d}.ak .pgwrap{animation:pgin .25s ease}@keyframes pgin{from{opacity:.2;transform:translateX(14px)}to{opacity:1;transform:none}}.ak .msg4{min-height:1.3em;font-size:13px}.ak .bar{height:6px;border-radius:4px;background:var(--line);overflow:hidden;margin:8px 0}.ak .bar i{display:block;height:100%;background:var(--ok);width:0}</style>
<div class="ak tool"><div class="home"></div><div class="rd cream" hidden></div></div>`;
      const home = $(el, '.home'), rd = $(el, '.rd'), msg = t => { const m = $(el, '.msg4'); if (m) m.textContent = t || ''; };
      /* ---------- trang chủ / thư viện ---------- */
      function renderHome() {
        rd.hidden = true; home.hidden = false;
        home.innerHTML = `<div class="drop"><div style="font-size:2.2rem">📚</div><b>Chọn tệp ebook để nghe</b><div class="hint">PDF · Word (.docx) · EPUB · TXT · HTML — kéo thả hoặc bấm để chọn</div><input type="file" class="fi" accept=".pdf,.docx,.epub,.txt,.md,.html,.htm" hidden></div><div class="bar" hidden><i></i></div><div class="msg4 hint"></div>
        <div class="tl" style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0"><button class="btn ghost demo">▶ Dùng thử văn bản mẫu</button><button class="btn ghost paste">📋 Dán văn bản</button></div>
        <h3 style="text-align:left;margin:10px 0 4px">Thư viện của bạn</h3><div class="lb">${lib.length ? '' : '<p class="hint">Chưa có sách nào. Sách được lưu trên máy bạn, không tải lên máy chủ.</p>'}</div>`;
        const lb = $(home, '.lb'); lib.sort((a, b) => b.added - a.added).forEach(b => { const d = document.createElement('div'); d.className = 'bkl'; d.dataset.id = b.id; d.innerHTML = `<span style="font-size:1.6rem">📖</span><div style="flex:1;min-width:0"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(b.title)}</b><small class="hint">${b.pages.length} trang · đang ở trang ${b.pos.p + 1}</small><div class="pr"><i style="width:${(b.pos.p + 1) / b.pages.length * 100}%"></i></div></div><button class="btn ghost del" title="Xoá" style="height:32px;padding:0 10px">🗑</button>`; lb.appendChild(d); });
      }
      async function addFile(f) {
        const bar = $(home, '.bar'), bi = $(bar, 'i'); msg('⏳ Đang đọc tệp…'); bar.hidden = false; bi.style.width = '3%';
        try { const b = await parseFile(f, (i, n) => { bi.style.width = i / n * 100 + '%'; }); lib.unshift(b); if (lib.length > 20) { const x = lib.pop(); idb.del(x.id).catch(() => {}); } await idb.put(b).catch(() => msg('Không lưu được vào thư viện (bộ nhớ trình duyệt bị chặn), vẫn đọc được lần này.')); openBook(b); }
        catch (e) { bar.hidden = true; msg('⚠️ ' + (e.message || e)); }
      }
      home.addEventListener('click', e => {
        const t = e.target;
        if (t.closest('.drop')) { $(home, '.fi').click(); return; }
        if (t.closest('.demo')) { openBook({ id: 'demo', title: 'Văn bản mẫu', pages: paginate(SAMPLE), pos: { p: 0, s: 0 }, added: Date.now(), type: 'txt', demo: true }); return; }
        if (t.closest('.paste')) { const x = window.prompt('Dán văn bản cần nghe:'); if (x && x.trim()) { const b = { id: 'b' + Date.now().toString(36), title: x.trim().slice(0, 40), pages: paginate(x), pos: { p: 0, s: 0 }, added: Date.now(), type: 'txt' }; lib.unshift(b); idb.put(b).catch(() => {}); openBook(b); } return; }
        const del = t.closest('.del'), row = t.closest('.bkl'); if (!row) return; const b = lib.find(k => k.id === row.dataset.id);
        if (del) { if (confirm('Xoá "' + b.title + '" khỏi thư viện?')) { lib = lib.filter(k => k !== b); idb.del(b.id).catch(() => {}); renderHome(); } return; }
        openBook(b);
      });
      home.addEventListener('change', e => { if (e.target.classList.contains('fi') && e.target.files[0]) addFile(e.target.files[0]); });
      ['dragover', 'drop'].forEach(ev => home.addEventListener(ev, e => { if (!e.target.closest('.drop')) return; e.preventDefault(); if (ev === 'drop' && e.dataTransfer.files[0]) addFile(e.dataTransfer.files[0]); }));

      /* ---------- trình đọc ---------- */
      const tts = () => window.speechSynthesis;
      function loadVoices() { try { voices = tts() ? tts().getVoices() : []; } catch (e) { voices = []; } const sel = $(rd, '.vs'); if (!sel) return; const vn = '<optgroup label="AI"><option value="vieneu">VieNeu AI (giọng Việt tự nhiên)</option></optgroup>'; const vi = voices.filter(v => /^vi/i.test(v.lang)), rest = voices.filter(v => !/^vi/i.test(v.lang)); sel.innerHTML = vn + (vi.length ? '<optgroup label="Tiếng Việt">' + vi.map(v => `<option value="${esc(v.voiceURI)}">${esc(v.name)}</option>`).join('') + '</optgroup>' : '') + (rest.length ? '<optgroup label="Giọng khác">' + rest.map(v => `<option value="${esc(v.voiceURI)}">${esc(v.name)} (${esc(v.lang)})</option>`).join('') + '</optgroup>' : '<option value="">Giọng mặc định</option>'); if (st.voice === 'vieneu' || (st.voice && voices.some(v => v.voiceURI === st.voice))) sel.value = st.voice; else if (vi[0]) { sel.value = vi[0].voiceURI; st.voice = vi[0].voiceURI; } }
      function openBook(b) {
        bk = b; pg = Math.min(b.pos.p, b.pages.length - 1); si = b.pos.s || 0; home.hidden = true; rd.hidden = false; stop();
        rd.className = 'rd ' + st.theme;
        rd.innerHTML = `<div class="hd"><button class="rbk" title="Thư viện">‹ Thư viện</button><b class="tt"></b><button class="thm" title="Đổi nền">🌓</button></div><div class="tx"></div><div class="pgn"><span class="pn"></span><input type="range" class="sl" min="1" value="1"></div><div class="set"><button data-a="-">A−</button><button data-a="+">A+</button><button class="aut ${st.auto ? 'on' : ''}">⤵ Tự đọc khi lật trang</button><button class="zz">⏲ Hẹn giờ</button><button class="vnb">⚙ VieNeu</button></div><div class="ctl"><button class="ib x" title="Đóng">✕</button><div class="vc"><small>Đang nghe</small><select class="vs"></select></div><button class="ib spd" title="Tốc độ">1×</button><button class="ib pv" title="Trang trước">⏮</button><button class="ib pl" title="Phát">▶</button><button class="ib nx" title="Trang sau">⏭</button></div>`;
        $(rd, '.sl').max = b.pages.length; loadVoices(); $(rd, '.spd').textContent = st.rate + '×'; renderPage(); mediaSession();
      }
      function renderPage(keepSi) {
        const tx = $(rd, '.tx'), paras = bk.pages[pg].split('\n'); sents = []; let h = '';
        paras.forEach(p => { h += '<p>'; splitSentences(p).forEach(s => { h += `<span class="s" data-i="${sents.length}">${esc(s)} </span>`; sents.push(s); }); h += '</p>'; });
        tx.innerHTML = `<div class="pgwrap" style="font-size:${st.size}px">${h}</div>`; tx.scrollTop = 0; if (!keepSi) si = 0; si = Math.min(si, Math.max(0, sents.length - 1));
        $(rd, '.tt').textContent = bk.title; $(rd, '.pn').textContent = `Trang ${pg + 1}/${bk.pages.length}`; $(rd, '.sl').value = pg + 1; mark(false); savePos();
      }
      function mark(scroll) { rd.querySelectorAll('.s.cur').forEach(x => x.classList.remove('cur')); const s = $(rd, `.s[data-i="${si}"]`); if (s && playing) { s.classList.add('cur'); if (scroll !== false) { const tx = $(rd, '.tx'); tx.scrollTo({ top: Math.max(0, s.offsetTop - tx.clientHeight / 3), behavior: 'smooth' }); } } }
      const savePos = () => { if (!bk || bk.demo) return; bk.pos = { p: pg, s: si }; idb.put(bk).catch(() => {}); };
      function pickVoice() { return voices.find(v => v.voiceURI === st.voice) || voices.find(v => /^vi/i.test(v.lang)) || null; }
      /* ---------- VieNeu AI (máy chủ do người dùng tự chạy, xem tools/vieneu-server) ---------- */
      let au = null, pre = {};
      const vnOn = () => st.voice === 'vieneu' && st.vnUrl;
      function vnFetch(text) {
        const k = st.vnVoice + '|' + text; if (pre[k]) return pre[k];
        const base = st.vnUrl.replace(/\/+$/, '');
        const p = fetch(base + '/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice: st.vnVoice || undefined }) }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); }).then(b => URL.createObjectURL(b));
        pre[k] = p; p.catch(() => { delete pre[k]; }); return p;
      }
      function vnClear() { if (au) { try { au.pause(); } catch (e) {} au = null; } Object.keys(pre).forEach(k => { pre[k].then(u => URL.revokeObjectURL(u)).catch(() => {}); delete pre[k]; }); }
      function speakVn(i, my) {
        msg('⏳ VieNeu đang tạo giọng…');
        vnFetch(sents[i]).then(url => {
          if (tok !== my || !playing) return; msg('');
          if (sents[i + 1]) vnFetch(sents[i + 1]).catch(() => {});
          const a = au = new Audio(url); a.playbackRate = st.rate; a.preservesPitch = true;
          a.onended = () => { delete pre[st.vnVoice + '|' + sents[i]]; URL.revokeObjectURL(url); if (tok === my && playing) speak(i + 1); };
          a.onerror = () => { if (tok === my && playing) speak(i + 1); };
          const pr = a.play(); if (pr && pr.catch) pr.catch(() => { if (tok === my) { playing = false; ui(); msg('Trình duyệt chặn tự phát, hãy bấm ▶.'); } });
        }).catch(e => { if (tok !== my) return; playing = false; ui(); msg('⚠️ Không gọi được máy chủ VieNeu (' + (e.message || e) + '). Kiểm tra địa chỉ ở nút ⚙ VieNeu hoặc chọn giọng khác.'); });
      }
      function speak(i) {
        const my = ++tok;
        if (i >= sents.length) { if (pg < bk.pages.length - 1) { pg++; si = 0; renderPage(); setTimeout(() => { if (tok === my && playing) speak(0); }, 200); } else { playing = false; ui(); } return; }
        if (st.voice === 'vieneu' && !st.vnUrl) { playing = false; ui(); msg('Chưa nhập địa chỉ máy chủ VieNeu – bấm nút ⚙ VieNeu.'); return; }
        if (vnOn()) { si = i; mark(); savePos(); speakVn(i, my); return; }
        if (!tts()) { msg('Trình duyệt này chưa hỗ trợ đọc thành tiếng.'); return; }
        si = i; mark(); const u = new SpeechSynthesisUtterance(sents[i]), v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'vi-VN'; u.rate = st.rate;
        u.onend = () => { if (tok === my && playing) speak(i + 1); }; u.onerror = ev => { if (tok === my && playing && ev.error !== 'canceled' && ev.error !== 'interrupted') speak(i + 1); };
        try { tts().cancel(); tts().speak(u); } catch (e) {} savePos();
      }
      function play(from) { if (!bk) return; playing = true; ui(); wake(); speak(from == null ? si : from); }
      function stop() { playing = false; tok++; try { tts() && tts().cancel(); } catch (e) {} if (au) { try { au.pause(); } catch (e) {} au = null; } ui(); release(); }
      function ui() { const b = $(rd, '.pl'); if (b) b.textContent = playing ? '⏸' : '▶'; mark(false); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'; }
      function go(n, flipped) { if (!bk) return; n = Math.max(0, Math.min(bk.pages.length - 1, n)); if (n === pg && flipped) return; const was = playing; tok++; try { tts() && tts().cancel(); } catch (e) {} if (au) { try { au.pause(); } catch (e) {} au = null; } pg = n; si = 0; renderPage(); if (was || (flipped && st.auto)) { playing = true; ui(); wake(); setTimeout(() => speak(0), 80); } else { playing = false; ui(); } }
      async function wake() { try { if (navigator.wakeLock && !wl) { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); } } catch (e) {} }
      function release() { try { wl && wl.release(); } catch (e) {} wl = null; }
      function mediaSession() { if (!('mediaSession' in navigator)) return; try { navigator.mediaSession.metadata = new MediaMetadata({ title: bk.title, artist: 'GameVui – Sách nói' }); navigator.mediaSession.setActionHandler('play', () => play()); navigator.mediaSession.setActionHandler('pause', () => stop()); navigator.mediaSession.setActionHandler('nexttrack', () => go(pg + 1, true)); navigator.mediaSession.setActionHandler('previoustrack', () => go(pg - 1, true)); } catch (e) {} }
      let sleepT = 0;
      rd.addEventListener('click', e => {
        const t = e.target, b = t.closest('button'), s = t.closest('.s');
        if (s) { si = +s.dataset.i; play(si); return; }
        if (!b) return;
        if (b.classList.contains('pl')) playing ? stop() : play();
        else if (b.classList.contains('nx')) go(pg + 1, true); else if (b.classList.contains('pv')) go(pg - 1, true);
        else if (b.classList.contains('x') || b.classList.contains("rbk")) { stop(); savePos(); renderHome(); }
        else if (b.classList.contains('spd')) { const R = [.75, 1, 1.25, 1.5, 2]; st.rate = R[(R.indexOf(st.rate) + 1) % R.length] || 1; b.textContent = st.rate + '×'; saveSt(); if (playing) play(si); }
        else if (b.dataset.a) { st.size = Math.max(14, Math.min(30, st.size + (b.dataset.a === '+' ? 2 : -2))); saveSt(); $(rd, '.pgwrap').style.fontSize = st.size + 'px'; }
        else if (b.classList.contains('aut')) { st.auto = !st.auto; b.classList.toggle('on', st.auto); saveSt(); }
        else if (b.classList.contains('thm')) { const T = ['cream', 'white', 'dark']; st.theme = T[(T.indexOf(st.theme) + 1) % 3]; rd.className = 'rd ' + st.theme; saveSt(); }
        else if (b.classList.contains('vnb')) { const u = window.prompt('Địa chỉ máy chủ VieNeu (vd http://localhost:8000). Xem hướng dẫn chạy ở tools/vieneu-server/README.md. Để trống = tắt.', st.vnUrl || 'http://localhost:8000'); if (u === null) return; const v = window.prompt('Tên giọng VieNeu (để trống = mặc định, vd Hải Đăng):', st.vnVoice || ''); st.vnUrl = u.trim(); st.vnVoice = (v || '').trim(); if (st.vnUrl) st.voice = 'vieneu'; else if (st.voice === 'vieneu') st.voice = ''; vnClear(); saveSt(); loadVoices(); if (playing) play(si); }
        else if (b.classList.contains('zz')) { const m = parseInt(window.prompt('Hẹn giờ tắt sau bao nhiêu phút? (0 = huỷ)', '30'), 10); clearTimeout(sleepT); if (m > 0) { sleepT = setTimeout(() => { stop(); }, m * 60000); b.textContent = '⏲ ' + m + ' phút'; } else b.textContent = '⏲ Hẹn giờ'; }
      });
      rd.addEventListener('change', e => { if (e.target.classList.contains('vs')) { st.voice = e.target.value; vnClear(); saveSt(); if (st.voice === 'vieneu' && !st.vnUrl) { rd.querySelector('.vnb').click(); return; } if (playing) play(si); } else if (e.target.classList.contains('sl')) go(+e.target.value - 1, true); });
      // vuốt ngang để lật trang
      let sx = 0, sy = 0; rd.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
      rd.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) go(pg + (dx < 0 ? 1 : -1), true); }, { passive: true });
      const key = e => { if (rd.hidden || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; if (e.key === 'ArrowRight') go(pg + 1, true); else if (e.key === 'ArrowLeft') go(pg - 1, true); else if (e.key === ' ') { e.preventDefault(); playing ? stop() : play(); } };
      window.addEventListener('keydown', key);
      if (tts()) tts().onvoiceschanged = loadVoices;
      idb.all().then(l => { lib = l || []; if (!bk) renderHome(); }).catch(() => { if (!bk) renderHome(); }); renderHome();
      GV.abT = { parseFile, paginate, splitSentences, get st() { return { pg, si, playing, bk }; }, go, play, stop, open: openBook, get lib() { return lib; } };
      return () => { dead = true; stop(); vnClear(); window.removeEventListener('keydown', key); clearTimeout(sleepT); if (tts()) tts().onvoiceschanged = null; };
    }
  });
})();
