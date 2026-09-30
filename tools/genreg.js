const ROOT = require('path').resolve(__dirname, '..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + ROOT + '/index.html'); await p.waitForTimeout(400);
  const reg = await p.evaluate(() => GV.items.map(i => ({ id: i.id, name: i.name, icon: i.icon, type: i.type, cat: i.cat })));
  require('fs').writeFileSync(ROOT + '/js/registry.js', '// Danh sách game/tiện ích (CMS dùng để chọn bật/tắt, mục nổi bật). Tạo lại khi thêm game mới.\nwindow.GV_REGISTRY = ' + JSON.stringify(reg) + ';\n');
  console.log(reg.length, 'items'); await b.close();
})();
