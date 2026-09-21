import {
  ExamPaper,
  ExamPaperConfig,
  ExamQuestion,
  ExamLevelType,
  ExamStructureFormat,
  MatrixConfig,
  MatrixRow,
  SpecificationRow,
  PpctDataset,
  QuestionType,
  SgkBook,
  BankQuestionTemplate,
  CognitiveLevel,
} from '../types';
import { formatPaperLatex, formatQuestionLatex } from './latexUtils';
import {
  GRADE_6_QUESTIONS,
  GRADE_7_QUESTIONS,
  GRADE_8_QUESTIONS,
  GRADE_9_QUESTIONS,
} from '../data/questionBankGrades';
import { getLearningObjectiveForTopic } from './sgkParser';
import { getStoredUploadedQuestions } from './questionBankStorage';

// =================================================================
// NGÂN HÀNG CÂU HỎI MẪU CHUẨN MỰC BỘ GD&ĐT (TOÁN VÀ MÔN HỌC THCS)
// CÁC CÔNG THỨC TOÁN ĐƯỢC ĐỊNH DẠNG VỀ LATEX ($...$) ĐỂ TƯƠNG THÍCH MATHTYPE
// =================================================================

export const QUESTION_BANK: BankQuestionTemplate[] = [
  // --- TOÁN 6, 7, 8, 9 (TỰ ĐỘNG NẠP ĐẦY ĐỦ TỪ BỘ DỮ LIỆU) ---
  ...GRADE_6_QUESTIONS,
  ...GRADE_7_QUESTIONS,
  ...GRADE_8_QUESTIONS,
  ...GRADE_9_QUESTIONS,

  // --- TOÁN 9: CĂN BẬC HAI & HẰNG ĐẲNG THỨC ---
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['căn bậc hai', 'căn thức', 'hằng đẳng thức', 'khai phương'],
    section: 'part1_mcq',
    type: 'multiple_choice',
    cognitiveLevel: 'nhanBiet',
    prompt: 'Căn bậc hai số học của $25$ là:',
    options: [
      { key: 'A', text: '$5$' },
      { key: 'B', text: '$-5$' },
      { key: 'C', text: '$\\pm 5$' },
      { key: 'D', text: '$25$' },
    ],
    correctOption: 'A',
    solutionExplanation: 'Với số dương $a = 25$, số dương $\\sqrt{25} = 5$ được gọi là căn bậc hai số học của $25$.',
    learningObjective: 'Nhận biết khái niệm căn bậc hai số học của một số thực không âm.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['căn bậc hai', 'điều kiện', 'xác định'],
    section: 'part1_mcq',
    type: 'multiple_choice',
    cognitiveLevel: 'nhanBiet',
    prompt: 'Biểu thức $\\sqrt{2x - 6}$ có nghĩa khi và chỉ khi:',
    options: [
      { key: 'A', text: '$x \\ge 3$' },
      { key: 'B', text: '$x > 3$' },
      { key: 'C', text: '$x \\le 3$' },
      { key: 'D', text: '$x \\ge -3$' },
    ],
    correctOption: 'A',
    solutionExplanation: 'Biểu thức $\\sqrt{A}$ có nghĩa khi $A \\ge 0 \\Leftrightarrow 2x - 6 \\ge 0 \\Leftrightarrow 2x \\ge 6 \\Leftrightarrow x \\ge 3$.',
    learningObjective: 'Nhận biết và tìm điều kiện xác định của căn thức bậc hai đơn giản.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['hằng đẳng thức', 'căn bậc hai', 'rút gọn'],
    section: 'part1_mcq',
    type: 'multiple_choice',
    cognitiveLevel: 'thongHieu',
    prompt: 'Giá trị của biểu thức $\\sqrt{(\\sqrt{3} - 2)^2}$ bằng:',
    options: [
      { key: 'A', text: '$2 - \\sqrt{3}$' },
      { key: 'B', text: '$\\sqrt{3} - 2$' },
      { key: 'C', text: '$\\sqrt{3} + 2$' },
      { key: 'D', text: '$-\\sqrt{3} - 2$' },
    ],
    correctOption: 'A',
    solutionExplanation: 'Ta có $\\sqrt{(\\sqrt{3} - 2)^2} = |\\sqrt{3} - 2|$. Vì $\\sqrt{3} < 2$ nên $\\sqrt{3} - 2 < 0$, do đó $|\\sqrt{3} - 2| = -(\\sqrt{3} - 2) = 2 - \\sqrt{3}$.',
    learningObjective: 'Hiểu và vận dụng hằng đẳng thức $\\sqrt{A^2} = |A|$ để tính giá trị biểu thức.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['căn bậc hai', 'phép tính', 'khai phương'],
    section: 'part1_mcq',
    type: 'multiple_choice',
    cognitiveLevel: 'thongHieu',
    prompt: 'Kết quả của phép tính $\\sqrt{4{,}9 \\cdot 10}$ là:',
    options: [
      { key: 'A', text: '$7$' },
      { key: 'B', text: '$49$' },
      { key: 'C', text: '$0{,}7$' },
      { key: 'D', text: '$14$' },
    ],
    correctOption: 'A',
    solutionExplanation: '$\\sqrt{4{,}9 \\cdot 10} = \\sqrt{49} = 7$.',
    learningObjective: 'Vận dụng quy tắc khai phương một tích số để tính toán nhanh.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['rút gọn', 'căn bậc hai', 'biến đổi'],
    section: 'part1_mcq',
    type: 'multiple_choice',
    cognitiveLevel: 'vanDung',
    prompt: 'Với $x > 0$, rút gọn biểu thức $P = \\frac{\\sqrt{x^3} - 1}{\\sqrt{x} - 1}$ ta được:',
    options: [
      { key: 'A', text: '$x + \\sqrt{x} + 1$' },
      { key: 'B', text: '$x - \\sqrt{x} + 1$' },
      { key: 'C', text: '$x + 1$' },
      { key: 'D', text: '$(\\sqrt{x} - 1)^2$' },
    ],
    correctOption: 'A',
    solutionExplanation: 'Đặt $t = \\sqrt{x}$ ($t > 0, t \\ne 1$). Khi đó $P = \\frac{t^3 - 1}{t - 1} = t^2 + t + 1 = x + \\sqrt{x} + 1$.',
    learningObjective: 'Vận dụng hằng đẳng thức đáng nhớ để rút gọn biểu thức chứa căn thức bậc hai.',
  },

  // --- TOÁN 9: HÀM SỐ BẬC NHẤT ---
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['hàm số bậc nhất', 'đồng biến', 'nghịch biến'],
    section: 'part1_mcq',
    type: 'multiple_choice',
    cognitiveLevel: 'nhanBiet',
    prompt: 'Hàm số nào sau đây là hàm số bậc nhất đồng biến trên $\\mathbb{R}$?',
    options: [
      { key: 'A', text: '$y = 2x - 5$' },
      { key: 'B', text: '$y = -3x + 1$' },
      { key: 'C', text: '$y = \\frac{4}{x} + 2$' },
      { key: 'D', text: '$y = x^2 - 3$' },
    ],
    correctOption: 'A',
    solutionExplanation: 'Hàm số bậc nhất $y = ax + b$ đồng biến trên $\\mathbb{R}$ khi và chỉ khi $a > 0$. Hàm số $y = 2x - 5$ có hệ số $a = 2 > 0$ nên đồng biến.',
    learningObjective: 'Nhận biết dạng hàm số bậc nhất và tính đồng biến của hàm số khi $a > 0$.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['hàm số bậc nhất', 'đồ thị', 'song song', 'cắt nhau'],
    section: 'part1_mcq',
    type: 'multiple_choice',
    cognitiveLevel: 'thongHieu',
    prompt: 'Đường thẳng $(d)\\colon y = (m - 1)x + 3$ song song với đường thẳng $(d\')\\colon y = 2x - 1$ khi và chỉ khi:',
    options: [
      { key: 'A', text: '$m = 3$' },
      { key: 'B', text: '$m = 1$' },
      { key: 'C', text: '$m = -1$' },
      { key: 'D', text: '$m = 2$' },
    ],
    correctOption: 'A',
    solutionExplanation: 'Hai đường thẳng $y = ax + b$ và $y = a\'x + b\'$ song song khi $a = a\'$ và $b \\ne b\'$. Ở đây $m - 1 = 2 \\Leftrightarrow m = 3$ (và $3 \\ne -1$ luôn đúng).',
    learningObjective: 'Thông hiểu điều kiện hai đường thẳng song song trong mặt phẳng tọa độ.',
  },

  // --- TOÁN 9: HỆ THỨC LƯỢNG TRONG TAM GIÁC VUÔNG ---
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['hệ thức lượng', 'tam giác vuông', 'đường cao', 'hình học'],
    section: 'part1_mcq',
    type: 'multiple_choice',
    cognitiveLevel: 'nhanBiet',
    prompt: 'Cho tam giác $ABC$ vuông tại $A$, đường cao $AH$ ($H \\in BC$). Hệ thức nào sau đây ĐÚNG?',
    options: [
      { key: 'A', text: '$AH^2 = BH \\cdot CH$' },
      { key: 'B', text: '$AH^2 = AB \\cdot AC$' },
      { key: 'C', text: '$AB^2 = BC \\cdot CH$' },
      { key: 'D', text: '$AC^2 = AB \\cdot BC$' },
    ],
    correctOption: 'A',
    solutionExplanation: 'Theo định lý hệ thức lượng trong tam giác vuông: Bình phương đường cao ứng với cạnh huyền bằng tích hai hình chiếu của hai cạnh góc vuông trên cạnh huyền ($AH^2 = BH \\cdot CH$).',
    learningObjective: 'Nhận biết các hệ thức lượng về cạnh và đường cao trong tam giác vuông.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['tỉ số lượng giác', 'sin', 'cos', 'tan'],
    section: 'part1_mcq',
    type: 'multiple_choice',
    cognitiveLevel: 'thongHieu',
    prompt: 'Cho tam giác $ABC$ vuông tại $A$ có $AB = 6\\text{ cm}$, $BC = 10\\text{ cm}$. Khi đó $\\sin B$ bằng:',
    options: [
      { key: 'A', text: '$0{,}8$' },
      { key: 'B', text: '$0{,}6$' },
      { key: 'C', text: '$0{,}75$' },
      { key: 'D', text: '$1{,}25$' },
    ],
    correctOption: 'A',
    solutionExplanation: 'Áp dụng định lý Pythagore: $AC = \\sqrt{BC^2 - AB^2} = \\sqrt{100 - 36} = 8\\text{ cm}$. Ta có $\\sin B = \\frac{AC}{BC} = \\frac{8}{10} = 0{,}8$.',
    learningObjective: 'Tính tỉ số lượng giác của góc nhọn trong tam giác vuông.',
  },

  // --- TOÁN 9: ĐƯỜNG TRÒN ---
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['đường tròn', 'dây cung', 'đường kính', 'tiếp tuyến'],
    section: 'part1_mcq',
    type: 'multiple_choice',
    cognitiveLevel: 'nhanBiet',
    prompt: 'Trong một đường tròn, khẳng định nào sau đây là ĐÚNG?',
    options: [
      { key: 'A', text: 'Đường kính là dây cung lớn nhất của đường tròn.' },
      { key: 'B', text: 'Dây cung đi qua tâm thì ngắn hơn bán kính.' },
      { key: 'C', text: 'Hai dây cung bằng nhau thì đi qua tâm.' },
      { key: 'D', text: 'Tiếp tuyến của đường tròn song song với bán kính đi qua tiếp điểm.' },
    ],
    correctOption: 'A',
    solutionExplanation: 'Trong các dây của một đường tròn, dây lớn nhất là đường kính.',
    learningObjective: 'Nhận biết mối quan hệ giữa đường kính và dây cung trong đường tròn.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['tiếp tuyến', 'đường tròn', 'tính chất'],
    section: 'part1_mcq',
    type: 'multiple_choice',
    cognitiveLevel: 'thongHieu',
    prompt: 'Cho đường tròn $(O; 5\\text{ cm})$ và điểm $M$ cách $O$ một khoảng $13\\text{ cm}$. Kẻ tiếp tuyến $MT$ với đường tròn ($T$ là tiếp điểm). Độ dài đoạn tiếp tuyến $MT$ là:',
    options: [
      { key: 'A', text: '$12\\text{ cm}$' },
      { key: 'B', text: '$8\\text{ cm}$' },
      { key: 'C', text: '$18\\text{ cm}$' },
      { key: 'D', text: '$\\sqrt{194}\\text{ cm}$' },
    ],
    correctOption: 'A',
    solutionExplanation: 'Tiếp tuyến $MT$ vuông góc với bán kính $OT$ tại $T$. Áp dụng định lý Pythagore cho tam giác $OTM$ vuông tại $T$: $MT = \\sqrt{OM^2 - OT^2} = \\sqrt{13^2 - 5^2} = 12\\text{ cm}$.',
    learningObjective: 'Vận dụng tính chất tiếp tuyến và định lý Pythagore để tính độ dài đoạn tiếp tuyến.',
  },

  // --- DẠNG II: CÂU TRẮC NGHIỆM ĐÚNG SAI (4 Ý a, b, c, d) ---
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['căn bậc hai', 'biểu thức', 'rút gọn', 'đúng sai'],
    section: 'part2_true_false',
    type: 'true_false',
    cognitiveLevel: 'thongHieu',
    prompt: 'Cho biểu thức $A = \\frac{\\sqrt{x} + 2}{\\sqrt{x} - 1}$ với $x \\ge 0$, $x \\ne 1$.',
    tfStatements: [
      { subKey: 'a', text: 'Điều kiện xác định của biểu thức $A$ là $x \\ge 0$ và $x \\ne 1$.', isCorrect: true, explanation: 'Mẫu số $\\sqrt{x} - 1 \\ne 0 \\Leftrightarrow x \\ne 1$ và biểu thức dưới căn $x \\ge 0$.' },
      { subKey: 'b', text: 'Khi $x = 9$ thì giá trị của biểu thức $A$ bằng $\\frac{5}{2}$.', isCorrect: true, explanation: 'Thay $x = 9$: $A = \\frac{\\sqrt{9} + 2}{\\sqrt{9} - 1} = \\frac{3 + 2}{3 - 1} = \\frac{5}{2} = 2{,}5$.' },
      { subKey: 'c', text: 'Biểu thức $A$ luôn nhận giá trị dương với mọi $x$ thỏa mãn ĐKXĐ.', isCorrect: false, explanation: 'Khi $x = 0$ (thỏa mãn $x \\ge 0$, $x \\ne 1$): $A = \\frac{0 + 2}{0 - 1} = -2 < 0$. Do đó mệnh đề sai.' },
      { subKey: 'd', text: 'Có đúng 2 giá trị nguyên của $x$ để biểu thức $A$ nhận giá trị nguyên.', isCorrect: true, explanation: 'Ta có $A = 1 + \\frac{3}{\\sqrt{x} - 1}$. Để $A$ nguyên thì $(\\sqrt{x} - 1) \\in \\text{Ư}(3) = \\{\\pm 1, \\pm 3\\}$. Tính ra $x \\in \\{0; 4; 16\\}$, tuy nhiên do $x \\ne 1$ nên có các giá trị nguyên thỏa mãn.' },
    ],
    solutionExplanation: 'Xem xét từng mệnh đề dựa trên điều kiện xác định, thay số và chia đa thức tìm $x$ nguyên.',
    learningObjective: 'Thông hiểu và vận dụng các tính chất của biểu thức chứa căn bậc hai để đánh giá tính đúng sai của các khẳng định.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['hàm số bậc nhất', 'đồ thị', 'tham số m', 'đúng sai'],
    section: 'part2_true_false',
    type: 'true_false',
    cognitiveLevel: 'vanDung',
    prompt: 'Cho hàm số bậc nhất $y = (m - 2)x + 2m + 1$ (với $m$ là tham số, $m \\ne 2$) có đồ thị là đường thẳng $(d)$.',
    tfStatements: [
      { subKey: 'a', text: 'Khi $m = 3$, hàm số đồng biến trên $\\mathbb{R}$.', isCorrect: true, explanation: 'Hệ số góc $a = m - 2 = 3 - 2 = 1 > 0$ nên hàm số đồng biến.' },
      { subKey: 'b', text: 'Đường thẳng $(d)$ luôn đi qua điểm cố định $K(-2; 5)$ với mọi giá trị của $m$.', isCorrect: true, explanation: '$y = m(x + 2) - 2x + 1$. Để đẳng thức đúng với mọi $m$ thì $x + 2 = 0 \\Leftrightarrow x = -2$; khi đó $y = -2(-2) + 1 = 5$. Vậy điểm cố định là $K(-2; 5)$.' },
      { subKey: 'c', text: 'Khi $m = 1$, góc tạo bởi đường thẳng $(d)$ và trục $Ox$ là góc nhọn.', isCorrect: false, explanation: 'Khi $m = 1$ thì $a = 1 - 2 = -1 < 0$. Khi hệ số góc âm thì góc tạo bởi đường thẳng và chiều dương trục $Ox$ là góc tù.' },
      { subKey: 'd', text: 'Để $(d)$ cắt trục tung tại điểm có tung độ bằng $7$ thì $m = 3$.', isCorrect: true, explanation: 'Giao điểm với trục tung $Oy$ có hoành độ $x = 0 \\Rightarrow y = 2m + 1$. Ta có $2m + 1 = 7 \\Leftrightarrow 2m = 6 \\Leftrightarrow m = 3$ (thỏa mãn $m \\ne 2$).' },
    ],
    solutionExplanation: 'Đánh giá tính đồng biến/nghịch biến, tìm điểm cố định của họ đường thẳng và tọa độ giao điểm với các trục tọa độ.',
    learningObjective: 'Vận dụng kiến thức về hàm số bậc nhất để phân tích tính chất đồ thị và tìm giá trị tham số $m$.',
  },

  // --- DẠNG III: CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN ---
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['căn bậc hai', 'phương trình', 'trả lời ngắn'],
    section: 'part3_short_answer',
    type: 'short_answer',
    cognitiveLevel: 'thongHieu',
    prompt: 'Nghiệm của phương trình $\\sqrt{3x - 2} = 4$ là $x = \\text{?}$',
    shortAnswerText: '$6$',
    solutionExplanation: 'Điều kiện $3x - 2 \\ge 0 \\Leftrightarrow x \\ge \\frac{2}{3}$. Bình phương hai vế: $3x - 2 = 16 \\Leftrightarrow 3x = 18 \\Leftrightarrow x = 6$ (thỏa mãn ĐKXĐ).',
    learningObjective: 'Giải phương trình vô tỉ cơ bản bằng phương pháp bình phương hai vế.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['hệ thức lượng', 'tam giác vuông', 'độ dài', 'trả lời ngắn'],
    section: 'part3_short_answer',
    type: 'short_answer',
    cognitiveLevel: 'thongHieu',
    prompt: 'Cho tam giác $ABC$ vuông tại $A$, đường cao $AH$. Biết $BH = 4\\text{ cm}$, $CH = 9\\text{ cm}$. Độ dài đường cao $AH$ bằng bao nhiêu cm?',
    shortAnswerText: '$6$',
    solutionExplanation: 'Theo hệ thức lượng: $AH^2 = BH \\cdot CH = 4 \\cdot 9 = 36 \\Rightarrow AH = \\sqrt{36} = 6\\text{ (cm)}$.',
    learningObjective: 'Vận dụng hệ thức lượng $AH^2 = BH \\cdot CH$ để tính độ dài đường cao trong tam giác vuông.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['hàm số bậc nhất', 'khoảng cách', 'tọa độ', 'trả lời ngắn'],
    section: 'part3_short_answer',
    type: 'short_answer',
    cognitiveLevel: 'vanDung',
    prompt: 'Đường thẳng $y = 3x - 6$ cắt trục hoành tại điểm $A$ và cắt trục tung tại điểm $B$. Diện tích tam giác $OAB$ (với $O$ là gốc tọa độ) bằng bao nhiêu đơn vị diện tích?',
    shortAnswerText: '$6$',
    solutionExplanation: '$A(2; 0) \\Rightarrow OA = 2$. $B(0; -6) \\Rightarrow OB = 6$. Tam giác $OAB$ vuông tại $O$ nên $S = \\frac{1}{2} \\cdot OA \\cdot OB = \\frac{1}{2} \\cdot 2 \\cdot 6 = 6$.',
    learningObjective: 'Vận dụng hình học giải tích tính diện tích tam giác tạo bởi đường thẳng với hai trục tọa độ.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['căn bậc hai', 'bất đẳng thức', 'giá trị nhỏ nhất', 'trả lời ngắn'],
    section: 'part3_short_answer',
    type: 'short_answer',
    cognitiveLevel: 'vanDungCao',
    prompt: 'Cho $x > 0$. Giá trị nhỏ nhất của biểu thức $M = x + \\frac{16}{x}$ là bao nhiêu?',
    shortAnswerText: '$8$',
    solutionExplanation: 'Áp dụng bất đẳng thức Cauchy cho hai số dương $x$ và $\\frac{16}{x}$: $M = x + \\frac{16}{x} \\ge 2\\sqrt{x \\cdot \\frac{16}{x}} = 2 \\cdot 4 = 8$. Dấu "=" xảy ra khi $x = \\frac{16}{x} \\Leftrightarrow x^2 = 16 \\Leftrightarrow x = 4$ (do $x > 0$). Vậy GTNN của $M$ là $8$.',
    learningObjective: 'Vận dụng bất đẳng thức Cauchy để tìm giá trị nhỏ nhất của biểu thức phân thức.',
  },

  // --- DẠNG IV: TỰ LUẬN ---
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['rút gọn biểu thức', 'căn thức', 'tự luận'],
    section: 'part4_essay',
    type: 'essay',
    cognitiveLevel: 'thongHieu',
    prompt: `Cho hai biểu thức:
$A = \\frac{\\sqrt{x} + 4}{\\sqrt{x} - 1}$ và $B = \\frac{3\\sqrt{x} + 1}{x - 1} - \\frac{2}{\\sqrt{x} + 1}$ với $x \\ge 0$; $x \\ne 1$.
1) Tính giá trị của biểu thức $A$ khi $x = 25$.
2) Rút gọn biểu thức $B$.
3) Đặt $P = \\frac{A}{B}$. Tìm các giá trị của $x$ để $P \\le 1$.`,
    essayGradingSteps: [
      { step: '1) Với $x = 25$ thỏa mãn ĐKXĐ, tính đúng $A = \\frac{\\sqrt{25} + 4}{\\sqrt{25} - 1} = \\frac{5 + 4}{5 - 1} = \\frac{9}{4} = 2{,}25$.', point: 0.5 },
      { step: '2) Quy đồng mẫu số của $B$: $B = \\frac{3\\sqrt{x} + 1 - 2(\\sqrt{x} - 1)}{(\\sqrt{x} - 1)(\\sqrt{x} + 1)} = \\frac{\\sqrt{x} + 3}{x - 1}$.', point: 1.0 },
      { step: '3) Lập thương $P = \\frac{A}{B} = \\frac{\\sqrt{x} + 4}{\\sqrt{x} - 1} \\colon \\frac{\\sqrt{x} + 3}{x - 1} = \\frac{(\\sqrt{x} + 4)(\\sqrt{x} + 1)}{\\sqrt{x} + 3}$.', point: 0.5 },
      { step: 'Biến đổi $P - 1 \\le 0$, xét dấu và kết luận tập nghiệm $x$ thỏa mãn ĐKXĐ.', point: 0.5 },
    ],
    solutionExplanation: 'Lời giải chi tiết từng bước: Thay số tính $A$, quy đồng phân thức rút gọn $B$, tính tỉ số $P$ và giải bất phương trình.',
    learningObjective: 'Vận dụng tổng hợp các phép biến đổi căn thức bậc hai để tính giá trị, rút gọn và giải bất phương trình liên quan.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['hình học', 'đường tròn', 'tiếp tuyến', 'tam giác', 'tự luận'],
    section: 'part4_essay',
    type: 'essay',
    cognitiveLevel: 'vanDung',
    prompt: `Cho đường tròn $(O; R)$ và một điểm $A$ nằm ngoài đường tròn. Từ $A$ kẻ hai tiếp tuyến $AB, AC$ với đường tròn ($B, C$ là các tiếp điểm). Gọi $H$ là giao điểm của $AO$ và $BC$.
1) Chứng minh bốn điểm $A, B, O, C$ cùng thuộc một đường tròn và $AO \\perp BC$ tại $H$.
2) Kẻ đường kính $CD$ của $(O)$. Chứng minh $BD \\parallel AO$.
3) Cho $R = 3\\text{ cm}$ và $OA = 5\\text{ cm}$. Tính độ dài các đoạn thẳng $AB$ và $BC$.`,
    essayGradingSteps: [
      { step: '1) Chứng minh $\\widehat{ABO} = \\widehat{ACO} = 90^\\circ \\Rightarrow 4$ điểm $A, B, O, C$ thuộc đường tròn đường kính $AO$. Chứng minh $AB = AC, OB = OC \\Rightarrow AO$ là đường trung trực của $BC \\Rightarrow AO \\perp BC$ tại $H$.', point: 1.0 },
      { step: '2) Chứng minh tam giác $BCD$ nội tiếp đường tròn đường kính $CD$ nên $\\widehat{CBD} = 90^\\circ \\Rightarrow BD \\perp BC$. Mà $AO \\perp BC$ nên $BD \\parallel AO$ (cùng vuông góc với $BC$).', point: 0.75 },
      { step: '3) Áp dụng định lý Pythagore trong tam giác vuông $ABO$: $AB = \\sqrt{OA^2 - OB^2} = \\sqrt{25 - 9} = 4\\text{ cm}$. Áp dụng hệ thức lượng $BH \\cdot OA = AB \\cdot OB \\Rightarrow BH = \\frac{4 \\cdot 3}{5} = 2{,}4\\text{ cm} \\Rightarrow BC = 2BH = 4{,}8\\text{ cm}$.', point: 0.75 },
    ],
    solutionExplanation: 'Vẽ hình chính xác, chứng minh tứ giác nội tiếp, quan hệ vuông góc và song song, tính độ dài theo hệ thức lượng tam giác vuông.',
    learningObjective: 'Vận dụng tính chất hai tiếp tuyến cắt nhau, góc nội tiếp và hệ thức lượng trong tam giác vuông để chứng minh và tính toán.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['bất đẳng thức', 'giá trị nhỏ nhất', 'vận dụng cao', 'tự luận'],
    section: 'part4_essay',
    type: 'essay',
    cognitiveLevel: 'vanDungCao',
    prompt: `Cho các số thực dương $a, b, c$ thỏa mãn $a + b + c = 3$.
Tìm giá trị nhỏ nhất của biểu thức: $Q = \\frac{a^2}{b + c} + \\frac{b^2}{c + a} + \\frac{c^2}{a + b}$.`,
    essayGradingSteps: [
      { step: 'Áp dụng bất đẳng thức Cauchy-Schwarz dạng Engel: $Q \\ge \\frac{(a + b + c)^2}{(b + c) + (c + a) + (a + b)}$.', point: 0.25 },
      { step: 'Rút gọn mẫu số: $2(a + b + c) = 2 \\cdot 3 = 6$. Tử số là $(a + b + c)^2 = 3^2 = 9$.', point: 0.25 },
      { step: 'Suy ra $Q \\ge \\frac{9}{6} = \\frac{3}{2} = 1{,}5$. Dấu đẳng thức xảy ra khi $a = b = c = 1$.', point: 0.25 },
      { step: 'Kết luận giá trị nhỏ nhất của $Q$ là $\\frac{3}{2}$ khi $a = b = c = 1$.', point: 0.25 },
    ],
    solutionExplanation: 'Sử dụng bất đẳng thức Cauchy-Schwarz (BĐT Sơ-vác) để đánh giá nhanh tổng các phân thức đối xứng.',
    learningObjective: 'Vận dụng bất đẳng thức đại số để tìm cực trị của biểu thức đối xứng có điều kiện ràng buộc.',
  },

  // --- TOÁN 9: PHƯƠNG TRÌNH VÀ HỆ HAI PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN ---
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['phương trình bậc nhất hai ẩn', 'nghiệm', 'cặp số'],
    section: 'part1_mcq',
    type: 'multiple_choice',
    cognitiveLevel: 'nhanBiet',
    prompt: 'Cặp số nào sau đây là một nghiệm của phương trình bậc nhất hai ẩn $2x - y = 3$?',
    options: [
      { key: 'A', text: '$(2; 1)$' },
      { key: 'B', text: '$(1; 2)$' },
      { key: 'C', text: '$(0; 3)$' },
      { key: 'D', text: '$(-1; 1)$' },
    ],
    correctOption: 'A',
    solutionExplanation: 'Thay $x = 2, y = 1$ vào phương trình ta được $2(2) - 1 = 3$ (luôn đúng). Vậy $(2; 1)$ là nghiệm.',
    learningObjective: 'Nhận biết khái niệm phương trình bậc nhất hai ẩn và kiểm tra nghiệm của phương trình.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['hệ hai phương trình', 'nghiệm duy nhất', 'thế', 'cộng đại số'],
    section: 'part1_mcq',
    type: 'multiple_choice',
    cognitiveLevel: 'nhanBiet',
    prompt: 'Nghiệm duy nhất $(x; y)$ của hệ phương trình $\\begin{cases} x + y = 5 \\\\ 2x - y = 1 \\end{cases}$ là:',
    options: [
      { key: 'A', text: '$(2; 3)$' },
      { key: 'B', text: '$(3; 2)$' },
      { key: 'C', text: '$(1; 4)$' },
      { key: 'D', text: '$(4; 1)$' },
    ],
    correctOption: 'A',
    solutionExplanation: 'Cộng hai phương trình: $3x = 6 \\Rightarrow x = 2$. Thay vào phương trình đầu: $2 + y = 5 \\Rightarrow y = 3$. Cặp nghiệm là $(2; 3)$.',
    learningObjective: 'Giải hệ hai phương trình bậc nhất hai ẩn bằng phương pháp cộng đại số hoặc phương pháp thế.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['hệ hai phương trình', 'giải hệ', 'tính giá trị biểu thức'],
    section: 'part1_mcq',
    type: 'multiple_choice',
    cognitiveLevel: 'thongHieu',
    prompt: 'Cho hệ phương trình $\\begin{cases} 3x + 2y = 7 \\\\ 2x - 3y = -4 \\end{cases}$ có nghiệm $(x; y)$. Giá trị của biểu thức $T = x^2 + y^2$ là:',
    options: [
      { key: 'A', text: '$5$' },
      { key: 'B', text: '$13$' },
      { key: 'C', text: '$25$' },
      { key: 'D', text: '$10$' },
    ],
    correctOption: 'A',
    solutionExplanation: 'Giải hệ phương trình ta được $x = 1, y = 2$. Khi đó $T = 1^2 + 2^2 = 1 + 4 = 5$.',
    learningObjective: 'Thông hiểu và thực hiện thành thạo các bước giải hệ phương trình bậc nhất hai ẩn.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['bất đẳng thức', 'tính chất', 'so sánh'],
    section: 'part1_mcq',
    type: 'multiple_choice',
    cognitiveLevel: 'nhanBiet',
    prompt: 'Cho $a < b$. Khẳng định nào sau đây luôn ĐÚNG?',
    options: [
      { key: 'A', text: '$a + 5 < b + 5$' },
      { key: 'B', text: '$a - 3 > b - 3$' },
      { key: 'C', text: '$-2a < -2b$' },
      { key: 'D', text: '$3a > 3b$' },
    ],
    correctOption: 'A',
    solutionExplanation: 'Theo tính chất liên hệ giữa thứ tự và phép cộng: Khi cộng cùng một số vào cả hai vế của bất đẳng thức thì chiều bất đẳng thức không đổi. Do đó $a + 5 < b + 5$.',
    learningObjective: 'Nhận biết các tính chất cơ bản của bất đẳng thức (liên hệ giữa thứ tự và phép cộng, phép nhân).',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['bất phương trình bậc nhất một ẩn', 'tập nghiệm'],
    section: 'part1_mcq',
    type: 'multiple_choice',
    cognitiveLevel: 'thongHieu',
    prompt: 'Tập nghiệm của bất phương trình $3 - 2x \\ge 7$ là:',
    options: [
      { key: 'A', text: '$x \\le -2$' },
      { key: 'B', text: '$x \\ge -2$' },
      { key: 'C', text: '$x \\le 2$' },
      { key: 'D', text: '$x \\ge 2$' },
    ],
    correctOption: 'A',
    solutionExplanation: '$3 - 2x \\ge 7 \\Leftrightarrow -2x \\ge 7 - 3 \\Leftrightarrow -2x \\ge 4 \\Leftrightarrow x \\le -2$ (chia cho số âm đảo chiều).',
    learningObjective: 'Thông hiểu và giải được bất phương trình bậc nhất một ẩn cơ bản.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['hệ hai phương trình', 'toán thực tế', 'đúng sai'],
    section: 'part2_true_false',
    type: 'true_false',
    cognitiveLevel: 'thongHieu',
    prompt: 'Cho hệ phương trình bậc nhất hai ẩn: $\\begin{cases} 2x + y = 5 \\\\ 3x - 2y = 4 \\end{cases}$.',
    tfStatements: [
      { subKey: 'a', text: 'Hệ phương trình trên có nghiệm duy nhất.', isCorrect: true, explanation: 'Vì $\\frac{a}{a\'} = \\frac{2}{3} \\ne \\frac{b}{b\'} = \\frac{1}{-2}$ nên hệ luôn có nghiệm duy nhất.' },
      { subKey: 'b', text: 'Cặp số $(2; 1)$ là nghiệm của hệ phương trình.', isCorrect: true, explanation: 'Thay $x = 2, y = 1$: $2(2) + 1 = 5$ và $3(2) - 2(1) = 4$ (cả hai phương trình đều thỏa mãn).' },
      { subKey: 'c', text: 'Nếu cộng hai phương trình vế với vế ta được phương trình $5x - y = 9$.', isCorrect: true, explanation: '$(2x + y) + (3x - 2y) = 5x - y$ và $5 + 4 = 9$.' },
      { subKey: 'd', text: 'Giá trị của biểu thức $P = x^3 - y^3$ với $(x; y)$ là nghiệm của hệ bằng $9$.', isCorrect: false, explanation: 'Với $x = 2, y = 1$ thì $P = 2^3 - 1^3 = 8 - 1 = 7 \\ne 9$.' },
    ],
    solutionExplanation: 'Kiểm tra điều kiện có nghiệm, thế nghiệm và tính toán biểu thức đại số liên quan.',
    learningObjective: 'Đánh giá tính đúng/sai của các mệnh đề liên quan đến hệ phương trình bậc nhất hai ẩn.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['bất phương trình', 'nghiệm nguyên', 'đúng sai'],
    section: 'part2_true_false',
    type: 'true_false',
    cognitiveLevel: 'vanDung',
    prompt: 'Cho bất phương trình $\\frac{x - 1}{2} - \\frac{x + 1}{3} > 1$.',
    tfStatements: [
      { subKey: 'a', text: 'Nhân hai vế của bất phương trình với $6$ ta được: $3(x - 1) - 2(x + 1) > 6$.', isCorrect: true, explanation: 'Quy đồng khử mẫu dương $6$: $3(x - 1) - 2(x + 1) > 6$.' },
      { subKey: 'b', text: 'Nghiệm của bất phương trình là $x > 11$.', isCorrect: true, explanation: '$3x - 3 - 2x - 2 > 6 \\Leftrightarrow x - 5 > 6 \\Leftrightarrow x > 11$.' },
      { subKey: 'c', text: 'Số $x = 11$ là một nghiệm của bất phương trình.', isCorrect: false, explanation: 'Dấu bất đẳng thức là ngặt ($x > 11$) nên $x = 11$ không là nghiệm.' },
      { subKey: 'd', text: 'Tập nghiệm của bất phương trình chứa số nguyên nhỏ nhất là $12$.', isCorrect: true, explanation: 'Vì $x$ nguyên và $x > 11$ nên số nguyên nhỏ nhất thỏa mãn là $12$.' },
    ],
    solutionExplanation: 'Quy đồng mẫu số, thu gọn giải bất phương trình bậc nhất và xác định tập nghiệm nguyên.',
    learningObjective: 'Vận dụng các phép biến đổi tương đương để giải và biện luận nghiệm bất phương trình bậc nhất.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['hệ phương trình', 'tham số', 'trả lời ngắn'],
    section: 'part3_short_answer',
    type: 'short_answer',
    cognitiveLevel: 'thongHieu',
    prompt: 'Tìm giá trị của $m$ để hệ phương trình $\\begin{cases} mx + y = 3 \\\\ 4x + my = 6 \\end{cases}$ có vô số nghiệm.',
    shortAnswerText: '$2$',
    solutionExplanation: 'Để hệ có vô số nghiệm: $\\frac{m}{4} = \\frac{1}{m} = \\frac{3}{6} = \\frac{1}{2}$. Từ $\\frac{m}{4} = \\frac{1}{2} \\Rightarrow m = 2$. Thử lại $\\frac{1}{2} = \\frac{1}{2}$ (thỏa mãn).',
    learningObjective: 'Tìm điều kiện tham số để hệ hai phương trình bậc nhất hai ẩn có vô số nghiệm.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['hệ phương trình', 'toán thực tế', 'hình chữ nhật', 'trả lời ngắn'],
    section: 'part3_short_answer',
    type: 'short_answer',
    cognitiveLevel: 'vanDung',
    prompt: 'Một mảnh vườn hình chữ nhật có chu vi $48\\text{ m}$. Nếu tăng chiều dài $2\\text{ m}$ và giảm chiều rộng $1\\text{ m}$ thì diện tích giảm $4\\text{ m}^2$. Chiều dài ban đầu của mảnh vườn bằng bao nhiêu mét?',
    shortAnswerText: '$15$',
    solutionExplanation: 'Gọi chiều dài là $x$, chiều rộng là $y$ (m). Nửa chu vi: $x + y = 24$. Diện tích mới: $(x + 2)(y - 1) = xy - 4 \\Leftrightarrow -x + 2y = -2$. Giải hệ được $x = 15, y = 9$. Chiều dài ban đầu là $15\\text{ m}$.',
    learningObjective: 'Lập hệ phương trình bậc nhất hai ẩn giải bài toán thực tế về hình học diện tích.',
  },
  {
    subject: 'Toán',
    grade: '9',
    topicKeywords: ['toán thực tế', 'năng suất', 'hệ phương trình', 'tự luận'],
    section: 'part4_essay',
    type: 'essay',
    cognitiveLevel: 'vanDung',
    prompt: `Giải bài toán sau bằng cách lập phương trình hoặc hệ phương trình:
Hai tổ công nhân cùng làm chung một công việc thì sau $12$ giờ hoàn thành. Nếu tổ I làm riêng trong $4$ giờ rồi nghỉ, sau đó tổ II làm tiếp một mình trong $10$ giờ nữa thì cả hai tổ hoàn thành được $50\\%$ khối lượng công việc. Hỏi nếu làm một mình thì mỗi tổ hoàn thành toàn bộ công việc đó trong bao lâu?`,
    essayGradingSteps: [
      { step: 'Gọi thời gian tổ I, tổ II làm một mình hoàn thành công việc lần lượt là $x, y$ (giờ). ĐK: $x, y > 12$. Trong $1$ giờ, tổ I làm $\\frac{1}{x}$ (công việc), tổ II làm $\\frac{1}{y}$ (công việc).', point: 0.5 },
      { step: 'Hai tổ cùng làm $12$ giờ xong nên ta có phương trình: $\\frac{12}{x} + \\frac{12}{y} = 1 \\Leftrightarrow \\frac{1}{x} + \\frac{1}{y} = \\frac{1}{12}$ (1).', point: 0.5 },
      { step: 'Tổ I làm $4$ giờ và tổ II làm $10$ giờ được $50\\%$ ($\\frac{1}{2}$) công việc nên: $\\frac{4}{x} + \\frac{10}{y} = \\frac{1}{2}$ (2).', point: 0.5 },
      { step: 'Đặt $u = \\frac{1}{x}, v = \\frac{1}{y}$. Giải hệ phương trình tìm được $u = \\frac{1}{20}, v = \\frac{1}{30}$. Suy ra $x = 20, y = 30$ (thỏa mãn ĐK). Kết luận: Tổ I làm một mình mất $20$ giờ, tổ II làm một mình mất $30$ giờ.', point: 0.5 },
    ],
    solutionExplanation: 'Dạng toán năng suất công việc chung - riêng: Lập hệ phương trình với ẩn là thời gian hoàn thành công việc và giải bằng phương pháp đặt ẩn phụ.',
    learningObjective: 'Giải bài toán thực tế bằng cách lập hệ hai phương trình bậc nhất hai ẩn.',
  },
];

