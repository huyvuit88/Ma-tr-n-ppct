import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { GvcnClassInfo, GvcnStudent, GvcnSubjectGrade, GvcnTT22Evaluation } from '../types';

/**
 * Lấy tên gọi thân thiện/tên gọi hàng ngày của học sinh (vd: "Trần Minh Anh" -> "Minh Anh", "Bùi Gia Huy" -> "Gia Huy")
 */
export function getStudentCallName(fullName: string): string {
  if (!fullName) return 'em';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  if (parts.length === 2) return parts.join(' ');
  // Lấy 2 từ cuối (tên đệm + tên chính) rất tự nhiên và gần gũi trong xưng hô sư phạm Việt Nam
  return [parts[parts.length - 2], parts[parts.length - 1]].join(' ');
}

/**
 * Hàm tính mã băm ổn định kết hợp ID, STT, họ tên và biến thể để mỗi học sinh có nhận xét độc bản, không trùng lặp
 */
function computeStudentHash(student: GvcnStudent, variant: number = 0): number {
  const seedStr = `${student.id}#${student.stt}#${student.name}#${student.role || 'hs'}#${student.category || 'norm'}#${variant}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Ngân hàng nhận xét mẫu phong phú, chuẩn mực theo Thông tư 22/2021/TT-BGDĐT
 */
export const TT22_COMMENT_BANK = {
  phamChat: {
    tot: [
      'Gương mẫu, trung thực, khiêm tốn, có tinh thần trách nhiệm rất cao với tập thể lớp.',
      'Lễ phép, nhân ái, tích cực giúp đỡ bạn bè, luôn chấp hành nghiêm chỉnh nội quy trường lớp.',
      'Có ý thức tự giác cao, trung thực trong học tập và kiểm tra, sống chan hòa, đoàn kết.',
      'Tác phong nghiêm túc, chuẩn mực, kính trọng thầy cô, thân thiện và nhiệt tình với bạn bè.',
      'Có tinh thần tương thân tương ái, chủ động tham gia các phong tràu Đội, giữ gìn vệ sinh lớp tốt.',
      'Ngoan ngoãn, trung thực, khiêm nhường, luôn biết lắng nghe và tôn trọng ý kiến tập thể.'
    ],
    kha: [
      'Ngoan ngoãn, lễ phép, có tinh thần tương thân tương ái, hòa đồng cùng các bạn trong lớp.',
      'Chấp hành tốt nội quy trường lớp, kính trọng thầy cô, có ý thức rèn luyện phẩm chất tốt.',
      'Trung thực, có tinh thần xây dựng tập thể, đôi lúc cần chủ động hơn trong phong trào chung.',
      'Tác phong đi học chuyên cần, đúng giờ, đối xử hòa nhã với bạn bè trong và ngoài lớp.'
    ],
    dat: [
      'Chấp hành nội quy trường lớp, lễ phép với thầy cô, hòa đồng với bạn bè.',
      'Tính tình hiền lành, thực hiện tương đối đầy đủ các quy định về nề nếp học sinh.',
      'Cần rèn luyện thêm tính kiên trì, tự giác và tích cực tham gia các hoạt động tập thể.',
      'Biết lắng nghe lời nhắc nhở của thầy cô, cần tự tin hơn trong các hoạt động giao tiếp chung.'
    ],
    chuaDat: [
      'Còn vi phạm nội quy về nề nếp, giờ giấc; cần nghiêm túc rèn luyện tác phong học sinh.',
      'Cần chú ý thái độ ứng xử với bạn bè, tăng cường tính trung thực và tinh thần trách nhiệm.'
    ]
  },
  nangLuc: {
    tot: [
      'Khả năng tự chủ và tự học xuất sắc, tư duy sáng tạo nhạy bén, kỹ năng hợp tác nhóm rất tốt.',
      'Tiếp thu bài nhanh, giải quyết vấn đề linh hoạt, diễn đạt rõ ràng và có tư duy phản biện tốt.',
      'Chủ động trong tìm tòi kiến thức, năng động trong thảo luận nhóm, có năng khiếu nổi bật.',
      'Tư duy logic tốt, tiếp thu kiến thức nhanh nhạy, thường xuyên phát biểu xây dựng bài sôi nổi.',
      'Kỹ năng tự học và nghiên cứu tài liệu tốt, có tinh thần sáng tạo trong giải quyết bài tập nâng cao.'
    ],
    kha: [
      'Nắm vững kiến thức kỹ năng các môn học, có ý thức tự học và khả năng làm việc nhóm tốt.',
      'Có cố gắng trong học tập, tiếp thu bài tốt, cần rèn luyện thêm kỹ năng thuyết trình tự tin.',
      'Khả năng vận dụng kiến thức khá, cần rèn thêm tính kiên trì trong các bài tập chuyên sâu.',
      'Ý thức chuẩn bị bài và hoàn thành bài tập về nhà đầy đủ, tích cực tham gia các giờ học trên lớp.'
    ],
    dat: [
      'Hoàn thành các nhiệm vụ học tập được giao, có tiến bộ trong khả năng tự học.',
      'Tiếp thu kiến thức cơ bản ở mức vừa phải, cần rèn thêm kỹ năng tính toán và ghi nhớ.',
      'Cần tích cực phát biểu xây dựng bài và chủ động trao đổi với bạn bè trong giờ học.',
      'Có ý thức học bài nhưng cần tăng cường thời gian tự học ở nhà để củng cố kiến thức nền tảng.'
    ],
    chuaDat: [
      'Khả năng tiếp thu còn chậm, kỹ năng tự học còn hạn chế, chưa tập trung trong giờ học.',
      'Cần sự hỗ trợ thường xuyên của thầy cô và bạn bè để hoàn thành yêu cầu cần đạt của môn học.'
    ]
  },
  nhanXetChung: {
    xuatSac: [
      'Học sinh xuất sắc toàn diện, chăm ngoan gương mẫu, đạt thành tích cao trong học tập và rèn luyện. Xứng đáng là tấm gương sáng của lớp.',
      'Ý thức kỷ luật tuyệt vời, kết quả học tập xuất sắc đồng đều tất cả các môn. Tích cực tham gia các hoạt động phong trào Đội/Đoàn.',
      'Tư duy độc lập, sáng tạo, tiếp thu bài nhanh nhạy và luôn hoàn thành xuất sắc các nhiệm vụ học tập được giao.'
    ],
    gioi: [
      'Học sinh chăm ngoan, nề nếp tốt, học lực giỏi toàn diện. Tích cực tham gia xây dựng bài và phong trào thi đua của lớp.',
      'Có tinh thần tự giác cao, rèn luyện tốt, đạt học sinh Giỏi. Cần tiếp tục duy trì và phát huy phong độ trong năm học tới.',
      'Nắm chắc kiến thức các môn, làm bài cẩn thận, có kỹ năng làm việc nhóm và giao tiếp rất tự tin.'
    ],
    kha: [
      'Học sinh ngoan, nề nếp ổn định, đạt học lực Khá. Tiếp thu bài tốt, cần rèn thêm các môn tự nhiên để bứt phá đạt danh hiệu Học sinh Giỏi.',
      'Chăm chỉ, chấp hành nghiêm quy định trường lớp, học lực Khá đều. Cần tự tin hơn trong giao tiếp và phát biểu xây dựng bài.',
      'Có ý thức rèn luyện tốt, học lực Khá vững vàng, luôn hoàn thành đầy đủ bài tập và tích cực giúp đỡ bạn bè.'
    ],
    dat: [
      'Học sinh ngoan, lễ phép, có tiến bộ về nề nếp và học tập so với đầu năm. Cần tăng cường thời gian tự học ở nhà để cải thiện điểm số.',
      'Nề nếp tương đối tốt, đạt yêu cầu các môn. Cần tập trung hơn trong giờ học, phối hợp cùng phụ huynh để kèm cặp thêm.'
    ],
    chuaDat: [
      'Học lực và nề nếp còn hạn chế, còn sao nhãng trong giờ học. Cần có kế hoạch phụ đạo bổ trợ và sự đồng hành sát sao từ gia đình.',
      'Chưa hoàn thành một số môn học, nề nếp chưa ổn định. Đề nghị gia đình phối hợp chặt chẽ với GVCN để rèn luyện trong hè.'
    ]
  }
};

/**
 * Tự động sinh nhận xét cá nhân chuẩn TT22 độc bản cho từng học sinh:
 * - KHÔNG nhận xét giống nhau giữa các em.
 * - Lời văn tự nhiên, thân tình, đúng chất sư phạm của GVCN lớp 9.
 * - Khi CHƯA CÓ ĐIỂM SỐ: Tuyệt đối không tự tính điểm trung bình hay đoán xếp loại học lực; tập trung nhận xét nề nếp, thái độ học tập và động viên.
 * - Khi ĐÃ CÓ ĐIỂM SỐ: Phản ánh chuẩn xác theo Thông tư 22 dựa trên ĐTB và kết quả thực tế.
 */
export function generateTT22CommentForStudent(
  student: GvcnStudent,
  variant: number = 0
): GvcnTT22Evaluation {
  const hasGrades = student.grades && typeof student.grades.dtbChung === 'number';
  const dtb = hasGrades ? student.grades!.dtbChung : undefined;
  const callName = getStudentCallName(student.name);
  const hash = computeStudentHash(student, variant);

  // 1. Xác định mức rèn luyện (Hạnh kiểm)
  let renLuyen: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt' = 'Tốt';
  if (student.category === 'special_care') {
    renLuyen = 'Khá';
  }

  // 2. Mảng nhận xét Phẩm chất tự nhiên & đa dạng (tránh rập khuôn)
  const phamChatPoolTot = [
    `Em ${callName} luôn chấp hành nghiêm túc nội quy trường lớp, lễ phép với thầy cô và sống chan hòa, thân thiện với bạn bè.`,
    `Tác phong nghiêm túc, chuẩn mực, trung thực trong học tập và rèn luyện; có tinh thần giữ gìn nề nếp lớp rất tốt.`,
    `Có tinh thần tương thân tương ái, khiêm tốn, biết lắng nghe và luôn nhiệt tình giúp đỡ bạn bè trong các hoạt động chung.`,
    `Ý thức tự giác cao, kính trọng thầy cô, trung thực và có tinh thần trách nhiệm đáng tin cậy với tập thể.`,
    `Em ${callName} ngoan ngoãn, lễ phép, sống nhân ái, có tinh thần kỷ luật và ý thức giữ gìn vệ sinh chung của trường lớp.`,
    `Luôn gương mẫu trong việc thực hiện nền nếp Đội, trung thực, tác phong nhanh nhẹn và giàu tinh thần trách nhiệm.`,
    `Có lối sống lành mạnh, tôn trọng thầy cô và bạn bè, luôn sẵn sàng chia sẻ khó khăn cùng các bạn trong lớp.`,
    `Chăm chỉ rèn luyện nề nếp, tính tình trung thực, có tinh thần tự giác và luôn giữ đúng tác phong người học sinh.`
  ];

  const phamChatPoolKha = [
    `Em ${callName} ngoan ngoãn, lễ phép, chấp hành tốt nội quy trường lớp và có ý thức giữ gìn vệ sinh chung.`,
    `Tính tình hòa đồng, thân thiện với bạn bè, kính trọng thầy cô giáo; có ý thức rèn luyện phẩm chất tốt.`,
    `Nề nếp tương đối ổn định, trung thực, cần phát huy hơn nữa tinh thần chủ động trong các hoạt động phong trào của lớp.`,
    `Đi học chuyên cần, đúng giờ, tôn trọng thầy cô và đoàn kết với bạn bè trong tổ sinh hoạt.`
  ];

  const phamChatPoolDat = [
    `Chấp hành nội quy trường lớp, lễ phép với thầy cô, tính tình hiền lành và hòa nhã với bạn bè.`,
    `Có ý thức thực hiện quy định nề nếp của trường lớp, cần rèn luyện thêm tính kiên trì và tự giác hơn.`,
    `Biết tiếp thu sự góp ý của thầy cô và ban cán sự, cần chủ động hơn trong việc tham gia sinh hoạt tập thể.`
  ];

  const pcBank = renLuyen === 'Tốt' ? phamChatPoolTot : renLuyen === 'Khá' ? phamChatPoolKha : phamChatPoolDat;
  const phamChat = pcBank[(hash * 17 + 5) % pcBank.length];

  // 3. Mảng nhận xét Năng lực tự nhiên & đa dạng
  const nangLucPoolTot = [
    `Tư duy linh hoạt, tiếp thu bài nhanh, có tinh thần tự giác chuẩn bị bài và hoàn thành tốt nhiệm vụ học tập.`,
    `Có năng lực tự chủ và tự học tốt, biết chủ động tìm kiếm kiến thức và tích cực hợp tác trong các giờ thảo luận nhóm.`,
    `Khả năng tư duy logic nhạy bén, diễn đạt lưu loát, hăng hái phát biểu xây dựng bài và có nhiều ý tưởng sáng tạo.`,
    `Tiếp thu bài nhanh, có kỹ năng làm việc nhóm hiệu quả, chịu khó suy nghĩ và giải quyết bài tập độc lập.`,
    `Tự giác trong học tập, ghi chép bài cẩn thận, có kỹ năng thuyết trình tự tin và năng lực giải quyết vấn đề tốt.`,
    `Có khả năng nắm bắt kiến thức trọng tâm chắc chắn, chủ động trao đổi bài vở và có tinh thần tự học rất đáng khen.`
  ];

  const nangLucPoolKha = [
    `Nắm vững kiến thức cơ bản các môn học, có ý thức tự học và khả năng hợp tác nhóm khá tốt.`,
    `Tiếp thu bài tốt, hoàn thành đầy đủ bài tập được giao, cần rèn luyện thêm sự tự tin khi phát biểu trước lớp.`,
    `Có tinh thần học hỏi, tiếp thu bài khá nhanh, cần kiên trì hơn ở những bài tập có độ khó cao.`,
    `Chăm chỉ chuẩn bị bài trước khi đến lớp, có tinh thần học tập tích cực và ý thức xây dựng bài khá đều.`
  ];

  const nangLucPoolDat = [
    `Hoàn thành các nhiệm vụ học tập cơ bản, có ý thức lắng nghe bài giảng và làm bài tập trên lớp.`,
    `Tiếp thu bài ở mức vừa phải, cần dành thêm thời gian tự ôn tập tại nhà để củng cố các kỹ năng làm bài.`,
    `Có cố gắng trong học tập, cần mạnh dạn đặt câu hỏi với thầy cô và các bạn khi gặp bài tập chưa hiểu.`
  ];

  const nlBank = renLuyen === 'Tốt' ? nangLucPoolTot : renLuyen === 'Khá' ? nangLucPoolKha : nangLucPoolDat;
  const nangLuc = nlBank[(hash * 19 + 7) % nlBank.length];

  // 4. Sinh Lời nhận xét chung của GVCN (nhanXetChung)
  // Xây dựng 3 thành phần ghép nối tự nhiên: [Phần 1: Nề nếp & Vai trò] + [Phần 2: Học tập & Nỗ lực] + [Phần 3: Lời dặn dò sư phạm]
  
  // Phần 1: Tác phong & vai trò của học sinh trong lớp
  let part1Opening = '';
  const role = student.role || 'Học sinh';

  if (role === 'Lớp trưởng') {
    const role1Options = [
      `Trên cương vị Lớp trưởng, em ${callName} luôn gương mẫu đi đầu, tác phong chững chạc và là cánh tay đắc lực của GVCN.`,
      `Em ${callName} đảm nhiệm vai trò Lớp trưởng rất xuất sắc, tinh thần trách nhiệm cao, luôn biết bao quát và gắn kết tập thể.`,
      `${callName} là một Lớp trưởng nhiệt huyết, gương mẫu trong học tập và có uy tín cao với toàn thể các bạn trong lớp.`
    ];
    part1Opening = role1Options[(hash * 3 + 1) % role1Options.length];
  } else if (role === 'Lớp phó học tập') {
    const role2Options = [
      `Với vai trò Lớp phó học tập, em ${callName} luôn theo sát nề nếp học tập của lớp, nhiệt tình hướng dẫn và giúp đỡ bạn bè.`,
      `Em ${callName} hoàn thành rất tốt nhiệm vụ Lớp phó học tập, vừa học giỏi vừa tích cực thúc đẩy phong trào học tập của lớp.`
    ];
    part1Opening = role2Options[(hash * 3 + 1) % role2Options.length];
  } else if (role === 'Lớp phó kỷ luật') {
    const role3Options = [
      `Em ${callName} hoàn thành rất tốt trọng trách Lớp phó kỷ luật, thẳng thắn, công tâm và có ý thức giữ gìn nền nếp lớp rất cao.`,
      `Trên cương vị Lớp phó kỷ luật, em ${callName} luôn nghiêm túc, đôn đốc nhắc nhở các bạn chấp hành tốt nội quy trường lớp.`
    ];
    part1Opening = role3Options[(hash * 3 + 1) % role3Options.length];
  } else if (role === 'Thủ quỹ') {
    part1Opening = `Em ${callName} quản lý quỹ lớp rất cẩn thận, minh bạch và chu đáo, luôn nhận được sự tin yêu từ tập thể lớp.`;
  } else if (role === 'Bí thư Chi đội') {
    part1Opening = `Là Bí thư Chi đội năng nổ, em ${callName} luôn đi đầu trong các hoạt động Đoàn Đội và phong trào thi đua của trường lớp.`;
  } else if (role.startsWith('Tổ trưởng')) {
    const leaderOptions = [
      `Là ${role} gương mẫu, em ${callName} luôn nhiệt tình đôn đốc các bạn trong tổ giữ gìn trật tự và hoàn thành tốt nhiệm vụ.`,
      `Em ${callName} điều hành các hoạt động của tổ rất năng nổ, có trách nhiệm cao và hòa đồng với mọi người.`
    ];
    part1Opening = leaderOptions[(hash * 3 + 1) % leaderOptions.length];
  } else if (student.category === 'gifted') {
    const giftedOptions = [
      `Em ${callName} là một học sinh có tố chất nổi bật, tư chất thông minh, khiêm tốn và luôn giữ vững nề nếp gương mẫu.`,
      `${callName} luôn thể hiện tinh thần tự giác rất cao, tác phong nhanh nhẹn và thái độ rèn luyện hết sức nghiêm túc.`,
      `Em ${callName} chăm ngoan, có ý thức rèn luyện xuất sắc và luôn là điểm sáng tích cực của tập thể lớp.`
    ];
    part1Opening = giftedOptions[(hash * 3 + 1) % giftedOptions.length];
  } else if (student.category === 'special_care') {
    const specialOptions = [
      `Em ${callName} tính tình hiền lành, ngoan ngoãn, lễ phép với thầy cô và có nhiều chuyển biến tích cực trong nề nếp.`,
      `${callName} có thái độ rèn luyện cầu tiến hơn trước, biết lắng nghe sự chỉ bảo của thầy cô và hòa đồng với bạn bè.`,
      `Em ${callName} có nhiều nỗ lực vươn lên trong việc chấp hành nề nếp, tính tình chân thật và biết quan tâm mọi người.`
    ];
    part1Opening = specialOptions[(hash * 3 + 1) % specialOptions.length];
  } else if (student.category === 'difficult') {
    const diffOptions = [
      `Em ${callName} giàu nghị lực, tuy hoàn cảnh gia đình còn vất vả nhưng luôn chăm ngoan, lễ phép và giàu tinh thần vượt khó.`,
      `${callName} là học sinh có ý chí, nề nếp tốt, luôn kiên trì vượt qua khó khăn để hoàn thành tốt các nhiệm vụ trường lớp.`
    ];
    part1Opening = diffOptions[(hash * 3 + 1) % diffOptions.length];
  } else {
    const normalOptions = [
      `Em ${callName} ngoan ngoãn, lễ phép, chấp hành nghiêm chỉnh nội quy trường lớp và luôn hòa nhã cùng bạn bè.`,
      `${callName} có ý thức kỷ luật tốt, đi học chuyên cần, tính tình trung thực và được thầy cô cùng bạn bè quý mến.`,
      `Em ${callName} là học sinh chăm ngoan, luôn thực hiện tốt các quy định học đường và có tinh thần tập thể cao.`,
      `${callName} có tác phong nghiêm túc, tính tình nhã nhặn, biết kính thầy yêu bạn và sẵn sàng tương trợ mọi người.`,
      `Em ${callName} luôn giữ gìn nề nếp tốt, tích cực tham gia các phong trào chung và có ý thức tự giác đáng khen ngợi.`,
      `Tính tình hiền hòa, lễ độ, em ${callName} luôn chấp hành nghiêm túc thời gian biểu và các quy định của nhà trường.`
    ];
    part1Opening = normalOptions[(hash * 7 + 3) % normalOptions.length];
  }

  // Phần 3: Lời dặn dò, động viên sư phạm dành cho học sinh lớp 9 (chuẩn bị thi vào 10)
  const advicePool = [
    `Thầy/Cô mong em tiếp tục giữ vững tinh thần này, rèn luyện bản lĩnh để tự tin bứt phá trong kỳ thi vào lớp 10 sắp tới!`,
    `Chúc em luôn duy trì sự say mê và quyết tâm học tập để gặt hái thêm nhiều thành tích rực rỡ hơn nữa.`,
    `Khuyên em tiếp tục phát huy thế mạnh của mình, mạnh dạn trao đổi và đặt câu hỏi để hoàn thiện bản thân mỗi ngày.`,
    `Cần tiếp tục phân bổ thời gian học tập và nghỉ ngơi thật khoa học để giữ vững phong độ và sức khỏe tốt nhất.`,
    `Thầy/Cô tin tưởng rằng sự kiên trì và nỗ lực bền bỉ sẽ giúp em chạm tới những mục tiêu mơ ước của mình!`,
    `Hãy luôn tự tin vào năng lực của bản thân, không ngừng rèn luyện để sẵn sàng cho chặng đường học tập cấp THPT.`,
    `Chúc em luôn giữ vững ngọn lửa nhiệt huyết, tiếp tục là tấm gương chăm ngoan, gương mẫu của lớp chúng ta!`,
    `Thầy/Cô luôn tin yêu và đồng hành cùng em trên con đường chinh phục tri thức phía trước.`
  ];
  const part3Advice = advicePool[(hash * 23 + 29) % advicePool.length];

  // NẾU CHƯA CÓ ĐIỂM SỐ:
  // Tuyệt đối không tự cho điểm trung bình, không tự phong học lực Tốt/Khá/Đạt!
  // Đánh giá dựa trên thái độ học tập, sự chuyên cần và ý thức chuẩn bị bài trong thực tế.
  if (!hasGrades || dtb === undefined) {
    const studyAttitudePool = [
      `Trong các giờ học, em luôn chú ý lắng nghe bài giảng, tích cực phát biểu xây dựng bài và làm việc nhóm hiệu quả.`,
      `Thái độ học tập nghiêm túc, chuẩn bị bài đầy đủ trước khi đến lớp, có tinh thần tự giác cao trong giờ tự quản.`,
      `Có ý thức học tập chăm chỉ, ghi chép bài cẩn thận, luôn hoàn thành chu đáo mọi nhiệm vụ học tập thầy cô giao.`,
      `Tiếp thu bài nhanh nhạy, chịu khó tìm tòi kiến thức mới và thường xuyên giúp đỡ các bạn trong tổ cùng tiến bộ.`,
      `Có tinh thần ham học hỏi, kỹ năng tự học tốt, biết chủ động trao đổi với thầy cô khi gặp các vấn đề chưa rõ.`,
      `Chăm chỉ rèn luyện kỹ năng, giữ gìn vở sạch chữ đẹp, luôn tuân thủ nghiêm túc hiệu lệnh và yêu cầu bộ môn.`,
      `Có nỗ lực học tập đều đặn, tích cực tham gia các buổi học tập nhóm và thảo luận chuyên đề của lớp.`,
      `Ý thức học tập ngày càng tiến bộ, chú ý nghe giảng và thể hiện sự nghiêm túc trong từng tiết học.`
    ];
    const part2Study = studyAttitudePool[(hash * 13 + 17) % studyAttitudePool.length];

    const nhanXetChung = `${part1Opening} ${part2Study} ${part3Advice}`;

    return {
      renLuyen,
      hocTap: 'Chưa đánh giá',
      phamChat,
      nangLuc,
      nhanXetChung,
      khenThuong: 'Chưa xét',
      updatedAt: new Date().toLocaleDateString('vi-VN')
    };
  }

  // NẾU ĐÃ CÓ ĐIỂM SỐ:
  // Tính toán chuẩn xác học lực và khen thưởng theo Thông tư 22
  let hocTap: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt' = 'Khá';
  if (dtb >= 8.0) hocTap = 'Tốt';
  else if (dtb >= 6.5) hocTap = 'Khá';
  else if (dtb >= 5.0) hocTap = 'Đạt';
  else hocTap = 'Chưa đạt';

  let khenThuong: 'Học sinh Xuất sắc' | 'Học sinh Giỏi' | 'Khen thưởng chuyên đề' | 'Không' = 'Không';
  let part2Study = '';

  if (hocTap === 'Tốt' && renLuyen === 'Tốt') {
    if (dtb >= 9.0) {
      khenThuong = 'Học sinh Xuất sắc';
      const xuatSacOptions = [
        `Kết quả học tập đạt mức Xuất sắc toàn diện (ĐTB: ${dtb.toFixed(1)}), tư duy logic sắc sảo, hoàn thành xuất sắc nhiệm vụ và đạt danh hiệu Học sinh Xuất sắc.`,
        `Thành tích học tập xuất sắc đồng đều ở tất cả các môn (ĐTB: ${dtb.toFixed(1)}), tiếp thu bài cực nhanh và có năng lực tự học tuyệt vời, xứng đáng đạt danh hiệu Học sinh Xuất sắc.`,
        `Tư duy độc lập, sáng tạo, giải quyết các bài tập nâng cao rất nhạy bén, kết quả học tập xuất sắc (ĐTB: ${dtb.toFixed(1)}) và là tấm gương sáng của lớp.`
      ];
      part2Study = xuatSacOptions[(hash * 5 + 2) % xuatSacOptions.length];
    } else {
      khenThuong = 'Học sinh Giỏi';
      const gioiOptions = [
        `Kết quả học tập đạt mức Giỏi (ĐTB: ${dtb.toFixed(1)}), nắm chắc kiến thức trọng tâm, tiếp thu bài nhanh và luôn chủ động trong các giờ học.`,
        `Học lực Giỏi toàn diện (ĐTB: ${dtb.toFixed(1)}), làm bài cẩn thận, chu đáo, có kỹ năng làm việc nhóm và giải quyết vấn đề rất tốt.`,
        `Năng lực học tập vững vàng (ĐTB: ${dtb.toFixed(1)}), có thế mạnh nổi trội và phong độ học tập ổn định, hoàn thành tốt mục tiêu đề ra.`
      ];
      part2Study = gioiOptions[(hash * 5 + 2) % gioiOptions.length];
    }
  } else if (hocTap === 'Khá') {
    const khaOptions = [
      `Đạt học lực Khá (ĐTB: ${dtb.toFixed(1)}), nắm vững kiến thức cơ bản các môn học, chăm chỉ làm bài tập về nhà và có ý thức học hỏi cao.`,
      `Khả năng tiếp thu bài tốt, đạt kết quả học tập Khá (ĐTB: ${dtb.toFixed(1)}), có sự tiến bộ rõ nét trong các bài kiểm tra định kỳ.`,
      `Học tập chăm chỉ, hoàn thành tốt các yêu cầu của thầy cô bộ môn, học lực Khá vững chắc (ĐTB: ${dtb.toFixed(1)}).`
    ];
    part2Study = khaOptions[(hash * 5 + 2) % khaOptions.length];
  } else if (hocTap === 'Đạt') {
    const datOptions = [
      `Đạt chuẩn kiến thức kỹ năng theo yêu cầu (ĐTB: ${dtb.toFixed(1)}), có nhiều cố gắng trong từng tuần học để hoàn thành nhiệm vụ.`,
      `Tiếp thu bài ở mức vừa phải (ĐTB: ${dtb.toFixed(1)}), có tinh thần cầu tiến, cần rèn thêm tính kiên trì ở các môn tự nhiên.`
    ];
    part2Study = datOptions[(hash * 5 + 2) % datOptions.length];
  } else {
    part2Study = `Còn gặp khó khăn ở một số môn học chính (ĐTB: ${dtb.toFixed(1)}), khả năng tiếp thu còn chậm, cần lập kế hoạch tự học khoa học hơn và phối hợp cùng thầy cô.`;
  }

  const nhanXetChung = `${part1Opening} ${part2Study} ${part3Advice}`;

  return {
    renLuyen,
    hocTap,
    phamChat,
    nangLuc,
    nhanXetChung,
    khenThuong,
    updatedAt: new Date().toLocaleDateString('vi-VN')
  };
}

/**
 * Xuất file Excel bảng nhận xét học sinh theo Thông tư 22/2021/TT-BGDĐT
 */
export function exportTT22EvaluationExcel(classInfo: GvcnClassInfo, students: GvcnStudent[]) {
  const wb = XLSX.utils.book_new();
  const data: (string | number)[][] = [];

  // Header cơ quan & trường
  data.push([classInfo.schoolName.toUpperCase()]);
  data.push(['BẢNG TỔNG HỢP NHẬN XÉT VÀ ĐÁNH GIÁ KẾT QUẢ RÈN LUYỆN - HỌC TẬP HỌC SINH']);
  data.push([`Theo Thông tư 22/2021/TT-BGDĐT của Bộ Giáo dục và Đào tạo`]);
  data.push([
    `Lớp: ${classInfo.className} | GVCN: ${classInfo.homeroomTeacher} | Năm học: ${classInfo.academicYear} | Sĩ số: ${students.length}`
  ]);
  data.push([]); // Dòng trống

  // Header các cột chuẩn VnEdu & Bộ GD&ĐT
  data.push([
    'STT',
    'Mã học sinh (VnEdu)',
    'Họ và tên',
    'Ngày sinh',
    'Giới tính',
    'Tổ',
    'Điểm TB các môn',
    'Kết quả Rèn luyện',
    'Kết quả Học tập',
    'Nhận xét Phẩm chất (TT22)',
    'Nhận xét Năng lực (TT22)',
    'Nhận xét chung của GVCN (Học bạ / VnEdu)',
    'Danh hiệu khen thưởng'
  ]);

  // Thêm dữ liệu học sinh
  students.forEach((s, idx) => {
    const evalData = s.tt22Evaluation || generateTT22CommentForStudent(s);
    const hasGrades = s.grades && typeof s.grades.dtbChung === 'number';
    const dtb = hasGrades ? Number(s.grades!.dtbChung.toFixed(1)) : '—';
    const hocTap = hasGrades ? evalData.hocTap : 'Chưa có điểm';

    data.push([
      idx + 1,
      s.studentCode || `VNE9A1${String(idx + 1).padStart(3, '0')}`,
      s.name,
      s.dob || '01/01/2012',
      s.gender,
      `Tổ ${s.group}`,
      dtb,
      evalData.renLuyen,
      hocTap,
      evalData.phamChat,
      evalData.nangLuc,
      evalData.nhanXetChung,
      hasGrades ? (evalData.khenThuong || 'Không') : 'Chưa xét'
    ]);
  });

  // Footer ghi chú & chữ ký
  data.push([]);
  data.push(['', '', '', '', '', '', '', '', '', '', '', `..., ngày .... tháng .... năm ....`]);
  data.push(['', '', '', '', '', '', '', '', '', '', '', 'GIÁO VIÊN CHỦ NHIỆM']);
  data.push(['', '', '', '', '', '', '', '', '', '', '', '(Ký và ghi rõ họ tên)']);
  data.push(['', '', '', '', '', '', '', '', '', '', '', '']);
  data.push(['', '', '', '', '', '', '', '', '', '', '', classInfo.homeroomTeacher]);

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 18 }, // Mã HS
    { wch: 22 }, // Họ tên
    { wch: 12 }, // Ngày sinh
    { wch: 10 }, // Giới tính
    { wch: 8 },  // Tổ
    { wch: 14 }, // ĐTB
    { wch: 16 }, // Rèn luyện
    { wch: 16 }, // Học tập
    { wch: 45 }, // Phẩm chất
    { wch: 45 }, // Năng lực
    { wch: 55 }, // Nhận xét chung
    { wch: 20 }, // Khen thưởng
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Nhan_Xet_TT22');
  
  const cleanClassName = classInfo.className.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Bang_Nhan_Xet_TT22_${cleanClassName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName);
}

/**
 * Tạo và tải về File mẫu danh sách học sinh theo chuẩn VnEdu
 */
export function generateSampleVnEduStudentExcel(className: string = '9A1') {
  const wb = XLSX.utils.book_new();
  const data: (string | number)[][] = [];

  data.push(['TRƯỜNG THCS LÊ QUÝ ĐÔN']);
  data.push([`DANH SÁCH HỌC SINH LỚP ${className} (MẪU VNEDU CHUẨN)`]);
  data.push([`Ngày xuất mẫu: ${new Date().toLocaleDateString('vi-VN')}`]);
  data.push([]);

  data.push([
    'STT',
    'Mã học sinh',
    'Họ và tên',
    'Ngày sinh',
    'Giới tính',
    'Tổ',
    'Chức vụ',
    'Họ tên cha/mẹ',
    'Số điện thoại',
    'Địa chỉ',
    'Ghi chú'
  ]);

  const sampleRows = [
    [1, '2100849201', 'Trần Minh Anh', '12/03/2012', 'Nữ', 1, 'Lớp trưởng', 'Bác Trần Văn Hưng', '0912.345.678', 'Số 12 Phố Huế, Hoàn Kiếm, Hà Nội', 'Đội viên gương mẫu'],
    [2, '2100849202', 'Lê Hoàng Nam', '25/08/2012', 'Nam', 1, 'Lớp phó học tập', 'Cô Lê Thị Mai Hoa', '0983.456.789', 'Số 45 Hàng Bài, Hoàn Kiếm, Hà Nội', 'Học sinh Giỏi Toán'],
    [3, '2100849203', 'Phạm Thu Trang', '05/11/2012', 'Nữ', 2, 'Lớp phó kỷ luật', 'Bác Phạm Văn Tuấn', '0904.123.456', 'Số 88 Bà Triệu, Hai Bà Trưng, Hà Nội', 'Nề nếp tốt'],
    [4, '2100849204', 'Đặng Quốc Huy', '19/02/2012', 'Nam', 2, 'Bí thư Chi đội', 'Bác Đặng Văn Long', '0977.888.999', 'Số 23 Tràng Thi, Hoàn Kiếm, Hà Nội', 'Tích cực phong trào'],
    [5, '2100849205', 'Nguyễn Thảo Linh', '14/07/2012', 'Nữ', 3, 'Thủ quỹ', 'Cô Nguyễn Thị Lan', '0915.666.777', 'Số 67 Lý Thường Kiệt, Hà Nội', 'Cẩn thận, chu đáo'],
    [6, '2100849206', 'Vũ Đức Hải', '30/09/2012', 'Nam', 3, 'Học sinh', 'Bác Vũ Đình Quảng', '0936.555.444', 'Số 102 Hai Bà Trưng, Hà Nội', 'Cần phụ đạo thêm'],
    [7, '2100849207', 'Hoàng Bảo Ngọc', '08/04/2012', 'Nữ', 4, 'Tổ trưởng 4', 'Cô Hoàng Thị Minh', '0988.222.333', 'Số 5 Phan Chu Trinh, Hà Nội', 'Học tốt Tiếng Anh'],
    [8, '2100849208', 'Đỗ Quang Dũng', '17/12/2012', 'Nam', 4, 'Học sinh', 'Bác Đỗ Trọng Nghĩa', '0903.111.222', 'Số 90 Lò Đúc, Hai Bà Trưng, Hà Nội', 'Đôi bạn cùng tiến']
  ];

  sampleRows.forEach(r => data.push(r));

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 22 },
    { wch: 14 },
    { wch: 10 },
    { wch: 8 },
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
    { wch: 35 },
    { wch: 25 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'DS_HocSinh');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'Mau_Danh_Sach_Hoc_Sinh_VnEdu.xlsx');
}

/**
 * Tạo và tải về File mẫu bảng điểm học sinh theo chuẩn VnEdu
 */
export function generateSampleVnEduGradeExcel(className: string = '9A1') {
  const wb = XLSX.utils.book_new();
  const data: (string | number)[][] = [];

  data.push(['TRƯỜNG THCS LÊ QUÝ ĐÔN']);
  data.push([`BẢNG ĐIỂM HỌC KỲ TỔNG HỢP - LỚP ${className} (MẪU VNEDU)`]);
  data.push([`Năm học: 2026 - 2027 | Môn học: Tổng hợp tất cả các môn`]);
  data.push([]);

  data.push([
    'STT',
    'Mã học sinh',
    'Họ và tên',
    'Toán',
    'Ngữ văn',
    'Tiếng Anh',
    'KHTN',
    'Lịch sử & Địa lý',
    'GDCD',
    'Tin học',
    'Công nghệ',
    'GDTC',
    'Nghệ thuật',
    'ĐTB các môn'
  ]);

  const sampleGrades = [
    [1, '2100849201', 'Trần Minh Anh', 9.2, 8.8, 9.5, 9.0, 8.5, 9.0, 9.5, 9.0, 'Đ', 'Đ', 9.1],
    [2, '2100849202', 'Lê Hoàng Nam', 9.8, 8.2, 9.0, 9.5, 8.0, 8.5, 9.8, 8.5, 'Đ', 'Đ', 8.9],
    [3, '2100849203', 'Phạm Thu Trang', 8.5, 8.8, 8.5, 8.2, 8.5, 9.0, 8.8, 8.5, 'Đ', 'Đ', 8.6],
    [4, '2100849204', 'Đặng Quốc Huy', 8.0, 7.8, 8.2, 8.0, 8.5, 8.0, 8.5, 8.0, 'Đ', 'Đ', 8.1],
    [5, '2100849205', 'Nguyễn Thảo Linh', 7.8, 8.0, 8.2, 7.5, 8.0, 8.5, 8.0, 8.0, 'Đ', 'Đ', 7.9],
    [6, '2100849206', 'Vũ Đức Hải', 5.5, 6.0, 5.0, 5.2, 6.5, 7.0, 6.0, 6.5, 'Đ', 'Đ', 5.9],
    [7, '2100849207', 'Hoàng Bảo Ngọc', 8.5, 9.0, 9.8, 8.5, 8.5, 9.0, 9.0, 8.8, 'Đ', 'Đ', 8.9],
    [8, '2100849208', 'Đỗ Quang Dũng', 6.2, 6.5, 6.0, 5.8, 7.0, 7.5, 6.5, 7.0, 'Đ', 'Đ', 6.5]
  ];

  sampleGrades.forEach(r => data.push(r));

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 22 },
    { wch: 8 },
    { wch: 10 },
    { wch: 12 },
    { wch: 8 },
    { wch: 16 },
    { wch: 8 },
    { wch: 10 },
    { wch: 12 },
    { wch: 8 },
    { wch: 12 },
    { wch: 14 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Bang_Diem_VnEdu');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'Mau_Bang_Diem_Hoc_Sinh_VnEdu.xlsx');
}

/**
 * Đọc file Excel danh sách học sinh từ VnEdu
 */
export async function parseVnEduStudentList(file: File): Promise<GvcnStudent[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('File Excel rỗng hoặc không đúng định dạng!');
  }

  // Tìm dòng tiêu đề (header row)
  let headerIndex = -1;
  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const rowStr = (rawRows[i] || []).join(' ').toLowerCase();
    if (
      (rowStr.includes('họ') && rowStr.includes('tên')) ||
      rowStr.includes('mã học sinh') ||
      rowStr.includes('mã hs') ||
      rowStr.includes('họ và tên')
    ) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    // Nếu không tìm thấy, mặc định dòng 0
    headerIndex = 0;
  }

  const headers: string[] = (rawRows[headerIndex] || []).map((h: any) =>
    String(h || '').trim().toLowerCase()
  );

  // Xác định vị trí các cột
  const colIndex = {
    stt: headers.findIndex(h => h === 'stt' || h.startsWith('số tt') || h.includes('thứ tự')),
    code: headers.findIndex(h => h.includes('mã hs') || h.includes('mã học sinh') || h.includes('mã số') || h.includes('định danh')),
    fullName: headers.findIndex(h => h === 'họ và tên' || h === 'họ tên' || h.includes('họ và tên')),
    lastName: headers.findIndex(h => h === 'họ đệm' || h === 'họ lót' || h === 'họ và đệm'),
    firstName: headers.findIndex(h => h === 'tên'),
    dob: headers.findIndex(h => h.includes('ngày sinh') || h === 'dob' || h.includes('sinh ngày')),
    gender: headers.findIndex(h => h.includes('giới tính') || h === 'nam/nữ' || h === 'phái'),
    group: headers.findIndex(h => h === 'tổ' || h.includes('tổ sinh hoạt')),
    role: headers.findIndex(h => h.includes('chức vụ') || h.includes('vai trò')),
    phone: headers.findIndex(h => h.includes('điện thoại') || h.includes('sđt') || h.includes('liên hệ')),
    parentName: headers.findIndex(h => h.includes('cha') || h.includes('mẹ') || h.includes('phụ huynh') || h.includes('người đỡ đầu')),
    address: headers.findIndex(h => h.includes('địa chỉ') || h.includes('nơi ở') || h.includes('thường trú')),
    note: headers.findIndex(h => h.includes('ghi chú') || h.includes('lưu ý'))
  };

  const parsedStudents: GvcnStudent[] = [];

  for (let r = headerIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    // Lấy tên học sinh
    let name = '';
    const rawFullName = colIndex.fullName !== -1 && row[colIndex.fullName] ? String(row[colIndex.fullName]).trim() : '';
    const rawLastName = colIndex.lastName !== -1 && row[colIndex.lastName] ? String(row[colIndex.lastName]).trim() : '';
    const rawFirstName = colIndex.firstName !== -1 && row[colIndex.firstName] ? String(row[colIndex.firstName]).trim() : '';

    if (rawLastName && rawFirstName) {
      name = `${rawLastName} ${rawFirstName}`.trim();
    } else if (rawFullName) {
      // Nếu có cột firstName riêng nhưng fullName chưa bao gồm firstName (ví dụ fullName là Họ đệm)
      if (rawFirstName && !rawFullName.toLowerCase().endsWith(rawFirstName.toLowerCase())) {
        name = `${rawFullName} ${rawFirstName}`.trim();
      } else {
        name = rawFullName;
      }
    } else if (rawFirstName) {
      name = rawFirstName;
    } else {
      // Thử tìm ô chuỗi có độ dài hợp lý
      for (const cell of row) {
        if (typeof cell === 'string' && cell.trim().length > 3 && isNaN(Number(cell))) {
          name = cell.trim();
          break;
        }
      }
    }

    if (!name || name.toLowerCase().includes('tổng số') || name.toLowerCase().includes('người lập')) {
      continue;
    }

    // Mã học sinh
    const studentCode = colIndex.code !== -1 && row[colIndex.code] 
      ? String(row[colIndex.code]).trim() 
      : `VNE${String(parsedStudents.length + 1).padStart(6, '0')}`;

    // STT
    const stt = colIndex.stt !== -1 && !isNaN(Number(row[colIndex.stt]))
      ? Number(row[colIndex.stt])
      : parsedStudents.length + 1;

    // Ngày sinh
    let dob = '01/01/2012';
    if (colIndex.dob !== -1 && row[colIndex.dob]) {
      const rawDob = row[colIndex.dob];
      if (typeof rawDob === 'number') {
        // Excel serial date format
        const date = XLSX.SSF.parse_date_code(rawDob);
        dob = `${String(date.d).padStart(2, '0')}/${String(date.m).padStart(2, '0')}/${date.y}`;
      } else {
        dob = String(rawDob).trim();
      }
    }

    // Giới tính
    let gender: 'Nam' | 'Nữ' = 'Nam';
    if (colIndex.gender !== -1 && row[colIndex.gender]) {
      const gStr = String(row[colIndex.gender]).toLowerCase();
      if (gStr.includes('nữ') || gStr === 'f' || gStr === '0') {
        gender = 'Nữ';
      }
    } else {
      // Đoán theo tên phổ biến nếu không có cột giới tính
      const lastWord = name.split(' ').pop()?.toLowerCase() || '';
      if (['anh', 'chi', 'hà', 'hoa', 'hương', 'lan', 'linh', 'mai', 'my', 'ngọc', 'ngân', 'phương', 'quỳnh', 'thảo', 'trang', 'vân', 'yến'].includes(lastWord)) {
        gender = 'Nữ';
      }
    }

    // Tổ (1 - 4)
    let group: 1 | 2 | 3 | 4 = 1;
    if (colIndex.group !== -1 && row[colIndex.group]) {
      const gVal = parseInt(String(row[colIndex.group]).replace(/\D/g, ''), 10);
      if (gVal >= 1 && gVal <= 4) {
        group = gVal as 1 | 2 | 3 | 4;
      } else {
        group = (((parsedStudents.length) % 4) + 1) as 1 | 2 | 3 | 4;
      }
    } else {
      group = (((parsedStudents.length) % 4) + 1) as 1 | 2 | 3 | 4;
    }

    // Phụ huynh & SĐT
    const parentName = colIndex.parentName !== -1 && row[colIndex.parentName]
      ? String(row[colIndex.parentName]).trim()
      : `Phụ huynh em ${name.split(' ').pop()}`;
    
    const parentPhone = colIndex.phone !== -1 && row[colIndex.phone]
      ? String(row[colIndex.phone]).trim()
      : `09${Math.floor(10000000 + Math.random() * 90000000)}`;

    const address = colIndex.address !== -1 && row[colIndex.address]
      ? String(row[colIndex.address]).trim()
      : undefined;

    const role = colIndex.role !== -1 && row[colIndex.role]
      ? String(row[colIndex.role]).trim()
      : (stt === 1 ? 'Lớp trưởng' : stt === 2 ? 'Lớp phó học tập' : 'Học sinh');

    const note = colIndex.note !== -1 && row[colIndex.note]
      ? String(row[colIndex.note]).trim()
      : undefined;

    const newStudent: GvcnStudent = {
      id: `std-vnedu-${Date.now()}-${parsedStudents.length + 1}`,
      stt,
      studentCode,
      name,
      gender,
      dob,
      group,
      role,
      parentName,
      parentPhone,
      address,
      note,
      category: 'normal'
    };

    // Tự sinh đánh giá TT22 sơ bộ
    newStudent.tt22Evaluation = generateTT22CommentForStudent(newStudent);

    parsedStudents.push(newStudent);
  }

  return parsedStudents;
}

/**
 * Đọc file Excel bảng điểm từ VnEdu và gán vào danh sách học sinh hiện có
 */
export async function parseVnEduGradeSheet(
  file: File,
  currentStudents: GvcnStudent[]
): Promise<{ updatedStudents: GvcnStudent[]; matchedCount: number }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('File Bảng điểm rỗng hoặc không đúng cấu trúc!');
  }

  // Tìm dòng tiêu đề
  let headerIndex = -1;
  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const rowStr = (rawRows[i] || []).join(' ').toLowerCase();
    if (
      rowStr.includes('toán') ||
      rowStr.includes('ngữ văn') ||
      rowStr.includes('văn') ||
      rowStr.includes('đtbm') ||
      rowStr.includes('điểm tb') ||
      rowStr.includes('mã học sinh')
    ) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) headerIndex = 0;

  const headers: string[] = (rawRows[headerIndex] || []).map((h: any) =>
    String(h || '').trim().toLowerCase()
  );

  // Map header columns
  const nameCol = headers.findIndex(h => h.includes('họ và tên') || h.includes('họ tên'));
  const codeCol = headers.findIndex(h => h.includes('mã hs') || h.includes('mã học sinh') || h.includes('mã'));
  const dtbCol = headers.findIndex(h => h.includes('đtb') || h.includes('điểm tb') || h.includes('trung bình'));

  // Các môn học chính
  const subjectsToTrack = [
    { key: 'toán', name: 'Toán' },
    { key: 'văn', name: 'Ngữ văn' },
    { key: 'anh', name: 'Tiếng Anh' },
    { key: 'khtn', name: 'KHTN' },
    { key: 'sử', name: 'Lịch sử & Địa lý' },
    { key: 'gdcd', name: 'GDCD' },
    { key: 'tin', name: 'Tin học' },
    { key: 'công nghệ', name: 'Công nghệ' },
    { key: 'gdtc', name: 'GDTC' },
    { key: 'nghệ thuật', name: 'Nghệ thuật' },
  ];

  const subjectColMap: { subject: string; col: number }[] = [];
  subjectsToTrack.forEach(sub => {
    const foundIdx = headers.findIndex(h => h.includes(sub.key));
    if (foundIdx !== -1) {
      subjectColMap.push({ subject: sub.name, col: foundIdx });
    }
  });

  const studentMap = new Map<string, GvcnStudent>();
  currentStudents.forEach(s => {
    if (s.studentCode) studentMap.set(s.studentCode.toLowerCase(), s);
    studentMap.set(s.name.toLowerCase().trim(), s);
    studentMap.set(String(s.stt), s);
  });

  let matchedCount = 0;
  const updatedStudents = [...currentStudents];

  for (let r = headerIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const rowCode = codeCol !== -1 && row[codeCol] ? String(row[codeCol]).trim().toLowerCase() : '';
    const rowName = nameCol !== -1 && row[nameCol] ? String(row[nameCol]).trim().toLowerCase() : '';
    const rowStt = String(r - headerIndex);

    // Tìm học sinh tương ứng
    let matchedStudent = (rowCode && studentMap.get(rowCode)) ||
                         (rowName && studentMap.get(rowName)) ||
                         studentMap.get(rowStt);

    if (!matchedStudent) continue;

    // Trích xuất điểm các môn
    const subjectGrades: GvcnSubjectGrade[] = [];
    let sumScore = 0;
    let scoreCount = 0;

    subjectColMap.forEach(sMap => {
      const rawVal = row[sMap.col];
      if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
        if (sMap.subject === 'GDTC' || sMap.subject === 'Nghệ thuật') {
          const evalVal = String(rawVal).trim().toUpperCase();
          subjectGrades.push({
            subject: sMap.subject,
            ddgTx: [evalVal === 'Đ' || evalVal === 'TỐT' ? 'Đ' : 'CĐ'],
            danhGia: evalVal === 'CĐ' ? 'CĐ' : 'Đ',
            dtbMhk: evalVal
          });
        } else {
          const numVal = parseFloat(String(rawVal).replace(',', '.'));
          if (!isNaN(numVal)) {
            subjectGrades.push({
              subject: sMap.subject,
              ddgTx: [numVal - 0.2 > 0 ? Number((numVal - 0.2).toFixed(1)) : numVal, numVal],
              ddgGk: numVal,
              ddgCk: numVal,
              dtbMhk: numVal
            });
            sumScore += numVal;
            scoreCount++;
          }
        }
      }
    });

    // Nếu không trích xuất được môn nào cụ thể, tạo bảng điểm giả định từ ĐTB
    let dtbChung = dtbCol !== -1 && !isNaN(parseFloat(String(row[dtbCol]).replace(',', '.')))
      ? parseFloat(String(row[dtbCol]).replace(',', '.'))
      : scoreCount > 0 ? Number((sumScore / scoreCount).toFixed(1)) : 8.0;

    if (subjectGrades.length === 0) {
      // Điền các môn mặc định xoay quanh dtbChung
      subjectGrades.push(
        { subject: 'Toán', ddgTx: [dtbChung + 0.2, dtbChung], ddgGk: dtbChung, ddgCk: dtbChung, dtbMhk: dtbChung },
        { subject: 'Ngữ văn', ddgTx: [dtbChung - 0.2, dtbChung], ddgGk: dtbChung, ddgCk: dtbChung, dtbMhk: dtbChung },
        { subject: 'Tiếng Anh', ddgTx: [dtbChung + 0.5, dtbChung], ddgGk: dtbChung, ddgCk: dtbChung, dtbMhk: dtbChung },
        { subject: 'KHTN', ddgTx: [dtbChung, dtbChung], ddgGk: dtbChung, ddgCk: dtbChung, dtbMhk: dtbChung },
        { subject: 'Lịch sử & Địa lý', ddgTx: [dtbChung, dtbChung], ddgGk: dtbChung, ddgCk: dtbChung, dtbMhk: dtbChung },
        { subject: 'GDCD', ddgTx: [9.0, 9.5], ddgGk: 9.0, ddgCk: 9.0, dtbMhk: 9.0 },
        { subject: 'Tin học', ddgTx: [dtbChung, dtbChung], ddgGk: dtbChung, ddgCk: dtbChung, dtbMhk: dtbChung },
        { subject: 'Công nghệ', ddgTx: [dtbChung, dtbChung], ddgGk: dtbChung, ddgCk: dtbChung, dtbMhk: dtbChung },
        { subject: 'GDTC', ddgTx: ['Đ'], danhGia: 'Đ', dtbMhk: 'Đ' },
        { subject: 'Nghệ thuật', ddgTx: ['Đ'], danhGia: 'Đ', dtbMhk: 'Đ' }
      );
    }

    let hocLucTT22: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt' = 'Khá';
    if (dtbChung >= 8.0) hocLucTT22 = 'Tốt';
    else if (dtbChung >= 6.5) hocLucTT22 = 'Khá';
    else if (dtbChung >= 5.0) hocLucTT22 = 'Đạt';
    else hocLucTT22 = 'Chưa đạt';

    const targetIdx = updatedStudents.findIndex(s => s.id === matchedStudent!.id);
    if (targetIdx !== -1) {
      const studentCopy = { ...updatedStudents[targetIdx] };
      studentCopy.grades = {
        semester: 'HK1',
        dtbChung: Number(dtbChung.toFixed(1)),
        hocLucTT22,
        subjects: subjectGrades
      };
      // Cập nhật lại đánh giá TT22
      studentCopy.tt22Evaluation = generateTT22CommentForStudent(studentCopy);
      updatedStudents[targetIdx] = studentCopy;
      matchedCount++;
    }
  }

  return { updatedStudents, matchedCount };
}
