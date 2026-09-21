import React, { useState, useMemo } from 'react';
import { PpctDataset, TimeframeConfig, ExamEvent, SgkBook } from '../types';
import { PpctSidebar } from './PpctSidebar';
import { TimeframeSidebar } from './TimeframeSidebar';
import { StatCards } from './StatCards';
import { ProgressCharts } from './ProgressCharts';
import { UpcomingExams } from './UpcomingExams';
import { ExamScheduleTable } from './ExamScheduleTable';
import { LessonPlanSection } from './lessonPlan/LessonPlanSection';
import { GradeSgkReferenceSection } from './GradeSgkReferenceSection';
import { WeeklyTimetableSection } from './timetable/WeeklyTimetableSection';
import { BookOpen, Layers, Upload, CheckCircle2 } from 'lucide-react';
import { TeacherTimetableConfig } from '../types';
import { getDefaultTeacherTimetable } from '../utils/timetableScheduler';

interface ProgressAndScheduleTabProps {
  datasets: PpctDataset[];
  activeDatasetId: string;
  activeDataset: PpctDataset;
  timeframeConfig: TimeframeConfig;
  currentWeek: number;
  term: 1 | 2;
  isBeforeTerm: boolean;
  exams: ExamEvent[];
  onSelectDataset: (id: string) => void;
  onAddDataset: (dataset: PpctDataset) => void;
  onDeleteDataset: (id: string) => void;
  onUpdateDatasetName: (id: string, newName: string) => void;
  onUpdateAcademicYear?: (id: string, newYear: string) => void;
  onUpdateTimeframeConfig: (updated: Partial<TimeframeConfig>) => void;
  onResetTimeframeConfig: () => void;
  onOpenManualEditor: () => void;
  onOpenFullPpct: () => void;
  onExportPpctExcel: () => void;
  onSelectExamForMatrix: (exam: ExamEvent) => void;
  onOpenUploadModal?: (grade?: string) => void;
  isRealTime?: boolean;
  onSyncRealTime?: () => void;
  onStandardizeDataset?: (id: string) => void;
  sgkBooks?: SgkBook[];
  onUpdateSgkBooks?: (books: SgkBook[]) => void;
  onLinkSgkToPpct?: (ppctId: string, volume1Id?: string, volume2Id?: string) => void;
  onApplySgkToMatrix?: (bookId: string, volume: 1 | 2 | 'all') => void;
  timetableConfig?: TeacherTimetableConfig;
  onUpdateTimetableConfig?: (newConfig: TeacherTimetableConfig) => void;
}