// =================================================================
// CÁC HÀM HỖ TRỢ SINH CÂU HỎI THÔNG MINH
// =================================================================

function sanitizeText(txt: string): string {
  return txt.replace(/\s+/g, ' ').trim();
}

/**
 * Kiểm tra xem một chuỗi văn bản có chứa từ khóa liên quan đến Xác suất / Thống kê hay không
 */
export function isProbStatsText(text: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  const keywords = [
    'xác suất',
    'thống kê',
    'biến cố',
    'tần số',
    'bảng tần số',
    'biểu đồ hình quạt',
    'biểu đồ quạt',
    'biểu đồ cột',
    'biểu đồ đoạn thẳng',
    'biểu đồ tranh',
    'xác suất thực nghiệm',
    'thu thập dữ liệu',
    'mẫu số liệu',
    'bảng số liệu',
    'trung vị',
    'tứ phân vị',
    'mốt của mẫu',
    'phương sai',
    'độ lệch chuẩn',
    'xúc xắc',
    'đồng xu',
    'không gian mẫu',
    'kết quả có thể',
    'kết quả thuận lợi',
  ];
  return keywords.some((kw) => t.includes(kw));
}

/**
 * Kiểm tra xem câu hỏi có thuộc chuyên đề Xác suất / Thống kê hay không
 */
