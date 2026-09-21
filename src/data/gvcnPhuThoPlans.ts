import { GvcnMonthlyTask, GvcnClassInfo } from '../types';

/**
 * Trích xuất Khối lớp (6, 7, 8, hoặc 9) từ tên lớp hoặc cấu hình lớp
 */
export function getGradeFromClassInfo(classInfo?: Partial<GvcnClassInfo> | null): 6 | 7 | 8 | 9 {
  if (!classInfo) return 9;
  
  // 1. Kiểm tra trường grade trực tiếp
  if (classInfo.grade) {
    const match = classInfo.grade.match(/([6-9])/);
    if (match) return Number(match[1]) as 6 | 7 | 8 | 9;
  }

  // 2. Kiểm tra tên lớp (ví dụ: "Lớp 6A1", "7/2", "8B", "9A1")
  if (classInfo.className) {
    const match = classInfo.className.match(/(?:khối|lớp)?\s*([6-9])/i);
    if (match) return Number(match[1]) as 6 | 7 | 8 | 9;
  }

  return 9;
}

export interface PhuThoSuggestionItem {
  id: string;
  title: string;
  category: 'local' | 'study' | 'discipline' | 'family';
  categoryLabel: string;
  targetWeek: number;
  rationale: string;
  localHighlight?: string;
}

/**
 * Danh sách kế hoạch 9 tháng chi tiết theo từng khối (6, 7, 8, 9)
 * Gắn liền với đặc thù địa phương Xã Phú Thọ, Tỉnh Đồng Tháp
 * (Mùa nước nổi sông Tiền, Vườn Quốc gia Tràm Chim Tam Nông, Đất Sen Hồng, Cụ Phó Bảng, phân luồng địa phương)
 */