export const ProgressAndScheduleTab: React.FC<ProgressAndScheduleTabProps> = ({
  datasets,
  activeDatasetId,
  activeDataset,
  timeframeConfig,
  currentWeek,
  term,
  isBeforeTerm,
  exams,
  onSelectDataset,
  onAddDataset,
  onDeleteDataset,
  onUpdateDatasetName,
  onUpdateAcademicYear,
  onUpdateTimeframeConfig,
  onResetTimeframeConfig,
  onOpenManualEditor,
  onOpenFullPpct,
  onExportPpctExcel,
  onSelectExamForMatrix,
  onOpenUploadModal,
  isRealTime = true,
  onSyncRealTime,
  onStandardizeDataset,
  sgkBooks = [],
  onUpdateSgkBooks,
  onLinkSgkToPpct,
  onApplySgkToMatrix,
  timetableConfig: propTimetableConfig,
  onUpdateTimetableConfig: propOnUpdateTimetableConfig,
}) => {
  // Local fallback for timetableConfig if not provided by parent
  const [localTimetableConfig, setLocalTimetableConfig] = useState<TeacherTimetableConfig>(() => {
    return propTimetableConfig || getDefaultTeacherTimetable();
  });

  const timetableConfig = propTimetableConfig || localTimetableConfig;
  const onUpdateTimetableConfig = propOnUpdateTimetableConfig || setLocalTimetableConfig;

  // Khối được chọn hiện tại (Mặc định theo activeDataset.grade hoặc '9')
  const [activeGradeState, setActiveGradeState] = useState<string>(activeDataset?.grade || '9');

  // Đảm bảo đồng bộ khi activeDataset thay đổi từ bên ngoài
  React.useEffect(() => {
    if (activeDataset?.grade) {
      setActiveGradeState(activeDataset.grade);
    }
  }, [activeDataset?.id, activeDataset?.grade]);

  const currentGrade = activeGradeState || activeDataset?.grade || '9';

  // Lọc danh sách PPCT chỉ thuộc đúng khối đang chọn (Không hiển thị tất cả các khối khác)
  const gradeDatasets = useMemo(() => {
    return datasets.filter((d) => (d.grade || '9') === currentGrade);
  }, [datasets, currentGrade]);

  const handleSelectGrade = (g: string) => {
    setActiveGradeState(g);
    const found = datasets.find((d) => (d.grade || '9') === g);
    if (found) {
      onSelectDataset(found.id);
    }
  };

  const totalPeriods =
    activeDataset?.lessons?.reduce((sum, l) => sum + (l.soTiet || 1), 0) || activeDataset?.totalLessons || 140;
  const hk1Periods =
    activeDataset?.lessons?.filter((l) => l.hocKy === 1).reduce((sum, l) => sum + (l.soTiet || 1), 0) || 72;
  const hk2Periods =
    activeDataset?.lessons?.filter((l) => l.hocKy === 2).reduce((sum, l) => sum + (l.soTiet || 1), 0) || 68;
  const isPpctStandardMatch = totalPeriods === 140 && hk1Periods === 72 && hk2Periods === 68;

  return (
    <div className="space-y-6">
      {/* Grade Selector Bar: Chọn Khối độc quyền cho Tab Tiến trình */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Chọn Khối Lớp Làm Việc:
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Đang xem: Khối {currentGrade}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Khi chọn khối nào, hệ thống chỉ hiển thị PPCT, Sách giáo khoa và Kế hoạch bài dạy của đúng khối đó.
              </p>
            </div>
          </div>

          {/* 4 Grade Buttons */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            {['6', '7', '8', '9'].map((grade) => {
              const isSelected = currentGrade === grade;
              const hasPpct = datasets.some((d) => (d.grade || '9') === grade);
              const hasSgk = sgkBooks.some((b) => (b.grade || '9') === grade);

              return (
                <button
                  key={grade}
                  type="button"
                  onClick={() => handleSelectGrade(grade)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    isSelected
                      ? 'bg-white text-emerald-900 shadow-xs border border-slate-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>Khối {grade}</span>
                  {hasPpct && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-emerald-600' : 'bg-emerald-400'
                      }`}
                      title="Đã có PPCT"
                    />
                  )}
                  {hasSgk && (
                    <span
                      className={`text-[9px] px-1 rounded ${
                        isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                      title="Đã nạp SGK"
                    >
                      SGK
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* THỜI KHÓA BIỂU MÔN TOÁN & TỰ ĐỘNG XẾP TIẾT PPCT THEO THỜI GIAN THỰC */}
      <WeeklyTimetableSection
        currentConfig={timetableConfig}
        onUpdateConfig={onUpdateTimetableConfig}
        datasets={datasets}
        timeframeConfig={timeframeConfig}
        currentWeek={currentWeek}
        term={term}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sidebars (Chỉ hiển thị PPCT của khối đã chọn) */}
        <div className="lg:col-span-4 xl:col-span-3.5 space-y-6">
          <PpctSidebar
            datasets={gradeDatasets}
            activeDatasetId={activeDatasetId}
            onSelectDataset={onSelectDataset}
            onAddDataset={onAddDataset}
            onDeleteDataset={onDeleteDataset}
            onUpdateDatasetName={onUpdateDatasetName}
            onUpdateAcademicYear={onUpdateAcademicYear}
            onOpenManualEditor={onOpenManualEditor}
            onOpenFullPpct={onOpenFullPpct}
            onExportPpctExcel={onExportPpctExcel}
            onOpenUploadModal={onOpenUploadModal}
          />

          <TimeframeSidebar
            config={timeframeConfig}
            isRealTime={isRealTime}
            onSyncRealTime={onSyncRealTime}
            onChange={onUpdateTimeframeConfig}
            onReset={onResetTimeframeConfig}
          />
        </div>

        {/* Right Column: Dashboard Stats, SGK Reference, KHBD, Charts & Exam Schedules */}
        <div className="lg:col-span-8 xl:col-span-8.5 space-y-6">
          {/* Empty state prompt if no PPCT has been uploaded for this selected grade */}
          {gradeDatasets.length === 0 && (
            <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white rounded-2xl p-6 shadow-md border border-emerald-700 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2.5 py-1 bg-emerald-700/80 rounded-full text-xs font-semibold text-emerald-100 uppercase tracking-wider mb-2">
                    Khối {currentGrade} • Chuẩn GDPT 2018 (140 tiết / 35 tuần)
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    Chưa có file PPCT cho Khối {currentGrade}
                  </h3>
                  <p className="text-xs text-emerald-100 mt-1 max-w-xl">
                    Thầy/Cô vui lòng tải lên file PPCT môn Toán Khối {currentGrade} (.xlsx hoặc .docx) để theo dõi tiến độ, nạp KHBD và đồng bộ ma trận đề kiểm tra.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenUploadModal?.(currentGrade)}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-900 rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Upload className="w-4 h-4 text-emerald-700" />
                  <span>+ Tải lên PPCT Toán Khối {currentGrade}</span>
                </button>
              </div>
            </div>
          )}

          {/* PPCT Standard Status & Discrepancy Alert */}
          {activeDataset && (activeDataset.grade || '9') === currentGrade && (
            <div
              className={`rounded-xl border p-4 transition-all ${
                isPpctStandardMatch
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/80 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        isPpctStandardMatch ? 'bg-emerald-600' : 'bg-amber-600 animate-pulse'
                      }`}
                    />
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      Định mức chuẩn GDPT 2018 Toán Khối {currentGrade}: 140 tiết • 35 tuần (4 tiết/tuần)
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPpctStandardMatch
                          ? 'bg-emerald-200/70 text-emerald-800'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {isPpctStandardMatch ? 'Khớp chuẩn 100%' : 'Cần cân chỉnh'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      <strong>HK1:</strong> 18 tuần • 72 tiết (Tiết 1 – 72)
                    </span>
                    <span>•</span>
                    <span>
                      <strong>HK2:</strong> 17 tuần • 68 tiết (Tiết 73 – 140)
                    </span>
                    <span>•</span>
                    <span>
                      <strong>Hiện tại:</strong> Cả năm {totalPeriods} tiết (HK1: {hk1Periods}t, HK2: {hk2Periods}t)
                    </span>
                  </div>
                </div>

                {!isPpctStandardMatch && onStandardizeDataset && (
                  <button
                    type="button"
                    onClick={() => onStandardizeDataset(activeDataset.id)}
                    className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap shadow-xs hover:shadow flex-shrink-0"
                  >
                    Tự động cân chỉnh chuẩn 140 tiết (4 tiết/tuần)
                  </button>
                )}
              </div>
            </div>
          )}

          {activeDataset && (
            <>
              <StatCards
                ppct={activeDataset}
                config={timeframeConfig}
                currentWeek={currentWeek}
                term={term}
                isBeforeTerm={isBeforeTerm}
              />

              <ProgressCharts
                ppct={activeDataset}
                config={timeframeConfig}
                currentWeek={currentWeek}
                term={term}
                isBeforeTerm={isBeforeTerm}
              />
            </>
          )}

          {/* SÁCH GIÁO KHOA (SGK) KHỐI HIỆN TẠI: NGUỒN THAM KHẢO MA TRẬN & ĐỀ */}
          <GradeSgkReferenceSection
            selectedGrade={currentGrade}
            sgkBooks={sgkBooks}
            activePpct={activeDataset}
            onUpdateSgkBooks={onUpdateSgkBooks || (() => {})}
            onLinkSgkToPpct={onLinkSgkToPpct}
            onApplySgkToMatrix={onApplySgkToMatrix}
          />

          {/* KẾ HOẠCH BÀI DẠY (KHBD) KHỐI HIỆN TẠI (Chỉ hiển thị bài của khối này) */}
          <LessonPlanSection
            activeDataset={activeDataset}
            currentWeek={currentWeek}
          />

          <UpcomingExams
            exams={exams}
            onSelectExamForMatrix={onSelectExamForMatrix}
          />

          <ExamScheduleTable
            exams={exams}
            onSelectExamForMatrix={onSelectExamForMatrix}
          />
        </div>
      </div>
    </div>
  );
};