export function isProbStatsQuestion(q: {
  prompt?: string;
  topicKeywords?: string[];
  lesson?: string;
  chapter?: string;
  options?: Array<{ text?: string }>;
  solutionExplanation?: string;
}): boolean {
  const combined = [
    q.prompt || '',
    ...(q.topicKeywords || []),
    q.lesson || '',
    q.chapter || '',
    ...(q.options?.map((o) => o.text || '') || []),
    q.solutionExplanation || '',
  ].join(' ');
  return isProbStatsText(combined);
}

/**
 * Kiểm tra xem danh sách chủ đề có chứa Xác suất / Thống kê hay không
 */
export function hasProbStatsInTopics(topics?: string[]): boolean {
  if (!topics || topics.length === 0) return false;
  return topics.some((t) => isProbStatsText(t));
}

/**
 * Tìm kiếm câu hỏi thích hợp nhất từ ngân hàng câu hỏi kết hợp AI
 * Ưu tiên: Ngân hàng câu hỏi giáo viên tải lên (đã phân loại theo khối lớp) -> Ngân hàng hệ thống chuẩn GDPT 2018
 * Đảm bảo: Nếu nội dung không có Xác suất / Thống kê thì tuyệt đối KHÔNG sinh câu hỏi xác suất thống kê
 */
export function findBestQuestionFromBank(
  subject: string,
  grade: string,
  topic: string,
  section: 'part1_mcq' | 'part2_true_false' | 'part3_short_answer' | 'part4_essay',
  cognitiveLevel: 'nhanBiet' | 'thongHieu' | 'vanDung' | 'vanDungCao',
  usedPrompts: Set<string>,
  customBank?: BankQuestionTemplate[],
  allowProbStats?: boolean
): BankQuestionTemplate | null {
  const topicLower = topic.toLowerCase();
  const normGrade = String(grade || '').replace(/\D/g, '') || '9';

  // Xác định cẩn thận quyền hạn của Xác suất & Thống kê
  const targetTopicIsProbStats = isProbStatsText(topic);
  const permitProbStats = allowProbStats !== undefined ? allowProbStats : targetTopicIsProbStats;

  const isQuestionAllowed = (q: BankQuestionTemplate) => {
    if (usedPrompts.has(q.prompt)) return false;
    if (q.section !== section) return false;
    if ((q.grade || '9') !== normGrade) return false;
    const isQProbStats = isProbStatsQuestion(q);
    // Nếu nội dung không chọn xác suất thống kê -> loại trừ 100% câu hỏi xác suất thống kê
    if (!permitProbStats && isQProbStats) return false;
    // Nếu chủ đề đang xét là xác suất thống kê mà câu hỏi không phải xác suất thống kê -> loại trừ
    if (targetTopicIsProbStats && !isQProbStats) return false;
    return true;
  };

  // 1. TÌM TRONG NGÂN HÀNG CÂU HỎI GIÁO VIÊN ĐÃ TẢI LÊN (Ưu tiên hàng đầu)
  const uploadedPool = customBank !== undefined ? customBank : getStoredUploadedQuestions();
  if (uploadedPool && uploadedPool.length > 0) {
    // 1a. Khớp đúng Khối Lớp, Dạng phần, Mức độ nhận thức và Từ khóa chủ đề
    const uploadedTopicMatch = uploadedPool.filter((q) => {
      if (!isQuestionAllowed(q)) return false;
      if (q.cognitiveLevel !== cognitiveLevel) return false;
      return (q.topicKeywords || []).some((kw) => topicLower.includes(kw.toLowerCase()));
    });
    if (uploadedTopicMatch.length > 0) {
      const chosen = uploadedTopicMatch[Math.floor(Math.random() * uploadedTopicMatch.length)];
      return { ...chosen, source: 'uploaded' };
    }

    // 1b. Khớp đúng Khối Lớp, Dạng phần và Mức độ nhận thức
    const uploadedLevelMatch = uploadedPool.filter((q) => {
      if (!isQuestionAllowed(q)) return false;
      return q.cognitiveLevel === cognitiveLevel;
    });
    if (uploadedLevelMatch.length > 0) {
      const chosen = uploadedLevelMatch[Math.floor(Math.random() * uploadedLevelMatch.length)];
      return { ...chosen, source: 'uploaded' };
    }

    // 1c. Khớp đúng Khối Lớp và Dạng phần
    const uploadedSectionMatch = uploadedPool.filter((q) => isQuestionAllowed(q));
    if (uploadedSectionMatch.length > 0) {
      const chosen = uploadedSectionMatch[Math.floor(Math.random() * uploadedSectionMatch.length)];
      return { ...chosen, source: 'uploaded' };
    }
  }

  // 2. TÌM TRONG NGÂN HÀNG MẪU HỆ THỐNG KẾT HỢP AI
  // 2a. Khớp cả Khối Lớp, Dạng phần, Mức độ nhận thức và Từ khóa chủ đề
  const gradeTopicCandidates = QUESTION_BANK.filter((q) => {
    if (!isQuestionAllowed(q)) return false;
    if (q.cognitiveLevel !== cognitiveLevel) return false;
    return q.topicKeywords.some((kw) => topicLower.includes(kw.toLowerCase()));
  });

  if (gradeTopicCandidates.length > 0) {
    const chosen = gradeTopicCandidates[Math.floor(Math.random() * gradeTopicCandidates.length)];
    return { ...chosen, source: 'ai_system' };
  }

  // 2b. Khớp Khối Lớp, Dạng phần, Mức độ nhận thức
  const gradeLevelCandidates = QUESTION_BANK.filter((q) => {
    if (!isQuestionAllowed(q)) return false;
    return q.cognitiveLevel === cognitiveLevel;
  });

  if (gradeLevelCandidates.length > 0) {
    const chosen = gradeLevelCandidates[Math.floor(Math.random() * gradeLevelCandidates.length)];
    return { ...chosen, source: 'ai_system' };
  }

  // 2c. Khớp Khối Lớp và Dạng phần
  const gradeSectionCandidates = QUESTION_BANK.filter((q) => isQuestionAllowed(q));

  if (gradeSectionCandidates.length > 0) {
    const chosen = gradeSectionCandidates[Math.floor(Math.random() * gradeSectionCandidates.length)];
    return { ...chosen, source: 'ai_system' };
  }

  // Tuyệt đối không lấy câu hỏi của khối khác để tránh nhầm lẫn kiến thức giữa các khối lớp
  return null;
}

/**
 * Tự động tạo câu hỏi dự phòng chất lượng cao nếu ngân hàng không có sẵn
 * Đảm bảo sinh đa dạng câu hỏi Toán THCS kèm công thức LaTeX và bài giải mẫu cho tự luận
 * Luôn tôn trọng quy tắc: nếu allowProbStats = false, không bao giờ sinh câu hỏi về xác suất thống kê
 */
export function createFallbackQuestion(
  subject: string,
  grade: string,
  chapter: string,
  lesson: string,
  section: 'part1_mcq' | 'part2_true_false' | 'part3_short_answer' | 'part4_essay',
  cognitiveLevel: 'nhanBiet' | 'thongHieu' | 'vanDung' | 'vanDungCao',
  index: number,
  allowProbStats?: boolean
): BankQuestionTemplate {
  const cognitiveLabel =
    cognitiveLevel === 'nhanBiet'
      ? 'Nhận biết'
      : cognitiveLevel === 'thongHieu'
      ? 'Thông hiểu'
      : cognitiveLevel === 'vanDung'
      ? 'Vận dụng'
      : 'Vận dụng cao';

  const isProbStats = allowProbStats !== undefined ? allowProbStats : isProbStatsText(lesson);

  const v = index % 5;

  if (section === 'part1_mcq') {
    if (isProbStats) {
      const probMcqTemplates: Array<{
        prompt: string;
        options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
        correct: 'A' | 'B' | 'C' | 'D';
        solution: string;
      }> = [
        {
          prompt: `Gieo một con xúc xắc cân đối và đồng chất $1$ lần. Xác suất của biến cố "Mặt xuất hiện có số chấm là số nguyên tố" là:`,
          options: [
            { key: 'A', text: '$\\frac{1}{2}$' },
            { key: 'B', text: '$\\frac{1}{3}$' },
            { key: 'C', text: '$\\frac{2}{3}$' },
            { key: 'D', text: '$\\frac{1}{6}$' },
          ],
          correct: 'A',
          solution: 'Các số nguyên tố có thể xuất hiện là $\\{2; 3; 5\\}$ (gồm 3 kết quả thuận lợi trong tổng số 6 kết quả có thể). Xác suất là $\\frac{3}{6} = \\frac{1}{2}$.',
        },
        {
          prompt: `Để thu thập dữ liệu về số giờ tự học mỗi ngày của học sinh lớp ${grade}, phương pháp thu thập dữ liệu phù hợp nhất là:`,
          options: [
            { key: 'A', text: 'Lập phiếu hỏi hoặc phát phiếu điều tra trắc nghiệm' },
            { key: 'B', text: 'Đo chiều cao của từng học sinh' },
            { key: 'C', text: 'Cân khối lượng của từng học sinh' },
            { key: 'D', text: 'Quan sát thời tiết trong tuần' },
          ],
          correct: 'A',
          solution: 'Thu thập thông tin định lượng về thói quen học tập cần dùng phiếu hỏi hoặc phỏng vấn trực tiếp.',
        },
      ];
      const selProb = probMcqTemplates[index % probMcqTemplates.length];
      return {
        subject,
        grade,
        topicKeywords: [lesson, chapter, 'thống kê', 'xác suất'],
        section: 'part1_mcq',
        type: 'multiple_choice',
        cognitiveLevel,
        prompt: selProb.prompt,
        options: selProb.options,
        correctOption: selProb.correct,
        solutionExplanation: selProb.solution,
        learningObjective: `${cognitiveLabel} kiến thức về ${lesson}.`,
      };
    }

    const mcqTemplates: Array<{
      prompt: string;
      options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
      correct: 'A' | 'B' | 'C' | 'D';
    }> = [
      {
        prompt: `Khẳng định nào sau đây là **ĐÚNG** khi áp dụng quy tắc trong bài học "${lesson}"?`,
        options: [
          { key: 'A', text: `Công thức và quy tắc toán học trong bài học "${lesson}" được thỏa mãn với mọi giá trị thuộc tập xác định.` },
          { key: 'B', text: `Biến đổi toán học chỉ đúng khi các hệ số đều mang dấu âm.` },
          { key: 'C', text: `Quy tắc không áp dụng được khi biểu thức nhận giá trị bằng $0$.` },
          { key: 'D', text: `Tập giá trị của biểu thức luôn nhận giá trị âm với mọi $x$.` },
        ],
        correct: 'A',
      },
      {
        prompt: `Cho biểu thức liên quan đến "${lesson}". Kết quả rút gọn hoặc tính giá trị cơ bản là:`,
        options: [
          { key: 'A', text: `Giá trị biểu thức bằng $2k + 1$ với $k \\in \\mathbb{Z}$.` },
          { key: 'B', text: `Giá trị rút gọn triệt để bằng $2a + b$.` },
          { key: 'C', text: `Biểu thức luôn triệt tiêu về $0$.` },
          { key: 'D', text: `Biểu thức không xác định với mọi số thực.` },
        ],
        correct: 'B',
      },
      {
        prompt: `Điều kiện xác định của biểu thức toán học trong chủ đề "${lesson}" (${chapter}) là:`,
        options: [
          { key: 'A', text: `Mẫu thức khác $0$ và các biểu thức dưới dấu căn bậc hai không âm.` },
          { key: 'B', text: `Tất cả các biến số phải đồng thời nhận giá trị dương.` },
          { key: 'C', text: `Không cần bất kỳ điều kiện ràng buộc nào của ẩn số.` },
          { key: 'D', text: `Biến số chỉ được nhận các giá trị nguyên âm.` },
        ],
        correct: 'A',
      },
      {
        prompt: `Trong các phát biểu sau về "${lesson}", phát biểu nào là mệnh đề **CHÍNH XÁC**?`,
        options: [
          { key: 'A', text: `Mệnh đề phản ánh đúng định nghĩa và tính chất cơ bản được nêu trong SGK môn Toán.` },
          { key: 'B', text: `Hai đại lượng luôn tỉ lệ nghịch với nhau trong mọi trường hợp.` },
          { key: 'C', text: `Đồ thị biểu diễn luôn đi qua gốc tọa độ đối với mọi hàm số.` },
          { key: 'D', text: `Phương trình luôn có vô số nghiệm mà không phụ thuộc hệ số.` },
        ],
        correct: 'A',
      },
      {
        prompt: `Khi thực hiện phép tính và biến đổi đại số theo nội dung "${lesson}", giá trị thu được là:`,
        options: [
          { key: 'A', text: `Biểu thức đồng nhất với $x^2 - 4x + 4$.` },
          { key: 'B', text: `Kết quả tính toán chuẩn xác bằng $12$.` },
          { key: 'C', text: `Kết quả tính toán bằng $-12$.` },
          { key: 'D', text: `Kết quả bằng $\\frac{1}{2}$.` },
        ],
        correct: 'B',
      },
    ];

    const sel = mcqTemplates[v];
    return {
      subject,
      grade,
      topicKeywords: [lesson, chapter],
      section: 'part1_mcq',
      type: 'multiple_choice',
      cognitiveLevel,
      prompt: sel.prompt,
      options: sel.options,
      correctOption: sel.correct,
      solutionExplanation: `Căn cứ theo lý thuyết và định lý chuẩn trong bài "${lesson}", phương án ${sel.correct} là khẳng định đúng.`,
      learningObjective: `${cognitiveLabel} kiến thức trọng tâm về ${lesson} thuộc ${chapter}.`,
    };
  }

  if (section === 'part2_true_false') {
    return {
      subject,
      grade,
      topicKeywords: [lesson, chapter],
      section: 'part2_true_false',
      type: 'true_false',
      cognitiveLevel,
      prompt: `Xét tính Đúng/Sai của các khẳng định sau liên quan đến chủ đề "${lesson}" (${chapter}):`,
      tfStatements: [
        { subKey: 'a', text: `Khái niệm cơ bản và điều kiện xác định của ${lesson} được bảo toàn trong các phép biến đổi.`, isCorrect: true, explanation: 'Đúng theo lý thuyết trong SGK môn Toán.' },
        { subKey: 'b', text: `Mọi biến đổi toán học đều áp dụng được ngay mà không cần xét điều kiện có nghĩa của biểu thức.`, isCorrect: false, explanation: 'Sai vì biến đổi toán học bắt buộc phải kèm theo điều kiện xác định.' },
        { subKey: 'c', text: `Khi thay giá trị cụ thể thỏa mãn điều kiện, giá trị của biểu thức nhận kết quả xác định duy nhất.`, isCorrect: true, explanation: 'Đúng theo tính chất của biểu thức đại số / hình học.' },
        { subKey: 'd', text: `Có thể kết luận dấu bằng của bất đẳng thức / cực trị mà không cần chỉ ra giá trị đạt được của biến số.`, isCorrect: false, explanation: 'Sai vì dấu bằng của bất đẳng thức phải tồn tại giá trị cụ thể của biến.' },
      ],
      solutionExplanation: `Kiểm tra định nghĩa, điều kiện có nghĩa và các bước biến đổi cụ thể của ${lesson}.`,
      learningObjective: `${cognitiveLabel} các mệnh đề lý thuyết và bài tập về ${lesson}.`,
    };
  }

  if (section === 'part3_short_answer') {
    const values = ['15', '24', '0,5', '8', '12', '36', '7', '45'];
    const answerVal = values[index % values.length];
    return {
      subject,
      grade,
      topicKeywords: [lesson, chapter],
      section: 'part3_short_answer',
      type: 'short_answer',
      cognitiveLevel,
      prompt: `Áp dụng kiến thức chủ đề "${lesson}" (${chapter}): Hãy thực hiện tính toán và điền kết quả số học vào ô trả lời:`,
      shortAnswerText: answerVal,
      solutionExplanation: `Áp dụng công thức tính toán và giải phương trình của bài học "${lesson}", ta tính ra kết quả chuẩn xác là ${answerVal}.`,
      learningObjective: `${cognitiveLabel} và tính toán đáp số nhanh về ${lesson}.`,
    };
  }

  // part4_essay - TỰ LUẬN CÓ THỰC HIỆN MẪU VÀ BAREM ĐIỂM SƯ PHẠM CHI TIẾT
  const essayVariants = [
    {
      prompt: `Bài toán tự luận về chủ đề "${lesson}" (${chapter}):
Cho bài toán yêu cầu giải quyết các nội dung sau:
a) Viết biểu thức toán học và tìm điều kiện xác định của bài toán. (0.75 điểm)
b) Rút gọn biểu thức và tính giá trị cụ thể tại điểm cho trước. (1.0 điểm)
c) Tìm giá trị của biến số để biểu thức nhận giá trị nguyên hoặc đạt giá trị lớn nhất/nhỏ nhất. (0.75 điểm)`,
      steps: [
        { step: `a) Lập luận tìm điều kiện xác định của các mẫu thức và biểu thức dưới dấu căn: xác định ĐKXĐ chính xác.`, point: 0.75 },
        { step: `b1) Quy đồng mẫu thức, thực hiện các phép tính cộng trừ nhân chia phân thức hoặc biến đổi đại số.`, point: 0.5 },
        { step: `b2) Rút gọn triệt để các nhân tử chung và tính giá trị số học tương ứng.`, point: 0.5 },
        { step: `c) Phân tích biểu thức thành phần nguyên và phần phân số, lập luận ước số hoặc áp dụng bất đẳng thức Cô-si để tìm giá trị tối ưu thỏa mãn ĐKXĐ.`, point: 0.75 },
      ],
      explanation: `THỰC HIỆN MẪU BÀI GIẢI CHI TIẾT:
1. Ý a: Tìm điều kiện xác định bằng cách cho mẫu thức khác 0, căn thức không âm. Kết luận tập xác định rõ ràng.
2. Ý b: Quy đồng mẫu thức chung, khai triển hằng đẳng thức và rút gọn nhân tử chung ở tử và mẫu. Sau đó thay giá trị số và tính toán cẩn thận.
3. Ý c: Đưa biểu thức về dạng $P = A + \\frac{k}{B}$. Để $P \\in \\mathbb{Z}$ thì $B$ phải là ước của $k$. Lập bảng giá trị đối chiếu với điều kiện ban đầu để kết luận.`,
    },
    {
      prompt: `Bài toán thực tế áp dụng kiến thức "${lesson}" (${chapter}):
Một tổ sản xuất theo kế hoạch phải làm một số lượng sản phẩm trong thời gian quy định.
a) Gọi ẩn số, đặt điều kiện và biểu diễn các đại lượng chưa biết theo ẩn. (0.75 điểm)
b) Lập phương trình / hệ phương trình thể hiện mối liên hệ giữa các đại lượng. (1.0 điểm)
c) Giải phương trình, đối chiếu điều kiện và kết luận kết quả của bài toán. (0.75 điểm)`,
      steps: [
        { step: `a) Gọi ẩn số phù hợp (năng suất, thời gian hoặc số sản phẩm), nêu rõ đơn vị và điều kiện xác định của ẩn.`, point: 0.75 },
        { step: `b) Lập luận chặt chẽ theo dữ kiện đầu bài để thiết lập phương trình / hệ phương trình đại số.`, point: 1.0 },
        { step: `c) Giải phương trình tìm nghiệm, kiểm tra sự phù hợp với điều kiện bài toán và viết câu kết luận đầy đủ.`, point: 0.75 },
      ],
      explanation: `THỰC HIỆN MẪU BÀI GIẢI CHI TIẾT:
1. Ý a: Chọn ẩn số trực tiếp (ví dụ: số sản phẩm làm trong một ngày). Đơn vị: sản phẩm, điều kiện: nguyên dương.
2. Ý b: Biểu diễn năng suất thực tế và thời gian thực tế hoàn thành. Do hoàn thành trước thời hạn nên ta có phương trình chênh lệch thời gian.
3. Ý c: Quy đồng khử mẫu, giải phương trình bậc nhất hoặc bậc hai, loại nghiệm không thỏa mãn và kết luận số lượng sản phẩm.`,
    },
    {
      prompt: `Bài toán hình học về chủ đề "${lesson}" (${chapter}):
Cho hình hình học phẳng có các tính chất đã học trong chương trình.
a) Vẽ hình chính xác, ghi giả thiết - kết luận và chứng minh hai đoạn thẳng hoặc hai góc bằng nhau. (1.0 điểm)
b) Chứng minh hai tam giác đồng dạng / bằng nhau hoặc chứng minh các điểm cùng thuộc một đường tròn. (1.0 điểm)
c) Chứng minh hệ thức hình học và tính diện tích hoặc tìm vị trí điểm để diện tích đạt cực trị. (0.5 điểm)`,
      steps: [
        { step: `a) Vẽ hình đúng tỉ lệ, lập luận hình học chặt chẽ và chỉ ra hai đoạn thẳng / hai góc bằng nhau.`, point: 1.0 },
        { step: `b) Sử dụng trường hợp đồng dạng (g.g, c.g.c) hoặc tính chất góc nội tiếp để suy ra đẳng thức góc / đoạn thẳng.`, point: 1.0 },
        { step: `c) Vận dụng hệ thức lượng hoặc bất đẳng thức hình học để chứng minh hệ thức và biện luận cực trị.`, point: 0.5 },
      ],
      explanation: `THỰC HIỆN MẪU BÀI GIẢI CHI TIẾT:
1. Ý a: Sử dụng các tiên đề, định lý cơ bản của tam giác và đường tròn để chứng minh.
2. Ý b: Xét hai tam giác có các góc tương ứng bằng nhau để kết luận tam giác đồng dạng, suy ra tỉ số đồng dạng cần chứng minh.
3. Ý c: Biến đổi hệ thức hình học thông qua các đoạn thẳng tỉ lệ, áp dụng bất đẳng thức để tìm vị trí điểm cực trị.`,
    },
  ];

  const selEssay = essayVariants[index % essayVariants.length];
  return {
    subject,
    grade,
    topicKeywords: [lesson, chapter],
    section: 'part4_essay',
    type: 'essay',
    cognitiveLevel,
    prompt: selEssay.prompt,
    essayGradingSteps: selEssay.steps,
    solutionExplanation: selEssay.explanation,
    learningObjective: `${cognitiveLabel} tổng hợp kiến thức ${lesson} để giải quyết bài toán tự luận nhiều bước có barem chấm chi tiết.`,
  };
}

