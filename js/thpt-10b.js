// Bổ sung nội dung lớp 10 (CT GDPT 2018): thêm bài và câu trắc nghiệm vào các môn đã có ở thpt-10.js. Tự biên soạn.
GV.thpt.extend(10, "toan", {
"chapters": [
{
"n": "Bổ sung. Hàm số, phương trình, đường thẳng, conic, sai số",
"lessons": [
{
"id": "hamso",
"n": "Hàm số: tập xác định, đồ thị, đồng biến – nghịch biến",
"theory": "• Hàm số y = f(x) xác định trên tập D: mỗi x ∈ D có đúng một giá trị y. Tập xác định D là tập các x để f(x) có nghĩa.\n• Điều kiện có nghĩa: mẫu khác 0; biểu thức dưới căn bậc hai ≥ 0.\n• Hàm số đồng biến trên (a; b) nếu x₁ < x₂ ⇒ f(x₁) < f(x₂); nghịch biến nếu x₁ < x₂ ⇒ f(x₁) > f(x₂).\n• Hàm bậc nhất y = ax + b: đồng biến khi a > 0, nghịch biến khi a < 0.",
"ex": [
{
"q": "Tìm tập xác định của y = √(x − 2)/(x − 3).",
"s": "Cần x − 2 ≥ 0 ⇒ x ≥ 2 và x − 3 ≠ 0 ⇒ x ≠ 3.",
"a": "D = [2; +∞) \\ {3}"
},
{
"q": "Xét sự biến thiên của y = −2x + 5.",
"s": "a = −2 < 0 nên hàm số nghịch biến trên ℝ.",
"a": "Nghịch biến trên ℝ"
},
{
"q": "Hàm y = x² đồng biến, nghịch biến trên khoảng nào?",
"s": "Đỉnh parabol tại x = 0, a = 1 > 0: nghịch biến trên (−∞; 0), đồng biến trên (0; +∞).",
"a": "Nghịch biến (−∞;0); đồng biến (0;+∞)"
}
]
},
{
"id": "ptquy",
"n": "Phương trình quy về phương trình bậc hai",
"theory": "Dạng √f(x) = g(x): điều kiện g(x) ≥ 0, bình phương hai vế f(x) = g(x)², giải rồi đối chiếu điều kiện.\nDạng √f(x) = √g(x): giải f(x) = g(x) rồi kiểm tra điều kiện f(x) ≥ 0 (hoặc g(x) ≥ 0).\nLuôn thử lại nghiệm vì bình phương có thể sinh nghiệm ngoại lai.",
"ex": [
{
"q": "Giải √(2x − 3) = x − 3.",
"s": "Điều kiện x − 3 ≥ 0 ⇒ x ≥ 3. Bình phương: 2x − 3 = x² − 6x + 9 ⇒ x² − 8x + 12 = 0 ⇒ x = 2 hoặc x = 6.\nChỉ x = 6 thoả x ≥ 3. Thử: √9 = 3 = 6 − 3 ✓.",
"a": "x = 6"
},
{
"q": "Giải √(x² − 3x + 2) = √(x − 1).",
"s": "x² − 3x + 2 = x − 1 ⇒ x² − 4x + 3 = 0 ⇒ x = 1 hoặc x = 3.\nCả hai đều làm x − 1 ≥ 0. Thử x = 1: 0 = 0 ✓; x = 3: √2 = √2 ✓.",
"a": "x = 1 hoặc x = 3"
}
]
},
{
"id": "duongthang2",
"n": "Vị trí tương đối, góc, phương trình tham số của đường thẳng",
"theory": "• Đường thẳng qua M₀(x₀; y₀) có vectơ chỉ phương u = (u₁; u₂): x = x₀ + u₁t, y = y₀ + u₂t.\n• Hai đường a₁x + b₁y + c₁ = 0 và a₂x + b₂y + c₂ = 0: cắt nhau nếu a₁/a₂ ≠ b₁/b₂; song song nếu a₁/a₂ = b₁/b₂ ≠ c₁/c₂; trùng nhau nếu cả ba tỉ số bằng nhau.\n• Góc φ giữa hai đường (0° ≤ φ ≤ 90°): cosφ = |n₁·n₂|/(|n₁||n₂|).",
"ex": [
{
"q": "Xét vị trí tương đối của x − 2y + 1 = 0 và 2x − 4y + 5 = 0.",
"s": "1/2 = (−2)/(−4) = 1/2, còn 1/5 ≠ 1/2 ⇒ hai đường thẳng song song.",
"a": "Song song"
},
{
"q": "Tính góc giữa x + y − 1 = 0 và x = 0.",
"s": "n₁ = (1; 1), n₂ = (1; 0). cosφ = |1|/(√2·1) = √2/2 ⇒ φ = 45°.",
"a": "45°"
},
{
"q": "Viết phương trình tham số của đường thẳng qua A(1; 2) có vectơ chỉ phương u = (2; −1).",
"s": "x = 1 + 2t, y = 2 − t.",
"a": "x = 1 + 2t; y = 2 − t"
}
]
},
{
"id": "conic",
"n": "Ba đường conic: elip, hypebol, parabol",
"theory": "• **Elip** x²/a² + y²/b² = 1 (a > b > 0): c² = a² − b²; tiêu điểm F₁(−c; 0), F₂(c; 0); độ dài trục lớn 2a, trục nhỏ 2b.\n• **Hypebol** x²/a² − y²/b² = 1: c² = a² + b²; tiêu điểm (±c; 0); tiệm cận y = ±(b/a)x.\n• **Parabol** y² = 2px (p > 0): tiêu điểm F(p/2; 0), đường chuẩn x = −p/2.",
"ex": [
{
"q": "Elip x²/25 + y²/9 = 1: tìm tiêu điểm, độ dài các trục.",
"s": "a² = 25, b² = 9 ⇒ a = 5, b = 3; c² = 25 − 9 = 16 ⇒ c = 4.\nTiêu điểm (±4; 0); trục lớn 10, trục nhỏ 6.",
"a": "F(±4;0); 2a = 10; 2b = 6"
},
{
"q": "Hypebol x²/9 − y²/16 = 1: tìm tiêu điểm và tiệm cận.",
"s": "a = 3, b = 4, c² = 9 + 16 = 25 ⇒ c = 5. Tiêu điểm (±5; 0). Tiệm cận y = ±(4/3)x.",
"a": "F(±5;0); y = ±(4/3)x"
},
{
"q": "Parabol y² = 8x: tìm tiêu điểm và đường chuẩn.",
"s": "2p = 8 ⇒ p = 4. Tiêu điểm F(2; 0), đường chuẩn x = −2.",
"a": "F(2;0); x = −2"
}
]
},
{
"id": "saiso",
"n": "Số gần đúng và sai số",
"theory": "• Nếu a là số gần đúng của số đúng ā thì sai số tuyệt đối Δ = |a − ā|. Thường dùng cận trên d: Δ ≤ d (ghi ā = a ± d).\n• Sai số tương đối δ = Δ/|a| (thường đổi ra %).\n• Quy tròn: chữ số bỏ đi đầu tiên ≥ 5 thì tăng chữ số giữ lại thêm 1; ngược lại giữ nguyên.",
"ex": [
{
"q": "Quy tròn 2,6475 đến hàng phần trăm.",
"s": "Chữ số hàng phần nghìn là 7 ≥ 5 nên làm tròn lên: 2,65.",
"a": "2,65"
},
{
"q": "Đo chiều dài được 12,5 m với sai số tuyệt đối không quá 0,1 m. Tính sai số tương đối.",
"s": "δ ≤ 0,1/12,5 = 0,008 = 0,8%.",
"a": "δ ≤ 0,8%"
}
]
},
{
"id": "qhtt",
"n": "Hệ bất phương trình bậc nhất hai ẩn: tìm giá trị lớn nhất, nhỏ nhất",
"theory": "Giá trị lớn nhất (nhỏ nhất) của F = ax + by trên miền đa giác lồi đạt tại một đỉnh của miền.\nCách làm: vẽ miền nghiệm → tìm toạ độ các đỉnh → tính F tại từng đỉnh → so sánh.",
"ex": [
{
"q": "Trên miền x ≥ 0, y ≥ 0, x + y ≤ 4, x ≤ 3, tìm giá trị lớn nhất và nhỏ nhất của F = 2x + y.",
"s": "Các đỉnh: O(0;0), A(3;0), B(3;1), C(0;4).\nF(O) = 0; F(A) = 6; F(B) = 7; F(C) = 4.\nMax = 7 tại (3; 1); min = 0 tại (0; 0).",
"a": "max = 7 tại (3;1); min = 0 tại (0;0)"
}
]
}
]
}
],
"quiz": [
{
"q": "Tập xác định của y = 1/(x − 1) là:",
"o": [
"ℝ \\ {1}",
"ℝ",
"(1; +∞)",
"[1; +∞)"
],
"a": 0,
"e": "Mẫu khác 0 nên x ≠ 1."
},
{
"q": "Elip x²/16 + y²/9 = 1 có tiêu cự 2c bằng:",
"o": [
"2√7",
"14",
"8",
"6"
],
"a": 0,
"e": "c² = 16 − 9 = 7 ⇒ 2c = 2√7."
},
{
"q": "Phương trình √(x + 2) = x có nghiệm:",
"o": [
"x = 2",
"x = −1",
"x = −1 và x = 2",
"Vô nghiệm"
],
"a": 0,
"e": "x ≥ 0; x + 2 = x² ⇒ x = 2 hoặc −1; loại −1."
},
{
"q": "Làm tròn 3,14159 đến hàng phần nghìn được:",
"o": [
"3,142",
"3,141",
"3,14",
"3,1416"
],
"a": 0,
"e": "Chữ số tiếp theo là 5 nên làm tròn lên."
},
{
"q": "Parabol y² = 12x có tiêu điểm là:",
"o": [
"(3; 0)",
"(6; 0)",
"(12; 0)",
"(0; 3)"
],
"a": 0,
"e": "2p = 12 ⇒ p = 6 ⇒ tiêu điểm (p/2; 0) = (3; 0)."
},
{
"q": "Hai đường thẳng 2x + y − 3 = 0 và 4x + 2y − 1 = 0:",
"o": [
"Song song",
"Cắt nhau",
"Trùng nhau",
"Vuông góc"
],
"a": 0,
"e": "2/4 = 1/2 ≠ −3/−1 nên song song."
}
]
});
GV.thpt.extend(10, "ly", {
"chapters": [
{
"n": "Bổ sung. Động học, lực, cân bằng, biến dạng",
"lessons": [
{
"id": "dichuyen",
"n": "Độ dịch chuyển, vận tốc tổng hợp",
"theory": "• Quãng đường là độ dài đường đi (đại lượng vô hướng); độ dịch chuyển là vectơ nối vị trí đầu và vị trí cuối.\n• Vận tốc trung bình = độ dịch chuyển / thời gian; tốc độ trung bình = quãng đường / thời gian.\n• Tổng hợp vận tốc: v₁₃ = v₁₂ + v₂₃ (cộng vectơ). Hai vận tốc vuông góc: v = √(v₁² + v₂²).",
"ex": [
{
"q": "Một người đi 3 km về hướng đông rồi 4 km về hướng bắc. Tính quãng đường và độ lớn độ dịch chuyển.",
"s": "Quãng đường: 3 + 4 = 7 km.\nĐộ dịch chuyển: √(3² + 4²) = 5 km.",
"a": "7 km; 5 km"
},
{
"q": "Thuyền chạy với vận tốc 4 m/s so với nước, hướng vuông góc dòng; nước chảy 3 m/s so với bờ. Tính độ lớn vận tốc thuyền so với bờ.",
"s": "v = √(4² + 3²) = 5 m/s.",
"a": "5 m/s"
}
]
},
{
"id": "luchuongtam",
"n": "Lực hướng tâm",
"theory": "Vật chuyển động tròn đều chịu hợp lực hướng vào tâm gọi là lực hướng tâm: F_ht = m·a_ht = m·v²/r = m·ω²·r.\nĐây không phải loại lực mới mà là hợp lực (ví dụ lực ma sát nghỉ khi xe vào cua, lực căng dây khi quay vật).",
"ex": [
{
"q": "Xe 1000 kg đi qua đoạn cua tròn bán kính 50 m với tốc độ 10 m/s. Tính lực hướng tâm.",
"s": "F = m·v²/r = 1000·100/50 = 2000 N.",
"a": "2000 N"
}
]
},
{
"id": "momen",
"n": "Mô men lực và cân bằng của vật rắn",
"theory": "• Mô men lực đối với trục quay: M = F·d (N·m), d là cánh tay đòn (khoảng cách từ trục đến giá của lực).\n• Quy tắc mô men: vật rắn có trục quay cố định cân bằng khi tổng mô men làm vật quay theo chiều kim đồng hồ bằng tổng mô men theo chiều ngược lại.\n• Vật chịu hai lực song song cùng chiều: hợp lực F = F₁ + F₂, điểm đặt chia trong theo tỉ lệ nghịch với độ lớn.",
"ex": [
{
"q": "Lực 20 N tác dụng vuông góc với tay cầm cờ lê, cánh tay đòn 0,3 m. Tính mô men.",
"s": "M = F·d = 20·0,3 = 6 N·m.",
"a": "6 N·m"
},
{
"q": "Bập bênh: em bé 30 kg ngồi cách trục 2 m. Em bé 40 kg phải ngồi cách trục bao xa để bập bênh cân bằng?",
"s": "30·g·2 = 40·g·d ⇒ d = 60/40 = 1,5 m.",
"a": "1,5 m"
}
]
},
{
"id": "archimedes",
"n": "Áp suất chất lỏng và lực đẩy Archimedes",
"theory": "• Áp suất p = F/S (Pa). Áp suất do cột chất lỏng ở độ sâu h: p = ρ·g·h; áp suất tổng cộng p = p₀ + ρ·g·h.\n• Lực đẩy Archimedes: F_A = ρ·g·V (V là thể tích phần chất lỏng bị vật chiếm chỗ). Vật nổi khi trọng lượng nhỏ hơn lực đẩy tối đa.",
"ex": [
{
"q": "Vật có thể tích 0,002 m³ nhúng chìm hoàn toàn trong nước (ρ = 1000 kg/m³, g = 10 m/s²). Tính lực đẩy Archimedes.",
"s": "F_A = ρ·g·V = 1000·10·0,002 = 20 N.",
"a": "20 N"
},
{
"q": "Tính áp suất do nước gây ra ở độ sâu 10 m (ρ = 1000, g = 10).",
"s": "p = ρ·g·h = 1000·10·10 = 10⁵ Pa.",
"a": "10⁵ Pa"
}
]
},
{
"id": "hooke",
"n": "Biến dạng của vật rắn – Định luật Hooke; hiệu suất",
"theory": "• Trong giới hạn đàn hồi, lực đàn hồi của lò xo tỉ lệ với độ biến dạng: F_đh = k·|Δl| (k: độ cứng, N/m).\n• Hiệu suất H = (A có ích / A toàn phần)·100% = (P có ích / P toàn phần)·100%.",
"ex": [
{
"q": "Lò xo k = 100 N/m treo vật 0,5 kg (g = 10). Tính độ dãn khi cân bằng.",
"s": "Cân bằng: k·Δl = m·g ⇒ Δl = 5/100 = 0,05 m = 5 cm.",
"a": "5 cm"
},
{
"q": "Động cơ nhận 1000 J năng lượng, sinh công có ích 800 J. Tính hiệu suất.",
"s": "H = 800/1000 = 80%.",
"a": "80%"
}
]
}
]
}
],
"quiz": [
{
"q": "Đi 6 km về phía đông rồi 8 km về phía bắc, độ dịch chuyển có độ lớn:",
"o": [
"10 km",
"14 km",
"2 km",
"48 km"
],
"a": 0,
"e": "√(6² + 8²) = 10."
},
{
"q": "Lò xo k = 200 N/m bị nén 0,05 m. Lực đàn hồi:",
"o": [
"10 N",
"4 N",
"0,25 N",
"100 N"
],
"a": 0,
"e": "F = kΔl = 200·0,05 = 10 N."
},
{
"q": "Mô men của lực 10 N có cánh tay đòn 0,5 m là:",
"o": [
"5 N·m",
"20 N·m",
"0,05 N·m",
"10,5 N·m"
],
"a": 0,
"e": "M = F·d = 5."
},
{
"q": "Vật 0,001 m³ chìm trong nước, g = 10, lực đẩy Archimedes là:",
"o": [
"10 N",
"1 N",
"100 N",
"0,01 N"
],
"a": 0,
"e": "1000·10·0,001 = 10."
},
{
"q": "Lực hướng tâm khi m = 2 kg, v = 3 m/s, r = 1,5 m là:",
"o": [
"12 N",
"9 N",
"6 N",
"18 N"
],
"a": 0,
"e": "F = mv²/r = 2·9/1,5 = 12."
}
]
});
GV.thpt.extend(10, "hoa", {
"chapters": [
{
"n": "Bổ sung. Tính toán hoá học, định luật tuần hoàn, liên kết yếu, hợp chất halogen",
"lessons": [
{
"id": "molnd",
"n": "Mol, nồng độ dung dịch và hiệu suất phản ứng",
"theory": "• n = m/M (mol); với chất khí ở đkc (25 °C, 1 bar): V = n·24,79 (L).\n• Nồng độ mol C_M = n/V (mol/L). Nồng độ phần trăm C% = (m chất tan / m dung dịch)·100%.\n• Hiệu suất H = (lượng thực tế / lượng lí thuyết)·100%.",
"ex": [
{
"q": "Hoà tan 5,85 g NaCl (M = 58,5) vào nước được 500 mL dung dịch. Tính nồng độ mol.",
"s": "n = 5,85/58,5 = 0,1 mol; V = 0,5 L ⇒ C_M = 0,1/0,5 = 0,2 M.",
"a": "0,2 M"
},
{
"q": "Cần bao nhiêu gam NaOH để pha 200 g dung dịch NaOH 10%?",
"s": "m chất tan = 200·10% = 20 g.",
"a": "20 g"
},
{
"q": "Nhiệt phân 100 g CaCO₃ (M = 100) theo CaCO₃ → CaO + CO₂, thu được 50 g CaO (M = 56). Tính hiệu suất.",
"s": "n(CaCO₃) = 1 mol ⇒ lí thuyết thu 1 mol CaO = 56 g.\nH = 50/56 ≈ 89,3%.",
"a": "≈ 89,3%"
}
]
},
{
"id": "dltuanhoan",
"n": "Định luật tuần hoàn, oxide và hydroxide",
"theory": "• Tính chất các nguyên tố và hợp chất biến đổi tuần hoàn theo chiều tăng điện tích hạt nhân.\n• Với nguyên tố nhóm A, hoá trị cao nhất với oxygen bằng số thứ tự nhóm (nhóm IA–VIIA). Hợp chất khí với hydrogen (phi kim nhóm IVA–VIIA) có hoá trị với H bằng 8 − số nhóm.\n• Chu kì 3: Na₂O, MgO là oxide base; Al₂O₃ lưỡng tính; SiO₂, P₂O₅, SO₃, Cl₂O₇ là oxide acid, tính acid tăng dần.",
"ex": [
{
"q": "Nguyên tố X thuộc nhóm VIA. Viết công thức oxide cao nhất và hợp chất khí với hydrogen của X.",
"s": "Hoá trị cao nhất với O là 6 ⇒ XO₃. Hoá trị với H là 8 − 6 = 2 ⇒ H₂X.",
"a": "XO₃ và H₂X"
},
{
"q": "Al (Z = 13) có oxide cao nhất và hydroxide tương ứng là gì, tính chất ra sao?",
"s": "Nhóm IIIA ⇒ oxide cao nhất Al₂O₃, hydroxide Al(OH)₃; cả hai đều lưỡng tính.",
"a": "Al₂O₃, Al(OH)₃ lưỡng tính"
}
]
},
{
"id": "lienketyeu",
"n": "Liên kết hydrogen và tương tác van der Waals",
"theory": "• Liên kết hydrogen hình thành giữa H (liên kết với N, O, F có độ âm điện lớn) và cặp electron của nguyên tử N, O, F ở phân tử khác. Nó làm tăng nhiệt độ sôi, nhiệt độ nóng chảy và độ tan trong nước.\n• Tương tác van der Waals yếu, tăng theo khối lượng phân tử và diện tích tiếp xúc.",
"ex": [
{
"q": "Vì sao H₂O (sôi 100 °C) có nhiệt độ sôi cao hơn H₂S (khoảng −60 °C) dù H₂S nặng hơn?",
"s": "Giữa các phân tử H₂O có liên kết hydrogen bền (O âm điện lớn); H₂S không tạo được liên kết hydrogen đáng kể, chỉ có tương tác van der Waals yếu hơn nhiều.",
"a": "Do liên kết hydrogen giữa các phân tử H₂O"
}
]
},
{
"id": "hcl",
"n": "Hydrogen halide và điều chế chlorine",
"theory": "• Hydrogen halide HX tan trong nước tạo acid; tính acid tăng HF < HCl < HBr < HI (HF là acid yếu).\n• HCl tác dụng với kim loại đứng trước H trong dãy hoạt động: Fe + 2HCl → FeCl₂ + H₂.\n• Điều chế Cl₂ trong phòng thí nghiệm: MnO₂ + 4HCl(đặc) → MnCl₂ + Cl₂ + 2H₂O (đun nóng).\n• Nước Javel (NaCl + NaClO) có tính tẩy trắng, sát khuẩn.",
"ex": [
{
"q": "Cho 8,7 g MnO₂ (M = 87) tác dụng với HCl đặc dư, đun nóng. Tính thể tích Cl₂ (đkc, 24,79 L/mol).",
"s": "n(MnO₂) = 8,7/87 = 0,1 mol ⇒ n(Cl₂) = 0,1 mol.\nV = 0,1·24,79 = 2,479 L.",
"a": "≈ 2,48 L"
},
{
"q": "Viết phản ứng điều chế nước Javel từ Cl₂ và NaOH.",
"s": "Cl₂ + 2NaOH → NaCl + NaClO + H₂O.",
"a": "Cl₂ + 2NaOH → NaCl + NaClO + H₂O"
}
]
}
]
}
],
"quiz": [
{
"q": "Số mol của 4,958 L khí ở đkc (24,79 L/mol) là:",
"o": [
"0,2 mol",
"0,5 mol",
"2 mol",
"0,02 mol"
],
"a": 0,
"e": "4,958/24,79 = 0,2."
},
{
"q": "Hợp chất khí với hydrogen của nguyên tố nhóm VIIA có dạng:",
"o": [
"HX",
"H₂X",
"H₃X",
"H₄X"
],
"a": 0,
"e": "8 − 7 = 1 ⇒ HX."
},
{
"q": "Oxide nào sau đây có tính lưỡng tính?",
"o": [
"Al₂O₃",
"Na₂O",
"SO₃",
"MgO"
],
"a": 0,
"e": "Al₂O₃ vừa tác dụng với acid vừa với base."
},
{
"q": "Dung dịch chứa 0,5 mol chất tan trong 2 L có nồng độ:",
"o": [
"0,25 M",
"1 M",
"0,5 M",
"4 M"
],
"a": 0,
"e": "C_M = 0,5/2 = 0,25."
},
{
"q": "Acid nào mạnh nhất trong các hydrogen halide?",
"o": [
"HI",
"HCl",
"HBr",
"HF"
],
"a": 0,
"e": "Tính acid tăng HF < HCl < HBr < HI."
}
]
});
GV.thpt.extend(10, "anh", {
"chapters": [
{
"n": "Bổ sung. Ngữ pháp nâng cao",
"lessons": [
{
"id": "gerund",
"n": "Danh động từ (V-ing) và động từ nguyên mẫu (to V)",
"theory": "• V-ing sau: enjoy, avoid, mind, finish, keep, suggest, look forward to, be interested in…\n• to V sau: want, decide, hope, plan, agree, promise, refuse, would like…\n• stop + V-ing (ngừng làm gì); stop + to V (dừng lại để làm gì). remember/forget + V-ing (nhớ chuyện đã làm); + to V (nhớ làm việc cần làm).",
"ex": [
{
"q": "She enjoys ____ (read) novels.",
"s": "enjoy + V-ing.",
"a": "reading"
},
{
"q": "He decided ____ (study) abroad.",
"s": "decide + to V.",
"a": "to study"
},
{
"q": "They stopped ____ (talk) when the teacher came in.",
"s": "Ngừng việc đang làm → stop + V-ing.",
"a": "talking"
}
]
},
{
"id": "modal",
"n": "Động từ khuyết thiếu (modal verbs)",
"theory": "• must / have to: bắt buộc; mustn't: cấm; don't have to: không cần thiết.\n• should / ought to: lời khuyên. can / could: khả năng, xin phép. may / might: có thể xảy ra.\n• can't + V: chắc chắn không (suy đoán); must + V: chắc chắn là (suy đoán).",
"ex": [
{
"q": "You ____ wear a seat belt. It is the law. (must / might / needn't)",
"s": "Quy định pháp luật → bắt buộc.",
"a": "must"
},
{
"q": "You ____ see a doctor if the pain continues. (should / can't / mustn't)",
"s": "Lời khuyên → should.",
"a": "should"
},
{
"q": "You ____ wear a uniform at weekends. It isn't required. (mustn't / don't have to / should)",
"s": "Không bắt buộc → don't have to.",
"a": "don't have to"
}
]
},
{
"id": "sosanh",
"n": "So sánh hơn và so sánh nhất",
"theory": "• Tính từ ngắn: -er / the -est (tall → taller → the tallest; big → bigger; happy → happier).\n• Tính từ dài: more / the most + adj (interesting → more interesting → the most interesting).\n• Bất quy tắc: good → better → the best; bad → worse → the worst; far → farther/further.\n• So sánh bằng: as + adj + as.",
"ex": [
{
"q": "This book is ____ (interesting) than that one.",
"s": "Tính từ dài → more interesting.",
"a": "more interesting"
},
{
"q": "He is the ____ (tall) student in our class.",
"s": "So sánh nhất tính từ ngắn → the tallest.",
"a": "tallest"
},
{
"q": "Today is ____ (bad) day of my life.",
"s": "Bất quy tắc: bad → the worst.",
"a": "the worst"
}
]
},
{
"id": "linking",
"n": "Từ nối và cấu tạo từ",
"theory": "• Tương phản: although / though + mệnh đề; despite / in spite of + N/V-ing; however (câu mới), but.\n• Nguyên nhân – kết quả: because + mệnh đề; because of + N; so (do đó); therefore.\n• Cấu tạo từ: danh từ (-tion, -ment, -ness, -er), tính từ (-ful, -ive, -al, -ous), trạng từ (-ly).",
"ex": [
{
"q": "____ it rained heavily, we went out. (Although / Despite / Because)",
"s": "Sau chỗ trống là mệnh đề (it rained) ⇒ Although.",
"a": "Although"
},
{
"q": "He is a very ____ (create) person.",
"s": "Cần tính từ: creative.",
"a": "creative"
},
{
"q": "She was tired. ____, she kept working. (However / Because / So)",
"s": "Hai câu tương phản ⇒ However.",
"a": "However"
}
]
}
]
}
],
"quiz": [
{
"q": "I look forward to ____ you again.",
"o": [
"seeing",
"see",
"to see",
"saw"
],
"a": 0,
"e": "look forward to + V-ing."
},
{
"q": "She is ____ than her sister.",
"o": [
"more careful",
"carefuler",
"most careful",
"the carefulest"
],
"a": 0,
"e": "Tính từ dài dùng more."
},
{
"q": "____ he was ill, he went to work.",
"o": [
"Although",
"Despite",
"Because",
"So"
],
"a": 0,
"e": "Sau chỗ trống là mệnh đề ⇒ although."
},
{
"q": "You ____ smoke here. It is forbidden.",
"o": [
"mustn't",
"don't have to",
"needn't",
"might"
],
"a": 0,
"e": "Cấm ⇒ mustn't."
},
{
"q": "He promised ____ me.",
"o": [
"to help",
"helping",
"help",
"helped"
],
"a": 0,
"e": "promise + to V."
}
]
});
GV.thpt.extend(10, "tin", {
"chapters": [
{
"n": "Bổ sung. Hệ thống máy tính, AI, Python nâng cao, xử lí ảnh",
"lessons": [
{
"id": "maytinh",
"n": "Hệ thống máy tính: phần cứng, phần mềm",
"theory": "• Phần cứng: CPU (xử lí), RAM (bộ nhớ trong, tạm thời, mất dữ liệu khi tắt máy), bộ nhớ ngoài (ổ cứng HDD/SSD, USB), thiết bị vào/ra (bàn phím, chuột, màn hình, máy in).\n• Phần mềm: hệ điều hành (Windows, Android, Linux…) quản lí tài nguyên; phần mềm ứng dụng phục vụ nhu cầu cụ thể (soạn thảo, trình duyệt, trò chơi).",
"ex": [
{
"q": "Phân biệt RAM và ổ cứng.",
"s": "RAM là bộ nhớ trong, tốc độ rất nhanh, chứa chương trình và dữ liệu đang chạy, mất dữ liệu khi tắt nguồn. Ổ cứng là bộ nhớ ngoài, dung lượng lớn, lưu dữ liệu lâu dài khi tắt máy.",
"a": "RAM: tạm thời, nhanh; ổ cứng: lâu dài, dung lượng lớn"
},
{
"q": "Hệ điều hành có vai trò gì?",
"s": "Hệ điều hành điều khiển và quản lí phần cứng, chạy các phần mềm khác và là cầu nối giữa người dùng với máy tính.",
"a": "Quản lí tài nguyên, làm nền cho phần mềm ứng dụng"
}
]
},
{
"id": "ai",
"n": "Trí tuệ nhân tạo và dữ liệu lớn",
"theory": "• Trí tuệ nhân tạo (AI) là khả năng của hệ thống máy tính thực hiện các việc thường cần trí tuệ con người như nhận dạng giọng nói, hình ảnh, dịch thuật, ra quyết định.\n• Học máy: máy học quy luật từ dữ liệu thay vì được lập trình từng quy tắc.\n• Cần dùng AI có trách nhiệm: kiểm chứng thông tin, bảo vệ dữ liệu cá nhân, tránh thiên lệch và lạm dụng (ví dụ ảnh/video giả mạo).",
"ex": [
{
"q": "Nêu 3 ứng dụng của AI trong đời sống.",
"s": "Trợ lí ảo nhận dạng giọng nói; dịch tự động; gợi ý video/sản phẩm; nhận diện khuôn mặt mở khoá điện thoại; xe tự lái…",
"a": "Ví dụ: trợ lí ảo, dịch tự động, gợi ý nội dung"
},
{
"q": "Vì sao cần kiểm chứng thông tin do AI tạo ra?",
"s": "AI có thể đưa ra thông tin sai hoặc thiên lệch vì dữ liệu huấn luyện không hoàn hảo, nên người dùng phải đối chiếu nguồn tin cậy.",
"a": "Vì AI có thể sai hoặc thiên lệch"
}
]
},
{
"id": "python3",
"n": "Python: chuỗi, vòng lặp lồng nhau, tìm kiếm và sắp xếp",
"theory": "• Chuỗi (str): duyệt từng kí tự bằng for ch in s; s.lower(), s.upper(), len(s); phép toán ch in \"aeiou\".\n• Vòng lặp lồng nhau dùng để in hình, xử lí bảng.\n• Tìm kiếm tuần tự: duyệt từng phần tử và so sánh.\n• Sắp xếp nổi bọt (bubble sort): so sánh hai phần tử kề nhau, đổi chỗ nếu sai thứ tự; lặp nhiều lượt.",
"ex": [
{
"q": "Viết chương trình đếm số nguyên âm (a, e, i, o, u) trong một chuỗi.",
"s": "```\ns = input()\ndem = 0\nfor ch in s.lower():\n    if ch in \"aeiou\":\n        dem += 1\nprint(dem)\n```\nVí dụ \"Hello World\" cho kết quả 3 (e, o, o).",
"a": "Duyệt từng kí tự và đếm"
},
{
"q": "In tam giác sao có n dòng, dòng i có i dấu *.",
"s": "```\nn = int(input())\nfor i in range(1, n + 1):\n    print(\"*\" * i)\n```\nVới n = 4 in 1, 2, 3, 4 dấu sao lần lượt.",
"a": "print(\"*\" * i)"
},
{
"q": "Sắp xếp list a = [5, 2, 9, 1] tăng dần bằng sắp xếp nổi bọt.",
"s": "```\na = [5, 2, 9, 1]\nfor i in range(len(a) - 1):\n    for j in range(len(a) - 1 - i):\n        if a[j] > a[j + 1]:\n            a[j], a[j + 1] = a[j + 1], a[j]\nprint(a)\n```\nLượt 1: [2,5,1,9]; lượt 2: [2,1,5,9]; lượt 3: [1,2,5,9].",
"a": "[1, 2, 5, 9]"
}
]
},
{
"id": "xuly_anh",
"n": "Xử lí ảnh số và dung lượng ảnh",
"theory": "• Ảnh số gồm các điểm ảnh (pixel). Độ phân giải = số điểm ảnh theo chiều rộng × chiều cao.\n• Ảnh màu 24 bit: mỗi điểm ảnh dùng 24 bit = 3 byte (đỏ, lục, lam).\n• Dung lượng chưa nén = số điểm ảnh × số byte/điểm ảnh.\n• Thao tác cơ bản trong phần mềm chỉnh sửa ảnh: cắt (crop), xoay, chỉnh sáng – tương phản, lớp (layer).",
"ex": [
{
"q": "Ảnh 1920 × 1080, 24 bit/điểm ảnh. Tính số điểm ảnh và dung lượng chưa nén (theo byte).",
"s": "Số điểm ảnh: 1920·1080 = 2 073 600.\nMỗi điểm ảnh 3 byte ⇒ 2 073 600·3 = 6 220 800 byte (khoảng 5,93 MiB).",
"a": "2 073 600 điểm ảnh; 6 220 800 byte"
}
]
}
]
}
],
"quiz": [
{
"q": "Bộ nhớ nào mất dữ liệu khi tắt máy?",
"o": [
"RAM",
"Ổ cứng SSD",
"USB",
"Thẻ nhớ"
],
"a": 0,
"e": "RAM là bộ nhớ tạm thời."
},
{
"q": "Trong Python, len(\"python\") trả về:",
"o": [
"6",
"5",
"7",
"\"python\""
],
"a": 0,
"e": "Chuỗi có 6 kí tự."
},
{
"q": "Kết quả của print(\"ab\" * 3) là:",
"o": [
"ababab",
"ab3",
"aaabbb",
"Lỗi"
],
"a": 0,
"e": "Nhân chuỗi lặp lại 3 lần."
},
{
"q": "Ảnh màu 24 bit mỗi điểm ảnh chiếm:",
"o": [
"3 byte",
"24 byte",
"1 byte",
"8 byte"
],
"a": 0,
"e": "24 bit = 3 byte."
},
{
"q": "Thuật toán sắp xếp nổi bọt hoạt động bằng cách:",
"o": [
"So sánh và đổi chỗ hai phần tử kề nhau",
"Chia đôi danh sách",
"Tìm phần tử lớn nhất rồi dừng",
"Xoá phần tử trùng"
],
"a": 0,
"e": "Đưa dần phần tử lớn về cuối qua các lượt so sánh cặp kề."
}
]
});
