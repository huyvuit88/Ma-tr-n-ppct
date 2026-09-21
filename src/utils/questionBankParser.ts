import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { BankQuestionTemplate, CognitiveLevel, QuestionType } from '../types';

/**
 * UTILITY BỘ PHÂN TÍCH & TRÍCH XUẤT CÂU HỎI THÔNG MINH CHO NGÂN HÀNG THAM KHẢO
 * Tự động nhận diện Khối lớp (6, 7, 8, 9), Dạng câu hỏi (TN, Đúng/Sai, Trả lời ngắn, Tự luận),
 * Mức độ nhận thức (NB, TH, VD, VDC), Mạch kiến thức toán học và Đáp án / Lời giải.
 */

export interface ParseResult {
  questions: BankQuestionTemplate[];
  gradeStats: Record<string, number>;
  sectionStats: Record<string, number>;
  levelStats: Record<string, number>;
  errors: string[];
  totalParsed: number;
}

// Nhận diện phân môn Toán học
export function detectMathDomain(
  text: string,
  topic?: string
): { domain: 'algebra' | 'geometry' | 'statistics_probability'; domainLabel: string } {
  const combined = `${text} ${topic || ''}`.toLowerCase();

  // Thống kê & Xác suất
  const probKws = [
    'xác suất',
    'biến cố',
    'thống kê',
    'tần số',
    'bảng tần số',
    'biểu đồ',
    'xúc xắc',
    'đồng xu',
    'ngẫu nhiên',
    'khảo sát',
    'trung bình cộng',
    'trung vị',
    'mốt',
  ];
  if (probKws.some((kw) => combined.includes(kw))) {
    return { domain: 'statistics_probability', domainLabel: 'Thống kê - Xác suất' };
  }

  // Hình học & Đo lường
  const geoKws = [
    'tam giác',
    'đường tròn',
    'hình tròn',
    'góc',
    'vuông góc',
    'song song',
    'tiếp tuyến',
    'dây cung',
    'tứ giác',
    'hình bình hành',
    'hình thoi',
    'hình chữ nhật',
    'hình vuông',
    'hình thang',
    'hình trụ',
    'hình nón',
    'hình cầu',
    'diện tích',
    'chu vi',
    'thể tích',
    'thales',
    'pytago',
    'đồng dạng',
    'lượng giác',
    'sin',
    'cos',
    'tan',
    'độ dài đoạn thẳng',
    'trọng tâm',
    'trực tâm',
  ];
  if (geoKws.some((kw) => combined.includes(kw))) {
    return { domain: 'geometry', domainLabel: 'Hình học & Đo lường' };
  }

  // Đại số & Số học (mặc định)
  return { domain: 'algebra', domainLabel: 'Đại số & Số học' };
}