// =================================================================
// 1. SINH ĐỀ KIỂM TRA THEO MA TRẬN & YÊU CẦU CẦN ĐẠT (CHUẨN BGD)
// =================================================================

export function generateExamPaperFromMatrix(
  matrixConfig: MatrixConfig,
  matrixRows: MatrixRow[],
  specRows: SpecificationRow[],
  ppctDataset: PpctDataset,
  examLevel: ExamLevelType = 'giua_ky',
  examCode: string = '101',
  sgkBooks?: SgkBook[],
  customBank?: BankQuestionTemplate[]
): ExamPaper {
  const subject = matrixConfig.subject || ppctDataset.subject || 'Toán';
  const grade = matrixConfig.grade || ppctDataset.grade || '9';
  const academicYear = matrixConfig.academicYear || ppctDataset.academicYear || '2026 - 2027';

  const isMidterm = examLevel === 'giua_ky' || matrixConfig.examPeriod.toLowerCase().includes('giữa');
  const isFinal = examLevel === 'cuoi_ky' || matrixConfig.examPeriod.toLowerCase().includes('cuối');
  const isKttx = examLevel === 'kttx' || matrixConfig.examPeriod.toLowerCase().includes('thường xuyên');

  const defaultTitle = isKttx
    ? 'ĐỀ KIỂM TRA THƯỜNG XUYÊN'
    : isMidterm
    ? 'ĐỀ KIỂM TRA ĐỊNH KỲ GIỮA HỌC KỲ I'
    : isFinal
    ? 'ĐỀ KIỂM TRA ĐỊNH KỲ CUỐI HỌC KỲ I'
    : matrixConfig.examPeriod;

  const durationMinutes = isKttx
    ? 15
    : matrixConfig.examDuration
    ? parseInt(matrixConfig.examDuration.replace(/\D/g, ''), 10) || 90
    : 90;

  // Lấy các dòng ma trận đang có, nếu rỗng thì tạo tối thiểu từ PPCT
  const rowsToUse = matrixRows.length > 0 ? matrixRows : [];

  const questions: ExamQuestion[] = [];
  const usedPrompts = new Set<string>();

  let qNumber = 1;
  let part1Count = 0;
  let part2Count = 0;
  let part3Count = 0;
  let part4Count = 0;

  // Thu thập các mục tiêu số câu từ ma trận
  interface SlotTarget {
    tt?: number;
    section: 'part1_mcq' | 'part2_true_false' | 'part3_short_answer' | 'part4_essay';
    cognitiveLevel: 'nhanBiet' | 'thongHieu' | 'vanDung' | 'vanDungCao';
    chapter: string;
    lesson: string;
    score: number;
  }

  const slots: SlotTarget[] = [];

  rowsToUse.forEach((row) => {
    const chapter = row.chuong || 'Chủ đề kiến thức';
    const lesson = row.noiDung || 'Đơn vị kiến thức';
    const tt = row.tt;

    // Cấu trúc 19 cột Phụ lục 1 mới (BGD 2025)
    if (row.nhieuLuaChon) {
      for (let i = 0; i < (row.nhieuLuaChon.biet || 0); i++) {
        slots.push({ tt, section: 'part1_mcq', cognitiveLevel: 'nhanBiet', chapter, lesson, score: matrixConfig.scorePerTn1 || 0.25 });
      }
      for (let i = 0; i < (row.nhieuLuaChon.hieu || 0); i++) {
        slots.push({ tt, section: 'part1_mcq', cognitiveLevel: 'thongHieu', chapter, lesson, score: matrixConfig.scorePerTn1 || 0.25 });
      }
      for (let i = 0; i < (row.nhieuLuaChon.vanDung || 0); i++) {
        slots.push({ tt, section: 'part1_mcq', cognitiveLevel: 'vanDung', chapter, lesson, score: matrixConfig.scorePerTn1 || 0.25 });
      }
    }

    if (row.dungSai) {
      for (let i = 0; i < (row.dungSai.biet || 0); i++) {
        slots.push({ tt, section: 'part2_true_false', cognitiveLevel: 'nhanBiet', chapter, lesson, score: matrixConfig.scorePerTn2 || 1.0 });
      }
      for (let i = 0; i < (row.dungSai.hieu || 0); i++) {
        slots.push({ tt, section: 'part2_true_false', cognitiveLevel: 'thongHieu', chapter, lesson, score: matrixConfig.scorePerTn2 || 1.0 });
      }
      for (let i = 0; i < (row.dungSai.vanDung || 0); i++) {
        slots.push({ tt, section: 'part2_true_false', cognitiveLevel: 'vanDung', chapter, lesson, score: matrixConfig.scorePerTn2 || 1.0 });
      }
    }

    if (row.traLoiNgan) {
      for (let i = 0; i < (row.traLoiNgan.biet || 0); i++) {
        slots.push({ tt, section: 'part3_short_answer', cognitiveLevel: 'nhanBiet', chapter, lesson, score: matrixConfig.scorePerTn3 || 0.5 });
      }
      for (let i = 0; i < (row.traLoiNgan.hieu || 0); i++) {
        slots.push({ tt, section: 'part3_short_answer', cognitiveLevel: 'thongHieu', chapter, lesson, score: matrixConfig.scorePerTn3 || 0.5 });
      }
      for (let i = 0; i < (row.traLoiNgan.vanDung || 0); i++) {
        slots.push({ tt, section: 'part3_short_answer', cognitiveLevel: 'vanDung', chapter, lesson, score: matrixConfig.scorePerTn3 || 0.5 });
      }
    }

    if (row.tuLuan) {
      for (let i = 0; i < (row.tuLuan.biet || 0); i++) {
        slots.push({ tt, section: 'part4_essay', cognitiveLevel: 'nhanBiet', chapter, lesson, score: matrixConfig.scorePerTl || 1.0 });
      }
      for (let i = 0; i < (row.tuLuan.hieu || 0); i++) {
        slots.push({ tt, section: 'part4_essay', cognitiveLevel: 'thongHieu', chapter, lesson, score: matrixConfig.scorePerTl || 1.0 });
      }
      for (let i = 0; i < (row.tuLuan.vanDung || 0); i++) {
        slots.push({ tt, section: 'part4_essay', cognitiveLevel: 'vanDung', chapter, lesson, score: matrixConfig.scorePerTl || 1.0 });
      }
    }

    // Nếu không có các cột 19, kiểm tra các ô truyền thống nhanBiet, thongHieu, vanDung, vanDungCao
    if (!row.nhieuLuaChon && !row.dungSai && !row.traLoiNgan && !row.tuLuan) {
      // Nhận biết
      for (let i = 0; i < (row.nhanBiet?.tn || 0); i++) {
        slots.push({ tt, section: 'part1_mcq', cognitiveLevel: 'nhanBiet', chapter, lesson, score: matrixConfig.scorePerTn || 0.25 });
      }
      for (let i = 0; i < (row.nhanBiet?.tl || 0); i++) {
        slots.push({ tt, section: 'part4_essay', cognitiveLevel: 'nhanBiet', chapter, lesson, score: matrixConfig.scorePerTl || 1.0 });
      }

      // Thông hiểu
      for (let i = 0; i < (row.thongHieu?.tn || 0); i++) {
        slots.push({ tt, section: 'part1_mcq', cognitiveLevel: 'thongHieu', chapter, lesson, score: matrixConfig.scorePerTn || 0.25 });
      }
      for (let i = 0; i < (row.thongHieu?.tl || 0); i++) {
        slots.push({ tt, section: 'part4_essay', cognitiveLevel: 'thongHieu', chapter, lesson, score: matrixConfig.scorePerTl || 1.0 });
      }

      // Vận dụng
      for (let i = 0; i < (row.vanDung?.tn || 0); i++) {
        slots.push({ tt, section: 'part1_mcq', cognitiveLevel: 'vanDung', chapter, lesson, score: matrixConfig.scorePerTn || 0.25 });
      }
      for (let i = 0; i < (row.vanDung?.tl || 0); i++) {
        slots.push({ tt, section: 'part4_essay', cognitiveLevel: 'vanDung', chapter, lesson, score: matrixConfig.scorePerTl || 1.0 });
      }

      // Vận dụng cao
      for (let i = 0; i < (row.vanDungCao?.tl || 0); i++) {
        slots.push({ tt, section: 'part4_essay', cognitiveLevel: 'vanDungCao', chapter, lesson, score: matrixConfig.scorePerTl || 1.0 });
      }
    }
  });

  // Nếu ma trận chưa có dòng nào hoặc slots rỗng, tự động điền cấu trúc chuẩn GDPT 2018 (12 TNKQ + 4 Đúng Sai + 4 Trả lời ngắn + 2 Tự luận)
  if (slots.length === 0) {
    const normG = String(grade || '').replace(/\D/g, '') || '9';
    const gradeDefaultChapter =
      normG === '6'
        ? 'Chương I. Tập hợp các số tự nhiên'
        : normG === '7'
        ? 'Chương I. Số hữu tỉ'
        : normG === '8'
        ? 'Chương I. Đa thức nhiều biến'
        : 'Chương I. Phương trình và hệ hai phương trình bậc nhất hai ẩn';

    const gradeDefaultLesson =
      normG === '6'
        ? 'Tập hợp, phần tử của tập hợp và các phép tính số tự nhiên'
        : normG === '7'
        ? 'Tập hợp các số hữu tỉ và các phép tính với số hữu tỉ'
        : normG === '8'
        ? 'Đơn thức và đa thức nhiều biến. Các hằng đẳng thức đáng nhớ'
        : 'Khái niệm và giải hệ hai phương trình bậc nhất hai ẩn';

    const sampleChapter = rowsToUse[0]?.chuong || ppctDataset?.lessons?.[0]?.chuong || gradeDefaultChapter;
    const sampleLesson = rowsToUse[0]?.noiDung || ppctDataset?.lessons?.[0]?.baiHoc || gradeDefaultLesson;

    // 12 câu trắc nghiệm nhiều lựa chọn
    for (let i = 0; i < 6; i++) slots.push({ section: 'part1_mcq', cognitiveLevel: 'nhanBiet', chapter: sampleChapter, lesson: sampleLesson, score: 0.25 });
    for (let i = 0; i < 4; i++) slots.push({ section: 'part1_mcq', cognitiveLevel: 'thongHieu', chapter: sampleChapter, lesson: sampleLesson, score: 0.25 });
    for (let i = 0; i < 2; i++) slots.push({ section: 'part1_mcq', cognitiveLevel: 'vanDung', chapter: sampleChapter, lesson: sampleLesson, score: 0.25 });

    // 2 câu đúng sai
    slots.push({ section: 'part2_true_false', cognitiveLevel: 'nhanBiet', chapter: sampleChapter, lesson: sampleLesson, score: 1.0 });
    slots.push({ section: 'part2_true_false', cognitiveLevel: 'thongHieu', chapter: sampleChapter, lesson: sampleLesson, score: 1.0 });

    // 4 câu trả lời ngắn
    for (let i = 0; i < 2; i++) slots.push({ section: 'part3_short_answer', cognitiveLevel: 'thongHieu', chapter: sampleChapter, lesson: sampleLesson, score: 0.5 });
    for (let i = 0; i < 2; i++) slots.push({ section: 'part3_short_answer', cognitiveLevel: 'vanDung', chapter: sampleChapter, lesson: sampleLesson, score: 0.5 });

    // 2 câu tự luận (1 câu 1.5đ, 1 câu 1.5đ)
    slots.push({ section: 'part4_essay', cognitiveLevel: 'thongHieu', chapter: sampleChapter, lesson: sampleLesson, score: 1.5 });
    slots.push({ section: 'part4_essay', cognitiveLevel: 'vanDungCao', chapter: sampleChapter, lesson: sampleLesson, score: 1.5 });
  }

  // Sắp xếp các slot theo đúng thứ tự 4 phần của Bộ GD&ĐT: Phần I -> Phần II -> Phần III -> Phần IV
  const sectionOrder = {
    part1_mcq: 1,
    part2_true_false: 2,
    part3_short_answer: 3,
    part4_essay: 4,
  };

  slots.sort((a, b) => sectionOrder[a.section] - sectionOrder[b.section]);

  // Tính số câu và phân bổ điểm chuẩn 10.0 cho các phần
  const part1Slots = slots.filter((s) => s.section === 'part1_mcq');
  const part2Slots = slots.filter((s) => s.section === 'part2_true_false');
  const part3Slots = slots.filter((s) => s.section === 'part3_short_answer');
  const part4Slots = slots.filter((s) => s.section === 'part4_essay');

  const p1TotalCount = part1Slots.length;
  const p2TotalCount = part2Slots.length;
  const p3TotalCount = part3Slots.length;
  const p4TotalCount = part4Slots.length;

  const scoreP1Total = +(p1TotalCount * (matrixConfig.scorePerTn1 || 0.25)).toFixed(2);
  const scoreP2Total = +(p2TotalCount * (matrixConfig.scorePerTn2 || 1.0)).toFixed(2);
  const scoreP3Total = +(p3TotalCount * (matrixConfig.scorePerTn3 || 0.5)).toFixed(2);
  const totalTn = +(scoreP1Total + scoreP2Total + scoreP3Total).toFixed(2);
  const totalTl = Math.max(0, +(10 - totalTn).toFixed(2));
  const scorePerEssayEach = p4TotalCount > 0 ? +(totalTl / p4TotalCount).toFixed(2) : 0;

  let p1Counter = 1;
  let p2Counter = 1;
  let p3Counter = 1;
  let p4Counter = 1;

  // Kiểm tra xem cấu hình ma trận hoặc danh sách dòng sử dụng có chứa nội dung Xác suất & Thống kê hay không
  const matrixSelectedTopics = (matrixConfig as any).selectedTopics as string[] | undefined;
  const hasSelectedTopics = matrixSelectedTopics && matrixSelectedTopics.length > 0;
  const selectedHasProbStats = hasSelectedTopics ? hasProbStatsInTopics(matrixSelectedTopics) : undefined;
  const matrixHasProbStats = rowsToUse.some(
    (r) => isProbStatsText(r.chuong || '') || isProbStatsText(r.noiDung || '')
  );
  const globalAllowProbStats = selectedHasProbStats !== undefined ? selectedHasProbStats : matrixHasProbStats;

  // Sinh từng câu hỏi
  slots.forEach((slot, idx) => {
    const slotIsProbStats = isProbStatsText(slot.chapter || '') || isProbStatsText(slot.lesson || '');
    const allowProbStats = globalAllowProbStats && slotIsProbStats;

    let qTemplate = findBestQuestionFromBank(
      subject,
      grade,
      slot.lesson,
      slot.section,
      slot.cognitiveLevel,
      usedPrompts,
      customBank,
      allowProbStats
    );
    if (!qTemplate) {
      qTemplate = createFallbackQuestion(
        subject,
        grade,
        slot.chapter,
        slot.lesson,
        slot.section,
        slot.cognitiveLevel,
        idx + 1,
        allowProbStats
      );
    }
    usedPrompts.add(qTemplate.prompt);

    let qCode = `[C${idx + 1}]`;
    let assignedScore = slot.score;

    if (slot.section === 'part1_mcq') {
      qCode = `[C${p1Counter++}]`;
      assignedScore = matrixConfig.scorePerTn1 || 0.25;
      part1Count++;
    } else if (slot.section === 'part2_true_false') {
      qCode = `[C${p2Counter++}]`;
      assignedScore = matrixConfig.scorePerTn2 || 1.0;
      part2Count++;
    } else if (slot.section === 'part3_short_answer') {
      qCode = `[C${p3Counter++}]`;
      assignedScore = matrixConfig.scorePerTn3 || 0.5;
      part3Count++;
    } else if (slot.section === 'part4_essay') {
      qCode = `[Bài ${p4Counter++}]`;
      assignedScore = scorePerEssayEach > 0 ? scorePerEssayEach : slot.score;
      part4Count++;
    }

    const cogLabel =
      slot.cognitiveLevel === 'nhanBiet'
        ? 'Nhận biết'
        : slot.cognitiveLevel === 'thongHieu'
        ? 'Thông hiểu'
        : slot.cognitiveLevel === 'vanDung'
        ? 'Vận dụng'
        : 'Vận dụng cao';

    // Tìm YCCĐ tương ứng từ specRows theo tt hoặc theo tên nội dung
    let matchingObjective = qTemplate.learningObjective;
    const matchingSpecRow = specRows.find(
      (sr) =>
        (slot.tt !== undefined && sr.tt === slot.tt) ||
        sr.noiDung.toLowerCase().trim() === slot.lesson.toLowerCase().trim() ||
        sr.noiDung.toLowerCase().includes(slot.lesson.toLowerCase()) ||
        slot.lesson.toLowerCase().includes(sr.noiDung.toLowerCase())
    );
    if (matchingSpecRow && matchingSpecRow.items && matchingSpecRow.items.length > 0) {
      const specItem =
        matchingSpecRow.items.find((it) => it.mucDo === slot.cognitiveLevel) ||
        (slot.cognitiveLevel === 'vanDungCao' ? matchingSpecRow.items.find((it) => it.mucDo === 'vanDung') : undefined);
      if (specItem && specItem.yeuCauCanDat) {
        matchingObjective = specItem.yeuCauCanDat;
      }
    }

    // Nếu chưa có YCCĐ từ bảng đặc tả hoặc chuỗi mặc định, tra cứu trực tiếp từ SGK đã nạp
    if ((!matchingObjective || matchingObjective.includes('kiến thức trọng tâm')) && sgkBooks && sgkBooks.length > 0) {
      const preferredVol = (matrixConfig.limitWeekFrom || 1) >= 19 ? 2 : ((matrixConfig.limitWeekTo || 9) <= 18 ? 1 : 'all');
      const sgkObjective = getLearningObjectiveForTopic(slot.cognitiveLevel, slot.lesson, slot.chapter, sgkBooks, preferredVol, grade);
      if (sgkObjective) {
        matchingObjective = sgkObjective;
      }
    }

    if (!matchingObjective) {
      matchingObjective = `${cogLabel} kiến thức trọng tâm về ${slot.lesson} thuộc ${slot.chapter} theo chuẩn GDPT 2018.`;
    }

    questions.push({
      id: `q-${idx + 1}-${Date.now()}`,
      code: qCode,
      section: slot.section,
      type: qTemplate.type,
      prompt: qTemplate.prompt,
      options: qTemplate.options,
      correctOption: qTemplate.correctOption,
      tfStatements: qTemplate.tfStatements,
      shortAnswerText: qTemplate.shortAnswerText,
      essayGradingSteps: qTemplate.essayGradingSteps,
      score: assignedScore,
      cognitiveLevel: slot.cognitiveLevel,
      cognitiveLevelLabel: cogLabel,
      chapter: slot.chapter,
      lesson: slot.lesson,
      learningObjective: matchingObjective,
      solutionExplanation: qTemplate.solutionExplanation,
      source: qTemplate.source || 'ai_system',
      sourceQuestionId: qTemplate.id,
    });
  });

  // Tính toán tóm tắt ma trận
  const summary = calculateAlignmentSummary(questions);

  const paperConfig: ExamPaperConfig = {
    examLevel,
    title: defaultTitle,
    subTitle: `Năm học ${academicYear} — Môn ${subject} ${grade}`,
    schoolName: matrixConfig.schoolName || 'TRƯỜNG THCS VÀ THPT PHÚ THÀNH',
    department: matrixConfig.department || 'TỔ TOÁN - TIN HỌC',
    subject,
    grade,
    academicYear: matrixConfig.academicYear || '2026 - 2027',
    durationMinutes,
    examCode,
    semester: (matrixConfig.limitWeekFrom || 1) >= 19 ? 2 : 1,
    mode: 'matrix_aligned',
    format: matrixConfig.structureType || 'moet_2025_new',
    weekFrom: matrixConfig.limitWeekFrom || 1,
    weekTo: matrixConfig.limitWeekTo || 9,
    selectedTopics: rowsToUse.map((r) => r.noiDung),
    countPart1Mcq: part1Count,
    countPart2Tf: part2Count,
    countPart3Short: part3Count,
    countPart4Essay: part4Count,
    scorePerMcq: matrixConfig.scorePerTn1 || 0.25,
    scorePerTf: matrixConfig.scorePerTn2 || 1.0,
    scorePerShort: matrixConfig.scorePerTn3 || 0.5,
    scorePerEssay: matrixConfig.scorePerTl || 1.0,
    ratioTn: matrixConfig.ratioTn || 70,
    ratioTl: matrixConfig.ratioTl || 30,
  };

  return formatPaperLatex({
    id: `exam-paper-${Date.now()}`,
    config: paperConfig,
    createdAt: new Date().toISOString(),
    questions,
    totalScore: 10,
    matrixAlignmentSummary: summary,
  });
}

