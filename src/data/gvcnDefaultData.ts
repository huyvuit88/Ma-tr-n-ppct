import {
  GvcnClassInfo,
  GvcnClassRule,
  GvcnStudent,
  GvcnWeeklyRecord,
  GvcnSpecialStudent,
  GvcnParentContact,
  GvcnMonthlyTask,
  GvcnSeatingChartConfig,
} from '../types';
import { getPhuThoYearPlanForGrade } from './gvcnPhuThoPlans';

export const defaultGvcnClassInfo: GvcnClassInfo = {
  className: '', // Tùy chỉnh theo người dùng, không mặc định
  grade: '',
  academicYear: '2026 - 2027',
  schoolName: 'TRƯỜNG THCS VÀ THPT PHÚ THÀNH',
  homeroomTeacher: 'Dương Văn Trong',
  room: '',
  totalStudents: 0,
  maleCount: 0,
  femaleCount: 0,
  youthUnionMembers: 0,
  boardOfLeaders: {
    monitor: '',
    viceMonitorStudy: '',
    viceMonitorDiscipline: '',
    treasurer: '',
    secretary: '',
  },
  parentCommittee: {
    head: '',
    headPhone: '',
    deputy: '',
    deputyPhone: '',
    zaloGroupLink: '',
  },
};

export const defaultGvcnRules: GvcnClassRule[] = [
  {
    id: 'rule-1',
    category: 'chuyen_can',
    categoryLabel: 'Chuyên cần & Đúng giờ',
    title: 'Đúng giờ truy bài & vào lớp',
    description: 'Có mặt tại lớp trước 7h00 (buổi sáng) hoặc 13h00 (buổi chiều). Vắng mặt phải có giấy xin phép có chữ ký phụ huynh hoặc phụ huynh trực tiếp gọi điện/nhắn tin báo GVCN trước giờ học.',
    penaltyPoints: -2,
    rewardPoints: 5,
  },
  {
    id: 'rule-2',
    category: 'tac_phong',
    categoryLabel: 'Tác phong & Đồng phục',
    title: 'Đồng phục, huy hiệu, khăn quàng',
    description: 'Mặc đúng áo đồng phục trường các ngày trong tuần (thứ 2 mặc áo sơ mi trắng có phù hiệu); đeo khăn quàng đỏ chỉnh tề; đi giày hoặc dép có quai hậu; đầu tóc gọn gàng (không nhuộm màu, không bấm lỗ tai với nam).',
    penaltyPoints: -2,
    rewardPoints: 2,
  },
  {
    id: 'rule-3',
    category: 'hoc_tap',
    categoryLabel: 'Nề nếp học tập',
    title: 'Chuẩn bị bài cũ & Đồ dùng học tập',
    description: 'Học bài và làm đầy đủ bài tập về nhà theo thời khóa biểu; mang đủ SGK, vở ghi, dụng cụ học tập (thước, compa, MTCT). 15 phút đầu giờ truy bài nghiêm túc, cán sự kiểm tra chéo vở bài tập.',
    penaltyPoints: -5,
    rewardPoints: 5,
  },
  {
    id: 'rule-4',
    category: 'hoc_tap',
    categoryLabel: 'Nề nếp học tập',
    title: 'Trật tự, tích cực nghe giảng & Xây dựng bài',
    description: 'Tuyệt đối không nói chuyện riêng, làm việc riêng trong giờ học. Hăng hái phát biểu xây dựng bài. Được giáo viên bộ môn ghi nhận phát biểu tốt (+2đ) hoặc điểm 9-10 (+5đ).',
    penaltyPoints: -3,
    rewardPoints: 5,
  },
  {
    id: 'rule-5',
    category: 'hoc_tap',
    categoryLabel: 'Kỷ luật công nghệ',
    title: 'Sử dụng điện thoại di động trong trường',
    description: 'Chỉ được phép sử dụng điện thoại khi có sự hướng dẫn phục vụ mục đích học tập của giáo viên bộ môn. Nghiêm cấm chơi game, lướt mạng xã hội, quay phim/chụp ảnh trái phép trong giờ.',
    penaltyPoints: -10,
    rewardPoints: 0,
  },
  {
    id: 'rule-6',
    category: 've_sinh',
    categoryLabel: 'Vệ sinh & Cơ sở vật chất',
    title: 'Trực nhật & Giữ gìn vệ sinh chung',
    description: 'Tổ trực nhật có mặt sớm 20 phút để quét lớp, lau bảng, đổ rác, chuẩn bị phấn nước. Cuối buổi tắt toàn bộ quạt, bóng điện, đóng cửa sổ. Không vứt rác bừa bãi trong lớp và hành lang.',
    penaltyPoints: -5,
    rewardPoints: 10,
  },
  {
    id: 'rule-7',
    category: 'dao_duc',
    categoryLabel: 'Đạo đức & Văn hóa học đường',
    title: 'Lễ phép với thầy cô & Hòa đồng với bạn bè',
    description: 'Gặp thầy cô giáo, cán bộ công nhân viên trong trường phải khoanh tay chào lễ phép. Đoàn kết, giúp đỡ bạn bè cùng tiến bộ. Nghiêm cấm nói tục, chửi thề, kỳ thị, cô lập bạn hoặc gây gổ đánh nhau.',
    penaltyPoints: -20,
    rewardPoints: 10,
  },
  {
    id: 'rule-8',
    category: 'dao_duc',
    categoryLabel: 'An toàn giao thông',
    title: 'Chấp hành Luật An toàn giao thông',
    description: 'Đi xe đạp điện/xe máy điện bắt buộc phải đội mũ bảo hiểm đạt chuẩn; không đi hàng 3 hàng 4, không lạng lách đánh võng; không tụ tập trước cổng trường gây ách tắc giao thông.',
    penaltyPoints: -20,
    rewardPoints: 5,
  },
];

