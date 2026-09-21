import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Sliders,
  Sparkles,
  Shuffle,
  RefreshCw,
  Plus,
  BookOpen,
  HelpCircle,
  Award,
  Layers,
  CheckCircle2,
  Calendar,
  Zap,
  Calculator,
} from 'lucide-react';
import {
  ExamPaper,
  ExamPaperConfig,
  ExamQuestion,
  ExamLevelType,
  MatrixConfig,
  MatrixRow,
  SpecificationRow,
  PpctDataset,
  SgkBook,
  ExamEvent,
  BankQuestionTemplate,
} from '../../types';
import {
  generateExamPaperFromMatrix,
  generateCustomExamPaper,
  shuffleExamPaper,
  regenerateSingleQuestion,
  createNewQuestionWithLevel,
  calculateAlignmentSummary,
  hasProbStatsInTopics,
  isProbStatsText,
  isProbStatsQuestion,
} from '../../utils/examGenerator';
import { generateQuestionNumericVariant } from '../../utils/mathVariationSync';
import { getStoredUploadedQuestions } from '../../utils/questionBankStorage';
import { defaultDatasets, defaultPpctDataset9 } from '../../data/defaultData';
import { ExamPaperView } from './ExamPaperView';
import { ExamConfigModal } from './ExamConfigModal';
import { ExamQuestionEditModal } from './ExamQuestionEditModal';
import { ExamQuestionPickerModal } from './ExamQuestionPickerModal';
import { QuestionBankManagerModal } from '../QuestionBankManagerModal';

interface ExamBuilderTabProps {
  matrixConfig: MatrixConfig;
  matrixRows: MatrixRow[];
  specRows: SpecificationRow[];
  activePpct: PpctDataset;
  datasets?: PpctDataset[];
  onSelectDataset?: (id: string) => void;
  exams: ExamEvent[];
  sgkBooks?: SgkBook[];
  examSyncTimestamp?: number;
  onOpenMatrixTab: () => void;
}

const STORAGE_KEY = 'teacher_hub_active_exam_paper';
const getGradeStorageKey = (g: string) => `teacher_hub_active_exam_paper_grade_${g}`;

