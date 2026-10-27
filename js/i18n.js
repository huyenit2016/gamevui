// Chọn ngôn ngữ giao diện khung (thanh trên, thanh trái/dưới, trang chủ): Anh / Việt. Lưu `gv_lang` (mặc định en như bản thiết kế).
// Dùng: thẻ có data-i18n="khoá" (text), data-i18n-html (HTML tin cậy), data-i18n-ph (placeholder), data-i18n-al (aria-label); mã JS gọi GV.t('khoá').
(function () {
  const D = {
    en: {
      'nav.home': 'Dashboard', 'nav.game': 'Game Hub', 'nav.online': 'Multiplayer', 'nav.crypto': 'Crypto Trading', 'nav.merit': 'Mindful Merit', 'nav.learn': 'Learning Platform', 'nav.tool': 'Utilities & Tools',
      'nb.crypto': 'Crypto', 'nb.learn': 'Learning', 'acc.in': 'Sign in', 'acc.out': 'Account', 'acc.guest': 'GUEST',
      'title.home': 'Main Dashboard', 'btn.room': 'Create Room', 'notif': 'Notifications', 'notif.none': 'No notifications.', 'search': 'Search games & tools…',
      'rw.a': 'OmniHub Portal: Active', 'rw.b': 'Saved on this device · no account needed',
      'h.pill': 'Next-Gen Interface', 'h.h1': 'Welcome to the <span class="grad">OmniHub Metaverse</span>',
      'h.sub': 'Experience seamless integration of online multiplayer games, live crypto analytics, utility engines, and interactive learning in a 3D environment.',
      'h.rand': 'Random Game', 'h.explore': 'Explore Games',
      'st': '<b>{ng}</b> games · <b>{tools}</b> tools · <b>{online}</b> multiplayer games · free, no install needed',
      'mx.lib': 'Game Library', 'mx.lib.s': '{n} multiplayer games', 'mx.tool': 'Utility Tools', 'mx.tool.s': '{n} learning modules', 'mx.fav': 'Favorites', 'mx.fav.s1': 'Saved on this device', 'mx.fav.s0': 'Tap ⭐ to save a game', 'mx.rec': 'Recently Played', 'mx.rec.s0': 'No games played yet',
      'm1.t': 'Cyber Game Hub', 'm1.p': 'Play multiplayer mini-games with friends, with room chat and voice chat built in.', 'm1.go': 'Launch Arcade',
      'm2.t': '3D Crypto Terminal', 'm2.p': 'Scan coins, read technical indicators, and plan entries, take-profit, stop-loss and leverage.', 'm2.go': 'Analyze Now',
      'm3.t': 'Utility Power Tools', 'm3.p': 'Language lessons, Rubik solver, block coding, audiobooks and everyday tools in one place.', 'm3.go': 'Open Utilities',
      'tw.t': 'Interactive Utility Workstation', 'tw.s': 'Live functional productivity and developer tools', 'sec.hot': 'Trending Now', 'sec.hot.s': 'Featured picks – open and play instantly', 'sec.rec': 'Recently Played', 'sec.rec.s': 'Pick up where you left off', 'fab': 'Play Random', 'fab.al': 'Play a random game', 'lang.al': 'Language'
    },
    vi: {
      'nav.home': 'Trang chủ', 'nav.game': 'Game', 'nav.online': 'Bạn bè', 'nav.crypto': 'Crypto AI', 'nav.merit': 'Tích đức', 'nav.learn': 'Học tập', 'nav.tool': 'Tiện ích',
      'nb.crypto': 'Crypto AI', 'nb.learn': 'Học tập', 'acc.in': 'Đăng nhập', 'acc.out': 'Tài khoản', 'acc.guest': 'KHÁCH',
      'title.home': 'Bảng điều khiển', 'btn.room': 'Tạo phòng', 'notif': 'Thông báo', 'notif.none': 'Chưa có thông báo.', 'search': 'Tìm game, tiện ích…',
      'rw.a': 'Cổng OmniHub: Hoạt động', 'rw.b': 'Tự lưu trên máy bạn · không cần tài khoản',
      'h.pill': 'Giao diện thế hệ mới', 'h.h1': 'Chào mừng đến <span class="grad">Vũ trụ OmniHub</span>',
      'h.sub': 'Trải nghiệm game chơi cùng bạn bè, phân tích crypto trực tiếp, công cụ tiện ích và học tập tương tác – tất cả trong một giao diện 3D.',
      'h.rand': 'Chơi ngẫu nhiên', 'h.explore': 'Khám phá kho game',
      'st': '<b>{ng}</b> game · <b>{tools}</b> tiện ích · <b>{online}</b> game chơi cùng bạn bè · miễn phí, không cần cài đặt',
      'mx.lib': 'Kho game', 'mx.lib.s': '{n} game chơi cùng bạn bè', 'mx.tool': 'Tiện ích', 'mx.tool.s': '{n} mục học tập', 'mx.fav': 'Yêu thích', 'mx.fav.s1': 'Đã lưu trên máy bạn', 'mx.fav.s0': 'Chạm ⭐ để lưu game', 'mx.rec': 'Vừa chơi', 'mx.rec.s0': 'Chưa chơi game nào',
      'm1.t': 'Trung tâm game', 'm1.p': 'Chơi game mini cùng bạn bè, có chat và voice chat ngay trong phòng.', 'm1.go': 'Vào phòng',
      'm2.t': 'Trạm phân tích Crypto', 'm2.p': 'Quét coin, xem chỉ báo kỹ thuật, lên kế hoạch điểm vào – chốt lời – cắt lỗ và đòn bẫy.', 'm2.go': 'Phân tích ngay',
      'm3.t': 'Bộ công cụ tiện ích', 'm3.p': 'Bài học ngoại ngữ, giải Rubik, lập trình khối lệnh, sách nói và công cụ hằng ngày trong một chỗ.', 'm3.go': 'Mở tiện ích',
      'tw.t': 'Bàn làm việc tiện ích tương tác', 'tw.s': 'Công cụ năng suất và lập trình dùng được ngay', 'sec.hot': 'Đang hot', 'sec.hot.s': 'Những lựa chọn nổi bật – mở lên là chơi ngay', 'sec.rec': 'Chơi gần đây', 'sec.rec.s': 'Tiếp tục từ chỗ bạn đã dừng', 'fab': 'Chơi ngẫu nhiên', 'fab.al': 'Chơi ngẫu nhiên một game', 'lang.al': 'Ngôn ngữ'
    }
  };
  let lang = 'en'; try { const v = localStorage.getItem('gv_lang'); if (v === 'vi' || v === 'en') lang = v; } catch (e) {}
  const t = (k, o) => { let s = (D[lang] && D[lang][k]) || D.en[k] || k; if (o) for (const x in o) s = s.split('{' + x + '}').join(o[x]); return s; };
  function apply(root) {
    root = root || document; document.documentElement.lang = lang;
    root.querySelectorAll('[data-i18n]').forEach(n => { n.textContent = t(n.dataset.i18n); });
    root.querySelectorAll('[data-i18n-html]').forEach(n => { n.innerHTML = t(n.dataset.i18nHtml); });
    root.querySelectorAll('[data-i18n-ph]').forEach(n => { n.placeholder = t(n.dataset.i18nPh); });
    root.querySelectorAll('[data-i18n-al]').forEach(n => { n.setAttribute('aria-label', t(n.dataset.i18nAl)); n.title = t(n.dataset.i18nAl); });
    const b = document.getElementById('lang'); if (b) b.textContent = lang === 'en' ? 'EN' : 'VI';
  }
  function set(l) { lang = l === 'vi' ? 'vi' : 'en'; try { localStorage.setItem('gv_lang', lang); } catch (e) {} apply(); document.dispatchEvent(new CustomEvent('gv:lang', { detail: lang })); }
  // app.js tạo GV sau file này → để sẵn ở window.GV_I18N, app.js chép sang GV (GV.t, GV.lang, GV.setLang, GV.i18nApply)
  window.GV_I18N = { t, lang: () => lang, setLang: set, i18nApply: apply };
  document.addEventListener('click', e => { if (e.target.closest('#lang')) set(lang === 'en' ? 'vi' : 'en'); });
  apply();
})();
