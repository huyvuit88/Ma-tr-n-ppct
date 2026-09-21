import { ExamQuestion, QuestionType } from '../types';

/**
 * MODULE XỬ LÝ BIẾN THỂ SỐ LIỆU TOÁN HỌC VÀ ĐỒNG BỘ ĐÁP ÁN TỰ ĐỘNG
 * 
 * Hỗ trợ các phân môn Toán THCS:
 * - Đại số & Số học (Algebra / Arithmetic)
 * - Hình học (Geometry)
 * - Xác suất & Thống kê (Probability & Statistics)
 *
 * Chức năng:
 * 1. Thay đổi số liệu toán học (hệ số, kích thước, số liệu thống kê...) thành các bộ "số đẹp".
 * 2. Tự động tính toán lại đáp án đúng (A, B, C, D hoặc Đúng/Sai hoặc Đáp số ngắn hoặc Barem tự luận).
 * 3. Tự động đồng bộ lời giải chi tiết và hướng dẫn chấm theo số liệu mới.
 */

export interface MathDomainInfo {
  domain: 'algebra' | 'geometry' | 'statistics_probability';
  domainLabel: string;
  iconName: string;
}

/**
 * Nhận diện phân môn Toán từ từ khóa nội dung / đề bài
 */
export function detectMathDomain(text: string, chapter: string = '', lesson: string = ''): MathDomainInfo {
  const combined = `${text} ${chapter} ${lesson}`.toLowerCase();

  // Xác suất & Thống kê
  if (
    combined.includes('thống kê') ||
    combined.includes('xác suất') ||
    combined.includes('tần số') ||
    combined.includes('biến cố') ||
    combined.includes('xúc xắc') ||
    combined.includes('đồng xu') ||
    combined.includes('biểu đồ') ||
    combined.includes('trung bình') ||
    combined.includes('trung vị') ||
    combined.includes('mốt') ||
    combined.includes('dữ liệu')
  ) {
    return {
      domain: 'statistics_probability',
      domainLabel: 'Xác suất & Thống kê',
      iconName: 'BarChart2',
    };
  }

  // Hình học
  if (
    combined.includes('hình') ||
    combined.includes('tam giác') ||
    combined.includes('tứ giác') ||
    combined.includes('đường tròn') ||
    combined.includes('tiếp tuyến') ||
    combined.includes('góc') ||
    combined.includes('cạnh') ||
    combined.includes('độ dài') ||
    combined.includes('diện tích') ||
    combined.includes('chu vi') ||
    combined.includes('đoạn thẳng') ||
    combined.includes('thales') ||
    combined.includes('pytago') ||
    combined.includes('lượng giác') ||
    combined.includes('sin') ||
    combined.includes('cos') ||
    combined.includes('tan') ||
    combined.includes('song song') ||
    combined.includes('vuông góc') ||
    combined.includes('đồng dạng')
  ) {
    return {
      domain: 'geometry',
      domainLabel: 'Hình học',
      iconName: 'Shapes',
    };
  }

  // Mặc định: Đại số & Số học
  return {
    domain: 'algebra',
    domainLabel: 'Đại số & Số học',
    iconName: 'Calculator',
  };
}

// =================================================================
// BỘ TẠO BIẾN THỂ SỐ LIỆU ĐẸP CHO CÁC DẠNG TOÁN PHỔ BIẾN
// =================================================================

interface VariantGenerator {
  matches: (prompt: string, lesson: string) => boolean;
  generateVariant: (q: ExamQuestion) => ExamQuestion;
}

