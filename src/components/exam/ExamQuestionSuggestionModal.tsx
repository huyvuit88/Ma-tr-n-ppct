import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Check,
  RefreshCw,
  Award,
  BookOpen,
  HelpCircle,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ExamQuestion, BankQuestionTemplate, CognitiveLevel } from '../../types';
import { getSuggestedQuestions } from '../../utils/examGenerator';
import { LatexRenderer, formatQuestionLatex } from '../../utils/latexUtils';

interface ExamQuestionSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: ExamQuestion | null;
  grade?: string;
  initialLevel?: CognitiveLevel;
  customBank?: BankQuestionTemplate[];
  allowProbStats?: boolean;
  onApplyQuestion: (newQuestion: ExamQuestion) => void;
}

const COGNITIVE_LEVELS: { id: CognitiveLevel; label: string; desc: string; color: string; bgActive: string }[] = [
  {
    id: 'nhanBiet',
    label: 'Nhận biết',
    desc: 'Nhận diện khái niệm, định nghĩa, công thức cơ bản',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-300',
    bgActive: 'bg-emerald-700 text-white shadow-xs',
  },
  {
    id: 'thongHieu',
    label: 'Thông hiểu',
    desc: 'Hiểu bản chất, giải thích, thực hiện biến đổi 1-2 bước',
    color: 'text-blue-700 bg-blue-50 border-blue-300',
    bgActive: 'bg-blue-700 text-white shadow-xs',
  },
  {
    id: 'vanDung',
    label: 'Vận dụng',
    desc: 'Vận dụng liên kết kiến thức, giải bài toán có ngữ cảnh',
    color: 'text-amber-800 bg-amber-50 border-amber-300',
    bgActive: 'bg-amber-700 text-white shadow-xs',
  },
  {
    id: 'vanDungCao',
    label: 'Vận dụng cao',
    desc: 'Bài toán tư duy tổng hợp, phân hóa, thực tiễn phức tạp',
    color: 'text-purple-700 bg-purple-50 border-purple-300',
    bgActive: 'bg-purple-700 text-white shadow-xs',
  },
];