// Nhận diện khối lớp tự động dựa trên từ khóa đặc trưng chương trình GDPT 2018
export function detectGradeFromContent(content: string, defaultGrade?: string): string {
  const lower = content.toLowerCase();

  // 1. Kiểm tra chỉ dẫn tiêu đề trực tiếp
  if (/(lớp|khối|toán)\s*9\b/i.test(lower)) return '9';
  if (/(lớp|khối|toán)\s*8\b/i.test(lower)) return '8';
  if (/(lớp|khối|toán)\s*7\b/i.test(lower)) return '7';
  if (/(lớp|khối|toán)\s*6\b/i.test(lower)) return '6';

  // 2. Điểm số từ khóa chuyên biệt từng khối
  let score6 = 0;
  let score7 = 0;
  let score8 = 0;
  let score9 = 0;

  // Khối 9
  const kw9 = [
    'căn bậc hai',
    'căn thức',
    'hằng đẳng thức căn',
    'hệ hai phương trình',
    'phương trình bậc hai',
    'định lý vi-et',
    'vi-ét',
    'biệt thức delta',
    'hệ thức lượng trong tam giác vuông',
    'tỉ số lượng giác',
    'đường tròn ngoại tiếp',
    'góc nội tiếp',
    'góc tạo bởi tia tiếp tuyến',
    'tứ giác nội tiếp',
    'hình trụ',
    'hình nón',
    'hình cầu',
    'bất đẳng thức cô-si',
  ];
  kw9.forEach((k) => {
    if (lower.includes(k)) score9 += 2;
  });

  // Khối 8
  const kw8 = [
    'hằng đẳng thức đáng nhớ',
    'phân thức đại số',
    'phương trình bậc nhất một ẩn',
    'hàm số bậc nhất',
    'định lý thales',
    'talét',
    'tam giác đồng dạng',
    'hình chóp tam giác đều',
    'hình chóp tứ giác đều',
    'hình lăng trụ đứng',
    'tứ giác lồi',
  ];
  kw8.forEach((k) => {
    if (lower.includes(k)) score8 += 2;
  });

  // Khối 7
  const kw7 = [
    'số hữu tỉ',
    'số vô tỉ',
    'số thực',
    'tỉ lệ thức',
    'dãy tỉ số bằng nhau',
    'đại lượng tỉ lệ thuận',
    'đại lượng tỉ lệ nghịch',
    'tam giác bằng nhau',
    'tam giác cân',
    'đường trung trực',
    'góc so le trong',
    'góc đồng vị',
    'biến cố ngẫu nhiên',
  ];
  kw7.forEach((k) => {
    if (lower.includes(k)) score7 += 2;
  });

  // Khối 6
  const kw6 = [
    'tập hợp',
    'phần tử thuộc',
    'số tự nhiên',
    'ước chung lớn nhất',
    'bội chung nhỏ nhất',
    'số nguyên',
    'phân số',
    'số thập phân',
    'hình có trục đối xứng',
    'tâm đối xứng',
    'điểm nằm giữa hai điểm',
    'tia đối nhau',
  ];
  kw6.forEach((k) => {
    if (lower.includes(k)) score6 += 2;
  });

  const maxScore = Math.max(score6, score7, score8, score9);
  if (maxScore >= 2) {
    if (maxScore === score9) return '9';
    if (maxScore === score8) return '8';
    if (maxScore === score7) return '7';
    if (maxScore === score6) return '6';
  }

  // Nếu có khối mặc định truyền vào
  if (defaultGrade && ['6', '7', '8', '9'].includes(defaultGrade)) {
    return defaultGrade;
  }

  return '9'; // Mặc định khối 9
}

// Nhận diện mức độ nhận thức
export function detectCognitiveLevel(
  text: string
): { level: CognitiveLevel; label: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao' } {
  const lower = text.toLowerCase();

  // Nhãn rõ ràng
  if (lower.includes('[vdc]') || lower.includes('(vdc)') || lower.includes('vận dụng cao')) {
    return { level: 'vanDungCao', label: 'Vận dụng cao' };
  }
  if (lower.includes('[vd]') || lower.includes('(vd)') || lower.includes('vận dụng')) {
    return { level: 'vanDung', label: 'Vận dụng' };
  }
  if (lower.includes('[th]') || lower.includes('(th)') || lower.includes('thông hiểu')) {
    return { level: 'thongHieu', label: 'Thông hiểu' };
  }
  if (lower.includes('[nb]') || lower.includes('(nb)') || lower.includes('nhận biết')) {
    return { level: 'nhanBiet', label: 'Nhận biết' };
  }

  // Từ khóa suy luận
  if (
    lower.includes('giá trị lớn nhất') ||
    lower.includes('giá trị nhỏ nhất') ||
    lower.includes('tìm max') ||
    lower.includes('tìm min') ||
    lower.includes('bất đẳng thức') ||
    lower.includes('bài toán thực tế nâng cao')
  ) {
    return { level: 'vanDungCao', label: 'Vận dụng cao' };
  }

  if (
    lower.includes('chứng minh') ||
    lower.includes('giải bài toán bằng cách lập') ||
    lower.includes('tìm m để') ||
    lower.includes('rút gọn biểu thức chứa căn') ||
    lower.includes('tính diện tích') ||
    lower.includes('tính khoảng cách')
  ) {
    return { level: 'vanDung', label: 'Vận dụng' };
  }

  if (
    lower.includes('giải phương trình') ||
    lower.includes('nghiệm của phương trình') ||
    lower.includes('kết quả của phép tính') ||
    lower.includes('tính giá trị') ||
    lower.includes('điều kiện xác định') ||
    lower.includes('rút gọn')
  ) {
    return { level: 'thongHieu', label: 'Thông hiểu' };
  }

  return { level: 'nhanBiet', label: 'Nhận biết' };
}

