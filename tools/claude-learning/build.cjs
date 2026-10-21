// Dựng nội dung cho trang /claude-learning từ bản tiếng Việt của kho "Claude How To" (giấy phép MIT).
// Chạy (không phải phụ thuộc của dự án, cài tạm): npm i marked@12 sanitize-html mermaid@10.9.3 ; NODE_PATH=<node_modules> node build.cjs <thư mục vi/ của kho>
// Việc làm: markdown → HTML (đã lọc an toàn), sơ đồ Mermaid → SVG dựng sẵn (không cần thư viện khi chạy), viết lại liên kết nội bộ thành hash route của trang,
// bỏ liên kết GitHub, chép ảnh, gom file mẫu (ví dụ copy-paste) và chỉ mục tìm kiếm. Kết quả nằm ở claude-learning/content và claude-learning/img.
const fs = require('fs'), path = require('path');
const { marked } = require('marked'), sanitizeHtml = require('sanitize-html'), { chromium } = require('playwright');
const SRC = path.resolve(process.argv[2] || ''), ROOT = path.resolve(__dirname, '..', '..'), OUT = path.join(ROOT, 'claude-learning'), CONTENT = path.join(OUT, 'content'), IMG = path.join(OUT, 'img');
if (!fs.existsSync(path.join(SRC, 'README.md'))) { console.error('Cần đường dẫn thư mục vi/ của kho claude-howto'); process.exit(1); }
fs.mkdirSync(CONTENT, { recursive: true }); fs.mkdirSync(IMG, { recursive: true });
const MODS = [ // thứ tự học theo lộ trình của kho
  ['01-slash-commands', '⚡', 'Lệnh Slash', 'Phím tắt cho quy trình lặp lại: lệnh có sẵn và lệnh tự viết.', 1, 30],
  ['02-memory', '🧠', 'Bộ nhớ (CLAUDE.md)', 'Dạy Claude nhớ dự án, quy ước và sở thích giữa các phiên.', 1, 45],
  ['08-checkpoints', '⏪', 'Checkpoints & Rewind', 'Thử nghiệm an toàn, quay lại trạng thái trước khi Claude sửa.', 1, 45],
  ['10-cli', '💻', 'CLI & chế độ print', 'Dòng lệnh, chế độ không tương tác, script và CI/CD.', 1, 60],
  ['03-skills', '🎯', 'Agent Skills', 'Đóng gói chuyên môn tái sử dụng, Claude tự gọi khi cần.', 2, 60],
  ['06-hooks', '🪝', 'Hooks', 'Tự động hoá theo sự kiện: kiểm tra, định dạng, chặn thao tác nguy hiểm.', 2, 60],
  ['05-mcp', '🔌', 'MCP', 'Nối Claude với dữ liệu và công cụ ngoài (GitHub, CSDL, trình duyệt…).', 2, 60],
  ['04-subagents', '🤖', 'Tác nhân con (Subagents)', 'Giao việc cho các agent chuyên biệt với ngữ cảnh riêng.', 2, 90],
  ['09-advanced-features', '🚀', 'Tính năng nâng cao', 'Planning mode, quyền hạn, chế độ tự động, headless và nhiều hơn nữa.', 3, 150],
  ['07-plugins', '📦', 'Plugins', 'Gói trọn lệnh, agent, hook, MCP để chia sẻ cho cả nhóm.', 3, 120]];