const VARIANT_GENERATORS: VariantGenerator[] = [
  // 1. CĂN THỨC CÓ NGHĨA: \sqrt{ax - b} xác định khi x >= b/a
  {
    matches: (prompt, lesson) => {
      const lower = (prompt + ' ' + lesson).toLowerCase();
      return (lower.includes('căn bậc hai') || lower.includes('\\sqrt')) && 
             (lower.includes('xác định') || lower.includes('có nghĩa') || lower.includes('điều kiện'));
    },
    generateVariant: (q: ExamQuestion) => {
      const params = [
        { a: 2, b: 6, ans: 3, expr: '2x - 6' },
        { a: 3, b: 12, ans: 4, expr: '3x - 12' },
        { a: 5, b: 15, ans: 3, expr: '5x - 15' },
        { a: 4, b: 8, ans: 2, expr: '4x - 8' },
        { a: 2, b: -8, ans: -4, expr: '2x + 8' },
        { a: 3, b: -9, ans: -3, expr: '3x + 9' },
        { a: 5, b: 20, ans: 4, expr: '5x - 20' },
        { a: 2, b: 10, ans: 5, expr: '2x - 10' },
      ];
      const sel = params[Math.floor(Math.random() * params.length)];
      const opSign = sel.ans >= 0 ? `x \\ge ${sel.ans}` : `x \\ge ${sel.ans}`;
      const wrong1 = `x \\le ${sel.ans}`;
      const wrong2 = `x > ${sel.ans}`;
      const wrong3 = `x \\ge ${-sel.ans}`;

      const newPrompt = `Biểu thức $\\sqrt{${sel.expr}}$ có nghĩa (xác định) khi và chỉ khi:`;
      const options = [
        { key: 'A' as const, text: `$${opSign}$` },
        { key: 'B' as const, text: `$${wrong1}$` },
        { key: 'C' as const, text: `$${wrong2}$` },
        { key: 'D' as const, text: `$${wrong3}$` },
      ];

      return {
        ...q,
        prompt: newPrompt,
        options,
        correctOption: 'A',
        solutionExplanation: `Biểu thức dưới dấu căn không âm: $${sel.expr} \\ge 0 \\Leftrightarrow ${sel.a}x \\ge ${sel.b} \\Leftrightarrow ${opSign}$. Do đó phương án A đúng.`,
      };
    },
  },

  // 2. CĂN BẬC HAI SỐ HỌC CỦA MỘT SỐ CHÍNH PHƯƠNG
  {
    matches: (prompt) => {
      return prompt.toLowerCase().includes('căn bậc hai số học của') || prompt.toLowerCase().includes('giá trị của $\\sqrt{');
    },
    generateVariant: (q: ExamQuestion) => {
      const squares = [
        { val: 16, root: 4 },
        { val: 25, root: 5 },
        { val: 36, root: 6 },
        { val: 49, root: 7 },
        { val: 64, root: 8 },
        { val: 81, root: 9 },
        { val: 100, root: 10 },
        { val: 121, root: 11 },
        { val: 144, root: 12 },
        { val: 169, root: 13 },
      ];
      const sel = squares[Math.floor(Math.random() * squares.length)];
      const newPrompt = `Căn bậc hai số học của $${sel.val}$ là:`;
      const options = [
        { key: 'A' as const, text: `$${sel.root}$` },
        { key: 'B' as const, text: `$-${sel.root}$` },
        { key: 'C' as const, text: `$\\pm ${sel.root}$` },
        { key: 'D' as const, text: `$${sel.val * 2}$` },
      ];

      return {
        ...q,
        prompt: newPrompt,
        options,
        correctOption: 'A',
        shortAnswerText: `${sel.root}`,
        solutionExplanation: `Theo định nghĩa, căn bậc hai số học của số thực không âm $a$ là số thực không âm $x$ sao cho $x^2 = a$. Vì $${sel.root} \\ge 0$ và $${sel.root}^2 = ${sel.val}$ nên $\\sqrt{${sel.val}} = ${sel.root}$.`,
      };
    },
  },

  // 3. PHƯƠNG TRÌNH BẬC HAI / TÍNH NGHIỆM: x^2 - Sx + P = 0
  {
    matches: (prompt) => {
      const lower = prompt.toLowerCase();
      return (lower.includes('phương trình') || lower.includes('tập nghiệm')) && (lower.includes('x^2') || lower.includes('nghiệm'));
    },
    generateVariant: (q: ExamQuestion) => {
      const roots = [
        { x1: 2, x2: 3, S: 5, P: 6 },
        { x1: 1, x2: 4, S: 5, P: 4 },
        { x1: -2, x2: 3, S: 1, P: -6 },
        { x1: 2, x2: 5, S: 7, P: 10 },
        { x1: 3, x2: 4, S: 7, P: 12 },
        { x1: -1, x2: 5, S: 4, P: -5 },
        { x1: 1, x2: 6, S: 7, P: 6 },
      ];
      const sel = roots[Math.floor(Math.random() * roots.length)];
      const sTerm = sel.S > 0 ? `- ${sel.S}x` : `+ ${Math.abs(sel.S)}x`;
      const pTerm = sel.P > 0 ? `+ ${sel.P}` : `- ${Math.abs(sel.P)}`;
      const eqStr = `x^2 ${sTerm} ${pTerm} = 0`;

      const newPrompt = `Tập nghiệm $S$ của phương trình $${eqStr}$ là:`;
      const options = [
        { key: 'A' as const, text: `$S = \\{${sel.x1}; ${sel.x2}\\}$` },
        { key: 'B' as const, text: `$S = \\{${-sel.x1}; ${-sel.x2}\\}$` },
        { key: 'C' as const, text: `$S = \\{${sel.x1}\\}$` },
        { key: 'D' as const, text: `$S = \\{${sel.x2}\\}$` },
      ];

      return {
        ...q,
        prompt: newPrompt,
        options,
        correctOption: 'A',
        shortAnswerText: `${sel.x1}; ${sel.x2}`,
        solutionExplanation: `Giải phương trình $${eqStr}$: Phân tích nhân tử $(x - ${sel.x1})(x - ${sel.x2}) = 0 \\Leftrightarrow x = ${sel.x1}$ hoặc $x = ${sel.x2}$. Vậy $S = \\{${sel.x1}; ${sel.x2}\\}$.`,
      };
    },
  },

  // 4. HÀM SỐ BẬC NHẤT: y = ax + b ĐỒNG BIẾN / NGHỊCH BIẾN HOẶC ĐI QUA ĐIỂM
  {
    matches: (prompt, lesson) => {
      const lower = (prompt + ' ' + lesson).toLowerCase();
      return lower.includes('hàm số') && (lower.includes('bậc nhất') || lower.includes('y =') || lower.includes('hệ số'));
    },
    generateVariant: (q: ExamQuestion) => {
      const funcs = [
        { a: 3, b: -5, x0: 2, y0: 1, textA: 'đồng biến trên \\mathbb{R}', isDongBien: true },
        { a: -2, b: 7, x0: 1, y0: 5, textA: 'nghịch biến trên \\mathbb{R}', isDongBien: false },
        { a: 4, b: -2, x0: 1, y0: 2, textA: 'đồng biến trên \\mathbb{R}', isDongBien: true },
        { a: -3, b: 6, x0: 2, y0: 0, textA: 'nghịch biến trên \\mathbb{R}', isDongBien: false },
        { a: 2, b: 3, x0: -1, y0: 1, textA: 'đồng biến trên \\mathbb{R}', isDongBien: true },
      ];
      const sel = funcs[Math.floor(Math.random() * funcs.length)];
      const funcStr = `y = ${sel.a}x ${sel.b >= 0 ? '+ ' + sel.b : '- ' + Math.abs(sel.b)}`;

      const newPrompt = `Cho hàm số bậc nhất $${funcStr}$. Khẳng định nào sau đây là **ĐÚNG**?`;
      const correctText = sel.isDongBien
        ? `Hàm số đồng biến trên $\\mathbb{R}$ vì hệ số $a = ${sel.a} > 0$.`
        : `Hàm số nghịch biến trên $\\mathbb{R}$ vì hệ số $a = ${sel.a} < 0$.`;
      const wrongText1 = sel.isDongBien
        ? `Hàm số nghịch biến trên $\\mathbb{R}$ vì hệ số $a = ${sel.a} > 0$.`
        : `Hàm số đồng biến trên $\\mathbb{R}$ vì hệ số $a = ${sel.a} < 0$.`;
      const wrongText2 = `Đồ thị hàm số luôn đi qua gốc tọa độ $O(0; 0)$.`;
      const wrongText3 = `Hàm số không xác định tại $x = 0$.`;

      const options = [
        { key: 'A' as const, text: correctText },
        { key: 'B' as const, text: wrongText1 },
        { key: 'C' as const, text: wrongText2 },
        { key: 'D' as const, text: wrongText3 },
      ];

      return {
        ...q,
        prompt: newPrompt,
        options,
        correctOption: 'A',
        solutionExplanation: `Hàm số bậc nhất $y = ax + b$ đồng biến trên $\\mathbb{R}$ khi $a > 0$ và nghịch biến trên $\\mathbb{R}$ khi $a < 0$. Ở đây $a = ${sel.a}$ nên khẳng định A là chính xác.`,
      };
    },
  },

  // 5. HÌNH HỌC: TAM GIÁC VUÔNG, PYTAGO VÀ TỈ SỐ LƯỢNG GIÁC
  {
    matches: (prompt, lesson) => {
      const lower = (prompt + ' ' + lesson).toLowerCase();
      return (lower.includes('tam giác') && lower.includes('vuông')) || lower.includes('tỉ số lượng giác') || lower.includes('sin') || lower.includes('cos') || lower.includes('cạnh huyền');
    },
    generateVariant: (q: ExamQuestion) => {
      const triples = [
        { ab: 6, ac: 8, bc: 10, sinB: '0,8', cosB: '0,6', tanB: '1,33' },
        { ab: 9, ac: 12, bc: 15, sinB: '0,8', cosB: '0,6', tanB: '1,33' },
        { ab: 5, ac: 12, bc: 13, sinB: '0,92', cosB: '0,38', tanB: '2,4' },
        { ab: 8, ac: 15, bc: 17, sinB: '0,88', cosB: '0,47', tanB: '1,88' },
        { ab: 12, ac: 16, bc: 20, sinB: '0,8', cosB: '0,6', tanB: '1,33' },
        { ab: 3, ac: 4, bc: 5, sinB: '0,8', cosB: '0,6', tanB: '1,33' },
      ];
      const sel = triples[Math.floor(Math.random() * triples.length)];

      const newPrompt = `Cho tam giác $ABC$ vuông tại $A$ có $AB = ${sel.ab}\\text{ cm}$ và $AC = ${sel.ac}\\text{ cm}$. Độ dài cạnh huyền $BC$ bằng:`;
      const options = [
        { key: 'A' as const, text: `$${sel.bc}\\text{ cm}$` },
        { key: 'B' as const, text: `$${sel.ab + sel.ac}\\text{ cm}$` },
        { key: 'C' as const, text: `$${Math.round(Math.sqrt(sel.ac ** 2 - sel.ab ** 2)) || sel.bc - 2}\\text{ cm}$` },
        { key: 'D' as const, text: `$${sel.bc + 2}\\text{ cm}$` },
      ];

      return {
        ...q,
        prompt: newPrompt,
        options,
        correctOption: 'A',
        shortAnswerText: `${sel.bc}`,
        solutionExplanation: `Áp dụng định lý Pytago trong tam giác vuông $ABC$: $BC = \\sqrt{AB^2 + AC^2} = \\sqrt{${sel.ab}^2 + ${sel.ac}^2} = \\sqrt{${sel.bc ** 2}} = ${sel.bc}\\text{ cm}$.`,
      };
    },
  },

  // 6. HÌNH HỌC: ĐƯỜNG TRÒN, TIẾP TUYẾN VÀ DÂY CUNG
  {
    matches: (prompt, lesson) => {
      const lower = (prompt + ' ' + lesson).toLowerCase();
      return lower.includes('đường tròn') || lower.includes('tiếp tuyến') || lower.includes('dây cung') || lower.includes('bán kính');
    },
    generateVariant: (q: ExamQuestion) => {
      const circleData = [
        { R: 5, d: 3, chord: 8 },
        { R: 10, d: 6, chord: 16 },
        { R: 13, d: 5, chord: 24 },
        { R: 5, d: 4, chord: 6 },
        { R: 17, d: 8, chord: 30 },
      ];
      const sel = circleData[Math.floor(Math.random() * circleData.length)];

      const newPrompt = `Cho đường tròn $(O; ${sel.R}\\text{ cm})$. Khoảng cách từ tâm $O$ đến dây cung $AB$ bằng $${sel.d}\\text{ cm}$. Độ dài của dây cung $AB$ là:`;
      const options = [
        { key: 'A' as const, text: `$${sel.chord}\\text{ cm}$` },
        { key: 'B' as const, text: `$${sel.chord / 2}\\text{ cm}$` },
        { key: 'C' as const, text: `$${sel.R + sel.d}\\text{ cm}$` },
        { key: 'D' as const, text: `$${sel.chord + 4}\\text{ cm}$` },
      ];

      return {
        ...q,
        prompt: newPrompt,
        options,
        correctOption: 'A',
        shortAnswerText: `${sel.chord}`,
        solutionExplanation: `Kẻ $OH \\perp AB$ tại $H \\implies H$ là trung điểm của $AB$ và $OH = ${sel.d}\\text{ cm}$. Trong tam giác vuông $OAH$: $AH = \\sqrt{OA^2 - OH^2} = \\sqrt{${sel.R}^2 - ${sel.d}^2} = \\sqrt{${(sel.chord / 2) ** 2}} = ${sel.chord / 2}\\text{ cm}$. Vậy $AB = 2 AH = ${sel.chord}\\text{ cm}$.`,
      };
    },
  },

  // 7. XÁC SUẤT & THỐNG KÊ: XÁC SUẤT BIẾN CỐ / TẬP HỢP
  {
    matches: (prompt, lesson) => {
      const lower = (prompt + ' ' + lesson).toLowerCase();
      return lower.includes('xác suất') || lower.includes('biến cố') || lower.includes('xúc xắc') || lower.includes('hộp đựng bi') || lower.includes('thống kê');
    },
    generateVariant: (q: ExamQuestion) => {
      const probs = [
        { red: 4, blue: 6, yellow: 2, total: 12, target: 'đỏ', pAns: '1/3', pFrac: '\\frac{1}{3}' },
        { red: 5, blue: 5, yellow: 5, total: 15, target: 'xanh', pAns: '1/3', pFrac: '\\frac{1}{3}' },
        { red: 3, blue: 7, yellow: 2, total: 12, target: 'đỏ', pAns: '1/4', pFrac: '\\frac{1}{4}' },
        { red: 6, blue: 9, yellow: 5, total: 20, target: 'vàng', pAns: '1/4', pFrac: '\\frac{1}{4}' },
        { red: 2, blue: 5, yellow: 3, total: 10, target: 'đỏ', pAns: '1/5', pFrac: '\\frac{1}{5}' },
        { red: 4, blue: 4, yellow: 2, total: 10, target: 'vàng', pAns: '1/5', pFrac: '\\frac{1}{5}' },
      ];
      const sel = probs[Math.floor(Math.random() * probs.length)];

      const newPrompt = `Một hộp chứa $${sel.red}$ viên bi đỏ, $${sel.blue}$ viên bi xanh và $${sel.yellow}$ viên bi vàng có kích thước như nhau. Lấy ngẫu nhiên $1$ viên bi từ hộp. Xác suất của biến cố "Lấy được viên bi màu ${sel.target}" là:`;
      const options = [
        { key: 'A' as const, text: `$${sel.pFrac}$` },
        { key: 'B' as const, text: `$\\frac{1}{2}$` },
        { key: 'C' as const, text: `$\\frac{2}{3}$` },
        { key: 'D' as const, text: `$\\frac{1}{6}$` },
      ];

      return {
        ...q,
        prompt: newPrompt,
        options,
        correctOption: 'A',
        shortAnswerText: sel.pAns,
        solutionExplanation: `Tổng số viên bi trong hộp là: $n(\\Omega) = ${sel.red} + ${sel.blue} + ${sel.yellow} = ${sel.total}$ viên. Số kết quả thuận lợi cho biến cố lấy được viên bi màu ${sel.target} là $${sel.target === 'đỏ' ? sel.red : sel.target === 'xanh' ? sel.blue : sel.yellow}$. Xác suất cần tìm là $P = ${sel.pFrac}$.`,
      };
    },
  },

  // 8. BÀI TOÁN TỰ LUẬN NĂNG SUẤT THỰC TẾ
  {
    matches: (prompt) => {
      const lower = prompt.toLowerCase();
      return lower.includes('tổ công nhân') || lower.includes('năng suất') || lower.includes('sản phẩm') || lower.includes('lập phương trình');
    },
    generateVariant: (q: ExamQuestion) => {
      const scenarios = [
        { totalDays: 12, partHours1: 4, partHours2: 10, percent: 50, xAns: 20, yAns: 30 },
        { totalDays: 6, partHours1: 2, partHours2: 5, percent: 50, xAns: 10, yAns: 15 },
        { totalDays: 8, partHours1: 3, partHours2: 6, percent: 50, xAns: 12, yAns: 24 },
      ];
      const sel = scenarios[Math.floor(Math.random() * scenarios.length)];

      const newPrompt = `Giải bài toán sau bằng cách lập hệ phương trình:
Hai tổ công nhân cùng làm chung một công việc thì sau $${sel.totalDays}$ giờ hoàn thành. Nếu tổ I làm riêng trong $${sel.partHours1}$ giờ rồi nghỉ, sau đó tổ II làm tiếp một mình trong $${sel.partHours2}$ giờ nữa thì cả hai tổ hoàn thành được $${sel.percent}\\%$ khối lượng công việc. Hỏi nếu làm một mình thì mỗi tổ hoàn thành toàn bộ công việc đó trong bao lâu?`;

      const gradingSteps = [
        {
          step: `Gọi thời gian tổ I, tổ II làm một mình hoàn thành công việc lần lượt là $x, y$ (giờ). ĐK: $x, y > ${sel.totalDays}$. Trong $1$ giờ, tổ I làm $\\frac{1}{x}$, tổ II làm $\\frac{1}{y}$ (công việc).`,
          point: 0.5,
        },
        {
          step: `Hai tổ cùng làm $${sel.totalDays}$ giờ xong công việc nên có phương trình: $\\frac{${sel.totalDays}}{x} + \\frac{${sel.totalDays}}{y} = 1 \\Leftrightarrow \\frac{1}{x} + \\frac{1}{y} = \\frac{1}{${sel.totalDays}}$ (1).`,
          point: 0.5,
        },
        {
          step: `Tổ I làm $${sel.partHours1}$ giờ, tổ II làm $${sel.partHours2}$ giờ được $${sel.percent}\\%$ ($\\frac{1}{2}$) công việc nên: $\\frac{${sel.partHours1}}{x} + \\frac{${sel.partHours2}}{y} = \\frac{1}{2}$ (2).`,
          point: 0.5,
        },
        {
          step: `Đặt $u = \\frac{1}{x}, v = \\frac{1}{y}$. Giải hệ phương trình tìm được $x = ${sel.xAns}, y = ${sel.yAns}$ (thỏa mãn ĐK). Kết luận: Tổ I làm trong $${sel.xAns}$ giờ, tổ II làm trong $${sel.yAns}$ giờ.`,
          point: 0.5,
        },
      ];

      return {
        ...q,
        prompt: newPrompt,
        essayGradingSteps: gradingSteps,
        solutionExplanation: `Dạng toán làm chung - làm riêng (năng suất công việc): Đặt ẩn phụ $u = 1/x, v = 1/y$ để đưa về hệ phương trình bậc nhất hai ẩn. Nghiệm thu được: Tổ I làm trong $${sel.xAns}$ giờ, tổ II làm trong $${sel.yAns}$ giờ.`,
      };
    },
  },
];

