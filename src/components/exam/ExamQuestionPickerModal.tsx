import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  Target,
  Sliders,
  Layers,
  Plus,
} from 'lucide-react';
import { ExamQuestion, BankQuestionTemplate, CognitiveLevel } from '../../types';
import { getSuggestedQuestions } from '../../utils/examGenerator';
import { LatexRenderer } from '../../utils/latexUtils';

interface ExamQuestionPickerModalProps {
  isOpen: boolean;
  question: ExamQuestion | null;
  grade?: string;
  customBank?: BankQuestionTemplate[];
  allowProbStats?: boolean;
  onClose: () => void;
  onSelectReplacement: (selected: BankQuestionTemplate) => void;
  onRegenerateEquivalent: (question: ExamQuestion) => void;
  onAddAsNewQuestion?: (selected: BankQuestionTemplate) => void;
}

export const ExamQuestionPickerModal: React.FC<ExamQuestionPickerModalProps> = ({
  isOpen,
  question,
  grade = '9',
  customBank,
  allowProbStats,
  onClose,
  onSelectReplacement,
  onRegenerateEquivalent,
  onAddAsNewQuestion,
}) => {
  if (!isOpen || !question) return null;

  const [selectedLevel, setSelectedLevel] = useState<CognitiveLevel>(question.cognitiveLevel);

  // Lấy các câu hỏi gợi ý từ ngân hàng cho đúng dạng phần và chủ đề
  const suggestions = useMemo(() => {
    return getSuggestedQuestions(question, grade, selectedLevel, customBank, allowProbStats);
  }, [question, grade, selectedLevel, customBank, allowProbStats]);

  const levelTabs: { key: CognitiveLevel; label: string }[] = [
    { key: 'nhanBiet', label: 'Nhận biết' },
    { key: 'thongHieu', label: 'Thông hiểu' },
    { key: 'vanDung', label: 'Vận dụng' },
    { key: 'vanDungCao', label: 'Vận dụng cao' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Tùy Chọn Câu Hỏi & Tự Động Cập Nhật Đáp Án
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                  Khối {grade}
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Toán {grade} • {question.code || 'Câu hỏi'} • {question.chapter || 'Toán học'} › {question.lesson || 'Kiến thức trọng tâm'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Question Preview Banner */}
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-200/70 text-xs">
          <div className="font-bold text-amber-900 mb-1 flex items-center justify-between">
            <span>Câu hiện tại đang dùng trong đề:</span>
            <span className="font-medium text-[11px] text-amber-800">
              Mức độ: {question.cognitiveLevelLabel} • {question.score} điểm
            </span>
          </div>
          <div className="text-slate-800 italic line-clamp-2">
            <LatexRenderer text={question.prompt} />
          </div>
        </div>

        {/* Cognitive Level Tabs & Quick actions */}
        <div className="px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600 mr-1">Lọc mức độ:</span>
            {levelTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedLevel(tab.key)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedLevel === tab.key
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              onRegenerateEquivalent(question);
              onClose();
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Tự động đổi câu ngẫu nhiên tương đương từ ngân hàng và cập nhật đáp án"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đổi ngẫu nhiên tương đương</span>
          </button>
        </div>

        {/* Suggestions List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="text-xs text-slate-500 font-medium">
            Tìm thấy {suggestions.length} câu hỏi phù hợp từ Ngân hàng chuẩn GDPT 2018. Chọn câu bất kỳ sẽ tự động thay thế cả nội dung câu, các phương án và đáp án chấm:
          </div>

          {suggestions.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/20 transition-all shadow-xs space-y-3"
            >
              {/* Prompt */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      Lựa chọn {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {item.cognitiveLevel === 'nhanBiet'
                        ? 'Nhận biết'
                        : item.cognitiveLevel === 'thongHieu'
                        ? 'Thông hiểu'
                        : item.cognitiveLevel === 'vanDung'
                        ? 'Vận dụng'
                        : 'Vận dụng cao'}
                    </span>
                    {item.source === 'uploaded' ? (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        Ngân hàng tham khảo tải lên
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        AI chuẩn BGD
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-900 leading-relaxed">
                    <LatexRenderer text={item.prompt} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectReplacement(item);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    title="Thay thế câu hiện tại bằng câu này"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Chọn câu này</span>
                  </button>

                  {onAddAsNewQuestion && (
                    <button
                      type="button"
                      onClick={() => {
                        onAddAsNewQuestion(item);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Thêm câu này thành câu hỏi mới cùng mức độ vào đề thi"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Thêm vào đề</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Options (MCQ) */}
              {item.options && item.options.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  {item.options.map((opt) => (
                    <div
                      key={opt.key}
                      className={`p-2 rounded-lg border ${
                        opt.key === item.correctOption
                          ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="mr-1">{opt.key}.</span>
                      <LatexRenderer text={opt.text} />
                      {opt.key === item.correctOption && (
                        <span className="ml-1.5 text-[10px] text-emerald-700 font-bold">
                          ✓ (Đáp án đúng)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* True / False statements */}
              {item.tfStatements && item.tfStatements.length > 0 && (
                <div className="space-y-1.5 pt-1 text-xs">
                  {item.tfStatements.map((st) => (
                    <div
                      key={st.subKey}
                      className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-baseline justify-between gap-2"
                    >
                      <div className="flex-1">
                        <span className="font-bold mr-1.5">Ý {st.subKey}):</span>
                        <LatexRenderer text={st.text} />
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
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

              {/* Short Answer text */}
              {item.shortAnswerText && (
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs font-semibold text-emerald-900">
                  <span>Đáp án điền: </span>
                  <strong className="text-emerald-950 text-sm">
                    <LatexRenderer text={item.shortAnswerText} />
                  </strong>
                </div>
              )}

              {/* Essay Grading steps */}
              {item.essayGradingSteps && item.essayGradingSteps.length > 0 && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-xs">
                  <div className="font-bold text-slate-700">Barem chấm điểm:</div>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                    {item.essayGradingSteps.map((step, sIdx) => (
                      <li key={sIdx}>
                        {step.step} ({step.point}đ)
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Learning Objective & Solution Explanation */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-1">
                {item.learningObjective && (
                  <div className="italic flex items-center gap-1">
                    <Target className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>YCCĐ: {item.learningObjective}</span>
                  </div>
                )}
                {item.solutionExplanation && (
                  <div className="text-slate-600 truncate max-w-xs">
                    HD: {item.solutionExplanation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Thay đổi câu hỏi sẽ tự động cập nhật đề thi, đáp án và bảng đối chiếu YCCĐ.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
