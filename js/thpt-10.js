// Nội dung lớp 10 (CT GDPT 2018) – tự biên soạn: tóm tắt lý thuyết, bài tập mẫu có lời giải, trắc nghiệm.
GV.thpt.add(10, [
/* ================= TOÁN ================= */
{ id: 'toan', name: 'Toán', icon: '📐', chapters: [
 { n: 'Chương I. Mệnh đề và tập hợp', lessons: [
  { id: 'menhde', n: 'Mệnh đề', theory: `**Mệnh đề** là câu khẳng định đúng hoặc sai (không thể vừa đúng vừa sai).
• Phủ định của P kí hiệu P̄: P đúng thì P̄ sai và ngược lại.
• **Mệnh đề kéo theo** P ⇒ Q chỉ sai khi P đúng và Q sai. Mệnh đề đảo của P ⇒ Q là Q ⇒ P.
• **Tương đương** P ⇔ Q: đúng khi P và Q cùng đúng hoặc cùng sai.
• Kí hiệu ∀ (với mọi), ∃ (tồn tại). Phủ định của "∀x: P(x)" là "∃x: không P(x)"; phủ định của "∃x: P(x)" là "∀x: không P(x)".`,
   ex: [
    { q: 'Xét tính đúng sai và lập mệnh đề phủ định của "∀x ∈ ℝ, x² ≥ 0".', s: 'Bình phương của mọi số thực đều không âm nên mệnh đề đúng.\nPhủ định: "∃x ∈ ℝ, x² < 0" (mệnh đề sai).', a: 'Đúng; phủ định: ∃x ∈ ℝ, x² < 0' },
    { q: 'Cho mệnh đề "Nếu a chia hết cho 6 thì a chia hết cho 3". Phát biểu mệnh đề đảo và xét tính đúng sai.', s: 'Mệnh đề đảo: "Nếu a chia hết cho 3 thì a chia hết cho 6".\nLấy a = 3: chia hết cho 3 nhưng không chia hết cho 6 → mệnh đề đảo sai.', a: 'Đảo sai (phản ví dụ a = 3)' },
    { q: 'Lập phủ định của "∃x ∈ ℝ: x² − x + 1 = 0" và cho biết mệnh đề nào đúng.', s: 'Phủ định: "∀x ∈ ℝ: x² − x + 1 ≠ 0".\nTa có Δ = 1 − 4 = −3 < 0 nên phương trình vô nghiệm → mệnh đề gốc sai, phủ định đúng.', a: 'Phủ định đúng' }] },
  { id: 'taphop', n: 'Tập hợp và các phép toán', theory: `• A ∩ B: các phần tử thuộc cả A và B. A ∪ B: thuộc A hoặc B. A \\ B: thuộc A nhưng không thuộc B.
• Công thức đếm: |A ∪ B| = |A| + |B| − |A ∩ B|.
• Các tập con của ℝ: đoạn [a; b], khoảng (a; b), nửa khoảng [a; b), (a; b], (a; +∞)…`,
   ex: [
    { q: 'Cho A = {1; 2; 3; 4}, B = {3; 4; 5; 6}. Tìm A ∩ B, A ∪ B, A \\ B.', s: 'Phần tử chung: 3 và 4.\nGộp tất cả phần tử khác nhau: 1, 2, 3, 4, 5, 6.\nA \\ B gồm phần tử của A không thuộc B: 1, 2.', a: 'A∩B = {3;4}; A∪B = {1;…;6}; A\\B = {1;2}' },
    { q: 'Lớp có 40 học sinh, 25 em thích bóng đá, 20 em thích bóng chuyền, 8 em thích cả hai. Có bao nhiêu em không thích môn nào?', s: 'Số em thích ít nhất một môn: 25 + 20 − 8 = 37.\nSố em không thích môn nào: 40 − 37 = 3.', a: '3 học sinh' },
    { q: 'Tìm [−2; 3] ∩ (1; 5) và [−2; 3] ∪ (1; 5).', s: 'Biểu diễn trên trục số: phần chung nằm từ 1 (không lấy) đến 3 (lấy) → (1; 3].\nPhần hợp phủ từ −2 (lấy) đến 5 (không lấy) → [−2; 5).', a: '(1; 3] và [−2; 5)' }] }
 ]},
 { n: 'Chương II–III. Bất phương trình bậc nhất hai ẩn, hàm số bậc hai', lessons: [
  { id: 'bpt2an', n: 'Bất phương trình bậc nhất hai ẩn', theory: `Miền nghiệm của bất phương trình ax + by ≤ c (hoặc <, ≥, >) là một nửa mặt phẳng có bờ là đường thẳng d: ax + by = c.
• Bước 1: vẽ đường thẳng d (nét liền nếu có dấu "=", nét đứt nếu không).
• Bước 2: lấy một điểm không nằm trên d (thường là O(0; 0)) thay vào bất phương trình.
• Bước 3: nếu đúng, miền nghiệm là nửa mặt phẳng chứa điểm đó; nếu sai, là nửa mặt phẳng còn lại.`,
   ex: [
    { q: 'Xác định miền nghiệm của bất phương trình x + 2y ≤ 4.', s: 'Đường thẳng d: x + 2y = 4 đi qua (4; 0) và (0; 2).\nThay O(0; 0): 0 ≤ 4 đúng → miền nghiệm là nửa mặt phẳng bờ d chứa gốc O, kể cả bờ.', a: 'Nửa mặt phẳng bờ d chứa O (kể cả bờ)' },
    { q: 'Điểm (1; 1) có thuộc miền nghiệm của hệ { x + y ≥ 1; 2x − y ≤ 3; x ≥ 0 } không?', s: 'x + y = 2 ≥ 1 ✓.\n2x − y = 1 ≤ 3 ✓.\nx = 1 ≥ 0 ✓.\nThoả cả ba bất phương trình.', a: 'Có' }] },
  { id: 'hsbachai', n: 'Hàm số bậc hai', theory: `Hàm số y = ax² + bx + c (a ≠ 0) có đồ thị là parabol.
• Đỉnh I(−b/(2a); −Δ/(4a)), với Δ = b² − 4ac. Trục đối xứng x = −b/(2a).
• a > 0: bề lõm hướng lên, hàm có giá trị nhỏ nhất tại đỉnh. a < 0: bề lõm hướng xuống, có giá trị lớn nhất tại đỉnh.
• Giao Oy tại (0; c). Giao Ox: nghiệm của ax² + bx + c = 0.`,
   ex: [
    { q: 'Khảo sát y = x² − 4x + 3: đỉnh, giao điểm với các trục, giá trị nhỏ nhất.', s: 'a = 1, b = −4, c = 3.\nHoành độ đỉnh: x = 4/2 = 2; y = 4 − 8 + 3 = −1 → I(2; −1).\nGiao Oy: (0; 3). Giao Ox: x² − 4x + 3 = 0 ⇒ x = 1 hoặc x = 3.\nVì a > 0 nên giá trị nhỏ nhất là −1 tại x = 2.', a: 'I(2;−1); Ox: (1;0),(3;0); Oy: (0;3); min = −1' },
    { q: 'Xác định parabol y = ax² + bx + 2 đi qua A(1; 0) và B(−1; 6).', s: 'A: a + b + 2 = 0 ⇒ a + b = −2.\nB: a − b + 2 = 6 ⇒ a − b = 4.\nCộng hai vế: 2a = 2 ⇒ a = 1; suy ra b = −3.\nKiểm tra: y(1) = 1 − 3 + 2 = 0 ✓; y(−1) = 1 + 3 + 2 = 6 ✓.', a: 'y = x² − 3x + 2' },
    { q: 'Tìm giá trị lớn nhất của y = −x² + 2x + 3.', s: 'a = −1 < 0 nên hàm có giá trị lớn nhất tại đỉnh.\nx = −b/(2a) = −2/(−2) = 1; y = −1 + 2 + 3 = 4.', a: 'max = 4 tại x = 1' }] },
  { id: 'bptbachai', n: 'Dấu của tam thức bậc hai – Bất phương trình bậc hai', theory: `Tam thức f(x) = ax² + bx + c, Δ = b² − 4ac.
• Δ < 0: f(x) cùng dấu với a với mọi x.
• Δ = 0: f(x) cùng dấu với a trừ x = −b/(2a) (khi đó f = 0).
• Δ > 0 (hai nghiệm x₁ < x₂): f(x) trái dấu a trong khoảng (x₁; x₂), cùng dấu a ngoài đoạn [x₁; x₂].
Quy tắc nhớ: "trong trái, ngoài cùng".`,
   ex: [
    { q: 'Giải bất phương trình x² − 5x + 6 > 0.', s: 'x² − 5x + 6 = 0 ⇒ x = 2 hoặc x = 3. Vì a = 1 > 0, tam thức dương ngoài đoạn [2; 3].', a: 'x < 2 hoặc x > 3' },
    { q: 'Giải −x² + 4x − 3 ≥ 0.', s: '−x² + 4x − 3 = 0 ⇒ x² − 4x + 3 = 0 ⇒ x = 1 hoặc x = 3. Vì a = −1 < 0, tam thức không âm trong đoạn [1; 3].', a: '1 ≤ x ≤ 3' },
    { q: 'Tìm m để x² − 2mx + m + 2 > 0 với mọi x ∈ ℝ.', s: 'Vì a = 1 > 0 nên cần Δ\' < 0.\nΔ\' = m² − (m + 2) = m² − m − 2 = (m − 2)(m + 1) < 0 ⇒ −1 < m < 2.', a: '−1 < m < 2' }] }
 ]},
 { n: 'Chương IV–V. Hệ thức lượng trong tam giác, vectơ', lessons: [
  { id: 'hethuc', n: 'Hệ thức lượng trong tam giác', theory: `Tam giác ABC có a = BC, b = CA, c = AB; R bán kính ngoại tiếp, r bán kính nội tiếp, p = (a+b+c)/2.
• **Định lí côsin**: a² = b² + c² − 2bc·cosA.
• **Định lí sin**: a/sinA = b/sinB = c/sinC = 2R.
• **Diện tích**: S = ½·bc·sinA = abc/(4R) = p·r; công thức Heron S = √[p(p−a)(p−b)(p−c)].`,
   ex: [
    { q: 'Tam giác ABC có b = 3, c = 4, A = 60°. Tính a và diện tích S.', s: 'a² = 9 + 16 − 2·3·4·cos60° = 25 − 12 = 13 ⇒ a = √13.\nS = ½·3·4·sin60° = 6·(√3/2) = 3√3.', a: 'a = √13; S = 3√3' },
    { q: 'Tam giác có ba cạnh 13, 14, 15. Tính S, r, R.', s: 'p = (13+14+15)/2 = 21.\nS = √[21·8·7·6] = √7056 = 84.\nr = S/p = 84/21 = 4.\nR = abc/(4S) = 2730/336 = 65/8.', a: 'S = 84; r = 4; R = 65/8' },
    { q: 'Tam giác ABC có a = 10, A = 30°. Tính bán kính đường tròn ngoại tiếp.', s: 'Theo định lí sin: 2R = a/sinA = 10/0,5 = 20 ⇒ R = 10.', a: 'R = 10' }] },
  { id: 'vecto', n: 'Vectơ và toạ độ vectơ', theory: `• Cộng, trừ vectơ; tích vectơ với một số. Với a = (x₁; y₁), b = (x₂; y₂): a + b = (x₁+x₂; y₁+y₂), k·a = (kx₁; ky₁).
• Độ dài |a| = √(x₁² + y₁²).
• **Tích vô hướng**: a·b = |a||b|cos(a, b) = x₁x₂ + y₁y₂. a ⊥ b ⇔ a·b = 0.
• Trung điểm M của AB: M((x_A+x_B)/2; (y_A+y_B)/2).`,
   ex: [
    { q: 'Cho a = (1; 2), b = (3; −1). Tính a + b, a − b, a·b, |a|.', s: 'a + b = (4; 1); a − b = (−2; 3).\na·b = 1·3 + 2·(−1) = 1.\n|a| = √(1 + 4) = √5.', a: '(4;1); (−2;3); 1; √5' },
    { q: 'Tính góc giữa hai vectơ a = (1; 0) và b = (1; 1).', s: 'cos = a·b/(|a||b|) = 1/(1·√2) = √2/2 ⇒ góc 45°.', a: '45°' },
    { q: 'Tìm toạ độ trung điểm M của đoạn AB với A(1; 2), B(3; 6).', s: 'x = (1+3)/2 = 2; y = (2+6)/2 = 4.', a: 'M(2; 4)' }] }
 ]},
 { n: 'Chương VI–IX. Thống kê, tổ hợp, toạ độ, xác suất', lessons: [
  { id: 'thongke', n: 'Các số đặc trưng của mẫu số liệu', theory: `• Số trung bình x̄ = (x₁ + … + xₙ)/n. Trung vị: giá trị chính giữa khi sắp xếp. Mốt: giá trị xuất hiện nhiều nhất.
• Khoảng biến thiên R = max − min. Khoảng tứ phân vị ΔQ = Q₃ − Q₁.
• **Phương sai** s² = [(x₁−x̄)² + … + (xₙ−x̄)²]/n; **độ lệch chuẩn** s = √s².`,
   ex: [{ q: 'Mẫu số liệu: 2, 4, 4, 6, 9. Tìm số trung bình, trung vị, mốt, phương sai, độ lệch chuẩn.', s: 'x̄ = (2+4+4+6+9)/5 = 25/5 = 5.\nTrung vị (giá trị thứ 3) = 4. Mốt = 4.\nTổng bình phương độ lệch: 9 + 1 + 1 + 1 + 16 = 28 ⇒ s² = 28/5 = 5,6.\ns = √5,6 ≈ 2,37.', a: 'x̄ = 5; Me = 4; Mo = 4; s² = 5,6; s ≈ 2,37' }] },
  { id: 'tohop', n: 'Quy tắc đếm, hoán vị, chỉnh hợp, tổ hợp', theory: `• Quy tắc cộng (làm 1 trong các cách) và quy tắc nhân (làm liên tiếp các bước).
• Hoán vị n phần tử: n! cách. Chỉnh hợp chập k: A(n,k) = n!/(n−k)! (có thứ tự). Tổ hợp chập k: C(n,k) = n!/[k!(n−k)!] (không thứ tự).
• Nhị thức Newton: (a + b)ⁿ = Σ C(n,k)·aⁿ⁻ᵏ·bᵏ.`,
   ex: [
    { q: 'Có bao nhiêu cách xếp 5 người thành một hàng ngang?', s: 'Mỗi cách là một hoán vị của 5 người: 5! = 120.', a: '120' },
    { q: 'Chọn 3 bạn trong 10 bạn đi trực nhật (không phân biệt vai trò). Có bao nhiêu cách?', s: 'Không quan tâm thứ tự nên là tổ hợp: C(10,3) = 10·9·8/(3·2·1) = 120.', a: '120' },
    { q: 'Chọn lớp trưởng, lớp phó, thư kí từ 10 bạn (mỗi bạn giữ nhiều nhất một chức). Bao nhiêu cách?', s: 'Có thứ tự (vai trò khác nhau): A(10,3) = 10·9·8 = 720.', a: '720' },
    { q: 'Khai triển (x + 1)⁴.', s: 'Hệ số C(4,k): 1, 4, 6, 4, 1.\n(x + 1)⁴ = x⁴ + 4x³ + 6x² + 4x + 1.', a: 'x⁴ + 4x³ + 6x² + 4x + 1' }] },
  { id: 'toado', n: 'Phương pháp toạ độ trong mặt phẳng', theory: `• Đường thẳng Δ có vectơ pháp tuyến n = (a; b) đi qua M₀(x₀; y₀): a(x − x₀) + b(y − y₀) = 0, tức ax + by + c = 0.
• Khoảng cách từ M(x₀; y₀) đến Δ: d = |ax₀ + by₀ + c|/√(a² + b²).
• Đường tròn tâm I(a; b), bán kính R: (x − a)² + (y − b)² = R².
• Phương trình x² + y² − 2ax − 2by + c = 0 là đường tròn khi a² + b² − c > 0, bán kính R = √(a² + b² − c).`,
   ex: [
    { q: 'Viết phương trình đường thẳng qua A(1; 2) có vectơ pháp tuyến n = (3; −1).', s: '3(x − 1) − 1(y − 2) = 0 ⇒ 3x − 3 − y + 2 = 0 ⇒ 3x − y − 1 = 0.', a: '3x − y − 1 = 0' },
    { q: 'Tính khoảng cách từ M(2; 1) đến đường thẳng Δ: 3x + 4y − 2 = 0.', s: 'd = |3·2 + 4·1 − 2|/√(9 + 16) = 8/5.', a: '8/5' },
    { q: 'Viết phương trình đường tròn tâm I(1; −2), bán kính 3.', s: '(x − 1)² + (y + 2)² = 9.', a: '(x−1)² + (y+2)² = 9' },
    { q: 'Xác định tâm và bán kính của x² + y² − 2x + 4y − 4 = 0.', s: 'Đưa về −2a = −2 ⇒ a = 1; −2b = 4 ⇒ b = −2; c = −4.\nR² = a² + b² − c = 1 + 4 + 4 = 9 ⇒ R = 3.', a: 'I(1; −2), R = 3' }] },
  { id: 'xacsuat', n: 'Xác suất của biến cố', theory: `• Với phép thử có không gian mẫu Ω gồm các kết quả đồng khả năng: P(A) = n(A)/n(Ω).
• Biến cố đối: P(Ā) = 1 − P(A). Biến cố xung khắc: P(A ∪ B) = P(A) + P(B). Biến cố độc lập: P(AB) = P(A)·P(B).`,
   ex: [
    { q: 'Gieo một con xúc xắc cân đối. Tính xác suất mặt chấm chẵn.', s: 'n(Ω) = 6; các mặt chẵn: 2, 4, 6 ⇒ 3 kết quả. P = 3/6 = 1/2.', a: '1/2' },
    { q: 'Gieo hai đồng xu. Tính xác suất có ít nhất một mặt ngửa.', s: 'Biến cố đối: cả hai sấp, xác suất 1/4. P = 1 − 1/4 = 3/4.', a: '3/4' },
    { q: 'Hộp có 4 bi đỏ, 3 bi xanh. Lấy ngẫu nhiên 2 bi. Tính xác suất hai bi cùng màu.', s: 'n(Ω) = C(7,2) = 21.\nCùng đỏ: C(4,2) = 6; cùng xanh: C(3,2) = 3 ⇒ 9 kết quả thuận lợi.\nP = 9/21 = 3/7.', a: '3/7' }] }
 ]}
], quiz: [
 { q: 'Phủ định của mệnh đề "∃x ∈ ℝ: x² = 2" là:', o: ['∀x ∈ ℝ: x² ≠ 2', '∃x ∈ ℝ: x² ≠ 2', '∀x ∈ ℝ: x² = 2', '∃x ∈ ℝ: x² > 2'], a: 0, e: 'Phủ định của "tồn tại" là "với mọi … không …".' },
 { q: 'Đỉnh của parabol y = x² − 6x + 5 là:', o: ['(3; −4)', '(−3; 4)', '(3; 4)', '(6; 5)'], a: 0, e: 'x = 6/2 = 3; y = 9 − 18 + 5 = −4.' },
 { q: 'Tập nghiệm của x² − 4 < 0 là:', o: ['(−2; 2)', '(−∞; −2) ∪ (2; +∞)', '[−2; 2]', '(−∞; 2)'], a: 0, e: 'Nghiệm ±2, a > 0 nên âm trong khoảng giữa hai nghiệm.' },
 { q: 'Tam giác ABC có a = 7, b = 8, c = 9. Giá trị cosA bằng:', o: ['2/3', '1/2', '11/14', '3/4'], a: 0, e: 'cosA = (b² + c² − a²)/(2bc) = (64 + 81 − 49)/144 = 96/144 = 2/3.' },
 { q: 'C(6,2) bằng:', o: ['15', '12', '30', '20'], a: 0, e: 'C(6,2) = 6·5/2 = 15.' },
 { q: 'Khoảng cách từ O(0;0) đến đường thẳng 3x + 4y − 10 = 0 là:', o: ['2', '10', '5', '1'], a: 0, e: 'd = |−10|/5 = 2.' }
]},

/* ================= VẬT LÍ ================= */
{ id: 'ly', name: 'Vật lí', icon: '⚡', chapters: [
 { n: 'Động học', lessons: [
  { id: 'thangdeu', n: 'Chuyển động thẳng đều', theory: `• Tốc độ trung bình v = s/t. Chuyển động thẳng đều: vận tốc không đổi, phương trình x = x₀ + v·t.
• Đổi đơn vị: 1 m/s = 3,6 km/h.
• Hai vật chuyển động ngược chiều gặp nhau: lập hiệu toạ độ x₁ = x₂ để tìm thời điểm gặp.`,
   ex: [
    { q: 'Xe đi 90 km trong 1,5 giờ. Tính tốc độ theo km/h và m/s.', s: 'v = 90/1,5 = 60 km/h.\nĐổi: 60/3,6 ≈ 16,7 m/s.', a: '60 km/h ≈ 16,7 m/s' },
    { q: 'Hai xe A, B cách nhau 100 km, đi ngược chiều về phía nhau với vA = 40 km/h, vB = 60 km/h. Sau bao lâu thì gặp nhau? Chỗ gặp cách A bao xa?', s: 'Tốc độ tiến lại gần nhau: 40 + 60 = 100 km/h.\nThời gian gặp: t = 100/100 = 1 h.\nChỗ gặp cách A: 40·1 = 40 km.', a: 't = 1 h; cách A 40 km' }] },
  { id: 'bdd', n: 'Chuyển động thẳng biến đổi đều', theory: `Gia tốc a không đổi.
• v = v₀ + a·t
• s = v₀·t + ½·a·t²
• v² − v₀² = 2·a·s
Chuyển động nhanh dần: a cùng dấu v; chậm dần: a ngược dấu v.`,
   ex: [
    { q: 'Xe bắt đầu chạy từ nghỉ với gia tốc 2 m/s². Sau 5 s vận tốc và quãng đường là bao nhiêu?', s: 'v = 0 + 2·5 = 10 m/s.\ns = ½·2·5² = 25 m.', a: 'v = 10 m/s; s = 25 m' },
    { q: 'Ô tô đang chạy 20 m/s thì hãm phanh với a = −4 m/s². Tính thời gian dừng và quãng đường hãm.', s: 'Dừng khi v = 0: t = (0 − 20)/(−4) = 5 s.\nTừ v² − v₀² = 2as: s = (0 − 400)/(2·(−4)) = 50 m.', a: 't = 5 s; s = 50 m' }] },
  { id: 'roitudo', n: 'Rơi tự do và chuyển động ném ngang', theory: `**Rơi tự do**: chỉ chịu trọng lực, gia tốc g ≈ 9,8 m/s² (thường lấy 10). Từ nghỉ: v = g·t, h = ½·g·t², v² = 2gh.
**Ném ngang** với v₀ từ độ cao h: theo phương ngang chuyển động đều, theo phương thẳng đứng rơi tự do.
• Thời gian bay t = √(2h/g). Tầm xa L = v₀·t = v₀·√(2h/g).`,
   ex: [
    { q: 'Thả vật từ độ cao 80 m (g = 10 m/s²). Tính thời gian rơi và vận tốc khi chạm đất.', s: 't = √(2h/g) = √(160/10) = 4 s.\nv = g·t = 40 m/s.', a: 't = 4 s; v = 40 m/s' },
    { q: 'Ném ngang vật với v₀ = 10 m/s từ độ cao 20 m (g = 10). Tính thời gian bay và tầm xa.', s: 't = √(2·20/10) = 2 s.\nL = v₀·t = 10·2 = 20 m.', a: 't = 2 s; L = 20 m' }] }
 ]},
 { n: 'Động lực học', lessons: [
  { id: 'newton', n: 'Ba định luật Newton', theory: `• Định luật 1 (quán tính): hợp lực bằng 0 thì vật đứng yên hoặc chuyển động thẳng đều.
• Định luật 2: a = F/m (F là hợp lực), hay F = m·a. Đơn vị lực: N = kg·m/s².
• Định luật 3: lực và phản lực cùng phương, ngược chiều, cùng độ lớn, đặt lên hai vật khác nhau.
• Trọng lực P = m·g. Lực ma sát trượt F_ms = μ·N.`,
   ex: [
    { q: 'Vật m = 2 kg chịu hợp lực 6 N. Tính gia tốc.', s: 'a = F/m = 6/2 = 3 m/s².', a: '3 m/s²' },
    { q: 'Kéo vật 5 kg trên sàn ngang bằng lực 20 N, lực ma sát 5 N. Tính gia tốc.', s: 'Hợp lực: F − F_ms = 20 − 5 = 15 N.\na = 15/5 = 3 m/s².', a: '3 m/s²' },
    { q: 'Vật 10 kg trượt trên sàn ngang, hệ số ma sát μ = 0,2, g = 10. Tính lực ma sát trượt.', s: 'N = P = m·g = 100 N.\nF_ms = μ·N = 0,2·100 = 20 N.', a: '20 N' }] }
 ]},
 { n: 'Năng lượng, động lượng, chuyển động tròn', lessons: [
  { id: 'nangluong', n: 'Công, công suất, động năng, thế năng, cơ năng', theory: `• Công A = F·s·cosα (J). Công suất P = A/t (W).
• Động năng W_đ = ½·m·v². Thế năng trọng trường W_t = m·g·h.
• Cơ năng W = W_đ + W_t. Khi chỉ có trọng lực tác dụng, cơ năng bảo toàn.
• Hiệu suất H = A_có ích / A_toàn phần.`,
   ex: [
    { q: 'Lực 50 N kéo vật dịch chuyển 10 m cùng hướng lực. Tính công.', s: 'α = 0 nên A = F·s = 50·10 = 500 J.', a: '500 J' },
    { q: 'Thả vật 2 kg từ độ cao 5 m (g = 10). Tính vận tốc khi chạm đất và động năng lúc đó.', s: 'Bảo toàn cơ năng: m·g·h = ½·m·v² ⇒ v = √(2gh) = √100 = 10 m/s.\nW_đ = ½·2·100 = 100 J (bằng m·g·h = 100 J).', a: 'v = 10 m/s; W_đ = 100 J' },
    { q: 'Cần cẩu nâng vật 200 kg lên cao 10 m trong 20 s (g = 10). Tính công suất có ích.', s: 'A = m·g·h = 200·10·10 = 20 000 J.\nP = A/t = 20 000/20 = 1000 W.', a: '1000 W' }] },
  { id: 'dongluong', n: 'Động lượng và định luật bảo toàn động lượng', theory: `• Động lượng p = m·v (kg·m/s), là đại lượng vectơ.
• Hệ kín: tổng động lượng bảo toàn: m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'.
• Va chạm mềm: hai vật dính vào nhau sau va chạm, chuyển động cùng vận tốc V: (m₁ + m₂)V = m₁v₁ + m₂v₂.`,
   ex: [
    { q: 'Viên bi 0,2 kg chuyển động 5 m/s. Tính động lượng.', s: 'p = m·v = 0,2·5 = 1 kg·m/s.', a: '1 kg·m/s' },
    { q: 'Vật m₁ = 2 kg, v₁ = 3 m/s va chạm mềm vào vật m₂ = 1 kg đang đứng yên. Tính vận tốc sau va chạm.', s: 'Bảo toàn động lượng: 2·3 + 0 = (2 + 1)·V ⇒ V = 6/3 = 2 m/s.', a: '2 m/s' }] },
  { id: 'tron', n: 'Chuyển động tròn đều', theory: `• Tốc độ góc ω = Δφ/Δt (rad/s); chu kì T = 2π/ω; tần số f = 1/T.
• Tốc độ dài v = ω·r.
• Gia tốc hướng tâm a_ht = v²/r = ω²·r.`,
   ex: [{ q: 'Chất điểm chuyển động tròn đều bán kính 0,5 m, chu kì 2 s. Tính ω, v, a_ht.', s: 'ω = 2π/T = π rad/s ≈ 3,14 rad/s.\nv = ω·r = π·0,5 ≈ 1,57 m/s.\na_ht = ω²·r = π²·0,5 ≈ 4,93 m/s².', a: 'ω = π rad/s; v ≈ 1,57 m/s; a ≈ 4,93 m/s²' }] }
 ]}
], quiz: [
 { q: 'Một vật rơi tự do từ độ cao 45 m (g = 10). Thời gian rơi là:', o: ['3 s', '4,5 s', '9 s', '2 s'], a: 0, e: 't = √(2·45/10) = √9 = 3 s.' },
 { q: 'Vật 4 kg chịu lực 12 N. Gia tốc là:', o: ['3 m/s²', '48 m/s²', '0,33 m/s²', '8 m/s²'], a: 0, e: 'a = F/m = 12/4 = 3.' },
 { q: 'Động năng của vật 2 kg chuyển động 3 m/s là:', o: ['9 J', '6 J', '18 J', '3 J'], a: 0, e: '½·2·9 = 9 J.' },
 { q: 'Đổi 72 km/h sang m/s:', o: ['20', '25', '15', '72'], a: 0, e: '72/3,6 = 20.' },
 { q: 'Trong chuyển động tròn đều, gia tốc hướng:', o: ['Vào tâm quỹ đạo', 'Theo tiếp tuyến', 'Ra xa tâm', 'Bằng 0'], a: 0, e: 'Gia tốc hướng tâm luôn hướng vào tâm.' },
 { q: 'Công suất 500 W thực hiện công trong 10 s là:', o: ['5000 J', '50 J', '510 J', '490 J'], a: 0, e: 'A = P·t = 5000 J.' }
]},

/* ================= HOÁ HỌC ================= */
{ id: 'hoa', name: 'Hoá học', icon: '⚗️', chapters: [
 { n: 'Cấu tạo nguyên tử, bảng tuần hoàn, liên kết', lessons: [
  { id: 'nguyentu', n: 'Thành phần nguyên tử và cấu hình electron', theory: `• Nguyên tử gồm hạt nhân (proton p⁺, neutron n) và vỏ electron (e⁻). Số p = số e = Z; số khối A = Z + N.
• Electron sắp xếp theo mức năng lượng tăng dần: 1s, 2s, 2p, 3s, 3p, 4s, 3d…; tối đa s: 2e, p: 6e, d: 10e.
• Ví dụ Cl (Z = 17): 1s² 2s² 2p⁶ 3s² 3p⁵ (7 electron lớp ngoài cùng).`,
   ex: [
    { q: 'Nguyên tử có Z = 17, A = 35. Tính số neutron, số electron và viết cấu hình electron.', s: 'N = A − Z = 35 − 17 = 18.\nSố e = Z = 17.\nCấu hình: 1s² 2s² 2p⁶ 3s² 3p⁵.', a: 'N = 18; e = 17; 1s²2s²2p⁶3s²3p⁵' },
    { q: 'Viết cấu hình electron của Na (Z = 11) và cho biết là kim loại hay phi kim.', s: '1s² 2s² 2p⁶ 3s¹. Lớp ngoài cùng có 1 electron nên dễ nhường electron → kim loại.', a: '1s²2s²2p⁶3s¹; kim loại' }] },
  { id: 'bth', n: 'Bảng tuần hoàn và xu hướng biến đổi tính chất', theory: `• Số thứ tự ô = Z. Số thứ tự chu kì = số lớp electron. Với nhóm A: số thứ tự nhóm = số electron lớp ngoài cùng.
• Trong một chu kì (trái → phải): bán kính nguyên tử giảm, độ âm điện tăng, tính kim loại giảm, tính phi kim tăng.
• Trong một nhóm A (trên → dưới): bán kính tăng, độ âm điện giảm, tính kim loại tăng.`,
   ex: [
    { q: 'Nguyên tố S (Z = 16) ở ô, chu kì, nhóm nào?', s: 'Cấu hình 1s² 2s² 2p⁶ 3s² 3p⁴: 3 lớp electron ⇒ chu kì 3; 6 electron lớp ngoài cùng ⇒ nhóm VIA; ô số 16.', a: 'Ô 16, chu kì 3, nhóm VIA' },
    { q: 'Sắp xếp Na, Mg, Al theo thứ tự tính kim loại giảm dần.', s: 'Ba nguyên tố cùng chu kì 3, đi từ Na (nhóm IA) đến Al (nhóm IIIA) tính kim loại giảm.', a: 'Na > Mg > Al' }] },
  { id: 'lienket', n: 'Liên kết hoá học', theory: `• **Liên kết ion**: do lực hút tĩnh điện giữa ion dương và ion âm (kim loại điển hình + phi kim điển hình), ví dụ NaCl.
• **Liên kết cộng hoá trị**: dùng chung cặp electron. Không cực khi hai nguyên tử giống nhau (H₂, N₂); có cực khi độ âm điện khác nhau (H₂O, HCl).
• Quy tắc octet: nguyên tử có xu hướng đạt 8 electron lớp ngoài cùng (H: 2).`,
   ex: [
    { q: 'Cho biết loại liên kết trong NaCl, H₂O, N₂.', s: 'NaCl: Na (kim loại) + Cl (phi kim) ⇒ liên kết ion.\nH₂O: O và H dùng chung cặp electron, O âm điện hơn ⇒ cộng hoá trị có cực.\nN₂: hai nguyên tử giống nhau, dùng chung 3 cặp electron ⇒ cộng hoá trị không cực (liên kết ba).', a: 'Ion; CHT có cực; CHT không cực (liên kết ba)' }] }
 ]},
 { n: 'Phản ứng hoá học và năng lượng', lessons: [
  { id: 'oxihoakhu', n: 'Phản ứng oxi hoá – khử', theory: `• Phản ứng oxi hoá – khử có sự thay đổi số oxi hoá. Chất khử nhường electron (số oxi hoá tăng); chất oxi hoá nhận electron (số oxi hoá giảm).
• Số oxi hoá của đơn chất bằng 0; của H thường +1; của O thường −2; tổng số oxi hoá trong phân tử bằng 0.
• Cân bằng theo phương pháp thăng bằng electron: electron cho = electron nhận.`,
   ex: [
    { q: 'Xác định chất khử, chất oxi hoá: Zn + 2HCl → ZnCl₂ + H₂.', s: 'Zn: 0 → +2 (tăng, nhường e) ⇒ Zn là chất khử.\nH: +1 → 0 (giảm, nhận e) ⇒ HCl (H⁺) là chất oxi hoá.', a: 'Chất khử Zn; chất oxi hoá HCl' },
    { q: 'Cân bằng: Al + O₂ → Al₂O₃.', s: 'Al: 0 → +3 (nhường 3e); O₂: 0 → −2 (mỗi O nhận 2e, mỗi O₂ nhận 4e).\nBội chung 12: 4 Al nhường 12e; 3 O₂ nhận 12e.', a: '4Al + 3O₂ → 2Al₂O₃' },
    { q: 'Cho 5,6 g Fe tác dụng hết với dung dịch HCl dư (Fe + 2HCl → FeCl₂ + H₂). Tính thể tích H₂ (đkc: 25 °C, 1 bar, 1 mol khí = 24,79 L).', s: 'n(Fe) = 5,6/56 = 0,1 mol.\nTheo phương trình n(H₂) = n(Fe) = 0,1 mol.\nV = 0,1·24,79 = 2,479 L.', a: '≈ 2,48 L' }] },
  { id: 'nangluonghh', n: 'Năng lượng hoá học và tốc độ phản ứng', theory: `• Biến thiên enthalpy ΔH: ΔH < 0 phản ứng toả nhiệt; ΔH > 0 phản ứng thu nhiệt.
• Tốc độ phản ứng tăng khi: tăng nồng độ, tăng nhiệt độ, tăng diện tích tiếp xúc (nghiền nhỏ), dùng chất xúc tác, tăng áp suất (chất khí).
• Quy tắc van't Hoff: tăng nhiệt độ thêm 10 °C thì tốc độ tăng γ lần (thường γ = 2–4).`,
   ex: [
    { q: 'Phản ứng cháy CH₄ có ΔH = −890 kJ/mol. Đây là phản ứng toả nhiệt hay thu nhiệt? Đốt 0,5 mol CH₄ thì toả bao nhiêu nhiệt?', s: 'ΔH < 0 ⇒ toả nhiệt.\nNhiệt toả ra = 0,5·890 = 445 kJ.', a: 'Toả nhiệt; 445 kJ' },
    { q: 'Một phản ứng có hệ số nhiệt độ γ = 2. Khi tăng nhiệt độ thêm 30 °C thì tốc độ tăng bao nhiêu lần?', s: 'Tăng 30 °C = 3 lần tăng 10 °C ⇒ tốc độ tăng 2³ = 8 lần.', a: '8 lần' }] }
 ]},
 { n: 'Nhóm halogen', lessons: [
  { id: 'halogen', n: 'Halogen (F, Cl, Br, I)', theory: `• Nhóm VIIA, 7 electron lớp ngoài cùng; là phi kim điển hình, tính oxi hoá giảm dần từ F₂ > Cl₂ > Br₂ > I₂.
• Cl₂ phản ứng với kim loại, với H₂ và với dung dịch kiềm: Cl₂ + 2NaOH → NaCl + NaClO + H₂O.
• Halogen mạnh đẩy halogen yếu ra khỏi muối: Cl₂ + 2NaBr → 2NaCl + Br₂.
• Nhận biết ion halide bằng AgNO₃: AgCl (trắng), AgBr (vàng nhạt), AgI (vàng).`,
   ex: [
    { q: 'Hoàn thành phản ứng: Cl₂ + 2KBr → ? và giải thích.', s: 'Cl₂ có tính oxi hoá mạnh hơn Br₂ nên đẩy brom ra khỏi muối:\nCl₂ + 2KBr → 2KCl + Br₂.', a: 'Cl₂ + 2KBr → 2KCl + Br₂' },
    { q: 'Làm thế nào phân biệt dung dịch NaCl và NaI bằng một thuốc thử?', s: 'Dùng dung dịch AgNO₃: NaCl tạo kết tủa AgCl màu trắng; NaI tạo kết tủa AgI màu vàng.', a: 'Dùng AgNO₃ (trắng: NaCl; vàng: NaI)' }] }
 ]}
], quiz: [
 { q: 'Nguyên tử X có 11 proton. Số electron của X là:', o: ['11', '12', '10', '23'], a: 0, e: 'Số e = số p = 11.' },
 { q: 'Nguyên tố nhóm VIIA có số electron lớp ngoài cùng là:', o: ['7', '6', '8', '1'], a: 0, e: 'Nhóm A: số nhóm = số e lớp ngoài cùng.' },
 { q: 'Trong phản ứng Fe + CuSO₄ → FeSO₄ + Cu, chất khử là:', o: ['Fe', 'CuSO₄', 'FeSO₄', 'Cu'], a: 0, e: 'Fe: 0 → +2 (nhường e).' },
 { q: 'Liên kết trong phân tử HCl là:', o: ['Cộng hoá trị có cực', 'Ion', 'Cộng hoá trị không cực', 'Kim loại'], a: 0, e: 'H và Cl khác độ âm điện, dùng chung electron.' },
 { q: 'Phản ứng có ΔH < 0 là phản ứng:', o: ['Toả nhiệt', 'Thu nhiệt', 'Không có nhiệt', 'Oxi hoá khử'], a: 0, e: 'ΔH âm là toả nhiệt.' },
 { q: 'Số mol của 11,2 g Fe (M = 56) là:', o: ['0,2 mol', '2 mol', '0,5 mol', '0,02 mol'], a: 0, e: 'n = 11,2/56 = 0,2.' }
]},

/* ================= TIẾNG ANH ================= */
{ id: 'anh', name: 'Tiếng Anh', icon: '🔤', chapters: [
 { n: 'Ngữ pháp trọng tâm', lessons: [
  { id: 'thi1', n: 'Thì hiện tại đơn và hiện tại tiếp diễn', theory: `• **Present simple**: thói quen, sự thật hiển nhiên. S + V(s/es). Dấu hiệu: always, usually, often, every day…
• **Present continuous**: hành động đang xảy ra / kế hoạch gần. S + am/is/are + V-ing. Dấu hiệu: now, at the moment, Look!, Listen!
• Động từ chỉ trạng thái (know, like, want, love…) thường không dùng ở tiếp diễn.`,
   ex: [
    { q: 'Chia động từ: She ____ (go) to school every day.', s: 'Every day → thói quen → hiện tại đơn; chủ ngữ ngôi thứ ba số ít → thêm -es.', a: 'goes' },
    { q: 'Chia động từ: Look! The children ____ (play) in the park.', s: '"Look!" → đang xảy ra → hiện tại tiếp diễn: are playing.', a: 'are playing' }] },
  { id: 'thi2', n: 'Quá khứ đơn và hiện tại hoàn thành', theory: `• **Past simple**: hành động đã xảy ra và chấm dứt ở thời điểm xác định (yesterday, last year, in 2010, ago).
• **Present perfect**: have/has + V3. Dùng với since, for, already, yet, ever, never, just; hoặc hành động kéo dài đến hiện tại / có kết quả ở hiện tại.
• since + mốc thời gian; for + khoảng thời gian.`,
   ex: [
    { q: 'I ____ (live) in Hanoi since 2015.', s: '"since 2015" → present perfect: have lived.', a: 'have lived' },
    { q: 'They ____ (visit) Hue last summer.', s: '"last summer" là thời điểm xác định trong quá khứ → past simple.', a: 'visited' }] },
  { id: 'tuonglai', n: 'Tương lai: will và be going to', theory: `• **will + V**: quyết định tức thời, dự đoán dựa trên ý kiến (I think…), lời hứa.
• **be going to + V**: kế hoạch đã định, dự đoán dựa trên dấu hiệu hiện tại (Look at those clouds!).`,
   ex: [
    { q: 'Look at those black clouds. It ____ (rain).', s: 'Có dấu hiệu rõ ràng → be going to.', a: 'is going to rain' },
    { q: 'I think she ____ (pass) the exam.', s: '"I think" → dự đoán chủ quan → will.', a: 'will pass' }] },
  { id: 'cond', n: 'Câu điều kiện loại 1 và 2', theory: `• **Loại 1** (có thể xảy ra ở hiện tại/tương lai): If + S + V(hiện tại đơn), S + will + V.
• **Loại 2** (không có thật ở hiện tại): If + S + V-ed / were, S + would + V. Với động từ be, dùng "were" cho mọi ngôi.`,
   ex: [
    { q: 'If it rains tomorrow, we ____ (stay) at home.', s: 'Điều kiện có thể xảy ra → loại 1: will stay.', a: 'will stay' },
    { q: 'If I ____ (be) you, I would study harder.', s: 'Giả định trái thực tế → loại 2, dùng were.', a: 'were' }] },
  { id: 'bidong', n: 'Câu bị động', theory: `Cấu trúc: S + be + V3 (+ by O). Chuyển từ chủ động: tân ngữ → chủ ngữ; chia "be" theo thì của câu chủ động.
• Hiện tại đơn: am/is/are + V3. Quá khứ đơn: was/were + V3. Hiện tại hoàn thành: have/has been + V3. Tương lai: will be + V3.`,
   ex: [
    { q: 'Chuyển sang bị động: People speak English all over the world.', s: 'Hiện tại đơn → is spoken.', a: 'English is spoken all over the world.' },
    { q: 'Chuyển sang bị động: They built this bridge in 1990.', s: 'Quá khứ đơn → was built.', a: 'This bridge was built in 1990.' }] },
  { id: 'giantiep', n: 'Câu tường thuật', theory: `Khi tường thuật ở quá khứ, lùi thì: hiện tại đơn → quá khứ đơn; hiện tại tiếp diễn → quá khứ tiếp diễn; will → would; can → could; đổi đại từ và trạng từ (now → then, today → that day, tomorrow → the next day).
• Câu hỏi Wh-: S + asked + O + wh-word + S + V (không đảo ngữ).`,
   ex: [
    { q: 'Tường thuật: "I am tired," she said.', s: 'Lùi thì am → was; đổi I → she.', a: 'She said (that) she was tired.' },
    { q: 'Tường thuật: "Where do you live?" he asked me.', s: 'Câu hỏi Wh- → không đảo ngữ, lùi thì do live → lived; you → I.', a: 'He asked me where I lived.' }] },
  { id: 'quanhe', n: 'Mệnh đề quan hệ', theory: `• who/that: thay cho người (chủ ngữ). which/that: thay cho vật. whom: người (tân ngữ). whose + N: chỉ sở hữu. where: nơi chốn; when: thời gian.
• Mệnh đề không xác định (có dấu phẩy) không dùng "that".`,
   ex: [
    { q: 'The man ____ lives next door is a doctor.', s: 'Thay cho người, làm chủ ngữ → who / that.', a: 'who (that)' },
    { q: 'This is the book ____ cover is red.', s: 'Chỉ sở hữu "bìa của quyển sách" → whose.', a: 'whose' }] }
 ]},
 { n: 'Từ vựng chủ đề', lessons: [
  { id: 'tuvung', n: 'Từ vựng: gia đình, cơ thể, bình đẳng giới', theory: `• **Gia đình**: household chores (việc nhà), breadwinner (trụ cột kiếm tiền), homemaker (người nội trợ), generation gap (khoảng cách thế hệ), nuclear family (gia đình hạt nhân), extended family (đại gia đình).
• **Sức khoẻ cơ thể**: nutrition (dinh dưỡng), balanced diet (chế độ ăn cân bằng), obesity (béo phì), immune system (hệ miễn dịch), regular exercise (tập luyện đều đặn).
• **Bình đẳng giới**: gender equality (bình đẳng giới), equal opportunity (cơ hội bình đẳng), discrimination (sự phân biệt đối xử), stereotype (định kiến), empower (trao quyền).`,
   ex: [
    { q: 'Điền từ: Nowadays, many fathers share ____ chores with their wives. (household / hospital / holiday)', s: '"chores" đi với "household" → household chores (việc nhà).', a: 'household' },
    { q: 'Chọn từ đúng nghĩa "sự phân biệt đối xử": equality / discrimination / opportunity.', s: 'discrimination = phân biệt đối xử; equality = bình đẳng; opportunity = cơ hội.', a: 'discrimination' }] }
 ]}
], quiz: [
 { q: 'She ____ breakfast at 6.30 every morning.', o: ['has', 'is having', 'have', 'had'], a: 0, e: 'Thói quen → hiện tại đơn, ngôi thứ ba: has.' },
 { q: 'We ____ each other for ten years.', o: ['have known', 'know', 'knew', 'are knowing'], a: 0, e: '"for ten years" → hiện tại hoàn thành.' },
 { q: 'If I had more time, I ____ learn French.', o: ['would', 'will', 'would have', 'am going to'], a: 0, e: 'Câu điều kiện loại 2: would + V.' },
 { q: 'The letter ____ yesterday.', o: ['was sent', 'is sent', 'sent', 'has sent'], a: 0, e: 'Bị động quá khứ đơn: was sent.' },
 { q: 'He said he ____ a new car.', o: ['had bought', 'buys', 'will buy', 'has bought'], a: 0, e: 'Tường thuật lùi thì: "I bought" hoặc "I have bought" → had bought.' },
 { q: 'The girl ____ is sitting there is my sister.', o: ['who', 'which', 'whose', 'whom'], a: 0, e: 'Chỉ người, làm chủ ngữ → who.' }
]},

/* ================= TIN HỌC ================= */
{ id: 'tin', name: 'Tin học', icon: '💻', chapters: [
 { n: 'Thông tin, mạng máy tính, đạo đức', lessons: [
  { id: 'thongtin', n: 'Thông tin, dữ liệu và biểu diễn số', theory: `• Bit là đơn vị nhỏ nhất (0 hoặc 1). 1 byte = 8 bit. 1 KB = 1024 B; 1 MB = 1024 KB; 1 GB = 1024 MB.
• Máy tính dùng hệ nhị phân. Đổi thập phân → nhị phân: chia liên tiếp cho 2, lấy các số dư viết ngược lên. Nhị phân → thập phân: cộng các luỹ thừa của 2 ứng với bit 1.`,
   ex: [
    { q: 'Đổi số 13 sang nhị phân.', s: '13 ÷ 2 = 6 dư 1; 6 ÷ 2 = 3 dư 0; 3 ÷ 2 = 1 dư 1; 1 ÷ 2 = 0 dư 1.\nViết số dư từ dưới lên: 1101.', a: '1101₂' },
    { q: 'Đổi 1011₂ sang thập phân.', s: '1·2³ + 0·2² + 1·2¹ + 1·2⁰ = 8 + 0 + 2 + 1 = 11.', a: '11' },
    { q: '2 GB bằng bao nhiêu MB?', s: '1 GB = 1024 MB nên 2 GB = 2048 MB.', a: '2048 MB' }] },
  { id: 'mang', n: 'Mạng máy tính và Internet', theory: `• Mạng máy tính: nhiều thiết bị được kết nối để chia sẻ dữ liệu và tài nguyên. Phân loại theo phạm vi: LAN (cục bộ), WAN (diện rộng).
• Internet là mạng toàn cầu kết nối các mạng; World Wide Web (WWW) là một dịch vụ chạy trên Internet (các trang web).
• Mỗi thiết bị có địa chỉ IP; tên miền (ví dụ example.com) được DNS chuyển thành địa chỉ IP. Giao thức là bộ quy tắc truyền dữ liệu (HTTP, HTTPS, TCP/IP).`,
   ex: [
    { q: 'Phân biệt Internet và World Wide Web.', s: 'Internet là hạ tầng mạng toàn cầu (cáp, máy chủ, giao thức). WWW là hệ thống các trang web liên kết bằng siêu liên kết, chỉ là một trong nhiều dịch vụ chạy trên Internet (cùng thư điện tử, truyền tệp…).', a: 'Internet là hạ tầng; WWW là một dịch vụ trên Internet' }] },
  { id: 'daoduc', n: 'Đạo đức, pháp luật và an toàn thông tin', theory: `• Tôn trọng bản quyền, không sao chép trái phép; trích dẫn nguồn khi sử dụng tài liệu.
• Mật khẩu mạnh: dài (≥ 12 ký tự), kết hợp chữ hoa, chữ thường, số, ký tự đặc biệt; không dùng thông tin cá nhân dễ đoán; không dùng chung một mật khẩu cho nhiều tài khoản.
• Cảnh giác lừa đảo (phishing): không bấm liên kết lạ, không cung cấp mã OTP cho người khác.`,
   ex: [
    { q: 'Nêu 3 tiêu chí của mật khẩu an toàn.', s: 'Dài và khó đoán; kết hợp nhiều loại ký tự (hoa, thường, số, đặc biệt); mỗi tài khoản một mật khẩu riêng và nên bật xác thực hai lớp.', a: 'Dài; đa dạng ký tự; riêng cho từng tài khoản' }] }
 ]},
 { n: 'Giải quyết vấn đề và lập trình Python', lessons: [
  { id: 'thuattoan', n: 'Thuật toán và sơ đồ khối', theory: `Thuật toán là dãy hữu hạn các bước rõ ràng để giải một bài toán. Có thể mô tả bằng ngôn ngữ tự nhiên, sơ đồ khối hoặc mã giả.
• Ba cấu trúc cơ bản: tuần tự, rẽ nhánh (nếu … thì …), lặp.`,
   ex: [
    { q: 'Mô tả thuật toán tìm số lớn nhất trong ba số a, b, c.', s: 'Bước 1: gán max ← a.\nBước 2: nếu b > max thì max ← b.\nBước 3: nếu c > max thì max ← c.\nBước 4: kết quả là max.', a: 'So sánh lần lượt, giữ giá trị lớn nhất' },
    { q: 'Dùng thuật toán Euclid tìm ƯCLN(48, 18).', s: '48 = 2·18 + 12; 18 = 1·12 + 6; 12 = 2·6 + 0.\nSố dư cuối cùng khác 0 là 6.', a: '6' }] },
  { id: 'python1', n: 'Python cơ bản: biến, nhập xuất, rẽ nhánh, vòng lặp', theory: `• Kiểu dữ liệu: int, float, str, bool. Nhập: input() trả về chuỗi, cần ép kiểu int(...), float(...). Xuất: print().
• Rẽ nhánh: if … elif … else (nhớ thụt đầu dòng).
• Lặp: for i in range(a, b) (từ a đến b−1), while điều_kiện.
• Phép toán: + − * / // (chia lấy phần nguyên) % (chia lấy dư) ** (luỹ thừa).`,
   ex: [
    { q: 'Viết chương trình tính tổng 1 + 2 + … + n.', s: 'Dùng vòng lặp for cộng dồn vào biến tong.\n```\nn = int(input("Nhập n: "))\ntong = 0\nfor i in range(1, n + 1):\n    tong = tong + i\nprint("Tổng =", tong)\n```\nVới n = 5 chương trình in 15.', a: 'Tổng = n(n+1)/2' },
    { q: 'Viết chương trình kiểm tra một số nguyên là chẵn hay lẻ.', s: 'Số chẵn khi chia 2 dư 0.\n```\na = int(input())\nif a % 2 == 0:\n    print("Chẵn")\nelse:\n    print("Lẻ")\n```', a: 'Dùng phép chia lấy dư %' },
    { q: 'In bảng cửu chương của số n.', s: '```\nn = int(input())\nfor i in range(1, 11):\n    print(n, "x", i, "=", n * i)\n```', a: 'Vòng for i từ 1 đến 10' }] },
  { id: 'python2', n: 'Python: danh sách (list) và hàm', theory: `• List: lưu nhiều giá trị, chỉ số từ 0. Thêm phần tử: ds.append(x). Độ dài: len(ds). Hàm có sẵn: sum(ds), max(ds), min(ds).
• Tạo hàm: def tên_hàm(tham_số): … return giá_trị.`,
   ex: [
    { q: 'Cho list ds = [3, 8, 2, 9, 4]. Tìm số lớn nhất và đếm số chẵn.', s: '```\nds = [3, 8, 2, 9, 4]\nprint(max(ds))          # 9\nchan = 0\nfor x in ds:\n    if x % 2 == 0:\n        chan += 1\nprint(chan)             # 3 (8, 2, 4)\n```', a: 'max = 9; có 3 số chẵn' },
    { q: 'Viết hàm binh_phuong(x) trả về bình phương của x.', s: '```\ndef binh_phuong(x):\n    return x * x\n\nprint(binh_phuong(7))   # 49\n```', a: 'return x * x' }] }
 ]},
 { n: 'Ứng dụng tin học', lessons: [
  { id: 'bangtinh', n: 'Phần mềm bảng tính', theory: `• Ô được xác định bởi cột và hàng (A1). Công thức bắt đầu bằng dấu "=".
• Hàm: SUM (tổng), AVERAGE (trung bình), MAX, MIN, COUNT, IF(điều_kiện; giá_trị_đúng; giá_trị_sai).
• Địa chỉ tương đối (A1) thay đổi khi sao chép; địa chỉ tuyệt đối ($A$1) giữ nguyên.`,
   ex: [
    { q: 'Điểm ở ô B2. Viết công thức cho ô C2 cho kết quả "Đạt" nếu B2 ≥ 5, ngược lại "Chưa đạt".', s: 'Dùng hàm IF: =IF(B2>=5;"Đạt";"Chưa đạt") (một số phiên bản dùng dấu phẩy thay cho dấu chấm phẩy).', a: '=IF(B2>=5;"Đạt";"Chưa đạt")' },
    { q: 'Tính điểm trung bình các ô B2 đến B11.', s: '=AVERAGE(B2:B11).', a: '=AVERAGE(B2:B11)' }] }
 ]}
], quiz: [
 { q: '1 byte bằng bao nhiêu bit?', o: ['8', '4', '16', '10'], a: 0, e: '1 byte = 8 bit.' },
 { q: 'Số 101₂ có giá trị thập phân là:', o: ['5', '4', '6', '3'], a: 0, e: '4 + 0 + 1 = 5.' },
 { q: 'Trong Python, biểu thức 17 // 5 cho kết quả:', o: ['3', '3.4', '2', '4'], a: 0, e: '// là chia lấy phần nguyên: 17 // 5 = 3.' },
 { q: 'Kết quả của 17 % 5 trong Python là:', o: ['2', '3', '0', '5'], a: 0, e: '% là chia lấy dư: 17 = 3·5 + 2.' },
 { q: 'Địa chỉ ô nào là địa chỉ tuyệt đối?', o: ['$B$3', 'B3', 'B$3 (chỉ cố định hàng)', 'B:3'], a: 0, e: '$B$3 cố định cả cột và hàng.' },
 { q: 'Thiết bị/dịch vụ chuyển tên miền thành địa chỉ IP là:', o: ['DNS', 'HTTP', 'LAN', 'RAM'], a: 0, e: 'DNS: Domain Name System.' }
]}
]);
