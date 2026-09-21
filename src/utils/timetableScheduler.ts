import {
  TimetableSlot,
  WeeklyScheduledPeriod,
  TeacherTimetableConfig,
  PpctDataset,
  PpctLesson,
} from '../types';
import {
  defaultPpctDataset9,
  defaultPpctDataset7,
  defaultPpctDataset8,
  defaultPpctDataset6,
} from '../data/defaultData';
import { parseDate, formatDateVN, getDayOfWeekVN } from './dateCalculations';

// Cung cấp thời khóa biểu mặc định chuẩn xác theo ảnh TKB năm học 2026-2027 áp dụng từ 07-09-2026
// Giáo viên: Dương Văn Trong - Dạy Toán Khối 7 (7A4) & Khối 9 (9A4, 9A5) + Chủ nhiệm 7A4
export function getDefaultTeacherTimetable(): TeacherTimetableConfig {
  return {
    id: 'tkb-toan-duong-van-trong-2026-2027',
    teacherName: 'Dương Văn Trong',
    schoolName: 'TRƯỜNG THCS VÀ THPT PHÚ THÀNH',
    academicYear: '2026 - 2027',
    appliedDate: '2026-09-07', // Áp dụng ngày 07-09-2026 (Tuần 1)
    appliedWeek: 1,
    slots: [
      // --- THỨ 2 ---
      {
        id: 'slot-t2-t1-7a4-cc',
        dayOfWeek: 2,
        period: 1,
        session: 'sang',
        className: '7A4',
        grade: '7',
        subject: 'Chào cờ',
        room: 'Sân trường',
        notes: 'Chào cờ đầu tuần',
      },
      {
        id: 'slot-t2-t2-9a5-toan',
        dayOfWeek: 2,
        period: 2,
        session: 'sang',
        className: '9A5',
        grade: '9',
        subject: 'Toán',
        room: 'Phòng 9A5',
      },
      {
        id: 'slot-t2-t4-7a4-toan',
        dayOfWeek: 2,
        period: 4,
        session: 'sang',
        className: '7A4',
        grade: '7',
        subject: 'Toán',
        room: 'Phòng 7A4',
      },
      {
        id: 'slot-t2-t5-7a4-toan',
        dayOfWeek: 2,
        period: 5,
        session: 'sang',
        className: '7A4',
        grade: '7',
        subject: 'Toán',
        room: 'Phòng 7A4',
      },

      // --- THỨ 3 ---
      {
        id: 'slot-t3-t1-7a4-toan',
        dayOfWeek: 3,
        period: 1,
        session: 'sang',
        className: '7A4',
        grade: '7',
        subject: 'Toán',
        room: 'Phòng 7A4',
      },
      {
        id: 'slot-t3-t2-7a4-toan',
        dayOfWeek: 3,
        period: 2,
        session: 'sang',
        className: '7A4',
        grade: '7',
        subject: 'Toán',
        room: 'Phòng 7A4',
      },
      {
        id: 'slot-t3-t4-9a5-toan',
        dayOfWeek: 3,
        period: 4,
        session: 'sang',
        className: '9A5',
        grade: '9',
        subject: 'Toán',
        room: 'Phòng 9A5',
      },
      {
        id: 'slot-t3-t5-9a5-toan',
        dayOfWeek: 3,
        period: 5,
        session: 'sang',
        className: '9A5',
        grade: '9',
        subject: 'Toán',
        room: 'Phòng 9A5',
      },

      // --- THỨ 4 ---
      {
        id: 'slot-t4-t1-9a5-toan',
        dayOfWeek: 4,
        period: 1,
        session: 'sang',
        className: '9A5',
        grade: '9',
        subject: 'Toán',
        room: 'Phòng 9A5',
      },
      {
        id: 'slot-t4-t2-9a4-toan',
        dayOfWeek: 4,
        period: 2,
        session: 'sang',
        className: '9A4',
        grade: '9',
        subject: 'Toán',
        room: 'Phòng 9A4',
      },

      // --- THỨ 5 ---
      {
        id: 'slot-t5-t1-9a4-toan',
        dayOfWeek: 5,
        period: 1,
        session: 'sang',
        className: '9A4',
        grade: '9',
        subject: 'Toán',
        room: 'Phòng 9A4',
      },
      {
        id: 'slot-t5-t2-9a4-toan',
        dayOfWeek: 5,
        period: 2,
        session: 'sang',
        className: '9A4',
        grade: '9',
        subject: 'Toán',
        room: 'Phòng 9A4',
      },

      // --- THỨ 6 ---
      {
        id: 'slot-t6-t4-9a4-toan',
        dayOfWeek: 6,
        period: 4,
        session: 'sang',
        className: '9A4',
        grade: '9',
        subject: 'Toán',
        room: 'Phòng 9A4',
      },
      {
        id: 'slot-t6-t5-7a4-shl',
        dayOfWeek: 6,
        period: 5,
        session: 'sang',
        className: '7A4',
        grade: '7',
        subject: 'SHL',
        room: 'Phòng 7A4',
        notes: 'Sinh hoạt lớp',
      },
    ],
    completedLessons: {},
  };
}

