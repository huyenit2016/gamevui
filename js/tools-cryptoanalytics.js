// Crypto Analytics – bản đồ thanh lý Futures: trang riêng app/crypto-analytics/ (chạy song song với "AI-Agent phân tích crypto").
// Link #/tool/crypto-analytics mở thẳng trang đó (location.replace để nút Back không kẹt vòng lặp).
(function () {
  GV.register({
    id: 'crypto-analytics', type: 'tool', cat: 'Tính toán', name: 'Crypto Analytics – Bản đồ thanh lý', icon: '🔥',
    desc: 'Heatmap thanh lý Long/Short ước tính, Open Interest, Funding, biểu đồ nến 5 ô và thanh lý thật realtime từ Binance USDT-M Futures. Chỉ để học tập.',
    mount(el) {
      const url = 'app/crypto-analytics/';
      el.innerHTML = `<div class="tool" style="text-align:center;padding:40px 16px"><div style="font-size:3rem">🔥</div><p>Đang mở Crypto Analytics ở trang riêng…</p><p><a class="btn" href="${url}">Mở ngay</a></p></div>`;
      const t = setTimeout(() => location.replace(url), 60);
      return () => clearTimeout(t);
    }
  });
})();
