// Story: trang kể chuyện cuộn (storytelling) dựng từ các khối. Dùng chung cho CMS (xem thử) và trang công khai story.html.
// Độc lập: không cần GV. Mọi chữ đều được escape, link/ảnh chỉ nhận http(s), màu/nền chỉ nhận ký tự an toàn.
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const url = v => { const s = String(v || '').trim(); return /^https?:\/\//i.test(s) && s.length < 1000 ? s.replace(/["'()\\<>\s]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')) : ''; };
  const col = (v, d) => { const s = String(v == null ? '' : v).trim(); return s && s.length <= 200 && /^[#\w\s(),.%\/-]+$/.test(s) && !/url|expression|javascript|import|var\(/i.test(s) ? s : (d || ''); };
  const num = (v, d) => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : d; };
  const slugify = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
  const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const anchor = v => String(v || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

  // chữ thường -> HTML an toàn: **đậm**, *nghiêng*, [chữ](https://…), xuống dòng
  function fmt(s) {
    let h = esc(s);
    h = h.replace(/\[([^\]\n]{1,120})\]\((https?:\/\/[^\s)]{1,500})\)/g, (m, t, u) => `<a href="${esc(url(u.replace(/&amp;/g, '&')) || '#')}" target="_blank" rel="noopener noreferrer">${t}</a>`);
    h = h.replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<i>$2</i>');
    return h.replace(/\n/g, '<br>');
  }
  const paras = s => String(s || '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean).map(p => `<p>${fmt(p)}</p>`).join('');
  const bgStyle = (img, bg, dflt) => { const u = url(img), c = col(bg, dflt); return esc((c ? `--bg:${c};` : '') + (u ? `--img:url('${u}');` : '')); };

  /* ---------- Định nghĩa khối (schema cho CMS + hàm render) ---------- */
  const f = (k, l, t, o) => Object.assign({ k, l, t: t || 'text' }, o || {});
  const ANIM = [['', 'Không'], ['fade-up', 'Hiện dần từ dưới'], ['fade', 'Hiện dần'], ['zoom', 'Phóng to nhẹ'], ['slide-l', 'Trượt từ trái'], ['slide-r', 'Trượt từ phải']];
  const IMG = 'Dán link ảnh https://…';
  const TYPES = {
    hero: {
      n: 'Bìa (hero)', i: '🌅', def: { kicker: 'Câu chuyện', title: 'Tiêu đề lớn của câu chuyện', sub: 'Một đoạn mở đầu ngắn, gợi tò mò.', img: '', bg: 'linear-gradient(135deg,#0e1a2b,#3a1c71)' },
      fields: [f('kicker', 'Dòng nhỏ phía trên'), f('title', 'Tiêu đề', 'area', { rows: 2 }), f('sub', 'Mô tả ngắn', 'area', { rows: 3 }), f('img', 'Ảnh nền', 'url', { ph: IMG }), f('bg', 'Màu / gradient nền (khi chưa có ảnh)', 'color')],
      html: b => `<section class="gvs-hero" style="${bgStyle(b.img, b.bg, 'linear-gradient(135deg,#0e1a2b,#3a1c71)')}"><div>${b.kicker ? `<div class="gvs-kicker">${esc(b.kicker)}</div>` : ''}<h1>${fmt(b.title)}</h1>${b.sub ? `<p class="gvs-lead">${fmt(b.sub)}</p>` : ''}</div><span class="gvs-hint" aria-hidden="true">Cuộn xuống ↓</span></section>`
    },
    text: {
      n: 'Đoạn văn', i: '📝', def: { title: 'Tiêu đề đoạn', body: 'Nội dung đoạn văn. Cách một dòng trống để sang đoạn mới.\n\nDùng **chữ đậm**, *chữ nghiêng* và [liên kết](https://example.com).' },
      fields: [f('title', 'Tiêu đề (tuỳ chọn)'), f('body', 'Nội dung', 'area', { rows: 8 })],
      html: b => `<section class="gvs-text">${b.title ? `<h2>${fmt(b.title)}</h2>` : ''}${paras(b.body)}</section>`
    },
    quote: {
      n: 'Trích dẫn', i: '❝', def: { text: 'Một câu nói đáng nhớ.', by: 'Người nói' },
      fields: [f('text', 'Câu trích', 'area', { rows: 3 }), f('by', 'Của ai')],
      html: b => `<blockquote class="gvs-quote"><p>${fmt(b.text)}</p>${b.by ? `<cite>— ${esc(b.by)}</cite>` : ''}</blockquote>`
    },
    image: {
      n: 'Ảnh lớn', i: '🖼️', def: { img: '', alt: '', cap: 'Chú thích ảnh', wide: 'full' },
      fields: [f('img', 'Link ảnh', 'url', { ph: IMG }), f('alt', 'Mô tả ảnh (alt, cho người khiếm thị)'), f('cap', 'Chú thích'), f('wide', 'Độ rộng', 'select', { opts: [['full', 'Tràn màn hình'], ['content', 'Trong cột chữ']] })],
      html: b => { const u = url(b.img); return `<figure class="gvs-fig ${b.wide === 'content' ? 'in' : ''}">${u ? `<img src="${esc(u)}" alt="${esc(b.alt)}" loading="lazy">` : '<div class="gvs-ph">Chưa có ảnh</div>'}${b.cap ? `<figcaption>${fmt(b.cap)}</figcaption>` : ''}</figure>`; }
    },
    parallax: {
      n: 'Ảnh nền + câu nổi (parallax)', i: '🏞️', def: { img: '', bg: 'linear-gradient(135deg,#ff6a00,#7b2cbf)', text: 'Một câu nói nổi bật trên nền ảnh.' },
      fields: [f('img', 'Ảnh nền', 'url', { ph: IMG }), f('bg', 'Màu / gradient nền', 'color'), f('text', 'Câu nổi', 'area', { rows: 3 })],
      html: b => `<section class="gvs-parallax" style="${bgStyle(b.img, b.bg, 'linear-gradient(135deg,#ff6a00,#7b2cbf)')}"><h2>${fmt(b.text)}</h2></section>`
    },
    scrolly: {
      n: 'Cuộn kể chuyện (khung dính)', i: '🎞️', def: { bg: '#0e1a2b', items: [{ label: '1997', title: 'Khởi đầu', body: 'Nội dung bước 1.', bg: '#1b2a4a', img: '' }, { label: '2008', title: 'Bước ngoặt', body: 'Nội dung bước 2.', bg: '#4a1b3a', img: '' }, { label: '2024', title: 'Hôm nay', body: 'Nội dung bước 3.', bg: '#1b4a3a', img: '' }] },
      fields: [f('bg', 'Nền khung dính mặc định', 'color'), f('items', 'Các bước', 'list', {
        add: 'Thêm bước', item: 'Bước', sub: [f('label', 'Nhãn lớn trên khung (vd: năm)'), f('title', 'Tiêu đề bước'), f('body', 'Nội dung', 'area', { rows: 4 }), f('bg', 'Nền khung khi tới bước này', 'color'), f('img', 'Ảnh khung (tuỳ chọn)', 'url', { ph: IMG })]
      })],
      html: b => { const it = Array.isArray(b.items) ? b.items : []; return `<section class="gvs-scrolly" data-bg="${esc(col(b.bg, '#0e1a2b'))}"><div class="gvs-sm" style="${bgStyle('', b.bg, '#0e1a2b')}"><span class="gvs-sl">${esc((it[0] || {}).label || '')}</span></div><div class="gvs-steps">${it.map(s => `<div class="gvs-step" data-label="${esc(s.label)}" data-bg="${esc(col(s.bg, ''))}" data-img="${esc(url(s.img))}"><div class="gvs-card">${s.title ? `<h3>${fmt(s.title)}</h3>` : ''}${paras(s.body)}</div></div>`).join('')}</div></section>`; }
    },
    stats: {
      n: 'Số liệu (đếm lên)', i: '🔢', def: { title: '', items: [{ n: '29', suf: ' năm', label: 'Hành trình' }, { n: '15000', suf: '+', label: 'Nhân sự' }, { n: '63', suf: '', label: 'Tỉnh thành' }] },
      fields: [f('title', 'Tiêu đề (tuỳ chọn)'), f('items', 'Các số liệu', 'list', { add: 'Thêm số liệu', item: 'Số liệu', sub: [f('n', 'Con số', 'text', { ph: '1500' }), f('suf', 'Hậu tố (vd: +, %, năm)'), f('label', 'Nhãn')] })],
      html: b => `<section class="gvs-stats">${b.title ? `<h2>${fmt(b.title)}</h2>` : ''}<div class="gvs-sg">${(b.items || []).map(s => { const n = num(s.n, 0); return `<div class="gvs-st"><b data-count="${n}">${esc(n.toLocaleString('vi-VN'))}</b><span class="gvs-sf">${esc(s.suf)}</span><em>${esc(s.label)}</em></div>`; }).join('')}</div></section>`
    },
    timeline: {
      n: 'Dòng thời gian', i: '🕰️', def: { title: 'Những cột mốc', items: [{ t: '1997', title: 'Thành lập', body: '' }, { t: '2005', title: 'Mở rộng', body: '' }] },
      fields: [f('title', 'Tiêu đề'), f('items', 'Các mốc', 'list', { add: 'Thêm mốc', item: 'Mốc', sub: [f('t', 'Thời gian'), f('title', 'Tiêu đề'), f('body', 'Mô tả', 'area', { rows: 3 })] })],
      html: b => `<section class="gvs-text gvs-tl">${b.title ? `<h2>${fmt(b.title)}</h2>` : ''}${(b.items || []).map(s => `<div class="gvs-tr"><time>${esc(s.t)}</time><div><h3>${fmt(s.title)}</h3>${paras(s.body)}</div></div>`).join('')}</section>`
    },
    gallery: {
      n: 'Bộ ảnh (lưới)', i: '🗂️', def: { cols: '3', items: [{ img: '', cap: '' }, { img: '', cap: '' }, { img: '', cap: '' }] },
      fields: [f('cols', 'Số cột', 'select', { opts: [['2', '2 cột'], ['3', '3 cột'], ['4', '4 cột']] }), f('items', 'Ảnh', 'list', { add: 'Thêm ảnh', item: 'Ảnh', sub: [f('img', 'Link ảnh', 'url', { ph: IMG }), f('cap', 'Chú thích')] })],
      html: b => `<section class="gvs-gal c${['2', '3', '4'].includes(String(b.cols)) ? b.cols : 3}">${(b.items || []).map(s => { const u = url(s.img); return `<figure>${u ? `<img src="${esc(u)}" alt="${esc(s.cap)}" loading="lazy">` : '<div class="gvs-ph">Ảnh</div>'}${s.cap ? `<figcaption>${esc(s.cap)}</figcaption>` : ''}</figure>`; }).join('')}</section>`
    },
    split: {
      n: 'Ảnh + chữ (2 cột)', i: '◫', def: { img: '', bg: '#e9eef6', title: 'Tiêu đề', body: 'Nội dung bên cạnh ảnh.', rev: '' },
      fields: [f('img', 'Link ảnh', 'url', { ph: IMG }), f('bg', 'Màu nền khi chưa có ảnh', 'color'), f('title', 'Tiêu đề'), f('body', 'Nội dung', 'area', { rows: 6 }), f('rev', 'Vị trí ảnh', 'select', { opts: [['', 'Ảnh bên trái'], ['1', 'Ảnh bên phải']] })],
      html: b => `<section class="gvs-split ${b.rev ? 'rev' : ''}"><div class="gvs-sp-img" style="${bgStyle(b.img, b.bg, '#e9eef6')}"></div><div class="gvs-sp-tx">${b.title ? `<h2>${fmt(b.title)}</h2>` : ''}${paras(b.body)}</div></section>`
    },
    video: {
      n: 'Video (file mp4/webm)', i: '🎬', def: { url: '', poster: '', cap: '' },
      fields: [f('url', 'Link file video (.mp4 / .webm)', 'url', { ph: 'https://…/video.mp4' }), f('poster', 'Ảnh bìa', 'url', { ph: IMG }), f('cap', 'Chú thích')],
      html: b => { const u = url(b.url), p = url(b.poster); return `<figure class="gvs-fig in">${u ? `<video src="${esc(u)}" ${p ? `poster="${esc(p)}"` : ''} controls playsinline preload="none"></video>` : '<div class="gvs-ph">Chưa có video</div>'}${b.cap ? `<figcaption>${fmt(b.cap)}</figcaption>` : ''}</figure>`; }
    },
    cta: {
      n: 'Kêu gọi (nút bấm)', i: '👉', def: { title: 'Bạn nghĩ sao?', body: '', btn: 'Tìm hiểu thêm', link: '' },
      fields: [f('title', 'Tiêu đề'), f('body', 'Mô tả', 'area', { rows: 3 }), f('btn', 'Chữ trên nút'), f('link', 'Đường dẫn (https://…)', 'url', { ph: 'https://…' })],
      html: b => { const u = url(b.link); return `<section class="gvs-cta"><h2>${fmt(b.title)}</h2>${b.body ? `<p>${fmt(b.body)}</p>` : ''}${b.btn && u ? `<a class="gvs-btn" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(b.btn)}</a>` : ''}</section>`; }
    }
  };
  const THEME_DEF = { brand: '#ff6a00', dark: '#0e1a2b', font: 'sans', bar: '1' };
  const FONTS = { sans: 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif', serif: 'Georgia,"Noto Serif","Times New Roman",serif' };

  function normalize(st) {
    st = st && typeof st === 'object' ? st : {};
    const th = Object.assign({}, THEME_DEF, st.theme || {});
    th.brand = col(th.brand, THEME_DEF.brand); th.dark = col(th.dark, THEME_DEF.dark); th.font = FONTS[th.font] ? th.font : 'sans';
    const blocks = (Array.isArray(st.blocks) ? st.blocks : []).filter(b => b && TYPES[b.type]).slice(0, 200);
    return { theme: th, blocks };
  }
  function blockHtml(b) {
    const T = TYPES[b.type], d = Object.assign({}, T.def, b);
    let h = T.html(d);
    const an = ANIM.some(a => a[0] === b.anim) && b.anim ? b.anim : '', id = anchor(b.anchor);
    if (an || id) h = h.replace(/^<(\w+)/, `<$1${id ? ` id="${esc(id)}"` : ''}${an ? ` data-anim="${esc(an)}"` : ''}`);
    return h;
  }
  const bodyHtml = st => { const n = normalize(st); return (n.theme.bar ? '<div class="gvs-prog" aria-hidden="true"><i></i></div>' : '') + n.blocks.map(blockHtml).join(''); };

  /* ---------- CSS ---------- */
  const CSS = `
.gvs{--b:var(--st-brand,#ff6a00);--d:var(--st-dark,#0e1a2b);--ink:#14161a;font-family:var(--st-font,system-ui,sans-serif);color:var(--ink);background:#fff;line-height:1.75;font-size:18px;-webkit-font-smoothing:antialiased;overflow-x:clip}
.gvs *{box-sizing:border-box}.gvs img,.gvs video{max-width:100%;display:block}.gvs a{color:var(--b)}
.gvs h1,.gvs h2,.gvs h3{line-height:1.15;margin:0 0 .5em;color:inherit}
.gvs-prog{position:fixed;top:0;left:0;right:0;height:4px;z-index:50;background:#0001}.gvs-prog i{display:block;height:100%;width:0;background:var(--b)}
.gvs-ph{display:grid;place-items:center;min-height:200px;background:#0000000d;color:#888;border-radius:10px;font-size:14px}
.gvs-hero,.gvs-parallax,.gvs-sp-img{background:var(--img,none) center/cover no-repeat,var(--bg,#223)}
.gvs-hero{position:relative;min-height:100vh;display:flex;align-items:flex-end;padding:14vh 7vw 12vh;color:#fff}
.gvs-hero::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,#0000001f,#000000a6)}
.gvs-hero>div{position:relative;max-width:920px}.gvs-hero h1{font-size:clamp(2.3rem,7.2vw,5.2rem);letter-spacing:-.02em}
.gvs-kicker{text-transform:uppercase;letter-spacing:.16em;font-weight:800;font-size:.8rem;color:var(--b);margin-bottom:14px}
.gvs-lead{font-size:clamp(1.05rem,2.2vw,1.45rem);max-width:640px;opacity:.92;margin:.4em 0 0}
.gvs-hint{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);font-size:.8rem;letter-spacing:.1em;opacity:.8;color:#fff;animation:gvsb 1.8s ease-in-out infinite}
@keyframes gvsb{50%{transform:translate(-50%,6px)}}
.gvs-text{max-width:720px;margin:0 auto;padding:9vh 22px 2vh}.gvs-text h2{font-size:clamp(1.6rem,4vw,2.4rem)}.gvs-text p{margin:0 0 1.15em}
.gvs-quote{margin:0;padding:11vh 7vw;text-align:center;background:color-mix(in srgb,var(--b) 9%,#fff)}
.gvs-quote p{font-size:clamp(1.4rem,3.6vw,2.4rem);line-height:1.35;font-weight:700;max-width:900px;margin:0 auto;font-style:italic}
.gvs-quote cite{display:block;margin-top:18px;font-style:normal;color:var(--b);font-weight:700}
.gvs-fig{margin:6vh 0;padding:0}.gvs-fig.in{max-width:900px;margin:6vh auto;padding:0 22px}.gvs-fig img,.gvs-fig video{width:100%;max-height:92vh;object-fit:cover}.gvs-fig.in img,.gvs-fig.in video{border-radius:12px}
.gvs-fig figcaption,.gvs-gal figcaption{font-size:.85rem;color:#666;padding:8px 22px 0;text-align:center}
.gvs-parallax{min-height:80vh;display:grid;place-items:center;padding:24px;color:#fff;text-align:center;background-attachment:fixed;position:relative}
.gvs-parallax::before{content:"";position:absolute;inset:0;background:#0000004d}.gvs-parallax h2{position:relative;font-size:clamp(1.8rem,5vw,3.4rem);max-width:20ch;text-shadow:0 4px 30px #0006;margin:0}
.gvs-scrolly{display:grid;grid-template-columns:1.1fr 1fr;background:var(--d);color:#fff}
.gvs-sm{position:sticky;top:0;height:100vh;display:grid;place-items:center;background:var(--img,none) center/cover,var(--bg,var(--d));transition:background .6s}
.gvs-sl{font-size:clamp(3rem,10vw,8rem);font-weight:900;letter-spacing:-.03em;opacity:.92;text-shadow:0 6px 40px #0006;transition:opacity .3s}
.gvs-steps{padding:28vh 5vw}.gvs-step{min-height:78vh;display:flex;align-items:center;opacity:.35;transition:opacity .4s}.gvs-step.act{opacity:1}
.gvs-card{width:100%;max-width:540px;background:#ffffff14;backdrop-filter:blur(6px);border:1px solid #ffffff22;border-radius:16px;padding:26px 28px}.gvs-card h3{font-size:1.6rem}.gvs-card p{margin:0 0 1em}.gvs-card p:last-child{margin:0}
.gvs-stats{padding:11vh 7vw;background:color-mix(in srgb,var(--b) 8%,#fff);text-align:center}.gvs-stats h2{font-size:clamp(1.6rem,4vw,2.4rem);margin-bottom:1.2em}
.gvs-sg{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:28px;max-width:1000px;margin:0 auto}
.gvs-st b{font-size:clamp(2.6rem,7vw,4.4rem);font-weight:900;color:var(--b);letter-spacing:-.03em;line-height:1}.gvs-sf{font-size:1.6rem;font-weight:800;color:var(--b)}.gvs-st em{display:block;font-style:normal;color:#444;margin-top:6px}
.gvs-tl .gvs-tr{display:grid;grid-template-columns:96px 1fr;gap:20px;padding:0 0 26px;border-left:3px solid color-mix(in srgb,var(--b) 30%,#fff);padding-left:18px;position:relative}
.gvs-tl .gvs-tr::before{content:"";position:absolute;left:-9px;top:6px;width:15px;height:15px;border-radius:50%;background:var(--b)}
.gvs-tl time{font-weight:900;color:var(--b);font-size:1.25rem}.gvs-tl h3{font-size:1.2rem;margin:0 0 .3em}.gvs-tl p{margin:0 0 .6em}
.gvs-gal{display:grid;gap:12px;padding:6vh 6vw}.gvs-gal.c2{grid-template-columns:repeat(2,1fr)}.gvs-gal.c3{grid-template-columns:repeat(3,1fr)}.gvs-gal.c4{grid-template-columns:repeat(4,1fr)}
.gvs-gal figure{margin:0}.gvs-gal img,.gvs-gal .gvs-ph{border-radius:10px;aspect-ratio:4/3;object-fit:cover;width:100%}
.gvs-split{display:grid;grid-template-columns:1fr 1fr;min-height:80vh}.gvs-split.rev .gvs-sp-img{order:2}
.gvs-sp-tx{padding:8vh 6vw;display:flex;flex-direction:column;justify-content:center}.gvs-sp-tx h2{font-size:clamp(1.6rem,3.6vw,2.4rem)}.gvs-sp-tx p{margin:0 0 1em}
.gvs-cta{padding:12vh 7vw;text-align:center;background:var(--d);color:#fff}.gvs-cta h2{font-size:clamp(1.8rem,5vw,3rem)}.gvs-cta p{max-width:560px;margin:0 auto 1.4em;opacity:.9}
.gvs-btn{display:inline-block;background:var(--b);color:#fff!important;text-decoration:none;font-weight:800;padding:14px 30px;border-radius:99px;transition:transform .2s}.gvs-btn:hover{transform:translateY(-2px)}
.gvs-js [data-anim]{opacity:0;transition:opacity .8s ease,transform .8s cubic-bezier(.2,.7,.2,1)}
.gvs-js [data-anim=fade-up]{transform:translateY(40px)}.gvs-js [data-anim=zoom]{transform:scale(.92)}.gvs-js [data-anim=slide-l]{transform:translateX(-60px)}.gvs-js [data-anim=slide-r]{transform:translateX(60px)}
.gvs-js [data-anim].in{opacity:1;transform:none}
@media (max-width:760px){.gvs{font-size:17px}.gvs-scrolly,.gvs-split{grid-template-columns:1fr}.gvs-sm{height:44vh;z-index:1}.gvs-steps{padding:6vh 5vw}.gvs-step{min-height:60vh}.gvs-parallax{background-attachment:scroll}.gvs-gal.c3,.gvs-gal.c4{grid-template-columns:repeat(2,1fr)}.gvs-split .gvs-sp-img{min-height:42vh;order:0!important}.gvs-tl .gvs-tr{grid-template-columns:1fr;gap:4px}}
@media (prefers-reduced-motion:reduce){.gvs-js [data-anim]{opacity:1;transform:none;transition:none}.gvs-hint{animation:none}}`;

  /* ---------- Hành vi khi cuộn ---------- */
  function run(root) {
    if (root._off) root._off();
    const offs = [], reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
    const count = el => {
      const to = parseFloat(el.dataset.count) || 0, t0 = performance.now(), dur = 1400;
      if (reduce) { el.textContent = to.toLocaleString('vi-VN'); return; }
      const tick = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e).toLocaleString('vi-VN'); if (k < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; e.target.classList.add('in'); if (e.target.dataset.count && !e.target._c) { e.target._c = 1; count(e.target); } io.unobserve(e.target); }), { threshold: .18 });
      root.querySelectorAll('[data-anim],[data-count]').forEach(el => { if (el.dataset.count) el.textContent = '0'; io.observe(el); });
      offs.push(() => io.disconnect());
      root.querySelectorAll('.gvs-scrolly').forEach(sc => {
        const media = sc.querySelector('.gvs-sm'), lab = sc.querySelector('.gvs-sl'), def = sc.dataset.bg, steps = [...sc.querySelectorAll('.gvs-step')];
        const so = new IntersectionObserver(es => es.forEach(e => {
          if (!e.isIntersecting) return; steps.forEach(s => s.classList.toggle('act', s === e.target));
          const d = e.target.dataset; lab.textContent = d.label || ''; media.style.setProperty('--bg', d.bg || def);
          if (d.img) media.style.setProperty('--img', `url('${d.img}')`); else media.style.removeProperty('--img');
        }), { rootMargin: '-45% 0px -45% 0px' });
        steps.forEach(s => so.observe(s)); offs.push(() => so.disconnect());
      });
    } else root.querySelectorAll('[data-anim]').forEach(el => el.classList.add('in'));
    const bar = root.querySelector('.gvs-prog i');
    if (bar) { const on = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.width = (h > 0 ? Math.min(100, scrollY / h * 100) : 0) + '%'; }; addEventListener('scroll', on, { passive: true }); on(); offs.push(() => removeEventListener('scroll', on)); }
    root._off = () => { offs.forEach(f => { try { f(); } catch (e) {} }); root._off = null; };
  }
  function ensureCss() { if (document.getElementById('gvs-css')) return; const s = document.createElement('style'); s.id = 'gvs-css'; s.textContent = CSS; document.head.appendChild(s); }
  function mount(el, st) {
    ensureCss(); const n = normalize(st);
    el.className = 'gvs gvs-js'; el.style.setProperty('--st-brand', n.theme.brand); el.style.setProperty('--st-dark', n.theme.dark); el.style.setProperty('--st-font', FONTS[n.theme.font]);
    el.innerHTML = bodyHtml(n); run(el); return n;
  }

  // Mẫu story để người mới thấy ngay kiểu trang
  const sample = () => ({
    theme: Object.assign({}, THEME_DEF),
    blocks: [
      { type: 'hero', anim: '' }, { type: 'text', anim: 'fade-up' },
      { type: 'scrolly', anim: '' }, { type: 'stats', anim: 'fade-up' },
      { type: 'quote', anim: 'zoom' }, { type: 'timeline', anim: 'fade-up' }, { type: 'cta', anim: '' }
    ].map(b => Object.assign({ id: 'b' + Math.random().toString(36).slice(2, 8) }, JSON.parse(JSON.stringify(TYPES[b.type].def)), b))
  });

  window.GVStory = { TYPES, ANIM, THEME_DEF, FONTS, SLUG_RE, slugify, esc, url, col, fmt, normalize, blockHtml, bodyHtml, CSS, mount, run, sample };
  if (window.GV) window.GV.story = window.GVStory;
})();
