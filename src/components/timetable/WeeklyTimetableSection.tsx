import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Camera,
  Layers,
  CheckCircle2,
  Circle,
  FileText,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Filter,
  Sparkles,
  ExternalLink,
  Printer,
  Edit3,
  Award,
  Copy,
  Table as TableIcon,
  LayoutGrid,
  RotateCcw,
  Check,
  Clipboard,
  Plus,
  Trash2,
  Save,
  X,
  UserCheck,
  Users,
  RefreshCw,
} from 'lucide-react';
import {
  TeacherTimetableConfig,
  WeeklyScheduledPeriod,
  TimetableSlot,
  PpctDataset,
  TimeframeConfig,
} from '../../types';
import {
  generateWeeklySchedule,
  getTodayLessons,
  getWeekDates,
  getDefaultTeacherTimetable,
  getWeeklySlots,
  hasCustomSlotsForWeek,
} from '../../utils/timetableScheduler';
import { deriveStartDateWeek1 } from '../../utils/dateCalculations';
import { TimetableUploadModal } from './TimetableUploadModal';

interface WeeklyTimetableSectionProps {
  currentConfig: TeacherTimetableConfig;
  onUpdateConfig: (newConfig: TeacherTimetableConfig) => void;
  datasets: PpctDataset[];
  timeframeConfig: TimeframeConfig;
  currentWeek: number;
  term: 1 | 2;
}