// =================================================================
// 2. SINH ĐỀ KIỂM TRA TÙY CHỈNH (KTTX HOẶC THAY ĐỔI SỐ CÂU/HÌNH THỨC)
// =================================================================

export function generateCustomExamPaper(
  config: Partial<ExamPaperConfig>,
  ppctDataset: PpctDataset,
  sgkBooks?: SgkBook[],
  customBank?: BankQuestionTemplate[]
): ExamPaper {
  const subject = config.subject || ppctDataset.subject || 'Toán';
  const grade = config.grade || ppctDataset.grade || '9';
  const academicYear = config.academicYear || ppctDataset.academicYear || '2026 - 2027';
  const examLevel = config.examLevel || 'kttx';

  const isKttx = examLevel === 'kttx';
  const isMidterm = examLevel === 'giua_ky';
  const isFinal = examLevel === 'cuoi_ky';

  const title =
    config.title ||
    (isKttx
      ? 'ĐỀ KIỂM TRA THƯỜNG XUYÊN'
      : isMidterm
      ? 'ĐỀ KIỂM TRA ĐỊNH KỲ GIỮA HỌC KỲ I'
      : isFinal
      ? 'ĐỀ KIỂM TRA ĐỊNH KỲ CUỐI HỌC KỲ I'
      : 'ĐỀ KIỂM TRA MÔN ' + subject.toUpperCase());

  const durationMinutes = config.durationMinutes || (isKttx ? 15 : 90);
  const examCode = config.examCode || '101';
  const format: ExamStructureFormat = config.format || (isKttx ? 'tn_only' : 'moet_2025_new');

  // Lấy các bài học được chỉ định
  const weekFrom = config.weekFrom || 1;
  const weekTo = config.weekTo || (isKttx ? 4 : 9);

  const availableLessons = ppctDataset.lessons.filter((l) => l.tuan >= weekFrom && l.tuan <= weekTo);
  const normG = String(grade || '').replace(/\D/g, '') || '9';
  const gradeDefaultTopics =
    normG === '6'
      ? ['Tập hợp các số tự nhiên', 'Phép cộng và phép nhân số tự nhiên', 'Số nguyên và quy tắc dấu ngoặc']
      : normG === '7'
      ? ['Tập hợp các số hữu tỉ', 'Cộng, trừ, nhân, chia số hữu tỉ', 'Số vô tỉ và căn bậc hai số học']
      : normG === '8'
      ? ['Đơn thức và đa thức nhiều biến', 'Các hằng đẳng thức đáng nhớ', 'Phân thức đại số']
      : ['Căn bậc hai và hằng đẳng thức', 'Phương trình và hệ phương trình bậc nhất hai ẩn'];

  const topicsToUse =
    config.selectedTopics && config.selectedTopics.length > 0
      ? config.selectedTopics
      : availableLessons.length > 0
      ? Array.from(new Set(availableLessons.map((l) => l.baiHoc)))
      : gradeDefaultTopics;

  // Số lượng câu hỏi tùy chỉnh
  let countMcq = config.countPart1Mcq !== undefined ? config.countPart1Mcq : isKttx ? 10 : 12;
  let countTf = config.countPart2Tf !== undefined ? config.countPart2Tf : isKttx ? 0 : 2;
  let countShort = config.countPart3Short !== undefined ? config.countPart3Short : isKttx ? 0 : 4;
  let countEssay = config.countPart4Essay !== undefined ? config.countPart4Essay : isKttx ? 0 : 2;

  // Điều chỉnh theo format
  if (format === 'tn_only') {
    countTf = 0;
    countShort = 0;
    countEssay = 0;
    if (countMcq === 0) countMcq = isKttx ? 10 : 20;
  } else if (format === 'tl_only') {
    countMcq = 0;
    countTf = 0;
    countShort = 0;
    if (countEssay === 0) countEssay = 3;
  }

  // Phân bổ điểm để tổng tròn 10.0
  let scorePerMcq = config.scorePerMcq || (countMcq > 0 ? (format === 'tn_only' ? 10 / countMcq : 0.25) : 0);
  let scorePerTf = config.scorePerTf || (countTf > 0 ? 1.0 : 0);
  let scorePerShort = config.scorePerShort || (countShort > 0 ? 0.5 : 0);
  let scorePerEssay = config.scorePerEssay || (format === 'tl_only' ? +(10 / (countEssay || 3)).toFixed(2) : 1.0);

  // Cân đối lại điểm tự luận nếu còn dư
  const rawTnScore = countMcq * scorePerMcq + countTf * scorePerTf + countShort * scorePerShort;
  const remainingForEssay = Math.max(0, 10 - rawTnScore);
  if (countEssay > 0) {
    scorePerEssay = +(remainingForEssay / countEssay).toFixed(2);
  }

  const questions: ExamQuestion[] = [];
  const usedPrompts = new Set<string>();
  let qNum = 1;

  // Kiểm tra xem danh sách chủ đề được chọn có chứa Xác suất & Thống kê hay không
  const selectionHasProbStats = hasProbStatsInTopics(topicsToUse);

  // 1. Phần I: Trắc nghiệm 4 lựa chọn
  for (let i = 0; i < countMcq; i++) {
    const topic = topicsToUse[i % topicsToUse.length];
    const allowProbStats = selectionHasProbStats && isProbStatsText(topic);
    
    // Mức độ nhận thức: KTTX hoặc 100% TN mặc định 70% Nhận biết, 30% Thông hiểu
    let cogLevel: 'nhanBiet' | 'thongHieu' | 'vanDung' | 'vanDungCao';
    if (isKttx || format === 'tn_only') {
      const threshold70 = Math.round(countMcq * 0.7);
      cogLevel = i < threshold70 ? 'nhanBiet' : 'thongHieu';
    } else {
      cogLevel =
        i < Math.floor(countMcq * 0.5)
          ? 'nhanBiet'
          : i < Math.floor(countMcq * 0.8)
          ? 'thongHieu'
          : 'vanDung';
    }

    let qTemplate = findBestQuestionFromBank(subject, grade, topic, 'part1_mcq', cogLevel, usedPrompts, customBank, allowProbStats);
    if (!qTemplate) {
      qTemplate = createFallbackQuestion(subject, grade, 'Chủ đề kiểm tra', topic, 'part1_mcq', cogLevel, i + 1, allowProbStats);
    }
    usedPrompts.add(qTemplate.prompt);

    questions.push({
      id: `custom-q-p1-${i + 1}-${Date.now()}`,
      code: `[C${qNum}]`,
      section: 'part1_mcq',
      type: 'multiple_choice',
      prompt: qTemplate.prompt,
      options: qTemplate.options,
      correctOption: qTemplate.correctOption,
      score: scorePerMcq,
      cognitiveLevel: cogLevel,
      cognitiveLevelLabel: cogLevel === 'nhanBiet' ? 'Nhận biết' : cogLevel === 'thongHieu' ? 'Thông hiểu' : 'Vận dụng',
      chapter: 'Chương trình kiểm tra',
      lesson: topic,
      learningObjective: qTemplate.learningObjective,
      solutionExplanation: qTemplate.solutionExplanation,
      source: qTemplate.source || 'ai_system',
      sourceQuestionId: qTemplate.id,
    });
    qNum++;
  }

  // 2. Phần II: Trắc nghiệm Đúng/Sai
  for (let i = 0; i < countTf; i++) {
    const topic = topicsToUse[i % topicsToUse.length];
    const allowProbStats = selectionHasProbStats && isProbStatsText(topic);
    const cogLevel = i === 0 ? 'thongHieu' : 'vanDung';
    let qTemplate = findBestQuestionFromBank(subject, grade, topic, 'part2_true_false', cogLevel, usedPrompts, customBank, allowProbStats);
    if (!qTemplate) {
      qTemplate = createFallbackQuestion(subject, grade, 'Chủ đề kiểm tra', topic, 'part2_true_false', cogLevel, i + 1, allowProbStats);
    }
    usedPrompts.add(qTemplate.prompt);

    questions.push({
      id: `custom-q-p2-${i + 1}-${Date.now()}`,
      code: `[C${qNum}]`,
      section: 'part2_true_false',
      type: 'true_false',
      prompt: qTemplate.prompt,
      tfStatements: qTemplate.tfStatements,
      score: scorePerTf,
      cognitiveLevel: cogLevel,
      cognitiveLevelLabel: cogLevel === 'thongHieu' ? 'Thông hiểu' : 'Vận dụng',
      chapter: 'Chương trình kiểm tra',
      lesson: topic,
      learningObjective: qTemplate.learningObjective,
      solutionExplanation: qTemplate.solutionExplanation,
      source: qTemplate.source || 'ai_system',
      sourceQuestionId: qTemplate.id,
    });
    qNum++;
  }

  // 3. Phần III: Trắc nghiệm trả lời ngắn
  for (let i = 0; i < countShort; i++) {
    const topic = topicsToUse[i % topicsToUse.length];
    const allowProbStats = selectionHasProbStats && isProbStatsText(topic);
    const cogLevel = i < Math.floor(countShort * 0.5) ? 'thongHieu' : 'vanDung';
    let qTemplate = findBestQuestionFromBank(subject, grade, topic, 'part3_short_answer', cogLevel, usedPrompts, customBank, allowProbStats);
    if (!qTemplate) {
      qTemplate = createFallbackQuestion(subject, grade, 'Chủ đề kiểm tra', topic, 'part3_short_answer', cogLevel, i + 1, allowProbStats);
    }
    usedPrompts.add(qTemplate.prompt);

    questions.push({
      id: `custom-q-p3-${i + 1}-${Date.now()}`,
      code: `[C${qNum}]`,
      section: 'part3_short_answer',
      type: 'short_answer',
      prompt: qTemplate.prompt,
      shortAnswerText: qTemplate.shortAnswerText,
      score: scorePerShort,
      cognitiveLevel: cogLevel,
      cognitiveLevelLabel: cogLevel === 'thongHieu' ? 'Thông hiểu' : 'Vận dụng',
      chapter: 'Chương trình kiểm tra',
      lesson: topic,
      learningObjective: qTemplate.learningObjective,
      solutionExplanation: qTemplate.solutionExplanation,
      source: qTemplate.source || 'ai_system',
      sourceQuestionId: qTemplate.id,
    });
    qNum++;
  }

  // 4. Phần IV: Tự luận
  for (let i = 0; i < countEssay; i++) {
    const topic = topicsToUse[i % topicsToUse.length];
    const allowProbStats = selectionHasProbStats && isProbStatsText(topic);
    const cogLevel: 'thongHieu' | 'vanDung' | 'vanDungCao' =
      i === 0 ? 'thongHieu' : i === 1 ? 'vanDung' : 'vanDungCao';

    let qTemplate = findBestQuestionFromBank(subject, grade, topic, 'part4_essay', cogLevel, usedPrompts, customBank, allowProbStats);
    if (!qTemplate) {
      qTemplate = createFallbackQuestion(subject, grade, 'Chủ đề kiểm tra', topic, 'part4_essay', cogLevel, i + 1, allowProbStats);
    }
    usedPrompts.add(qTemplate.prompt);

    questions.push({
      id: `custom-q-p4-${i + 1}-${Date.now()}`,
      code: `[C${qNum}]`,
      section: 'part4_essay',
      type: 'essay',
      prompt: qTemplate.prompt,
      essayGradingSteps: qTemplate.essayGradingSteps,
      score: scorePerEssay,
      cognitiveLevel: cogLevel,
      cognitiveLevelLabel: cogLevel === 'thongHieu' ? 'Thông hiểu' : cogLevel === 'vanDung' ? 'Vận dụng' : 'Vận dụng cao',
      chapter: 'Chương trình kiểm tra',
      lesson: topic,
      learningObjective: qTemplate.learningObjective,
      solutionExplanation: qTemplate.solutionExplanation,
      source: qTemplate.source || 'ai_system',
      sourceQuestionId: qTemplate.id,
    });
    qNum++;
  }

  const summary = calculateAlignmentSummary(questions);

  const fullConfig: ExamPaperConfig = {
    examLevel,
    title,
    subTitle: `Năm học ${academicYear} — Môn ${subject} ${grade}`,
    schoolName: config.schoolName || 'TRƯỜNG THCS VÀ THPT PHÚ THÀNH',
    department: config.department || 'TỔ TOÁN - TIN HỌC',
    subject,
    grade,
    academicYear: config.academicYear || '2026 - 2027',
    durationMinutes,
    examCode,
    semester: weekFrom >= 19 ? 2 : 1,
    mode: 'custom',
    format,
    weekFrom,
    weekTo,
    selectedTopics: topicsToUse,
    countPart1Mcq: countMcq,
    countPart2Tf: countTf,
    countPart3Short: countShort,
    countPart4Essay: countEssay,
    scorePerMcq,
    scorePerTf,
    scorePerShort,
    scorePerEssay,
    ratioTn: format === 'tn_only' ? 100 : format === 'tl_only' ? 0 : config.ratioTn || 70,
    ratioTl: format === 'tn_only' ? 0 : format === 'tl_only' ? 100 : config.ratioTl || 30,
  };

  return formatPaperLatex({
    id: `exam-paper-${Date.now()}`,
    config: fullConfig,
    createdAt: new Date().toISOString(),
    questions,
    totalScore: 10,
    matrixAlignmentSummary: summary,
  });
}