export const ExamQuestionSuggestionModal: React.FC<ExamQuestionSuggestionModalProps> = ({
  isOpen,
  onClose,
  question,
  grade = '9',
  initialLevel,
  customBank,
  allowProbStats,
  onApplyQuestion,
}) => {
  if (!isOpen || !question) return null;

  // Selected level: defaults to initialLevel or question's cognitive level
  const [activeLevel, setActiveLevel] = useState<CognitiveLevel>(() => initialLevel || question.cognitiveLevel || 'nhanBiet');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  React.useEffect(() => {
    if (initialLevel) {
      setActiveLevel(initialLevel);
    } else if (question) {
      setActiveLevel(question.cognitiveLevel || 'nhanBiet');
    }
  }, [initialLevel, question]);

  // Get suggestions matching active level
  const suggestions: BankQuestionTemplate[] = useMemo(() => {
    return getSuggestedQuestions(question, grade, activeLevel, customBank, allowProbStats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, grade, activeLevel, customBank, allowProbStats, refreshKey]);

  const handleSelectSuggestion = (tpl: BankQuestionTemplate) => {
    const levelLabel =
      tpl.cognitiveLevel === 'nhanBiet'
        ? 'Nhận biết'
        : tpl.cognitiveLevel === 'thongHieu'
        ? 'Thông hiểu'
        : tpl.cognitiveLevel === 'vanDung'
        ? 'Vận dụng'
        : 'Vận dụng cao';

    const updated: ExamQuestion = formatQuestionLatex({
      ...question,
      prompt: tpl.prompt,
      options: tpl.options,
      correctOption: tpl.correctOption,
      tfStatements: tpl.tfStatements,
      shortAnswerText: tpl.shortAnswerText,
      essayGradingSteps: tpl.essayGradingSteps,
      cognitiveLevel: tpl.cognitiveLevel,
      cognitiveLevelLabel: levelLabel,
      learningObjective: tpl.learningObjective,
      solutionExplanation: tpl.solutionExplanation,
    });

    onApplyQuestion(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-linear-to-r from-emerald-50/80 via-indigo-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-xs">
                  {question.code}
                </span>
                <h3 className="text-base font-bold text-slate-800">
                  Gợi ý câu hỏi & Tùy chỉnh mức độ nhận thức
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Chủ đề: <span className="font-semibold text-slate-700">{question.lesson}</span> ({question.chapter}) • Khối {grade}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Level Switcher Ribbon */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
              <Layers size={13} className="text-emerald-700" />
              Mức độ mong muốn:
            </span>

            {COGNITIVE_LEVELS.map((lvl) => {
              const isCurrentQuestionLevel = question.cognitiveLevel === lvl.id;
              const isSelected = activeLevel === lvl.id;

              return (
                <button
                  key={lvl.id}
                  onClick={() => setActiveLevel(lvl.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? `${lvl.bgActive} border-transparent shadow-xs`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={lvl.desc}
                >
                  <span>{lvl.label}</span>
                  {isCurrentQuestionLevel && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                      title="Mức độ của câu hiện tại"
                    >
                      hiện tại
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
              {suggestions.length} câu hỏi khả dụng (&gt; 5 câu)
            </span>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100/70 hover:bg-emerald-200/70 transition-colors shrink-0 cursor-pointer"
              title="Đổi bộ câu hỏi gợi ý khác"
            >
              <RefreshCw size={13} />
              <span>Sinh câu khác</span>
            </button>
          </div>
        </div>

        {/* Current Question Quick Summary Bar */}
        <div className="px-6 py-2 bg-amber-50/70 border-b border-amber-200/80 text-xs text-amber-900 flex items-center gap-2">
          <Info size={14} className="text-amber-700 shrink-0" />
          <div className="truncate">
            <span className="font-bold">Đề bài hiện tại: </span>
            <span className="italic">{question.prompt.substring(0, 110)}...</span>
          </div>
        </div>

        {/* Suggestions List Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-100/50">
          {suggestions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-200 p-8">
              <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">Chưa tìm thấy câu hỏi gợi ý phù hợp cho mức độ này.</p>
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="mt-3 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors inline-flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                Tự động sinh câu mới
              </button>
            </div>
          ) : (
            suggestions.map((tpl, idx) => {
              const lvlMeta = COGNITIVE_LEVELS.find((l) => l.id === tpl.cognitiveLevel);

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-5 space-y-3"
                >
                  {/* Top Bar of card */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-md font-bold border ${
                          lvlMeta?.color || 'text-slate-700 bg-slate-50 border-slate-200'
                        }`}
                      >
                        {lvlMeta?.label || tpl.cognitiveLevel}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {tpl.section === 'part1_mcq'
                          ? 'Trắc nghiệm 4 lựa chọn'
                          : tpl.section === 'part2_true_false'
                          ? 'Trắc nghiệm Đúng/Sai'
                          : tpl.section === 'part3_short_answer'
                          ? 'Trả lời ngắn'
                          : 'Tự luận'}
                      </span>
                      {tpl.grade && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          Toán {tpl.grade}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleSelectSuggestion(tpl)}
                      className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      <Check size={14} />
                      <span>Áp dụng câu này vào đề</span>
                    </button>
                  </div>

                  {/* Question Prompt */}
                  <div className="text-sm font-medium text-slate-900 leading-relaxed pl-1">
                    <LatexRenderer text={tpl.prompt} />
                  </div>

                  {/* MCQ Options */}
                  {tpl.options && tpl.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-2 font-sans text-xs">
                      {tpl.options.map((opt) => {
                        const isCorrect = opt.key === tpl.correctOption;
                        return (
                          <div
                            key={opt.key}
                            className={`flex items-baseline gap-2 p-2 rounded-lg border transition-colors ${
                              isCorrect
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <div className="flex-1">
                              <LatexRenderer text={opt.text} />
                            </div>
                            {isCorrect && (
                              <span className="text-[10px] font-bold text-emerald-700 uppercase shrink-0">
                                Đáp án đúng
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* True/False Statements */}
                  {tpl.tfStatements && tpl.tfStatements.length > 0 && (
                    <div className="space-y-1.5 pt-1 pl-2 font-sans text-xs">
                      {tpl.tfStatements.map((st) => (
                        <div
                          key={st.subKey}
                          className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200"
                        >
                          <span className="font-bold text-slate-700 uppercase shrink-0">
                            {st.subKey})
                          </span>
                          <div className="flex-1 text-slate-800">
                            <LatexRenderer text={st.text} />
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                              st.isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {st.isCorrect ? 'Đúng' : 'Sai'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Short Answer */}
                  {tpl.shortAnswerText && (
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                      <span className="font-bold text-emerald-900">Đáp số chuẩn:</span>
                      <span className="font-black text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300 font-mono text-sm">
                        {tpl.shortAnswerText}
                      </span>
                    </div>
                  )}

                  {/* Essay Steps */}
                  {tpl.essayGradingSteps && tpl.essayGradingSteps.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <span className="font-bold text-slate-700 block mb-1">Các bước barem chấm điểm:</span>
                      {tpl.essayGradingSteps.map((s, sIdx) => (
                        <div key={sIdx} className="flex justify-between items-start gap-3">
                          <span className="text-slate-800">{s.step}</span>
                          <span className="font-bold text-indigo-700 shrink-0">+{s.point} đ</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pedagogical Explanation & Objective */}
                  {(tpl.solutionExplanation || tpl.learningObjective) && (
                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1 bg-slate-50/50 p-2.5 rounded-xl">
                      {tpl.learningObjective && (
                        <div className="flex items-baseline gap-1.5">
                          <BookOpen size={12} className="text-emerald-700 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-slate-700">YCCĐ: </strong>
                            {tpl.learningObjective}
                          </span>
                        </div>
                      )}
                      {tpl.solutionExplanation && (
                        <div className="flex items-baseline gap-1.5">
                          <HelpCircle size={12} className="text-indigo-600 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-slate-700">Giải thích: </strong>
                            <LatexRenderer text={tpl.solutionExplanation} />
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Chọn câu hỏi phù hợp để thay thế. Điểm số và đối chiếu ma trận sẽ tự động cập nhật ngay lập tức.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
