import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { BankQuestionTemplate } from '../types';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

const STORAGE_KEY = 'tientrinh_uploaded_question_bank_v2';

/**
 * LẤY DANH SÁCH CÂU HỎI ĐÃ TẢI LÊN TỪ LOCAL STORAGE
 */
export function getStoredUploadedQuestions(): BankQuestionTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Không thể đọc ngân hàng câu hỏi từ localStorage:', err);
    return [];
  }
}

/**
 * LƯU CÂU HỎI VÀO LOCAL VÀ TỰ ĐỘNG ĐỒNG BỘ ĐÁM MÂY (NẾU ĐÃ ĐĂNG NHẬP)
 */
export async function saveUploadedQuestions(
  questions: BankQuestionTemplate[],
  userId?: string
): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
    } catch (err) {
      console.warn('Không thể lưu ngân hàng câu hỏi vào localStorage:', err);
    }
  }

  const effectiveUid = userId || auth.currentUser?.uid;
  if (effectiveUid) {
    await syncQuestionBankToCloud(effectiveUid, questions).catch((err) => {
      console.warn('Lỗi khi đồng bộ ngân hàng câu hỏi lên Firebase:', err);
    });
  }
}

/**
 * ĐỒNG BỘ NGÂN HÀNG CÂU HỎI LÊN FIRESTORE
 */
