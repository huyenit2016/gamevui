// Khoá học có sẵn (từ vựng cơ bản). Mỗi mục: t = từ/cụm từ, r = cách đọc (romaji/pinyin/romanization), m = nghĩa tiếng Việt.
(function () {
  const U = (title, rows) => ({ title, items: rows.map(([t, r, m]) => ({ t, r, m })) });
  GV.learn.BUILTIN = {
    en: { id: 'b-en', lang: 'en', name: 'Tiếng Anh cơ bản', units: [
      U('Chào hỏi', [['Hello', '', 'Xin chào'], ['Goodbye', '', 'Tạm biệt'], ['Thank you', '', 'Cảm ơn'], ['Sorry', '', 'Xin lỗi'], ['Please', '', 'Làm ơn'], ['Good morning', '', 'Chào buổi sáng'], ['Nice to meet you', '', 'Rất vui được gặp bạn'], ['How are you?', '', 'Bạn khỏe không?']]),
      U('Số đếm', [['one', '', 'một'], ['two', '', 'hai'], ['three', '', 'ba'], ['four', '', 'bốn'], ['five', '', 'năm'], ['six', '', 'sáu'], ['seven', '', 'bảy'], ['eight', '', 'tám'], ['nine', '', 'chín'], ['ten', '', 'mười']]),
      U('Gia đình', [['mother', '', 'mẹ'], ['father', '', 'bố'], ['sister', '', 'chị/em gái'], ['brother', '', 'anh/em trai'], ['grandmother', '', 'bà'], ['grandfather', '', 'ông'], ['child', '', 'đứa trẻ'], ['friend', '', 'bạn bè']]),
      U('Ăn uống', [['water', '', 'nước'], ['rice', '', 'cơm/gạo'], ['bread', '', 'bánh mì'], ['coffee', '', 'cà phê'], ['tea', '', 'trà'], ['chicken', '', 'thịt gà'], ['fish', '', 'cá'], ['fruit', '', 'trái cây']]),
      U('Du lịch', [['Where is...?', '', 'Ở đâu...?'], ['How much?', '', 'Bao nhiêu tiền?'], ['toilet', '', 'nhà vệ sinh'], ['hotel', '', 'khách sạn'], ['airport', '', 'sân bay'], ['Help!', '', 'Giúp với!'], ["I don't understand", '', 'Tôi không hiểu'], ['bus', '', 'xe buýt']])
    ] },
    ja: { id: 'b-ja', lang: 'ja', name: 'Tiếng Nhật cơ bản', units: [
      U('Chào hỏi', [['こんにちは', 'konnichiwa', 'Xin chào'], ['おはようございます', 'ohayou gozaimasu', 'Chào buổi sáng'], ['こんばんは', 'konbanwa', 'Chào buổi tối'], ['ありがとう', 'arigatou', 'Cảm ơn'], ['すみません', 'sumimasen', 'Xin lỗi / Xin phép'], ['さようなら', 'sayounara', 'Tạm biệt'], ['はじめまして', 'hajimemashite', 'Rất vui được gặp'], ['お願いします', 'onegaishimasu', 'Làm ơn']]),
      U('Số đếm', [['一', 'ichi', 'một'], ['二', 'ni', 'hai'], ['三', 'san', 'ba'], ['四', 'yon / shi', 'bốn'], ['五', 'go', 'năm'], ['六', 'roku', 'sáu'], ['七', 'nana / shichi', 'bảy'], ['八', 'hachi', 'tám'], ['九', 'kyuu', 'chín'], ['十', 'juu', 'mười']]),
      U('Gia đình', [['母', 'haha', 'mẹ (của mình)'], ['父', 'chichi', 'bố (của mình)'], ['姉', 'ane', 'chị gái'], ['兄', 'ani', 'anh trai'], ['妹', 'imouto', 'em gái'], ['弟', 'otouto', 'em trai'], ['友達', 'tomodachi', 'bạn bè'], ['子供', 'kodomo', 'trẻ em']]),
      U('Ăn uống', [['水', 'mizu', 'nước'], ['ご飯', 'gohan', 'cơm'], ['パン', 'pan', 'bánh mì'], ['コーヒー', 'koohii', 'cà phê'], ['お茶', 'ocha', 'trà'], ['肉', 'niku', 'thịt'], ['魚', 'sakana', 'cá'], ['果物', 'kudamono', 'trái cây']]),
      U('Du lịch', [['どこ', 'doko', 'ở đâu'], ['いくら', 'ikura', 'bao nhiêu tiền'], ['トイレ', 'toire', 'nhà vệ sinh'], ['ホテル', 'hoteru', 'khách sạn'], ['駅', 'eki', 'nhà ga'], ['助けて', 'tasukete', 'giúp với'], ['わかりません', 'wakarimasen', 'tôi không hiểu'], ['バス', 'basu', 'xe buýt']])
    ] },
    ko: { id: 'b-ko', lang: 'ko', name: 'Tiếng Hàn cơ bản', units: [
      U('Chào hỏi', [['안녕하세요', 'annyeonghaseyo', 'Xin chào'], ['안녕히 가세요', 'annyeonghi gaseyo', 'Tạm biệt (nói với người ra về)'], ['감사합니다', 'gamsahamnida', 'Cảm ơn'], ['죄송합니다', 'joesonghamnida', 'Xin lỗi'], ['네', 'ne', 'Vâng'], ['아니요', 'aniyo', 'Không'], ['처음 뵙겠습니다', 'cheoeum boepgetseumnida', 'Rất vui được gặp'], ['잘 부탁합니다', 'jal butakhamnida', 'Mong được giúp đỡ']]),
      U('Số đếm (Hán-Hàn)', [['일', 'il', 'một'], ['이', 'i', 'hai'], ['삼', 'sam', 'ba'], ['사', 'sa', 'bốn'], ['오', 'o', 'năm'], ['육', 'yuk', 'sáu'], ['칠', 'chil', 'bảy'], ['팔', 'pal', 'tám'], ['구', 'gu', 'chín'], ['십', 'sip', 'mười']]),
      U('Gia đình', [['어머니', 'eomeoni', 'mẹ'], ['아버지', 'abeoji', 'bố'], ['언니', 'eonni', 'chị (nữ gọi)'], ['오빠', 'oppa', 'anh (nữ gọi)'], ['동생', 'dongsaeng', 'em'], ['할머니', 'halmeoni', 'bà'], ['할아버지', 'harabeoji', 'ông'], ['친구', 'chingu', 'bạn bè']]),
      U('Ăn uống', [['물', 'mul', 'nước'], ['밥', 'bap', 'cơm'], ['빵', 'ppang', 'bánh mì'], ['커피', 'keopi', 'cà phê'], ['차', 'cha', 'trà'], ['고기', 'gogi', 'thịt'], ['생선', 'saengseon', 'cá'], ['과일', 'gwail', 'trái cây']]),
      U('Du lịch', [['어디', 'eodi', 'ở đâu'], ['얼마예요?', 'eolmayeyo', 'Bao nhiêu tiền?'], ['화장실', 'hwajangsil', 'nhà vệ sinh'], ['호텔', 'hotel', 'khách sạn'], ['공항', 'gonghang', 'sân bay'], ['도와주세요', 'dowajuseyo', 'Giúp tôi với'], ['모르겠어요', 'moreugesseoyo', 'Tôi không biết / không hiểu'], ['버스', 'beoseu', 'xe buýt']])
    ] },
    zh: { id: 'b-zh', lang: 'zh', name: 'Tiếng Trung cơ bản', units: [
      U('Chào hỏi', [['你好', 'nǐ hǎo', 'Xin chào'], ['再见', 'zàijiàn', 'Tạm biệt'], ['谢谢', 'xièxie', 'Cảm ơn'], ['对不起', 'duìbuqǐ', 'Xin lỗi'], ['请', 'qǐng', 'Xin mời / làm ơn'], ['早上好', 'zǎoshang hǎo', 'Chào buổi sáng'], ['很高兴认识你', 'hěn gāoxìng rènshi nǐ', 'Rất vui được gặp bạn'], ['你好吗？', 'nǐ hǎo ma', 'Bạn khỏe không?']]),
      U('Số đếm', [['一', 'yī', 'một'], ['二', 'èr', 'hai'], ['三', 'sān', 'ba'], ['四', 'sì', 'bốn'], ['五', 'wǔ', 'năm'], ['六', 'liù', 'sáu'], ['七', 'qī', 'bảy'], ['八', 'bā', 'tám'], ['九', 'jiǔ', 'chín'], ['十', 'shí', 'mười']]),
      U('Gia đình', [['妈妈', 'māma', 'mẹ'], ['爸爸', 'bàba', 'bố'], ['姐姐', 'jiějie', 'chị gái'], ['哥哥', 'gēge', 'anh trai'], ['妹妹', 'mèimei', 'em gái'], ['弟弟', 'dìdi', 'em trai'], ['朋友', 'péngyou', 'bạn bè'], ['孩子', 'háizi', 'đứa trẻ']]),
      U('Ăn uống', [['水', 'shuǐ', 'nước'], ['米饭', 'mǐfàn', 'cơm'], ['面包', 'miànbāo', 'bánh mì'], ['咖啡', 'kāfēi', 'cà phê'], ['茶', 'chá', 'trà'], ['肉', 'ròu', 'thịt'], ['鱼', 'yú', 'cá'], ['水果', 'shuǐguǒ', 'trái cây']]),
      U('Du lịch', [['哪里', 'nǎlǐ', 'ở đâu'], ['多少钱', 'duōshao qián', 'bao nhiêu tiền'], ['厕所', 'cèsuǒ', 'nhà vệ sinh'], ['酒店', 'jiǔdiàn', 'khách sạn'], ['机场', 'jīchǎng', 'sân bay'], ['救命', 'jiùmìng', 'cứu với'], ['我不明白', 'wǒ bù míngbai', 'tôi không hiểu'], ['公共汽车', 'gōnggòng qìchē', 'xe buýt']])
    ] }
  };
})();