export const ExamBuilderTab: React.FC<ExamBuilderTabProps> = ({
  matrixConfig,
  matrixRows,
  specRows,
  activePpct,
  datasets,
  onSelectDataset,
  exams,
  sgkBooks,
  examSyncTimestamp,
  onOpenMatrixTab,
}) => {
  // Khối lớp đang được chọn để soạn đề (chuẩn hóa '6', '7', '8', '9')
  const [activeGrade, setActiveGrade] = useState<string>(() => {
    return String(activePpct?.grade || '9').replace(/\D/g, '') || '9';
  });

  // PPCT Dataset đồng bộ theo đúng Khối lớp đang chọn
  const activeGradePpct = useMemo(() => {
    if (activePpct && String(activePpct.grade || '').replace(/\D/g, '') === activeGrade) {
      return activePpct;
    }
    const fromDatasets = datasets?.find(
      (d) => String(d.grade || '').replace(/\D/g, '') === activeGrade
    );
    if (fromDatasets) return fromDatasets;
    return (
      defaultDatasets.find(
        (d) => String(d.grade || '').replace(/\D/g, '') === activeGrade
      ) || defaultPpctDataset9
    );
  }, [activeGrade, activePpct, datasets]);

  // Ngân hàng câu hỏi tham khảo tải lên
  const [uploadedQuestions, setUploadedQuestions] = useState<BankQuestionTemplate[]>(() => {
    return getStoredUploadedQuestions();
  });

  // Lọc riêng ngân hàng câu hỏi của đúng Khối lớp đang chọn
  const uploadedForActiveGrade = useMemo(() => {
    return uploadedQuestions.filter(
      (q) => (String(q.grade || '').replace(/\D/g, '') || '9') === activeGrade
    );
  }, [uploadedQuestions, activeGrade]);

  // Active exam paper
  const [examPaper, setExamPaper] = useState<ExamPaper | null>(() => {
    const initialG = String(activePpct?.grade || '9').replace(/\D/g, '') || '9';
    try {
      const gradeSaved = localStorage.getItem(getGradeStorageKey(initialG));
      if (gradeSaved) {
        return JSON.parse(gradeSaved);
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (String(parsed?.config?.grade || '').replace(/\D/g, '') === initialG) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load saved exam paper', e);
    }
    return null;
  });

  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [suggestingQuestion, setSuggestingQuestion] = useState<ExamQuestion | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [isQuestionBankModalOpen, setIsQuestionBankModalOpen] = useState<boolean>(false);

  // Lưu đề thi vào localStorage theo từng khối
  const savePaper = (paper: ExamPaper | null, gradeOverride?: string) => {
    setExamPaper(paper);
    if (paper) {
      const g = gradeOverride || String(paper.config?.grade || activeGrade).replace(/\D/g, '') || '9';
      try {
        localStorage.setItem(getGradeStorageKey(g), JSON.stringify(paper));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(paper));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Đồng bộ khối khi prop activePpct thay đổi từ ngoài
  useEffect(() => {
    const norm = String(activePpct?.grade || '').replace(/\D/g, '');
    if (norm && norm !== activeGrade) {
      handleSelectGrade(norm);
    }
  }, [activePpct?.grade]);

  // Auto-generate a default exam paper on first visit if none exists
  useEffect(() => {
    if (!examPaper) {
      const defaultPaper = generateExamPaperFromMatrix(
        { ...matrixConfig, grade: activeGrade },
        matrixConfig.grade === activeGrade ? matrixRows : [],
        matrixConfig.grade === activeGrade ? specRows : [],
        activeGradePpct,
        'giua_ky',
        '101',
        sgkBooks,
        uploadedQuestions
      );
      savePaper(defaultPaper, activeGrade);
    }
  }, []);

  // Chuyển khối lớp và đồng bộ ngay đề thi + câu hỏi theo khối
  const handleSelectGrade = (targetGrade: string) => {
    const normGrade = String(targetGrade).replace(/\D/g, '') || '9';
    if (normGrade === activeGrade && examPaper) return;

    setActiveGrade(normGrade);

    // Đồng bộ active dataset trong App nếu có callback
    const targetDataset =
      (activePpct && String(activePpct.grade || '').replace(/\D/g, '') === normGrade)
        ? activePpct
        : datasets?.find((d) => String(d.grade || '').replace(/\D/g, '') === normGrade) ||
          defaultDatasets.find((d) => String(d.grade || '').replace(/\D/g, '') === normGrade) ||
          defaultPpctDataset9;

    if (onSelectDataset && targetDataset) {
      onSelectDataset(targetDataset.id);
    }

    // Kiểm tra đề đã lưu của khối này
    try {
      const saved = localStorage.getItem(getGradeStorageKey(normGrade));
      if (saved) {
        const parsed: ExamPaper = JSON.parse(saved);
        setExamPaper(parsed);
        setSyncToast(`Đã chuyển sang Khối ${normGrade}: Nội dung và ngân hàng câu hỏi được đồng bộ theo Khối ${normGrade}!`);
        setTimeout(() => setSyncToast(null), 3500);
        return;
      }
    } catch (e) {
      console.error(e);
    }

    // Nếu chưa có, tạo đề thi mới chuẩn xác theo khối được chọn
    const targetMatrixConfig: MatrixConfig = {
      ...matrixConfig,
      grade: normGrade,
    };
    const targetRows = (matrixConfig.grade === normGrade && matrixRows.length > 0) ? matrixRows : [];
    const targetSpecRows = (matrixConfig.grade === normGrade && specRows.length > 0) ? specRows : [];

    const newPaper = generateExamPaperFromMatrix(
      targetMatrixConfig,
      targetRows,
      targetSpecRows,
      targetDataset,
      'giua_ky',
      '101',
      sgkBooks,
      uploadedQuestions
    );
    savePaper(newPaper, normGrade);
    setSyncToast(`Đã chuyển sang Khối ${normGrade}: Nội dung kiến thức và ngân hàng câu hỏi đã đồng bộ theo Khối ${normGrade}!`);
    setTimeout(() => setSyncToast(null), 3500);
  };

  // Sync whenever examSyncTimestamp updates from Matrix tab
  useEffect(() => {
    if (examSyncTimestamp && examSyncTimestamp > 0) {
      const isFinal = matrixConfig.examPeriod.toLowerCase().includes('cuối');
      const synced = generateExamPaperFromMatrix(
        matrixConfig,
        matrixRows,
        specRows,
        activePpct,
        isFinal ? 'cuoi_ky' : 'giua_ky',
        examPaper?.config.examCode || '101',
        sgkBooks,
        uploadedQuestions
      );
      savePaper(synced);
      setSyncToast(`Đã đồng bộ thành công đề thi & đáp án theo Ma trận ${matrixConfig.examPeriod}!`);
      const timer = setTimeout(() => setSyncToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [examSyncTimestamp]);

  // Re-sync from current matrix explicitly
  const handleManualSyncMatrix = () => {
    const targetGrade = activeGrade;
    const targetDataset = activeGradePpct;
    const isFinal = matrixConfig.examPeriod.toLowerCase().includes('cuối');
    const isKttx = matrixConfig.examPeriod.toLowerCase().includes('thường xuyên');
    const level: ExamLevelType = isKttx ? 'kttx' : isFinal ? 'cuoi_ky' : 'giua_ky';

    const targetMatrixConfig = { ...matrixConfig, grade: targetGrade };
    const targetRows = (matrixConfig.grade === targetGrade && matrixRows.length > 0) ? matrixRows : [];
    const targetSpecRows = (matrixConfig.grade === targetGrade && specRows.length > 0) ? specRows : [];

    const synced = generateExamPaperFromMatrix(
      targetMatrixConfig,
      targetRows,
      targetSpecRows,
      targetDataset,
      level,
      examPaper?.config.examCode || '101',
      sgkBooks,
      uploadedQuestions
    );
    savePaper(synced, targetGrade);
    setSyncToast(`Đã tái lập và đồng bộ toàn diện Đề thi & Đáp án Toán ${targetGrade} theo Ma trận!`);
    const timer = setTimeout(() => setSyncToast(null), 4000);
  };

  // Kiểm tra xem đề thi hiện tại có bao gồm kiến thức Xác suất & Thống kê hay không
  const paperHasProbStats = useMemo(() => {
    if (!examPaper) return true;
    if (examPaper.config.selectedTopics && examPaper.config.selectedTopics.length > 0) {
      return hasProbStatsInTopics(examPaper.config.selectedTopics);
    }
    if (examPaper.config.mode === 'matrix_aligned' && matrixRows.length > 0) {
      return matrixRows.some(
        (r) => isProbStatsText(r.chuong || '') || isProbStatsText(r.noiDung || '')
      );
    }
    return examPaper.questions.some((q) => isProbStatsQuestion(q));
  }, [examPaper, matrixRows]);

  // Handler for Quick Generator buttons
  const handleQuickGenerate = (level: ExamLevelType | 'kttx_tn' | 'kttx_tl') => {
    const targetGrade = activeGrade;
    const targetDataset = activeGradePpct;

    if (level === 'kttx' || level === 'kttx_tn') {
      const newPaper = generateCustomExamPaper(
        {
          examLevel: 'kttx',
          title: `ĐỀ KIỂM TRA THƯỜNG XUYÊN 15 PHÚT - TOÁN ${targetGrade} (100% TRẮC NGHIỆM)`,
          schoolName: 'TRƯỜNG THCS VÀ THPT PHÚ THÀNH',
          department: 'TỔ TOÁN - TIN HỌC',
          academicYear: '2026 - 2027',
          durationMinutes: 15,
          format: 'tn_only',
          countPart1Mcq: 10,
          scorePerMcq: 1.0,
          countPart2Tf: 0,
          countPart3Short: 0,
          countPart4Essay: 0,
          ratioTn: 100,
          ratioTl: 0,
          weekFrom: 1,
          weekTo: 4,
          subject: targetDataset.subject || 'Toán',
          grade: targetGrade,
        },
        targetDataset,
        sgkBooks,
        uploadedQuestions
      );
      savePaper(newPaper, targetGrade);
      setSyncToast(`Đã tạo đề KTTX Toán ${targetGrade} 100% Trắc nghiệm (70% Nhận biết, 30% Thông hiểu)!`);
      setTimeout(() => setSyncToast(null), 3500);
    } else if (level === 'kttx_tl') {
      const newPaper = generateCustomExamPaper(
        {
          examLevel: 'kttx',
          title: `ĐỀ KIỂM TRA THƯỜNG XUYÊN 15 PHÚT - TOÁN ${targetGrade} (100% TỰ LUẬN)`,
          schoolName: 'TRƯỜNG THCS VÀ THPT PHÚ THÀNH',
          department: 'TỔ TOÁN - TIN HỌC',
          academicYear: '2026 - 2027',
          durationMinutes: 15,
          format: 'tl_only',
          countPart1Mcq: 0,
          countPart2Tf: 0,
          countPart3Short: 0,
          countPart4Essay: 3,
          ratioTn: 0,
          ratioTl: 100,
          weekFrom: 1,
          weekTo: 4,
          subject: targetDataset.subject || 'Toán',
          grade: targetGrade,
        },
        targetDataset,
        sgkBooks,
        uploadedQuestions
      );
      savePaper(newPaper, targetGrade);
      setSyncToast(`Đã tạo đề KTTX Toán ${targetGrade} 100% Tự luận (Đầy đủ lời giải và thang điểm chi tiết)!`);
      setTimeout(() => setSyncToast(null), 3500);
    } else {
      // Giữa kì hoặc Cuối kì: Chuẩn Ma trận & YCCĐ
      const targetMatrixConfig = { ...matrixConfig, grade: targetGrade };
      const targetRows = (matrixConfig.grade === targetGrade && matrixRows.length > 0) ? matrixRows : [];
      const targetSpecRows = (matrixConfig.grade === targetGrade && specRows.length > 0) ? specRows : [];

      const newPaper = generateExamPaperFromMatrix(
        targetMatrixConfig,
        targetRows,
        targetSpecRows,
        targetDataset,
        level,
        '101',
        sgkBooks,
        uploadedQuestions
      );
      savePaper(newPaper, targetGrade);
      const examName = level === 'cuoi_ky' ? 'Cuối kỳ' : 'Giữa kỳ';
      setSyncToast(`Đã tạo đề ${examName} Toán ${targetGrade} theo chuẩn Ma trận & YCCĐ!`);
      setTimeout(() => setSyncToast(null), 3500);
    }
  };

  // Handler for applying new config from Modal
  const handleApplyConfig = (newConfig: ExamPaperConfig, generateNew: boolean) => {
    const targetGrade = String(newConfig.grade || activeGrade).replace(/\D/g, '') || '9';
    if (targetGrade !== activeGrade) {
      setActiveGrade(targetGrade);
    }

    const targetDataset =
      (activePpct && String(activePpct.grade || '').replace(/\D/g, '') === targetGrade)
        ? activePpct
        : datasets?.find((d) => String(d.grade || '').replace(/\D/g, '') === targetGrade) ||
          defaultDatasets.find((d) => String(d.grade || '').replace(/\D/g, '') === targetGrade) ||
          defaultPpctDataset9;

    if (generateNew) {
      let newPaper: ExamPaper;
      if (newConfig.mode === 'matrix_aligned') {
        const targetMatrixConfig = { ...matrixConfig, grade: targetGrade };
        const targetRows = (matrixConfig.grade === targetGrade && matrixRows.length > 0) ? matrixRows : [];
        const targetSpecRows = (matrixConfig.grade === targetGrade && specRows.length > 0) ? specRows : [];

        newPaper = generateExamPaperFromMatrix(
          targetMatrixConfig,
          targetRows,
          targetSpecRows,
          targetDataset,
          newConfig.examLevel,
          newConfig.examCode,
          sgkBooks,
          uploadedQuestions
        );
        newPaper = {
          ...newPaper,
          config: {
            ...newPaper.config,
            ...newConfig,
            grade: targetGrade,
          },
        };
      } else {
        newPaper = generateCustomExamPaper(
          { ...newConfig, grade: targetGrade },
          targetDataset,
          sgkBooks,
          uploadedQuestions
        );
      }
      savePaper(newPaper, targetGrade);
      setSyncToast(`Đã áp dụng cấu hình và tạo mới đề thi Toán ${targetGrade}!`);
      setTimeout(() => setSyncToast(null), 3500);
    } else if (examPaper) {
      savePaper({
        ...examPaper,
        config: {
          ...newConfig,
          grade: targetGrade,
        },
      }, targetGrade);
    }
  };

  // Shuffle paper (xáo trộn câu hỏi và tạo mã đề mới)
  const handleShuffle = (newCode: string) => {
    if (!examPaper) return;
    const shuffled = shuffleExamPaper(examPaper, newCode);
    savePaper(shuffled);
  };

  // Sửa câu hỏi
  const handleSaveQuestion = (updated: ExamQuestion) => {
    if (!examPaper) return;
    const updatedQuestions = examPaper.questions.map((q) => (q.id === updated.id ? updated : q));
    const newSummary = calculateAlignmentSummary(updatedQuestions);
    savePaper({
      ...examPaper,
      questions: updatedQuestions,
      matrixAlignmentSummary: newSummary,
    });
    setSyncToast(`Đã lưu thay đổi cho câu hỏi ${updated.code}!`);
    setTimeout(() => setSyncToast(null), 3000);
  };

  // Thay đổi mức độ nhận thức của câu hỏi thủ công
  const handleChangeQuestionLevel = (
    questionId: string,
    newLevel: 'nhanBiet' | 'thongHieu' | 'vanDung' | 'vanDungCao'
  ) => {
    if (!examPaper) return;
    const levelLabels: Record<string, string> = {
      nhanBiet: 'Nhận biết',
      thongHieu: 'Thông hiểu',
      vanDung: 'Vận dụng',
      vanDungCao: 'Vận dụng cao',
    };

    const updatedQuestions = examPaper.questions.map((q) => {
      if (q.id === questionId) {
        return {
          ...q,
          cognitiveLevel: newLevel,
          cognitiveLevelLabel: levelLabels[newLevel],
        };
      }
      return q;
    });

    const newSummary = calculateAlignmentSummary(updatedQuestions);
    savePaper({
      ...examPaper,
      questions: updatedQuestions,
      matrixAlignmentSummary: newSummary,
    });

    setSyncToast(`Đã chuyển mức độ câu hỏi sang "${levelLabels[newLevel]}"!`);
    setTimeout(() => setSyncToast(null), 3500);
  };

  // Thêm nhiều câu hỏi cùng mức độ từ một câu tham chiếu
  const handleAddQuestionsSameLevel = (referenceQuestion: ExamQuestion, count: number = 1) => {
    if (!examPaper) return;
    const currentGrade = examPaper.config.grade || activePpct.grade || '9';
    const newQuestions: ExamQuestion[] = [];
    const pool = [...examPaper.questions];

    for (let i = 0; i < count; i++) {
      const newQ = createNewQuestionWithLevel(
        referenceQuestion,
        [...pool, ...newQuestions],
        referenceQuestion.cognitiveLevel,
        currentGrade
      );
      newQuestions.push(newQ);
    }

    const refIdx = examPaper.questions.findIndex((q) => q.id === referenceQuestion.id);
    const updated = [...examPaper.questions];
    if (refIdx !== -1) {
      updated.splice(refIdx + 1, 0, ...newQuestions);
    } else {
      updated.push(...newQuestions);
    }

    const reIndexed = updated.map((q, idx) => ({ ...q, code: `[C${idx + 1}]` }));
    const newSummary = calculateAlignmentSummary(reIndexed);

    savePaper({
      ...examPaper,
      questions: reIndexed,
      matrixAlignmentSummary: newSummary,
    });

    setSyncToast(
      `Đã thêm ${count} câu hỏi cùng mức độ "${referenceQuestion.cognitiveLevelLabel || referenceQuestion.cognitiveLevel}" vào đề!`
    );
    setTimeout(() => setSyncToast(null), 3500);
  };

  // Thêm nhiều câu hỏi theo mức độ vào một Phần cụ thể (Part I, II, III, IV)
  const handleAddQuestionsToSection = (
    section: 'part1_mcq' | 'part2_true_false' | 'part3_short_answer' | 'part4_essay',
    level: 'nhanBiet' | 'thongHieu' | 'vanDung' | 'vanDungCao',
    count: number = 1
  ) => {
    if (!examPaper) return;
    const currentGrade = examPaper.config.grade || activePpct.grade || '9';

    const sampleQuestion = examPaper.questions.find((q) => q.section === section);
    const baseQuestion: ExamQuestion = sampleQuestion || {
      id: '',
      code: '',
      section,
      type:
        section === 'part1_mcq'
          ? 'mcq_single'
          : section === 'part2_true_false'
          ? 'true_false'
          : section === 'part3_short_answer'
          ? 'short_answer'
          : 'essay',
      chapter: 'Toán học',
      lesson: 'Kiến thức trọng tâm',
      cognitiveLevel: level,
      score:
        section === 'part1_mcq'
          ? matrixConfig.scorePerTn1 || 0.25
          : section === 'part2_true_false'
          ? matrixConfig.scorePerTn2 || 1.0
          : section === 'part3_short_answer'
          ? matrixConfig.scorePerTn3 || 0.5
          : 1.0,
      prompt: '',
    };

    const newQuestions: ExamQuestion[] = [];
    const pool = [...examPaper.questions];

    for (let i = 0; i < count; i++) {
      const newQ = createNewQuestionWithLevel(
        baseQuestion,
        [...pool, ...newQuestions],
        level,
        currentGrade
      );
      newQuestions.push(newQ);
    }

    let lastSectionIdx = -1;
    for (let i = examPaper.questions.length - 1; i >= 0; i--) {
      if (examPaper.questions[i].section === section) {
        lastSectionIdx = i;
        break;
      }
    }

    const updated = [...examPaper.questions];
    if (lastSectionIdx !== -1) {
      updated.splice(lastSectionIdx + 1, 0, ...newQuestions);
    } else {
      updated.push(...newQuestions);
    }

    const reIndexed = updated.map((q, idx) => ({ ...q, code: `[C${idx + 1}]` }));
    const newSummary = calculateAlignmentSummary(reIndexed);

    savePaper({
      ...examPaper,
      questions: reIndexed,
      matrixAlignmentSummary: newSummary,
    });

    const levelLabels: Record<string, string> = {
      nhanBiet: 'Nhận biết',
      thongHieu: 'Thông hiểu',
      vanDung: 'Vận dụng',
      vanDungCao: 'Vận dụng cao',
    };

    setSyncToast(`Đã thêm ${count} câu hỏi mức độ "${levelLabels[level]}" vào đề thi!`);
    setTimeout(() => setSyncToast(null), 3500);
  };

  // Thêm một câu từ Ngân hàng mẫu gợi ý vào đề
  const handleAddQuestionFromTemplate = (template: BankQuestionTemplate) => {
    if (!examPaper || !suggestingQuestion) return;

    const newQuestion: ExamQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      code: `[C${examPaper.questions.length + 1}]`,
      section: suggestingQuestion.section,
      type: template.type || suggestingQuestion.type,
      chapter: suggestingQuestion.chapter,
      lesson: suggestingQuestion.lesson,
      cognitiveLevel: template.cognitiveLevel,
      cognitiveLevelLabel:
        template.cognitiveLevel === 'nhanBiet'
          ? 'Nhận biết'
          : template.cognitiveLevel === 'thongHieu'
          ? 'Thông hiểu'
          : template.cognitiveLevel === 'vanDung'
          ? 'Vận dụng'
          : 'Vận dụng cao',
      learningObjective: template.learningObjective || suggestingQuestion.learningObjective,
      score: suggestingQuestion.score,
      prompt: template.prompt,
      options: template.options,
      correctOption: template.correctOption,
      tfStatements: template.tfStatements,
      shortAnswerText: template.shortAnswerText,
      essayGradingSteps: template.essayGradingSteps,
      solutionExplanation: template.solutionExplanation,
    };

    const refIdx = examPaper.questions.findIndex((q) => q.id === suggestingQuestion.id);
    const updated = [...examPaper.questions];
    if (refIdx !== -1) {
      updated.splice(refIdx + 1, 0, newQuestion);
    } else {
      updated.push(newQuestion);
    }

    const reIndexed = updated.map((q, idx) => ({ ...q, code: `[C${idx + 1}]` }));
    const newSummary = calculateAlignmentSummary(reIndexed);

    savePaper({
      ...examPaper,
      questions: reIndexed,
      matrixAlignmentSummary: newSummary,
    });

    setSuggestingQuestion(null);
    setSyncToast(`Đã thêm câu mới từ ngân hàng vào đề thi!`);
    setTimeout(() => setSyncToast(null), 3500);
  };

  // Đổi câu hỏi tương đương từ ngân hàng
  const handleRegenerateEquivalent = (question: ExamQuestion) => {
    if (!examPaper) return;
    const currentGrade = activeGrade;
    const replaced = regenerateSingleQuestion(
      question,
      examPaper.questions,
      currentGrade,
      uploadedQuestions,
      paperHasProbStats
    );
    const updatedQuestions = examPaper.questions.map((q) => (q.id === question.id ? replaced : q));
    savePaper({
      ...examPaper,
      questions: updatedQuestions,
    }, currentGrade);
  };

  // Xóa câu hỏi
  const handleDeleteQuestion = (id: string) => {
    if (!examPaper) return;
    const filtered = examPaper.questions.filter((q) => q.id !== id);
    // Đánh lại số thứ tự câu
    const reIndexed = filtered.map((q, idx) => ({ ...q, code: `[C${idx + 1}]` }));
    savePaper({
      ...examPaper,
      questions: reIndexed,
    }, activeGrade);
  };

  // Thay thế câu hỏi từ Ngân hàng gợi ý và tự động cập nhật đáp án
  const handleSelectReplacementTemplate = (selected: BankQuestionTemplate) => {
    if (!examPaper || !suggestingQuestion) return;

    const newQuestion: ExamQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      code: suggestingQuestion.code,
      section: suggestingQuestion.section,
      type: selected.type || suggestingQuestion.type,
      chapter: suggestingQuestion.chapter,
      lesson: suggestingQuestion.lesson,
      cognitiveLevel: selected.cognitiveLevel,
      cognitiveLevelLabel:
        selected.cognitiveLevel === 'nhanBiet'
          ? 'Nhận biết'
          : selected.cognitiveLevel === 'thongHieu'
          ? 'Thông hiểu'
          : selected.cognitiveLevel === 'vanDung'
          ? 'Vận dụng'
          : 'Vận dụng cao',
      learningObjective: selected.learningObjective || suggestingQuestion.learningObjective,
      score: suggestingQuestion.score,
      prompt: selected.prompt,
      options: selected.options,
      correctOption: selected.correctOption,
      tfStatements: selected.tfStatements,
      shortAnswerText: selected.shortAnswerText,
      essayGradingSteps: selected.essayGradingSteps,
      solutionExplanation: selected.solutionExplanation,
      source: selected.source || (selected.id ? 'uploaded' : 'ai_system'),
      sourceQuestionId: selected.id,
    };

    const updatedQuestions = examPaper.questions.map((q) =>
      q.id === suggestingQuestion.id ? newQuestion : q
    );

    savePaper({
      ...examPaper,
      questions: updatedQuestions,
    }, activeGrade);

    setSuggestingQuestion(null);
    setSyncToast(`Đã thay đổi ${suggestingQuestion.code} và tự động cập nhật đáp án mới!`);
  };

  // Đổi mới toàn bộ đề và đáp án theo Ma trận hiện tại
  const handleRegenerateWholeExam = () => {
    if (!examPaper) return;
    const currentGrade = activeGrade;
    const currentDataset = activeGradePpct;
    let newPaper: ExamPaper;
    if (examPaper.config.mode === 'matrix_aligned') {
      const targetMatrixConfig = { ...matrixConfig, grade: currentGrade };
      const targetRows = (matrixConfig.grade === currentGrade && matrixRows.length > 0) ? matrixRows : [];
      const targetSpecRows = (matrixConfig.grade === currentGrade && specRows.length > 0) ? specRows : [];

      newPaper = generateExamPaperFromMatrix(
        targetMatrixConfig,
        targetRows,
        targetSpecRows,
        currentDataset,
        examPaper.config.levelType || 'giua_ky',
        examPaper.config.examCode || '101',
        sgkBooks,
        uploadedQuestions
      );
      newPaper = {
        ...newPaper,
        config: {
          ...newPaper.config,
          title: examPaper.config.title,
          schoolName: examPaper.config.schoolName,
          department: examPaper.config.department,
          durationMinutes: examPaper.config.durationMinutes,
          examCode: examPaper.config.examCode,
          grade: currentGrade,
        },
      };
    } else {
      newPaper = generateCustomExamPaper(
        { ...examPaper.config, grade: currentGrade },
        currentDataset,
        sgkBooks,
        uploadedQuestions
      );
    }
    savePaper(newPaper, currentGrade);
    setSyncToast(`Đã đổi mới toàn bộ đề Toán ${currentGrade} và cập nhật toàn bộ đáp án chuẩn xác!`);
  };

  // Đổi mới một Phần cụ thể (I, II, III, IV) và cập nhật đáp án tương ứng
  const handleRegenerateSection = (section: 'part1_mcq' | 'part2_true_false' | 'part3_short_answer' | 'part4_essay') => {
    if (!examPaper) return;
    const currentGrade = activeGrade;
    const currentQuestions = [...examPaper.questions];
    const updatedQuestions = currentQuestions.map((q) => {
      if (q.section === section) {
        return regenerateSingleQuestion(q, currentQuestions, currentGrade, uploadedQuestions);
      }
      return q;
    });
    savePaper({
      ...examPaper,
      questions: updatedQuestions,
    }, currentGrade);
    const sectionLabel =
      section === 'part1_mcq'
        ? 'Phần I'
        : section === 'part2_true_false'
        ? 'Phần II'
        : section === 'part3_short_answer'
        ? 'Phần III'
        : 'Phần IV';
    setSyncToast(`Đã đổi mới tất cả câu hỏi ${sectionLabel} và cập nhật đáp án tương ứng!`);
  };

  // Đổi mới nhiều câu hỏi được chọn cùng lúc và cập nhật đáp án
  const handleRegenerateMultipleQuestions = (questionIds: string[]) => {
    if (!examPaper || questionIds.length === 0) return;
    const currentGrade = activeGrade;
    const idSet = new Set(questionIds);
    const currentQuestions = [...examPaper.questions];
    const updatedQuestions = currentQuestions.map((q) => {
      if (idSet.has(q.id)) {
        return regenerateSingleQuestion(q, currentQuestions, currentGrade, uploadedQuestions);
      }
      return q;
    });
    savePaper({
      ...examPaper,
      questions: updatedQuestions,
    }, currentGrade);
    setSyncToast(`Đã đổi mới ${questionIds.length} câu hỏi và cập nhật đáp án tương ứng!`);
  };

  // Đổi số liệu toán học một câu hỏi và tự động tính lại, đồng bộ đáp án
  const handleNumericVariation = (question: ExamQuestion) => {
    if (!examPaper) return;
    const variant = generateQuestionNumericVariant(question);
    const updatedQuestions = examPaper.questions.map((q) => (q.id === question.id ? variant : q));
    savePaper({
      ...examPaper,
      questions: updatedQuestions,
    }, activeGrade);
    setSyncToast(`Đã đổi số liệu ${question.code || 'câu hỏi'} và tự động cập nhật, đồng bộ đáp án chính xác!`);
    setTimeout(() => setSyncToast(null), 3500);
  };

  // Đổi số liệu toán học toàn bộ đề thi và tự động tính toán, đồng bộ toàn bộ đáp án
  const handleNumericVariationAll = () => {
    if (!examPaper) return;
    const updatedQuestions = examPaper.questions.map((q) => generateQuestionNumericVariant(q));
    savePaper({
      ...examPaper,
      questions: updatedQuestions,
    }, activeGrade);
    setSyncToast('Đã đổi số liệu toàn bộ đề thi và tự động đồng bộ tất cả đáp án/thang điểm!');
    setTimeout(() => setSyncToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Sync Toast Notification */}
      {syncToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{syncToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-0.5"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Top Banner & Quick Actions */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
            <FileText size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Tạo Đề Kiểm Tra & Đánh Giá
              </h2>
              {examPaper?.config.mode === 'matrix_aligned' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Chuẩn Ma trận & YCCĐ
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Tùy chỉnh linh hoạt
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Kiểm tra thường xuyên, Giữa kỳ, Cuối kỳ • Xuất Word (.docx), In ấn chuẩn Bộ GD&ĐT
            </p>
          </div>
        </div>

        {/* Fast presets buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleQuickGenerate('kttx_tn')}
            title="Kiểm tra thường xuyên 100% Trắc nghiệm (70% Nhận biết, 30% Thông hiểu)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
          >
            <Zap size={14} className="text-amber-500" />
            KTTX 100% Trắc nghiệm
          </button>

          <button
            type="button"
            onClick={() => handleQuickGenerate('kttx_tl')}
            title="Kiểm tra thường xuyên 100% Tự luận (Đầy đủ đáp án và thang điểm)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-colors"
          >
            <FileText size={14} className="text-amber-600" />
            KTTX 100% Tự luận
          </button>

          <button
            type="button"
            onClick={() => handleQuickGenerate('giua_ky')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
          >
            <CheckCircle2 size={14} className="text-emerald-600" />
            Đề Giữa kỳ (Theo Ma trận)
          </button>

          <button
            type="button"
            onClick={() => handleQuickGenerate('cuoi_ky')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors"
          >
            <CheckCircle2 size={14} className="text-purple-600" />
            Đề Cuối kỳ (Theo Ma trận)
          </button>

          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Sliders size={14} />
            Tùy biến số câu & hình thức
          </button>

          <button
            type="button"
            onClick={() => setIsQuestionBankModalOpen(true)}
            title="Tải lên câu hỏi làm ngân hàng tham khảo kết hợp với AI soạn đề (Phân loại khối 6-9)"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Sparkles size={14} className="text-blue-600" />
            <span>Ngân hàng câu hỏi ({uploadedQuestions.length})</span>
            {uploadedForActiveGrade.length > 0 && (
              <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                K{activeGrade}: {uploadedForActiveGrade.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Thanh chuyển đổi và đồng bộ Khối lớp soạn đề */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>Đồng bộ Khối lớp Soạn đề:</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[11px] font-extrabold border border-indigo-200">
                Toán Khối {activeGrade}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chọn khối để đồng bộ tức thì nội dung chương bài, SGK và chỉ nạp câu hỏi của riêng Khối {activeGrade}, ngăn chặn tuyệt đối tình trạng lẫn lộn.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shrink-0">
          {(['6', '7', '8', '9'] as const).map((gradeNum) => {
            const countForGrade = uploadedQuestions.filter(
              (q) => (String(q.grade || '').replace(/\D/g, '') || '9') === gradeNum
            ).length;
            const isSelected = activeGrade === gradeNum;
            return (
              <button
                key={gradeNum}
                type="button"
                onClick={() => handleSelectGrade(gradeNum)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <span>Khối {gradeNum}</span>
                {countForGrade > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {countForGrade}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bảng liên thông trực tiếp Ma trận & Bảng đặc tả */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-indigo-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Liên thông đồng bộ Ma trận (PL I) & Bảng đặc tả (PL II)
              </span>
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{matrixConfig.examPeriod || 'Kiểm tra Giữa kì I'}</span>
              <span className="text-xs font-normal text-indigo-200">
                (Môn {matrixConfig.subject || activeGradePpct.subject} {activeGrade} • Tuần {matrixConfig.limitWeekFrom || 1} đến {matrixConfig.limitWeekTo || 9})
              </span>
            </h3>
            <p className="text-xs text-indigo-200 max-w-2xl">
              Căn cứ chính xác theo Khung Ma trận {matrixRows.length} bài học và Bảng đặc tả Yêu cầu cần đạt Khối {activeGrade}. Mọi thay đổi trong Ma trận được liên thông tự động vào Đề thi & Đáp án.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleManualSyncMatrix}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-950 bg-amber-300 hover:bg-amber-400 rounded-xl shadow-xs transition-colors"
              title="Tải lại toàn bộ câu hỏi bám sát Ma trận và Bảng đặc tả hiện hành"
            >
              <RefreshCw size={14} />
              Đồng bộ lại theo Ma trận
            </button>

            <button
              type="button"
              onClick={onOpenMatrixTab}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-700/80 hover:bg-indigo-700 border border-indigo-500/50 rounded-xl transition-colors"
              title="Quay lại tab Ma trận đề & Bảng đặc tả"
            >
              <BookOpen size={14} />
              Xem Ma trận & Đặc tả
            </button>
          </div>
        </div>

        {/* 4 Dạng câu hỏi breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-indigo-700/60">
          <div className="bg-indigo-950/50 rounded-xl p-2.5 border border-indigo-700/40">
            <div className="text-[11px] text-indigo-300 font-medium">Dạng I: Trắc nghiệm 4 lựa chọn</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {examPaper?.questions.filter((q) => q.section === 'part1_mcq').length || 0} câu
              <span className="text-xs font-normal text-indigo-300 ml-1.5">
                ({((examPaper?.questions.filter((q) => q.section === 'part1_mcq').length || 0) * (matrixConfig.scorePerTn1 || 0.25)).toFixed(2)}đ)
              </span>
            </div>
          </div>

          <div className="bg-indigo-950/50 rounded-xl p-2.5 border border-indigo-700/40">
            <div className="text-[11px] text-indigo-300 font-medium">Dạng II: Trắc nghiệm Đúng/Sai</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {examPaper?.questions.filter((q) => q.section === 'part2_true_false').length || 0} câu
              <span className="text-xs font-normal text-indigo-300 ml-1.5">
                ({((examPaper?.questions.filter((q) => q.section === 'part2_true_false').length || 0) * (matrixConfig.scorePerTn2 || 1.0)).toFixed(2)}đ)
              </span>
            </div>
          </div>

          <div className="bg-indigo-950/50 rounded-xl p-2.5 border border-indigo-700/40">
            <div className="text-[11px] text-indigo-300 font-medium">Dạng III: Trả lời ngắn</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {examPaper?.questions.filter((q) => q.section === 'part3_short_answer').length || 0} câu
              <span className="text-xs font-normal text-indigo-300 ml-1.5">
                ({((examPaper?.questions.filter((q) => q.section === 'part3_short_answer').length || 0) * (matrixConfig.scorePerTn3 || 0.5)).toFixed(2)}đ)
              </span>
            </div>
          </div>

          <div className="bg-indigo-950/50 rounded-xl p-2.5 border border-indigo-700/40">
            <div className="text-[11px] text-indigo-300 font-medium">Dạng IV: Bài toán Tự luận</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {examPaper?.questions.filter((q) => q.section === 'part4_essay').length || 0} bài
              <span className="text-xs font-normal text-indigo-300 ml-1.5">
                ({(examPaper?.questions.filter((q) => q.section === 'part4_essay').reduce((s, q) => s + q.score, 0) || 0).toFixed(2)}đ)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Exam View */}
      {examPaper ? (
        <ExamPaperView
          paper={examPaper}
          matrixConfig={matrixConfig}
          matrixRows={matrixRows}
          specRows={specRows}
          onShuffleExam={handleShuffle}
          onOpenConfig={() => setIsConfigModalOpen(true)}
          onEditQuestion={(q) => setEditingQuestion(q)}
          onRegenerateEquivalent={handleRegenerateEquivalent}
          onOpenSuggestions={(q) => setSuggestingQuestion(q)}
          onRegenerateWholeExam={handleRegenerateWholeExam}
          onRegenerateSection={handleRegenerateSection}
          onRegenerateMultipleQuestions={handleRegenerateMultipleQuestions}
          onChangeQuestionLevel={handleChangeQuestionLevel}
          onAddQuestionsSameLevel={handleAddQuestionsSameLevel}
          onAddQuestionsToSection={handleAddQuestionsToSection}
          onNumericVariation={handleNumericVariation}
          onNumericVariationAll={handleNumericVariationAll}
        />
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Chưa có đề thi nào được khởi tạo
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Thầy/Cô có thể tạo đề tự động theo Ma trận & Yêu cầu cần đạt, hoặc tạo nhanh đề kiểm tra thường xuyên 100% trắc nghiệm (70% NB, 30% TH) hoặc 100% tự luận.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => handleQuickGenerate('giua_ky')}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Tạo đề Giữa kỳ theo Ma trận
            </button>
            <button
              type="button"
              onClick={() => handleQuickGenerate('kttx_tn')}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              KTTX 100% Trắc nghiệm (70% NB - 30% TH)
            </button>
            <button
              type="button"
              onClick={() => handleQuickGenerate('kttx_tl')}
              className="px-4 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl"
            >
              KTTX 100% Tự luận (Có barem)
            </button>
          </div>
        </div>
      )}

      {/* Modal Tùy chỉnh cấu hình đề */}
      {isConfigModalOpen && examPaper && (
        <ExamConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          initialConfig={examPaper.config}
          matrixConfig={{ ...matrixConfig, grade: activeGrade }}
          ppctDataset={activeGradePpct}
          onApplyConfig={handleApplyConfig}
        />
      )}

      {/* Modal Chọn câu hỏi thay thế từ Ngân hàng gợi ý chuẩn YCCĐ */}
      {suggestingQuestion && (
        <ExamQuestionPickerModal
          isOpen={!!suggestingQuestion}
          question={suggestingQuestion}
          grade={activeGrade}
          customBank={uploadedForActiveGrade}
          allowProbStats={paperHasProbStats}
          onClose={() => setSuggestingQuestion(null)}
          onSelectReplacement={handleSelectReplacementTemplate}
          onRegenerateEquivalent={handleRegenerateEquivalent}
          onAddAsNewQuestion={handleAddQuestionFromTemplate}
        />
      )}

      {/* Modal Chỉnh sửa câu hỏi đơn */}
      {editingQuestion && (
        <ExamQuestionEditModal
          isOpen={!!editingQuestion}
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSave={handleSaveQuestion}
          onRegenerateEquivalent={handleRegenerateEquivalent}
          onDelete={handleDeleteQuestion}
        />
      )}

      {/* Modal Quản lý Ngân hàng câu hỏi tham khảo tải lên kết hợp AI */}
      <QuestionBankManagerModal
        isOpen={isQuestionBankModalOpen}
        onClose={() => setIsQuestionBankModalOpen(false)}
        initialGrade={activeGrade}
        onSaveQuestions={(newBank) => {
          setUploadedQuestions(newBank);
          setSyncToast(`Đã lưu ${newBank.length} câu hỏi vào Ngân hàng tham khảo. Sẵn sàng kết hợp AI soạn đề!`);
          setTimeout(() => setSyncToast(null), 4000);
        }}
      />
    </div>
  );
};
