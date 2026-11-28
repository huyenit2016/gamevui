// NihonPath: bảng học tiếng Nhật mỗi ngày (bản tiếng Nhật của EngPath), trang riêng app/nihonpath/, lưu localStorage `jp_state`.
(function () {
  GV.register({
    id: 'nihonpath', type: 'tool', cat: 'Học tập', name: 'NihonPath – Học tiếng Nhật', icon: '🗾',
    desc: 'Bảng học tiếng Nhật mỗi ngày phong cách sổ tay giấy: điểm danh, bảng chữ cái hiragana/katakana có kiểm tra, gõ câu (kanji, kana hoặc romaji), từ vựng N5, trợ từ và mẫu câu, đọc & dịch, phát âm, dictation, từ điển nhỏ và lộ trình. Dữ liệu lưu trên máy bạn. Mở ở trang riêng.',
    mount(el) {
      const url = 'app/nihonpath/';
      el.innerHTML = `<div class="tool" style="text-align:center;padding:40px 16px"><div style="font-size:3rem">🗾</div><p>Đang mở NihonPath ở trang riêng…</p><p><a class="btn" href="${url}">Mở ngay</a></p></div>`;
      const t = setTimeout(() => location.replace(url), 60);
      return () => clearTimeout(t);
    }
  });
})();