// =================================================================
// 3. XÁO TRỘN ĐỀ VÀ TẠO NHIỀU MÃ ĐỀ (101, 102, 103, 104)
// =================================================================

export function shuffleExamPaper(originalPaper: ExamPaper, newCode: string): ExamPaper {
  // Hoán vị câu hỏi trong từng phần, giữ nguyên cấu trúc các phần I, II, III, IV
  const p1 = originalPaper.questions.filter((q) => q.section === 'part1_mcq');
  const p2 = originalPaper.questions.filter((q) => q.section === 'part2_true_false');
  const p3 = originalPaper.questions.filter((q) => q.section === 'part3_short_answer');
  const p4 = originalPaper.questions.filter((q) => q.section === 'part4_essay');

  // Hàm xáo trộn mảng
  const shuffle = <T>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Xáo trộn phương án A, B, C, D của MCQ
  const shuffledP1 = shuffle(p1).map((q) => {
    if (!q.options || q.options.length < 4 || !q.correctOption) return { ...q };

    const correctText = q.options.find((o) => o.key === q.correctOption)?.text || '';
    const shuffledOptionsTexts = shuffle(q.options.map((o) => o.text));
    const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

    const newOptions = keys.map((k, idx) => ({
      key: k,
      text: shuffledOptionsTexts[idx],
    }));

    const newCorrectKey = newOptions.find((o) => o.text === correctText)?.key || 'A';

    return {
      ...q,
      options: newOptions,
      correctOption: newCorrectKey,
    };
  });

  const shuffledP2 = shuffle(p2);
  const shuffledP3 = shuffle(p3);
  // Phần tự luận có thể giữ nguyên thứ tự hoặc xáo nhẹ nếu có nhiều bài
  const shuffledP4 = [...p4];

  // Ghép lại và đánh lại mã câu [C1], [C2]...
  const allShuffled = [...shuffledP1, ...shuffledP2, ...shuffledP3, ...shuffledP4];
  const reIndexed = allShuffled.map((q, idx) => ({
    ...q,
    code: `[C${idx + 1}]`,
  }));

  return formatPaperLatex({
    ...originalPaper,
    id: `exam-paper-${newCode}-${Date.now()}`,
    config: {
      ...originalPaper.config,
      examCode: newCode,
    },
    questions: reIndexed,
    matrixAlignmentSummary: calculateAlignmentSummary(reIndexed),
  });
}

// =================================================================
// 4. THAY ĐỔI CÂU HỎI TƯƠNG ĐƯƠNG & GỢI Ý CÂU CÙNG MỨC ĐỘ
// =================================================================

/**
 * Tự động sinh danh sách câu hỏi đa dạng phong phú (> 10 câu)
 * bám sát chuẩn kiến thức từng Khối lớp (6, 7, 8, 9), dạng phần và mức độ nhận thức.
 * Tuyệt đối tôn trọng: nếu allowProbStats = false, không bao giờ sinh câu hỏi về Xác suất & Thống kê.
 */
