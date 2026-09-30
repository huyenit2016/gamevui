// Lớp giao diện Material 3: hiệu ứng ripple (gợn sóng) + nút nổi FAB. Chỉ là giao diện, không đụng logic.
(function () {
  const SEL = '.btn,.card,.rc,.tabs button,.chips button,.rail button,.bnav button,.bnav a,.icon-btn,.acct,.fab,.vbar .btn';
  document.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    const t = e.target.closest && e.target.closest(SEL); if (!t || t.disabled) return;
    const r = t.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2, s = document.createElement('span');
    s.className = 'rip'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    t.appendChild(s); setTimeout(() => s.remove(), 650);
  }, { passive: true });
  const fab = document.getElementById('fab'); // nút nổi = cùng hành động "Chơi ngẫu nhiên" của trang chủ
  if (fab) fab.addEventListener('click', () => { const b = document.getElementById('rand'); if (b) b.click(); });
})();