// Làm sạch văn bản và chuẩn hóa công thức
export function cleanQuestionText(raw: string): string {
  let text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Loại bỏ các nhãn thừa đầu câu
  text = text.replace(/^(câu\s*\d+|bài\s*\d+|\[c\d+\]|\d+\.)[:.\s-]*/i, '').trim();
  // Loại bỏ các tag [NB], [TH], [VD], [VDC] đầu prompt
  text = text.replace(/^\[(nb|th|vd|vdc)\][:.\s-]*/i, '').trim();
  text = text.replace(/^\((nhận biết|thông hiểu|vận dụng|vận dụng cao)\)[:.\s-]*/i, '').trim();
  return text;
}

/**
 * Phân tách khối văn bản câu hỏi thành đối tượng BankQuestionTemplate
 */
export function parseSingleQuestionBlock(
  blockText: string,
  defaultGrade: string = '9',
  sourceFileName?: string
): BankQuestionTemplate | null {
  const trimmed = blockText.trim();
  if (trimmed.length < 15) return null;

  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const firstLine = lines[0];
  const detectedGrade = detectGradeFromContent(trimmed, defaultGrade);
  const cog = detectCognitiveLevel(trimmed);
  const domainInfo = detectMathDomain(trimmed);

  // 1. Kiểm tra xem có phải Dạng 2 (Đúng / Sai 4 ý a, b, c, d)
  const isTrueFalseBlock =
    /^[a-d][\).]\s+/i.test(lines.find((l) => /^[a-d][\).]/i.test(l)) || '') &&
    (trimmed.toLowerCase().includes('đúng') || trimmed.toLowerCase().includes('sai'));

  // 2. Kiểm tra xem có phải Dạng 1 (Trắc nghiệm 4 lựa chọn A, B, C, D)
  const hasOptionA = lines.some((l) => /^[A-D][\).:]\s+/i.test(l)) || /[A-D][\).:]\s+/.test(trimmed);

  // 3. Kiểm tra xem có phải Tự luận (Bài toán lớn, có các bước hoặc lời giải dài)
  const isEssay =
    /^(bài\s*\d+|bài toán)/i.test(firstLine) ||
    trimmed.toLowerCase().includes('lời giải chi tiết:') ||
    trimmed.toLowerCase().includes('thang điểm') ||
    trimmed.toLowerCase().includes('chứng minh rằng') ||
    (!hasOptionA && !isTrueFalseBlock && trimmed.length > 250);

  // --- TRƯỜNG HỢP 1: TRẮC NGHIỆM 4 LỰA CHỌN (MCQ) ---
  if (hasOptionA && !isTrueFalseBlock) {
    let promptLines: string[] = [];
    let options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [];
    let correctOption: 'A' | 'B' | 'C' | 'D' = 'A';
    let solutionExplanation = '';

    // Tìm dòng chứa đáp án/lời giải
    let answerFound = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Tìm dòng đáp án
      const ansMatch = line.match(/(đáp án|chọn|key)[:\s]*([A-D])/i);
      if (ansMatch) {
        correctOption = ansMatch[2].toUpperCase() as 'A' | 'B' | 'C' | 'D';
        answerFound = true;
        continue;
      }

      // Tìm lời giải
      if (line.toLowerCase().startsWith('lời giải:') || line.toLowerCase().startsWith('hướng dẫn:')) {
        solutionExplanation = lines.slice(i).join('\n').replace(/^(lời giải|hướng dẫn)[:\s]*/i, '').trim();
        break;
      }

      // Nhận diện lựa chọn A, B, C, D
      // Dạng dòng riêng: A. 5 hoặc A) 5
      const optMatch = line.match(/^([A-D])[\).:]\s*(.*)$/i);
      if (optMatch) {
        options.push({
          key: optMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D',
          text: optMatch[2].trim(),
        });
        continue;
      }

      // Dạng 1 dòng chứa nhiều lựa chọn: A. 5    B. -5    C. 10   D. 25
      const inlineOpts = Array.from(line.matchAll(/([A-D])[\).:]\s*([^A-D\n]+)/gi));
      if (inlineOpts.length >= 2) {
        inlineOpts.forEach((m) => {
          options.push({
            key: m[1].toUpperCase() as 'A' | 'B' | 'C' | 'D',
            text: m[2].trim(),
          });
        });
        continue;
      }

      if (options.length === 0) {
        promptLines.push(line);
      }
    }

    // Nếu không tìm thấy phương án theo dòng, thử regex quét toàn khối
    if (options.length < 4) {
      const allOptRegex = /([A-D])[\).:]\s*([^\n\r]+?)(?=(?:[A-D][\).:]|đáp án|lời giải|$))/gi;
      const found: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [];
      let match;
      while ((match = allOptRegex.exec(trimmed)) !== null) {
        const k = match[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
        if (!found.some((f) => f.key === k)) {
          found.push({ key: k, text: match[2].trim() });
        }
      }
      if (found.length >= 2) {
        options = found;
      }
    }

    // Chuẩn hóa 4 phương án
    const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const finalOptions = keys.map((k) => {
      const existing = options.find((o) => o.key === k);
      return existing || { key: k, text: `Phương án ${k}` };
    });

    const promptText = cleanQuestionText(promptLines.join('\n') || lines[0]);

    return {
      id: `up_q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      subject: 'Toán',
      grade: detectedGrade,
      topicKeywords: extractKeywords(promptText, domainInfo.domainLabel),
      section: 'part1_mcq',
      type: 'multiple_choice',
      cognitiveLevel: cog.level,
      prompt: promptText,
      options: finalOptions,
      correctOption,
      solutionExplanation:
        solutionExplanation ||
        `Đáp án đúng là ${correctOption}. Lời giải chi tiết dựa trên kiến thức trọng tâm bài học.`,
      learningObjective: `Nắm vững kiến thức và kỹ năng giải toán về ${domainInfo.domainLabel.toLowerCase()}.`,
      source: 'uploaded',
      sourceFileName: sourceFileName || 'Tài liệu giáo viên tải lên',
      createdAt: new Date().toISOString(),
      mathDomain: domainInfo.domain,
      mathDomainLabel: domainInfo.domainLabel,
    };
  }

  // --- TRƯỜNG HỢP 2: ĐÚNG / SAI 4 Ý (TRUE/FALSE) ---
  if (isTrueFalseBlock) {
    const tfStatements: { subKey: 'a' | 'b' | 'c' | 'd'; text: string; isCorrect: boolean; explanation: string }[] = [];
    let promptLines: string[] = [];
    const subKeys: ('a' | 'b' | 'c' | 'd')[] = ['a', 'b', 'c', 'd'];

    lines.forEach((line) => {
      const match = line.match(/^([a-d])[\).:]\s*(.*)$/i);
      if (match) {
        const subKey = match[1].toLowerCase() as 'a' | 'b' | 'c' | 'd';
        const rest = match[2].trim();
        const isCorrect = /đúng|true/i.test(rest) && !/sai|false/i.test(rest);
        tfStatements.push({
          subKey,
          text: rest.replace(/\((đúng|sai)\)/gi, '').trim(),
          isCorrect,
          explanation: isCorrect ? 'Khẳng định đúng theo định lý/tính chất.' : 'Khẳng định sai.',
        });
      } else if (tfStatements.length === 0) {
        promptLines.push(line);
      }
    });

    // Bổ sung đủ 4 ý a, b, c, d nếu thiếu
    subKeys.forEach((sk) => {
      if (!tfStatements.some((st) => st.subKey === sk)) {
        tfStatements.push({
          subKey: sk,
          text: `Mệnh đề toán học (${sk}) liên quan đến bài toán.`,
          isCorrect: sk === 'a' || sk === 'c',
          explanation: 'Xem lại tính chất và định lý.',
        });
      }
    });

    const promptText = cleanQuestionText(promptLines.join('\n') || lines[0]);

    return {
      id: `up_q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      subject: 'Toán',
      grade: detectedGrade,
      topicKeywords: extractKeywords(promptText, domainInfo.domainLabel),
      section: 'part2_true_false',
      type: 'true_false',
      cognitiveLevel: cog.level,
      prompt: promptText,
      tfStatements,
      solutionExplanation: 'Đánh giá tính đúng/sai của từng mệnh đề dựa trên các phép biến đổi và định lý liên quan.',
      learningObjective: `Vận dụng hiểu biết để phán đoán chính xác tính đúng sai của các khẳng định ${domainInfo.domainLabel.toLowerCase()}.`,
      source: 'uploaded',
      sourceFileName: sourceFileName || 'Tài liệu giáo viên tải lên',
      createdAt: new Date().toISOString(),
      mathDomain: domainInfo.domain,
      mathDomainLabel: domainInfo.domainLabel,
    };
  }

  // --- TRƯỜNG HỢP 3: TỰ LUẬN (ESSAY) ---
  if (isEssay) {
    const promptText = cleanQuestionText(trimmed);
    return {
      id: `up_q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      subject: 'Toán',
      grade: detectedGrade,
      topicKeywords: extractKeywords(promptText, domainInfo.domainLabel),
      section: 'part4_essay',
      type: 'essay',
      cognitiveLevel: cog.level === 'nhanBiet' ? 'thongHieu' : cog.level,
      prompt: promptText,
      essayGradingSteps: [
        { step: 'Lập luận, biến đổi bước 1 hoặc vẽ hình/đặt điều kiện xác định đúng.', point: 0.5 },
        { step: 'Thực hiện các bước giải toán, tính toán hoặc chứng minh logic.', point: 0.75 },
        { step: 'Đối chiếu điều kiện, tính toán chính xác và kết luận bài toán.', point: 0.25 },
      ],
      solutionExplanation: 'Trình bày đầy đủ các bước giải toán logic, chặt chẽ và kết luận theo thang điểm.',
      learningObjective: `Rèn luyện kỹ năng trình bày lời giải bài toán tự luận ${domainInfo.domainLabel.toLowerCase()}.`,
      source: 'uploaded',
      sourceFileName: sourceFileName || 'Tài liệu giáo viên tải lên',
      createdAt: new Date().toISOString(),
      mathDomain: domainInfo.domain,
      mathDomainLabel: domainInfo.domainLabel,
    };
  }

  // --- TRƯỜNG HỢP 4: TRẢ LỜI NGẮN (SHORT ANSWER) ---
  const promptText = cleanQuestionText(trimmed);
  let shortAnswerText = '1';
  const ansMatch = trimmed.match(/(đáp số|kết quả|đáp án|x\s*=)[:\s]*([^\n\r]+)/i);
  if (ansMatch) {
    shortAnswerText = ansMatch[2].trim();
  }

  return {
    id: `up_q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    subject: 'Toán',
    grade: detectedGrade,
    topicKeywords: extractKeywords(promptText, domainInfo.domainLabel),
    section: 'part3_short_answer',
    type: 'short_answer',
    cognitiveLevel: cog.level,
    prompt: promptText,
    shortAnswerText,
    solutionExplanation: `Tính toán và rút ra kết quả chính xác: ${shortAnswerText}.`,
    learningObjective: `Thực hiện phép tính nhanh và viết kết quả bài toán ${domainInfo.domainLabel.toLowerCase()}.`,
    source: 'uploaded',
    sourceFileName: sourceFileName || 'Tài liệu giáo viên tải lên',
    createdAt: new Date().toISOString(),
    mathDomain: domainInfo.domain,
    mathDomainLabel: domainInfo.domainLabel,
  };
}

