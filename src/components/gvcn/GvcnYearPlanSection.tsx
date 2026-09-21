import React, { useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Plus,
  Target,
  Sparkles,
  Award,
  BookOpen,
  ChevronRight,
  TrendingUp,
  MapPin,
  Compass,
  RotateCcw,
  Check,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { GvcnMonthlyTask, GvcnClassInfo } from '../../types';
import {
  getGradeFromClassInfo,
  getPhuThoMonthlySuggestions,
  PhuThoSuggestionItem,
} from '../../data/gvcnPhuThoPlans';

interface GvcnYearPlanSectionProps {
  monthlyTasks: GvcnMonthlyTask[];
  classInfo: GvcnClassInfo;
  onToggleTask: (month: number, taskId: string) => void;
  onAddTask: (month: number, title: string, targetWeek: number) => void;
  onApplyGradePlan?: (grade: 6 | 7 | 8 | 9) => void;
}

export const GvcnYearPlanSection: React.FC<GvcnYearPlanSectionProps> = ({
  monthlyTasks,
  classInfo,
  onToggleTask,
  onAddTask,
  onApplyGradePlan,
}) => {
  const currentConfigGrade = getGradeFromClassInfo(classInfo);
  const [activeGradeView, setActiveGradeView] = useState<6 | 7 | 8 | 9>(currentConfigGrade);
  const [selectedMonth, setSelectedMonth] = useState<number>(9);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskWeek, setNewTaskWeek] = useState<number>(1);
  const [addedSuggestions, setAddedSuggestions] = useState<Record<string, boolean>>({});

  const activeMonthData = monthlyTasks.find((m) => m.month === selectedMonth) || monthlyTasks[0] || {
    month: 9,
    monthName: 'Tháng 9',
    theme: 'Chủ điểm tháng',
    tasks: [],
  };

  // Monthly suggestions for active month & grade
  const monthlySuggestions = getPhuThoMonthlySuggestions(activeGradeView, activeMonthData.month);

  // Overall statistics
  const totalAllTasks = monthlyTasks.reduce((s, m) => s + m.tasks.length, 0);
  const completedAllTasks = monthlyTasks.reduce(
    (s, m) => s + m.tasks.filter((t) => t.completed).length,
    0
  );
  const overallPercentage = Math.round((completedAllTasks / (totalAllTasks || 1)) * 100);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(selectedMonth, newTaskTitle.trim(), Number(newTaskWeek));
    setNewTaskTitle('');
  };

  const handleAddSuggestionToPlan = (sug: PhuThoSuggestionItem) => {
    onAddTask(activeMonthData.month, sug.title, sug.targetWeek);
    setAddedSuggestions((prev) => ({ ...prev, [sug.id]: true }));
  };

  const handleSwitchGrade = (grade: 6 | 7 | 8 | 9) => {
    setActiveGradeView(grade);
    if (onApplyGradePlan) {
      if (
        window.confirm(
          `Thầy/Cô có muốn cập nhật toàn bộ kế hoạch 9 tháng theo khung chương trình chuẩn Khối ${grade} (gắn liền chủ điểm Xã Phú Thọ, Đồng Tháp)?`
        )
      ) {
        onApplyGradePlan(grade);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Pedagogical & Local Insight Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-emerald-950 text-white p-5 rounded-2xl shadow-sm border border-amber-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-400/30 flex-shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Kế Hoạch Chủ Nhiệm 9 Tháng — Khối {activeGradeView} ({classInfo.className})
                </h3>
                <span className="px-2.5 py-0.5 text-[11px] bg-amber-400/20 text-amber-200 rounded-full font-bold border border-amber-400/30 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Xã Phú Thọ, Tỉnh Đồng Tháp
                </span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 rounded-full font-semibold border border-emerald-400/30">
                  Năm học {classInfo.academicYear}
                </span>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed max-w-3xl">
                Kế hoạch công tác chủ nhiệm được thiết kế đồng bộ theo cấu hình lớp <strong className="text-white">{classInfo.className}</strong> (Khối {activeGradeView}), tự động cập nhật và đề xuất nội dung phù hợp với các chủ điểm đặc trưng địa phương: <em>An toàn sông nước mùa lũ sông Tiền, bảo tồn sinh thái Vườn Quốc gia Tràm Chim, phong trào Đất Sen Hồng, đền ơn đáp nghĩa và phân luồng hướng nghiệp</em>.
              </p>
            </div>
          </div>

          {/* Quick grade selector buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-shrink-0 pt-2 lg:pt-0">
            <span className="text-[11px] text-amber-200/80 font-medium">Chọn khối kế hoạch:</span>
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              {([6, 7, 8, 9] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleSwitchGrade(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeGradeView === g
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Khối {g}
                </button>
              ))}
            </div>
            {onApplyGradePlan && (
              <button
                type="button"
                onClick={() => handleSwitchGrade(activeGradeView)}
                title="Tải lại toàn bộ kế hoạch chuẩn khối này"
                className="p-2 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded-xl border border-emerald-400/30 transition-all text-xs font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nạp chuẩn khối {activeGradeView}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Year Progress Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              Tiến độ hoàn thành kế hoạch công tác chủ nhiệm năm ({classInfo.className}):
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Đã hoàn thành <strong>{completedAllTasks}</strong> / {totalAllTasks} đầu việc trọng tâm ({overallPercentage}%)
            </div>
          </div>
        </div>

        <div className="w-full sm:w-64 flex items-center gap-3">
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
          <span className="text-xs font-black text-emerald-900 flex-shrink-0">
            {overallPercentage}%
          </span>
        </div>
      </div>

      {/* Month Tabs: Tháng 9 -> Tháng 5 */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {monthlyTasks.map((m) => {
          const isSelected = m.month === selectedMonth;
          const completedCount = m.tasks.filter((t) => t.completed).length;
          const isAllDone = completedCount === m.tasks.length && m.tasks.length > 0;

          return (
            <button
              key={m.month}
              onClick={() => setSelectedMonth(m.month)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{m.monthName}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isSelected
                    ? 'bg-emerald-700 text-white'
                    : isAllDone
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {completedCount}/{m.tasks.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Month Checklist Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Month Header Banner */}
        <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50/20 border-b border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kế hoạch trọng tâm {activeMonthData.monthName} • Khối {activeGradeView}</span>
              </span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                {activeMonthData.theme}
              </h3>
            </div>

            <div className="text-xs bg-white px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-900 font-bold shadow-2xs">
              Hoàn thành:{' '}
              {activeMonthData.tasks.filter((t) => t.completed).length} /{' '}
              {activeMonthData.tasks.length} nhiệm vụ
            </div>
          </div>
        </div>

        {/* Task list */}
        <div className="p-5 divide-y divide-slate-100 space-y-3">
          {activeMonthData.tasks.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs italic">
              Chưa có nhiệm vụ nào trong tháng này. Hãy nhập việc mới hoặc chọn từ mục gợi ý bên dưới.
            </div>
          ) : (
            activeMonthData.tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onToggleTask(activeMonthData.month, task.id)}
                className="pt-3 first:pt-0 flex items-start justify-between gap-3 cursor-pointer group hover:bg-slate-50/80 p-2 rounded-xl transition-colors"
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    className="mt-0.5 text-emerald-700 focus:outline-hidden flex-shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 group-hover:text-emerald-500" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div
                      className={`text-xs font-medium leading-relaxed ${
                        task.completed
                          ? 'line-through text-slate-400'
                          : 'text-slate-800 group-hover:text-emerald-950 font-semibold'
                      }`}
                    >
                      {task.title}
                    </div>

                    {task.note && (
                      <div className="text-[11px] text-slate-500 italic">
                        Ghi chú: {task.note}
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold flex-shrink-0 border border-slate-200">
                  Tuần {task.targetWeek}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Add custom task to active month */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <form onSubmit={handleCreateTask} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder={`Thêm công việc mới cho ${activeMonthData.monthName}...`}
              className="flex-1 text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />

            <div className="flex items-center gap-2">
              <select
                value={newTaskWeek}
                onChange={(e) => setNewTaskWeek(Number(e.target.value))}
                className="text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Tuần {w}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm việc</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* LOCAL SUGGESTIONS PANEL: ĐỀ XUẤT NỘI DUNG CHỦ NHIỆM THÁNG PHÙ HỢP CHỦ ĐIỂM ĐỊA PHƯƠNG (XÃ PHÚ THỌ, ĐỒNG THÁP) */}
      <div className="bg-gradient-to-br from-emerald-900/5 via-teal-900/5 to-cyan-900/5 border border-emerald-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>Gợi Ý & Đề Xuất Nội Dung Chủ Nhiệm {activeMonthData.monthName}</span>
                <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold rounded-md">
                  Xã Phú Thọ • Khối {activeGradeView}
                </span>
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Các nội dung sinh hoạt lớp và nhiệm vụ thực tế được đề xuất phù hợp với tình hình địa phương xã Phú Thọ. Thầy/Cô bấm <strong>"Thêm vào kế hoạch"</strong> để bổ sung ngay.
              </p>
            </div>
          </div>
        </div>

        {/* Suggestion cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {monthlySuggestions.map((sug) => {
            const isAdded = addedSuggestions[sug.id];
            return (
              <div
                key={sug.id}
                className="bg-white p-4 rounded-xl border border-emerald-100 hover:border-emerald-300 shadow-2xs flex flex-col justify-between space-y-3 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        sug.category === 'local'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : sug.category === 'study'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : sug.category === 'discipline'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {sug.categoryLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Dự kiến: Tuần {sug.targetWeek}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-800 leading-snug">
                    {sug.title}
                  </h5>

                  {sug.rationale && (
                    <p className="text-[11px] text-slate-500 leading-relaxed italic">
                      Lý do/Ý nghĩa: {sug.rationale}
                    </p>
                  )}

                  {sug.localHighlight && (
                    <div className="inline-flex items-center gap-1 text-[10px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200/60">
                      <MapPin className="w-2.5 h-2.5 text-amber-700" />
                      <span>{sug.localHighlight}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="button"
                    disabled={isAdded}
                    onClick={() => handleAddSuggestionToPlan(sug)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isAdded
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã thêm vào kế hoạch</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm vào kế hoạch</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