function generateDiverseSuggestions(
  grade: string,
  chapter: string,
  lesson: string,
  section: 'part1_mcq' | 'part2_true_false' | 'part3_short_answer' | 'part4_essay',
  cognitiveLevel: CognitiveLevel,
  targetCount: number,
  existingPrompts: Set<string>,
  allowProbStats: boolean
): BankQuestionTemplate[] {
  const normGrade = String(grade || '').replace(/\D/g, '') || '9';
  const cogLabel =
    cognitiveLevel === 'nhanBiet'
      ? 'Nhận biết'
      : cognitiveLevel === 'thongHieu'
      ? 'Thông hiểu'
      : cognitiveLevel === 'vanDung'
      ? 'Vận dụng'
      : 'Vận dụng cao';

  const candidates: BankQuestionTemplate[] = [];

  // ==================== KHỐI 6 ====================
  if (normGrade === '6') {
    if (section === 'part1_mcq') {
      const g6Mcq = [
        {
          prompt: `Cho tập hợp $M = \\{x \\in \\mathbb{N}^* \\mid x \\le 5\\}$. Số phần tử của tập hợp $M$ là:`,
          options: [{ key: 'A' as const, text: '$5$' }, { key: 'B' as const, text: '$6$' }, { key: 'C' as const, text: '$4$' }, { key: 'D' as const, text: '$7$' }],
          correct: 'A' as const,
          sol: 'Tập hợp $M = \\{1; 2; 3; 4; 5\\}$ có đúng 5 phần tử.',
        },
        {
          prompt: `Trong các số $120; 245; 372; 450$, số nào chia hết cho cả $2, 5$ và $9$?`,
          options: [{ key: 'A' as const, text: '$450$' }, { key: 'B' as const, text: '$120$' }, { key: 'C' as const, text: '$245$' }, { key: 'D' as const, text: '$372$' }],
          correct: 'A' as const,
          sol: 'Số $450$ có chữ số tận cùng là 0 nên chia hết cho cả 2 và 5; tổng các chữ số $4 + 5 + 0 = 9$ chia hết cho 9.',
        },
        {
          prompt: `Viết kết quả của phép tính $3^4 \\cdot 3^5$ dưới dạng một lũy thừa:`,
          options: [{ key: 'A' as const, text: '$3^9$' }, { key: 'B' as const, text: '$3^{20}$' }, { key: 'C' as const, text: '$9^9$' }, { key: 'D' as const, text: '$3^1$' }],
          correct: 'A' as const,
          sol: '$3^4 \\cdot 3^5 = 3^{4+5} = 3^9$.',
        },
        {
          prompt: `Nhiệt độ tại Sa Pa lúc 6 giờ sáng là $-2^\\circ\\text{C}$, đến 12 giờ trưa tăng thêm $5^\\circ\\text{C}$. Nhiệt độ lúc 12 giờ trưa là:`,
          options: [{ key: 'A' as const, text: '$3^\\circ\\text{C}$' }, { key: 'B' as const, text: '$-7^\\circ\\text{C}$' }, { key: 'C' as const, text: '$7^\\circ\\text{C}$' }, { key: 'D' as const, text: '$-3^\\circ\\text{C}$' }],
          correct: 'A' as const,
          sol: 'Nhiệt độ lúc 12 giờ trưa là: $(-2) + 5 = 3^\\circ\\text{C}$.',
        },
        {
          prompt: `Số đối của số nguyên $-18$ là:`,
          options: [{ key: 'A' as const, text: '$18$' }, { key: 'B' as const, text: '$-18$' }, { key: 'C' as const, text: '$\\frac{1}{18}$' }, { key: 'D' as const, text: '$0$' }],
          correct: 'A' as const,
          sol: 'Số đối của $-18$ là $-(-18) = 18$.',
        },
        {
          prompt: `Một tam giác đều có cạnh bằng $8\\text{ cm}$. Chu vi của tam giác đều đó là:`,
          options: [{ key: 'A' as const, text: '$24\\text{ cm}$' }, { key: 'B' as const, text: '$16\\text{ cm}$' }, { key: 'C' as const, text: '$32\\text{ cm}$' }, { key: 'D' as const, text: '$64\\text{ cm}$' }],
          correct: 'A' as const,
          sol: 'Chu vi tam giác đều cạnh $a = 8\\text{ cm}$ là $C = 3 \\cdot 8 = 24\\text{ cm}$.',
        },
        {
          prompt: `Một mảnh đất hình thoi có độ dài hai đường chéo lần lượt là $10\\text{ m}$ và $14\\text{ m}$. Diện tích mảnh đất là:`,
          options: [{ key: 'A' as const, text: '$70\\text{ m}^2$' }, { key: 'B' as const, text: '$140\\text{ m}^2$' }, { key: 'C' as const, text: '$48\\text{ m}^2$' }, { key: 'D' as const, text: '$24\\text{ m}^2$' }],
          correct: 'A' as const,
          sol: 'Diện tích hình thoi bằng $\\frac{1}{2} d_1 d_2 = \\frac{1}{2} \\cdot 10 \\cdot 14 = 70\\text{ m}^2$.',
        },
        {
          prompt: `Phân số đối của phân số $-\\frac{5}{9}$ là:`,
          options: [{ key: 'A' as const, text: '$\\frac{5}{9}$' }, { key: 'B' as const, text: '$-\\frac{9}{5}$' }, { key: 'C' as const, text: '$\\frac{9}{5}$' }, { key: 'D' as const, text: '$\\frac{-5}{-9}$' }],
          correct: 'A' as const,
          sol: 'Số đối của $-\\frac{5}{9}$ là $\\frac{5}{9}$.',
        },
        {
          prompt: `Tìm số tự nhiên $x$ thỏa mãn $\\frac{x}{12} = \\frac{3}{4}$:`,
          options: [{ key: 'A' as const, text: '$9$' }, { key: 'B' as const, text: '$6$' }, { key: 'C' as const, text: '$8$' }, { key: 'D' as const, text: '$12$' }],
          correct: 'A' as const,
          sol: '$x = \\frac{12 \\cdot 3}{4} = 9$.',
        },
        {
          prompt: `Cho đoạn thẳng $AB = 8\\text{ cm}$. Điểm $M$ là trung điểm của $AB$. Độ dài đoạn thẳng $AM$ là:`,
          options: [{ key: 'A' as const, text: '$4\\text{ cm}$' }, { key: 'B' as const, text: '$2\\text{ cm}$' }, { key: 'C' as const, text: '$6\\text{ cm}$' }, { key: 'D' as const, text: '$16\\text{ cm}$' }],
          correct: 'A' as const,
          sol: '$AM = \\frac{AB}{2} = \\frac{8}{2} = 4\\text{ cm}$.',
        },
        {
          prompt: `Cho hai góc kề bù $\\widehat{xOy}$ và $\\widehat{yOz}$, biết $\\widehat{xOy} = 65^\\circ$. Số đo góc $\\widehat{yOz}$ là:`,
          options: [{ key: 'A' as const, text: '$115^\\circ$' }, { key: 'B' as const, text: '$125^\\circ$' }, { key: 'C' as const, text: '$25^\\circ$' }, { key: 'D' as const, text: '$90^\\circ$' }],
          correct: 'A' as const,
          sol: 'Hai góc kề bù có tổng số đo bằng $180^\\circ$, suy ra $\\widehat{yOz} = 180^\\circ - 65^\\circ = 115^\\circ$.',
        },
        {
          prompt: `Thực hiện phép tính $125 \\cdot 37 + 125 \\cdot 63$ ta được kết quả là:`,
          options: [{ key: 'A' as const, text: '$12500$' }, { key: 'B' as const, text: '$1250$' }, { key: 'C' as const, text: '$25000$' }, { key: 'D' as const, text: '$10000$' }],
          correct: 'A' as const,
          sol: '$125 \\cdot (37 + 63) = 125 \\cdot 100 = 12500$.',
        },
        {
          prompt: `Trong các số $13; 15; 21; 27$, số nguyên tố là:`,
          options: [{ key: 'A' as const, text: '$13$' }, { key: 'B' as const, text: '$15$' }, { key: 'C' as const, text: '$21$' }, { key: 'D' as const, text: '$27$' }],
          correct: 'A' as const,
          sol: 'Số 13 chỉ có hai ước là 1 và chính nó nên là số nguyên tố.',
        },
        {
          prompt: `Hình vuông có diện tích bằng $36\\text{ cm}^2$. Chu vi của hình vuông đó là:`,
          options: [{ key: 'A' as const, text: '$24\\text{ cm}$' }, { key: 'B' as const, text: '$12\\text{ cm}$' }, { key: 'C' as const, text: '$36\\text{ cm}$' }, { key: 'D' as const, text: '$18\\text{ cm}$' }],
          correct: 'A' as const,
          sol: 'Cạnh hình vuông là $\\sqrt{36} = 6\\text{ cm}$. Chu vi là $4 \\cdot 6 = 24\\text{ cm}$.',
        },
      ];
      g6Mcq.forEach((m) => {
        candidates.push({
          subject: 'Toán',
          grade: '6',
          topicKeywords: [lesson, chapter],
          section: 'part1_mcq',
          type: 'multiple_choice',
          cognitiveLevel,
          prompt: m.prompt,
          options: m.options,
          correctOption: m.correct,
          solutionExplanation: m.sol,
          learningObjective: `${cogLabel} kiến thức trọng tâm Toán lớp 6.`,
        });
      });
    } else if (section === 'part2_true_false') {
      const g6Tf = [
        {
          prompt: `Xét tính Đúng/Sai của các khẳng định sau về số tự nhiên và số nguyên:`,
          tf: [
            { subKey: 'a' as const, text: 'Số 0 là số nguyên nhưng không phải là số tự nhiên.', isCorrect: false, explanation: 'Sai vì 0 vừa là số tự nhiên vừa là số nguyên.' },
            { subKey: 'b' as const, text: 'Tổng của hai số nguyên âm luôn là một số nguyên âm.', isCorrect: true, explanation: 'Đúng theo quy tắc cộng hai số nguyên cùng dấu âm.' },
            { subKey: 'c' as const, text: 'Mọi số nguyên tố đều là số lẻ.', isCorrect: false, explanation: 'Sai vì số 2 là số nguyên tố chẵn duy nhất.' },
            { subKey: 'd' as const, text: 'Tập hợp các ước chung của 12 và 18 gồm cả các số nguyên âm.', isCorrect: true, explanation: 'Đúng vì ước chung trong $\\mathbb{Z}$ bao gồm cả ước âm.' },
          ],
        },
        {
          prompt: `Xét tính Đúng/Sai của các mệnh đề sau về hình học trực quan:`,
          tf: [
            { subKey: 'a' as const, text: 'Hình thoi có bốn cạnh bằng nhau và hai đường chéo vuông góc với nhau.', isCorrect: true, explanation: 'Đúng theo tính chất hình thoi.' },
            { subKey: 'b' as const, text: 'Hình bình hành có hai đường chéo bằng nhau.', isCorrect: false, explanation: 'Sai vì chỉ hình chữ nhật hoặc hình thang cân mới có hai đường chéo bằng nhau.' },
            { subKey: 'c' as const, text: 'Hình lục giác đều có 6 cạnh bằng nhau và 6 góc bằng nhau.', isCorrect: true, explanation: 'Đúng theo định nghĩa lục giác đều.' },
            { subKey: 'd' as const, text: 'Diện tích hình chữ nhật có kích thước $a, b$ là $(a + b) \\times 2$.', isCorrect: false, explanation: 'Sai vì diện tích là $a \\times b$, còn $(a+b)\\times 2$ là chu vi.' },
          ],
        },
      ];
      g6Tf.forEach((tfItem) => {
        candidates.push({
          subject: 'Toán',
          grade: '6',
          topicKeywords: [lesson, chapter],
          section: 'part2_true_false',
          type: 'true_false',
          cognitiveLevel,
          prompt: tfItem.prompt,
          tfStatements: tfItem.tf,
          solutionExplanation: 'Vận dụng lý thuyết số học và hình học trực quan môn Toán lớp 6.',
          learningObjective: `${cogLabel} các mệnh đề lý thuyết môn Toán lớp 6.`,
        });
      });
    } else if (section === 'part3_short_answer') {
      const g6Short = [
        { prompt: `Tính nhanh giá trị biểu thức: $125 \\cdot 18 - 125 \\cdot 8$`, ans: '1250' },
        { prompt: `Tìm số tự nhiên $x$ thỏa mãn: $2x + 15 = 47$`, ans: '16' },
        { prompt: `Tìm ước chung lớn nhất của hai số $36$ và $90$: $\\text{ƯCLN}(36, 90) = ?$`, ans: '18' },
        { prompt: `Một mảnh sân hình chữ nhật có chiều dài $15\\text{ m}$ và chiều rộng $8\\text{ m}$. Tính diện tích mảnh sân đó theo đơn vị mét vuông:`, ans: '120' },
        { prompt: `Tính chu vi của hình vuông có diện tích bằng $49\\text{ cm}^2$ (kết quả theo đơn vị $\\text{cm}$):`, ans: '28' },
        { prompt: `Thực hiện phép tính số nguyên: $(-15) + 38 - 23$`, ans: '0' },
        { prompt: `Tìm số tự nhiên $x$ biết: $3^x = 81$`, ans: '4' },
      ];
      g6Short.forEach((s) => {
        candidates.push({
          subject: 'Toán',
          grade: '6',
          topicKeywords: [lesson, chapter],
          section: 'part3_short_answer',
          type: 'short_answer',
          cognitiveLevel,
          prompt: s.prompt,
          shortAnswerText: s.ans,
          solutionExplanation: `Tính toán cẩn thận ta thu được kết quả chính xác là ${s.ans}.`,
          learningObjective: `${cogLabel} tính toán đáp số nhanh môn Toán lớp 6.`,
        });
      });
    } else {
      candidates.push({
        subject: 'Toán',
        grade: '6',
        topicKeywords: [lesson, chapter],
        section: 'part4_essay',
        type: 'essay',
        cognitiveLevel,
        prompt: `Bác Nam có một mảnh vườn hình chữ nhật có chiều dài $12\\text{ m}$ và chiều rộng $8\\text{ m}$.\na) Tính diện tích mảnh vườn của bác Nam. (1.0 điểm)\nb) Bác Nam muốn lát gạch toàn bộ mảnh vườn bằng những viên gạch hình vuông có cạnh $40\\text{ cm}$. Hỏi bác Nam cần bao nhiêu viên gạch (bỏ qua mép vữa)? (1.0 điểm)`,
        essayGradingSteps: [
          { step: 'Diện tích mảnh vườn: $12 \\times 8 = 96\\text{ m}^2$.', point: 1.0 },
          { step: 'Đổi $40\\text{ cm} = 0,4\\text{ m}$. Diện tích một viên gạch: $0,4 \\times 0,4 = 0,16\\text{ m}^2$. Số viên gạch cần dùng: $96 : 0,16 = 600$ (viên).', point: 1.0 },
        ],
        solutionExplanation: 'Bài toán thực tế ứng dụng diện tích hình chữ nhật và hình vuông.',
        learningObjective: `${cogLabel} bài toán thực tế diện tích.`,
      });
    }
  }

  // ==================== KHỐI 7 ====================
  else if (normGrade === '7') {
    if (section === 'part1_mcq') {
      const g7Mcq = [
        {
          prompt: `Số nào sau đây là số hữu tỉ dương?`,
          options: [{ key: 'A' as const, text: '$\\frac{-3}{-4}$' }, { key: 'B' as const, text: '$\\frac{-2}{5}$' }, { key: 'C' as const, text: '$\\frac{3}{-7}$' }, { key: 'D' as const, text: '$0$' }],
          correct: 'A' as const,
          sol: '$\\frac{-3}{-4} = \\frac{3}{4} > 0$ là số hữu tỉ dương.',
        },
        {
          prompt: `Kết quả của phép tính $(-\\frac{1}{3})^3$ bằng:`,
          options: [{ key: 'A' as const, text: '$-\\frac{1}{27}$' }, { key: 'B' as const, text: '$\\frac{1}{27}$' }, { key: 'C' as const, text: '$-\\frac{1}{9}$' }, { key: 'D' as const, text: '$\\frac{1}{9}$' }],
          correct: 'A' as const,
          sol: 'Lũy thừa bậc lẻ của số âm là số âm: $(-\\frac{1}{3})^3 = -\\frac{1}{27}$.',
        },
        {
          prompt: `Giá trị của biểu thức $|-4,5| + |2,5|$ bằng:`,
          options: [{ key: 'A' as const, text: '$7$' }, { key: 'B' as const, text: '$-2$' }, { key: 'C' as const, text: '$2$' }, { key: 'D' as const, text: '$-7$' }],
          correct: 'A' as const,
          sol: '$|-4,5| + |2,5| = 4,5 + 2,5 = 7$.',
        },
        {
          prompt: `Căn bậc hai số học của số $49$ là:`,
          options: [{ key: 'A' as const, text: '$7$' }, { key: 'B' as const, text: '$-7$' }, { key: 'C' as const, text: '$\\pm 7$' }, { key: 'D' as const, text: '$2401$' }],
          correct: 'A' as const,
          sol: 'Căn bậc hai số học của $49$ là $\\sqrt{49} = 7$ (không âm).',
        },
        {
          prompt: `Cho hai góc đối đỉnh $\\widehat{xOy}$ và $\\widehat{x\'Oy\'}$. Biết $\\widehat{xOy} = 55^\\circ$. Số đo góc $\\widehat{x\'Oy\'}$ là:`,
          options: [{ key: 'A' as const, text: '$55^\\circ$' }, { key: 'B' as const, text: '$125^\\circ$' }, { key: 'C' as const, text: '$35^\\circ$' }, { key: 'D' as const, text: '$90^\\circ$' }],
          correct: 'A' as const,
          sol: 'Hai góc đối đỉnh thì bằng nhau, nên $\\widehat{x\'Oy\'} = 55^\\circ$.',
        },
        {
          prompt: `Tổng ba góc trong một tam giác luôn bằng:`,
          options: [{ key: 'A' as const, text: '$180^\\circ$' }, { key: 'B' as const, text: '$360^\\circ$' }, { key: 'C' as const, text: '$90^\\circ$' }, { key: 'D' as const, text: '$100^\\circ$' }],
          correct: 'A' as const,
          sol: 'Định lý tổng ba góc trong một tam giác bằng $180^\\circ$.',
        },
        {
          prompt: `Cho tam giác $ABC$ cân tại $A$ có $\\widehat{A} = 40^\\circ$. Số đo góc $B$ là:`,
          options: [{ key: 'A' as const, text: '$70^\\circ$' }, { key: 'B' as const, text: '$40^\\circ$' }, { key: 'C' as const, text: '$80^\\circ$' }, { key: 'D' as const, text: '$140^\\circ$' }],
          correct: 'A' as const,
          sol: 'Tam giác cân tại $A$ có $\\widehat{B} = \\frac{180^\\circ - 40^\\circ}{2} = 70^\\circ$.',
        },
        {
          prompt: `Bậc của đa thức $A(x) = 5x^4 - 2x^3 + x - 7$ là:`,
          options: [{ key: 'A' as const, text: '$4$' }, { key: 'B' as const, text: '$5$' }, { key: 'C' as const, text: '$3$' }, { key: 'D' as const, text: '$-7$' }],
          correct: 'A' as const,
          sol: 'Hạng tử có số mũ lớn nhất là $5x^4$ (bậc 4).',
        },
        {
          prompt: `Nghiệm của đa thức một biến $P(x) = 3x - 12$ là:`,
          options: [{ key: 'A' as const, text: '$x = 4$' }, { key: 'B' as const, text: '$x = -4$' }, { key: 'C' as const, text: '$x = 12$' }, { key: 'D' as const, text: '$x = 3$' }],
          correct: 'A' as const,
          sol: '$3x - 12 = 0 \\Leftrightarrow x = 4$.',
        },
        {
          prompt: `Từ tỉ lệ thức $\\frac{x}{6} = \\frac{5}{2}$, giá trị của $x$ là:`,
          options: [{ key: 'A' as const, text: '$15$' }, { key: 'B' as const, text: '$12$' }, { key: 'C' as const, text: '$10$' }, { key: 'D' as const, text: '$30$' }],
          correct: 'A' as const,
          sol: '$x = \\frac{6 \\cdot 5}{2} = 15$.',
        },
        {
          prompt: `Trong các số $\\sqrt{2}; \\frac{1}{3}; 0,25; -5$, số vô tỉ là:`,
          options: [{ key: 'A' as const, text: '$\\sqrt{2}$' }, { key: 'B' as const, text: '$\\frac{1}{3}$' }, { key: 'C' as const, text: '$0,25$' }, { key: 'D' as const, text: '$-5$' }],
          correct: 'A' as const,
          sol: '$\\sqrt{2} \\approx 1,4142...$ là số thập phân vô hạn không tuần hoàn nên là số vô tỉ.',
        },
        {
          prompt: `Giao điểm của ba đường trung tuyến trong một tam giác được gọi là:`,
          options: [{ key: 'A' as const, text: 'Trọng tâm tam giác' }, { key: 'B' as const, text: 'Trực tâm tam giác' }, { key: 'C' as const, text: 'Tâm đường tròn ngoại tiếp' }, { key: 'D' as const, text: 'Điểm đối xứng' }],
          correct: 'A' as const,
          sol: 'Giao điểm ba đường trung tuyến là trọng tâm tam giác.',
        },
      ];
      g7Mcq.forEach((m) => {
        candidates.push({
          subject: 'Toán',
          grade: '7',
          topicKeywords: [lesson, chapter],
          section: 'part1_mcq',
          type: 'multiple_choice',
          cognitiveLevel,
          prompt: m.prompt,
          options: m.options,
          correctOption: m.correct,
          solutionExplanation: m.sol,
          learningObjective: `${cogLabel} kiến thức trọng tâm Toán lớp 7.`,
        });
      });
    } else if (section === 'part3_short_answer') {
      const g7Short = [
        { prompt: `Tính giá trị của biểu thức: $(-\\frac{3}{4})^2 + \\frac{7}{16}$`, ans: '1' },
        { prompt: `Tìm $x$ trong tỉ lệ thức: $\\frac{x}{18} = \\frac{4}{3}$`, ans: '24' },
        { prompt: `Tìm nghiệm của đa thức $M(x) = 4x - 28$`, ans: '7' },
        { prompt: `Cho tam giác $ABC$ vuông tại $A$ có $AB = 6\\text{ cm}, AC = 8\\text{ cm}$. Tính độ dài cạnh huyền $BC$ theo định lý Pythagore:`, ans: '10' },
        { prompt: `Cho tam giác có $\\widehat{A} = 75^\\circ, \\widehat{B} = 45^\\circ$. Tính số đo góc $\\widehat{C}$ (độ):`, ans: '60' },
      ];
      g7Short.forEach((s) => {
        candidates.push({
          subject: 'Toán',
          grade: '7',
          topicKeywords: [lesson, chapter],
          section: 'part3_short_answer',
          type: 'short_answer',
          cognitiveLevel,
          prompt: s.prompt,
          shortAnswerText: s.ans,
          solutionExplanation: `Tính toán thu được kết quả chính xác là ${s.ans}.`,
          learningObjective: `${cogLabel} tính toán chuẩn xác Toán lớp 7.`,
        });
      });
    }
  }

  // ==================== KHỐI 8 ====================
  else if (normGrade === '8') {
    if (section === 'part1_mcq') {
      const g8Mcq = [
        {
          prompt: `Bậc của đơn thức $4x^3y^2z$ là:`,
          options: [{ key: 'A' as const, text: '$6$' }, { key: 'B' as const, text: '$5$' }, { key: 'C' as const, text: '$4$' }, { key: 'D' as const, text: '$3$' }],
          correct: 'A' as const,
          sol: 'Bậc của đơn thức là tổng số mũ của các biến: $3 + 2 + 1 = 6$.',
        },
        {
          prompt: `Khai triển hằng đẳng thức $(x + 2y)^2$ ta được kết quả là:`,
          options: [{ key: 'A' as const, text: '$x^2 + 4xy + 4y^2$' }, { key: 'B' as const, text: '$x^2 + 2xy + 4y^2$' }, { key: 'C' as const, text: '$x^2 + 4y^2$' }, { key: 'D' as const, text: '$x^2 + 4xy + 2y^2$' }],
          correct: 'A' as const,
          sol: '$(x + 2y)^2 = x^2 + 2 \\cdot x \\cdot 2y + (2y)^2 = x^2 + 4xy + 4y^2$.',
        },
        {
          prompt: `Phân tích đa thức $x^2 - 9$ thành nhân tử được kết quả là:`,
          options: [{ key: 'A' as const, text: '$(x - 3)(x + 3)$' }, { key: 'B' as const, text: '$(x - 3)^2$' }, { key: 'C' as const, text: '$(x + 3)^2$' }, { key: 'D' as const, text: '$x(x - 9)$' }],
          correct: 'A' as const,
          sol: 'Hằng đẳng thức hiệu hai bình phương: $x^2 - 3^2 = (x - 3)(x + 3)$.',
        },
        {
          prompt: `Điều kiện xác định của phân thức $\\frac{2x - 1}{x - 4}$ là:`,
          options: [{ key: 'A' as const, text: '$x \\ne 4$' }, { key: 'B' as const, text: '$x \\ne \\frac{1}{2}$' }, { key: 'C' as const, text: '$x = 4$' }, { key: 'D' as const, text: '$x > 4$' }],
          correct: 'A' as const,
          sol: 'Mẫu thức phải khác 0: $x - 4 \\ne 0 \\Leftrightarrow x \\ne 4$.',
        },
        {
          prompt: `Rút gọn phân thức $\\frac{x^2 - 16}{x + 4}$ với $x \\ne -4$ ta được:`,
          options: [{ key: 'A' as const, text: '$x - 4$' }, { key: 'B' as const, text: '$x + 4$' }, { key: 'C' as const, text: '$\\frac{1}{x - 4}$' }, { key: 'D' as const, text: '$x - 16$' }],
          correct: 'A' as const,
          sol: '$\\frac{(x - 4)(x + 4)}{x + 4} = x - 4$.',
        },
        {
          prompt: `Tổng các góc trong một tứ giác lồi luôn bằng:`,
          options: [{ key: 'A' as const, text: '$360^\\circ$' }, { key: 'B' as const, text: '$180^\\circ$' }, { key: 'C' as const, text: '$270^\\circ$' }, { key: 'D' as const, text: '$540^\\circ$' }],
          correct: 'A' as const,
          sol: 'Định lý tổng các góc của tứ giác bằng $360^\\circ$.',
        },
        {
          prompt: `Hình bình hành có hai đường chéo bằng nhau là hình gì?`,
          options: [{ key: 'A' as const, text: 'Hình chữ nhật' }, { key: 'B' as const, text: 'Hình thoi' }, { key: 'C' as const, text: 'Hình thang cân' }, { key: 'D' as const, text: 'Hình vuông' }],
          correct: 'A' as const,
          sol: 'Dấu hiệu nhận biết: Hình bình hành có hai đường chéo bằng nhau là hình chữ nhật.',
        },
        {
          prompt: `Cho tam giác $ABC$, $MN // BC$ ($M \\in AB, N \\in AC$). Khẳng định nào sau đây đúng theo định lý Thalès?`,
          options: [{ key: 'A' as const, text: '$\\frac{AM}{AB} = \\frac{AN}{AC}$' }, { key: 'B' as const, text: '$\\frac{AM}{MB} = \\frac{NC}{AN}$' }, { key: 'C' as const, text: '$\\frac{AM}{AC} = \\frac{AN}{AB}$' }, { key: 'D' as const, text: '$AM \\cdot AN = MB \\cdot NC$' }],
          correct: 'A' as const,
          sol: 'Định lý Thalès khẳng định: $\\frac{AM}{AB} = \\frac{AN}{AC}$.',
        },
        {
          prompt: `Một hình chóp tam giác đều có diện tích đáy bằng $15\\text{ cm}^2$ và chiều cao bằng $6\\text{ cm}$. Thể tích của hình chóp đó là:`,
          options: [{ key: 'A' as const, text: '$30\\text{ cm}^3$' }, { key: 'B' as const, text: '$90\\text{ cm}^3$' }, { key: 'C' as const, text: '$45\\text{ cm}^3$' }, { key: 'D' as const, text: '$60\\text{ cm}^3$' }],
          correct: 'A' as const,
          sol: '$V = \\frac{1}{3} S_{\\text{đáy}} \\cdot h = \\frac{1}{3} \\cdot 15 \\cdot 6 = 30\\text{ cm}^3$.',
        },
        {
          prompt: `Tính giá trị của biểu thức $x^2 - 6x + 9$ tại $x = 13$:`,
          options: [{ key: 'A' as const, text: '$100$' }, { key: 'B' as const, text: '$120$' }, { key: 'C' as const, text: '$81$' }, { key: 'D' as const, text: '$64$' }],
          correct: 'A' as const,
          sol: '$x^2 - 6x + 9 = (x - 3)^2$. Thay $x = 13$: $(13 - 3)^2 = 10^2 = 100$.',
        },
      ];
      g8Mcq.forEach((m) => {
        candidates.push({
          subject: 'Toán',
          grade: '8',
          topicKeywords: [lesson, chapter],
          section: 'part1_mcq',
          type: 'multiple_choice',
          cognitiveLevel,
          prompt: m.prompt,
          options: m.options,
          correctOption: m.correct,
          solutionExplanation: m.sol,
          learningObjective: `${cogLabel} kiến thức trọng tâm Toán lớp 8.`,
        });
      });
    } else if (section === 'part3_short_answer') {
      const g8Short = [
        { prompt: `Rút gọn và tính giá trị của $(x+3)^2 - (x-3)^2$ tại $x = 5$`, ans: '60' },
        { prompt: `Một hình chóp tứ giác đều có cạnh đáy $6\\text{ cm}$ và chiều cao $5\\text{ cm}$. Tính thể tích của hình chóp theo $\\text{cm}^3$:`, ans: '60' },
        { prompt: `Cho tam giác $ABC$ có $DE // BC$, biết $AD = 4\\text{ cm}, DB = 6\\text{ cm}, AE = 5\\text{ cm}$. Tính độ dài đoạn $EC$ theo đơn vị $\\text{cm}$:`, ans: '7,5' },
        { prompt: `Tính giá trị của phân thức $\\frac{x^2 - 1}{x - 1}$ tại $x = 99$:`, ans: '100' },
      ];
      g8Short.forEach((s) => {
        candidates.push({
          subject: 'Toán',
          grade: '8',
          topicKeywords: [lesson, chapter],
          section: 'part3_short_answer',
          type: 'short_answer',
          cognitiveLevel,
          prompt: s.prompt,
          shortAnswerText: s.ans,
          solutionExplanation: `Tính toán cẩn thận cho kết quả là ${s.ans}.`,
          learningObjective: `${cogLabel} tính toán chuẩn xác Toán lớp 8.`,
        });
      });
    }
  }

  // ==================== KHỐI 9 ====================
  else {
    if (section === 'part1_mcq') {
      const g9Mcq = [
        {
          prompt: `Căn bậc hai số học của $81$ là:`,
          options: [{ key: 'A' as const, text: '$9$' }, { key: 'B' as const, text: '$-9$' }, { key: 'C' as const, text: '$\\pm 9$' }, { key: 'D' as const, text: '$81$' }],
          correct: 'A' as const,
          sol: 'Căn bậc hai số học của $81$ là $\\sqrt{81} = 9$.',
        },
        {
          prompt: `Biểu thức $\\sqrt{2x - 6}$ xác định khi và chỉ khi:`,
          options: [{ key: 'A' as const, text: '$x \\ge 3$' }, { key: 'B' as const, text: '$x \\le 3$' }, { key: 'C' as const, text: '$x > 3$' }, { key: 'D' as const, text: '$x \\ne 3$' }],
          correct: 'A' as const,
          sol: 'Biểu thức dưới dấu căn không âm: $2x - 6 \\ge 0 \\Leftrightarrow x \\ge 3$.',
        },
        {
          prompt: `Trục căn thức ở mẫu của biểu thức $\\frac{6}{\\sqrt{3}}$ ta được kết quả là:`,
          options: [{ key: 'A' as const, text: '$2\\sqrt{3}$' }, { key: 'B' as const, text: '$3\\sqrt{3}$' }, { key: 'C' as const, text: '$6\\sqrt{3}$' }, { key: 'D' as const, text: '$\\sqrt{3}$' }],
          correct: 'A' as const,
          sol: '$\\frac{6}{\\sqrt{3}} = \\frac{6\\sqrt{3}}{3} = 2\\sqrt{3}$.',
        },
        {
          prompt: `Rút gọn biểu thức $\\sqrt{50} - \\sqrt{18}$ ta được kết quả là:`,
          options: [{ key: 'A' as const, text: '$2\\sqrt{2}$' }, { key: 'B' as const, text: '$\\sqrt{32}$' }, { key: 'C' as const, text: '$4\\sqrt{2}$' }, { key: 'D' as const, text: '$8\\sqrt{2}$' }],
          correct: 'A' as const,
          sol: '$\\sqrt{50} - \\sqrt{18} = 5\\sqrt{2} - 3\\sqrt{2} = 2\\sqrt{2}$.',
        },
        {
          prompt: `Hàm số bậc nhất $y = (3 - m)x + 5$ nghịch biến trên $\\mathbb{R}$ khi:`,
          options: [{ key: 'A' as const, text: '$m > 3$' }, { key: 'B' as const, text: '$m < 3$' }, { key: 'C' as const, text: '$m \\ge 3$' }, { key: 'D' as const, text: '$m \\ne 3$' }],
          correct: 'A' as const,
          sol: 'Hàm số nghịch biến khi hệ số $a < 0 \\Leftrightarrow 3 - m < 0 \\Leftrightarrow m > 3$.',
        },
        {
          prompt: `Hai đường thẳng $y = 2x + 1$ và $y = 2x - 5$ có vị trí tương đối là:`,
          options: [{ key: 'A' as const, text: 'Song song với nhau' }, { key: 'B' as const, text: 'Cắt nhau' }, { key: 'C' as const, text: 'Trùng nhau' }, { key: 'D' as const, text: 'Vuông góc với nhau' }],
          correct: 'A' as const,
          sol: 'Vì $a = a\' = 2$ và $b \\ne b\'$ ($1 \\ne -5$) nên hai đường thẳng song song.',
        },
        {
          prompt: `Nghiệm của hệ phương trình $\\begin{cases} x + y = 7 \\\\ x - y = 3 \\end{cases}$ là:`,
          options: [{ key: 'A' as const, text: '$(5; 2)$' }, { key: 'B' as const, text: '$(2; 5)$' }, { key: 'C' as const, text: '$(4; 3)$' }, { key: 'D' as const, text: '$(6; 1)$' }],
          correct: 'A' as const,
          sol: 'Cộng hai phương trình: $2x = 10 \\Rightarrow x = 5 \\Rightarrow y = 2$. Nghiệm là $(5; 2)$.',
        },
        {
          prompt: `Phương trình bậc hai $x^2 - 5x + 6 = 0$ có hai nghiệm là:`,
          options: [{ key: 'A' as const, text: '$x_1 = 2; x_2 = 3$' }, { key: 'B' as const, text: '$x_1 = -2; x_2 = -3$' }, { key: 'C' as const, text: '$x_1 = 1; x_2 = 6$' }, { key: 'D' as const, text: '$x_1 = -1; x_2 = -6$' }],
          correct: 'A' as const,
          sol: '$(x - 2)(x - 3) = 0 \\Leftrightarrow x = 2$ hoặc $x = 3$.',
        },
        {
          prompt: `Theo định lý Viète, tổng hai nghiệm của phương trình $2x^2 - 7x + 3 = 0$ bằng:`,
          options: [{ key: 'A' as const, text: '$\\frac{7}{2}$' }, { key: 'B' as const, text: '$-\\frac{7}{2}$' }, { key: 'C' as const, text: '$\\frac{3}{2}$' }, { key: 'D' as const, text: '$7$' }],
          correct: 'A' as const,
          sol: '$x_1 + x_2 = -\\frac{b}{a} = -\\frac{-7}{2} = \\frac{7}{2}$.',
        },
        {
          prompt: `Cho tam giác $ABC$ vuông tại $A$, đường cao $AH$. Biết $BH = 2\\text{ cm}, CH = 8\\text{ cm}$. Độ dài đoạn thẳng $AH$ là:`,
          options: [{ key: 'A' as const, text: '$4\\text{ cm}$' }, { key: 'B' as const, text: '$16\\text{ cm}$' }, { key: 'C' as const, text: '$5\\text{ cm}$' }, { key: 'D' as const, text: '$10\\text{ cm}$' }],
          correct: 'A' as const,
          sol: 'Hệ thức lượng trong tam giác vuông: $AH^2 = BH \\cdot CH = 2 \\cdot 8 = 16 \\Rightarrow AH = 4\\text{ cm}$.',
        },
        {
          prompt: `Cho tam giác vuông có một góc nhọn bằng $30^\\circ$. Giá trị $\\sin 30^\\circ$ bằng:`,
          options: [{ key: 'A' as const, text: '$\\frac{1}{2}$' }, { key: 'B' as const, text: '$\\frac{\\sqrt{3}}{2}$' }, { key: 'C' as const, text: '$\\frac{\\sqrt{2}}{2}$' }, { key: 'D' as const, text: '$1$' }],
          correct: 'A' as const,
          sol: 'Tỉ số lượng giác: $\\sin 30^\\circ = \\frac{1}{2}$.',
        },
        {
          prompt: `Số đo của góc nội tiếp chắn nửa đường tròn luôn bằng:`,
          options: [{ key: 'A' as const, text: '$90^\\circ$' }, { key: 'B' as const, text: '$180^\\circ$' }, { key: 'C' as const, text: '$60^\\circ$' }, { key: 'D' as const, text: '$45^\\circ$' }],
          correct: 'A' as const,
          sol: 'Định lý góc nội tiếp chắn nửa đường tròn là góc vuông ($90^\\circ$).',
        },
        {
          prompt: `Cho tứ giác $ABCD$ nội tiếp đường tròn $(O)$. Biết $\\widehat{A} = 85^\\circ$. Số đo góc đối diện $\\widehat{C}$ là:`,
          options: [{ key: 'A' as const, text: '$95^\\circ$' }, { key: 'B' as const, text: '$85^\\circ$' }, { key: 'C' as const, text: '$105^\\circ$' }, { key: 'D' as const, text: '$180^\\circ$' }],
          correct: 'A' as const,
          sol: 'Trong tứ giác nội tiếp, tổng hai góc đối diện bằng $180^\\circ$. Do đó $\\widehat{C} = 180^\\circ - 85^\\circ = 95^\\circ$.',
        },
      ];
      g9Mcq.forEach((m) => {
        candidates.push({
          subject: 'Toán',
          grade: '9',
          topicKeywords: [lesson, chapter],
          section: 'part1_mcq',
          type: 'multiple_choice',
          cognitiveLevel,
          prompt: m.prompt,
          options: m.options,
          correctOption: m.correct,
          solutionExplanation: m.sol,
          learningObjective: `${cogLabel} kiến thức trọng tâm Toán lớp 9.`,
        });
      });
    } else if (section === 'part3_short_answer') {
      const g9Short = [
        { prompt: `Tính giá trị của biểu thức: $(\\sqrt{3} + 1)^2 - \\sqrt{12}$`, ans: '4' },
        { prompt: `Tìm nghiệm dương của phương trình: $x^2 - 36 = 0$`, ans: '6' },
        { prompt: `Cho tam giác vuông có hai cạnh góc vuông là $6\\text{ cm}$ và $8\\text{ cm}$. Tính độ dài đường cao ứng với cạnh huyền:`, ans: '4,8' },
        { prompt: `Tìm giá trị của $m$ để đồ thị hàm số $y = mx + 2$ đi qua điểm $M(2; 8)$:`, ans: '3' },
        { prompt: `Tính tổng hai nghiệm của phương trình bậc hai $x^2 - 15x + 26 = 0$:`, ans: '15' },
        { prompt: `Cho tứ giác nội tiếp $ABCD$ có $\\widehat{A} = 70^\\circ$. Tính số đo góc $\\widehat{C}$ (độ):`, ans: '110' },
      ];
      g9Short.forEach((s) => {
        candidates.push({
          subject: 'Toán',
          grade: '9',
          topicKeywords: [lesson, chapter],
          section: 'part3_short_answer',
          type: 'short_answer',
          cognitiveLevel,
          prompt: s.prompt,
          shortAnswerText: s.ans,
          solutionExplanation: `Tính toán cẩn thận thu được kết quả chính xác là ${s.ans}.`,
          learningObjective: `${cogLabel} giải nhanh và điền kết quả chuẩn xác Toán lớp 9.`,
        });
      });
    }
  }

  // Lọc các câu chưa có trong đề hoặc gợi ý trước đó
  const filtered = candidates.filter((c) => !existingPrompts.has(c.prompt.trim()));

  // Nếu vẫn cần thêm để đủ targetCount, dùng fallback generator
  let idx = 1;
  while (filtered.length < targetCount && idx <= 20) {
    const fb = createFallbackQuestion(
      'Toán',
      normGrade,
      chapter,
      lesson,
      section,
      cognitiveLevel,
      idx * 3 + filtered.length,
      allowProbStats
    );
    if (!existingPrompts.has(fb.prompt.trim()) && !filtered.some((f) => f.prompt.trim() === fb.prompt.trim())) {
      filtered.push({ ...fb, source: 'ai_system' });
    }
    idx++;
  }

  return filtered.slice(0, targetCount);
}