// Trích xuất các từ khóa chủ đề ngắn gọn
function extractKeywords(prompt: string, domainLabel: string): string[] {
  const list = [domainLabel];
  const candidates = [
    'căn bậc hai',
    'hệ phương trình',
    'phương trình bậc hai',
    'hàm số',
    'đồ thị',
    'tam giác',
    'đường tròn',
    'xác suất',
    'thống kê',
    'rút gọn',
    'tỉ lệ',
    'số tự nhiên',
    'số nguyên',
    'phân số',
    'tứ giác',
    'lượng giác',
  ];
  candidates.forEach((c) => {
    if (prompt.toLowerCase().includes(c)) {
      list.push(c);
    }
  });
  return list;
}

/**
 * Phân tích toàn bộ văn bản câu hỏi (hỗ trợ nhiều câu ngăn cách bởi Câu 1, Câu 2, v.v.)
 */
export function parseQuestionText(
  rawText: string,
  defaultGrade: string = '9',
  sourceFileName?: string
): ParseResult {
  const result: ParseResult = {
    questions: [],
    gradeStats: {},
    sectionStats: {},
    levelStats: {},
    errors: [],
    totalParsed: 0,
  };

  if (!rawText || rawText.trim().length === 0) {
    result.errors.push('Nội dung rỗng.');
    return result;
  }

  // Tách văn bản thành các khối câu hỏi dựa vào regex "Câu X:", "Bài X:", "[CX]"
  const splitterRegex = /(?=(?:^|\n)\s*(?:câu\s*\d+|bài\s*\d+|\[c\d+\]|\d+\.))/i;
  const rawBlocks = rawText.split(splitterRegex).map((b) => b.trim()).filter((b) => b.length > 15);

  const blocksToProcess = rawBlocks.length > 0 ? rawBlocks : [rawText];

  blocksToProcess.forEach((block, idx) => {
    try {
      const q = parseSingleQuestionBlock(block, defaultGrade, sourceFileName);
      if (q) {
        result.questions.push(q);
        result.gradeStats[q.grade] = (result.gradeStats[q.grade] || 0) + 1;
        result.sectionStats[q.section] = (result.sectionStats[q.section] || 0) + 1;
        result.levelStats[q.cognitiveLevel] = (result.levelStats[q.cognitiveLevel] || 0) + 1;
      }
    } catch (err: any) {
      result.errors.push(`Lỗi khi phân tích khối thứ ${idx + 1}: ${err?.message || String(err)}`);
    }
  });

  result.totalParsed = result.questions.length;
  return result;
}

