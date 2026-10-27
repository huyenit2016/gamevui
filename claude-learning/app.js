// Trang học /claude-learning: học Claude Code bằng tiếng Việt từ cơ bản đến nâng cao.
// Nội dung bài học dựng sẵn từ kho "Claude How To" (MIT) – xem tools/claude-learning/build.cjs. Router theo hash: #/ · #/t/<lộ trình> · #/d/<bài>[/<mục>] · #/x/<module>[/<tệp>].
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  const T = window.CL_TRACKS || [];
  let IDX = null, SEARCH = null, EXS = null; const DOC = {};
  /* ---------- tiến độ (lưu trên máy) ---------- */
  const KEY = 'gv_claude_learning';
  let P = { done: {}, last: '', lvl: null, chk: [] };
  try { P = Object.assign(P, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const saveP = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} };
  const getJSON = u => fetch(u).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
  const getDoc = id => DOC[id] ? Promise.resolve(DOC[id]) : getJSON('content/' + id + '.json').then(d => (DOC[id] = d));
  const LV = { 1: ['Cấp 1 – Người mới', 'lv1'], 2: ['Cấp 2 – Trung cấp', 'lv2'], 3: ['Cấp 3 – Nâng cao', 'lv3'] };
  const dur = m => m >= 60 ? (m % 60 ? Math.floor(m / 60) + ' giờ ' + (m % 60) + ' phút' : m / 60 + ' giờ') : m + ' phút';
  const mod = id => IDX.modules.find(m => m.id === id), docMeta = id => mod(id) || IDX.docs.find(d => d.id === id);
  const copy = (t, btn) => { const ok = () => { if (btn) { const o = btn.textContent; btn.textContent = 'Đã chép ✓'; setTimeout(() => { btn.textContent = o; }, 1400); } }; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(ok).catch(() => { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); ok(); } catch (e) {} a.remove(); }); };

  /* ---------- khung trang ---------- */
  function shell() {
    $('#app').innerHTML = `<header class="hd"><button class="ib menu" aria-label="Mở menu">☰</button><a class="brand" href="#/"><i>🎓</i><span>Claude How To<small>Học Claude Code bằng tiếng Việt</small></span></a>
      <div class="srch"><input id="q" type="search" placeholder="Tìm bài, lệnh, tính năng… (nhấn /)" autocomplete="off" aria-label="Tìm kiếm"><div class="res" id="res"></div></div>
      <a class="ib gv" href="../" title="Về OmniHub">🎮 <span>&nbsp;OmniHub</span></a><button class="ib th" title="Đổi sáng/tối" aria-label="Đổi giao diện">🌓</button></header>
      <div class="wrap"><nav class="side" id="side" aria-label="Mục lục"></nav><main id="main" tabindex="-1"></main><aside class="toc" id="toc"></aside></div><div class="scrim"></div>`;
    $('.menu').onclick = () => document.body.classList.toggle('nav'); $('.scrim').onclick = () => document.body.classList.remove('nav');
    $('.th').onclick = () => { const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'), n = cur === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = n; try { localStorage.setItem('gv_theme', n); } catch (e) {} };
    const q = $('#q'); let tm = 0;
    q.oninput = () => { clearTimeout(tm); tm = setTimeout(() => doSearch(q.value), 160); }; q.onfocus = () => { if (q.value) doSearch(q.value); };
    document.addEventListener('click', e => { if (!e.target.closest('.srch')) $('#res').classList.remove('on'); });
    document.addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); } else if (e.key === 'Escape') { $('#res').classList.remove('on'); q.blur(); } });
  }
  function sideNav(cur) {
    const done = IDX.modules.filter(m => P.done[m.id]).length, pct = Math.round(done / IDX.modules.length * 100);
    const li = (href, ic, t, id) => `<a href="${href}" class="${cur === id ? 'on' : ''}"><span>${ic}</span>${esc(t)}${P.done[id] ? '<span class="ck">✓</span>' : ''}</a>`;
    $('#side').innerHTML = `<a href="#/" class="${cur === 'home' ? 'on' : ''}"><span>🏠</span>Trang chủ</a><div class="pg" title="${done}/${IDX.modules.length} bài"><i style="width:${pct}%"></i></div><div style="margin:4px 10px 0;font-size:12px;color:var(--mut)">Đã học ${done}/${IDX.modules.length} bài (${pct}%)</div>`
      + [1, 2, 3].map(l => `<h4>${LV[l][0]}</h4>` + IDX.modules.filter(m => m.lvl === l).map(m => li('#/d/' + m.id, m.icon, m.t, m.id)).join('')).join('')
      + '<h4>Theo mục tiêu</h4>' + T.map(t => `<a href="#/t/${t.id}" class="${cur === 't/' + t.id ? 'on' : ''}"><span>${t.icon}</span>${esc(t.t)}</a>`).join('')
      + '<h4>Tài liệu</h4>' + IDX.docs.map(d => li('#/d/' + d.id, d.icon, d.t, d.id)).join('')
      + '<button class="off" id="off">⬇ Tải bản đọc offline (.html)</button>';
    $('#off').onclick = offline; document.body.classList.remove('nav');
  }

  /* ---------- trang chủ ---------- */
  const QCHK = ['Tôi có thể mở Claude Code và trò chuyện (lệnh claude)', 'Tôi đã tạo hoặc sửa một file CLAUDE.md', 'Tôi đã dùng ít nhất 3 lệnh slash có sẵn (/help, /compact, /model…)', 'Tôi đã tạo một lệnh slash hoặc skill (SKILL.md) của riêng mình', 'Tôi đã cấu hình một MCP server (GitHub, cơ sở dữ liệu…)', 'Tôi đã thiết lập hooks trong settings.json', 'Tôi đã tạo hoặc dùng subagent tuỳ chỉnh (.claude/agents/)', 'Tôi đã dùng chế độ print (claude -p) trong script hoặc CI/CD'];
  const card = m => `<a class="card ${P.done[m.id] ? 'done' : ''}" href="#/d/${m.id}"><span class="lv ${LV[m.lvl][1]}">${LV[m.lvl][0]}</span><div class="ic">${m.icon}</div><b>${esc(m.t)}</b><p>${esc(m.desc)}</p><div class="mt"><span>⏱ ${dur(m.min)}</span><span>📄 ${m.ex} file mẫu</span></div></a>`;
  function home() {
    const next = IDX.modules.find(m => !P.done[m.id]), last = P.last && docMeta(P.last);
    const lvl = P.lvl; const rec = lvl === 3 ? '09-advanced-features' : lvl === 2 ? '03-skills' : lvl === 1 ? '01-slash-commands' : null;
    $('#main').innerHTML = `<section class="hero"><h1>Học Claude Code từ cơ bản đến nâng cao</h1><p>10 bài bằng tiếng Việt: lệnh slash, bộ nhớ, skills, hooks, MCP, subagents, plugins… kèm sơ đồ minh hoạ, mẫu copy-paste và lộ trình riêng cho người học AI, làm ứng dụng mobile, website hoặc kiến trúc giải pháp (SA). Xem offline được.</p>
      <div class="row"><a class="btn" href="#/d/${last ? P.last : (next || IDX.modules[0]).id}">${last ? '▶ Học tiếp: ' + esc(last.t) : '▶ Bắt đầu bài đầu tiên'}</a><a class="btn g" href="#/d/roadmap">🗺️ Xem lộ trình</a><a class="btn g" href="#/d/quick">📋 Tham khảo nhanh</a></div></section>
      <h2 class="sec">Tự đánh giá trình độ</h2><p class="sub">Đánh dấu những gì bạn đã làm được để biết nên bắt đầu từ đâu.</p>
      <div class="quiz">${QCHK.map((t, i) => `<label><input type="checkbox" data-i="${i}" ${P.chk[i] ? 'checked' : ''}><span>${esc(t)}</span></label>`).join('')}<div class="qres" id="qres" ${lvl ? '' : 'hidden'}></div></div>
      <h2 class="sec">Lộ trình theo cấp độ</h2><p class="sub">Học theo thứ tự các bài, mỗi cấp xây trên cấp trước. Tổng khoảng 11–13 giờ.</p>
      ${[1, 2, 3].map(l => `<h3 style="margin:22px 0 10px"><span class="lv ${LV[l][1]}">${LV[l][0]}</span></h3><div class="grid">${IDX.modules.filter(m => m.lvl === l).map(card).join('')}</div>`).join('')}
      <h2 class="sec">Học theo mục tiêu của bạn</h2><p class="sub">Chọn lộ trình phù hợp với việc bạn đang làm, kèm bài tập thực hành có sẵn lời nhắc (prompt).</p>
      <div class="grid">${T.map(t => `<a class="card" href="#/t/${t.id}"><div class="ic">${t.icon}</div><b>${esc(t.t)}</b><p>${esc(t.short)}</p><div class="mt"><span>${t.steps.length} bước</span><span>${t.projects.length} bài thực hành</span></div></a>`).join('')}</div>
      <h2 class="sec">Tài liệu tra cứu</h2><div class="grid">${IDX.docs.map(d => `<a class="card" href="#/d/${d.id}"><div class="ic">${d.icon}</div><b>${esc(d.t)}</b><p>${d.id === 'quick' ? 'Bảng tra lệnh, phím tắt và mẹo dùng nhanh.' : d.id === 'catalog' ? 'Toàn bộ tính năng kèm cách cài đặt và ví dụ.' : 'Lộ trình chi tiết theo từng cột mốc, kèm sơ đồ.'}</p></a>`).join('')}<a class="card" href="#/" id="offc"><div class="ic">⬇</div><b>Tải bản đọc offline</b><p>Một file .html gồm toàn bộ bài học và sơ đồ, đọc không cần mạng.</p></a></div>
      ${footer()}`;
    const showQ = () => { const n = P.chk.filter(Boolean).length, l = n >= 6 ? 3 : n >= 3 ? 2 : 1; P.lvl = l; saveP(); const r = $('#qres'); r.hidden = false; const m = mod(l === 3 ? '09-advanced-features' : l === 2 ? '03-skills' : '01-slash-commands'); r.innerHTML = `Bạn đã tick <b>${n}/8</b> → <span class="lv ${LV[l][1]}">${LV[l][0]}</span>. Gợi ý bắt đầu từ bài <a href="#/d/${m.id}"><b>${m.icon} ${esc(m.t)}</b></a>. Chưa chắc thì cứ lùi một cấp cho chắc.`; };
    $$('.quiz input').forEach(c => c.onchange = () => { P.chk[+c.dataset.i] = c.checked; showQ(); }); if (lvl) showQ();
    $('#offc').onclick = e => { e.preventDefault(); offline(); };
  }
  function footer() {
    return `<div class="foot"><b>Nguồn & giấy phép.</b> Nội dung bài học là bản dịch tiếng Việt của dự án mã nguồn mở <i>Claude How To</i> (tác giả luongnv89), phát hành theo giấy phép MIT. Trang này là sản phẩm độc lập, không phải tài liệu chính thức của Anthropic; tính năng Claude Code thay đổi thường xuyên nên hãy đối chiếu tài liệu chính thức khi cần.
      <details><summary>Thông báo bản quyền MIT</summary><pre>MIT License\n\nCopyright (c) 2024 luongnv89\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</pre></details></div>`;
  }

  /* ---------- lộ trình theo mục tiêu ---------- */
  function track(id) {
    const t = T.find(x => x.id === id); if (!t) return home();
    $('#main').innerHTML = `<div class="doc"><div class="crumb"><a href="#/">Trang chủ</a> › Theo mục tiêu</div><h1 class="t">${t.icon} ${esc(t.t)}</h1><p class="sub" style="max-width:70ch">${esc(t.intro)}</p>
      <h2 class="sec">Học theo thứ tự này</h2><div class="steps">${t.steps.map(([mid, why]) => { const m = mod(mid); return `<a class="step ${P.done[mid] ? 'done' : ''}" href="#/d/${mid}"><span class="n">${P.done[mid] ? '✓' : ''}</span><div><b>${m.icon} ${esc(m.t)} <small style="font-weight:400;color:var(--mut)">· ${dur(m.min)}</small></b><span>${esc(why)}</span></div></a>`; }).join('')}</div>
      <h2 class="sec">Bài thực hành</h2><p class="sub">Dán lời nhắc vào Claude Code trong thư mục dự án của bạn. Sửa phần trong &lt;…&gt; cho đúng với bạn.</p>
      ${t.projects.map(([n, p]) => `<div class="pr"><b>🛠️ ${esc(n)}</b><pre>${esc(p)}</pre><button class="cp" data-c="${esc(p)}">Chép</button></div>`).join('')}
      <div class="note">Mẹo: bắt đầu bằng planning mode (Shift+Tab) để Claude đề xuất kế hoạch rồi mới sửa mã; dùng /compact khi cuộc trò chuyện dài.</div>${footer()}</div>`;
    $$('.pr .cp').forEach(b => b.onclick = () => copy(b.dataset.c, b));
  }

  /* ---------- bài học ---------- */
  function wrapDoc(root) {
    $$('table', root).forEach(t => { const w = document.createElement('div'); w.className = 'tw'; t.replaceWith(w); w.appendChild(t); });
    $$('pre', root).forEach(p => { const b = document.createElement('button'); b.className = 'cp'; b.textContent = 'Chép'; b.onclick = () => copy(p.querySelector('code') ? p.querySelector('code').textContent : p.textContent, b); p.appendChild(b); });
    $$('a[href^="http"]', root).forEach(a => { a.target = '_blank'; a.rel = 'noopener noreferrer'; });
  }
  let spy = null;
  async function doc(id, anchor) {
    const meta = docMeta(id); if (!meta) return home();
    $('#main').innerHTML = '<p class="sub">Đang tải bài…</p>'; let d;
    try { d = await getDoc(id); } catch (e) { $('#main').innerHTML = '<div class="note">Không tải được bài này (kiểm tra mạng rồi thử lại).</div>'; return; }
    P.last = id; saveP(); const isMod = !!mod(id), order = IDX.modules, i = order.findIndex(m => m.id === id);
    document.title = (meta.t || d.title) + ' – Claude How To';
    $('#main').innerHTML = `<div class="doc"><div class="crumb"><a href="#/">Trang chủ</a> › ${isMod ? LV[meta.lvl][0] : 'Tài liệu'}</div><h1 class="t">${meta.icon} ${esc(meta.t)}</h1>
      <div class="meta">${isMod ? `<span class="lv ${LV[meta.lvl][1]}">${LV[meta.lvl][0]}</span><span>⏱ ${dur(meta.min)}</span>` : ''}<span>📖 ~${Math.max(1, Math.round(d.words / 170))} phút đọc</span>${isMod ? `<button class="btn ${P.done[id] ? 'ok' : 'g'}" id="dn" style="padding:6px 14px">${P.done[id] ? '✓ Đã hoàn thành' : 'Đánh dấu hoàn thành'}</button>` : ''}</div>
      ${isMod && meta.ex ? `<div class="tabs"><a class="on" href="#/d/${id}">Bài học</a><a href="#/x/${id}">Mẫu copy-paste (${meta.ex})</a></div>` : ''}
      <article class="md" id="md">${d.html}</article>
      ${isMod ? `<div class="pn">${i > 0 ? `<a href="#/d/${order[i - 1].id}"><small>← Bài trước</small>${order[i - 1].icon} ${esc(order[i - 1].t)}</a>` : '<span></span>'}${i < order.length - 1 ? `<a class="nx" href="#/d/${order[i + 1].id}"><small>Bài tiếp →</small>${order[i + 1].icon} ${esc(order[i + 1].t)}</a>` : '<a class="nx" href="#/"><small>Hoàn thành!</small>Về trang chủ 🎉</a>'}</div>` : ''}${footer()}</div>`;
    wrapDoc($('#md'));
    const dn = $('#dn'); if (dn) dn.onclick = () => { P.done[id] = !P.done[id]; saveP(); doc(id); sideNav(id); };
    $('#toc').innerHTML = d.toc.length ? '<h4>Trong bài này</h4>' + d.toc.filter(x => x.l <= 3).map(x => `<a class="l${x.l}" href="#/d/${id}/${encodeURIComponent(x.id.slice(2))}" data-h="${esc(x.id)}">${esc(x.t)}</a>`).join('') : '';
    if (spy) spy.disconnect(); spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { $$('#toc a').forEach(a => a.classList.toggle('on', a.dataset.h === e.target.id)); } }), { rootMargin: '-70px 0px -75% 0px' }); $$('#md h2,#md h3').forEach(h => spy.observe(h));
    sideNav(id);
    const target = anchor && document.getElementById('h-' + decodeURIComponent(anchor)); if (target) target.scrollIntoView({ behavior: 'instant' }); else window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /* ---------- file mẫu ---------- */
  async function examples(modId, file) {
    const m = mod(modId); if (!m) return home(); if (!EXS) EXS = await getJSON('content/examples.json'); const list = EXS[modId] || [];
    const crumb = `<div class="crumb"><a href="#/">Trang chủ</a> › <a href="#/d/${modId}">${esc(m.t)}</a> › Mẫu copy-paste</div>`;
    if (!file) {
      $('#main').innerHTML = `<div class="doc">${crumb}<h1 class="t">${m.icon} Mẫu: ${esc(m.t)}</h1><div class="tabs"><a href="#/d/${modId}">Bài học</a><a class="on" href="#/x/${modId}">Mẫu copy-paste (${list.length})</a></div><p class="sub">Các file mẫu có thể chép vào dự án của bạn (thư mục .claude/…) rồi chỉnh theo nhu cầu.</p><div class="exl">${list.map(e => `<a href="#/x/${modId}/${encodeURIComponent(e.p)}">📄 ${esc(e.p)}<em>${(e.t.length / 1024).toFixed(1)} KB</em></a>`).join('') || '<div class="note">Module này chưa có file mẫu.</div>'}</div>${footer()}</div>`;
      $('#toc').innerHTML = ''; sideNav(modId); window.scrollTo(0, 0); return;
    }
    const e = list.find(x => x.p === file); if (!e) return examples(modId);
    $('#main').innerHTML = `<div class="doc">${crumb}<h1 class="t" style="font:700 1.3rem ui-monospace,Menlo,Consolas,monospace;word-break:break-all">📄 ${esc(e.p)}</h1><div class="meta"><span>${esc(e.l)}</span><button class="btn g" id="cpx" style="padding:6px 14px">Chép toàn bộ</button><button class="btn g" id="dlx" style="padding:6px 14px">⬇ Tải về</button></div><div class="md"><pre><code id="cx"></code></pre></div>${footer()}</div>`;
    $('#cx').textContent = e.t; $('#cpx').onclick = ev => copy(e.t, ev.target);
    $('#dlx').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([e.t], { type: 'text/plain;charset=utf-8' })); a.download = e.p.split('/').pop(); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); };
    $('#toc').innerHTML = ''; sideNav(modId); window.scrollTo(0, 0);
  }

  /* ---------- tìm kiếm ---------- */
  async function doSearch(q) {
    const box = $('#res'); q = norm(q.trim()); if (q.length < 2) { box.classList.remove('on'); return; }
    if (!SEARCH) { try { SEARCH = (await getJSON('content/search.json')).map(r => ({ d: r[0], a: r[1], h: r[2], t: r[3], nh: norm(r[2]), nt: norm(r[3]) })); } catch (e) { return; } }
    const terms = q.split(/\s+/).filter(Boolean);
    const hits = SEARCH.map(s => { let sc = 0; for (const w of terms) { if (s.nh.includes(w)) sc += 6; if (s.nt.includes(w)) sc += 1; else if (!s.nh.includes(w)) return null; } return [sc, s]; }).filter(Boolean).sort((a, b) => b[0] - a[0]).slice(0, 12);
    const hl = (t, ) => { let o = esc(t); terms.forEach(w => { try { o = o.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'i'), '<mark>$1</mark>'); } catch (e) {} }); return o; };
    box.innerHTML = hits.length ? hits.map(([, s]) => { const m = docMeta(s.d), i = Math.max(0, s.nt.indexOf(terms[0])), snip = s.t.slice(Math.max(0, i - 40), i + 110); return `<a href="#/d/${s.d}${s.a ? '/' + encodeURIComponent(s.a.slice(2)) : ''}"><b>${hl(s.h)}</b><small>${m ? m.icon + ' ' + esc(m.t) : ''} — …${hl(snip)}…</small></a>`; }).join('') : '<a><b>Không tìm thấy</b><small>Thử từ khoá khác, ví dụ: hooks, mcp, CLAUDE.md</small></a>';
    box.classList.add('on'); $$('a', box).forEach(a => a.onclick = () => box.classList.remove('on'));
  }

  /* ---------- bản đọc offline: một file .html gồm tất cả bài + sơ đồ ---------- */
  async function offline() {
    const btn = $('#off'); if (btn) btn.textContent = '⏳ Đang tạo file…';
    try {
      const ids = [...IDX.modules.map(m => m.id), ...IDX.docs.map(d => d.id)], docs = await Promise.all(ids.map(getDoc)); if (!EXS) EXS = await getJSON('content/examples.json');
      const css = await fetch('style.css').then(r => r.text()), imgs = {};
      const imgNames = new Set(); docs.forEach(d => (d.html.match(/src="img\/[\w.-]+"/g) || []).forEach(s => imgNames.add(s.slice(5, -1))));
      for (const n of imgNames) { const b = await fetch(n).then(r => r.blob()); imgs[n] = await new Promise(ok => { const f = new FileReader(); f.onload = () => ok(f.result); f.readAsDataURL(b); }); }
      const fix = h => h.replace(/href="#\/d\/([^"/]+)(?:\/[^"]*)?"/g, 'href="#sec-$1"').replace(/href="#\/x\/([^"/]+)\/[^"]*"/g, 'href="#ex-$1"').replace(/src="(img\/[\w.-]+)"/g, (m, n) => `src="${imgs[n] || n}"`);
      const nameOf = id => { const m = docMeta(id); return m.icon + ' ' + m.t; };
      const body = `<h1>🎓 Claude How To – Học Claude Code (bản offline)</h1><p>Tạo ngày ${new Date().toLocaleDateString('vi-VN')} từ trang học OmniHub. Không phải tài liệu chính thức của Anthropic. Nội dung: bản dịch tiếng Việt của dự án mã nguồn mở Claude How To (luongnv89), giấy phép MIT.</p><nav><ol>${ids.map(id => `<li><a href="#sec-${id}">${esc(nameOf(id))}</a></li>`).join('')}</ol></nav>`
        + docs.map(d => `<section id="sec-${d.id}"><h1 class="t">${esc(nameOf(d.id))}</h1><div class="md">${fix(d.html)}</div>${EXS[d.id] && EXS[d.id].length ? `<div id="ex-${d.id}"><h2>Mẫu copy-paste: ${esc(docMeta(d.id).t)}</h2>${EXS[d.id].map(e => `<h3>${esc(e.p)}</h3><pre><code>${esc(e.t)}</code></pre>`).join('')}</div>` : ''}</section>`).join('<hr>')
        + `<hr><pre>MIT License\nCopyright (c) 2024 luongnv89\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction... (xem đầy đủ trên trang học). The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.</pre>`;
      const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Claude How To – bản offline</title><style>${css}.wrap{display:block;max-width:900px;margin:0 auto;padding:20px}.cp{display:none}</style></head><body><div class="wrap">${body}</div></body></html>`;
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' })); a.download = 'claude-howto-hoc-claude-code-offline.html'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (e) { alert('Không tạo được file offline: ' + (e.message || e)); }
    if ($('#off')) $('#off').textContent = '⬇ Tải bản đọc offline (.html)';
  }

  /* ---------- router ---------- */
  function route() {
    const h = decodeURIComponent((location.hash || '#/').slice(1)), p = h.split('/').filter(Boolean); document.title = 'Claude How To – Học Claude Code từ cơ bản đến nâng cao';
    $('#toc').innerHTML = ''; $('#res').classList.remove('on');
    if (p[0] === 'd' && p[1]) return doc(p[1], p[2] ? encodeURIComponent(p.slice(2).join('/')) : '');
    if (p[0] === 't' && p[1]) { sideNav('t/' + p[1]); track(p[1]); window.scrollTo(0, 0); return; }
    if (p[0] === 'x' && p[1]) return examples(p[1], p.slice(2).join('/'));
    sideNav('home'); home(); window.scrollTo(0, 0);
  }
  shell();
  getJSON('content/index.json').then(i => { IDX = i; window.addEventListener('hashchange', route); route(); }).catch(() => { $('#main').innerHTML = '<div class="note">Không tải được dữ liệu bài học. Hãy kiểm tra mạng rồi tải lại trang.</div>'; });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  window.CL = { route, get P() { return P; } };
})();