export const defaultGvcnStudents: GvcnStudent[] = [];

export const defaultGvcnWeeklyRecords: GvcnWeeklyRecord[] = [
  {
    week: 1,
    dateRange: 'Tuần 1 — Khởi động năm học',
    groupScores: [
      { group: 1, groupName: 'Tổ 1', leaderName: '', initialPoints: 100, deductedPoints: 0, bonusPoints: 0, totalPoints: 100, rank: 1, note: '' },
      { group: 2, groupName: 'Tổ 2', leaderName: '', initialPoints: 100, deductedPoints: 0, bonusPoints: 0, totalPoints: 100, rank: 1, note: '' },
      { group: 3, groupName: 'Tổ 3', leaderName: '', initialPoints: 100, deductedPoints: 0, bonusPoints: 0, totalPoints: 100, rank: 1, note: '' },
      { group: 4, groupName: 'Tổ 4', leaderName: '', initialPoints: 100, deductedPoints: 0, bonusPoints: 0, totalPoints: 100, rank: 1, note: '' },
    ],
    logs: [],
    meetingMinutes: {
      date: 'Tiết 5 thứ Bảy',
      teacherComment: 'Nề nếp lớp ổn định, các tổ duy trì chuyên cần tốt.',
      monitorReport: '',
      specialNotices: 'Nhắc nhở học sinh mang đầy đủ đồ dùng học tập và thực hiện tốt nội quy nhà trường.',
      nextWeekGoals: 'Phấn đấu dẫn đầu phong trào thi đua toàn trường.',
      commendations: [],
      reminders: [],
    },
  },
];

export const defaultGvcnSpecialStudents: GvcnSpecialStudent[] = [];

export const defaultGvcnParentContacts: GvcnParentContact[] = [];

export const defaultGvcnYearTasks: GvcnMonthlyTask[] = getPhuThoYearPlanForGrade(9, '2026 - 2027');

export const defaultGvcnSeatingChart: GvcnSeatingChartConfig = {
  columns: 4,
  rows: 6,
  seatsPerDesk: 2,
  teacherDeskPosition: 'left',
  doorPosition: 'right',
  boardLabel: 'BẢNG LỚP HỌC & MÀN CHIẾU',
  updatedAt: new Date().toLocaleDateString('vi-VN'),
  notes: 'Sơ đồ chỗ ngồi — GVCN: Dương Văn Trong',
  seats: {},
};
