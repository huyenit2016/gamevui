// Mục "Claude How To" trên OmniHub: giới thiệu và dẫn sang trang học riêng /claude-learning/ (tiến độ đọc từ gv_claude_learning).
(function () {
  GV.register({
    id: 'claude-learning', type: 'tool', cat: 'Học tập', name: 'Claude How To – Học Claude Code', icon: '🎓', desc: 'Học Claude Code bằng tiếng Việt từ cơ bản đến nâng cao: 10 bài, sơ đồ, mẫu copy-paste, lộ trình cho AI, mobile, web, SA. Đọc offline được.',
    mount(el) {
      let done = 0; try { done = Object.values((JSON.parse(localStorage.getItem('gv_claude_learning') || '{}').done) || {}).filter(Boolean).length; } catch (e) {}
      el.innerHTML = `<div class="tool" style="text-align:center;max-width:560px"><div style="font-size:3rem">🎓</div><h2 style="margin:0">Claude How To</h2><p class="hint">Học Claude Code bằng tiếng Việt: lệnh slash, bộ nhớ, skills, hooks, MCP, subagents, plugins; lộ trình riêng cho người học AI, làm ứng dụng mobile, website và kiến trúc giải pháp. Có tìm kiếm, sơ đồ, mẫu copy-paste và bản tải về đọc offline.</p>${done ? `<p>Bạn đã hoàn thành <b>${done}/10</b> bài.</p>` : ''}<a class="btn" href="claude-learning/" style="display:inline-block;text-decoration:none">${done ? 'Học tiếp' : 'Bắt đầu học'} →</a><p class="hint" style="margin-top:14px">Nội dung dựa trên bản dịch của dự án mã nguồn mở Claude How To (giấy phép MIT). Không phải tài liệu chính thức của Anthropic.</p></div>`;
      return () => {};
    }
  });
})();
