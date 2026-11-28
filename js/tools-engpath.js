// EngPath: bảng học tiếng Anh hằng ngày (điểm danh, kế hoạch, gõ câu, từ vựng, ngữ pháp, đọc dịch, phát âm, dictation), trang riêng app/engpath/, lưu localStorage `ep_state`.
(function () {
  GV.register({
    id: 'engpath', type: 'tool', cat: 'Học tập', name: 'EngPath – Học tiếng Anh', icon: '📒',
    desc: 'Bảng học tiếng Anh mỗi ngày phong cách sổ tay giấy: điểm danh chuỗi ngày, kế hoạch hôm nay, học qua gõ câu, flashcard từ vựng, trắc nghiệm ngữ pháp, đọc & dịch song ngữ, luyện phát âm, dictation/shadowing, từ điển nhỏ và lộ trình theo chương. Dữ liệu lưu trên máy bạn. Mở ở trang riêng.',
    mount(el) {
      const url = 'app/engpath/';
      el.innerHTML = `<div class="tool" style="text-align:center;padding:40px 16px"><div style="font-size:3rem">📒</div><p>Đang mở EngPath ở trang riêng…</p><p><a class="btn" href="${url}">Mở ngay</a></p></div>`;
      const t = setTimeout(() => location.replace(url), 60);
      return () => clearTimeout(t);
    }
  });
})();