// Tính ngày các thứ trong tuần (Thứ 2 đến Thứ 7)
export function getWeekDates(startDateWeek1: string, weekNumber: number): { dayOfWeek: number; date: Date; dateStr: string; dateFormatted: string; dayName: string }[] {
  const baseStart = parseDate(startDateWeek1);
  const daysOffset = (weekNumber - 1) * 7;
  const monday = new Date(baseStart.getTime() + daysOffset * 24 * 60 * 60 * 1000);

  const days: { dayOfWeek: number; date: Date; dateStr: string; dateFormatted: string; dayName: string }[] = [];
  const dayNames = ['', '', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

  for (let dow = 2; dow <= 7; dow++) {
    const currentDay = new Date(monday.getTime() + (dow - 2) * 24 * 60 * 60 * 1000);
    const y = currentDay.getFullYear();
    const m = (currentDay.getMonth() + 1).toString().padStart(2, '0');
    const d = currentDay.getDate().toString().padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    days.push({
      dayOfWeek: dow,
      date: currentDay,
      dateStr,
      dateFormatted: formatDateVN(currentDay),
      dayName: dayNames[dow],
    });
  }

  return days;
}

// Mở rộng toàn bộ tiết học trong PPCT thành mảng tuần tự từ tiết 1 -> 140
export interface ExpandedLessonPeriod {
  periodNumber: number; // 1 -> 140
  lesson: PpctLesson;
  subPeriod: number; // 1..soTiet
  totalSubPeriods: number;
}

export function expandPpctLessons(dataset: PpctDataset): Map<number, ExpandedLessonPeriod> {
  const map = new Map<number, ExpandedLessonPeriod>();
  if (!dataset || !dataset.lessons || dataset.lessons.length === 0) {
    return map;
  }

  let runningPeriod = 1;
  dataset.lessons.forEach((l) => {
    const count = l.soTiet && l.soTiet > 0 ? l.soTiet : 1;
    for (let sub = 1; sub <= count; sub++) {
      map.set(runningPeriod, {
        periodNumber: runningPeriod,
        lesson: l,
        subPeriod: sub,
        totalSubPeriods: count,
      });
      runningPeriod++;
    }
  });

  return map;
}

// Tìm PPCT phù hợp nhất cho Khối hoặc Lớp
export function findMatchingPpct(datasets: PpctDataset[], grade: string, className?: string): PpctDataset {
  // 1. Tìm dataset có className khớp
  if (className) {
    const classMatch = datasets.find(
      (d) => d.className?.toLowerCase() === className.toLowerCase()
    );
    if (classMatch && classMatch.lessons?.length > 0) return classMatch;
  }

  // 2. Tìm dataset có grade khớp do người dùng tải lên
  const gradeMatch = datasets.find((d) => (d.grade || '9') === grade);
  if (gradeMatch && gradeMatch.lessons?.length > 0) return gradeMatch;

  // 3. Fallback PPCT chuẩn môn Toán theo khối
  if (grade === '7') return defaultPpctDataset7;
  if (grade === '9') return defaultPpctDataset9;
  if (grade === '6') return defaultPpctDataset6;
  if (grade === '8') return defaultPpctDataset8;

  return defaultPpctDataset9;
}

// Lấy danh sách tiết học áp dụng cho một tuần cụ thể
export function getWeeklySlots(
  timetableConfig: TeacherTimetableConfig,
  weekNumber: number
): TimetableSlot[] {
  if (!timetableConfig) return [];
  // 1. Kiểm tra xem có TKB riêng được lưu cho chính tuần này không
  if (
    timetableConfig.weeklySlots &&
    timetableConfig.weeklySlots[weekNumber] &&
    timetableConfig.weeklySlots[weekNumber].length > 0
  ) {
    return timetableConfig.weeklySlots[weekNumber];
  }
  // 2. Tìm TKB tuần gần nhất trước đó (nếu được thiết lập kiểu 'áp dụng từ tuần X trở đi')
  if (timetableConfig.weeklySlots) {
    for (let w = weekNumber - 1; w >= 1; w--) {
      if (timetableConfig.weeklySlots[w] && timetableConfig.weeklySlots[w].length > 0) {
        return timetableConfig.weeklySlots[w];
      }
    }
  }
  // 3. Mặc định dùng TKB chung
  return timetableConfig.slots || [];
}

// Kiểm tra xem tuần này có TKB riêng biệt hay đang dùng chung
export function hasCustomSlotsForWeek(
  timetableConfig: TeacherTimetableConfig,
  weekNumber: number
): boolean {
  return !!(
    timetableConfig?.weeklySlots &&
    timetableConfig.weeklySlots[weekNumber] &&
    timetableConfig.weeklySlots[weekNumber].length > 0
  );
}

// Xếp nội dung PPCT trực tiếp vào Thời khóa biểu cho 1 tuần cụ thể
export function generateWeeklySchedule(
  timetableConfig: TeacherTimetableConfig,
  datasets: PpctDataset[],
  weekNumber: number,
  startDateWeek1: string = '2026-09-07'
): WeeklyScheduledPeriod[] {
  if (!timetableConfig) {
    return [];
  }

  // Lấy danh sách tiết học áp dụng cho đúng tuần được chọn
  const activeSlots = getWeeklySlots(timetableConfig, weekNumber);
  if (!activeSlots || activeSlots.length === 0) {
    return [];
  }

  // Xác định ngày tháng trong tuần: ưu tiên ngày áp dụng riêng nếu có
  const customWeekDate = timetableConfig.weeklyAppliedDates?.[weekNumber];
  const weekDates = customWeekDate
    ? getWeekDates(customWeekDate, 1)
    : getWeekDates(startDateWeek1, weekNumber);
  const dateMap = new Map(weekDates.map((d) => [d.dayOfWeek, d]));

  // Nhóm các slot theo từng Lớp (e.g. 9A1, 7A1)
  const slotsByClass = new Map<string, TimetableSlot[]>();
  activeSlots.forEach((slot) => {
    const cls = slot.className || 'Toán';
    if (!slotsByClass.has(cls)) {
      slotsByClass.set(cls, []);
    }
    slotsByClass.get(cls)!.push(slot);
  });

  const scheduledPeriods: WeeklyScheduledPeriod[] = [];

  // Với mỗi lớp, sắp xếp các tiết trong tuần theo thứ tự thời gian chuẩn (Thứ 2 -> Thứ 7, Sáng -> Chiều, Tiết 1 -> 5)
  slotsByClass.forEach((classSlots, className) => {
    const sortedSlots = [...classSlots].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      const sessA = a.session === 'chieu' ? 1 : 0;
      const sessB = b.session === 'chieu' ? 1 : 0;
      if (sessA !== sessB) return sessA - sessB;
      return a.period - b.period;
    });

    const grade = sortedSlots[0]?.grade || className.replace(/\D/g, '') || '9';
    const ppct = findMatchingPpct(datasets, grade, className);
    const expandedMap = expandPpctLessons(ppct);

    // Lọc riêng các tiết Toán để tính số thứ tự tiết PPCT chuẩn xác (4 tiết/tuần)
    const mathSlots = sortedSlots.filter(
      (s) => s.subject === 'Toán' || (!s.subject?.includes('Chào cờ') && !s.subject?.includes('SHL'))
    );
    const periodsPerWeekForClass = mathSlots.length || 4;
    const basePeriodOffset = (weekNumber - 1) * periodsPerWeekForClass;

    let mathRunningIndex = 0;

    sortedSlots.forEach((slot) => {
      const dayInfo = dateMap.get(slot.dayOfWeek);
      const isActivity = slot.subject === 'Chào cờ' || slot.subject === 'SHL' || slot.subject === 'Sinh hoạt lớp';

      if (isActivity) {
        const isChaoCo = slot.subject === 'Chào cờ';
        const baiHocText = isChaoCo
          ? `Chào cờ đầu tuần (Khối ${grade} - ${className})`
          : `Sinh hoạt lớp tuần ${weekNumber} (Chủ nhiệm ${className})`;

        scheduledPeriods.push({
          slotId: slot.id,
          dayOfWeek: slot.dayOfWeek,
          dateStr: dayInfo?.dateStr || '',
          dateFormatted: dayInfo?.dateFormatted || '',
          dayName: dayInfo?.dayName || `Thứ ${slot.dayOfWeek}`,
          period: slot.period,
          session: slot.session || 'sang',
          className: slot.className,
          grade,
          subject: slot.subject,
          room: slot.room,
          tietPpctNumber: 0,
          baiHoc: baiHocText,
          chuong: isChaoCo ? 'Hoạt động trải nghiệm, hướng nghiệp' : 'Công tác chủ nhiệm & Sinh hoạt lớp',
          soTietCuaBai: 1,
          tietThuCuaBai: 1,
          hocKy: weekNumber <= 18 ? 1 : 2,
          tuanPpct: weekNumber,
          thietBi: isChaoCo ? 'Sân cờ, micro, cờ Tổ quốc' : 'Sổ chủ nhiệm, kế hoạch tuần',
          ghiChu: slot.notes,
          completed: false,
        });
      } else {
        // Tiết môn Toán
        const currentPeriodNumber = basePeriodOffset + mathRunningIndex + 1;
        mathRunningIndex++;

        let lessonInfo = expandedMap.get(currentPeriodNumber);

        // Fallback thông minh: nếu không tìm thấy theo số tiết tuần tự, tìm theo trường tuần của bài học trong PPCT
        if (!lessonInfo && ppct && ppct.lessons && ppct.lessons.length > 0) {
          const weekLessons = ppct.lessons.filter((l) => l.tuan === weekNumber);
          if (weekLessons.length > 0) {
            const matchedLesson = weekLessons[Math.min(mathRunningIndex - 1, weekLessons.length - 1)];
            if (matchedLesson) {
              lessonInfo = {
                periodNumber: currentPeriodNumber,
                lesson: matchedLesson,
                subPeriod: Math.min(mathRunningIndex, matchedLesson.soTiet || 1),
                totalSubPeriods: matchedLesson.soTiet || 1,
              };
            }
          }
        }

        const isCompleted = !!timetableConfig.completedLessons?.[`${className}_tiet_${currentPeriodNumber}`];

        let baiHocText = lessonInfo ? lessonInfo.lesson.baiHoc : `Tiết ${currentPeriodNumber} (Theo PPCT Toán ${grade})`;
        if (lessonInfo && lessonInfo.totalSubPeriods > 1) {
          baiHocText += ` (Tiết ${lessonInfo.subPeriod}/${lessonInfo.totalSubPeriods})`;
        }

        // Tự động đề xuất thiết bị / đồ dùng dạy học
        let suggestedThietBi = 'Thước thẳng, bảng phụ, SGK, phấn màu';
        const lessonTitleLower = (lessonInfo?.lesson.baiHoc || '').toLowerCase();
        const chapterLower = (lessonInfo?.lesson.chuong || '').toLowerCase();
        if (chapterLower.includes('hình') || lessonTitleLower.includes('tam giác') || lessonTitleLower.includes('góc') || lessonTitleLower.includes('đường tròn')) {
          suggestedThietBi = 'Thước thẳng, compa, êke, bảng phụ, máy chiếu';
        } else if (lessonTitleLower.includes('phương trình') || lessonTitleLower.includes('hệ') || lessonTitleLower.includes('căn bậc') || lessonTitleLower.includes('hàm số')) {
          suggestedThietBi = 'Máy tính cầm tay fx-580VN, bảng phụ, máy chiếu';
        } else if (lessonTitleLower.includes('thống kê') || lessonTitleLower.includes('xác suất')) {
          suggestedThietBi = 'Bảng số liệu, biểu đồ mẫu, phiếu học tập nhóm';
        } else if (lessonTitleLower.includes('luyện tập') || lessonTitleLower.includes('ôn tập')) {
          suggestedThietBi = 'Phiếu bài tập trắc nghiệm & tự luận, bảng phụ nhóm';
        }

        scheduledPeriods.push({
          slotId: slot.id,
          dayOfWeek: slot.dayOfWeek,
          dateStr: dayInfo?.dateStr || '',
          dateFormatted: dayInfo?.dateFormatted || '',
          dayName: dayInfo?.dayName || `Thứ ${slot.dayOfWeek}`,
          period: slot.period,
          session: slot.session || 'sang',
          className: slot.className,
          grade,
          subject: slot.subject || 'Toán',
          room: slot.room,

          tietPpctNumber: currentPeriodNumber,
          lessonId: lessonInfo?.lesson.id,
          baiHoc: baiHocText,
          chuong: lessonInfo?.lesson.chuong || '',
          soTietCuaBai: lessonInfo?.totalSubPeriods || 1,
          tietThuCuaBai: lessonInfo?.subPeriod || 1,
          hocKy: lessonInfo?.lesson.hocKy || (weekNumber <= 18 ? 1 : 2),
          tuanPpct: lessonInfo?.lesson.tuan || weekNumber,
          thietBi: suggestedThietBi,
          ghiChu: lessonInfo?.lesson.ghiChu || slot.notes,
          completed: isCompleted,
        });
      }
    });
  });

  // Sắp xếp lại toàn bộ danh sách tiết dạy trong tuần theo trình tự ngày và tiết
  return scheduledPeriods.sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    const sessA = a.session === 'chieu' ? 1 : 0;
    const sessB = b.session === 'chieu' ? 1 : 0;
    if (sessA !== sessB) return sessA - sessB;
    return a.period - b.period;
  });
}

// Lấy danh sách tiết học diễn ra trong ngày hôm nay theo thời gian thực
export function getTodayLessons(
  weeklySchedule: WeeklyScheduledPeriod[],
  todayDateStr: string
): WeeklyScheduledPeriod[] {
  return weeklySchedule.filter((p) => p.dateStr === todayDateStr);
}
