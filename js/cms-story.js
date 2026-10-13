// CMS: tab "Câu chuyện" – soạn trang kể chuyện (storytelling) từ các khối, xem thử trực tiếp, xuất bản theo slug riêng (story.html?s=<slug>, /story/<slug>).
// Dữ liệu Firebase: stories/meta/<id> · stories/data/<id> (chuỗi JSON) · stories/slugs/<slug> = id. Xem tools/make_rules.py.
(function () {
  const A = GV.account, S = window.GVStory, esc = GV.esc, T = (m, o) => GV.toast(m, o);
  const rid = () => 'b' + Math.random().toString(36).slice(2, 8);
  const sumOf = b => { const d = b, s = d.title || d.text || d.kicker || d.cap || (d.items && d.items[0] && (d.items[0].title || d.items[0].label || d.items[0].cap)) || d.body || ''; return String(s).replace(/\s+/g, ' ').slice(0, 38); };

  GV.cmsStory = async function (c, $, $$, fdate) {
    let st = null; // đang soạn: {id, meta, story, sel, slugTouched, dirty, oldSlug}
    const offs = []; GV.cmsOff.push(() => offs.splice(0).forEach(f => f()));
    const guard = e => { if (st && st.dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', guard); offs.push(() => window.removeEventListener('beforeunload', guard));
    const db = async () => (await GV.fbInfo().fb()).db;
    const origin = () => location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '');
    const liveUrl = slug => origin() + 'story.html?s=' + encodeURIComponent(slug);

    /* ================= DANH SÁCH ================= */
    async function list() {
      st = null;
      c.innerHTML = `<div class="card2"><h2>📖 Câu chuyện (Story)</h2>
        <p class="hint">Trang kể chuyện cuộn kiểu báo điện tử: bìa lớn, khung cuộn dính, số liệu đếm lên, dòng thời gian, ảnh nền parallax… Mỗi story có <b>đường dẫn riêng</b> (slug) và là một trang độc lập.</p>
        <div class="row"><button class="btn nw">➕ Story mới (có mẫu)</button><button class="pbtn ne">📄 Story trống</button><button class="pbtn rf">🔄</button><a class="pbtn" href="story.html" target="_blank" rel="noopener">🌐 Trang danh sách công khai</a></div></div>
        <div class="card2"><div class="ll tw">Đang tải…</div></div>`;
      $('.nw', c).onclick = () => edit(null, true); $('.ne', c).onclick = () => edit(null, false); $('.rf', c).onclick = list;
      let rows = [];
      try { rows = Object.entries((await (await db()).ref('stories/meta').once('value')).val() || {}).map(([id, m]) => Object.assign({ id }, m)).sort((a, b) => (b.up || b.at || 0) - (a.up || a.at || 0)); }
      catch (e) { $('.ll', c).innerHTML = `<b style="color:var(--bad)">⚠️ ${esc(GV.fbInfo().explain(e))}</b>`; return; }
      $('.ll', c).innerHTML = rows.length ? `<table><tr><th>Tiêu đề</th><th>Đường dẫn</th><th>Trạng thái</th><th>Người soạn</th><th>Cập nhật</th><th></th></tr>${rows.map(m => `<tr><td data-label="Tiêu đề"><b>${esc(m.title)}</b><br><span class="hint">${esc(m.desc || '')}</span></td><td data-label="Đường dẫn"><code>/story/${esc(m.slug)}</code></td><td data-label="Trạng thái">${m.pub ? '<span class="tag ok">Đã xuất bản</span>' : '<span class="tag warn">Bản nháp</span>'}</td><td data-label="Người soạn">${esc(m.byName || '')}</td><td data-label="Cập nhật" class="hint">${fdate(m.up || m.at)}</td><td data-label=""><button class="pbtn sm" data-e="${m.id}">✏️ Sửa</button> ${m.pub ? `<a class="pbtn sm" href="${esc(liveUrl(m.slug))}" target="_blank" rel="noopener">👁 Xem</a>` : ''} <button class="btn bad sm" data-x="${m.id}" data-s="${esc(m.slug)}">Xoá</button></td></tr>`).join('')}</table>` : '<div class="msg">Chưa có story nào. Bấm "➕ Story mới (có mẫu)" để bắt đầu từ trang mẫu.</div>';
      $('.ll', c).onclick = async e => {
        const be = e.target.closest('[data-e]'), bx = e.target.closest('[data-x]');
        if (be) edit(be.dataset.e);
        if (bx && confirm('Xoá story này vĩnh viễn (cả đường dẫn)?')) { try { const u = {}; u['meta/' + bx.dataset.x] = null; u['data/' + bx.dataset.x] = null; u['slugs/' + bx.dataset.s] = null; await (await db()).ref('stories').update(u); T('Đã xoá story.', { type: 'success' }); list(); } catch (x) { T(GV.fbInfo().explain(x), { type: 'error' }); } }
      };
    }

    /* ================= SOẠN ================= */
    async function edit(id, withSample) {
      if (id) {
        try {
          const d = await db(), [m, s] = await Promise.all([d.ref('stories/meta/' + id).once('value'), d.ref('stories/data/' + id).once('value')]);
          if (!m.exists()) return T('Story không còn tồn tại.', { type: 'error' });
          st = { id, meta: m.val(), story: S.normalize(JSON.parse(s.val() || '{}')), sel: 0, slugTouched: true, dirty: false, oldSlug: m.val().slug };
        } catch (e) { return T(GV.fbInfo().explain(e), { type: 'error' }); }
        st.story.blocks.forEach(b => { if (!b.id) b.id = rid(); });
      } else {
        const d = await db(); st = { id: d.ref('stories/meta').push().key, meta: { title: '', slug: '', desc: '', cover: '', pub: false }, story: withSample ? S.sample() : { theme: Object.assign({}, S.THEME_DEF), blocks: [] }, sel: 0, slugTouched: false, dirty: !!withSample, oldSlug: '' };
        if (withSample) { st.meta.title = 'Hành trình của chúng ta'; st.meta.slug = S.slugify(st.meta.title); }
      }
      draw();
    }

    function draw() {
      c.innerHTML = `<div class="card2 sty"><div class="sty-top">
          <button class="pbtn bk">← Danh sách</button><input class="ti" placeholder="Tiêu đề story" maxlength="160" value="${esc(st.meta.title)}">
          <label class="sty-sg">/story/<input class="sg" maxlength="60" placeholder="duong-dan" value="${esc(st.meta.slug)}"></label>
          <label class="sty-pu"><input type="checkbox" class="pu" ${st.meta.pub ? 'checked' : ''}> Xuất bản</label>
          <button class="btn sv">💾 Lưu</button><a class="pbtn vw" target="_blank" rel="noopener">👁 Mở trang</a></div>
        <div class="row"><input class="ds" style="flex:2;min-width:220px" maxlength="300" placeholder="Mô tả ngắn (hiện ở danh sách và khi chia sẻ)" value="${esc(st.meta.desc || '')}"><input class="cv" style="flex:1;min-width:180px" placeholder="Ảnh đại diện (link https://…)" value="${esc(st.meta.cover || '')}"></div>
        <div class="msg sty-msg hint"></div>
        <div class="sty-grid"><div class="sty-l"><div class="sty-bl"></div>
            <div class="row"><select class="sty-add" style="flex:1"><option value="">➕ Thêm khối…</option>${Object.entries(S.TYPES).map(([k, t]) => `<option value="${k}">${t.i} ${esc(t.n)}</option>`).join('')}</select></div>
            <details class="sty-th"><summary>🎨 Giao diện chung</summary><div class="sty-tf"></div></details></div>
          <div class="sty-m"><div class="sty-form"></div></div>
          <div class="sty-r"><div class="row sty-dv"><button class="pbtn sm on" data-d="">🖥 Máy tính</button><button class="pbtn sm" data-d="390px">📱 Điện thoại</button><span class="hint">Xem thử trực tiếp</span></div><div class="sty-fr"><iframe class="pf" title="Xem thử story" sandbox="allow-scripts"></iframe></div></div></div></div>`;
      bindTop(); blocksList(); themeForm(); form(); previewInit();
    }
    const msg = (t, bad) => { const m = $('.sty-msg', c); if (m) { m.textContent = t || ''; m.style.color = bad ? 'var(--bad)' : ''; } };
    const dirty = () => { st.dirty = true; const b = $('.sv', c); if (b) b.textContent = '💾 Lưu *'; preview(); };
    function bindTop() {
      const m = st.meta, vw = $('.vw', c);
      const upd = () => { vw.hidden = !st.oldSlug || !m.pub; vw.href = liveUrl(st.oldSlug || m.slug); }; upd();
      $('.bk', c).onclick = () => { if (st.dirty && !confirm('Có thay đổi chưa lưu. Rời đi?')) return; list(); };
      $('.ti', c).oninput = e => { m.title = e.target.value; if (!st.slugTouched) { m.slug = S.slugify(m.title); $('.sg', c).value = m.slug; } dirty(); };
      $('.sg', c).oninput = e => { st.slugTouched = true; m.slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 60); e.target.value = m.slug; dirty(); };
      $('.pu', c).onchange = e => { m.pub = e.target.checked; dirty(); upd(); };
      $('.ds', c).oninput = e => { m.desc = e.target.value; dirty(); }; $('.cv', c).oninput = e => { m.cover = e.target.value.trim(); dirty(); };
      $('.sv', c).onclick = save;
      $('.sty-add', c).onchange = e => { const k = e.target.value; if (!k) return; const b = Object.assign({ id: rid(), type: k, anim: k === 'hero' ? '' : 'fade-up' }, JSON.parse(JSON.stringify(S.TYPES[k].def))); st.story.blocks.splice(st.sel + 1 > st.story.blocks.length ? st.story.blocks.length : st.sel + 1, 0, b); st.sel = st.story.blocks.indexOf(b); e.target.value = ''; blocksList(); form(); dirty(); pvScroll(); };
    }
    async function save() {
      const m = st.meta, btn = $('.sv', c);
      m.title = m.title.trim(); m.slug = (m.slug || '').trim();
      if (!m.title) return msg('Nhập tiêu đề story.', true);
      if (!S.SLUG_RE.test(m.slug) || m.slug.length < 3) return msg('Đường dẫn chỉ gồm chữ thường a-z, số và dấu gạch ngang, tối thiểu 3 ký tự (vd: hanh-trinh-29-nam).', true);
      if (m.cover && !/^https?:\/\//i.test(m.cover)) return msg('Ảnh đại diện phải là link http(s).', true);
      const json = JSON.stringify({ v: 1, theme: S.normalize(st.story).theme, blocks: st.story.blocks.filter(b => S.TYPES[b.type]) });
      if (json.length > 390000) return msg(`Story quá lớn (${Math.round(json.length / 1000)}KB, tối đa ~390KB). Bớt ảnh/đoạn văn hoặc tách thành 2 story.`, true);
      btn.disabled = true; msg('Đang lưu…');
      try {
        const d = await db(), TS = (await GV.fbInfo().fb()).TS, ex = (await d.ref('stories/slugs/' + m.slug).once('value')).val();
        if (ex && ex !== st.id) { btn.disabled = false; return msg(`Đường dẫn "${m.slug}" đã được story khác dùng. Hãy đổi sang tên khác.`, true); }
        const prev = (await d.ref('stories/meta/' + st.id).once('value')).val() || {};
        const meta = { title: m.title, slug: m.slug, desc: (m.desc || '').trim(), cover: m.cover || '', pub: !!m.pub, by: prev.by || A.user.uid, byName: prev.byName || (A.profile && A.profile.name) || A.user.email, at: prev.at || TS, up: TS };
        if (meta.pub) meta.pubAt = prev.pubAt || TS;
        const u = {}; u['meta/' + st.id] = meta; u['data/' + st.id] = json; u['slugs/' + m.slug] = st.id;
        if (st.oldSlug && st.oldSlug !== m.slug) u['slugs/' + st.oldSlug] = null;
        await d.ref('stories').update(u);
        st.oldSlug = m.slug; st.dirty = false; btn.textContent = '💾 Lưu'; $('.vw', c).href = liveUrl(m.slug); $('.vw', c).hidden = !m.pub;
        msg(m.pub ? `✅ Đã lưu và xuất bản: ${liveUrl(m.slug)}  ·  Link rút gọn: ${origin()}story/${m.slug}` : '✅ Đã lưu bản nháp (chưa xuất bản – tích "Xuất bản" rồi lưu để công khai).'); T('Đã lưu story', { type: 'success' });
      } catch (e) { msg('⚠️ ' + GV.fbInfo().explain(e), true); }
      btn.disabled = false;
    }

    /* ---- danh sách khối ---- */
    function blocksList() {
      const bl = $('.sty-bl', c), bs = st.story.blocks;
      bl.innerHTML = bs.length ? bs.map((b, i) => { const t = S.TYPES[b.type]; return `<div class="sty-b ${i === st.sel ? 'on' : ''}" data-i="${i}"><span class="ic">${t.i}</span><span class="tx"><b>${esc(t.n)}</b><em>${esc(sumOf(b))}</em></span><span class="ac"><button data-a="up" title="Lên" ${i ? '' : 'disabled'}>↑</button><button data-a="dn" title="Xuống" ${i < bs.length - 1 ? '' : 'disabled'}>↓</button><button data-a="dup" title="Nhân đôi">⧉</button><button data-a="del" title="Xoá">🗑</button></span></div>`; }).join('') : '<p class="hint">Chưa có khối nào. Chọn "➕ Thêm khối…" bên dưới.</p>';
      bl.onclick = e => {
        const row = e.target.closest('.sty-b'); if (!row) return; const i = +row.dataset.i, a = e.target.closest('[data-a]');
        if (!a) { if (st.sel !== i) { st.sel = i; blocksList(); form(); } pvScroll(); return; }
        const k = a.dataset.a;
        if (k === 'up' || k === 'dn') { const j = k === 'up' ? i - 1 : i + 1; [bs[i], bs[j]] = [bs[j], bs[i]]; st.sel = j; }
        else if (k === 'dup') { const cp = JSON.parse(JSON.stringify(bs[i])); cp.id = rid(); bs.splice(i + 1, 0, cp); st.sel = i + 1; }
        else if (k === 'del') { if (!confirm('Xoá khối này?')) return; bs.splice(i, 1); st.sel = Math.max(0, Math.min(st.sel, bs.length - 1)); }
        blocksList(); form(); dirty();
      };
    }

    /* ---- form chung (theo schema) ---- */
    const fieldHtml = (f, val, path) => {
      const v = val == null ? '' : val, a = `data-p="${esc(path)}"`;
      if (f.t === 'area') return `<label class="f">${esc(f.l)}</label><textarea class="w" ${a} rows="${f.rows || 4}">${esc(v)}</textarea>`;
      if (f.t === 'select') return `<label class="f">${esc(f.l)}</label><select class="w" ${a}>${f.opts.map(o => `<option value="${esc(o[0])}" ${String(v) === o[0] ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
      if (f.t === 'color') return `<label class="f">${esc(f.l)}</label><div class="row" style="flex-wrap:nowrap"><input class="w" ${a} value="${esc(v)}" placeholder="#0e1a2b hoặc linear-gradient(135deg,#f60,#72c)"><input type="color" class="sty-cp" data-for="${esc(path)}" value="${/^#[0-9a-f]{6}$/i.test(v) ? v : '#888888'}" title="Chọn màu"></div>`;
      return `<label class="f">${esc(f.l)}</label><input class="w" ${a} value="${esc(v)}" ${f.ph ? `placeholder="${esc(f.ph)}"` : ''} ${f.t === 'url' ? 'inputmode="url"' : ''}>`;
    };
    function form() {
      const box = $('.sty-form', c), b = st.story.blocks[st.sel];
      if (!b) { box.innerHTML = '<p class="hint">Chọn hoặc thêm một khối để chỉnh nội dung.</p>'; return; }
      const T0 = S.TYPES[b.type];
      box.innerHTML = `<h3>${T0.i} ${esc(T0.n)}</h3>` + T0.fields.map(f => {
        if (f.t !== 'list') return fieldHtml(f, b[f.k], f.k);
        const items = Array.isArray(b[f.k]) ? b[f.k] : [];
        return `<label class="f">${esc(f.l)}</label><div class="sty-li" data-l="${f.k}">${items.map((it, i) => `<div class="sty-it"><div class="sty-ith"><b>${esc(f.item)} ${i + 1}</b><span><button data-a="iu" data-i="${i}" ${i ? '' : 'disabled'}>↑</button><button data-a="id" data-i="${i}" ${i < items.length - 1 ? '' : 'disabled'}>↓</button><button data-a="ix" data-i="${i}">🗑</button></span></div>${f.sub.map(s => fieldHtml(s, it[s.k], `${f.k}.${i}.${s.k}`)).join('')}</div>`).join('')}<button class="pbtn sm" data-a="ia" data-l="${f.k}">➕ ${esc(f.add)}</button></div>`;
      }).join('') + `<details class="sty-ex"><summary>⚙️ Hiệu ứng & mã neo</summary><label class="f">Hiệu ứng khi cuộn tới</label><select class="w" data-p="anim">${S.ANIM.map(o => `<option value="${o[0]}" ${(b.anim || '') === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select><label class="f">Mã neo (để link tới giữa trang, vd: gioi-thieu → story.html?s=…#gioi-thieu)</label><input class="w" data-p="anchor" maxlength="40" value="${esc(b.anchor || '')}"></details>`;
    }
    const setPath = (obj, path, val) => { const ks = path.split('.'); let o = obj; for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = val; };
    function formEvents() {
      const box = $('.sty-form', c);
      box.addEventListener('input', e => {
        const t = e.target, b = st.story.blocks[st.sel]; if (!b) return;
        if (t.classList.contains('sty-cp')) { const inp = box.querySelector(`[data-p="${CSS.escape(t.dataset.for)}"]`); inp.value = t.value; setPath(b, t.dataset.for, t.value); dirty(); return; }
        if (!t.dataset.p) return; setPath(b, t.dataset.p, t.value); dirty();
        if (!t.dataset.p.includes('.')) { const row = $(`.sty-b[data-i="${st.sel}"] em`, c); if (row) row.textContent = sumOf(b); }
      });
      box.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.p === 'anim') dirty(); });
      box.addEventListener('click', e => {
        const a = e.target.closest('[data-a]'); if (!a) return; const b = st.story.blocks[st.sel], k = a.dataset.a;
        const list = a.closest('.sty-li'), key = list ? list.dataset.l : a.dataset.l, arr = key ? (b[key] = Array.isArray(b[key]) ? b[key] : []) : null, i = +a.dataset.i;
        if (k === 'ia') { const f = S.TYPES[b.type].fields.find(x => x.k === key); const it = {}; f.sub.forEach(s => it[s.k] = ''); arr.push(it); }
        else if (k === 'ix') arr.splice(i, 1);
        else if (k === 'iu') [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
        else if (k === 'id') [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
        else return;
        form(); blocksList(); dirty();
      });
    }
    function themeForm() {
      const th = st.story.theme, box = $('.sty-tf', c);
      box.innerHTML = fieldHtml({ l: 'Màu thương hiệu (nút, số liệu, nhấn)', t: 'color' }, th.brand, 'brand') + fieldHtml({ l: 'Màu nền tối (khung cuộn, kêu gọi)', t: 'color' }, th.dark, 'dark')
        + fieldHtml({ l: 'Phông chữ', t: 'select', opts: [['sans', 'Không chân (hiện đại)'], ['serif', 'Có chân (báo chí)']] }, th.font, 'font')
        + `<label class="f"><input type="checkbox" data-p="bar" ${th.bar ? 'checked' : ''}> Thanh tiến độ đọc phía trên</label>`;
      box.oninput = e => { const t = e.target; if (t.classList.contains('sty-cp')) { box.querySelector(`[data-p="${t.dataset.for}"]`).value = t.value; th[t.dataset.for] = t.value; } else if (t.dataset.p) th[t.dataset.p] = t.type === 'checkbox' ? (t.checked ? '1' : '') : t.value; dirty(); };
    }

    /* ---- xem thử (iframe, cập nhật bằng postMessage nên không mất vị trí cuộn) ---- */
    let ready = false, timer = 0;
    function previewInit() {
      ready = false; const fr = $('.pf', c), src = new URL('js/story-render.js', location.href).href;
      fr.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}</style></head><body><div id="a"></div><script src="${src}"><\/script><script>var a=document.getElementById('a');addEventListener('message',function(e){var d=e.data||{};if(d.gvStory){var y=scrollY;GVStory.mount(a,d.gvStory);scrollTo(0,y)}if(typeof d.gvScroll==='number'){var k=a.children[d.gvScroll+(a.querySelector('.gvs-prog')?1:0)];if(k)k.scrollIntoView({behavior:'smooth'})}});parent.postMessage({gvReady:1},'*')<\/script></body></html>`;
      $$('.sty-dv [data-d]', c).forEach(b => b.onclick = () => { $$('.sty-dv [data-d]', c).forEach(x => x.classList.toggle('on', x === b)); fr.style.width = b.dataset.d || '100%'; });
      formEvents();
    }
    const onMsg = e => { const fr = c.querySelector('.pf'); if (fr && e.source === fr.contentWindow && e.data && e.data.gvReady) { ready = true; preview(); } };
    window.addEventListener('message', onMsg); offs.push(() => window.removeEventListener('message', onMsg));
    function preview() { clearTimeout(timer); timer = setTimeout(() => { const fr = c.querySelector('.pf'); if (ready && fr && fr.contentWindow) fr.contentWindow.postMessage({ gvStory: { theme: st.story.theme, blocks: st.story.blocks } }, '*'); }, 200); }
    function pvScroll() { const fr = c.querySelector('.pf'); if (ready && fr && fr.contentWindow) fr.contentWindow.postMessage({ gvScroll: st.sel }, '*'); }

    list();
  };
})();
