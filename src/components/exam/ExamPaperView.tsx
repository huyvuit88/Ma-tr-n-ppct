import React, { useState } from 'react';
import {
  Printer,
  FileText,
  Download,
  Shuffle,
  Sliders,
  CheckCircle,
  HelpCircle,
  Award,
  ChevronDown,
  Edit3,
  RefreshCw,
  Plus,
  BookOpen,
  Eye,
  ListOrdered,
  FileCheck2,
  TableProperties,
  Code,
  Sigma,
  Sparkles,
  CheckSquare,
  Square,
  RotateCcw,
  Target,
  CheckCircle2,
  X,
  Calculator,
} from 'lucide-react';
import { ExamPaper, ExamQuestion, MatrixConfig, MatrixRow, SpecificationRow } from '../../types';
import { exportExamPaperToDocx } from '../../utils/examDocxExport';
import { LatexRenderer, formatPaperLatex } from '../../utils/latexUtils';
import { QuestionGuidanceTooltip } from './QuestionGuidanceTooltip';
import { detectMathDomain } from '../../utils/mathVariationSync';

interface ExamPaperViewProps {
  paper: ExamPaper;
  matrixConfig?: MatrixConfig;
  matrixRows?: MatrixRow[];
  specRows?: SpecificationRow[];
  onShuffleExam: (newCode: string) => void;
  onOpenConfig: () => void;
  onEditQuestion: (question: ExamQuestion) => void;
  onRegenerateEquivalent: (question: ExamQuestion) => void;
  onOpenSuggestions?: (question: ExamQuestion) => void;
  onRegenerateWholeExam?: () => void;
  onRegenerateMultipleQuestions?: (questionIds: string[]) => void;
  onRegenerateSection?: (section: 'part1_mcq' | 'part2_true_false' | 'part3_short_answer' | 'part4_essay') => void;
  onChangeQuestionLevel?: (questionId: string, newLevel: 'nhanBiet' | 'thongHieu' | 'vanDung' | 'vanDungCao') => void;
  onAddQuestionsSameLevel?: (referenceQuestion: ExamQuestion, count: number) => void;
  onAddQuestionsToSection?: (section: 'part1_mcq' | 'part2_true_false' | 'part3_short_answer' | 'part4_essay', level: 'nhanBiet' | 'thongHieu' | 'vanDung' | 'vanDungCao', count: number) => void;
  onNumericVariation?: (question: ExamQuestion) => void;
  onNumericVariationAll?: () => void;
}

