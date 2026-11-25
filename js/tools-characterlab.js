// Character Lab 3D: hệ thống hiển thị nhân vật PBR (nạp GLB của người dùng), trang riêng games/character-lab/.
(function () {
  GV.register({
    id: 'characterlab', type: 'tool', cat: 'Sáng tạo', name: 'Character Lab 3D', icon: '🧬',
    desc: 'Nạp nhân vật GLB/GLTF (MetaHuman, Character Creator, Blender, Maya) để xem với ánh sáng PBR, da tán xạ dưới da, hoạt ảnh trộn idle/đi/chạy, biểu cảm ARKit, nhép môi, chế độ điện ảnh và báo cáo kiểm định hiệu năng. Tệp chỉ xử lý trong trình duyệt của bạn. Mở ở trang riêng.',
    mount(el) {
      const url = 'games/character-lab/';
      el.innerHTML = `<div class="tool" style="text-align:center;padding:40px 16px"><div style="font-size:3rem">🧬</div><p>Đang mở Character Lab 3D ở trang riêng…</p><p><a class="btn" href="${url}">Mở ngay</a></p></div>`;
      const t = setTimeout(() => location.replace(url), 60);
      return () => clearTimeout(t);
    }
  });
})();
