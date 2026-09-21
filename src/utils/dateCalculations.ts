import {
  TimeframeConfig,
  PpctDataset,
  ExamEvent,
  MatrixRow,
  SpecificationRow,
  SpecificationItem,
  TopicPointCalc,
  CognitiveLevel,
  SgkBook,
} from '../types';
import { getLearningObjectiveForTopic, findMatchingSgkLesson } from './sgkParser';

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateVN(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function formatTimeVN(date: Date): string {
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function getDayOfWeekVN(date: Date): string {
  const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return days[date.getDay()];
}

export function formatFullDateTimeVN(date: Date): string {
  return `${getDayOfWeekVN(date)}, ngày ${formatDateVN(date)} lúc ${formatTimeVN(date)}`;
}

export function getTodayDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultStartDateWeek1(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); // 0 is Jan, 8 is Sept
  // If Jan-July, school year started in Sept of previous year; if Aug-Dec, starts in Sept of current year
  const schoolYear = month >= 7 ? year : year - 1;
  const sept1 = new Date(schoolYear, 8, 1);
  const dayOfWeek = sept1.getDay(); // 0 is Sun, 1 is Mon
  const daysUntilMonday = dayOfWeek === 1 ? 0 : (dayOfWeek === 0 ? 1 : 8 - dayOfWeek);
  const firstMonday = new Date(schoolYear, 8, 1 + daysUntilMonday);

  const y = firstMonday.getFullYear();
  const m = (firstMonday.getMonth() + 1).toString().padStart(2, '0');
  const d = firstMonday.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getWeekDateRange(startDateWeek1Str: string, weekNumber: number) {
  const startDate = parseDate(startDateWeek1Str);
  const weekStart = new Date(startDate);
  weekStart.setDate(startDate.getDate() + (weekNumber - 1) * 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 5); // Monday to Saturday (Vietnam school week)

  return { weekStart, weekEnd };
}

export function calculateCurrentWeek(startDateWeek1Str: string, currentDateStr: string): {
  week: number;
  term: 1 | 2;
  isBeforeTerm: boolean;
} {
  const start = parseDate(startDateWeek1Str);
  const current = parseDate(currentDateStr);

  const diffTime = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { week: 0, term: 1, isBeforeTerm: true };
  }

  const week = Math.floor(diffDays / 7) + 1;
  const term = week <= 18 ? 1 : 2;
  return { week, term, isBeforeTerm: false };
}

// Tính ngày bắt đầu Tuần 1 từ ngày áp dụng và số tuần của TKB
export function deriveStartDateWeek1(appliedDate?: string, appliedWeek: number = 1): string {
  if (!appliedDate) return '2026-09-07';
  const app = parseDate(appliedDate);
  const weekOffset = Math.max(0, appliedWeek - 1);
  const week1Time = app.getTime() - weekOffset * 7 * 24 * 60 * 60 * 1000;
  const w1Date = new Date(week1Time);
  const y = w1Date.getFullYear();
  const m = (w1Date.getMonth() + 1).toString().padStart(2, '0');
  const d = w1Date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateDaysRemaining(targetDate: Date, currentDateStr: string): number {
  const current = parseDate(currentDateStr);
  const diffTime = targetDate.getTime() - current.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function generateExamSchedule(
  config: TimeframeConfig,
  ppct: PpctDataset
): ExamEvent[] {
  // If custom events are provided, use them
  if (config.customEvents && config.customEvents.length > 0) {
    return config.customEvents.map((ev) => {
      const { weekStart, weekEnd } = getWeekDateRange(config.startDateWeek1, ev.week);
      const isPeriodic = ev.type === 'giua_ky' || ev.type === 'cuoi_ky';
      
      let exactDateText = ev.customExactDateText || '';
      let targetDateForCountdown: Date;

      if (!exactDateText) {
        if (isPeriodic) {
          const offsetDays = Math.max(0, (config.examStartDayOfWeek || 5) - 2);
          const examDay1 = new Date(weekStart);
          examDay1.setDate(weekStart.getDate() + offsetDays);

          const examDay2 = new Date(examDay1);
          examDay2.setDate(examDay1.getDate() + (config.examDurationDays - 1 || 1));

          const day1VN = `Thứ ${config.examStartDayOfWeek} ${formatDateVN(examDay1)}`;
          const day2VN = `Thứ ${config.examStartDayOfWeek + 1} ${formatDateVN(examDay2)}`;
          exactDateText = `${day1VN} và ${day2VN}`;
          targetDateForCountdown = examDay1;
        } else {
          exactDateText = `Trong tuần ${ev.week} (${formatDateVN(weekStart)} – ${formatDateVN(weekEnd)})`;
          targetDateForCountdown = weekStart;
        }
      } else {
        targetDateForCountdown = weekStart;
      }

      const daysRemaining = calculateDaysRemaining(targetDateForCountdown, config.currentDate);

      const [wStart, wEnd] = ev.customScopeWeeks || [
        ev.term === 1 ? 1 : (config.totalWeeksHK1 || 18) + 1,
        ev.week
      ];

      const scopeLessons = ppct.lessons.filter(
        (l) => l.tuan >= wStart && l.tuan <= wEnd
      );

      const chapterMap = new Map<string, string[]>();
      scopeLessons.forEach((l) => {
        const list = chapterMap.get(l.chuong) || [];
        list.push(l.baiHoc);
        chapterMap.set(l.chuong, list);
      });

      const chapterSummaries = Array.from(chapterMap.entries()).map(([chapter, lessons]) => ({
        chapter,
        lessons,
      }));

      return {
        id: ev.id,
        term: ev.term,
        title: ev.title,
        type: ev.type,
        week: ev.week,
        exactDateText,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        daysRemaining,
        isPast: daysRemaining < 0,
        isCurrent: daysRemaining >= 0 && daysRemaining <= 7,
        suggestedScope: `Phạm vi: tuần ${wStart}–${wEnd}`,
        lessonCount: scopeLessons.length,
        chapterSummaries,
      };
    });
  }

  // Dynamic builder based on configuration
  const kttxWeeksHK1 = config.kttxWeeksHK1 || [3, 6, 11, 14];
  const kttxWeeksHK2 = config.kttxWeeksHK2 || [21, 23, 29, 31];
  const countHK1 = Math.min(kttxWeeksHK1.length, config.kttxCountPerTerm || 4);
  const countHK2 = Math.min(kttxWeeksHK2.length, config.kttxCountPerTerm || 4);

  const rawEvents: Array<{
    id: string;
    term: 1 | 2;
    title: string;
    type: 'kttx' | 'giua_ky' | 'cuoi_ky';
    week: number;
    scopeWeeks: [number, number];
  }> = [];

  // HK1 KTTX and Exams
  const midHK1 = config.midtermWeekHK1 || 9;
  const finHK1 = config.finalWeekHK1 || 18;

  let prevWeekHK1 = 1;
  for (let i = 0; i < countHK1; i++) {
    const currentWeek = kttxWeeksHK1[i] || (i + 1) * 3;
    rawEvents.push({
      id: `kttx-${i + 1}-hk1`,
      term: 1,
      title: `KT thường xuyên ${i + 1} — HK I`,
      type: 'kttx',
      week: currentWeek,
      scopeWeeks: [prevWeekHK1, currentWeek],
    });
    prevWeekHK1 = Math.max(1, currentWeek);
  }

  // Add Midterm HK1
  rawEvents.push({
    id: 'gk-hk1',
    term: 1,
    title: 'Kiểm tra giữa học kỳ I',
    type: 'giua_ky',
    week: midHK1,
    scopeWeeks: [1, midHK1],
  });

  // Add Final HK1
  rawEvents.push({
    id: 'ck-hk1',
    term: 1,
    title: 'Kiểm tra cuối học kỳ I',
    type: 'cuoi_ky',
    week: finHK1,
    scopeWeeks: [1, finHK1],
  });

  // HK2 KTTX and Exams
  const hk2StartWeek = (config.totalWeeksHK1 || 18) + 1;
  const midHK2 = config.midtermWeekHK2 || 26;
  const finHK2 = config.finalWeekHK2 || 33;

  let prevWeekHK2 = hk2StartWeek;
  for (let i = 0; i < countHK2; i++) {
    const currentWeek = kttxWeeksHK2[i] || hk2StartWeek + (i * 3) + 2;
    rawEvents.push({
      id: `kttx-${i + 1}-hk2`,
      term: 2,
      title: `KT thường xuyên ${i + 1} — HK II`,
      type: 'kttx',
      week: currentWeek,
      scopeWeeks: [prevWeekHK2, currentWeek],
    });
    prevWeekHK2 = Math.max(hk2StartWeek, currentWeek);
  }

  // Add Midterm HK2
  rawEvents.push({
    id: 'gk-hk2',
    term: 2,
    title: 'Kiểm tra giữa học kỳ II',
    type: 'giua_ky',
    week: midHK2,
    scopeWeeks: [hk2StartWeek, midHK2],
  });

  // Add Final HK2
  rawEvents.push({
    id: 'ck-hk2',
    term: 2,
    title: 'Kiểm tra cuối học kỳ II',
    type: 'cuoi_ky',
    week: finHK2,
    scopeWeeks: [hk2StartWeek, finHK2],
  });

  // Sort by term and week
  rawEvents.sort((a, b) => {
    if (a.term !== b.term) return a.term - b.term;
    return a.week - b.week;
  });

  return rawEvents.map((ev) => {
    const { weekStart, weekEnd } = getWeekDateRange(config.startDateWeek1, ev.week);

    let exactDateText = '';
    let targetDateForCountdown: Date;

    if (ev.type === 'giua_ky' || ev.type === 'cuoi_ky') {
      const offsetDays = Math.max(0, (config.examStartDayOfWeek || 5) - 2);
      const examDay1 = new Date(weekStart);
      examDay1.setDate(weekStart.getDate() + offsetDays);

      const examDay2 = new Date(examDay1);
      examDay2.setDate(examDay1.getDate() + (config.examDurationDays - 1 || 1));

      const day1VN = `Thứ ${config.examStartDayOfWeek} ${formatDateVN(examDay1)}`;
      const day2VN = `Thứ ${config.examStartDayOfWeek + 1} ${formatDateVN(examDay2)}`;
      exactDateText = `${day1VN} và ${day2VN}`;
      targetDateForCountdown = examDay1;
    } else {
      exactDateText = `Trong tuần ${ev.week} (${formatDateVN(weekStart)} – ${formatDateVN(weekEnd)})`;
      targetDateForCountdown = weekStart;
    }

    const daysRemaining = calculateDaysRemaining(targetDateForCountdown, config.currentDate);

    // Extract lessons in scope
    const [wStart, wEnd] = ev.scopeWeeks;
    const scopeLessons = ppct.lessons.filter(
      (l) => l.tuan >= wStart && l.tuan <= wEnd
    );

    // Group lessons by chapter
    const chapterMap = new Map<string, string[]>();
    scopeLessons.forEach((l) => {
      const list = chapterMap.get(l.chuong) || [];
      list.push(l.baiHoc);
      chapterMap.set(l.chuong, list);
    });

    const chapterSummaries = Array.from(chapterMap.entries()).map(([chapter, lessons]) => ({
      chapter,
      lessons,
    }));

    return {
      id: ev.id,
      term: ev.term,
      title: ev.title,
      type: ev.type,
      week: ev.week,
      exactDateText,
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      daysRemaining,
      isPast: daysRemaining < 0,
      isCurrent: daysRemaining >= 0 && daysRemaining <= 7,
      suggestedScope: `Phạm vi: tuần ${wStart}–${wEnd}`,
      lessonCount: scopeLessons.length,
      chapterSummaries,
    };
  });
}

export interface NonTestableCheckResult {
  isNonTestable: boolean;
  reason?: string;
  category?: 'exam' | 'return_paper' | 'activity' | 'software' | 'review_exam' | 'admin';
  cleanedTopic: string;
}

/**
 * Kiểm tra xem một chuỗi có chứa mã năng lực số (NLS) hoặc các mô tả công nghệ
 * (như GeoGebra, MindMeister, Canva, Quizizz, Padlet, Kahoot, 3.1TC2a, 2.2.NC1a...) hay không.
 */
export function isTechCompetenceText(text: string): boolean {
  if (!text) return false;
  const t = text.trim();
  // Khung năng lực số mã hiệu dạng: 3.1TC2a, 5.3TC2a, 2.2.NC1a, 1.2TC, 4.3NC...
  if (/\b\d+\.\d+(?:\.\w+)?(?:TC|NC|tc|nc)\w*/i.test(t)) return true;
  // Công cụ công nghệ / phần mềm số hóa trong trường học
  if (/\b(geogebra|mindmeister|canva|padlet|quizizz|kahoot|mindmap)\b/i.test(t)) return true;
  // Mô tả nhiệm vụ số hóa, kỹ năng số
  if (
    /sử dụng công cụ mindmap|hợp tác nhóm trên môi trường số|dùng máy tính cầm tay hoặc bảng tính để tính giá trị|kiểm chứng các hệ thức bằng geogebra|tham gia quizizz/i.test(
      t
    )
  ) {
    return true;
  }
  // Các tiền tố NLS / Năng lực số
  if (/(?:NLS|Năng lực số)\s*:/i.test(t)) return true;
  return false;
}

/**
 * Làm sạch chuỗi nội dung: loại bỏ hoàn toàn phần NLS (Năng lực số), mã số hóa TC/NC,
 * các mô tả công cụ GeoGebra, MindMeister, Canva, Padlet, Quizizz, Kahoot,
 * các ghi chú (NLS: ...), [NLS: ...], v.v., chỉ giữ lại nội dung bài học/yêu cầu cần đạt.
 */
export function cleanContentWithoutNls(text: string): string {
  if (!text) return '';
  let cleaned = text
    // Bỏ các thẻ trong ngoặc đơn hoặc ngoặc vuông chứa NLS hoặc Năng lực số: (NLS...), [NLS...]
    .replace(/\s*[\(\[]\s*(?:NLS|Năng lực số)[\s\S]*?[\)\]]/gi, '')
    // Bỏ tiền tố/hậu tố dạng "- NLS: ..." hoặc "; NLS: ..." hoặc "NLS: ..."
    .replace(/(?:[-+*•–;,]\s*)?(?:NLS|Năng lực số)\s*:[^\n.;,]*(?:[.\n;,]|$)/gi, '')
    // Bỏ từ khoá NLS / Năng lực số đứng đơn lẻ kèm dấu gạch nối hoặc hai chấm
    .replace(/\b(?:NLS|Năng lực số)\b[:\s\-–]*/gi, '')
    // Bỏ các mã khung năng lực số như: 3.1TC2a: ..., 2.2.NC1a: ..., 5.3TC2a: ...
    .replace(/(?:[-+*•–;,]\s*)?\b\d+\.\d+(?:\.\w+)?(?:TC|NC|tc|nc)\w*\s*:[^.;\n]*(?:[.;\n]|$)/gi, '')
    .replace(/\b\d+\.\d+(?:\.\w+)?(?:TC|NC|tc|nc)\w*\b/gi, '')
    // Bỏ các câu văn thuần túy mô tả công cụ số (GeoGebra, MindMeister, Canva, Padlet, Quizizz, Kahoot)
    .replace(
      /(?:^|[.;\n])\s*(?:Sử dụng|Dùng|Ứng dụng)\s+(?:công cụ\s+)?(?:GeoGebra|MindMeister|Canva|Google Docs|Padlet|Quizizz|Kahoot|mindmap)[^.;\n]*(?:[.;\n]|$)/gi,
      ''
    )
    .replace(/(?:^|[.;\n])\s*(?:Hợp tác nhóm trên môi trường số|Tham gia Quizizz\/Kahoot)[^.;\n]*(?:[.;\n]|$)/gi, '')
    // Bỏ các ngoặc rỗng sót lại
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    // Chuẩn hóa khoảng trắng và dấu câu
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/^[.,;:\s]+|[.,;:\s]+$/g, '')
    .trim();

  return cleaned;
}

/**
 * Tự động đối chiếu văn bản (kể cả văn bản chứa mã NLS hay text công cụ) với
 * chương trình SGK Toán hiện nay (GDPT 2018 - Kết nối tri thức / Cánh diều / Chân trời sáng tạo)
 * để trả về Tên Chương và Tên Bài học chuẩn xác nhất theo SGK.
 */
export function getOfficialSgkTopicAndChapter(
  text: string,
  grade: string = '9',
  sgkBooks?: SgkBook[]
): { chapter: string; topic: string } | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  const normGrade = String(grade || '9').replace(/\D/g, '') || '9';

  // 1. Thử đối chiếu với các cuốn sách SGK có trong hệ thống nếu có
  if (sgkBooks && sgkBooks.length > 0) {
    const match = findMatchingSgkLesson(text, text, sgkBooks, 'all', normGrade);
    if (match.lesson && match.chapter && match.matchScore > 15) {
      return {
        chapter: match.chapter.title,
        topic: match.lesson.title,
      };
    }
  }

  // 2. Tra cứu theo từ khóa cốt lõi chuẩn SGK Toán 9 hiện hành (GDPT 2018)
  if (normGrade === '9') {
    if (
      lower.includes('tỉ số lượng giác') ||
      lower.includes('ti so luong giac') ||
      lower.includes('sin, cos, tan') ||
      lower.includes('lượng giác') ||
      lower.includes('tam giác vuông')
    ) {
      if (lower.includes('hệ thức về cạnh và góc') || lower.includes('giải tam giác vuông')) {
        return {
          chapter: 'Chương IV: Hệ thức lượng trong tam giác vuông',
          topic: 'Bài 11: Một số hệ thức về cạnh và góc trong tam giác vuông',
        };
      }
      return {
        chapter: 'Chương IV: Hệ thức lượng trong tam giác vuông',
        topic: 'Bài 10: Tỉ số lượng giác của góc nhọn',
      };
    }

    if (
      lower.includes('đường tròn') ||
      lower.includes('tiếp tuyến') ||
      lower.includes('dây cung') ||
      lower.includes('cung và dây') ||
      lower.includes('tứ giác nội tiếp')
    ) {
      if (lower.includes('tiếp tuyến')) {
        return {
          chapter: 'Chương V: Đường tròn',
          topic: 'Bài 13: Tiếp tuyến của đường tròn',
        };
      }
      if (lower.includes('tứ giác nội tiếp')) {
        return {
          chapter: 'Chương V: Đường tròn',
          topic: 'Tứ giác nội tiếp đường tròn',
        };
      }
      return {
        chapter: 'Chương V: Đường tròn',
        topic: 'Bài 12: Mở đầu về đường tròn. Cung và dây',
      };
    }

    if (
      lower.includes('hệ hai phương trình') ||
      lower.includes('phương trình bậc nhất hai ẩn') ||
      lower.includes('hệ phương trình') ||
      lower.includes('phương pháp thế') ||
      lower.includes('cộng đại số')
    ) {
      if (lower.includes('giải bài toán bằng cách lập hệ') || lower.includes('toán thực tế')) {
        return {
          chapter: 'Chương I: Phương trình và hệ hai phương trình bậc nhất hai ẩn',
          topic: 'Bài 3: Giải bài toán bằng cách lập hệ phương trình',
        };
      }
      if (lower.includes('giải hệ') || lower.includes('phương pháp')) {
        return {
          chapter: 'Chương I: Phương trình và hệ hai phương trình bậc nhất hai ẩn',
          topic: 'Bài 2: Giải hệ hai phương trình bậc nhất hai ẩn',
        };
      }
      return {
        chapter: 'Chương I: Phương trình và hệ hai phương trình bậc nhất hai ẩn',
        topic: 'Bài 1: Khái niệm phương trình và hệ hai phương trình bậc nhất hai ẩn',
      };
    }

    if (
      lower.includes('bất phương trình') ||
      lower.includes('bất đẳng thức') ||
      lower.includes('phương trình quy về')
    ) {
      if (lower.includes('bất đẳng thức') || lower.includes('bất phương trình')) {
        return {
          chapter: 'Chương II: Phương trình và bất phương trình bậc nhất một ẩn',
          topic: 'Bài 5: Bất đẳng thức và bất phương trình bậc nhất một ẩn',
        };
      }
      return {
        chapter: 'Chương II: Phương trình và bất phương trình bậc nhất một ẩn',
        topic: 'Bài 4: Phương trình quy về phương trình bậc nhất một ẩn',
      };
    }

    if (lower.includes('căn bậc hai') || lower.includes('căn bậc ba') || lower.includes('căn thức')) {
      return {
        chapter: 'Chương III: Căn bậc hai và căn bậc ba',
        topic: 'Bài 7: Căn bậc hai và căn thức bậc hai',
      };
    }

    if (
      lower.includes('hàm số y = ax²') ||
      lower.includes('y = ax') ||
      lower.includes('parabol') ||
      lower.includes('phương trình bậc hai') ||
      lower.includes('vi-ét') ||
      lower.includes('viète') ||
      lower.includes('công thức nghiệm')
    ) {
      if (lower.includes('vi-ét') || lower.includes('viète')) {
        return {
          chapter: 'Chương VI: Hàm số y = ax² (a ≠ 0). Phương trình bậc hai một ẩn',
          topic: 'Bài 16: Định lí Viète và ứng dụng',
        };
      }
      if (lower.includes('phương trình bậc hai') || lower.includes('công thức nghiệm')) {
        return {
          chapter: 'Chương VI: Hàm số y = ax² (a ≠ 0). Phương trình bậc hai một ẩn',
          topic: 'Bài 15: Phương trình bậc hai một ẩn và công thức nghiệm',
        };
      }
      return {
        chapter: 'Chương VI: Hàm số y = ax² (a ≠ 0). Phương trình bậc hai một ẩn',
        topic: 'Bài 14: Hàm số y = ax² (a ≠ 0) và đồ thị',
      };
    }

    if (
      lower.includes('tần số') ||
      lower.includes('bảng tần số') ||
      lower.includes('biểu đồ tần số') ||
      lower.includes('thống kê')
    ) {
      return {
        chapter: 'Chương VII: Một số yếu tố thống kê',
        topic: 'Bài 18: Bảng tần số và biểu đồ tần số',
      };
    }

    if (lower.includes('xác suất') || lower.includes('không gian mẫu') || lower.includes('biến cố')) {
      return {
        chapter: 'Chương VIII: Một số yếu tố xác suất',
        topic: 'Bài 21: Phép thử ngẫu nhiên và không gian mẫu',
      };
    }

    if (
      lower.includes('hình trụ') ||
      lower.includes('hình nón') ||
      lower.includes('hình cầu') ||
      lower.includes('hình khối')
    ) {
      return {
        chapter: 'Chương IX: Một số hình khối trong thực tiễn',
        topic: 'Bài 22: Hình trụ và hình nón',
      };
    }
  }

  // 3. Tra cứu cho Khối 8
  if (normGrade === '8') {
    if (lower.includes('đa thức') || lower.includes('hằng đẳng thức')) {
      return {
        chapter: 'Chương I: Đa thức',
        topic: 'Bài 1: Đơn thức và đa thức nhiều biến',
      };
    }
    if (lower.includes('phân thức')) {
      return {
        chapter: 'Chương II: Phân thức đại số',
        topic: 'Bài 6: Phân thức đại số',
      };
    }
    if (lower.includes('hàm số bậc nhất') || lower.includes('hệ số góc')) {
      return {
        chapter: 'Chương V: Hàm số bậc nhất',
        topic: 'Bài 18: Hàm số bậc nhất y = ax + b (a ≠ 0)',
      };
    }
    if (lower.includes('tam giác đồng dạng')) {
      return {
        chapter: 'Chương IX: Tam giác đồng dạng',
        topic: 'Bài 33: Hai tam giác đồng dạng',
      };
    }
    if (lower.includes('định lí pythagore') || lower.includes('tứ giác')) {
      return {
        chapter: 'Chương III: Tứ giác',
        topic: 'Bài 10: Tứ giác và hình thang cân',
      };
    }
  }

  // 4. Tra cứu cho Khối 7
  if (normGrade === '7') {
    if (lower.includes('số hữu tỉ') || lower.includes('hữu tỉ')) {
      return {
        chapter: 'Chương I: Số hữu tỉ',
        topic: 'Bài 1: Tập hợp các số hữu tỉ',
      };
    }
    if (lower.includes('số thực') || lower.includes('căn bậc hai số học')) {
      return {
        chapter: 'Chương II: Số thực',
        topic: 'Bài 6: Số vô tỉ. Căn bậc hai số học',
      };
    }
    if (lower.includes('tam giác bằng nhau')) {
      return {
        chapter: 'Chương IV: Tam giác bằng nhau',
        topic: 'Bài 14: Hai tam giác bằng nhau',
      };
    }
    if (lower.includes('tỉ lệ thức') || lower.includes('đại lượng tỉ lệ')) {
      return {
        chapter: 'Chương VI: Tỉ lệ thức và đại lượng tỉ lệ',
        topic: 'Bài 21: Tỉ lệ thức',
      };
    }
    if (lower.includes('biểu thức đại số') || lower.includes('đa thức một biến')) {
      return {
        chapter: 'Chương VII: Biểu thức đại số và đa thức một biến',
        topic: 'Bài 26: Đa thức một biến',
      };
    }
  }

  // 5. Tra cứu cho Khối 6
  if (normGrade === '6') {
    if (lower.includes('số tự nhiên') || lower.includes('tập hợp')) {
      return {
        chapter: 'Chương I: Tập hợp các số tự nhiên',
        topic: 'Bài 1: Tập hợp và phần tử của tập hợp',
      };
    }
    if (lower.includes('số nguyên')) {
      return {
        chapter: 'Chương III: Số nguyên',
        topic: 'Bài 14: Tập hợp các số nguyên',
      };
    }
    if (lower.includes('phân số')) {
      return {
        chapter: 'Chương V: Phân số',
        topic: 'Bài 23: Mở rộng phân số. Phân số bằng nhau',
      };
    }
    if (lower.includes('số thập phân')) {
      return {
        chapter: 'Chương VI: Số thập phân',
        topic: 'Bài 28: Số thập phân',
      };
    }
    if (lower.includes('hình học trực quan') || lower.includes('tam giác đều') || lower.includes('hình vuông')) {
      return {
        chapter: 'Chương IV: Một số hình phẳng trong thực tiễn',
        topic: 'Bài 20: Tam giác đều. Hình vuông. Lục giác đều',
      };
    }
  }

  return null;
}

/**
 * Rà soát và chuẩn hóa toàn bộ các dòng Ma trận / Bảng đặc tả bám sát chuẩn SGK hiện hành (GDPT 2018),
 * tự động loại bỏ triệt để các mã năng lực số (3.1TC2a, 2.2.NC1a...) và công cụ số (GeoGebra, Canva, MindMeister, Padlet, Quizizz).
 */
export function standardizeRowsToCurrentSgk(
  rows: MatrixRow[],
  grade: string = '9',
  sgkBooks?: SgkBook[]
): { rows: MatrixRow[]; changedCount: number } {
  let changedCount = 0;
  const newRows = rows.map((row) => {
    let newChapter = row.chuong;
    let newTopic = row.noiDung;
    let modified = false;

    // 1. Kiểm tra nếu chứa mã năng lực số hoặc text công cụ số
    if (isTechCompetenceText(row.chuong) || isTechCompetenceText(row.noiDung)) {
      const combined = `${row.chuong} ${row.noiDung}`;
      const sgkMatch = getOfficialSgkTopicAndChapter(combined, grade, sgkBooks);
      if (sgkMatch) {
        newChapter = sgkMatch.chapter;
        newTopic = sgkMatch.topic;
        modified = true;
      } else {
        newChapter = cleanContentWithoutNls(row.chuong) || 'Hệ thức lượng trong tam giác vuông';
        newTopic = cleanContentWithoutNls(row.noiDung) || 'Tỉ số lượng giác của góc nhọn';
        modified = true;
      }
    } else {
      // Làm sạch thông thường
      const cleanedCh = cleanContentWithoutNls(row.chuong);
      const cleanedTopic = cleanContentWithoutNls(row.noiDung);
      if (cleanedCh !== row.chuong || cleanedTopic !== row.noiDung) {
        newChapter = cleanedCh;
        newTopic = cleanedTopic;
        modified = true;
      }
    }

    if (modified) {
      changedCount++;
      return {
        ...row,
        chuong: newChapter,
        noiDung: newTopic,
      };
    }
    return row;
  });

  return { rows: newRows, changedCount };
}

/**
 * Làm sạch tên bài học để lấy phần nội dung kiến thức cốt lõi (bỏ ghi chú tiết, KTTX đi kèm, bỏ NLS)
 */
export function cleanLessonTopic(rawTopic: string): string {
  const withoutNls = cleanContentWithoutNls(rawTopic || '');
  return withoutNls
    .replace(/\(t\d+.*?\)/gi, '')
    .replace(/\(tiết\s*\d+.*?\)/gi, '')
    .replace(/\s*&?\s*kiểm tra thường xuyên\s*\d*.*$/i, '')
    .replace(/\s*&?\s*kttx\s*\d*.*$/i, '')
    .replace(/\s*&?\s*kt\s*15\s*phút.*$/i, '')
    .trim();
}

/**
 * Kiểm tra xem một bài học/chủ đề có phải là nội dung không cần thiết ra đề hay không
 * (Tiết kiểm tra, trả bài, hoạt động trải nghiệm, phần mềm, ôn tập kiểm tra chung, v.v.)
 */
export function checkNonTestableContent(rawTopic: string, rawChapter: string = ''): NonTestableCheckResult {
  const cleanedTopic = cleanLessonTopic(rawTopic);
  const lowerTopic = cleanedTopic.toLowerCase();
  const lowerChapter = (rawChapter || '').toLowerCase();

  // 1. Tiết kiểm tra / đánh giá định kỳ hoặc thường xuyên (khi bài học là kiểm tra)
  const isExam =
    /^(kiểm tra|đánh giá|thi học k[ỳì]|kttx|khảo sát|bài kiểm tra)/i.test(lowerTopic) ||
    /kiểm tra (giữa|cuối|định|thường|học k[ỳì]|15 ph|1 tiết|45 ph)|thi học k[ỳì]|khảo sát (đầu năm|chất lượng)/i.test(lowerTopic) ||
    (lowerChapter.includes('kiểm tra cuối học kỳ') && !lowerTopic.includes('bài'));

  if (isExam) {
    return {
      isNonTestable: true,
      reason: 'Tiết kiểm tra / Đánh giá',
      category: 'exam',
      cleanedTopic,
    };
  }

  // 2. Tiết trả bài / chữa bài kiểm tra / rút kinh nghiệm
  const isReturnPaper =
    /trả bài|chữa bài|sửa bài|rút kinh nghiệm|sơ kết đánh giá|tổng kết và đánh giá kết quả/i.test(lowerTopic);
  if (isReturnPaper) {
    return {
      isNonTestable: true,
      reason: 'Tiết trả bài / Sửa bài',
      category: 'return_paper',
      cleanedTopic,
    };
  }

  // 3. Hoạt động thực hành và trải nghiệm, dự án học tập, tham quan, thực địa
  const isActivity =
    /hoạt động thực hành|thực hành và trải nghiệm|thực hành trải nghiệm|hoạt động trải nghiệm|dự án học tập|thực địa|ngoài trời|tham quan/i.test(lowerTopic) ||
    /thực hành trải nghiệm|hoạt động trải nghiệm/i.test(lowerChapter);
  if (isActivity) {
    return {
      isNonTestable: true,
      reason: 'Hoạt động trải nghiệm / Thực hành',
      category: 'activity',
      cleanedTopic,
    };
  }

  // 4. Thực hành phần mềm / Máy tính cầm tay
  const isSoftware =
    /thực hành phần mềm|geogebra|geonext|sử dụng máy tính cầm tay|phần mềm vẽ hình/i.test(lowerTopic);
  if (isSoftware) {
    return {
      isNonTestable: true,
      reason: 'Thực hành phần mềm / Máy tính cầm tay',
      category: 'software',
      cleanedTopic,
    };
  }

  // 5. Tiết ôn tập định kỳ / ôn tập kiểm tra chung
  const isReviewExam =
    /ôn tập (kiểm tra|giữa k[ỳì]|cuối k[ỳì]|thi|tổng kết|chuyên đề: rèn kĩ năng)/i.test(lowerTopic) ||
    /ôn tập & kiểm tra|ôn tập cuối học kỳ|tổng kết năm học|ôn tập tổng kết/i.test(lowerChapter);
  if (isReviewExam) {
    return {
      isNonTestable: true,
      reason: 'Tiết ôn tập định kỳ / Tổng kết',
      category: 'review_exam',
      cleanedTopic,
    };
  }

  // 6. Hướng dẫn học tập, giới thiệu môn học, đọc thêm
  const isAdmin =
    /hướng dẫn học tập|hướng dẫn sử dụng sách|giới thiệu môn học|hướng dẫn ôn hè|sinh hoạt lớp|đọc thêm|em có biết|tự học có hướng dẫn/i.test(lowerTopic);
  if (isAdmin) {
    return {
      isNonTestable: true,
      reason: 'Hướng dẫn học tập / Đọc thêm',
      category: 'admin',
      cleanedTopic,
    };
  }

  return {
    isNonTestable: false,
    cleanedTopic,
  };
}

/**
 * Automatically generates a balanced Exam Matrix from PPCT up to the target exam week
 * Supports:
 * - Limiting content to specific week (e.g. up to Week 9)
 * - Filtering out non-testable content (Kiểm tra, Trả bài, Hoạt động trải nghiệm, Ôn tập...)
 * - Configurable TN / TL ratio (e.g. 70% TN / 30% TL)
 * - MOET 2025 New Structure (Phần I: 4 lựa chọn, Phần II: Đúng/Sai, Phần III: Trả lời ngắn, Phần IV: Tự luận)
 * - Standard 2018 Structure (TNKQ & TL theo 4 mức độ)
 * - Exact taught periods and % thời lượng balancing
 */
export function generateMatrixFromPpct(
  ppct: PpctDataset,
  options: {
    targetWeek?: number;
    limitWeekFrom?: number;
    limitWeekTo?: number;
    limitPeriodTo?: number;
    selectedLessonKeys?: string[];
    excludeNonTestable?: boolean;
    ratioTn?: number;
    ratioTl?: number;
    structureType?: 'moet_2025_new' | 'standard_2018';
    scorePerTn?: number;
    scorePerTn1?: number;
    scorePerTn2?: number;
    scorePerTn3?: number;
    scorePerTl?: number;
    targetScore?: number;
    cognitiveRatios?: { nhanBiet: number; thongHieu: number; vanDung: number; vanDungCao: number };
  } | number = 9,
  legacyScorePerTn = 0.25,
  legacyScorePerTl = 1.0,
  legacyTargetScore = 10
): MatrixRow[] {
  // Normalize arguments
  const config = typeof options === 'number' ? {
    limitWeekFrom: 1,
    limitWeekTo: options,
    limitPeriodTo: undefined as number | undefined,
    selectedLessonKeys: undefined as string[] | undefined,
    excludeNonTestable: true,
    ratioTn: 70,
    ratioTl: 30,
    structureType: 'moet_2025_new' as const,
    scorePerTn: legacyScorePerTn,
    scorePerTn1: 0.25,
    scorePerTn2: 1.0,
    scorePerTn3: 0.5,
    scorePerTl: legacyScorePerTl,
    targetScore: legacyTargetScore,
    cognitiveRatios: { nhanBiet: 40, thongHieu: 30, vanDung: 20, vanDungCao: 10 },
  } : {
    limitWeekFrom: Math.max(1, options.limitWeekFrom ?? 1),
    limitWeekTo: Math.max(options.limitWeekFrom ?? 1, options.limitWeekTo ?? options.targetWeek ?? 9),
    limitPeriodTo: options.limitPeriodTo,
    selectedLessonKeys: options.selectedLessonKeys,
    excludeNonTestable: options.excludeNonTestable !== false,
    ratioTn: options.ratioTn ?? 70,
    ratioTl: options.ratioTl ?? 30,
    structureType: options.structureType ?? 'moet_2025_new',
    scorePerTn: options.scorePerTn ?? 0.25,
    scorePerTn1: options.scorePerTn1 ?? 0.25,
    scorePerTn2: options.scorePerTn2 ?? 1.0,
    scorePerTn3: options.scorePerTn3 ?? 0.5,
    scorePerTl: options.scorePerTl ?? 1.0,
    targetScore: options.targetScore ?? 10,
    cognitiveRatios: options.cognitiveRatios ?? { nhanBiet: 30, thongHieu: 40, vanDung: 20, vanDungCao: 10 },
  };

  // 1. Filter lessons strictly within the specified week range [limitWeekFrom, limitWeekTo]
  // and optionally limitPeriodTo
  let lessons = ppct.lessons.filter((l) => {
    if (l.tuan < config.limitWeekFrom || l.tuan > config.limitWeekTo) return false;
    if (config.limitPeriodTo && l.tietPPCT && l.tietPPCT > config.limitPeriodTo) return false;
    return true;
  });

  // If specific lesson keys are provided, filter by those
  if (config.selectedLessonKeys && config.selectedLessonKeys.length > 0) {
    lessons = lessons.filter((l) => {
      const cleaned = cleanLessonTopic(l.baiHoc);
      const key = `${l.chuong}:::${cleaned}`;
      const rawKey = `${l.chuong}:::${l.baiHoc.replace(/\(t\d+\)/g, '').trim()}`;
      return config.selectedLessonKeys!.includes(key) || config.selectedLessonKeys!.includes(rawKey);
    });
  }

  if (lessons.length === 0) return [];

  // 2. Group by chapter & unique lesson / subtopics, automatically excluding non-testable content if configured
  const unitMap = new Map<string, { chapter: string; topic: string; periods: number }>();

  lessons.forEach((l) => {
    const check = checkNonTestableContent(l.baiHoc, l.chuong);

    // If user enabled non-testable exclusion, skip non-testable rows completely
    if (config.excludeNonTestable && check.isNonTestable) {
      return;
    }

    let cleanedTopic = check.cleanedTopic || l.baiHoc.replace(/\(t\d+\)/g, '').trim();
    let cleanedChapter = l.chuong || 'Chủ đề chung';

    // Nếu bài học hoặc chương bị nhiễm mã năng lực số / text công cụ, tự động chuẩn hóa theo SGK
    if (isTechCompetenceText(cleanedTopic) || isTechCompetenceText(cleanedChapter)) {
      const match = getOfficialSgkTopicAndChapter(`${cleanedChapter} ${cleanedTopic}`, ppct.grade || '9');
      if (match) {
        cleanedChapter = match.chapter;
        cleanedTopic = match.topic;
      } else {
        cleanedChapter = cleanContentWithoutNls(cleanedChapter) || 'Hệ thức lượng trong tam giác vuông';
        cleanedTopic = cleanContentWithoutNls(cleanedTopic) || 'Tỉ số lượng giác của góc nhọn';
      }
    } else {
      cleanedChapter = cleanContentWithoutNls(cleanedChapter);
      cleanedTopic = cleanContentWithoutNls(cleanedTopic);
    }

    if (!cleanedTopic) return;

    const key = `${cleanedChapter}:::${cleanedTopic}`;
    const existing = unitMap.get(key);
    const lessonPeriods = l.soTiet || 1;
    if (existing) {
      existing.periods += lessonPeriods;
    } else {
      unitMap.set(key, {
        chapter: cleanedChapter,
        topic: cleanedTopic,
        periods: lessonPeriods,
      });
    }
  });

  const units = Array.from(unitMap.values());
  if (units.length === 0) return [];

  const totalPeriods = units.reduce((sum, u) => sum + u.periods, 0) || 1;

  if (config.structureType === 'moet_2025_new') {
    // Cài đặt mức độ nhận thức chuẩn theo yêu cầu Bộ GD&ĐT:
    // Nhận biết: 30% (3.0 điểm)
    // Thông hiểu: 40% (4.0 điểm)
    // Vận dụng: 30% (3.0 điểm) [gồm Vận dụng 20% (2.0 điểm) và Vận dụng cao 10% (1.0 điểm)]
    //
    // Đầy đủ 4 dạng câu hỏi (3 dạng trắc nghiệm + 1 dạng tự luận), KHÔNG CÓ dạng nào chiếm 0%:
    // 1. TN Nhiều lựa chọn: 12 câu = 3.0 điểm (0.25đ/câu): 6 Biết (1.50đ) + 6 Hiểu (1.50đ)
    // 2. TN Đúng/Sai: 2 câu = 2.0 điểm (1.0đ/câu): 1 Biết (1.00đ) + 1 Hiểu (1.00đ)
    // 3. TN Trả lời ngắn: 4 câu = 2.0 điểm (0.5đ/câu): 1 Biết (0.50đ) + 3 Hiểu (1.50đ)
    // 4. Tự luận: 3 bài = 3.0 điểm (1.0đ/bài): 2 Vận dụng (2.00đ) + 1 Vận dụng cao (1.00đ)
    //
    // Tổng Nhận biết: 1.50 + 1.00 + 0.50 = 3.0 điểm (30%)
    // Tổng Thông hiểu: 1.50 + 1.00 + 1.50 = 4.0 điểm (40%)
    // Tổng Vận dụng: 2.0 điểm (20%)
    // Tổng Vận dụng cao: 1.0 điểm (10%)
    // Tổng điểm: 10.0 điểm (100%)!
    
    const TARGET_D1_NB = 6;
    const TARGET_D1_TH = 6;
    const TARGET_D2_NB = 1;
    const TARGET_D2_TH = 1;
    const TARGET_D3_NB = 1;
    const TARGET_D3_TH = 3;
    const TARGET_TL_VD = 2; // 2.0đ
    const TARGET_TL_VDC = 1; // 1.0đ

    // Phân bố đa dạng: Xác định các chủ đề/bài học nhận D2, D3, TL để tránh dồn cục
    const numUnits = units.length;
    const d2_nb_idx = 0;
    const d2_th_idx = numUnits > 1 ? Math.min(numUnits - 1, Math.floor(numUnits / 2)) : 0;

    // Phân bố 4 câu Trả lời ngắn (1 NB, 3 TH) vào các bài học khác nhau
    const d3_slots: { unitIdx: number; level: 'biet' | 'hieu' }[] = [];
    if (numUnits >= 4) {
      d3_slots.push({ unitIdx: 1 % numUnits, level: 'biet' });
      d3_slots.push({ unitIdx: 2 % numUnits, level: 'hieu' });
      d3_slots.push({ unitIdx: (numUnits - 1) % numUnits, level: 'hieu' });
      d3_slots.push({ unitIdx: 3 % numUnits, level: 'hieu' });
    } else {
      d3_slots.push({ unitIdx: 0, level: 'biet' });
      d3_slots.push({ unitIdx: (1 % numUnits), level: 'hieu' });
      d3_slots.push({ unitIdx: (2 % numUnits), level: 'hieu' });
      d3_slots.push({ unitIdx: (3 % numUnits), level: 'hieu' });
    }

    // Tự luận: Vận dụng ở bài trọng tâm, Vận dụng cao ở bài tổng hợp cuối
    const tl_vd_indices = [numUnits > 1 ? Math.floor(numUnits / 2) : 0, 0];
    const tl_vdc_idx = numUnits - 1;

    let remD1_NB = TARGET_D1_NB;
    let remD1_TH = TARGET_D1_TH;
    let remD2_NB = TARGET_D2_NB;
    let remD2_TH = TARGET_D2_TH;
    let remD3_NB = TARGET_D3_NB;
    let remD3_TH = TARGET_D3_TH;
    let remTL_VD = TARGET_TL_VD;
    let remTL_VDC = TARGET_TL_VDC;

    const rowAllocations = units.map((u, index) => {
      const isLast = index === units.length - 1;
      const weight = u.periods / totalPeriods;
      const tiLeThoiLuong = Math.round(weight * 100);

      // 1. Phân bố Dạng I (Nhiều lựa chọn - 12 câu: 6 NB, 6 TH) theo tỉ lệ thời lượng
      let d1_nb = isLast ? remD1_NB : Math.min(remD1_NB, Math.round(weight * TARGET_D1_NB));
      if (d1_nb < 0) d1_nb = 0;
      remD1_NB -= d1_nb;

      let d1_th = isLast ? remD1_TH : Math.min(remD1_TH, Math.round(weight * TARGET_D1_TH));
      if (d1_th < 0) d1_th = 0;
      remD1_TH -= d1_th;

      // 2. Phân bố Dạng II (Đúng - Sai - 2 câu: 1 NB, 1 TH) ở 2 bài học khác nhau
      let d2_nb = 0;
      if (index === d2_nb_idx && remD2_NB > 0) {
        d2_nb = 1;
        remD2_NB -= 1;
      } else if (isLast && remD2_NB > 0) {
        d2_nb = remD2_NB;
        remD2_NB = 0;
      }

      let d2_th = 0;
      if (index === d2_th_idx && remD2_TH > 0) {
        d2_th = 1;
        remD2_TH -= 1;
      } else if (isLast && remD2_TH > 0) {
        d2_th = remD2_TH;
        remD2_TH = 0;
      }

      // 3. Phân bố Dạng III (Trả lời ngắn - 4 câu: 1 NB, 3 TH) trải đều
      let d3_nb = 0;
      let d3_th = 0;
      d3_slots.forEach((slot) => {
        if (slot.unitIdx === index) {
          if (slot.level === 'biet' && remD3_NB > 0) {
            d3_nb += 1;
            remD3_NB -= 1;
          } else if (slot.level === 'hieu' && remD3_TH > 0) {
            d3_th += 1;
            remD3_TH -= 1;
          }
        }
      });

      if (isLast) {
        if (remD3_NB > 0) {
          d3_nb += remD3_NB;
          remD3_NB = 0;
        }
        if (remD3_TH > 0) {
          d3_th += remD3_TH;
          remD3_TH = 0;
        }
      }

      // 4. Phân bố Tự luận (3 câu/bài: 2 Vận dụng, 1 Vận dụng cao)
      let tl_vd = 0;
      if (tl_vd_indices.includes(index) && remTL_VD > 0) {
        tl_vd = 1;
        remTL_VD -= 1;
      } else if (isLast && remTL_VD > 0) {
        tl_vd = remTL_VD;
        remTL_VD = 0;
      }

      let tl_vdc = 0;
      if (index === tl_vdc_idx && remTL_VDC > 0) {
        tl_vdc = 1;
        remTL_VDC -= 1;
      } else if (isLast && remTL_VDC > 0) {
        tl_vdc = remTL_VDC;
        remTL_VDC = 0;
      }

      // Aggregate TN totals per cell
      const nb_tn = d1_nb + d2_nb + d3_nb;
      const th_tn = d1_th + d2_th + d3_th;

      return {
        id: `moet-row-${index + 1}`,
        tt: index + 1,
        chuong: cleanContentWithoutNls(u.chapter),
        noiDung: cleanContentWithoutNls(u.topic),
        soTiet: u.periods,
        tiLeThoiLuong,
        nhieuLuaChon: {
          biet: d1_nb,
          hieu: d1_th,
          vanDung: 0,
        },
        dungSai: {
          biet: d2_nb,
          hieu: d2_th,
          vanDung: 0,
        },
        traLoiNgan: {
          biet: d3_nb,
          hieu: d3_th,
          vanDung: 0,
        },
        tuLuan: {
          biet: 0,
          hieu: 0,
          vanDung: tl_vd + tl_vdc,
        },
        nhanBiet: {
          tn: nb_tn,
          tl: 0,
          tn1: d1_nb,
          tn2: d2_nb,
          tn3: d3_nb,
        },
        thongHieu: {
          tn: th_tn,
          tl: 0,
          tn1: d1_th,
          tn2: d2_th,
          tn3: d3_th,
        },
        vanDung: {
          tn: 0,
          tl: tl_vd,
          tn1: 0,
          tn2: 0,
          tn3: 0,
        },
        vanDungCao: {
          tn: 0,
          tl: tl_vdc,
          tn1: 0,
          tn2: 0,
          tn3: 0,
        },
      };
    });

    // Final safety check to guarantee exact totals
    if (remD1_NB > 0 && rowAllocations[0]) {
      rowAllocations[0].nhanBiet.tn1 = (rowAllocations[0].nhanBiet.tn1 || 0) + remD1_NB;
      rowAllocations[0].nhanBiet.tn += remD1_NB;
      if (rowAllocations[0].nhieuLuaChon) rowAllocations[0].nhieuLuaChon.biet += remD1_NB;
    }
    if (remD1_TH > 0 && rowAllocations[0]) {
      rowAllocations[0].thongHieu.tn1 = (rowAllocations[0].thongHieu.tn1 || 0) + remD1_TH;
      rowAllocations[0].thongHieu.tn += remD1_TH;
      if (rowAllocations[0].nhieuLuaChon) rowAllocations[0].nhieuLuaChon.hieu += remD1_TH;
    }
    if (remD2_NB > 0 && rowAllocations[0]) {
      rowAllocations[0].nhanBiet.tn2 = (rowAllocations[0].nhanBiet.tn2 || 0) + remD2_NB;
      rowAllocations[0].nhanBiet.tn += remD2_NB;
      if (rowAllocations[0].dungSai) rowAllocations[0].dungSai.biet += remD2_NB;
    }
    if (remD2_TH > 0 && (rowAllocations[1] || rowAllocations[0])) {
      const targetRow = rowAllocations[1] || rowAllocations[0];
      targetRow.thongHieu.tn2 = (targetRow.thongHieu.tn2 || 0) + remD2_TH;
      targetRow.thongHieu.tn += remD2_TH;
      if (targetRow.dungSai) targetRow.dungSai.hieu += remD2_TH;
    }
    if (remD3_NB > 0 && rowAllocations[0]) {
      rowAllocations[0].nhanBiet.tn3 = (rowAllocations[0].nhanBiet.tn3 || 0) + remD3_NB;
      rowAllocations[0].nhanBiet.tn += remD3_NB;
      if (rowAllocations[0].traLoiNgan) rowAllocations[0].traLoiNgan.biet += remD3_NB;
    }
    if (remD3_TH > 0 && rowAllocations[0]) {
      rowAllocations[0].thongHieu.tn3 = (rowAllocations[0].thongHieu.tn3 || 0) + remD3_TH;
      rowAllocations[0].thongHieu.tn += remD3_TH;
      if (rowAllocations[0].traLoiNgan) rowAllocations[0].traLoiNgan.hieu += remD3_TH;
    }
    if (remTL_VD > 0 && rowAllocations[0]) {
      rowAllocations[0].vanDung.tl += remTL_VD;
      if (rowAllocations[0].tuLuan) rowAllocations[0].tuLuan.vanDung += remTL_VD;
    }
    if (remTL_VDC > 0 && rowAllocations[rowAllocations.length - 1]) {
      rowAllocations[rowAllocations.length - 1].vanDungCao.tl += remTL_VDC;
      if (rowAllocations[rowAllocations.length - 1].tuLuan) {
        rowAllocations[rowAllocations.length - 1].tuLuan!.vanDung += remTL_VDC;
      }
    }

    return rowAllocations;
  } else {
    // Standard 2018 TNKQ & TL structure (70% TN = 28 câu x 0.25đ; 30% TL = 3 câu x 1.0đ)
    const targetTnScore = (config.targetScore * config.ratioTn) / 100;
    const targetTlScore = (config.targetScore * config.ratioTl) / 100;
    const totalTnQuestions = Math.round(targetTnScore / config.scorePerTn);
    const totalTlQuestions = Math.round(targetTlScore / config.scorePerTl);

    return units.map((u, index) => {
      const weight = u.periods / totalPeriods;
      const tiLeThoiLuong = Math.round(weight * 100);

      const tnCount = Math.max(1, Math.round(weight * totalTnQuestions));
      const nb_tn = Math.ceil(tnCount * 0.5);
      const th_tn = Math.floor(tnCount * 0.35);
      const vd_tn = Math.max(0, tnCount - nb_tn - th_tn);
      const vdc_tn = 0;

      const isMajor = weight >= 0.16;
      const tl_vd = (isMajor && index === Math.floor(units.length / 2)) ? 1 : 0;
      const tl_vdc = (index === units.length - 1) ? 1 : 0;

      return {
        id: `std-row-${index + 1}`,
        tt: index + 1,
        chuong: cleanContentWithoutNls(u.chapter),
        noiDung: cleanContentWithoutNls(u.topic),
        soTiet: u.periods,
        tiLeThoiLuong,
        nhanBiet: {
          tn: nb_tn,
          tl: 0,
        },
        thongHieu: {
          tn: th_tn,
          tl: 0,
        },
        vanDung: {
          tn: vd_tn,
          tl: tl_vd,
        },
        vanDungCao: {
          tn: vdc_tn,
          tl: tl_vdc,
        },
      };
    });
  }
}

/**
 * Trích xuất và chuẩn hóa dữ liệu 19 cột cho một dòng Ma trận (Phụ lục 1)
 */
export function getMatrixRow19Values(r: MatrixRow) {
  const nlc = {
    biet: r.nhieuLuaChon?.biet ?? r.nhanBiet?.tn1 ?? r.nhanBiet?.tn ?? 0,
    hieu: r.nhieuLuaChon?.hieu ?? r.thongHieu?.tn1 ?? r.thongHieu?.tn ?? 0,
    vanDung: r.nhieuLuaChon?.vanDung ?? 0,
  };
  const ds = {
    biet: r.dungSai?.biet ?? r.nhanBiet?.tn2 ?? 0,
    hieu: r.dungSai?.hieu ?? r.thongHieu?.tn2 ?? 0,
    vanDung: r.dungSai?.vanDung ?? 0,
  };
  const tln = {
    biet: r.traLoiNgan?.biet ?? r.nhanBiet?.tn3 ?? 0,
    hieu: r.traLoiNgan?.hieu ?? r.thongHieu?.tn3 ?? 0,
    vanDung: r.traLoiNgan?.vanDung ?? 0,
  };
  const tl = {
    biet: r.tuLuan?.biet ?? r.nhanBiet?.tl ?? 0,
    hieu: r.tuLuan?.hieu ?? r.thongHieu?.tl ?? 0,
    vanDung: r.tuLuan?.vanDung ?? ((r.vanDung?.tl || 0) + (r.vanDungCao?.tl || 0)),
  };

  const tongBiet = nlc.biet + ds.biet + tln.biet + tl.biet;
  const tongHieu = nlc.hieu + ds.hieu + tln.hieu + tl.hieu;
  const tongVanDung = nlc.vanDung + ds.vanDung + tln.vanDung + tl.vanDung;

  const score =
    (nlc.biet + nlc.hieu + nlc.vanDung) * 0.25 +
    (ds.biet + ds.hieu + ds.vanDung) * 1.0 +
    (tln.biet + tln.hieu + tln.vanDung) * 0.5 +
    (tl.biet + tl.hieu + tl.vanDung) * 1.0;

  const formattedScore =
    score === 0 ? '' : score % 1 === 0 ? score.toString() : score.toFixed(1).replace('.', ',');

  return {
    nlc,
    ds,
    tln,
    tl,
    tongBiet,
    tongHieu,
    tongVanDung,
    score,
    formattedScore,
  };
}

/**
 * Tính tổng số câu hỏi được phân bổ cho một dòng ma trận
 */
export function getRowTotalQuestions(r: MatrixRow): number {
  const vals = getMatrixRow19Values(r);
  return vals.tongBiet + vals.tongHieu + vals.tongVanDung;
}

/**
 * Tính bảng điểm theo từng chủ đề dựa trên số tiết thực tế (Theo đúng Phụ lục I trong công văn)
 */
export function calculateTopicPointSummary(
  rows: MatrixRow[],
  isMidterm: boolean = true
): {
  items: TopicPointCalc[];
  totalPeriods: number;
  totalScore: number;
} {
  // Group by chapter
  const chapterMap = new Map<string, { periods: number }>();
  rows.forEach((r) => {
    const chuong = r.chuong || 'Chủ đề khác';
    const cur = chapterMap.get(chuong) || { periods: 0 };
    cur.periods += r.soTiet || 1;
    chapterMap.set(chuong, cur);
  });

  const totalPeriods = Array.from(chapterMap.values()).reduce((sum, c) => sum + c.periods, 0) || 1;
  const chapterEntries = Array.from(chapterMap.entries());

  let accumulatedScore = 0;
  const items: TopicPointCalc[] = chapterEntries.map(([name, data], idx) => {
    const isLast = idx === chapterEntries.length - 1;
    const rawScore = (data.periods * 10) / totalPeriods;
    // Round to nearest 0.25 or 0.5
    let roundedScore = Math.round(rawScore * 2) / 2;
    
    if (isLast) {
      roundedScore = Math.max(0.5, Number((10 - accumulatedScore).toFixed(1)));
    } else {
      accumulatedScore += roundedScore;
    }

    return {
      topicIndex: idx + 1,
      topicName: name,
      periods: data.periods,
      rawScore: Number(rawScore.toFixed(2)),
      roundedScore,
    };
  });

  const totalScore = items.reduce((sum, item) => sum + item.roundedScore, 0);

  return {
    items,
    totalPeriods,
    totalScore: Number(totalScore.toFixed(1)),
  };
}

/**
 * Tự động tạo Bảng đặc tả đề kiểm tra (Phụ lục II) bám sát yêu cầu cần đạt GDPT 2018 và ma trận 16 cột
 */
export function generateSpecificationFromMatrix(
  rows: MatrixRow[],
  arg2: string = 'Toán',
  arg3: string = '9',
  sgkBooks?: SgkBook[],
  preferredVolume?: 1 | 2 | 'all'
): SpecificationRow[] {
  // Chuẩn hóa grade và subject dù người gọi truyền theo thứ tự nào
  let grade = '9';
  let subject = 'Toán';
  if (['6', '7', '8', '9'].includes(arg2)) {
    grade = arg2;
    subject = arg3 || 'Toán';
  } else if (['6', '7', '8', '9'].includes(arg3)) {
    grade = arg3;
    subject = arg2 || 'Toán';
  } else {
    subject = arg2 || 'Toán';
    grade = arg3 || '9';
  }

  let currentD1Index = 1; // 1 -> 12 (Nhiều lựa chọn)
  let currentD2Index = 13; // 13 -> 14 (Đúng - sai)
  let currentD3Index = 15; // 15 -> 18 (Trả lời ngắn)
  let currentTLIndex = 19; // 19 -> 21 (Tự luận)

  // Chỉ lấy những nội dung có câu hỏi theo đúng yêu cầu
  const hasAnyQuestions = rows.some((r) => getRowTotalQuestions(r) > 0);
  const targetRows = hasAnyQuestions ? rows.filter((r) => getRowTotalQuestions(r) > 0) : rows;

  // Group matrix rows by chapter/topic
  const chapterGroups = new Map<string, MatrixRow[]>();
  targetRows.forEach((r) => {
    const ch = cleanContentWithoutNls(r.chuong || 'Chủ đề chung');
    const list = chapterGroups.get(ch) || [];
    list.push(r);
    chapterGroups.set(ch, list);
  });

  const specRows: SpecificationRow[] = [];
  let topicNumber = 1;

  chapterGroups.forEach((chapterRows, chapterName) => {
    const totalChapterPeriods = chapterRows.reduce((sum, r) => sum + (r.soTiet || 1), 0);

    chapterRows.forEach((r) => {
      const items: SpecificationItem[] = [];
      const v = getMatrixRow19Values(r);

      // Nếu không có câu hỏi ở dòng này thì bỏ qua
      if (hasAnyQuestions && v.tongBiet + v.tongHieu + v.tongVanDung === 0) {
        return;
      }

      // Helper to format question list
      const formatQ = (startIdx: number, count: number, prefix: string = 'Câu ') => {
        if (count <= 0) return '';
        const list: number[] = [];
        for (let i = 0; i < count; i++) {
          list.push(startIdx + i);
        }
        if (list.length === 1) return `${prefix}${list[0]}`;
        return `${prefix}${list.join(', ')}`;
      };

      const getObjective = (level: CognitiveLevel) => {
        if (sgkBooks && sgkBooks.length > 0) {
          return cleanContentWithoutNls(getLearningObjectiveForTopic(level, r.noiDung, r.chuong, sgkBooks, preferredVolume, grade));
        }
        return cleanContentWithoutNls(generateLearningObjective(level, r.noiDung, subject, grade));
      };

      // 1. NHẬN BIẾT
      const nb_d1 = v.nlc.biet;
      const nb_d2 = v.ds.biet;
      const nb_d3 = v.tln.biet;
      const nb_tl = v.tl.biet;

      let q_nb_d1 = '';
      if (nb_d1 > 0) {
        q_nb_d1 = formatQ(currentD1Index, nb_d1);
        currentD1Index += nb_d1;
      }
      let q_nb_d2 = '';
      if (nb_d2 > 0) {
        q_nb_d2 = formatQ(currentD2Index, nb_d2);
        currentD2Index += nb_d2;
      }
      let q_nb_d3 = '';
      if (nb_d3 > 0) {
        q_nb_d3 = formatQ(currentD3Index, nb_d3);
        currentD3Index += nb_d3;
      }
      let q_nb_tl = '';
      if (nb_tl > 0) {
        q_nb_tl = formatQ(currentTLIndex, nb_tl, 'Câu ');
        currentTLIndex += nb_tl;
      }

      if (nb_d1 > 0 || nb_d2 > 0 || nb_d3 > 0 || nb_tl > 0) {
        items.push({
          id: `spec-nb-${r.id}`,
          mucDo: 'nhanBiet',
          mucDoLabel: 'Nhận biết',
          yeuCauCanDat: getObjective('nhanBiet'),
          nlc: { biet: q_nb_d1, hieu: '', vanDung: '' },
          ds: { biet: q_nb_d2, hieu: '', vanDung: '' },
          tln: { biet: q_nb_d3, hieu: '', vanDung: '' },
          tl: { biet: q_nb_tl, hieu: '', vanDung: '' },
          soCauTN: nb_d1 + nb_d2 + nb_d3,
          soCauTL: nb_tl,
          cauHoiTNText: [q_nb_d1, q_nb_d2, q_nb_d3].filter(Boolean).join(', '),
          cauHoiTLText: q_nb_tl,
        });
      }

      // 2. THÔNG HIỂU
      const th_d1 = v.nlc.hieu;
      const th_d2 = v.ds.hieu;
      const th_d3 = v.tln.hieu;
      const th_tl = v.tl.hieu;

      let q_th_d1 = '';
      if (th_d1 > 0) {
        q_th_d1 = formatQ(currentD1Index, th_d1);
        currentD1Index += th_d1;
      }
      let q_th_d2 = '';
      if (th_d2 > 0) {
        q_th_d2 = formatQ(currentD2Index, th_d2);
        currentD2Index += th_d2;
      }
      let q_th_d3 = '';
      if (th_d3 > 0) {
        q_th_d3 = formatQ(currentD3Index, th_d3);
        currentD3Index += th_d3;
      }
      let q_th_tl = '';
      if (th_tl > 0) {
        q_th_tl = formatQ(currentTLIndex, th_tl, 'Câu ');
        currentTLIndex += th_tl;
      }

      if (th_d1 > 0 || th_d2 > 0 || th_d3 > 0 || th_tl > 0) {
        items.push({
          id: `spec-th-${r.id}`,
          mucDo: 'thongHieu',
          mucDoLabel: 'Thông hiểu',
          yeuCauCanDat: getObjective('thongHieu'),
          nlc: { biet: '', hieu: q_th_d1, vanDung: '' },
          ds: { biet: '', hieu: q_th_d2, vanDung: '' },
          tln: { biet: '', hieu: q_th_d3, vanDung: '' },
          tl: { biet: '', hieu: q_th_tl, vanDung: '' },
          soCauTN: th_d1 + th_d2 + th_d3,
          soCauTL: th_tl,
          cauHoiTNText: [q_th_d1, q_th_d2, q_th_d3].filter(Boolean).join(', '),
          cauHoiTLText: q_th_tl,
        });
      }

      // 3. VẬN DỤNG & VẬN DỤNG CAO
      const vd_d1 = v.nlc.vanDung;
      const vd_d2 = v.ds.vanDung;
      const vd_d3 = v.tln.vanDung;
      const vd_tl = v.tl.vanDung;

      let q_vd_d1 = '';
      if (vd_d1 > 0) {
        q_vd_d1 = formatQ(currentD1Index, vd_d1);
        currentD1Index += vd_d1;
      }
      let q_vd_d2 = '';
      if (vd_d2 > 0) {
        q_vd_d2 = formatQ(currentD2Index, vd_d2);
        currentD2Index += vd_d2;
      }
      let q_vd_d3 = '';
      if (vd_d3 > 0) {
        q_vd_d3 = formatQ(currentD3Index, vd_d3);
        currentD3Index += vd_d3;
      }
      let q_vd_tl = '';
      if (vd_tl > 0) {
        if (currentTLIndex === 19 && vd_tl > 1) {
          q_vd_tl = `19 a, b`;
          currentTLIndex += 1;
        } else {
          q_vd_tl = currentTLIndex >= 19 && currentTLIndex <= 21 ? `${currentTLIndex} a` : `Câu ${currentTLIndex}`;
          currentTLIndex += vd_tl;
        }
      }

      if (vd_d1 > 0 || vd_d2 > 0 || vd_d3 > 0 || vd_tl > 0) {
        items.push({
          id: `spec-vd-${r.id}`,
          mucDo: 'vanDung',
          mucDoLabel: 'Vận dụng',
          yeuCauCanDat: getObjective('vanDung'),
          nlc: { biet: '', hieu: '', vanDung: q_vd_d1 },
          ds: { biet: '', hieu: '', vanDung: q_vd_d2 },
          tln: { biet: '', hieu: '', vanDung: q_vd_d3 },
          tl: { biet: '', hieu: '', vanDung: q_vd_tl },
          soCauTN: vd_d1 + vd_d2 + vd_d3,
          soCauTL: vd_tl,
          cauHoiTNText: [q_vd_d1, q_vd_d2, q_vd_d3].filter(Boolean).join(', '),
          cauHoiTLText: q_vd_tl,
        });
      }

      // Nếu chưa có câu hỏi nào trong cả ma trận và không có items thì mới tạo mặc định 3 mức
      if (items.length === 0 && !hasAnyQuestions) {
        items.push({
          id: `spec-nb-empty-${r.id}`,
          mucDo: 'nhanBiet',
          mucDoLabel: 'Nhận biết',
          yeuCauCanDat: getObjective('nhanBiet'),
          nlc: { biet: '', hieu: '', vanDung: '' },
          ds: { biet: '', hieu: '', vanDung: '' },
          tln: { biet: '', hieu: '', vanDung: '' },
          tl: { biet: '', hieu: '', vanDung: '' },
        });
        items.push({
          id: `spec-th-empty-${r.id}`,
          mucDo: 'thongHieu',
          mucDoLabel: 'Thông hiểu',
          yeuCauCanDat: getObjective('thongHieu'),
          nlc: { biet: '', hieu: '', vanDung: '' },
          ds: { biet: '', hieu: '', vanDung: '' },
          tln: { biet: '', hieu: '', vanDung: '' },
          tl: { biet: '', hieu: '', vanDung: '' },
        });
        items.push({
          id: `spec-vd-empty-${r.id}`,
          mucDo: 'vanDung',
          mucDoLabel: 'Vận dụng',
          yeuCauCanDat: getObjective('vanDung'),
          nlc: { biet: '', hieu: '', vanDung: '' },
          ds: { biet: '', hieu: '', vanDung: '' },
          tln: { biet: '', hieu: '', vanDung: '' },
          tl: { biet: '', hieu: '', vanDung: '' },
        });
      }

      if (items.length > 0) {
        specRows.push({
          id: `spec-row-${r.id}`,
          chuong: cleanContentWithoutNls(chapterName),
          soTietChuong: totalChapterPeriods,
          noiDung: cleanContentWithoutNls(r.noiDung),
          items,
        });
      }
    });

    topicNumber++;
  });

  return specRows;
}

/**
 * Tạo mô tả Yêu cầu cần đạt chuẩn GDPT 2018 theo động từ nhận thức
 */
function generateLearningObjective(
  level: CognitiveLevel,
  topic: string,
  subject: string,
  grade: string
): string {
  const cleanTopic = topic.replace(/\(t\d+\)/g, '').trim();

  switch (level) {
    case 'nhanBiet':
      return `- Nhận biết và nêu được các khái niệm, định nghĩa, tính chất cơ bản về ${cleanTopic}.\n- Nhận biết các biểu thức, quy tắc, công thức hoặc hiện tượng liên quan đến ${cleanTopic}.\n- Chỉ ra các ví dụ, dấu hiệu đặc trưng trong các tình huống đơn giản.`;
    case 'thongHieu':
      return `- Giải thích, phân biệt và mô tả được bản chất, cơ chế hoạt động của ${cleanTopic}.\n- Trình bày mối liên hệ giữa các khái niệm, biến đổi được biểu thức, hình vẽ hoặc hiện tượng.\n- Minh họa, so sánh và phân loại được các trường hợp liên quan đến ${cleanTopic}.`;
    case 'vanDung':
      return `- Vận dụng các kiến thức, công thức, định lý về ${cleanTopic} để giải quyết bài toán hoặc tình huống quen thuộc.\n- Thực hiện các bước tính toán, suy luận, chứng minh và xử lý số liệu chính xác.\n- Biến đổi và áp dụng linh hoạt phương pháp giải trong các tình huống cụ thể.`;
    case 'vanDungCao':
      return `- Vận dụng tổng hợp các kiến thức về ${cleanTopic} để giải quyết vấn đề thực tiễn hoặc bài toán phức tạp, liên môn.\n- Phân tích, đánh giá, đề xuất giải pháp, thiết kế mô hình hoặc suy luận logic nâng cao.\n- Xây dựng thuật toán / chiến lược xử lý tối ưu cho tình huống đặt ra.`;
    default:
      return `Nắm vững và thực hiện các yêu cầu cần đạt về ${cleanTopic} theo chương trình GDPT 2018.`;
  }
}
