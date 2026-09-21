import React, { useRef, useState } from 'react';
import {
  Settings,
  Sparkles,
  Upload,
  Sliders,
  Calendar,
  Layers,
  CheckCircle2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  ListFilter,
  Info,
  Clock,
  BookOpen,
  BookMarked,
  ListOrdered,
  Filter,
  ShieldCheck,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { MatrixConfig, ExamEvent, PpctDataset, PpctLesson, SgkBook } from '../types';
import { checkNonTestableContent, cleanLessonTopic } from '../utils/dateCalculations';

interface MatrixConfigProps {
  config: MatrixConfig;
  exams: ExamEvent[];
  activePpct: PpctDataset;
  datasets?: PpctDataset[];
  matchingPpct?: PpctDataset | null;
  hasMatchingPpct?: boolean;
  onGradeOrClassChange?: (grade: string, className?: string) => void;
  onOpenUploadModal?: (grade?: string) => void;
  onLoadSampleGrade?: (grade: string) => void;
  sgkBooks?: SgkBook[];
  onChange: (updated: Partial<MatrixConfig>) => void;
  onGenerateFromPpct: () => void;
  onLoadSampleTemplate: (file: File) => void;
  onOpenSgkManager?: () => void;
  onOpenFullPpct?: () => void;
}

export const MatrixConfigSection: React.FC<MatrixConfigProps> = ({
  config,
  exams,
  activePpct,
  datasets = [],
  matchingPpct,
  hasMatchingPpct = true,
  onGradeOrClassChange,
  onOpenUploadModal,
  onLoadSampleGrade,
  sgkBooks = [],
  onChange,
  onGenerateFromPpct,
  onLoadSampleTemplate,
  onOpenSgkManager,
  onOpenFullPpct,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLessonSelector, setShowLessonSelector] = useState(false);
  const [lessonFilterTab, setLessonFilterTab] = useState<'testable' | 'all' | 'excluded'>('testable');

  const weekFrom = config.limitWeekFrom || 1;
  const weekTo = config.limitWeekTo || 9;
  const excludeNonTestable = config.excludeNonTestable !== false;

  // Determine active SGK Book based on config or term
  const activeVolume = weekFrom >= 19 ? 2 : (weekTo <= 18 ? 1 : 'all');
  const matchedSgkBook = sgkBooks.find((b) => {
    if (config.activeSgkBookId) return b.id === config.activeSgkBookId;
    if (activeVolume === 1 && activePpct.sgkVolume1Id) return b.id === activePpct.sgkVolume1Id;
    if (activeVolume === 2 && activePpct.sgkVolume2Id) return b.id === activePpct.sgkVolume2Id;
    return b.volume === (activeVolume === 2 ? 2 : 1);
  }) || sgkBooks[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadSampleTemplate(file);
    }
  };

  // Extract all lessons in the range [weekFrom, weekTo] and optionally limitPeriodTo
  // Only extract lessons if matching PPCT exists for the selected grade/class
  const lessonsInWeekRange = (hasMatchingPpct && activePpct?.lessons)
    ? activePpct.lessons.filter((l) => {
        if (l.tuan < weekFrom || l.tuan > weekTo) return false;
        if (config.limitPeriodTo && l.tietPPCT && l.tietPPCT > config.limitPeriodTo) return false;
        return true;
      })
    : [];

  // Calculate distinct topics / units in range with cleaned topic name
  const lessonKeysInRange: string[] = Array.from(
    new Set(
      lessonsInWeekRange.map((l) => {
        const cleaned = cleanLessonTopic(l.baiHoc);
        return `${l.chuong}:::${cleaned}`;
      })
    )
  );

  // Distinguish testable knowledge topics from non-testable content (Kiểm tra, Trả bài, Trải nghiệm, Phần mềm, Ôn tập kiểm tra...)
  const testableKeysInRange: string[] = lessonKeysInRange.filter((key) => {
    const [chapter, topic] = key.split(':::');
    return !checkNonTestableContent(topic, chapter).isNonTestable;
  });

  const nonTestableKeysInRange: string[] = lessonKeysInRange.filter((key) => {
    const [chapter, topic] = key.split(':::');
    return checkNonTestableContent(topic, chapter).isNonTestable;
  });

  // Calculate non-testable lesson periods count and reasons
  const nonTestableLessons = lessonsInWeekRange.filter((l) => {
    const check = checkNonTestableContent(l.baiHoc, l.chuong);
    return check.isNonTestable;
  });
  const excludedPeriodsCount = nonTestableLessons.reduce((sum, l) => sum + (l.soTiet || 1), 0);

  // Active selected keys: default to testableKeysInRange when excludeNonTestable is active
  const defaultKeys = excludeNonTestable ? testableKeysInRange : lessonKeysInRange;
  const activeSelectedKeys = config.selectedLessonKeys ?? defaultKeys;
  
  const effectiveLessons = lessonsInWeekRange.filter((l) => {
    const cleaned = cleanLessonTopic(l.baiHoc);
    const key = `${l.chuong}:::${cleaned}`;
    const rawKey = `${l.chuong}:::${l.baiHoc.replace(/\(t\d+\)/g, '').trim()}`;
    return activeSelectedKeys.includes(key) || activeSelectedKeys.includes(rawKey);
  });

  const totalPeriodsInScope = effectiveLessons.reduce((sum, l) => sum + (l.soTiet || 1), 0);

  // Group lessons by Chapter for the lesson selector modal/accordion
  interface TopicGroupItem {
    key: string;
    topic: string;
    rawTopic: string;
    lessonList: PpctLesson[];
    periods: number;
    check: ReturnType<typeof checkNonTestableContent>;
  }

  const chapterGroups = new Map<string, TopicGroupItem[]>();
  
  lessonsInWeekRange.forEach((l) => {
    const cleanedTopic = cleanLessonTopic(l.baiHoc);
    const key = `${l.chuong}:::${cleanedTopic}`;
    const chapterName = l.chuong;
    const check = checkNonTestableContent(l.baiHoc, l.chuong);

    const list = chapterGroups.get(chapterName) || [];
    const existing = list.find((item) => item.key === key);
    if (existing) {
      existing.lessonList.push(l);
      existing.periods += (l.soTiet || 1);
    } else {
      list.push({
        key,
        topic: cleanedTopic,
        rawTopic: l.baiHoc,
        lessonList: [l],
        periods: (l.soTiet || 1),
        check,
      });
      chapterGroups.set(chapterName, list);
    }
  });

  const handleToggleLessonKey = (key: string) => {
    let updated: string[];
    if (activeSelectedKeys.includes(key)) {
      updated = activeSelectedKeys.filter((k) => k !== key);
    } else {
      updated = [...activeSelectedKeys, key];
    }
    onChange({ selectedLessonKeys: updated });
  };

  const handleSelectAllLessons = () => {
    onChange({ selectedLessonKeys: lessonKeysInRange });
  };

  const handleSelectOnlyTestableLessons = () => {
    onChange({ selectedLessonKeys: testableKeysInRange, excludeNonTestable: true });
  };

  const handleDeselectAllLessons = () => {
    onChange({ selectedLessonKeys: [] });
  };

  const handleToggleExcludeNonTestable = (enabled: boolean) => {
    if (enabled) {
      // Switch ON: filter out non-testable keys
      onChange({
        excludeNonTestable: true,
        selectedLessonKeys: testableKeysInRange,
      });
    } else {
      // Switch OFF: include all keys
      onChange({
        excludeNonTestable: false,
        selectedLessonKeys: lessonKeysInRange,
      });
    }
  };

  const ratioPresets = [
    { tn: 70, tl: 30, label: '70% TN — 30% TL (Chuẩn BGD)' },
    { tn: 60, tl: 40, label: '60% TN — 40% TL' },
    { tn: 50, tl: 50, label: '50% TN — 50% TL' },
    { tn: 80, tl: 20, label: '80% TN — 20% TL' },
    { tn: 100, tl: 0, label: '100% Trắc nghiệm' },
  ];

  // Practical presets matching Vietnamese school terms
  const practicalScopePresets = [
    {
      label: '🎯 Giữa HK1 (Tuần 1 – 9)',
      from: 1,
      to: 9,
      periodName: 'Kiểm tra giữa học kỳ I',
      desc: 'Khoảng tuần 1 đến tuần 9',
    },
    {
      label: '🎯 Cuối HK1: Cả HK1 (Tuần 1 – 18)',
      from: 1,
      to: 18,
      periodName: 'Kiểm tra cuối học kỳ I',
      desc: 'Toàn bộ kiến thức Học kỳ I',
    },
    {
      label: '🎯 Cuối HK1: Nửa sau (Tuần 10 – 18)',
      from: 10,
      to: 18,
      periodName: 'Kiểm tra cuối học kỳ I (Nửa sau HK1)',
      desc: 'Kiến thức sau kiểm tra giữa kỳ 1',
    },
    {
      label: '🎯 Giữa HK2 (Tuần 19 – 26)',
      from: 19,
      to: 26,
      periodName: 'Kiểm tra giữa học kỳ II',
      desc: 'Khoảng tuần 19 đến tuần 26',
    },
    {
      label: '🎯 Cuối HK2: Cả HK2 (Tuần 19 – 35)',
      from: 19,
      to: 35,
      periodName: 'Kiểm tra cuối học kỳ II',
      desc: 'Toàn bộ kiến thức Học kỳ II',
    },
    {
      label: '🎯 Cuối HK2: Nửa sau (Tuần 27 – 35)',
      from: 27,
      to: 35,
      periodName: 'Kiểm tra cuối học kỳ II (Nửa sau HK2)',
      desc: 'Kiến thức sau kiểm tra giữa kỳ 2',
    },
    {
      label: '🎯 Cả năm học (Tuần 1 – 35)',
      from: 1,
      to: 35,
      periodName: 'Kiểm tra tổng hợp cả năm',
      desc: 'Toàn bộ năm học (Tuần 1 -> 35)',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6">
      {/* Top Header with Active PPCT Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-800">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Thông tin & Cấu hình Giới hạn Ma trận đề</h2>
            <p className="text-xs text-slate-500">
              Thiết lập chính xác phạm vi tuần kiểm tra, lọc bài học thực tế và quy định cấu trúc điểm
            </p>
          </div>
        </div>

        {/* Grade & Subject Auto-Sync Indicator & SGK Integration Badge */}
        <div className="flex flex-wrap items-center gap-2">
          {hasMatchingPpct ? (
            <div className="flex items-center gap-2 bg-emerald-50/90 border border-emerald-300 rounded-lg px-3 py-1.5 text-xs text-emerald-900 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>PPCT:</span>
              <strong className="font-semibold text-emerald-950">
                Môn {activePpct.subject} — Khối {config.grade}{config.className ? ` (Lớp ${config.className})` : ''}
              </strong>
              <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-1.5 py-0.2 rounded">
                {activePpct.totalLessons || 140} tiết
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-amber-950 shadow-2xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span className="font-bold text-amber-900">
                Chưa tải lên PPCT Khối {config.grade}{config.className ? ` (${config.className})` : ''}
              </span>
              {onOpenUploadModal && (
                <button
                  type="button"
                  onClick={() => onOpenUploadModal(config.grade)}
                  className="px-2 py-0.5 bg-amber-700 hover:bg-amber-800 text-white rounded text-[11px] font-bold transition-colors"
                >
                  Tải lên
                </button>
              )}
            </div>
          )}

          {onOpenFullPpct && (
            <button
              type="button"
              onClick={onOpenFullPpct}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 rounded-lg px-3 py-1.5 text-xs text-emerald-950 font-medium transition-colors shadow-2xs group"
              title="Xem toàn bộ Phân phối chương trình (140 tiết) để đối chiếu"
            >
              <ListOrdered className="w-3.5 h-3.5 text-emerald-700 group-hover:scale-110 transition-transform" />
              <span>Xem toàn bộ PPCT</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSgkManager}
            className="flex items-center gap-2 bg-teal-50 hover:bg-teal-100/90 border border-teal-300 rounded-lg px-3 py-1.5 text-xs text-teal-950 font-medium transition-colors shadow-2xs group"
            title="Nhấn để mở Bảng quản lý & Tải lên Sách Giáo Khoa Toán Tập 1, Tập 2"
          >
            <BookMarked className="w-3.5 h-3.5 text-teal-700 group-hover:scale-110 transition-transform" />
            <span>SGK bám sát:</span>
            <strong className="font-bold text-teal-900 underline decoration-teal-400">
              {matchedSgkBook ? `${matchedSgkBook.title} (Tập ${matchedSgkBook.volume})` : `Toán ${config.grade} (Tập 1 & 2)`}
            </strong>
          </button>
        </div>
      </div>

      {/* Warning Notice Banner if Matching PPCT is Missing */}
      {!hasMatchingPpct && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-4 text-amber-950 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-100 border border-amber-300 rounded-xl text-amber-800 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <span>Chưa tải lên PPCT phù hợp cho Khối {config.grade}{config.className ? ` (Lớp ${config.className})` : ''}</span>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                    Cần tải lên PPCT
                  </span>
                </h3>
                <p className="text-xs text-amber-900/90 mt-1 max-w-2xl leading-relaxed">
                  Hệ thống chưa tìm thấy Phân phối chương trình môn {config.subject || 'Toán'} cho Khối {config.grade}{config.className ? ` (Lớp ${config.className})` : ''}. Để thiết lập ma trận và bảng đặc tả đề kiểm tra bám sát đúng tiến độ và nội dung bài học, thầy cô vui lòng tải lên file PPCT (Word .docx hoặc Excel .xlsx) hoặc nạp dữ liệu chuẩn của khối này.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onOpenUploadModal && (
                <button
                  type="button"
                  onClick={() => onOpenUploadModal(config.grade)}
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs hover:shadow"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Tải lên PPCT Khối {config.grade}</span>
                </button>
              )}
              {['6', '7', '8', '9'].includes(String(config.grade).replace(/\D/g, '')) && onLoadSampleGrade && (
                <button
                  type="button"
                  onClick={() => onLoadSampleGrade(config.grade)}
                  className="px-3.5 py-2 bg-white hover:bg-amber-100/80 text-amber-950 border border-amber-400 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Nạp nhanh bộ PPCT chuẩn Bộ GD&ĐT (140 tiết) để sử dụng ngay"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Nạp mẫu chuẩn BGD Khối {config.grade}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Row 1: Thông tin hành chính (Trường, Môn, Khối, Lớp, Năm học, Giáo viên, Đợt kiểm tra, Thời gian) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 mb-4 text-xs">
        <div>
          <label className="block font-medium text-slate-700 mb-1">Trường học</label>
          <input
            type="text"
            value={config.schoolName}
            onChange={(e) => onChange({ schoolName: e.target.value })}
            placeholder="TRƯỜNG THCS VÀ THPT PHÚ THÀNH"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Tổ bộ môn</label>
          <input
            type="text"
            value={config.department}
            onChange={(e) => onChange({ department: e.target.value })}
            placeholder="Tổ Toán - Tin"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Môn học</label>
          <input
            type="text"
            value={config.subject}
            onChange={(e) => onChange({ subject: e.target.value })}
            placeholder="Toán"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium"
          />
        </div>

        {/* Khối với chọn nhanh và phát hiện PPCT động */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-medium text-slate-700">Khối</label>
            <div className="flex items-center gap-1">
              {['6', '7', '8', '9'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (onGradeOrClassChange) {
                      onGradeOrClassChange(k, config.className);
                    } else {
                      onChange({ grade: k });
                    }
                  }}
                  className={`px-1 py-0.2 text-[10px] font-bold rounded ${
                    String(config.grade).replace(/\D/g, '') === k
                      ? 'bg-emerald-800 text-white'
                      : 'bg-slate-200 hover:bg-emerald-100 text-slate-700'
                  }`}
                  title={`Chuyển sang Khối ${k}`}
                >
                  K{k}
                </button>
              ))}
            </div>
          </div>
          <select
            value={config.grade}
            onChange={(e) => {
              const newGrade = e.target.value;
              if (onGradeOrClassChange) {
                onGradeOrClassChange(newGrade, config.className);
              } else {
                onChange({ grade: newGrade });
              }
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none font-bold text-xs"
          >
            <option value="6">Khối 6 (Lớp 6)</option>
            <option value="7">Khối 7 (Lớp 7)</option>
            <option value="8">Khối 8 (Lớp 8)</option>
            <option value="9">Khối 9 (Lớp 9)</option>
            <option value="10">Khối 10 (Lớp 10)</option>
            <option value="11">Khối 11 (Lớp 11)</option>
            <option value="12">Khối 12 (Lớp 12)</option>
          </select>
        </div>

        {/* Lớp của khối */}
        <div>
          <label className="block font-medium text-slate-700 mb-1 flex items-center justify-between">
            <span>Lớp của khối</span>
            <span className="text-[10px] text-slate-400 font-normal">Tùy chọn</span>
          </label>
          <input
            type="text"
            value={config.className || ''}
            onChange={(e) => {
              const newClass = e.target.value;
              if (onGradeOrClassChange) {
                onGradeOrClassChange(config.grade, newClass);
              } else {
                onChange({ className: newClass });
              }
            }}
            placeholder={`VD: ${config.grade || 9}A1, ${config.grade || 9}A...`}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1 flex items-center justify-between">
            <span>Năm học</span>
            <span className="text-[10px] text-emerald-700 font-semibold">2026-2027</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={config.academicYear || '2026 - 2027'}
              onChange={(e) => onChange({ academicYear: e.target.value })}
              placeholder="2026 - 2027"
              list="academic-year-presets"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium"
            />
            <datalist id="academic-year-presets">
              <option value="2026 - 2027" />
              <option value="2027 - 2028" />
              <option value="2028 - 2029" />
              <option value="2029 - 2030" />
              <option value="2030 - 2031" />
            </datalist>
          </div>
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1 flex items-center justify-between">
            <span>Người lập / GV</span>
            <span className="text-[10px] text-slate-400 font-normal">Ký tên</span>
          </label>
          <input
            type="text"
            value={config.teacherName || 'Dương Văn Trong'}
            onChange={(e) => onChange({ teacherName: e.target.value })}
            placeholder="Dương Văn Trong"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Thời gian làm bài</label>
          <input
            type="text"
            value={config.examDuration}
            onChange={(e) => onChange({ examDuration: e.target.value })}
            placeholder="90 phút"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Row 2: THẺ GIỚI HẠN PHẠM VI TUẦN KIỂM TRA & TỈ LỆ ĐIỂM TRẮC NGHIỆM / TỰ LUẬN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Module 1: GIỚI HẠN CỤ THỂ PHẠM VI TUẦN THEO THỰC TẾ GIẢNG DẠY */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>Giới hạn nội dung kiểm tra theo PPCT:</span>
              </label>
              <span className="font-bold text-emerald-800 text-xs bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Từ Tuần {weekFrom} ➔ Đến Tuần {weekTo}
              </span>
            </div>

            {/* Range Pickers: From Week & To Week */}
            <div className="grid grid-cols-2 gap-3 mb-3 bg-white p-2.5 rounded-lg border border-slate-200">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-medium text-slate-600">Từ tuần:</span>
                  <span className="font-bold text-emerald-800">Tuần {weekFrom}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={35}
                    value={weekFrom}
                    onChange={(e) => {
                      const fromVal = Math.min(35, Math.max(1, parseInt(e.target.value, 10) || 1));
                      const newTo = Math.max(fromVal, weekTo);
                      onChange({ limitWeekFrom: fromVal, limitWeekTo: newTo, selectedLessonKeys: undefined });
                    }}
                    className="w-full accent-emerald-700 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    min={1}
                    max={35}
                    value={weekFrom}
                    onChange={(e) => {
                      const fromVal = Math.min(35, Math.max(1, parseInt(e.target.value, 10) || 1));
                      const newTo = Math.max(fromVal, weekTo);
                      onChange({ limitWeekFrom: fromVal, limitWeekTo: newTo, selectedLessonKeys: undefined });
                    }}
                    className="w-12 text-center bg-slate-50 border border-slate-300 rounded py-0.5 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-medium text-slate-600">Đến tuần:</span>
                  <span className="font-bold text-emerald-800">Tuần {weekTo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={weekFrom}
                    max={35}
                    value={weekTo}
                    onChange={(e) => {
                      const toVal = Math.min(35, Math.max(weekFrom, parseInt(e.target.value, 10) || weekFrom));
                      onChange({ limitWeekTo: toVal, selectedLessonKeys: undefined });
                    }}
                    className="w-full accent-emerald-700 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    min={weekFrom}
                    max={35}
                    value={weekTo}
                    onChange={(e) => {
                      const toVal = Math.min(35, Math.max(weekFrom, parseInt(e.target.value, 10) || weekFrom));
                      onChange({ limitWeekTo: toVal, selectedLessonKeys: undefined });
                    }}
                    className="w-12 text-center bg-slate-50 border border-slate-300 rounded py-0.5 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Optional Specific Limit by Period Number */}
            <div className="flex items-center justify-between gap-2 mb-3 bg-slate-100/70 p-2 rounded-lg border border-slate-200/80">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] font-medium text-slate-700">
                  Giới hạn cụ thể đến Tiết số:
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={200}
                  placeholder="Tất cả tiết"
                  value={config.limitPeriodTo || ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    onChange({ limitPeriodTo: val, selectedLessonKeys: undefined });
                  }}
                  className="w-24 text-center bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 placeholder:text-slate-400 placeholder:text-[10px]"
                />
                {config.limitPeriodTo && (
                  <button
                    type="button"
                    onClick={() => onChange({ limitPeriodTo: undefined, selectedLessonKeys: undefined })}
                    className="text-[10px] text-red-600 hover:text-red-700 underline"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>

            {/* Quick preset buttons matching actual teaching milestones */}
            <div className="mb-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                Chọn nhanh các mốc kiểm tra thực tế:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {practicalScopePresets.map((p) => {
                  const isCurrent = weekFrom === p.from && weekTo === p.to;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        onChange({
                          limitWeekFrom: p.from,
                          limitWeekTo: p.to,
                          examPeriod: p.periodName,
                          limitPeriodTo: undefined,
                          selectedLessonKeys: undefined,
                        });
                      }}
                      title={p.desc}
                      className={`px-2 py-1.5 rounded-md text-[10.5px] font-medium transition-all text-left truncate ${
                        isCurrent
                          ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                          : 'bg-white hover:bg-slate-200/70 border border-slate-200 text-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Scope Summary & Interactive Lesson Selector Trigger */}
          <div className="pt-2.5 mt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-[11px] text-slate-700">
              <span>Đang chọn: </span>
              <strong className="text-emerald-900 font-bold">{effectiveLessons.length} bài học</strong>
              <span> ({totalPeriodsInScope} tiết thực tế)</span>
            </div>

            <button
              type="button"
              onClick={() => setShowLessonSelector(!showLessonSelector)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-semibold transition-colors shadow-2xs"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>{showLessonSelector ? 'Đóng danh sách bài' : 'Xem & Tùy chọn bài học'}</span>
              {showLessonSelector ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Module 2: Quy định tỉ lệ Trắc nghiệm / Tự luận (70% TN - 30% TL) */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-700" />
                <span>Quy định tỉ lệ điểm Trắc nghiệm & Tự luận:</span>
              </label>
              <div className="flex items-center gap-1 font-bold text-xs">
                <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  TN: {config.ratioTn}% ({(config.ratioTn * 0.1).toFixed(1)}đ)
                </span>
                <span className="text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                  TL: {config.ratioTl}% ({(config.ratioTl * 0.1).toFixed(1)}đ)
                </span>
              </div>
            </div>

            {/* Interactive Ratio Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
              {ratioPresets.map((r) => (
                <button
                  key={`${r.tn}-${r.tl}`}
                  type="button"
                  onClick={() => onChange({ ratioTn: r.tn, ratioTl: r.tl })}
                  className={`px-2 py-1.5 rounded-md text-[11px] font-medium transition-all text-center ${
                    config.ratioTn === r.tn && config.ratioTl === r.tl
                      ? 'bg-blue-700 text-white font-semibold shadow-xs'
                      : 'bg-white hover:bg-slate-200/70 border border-slate-200 text-slate-700'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Slider for custom adjustments */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 mb-3">
              <div className="flex justify-between text-[11px] text-slate-600 mb-1.5">
                <span className="font-medium text-blue-800">Trắc nghiệm: {config.ratioTn}% ({(config.ratioTn * 0.1).toFixed(1)} điểm)</span>
                <span className="font-medium text-purple-800">Tự luận: {config.ratioTl}% ({(config.ratioTl * 0.1).toFixed(1)} điểm)</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={config.ratioTn}
                onChange={(e) => {
                  const tnVal = parseInt(e.target.value, 10);
                  onChange({ ratioTn: tnVal, ratioTl: 100 - tnVal });
                }}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Explanation Note */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-2 text-[11px] text-blue-900 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                Theo hướng dẫn kiểm tra đánh giá định kỳ của Bộ GD&ĐT, tỉ lệ chuẩn khuyến khích là <strong>70% Trắc nghiệm khách quan</strong> và <strong>30% Tự luận</strong> trên thang điểm 10.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2.5: TÙY CHỈNH NỘI DUNG RA ĐỀ (LOẠI TRỪ NỘI DUNG KHÔNG CẦN THIẾT) */}
      <div className="mb-4 bg-gradient-to-r from-teal-50/90 via-emerald-50/70 to-slate-50 border border-teal-200/80 rounded-xl p-3.5 text-xs shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className={`p-2 rounded-lg mt-0.5 ${excludeNonTestable ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-800 text-sm">
                  Tự động loại bỏ nội dung không cần thiết ra đề
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold flex items-center gap-1 ${
                  excludeNonTestable
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {excludeNonTestable ? 'ĐANG BẬT (Khuyến nghị)' : 'ĐANG TẮT'}
                </span>
              </div>
              <p className="text-[11.5px] text-slate-600 mt-0.5 leading-relaxed">
                Không thiết lập vào ma trận các tiết: <strong>Kiểm tra định kỳ/thường xuyên</strong>, <strong>Trả bài kiểm tra</strong>, <strong>Hoạt động thực hành & trải nghiệm</strong>, <strong>Thực hành phần mềm</strong>, <strong>Ôn tập kiểm tra chung</strong>.
              </p>
              {excludeNonTestable && nonTestableKeysInRange.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-900 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>
                    Đã tự động loại trừ <strong>{nonTestableKeysInRange.length} nội dung</strong> ({excludedPeriodsCount} tiết) khỏi ma trận đề thi.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={() => handleToggleExcludeNonTestable(!excludeNonTestable)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-1 ${
                excludeNonTestable ? 'bg-emerald-700' : 'bg-slate-300'
              }`}
              title={excludeNonTestable ? 'Nhấn để tắt lọc tự động' : 'Nhấn để bật lọc tự động'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  excludeNonTestable ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowLessonSelector(true);
                setLessonFilterTab('testable');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
            >
              <ListFilter className="w-3.5 h-3.5 text-emerald-700" />
              <span>Xem & Tùy chọn bài học ({activeSelectedKeys.length}/{lessonKeysInRange.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* COLLAPSIBLE LESSON SELECTOR: CHO PHÉP CHỌN / LỌC TỪNG BÀI HỌC CỤ THỂ TRONG PHẠM VI TUẦN */}
      {showLessonSelector && (
        <div className="mb-4 bg-emerald-50/40 border border-emerald-200 rounded-xl p-4 text-xs animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-3 border-b border-emerald-200/80">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-800" />
                <span>Danh sách bài học trong phạm vi (Tuần {weekFrom} đến {weekTo})</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Tích chọn hoặc bỏ chọn từng bài học để điều chỉnh chính xác theo tình hình thực tế lớp học.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSelectOnlyTestableLessons}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold transition-colors shadow-2xs"
                title="Chỉ chọn những bài học có kiến thức trọng tâm để ra đề thi"
              >
                <CheckSquare className="w-3 h-3" />
                <span>Chỉ chọn nội dung ra đề ({testableKeysInRange.length})</span>
              </button>
              <button
                type="button"
                onClick={handleSelectAllLessons}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[11px] font-medium transition-colors"
              >
                <CheckSquare className="w-3 h-3" />
                <span>Chọn tất cả ({lessonKeysInRange.length})</span>
              </button>
              <button
                type="button"
                onClick={handleDeselectAllLessons}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded text-[11px] font-medium transition-colors"
              >
                <Square className="w-3 h-3" />
                <span>Bỏ chọn hết</span>
              </button>
            </div>
          </div>

          {/* Filter Tabs for Lesson Selector */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-emerald-200/60">
            <span className="text-[11px] text-slate-500 font-medium mr-1">Bộ lọc hiển thị:</span>
            <button
              type="button"
              onClick={() => setLessonFilterTab('testable')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1.5 ${
                lessonFilterTab === 'testable'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'
              }`}
            >
              <span>🎯 Trọng tâm ra đề</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                lessonFilterTab === 'testable' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-600'
              }`}>
                {testableKeysInRange.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLessonFilterTab('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1.5 ${
                lessonFilterTab === 'all'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'
              }`}
            >
              <span>Tất cả bài học</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                lessonFilterTab === 'all' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-600'
              }`}>
                {lessonKeysInRange.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLessonFilterTab('excluded')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1.5 ${
                lessonFilterTab === 'excluded'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
              }`}
            >
              <span>🚫 Nội dung loại trừ</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                lessonFilterTab === 'excluded' ? 'bg-amber-800 text-amber-100' : 'bg-slate-100 text-slate-600'
              }`}>
                {nonTestableKeysInRange.length}
              </span>
            </button>
          </div>

          {/* Chapters and lessons accordion grid */}
          {!hasMatchingPpct || Array.from(chapterGroups.entries()).length === 0 ? (
            <div className="bg-white rounded-lg border border-amber-200 p-6 text-center text-slate-700 shadow-2xs">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">
                Chưa có dữ liệu bài học PPCT cho Khối {config.grade}{config.className ? ` (Lớp ${config.className})` : ''}
              </h4>
              <p className="text-xs text-slate-500 mt-1 mb-3 max-w-md mx-auto">
                Vui lòng tải lên file Phân phối chương trình môn {config.subject || 'Toán'} hoặc nạp mẫu chuẩn để hệ thống hiển thị danh mục bài học chi tiết.
              </p>
              {onOpenUploadModal && (
                <button
                  type="button"
                  onClick={() => onOpenUploadModal(config.grade)}
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Tải lên PPCT Khối {config.grade}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {Array.from(chapterGroups.entries()).map(([chapterName, topics]) => {
                const filteredTopics = topics.filter((t) => {
                  if (lessonFilterTab === 'testable') return !t.check.isNonTestable;
                  if (lessonFilterTab === 'excluded') return t.check.isNonTestable;
                  return true;
                });

                if (filteredTopics.length === 0) return null;

                return (
                  <div key={chapterName} className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                    <h4 className="font-semibold text-emerald-950 text-xs mb-2 pb-1 border-b border-slate-100 flex items-center justify-between">
                      <span>{chapterName}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {filteredTopics.reduce((sum, t) => sum + t.periods, 0)} tiết ({filteredTopics.length} nội dung)
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {filteredTopics.map((topicItem) => {
                        const isChecked = activeSelectedKeys.includes(topicItem.key);
                        const weekNumbers = Array.from(new Set(topicItem.lessonList.map((l) => l.tuan))).join(', ');
                        const isExcludedType = topicItem.check.isNonTestable;

                        return (
                          <label
                            key={topicItem.key}
                            onClick={() => handleToggleLessonKey(topicItem.key)}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                              isChecked
                                ? isExcludedType
                                  ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                                  : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                                : 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by label
                              className="mt-0.5 accent-emerald-700 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                <span className="font-medium text-xs leading-snug">
                                  {topicItem.topic}
                                </span>
                                {isExcludedType ? (
                                  <span className="inline-flex items-center px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[9.5px] font-medium">
                                    🚫 {topicItem.check.reason}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[9.5px] font-medium">
                                    🎯 Trọng tâm ra đề
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <span>Tuần: {weekNumbers}</span>
                                <span>•</span>
                                <span>Thời lượng: {topicItem.periods} tiết</span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Row 3: CẤU TRÚC ĐỀ THEO BỘ GD&ĐT VÀ THANG ĐIỂM CHI TIẾT */}
      <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl mb-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-slate-800">Cấu trúc định dạng câu hỏi theo Bộ GD&ĐT:</span>
          </div>

          {/* Toggle structure format */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => onChange({ structureType: 'moet_2025_new' })}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                config.structureType === 'moet_2025_new'
                  ? 'bg-emerald-800 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cấu trúc Mới 2025 (3 dạng TN + Tự luận)
            </button>
            <button
              type="button"
              onClick={() => onChange({ structureType: 'standard_2018' })}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                config.structureType === 'standard_2018'
                  ? 'bg-emerald-800 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cấu trúc Chuẩn (TNKQ & Tự luận)
            </button>
          </div>
        </div>

        {/* Detailed Explanation of question forms */}
        {config.structureType === 'moet_2025_new' ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] text-slate-700">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <strong className="text-emerald-900 block font-semibold mb-0.5">Phần I: TN Nhiều lựa chọn</strong>
              <span className="text-slate-600">Mỗi câu 0.25đ (4 lựa chọn chọn 1). Thang điểm: ~3.0 - 4.0đ</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <strong className="text-emerald-900 block font-semibold mb-0.5">Phần II: TN Đúng / Sai</strong>
              <span className="text-slate-600">Mỗi câu 4 lệnh a,b,c,d (Tối đa 1.0đ/câu). Thang điểm: ~2.0đ</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <strong className="text-emerald-900 block font-semibold mb-0.5">Phần III: TN Trả lời ngắn</strong>
              <span className="text-slate-600">Điền đáp án số (0.25đ - 0.5đ/câu). Thang điểm: ~1.0 - 2.0đ</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <strong className="text-emerald-900 block font-semibold mb-0.5">Phần IV: Tự luận</strong>
              <span className="text-slate-600">Trình bày bài giải chi tiết. Thang điểm: {(config.ratioTl * 0.1).toFixed(1)}đ ({config.ratioTl}%)</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <strong className="text-emerald-900 block font-semibold mb-0.5">Trắc nghiệm khách quan (TNKQ)</strong>
              <span className="text-slate-600">Gồm {Math.round((config.ratioTn * 0.1) / config.scorePerTn)} câu (0.25đ/câu) phân bố đều theo 4 mức độ</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <strong className="text-emerald-900 block font-semibold mb-0.5">Tự luận (TL)</strong>
              <span className="text-slate-600">Gồm ~{Math.round((config.ratioTl * 0.1) / config.scorePerTl)} câu tự luận bám sát trọng tâm kiến thức</span>
            </div>
          </div>
        )}
      </div>

      {/* Row 4: Action Buttons & Generation triggers */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              if (!hasMatchingPpct && onOpenUploadModal) {
                onOpenUploadModal(config.grade);
              } else {
                onGenerateFromPpct();
              }
            }}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-xs hover:shadow-sm ${
              hasMatchingPpct
                ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                : 'bg-amber-700 hover:bg-amber-800 text-white'
            }`}
            title={
              hasMatchingPpct
                ? `Tự động tính toán số tiết, số điểm và cân bằng số lượng câu hỏi theo PPCT Khối ${config.grade} trong phạm vi tuần đã chọn`
                : `Chưa có PPCT Khối ${config.grade}. Nhấn để tải lên PPCT phù hợp`
            }
          >
            {hasMatchingPpct ? (
              <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
            ) : (
              <Upload className="w-4 h-4 text-amber-200" />
            )}
            <span>
              {hasMatchingPpct
                ? `Tự động tính & Cân bằng ma trận (Bám sát Tuần ${weekFrom}–${weekTo})`
                : `Tải lên PPCT Khối ${config.grade} để cân bằng ma trận`}
            </span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".docx,.doc,.xlsx,.xls,.csv"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Nạp file mẫu (.docx/.xlsx)</span>
          </button>
        </div>

        {config.sampleLoadedName && (
          <span className="text-xs text-slate-600 italic flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 not-italic inline flex-shrink-0" />
            <span className="text-slate-500">Trạng thái:</span>
            <strong className="text-slate-800 not-italic font-medium">{config.sampleLoadedName}</strong>
          </span>
        )}
      </div>
    </div>
  );
};