/**
 * Phân tích file tải lên (Word .docx, Excel .xlsx, .txt, .json)
 */
export async function parseUploadedQuestionFile(
  file: File,
  defaultGrade: string = '9'
): Promise<ParseResult> {
  const fileName = file.name.toLowerCase();

  // 1. FILE JSON
  if (fileName.endsWith('.json')) {
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : parsed.questions || [];
      const questions: BankQuestionTemplate[] = [];
      const gradeStats: Record<string, number> = {};
      const sectionStats: Record<string, number> = {};
      const levelStats: Record<string, number> = {};

      list.forEach((item: any, i: number) => {
        if (item && item.prompt) {
          const g = item.grade || defaultGrade || '9';
          const q: BankQuestionTemplate = {
            id: item.id || `up_json_${Date.now()}_${i}`,
            subject: item.subject || 'Toán',
            grade: g,
            topicKeywords: item.topicKeywords || ['Toán học'],
            section: item.section || 'part1_mcq',
            type: item.type || 'multiple_choice',
            cognitiveLevel: item.cognitiveLevel || 'nhanBiet',
            prompt: item.prompt,
            options: item.options,
            correctOption: item.correctOption,
            tfStatements: item.tfStatements,
            shortAnswerText: item.shortAnswerText,
            essayGradingSteps: item.essayGradingSteps,
            solutionExplanation: item.solutionExplanation || 'Lời giải chi tiết.',
            learningObjective: item.learningObjective || 'Yêu cầu cần đạt.',
            source: 'uploaded',
            sourceFileName: file.name,
            createdAt: new Date().toISOString(),
          };
          questions.push(q);
          gradeStats[g] = (gradeStats[g] || 0) + 1;
          sectionStats[q.section] = (sectionStats[q.section] || 0) + 1;
          levelStats[q.cognitiveLevel] = (levelStats[q.cognitiveLevel] || 0) + 1;
        }
      });

      return {
        questions,
        gradeStats,
        sectionStats,
        levelStats,
        errors: [],
        totalParsed: questions.length,
      };
    } catch (e: any) {
      return {
        questions: [],
        gradeStats: {},
        sectionStats: {},
        levelStats: {},
        errors: [`File JSON không hợp lệ: ${e?.message}`],
        totalParsed: 0,
      };
    }
  }

  // 2. FILE EXCEL (.xlsx, .xls, .csv)
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

    const questions: BankQuestionTemplate[] = [];
    const gradeStats: Record<string, number> = {};
    const sectionStats: Record<string, number> = {};
    const levelStats: Record<string, number> = {};
    const errors: string[] = [];

    rows.forEach((row, idx) => {
      // Tìm các cột: Câu hỏi/Nội dung, A, B, C, D, Đáp án, Mức độ, Khối, Lời giải
      const prompt =
        row['Câu hỏi'] ||
        row['Nội dung'] ||
        row['Prompt'] ||
        row['câu_hỏi'] ||
        row['Question'] ||
        row['De_bai'] ||
        '';
      if (!prompt || String(prompt).trim().length < 10) return;

      const optA = String(row['Phương án A'] || row['A'] || row['Đáp án A'] || '').trim();
      const optB = String(row['Phương án B'] || row['B'] || row['Đáp án B'] || '').trim();
      const optC = String(row['Phương án C'] || row['C'] || row['Đáp án C'] || '').trim();
      const optD = String(row['Phương án D'] || row['D'] || row['Đáp án D'] || '').trim();

      const rawKey = String(row['Đáp án'] || row['Key'] || row['Đúng'] || 'A').toUpperCase().trim();
      const correctOption: 'A' | 'B' | 'C' | 'D' = ['A', 'B', 'C', 'D'].includes(rawKey)
        ? (rawKey as 'A' | 'B' | 'C' | 'D')
        : 'A';

      const rawLevel = String(row['Mức độ'] || row['Level'] || '').toLowerCase().trim();
      let cogLevel: CognitiveLevel = 'nhanBiet';
      if (rawLevel.includes('thông hiểu') || rawLevel === 'th') cogLevel = 'thongHieu';
      else if (rawLevel.includes('vận dụng cao') || rawLevel === 'vdc') cogLevel = 'vanDungCao';
      else if (rawLevel.includes('vận dụng') || rawLevel === 'vd') cogLevel = 'vanDung';
      else cogLevel = detectCognitiveLevel(prompt).level;

      const rawGrade = String(row['Khối'] || row['Lớp'] || row['Grade'] || '').replace(/\D/g, '');
      const grade = ['6', '7', '8', '9'].includes(rawGrade)
        ? rawGrade
        : detectGradeFromContent(prompt, defaultGrade);

      const solution =
        String(row['Lời giải'] || row['Giải thích'] || row['Solution'] || '').trim() ||
        `Đáp án đúng là ${correctOption}.`;

      const domain = detectMathDomain(prompt);

      // Nếu có đầy đủ cột A, B, C, D thì tạo Part 1 MCQ
      if (optA && optB) {
        const q: BankQuestionTemplate = {
          id: `up_excel_${Date.now()}_${idx}`,
          subject: 'Toán',
          grade,
          topicKeywords: extractKeywords(prompt, domain.domainLabel),
          section: 'part1_mcq',
          type: 'multiple_choice',
          cognitiveLevel: cogLevel,
          prompt,
          options: [
            { key: 'A', text: optA },
            { key: 'B', text: optB },
            { key: 'C', text: optC || 'Phương án C' },
            { key: 'D', text: optD || 'Phương án D' },
          ],
          correctOption,
          solutionExplanation: solution,
          learningObjective: `Nắm vững dạng toán về ${domain.domainLabel.toLowerCase()}.`,
          source: 'uploaded',
          sourceFileName: file.name,
          createdAt: new Date().toISOString(),
          mathDomain: domain.domain,
          mathDomainLabel: domain.domainLabel,
        };
        questions.push(q);
        gradeStats[grade] = (gradeStats[grade] || 0) + 1;
        sectionStats[q.section] = (sectionStats[q.section] || 0) + 1;
        levelStats[q.cognitiveLevel] = (levelStats[q.cognitiveLevel] || 0) + 1;
      } else {
        // Tự động phân tích theo dạng bài tập
        const parsedQ = parseSingleQuestionBlock(prompt, grade, file.name);
        if (parsedQ) {
          questions.push(parsedQ);
          gradeStats[parsedQ.grade] = (gradeStats[parsedQ.grade] || 0) + 1;
          sectionStats[parsedQ.section] = (sectionStats[parsedQ.section] || 0) + 1;
          levelStats[parsedQ.cognitiveLevel] = (levelStats[parsedQ.cognitiveLevel] || 0) + 1;
        }
      }
    });

    return {
      questions,
      gradeStats,
      sectionStats,
      levelStats,
      errors,
      totalParsed: questions.length,
    };
  }

  // 3. FILE WORD (.docx)
  if (fileName.endsWith('.docx')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const res = await mammoth.extractRawText({ arrayBuffer });
      const text = res.value;
      return parseQuestionText(text, defaultGrade, file.name);
    } catch (e: any) {
      return {
        questions: [],
        gradeStats: {},
        sectionStats: {},
        levelStats: {},
        errors: [`Lỗi khi đọc file Word .docx: ${e?.message || String(e)}`],
        totalParsed: 0,
      };
    }
  }

  // 4. FILE PLAIN TEXT (.txt)
  if (fileName.endsWith('.txt')) {
    const text = await file.text();
    return parseQuestionText(text, defaultGrade, file.name);
  }

  return {
    questions: [],
    gradeStats: {},
    sectionStats: {},
    levelStats: {},
    errors: ['Định dạng file không được hỗ trợ. Vui lòng chọn file .docx, .xlsx, .txt hoặc .json.'],
    totalParsed: 0,
  };
}