export const PHU_THO_GRADE_PLANS: Record<6 | 7 | 8 | 9, GvcnMonthlyTask[]> = {
  // ==========================================
  // KHỐI 6 THCS (Chuyển cấp Tiểu học lên THCS, thích ứng môi trường mới, bơi lội an toàn)
  // ==========================================
  6: [
    {
      month: 9,
      monthName: 'Tháng 9/2026',
      theme: 'Chủ điểm: Khởi đầu mới tại trường THCS & An toàn mùa lũ sông Tiền (Xã Phú Thọ)',
      tasks: [
        { id: 'k6-t9-1', title: 'Giúp học sinh làm quen với môi trường học tập THCS nhiều thầy cô bộ môn', targetWeek: 1, completed: true, note: 'Tổ chức giới thiệu giáo viên bộ môn & hướng dẫn phương pháp học theo CT GDPT 2018' },
        { id: 'k6-t9-2', title: 'Tuyên truyền đặc biệt phòng chống đuối nước mùa nước nổi tại xã Phú Thọ (ký cam kết 100% mặc áo phao qua sông, đò)', targetWeek: 1, completed: true, note: 'Địa bàn Phú Thọ sông rạch chằng chịt, ưu tiên an toàn hàng đầu theo chỉ đạo Sở GD&ĐT Đồng Tháp' },
        { id: 'k6-t9-3', title: 'Bầu Ban cán sự lớp, Ban cán sự bộ môn và 4 Tổ trưởng', targetWeek: 1, completed: true, note: 'Rèn tính tự quản cho học sinh mới vào lớp 6' },
        { id: 'k6-t9-4', title: 'Triển khai tiêu chí xây dựng "Trường học thân thiện, học sinh tích cực" và "Trường học hạnh phúc" Đất Sen Hồng', targetWeek: 2, completed: true, note: 'Tạo môi trường học đường an toàn, yêu thương, không bạo lực' },
        { id: 'k6-t9-5', title: 'Rà soát hoàn cảnh gia đình học sinh hộ nghèo, cận nghèo, gia đình vùng ngập lũ xã Phú Thọ', targetWeek: 2, completed: true, note: 'Lập danh sách học sinh nhận học bổng và hỗ trợ sách vở, áo phao' },
        { id: 'k6-t9-6', title: 'Tổ chức Đại hội Chi đội khối 6 nhiệm kỳ 2026 - 2027', targetWeek: 2, completed: true, note: 'Bầu BCH Chi đội mới' },
        { id: 'k6-t9-7', title: 'Họp Cha mẹ học sinh đầu năm: Hướng dẫn phụ huynh đồng hành cùng con chuyển cấp THCS', targetWeek: 3, completed: false, note: 'Nhấn mạnh đổi mới đánh giá theo Thông tư 22/BGDĐT' },
        { id: 'k6-t9-8', title: 'Khảo sát chất lượng đầu năm môn Toán, Tiếng Việt (chuyển sang Ngữ văn) và Tiếng Anh', targetWeek: 4, completed: false, note: 'Nắm chắc năng lực từng em để có kế hoạch kèm cặp' },
      ],
    },
    {
      month: 10,
      monthName: 'Tháng 10/2026',
      theme: 'Chủ điểm: Chăm ngoan học giỏi — Em yêu Vườn Quốc gia Tràm Chim Đất Sen Hồng & Phòng chống tệ nạn học đường',
      tasks: [
        { id: 'k6-t10-1', title: 'Phát động phong trào thi đua "Hoa điểm 10 tặng Mẹ và Cô" chào mừng 20/10', targetWeek: 6, completed: false, note: 'Rèn thói quen chuẩn bị bài chu đáo trước khi đến lớp' },
        { id: 'k6-t10-2', title: 'Sinh hoạt chuyên đề: Tìm hiểu hệ sinh thái Vườn Quốc gia Tràm Chim (Tam Nông) và bảo vệ loài Sếu đầu đỏ', targetWeek: 7, completed: false, note: 'Giáo dục lòng tự hào và tình yêu thiên nhiên quê hương Phú Thọ - Tam Nông - Đồng Tháp' },
        { id: 'k6-t10-3', title: 'Tuyên truyền phòng chống bạo lực học đường và ngăn chặn triệt để thuốc lá điện tử trong học sinh', targetWeek: 7, completed: false, note: 'Quán triệt theo văn bản chỉ đạo mới của Sở GD&ĐT Đồng Tháp' },
        { id: 'k6-t10-4', title: 'Phát động phong trào làm sản phẩm STEM mini từ vật liệu tái chế và sen Đồng Tháp', targetWeek: 8, completed: false, note: 'Khơi gợi niềm đam mê nghiên cứu khoa học từ lớp 6' },
        { id: 'k6-t10-5', title: 'Hướng dẫn kỹ năng đọc sách tại thư viện và phương pháp ghi chép vở khoa học môn Toán & KHTN 6', targetWeek: 8, completed: false },
        { id: 'k6-t10-6', title: 'Tập dượt ôn tập và hướng dẫn kỹ năng làm bài kiểm tra Giữa kỳ I cho học sinh lớp 6', targetWeek: 9, completed: false, note: 'Giảm áp lực tâm lý bài thi trắc nghiệm kết hợp tự luận' },
      ],
    },
    {
      month: 11,
      monthName: 'Tháng 11/2026',
      theme: 'Chủ điểm: Tôn sư trọng đạo — Tri ân Thầy Cô & Noi gương Cụ Phó bảng Nguyễn Sinh Sắc',
      tasks: [
        { id: 'k6-t11-1', title: 'Phát động thi đua "Tuần học tốt — Bông hoa điểm 10" chào mừng ngày Nhà giáo VN 20/11', targetWeek: 10, completed: false },
        { id: 'k6-t11-2', title: 'Hướng dẫn Chi đội làm báo tường / bưu thiếp tri ân thầy cô giáo dạy các bộ môn lớp 6', targetWeek: 11, completed: false },
        { id: 'k6-t11-3', title: 'Sinh hoạt truyền thống nhân Lễ giỗ Cụ Phó bảng Nguyễn Sinh Sắc (biểu tượng hiếu học Đồng Tháp)', targetWeek: 11, completed: false, note: 'Giáo dục đạo làm người và tinh thần vượt khó học tập xứ Sen Hồng' },
        { id: 'k6-t11-4', title: 'Hoàn thành kiểm tra Giữa học kỳ I theo đúng tiến độ phân phối chương trình', targetWeek: 11, completed: false },
        { id: 'k6-t11-5', title: 'Sơ kết đợt thi đua 20/11, khen thưởng các cá nhân và tổ tích cực trong học tập', targetWeek: 12, completed: false },
      ],
    },
    {
      month: 12,
      monthName: 'Tháng 12/2026',
      theme: 'Chủ điểm: Tiếp bước anh bộ đội Cụ Hồ — Thi đua Ôn thi Cuối Học kỳ I lớp 6',
      tasks: [
        { id: 'k6-t12-1', title: 'Sinh hoạt truyền thống kỷ niệm 22/12: Giao lưu hoặc nghe kể chuyện truyền thống anh hùng xã Phú Thọ', targetWeek: 15, completed: false },
        { id: 'k6-t12-2', title: 'Thành lập các nhóm "Đôi bạn cùng tiến" ôn tập môn Toán và KHTN 6', targetWeek: 16, completed: false },
        { id: 'k6-t12-3', title: 'Quán triệt quy chế thi cử nghiêm túc, trung thực trong kiểm tra Cuối kỳ I', targetWeek: 17, completed: false },
        { id: 'k6-t12-4', title: 'Đôn đốc học sinh tham gia nghiêm túc kỳ thi Cuối học kỳ I môn tập trung', targetWeek: 18, completed: false },
        { id: 'k6-t12-5', title: 'Đánh giá, xếp loại kết quả rèn luyện và học tập HK1 theo Thông tư 22/BGDĐT', targetWeek: 18, completed: false },
      ],
    },
    {
      month: 1,
      monthName: 'Tháng 1/2027',
      theme: 'Chủ điểm: Sơ kết Học kỳ I & Tết Đất Sen Hồng an toàn, sum vầy',
      tasks: [
        { id: 'k6-t1-1', title: 'Tổ chức Hội nghị Cha mẹ học sinh Sơ kết Học kỳ I lớp 6', targetWeek: 19, completed: false, note: 'Trao đổi kỹ sự thích ứng của từng học sinh chuyển cấp' },
        { id: 'k6-t1-2', title: 'Vận động ủng hộ phong trào "Cây mùa xuân — Áo mới cho bạn nghèo / Nụ cười Đất Sen" trong chi đội', targetWeek: 20, completed: false },
        { id: 'k6-t1-3', title: 'Tuyên truyền nghiêm cấm pháo nổ, an toàn giao thông đường bộ và đường thủy dịp Tết tại xã Phú Thọ', targetWeek: 20, completed: false },
        { id: 'k6-t1-4', title: 'Ký cam kết nghỉ Tết Nguyên đán an toàn, văn minh cho 100% học sinh', targetWeek: 20, completed: false },
      ],
    },
    {
      month: 2,
      monthName: 'Tháng 2/2027',
      theme: 'Chủ điểm: Mừng Đảng quang vinh — Khởi động Học kỳ II & Tết trồng cây',
      tasks: [
        { id: 'k6-t2-1', title: 'Nắm chắc sĩ số học sinh lớp 6 ngay sau Tết, ngăn chặn tình trạng học sinh theo cha mẹ đi làm ăn xa bỏ học', targetWeek: 21, completed: false, note: 'Phối hợp Trưởng ấp xã Phú Thọ vận động ngay nếu có nguy cơ vắng học' },
        { id: 'k6-t2-2', title: 'Ổn định nề nếp truy bài 15 phút đầu giờ, kiểm tra sách vở, đồ dùng học tập HK2', targetWeek: 21, completed: false },
        { id: 'k6-t2-3', title: 'Tham gia phong trào "Tết trồng cây đời đời nhớ ơn Bác" và làm vệ sinh khuôn viên trường, đường quê Phú Thọ', targetWeek: 22, completed: false },
        { id: 'k6-t2-4', title: 'Phát động phong trào đọc sách và chuyển đổi số trong học tập môn Toán & Ngữ văn', targetWeek: 23, completed: false },
      ],
    },
    {
      month: 3,
      monthName: 'Tháng 3/2027',
      theme: 'Chủ điểm: Tiến bước lên Đoàn & Ngày hội Thiếu nhi vui khỏe — Phòng chống đuối nước mùa khô',
      tasks: [
        { id: 'k6-t3-1', title: 'Tập luyện tham gia Ngày hội "Thiếu nhi vui khỏe — Tiến bước lên Đoàn" chào mừng 26/3', targetWeek: 24, completed: false },
        { id: 'k6-t3-2', title: 'Tuyên truyền phổ cập bơi lội an toàn và phòng chống tai nạn thương tích mùa khô cho học sinh lớp 6', targetWeek: 25, completed: false, note: 'Đăng ký danh sách học sinh chưa biết bơi để học bơi phòng đuối nước' },
        { id: 'k6-t3-3', title: 'Ôn tập và kiểm tra Giữa học kỳ II các môn học', targetWeek: 26, completed: false },
        { id: 'k6-t3-4', title: 'Sinh hoạt chuyên đề: Sử dụng mạng xã hội thông minh và phòng tránh lừa đảo trên không gian mạng', targetWeek: 27, completed: false },
      ],
    },
    {
      month: 4,
      monthName: 'Tháng 4/2027',
      theme: 'Chủ điểm: Hào khí Đất Sen Hồng — Tăng tốc hoàn thành chương trình lớp 6',
      tasks: [
        { id: 'k6-t4-1', title: 'Sinh hoạt truyền thống kỷ niệm Giỗ Tổ Hùng Vương, 30/4 Ngày Giải phóng miền Nam & 1/5 Ngày Quốc tế Lao động', targetWeek: 28, completed: false, note: 'Tìm hiểu di tích lịch sử Gò Tháp và truyền thống cách mạng tỉnh Đồng Tháp' },
        { id: 'k6-t4-2', title: 'Rà soát các chỉ tiêu học tập, tăng cường phụ đạo cho các em học sinh có nguy cơ chưa Đạt môn Toán / KHTN 6', targetWeek: 29, completed: false },
        { id: 'k6-t4-3', title: 'Chuẩn bị kế hoạch kiểm tra Cuối kỳ II theo lịch chỉ đạo của Phòng/Sở GD&ĐT Đồng Tháp', targetWeek: 30, completed: false },
      ],
    },
    {
      month: 5,
      monthName: 'Tháng 5/2027',
      theme: 'Chủ điểm: Bác Hồ kính yêu — Tổng kết năm học & An toàn tuyệt đối mùa hè sông nước',
      tasks: [
        { id: 'k6-t5-1', title: 'Đôn đốc học sinh thi nghiêm túc kỳ kiểm tra Cuối học kỳ II', targetWeek: 33, completed: false },
        { id: 'k6-t5-2', title: 'Đánh giá, xếp loại kết quả Rèn luyện và Học tập cả năm theo Thông tư 22/BGDĐT; Hoàn thiện học bạ điện tử', targetWeek: 34, completed: false },
        { id: 'k6-t5-3', title: 'Họp Cha mẹ học sinh Tổng kết năm học; Thông báo kết quả học tập và rèn luyện', targetWeek: 35, completed: false },
        { id: 'k6-t5-4', title: 'Lễ Tổng kết năm học và Bàn giao 100% học sinh về sinh hoạt hè tại Đoàn thanh niên xã Phú Thọ', targetWeek: 35, completed: false },
        { id: 'k6-t5-5', title: 'Ký cam kết 100% gia đình quản lý con em phòng tránh tai nạn đuối nước mùa hè sông nước miền Tây', targetWeek: 35, completed: false, note: 'Nhắc nhở không tắm sông, kênh rạch tự phát khi không có người lớn' },
      ],
    },
    {
      month: 6,
      monthName: 'Tháng 6/2027',
      theme: 'Chủ điểm: Mùa hè tình nguyện Đất Sen Hồng — Rèn luyện kỹ năng sống & An toàn sông nước',
      tasks: [
        { id: 'k6-t6-1', title: 'Phối hợp Đoàn xã Phú Thọ tổ chức các lớp phổ cập bơi miễn phí cho học sinh', targetWeek: 36, completed: false, note: 'Xóa mù bơi cho học sinh vùng sông nước' },
        { id: 'k6-t6-2', title: 'Lập danh sách và thông báo kế hoạch rèn luyện thêm trong hè cho học sinh chưa đạt chuẩn (nếu có)', targetWeek: 37, completed: false },
        { id: 'k6-t6-3', title: 'Khuyến khích học sinh đọc sách hè và tham gia các hoạt động thiện nguyện tại ấp', targetWeek: 38, completed: false },
      ],
    },
  ],


  // ==========================================
  // KHỐI 7 THCS (Tâm lý dậy thì 12-13 tuổi, tình bạn học đường, an toàn mạng xã hội)
  // ==========================================
  7: [
    {
      month: 9,
      monthName: 'Tháng 9/2026',
      theme: 'Chủ điểm: Tiếp nối truyền thống — Kỷ cương nề nếp & An toàn mùa lũ (Xã Phú Thọ)',
      tasks: [
        { id: 'k7-t9-1', title: 'Ổn định tổ chức lớp, sắp xếp chỗ ngồi phù hợp với sự phát triển chiều cao thể chất của học sinh lớp 7', targetWeek: 1, completed: true },
        { id: 'k7-t9-2', title: 'Tuyên truyền nề nếp chấp hành Luật giao thông đường thủy & đường bộ mùa nước nổi xã Phú Thọ', targetWeek: 1, completed: true, note: 'Ký cam kết an toàn giao thông đầu năm' },
        { id: 'k7-t9-3', title: 'Kiện toàn Ban cán sự lớp, phát huy tinh thần làm chủ và tự quản của học sinh', targetWeek: 1, completed: true },
        { id: 'k7-t9-4', title: 'Rà soát học sinh có hoàn cảnh khó khăn tại xã Phú Thọ để đề xuất nhà trường hỗ trợ học bổng', targetWeek: 2, completed: true },
        { id: 'k7-t9-5', title: 'Tổ chức Đại hội Chi đội năm học 2026 - 2027', targetWeek: 2, completed: true },
        { id: 'k7-t9-6', title: 'Họp Cha mẹ học sinh đầu năm: Phối hợp giáo dục tâm sinh lý lứa tuổi 12-13', targetWeek: 3, completed: false },
        { id: 'k7-t9-7', title: 'Khảo sát chất lượng đầu năm môn Toán, Ngữ văn, Tiếng Anh và KHTN 7', targetWeek: 4, completed: false },
      ],
    },
    {
      month: 10,
      monthName: 'Tháng 10/2026',
      theme: 'Chủ điểm: Tình bạn đẹp tuổi dậy thì & Chung tay bảo tồn Vườn Quốc gia Tràm Chim',
      tasks: [
        { id: 'k7-t10-1', title: 'Thi đua "Hoa điểm 10 tặng Cô và Mẹ" kỷ niệm ngày Phụ nữ Việt Nam 20/10', targetWeek: 6, completed: false },
        { id: 'k7-t10-2', title: 'Sinh hoạt chuyên đề: "Xây dựng tình bạn đẹp — Nói không với bạo lực học đường và cô lập bạn bè"', targetWeek: 7, completed: false, note: 'Uốn nắn mâu thuẫn tuổi dậy thì, gắn kết tình bạn' },
        { id: 'k7-t10-3', title: 'Tổ chức phong trào bảo vệ môi trường: Không vứt rác xuống kênh mương, bảo vệ sinh thái Tràm Chim', targetWeek: 8, completed: false },
        { id: 'k7-t10-4', title: 'Ôn tập và chuẩn bị kiểm tra Giữa học kỳ I cho học sinh', targetWeek: 9, completed: false },
      ],
    },
    {
      month: 11,
      monthName: 'Tháng 11/2026',
      theme: 'Chủ điểm: Tôn sư trọng đạo — Tri ân Thầy Cô & Đất Sen hiếu học',
      tasks: [
        { id: 'k7-t11-1', title: 'Phát động tuần học tốt, tiết học tốt dâng tặng thầy cô nhân ngày 20/11', targetWeek: 10, completed: false },
        { id: 'k7-t11-2', title: 'Tập luyện văn nghệ tham gia Hội thi văn nghệ truyền thống của trường', targetWeek: 11, completed: false },
        { id: 'k7-t11-3', title: 'Sinh hoạt truyền thống kỷ niệm Lễ giỗ Cụ Phó bảng Nguyễn Sinh Sắc', targetWeek: 11, completed: false },
        { id: 'k7-t11-4', title: 'Sơ kết đợt thi đua 20/11, biểu dương học sinh có chuyển biến tốt về hạnh kiểm', targetWeek: 12, completed: false },
      ],
    },
    {
      month: 12,
      monthName: 'Tháng 12/2026',
      theme: 'Chủ điểm: Uống nước nhớ nguồn & Bứt phá chất lượng thi Cuối Học kỳ I',
      tasks: [
        { id: 'k7-t12-1', title: 'Sinh hoạt truyền thống kỷ niệm Ngày thành lập Quân đội nhân dân Việt Nam 22/12', targetWeek: 15, completed: false },
        { id: 'k7-t12-2', title: 'Triển khai mô hình "Đôi bạn học tốt" hỗ trợ học sinh yếu các môn Toán, Anh, KHTN', targetWeek: 16, completed: false },
        { id: 'k7-t12-3', title: 'Tham gia kỳ kiểm tra Cuối học kỳ I nghiêm túc, đúng quy chế', targetWeek: 18, completed: false },
        { id: 'k7-t12-4', title: 'Tổng kết đánh giá kết quả rèn luyện và học tập HK1 theo Thông tư 22/BGDĐT', targetWeek: 18, completed: false },
      ],
    },
    {
      month: 1,
      monthName: 'Tháng 1/2027',
      theme: 'Chủ điểm: Sơ kết Học kỳ I & Đón Tết cổ truyền Đất Sen Hồng văn minh',
      tasks: [
        { id: 'k7-t1-1', title: 'Tổ chức Hội nghị Cha mẹ học sinh Sơ kết Học kỳ I', targetWeek: 19, completed: false },
        { id: 'k7-t1-2', title: 'Tuyên truyền học sinh sử dụng mạng xã hội văn minh, không chơi game bạo lực trong dịp Tết', targetWeek: 20, completed: false },
        { id: 'k7-t1-3', title: 'Tuyên truyền nghiêm cấm đốt pháo nổ, đua xe và an toàn bến đò xã Phú Thọ ngày Tết', targetWeek: 20, completed: false },
        { id: 'k7-t1-4', title: 'Tặng quà Tết "Áo xuân cho bạn nghèo" trong lớp', targetWeek: 20, completed: false },
      ],
    },
    {
      month: 2,
      monthName: 'Tháng 2/2027',
      theme: 'Chủ điểm: Bắt nhịp học tập Kỳ II — Kỹ năng số & Ứng xử mạng xã hội',
      tasks: [
        { id: 'k7-t2-1', title: 'Điểm danh nắm sĩ số sau Tết, kịp thời liên hệ phụ huynh nếu học sinh vắng học không lý do', targetWeek: 21, completed: false },
        { id: 'k7-t2-2', title: 'Ổn định nề nếp truy bài và giờ giấc học tập', targetWeek: 21, completed: false },
        { id: 'k7-t2-3', title: 'Tổ chức chuyên đề: Sử dụng điện thoại thông minh và mạng xã hội an toàn, lành mạnh', targetWeek: 22, completed: false },
      ],
    },
    {
      month: 3,
      monthName: 'Tháng 3/2027',
      theme: 'Chủ điểm: Thiếu nhi vui khỏe — Rèn luyện kỹ năng tự lập & Thể thao',
      tasks: [
        { id: 'k7-t3-1', title: 'Tham gia ngày hội thể dục thể thao và trò chơi dân gian chào mừng 26/3', targetWeek: 24, completed: false },
        { id: 'k7-t3-2', title: 'Giáo dục kỹ năng phòng chống đuối nước và kỹ năng thoát hiểm khi gặp sự cố sông nước', targetWeek: 25, completed: false },
        { id: 'k7-t3-3', title: 'Ôn tập và kiểm tra Giữa học kỳ II', targetWeek: 26, completed: false },
      ],
    },
    {
      month: 4,
      monthName: 'Tháng 4/2027',
      theme: 'Chủ điểm: Non sông một dải — Tăng tốc củng cố kiến thức cuối năm',
      tasks: [
        { id: 'k7-t4-1', title: 'Sinh hoạt truyền thống chào mừng Ngày Giải phóng miền Nam 30/4', targetWeek: 28, completed: false },
        { id: 'k7-t4-2', title: 'Tăng cường bồi dưỡng, phụ đạo học sinh có nguy cơ chưa đạt môn Toán, KHTN 7', targetWeek: 29, completed: false },
        { id: 'k7-t4-3', title: 'Chuẩn bị ôn tập kỳ kiểm tra Cuối học kỳ II theo đề chung của Phòng GD&ĐT', targetWeek: 30, completed: false },
      ],
    },
    {
      month: 5,
      monthName: 'Tháng 5/2027',
      theme: 'Chủ điểm: Bác Hồ kính yêu — Tổng kết năm học & Bàn giao sinh hoạt hè an toàn',
      tasks: [
        { id: 'k7-t5-1', title: 'Đôn đốc học sinh thi nghiêm túc kỳ kiểm tra Cuối học kỳ II', targetWeek: 33, completed: false },
        { id: 'k7-t5-2', title: 'Đánh giá xếp loại kết quả Rèn luyện và Học tập cả năm theo Thông tư 22/BGDĐT', targetWeek: 34, completed: false },
        { id: 'k7-t5-3', title: 'Họp Cha mẹ học sinh Tổng kết năm học 2026 - 2027', targetWeek: 35, completed: false },
        { id: 'k7-t5-4', title: 'Bàn giao học sinh về sinh hoạt hè tại Đoàn thanh niên xã Phú Thọ; Dặn dò an toàn bơi lội mùa hè sông Tiền', targetWeek: 35, completed: false },
        { id: 'k7-t5-5', title: 'Ký cam kết phòng chống đuối nước mùa hè sông nước giữa nhà trường - gia đình - xã', targetWeek: 35, completed: false },
      ],
    },
    {
      month: 6,
      monthName: 'Tháng 6/2027',
      theme: 'Chủ điểm: Sinh hoạt hè an toàn tại địa phương & Ôn tập củng cố hè',
      tasks: [
        { id: 'k7-t6-1', title: 'Phối hợp Đoàn xã Phú Thọ tổ chức sinh hoạt hè, văn hóa thể thao lành mạnh cho thiếu nhi', targetWeek: 36, completed: false },
        { id: 'k7-t6-2', title: 'Đôn đốc học sinh tham gia các lớp bơi phòng chống đuối nước do huyện Tam Nông phát động', targetWeek: 37, completed: false },
        { id: 'k7-t6-3', title: 'Thông báo lịch và kế hoạch bồi dưỡng trong hè cho học sinh cần rèn luyện thêm (nếu có)', targetWeek: 38, completed: false },
      ],
    },
  ],

  // ==========================================
  // KHỐI 8 THCS (Khối bản lề, kiến thức phân hóa cao, phòng chống thuốc lá điện tử, KHKT)
  // ==========================================
  8: [
    {
      month: 9,
      monthName: 'Tháng 9/2026',
      theme: 'Chủ điểm: Khối bản lề tăng tốc — Kỷ cương & An toàn mùa nước nổi (Xã Phú Thọ)',
      tasks: [
        { id: 'k8-t9-1', title: 'Ổn định tổ chức lớp, quán triệt tầm quan trọng của năm học bản lề Khối 8 THCS', targetWeek: 1, completed: true },
        { id: 'k8-t9-2', title: 'Tuyên truyền phòng chống đuối nước mùa lũ trên sông Tiền và các kênh nội đồng xã Phú Thọ', targetWeek: 1, completed: true, note: 'Ký cam kết an toàn giao thông đường thủy & đường bộ' },
        { id: 'k8-t9-3', title: 'Kiện toàn Ban cán sự lớp, phân công cán sự phụ trách học tập các môn KHTN, Lịch sử - Địa lý', targetWeek: 1, completed: true },
        { id: 'k8-t9-4', title: 'Rà soát hoàn cảnh học sinh hộ nghèo, khó khăn tại xã Phú Thọ cần trợ cấp', targetWeek: 2, completed: true },
        { id: 'k8-t9-5', title: 'Tổ chức Đại hội Chi đội nhiệm kỳ 2026 - 2027', targetWeek: 2, completed: true },
        { id: 'k8-t9-6', title: 'Họp Cha mẹ học sinh đầu năm: Định hướng phương pháp học tập các môn chuyên sâu', targetWeek: 3, completed: false },
        { id: 'k8-t9-7', title: 'Khảo sát chất lượng đầu năm, phát hiện nhân tố bồi dưỡng học sinh giỏi huyện Tam Nông', targetWeek: 4, completed: false },
      ],
    },
    {
      month: 10,
      monthName: 'Tháng 10/2026',
      theme: 'Chủ điểm: Thi đua học tốt — Giáo dục sức khỏe giới tính & Bảo vệ Tràm Chim',
      tasks: [
        { id: 'k8-t10-1', title: 'Thi đua "Hoa điểm 10 dâng tặng Mẹ và Cô" chào mừng ngày 20/10', targetWeek: 6, completed: false },
        { id: 'k8-t10-2', title: 'Sinh hoạt chuyên đề: "Chăm sóc sức khỏe sinh sản vị thành niên & Nói không với thuốc lá điện tử"', targetWeek: 7, completed: false, note: 'Cảnh báo nguy cơ thuốc lá điện tử xâm nhập học đường' },
        { id: 'k8-t10-3', title: 'Khuyến khích học sinh tìm hiểu ý tưởng sáng tạo KHKT gắn với nông nghiệp và du lịch sinh thái Đồng Tháp', targetWeek: 8, completed: false },
        { id: 'k8-t10-4', title: 'Ôn tập và hướng dẫn phương pháp làm bài thi Giữa học kỳ I', targetWeek: 9, completed: false },
      ],
    },
    {
      month: 11,
      monthName: 'Tháng 11/2026',
      theme: 'Chủ điểm: Tôn sư trọng đạo — Tri ân Thầy Cô giáo 20/11 & Cội nguồn Đất Sen',
      tasks: [
        { id: 'k8-t11-1', title: 'Phát động phong trào thi đua tuần học tốt, giờ học tốt chào mừng 20/11', targetWeek: 10, completed: false },
        { id: 'k8-t11-2', title: 'Hướng dẫn Chi đội tham gia thi làm tập san / video clip tri ân thầy cô giáo', targetWeek: 11, completed: false },
        { id: 'k8-t11-3', title: 'Lồng ghép sinh hoạt truyền thống nhân Lễ giỗ Cụ Phó bảng Nguyễn Sinh Sắc', targetWeek: 11, completed: false },
        { id: 'k8-t11-4', title: 'Sơ kết đợt thi đua 20/11, tuyên dương các học sinh có tiến bộ vượt bậc', targetWeek: 12, completed: false },
      ],
    },
    {
      month: 12,
      monthName: 'Tháng 12/2026',
      theme: 'Chủ điểm: Tiếp bước anh bộ đội Cụ Hồ — Đột phá điểm số Cuối Học kỳ I',
      tasks: [
        { id: 'k8-t12-1', title: 'Sinh hoạt truyền thống kỷ niệm 22/12: Thăm viếng Bia tưởng niệm liệt sĩ xã Phú Thọ', targetWeek: 15, completed: false },
        { id: 'k8-t12-2', title: 'Phân công học sinh khá giỏi phụ đạo học sinh yếu kém môn Toán, Anh, KHTN', targetWeek: 16, completed: false },
        { id: 'k8-t12-3', title: 'Tổ chức ôn thi và tham gia kỳ thi Cuối học kỳ I nghiêm túc', targetWeek: 18, completed: false },
        { id: 'k8-t12-4', title: 'Đánh giá, xếp loại kết quả Rèn luyện và Học tập HK1 theo Thông tư 22/BGDĐT', targetWeek: 18, completed: false },
      ],
    },
    {
      month: 1,
      monthName: 'Tháng 1/2027',
      theme: 'Chủ điểm: Sơ kết Học kỳ I & Tết sum vầy, an toàn Đất Sen Hồng',
      tasks: [
        { id: 'k8-t1-1', title: 'Hội nghị Cha mẹ học sinh Sơ kết Học kỳ I', targetWeek: 19, completed: false },
        { id: 'k8-t1-2', title: 'Tuyên truyền nghiêm cấm tệ nạn cờ bạc, pháo nổ, an toàn giao thông Tết tại xã Phú Thọ', targetWeek: 20, completed: false },
        { id: 'k8-t1-3', title: 'Tham gia chương trình "Cây mùa xuân — Tết sẻ chia" cho bạn nghèo', targetWeek: 20, completed: false },
        { id: 'k8-t1-4', title: 'Ký cam kết nghỉ Tết an toàn, lành mạnh cho 100% học sinh và phụ huynh', targetWeek: 20, completed: false },
      ],
    },
    {
      month: 2,
      monthName: 'Tháng 2/2027',
      theme: 'Chủ điểm: Bứt phá Học kỳ II & Khởi động phong trào Sáng tạo trẻ',
      tasks: [
        { id: 'k8-t2-1', title: 'Nắm chắc sĩ số lớp ngay sau Tết, phối hợp ban ấp xã Phú Thọ vận động học sinh trở lại trường', targetWeek: 21, completed: false },
        { id: 'k8-t2-2', title: 'Ổn định nề nếp truy bài, củng cố tác phong đồng phục nghiêm túc', targetWeek: 21, completed: false },
        { id: 'k8-t2-3', title: 'Hưởng ứng phong trào Tết trồng cây, giữ gìn môi trường xanh - sạch - đẹp', targetWeek: 22, completed: false },
      ],
    },
    {
      month: 3,
      monthName: 'Tháng 3/2027',
      theme: 'Chủ điểm: Tiến bước lên Đoàn — Tháng Thanh niên 26/3',
      tasks: [
        { id: 'k8-t3-1', title: 'Lập danh sách Đội viên ưu tú 14 tuổi chuẩn bị bồi dưỡng Cảm tình Đoàn', targetWeek: 24, completed: false },
        { id: 'k8-t3-2', title: 'Tập luyện và tham gia Hội thao thanh thiếu nhi chào mừng 26/3', targetWeek: 25, completed: false },
        { id: 'k8-t3-3', title: 'Ôn tập và kiểm tra Giữa học kỳ II các môn học', targetWeek: 26, completed: false },
      ],
    },
    {
      month: 4,
      monthName: 'Tháng 4/2027',
      theme: 'Chủ điểm: Non sông thống nhất & Chuẩn bị tâm thế bước vào Khối 9 cuối cấp',
      tasks: [
        { id: 'k8-t4-1', title: 'Sinh hoạt truyền thống kỷ niệm 30/4 Ngày Giải phóng miền Nam', targetWeek: 28, completed: false },
        { id: 'k8-t4-2', title: 'Tư vấn ban đầu về tâm lý học tập và yêu cầu kiến thức chuẩn bị cho năm học lớp 9', targetWeek: 29, completed: false },
        { id: 'k8-t4-3', title: 'Tăng tốc ôn tập kiểm tra Cuối kỳ II cho học sinh', targetWeek: 30, completed: false },
      ],
    },
    {
      month: 5,
      monthName: 'Tháng 5/2027',
      theme: 'Chủ điểm: Bác Hồ kính yêu — Tổng kết năm học bản lề & An toàn kỳ nghỉ hè',
      tasks: [
        { id: 'k8-t5-1', title: 'Đôn đốc học sinh thi nghiêm túc kỳ kiểm tra Cuối học kỳ II', targetWeek: 33, completed: false },
        { id: 'k8-t5-2', title: 'Đánh giá, xếp loại kết quả Rèn luyện và Học tập cả năm theo Thông tư 22/BGDĐT', targetWeek: 34, completed: false },
        { id: 'k8-t5-3', title: 'Hội nghị Cha mẹ học sinh Tổng kết năm học; Thông báo định hướng kế hoạch ôn tập hè lớp 9', targetWeek: 35, completed: false },
        { id: 'k8-t5-4', title: 'Bàn giao học sinh về sinh hoạt hè tại Đoàn xã Phú Thọ; Tuyên truyền phòng chống đuối nước sông rạch hè', targetWeek: 35, completed: false },
      ],
    },
    {
      month: 6,
      monthName: 'Tháng 6/2027',
      theme: 'Chủ điểm: Nghỉ hè an toàn & Khởi động lộ trình tự học chuẩn bị Khối 9 then chốt',
      tasks: [
        { id: 'k8-t6-1', title: 'Hướng dẫn tài liệu tự đọc, củng cố kiến thức hè môn Toán, Văn, Tiếng Anh chuẩn bị bước vào lớp 9', targetWeek: 36, completed: false },
        { id: 'k8-t6-2', title: 'Phối hợp gia đình và Đoàn xã Phú Thọ quản lý học sinh hè, phổ cập bơi lội an toàn', targetWeek: 37, completed: false },
      ],
    },
  ],

  // ==========================================
  // KHỐI 9 THCS (Khối cuối cấp, thi tuyển sinh 10 THPT công lập & phân luồng sau THCS)
  // ==========================================
  9: [
    {
      month: 9,
      monthName: 'Tháng 9/2026',
      theme: 'Chủ điểm: Mái trường mến yêu — Kỷ cương nề nếp & Xác định mục tiêu thi vào 10 (Xã Phú Thọ)',
      tasks: [
        { id: 'k9-t9-1', title: 'Ổn định tổ chức lớp, xây dựng nề nếp học tập nghiêm túc cho năm học cuối cấp lớp 9', targetWeek: 1, completed: true, note: 'Đã kiện toàn ban cán sự + 4 tổ trưởng' },
        { id: 'k9-t9-2', title: 'Tuyên truyền phòng chống tai nạn đuối nước mùa lũ sông Tiền cho học sinh xã Phú Thọ', targetWeek: 1, completed: true, note: '100% học sinh ký cam kết an toàn giao thông đường bộ & đường thủy' },
        { id: 'k9-t9-3', title: 'Tổ chức Đại hội Chi đội cuối cấp nhiệm kỳ 2026 - 2027', targetWeek: 2, completed: true },
        { id: 'k9-t9-4', title: 'Rà soát hoàn cảnh học sinh hộ nghèo, cận nghèo tại xã Phú Thọ để trợ cấp kịp thời', targetWeek: 2, completed: true },
        { id: 'k9-t9-5', title: 'Hội nghị Cha mẹ học sinh đầu năm: Quán triệt mục tiêu thi tuyển sinh lớp 10 THPT tỉnh Đồng Tháp', targetWeek: 3, completed: false, note: 'Lịch: 20/09/2026' },
        { id: 'k9-t9-6', title: 'Khảo sát chất lượng đầu năm môn Toán, Ngữ văn, Tiếng Anh để phân loại năng lực', targetWeek: 4, completed: false, note: 'Lập kế hoạch phụ đạo cho học sinh yếu' },
      ],
    },
    {
      month: 10,
      monthName: 'Tháng 10/2026',
      theme: 'Chủ điểm: Chăm ngoan học giỏi — Bứt phá điểm số & Tình yêu quê hương Đất Sen Hồng',
      tasks: [
        { id: 'k10-t10-1', title: 'Phát động phong trào thi đua "Hoa điểm 10 tặng Mẹ và Cô" chào mừng 20/10', targetWeek: 6, completed: false },
        { id: 'k10-t10-2', title: 'Thành lập các nhóm "Đôi bạn cùng tiến" luyện đề 3 môn Toán, Văn, Anh thi vào lớp 10', targetWeek: 7, completed: false },
        { id: 'k10-t10-3', title: 'Sinh hoạt chuyên đề: Tự hào quê hương Đồng Tháp và bảo tồn thiên nhiên Vườn Quốc gia Tràm Chim', targetWeek: 8, completed: false },
        { id: 'k10-t10-4', title: 'Ôn tập và hướng dẫn phương pháp làm bài kiểm tra Giữa học kỳ I theo cấu trúc mới', targetWeek: 9, completed: false },
      ],
    },
    {
      month: 11,
      monthName: 'Tháng 11/2026',
      theme: 'Chủ điểm: Tôn sư trọng đạo — Tri ân Thầy Cô giáo 20/11 & Cụ Phó bảng Nguyễn Sinh Sắc',
      tasks: [
        { id: 'k9-t11-1', title: 'Phát động thi đua "Tuần học tốt — Giờ học tốt" chào mừng Ngày Nhà giáo Việt Nam', targetWeek: 10, completed: false },
        { id: 'k9-t11-2', title: 'Hướng dẫn Chi đội làm báo tường / tập san tri ân thầy cô giáo trước khi ra trường', targetWeek: 11, completed: false },
        { id: 'k9-t11-3', title: 'Sinh hoạt truyền thống nhân Lễ giỗ Cụ Phó bảng Nguyễn Sinh Sắc, noi gương hiếu học', targetWeek: 11, completed: false },
        { id: 'k9-t11-4', title: 'Sơ kết đợt thi đua 20/11, khen thưởng các cá nhân đạt điểm 9, điểm 10 nhiều nhất', targetWeek: 12, completed: false },
      ],
    },
    {
      month: 12,
      monthName: 'Tháng 12/2026',
      theme: 'Chủ điểm: Tiếp bước anh bộ đội Cụ Hồ — Chiến dịch Ôn thi Cuối Học kỳ I lớp 9',
      tasks: [
        { id: 'k9-t12-1', title: 'Sinh hoạt truyền thống kỷ niệm 22/12: Thăm di tích lịch sử / Nghĩa trang liệt sĩ tại địa phương', targetWeek: 15, completed: false },
        { id: 'k9-t12-2', title: 'Lập kế hoạch ôn tập nước rút học kỳ I, rà soát học sinh có nguy cơ hổng kiến thức', targetWeek: 16, completed: false },
        { id: 'k9-t12-3', title: 'Đôn đốc học sinh tham gia nghiêm túc kỳ kiểm tra Cuối học kỳ I các môn thi chung', targetWeek: 18, completed: false },
        { id: 'k9-t12-4', title: 'Đánh giá, xếp loại kết quả Rèn luyện và Học tập HK1 theo Thông tư 22/BGDĐT', targetWeek: 18, completed: false },
      ],
    },
    {
      month: 1,
      monthName: 'Tháng 1/2027',
      theme: 'Chủ điểm: Sơ kết HK1 — Tư vấn định hướng phân luồng sau THCS & Tết an toàn',
      tasks: [
        { id: 'k9-t1-1', title: 'Hội nghị Cha mẹ học sinh Sơ kết Học kỳ I: Tư vấn phân luồng vào THPT và trường nghề tại huyện Tam Nông', targetWeek: 19, completed: false, note: 'Tư vấn các trường THPT Tràm Chim, THPT Tam Nông, TT GDNN - GDTX Tam Nông' },
        { id: 'k9-t1-2', title: 'Tuyên truyền phòng chống pháo nổ, an toàn giao thông đường thủy & bộ ngày Tết tại xã Phú Thọ', targetWeek: 20, completed: false },
        { id: 'k9-t1-3', title: 'Tổ chức ký cam kết nghỉ Tết an toàn, lành mạnh cho 100% học sinh và phụ huynh', targetWeek: 20, completed: false },
        { id: 'k9-t1-4', title: 'Thăm hỏi, tặng quà Tết học sinh có hoàn cảnh khó khăn trong lớp', targetWeek: 20, completed: false },
      ],
    },
    {
      month: 2,
      monthName: 'Tháng 2/2027',
      theme: 'Chủ điểm: Tăng tốc luyện thi vào lớp 10 sau Tết — Không lãng phí thời gian vàng',
      tasks: [
        { id: 'k9-t2-1', title: 'Nắm chắc sĩ số học sinh ngay sau kỳ nghỉ Tết, ngăn chặn tình trạng học sinh nghỉ học đi làm sớm', targetWeek: 21, completed: false },
        { id: 'k9-t2-2', title: 'Bắt nhịp ngay việc ôn tập và luyện giải đề thi tuyển sinh lớp 10 tỉnh Đồng Tháp các năm trước', targetWeek: 21, completed: false },
        { id: 'k9-t2-3', title: 'Phát động phong trào Tết trồng cây và giữ gìn môi trường xanh - sạch - đẹp', targetWeek: 22, completed: false },
      ],
    },
    {
      month: 3,
      monthName: 'Tháng 3/2027',
      theme: 'Chủ điểm: Tiến bước lên Đoàn — Kết nạp Đoàn viên mới & Thi thử vào lớp 10 lần 1',
      tasks: [
        { id: 'k9-t3-1', title: 'Lập danh sách Đội viên ưu tú 15 tuổi đề xuất học lớp Cảm tình Đoàn và làm lễ Kết nạp Đoàn viên', targetWeek: 24, completed: false, note: 'Tổ chức kết nạp trang trọng' },
        { id: 'k9-t3-2', title: 'Tham gia Hội thao / Ngày hội Thiếu nhi vui khỏe — Tiến bước lên Đoàn 26/3', targetWeek: 25, completed: false },
        { id: 'k9-t3-3', title: 'Tổ chức thi thử tuyển sinh vào lớp 10 lần 1 (3 môn Toán, Văn, Anh) và kiểm tra Giữa kỳ II', targetWeek: 26, completed: false },
      ],
    },
    {
      month: 4,
      monthName: 'Tháng 4/2027',
      theme: 'Chủ điểm: Hoàn thiện hồ sơ tuyển sinh vào lớp 10 & Tư vấn chọn nguyện vọng trường THPT',
      tasks: [
        { id: 'k9-t4-1', title: 'Tư vấn hướng nghiệp, phân luồng chọn trường THPT vừa sức tại Tam Nông / Đồng Tháp (THPT Tràm Chim, THPT Tam Nông, trường Chuyên hoặc học nghề)', targetWeek: 28, completed: false },
        { id: 'k9-t4-2', title: 'Hướng dẫn học sinh và phụ huynh làm hồ sơ đăng ký dự thi tuyển sinh vào lớp 10 trực tuyến & trực tiếp', targetWeek: 29, completed: false },
        { id: 'k9-t4-3', title: 'Tổ chức thi thử tuyển sinh lớp 10 đợt 2 theo ma trận và cấu trúc đề của Sở GD&ĐT Đồng Tháp', targetWeek: 29, completed: false },
        { id: 'k9-t4-4', title: 'Rà soát 100% hồ sơ học sinh (Giấy khai sinh, học bạ, điểm ưu tiên, hộ khẩu) chính xác tuyệt đối', targetWeek: 30, completed: false },
      ],
    },
    {
      month: 5,
      monthName: 'Tháng 5/2027',
      theme: 'Chủ điểm: Về đích vinh quang — Xét tốt nghiệp THCS & Lễ Tri ân — Trưởng thành ra trường',
      tasks: [
        { id: 'k9-t5-1', title: 'Đôn đốc học sinh thi Cuối học kỳ II nghiêm túc, đạt kết quả cao nhất', targetWeek: 33, completed: false },
        { id: 'k9-t5-2', title: 'Đánh giá xếp loại cả năm Thông tư 22/BGDĐT; Hoàn tất hồ sơ xét công nhận tốt nghiệp THCS đạt 100%', targetWeek: 34, completed: false },
        { id: 'k9-t5-3', title: 'Tổ chức Lễ Tri ân và Trưởng thành cho học sinh lớp 9 (niên khóa 2023 - 2027) ấm áp nghĩa tình', targetWeek: 35, completed: false },
        { id: 'k9-t5-4', title: 'Họp Cha mẹ học sinh Tổng kết năm học; Động viên tinh thần học sinh tự tin bước vào kỳ thi tuyển sinh 10', targetWeek: 35, completed: false },
        { id: 'k9-t5-5', title: 'Bàn giao học sinh về sinh hoạt hè tại Đoàn thanh niên xã Phú Thọ; Tuyệt đối chú ý phòng tránh đuối nước hè', targetWeek: 35, completed: false },
      ],
    },
    {
      month: 6,
      monthName: 'Tháng 6/2027',
      theme: 'Chủ điểm: Tiếp sức mùa thi vào lớp 10 THPT tỉnh Đồng Tháp & Hướng dẫn phân luồng',
      tasks: [
        { id: 'k9-t6-1', title: 'Đồng hành, nhắc nhở lịch thi và tiếp sức tinh thần cho học sinh trong kỳ thi tuyển sinh vào lớp 10 THPT tỉnh Đồng Tháp', targetWeek: 36, completed: false, note: 'Hỗ trợ thí sinh về thẻ dự thi, tâm lý, đồ dùng phòng thi' },
        { id: 'k9-t6-2', title: 'Hướng dẫn học sinh và phụ huynh tra cứu điểm thi, hướng dẫn thủ tục nộp đơn phúc khảo (nếu có)', targetWeek: 37, completed: false },
        { id: 'k9-t6-3', title: 'Hướng dẫn làm thủ tục nộp hồ sơ nhập học nguyện vọng 1 hoặc xét tuyển nguyện vọng 2 / trường nghề tại Tam Nông', targetWeek: 38, completed: false },
        { id: 'k9-t6-4', title: 'Phối hợp Đoàn xã Phú Thọ quản lý học sinh trong dịp hè, tuyên truyền an toàn sông nước', targetWeek: 38, completed: false },
      ],
    },
  ],
};