export async function syncQuestionBankToCloud(
  userId: string,
  questions: BankQuestionTemplate[]
): Promise<void> {
  const path = `users/${userId}/question_bank/main`;
  try {
    const docRef = doc(db, 'users', userId, 'question_bank', 'main');
    
    // Thống kê theo khối
    const gradeStats: Record<string, number> = {};
    questions.forEach((q) => {
      const g = q.grade || '9';
      gradeStats[g] = (gradeStats[g] || 0) + 1;
    });

    const payload = {
      ownerId: userId,
      updatedAt: new Date().toISOString(),
      questions,
      gradeStats,
      totalCount: questions.length,
    };

    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    console.error('Lỗi khi lưu ngân hàng câu hỏi lên Firestore:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * TẢI NGÂN HÀNG CÂU HỎI TỪ FIRESTORE
 */
export async function fetchQuestionBankFromCloud(
  userId: string
): Promise<BankQuestionTemplate[]> {
  const path = `users/${userId}/question_bank/main`;
  try {
    const docRef = doc(db, 'users', userId, 'question_bank', 'main');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.questions)) {
        // Cập nhật lại local storage
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.questions));
        }
        return data.questions as BankQuestionTemplate[];
      }
    }
    return [];
  } catch (error) {
    console.error('Lỗi khi tải ngân hàng câu hỏi từ Firestore:', error);
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

/**
 * THÊM CÂU HỎI MỚI VÀO NGÂN HÀNG (TRÁNH TRÙNG LẶP PROMPT)
 */
export async function addQuestionsToBank(
  newQuestions: BankQuestionTemplate[],
  userId?: string
): Promise<BankQuestionTemplate[]> {
  const current = getStoredUploadedQuestions();
  const existingPrompts = new Set(current.map((q) => q.prompt.trim().toLowerCase()));

  const added: BankQuestionTemplate[] = [];
  newQuestions.forEach((nq) => {
    const pKey = nq.prompt.trim().toLowerCase();
    if (!existingPrompts.has(pKey)) {
      existingPrompts.add(pKey);
      added.push({
        ...nq,
        id: nq.id || `up_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        source: 'uploaded',
        createdAt: nq.createdAt || new Date().toISOString(),
      });
    }
  });

  const updated = [...added, ...current];
  await saveUploadedQuestions(updated, userId);
  return updated;
}

/**
 * XÓA MỘT CÂU HỎI
 */
export async function removeQuestionFromBank(
  id: string,
  userId?: string
): Promise<BankQuestionTemplate[]> {
  const current = getStoredUploadedQuestions();
  const updated = current.filter((q) => q.id !== id);
  await saveUploadedQuestions(updated, userId);
  return updated;
}

/**
 * CẬP NHẬT MỘT CÂU HỎI
 */
export async function updateQuestionInBank(
  updatedQuestion: BankQuestionTemplate,
  userId?: string
): Promise<BankQuestionTemplate[]> {
  const current = getStoredUploadedQuestions();
  const updated = current.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q));
  await saveUploadedQuestions(updated, userId);
  return updated;
}

/**
 * XÓA TOÀN BỘ CÂU HỎI
 */
export async function clearUploadedQuestionBank(userId?: string): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  const effectiveUid = userId || auth.currentUser?.uid;
  if (effectiveUid) {
    await syncQuestionBankToCloud(effectiveUid, []).catch(() => {});
  }
}

/**
 * LỌC VÀ TÌM KIẾM CÂU HỎI TRONG NGÂN HÀNG
 */
export function filterQuestions(
  questions: BankQuestionTemplate[],
  filters: {
    grade?: string; // 'all' | '6' | '7' | '8' | '9'
    section?: string; // 'all' | 'part1_mcq' | 'part2_true_false' | 'part3_short_answer' | 'part4_essay'
    cognitiveLevel?: string; // 'all' | 'nhanBiet' | 'thongHieu' | 'vanDung' | 'vanDungCao'
    keyword?: string;
  }
): BankQuestionTemplate[] {
  return questions.filter((q) => {
    if (filters.grade && filters.grade !== 'all' && q.grade !== filters.grade) {
      return false;
    }
    if (filters.section && filters.section !== 'all' && q.section !== filters.section) {
      return false;
    }
    if (
      filters.cognitiveLevel &&
      filters.cognitiveLevel !== 'all' &&
      q.cognitiveLevel !== filters.cognitiveLevel
    ) {
      return false;
    }
    if (filters.keyword && filters.keyword.trim()) {
      const kw = filters.keyword.toLowerCase().trim();
      const matchPrompt = q.prompt.toLowerCase().includes(kw);
      const matchSolution = (q.solutionExplanation || '').toLowerCase().includes(kw);
      const matchTopic = (q.topicKeywords || []).some((t) => t.toLowerCase().includes(kw));
      if (!matchPrompt && !matchSolution && !matchTopic) return false;
    }
    return true;
  });
}

/**
 * XUẤT NGÂN HÀNG CÂU HỎI RA FILE JSON
 */
export function exportQuestionBankToJSON(questions: BankQuestionTemplate[], fileName?: string) {
  const dataStr = JSON.stringify(questions, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  saveAs(blob, fileName || `ngan_hang_cau_hoi_${new Date().toISOString().slice(0, 10)}.json`);
}

/**
 * XUẤT NGÂN HÀNG CÂU HỎI RA FILE WORD (.DOCX)
 */
export async function exportQuestionBankToDocx(
  questions: BankQuestionTemplate[],
  title: string = 'NGÂN HÀNG CÂU HỎI THAM KHẢO'
) {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: title.toUpperCase(),
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Tổng số câu hỏi: ${questions.length} câu • Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,
          italics: true,
          color: '555555',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  ];

  questions.forEach((q, idx) => {
    const cogLabel =
      q.cognitiveLevel === 'nhanBiet'
        ? 'Nhận biết'
        : q.cognitiveLevel === 'thongHieu'
        ? 'Thông hiểu'
        : q.cognitiveLevel === 'vanDung'
        ? 'Vận dụng'
        : 'Vận dụng cao';

    // Header câu hỏi
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Câu ${idx + 1} (Khối ${q.grade} - ${cogLabel}): `,
            bold: true,
            color: '1E3A8A',
          }),
          new TextRun({
            text: q.prompt,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    // Phần 1: Các phương án A, B, C, D
    if (q.section === 'part1_mcq' && q.options) {
      q.options.forEach((opt) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${opt.key}. `,
                bold: true,
                color: opt.key === q.correctOption ? '059669' : '333333',
              }),
              new TextRun({
                text: opt.text,
              }),
            ],
            indent: { left: 400 },
            spacing: { after: 60 },
          })
        );
      });
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: '=> Đáp án đúng: ', bold: true, color: '059669' }),
            new TextRun({ text: `${q.correctOption}. ${q.solutionExplanation || ''}`, italics: true }),
          ],
          indent: { left: 400 },
          spacing: { after: 150 },
        })
      );
    }

    // Phần 2: Đúng / Sai
    if (q.section === 'part2_true_false' && q.tfStatements) {
      q.tfStatements.forEach((tf) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${tf.subKey}) `, bold: true }),
              new TextRun({ text: `${tf.text} ` }),
              new TextRun({
                text: `[${tf.isCorrect ? 'ĐÚNG' : 'SAI'}]`,
                bold: true,
                color: tf.isCorrect ? '059669' : 'DC2626',
              }),
            ],
            indent: { left: 400 },
            spacing: { after: 60 },
          })
        );
      });
    }

    // Phần 3: Trả lời ngắn
    if (q.section === 'part3_short_answer') {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: '=> Đáp số: ', bold: true, color: '059669' }),
            new TextRun({ text: `${q.shortAnswerText || ''}. ${q.solutionExplanation || ''}` }),
          ],
          indent: { left: 400 },
          spacing: { after: 150 },
        })
      );
    }

    // Phần 4: Tự luận
    if (q.section === 'part4_essay') {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Hướng dẫn giải chi tiết: ', bold: true, color: '059669' }),
            new TextRun({ text: q.solutionExplanation || '' }),
          ],
          indent: { left: 400 },
          spacing: { after: 150 },
        })
      );
    }
  });

  const docFile = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(docFile);
  saveAs(blob, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.docx`);
}