/**
 * Tải file Word mẫu để giáo viên dễ soạn thảo
 */
export function generateSampleTextContent(): string {
  return `=== FILE MẪU NGÂN HÀNG CÂU HỎI THAM KHẢO (TOÁN THCS) ===

Câu 1: [NB] Căn bậc hai số học của $49$ là:
A. $7$
B. $-7$
C. $\\pm 7$
D. $49$
Đáp án: A
Lời giải: Căn bậc hai số học của số dương $49$ là $\\sqrt{49} = 7$.

Câu 2: [TH] Giá trị của biểu thức $P = \\sqrt{(\\sqrt{5} - 3)^2}$ là:
A. $3 - \\sqrt{5}$
B. $\\sqrt{5} - 3$
C. $\\sqrt{5} + 3$
D. $-\\sqrt{5} - 3$
Đáp án: A
Lời giải: Ta có $\\sqrt{(\\sqrt{5} - 3)^2} = |\\sqrt{5} - 3| = 3 - \\sqrt{5}$ do $\\sqrt{5} < 3$.

Câu 3: [TH] Cho các khẳng định sau về hàm số bậc nhất $y = (m - 2)x + 3$:
a) Hàm số đồng biến trên $\\mathbb{R}$ khi $m > 2$. (Đúng)
b) Đồ thị hàm số luôn cắt trục tung tại điểm $(0; 3)$. (Đúng)
c) Khi $m = 1$, hàm số nghịch biến trên $\\mathbb{R}$. (Đúng)
d) Đồ thị hàm số đi qua gốc tọa độ $O(0; 0)$. (Sai)

Câu 4: [VD] Cho tam giác $ABC$ vuông tại $A$ có $AB = 6\\text{ cm}, AC = 8\\text{ cm}$. Độ dài đường cao $AH$ bằng bao nhiêu cm?
Đáp số: 4.8
Lời giải: Cạnh huyền $BC = \\sqrt{6^2 + 8^2} = 10\\text{ cm}$. Ta có $AH \\cdot BC = AB \\cdot AC \\Rightarrow AH = \\frac{6 \\cdot 8}{10} = 4{,}8\\text{ cm}$.

Bài 1: [VD] Giải bài toán bằng cách lập hệ phương trình:
Hai tổ công nhân cùng làm chung một công việc thì hoàn thành trong $12$ giờ. Nếu tổ I làm trong $4$ giờ và tổ II làm trong $10$ giờ thì cả hai tổ hoàn thành được $50\\%$ công việc. Hỏi mỗi tổ làm riêng một mình thì hoàn thành công việc đó trong bao lâu?
Lời giải chi tiết:
- Bước 1: Gọi thời gian tổ I và tổ II làm riêng hoàn thành công việc lần lượt là $x, y$ (giờ, $x, y > 12$).
- Bước 2: Mỗi giờ tổ I làm $\\frac{1}{x}$, tổ II làm $\\frac{1}{y}$ công việc. Hai tổ làm chung trong $12$ giờ xong nên: $\\frac{1}{x} + \\frac{1}{y} = \\frac{1}{12}$.
- Bước 3: Tổ I làm $4$ giờ và tổ II làm $10$ giờ được $\\frac{1}{2}$ công việc nên: $\\frac{4}{x} + \\frac{10}{y} = \\frac{1}{2}$.
- Bước 4: Giải hệ ta được $x = 20, y = 30$ (thỏa mãn). Vậy tổ I làm riêng mất $20$ giờ, tổ II mất $30$ giờ.
`;
}
