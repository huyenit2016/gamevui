// AffiPilot AI: công cụ affiliate trong một tệp HTML (chủ gửi), trang riêng app/affipilot/ (dữ liệu lưu localStorage `affi2_*`).
(function () {
  GV.register({
    id: 'affipilot', type: 'tool', cat: 'Kinh doanh', name: 'AffiPilot AI', icon: '🚀',
    desc: 'Công cụ affiliate trọn gói: Dashboard, Deal Hunter chấm điểm sản phẩm, lịch sử giá, nhập/xuất CSV, chiến dịch, 10 mẫu nội dung AI, Video Studio (MediaRecorder), lịch đăng TikTok/Facebook/YouTube, Analytics, sao lưu JSON. Dữ liệu chỉ lưu trên máy bạn. Mở ở trang riêng.',
    mount(el) {
      const url = 'app/affipilot/';
      el.innerHTML = `<div class="tool" style="text-align:center;padding:40px 16px"><div style="font-size:3rem">🚀</div><p>Đang mở AffiPilot AI ở trang riêng…</p><p><a class="btn" href="${url}">Mở ngay</a></p></div>`;
      const t = setTimeout(() => location.replace(url), 60);
      return () => clearTimeout(t);
    }
  });
})();