/**
 * Lấy kế hoạch năm học cho khối lớp cụ thể
 */
export function getPhuThoYearPlanForGrade(grade: 6 | 7 | 8 | 9, academicYear: string = '2026 - 2027'): GvcnMonthlyTask[] {
  const plan = PHU_THO_GRADE_PLANS[grade] || PHU_THO_GRADE_PLANS[9];
  // Cập nhật năm học hiển thị nếu cần
  const [startYear, endYear] = academicYear.split('-').map(s => s.trim());
  return plan.map(m => {
    const yearStr = m.month >= 9 ? (startYear || '2026') : (endYear || '2027');
    return {
      ...m,
      monthName: `Tháng ${m.month}/${yearStr}`,
    };
  });
}

/**
 * Ngân hàng các nội dung đề xuất & gợi ý sư phạm cho từng tháng gắn liền địa phương Phú Thọ, Đồng Tháp
 */
export function getPhuThoMonthlySuggestions(grade: 6 | 7 | 8 | 9, month: number): PhuThoSuggestionItem[] {
  const baseSuggestions: Record<number, PhuThoSuggestionItem[]> = {
    9: [
      {
        id: `sug-9-local-1`,
        title: 'Tổ chức ký cam kết 100% học sinh mặc áo phao khi đi đò, xuồng qua kênh rạch xã Phú Thọ mùa lũ',
        category: 'local',
        categoryLabel: 'Địa phương Xã Phú Thọ',
        targetWeek: 1,
        rationale: 'Mùa nước nổi sông Tiền và hệ thống kênh rạch xã Phú Thọ tiềm ẩn nguy cơ đuối nước, cần giáo dục kỹ năng sinh tồn trước tiên.',
        localHighlight: 'Đặc thù sông nước miền Tây - Xã Phú Thọ',
      },
      {
        id: `sug-9-study-1`,
        title: grade === 9 ? 'Khảo sát chất lượng đầu năm 3 môn Toán, Văn, Anh chuẩn bị thi vào lớp 10' : `Khảo sát chất lượng đầu năm môn Toán, Ngữ văn chuẩn Thông tư 22 Khối ${grade}`,
        category: 'study',
        categoryLabel: 'Chuyên môn & Học tập',
        targetWeek: 3,
        rationale: 'Nắm chắc phổ điểm thực tế để phân loại học sinh khá, trung bình, yếu và lập kế hoạch phụ đạo kịp thời.',
      },
      {
        id: `sug-9-discipline-1`,
        title: 'Kiện toàn Ban cán sự lớp, phân công tổ trực nhật và nhóm "Đôi bạn cùng tiến"',
        category: 'discipline',
        categoryLabel: 'Nề nếp & Đội ngũ',
        targetWeek: 1,
        rationale: 'Ổn định bộ máy tự quản giúp lớp vận hành trơn tru suốt năm học mà không phụ thuộc hoàn toàn vào GVCN.',
      },
      {
        id: `sug-9-family-1`,
        title: 'Hội nghị Cha mẹ học sinh đầu năm: Lập kênh Zalo lớp chính thức kết nối 100% phụ huynh',
        category: 'family',
        categoryLabel: 'Phối hợp Phụ huynh',
        targetWeek: 3,
        rationale: 'Xây dựng cầu nối thông tin hai chiều giữa nhà trường và gia đình, kịp thời nắm bắt học sinh vắng học.',
      },
    ],
    10: [
      {
        id: `sug-10-local-1`,
        title: 'Sinh hoạt chuyên đề: Tìm hiểu Khu Ramsar Vườn Quốc gia Tràm Chim (Tam Nông) và bảo vệ Sếu đầu đỏ',
        category: 'local',
        categoryLabel: 'Địa phương Xã Phú Thọ',
        targetWeek: 7,
        rationale: 'Giáo dục tình yêu quê hương đất Sen Hồng, nâng cao ý thức bảo tồn thiên nhiên và không săn bắt chim hoang dã.',
        localHighlight: 'Vườn Quốc gia Tràm Chim - Tam Nông',
      },
      {
        id: `sug-10-study-1`,
        title: 'Phát động phong trào thi đua "Hoa điểm 10 tặng Cô và Mẹ" chào mừng 20/10',
        category: 'study',
        categoryLabel: 'Chuyên môn & Học tập',
        targetWeek: 6,
        rationale: 'Tạo động lực thi đua học tập sôi nổi trong các tổ, tích lũy điểm tốt đầu năm.',
      },
      {
        id: `sug-10-discipline-1`,
        title: 'Chuyên đề Sư phạm: "Xây dựng tình bạn đẹp — Nói không với bạo lực học đường và mâu thuẫn mạng xã hội"',
        category: 'discipline',
        categoryLabel: 'Nề nếp & Đạo đức',
        targetWeek: 8,
        rationale: 'Giải quyết các xích mích tâm lý lứa tuổi dậy thì, hướng dẫn ứng xử văn minh.',
      },
    ],
    11: [
      {
        id: `sug-11-local-1`,
        title: 'Sinh hoạt truyền thống nhân Lễ giỗ Cụ Phó bảng Nguyễn Sinh Sắc — Tấm gương hiếu học Đất Sen Hồng',
        category: 'local',
        categoryLabel: 'Địa phương Xã Phú Thọ',
        targetWeek: 11,
        rationale: 'Lễ giỗ Cụ Phó Bảng là sự kiện văn hóa truyền thống lớn của tỉnh Đồng Tháp, giáo dục lòng biết ơn và đạo làm người.',
        localHighlight: 'Khu Di tích Nguyễn Sinh Sắc - Đồng Tháp',
      },
      {
        id: `sug-11-study-1`,
        title: 'Phát động đợt thi đua "Tuần học tốt — Giờ học tốt" chào mừng Ngày Nhà giáo Việt Nam 20/11',
        category: 'study',
        categoryLabel: 'Chuyên môn & Học tập',
        targetWeek: 10,
        rationale: 'Nâng cao chất lượng giờ học, giảm thiểu học sinh vi phạm không thuộc bài.',
      },
      {
        id: `sug-11-family-1`,
        title: 'Phối hợp Ban đại diện CMHS lớp tổ chức gặp mặt tri ân thầy cô giáo dạy các bộ môn',
        category: 'family',
        categoryLabel: 'Phối hợp Phụ huynh',
        targetWeek: 11,
        rationale: 'Tăng cường sự gắn kết giữa phụ huynh với giáo viên bộ môn của lớp.',
      },
    ],
    12: [
      {
        id: `sug-12-local-1`,
        title: 'Thăm hỏi, động viên gia đình chính sách hoặc viếng Đền tưởng niệm liệt sĩ xã Phú Thọ nhân ngày 22/12',
        category: 'local',
        categoryLabel: 'Địa phương Xã Phú Thọ',
        targetWeek: 15,
        rationale: 'Giáo dục đạo lý "Uống nước nhớ nguồn", tiếp nối truyền thống cách mạng của quê hương Phú Thọ anh hùng.',
        localHighlight: 'Đền tưởng niệm liệt sĩ xã Phú Thọ',
      },
      {
        id: `sug-12-study-1`,
        title: 'Triển khai mô hình học tập nước rút: Học sinh khá giỏi hỗ trợ học sinh yếu ôn thi Cuối Học kỳ I',
        category: 'study',
        categoryLabel: 'Chuyên môn & Học tập',
        targetWeek: 16,
        rationale: 'Ôn tập theo đề cương chuẩn của Bộ GD&ĐT, đảm bảo không có học sinh bị điểm liệt.',
      },
      {
        id: `sug-12-discipline-1`,
        title: 'Quán triệt quy chế thi cử, nói không với gian lận trong kỳ kiểm tra Cuối học kỳ I',
        category: 'discipline',
        categoryLabel: 'Nề nếp & Đạo đức',
        targetWeek: 17,
        rationale: 'Rèn luyện tính trung thực — một trong 5 phẩm chất cốt lõi của Chương trình GDPT 2018.',
      },
    ],
    1: [
      {
        id: `sug-1-local-1`,
        title: 'Tuyên truyền nghiêm cấm tàng trữ, buôn bán và đốt pháo nổ; an toàn bến đò dịp Tết tại xã Phú Thọ',
        category: 'local',
        categoryLabel: 'Địa phương Xã Phú Thọ',
        targetWeek: 20,
        rationale: 'Địa bàn nông thôn giáp sông nước cần bảo đảm an ninh trật tự và an toàn tuyệt đối cho học sinh nghỉ Tết.',
        localHighlight: 'An toàn Tết Nguyên đán xã Phú Thọ',
      },
      {
        id: `sug-1-family-1`,
        title: grade === 9 ? 'Họp Cha mẹ học sinh Sơ kết HK1: Chuyên đề tư vấn phân luồng thi lớp 10 hoặc học nghề tại Tam Nông' : 'Họp Cha mẹ học sinh Sơ kết Học kỳ I: Thông báo kết quả học tập và rèn luyện của học sinh',
        category: 'family',
        categoryLabel: 'Phối hợp Phụ huynh',
        targetWeek: 19,
        rationale: 'Phân tích thực chất học lực, giải tỏa lo lắng của phụ huynh và định hướng lộ trình học kỳ 2.',
      },
      {
        id: `sug-1-discipline-1`,
        title: 'Quyên góp phong trào "Cây mùa xuân — Áo mới cho bạn nghèo" trong chi đội',
        category: 'discipline',
        categoryLabel: 'Nề nếp & Phong trào',
        targetWeek: 20,
        rationale: 'Lan tỏa tinh thần tương thân tương ái nghĩa tình miền Tây.',
      },
    ],
    2: [
      {
        id: `sug-2-local-1`,
        title: 'Nắm chắc sĩ số học sinh ngay sau Tết, liên hệ Trưởng ấp xã Phú Thọ vận động học sinh đi học đều',
        category: 'local',
        categoryLabel: 'Địa phương Xã Phú Thọ',
        targetWeek: 21,
        rationale: 'Ngăn chặn tình trạng học sinh nghỉ học kéo dài hoặc đi theo cha mẹ làm ăn xa sau Tết Nguyên đán.',
        localHighlight: 'Duy trì sĩ số vùng sông nước',
      },
      {
        id: `sug-2-study-1`,
        title: grade === 9 ? 'Khởi động luyện ngân hàng đề thi tuyển sinh 10 tỉnh Đồng Tháp các năm học trước' : 'Bắt nhịp ngay với chương trình Học kỳ II, kiểm tra đồ dùng học tập và bài vở đầu kỳ',
        category: 'study',
        categoryLabel: 'Chuyên môn & Học tập',
        targetWeek: 21,
        rationale: 'Tạo đà học tập sớm, không để tâm lý "tháng Giêng là tháng ăn chơi" làm trễ nải kiến thức.',
      },
      {
        id: `sug-2-discipline-1`,
        title: 'Tham gia phong trào "Tết trồng cây đời đời nhớ ơn Bác", giữ gìn cảnh quan đường làng ngõ xóm Phú Thọ',
        category: 'discipline',
        categoryLabel: 'Nề nếp & Phong trào',
        targetWeek: 22,
        rationale: 'Xây dựng nếp sống văn minh và giữ gìn môi trường Đất Sen Hồng sáng - xanh - sạch - đẹp.',
      },
    ],
    3: [
      {
        id: `sug-3-local-1`,
        title: 'Tổ chức ngày hội trò chơi dân gian miền Tây sông nước chào mừng 26/3 (kéo co, nhảy bao bố, đố vui)',
        category: 'local',
        categoryLabel: 'Địa phương Xã Phú Thọ',
        targetWeek: 25,
        rationale: 'Gìn giữ nét đẹp văn hóa truyền thống Nam Bộ, rèn luyện thể lực và tinh thần đoàn kết.',
        localHighlight: 'Văn hóa dân gian Nam Bộ',
      },
      {
        id: `sug-3-discipline-1`,
        title: grade === 9 ? 'Tổ chức Lễ kết nạp Đoàn viên mới Đoàn TNCS Hồ Chí Minh tại địa chỉ đỏ địa phương' : 'Tuyên dương Đội viên ưu tú trong phong trào "Thiếu nhi vui khỏe — Tiến bước lên Đoàn"',
        category: 'discipline',
        categoryLabel: 'Nề nếp & Đội/Đoàn',
        targetWeek: 24,
        rationale: 'Động viên tinh thần phấn đấu đứng vào hàng ngũ của Đoàn.',
      },
      {
        id: `sug-3-study-1`,
        title: 'Ôn tập và kiểm tra Giữa học kỳ II các môn học',
        category: 'study',
        categoryLabel: 'Chuyên môn & Học tập',
        targetWeek: 26,
        rationale: 'Đánh giá giữa kỳ để kịp thời chấn chỉnh các em có điểm số sa sút.',
      },
    ],
    4: [
      {
        id: `sug-4-local-1`,
        title: grade === 9 ? 'Tư vấn hồ sơ thi vào lớp 10 các trường THPT tại huyện Tam Nông (THPT Tràm Chim, THPT Tam Nông)' : 'Sinh hoạt truyền thống kỷ niệm 30/4 Ngày Giải phóng miền Nam — Thống nhất đất nước',
        category: 'local',
        categoryLabel: 'Địa phương Xã Phú Thọ',
        targetWeek: 28,
        rationale: grade === 9 ? 'Giúp học sinh và phụ huynh đăng ký nguyện vọng phù hợp với học lực thực tế và cự ly di chuyển.' : 'Giáo dục lòng yêu nước và tự hào dân tộc.',
        localHighlight: grade === 9 ? 'Tuyển sinh 10 THPT Tam Nông / Tràm Chim' : 'Lịch sử quê hương',
      },
      {
        id: `sug-4-study-1`,
        title: 'Tăng tốc ôn tập nước rút Cuối học kỳ II, phụ đạo học sinh có nguy cơ rớt chuẩn xếp loại',
        category: 'study',
        categoryLabel: 'Chuyên môn & Học tập',
        targetWeek: 29,
        rationale: 'Đảm bảo tỷ lệ đạt chuẩn học tập theo chỉ tiêu năm học của nhà trường.',
      },
      {
        id: `sug-4-family-1`,
        title: 'Rà soát độ chính xác của hồ sơ học sinh (họ tên khai sinh, ngày sinh, kết quả học tập)',
        category: 'family',
        categoryLabel: 'Phối hợp Phụ huynh',
        targetWeek: 30,
        rationale: 'Tránh sai lệch thông tin trong học bạ điện tử và cơ sở dữ liệu vnEdu.',
      },
    ],
    5: [
      {
        id: `sug-5-local-1`,
        title: 'Bàn giao 100% học sinh về sinh hoạt hè tại Đoàn thanh niên xã Phú Thọ; Tuyên truyền phòng đuối nước hè',
        category: 'local',
        categoryLabel: 'Địa phương Xã Phú Thọ',
        targetWeek: 35,
        rationale: 'Kỳ nghỉ hè miền Tây tiềm ẩn rủi ro đuối nước khi tắm sông, kênh; bắt buộc phụ huynh ký cam kết quản lý con em.',
        localHighlight: 'Phòng chống đuối nước kỳ nghỉ hè',
      },
      {
        id: `sug-5-discipline-1`,
        title: grade === 9 ? 'Tổ chức Lễ Tri ân và Trưởng thành ấm áp cho học sinh lớp 9 niên khóa 2023 - 2027' : 'Đánh giá, xếp loại kết quả Rèn luyện và Học tập cả năm theo Thông tư 22/BGDĐT',
        category: 'discipline',
        categoryLabel: 'Nề nếp & Tổng kết',
        targetWeek: 34,
        rationale: 'Tạo dấu ấn kỷ niệm sâu sắc thời áo trắng và khép lại năm học ý nghĩa.',
      },
      {
        id: `sug-5-family-1`,
        title: 'Hội nghị Cha mẹ học sinh Tổng kết năm học; Khen thưởng học sinh Xuất sắc, học sinh Giỏi',
        category: 'family',
        categoryLabel: 'Phối hợp Phụ huynh',
        targetWeek: 35,
        rationale: 'Báo cáo công khai kết quả giáo dục toàn diện của lớp và tri ân sự đồng hành của phụ huynh.',
      },
    ],
    6: [
      {
        id: `sug-6-local-1`,
        title: grade === 9 ? 'Tiếp sức mùa thi: Động viên, nhắc nhở học sinh tham gia kỳ thi tuyển sinh vào lớp 10 THPT tỉnh Đồng Tháp' : 'Phối hợp Đoàn xã Phú Thọ tổ chức các hoạt động hè và lớp dạy bơi an toàn cho học sinh',
        category: 'local',
        categoryLabel: 'Địa phương Xã Phú Thọ',
        targetWeek: 36,
        rationale: grade === 9 ? 'Kỳ thi tuyển sinh lớp 10 là mốc quan trọng nhất của học sinh THCS, GVCN giữ liên lạc thông suốt hỗ trợ các em.' : 'Đảm bảo an toàn sông nước cho thiếu nhi trong dịp hè.',
        localHighlight: grade === 9 ? 'Tuyển sinh 10 Sở GD&ĐT Đồng Tháp' : 'Phổ cập bơi lội an toàn',
      },
      {
        id: `sug-6-study-1`,
        title: grade === 9 ? 'Hướng dẫn tra cứu điểm thi tuyển sinh 10, hướng dẫn làm đơn phúc khảo và nộp hồ sơ nhập học' : 'Thông báo kế hoạch và phân công ôn tập củng cố hè cho học sinh có kết quả rèn luyện trong hè',
        category: 'study',
        categoryLabel: 'Chuyên môn & Học tập',
        targetWeek: 37,
        rationale: grade === 9 ? 'Giúp học sinh và phụ huynh nắm rõ lịch xét tuyển bổ sung, nhập học nguyện vọng hoặc đăng ký trường nghề.' : 'Nâng cao chất lượng giáo dục, củng cố kiến thức.',
      },
      {
        id: `sug-6-family-1`,
        title: 'Phối hợp phụ huynh học sinh quản lý việc sử dụng mạng xã hội, phòng chống đuối nước và tai nạn thương tích hè',
        category: 'family',
        categoryLabel: 'Phối hợp Phụ huynh',
        targetWeek: 38,
        rationale: 'Kỳ nghỉ hè cần sự giám sát chặt chẽ từ gia đình để tránh tai nạn thương tâm vùng sông nước.',
      },
    ],
  };

  return baseSuggestions[month] || baseSuggestions[9];
}