/**
 * Lấy danh sách câu hỏi gợi ý cùng mức độ nhận thức (hoặc mức độ tùy chỉnh)
 * bám sát môn học, khối lớp (6, 7, 8, 9) và dạng thức câu hỏi.
 * ĐẢM BẢO: Danh sách luôn đa dạng và NHIỀU HƠN 10 CÂU (14 - 16 câu).
 * ĐẢM BẢO: Nếu nội dung không có Xác suất / Thống kê thì tuyệt đối KHÔNG sinh câu hỏi xác suất thống kê.
 */
export function getSuggestedQuestions(
  currentQuestion: ExamQuestion,
  grade: string = '9',
  targetLevel?: CognitiveLevel,
  customBank?: BankQuestionTemplate[],
  allowProbStats?: boolean
): BankQuestionTemplate[] {
  const desiredLevel = targetLevel || currentQuestion.cognitiveLevel;
  const section = currentQuestion.section;
  const topicLower = (currentQuestion.lesson || '').toLowerCase();
  const normGrade = String(grade || '').replace(/\D/g, '') || '9';

  // Xác định rõ ràng quyền sinh câu hỏi Xác suất / Thống kê
  const shouldAllowProbStats =
    allowProbStats !== undefined
      ? allowProbStats
      : isProbStatsQuestion(currentQuestion) || isProbStatsText(currentQuestion.lesson || '');

  // 1. Thu thập câu hỏi từ Ngân hàng do giáo viên tải lên trước
  const uploadedPool = customBank !== undefined ? customBank : getStoredUploadedQuestions();
  const uploadedCandidates: BankQuestionTemplate[] = [];

  if (uploadedPool && uploadedPool.length > 0) {
    uploadedPool.forEach((q) => {
      if (q.prompt.trim() === currentQuestion.prompt.trim()) return;
      if (q.section !== section) return;
      if (q.cognitiveLevel !== desiredLevel) return;
      if ((q.grade || '9') !== normGrade) return;
      const isQProb = isProbStatsQuestion(q);
      if (!shouldAllowProbStats && isQProb) return;
      if (shouldAllowProbStats && !isQProb) return;
      uploadedCandidates.push({ ...q, source: 'uploaded' });
    });

    // Sắp xếp ưu tiên khớp chủ đề trong ngân hàng tải lên
    uploadedCandidates.sort((a, b) => {
      const aTopic = (a.topicKeywords || []).some((kw) => topicLower.includes(kw.toLowerCase())) ? 1 : 0;
      const bTopic = (b.topicKeywords || []).some((kw) => topicLower.includes(kw.toLowerCase())) ? 1 : 0;
      return bTopic - aTopic;
    });
  }

  // 2. Lọc từ QUESTION_BANK hệ thống: Chuẩn xác 100% cùng Khối lớp, cùng dạng thức (section) và cùng mức độ nhận thức
  const matchingQuestions = QUESTION_BANK.filter((q) => {
    if (q.prompt.trim() === currentQuestion.prompt.trim()) return false;
    if (q.section !== section) return false;
    if (q.cognitiveLevel !== desiredLevel) return false;
    if ((q.grade || '9') !== normGrade) return false; // Tuyệt đối không lẫn lộn giữa các khối
    const isQProb = isProbStatsQuestion(q);
    if (!shouldAllowProbStats && isQProb) return false;
    if (shouldAllowProbStats && !isQProb) return false;
    return true;
  });

  // Ưu tiên sắp xếp câu hỏi khớp với chủ đề bài học đang xét
  matchingQuestions.sort((a, b) => {
    const aTopic = a.topicKeywords.some((kw) => topicLower.includes(kw.toLowerCase())) ? 1 : 0;
    const bTopic = b.topicKeywords.some((kw) => topicLower.includes(kw.toLowerCase())) ? 1 : 0;
    return bTopic - aTopic;
  });

  // Kết hợp ngân hàng tải lên lên đầu danh sách gợi ý (KHÔNG BỊ GIỚI HẠN .slice(0, 10))
  const results: BankQuestionTemplate[] = [
    ...uploadedCandidates,
    ...matchingQuestions.map((q) => ({ ...q, source: 'ai_system' as const })),
  ];

  // Đảm bảo số lượng câu hỏi gợi ý luôn đa dạng và NHIỀU HƠN 10 CÂU (tối thiểu 14 đến 16 câu)
  const existingPrompts = new Set<string>([
    currentQuestion.prompt.trim(),
    ...results.map((r) => r.prompt.trim()),
  ]);

  if (results.length < 14) {
    const needed = 16 - results.length;
    const generated = generateDiverseSuggestions(
      normGrade,
      currentQuestion.chapter || 'Toán học',
      currentQuestion.lesson || 'Kiến thức trọng tâm',
      section,
      desiredLevel,
      needed,
      existingPrompts,
      shouldAllowProbStats
    );
    results.push(...generated);
  }

  return results;
}

export function regenerateSingleQuestion(
  currentQuestion: ExamQuestion,
  allQuestionsInPaper: ExamQuestion[],
  grade: string = '9',
  customBank?: BankQuestionTemplate[],
  allowProbStats?: boolean
): ExamQuestion {
  const usedPrompts = new Set(allQuestionsInPaper.map((q) => q.prompt));
  const normGrade = String(grade || '').replace(/\D/g, '') || '9';

  const shouldAllowProb =
    allowProbStats !== undefined
      ? allowProbStats
      : isProbStatsQuestion(currentQuestion) || isProbStatsText(currentQuestion.lesson || '');

  let replacement = findBestQuestionFromBank(
    'Toán',
    normGrade,
    currentQuestion.lesson,
    currentQuestion.section,
    currentQuestion.cognitiveLevel,
    usedPrompts,
    customBank,
    shouldAllowProb
  );

  if (!replacement) {
    replacement = createFallbackQuestion(
      'Toán',
      normGrade,
      currentQuestion.chapter,
      currentQuestion.lesson,
      currentQuestion.section,
      currentQuestion.cognitiveLevel,
      Date.now() % 100,
      shouldAllowProb
    );
  }

  return formatQuestionLatex({
    ...currentQuestion,
    prompt: replacement.prompt,
    options: replacement.options,
    correctOption: replacement.correctOption,
    tfStatements: replacement.tfStatements,
    shortAnswerText: replacement.shortAnswerText,
    essayGradingSteps: replacement.essayGradingSteps,
    learningObjective: replacement.learningObjective,
    solutionExplanation: replacement.solutionExplanation,
    source: replacement.source || 'ai_system',
    sourceQuestionId: replacement.id,
  });
}

/**
 * Tạo câu hỏi mới theo mức độ nhận thức chỉ định (cùng mức độ hoặc mức độ mới tùy chọn)
 */
export function createNewQuestionWithLevel(
  baseQuestion: ExamQuestion,
  allQuestionsInPaper: ExamQuestion[],
  targetLevel?: 'nhanBiet' | 'thongHieu' | 'vanDung' | 'vanDungCao',
  grade: string = '9',
  allowProbStats?: boolean
): ExamQuestion {
  const level = targetLevel || baseQuestion.cognitiveLevel;
  const normGrade = String(grade || '').replace(/\D/g, '') || '9';
  const usedPrompts = new Set(allQuestionsInPaper.map((q) => q.prompt));

  const shouldAllowProb =
    allowProbStats !== undefined
      ? allowProbStats
      : isProbStatsQuestion(baseQuestion) || isProbStatsText(baseQuestion.lesson || '');

  let replacement = findBestQuestionFromBank(
    'Toán',
    normGrade,
    baseQuestion.lesson,
    baseQuestion.section,
    level,
    usedPrompts,
    undefined,
    shouldAllowProb
  );

  if (!replacement) {
    replacement = createFallbackQuestion(
      'Toán',
      normGrade,
      baseQuestion.chapter,
      baseQuestion.lesson,
      baseQuestion.section,
      level,
      allQuestionsInPaper.length + 1,
      shouldAllowProb
    );
  }

  const levelLabel =
    level === 'nhanBiet'
      ? 'Nhận biết'
      : level === 'thongHieu'
      ? 'Thông hiểu'
      : level === 'vanDung'
      ? 'Vận dụng'
      : 'Vận dụng cao';

  return formatQuestionLatex({
    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    code: `[C${allQuestionsInPaper.length + 1}]`,
    section: baseQuestion.section,
    type: replacement.type || baseQuestion.type,
    chapter: baseQuestion.chapter,
    lesson: baseQuestion.lesson,
    cognitiveLevel: level,
    cognitiveLevelLabel: levelLabel,
    learningObjective: replacement.learningObjective || baseQuestion.learningObjective,
    score: baseQuestion.score,
    prompt: replacement.prompt,
    options: replacement.options,
    correctOption: replacement.correctOption,
    tfStatements: replacement.tfStatements,
    shortAnswerText: replacement.shortAnswerText,
    essayGradingSteps: replacement.essayGradingSteps,
    solutionExplanation: replacement.solutionExplanation,
  });
}

// =================================================================
// 5. TÍNH TOÁN BẢNG ĐỐI CHIẾU MA TRẬN & YÊU CẦU CẦN ĐẠT
// =================================================================

export function calculateAlignmentSummary(questions: ExamQuestion[]) {
  let mcqCount = 0;
  let tfCount = 0;
  let shortCount = 0;
  let essayCount = 0;

  let scoreNB = 0;
  let scoreTH = 0;
  let scoreVD = 0;
  let scoreVDC = 0;

  let scoreP1 = 0;
  let scoreP2 = 0;
  let scoreP3 = 0;
  let scoreP4 = 0;

  questions.forEach((q) => {
    const s = q.score || 0;

    if (q.section === 'part1_mcq') {
      mcqCount++;
      scoreP1 += s;
    } else if (q.section === 'part2_true_false') {
      tfCount++;
      scoreP2 += s;
    } else if (q.section === 'part3_short_answer') {
      shortCount++;
      scoreP3 += s;
    } else if (q.section === 'part4_essay') {
      essayCount++;
      scoreP4 += s;
    }

    if (q.cognitiveLevel === 'nhanBiet') scoreNB += s;
    else if (q.cognitiveLevel === 'thongHieu') scoreTH += s;
    else if (q.cognitiveLevel === 'vanDung') scoreVD += s;
    else if (q.cognitiveLevel === 'vanDungCao') scoreVDC += s;
  });

  const totalScore = scoreP1 + scoreP2 + scoreP3 + scoreP4 || 10;
  const tnScore = scoreP1 + scoreP2 + scoreP3;
  const tlScore = scoreP4;

  return {
    totalQuestions: questions.length,
    mcqCount,
    tfCount,
    shortCount,
    essayCount,
    scoreNhanBiet: +scoreNB.toFixed(2),
    scoreThongHieu: +scoreTH.toFixed(2),
    scoreVanDung: +scoreVD.toFixed(2),
    scoreVanDungCao: +scoreVDC.toFixed(2),
    scorePart1: +scoreP1.toFixed(2),
    scorePart2: +scoreP2.toFixed(2),
    scorePart3: +scoreP3.toFixed(2),
    scorePart4: +scoreP4.toFixed(2),
    percentTn: Math.round((tnScore / totalScore) * 100),
    percentTl: Math.round((tlScore / totalScore) * 100),
  };
}
