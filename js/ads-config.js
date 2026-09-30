// CẤU HÌNH QUẢNG CÁO – chỉnh ở đây, không cần sửa code khác.
//
// 1) Google AdSense (khuyên dùng): điền client (dạng "ca-pub-1234567890123456") và mã các ô quảng cáo (slot) tạo trong AdSense.
//    Lưu ý: AdSense cần website của bạn được duyệt (nên dùng tên miền riêng, có trang Chính sách quyền riêng tư – đã có privacy.html).
// 2) Banner tự chèn (tiếp thị liên kết / nhà tài trợ): thêm vào mảng "custom" các mục { img, url, alt }.
// 3) Nếu để trống cả hai, web hiển thị banner giới thiệu game của chính GameVui (không hiện ô trống).
window.GV_ADS = {
  enabled: true,
  adsense: { client: '', slots: { home: '', inline: '', game: '', footer: '' } },
  custom: [
    // { img: 'https://.../banner-728x90.png', url: 'https://link-tiep-thi-lien-ket', alt: 'Tên nhà tài trợ' },
  ],
  contact: 'Liên hệ đặt quảng cáo: mở Issue tại github.com/huyenit2016/gamevui'
};