const DOCS = [['roadmap', '🗺️', 'Lộ trình học', 'LEARNING-ROADMAP.md'], ['quick', '📋', 'Tham khảo nhanh', 'QUICK_REFERENCE.md'], ['catalog', '📚', 'Danh mục tính năng', 'CATALOG.md']];
const ALLDOC = Object.fromEntries([...MODS.map(m => [m[0], path.join(m[0], 'README.md')]), ...DOCS.map(d => [d[0], d[3]])]);
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
// slug kiểu GitHub (giữ chữ có dấu) để liên kết #mục-lục trong tài liệu gốc vẫn khớp
const slug = t => t.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s/g, '-');
const textFiles = /\.(md|sh|py|json|ya?ml|toml|txt|js|ts)$/i;
// ---- file mẫu của từng module
const EX = {};
function walk(dir, base, out) { for (const n of fs.readdirSync(dir).sort()) { if (n === 'node_modules') continue; const p = path.join(dir, n), rel = path.posix.join(base, n); if (fs.statSync(p).isDirectory()) walk(p, rel, out); else if (textFiles.test(n) && !(base === '' && n === 'README.md') && !/\.(png|jpg)$/i.test(n)) out.push([rel, p]); } }
for (const m of MODS) { const out = []; walk(path.join(SRC, m[0]), '', out); EX[m[0]] = out.map(([rel, p]) => { let t = fs.readFileSync(p, 'utf8'); if (t.length > 60000) t = t.slice(0, 60000) + '\n…(đã cắt bớt)'; return { p: rel, l: (rel.match(/\.(\w+)$/) || [, 'txt'])[1].toLowerCase(), t }; }); }
const exSet = new Set(Object.entries(EX).flatMap(([m, a]) => a.map(e => m + '/' + e.p)));
const copiedImg = new Set();
function resolveLink(href, ctx) {
  if (/^(https?:)?\/\//i.test(href)) { try { const h = new URL(href, 'https://x').hostname; if (/github|shields\.io|githubusercontent/i.test(h)) return null; } catch (e) { return null; } return href; }
  if (/^mailto:/i.test(href)) return href;
  if (href.startsWith('#')) return `#/d/${ctx.id}/${slug(decodeURIComponent(href.slice(1)))}`;
  const [pp, hash] = href.split('#'); const full = path.posix.normalize(path.posix.join(ctx.dir, decodeURI(pp))).replace(/\/$/, '');
  const mm = full.match(/^(\d\d-[a-z-]+)(\/README\.md)?$/); if (mm && ALLDOC[mm[1]]) return `#/d/${mm[1]}` + (hash ? '/' + slug(decodeURIComponent(hash)) : '');
  for (const [id, f] of Object.entries(ALLDOC)) if (f.replace(/\\/g, '/') === full) return `#/d/${id}` + (hash ? '/' + slug(decodeURIComponent(hash)) : '');
  if (exSet.has(full)) { const i = full.indexOf('/'); return `#/x/${full.slice(0, i)}/${encodeURIComponent(full.slice(i + 1))}`; }
  const dm = full.match(/^(\d\d-[a-z-]+)\/(.+)$/); if (dm && EX[dm[1]]) { const hit = EX[dm[1]].find(e => e.p.startsWith(dm[2] + '/')); if (hit) return `#/x/${dm[1]}/${encodeURIComponent(hit.p)}`; }
  return null;
}
function renderDoc(id, file, mm) {
  const md = fs.readFileSync(path.join(SRC, file), 'utf8'), ctx = { id, dir: path.posix.dirname(file.replace(/\\/g, '/')) }, toc = [], mer = []; let h1 = '';
  const r = new marked.Renderer();
  r.heading = (text, level, raw) => { const s = slug(raw); if (level === 1 && !h1) { h1 = raw; return ''; } if (level <= 3) toc.push({ id: 'h-' + s, t: raw.replace(/[`*_]/g, ''), l: level }); return `<h${level} id="h-${s}">${text}</h${level}>\n`; };
  r.code = (code, info) => { const lang = (info || '').split(/\s/)[0]; if (lang === 'mermaid') { mer.push(code); return `<div data-mmd="${mer.length - 1}"></div>\n`; } return `<pre><code${lang ? ` class="language-${lang.replace(/[^\w-]/g, '')}"` : ''}>${code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>\n`; };
  r.link = (href, title, text) => { const h = resolveLink(href, ctx); return h ? `<a href="${h}"${/^https?:/.test(h) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>` : text; };
  r.image = (href, title, text) => { if (/^(https?:)?\/\//i.test(href)) return ''; const src = path.join(SRC, ctx.dir, decodeURI(href)); if (!fs.existsSync(src)) return ''; const n = path.basename(src); if (!copiedImg.has(n)) { fs.copyFileSync(src, path.join(IMG, n)); copiedImg.add(n); } return `<img src="img/${n}" alt="${(text || '').replace(/"/g, '&quot;')}" loading="lazy">`; };
  let html = marked.parse(md, { renderer: r, gfm: true, breaks: false });
  html = sanitizeHtml(html, { allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'details', 'summary', 'h1', 'h2', 'h3', 'kbd', 'figure', 'figcaption', 'mark', 'del', 'input', 'sup', 'sub']), allowedAttributes: { a: ['href', 'target', 'rel', 'title'], img: ['src', 'alt', 'loading'], code: ['class'], div: ['data-mmd'], th: ['align'], td: ['align'], input: ['type', 'checked', 'disabled'], '*': ['id'] }, allowedSchemes: ['http', 'https', 'mailto'], allowProtocolRelative: false, allowedSchemesAppliedToAttributes: ['href', 'src'], exclusiveFilter: f => f.tag === 'img' && !/^img\//.test(f.attribs.src || '') });
  const plain = html.replace(/<pre[\s\S]*?<\/pre>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
  return { id, title: h1 || id, html, toc, mer, words: plain.split(' ').length, plain };
}
(async () => {
  const docs = [...MODS.map(m => renderDoc(m[0], ALLDOC[m[0]], m)), ...DOCS.map(d => renderDoc(d[0], d[3]))];
  // ---- Mermaid → SVG dựng sẵn
  const total = docs.reduce((a, d) => a + d.mer.length, 0); let bad = 0;
  const b = await chromium.launch(), pg = await b.newPage(); await pg.setContent('<html><body></body></html>'); await pg.addScriptTag({ path: require.resolve('mermaid/dist/mermaid.min.js') });
  await pg.evaluate(() => mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict', fontFamily: 'system-ui, sans-serif', htmlLabels: false, flowchart: { useMaxWidth: true, htmlLabels: false }, sequence: { useMaxWidth: true } }));
  let n = 0;
  for (const d of docs) {
    const svgs = [];
    for (const code of d.mer) { const id = 'mmd' + (n++); try { const svg = await pg.evaluate(async ([id, c]) => (await mermaid.render(id, c)).svg, [id, code]); svgs.push(svg.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/ on\w+="[^"]*"/g, '')); } catch (e) { bad++; console.warn('Mermaid lỗi ở', d.id, String(e.message || e).slice(0, 80)); svgs.push(null); } await pg.evaluate(() => document.querySelectorAll('[id^=dmmd],[id^=mmd]').forEach(x => x.remove())); }
    d.html = d.html.replace(/<div data-mmd="(\d+)"><\/div>/g, (m, i) => svgs[i] ? `<figure class="mmd">${svgs[i]}</figure>` : `<pre><code>${d.mer[i].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`);
  }
  await b.close(); console.log('Mermaid:', total - bad, '/', total, 'sơ đồ đã dựng');
  // ---- ghi file
  const search = [];
  for (const d of docs) {
    fs.writeFileSync(path.join(CONTENT, d.id + '.json'), JSON.stringify({ id: d.id, title: d.title, html: d.html, toc: d.toc, words: d.words }));
    const parts = d.html.split(/(?=<h2 id=")/); for (const p of parts) { const m = p.match(/^<h2 id="([^"]+)">([\s\S]*?)<\/h2>/); const t = p.replace(/<figure class="mmd">[\s\S]*?<\/figure>/g, ' ').replace(/<pre[\s\S]*?<\/pre>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim(); search.push([d.id, m ? m[1] : '', m ? m[2].replace(/<[^>]+>/g, '') : d.title, t.slice(0, 1500)]); }
  }
  fs.writeFileSync(path.join(CONTENT, 'search.json'), JSON.stringify(search)); fs.writeFileSync(path.join(CONTENT, 'examples.json'), JSON.stringify(EX));
  const title = Object.fromEntries(docs.map(d => [d.id, d.title]));
  fs.writeFileSync(path.join(CONTENT, 'index.json'), JSON.stringify({ modules: MODS.map(m => ({ id: m[0], icon: m[1], t: m[2], desc: m[3], lvl: m[4], min: m[5], src: title[m[0]], words: docs.find(d => d.id === m[0]).words, ex: EX[m[0]].length })), docs: DOCS.map(d => ({ id: d[0], icon: d[1], t: d[2], src: title[d[0]], words: docs.find(x => x.id === d[0]).words })) }));
  console.log('Xong:', docs.length, 'tài liệu,', Object.values(EX).reduce((a, x) => a + x.length, 0), 'file mẫu,', copiedImg.size, 'ảnh');
})();