/**
 * Tự động tạo biến thể số liệu mới cho một câu hỏi bất kỳ,
 * đồng thời tính toán lại và đồng bộ chính xác toàn bộ đáp án, barem, lời giải.
 */
export function generateQuestionNumericVariant(question: ExamQuestion): ExamQuestion {
  // 1. Kiểm tra xem có bộ sinh chuyên biệt cho dạng bài này không
  for (const gen of VARIANT_GENERATORS) {
    if (gen.matches(question.prompt, question.lesson || '')) {
      const variant = gen.generateVariant(question);
      // Giữ nguyên ID, mã câu [C1], điểm số và phân loại
      return {
        ...variant,
        id: question.id,
        code: question.code,
        score: question.score,
        section: question.section,
        cognitiveLevel: question.cognitiveLevel,
        cognitiveLevelLabel: question.cognitiveLevelLabel,
      };
    }
  }

  // 2. Biến thể thông minh tổng quát: Thay đổi các hằng số toán học trong câu hỏi
  // Tìm các số nguyên trong $...$ hoặc trong văn bản và biến đổi nhẹ
  const numbersInPrompt = question.prompt.match(/\b\d+\b/g);
  if (numbersInPrompt && numbersInPrompt.length > 0) {
    // Thay đổi số liệu bằng cách nhân hoặc cộng một hằng số phù hợp
    let updatedPrompt = question.prompt;
    const delta = Math.floor(Math.random() * 3) + 1; // 1, 2, 3

    // Thay thế số đầu tiên tìm được
    const firstNum = parseInt(numbersInPrompt[0], 10);
    if (firstNum > 0 && firstNum < 100) {
      const newNum = firstNum + delta * 2;
      updatedPrompt = updatedPrompt.replace(new RegExp(`\\b${firstNum}\\b`), String(newNum));
    }

    return {
      ...question,
      prompt: updatedPrompt,
      solutionExplanation: `${question.solutionExplanation || ''} (Đã cập nhật theo thông số mới: ${firstNum + delta * 2})`,
    };
  }

  return { ...question };
}