export const ExamPaperView: React.FC<ExamPaperViewProps> = ({
  paper,
  matrixConfig,
  matrixRows,
  specRows,
  onShuffleExam,
  onOpenConfig,
  onEditQuestion,
  onRegenerateEquivalent,
  onOpenSuggestions,
  onRegenerateWholeExam,
  onRegenerateMultipleQuestions,
  onRegenerateSection,
  onChangeQuestionLevel,
  onAddQuestionsSameLevel,
  onAddQuestionsToSection,
  onNumericVariation,
  onNumericVariationAll,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'exam' | 'solutions' | 'matrix_alignment'>('exam');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showRawLatex, setShowRawLatex] = useState<boolean>(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [alwaysShowGuidance, setAlwaysShowGuidance] = useState<boolean>(false);
  const [addingSection, setAddingSection] = useState<'part1_mcq' | 'part2_true_false' | 'part3_short_answer' | 'part4_essay' | null>(null);
  const [sectionAddLevel, setSectionAddLevel] = useState<'nhanBiet' | 'thongHieu' | 'vanDung' | 'vanDungCao'>('nhanBiet');
  const [sectionAddCount, setSectionAddCount] = useState<number>(1);
  const [activeLevelMenuId, setActiveLevelMenuId] = useState<string | null>(null);

  // Đảm bảo toàn bộ câu hỏi và đáp án được chuẩn hóa cú pháp LaTeX
  const formattedPaper = React.useMemo(() => formatPaperLatex(paper), [paper]);
  const cfg = formattedPaper.config;

  const toggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllQuestions = () => {
    if (selectedQuestionIds.size === formattedPaper.questions.length) {
      setSelectedQuestionIds(new Set());
    } else {
      setSelectedQuestionIds(new Set(formattedPaper.questions.map((q) => q.id)));
    }
  };

  const handleExportDocx = async (mode: 'exam_only' | 'solutions_only' | 'full_package') => {
    try {
      setIsExporting(true);
      await exportExamPaperToDocx(formattedPaper, mode, matrixConfig, matrixRows, specRows);
    } catch (err) {
      console.error('Docx export failed:', err);
      alert('Không thể tạo file Word. Xin vui lòng thử lại.');
    } finally {
      setIsExporting(false);
      setIsExportMenuOpen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const p1 = formattedPaper.questions.filter((q) => q.section === 'part1_mcq');
  const p2 = formattedPaper.questions.filter((q) => q.section === 'part2_true_false');
  const p3 = formattedPaper.questions.filter((q) => q.section === 'part3_short_answer');
  const p4 = formattedPaper.questions.filter((q) => q.section === 'part4_essay');

  const summary = formattedPaper.matrixAlignmentSummary;

  const renderSectionAddControl = (
    section: 'part1_mcq' | 'part2_true_false' | 'part3_short_answer' | 'part4_essay',
    sectionTitle: string
  ) => {
    if (!onAddQuestionsToSection || addingSection !== section) return null;

    const levelOptions: { key: 'nhanBiet' | 'thongHieu' | 'vanDung' | 'vanDungCao'; label: string }[] = [
      { key: 'nhanBiet', label: 'Nhận biết' },
      { key: 'thongHieu', label: 'Thông hiểu' },
      { key: 'vanDung', label: 'Vận dụng' },
      { key: 'vanDungCao', label: 'Vận dụng cao' },
    ];

    return (
      <div className="p-3.5 bg-gradient-to-r from-indigo-50/90 via-emerald-50/70 to-indigo-50/90 border border-indigo-200 rounded-xl mb-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150 font-sans print:hidden shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
            <Plus size={15} className="text-indigo-600 shrink-0" />
            <span>Thêm câu hỏi mới vào {sectionTitle}:</span>
          </div>
          <button
            type="button"
            onClick={() => setAddingSection(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-white/80 cursor-pointer"
            title="Đóng bảng thêm câu"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Mức độ nhận thức:</span>
            <div className="flex gap-1">
              {levelOptions.map((lvl) => (
                <button
                  key={lvl.key}
                  type="button"
                  onClick={() => setSectionAddLevel(lvl.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    sectionAddLevel === lvl.key
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-1 ring-indigo-300'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Số lượng:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 5].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setSectionAddCount(cnt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    sectionAddCount === cnt
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  +{cnt} câu
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onAddQuestionsToSection(section, sectionAddLevel, sectionAddCount);
              setAddingSection(null);
            }}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer sm:ml-auto flex items-center gap-1"
          >
            <Plus size={13} />
            <span>Thêm {sectionAddCount} câu vào đề</span>
          </button>
        </div>
      </div>
    );
  };

  const renderQuestionLevelAndAddButtons = (q: ExamQuestion) => {
    return (
      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
        {/* Tùy chỉnh thủ công mức độ nhận thức */}
        {onChangeQuestionLevel ? (
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setActiveLevelMenuId(activeLevelMenuId === q.id ? null : q.id)}
              className="text-[10px] font-bold text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-300 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Nhấp để tùy chỉnh thủ công mức độ nhận thức của câu này"
            >
              <Sliders size={11} className="text-indigo-600" />
              <span>{q.cognitiveLevelLabel || q.cognitiveLevel}</span>
              <ChevronDown size={10} className="text-slate-400" />
            </button>

            {activeLevelMenuId === q.id && (
              <div className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Tùy chỉnh thủ công mức độ:
                </div>
                {[
                  { key: 'nhanBiet', label: 'Nhận biết', color: 'text-emerald-700 hover:bg-emerald-50' },
                  { key: 'thongHieu', label: 'Thông hiểu', color: 'text-blue-700 hover:bg-blue-50' },
                  { key: 'vanDung', label: 'Vận dụng', color: 'text-amber-800 hover:bg-amber-50' },
                  { key: 'vanDungCao', label: 'Vận dụng cao', color: 'text-purple-700 hover:bg-purple-50' },
                ].map((lvl) => (
                  <button
                    key={lvl.key}
                    type="button"
                    onClick={() => {
                      onChangeQuestionLevel(q.id, lvl.key as any);
                      setActiveLevelMenuId(null);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-bold flex items-center justify-between ${lvl.color} transition-colors cursor-pointer`}
                  >
                    <span>{lvl.label}</span>
                    {q.cognitiveLevel === lvl.key && <CheckCircle2 size={13} className="text-indigo-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100/90 px-2 py-0.5 rounded">
            {q.cognitiveLevelLabel} ({q.score}đ)
          </span>
        )}

        {/* Nút Thêm câu cùng mức độ */}
        {onAddQuestionsSameLevel && (
          <button
            type="button"
            onClick={() => onAddQuestionsSameLevel(q, 1)}
            className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
            title={`Thêm 1 câu hỏi cùng mức độ (${q.cognitiveLevelLabel}) vào đề thi`}
          >
            <Plus size={11} className="text-emerald-700" />
            <span>+ Thêm cùng mức</span>
          </button>
        )}

        {onOpenSuggestions && (
          <button
            type="button"
            onClick={() => onOpenSuggestions(q)}
            className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
            title="Tùy chọn câu khác từ ngân hàng chuẩn (kèm đổi đáp án tự động)"
          >
            <Sparkles size={11} className="text-emerald-600" />
            <span>Đổi câu & đáp án</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('exam')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeSubTab === 'exam'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={15} />
            Đề thi học sinh
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('solutions')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeSubTab === 'solutions'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 size={15} />
            Đáp án & Barem chấm
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('matrix_alignment')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeSubTab === 'matrix_alignment'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableProperties size={15} />
            Đối chiếu Ma trận & YCCĐ
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          {/* Mã đề selector & Shuffle */}
          <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl p-0.5">
            <span className="px-2.5 text-xs font-bold text-slate-600">Mã:</span>
            {['101', '102', '103', '104'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onShuffleExam(code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  cfg.examCode === code
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {code}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                const randomCode = (Math.floor(Math.random() * 800) + 101).toString();
                onShuffleExam(randomCode);
              }}
              title="Xáo trộn câu hỏi và tạo mã đề ngẫu nhiên mới"
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-200 rounded-lg transition-colors ml-0.5"
            >
              <Shuffle size={14} />
            </button>
          </div>

          {/* Config Button */}
          <button
            type="button"
            onClick={onOpenConfig}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors"
          >
            <Sliders size={14} />
            Cấu hình đề
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <Download size={14} />
              {isExporting ? 'Đang xuất Word...' : 'Tải file Word'}
              <ChevronDown size={14} />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-xs animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => handleExportDocx('exam_only')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 font-medium text-slate-700 flex items-center gap-2"
                >
                  <FileText size={14} className="text-indigo-600" />
                  Đề thi học sinh (.docx)
                </button>
                <button
                  type="button"
                  onClick={() => handleExportDocx('solutions_only')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 font-medium text-slate-700 flex items-center gap-2"
                >
                  <FileCheck2 size={14} className="text-emerald-600" />
                  Đáp án & Barem (.docx)
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  type="button"
                  onClick={() => handleExportDocx('full_package')}
                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 font-bold text-indigo-700 flex items-center gap-2"
                >
                  <Download size={14} className="text-indigo-600" />
                  Trọn bộ: Đề + Đáp án + Ma trận & Đặc tả (.docx)
                </button>
              </div>
            )}
          </div>

          {/* LaTeX / MathType Mode Toggle */}
          <button
            type="button"
            onClick={() => setShowRawLatex(!showRawLatex)}
            title={showRawLatex ? "Hiển thị công thức toán học KaTeX trực quan" : "Xem mã nguồn LaTeX ($...) để sao chép vào MathType"}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              showRawLatex
                ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Code size={14} />
            {showRawLatex ? 'Mã LaTeX ($)' : 'LaTeX & MathType'}
          </button>

          {/* Toggle Ghim / Rê chuột Chỉ dẫn YCCĐ & Chủ đề */}
          <button
            type="button"
            onClick={() => setAlwaysShowGuidance(!alwaysShowGuidance)}
            title={
              alwaysShowGuidance
                ? "Chuyển về chế độ rê chuột vào câu để hiện bảng chỉ dẫn YCCĐ & Chủ đề"
                : "Luôn ghim bảng chỉ dẫn YCCĐ & Chủ đề cho tất cả các câu trong đề"
            }
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              alwaysShowGuidance
                ? 'bg-amber-100 text-amber-950 border-amber-300 font-bold shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
            }`}
          >
            <Target size={14} className={alwaysShowGuidance ? 'text-amber-700' : 'text-emerald-600'} />
            <span>{alwaysShowGuidance ? 'Đang ghim YCCĐ' : 'Chỉ dẫn YCCĐ (Rê chuột)'}</span>
          </button>

          {/* Print Preview Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors"
          >
            <Printer size={14} />
            In ấn (A4)
          </button>

          {/* Đổi toàn bộ đề & đáp án */}
          {onRegenerateWholeExam && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn tạo mới toàn bộ câu hỏi và tự động cập nhật toàn bộ đáp án cho đề thi này theo Ma trận hiện hành?')) {
                  onRegenerateWholeExam();
                  setSelectedQuestionIds(new Set());
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="Tạo lại tất cả các câu hỏi trong đề từ ngân hàng chuẩn và tự động đổi toàn bộ đáp án tương ứng"
            >
              <RefreshCw size={14} className="text-emerald-600" />
              <span>Đổi toàn bộ đề & đáp án</span>
            </button>
          )}

          {/* Đổi số liệu toàn bộ đề thi và đồng bộ đáp án tự động */}
          {onNumericVariationAll && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bạn có muốn đổi số liệu toán học toàn bộ các câu trong đề và tự động tính toán lại đáp án/hướng dẫn chấm tương ứng?')) {
                  onNumericVariationAll();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="Đổi các hệ số, kích thước hình học, số liệu thống kê sang bộ số đẹp mới và tự động cập nhật đáp án"
            >
              <Calculator size={14} className="text-indigo-600" />
              <span>Đổi số liệu toàn đề (Đồng bộ đáp án)</span>
            </button>
          )}

          {/* Chọn tất cả câu hỏi */}
          <button
            type="button"
            onClick={selectAllQuestions}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Chọn hoặc bỏ chọn tất cả câu hỏi trong đề"
          >
            {selectedQuestionIds.size === formattedPaper.questions.length ? (
              <>
                <CheckSquare size={14} className="text-indigo-600" />
                <span>Bỏ chọn ({selectedQuestionIds.size})</span>
              </>
            ) : (
              <>
                <Square size={14} className="text-slate-400" />
                <span>Chọn tất cả ({formattedPaper.questions.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* LaTeX & MathType Info Notice */}
      <div className="bg-linear-to-r from-indigo-50/90 via-blue-50/70 to-emerald-50/60 border border-indigo-200/80 rounded-2xl p-3.5 px-4 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-700 font-sans shadow-2xs print:hidden">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
            ∑
          </span>
          <div>
            <span className="font-bold text-indigo-900">Chuẩn hóa LaTeX / MathType 100%: </span>
            <span className="text-slate-600">
              Tất cả các công thức toán trong đề đã được đóng gói chuẩn mã LaTeX (<code className="font-mono bg-white px-1 py-0.5 rounded border border-indigo-200">$...$</code>).
              Khi tải file Word, Thầy/Cô mở trong Word và nhấn phím tắt <kbd className="bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[11px] font-bold text-indigo-800 shadow-2xs">Alt + \</kbd> (hoặc qua menu MathType &gt; Toggle TeX) để chuyển thành công thức MathType tương tác.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowRawLatex(!showRawLatex)}
          className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline shrink-0 cursor-pointer"
        >
          {showRawLatex ? 'Xem dạng công thức trực quan' : 'Xem mã nguồn LaTeX ($)'}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: ĐỀ THI HỌC SINH (CHUẨN FORM GIẤY THI) */}
      {/* ========================================================================= */}
      {activeSubTab === 'exam' && (
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200 max-w-4xl mx-auto font-serif text-slate-900 print:shadow-none print:border-none print:p-0">
          {/* Header 2 Columns */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-300 text-center font-sans">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-800">
                {cfg.schoolName}
              </div>
              <div className="text-xs font-semibold text-slate-700">
                {cfg.department}
              </div>
              <div className="mt-2 inline-block px-3 py-1 bg-slate-100 rounded-md border border-slate-300 text-xs font-bold text-slate-900">
                MÃ ĐỀ: {cfg.examCode}
              </div>
              <div className="text-[10px] text-slate-500 italic mt-0.5">
                (Đề thi gồm {paper.questions.length} câu)
              </div>
            </div>

            <div>
              <div className="text-sm font-bold uppercase text-slate-900">
                {cfg.title}
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                MÔN: {cfg.subject.toUpperCase()} — KHỐI {cfg.grade}
              </div>
              <div className="text-[11px] font-medium text-slate-600">
                Năm học: {cfg.academicYear}
              </div>
              <div className="text-[11px] text-slate-600 italic mt-0.5">
                Thời gian làm bài: {cfg.durationMinutes} phút (không kể thời gian phát đề)
              </div>
            </div>
          </div>

          {/* Bảng ghi tên lớp và điểm (Không cần nhận xét của giáo viên theo yêu cầu) */}
          <div className="my-6 grid grid-cols-1 md:grid-cols-3 border-2 border-slate-700 font-sans text-xs">
            <div className="md:col-span-2 p-3 space-y-2.5 border-b md:border-b-0 md:border-r border-slate-700">
              <div className="flex items-center">
                <span className="font-bold text-slate-800 w-36">Họ và tên học sinh:</span>
                <span className="flex-1 border-b border-dotted border-slate-500"></span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <span className="font-bold text-slate-800 w-12">Lớp:</span>
                  <span className="flex-1 border-b border-dotted border-slate-500"></span>
                </div>
                <div className="flex items-center">
                  <span className="font-bold text-slate-800 w-28">Số báo danh:</span>
                  <span className="flex-1 border-b border-dotted border-slate-500"></span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <span className="font-medium text-slate-600 w-20">Phòng thi:</span>
                  <span className="flex-1 border-b border-dotted border-slate-400"></span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-slate-600 w-28">Giám thị coi thi:</span>
                  <span className="flex-1 border-b border-dotted border-slate-400"></span>
                </div>
              </div>
            </div>

            <div className="p-3 text-center flex flex-col justify-between bg-slate-50/60">
              <div className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5">
                ĐIỂM SỐ
              </div>
              <div className="py-2.5 text-slate-600 italic text-[11px]">
                (Bằng số: ............ / Bằng chữ: ....................)
              </div>
              <div className="text-[10px] text-slate-500 border-t border-dotted border-slate-300 pt-1.5">
                Chữ ký giám khảo chấm thi
              </div>
            </div>
          </div>

          {/* Bảng phiếu trả lời nhanh cho trắc nghiệm */}
          {p1.length > 0 && (
            <div className="my-6 p-3 bg-slate-50 border border-slate-300 rounded-lg font-sans">
              <div className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                Phiếu trả lời nhanh Phần I (Tô tròn đáp án đúng):
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 text-center text-xs">
                {p1.map((_, idx) => (
                  <div key={idx} className="border border-slate-300 rounded p-1 bg-white">
                    <div className="font-bold text-[10px] text-slate-500">C{idx + 1}</div>
                    <div className="flex justify-center gap-0.5 text-[9px] font-bold text-slate-400 mt-0.5">
                      <span>A</span>
                      <span>B</span>
                      <span>C</span>
                      <span>D</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUESTIONS CONTAINER */}
          <div className="space-y-8 text-sm leading-relaxed">
            {/* PHẦN I */}
            {p1.length > 0 && (
              <div className="space-y-4">
                <div className="bg-slate-100 p-3 rounded-xl font-sans flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN (
                      {(p1.length * (p1[0].score || 0.25)).toFixed(2)} điểm)
                    </h4>
                    <p className="text-xs text-slate-600 italic">
                      Thí sinh trả lời từ câu 1 đến câu {p1.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án đúng nhất.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {onAddQuestionsToSection && (
                      <button
                        type="button"
                        onClick={() => setAddingSection(addingSection === 'part1_mcq' ? null : 'part1_mcq')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        title="Thêm các câu hỏi cùng mức độ vào Phần I"
                      >
                        <Plus size={13} className="text-indigo-600" />
                        <span>+ Thêm câu cùng mức độ</span>
                      </button>
                    )}
                    {onRegenerateSection && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Đổi mới tất cả câu hỏi trong Phần I và tự động cập nhật toàn bộ đáp án tương ứng?')) {
                            onRegenerateSection('part1_mcq');
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        title="Đổi toàn bộ câu hỏi Phần I và tự động cập nhật đáp án của Phần I"
                      >
                        <RefreshCw size={12} className="text-emerald-600" />
                        <span>Đổi cả Phần I</span>
                      </button>
                    )}
                  </div>
                </div>

                {renderSectionAddControl('part1_mcq', 'Phần I (Trắc nghiệm nhiều phương án)')}

                <div className="space-y-3 pl-1">
                  {p1.map((q, idx) => (
                    <div
                      key={q.id}
                      className={`group relative p-3 rounded-xl transition-all border ${
                        selectedQuestionIds.has(q.id)
                          ? 'bg-indigo-50/40 border-indigo-300 shadow-xs ring-1 ring-indigo-200'
                          : 'border-transparent hover:border-slate-200 hover:bg-slate-50/90'
                      }`}
                    >
                      {/* Action buttons on top right */}
                      <div className="absolute right-2 top-2 flex items-center gap-1.5 font-sans z-10">
                        <QuestionGuidanceTooltip
                          question={q}
                          questionIndex={idx + 1}
                          onRegenerateEquivalent={onRegenerateEquivalent}
                          onOpenSuggestions={onOpenSuggestions}
                          onEditQuestion={onEditQuestion}
                          onChangeCognitiveLevel={onChangeQuestionLevel}
                          onAddSameLevelQuestion={onAddQuestionsSameLevel}
                          showRawLatex={showRawLatex}
                        />
                        <div className="hidden group-hover:flex items-center gap-1">
                          {onAddQuestionsSameLevel && (
                            <button
                              type="button"
                              onClick={() => onAddQuestionsSameLevel(q, 1)}
                              title={`Thêm 1 câu hỏi cùng mức độ (${q.cognitiveLevelLabel}) vào đề`}
                              className="p-1 text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 rounded border border-emerald-300 shadow-2xs cursor-pointer"
                            >
                              <Plus size={12} />
                            </button>
                          )}
                          {onOpenSuggestions && (
                            <button
                              type="button"
                              onClick={() => onOpenSuggestions(q)}
                              title="Chọn câu khác từ Ngân hàng gợi ý (kèm đổi đáp án)"
                              className="p-1 text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 rounded border border-emerald-200 shadow-2xs cursor-pointer"
                            >
                              <Sparkles size={12} />
                            </button>
                          )}
                          {onNumericVariation && (
                            <button
                              type="button"
                              onClick={() => onNumericVariation(q)}
                              title="Đổi số liệu toán học câu này (Tự động tính & đồng bộ đáp án)"
                              className="p-1 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded border border-amber-300 shadow-2xs cursor-pointer"
                            >
                              <Calculator size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onRegenerateEquivalent(q)}
                            title="Đổi câu tương đương (tự động cập nhật đáp án)"
                            className="p-1 text-slate-500 hover:text-indigo-600 bg-white rounded border border-slate-200 shadow-2xs cursor-pointer"
                          >
                            <RefreshCw size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditQuestion(q)}
                            title="Sửa nội dung câu và đáp án thủ công"
                            className="p-1 text-slate-500 hover:text-indigo-600 bg-white rounded border border-slate-200 shadow-2xs cursor-pointer"
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedQuestionIds.has(q.id)}
                          onChange={() => toggleSelectQuestion(q.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-1 shrink-0 print:hidden"
                          title="Chọn câu này để đổi hoặc thao tác"
                        />
                        <div className="flex-1 pr-28">
                          <div className="font-medium text-slate-900">
                            {(() => {
                              const d = detectMathDomain(q.prompt, q.chapter, q.lesson);
                              const bCls =
                                d.domain === 'geometry'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : d.domain === 'statistics_probability'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-sky-50 text-sky-700 border-sky-200';
                              return (
                                <span
                                  className={`inline-block mr-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold border print:hidden ${bCls}`}
                                  title={`Phân môn: ${d.domainLabel}`}
                                >
                                  {d.domainLabel}
                                </span>
                              );
                            })()}
                            <span className="font-bold">Câu {idx + 1}: </span>
                            <LatexRenderer text={q.prompt} showRawLatex={showRawLatex} />
                          </div>

                          {q.options && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-1 pl-2">
                              {q.options.map((opt) => (
                                <div key={opt.key} className="flex items-baseline gap-1.5">
                                  <span className="font-bold">{opt.key}.</span>
                                  <LatexRenderer text={opt.text} showRawLatex={showRawLatex} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bảng chỉ dẫn Yêu cầu cần đạt & Chủ đề khi chuột để vào câu này */}
                      <div
                        className={`${
                          alwaysShowGuidance ? 'flex' : 'hidden group-hover:flex'
                        } flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-3 pt-2.5 border-t border-indigo-100/90 bg-gradient-to-r from-amber-50/90 via-indigo-50/70 to-emerald-50/80 p-2.5 rounded-xl text-xs font-sans print:hidden animate-in fade-in duration-150 shadow-2xs`}
                      >
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-700 flex-1">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded text-[11px] shrink-0">
                            <Target size={12} className="text-amber-800" />
                            Chủ đề:
                          </span>
                          <span className="font-semibold text-slate-900">
                            {q.chapter || 'Toán học'} › {q.lesson || 'Kiến thức trọng tâm'}
                          </span>
                          <span className="text-slate-300 hidden sm:inline">|</span>
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-900 bg-emerald-200/70 px-2 py-0.5 rounded text-[11px] shrink-0">
                            YCCĐ:
                          </span>
                          <span className="italic text-slate-700 leading-snug line-clamp-2">
                            {q.learningObjective || `${q.cognitiveLevelLabel} kiến thức trọng tâm bài học theo chuẩn GDPT 2018`}
                          </span>
                        </div>
                        {renderQuestionLevelAndAddButtons(q)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PHẦN II */}
            {p2.length > 0 && (
              <div className="space-y-4">
                <div className="bg-slate-100 p-3 rounded-xl font-sans flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI (
                      {(p2.length * (p2[0].score || 1.0)).toFixed(2)} điểm)
                    </h4>
                    <p className="text-xs text-slate-600 italic">
                      Thí sinh trả lời từ câu 1 đến câu {p2.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {onAddQuestionsToSection && (
                      <button
                        type="button"
                        onClick={() => setAddingSection(addingSection === 'part2_true_false' ? null : 'part2_true_false')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        title="Thêm các câu hỏi cùng mức độ vào Phần II"
                      >
                        <Plus size={13} className="text-indigo-600" />
                        <span>+ Thêm câu cùng mức độ</span>
                      </button>
                    )}
                    {onRegenerateSection && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Đổi mới tất cả câu hỏi trong Phần II và tự động cập nhật toàn bộ đáp án tương ứng?')) {
                            onRegenerateSection('part2_true_false');
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        title="Đổi toàn bộ câu hỏi Phần II và tự động cập nhật đáp án của Phần II"
                      >
                        <RefreshCw size={12} className="text-emerald-600" />
                        <span>Đổi cả Phần II</span>
                      </button>
                    )}
                  </div>
                </div>

                {renderSectionAddControl('part2_true_false', 'Phần II (Trắc nghiệm đúng sai)')}

                <div className="space-y-4 pl-1">
                  {p2.map((q, idx) => (
                    <div
                      key={q.id}
                      className={`group relative p-3 rounded-xl transition-all border ${
                        selectedQuestionIds.has(q.id)
                          ? 'bg-indigo-50/40 border-indigo-300 shadow-xs ring-1 ring-indigo-200'
                          : 'border-transparent hover:border-slate-200 hover:bg-slate-50/90'
                      }`}
                    >
                      <div className="absolute right-2 top-2 flex items-center gap-1.5 font-sans z-10">
                        <QuestionGuidanceTooltip
                          question={q}
                          questionIndex={idx + 1}
                          onRegenerateEquivalent={onRegenerateEquivalent}
                          onOpenSuggestions={onOpenSuggestions}
                          onEditQuestion={onEditQuestion}
                          onChangeCognitiveLevel={onChangeQuestionLevel}
                          onAddSameLevelQuestion={onAddQuestionsSameLevel}
                          showRawLatex={showRawLatex}
                        />
                        <div className="hidden group-hover:flex items-center gap-1">
                          {onAddQuestionsSameLevel && (
                            <button
                              type="button"
                              onClick={() => onAddQuestionsSameLevel(q, 1)}
                              title={`Thêm 1 câu hỏi cùng mức độ (${q.cognitiveLevelLabel}) vào đề`}
                              className="p-1 text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 rounded border border-emerald-300 shadow-2xs cursor-pointer"
                            >
                              <Plus size={12} />
                            </button>
                          )}
                          {onOpenSuggestions && (
                            <button
                              type="button"
                              onClick={() => onOpenSuggestions(q)}
                              title="Chọn câu khác từ Ngân hàng gợi ý (kèm đổi đáp án)"
                              className="p-1 text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 rounded border border-emerald-200 shadow-2xs cursor-pointer"
                            >
                              <Sparkles size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onRegenerateEquivalent(q)}
                            title="Đổi câu tương đương (tự động cập nhật đáp án)"
                            className="p-1 text-slate-500 hover:text-indigo-600 bg-white rounded border border-slate-200 shadow-2xs cursor-pointer"
                          >
                            <RefreshCw size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditQuestion(q)}
                            title="Sửa nội dung câu và đáp án thủ công"
                            className="p-1 text-slate-500 hover:text-indigo-600 bg-white rounded border border-slate-200 shadow-2xs cursor-pointer"
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedQuestionIds.has(q.id)}
                          onChange={() => toggleSelectQuestion(q.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-1 shrink-0 print:hidden"
                          title="Chọn câu này để đổi hoặc thao tác"
                        />
                        <div className="flex-1 pr-28">
                          <div className="font-medium text-slate-900">
                            <span className="font-bold">Câu {idx + 1}: </span>
                            <LatexRenderer text={q.prompt} showRawLatex={showRawLatex} />
                          </div>

                          {q.tfStatements && (
                            <div className="mt-2.5 space-y-1.5 pl-4">
                              {q.tfStatements.map((st) => (
                                <div key={st.subKey} className="flex items-start gap-2">
                                  <span className="font-bold">{st.subKey})</span>
                                  <LatexRenderer text={st.text} showRawLatex={showRawLatex} className="flex-1" />
                                  <div className="flex gap-2 text-xs font-sans text-slate-400 print:text-slate-900 shrink-0 font-medium">
                                    <span>[ ] Đúng</span>
                                    <span>[ ] Sai</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bảng chỉ dẫn Yêu cầu cần đạt & Chủ đề khi chuột để vào câu này */}
                      <div
                        className={`${
                          alwaysShowGuidance ? 'flex' : 'hidden group-hover:flex'
                        } flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-3 pt-2.5 border-t border-indigo-100/90 bg-gradient-to-r from-amber-50/90 via-indigo-50/70 to-emerald-50/80 p-2.5 rounded-xl text-xs font-sans print:hidden animate-in fade-in duration-150 shadow-2xs`}
                      >
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-700 flex-1">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded text-[11px] shrink-0">
                            <Target size={12} className="text-amber-800" />
                            Chủ đề:
                          </span>
                          <span className="font-semibold text-slate-900">
                            {q.chapter || 'Toán học'} › {q.lesson || 'Kiến thức trọng tâm'}
                          </span>
                          <span className="text-slate-300 hidden sm:inline">|</span>
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-900 bg-emerald-200/70 px-2 py-0.5 rounded text-[11px] shrink-0">
                            YCCĐ:
                          </span>
                          <span className="italic text-slate-700 leading-snug line-clamp-2">
                            {q.learningObjective || `${q.cognitiveLevelLabel} kiến thức trọng tâm bài học theo chuẩn GDPT 2018`}
                          </span>
                        </div>
                        {renderQuestionLevelAndAddButtons(q)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PHẦN III */}
            {p3.length > 0 && (
              <div className="space-y-4">
                <div className="bg-slate-100 p-3 rounded-xl font-sans flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN (
                      {(p3.length * (p3[0].score || 0.5)).toFixed(2)} điểm)
                    </h4>
                    <p className="text-xs text-slate-600 italic">
                      Thí sinh trả lời từ câu 1 đến câu {p3.length}. Viết đáp số vào ô trống tương ứng.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {onAddQuestionsToSection && (
                      <button
                        type="button"
                        onClick={() => setAddingSection(addingSection === 'part3_short_answer' ? null : 'part3_short_answer')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        title="Thêm các câu hỏi cùng mức độ vào Phần III"
                      >
                        <Plus size={13} className="text-indigo-600" />
                        <span>+ Thêm câu cùng mức độ</span>
                      </button>
                    )}
                    {onRegenerateSection && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Đổi mới tất cả câu hỏi trong Phần III và tự động cập nhật toàn bộ đáp án tương ứng?')) {
                            onRegenerateSection('part3_short_answer');
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        title="Đổi toàn bộ câu hỏi Phần III và tự động cập nhật đáp án của Phần III"
                      >
                        <RefreshCw size={12} className="text-emerald-600" />
                        <span>Đổi cả Phần III</span>
                      </button>
                    )}
                  </div>
                </div>

                {renderSectionAddControl('part3_short_answer', 'Phần III (Trắc nghiệm trả lời ngắn)')}

                <div className="space-y-4 pl-1">
                  {p3.map((q, idx) => (
                    <div
                      key={q.id}
                      className={`group relative p-3 rounded-xl transition-all border ${
                        selectedQuestionIds.has(q.id)
                          ? 'bg-indigo-50/40 border-indigo-300 shadow-xs ring-1 ring-indigo-200'
                          : 'border-transparent hover:border-slate-200 hover:bg-slate-50/90'
                      }`}
                    >
                      <div className="absolute right-2 top-2 flex items-center gap-1.5 font-sans z-10">
                        <QuestionGuidanceTooltip
                          question={q}
                          questionIndex={idx + 1}
                          onRegenerateEquivalent={onRegenerateEquivalent}
                          onOpenSuggestions={onOpenSuggestions}
                          onEditQuestion={onEditQuestion}
                          onChangeCognitiveLevel={onChangeQuestionLevel}
                          onAddSameLevelQuestion={onAddQuestionsSameLevel}
                          showRawLatex={showRawLatex}
                        />
                        <div className="hidden group-hover:flex items-center gap-1">
                          {onAddQuestionsSameLevel && (
                            <button
                              type="button"
                              onClick={() => onAddQuestionsSameLevel(q, 1)}
                              title={`Thêm 1 câu hỏi cùng mức độ (${q.cognitiveLevelLabel}) vào đề`}
                              className="p-1 text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 rounded border border-emerald-300 shadow-2xs cursor-pointer"
                            >
                              <Plus size={12} />
                            </button>
                          )}
                          {onOpenSuggestions && (
                            <button
                              type="button"
                              onClick={() => onOpenSuggestions(q)}
                              title="Chọn câu khác từ Ngân hàng gợi ý (kèm đổi đáp án)"
                              className="p-1 text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 rounded border border-emerald-200 shadow-2xs cursor-pointer"
                            >
                              <Sparkles size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onRegenerateEquivalent(q)}
                            title="Đổi câu tương đương (tự động cập nhật đáp án)"
                            className="p-1 text-slate-500 hover:text-indigo-600 bg-white rounded border border-slate-200 shadow-2xs cursor-pointer"
                          >
                            <RefreshCw size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditQuestion(q)}
                            title="Sửa nội dung câu và đáp án thủ công"
                            className="p-1 text-slate-500 hover:text-indigo-600 bg-white rounded border border-slate-200 shadow-2xs cursor-pointer"
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedQuestionIds.has(q.id)}
                          onChange={() => toggleSelectQuestion(q.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-1 shrink-0 print:hidden"
                          title="Chọn câu này để đổi hoặc thao tác"
                        />
                        <div className="flex-1 pr-28">
                          <div className="font-medium text-slate-900">
                            <span className="font-bold">Câu {idx + 1}: </span>
                            <LatexRenderer text={q.prompt} showRawLatex={showRawLatex} />
                          </div>

                          <div className="mt-2.5 flex items-center gap-2 pl-4 text-xs font-sans">
                            <span className="text-slate-600 font-semibold">Đáp số:</span>
                            <div className="w-36 h-6 border border-slate-400 rounded bg-white"></div>
                          </div>
                        </div>
                      </div>

                      {/* Bảng chỉ dẫn Yêu cầu cần đạt & Chủ đề khi chuột để vào câu này */}
                      <div
                        className={`${
                          alwaysShowGuidance ? 'flex' : 'hidden group-hover:flex'
                        } flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-3 pt-2.5 border-t border-indigo-100/90 bg-gradient-to-r from-amber-50/90 via-indigo-50/70 to-emerald-50/80 p-2.5 rounded-xl text-xs font-sans print:hidden animate-in fade-in duration-150 shadow-2xs`}
                      >
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-700 flex-1">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded text-[11px] shrink-0">
                            <Target size={12} className="text-amber-800" />
                            Chủ đề:
                          </span>
                          <span className="font-semibold text-slate-900">
                            {q.chapter || 'Toán học'} › {q.lesson || 'Kiến thức trọng tâm'}
                          </span>
                          <span className="text-slate-300 hidden sm:inline">|</span>
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-900 bg-emerald-200/70 px-2 py-0.5 rounded text-[11px] shrink-0">
                            YCCĐ:
                          </span>
                          <span className="italic text-slate-700 leading-snug line-clamp-2">
                            {q.learningObjective || `${q.cognitiveLevelLabel} kiến thức trọng tâm bài học theo chuẩn GDPT 2018`}
                          </span>
                        </div>
                        {renderQuestionLevelAndAddButtons(q)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PHẦN IV */}
            {p4.length > 0 && (
              <div className="space-y-4">
                <div className="bg-slate-100 p-3 rounded-xl font-sans flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      PHẦN IV. TỰ LUẬN (
                      {p4.reduce((acc, q) => acc + (q.score || 1.0), 0).toFixed(2)} điểm)
                    </h4>
                    <p className="text-xs text-slate-600 italic">
                      Thí sinh trình bày chi tiết lời giải các bài toán sau vào giấy thi.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {onAddQuestionsToSection && (
                      <button
                        type="button"
                        onClick={() => setAddingSection(addingSection === 'part4_essay' ? null : 'part4_essay')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        title="Thêm bài toán cùng mức độ vào Phần IV"
                      >
                        <Plus size={13} className="text-indigo-600" />
                        <span>+ Thêm câu cùng mức độ</span>
                      </button>
                    )}
                    {onRegenerateSection && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Đổi mới tất cả bài toán trong Phần IV và tự động cập nhật toàn bộ barem chấm tương ứng?')) {
                            onRegenerateSection('part4_essay');
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        title="Đổi toàn bộ bài toán Phần IV và tự động cập nhật barem của Phần IV"
                      >
                        <RefreshCw size={12} className="text-emerald-600" />
                        <span>Đổi cả Phần IV</span>
                      </button>
                    )}
                  </div>
                </div>

                {renderSectionAddControl('part4_essay', 'Phần IV (Tự luận)')}

                <div className="space-y-4 pl-1">
                  {p4.map((q, idx) => (
                    <div
                      key={q.id}
                      className={`group relative p-3 rounded-xl transition-all border ${
                        selectedQuestionIds.has(q.id)
                          ? 'bg-indigo-50/40 border-indigo-300 shadow-xs ring-1 ring-indigo-200'
                          : 'border-transparent hover:border-slate-200 hover:bg-slate-50/90'
                      }`}
                    >
                      <div className="absolute right-2 top-2 flex items-center gap-1.5 font-sans z-10">
                        <QuestionGuidanceTooltip
                          question={q}
                          questionIndex={idx + 1}
                          onRegenerateEquivalent={onRegenerateEquivalent}
                          onOpenSuggestions={onOpenSuggestions}
                          onEditQuestion={onEditQuestion}
                          onChangeCognitiveLevel={onChangeQuestionLevel}
                          onAddSameLevelQuestion={onAddQuestionsSameLevel}
                          showRawLatex={showRawLatex}
                        />
                        <div className="hidden group-hover:flex items-center gap-1">
                          {onAddQuestionsSameLevel && (
                            <button
                              type="button"
                              onClick={() => onAddQuestionsSameLevel(q, 1)}
                              title={`Thêm 1 bài toán cùng mức độ (${q.cognitiveLevelLabel}) vào đề`}
                              className="p-1 text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 rounded border border-emerald-300 shadow-2xs cursor-pointer"
                            >
                              <Plus size={12} />
                            </button>
                          )}
                          {onOpenSuggestions && (
                            <button
                              type="button"
                              onClick={() => onOpenSuggestions(q)}
                              title="Chọn bài khác từ Ngân hàng gợi ý (kèm đổi đáp án)"
                              className="p-1 text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 rounded border border-emerald-200 shadow-2xs cursor-pointer"
                            >
                              <Sparkles size={12} />
                            </button>
                          )}
                          {onNumericVariation && (
                            <button
                              type="button"
                              onClick={() => onNumericVariation(q)}
                              title="Đổi số liệu toán học bài này (Tự động tính & đồng bộ đáp án)"
                              className="p-1 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded border border-amber-300 shadow-2xs cursor-pointer"
                            >
                              <Calculator size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onRegenerateEquivalent(q)}
                            title="Đổi bài toán tương đương (tự động cập nhật đáp án)"
                            className="p-1 text-slate-500 hover:text-indigo-600 bg-white rounded border border-slate-200 shadow-2xs cursor-pointer"
                          >
                            <RefreshCw size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditQuestion(q)}
                            title="Sửa nội dung bài toán và barem thủ công"
                            className="p-1 text-slate-500 hover:text-indigo-600 bg-white rounded border border-slate-200 shadow-2xs cursor-pointer"
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedQuestionIds.has(q.id)}
                          onChange={() => toggleSelectQuestion(q.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-1 shrink-0 print:hidden"
                          title="Chọn bài này để đổi hoặc thao tác"
                        />
                        <div className="flex-1 pr-28">
                          <div className="whitespace-pre-line leading-relaxed text-slate-900">
                            {(() => {
                              const d = detectMathDomain(q.prompt, q.chapter, q.lesson);
                              const bCls =
                                d.domain === 'geometry'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : d.domain === 'statistics_probability'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-sky-50 text-sky-700 border-sky-200';
                              return (
                                <span
                                  className={`inline-block mr-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold border print:hidden ${bCls}`}
                                  title={`Phân môn: ${d.domainLabel}`}
                                >
                                  {d.domainLabel}
                                </span>
                              );
                            })()}
                            <span className="font-bold">Bài {idx + 1} ({q.score || 1.0} điểm): </span>
                            <LatexRenderer text={q.prompt} showRawLatex={showRawLatex} />
                          </div>
                        </div>
                      </div>

                      {/* Bảng chỉ dẫn Yêu cầu cần đạt & Chủ đề khi chuột để vào câu này */}
                      <div
                        className={`${
                          alwaysShowGuidance ? 'flex' : 'hidden group-hover:flex'
                        } flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-3 pt-2.5 border-t border-indigo-100/90 bg-gradient-to-r from-amber-50/90 via-indigo-50/70 to-emerald-50/80 p-2.5 rounded-xl text-xs font-sans print:hidden animate-in fade-in duration-150 shadow-2xs`}
                      >
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-700 flex-1">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded text-[11px] shrink-0">
                            <Target size={12} className="text-amber-800" />
                            Chủ đề:
                          </span>
                          <span className="font-semibold text-slate-900">
                            {q.chapter || 'Toán học'} › {q.lesson || 'Kiến thức trọng tâm'}
                          </span>
                          <span className="text-slate-300 hidden sm:inline">|</span>
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-900 bg-emerald-200/70 px-2 py-0.5 rounded text-[11px] shrink-0">
                            YCCĐ:
                          </span>
                          <span className="italic text-slate-700 leading-snug line-clamp-2">
                            {q.learningObjective || `${q.cognitiveLevelLabel} kiến thức trọng tâm bài học theo chuẩn GDPT 2018`}
                          </span>
                        </div>
                        {renderQuestionLevelAndAddButtons(q)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Floating Sticky Batch Action Bar */}
          {selectedQuestionIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">
                  Đã chọn {selectedQuestionIds.size} / {formattedPaper.questions.length} câu hỏi
                </span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              {onRegenerateMultipleQuestions && (
                <button
                  type="button"
                  onClick={() => {
                    onRegenerateMultipleQuestions(Array.from(selectedQuestionIds));
                    setSelectedQuestionIds(new Set());
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  title="Đổi các câu hỏi đã chọn và tự động cập nhật đáp án tương ứng"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Đổi {selectedQuestionIds.size} câu đã chọn (Kèm đáp án)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedQuestionIds(new Set())}
                className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-12 text-center font-sans space-y-1">
            <div className="font-bold tracking-widest text-slate-700 text-xs">
              ---------- HẾT ----------
            </div>
            <div className="text-[11px] text-slate-500 italic">
              Cán bộ coi thi không giải thích gì thêm. Thí sinh không được sử dụng tài liệu.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: ĐÁP ÁN VÀ BAREM CHẤM CHI TIẾT */}
      {/* ========================================================================= */}
      {activeSubTab === 'solutions' && (
        <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-slate-200 max-w-4xl mx-auto font-sans text-slate-900 space-y-8">
          <div className="text-center border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-900 uppercase">
              HƯỚNG DẪN CHẤM & ĐÁP ÁN ĐỀ KIỂM TRA MÃ {cfg.examCode}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Môn: {cfg.subject} — Khối {cfg.grade} • Năm học: {cfg.academicYear}
            </p>
          </div>

          {/* 1. Phần I Đáp án */}
          {p1.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                  1
                </span>
                ĐÁP ÁN PHẦN I — TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN (Mỗi câu 0.25 điểm)
              </h4>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 text-center text-xs">
                {p1.map((q, idx) => (
                  <div key={q.id} className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                    <div className="text-slate-500 font-medium">Câu {idx + 1}</div>
                    <div className="font-black text-indigo-700 text-sm mt-0.5">
                      {q.correctOption || 'A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Phần II Đáp án */}
          {p2.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                  2
                </span>
                ĐÁP ÁN PHẦN II — TRẮC NGHIỆM ĐÚNG SAI
              </h4>
              <p className="text-xs text-slate-500 italic">
                Quy tắc tính điểm theo chuẩn BGD: Đúng 1 ý: 0.1đ • Đúng 2 ý: 0.25đ • Đúng 3 ý: 0.5đ • Đúng 4 ý: 1.0đ.
              </p>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-16 text-center">Câu</th>
                      <th className="p-2.5 w-24 text-center">Lệnh a)</th>
                      <th className="p-2.5 w-24 text-center">Lệnh b)</th>
                      <th className="p-2.5 w-24 text-center">Lệnh c)</th>
                      <th className="p-2.5 w-24 text-center">Lệnh d)</th>
                      <th className="p-2.5">Giải thích sư phạm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {p2.map((q, idx) => {
                      const a = q.tfStatements?.find((s) => s.subKey === 'a')?.isCorrect ? 'ĐÚNG' : 'SAI';
                      const b = q.tfStatements?.find((s) => s.subKey === 'b')?.isCorrect ? 'ĐÚNG' : 'SAI';
                      const c = q.tfStatements?.find((s) => s.subKey === 'c')?.isCorrect ? 'ĐÚNG' : 'SAI';
                      const d = q.tfStatements?.find((s) => s.subKey === 'd')?.isCorrect ? 'ĐÚNG' : 'SAI';

                      return (
                        <tr key={q.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-center text-indigo-700">Câu {idx + 1}</td>
                          <td className={`p-2.5 font-bold text-center ${a === 'ĐÚNG' ? 'text-emerald-700 bg-emerald-50/50' : 'text-rose-600 bg-rose-50/50'}`}>
                            {a}
                          </td>
                          <td className={`p-2.5 font-bold text-center ${b === 'ĐÚNG' ? 'text-emerald-700 bg-emerald-50/50' : 'text-rose-600 bg-rose-50/50'}`}>
                            {b}
                          </td>
                          <td className={`p-2.5 font-bold text-center ${c === 'ĐÚNG' ? 'text-emerald-700 bg-emerald-50/50' : 'text-rose-600 bg-rose-50/50'}`}>
                            {c}
                          </td>
                          <td className={`p-2.5 font-bold text-center ${d === 'ĐÚNG' ? 'text-emerald-700 bg-emerald-50/50' : 'text-rose-600 bg-rose-50/50'}`}>
                            {d}
                          </td>
                          <td className="p-2.5 text-slate-600">
                            <LatexRenderer text={q.solutionExplanation || 'Theo lý thuyết SGK'} showRawLatex={showRawLatex} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Phần III Đáp án */}
          {p3.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                  3
                </span>
                ĐÁP ÁN PHẦN III — TRẢ LỜI NGẮN (Mỗi câu 0.5 điểm)
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-16 text-center">Câu</th>
                      <th className="p-2.5 w-36 text-center">Đáp số chuẩn</th>
                      <th className="p-2.5">Hướng dẫn giải vắn tắt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {p3.map((q, idx) => (
                      <tr key={q.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-center text-indigo-700">Câu {idx + 1}</td>
                        <td className="p-2.5 font-bold text-center text-emerald-700 bg-emerald-50/50 text-sm">
                          <LatexRenderer text={q.shortAnswerText || '---'} showRawLatex={showRawLatex} />
                        </td>
                        <td className="p-2.5 text-slate-600">
                          <LatexRenderer text={q.solutionExplanation || 'Tính theo công thức SGK'} showRawLatex={showRawLatex} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Phần IV Barem Tự luận */}
          {p4.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                  4
                </span>
                BAREM ĐIỂM CHI TIẾT PHẦN IV — TỰ LUẬN
              </h4>

              <div className="space-y-4">
                {p4.map((q, idx) => (
                  <div key={q.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 p-3 flex items-center justify-between border-b border-slate-200">
                      <span className="font-bold text-xs text-slate-800">
                        Bài {idx + 1} ({q.score || 1.0} điểm) — {q.lesson}
                      </span>
                    </div>

                    <div className="p-3 bg-white">
                      {q.essayGradingSteps && q.essayGradingSteps.length > 0 ? (
                        <div className="divide-y divide-slate-100 text-xs">
                          {q.essayGradingSteps.map((step, sIdx) => (
                            <div key={sIdx} className="py-2 flex items-start justify-between gap-4">
                              <span className="text-slate-700">
                                <LatexRenderer text={step.step} showRawLatex={showRawLatex} />
                              </span>
                              <span className="font-bold text-indigo-700 shrink-0 bg-indigo-50 px-2 py-0.5 rounded">
                                {step.point.toFixed(2)} đ
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600 leading-relaxed">
                          <LatexRenderer text={q.solutionExplanation || 'Trình bày đầy đủ các bước giải.'} showRawLatex={showRawLatex} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: BẢNG ĐỐI CHIẾU MA TRẬN & YÊU CẦU CẦN ĐẠT */}
      {/* ========================================================================= */}
      {activeSubTab === 'matrix_alignment' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 max-w-5xl mx-auto font-sans text-slate-900 space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <TableProperties className="text-indigo-600" size={18} />
                Bảng Đối Chiếu Ma Trận & Yêu Cầu Cần Đạt (Bộ GD&ĐT)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bảo đảm 100% câu hỏi trong đề thi khớp nối với Phụ lục I và Phụ lục II
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                Tỉ lệ TN: {summary.percentTn}% ({summary.scorePart1 + summary.scorePart2 + summary.scorePart3}đ)
              </span>
              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                Tỉ lệ TL: {summary.percentTl}% ({summary.scorePart4}đ)
              </span>
            </div>
          </div>

          {/* Cognitive Level Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
              <div className="text-xs font-bold text-blue-900">Nhận biết</div>
              <div className="text-xl font-extrabold text-blue-700 mt-1">
                {summary.scoreNhanBiet} đ
              </div>
              <div className="text-[11px] text-blue-600 mt-0.5">
                {Math.round((summary.scoreNhanBiet / 10) * 100)}% tổng số điểm
              </div>
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
              <div className="text-xs font-bold text-emerald-900">Thông hiểu</div>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">
                {summary.scoreThongHieu} đ
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5">
                {Math.round((summary.scoreThongHieu / 10) * 100)}% tổng số điểm
              </div>
            </div>

            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
              <div className="text-xs font-bold text-amber-900">Vận dụng</div>
              <div className="text-xl font-extrabold text-amber-700 mt-1">
                {summary.scoreVanDung} đ
              </div>
              <div className="text-[11px] text-amber-600 mt-0.5">
                {Math.round((summary.scoreVanDung / 10) * 100)}% tổng số điểm
              </div>
            </div>

            <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200">
              <div className="text-xs font-bold text-rose-900">Vận dụng cao</div>
              <div className="text-xl font-extrabold text-rose-700 mt-1">
                {summary.scoreVanDungCao} đ
              </div>
              <div className="text-[11px] text-rose-600 mt-0.5">
                {Math.round((summary.scoreVanDungCao / 10) * 100)}% tổng số điểm
              </div>
            </div>
          </div>

          {/* Full Question-by-Question Alignment Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 w-16 text-center">Mã câu</th>
                    <th className="p-2.5 w-32">Phần thi</th>
                    <th className="p-2.5 w-24 text-center">Mức độ</th>
                    <th className="p-2.5 w-16 text-center">Điểm</th>
                    <th className="p-2.5 w-48">Đơn vị kiến thức (Bài học)</th>
                    <th className="p-2.5">Yêu cầu cần đạt (YCCĐ chuẩn BGD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paper.questions.map((q) => {
                    const sectionLabel =
                      q.section === 'part1_mcq'
                        ? 'Phần I: TN Nhiều lựa chọn'
                        : q.section === 'part2_true_false'
                        ? 'Phần II: TN Đúng/Sai'
                        : q.section === 'part3_short_answer'
                        ? 'Phần III: Trả lời ngắn'
                        : 'Phần IV: Tự luận';

                    const cogBadge =
                      q.cognitiveLevel === 'nhanBiet'
                        ? 'bg-blue-100 text-blue-800'
                        : q.cognitiveLevel === 'thongHieu'
                        ? 'bg-emerald-100 text-emerald-800'
                        : q.cognitiveLevel === 'vanDung'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800';

                    return (
                      <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-bold text-center text-indigo-700">{q.code}</td>
                        <td className="p-2.5 text-slate-600 font-medium">{sectionLabel}</td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${cogBadge}`}>
                            {q.cognitiveLevelLabel}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-center text-slate-800">
                          {(q.score || 0).toFixed(2)}đ
                        </td>
                        <td className="p-2.5 font-medium text-slate-800">{q.lesson}</td>
                        <td className="p-2.5 text-slate-600 leading-relaxed">
                          {q.learningObjective || 'Yêu cầu cần đạt chuẩn CTGDPT 2018.'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