export const WeeklyTimetableSection: React.FC<WeeklyTimetableSectionProps> = ({
  currentConfig,
  onUpdateConfig,
  datasets,
  timeframeConfig,
  currentWeek,
  term,
}) => {
  // Navigation week (Tuần 1 -> 35)
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    return currentWeek > 0 && currentWeek <= 35 ? currentWeek : 1;
  });

  // Modal upload / edit
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [pastedFilePayload, setPastedFilePayload] = useState<{
    dataUrl: string;
    fileName: string;
    isPdf: boolean;
  } | null>(null);

  // Global Ctrl+V listener: automatically intercept screenshot paste and open modal
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              setPastedFilePayload({
                dataUrl: base64,
                fileName: `Ảnh_chụp_màn_hình_${new Date().toLocaleTimeString('vi-VN').replace(/:/g, '-')}.png`,
                isPdf: false,
              });
              setIsUploadModalOpen(true);
            };
            reader.readAsDataURL(file);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  // Inline editing teacher name
  const [isEditingTeacher, setIsEditingTeacher] = useState<boolean>(false);
  const [tempTeacherName, setTempTeacherName] = useState<string>('');

  // Batch rename class modal state
  const [isBatchRenameModalOpen, setIsBatchRenameModalOpen] = useState<boolean>(false);
  const [batchOldClass, setBatchOldClass] = useState<string>('');
  const [batchNewClass, setBatchNewClass] = useState<string>('');
  const [batchRenameScope, setBatchRenameScope] = useState<'all' | 'current_week'>('all');

  // Add slot modal state
  const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState<boolean>(false);
  const [newSlotDay, setNewSlotDay] = useState<number>(2);
  const [newSlotPeriod, setNewSlotPeriod] = useState<number>(1);
  const [newSlotClass, setNewSlotClass] = useState<string>('');
  const [newSlotSubject, setNewSlotSubject] = useState<string>('Toán');
  const [newSlotRoom, setNewSlotRoom] = useState<string>('');
  const [newSlotScope, setNewSlotScope] = useState<'all' | 'current_week'>('all');

  // Detail slot editing state
  const [isEditingDetailSlot, setIsEditingDetailSlot] = useState<boolean>(false);
  const [editSlotClass, setEditSlotClass] = useState<string>('');
  const [editSlotSubject, setEditSlotSubject] = useState<string>('');
  const [editSlotRoom, setEditSlotRoom] = useState<string>('');
  const [editSlotScope, setEditSlotScope] = useState<'all' | 'current_week'>('all');

  // Filter by class or grade ('all' or specific className)
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // View modes
  const [viewMode, setViewMode] = useState<'tkb_sample' | 'visual_schedule' | 'official_register'>('tkb_sample');

  // Selected period detail modal
  const [detailPeriod, setDetailPeriod] = useState<WeeklyScheduledPeriod | null>(null);

  // Toggle expand lesson names in the TKB table
  const [showLessonDetailsInTkb, setShowLessonDetailsInTkb] = useState<boolean>(true);

  // Copy success indicator
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Today date string (from timeframe config or real Date)
  const todayDateStr = timeframeConfig.currentDate || new Date().toISOString().split('T')[0];

  // Tự động tính toán ngày bắt đầu Tuần 1 chuẩn xác từ ngày áp dụng và tuần áp dụng của TKB
  const effectiveStartDateWeek1 = useMemo(() => {
    return deriveStartDateWeek1(
      currentConfig.appliedDate || timeframeConfig.startDateWeek1 || '2026-09-07',
      currentConfig.appliedWeek || 1
    );
  }, [currentConfig.appliedDate, currentConfig.appliedWeek, timeframeConfig.startDateWeek1]);

  // Các slot đang hoạt động của tuần được chọn
  const activeSlots = useMemo(() => {
    return getWeeklySlots(currentConfig, selectedWeek);
  }, [currentConfig, selectedWeek]);

  // Calculate schedule for the selected week
  const weeklySchedule = useMemo(() => {
    return generateWeeklySchedule(
      currentConfig,
      datasets,
      selectedWeek,
      effectiveStartDateWeek1
    );
  }, [currentConfig, datasets, selectedWeek, effectiveStartDateWeek1]);

  // Distinct classes in the timetable for this week
  const distinctClasses = useMemo(() => {
    const set = new Set<string>();
    activeSlots.forEach((s) => {
      if (s.className) set.add(s.className.trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [activeSlots]);

  // Auto reset selectedFilter if filtered class no longer exists
  useEffect(() => {
    if (selectedFilter !== 'all' && !['6', '7', '8', '9'].includes(selectedFilter)) {
      if (!distinctClasses.includes(selectedFilter)) {
        setSelectedFilter('all');
      }
    }
  }, [distinctClasses, selectedFilter]);

  // Dynamic teaching summary calculated from actual distinct classes and active slots
  const teachingSummary = useMemo(() => {
    if (distinctClasses.length === 0) {
      return {
        text: 'Chưa có lớp dạy',
        gradesText: 'Toán',
        classesByGradeText: '',
        homeroomClass: null,
      };
    }

    const byGrade: Record<string, string[]> = {};
    distinctClasses.forEach((cls) => {
      const match = cls.match(/\b(1[0-2]|[6-9])/);
      const g = match ? match[0] : cls.replace(/\D/g, '')[0] || 'Toán';
      if (!byGrade[g]) byGrade[g] = [];
      byGrade[g].push(cls);
    });

    const gradeParts: string[] = [];
    Object.keys(byGrade)
      .sort()
      .forEach((g) => {
        gradeParts.push(`Khối ${g} (${byGrade[g].join(', ')})`);
      });

    const homeroomSlot = activeSlots.find(
      (s) =>
        s.subject?.toLowerCase().includes('chào cờ') ||
        s.subject?.toLowerCase().includes('shl') ||
        s.subject?.toLowerCase().includes('sinh hoạt') ||
        s.notes?.toLowerCase().includes('chủ nhiệm')
    );
    const homeroomClass = homeroomSlot?.className || null;
    const gradesList = Object.keys(byGrade).sort().map((g) => `Khối ${g}`).join(', ');

    return {
      text: `Phụ trách Toán ${gradeParts.join(' & ')}${homeroomClass ? ` + Chủ nhiệm ${homeroomClass}` : ''}`,
      gradesText: gradesList || 'Toán',
      classesByGradeText: gradeParts.join(' & '),
      homeroomClass,
    };
  }, [distinctClasses, activeSlots]);

  // Helper styling for classes according to grade
  const getClassTheme = (className: string) => {
    const match = className.match(/\b(1[0-2]|[6-9])/);
    const g = match ? match[0] : className.replace(/\D/g, '')[0];
    if (g === '6') {
      return {
        bg: 'bg-amber-50/90',
        border: 'border-amber-300',
        hoverBorder: 'hover:border-amber-500',
        text: 'text-amber-950',
        activeBg: 'bg-amber-700',
        badge: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
      };
    }
    if (g === '7') {
      return {
        bg: 'bg-purple-50/90',
        border: 'border-purple-300',
        hoverBorder: 'hover:border-purple-500',
        text: 'text-purple-950',
        activeBg: 'bg-purple-700',
        badge: 'bg-purple-100 text-purple-900 border border-purple-300 font-bold',
      };
    }
    if (g === '8') {
      return {
        bg: 'bg-teal-50/90',
        border: 'border-teal-300',
        hoverBorder: 'hover:border-teal-500',
        text: 'text-teal-950',
        activeBg: 'bg-teal-700',
        badge: 'bg-teal-100 text-teal-900 border border-teal-300 font-bold',
      };
    }
    if (g === '9') {
      return {
        bg: 'bg-blue-50/90',
        border: 'border-blue-300',
        hoverBorder: 'hover:border-blue-500',
        text: 'text-blue-950',
        activeBg: 'bg-blue-700',
        badge: 'bg-blue-100 text-blue-900 border border-blue-300 font-bold',
      };
    }
    return {
      bg: 'bg-indigo-50/90',
      border: 'border-indigo-300',
      hoverBorder: 'hover:border-indigo-500',
      text: 'text-indigo-950',
      activeBg: 'bg-indigo-700',
      badge: 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold',
    };
  };

  // Filtered periods
  const filteredSchedule = useMemo(() => {
    if (selectedFilter === 'all') return weeklySchedule;
    if (['6', '7', '8', '9'].includes(selectedFilter)) {
      return weeklySchedule.filter((p) => p.grade === selectedFilter);
    }
    return weeklySchedule.filter((p) => p.className?.toUpperCase() === selectedFilter.toUpperCase());
  }, [weeklySchedule, selectedFilter]);

  // Today lessons
  const todayLessons = useMemo(() => {
    return getTodayLessons(weeklySchedule, todayDateStr);
  }, [weeklySchedule, todayDateStr]);

  // Week dates info (Monday to Saturday)
  const weekDays = useMemo(() => {
    if (currentConfig.weeklyAppliedDates?.[selectedWeek]) {
      return getWeekDates(currentConfig.weeklyAppliedDates[selectedWeek], 1);
    }
    return getWeekDates(effectiveStartDateWeek1, selectedWeek);
  }, [currentConfig.weeklyAppliedDates, effectiveStartDateWeek1, selectedWeek]);

  // Toggle lesson completed status
  const handleToggleCompleted = (className: string, tietPpctNumber: number) => {
    if (tietPpctNumber <= 0) return;
    const key = `${className}_tiet_${tietPpctNumber}`;
    const currentStatus = !!currentConfig.completedLessons?.[key];
    const updatedLessons = {
      ...(currentConfig.completedLessons || {}),
      [key]: !currentStatus,
    };

    onUpdateConfig({
      ...currentConfig,
      completedLessons: updatedLessons,
    });
  };

  // Reset to original timetable from the user's uploaded image
  const handleResetToSample = () => {
    const def = getDefaultTeacherTimetable();
    onUpdateConfig(def);
  };

  // Save edited teacher name
  const handleSaveTeacherName = () => {
    if (!tempTeacherName.trim()) return;
    onUpdateConfig({
      ...currentConfig,
      teacherName: tempTeacherName.trim(),
    });
    setIsEditingTeacher(false);
  };

  // Batch rename a class across timetable
  const handleExecuteBatchRename = () => {
    if (!batchOldClass || !batchNewClass.trim()) return;
    const trimmedNew = batchNewClass.trim().toUpperCase();
    const match = trimmedNew.match(/\b(1[0-2]|[6-9])|([6-9])/);
    const inferredGrade = match ? match[0] : '9';
    const defaultRoom = `Phòng ${trimmedNew}`;

    const updateSlotList = (slotList: TimetableSlot[]) => {
      return (slotList || []).map((s) => {
        if (s.className?.toUpperCase() === batchOldClass.toUpperCase()) {
          return {
            ...s,
            className: trimmedNew,
            grade: inferredGrade,
            room: !s.room || s.room === `Phòng ${s.className}` ? defaultRoom : s.room,
          };
        }
        return s;
      });
    };

    let updatedSlots = currentConfig.slots || [];
    const updatedWeeklySlots: Record<number, TimetableSlot[]> = { ...(currentConfig.weeklySlots || {}) };

    if (batchRenameScope === 'all') {
      updatedSlots = updateSlotList(currentConfig.slots || []);
      Object.keys(updatedWeeklySlots).forEach((w) => {
        const weekNum = Number(w);
        updatedWeeklySlots[weekNum] = updateSlotList(updatedWeeklySlots[weekNum]);
      });
    } else {
      const currentWeekSlots = getWeeklySlots(currentConfig, selectedWeek);
      updatedWeeklySlots[selectedWeek] = updateSlotList(currentWeekSlots);
    }

    const updatedCompleted: Record<string, boolean> = {};
    Object.entries(currentConfig.completedLessons || {}).forEach(([key, val]) => {
      const boolVal = Boolean(val);
      if (key.startsWith(`${batchOldClass}_tiet_`)) {
        const newKey = key.replace(`${batchOldClass}_tiet_`, `${trimmedNew}_tiet_`);
        updatedCompleted[newKey] = boolVal;
      } else {
        updatedCompleted[key] = boolVal;
      }
    });

    onUpdateConfig({
      ...currentConfig,
      slots: updatedSlots,
      weeklySlots: updatedWeeklySlots,
      completedLessons: updatedCompleted,
    });

    if (selectedFilter === batchOldClass) {
      setSelectedFilter(trimmedNew);
    }

    setIsBatchRenameModalOpen(false);
    setBatchNewClass('');
  };

  // Open Add Slot modal for a specific day and period
  const handleOpenAddSlot = (dayOfWeek: number, period: number) => {
    setNewSlotDay(dayOfWeek);
    setNewSlotPeriod(period);
    const defaultClass = distinctClasses[0] || '9A1';
    setNewSlotClass(defaultClass);
    setNewSlotSubject('Toán');
    setNewSlotRoom(`Phòng ${defaultClass}`);
    setNewSlotScope('all');
    setIsAddSlotModalOpen(true);
  };

  // Save newly added slot
  const handleSaveNewSlot = () => {
    if (!newSlotClass.trim()) return;
    const trimmedClass = newSlotClass.trim().toUpperCase();
    const match = trimmedClass.match(/\b(1[0-2]|[6-9])|([6-9])/);
    const inferredGrade = match ? match[0] : '9';

    const newSlot: TimetableSlot = {
      id: `slot-${Date.now()}`,
      dayOfWeek: newSlotDay,
      period: newSlotPeriod,
      session: 'sang',
      className: trimmedClass,
      grade: inferredGrade,
      subject: newSlotSubject.trim() || 'Toán',
      room: newSlotRoom.trim() || `Phòng ${trimmedClass}`,
    };

    if (newSlotScope === 'all') {
      const filtered = (currentConfig.slots || []).filter(
        (s) => !(s.dayOfWeek === newSlotDay && s.period === newSlotPeriod)
      );
      onUpdateConfig({
        ...currentConfig,
        slots: [...filtered, newSlot],
      });
    } else {
      const currentWeekSlots = getWeeklySlots(currentConfig, selectedWeek);
      const filtered = currentWeekSlots.filter(
        (s) => !(s.dayOfWeek === newSlotDay && s.period === newSlotPeriod)
      );
      onUpdateConfig({
        ...currentConfig,
        weeklySlots: {
          ...(currentConfig.weeklySlots || {}),
          [selectedWeek]: [...filtered, newSlot],
        },
      });
    }

    setIsAddSlotModalOpen(false);
  };

  // Open detail slot editor
  const handleStartEditDetailSlot = () => {
    if (!detailPeriod) return;
    setEditSlotClass(detailPeriod.className);
    setEditSlotSubject(detailPeriod.subject);
    setEditSlotRoom(detailPeriod.room || `Phòng ${detailPeriod.className}`);
    setEditSlotScope('all');
    setIsEditingDetailSlot(true);
  };

  // Save changes to detail slot
  const handleSaveDetailSlot = () => {
    if (!detailPeriod || !editSlotClass.trim()) return;
    const trimmedClass = editSlotClass.trim().toUpperCase();
    const match = trimmedClass.match(/\b(1[0-2]|[6-9])|([6-9])/);
    const inferredGrade = match ? match[0] : '9';

    const updateSlotItem = (s: TimetableSlot) => {
      if (s.id === detailPeriod.slotId || (s.dayOfWeek === detailPeriod.dayOfWeek && s.period === detailPeriod.period)) {
        return {
          ...s,
          className: trimmedClass,
          grade: inferredGrade,
          subject: editSlotSubject.trim() || 'Toán',
          room: editSlotRoom.trim() || `Phòng ${trimmedClass}`,
        };
      }
      return s;
    };

    if (editSlotScope === 'all') {
      const updatedSlots = (currentConfig.slots || []).map(updateSlotItem);
      const updatedWeekly: Record<number, TimetableSlot[]> = { ...(currentConfig.weeklySlots || {}) };
      Object.keys(updatedWeekly).forEach((w) => {
        const wNum = Number(w);
        updatedWeekly[wNum] = updatedWeekly[wNum].map(updateSlotItem);
      });
      onUpdateConfig({
        ...currentConfig,
        slots: updatedSlots,
        weeklySlots: updatedWeekly,
      });
    } else {
      const currentWeekSlots = getWeeklySlots(currentConfig, selectedWeek);
      const updated = currentWeekSlots.map(updateSlotItem);
      onUpdateConfig({
        ...currentConfig,
        weeklySlots: {
          ...(currentConfig.weeklySlots || {}),
          [selectedWeek]: updated,
        },
      });
    }

    setIsEditingDetailSlot(false);
    setDetailPeriod(null);
  };

  // Delete detail slot
  const handleDeleteDetailSlot = () => {
    if (!detailPeriod) return;
    const filterOut = (slotList: TimetableSlot[]) =>
      (slotList || []).filter(
        (s) => !(s.id === detailPeriod.slotId || (s.dayOfWeek === detailPeriod.dayOfWeek && s.period === detailPeriod.period))
      );

    if (editSlotScope === 'all') {
      const updatedSlots = filterOut(currentConfig.slots || []);
      const updatedWeekly: Record<number, TimetableSlot[]> = { ...(currentConfig.weeklySlots || {}) };
      Object.keys(updatedWeekly).forEach((w) => {
        const wNum = Number(w);
        updatedWeekly[wNum] = filterOut(updatedWeekly[wNum]);
      });
      onUpdateConfig({
        ...currentConfig,
        slots: updatedSlots,
        weeklySlots: updatedWeekly,
      });
    } else {
      const currentWeekSlots = getWeeklySlots(currentConfig, selectedWeek);
      const updated = filterOut(currentWeekSlots);
      onUpdateConfig({
        ...currentConfig,
        weeklySlots: {
          ...(currentConfig.weeklySlots || {}),
          [selectedWeek]: updated,
        },
      });
    }

    setIsEditingDetailSlot(false);
    setDetailPeriod(null);
  };

  // Build matrix lookup for period (1..5) and dayOfWeek (2..7)
  const scheduleMatrix = useMemo(() => {
    const matrix: Record<number, Record<number, WeeklyScheduledPeriod | null>> = {
      1: { 2: null, 3: null, 4: null, 5: null, 6: null, 7: null },
      2: { 2: null, 3: null, 4: null, 5: null, 6: null, 7: null },
      3: { 2: null, 3: null, 4: null, 5: null, 6: null, 7: null },
      4: { 2: null, 3: null, 4: null, 5: null, 6: null, 7: null },
      5: { 2: null, 3: null, 4: null, 5: null, 6: null, 7: null },
    };

    weeklySchedule.forEach((item) => {
      if (matrix[item.period] && matrix[item.period][item.dayOfWeek] !== undefined) {
        matrix[item.period][item.dayOfWeek] = item;
      }
    });

    return matrix;
  }, [weeklySchedule]);

  // Copy register to clipboard formatted as TSV for Excel/Word
  const handleCopyRegister = () => {
    let tsv = 'STT\tThứ, Ngày\tBuổi\tTiết TKB\tLớp\tTiết PPCT\tTên bài dạy / Nội dung công việc\tThiết bị / ĐDDH\tGhi chú\n';
    filteredSchedule.forEach((item, idx) => {
      const tietPpctStr = item.tietPpctNumber > 0 ? `Tiết ${item.tietPpctNumber}` : '—';
      tsv += `${idx + 1}\t${item.dayName} (${item.dateFormatted})\tSáng\tTiết ${item.period}\t${item.className}\t${tietPpctStr}\t${item.baiHoc}\t${item.thietBi || ''}\t${item.ghiChu || ''}\n`;
    });

    navigator.clipboard.writeText(tsv).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    });
  };

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Thời khóa biểu & Lịch báo giảng môn Toán
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Năm học 2026-2027 • Áp dụng 07-09-2026
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
              <span>Giáo viên:</span>
              {isEditingTeacher ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempTeacherName}
                    onChange={(e) => setTempTeacherName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTeacherName();
                      if (e.key === 'Escape') setIsEditingTeacher(false);
                    }}
                    placeholder="Nhập họ tên giáo viên..."
                    autoFocus
                    className="px-2 py-0.5 border border-emerald-500 rounded text-xs font-bold text-slate-900 bg-white shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={handleSaveTeacherName}
                    className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                    title="Lưu họ tên giáo viên"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingTeacher(false)}
                    className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                    title="Hủy"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 group">
                  <strong className="text-slate-900 font-bold bg-slate-100/80 px-1.5 py-0.5 rounded border border-slate-200/60">
                    {currentConfig.teacherName || 'Dương Văn Trong'}
                  </strong>
                  <button
                    type="button"
                    onClick={() => {
                      setTempTeacherName(currentConfig.teacherName || 'Dương Văn Trong');
                      setIsEditingTeacher(true);
                    }}
                    className="text-slate-400 hover:text-emerald-700 p-0.5 rounded transition-colors"
                    title="Bấm để sửa tên giáo viên (tự động đồng bộ toàn hệ thống)"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <span className="text-slate-300">•</span>
              <span className="text-slate-700 font-medium">
                {teachingSummary.text}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            title="Tải lên tệp PDF, Ảnh TKB hoặc nhấn Ctrl+V để dán ảnh màn hình"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-200" />
            <span>Nạp TKB (PDF / Ảnh / Ctrl+V)</span>
          </button>

          <button
            type="button"
            onClick={handleResetToSample}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            title="Khôi phục thời khóa biểu chuẩn theo ảnh mẫu đã tải lên"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Khôi phục mẫu ảnh</span>
          </button>

          {/* View Mode Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('tkb_sample')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'tkb_sample'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Cấu trúc TKB mẫu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('visual_schedule')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'visual_schedule'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Lịch báo giảng trực quan</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('official_register')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'official_register'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Sổ báo giảng in ấn</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Indicator & Week Navigation */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Real-time Today Status */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 relative" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Thời gian thực hôm nay:</span>
                <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {todayDateStr === '2026-09-08'
                    ? 'Thứ Ba, ngày 08/09/2026 (Đang ở Tuần 1)'
                    : `${todayDateStr}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {todayLessons.length > 0
                  ? `Hôm nay Thầy Trong có ${todayLessons.length} tiết giảng dạy (Lớp 7A4 & 9A5).`
                  : 'Hôm nay không có tiết dạy theo thời khóa biểu.'}
              </p>
            </div>
          </div>

          {/* Quick Target Navigation: Tuần hiện tại vs Tuần sắp tới */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedWeek(currentWeek > 0 ? currentWeek : 1)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedWeek === currentWeek
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Tuần hiện tại (Tuần {currentWeek})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedWeek(Math.min(35, (currentWeek > 0 ? currentWeek : 1) + 1))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedWeek === (currentWeek > 0 ? currentWeek : 1) + 1
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Tuần sắp tới (Tuần {Math.min(35, (currentWeek > 0 ? currentWeek : 1) + 1)})</span>
            </button>
          </div>
        </div>

        {/* Interactive Week Selector Bar (Tuần 1, Tuần 2, Tuần 3, ... 35) */}
        <div className="pt-3 border-t border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700">Chọn tuần xem:</span>
            
            {/* Quick buttons for early weeks */}
            {[1, 2, 3, 4, 5, 6].map((w) => {
              const hasCustom = hasCustomSlotsForWeek(currentConfig, w);
              const isCurrent = w === currentWeek;
              const isSelected = w === selectedWeek;

              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => setSelectedWeek(w)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all relative flex items-center gap-1 ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-400'
                  }`}
                >
                  <span>Tuần {w}</span>
                  {hasCustom && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-emerald-600'}`}
                      title="Có TKB riêng cho tuần này"
                    />
                  )}
                  {isCurrent && (
                    <span className="text-[9px] font-normal opacity-80">(Hiện tại)</span>
                  )}
                </button>
              );
            })}

            {/* Dropdown for all 35 weeks */}
            <div className="inline-flex items-center gap-1.5 ml-1">
              <span className="text-xs text-slate-400">hoặc</span>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => {
                  const hasCustom = hasCustomSlotsForWeek(currentConfig, w);
                  return (
                    <option key={w} value={w}>
                      Tuần {w} {w <= 18 ? '(HK1)' : '(HK2)'} {hasCustom ? '• [TKB riêng]' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Stepper controls */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))}
              disabled={selectedWeek <= 1}
              className="p-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-300 rounded-lg text-slate-700 transition-colors"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-xs font-bold text-slate-800">
                Tuần {selectedWeek}:{' '}
                <span className="text-emerald-800 font-semibold">
                  {weekDays[0]?.dateFormatted} - {weekDays[5]?.dateFormatted}
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedWeek((w) => Math.min(35, w + 1))}
              disabled={selectedWeek >= 35}
              className="p-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-300 rounded-lg text-slate-700 transition-colors"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Week Status & Synchronization Banner */}
        <div className="bg-white border border-emerald-200/90 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-800">
                <span>Đang hiển thị: TKB & Lịch báo giảng Tuần {selectedWeek}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  hasCustomSlotsForWeek(currentConfig, selectedWeek)
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {hasCustomSlotsForWeek(currentConfig, selectedWeek)
                    ? `✓ TKB riêng Tuần ${selectedWeek} (${activeSlots.length} tiết)`
                    : `TKB chuẩn áp dụng (${activeSlots.length} tiết/tuần)`}
                </span>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Đồng bộ PPCT: Tiết {(selectedWeek - 1) * 4 + 1} → {selectedWeek * 4}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Thời gian: <strong>{weekDays[0]?.dateFormatted}</strong> đến <strong>{weekDays[5]?.dateFormatted}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-200" />
            <span>Nạp/Sửa TKB Tuần {selectedWeek}</span>
          </button>
        </div>
      </div>

      {/* TODAY'S LESSONS HIGHLIGHT CARD */}
      {todayLessons.length > 0 && selectedWeek === currentWeek && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-2">
                <span>Nội dung giảng dạy hôm nay</span>
                <span className="text-xs font-normal normal-case text-emerald-800">
                  (Thứ Ba, 08/09/2026 • {todayLessons.length} tiết dạy)
                </span>
              </h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-white/80 px-2.5 py-1 rounded-full border border-emerald-200">
              Đồng bộ trực tiếp PPCT Tuần {selectedWeek}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {todayLessons.map((item) => (
              <div
                key={item.slotId}
                className="bg-white border border-emerald-200/80 rounded-xl p-3 shadow-xs flex flex-col justify-between gap-2 hover:border-emerald-400 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[10px] font-bold">
                      Tiết {item.period} (Sáng)
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.className === '7A4'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : 'bg-blue-100 text-blue-900 border border-blue-200'
                      }`}
                    >
                      {item.className}
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-emerald-900">
                    {item.tietPpctNumber > 0 ? `Tiết ${item.tietPpctNumber} PPCT` : item.subject}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                    {item.baiHoc}
                  </h4>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setDetailPeriod(item)}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    Xem chi tiết
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleCompleted(item.className, item.tietPpctNumber)}
                    className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 ${
                      item.completed
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 border-slate-200'
                    }`}
                  >
                    {item.completed ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Đã dạy</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3 h-3" />
                        <span>Chưa dạy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter by Grade / Class */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Lớp dạy:</span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedFilter === 'all'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Tất cả ({weeklySchedule.length} tiết)
          </button>

          {/* Danh sách các lớp thực tế có trong TKB */}
          {distinctClasses.map((cls) => {
            const count = weeklySchedule.filter((p) => p.className?.toUpperCase() === cls.toUpperCase()).length;
            const theme = getClassTheme(cls);
            const isSelected = selectedFilter.toUpperCase() === cls.toUpperCase();

            return (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedFilter(cls)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? `${theme.activeBg} text-white shadow-xs`
                    : `${theme.bg} ${theme.text} border ${theme.border} hover:opacity-90`
                }`}
              >
                Lớp {cls} ({count} tiết)
              </button>
            );
          })}

          {/* Nút công cụ đổi lớp hàng loạt */}
          {distinctClasses.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setBatchOldClass(distinctClasses[0] || '');
                setBatchNewClass('');
                setIsBatchRenameModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
              title="Đổi tên lớp hàng loạt trong TKB (ví dụ 7A4 sang 7A2)"
            >
              <Edit3 className="w-3 h-3 text-slate-500" />
              <span>Đổi lớp...</span>
            </button>
          )}
        </div>

        {viewMode === 'tkb_sample' && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-semibold flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showLessonDetailsInTkb}
                onChange={(e) => setShowLessonDetailsInTkb(e.target.checked)}
                className="w-3.5 h-3.5 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span>Hiển thị trực tiếp tên bài học & tiết PPCT trong ô TKB</span>
            </label>
          </div>
        )}

        {viewMode === 'official_register' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRegister}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
            >
              {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSuccess ? 'Đã sao chép!' : 'Sao chép bảng'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In sổ báo giảng</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 1: EXACT MATCH TO USER'S TIMETABLE IMAGE */}
      {/* THỜI KHÓA BIỂU TKB NĂM HỌC 2026-2027 ÁP DỤNG NGÀY 07-09-2026 */}
      {/* ========================================================================= */}
      {viewMode === 'tkb_sample' && (
        <div className="border-2 border-slate-800 rounded-xl overflow-hidden shadow-xs bg-white">
          {/* Main Title Banner matching image */}
          <div className="bg-slate-900 text-white text-center py-3 px-4 uppercase tracking-wide border-b-2 border-slate-800">
            <h3 className="text-sm sm:text-base font-extrabold">
              THỜI KHÓA BIỂU TKB NĂM HỌC 2026-2027 ÁP DỤNG NGÀY 07-09-2026
            </h3>
            <p className="text-[11px] text-slate-300 normal-case font-medium mt-0.5">
              Tự động xếp bài dạy theo PPCT Tuần {selectedWeek} ({weekDays[0]?.dateFormatted} - {weekDays[5]?.dateFormatted})
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse border border-slate-800 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-800">
                  <th className="py-2.5 px-3 border-r-2 border-slate-800 w-36">Giáo Viên</th>
                  <th className="py-2.5 px-2 border-r border-slate-800 w-16">Buổi</th>
                  <th className="py-2.5 px-2 border-r-2 border-slate-800 w-16">Tiết</th>
                  {weekDays.map((day) => {
                    const isToday = day.dateStr === todayDateStr;
                    return (
                      <th
                        key={day.dayOfWeek}
                        className={`py-2.5 px-3 border-r border-slate-800 min-w-[130px] transition-colors ${
                          isToday ? 'bg-emerald-100 text-emerald-950 font-extrabold' : ''
                        }`}
                      >
                        <div className="font-bold">{day.dayName}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{day.dateFormatted}</div>
                        {isToday && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-700 text-white">
                            HÔM NAY
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((periodNum, rowIndex) => (
                  <tr key={periodNum} className="border-b border-slate-800 hover:bg-slate-50/60 transition-colors">
                    {/* Column: Giáo Viên (Spanned across all 5 rows) */}
                    {rowIndex === 0 && (
                      <td
                        rowSpan={5}
                        className="py-4 px-3 font-bold text-slate-900 border-r-2 border-slate-800 bg-slate-50 align-middle text-center text-sm"
                      >
                        <div className="font-serif font-bold text-base tracking-wide">
                          {currentConfig.teacherName || 'Dương Văn Trong'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-sans font-normal mt-1">
                          Tổ Toán - Tin
                        </div>
                        {teachingSummary.classesByGradeText && (
                          <div className="text-[10px] text-emerald-800 font-sans font-semibold mt-1.5 bg-emerald-50 rounded-md px-1.5 py-1 border border-emerald-200 leading-tight">
                            {teachingSummary.classesByGradeText}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Column: Buổi (Spanned across all 5 rows) */}
                    {rowIndex === 0 && (
                      <td
                        rowSpan={5}
                        className="py-4 px-2 font-bold text-slate-900 border-r border-slate-800 bg-slate-50 align-middle text-center text-sm font-serif"
                      >
                        S
                      </td>
                    )}

                    {/* Column: Tiết (1 to 5) */}
                    <td className="py-2.5 px-2 font-bold text-slate-900 border-r-2 border-slate-800 bg-slate-100/50">
                      {periodNum}
                    </td>

                    {/* Columns: Thứ 2 -> Thứ 7 */}
                    {weekDays.map((day) => {
                      const item = scheduleMatrix[periodNum]?.[day.dayOfWeek];
                      const isToday = day.dateStr === todayDateStr;
                      const theme = item ? getClassTheme(item.className) : null;

                      return (
                        <td
                          key={day.dayOfWeek}
                          className={`py-2 px-2 border-r border-slate-800 align-middle transition-colors ${
                            isToday ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          {item && theme ? (
                            <div
                              onClick={() => setDetailPeriod(item)}
                              className={`p-2 rounded-lg border text-left cursor-pointer transition-all shadow-2xs ${theme.bg} ${theme.border} ${theme.hoverBorder} ${theme.text} ${
                                item.completed ? 'opacity-80 ring-1 ring-emerald-500' : ''
                              }`}
                            >
                              {/* Label formatted exactly as the sample image: 7A4-Chào cờ, 9A5-Toán, 7A4-SHL */}
                              <div className="flex items-center justify-between font-bold text-xs">
                                <span>
                                  {item.className}-{item.subject}
                                </span>
                                {item.tietPpctNumber > 0 && (
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1 rounded">
                                    T.{item.tietPpctNumber}
                                  </span>
                                )}
                              </div>

                              {/* Detailed lesson preview from PPCT if enabled */}
                              {showLessonDetailsInTkb && (
                                <div className="mt-1 pt-1 border-t border-slate-200/60">
                                  <p className="text-[11px] font-medium text-slate-800 line-clamp-2 leading-snug">
                                    {item.baiHoc}
                                  </p>
                                  {item.completed && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 mt-0.5">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> Đã dạy
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div
                              onClick={() => handleOpenAddSlot(day.dayOfWeek, periodNum)}
                              className="h-10 flex items-center justify-center text-slate-300 hover:text-emerald-700 hover:bg-emerald-50/60 rounded-lg cursor-pointer transition-colors group"
                              title={`Bấm để thêm tiết dạy vào Thứ ${day.dayOfWeek}, Tiết ${periodNum}`}
                            >
                              <span className="group-hover:hidden text-slate-300 text-xs font-light">—</span>
                              <span className="hidden group-hover:inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700">
                                <Plus className="w-3 h-3" /> Thêm
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: VISUAL SCHEDULE (LỊCH BÁO GIẢNG TRỰC QUAN THEO NGÀY) */}
      {/* ========================================================================= */}
      {viewMode === 'visual_schedule' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {weekDays.filter((d) => d.dayOfWeek <= 6).map((day) => {
              const dayLessons = filteredSchedule.filter((p) => p.dayOfWeek === day.dayOfWeek);
              const isToday = day.dateStr === todayDateStr;

              return (
                <div
                  key={day.dayOfWeek}
                  className={`rounded-2xl border transition-all flex flex-col ${
                    isToday
                      ? 'bg-gradient-to-b from-emerald-50/90 to-white border-emerald-400 shadow-md ring-2 ring-emerald-400/30'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  {/* Day Header */}
                  <div
                    className={`p-3 border-b rounded-t-2xl flex items-center justify-between ${
                      isToday
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wide">{day.dayName}</h4>
                      <p className={`text-[10px] ${isToday ? 'text-emerald-100' : 'text-slate-500'}`}>
                        {day.dateFormatted}
                      </p>
                    </div>
                    {isToday ? (
                      <span className="px-2 py-0.5 bg-white text-emerald-800 rounded-full text-[9px] font-bold">
                        Hôm nay
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-500">
                        {dayLessons.length} tiết
                      </span>
                    )}
                  </div>

                  {/* Lessons List for this Day */}
                  <div className="p-3 space-y-3 flex-1">
                    {dayLessons.length > 0 ? (
                      dayLessons.map((item) => (
                        <div
                          key={item.slotId}
                          onClick={() => setDetailPeriod(item)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all hover:shadow-sm space-y-1.5 ${
                            item.className === '7A4'
                              ? 'bg-purple-50/70 border-purple-200 hover:border-purple-400'
                              : 'bg-blue-50/70 border-blue-200 hover:border-blue-400'
                          } ${item.completed ? 'opacity-85' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="px-1.5 py-0.5 bg-slate-800 text-white rounded text-[10px] font-bold">
                              Tiết {item.period}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.className === '7A4'
                                  ? 'bg-purple-200 text-purple-900'
                                  : 'bg-blue-200 text-blue-900'
                              }`}
                            >
                              {item.className}
                            </span>
                            {item.tietPpctNumber > 0 && (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                                Tiết {item.tietPpctNumber} PPCT
                              </span>
                            )}
                          </div>

                          <h5 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug">
                            {item.baiHoc}
                          </h5>

                          {item.thietBi && (
                            <div className="text-[10px] text-slate-500 line-clamp-1">
                              <strong>ĐDDH:</strong> {item.thietBi}
                            </div>
                          )}

                          <div className="pt-1.5 flex items-center justify-between border-t border-slate-200/60">
                            <span className="text-[10px] text-slate-400">
                              {item.room || 'Phòng học'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCompleted(item.className, item.tietPpctNumber);
                              }}
                              className={`p-1 rounded text-[10px] font-bold flex items-center gap-1 ${
                                item.completed
                                  ? 'text-emerald-700 bg-emerald-100 px-1.5'
                                  : 'text-slate-400 hover:text-slate-700'
                              }`}
                            >
                              {item.completed ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                              <span>{item.completed ? 'Đã dạy' : 'Chưa dạy'}</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-xs">
                        <span>Không có tiết</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 3: OFFICIAL PRINTABLE REGISTER (SỔ BÁO GIẢNG CHUẨN IN ẤN) */}
      {/* ========================================================================= */}
      {viewMode === 'official_register' && (
        <div className="border border-slate-300 rounded-2xl p-6 bg-white shadow-xs space-y-5 print:border-none print:p-0">
          {/* Official Document Header */}
          <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold text-slate-700 uppercase">
              <span>{currentConfig.schoolName || 'TRƯỜNG THCS VÀ THPT PHÚ THÀNH'}</span>
              <span>TỔ CHUYÊN MÔN: TOÁN - TIN</span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold uppercase text-slate-900 pt-2 tracking-wide font-serif">
              KẾ HOẠCH BÁO GIẢNG TUẦN {selectedWeek}
            </h3>
            <p className="text-xs text-slate-600 font-medium italic">
              (Từ ngày {weekDays[0]?.dateFormatted} đến ngày {weekDays[5]?.dateFormatted}) • Học kỳ {selectedWeek <= 18 ? 'I' : 'II'}
            </p>
            <div className="text-xs font-bold text-slate-800 pt-1">
              Giáo viên giảng dạy: <u>{currentConfig.teacherName || 'Dương Văn Trong'}</u> • Môn: Toán ({teachingSummary.gradesText}){teachingSummary.homeroomClass ? ` & Chủ nhiệm ${teachingSummary.homeroomClass}` : ''}
            </div>
          </div>

          {/* Sổ báo giảng table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-800">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-800 text-[11px] text-center">
                  <th className="py-2.5 px-2 border border-slate-800 w-10">STT</th>
                  <th className="py-2.5 px-3 border border-slate-800 w-32">Thứ, Ngày</th>
                  <th className="py-2.5 px-2 border border-slate-800 w-20">Tiết TKB</th>
                  <th className="py-2.5 px-2 border border-slate-800 w-16">Lớp</th>
                  <th className="py-2.5 px-2 border border-slate-800 w-20">Tiết PPCT</th>
                  <th className="py-2.5 px-4 border border-slate-800 text-left">Tên bài dạy / Nội dung công việc</th>
                  <th className="py-2.5 px-3 border border-slate-800 w-44 text-left">Thiết bị dạy học / ĐDDH</th>
                  <th className="py-2.5 px-3 border border-slate-800 w-28">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedule.map((item, index) => {
                  const isToday = item.dateStr === todayDateStr;
                  const tietPpctText = item.tietPpctNumber > 0 ? `Tiết ${item.tietPpctNumber}` : '—';
                  const theme = getClassTheme(item.className);

                  return (
                    <tr
                      key={item.slotId}
                      className={`hover:bg-slate-50 transition-colors ${
                        isToday ? 'bg-emerald-50/50 font-medium' : ''
                      }`}
                    >
                      <td className="py-2 px-2 border border-slate-800 text-center font-bold text-slate-700">
                        {index + 1}
                      </td>
                      <td className="py-2 px-3 border border-slate-800 font-semibold text-slate-900">
                        {item.dayName} ({item.dateFormatted})
                        {isToday && (
                          <span className="ml-1 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded print:hidden">
                            Hôm nay
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 border border-slate-800 text-center font-bold">
                        Sáng - Tiết {item.period}
                      </td>
                      <td className="py-2 px-2 border border-slate-800 text-center font-bold">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${theme.badge}`}>
                          {item.className}
                        </span>
                      </td>
                      <td className="py-2 px-2 border border-slate-800 text-center font-bold text-emerald-900">
                        {tietPpctText}
                      </td>
                      <td className="py-2 px-4 border border-slate-800 font-bold text-slate-900">
                        <span
                          className="hover:text-emerald-800 cursor-pointer"
                          onClick={() => setDetailPeriod(item)}
                        >
                          {item.baiHoc}
                        </span>
                      </td>
                      <td className="py-2 px-3 border border-slate-800 text-[11px] text-slate-700">
                        {item.thietBi || 'Thước thẳng, bảng phụ'}
                      </td>
                      <td className="py-2 px-3 border border-slate-800 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCompleted(item.className, item.tietPpctNumber)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                            item.completed
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-emerald-50'
                          } print:border-none print:bg-transparent print:text-slate-800`}
                        >
                          {item.completed ? 'Đã thực hiện' : 'Chưa dạy'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signatures for submission */}
          <div className="pt-6 grid grid-cols-2 text-center text-xs font-bold text-slate-900 print:pt-12">
            <div>
              <p className="uppercase">TỔ TRƯỞNG CHUYÊN MÔN</p>
              <p className="text-[11px] text-slate-400 font-normal italic mt-1">(Ký và ghi rõ họ tên)</p>
            </div>
            <div>
              <p className="font-normal italic text-slate-600">
                Phú Thành, ngày {weekDays[0]?.dateFormatted}
              </p>
              <p className="uppercase font-bold mt-1">GIÁO VIÊN BÁO GIẢNG</p>
              <p className="text-[11px] text-slate-400 font-normal italic mt-1">(Ký và ghi rõ họ tên)</p>
              <p className="font-bold text-slate-900 mt-12">{currentConfig.teacherName || 'Dương Văn Trong'}</p>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL LESSON MODAL */}
      {detailPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-700 text-white rounded text-xs font-bold">
                  {detailPeriod.tietPpctNumber > 0 ? `Tiết ${detailPeriod.tietPpctNumber} PPCT` : detailPeriod.subject}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${getClassTheme(detailPeriod.className).badge}`}>
                  Lớp {detailPeriod.className}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartEditDetailSlot}
                  className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sửa tiết này</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDetailPeriod(null);
                    setIsEditingDetailSlot(false);
                  }}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Inline Slot Editor */}
            {isEditingDetailSlot ? (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-emerald-700" />
                  <span>Chỉnh sửa thông tin tiết dạy (đồng bộ ngay theo PPCT)</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Lớp học cụ thể:
                    </label>
                    <input
                      type="text"
                      value={editSlotClass}
                      onChange={(e) => setEditSlotClass(e.target.value.toUpperCase())}
                      placeholder="VD: 7A4, 9A4, 8A1..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                    />
                    {/* Quick select from existing classes */}
                    {distinctClasses.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {distinctClasses.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditSlotClass(c)}
                            className="px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-slate-300 hover:border-emerald-500 rounded text-slate-700"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Môn học / Tiết sinh hoạt:
                    </label>
                    <select
                      value={editSlotSubject}
                      onChange={(e) => setEditSlotSubject(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Toán">Toán</option>
                      <option value="Chào cờ">Chào cờ</option>
                      <option value="SHL">Sinh hoạt lớp (SHL)</option>
                      <option value="HĐTN">Hoạt động trải nghiệm (HĐTN)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Phòng học:
                    </label>
                    <input
                      type="text"
                      value={editSlotRoom}
                      onChange={(e) => setEditSlotRoom(e.target.value)}
                      placeholder="Phòng học..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Phạm vi áp dụng:
                    </label>
                    <select
                      value={editSlotScope}
                      onChange={(e) => setEditSlotScope(e.target.value as 'all' | 'current_week')}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="all">Tất cả các tuần trong năm</option>
                      <option value="current_week">Chỉ riêng Tuần {selectedWeek}</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-emerald-200/80">
                  <button
                    type="button"
                    onClick={handleDeleteDetailSlot}
                    className="flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 font-semibold px-2 py-1 rounded hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa tiết này</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingDetailSlot(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDetailSlot}
                      className="px-3 py-1.5 text-xs text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg font-bold shadow-2xs flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu & Đồng bộ</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {detailPeriod.dayName}, {detailPeriod.dateFormatted} • Sáng - Tiết {detailPeriod.period}
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {detailPeriod.baiHoc}
              </h3>
              <p className="text-xs text-slate-600">
                <strong>Chương / Chủ đề:</strong> {detailPeriod.chuong || 'Chưa cập nhật'}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1.5 text-slate-700">
              <div>
                <strong>Khối lớp:</strong> Khối {detailPeriod.grade} • Môn {detailPeriod.subject}
              </div>
              <div>
                <strong>Học kỳ:</strong> Học kỳ {detailPeriod.hocKy} • Tuần {selectedWeek} (PPCT Tuần {detailPeriod.tuanPpct})
              </div>
              <div>
                <strong>Thiết bị dạy học / ĐDDH:</strong> {detailPeriod.thietBi || 'Thước thẳng, compa, bảng phụ, máy chiếu'}
              </div>
              {detailPeriod.room && (
                <div>
                  <strong>Phòng học:</strong> {detailPeriod.room}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              {detailPeriod.tietPpctNumber > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    handleToggleCompleted(detailPeriod.className, detailPeriod.tietPpctNumber);
                    setDetailPeriod((prev) => (prev ? { ...prev, completed: !prev.completed } : null));
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    detailPeriod.completed
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{detailPeriod.completed ? 'Đã hoàn thành tiết dạy' : 'Đánh dấu đã dạy'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setDetailPeriod(null);
                  setIsEditingDetailSlot(false);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold ml-auto"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH RENAME MODAL */}
      {isBatchRenameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-900">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Đổi tên lớp hàng loạt</h3>
                  <p className="text-xs text-slate-500">Đồng bộ toàn bộ tiết dạy và tiến trình bài dạy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchRenameModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chọn lớp hiện tại cần đổi:
                </label>
                <select
                  value={batchOldClass}
                  onChange={(e) => setBatchOldClass(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                >
                  {distinctClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      Lớp {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đổi thành tên lớp mới:
                </label>
                <input
                  type="text"
                  value={batchNewClass}
                  onChange={(e) => setBatchNewClass(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: 7A2, 9A1, 8A3..."
                  autoFocus
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500 uppercase"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Hệ thống sẽ tự động nhận diện khối lớp từ tên lớp mới (VD: 7A2 → Khối 7).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phạm vi áp dụng:
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="batchScope"
                      checked={batchRenameScope === 'all'}
                      onChange={() => setBatchRenameScope('all')}
                      className="text-emerald-700"
                    />
                    <div>
                      <div className="font-bold text-slate-800">Tất cả các tuần (Tuần 1 - 35)</div>
                      <div className="text-[11px] text-slate-500">Đồng bộ toàn bộ TKB và bảng kế hoạch giáo dục</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="batchScope"
                      checked={batchRenameScope === 'current_week'}
                      onChange={() => setBatchRenameScope('current_week')}
                      className="text-emerald-700"
                    />
                    <div>
                      <div className="font-bold text-slate-800">Chỉ riêng Tuần {selectedWeek}</div>
                      <div className="text-[11px] text-slate-500">Các tuần khác giữ nguyên</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBatchRenameModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!batchNewClass.trim()}
                onClick={handleExecuteBatchRename}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-xs"
              >
                Xác nhận đổi lớp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SLOT MODAL */}
      {isAddSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Thêm tiết dạy mới</h3>
                  <p className="text-xs text-slate-500">Thứ {newSlotDay}, Tiết {newSlotPeriod} buổi Sáng</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSlotModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lớp học cụ thể:
                  </label>
                  <input
                    type="text"
                    value={newSlotClass}
                    onChange={(e) => setNewSlotClass(e.target.value.toUpperCase())}
                    placeholder="VD: 7A4, 9A4..."
                    autoFocus
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 uppercase focus:ring-1 focus:ring-emerald-500"
                  />
                  {distinctClasses.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {distinctClasses.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewSlotClass(c)}
                          className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 border border-slate-200 hover:border-emerald-500 rounded text-slate-700"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Môn học / Tiết:
                  </label>
                  <select
                    value={newSlotSubject}
                    onChange={(e) => setNewSlotSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Toán">Toán</option>
                    <option value="Chào cờ">Chào cờ</option>
                    <option value="SHL">Sinh hoạt lớp (SHL)</option>
                    <option value="HĐTN">Hoạt động trải nghiệm (HĐTN)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phòng học:
                  </label>
                  <input
                    type="text"
                    value={newSlotRoom}
                    onChange={(e) => setNewSlotRoom(e.target.value)}
                    placeholder="VD: Phòng 7A4..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phạm vi áp dụng:
                  </label>
                  <select
                    value={newSlotScope}
                    onChange={(e) => setNewSlotScope(e.target.value as 'all' | 'current_week')}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="all">Tất cả các tuần (1 - 35)</option>
                    <option value="current_week">Chỉ riêng Tuần {selectedWeek}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddSlotModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!newSlotClass.trim()}
                onClick={handleSaveNewSlot}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-xs"
              >
                Thêm tiết dạy & Đồng bộ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD & OCR MODAL */}
      <TimetableUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setPastedFilePayload(null);
        }}
        currentConfig={currentConfig}
        onSaveConfig={onUpdateConfig}
        targetWeek={selectedWeek}
        initialFile={pastedFilePayload}
      />
    </div>
  );
};
