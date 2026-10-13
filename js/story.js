// Trang công khai story.html: ?s=<slug> hiển thị 1 câu chuyện; không có slug thì liệt kê các story đã xuất bản.
(function () {
  const app = document.getElementById('app'), S = window.GVStory, esc = S.esc;
  const q = new URLSearchParams(location.search), slug = (q.get('s') || location.hash.replace(/^#\/?/, '')).toLowerCase();
  const msg = (t, d) => { app.className = ''; app.innerHTML = `<div class="sx-msg"><div><h1>${esc(t)}</h1>${esc(d || '')}<p><a href="story.html">← Tất cả câu chuyện</a> · <a href="./">GameVui</a></p></div></div>`; };
  const setMeta = (name, content, prop) => { let m = document.querySelector(`meta[${prop ? 'property' : 'name'}="${name}"]`); if (!m) { m = document.createElement('meta'); m.setAttribute(prop ? 'property' : 'name', name); document.head.appendChild(m); } m.content = content || ''; };
  async function main() {
    let db;
    try { ({ db } = await GV.fbInfo().fb()); } catch (e) { return msg('Chưa kết nối được máy chủ', GV.fbInfo().explain(e)); }
    if (!slug) return index(db);
    if (!S.SLUG_RE.test(slug)) return msg('Không tìm thấy câu chuyện', 'Đường dẫn không hợp lệ.');
    const id = (await db.ref('stories/slugs/' + slug).once('value')).val();
    if (!id) return msg('Không tìm thấy câu chuyện', 'Câu chuyện này không tồn tại hoặc đã bị gỡ.');
    let meta, data;
    try { [meta, data] = (await Promise.all([db.ref('stories/meta/' + id).once('value'), db.ref('stories/data/' + id).once('value')])).map(s => s.val()); }
    catch (e) { return msg('Câu chuyện chưa được xuất bản', 'Bạn không có quyền xem bản nháp này.'); }
    if (!meta || !data) return msg('Không tìm thấy câu chuyện', 'Câu chuyện này chưa được xuất bản.');
    let story; try { story = JSON.parse(data); } catch (e) { return msg('Dữ liệu câu chuyện bị lỗi'); }
    document.title = meta.title + ' – GameVui'; setMeta('description', meta.desc); setMeta('og:title', meta.title, 1); setMeta('og:description', meta.desc, 1);
    if (meta.cover && /^https?:\/\//i.test(meta.cover)) setMeta('og:image', meta.cover, 1);
    S.mount(app, story); window.scrollTo(0, 0);
    if (location.hash && story.blocks.some(b => b.anchor === location.hash.slice(1))) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
  }
  async function index(db) {
    const all = (await db.ref('stories/meta').once('value')).val() || {};
    const list = Object.values(all).filter(m => m && m.pub === true && m.slug).sort((a, b) => (b.pubAt || b.at || 0) - (a.pubAt || a.at || 0));
    document.title = 'Câu chuyện – GameVui'; app.className = '';
    app.innerHTML = `<div class="sx-ix"><h1>📖 Câu chuyện</h1><p class="s">Những trang kể chuyện bằng hình ảnh và chuyển động.</p>${list.length ? `<div class="sx-g">${list.map(m => `<a class="sx-c" href="story.html?s=${esc(encodeURIComponent(m.slug))}"><i style="--img:${/^https?:\/\//i.test(m.cover || '') ? `url('${esc(S.url(m.cover))}')` : 'none'}"></i><b>${esc(m.title)}</b><span>${esc(m.desc || '')}</span></a>`).join('')}</div>` : '<p>Chưa có câu chuyện nào được xuất bản.</p>'}</div>`;
  }
  main().catch(e => msg('Có lỗi xảy ra', GV.fbInfo().explain(e)));
})();
