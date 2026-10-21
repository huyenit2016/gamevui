// Lộ trình theo mục tiêu (nội dung tự biên soạn, trỏ tới các bài của kho Claude How To): học AI, ứng dụng mobile, website, kiến trúc giải pháp (SA).
window.CL_TRACKS = [
  {
    id: 'ai', icon: '🧪', t: 'Học AI & dữ liệu', short: 'Notebook, đọc paper, đánh giá mô hình, ứng dụng LLM/RAG',
    intro: 'Dành cho người học Machine Learning, khoa học dữ liệu hoặc xây ứng dụng LLM. Claude Code giúp bạn đọc paper, dựng thí nghiệm lặp lại được và tự động hoá việc đánh giá.',
    steps: [
      ['01-slash-commands', 'Làm quen cách ra lệnh và các lệnh có sẵn (/compact, /model…) trước khi làm việc với dữ liệu lớn.'],
      ['02-memory', 'Ghi vào CLAUDE.md: mô tả bộ dữ liệu, môi trường Python, hạt giống ngẫu nhiên, quy ước đặt tên thí nghiệm để Claude luôn nhớ.'],
      ['05-mcp', 'Nối Claude với nguồn dữ liệu: cơ sở dữ liệu, thư mục tài liệu, công cụ tìm kiếm paper.'],
      ['04-subagents', 'Tạo agent chuyên biệt: nhà nghiên cứu đọc paper, người đánh giá kết quả, chạy song song nhiều giả thuyết.'],
      ['09-advanced-features', 'Planning mode và chế độ suy nghĩ mở rộng cho bài toán nhiều bước (thiết kế thí nghiệm, kiến trúc pipeline).'],
      ['10-cli', 'Chạy không tương tác (claude -p) để đánh giá hàng loạt prompt/mô hình trong script và CI.']],
    projects: [
      ['Trợ lý đọc paper', 'Đọc file papers/bai-bao.pdf và tóm tắt theo cấu trúc: vấn đề, phương pháp, dữ liệu, kết quả, hạn chế. Sau đó đặt cho tôi 5 câu hỏi để kiểm tra mình đã hiểu bài báo chưa.'],
      ['Bộ đánh giá prompt', 'Tạo thư mục eval/ gồm 20 câu hỏi kèm đáp án mẫu, một script Python gọi mô hình để trả lời và chấm điểm, rồi in bảng so sánh giữa hai phiên bản prompt. Hãy lập kế hoạch trước và chờ tôi duyệt.'],
      ['Ứng dụng RAG nhỏ', 'Dựng một ứng dụng RAG tối thiểu bằng Python: nạp thư mục docs/, chia đoạn, tạo embedding, lưu vào vector store cục bộ, kèm giao diện dòng lệnh hỏi đáp có trích nguồn. Viết kế hoạch từng bước trước khi viết mã.']]
  },
  {
    id: 'mobile', icon: '📱', t: 'Ứng dụng mobile', short: 'Flutter, React Native, Swift, Kotlin: dựng, kiểm thử, phát hành',
    intro: 'Dành cho người làm ứng dụng iOS/Android (Flutter, React Native, Swift, Kotlin). Mục tiêu: dựng màn hình nhanh, giữ chất lượng bằng kiểm thử tự động và có quy trình phát hành rõ ràng.',
    steps: [
      ['01-slash-commands', 'Tạo lệnh cho việc lặp lại: tạo màn hình mới, chạy test, dọn dẹp import.'],
      ['02-memory', 'Ghi cấu trúc dự án, lệnh build/chạy máy ảo, quy ước đặt tên và kiến trúc (MVVM/BLoC…) vào CLAUDE.md.'],
      ['08-checkpoints', 'Thử thay đổi lớn về giao diện hoặc điều hướng mà không sợ hỏng: quay lại mốc trước chỉ với một lệnh.'],
      ['06-hooks', 'Hook sau khi sửa file: tự động format, phân tích tĩnh (lint) và chặn commit khi test hỏng.'],
      ['03-skills', 'Đóng gói checklist phát hành lên App Store/Google Play, quy tắc review UI thành skill dùng lại.'],
      ['05-mcp', 'Nối công cụ thiết kế (như Figma), quản lý mã nguồn và dịch vụ phía sau (Firebase, API) để Claude đọc trực tiếp.'],
      ['04-subagents', 'Agent kiểm thử riêng viết widget test/UI test, agent review hiệu năng và quyền riêng tư.']],
    projects: [
      ['Khởi tạo ứng dụng ghi chú', 'Tạo ứng dụng ghi chú đơn giản bằng Flutter (hoặc React Native): danh sách, thêm/sửa/xoá, lưu cục bộ. Hãy lập kế hoạch cấu trúc thư mục và các màn hình trước, sau đó triển khai từng bước kèm test.'],
      ['Thêm đăng nhập', 'Thêm đăng nhập bằng email vào ứng dụng hiện tại theo kiến trúc đang dùng trong CLAUDE.md. Liệt kê các file sẽ sửa, thêm test cho luồng đăng nhập và xử lý lỗi mạng.'],
      ['Checklist phát hành', 'Tạo một skill tên release-checklist: kiểm tra phiên bản, ảnh chụp màn hình, quyền truy cập trong manifest, mô tả cửa hàng và ghi chú phát hành; xuất kết quả dạng danh sách đánh dấu.']]
  },
  {
    id: 'web', icon: '🌐', t: 'Website & web app', short: 'Frontend, backend, kiểm thử, review mã, CI/CD',
    intro: 'Dành cho lập trình web (React/Next.js, Node, Python, PHP…). Tập trung vào quy trình hằng ngày: sửa lỗi, thêm tính năng, review, kiểm thử và triển khai an toàn.',
    steps: [
      ['01-slash-commands', 'Lệnh cho việc thường làm: /commit, /pr, tối ưu hoá, tạo tài liệu API.'],
      ['02-memory', 'CLAUDE.md của dự án: cấu trúc thư mục, lệnh dev/test/build, quy tắc code, cách đặt tên nhánh và commit.'],
      ['06-hooks', 'Hook trước commit: chạy lint, kiểm tra kiểu, quét bí mật (secret scan); hook chặn lệnh nguy hiểm.'],
      ['05-mcp', 'Nối GitHub, cơ sở dữ liệu và trình duyệt tự động (kiểm thử giao diện) để Claude xác minh kết quả.'],
      ['03-skills', 'Skill review mã, tạo bài blog/changelog, chuẩn hoá phong cách viết cho cả nhóm.'],
      ['04-subagents', 'Agent reviewer, test-engineer, debugger làm việc song song và báo cáo lại.'],
      ['07-plugins', 'Đóng gói toàn bộ quy trình web thành plugin để cả nhóm cài một lần.']],
    projects: [
      ['Sửa lỗi có kiểm chứng', 'Có lỗi: <mô tả lỗi và cách tái hiện>. Hãy viết test thất bại tái hiện lỗi trước, sau đó sửa tối thiểu để test qua, và chạy toàn bộ test để chắc không hỏng chỗ khác.'],
      ['Thêm tính năng theo kế hoạch', 'Thêm tính năng <tên tính năng>. Vào planning mode: đọc mã hiện có, đề xuất 2 phương án kèm ưu nhược điểm, chờ tôi chọn rồi mới triển khai theo từng commit nhỏ.'],
      ['Review pull request', 'Review các thay đổi trên nhánh hiện tại so với main: tìm lỗi logic, vấn đề bảo mật, thiếu test, rồi xếp theo mức độ nghiêm trọng và đề xuất cách sửa cụ thể.']]
  },
  {
    id: 'sa', icon: '🏛️', t: 'Kiến trúc giải pháp (SA)', short: 'ADR, đánh giá phương án, sơ đồ, chuẩn hoá cho nhóm',
    intro: 'Dành cho Solution/Software Architect. Dùng Claude Code để ghi lại quyết định kiến trúc, so sánh phương án, vẽ sơ đồ bằng Mermaid, kiểm tra tuân thủ và chuẩn hoá cách làm việc cho cả nhóm.',
    steps: [
      ['02-memory', 'Đưa nguyên tắc kiến trúc, ràng buộc (bảo mật, chi phí, tuân thủ) và danh mục ADR vào CLAUDE.md để mọi đề xuất bám theo.'],
      ['04-subagents', 'Agent "kiến trúc sư" đánh giá phương án, agent bảo mật và agent hiệu năng góp ý độc lập từ nhiều góc nhìn.'],
      ['09-advanced-features', 'Planning mode và suy nghĩ mở rộng: phân tích đánh đổi trước khi chạm vào mã.'],
      ['05-mcp', 'Nối tài liệu nội bộ, hệ thống ticket và cơ sở tri thức để đề xuất dựa trên bối cảnh thật.'],
      ['03-skills', 'Skill sinh ADR/RFC theo mẫu chuẩn và sơ đồ C4/sequence bằng Mermaid.'],
      ['07-plugins', 'Đóng gói bộ công cụ kiến trúc thành plugin để các nhóm dùng thống nhất.']],
    projects: [
      ['Viết ADR', 'Hãy viết một ADR (Architecture Decision Record) cho quyết định: <nêu quyết định, ví dụ chọn hàng đợi tin nhắn>. Gồm bối cảnh, các phương án đã xét, quyết định, hệ quả và rủi ro. Dùng định dạng trong thư mục docs/adr.'],
      ['So sánh phương án kiến trúc', 'Với yêu cầu: <tóm tắt yêu cầu và ràng buộc>, hãy đề xuất 3 phương án kiến trúc, so sánh theo chi phí, độ phức tạp, khả năng mở rộng, bảo mật và rủi ro vận hành; kết luận phương án đề xuất kèm điều kiện.'],
      ['Sơ đồ bằng Mermaid', 'Đọc mã nguồn thư mục src/ và vẽ sơ đồ thành phần (C4 mức container) bằng Mermaid, kèm sơ đồ tuần tự cho luồng đăng nhập; chỉ rõ các phụ thuộc bên ngoài.']]
  }
];
