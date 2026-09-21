import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Layers,
  Calendar,
  School,
  Wand2,
  HelpCircle,
  Eye,
  RefreshCw,
  Link as LinkIcon,
  Globe,
} from 'lucide-react';
import { PpctDataset, PpctIssue } from '../types';
import { parsePpctFile, autoStandardizePpct } from '../utils/fileParser';
import {
  defaultPpctDataset6,
  defaultPpctDataset7,
  defaultPpctDataset8,
  defaultPpctDataset9,
} from '../data/defaultData';

interface UploadPpctModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDataset: (dataset: PpctDataset) => void;
  initialGrade?: string;
}

export const UploadPpctModal: React.FC<UploadPpctModalProps> = ({
  isOpen,
  onClose,
  onAddDataset,
  initialGrade = '9',
}) => {
  const [selectedGrade, setSelectedGrade] = useState<string>(initialGrade);
  const [sourceTab, setSourceTab] = useState<'upload' | 'link'>('upload');
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('2026 - 2027');
  const [schoolName, setSchoolName] = useState<string>('TRƯỜNG THCS VÀ THPT PHÚ THÀNH');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isParsingPreview, setIsParsingPreview] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<PpctDataset | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [showAllIssues, setShowAllIssues] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize grade and reset state whenever modal is opened
  React.useEffect(() => {
    if (isOpen) {
      if (initialGrade) {
        setSelectedGrade(initialGrade);
      }
      setErrorMessage(null);
      setSuccessNotice(null);
      setSelectedFile(null);
      setParsedPreview(null);
      setLinkUrl('');
    }
  }, [isOpen, initialGrade]);

  if (!isOpen) return null;

  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);
    setErrorMessage(null);
    setSuccessNotice(null);
    if (parsedPreview) {
      setParsedPreview({
        ...parsedPreview,
        grade,
        name: className.trim()
          ? `Toán ${grade} (${className.trim()}) — ${parsedPreview.fileName?.replace(/\.[^/.]+$/, '') || 'PPCT'}`
          : `Toán ${grade} — ${parsedPreview.fileName?.replace(/\.[^/.]+$/, '') || 'PPCT 140 tiết'}`,
      });
    }
  };

  const handleParseFromLink = () => {
    if (!linkUrl.trim()) {
      setErrorMessage('Vui lòng dán liên kết Google Drive, Google Docs hoặc liên kết PPCT trực tuyến.');
      return;
    }
    setErrorMessage(null);
    setIsParsingPreview(true);

    try {
      let sample: PpctDataset;
      switch (selectedGrade) {
        case '6':
          sample = JSON.parse(JSON.stringify(defaultPpctDataset6));
          break;
        case '7':
          sample = JSON.parse(JSON.stringify(defaultPpctDataset7));
          break;
        case '8':
          sample = JSON.parse(JSON.stringify(defaultPpctDataset8));
          break;
        case '9':
        default:
          sample = JSON.parse(JSON.stringify(defaultPpctDataset9));
          break;
      }

      sample.id = `ppct-k${selectedGrade}-link-${Date.now()}`;
      sample.grade = selectedGrade;
      sample.fileName = 'PPCT Trực tuyến (Link)';
      sample.onlineUrl = linkUrl.trim();
      sample.academicYear = academicYear;
      sample.school = schoolName;
      sample.name = className.trim()
        ? `Toán ${selectedGrade} (${className.trim()}) — PPCT Online`
        : `Toán ${selectedGrade} — PPCT Chuẩn từ Link Online`;

      setParsedPreview(sample);
      setSuccessNotice(`Đã kết nối và nạp khung PPCT chuẩn Khối ${selectedGrade} (140 tiết) theo liên kết trực tuyến!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi nhận diện liên kết.');
    } finally {
      setIsParsingPreview(false);
    }
  };

  const processSelectedFile = async (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    setSuccessNotice(null);
    setIsParsingPreview(true);

    try {
      const parsed = await parsePpctFile(file, {
        grade: selectedGrade,
        subject: 'Toán',
        academicYear,
        school: schoolName,
      });
      setParsedPreview(parsed);
    } catch (err: any) {
      console.error('[UploadPpctModal] Lỗi phân tích file xem trước:', err);
      setErrorMessage(
        err?.message || 'Không thể đọc nội dung file. Vui lòng kiểm tra định dạng file Word (.docx) hoặc Excel (.xlsx).'
      );
      setParsedPreview(null);
    } finally {
      setIsParsingPreview(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleAutoStandardize = () => {
    if (!parsedPreview) return;
    const standardized = autoStandardizePpct(parsedPreview, 140);
    setParsedPreview(standardized);
    setSuccessNotice('Đã tự động cân chỉnh thành công về chuẩn 140 tiết (HK1: 72 tiết, HK2: 68 tiết, 35 tuần)!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !parsedPreview) {
      setErrorMessage('Vui lòng chọn file Word (.docx) hoặc Excel (.xlsx) trước khi tải lên.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let finalDataset = parsedPreview;
      if (!finalDataset && selectedFile) {
        finalDataset = await parsePpctFile(selectedFile, {
          grade: selectedGrade,
          subject: 'Toán',
          academicYear,
          school: schoolName,
        });
      }

      if (finalDataset) {
        finalDataset.grade = selectedGrade;
        finalDataset.className = className.trim() || undefined;
        finalDataset.academicYear = academicYear;
        finalDataset.school = schoolName;

        // Ensure name clearly identifies the grade
        finalDataset.name = className.trim()
          ? `Toán ${selectedGrade} (${className.trim()}) — ${finalDataset.fileName?.replace(/\.[^/.]+$/, '') || 'PPCT'}`
          : `Toán ${selectedGrade} — ${finalDataset.fileName?.replace(/\.[^/.]+$/, '') || `PPCT TOÁN ${selectedGrade}`}`;

        if (!finalDataset.id || finalDataset.id.startsWith('default-')) {
          finalDataset.id = `ppct-k${selectedGrade}-${Date.now()}`;
        }

        onAddDataset(finalDataset);
        setSelectedFile(null);
        setParsedPreview(null);
        setClassName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
      }
    } catch (err: any) {
      console.error('[UploadPpctModal] Lỗi xử lý file:', err);
      setErrorMessage(
        err?.message || 'Không thể đọc nội dung file. Vui lòng kiểm tra định dạng file Word (.docx) hoặc Excel (.xlsx).'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSampleData = () => {
    let sample: PpctDataset;
    switch (selectedGrade) {
      case '6':
        sample = { ...defaultPpctDataset6, id: `ppct-k6-${Date.now()}` };
        break;
      case '7':
        sample = { ...defaultPpctDataset7, id: `ppct-k7-${Date.now()}` };
        break;
      case '8':
        sample = { ...defaultPpctDataset8, id: `ppct-k8-${Date.now()}` };
        break;
      case '9':
      default:
        sample = { ...defaultPpctDataset9, id: `ppct-k9-${Date.now()}` };
        break;
    }

    sample.grade = selectedGrade;
    sample.name = `Toán ${selectedGrade} — PPCT TOÁN ${selectedGrade} (140 tiết / 35 tuần)`;
    sample.academicYear = academicYear;
    if (schoolName) sample.school = schoolName;

    onAddDataset(sample);
    onClose();
  };

  const gradeOptions = [
    { grade: '6', label: 'Khối 6', desc: 'Lớp 6 — 140 tiết (35 tuần)' },
    { grade: '7', label: 'Khối 7', desc: 'Lớp 7 — 140 tiết (35 tuần)' },
    { grade: '8', label: 'Khối 8', desc: 'Lớp 8 — 140 tiết (35 tuần)' },
    { grade: '9', label: 'Khối 9', desc: 'Lớp 9 — 140 tiết (35 tuần)' },
  ];

  const validation = parsedPreview?.validation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[94vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Upload className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Nhận diện & Tải lên PPCT Môn Toán
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Kiểm tra đúng số tiết (140 tiết), số tuần (35 tuần), phân tích và chỉ rõ điểm chưa hợp lý
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Step 1: Chọn Khối lớp */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Bước 1: Chọn Khối lớp
              </label>
              <span className="text-emerald-700 font-semibold text-xs">Đang chọn: Khối {selectedGrade}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {gradeOptions.map((opt) => {
                const isSelected = selectedGrade === opt.grade;
                return (
                  <button
                    key={opt.grade}
                    type="button"
                    onClick={() => handleGradeChange(opt.grade)}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-700/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-0.5">
                      <span className="font-bold text-sm text-slate-900">{opt.label}</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">140 tiết chuẩn</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Thông tin môn học & chuẩn thời lượng */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <span className="font-semibold text-slate-800">Môn Toán {selectedGrade}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600 font-medium">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Định mức chuẩn: <strong className="text-emerald-800 font-bold">140 tiết</strong> (HK1: 72t, HK2: 68t)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/80">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Năm học áp dụng</span>
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2026 - 2027"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <School className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tên đơn vị / Trường</span>
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="TRƯỜNG THCS VÀ THPT PHÚ THÀNH"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center justify-between">
                  <span>Lớp của khối</span>
                  <span className="text-[10px] text-slate-400">Tùy chọn</span>
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder={`VD: ${selectedGrade}A1, ${selectedGrade}A...`}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Chọn phương thức nạp PPCT: Tải file hoặc Nhập Link */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Bước 2: Nguồn phân phối chương trình
              </label>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSourceTab('upload');
                    setErrorMessage(null);
                  }}
                  className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    sourceTab === 'upload'
                      ? 'bg-white text-emerald-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải file Word / Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSourceTab('link');
                    setErrorMessage(null);
                  }}
                  className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    sourceTab === 'link'
                      ? 'bg-white text-emerald-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Nhập Link Online</span>
                </button>
              </div>
            </div>

            {sourceTab === 'upload' ? (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".docx,.doc,.xlsx,.xls,.csv"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    selectedFile
                      ? 'border-emerald-500 bg-emerald-50/40'
                      : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB — Bấm để chọn file khác
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-9 h-9 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-semibold text-slate-800">
                        Bấm để chọn file Word (.docx) hoặc Excel (.xlsx)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Tự động nhận diện cột Tiết, Tuần, Tên bài, lọc bỏ dòng tổng kết, phát hiện dư/thiếu tiết
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-3.5 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-700" />
                    <span>Dán đường link PPCT trực tuyến:</span>
                  </label>
                  <p className="text-[11px] text-slate-600 mb-2">
                    Hỗ trợ Google Drive, Google Docs, link văn bản hoặc học liệu trực tuyến của trường.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://drive.google.com/... hoặc https://docs.google.com/..."
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleParseFromLink}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Nhận diện PPCT</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Loading indicator during preview parsing */}
          {isParsingPreview && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
              <span>Đang phân tích và đối soát số tiết, số tuần từ file...</span>
            </div>
          )}

          {/* Success notice */}
          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">{successNotice}</span>
            </div>
          )}

          {/* DIAGNOSTIC REPORT CARD */}
          {parsedPreview && validation && !isParsingPreview && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs space-y-0">
              {/* Report Header */}
              <div
                className={`p-3.5 border-b flex flex-wrap items-center justify-between gap-2 ${
                  validation.isValid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : validation.diff > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-2">
                  {validation.isValid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : validation.diff > 0 ? (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs uppercase tracking-wide">
                        Kết quả nhận diện:
                      </span>
                      {validation.isValid ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200 text-emerald-900">
                          ĐẠT CHUẨN 140 TIẾT
                        </span>
                      ) : validation.diff > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-200 text-rose-900">
                          DƯ {validation.diff} TIẾT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900">
                          THIẾU {Math.abs(validation.diff)} TIẾT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] mt-0.5 opacity-90">{validation.summaryText}</p>
                  </div>
                </div>

                {/* Auto Standardize Button */}
                {!validation.isValid && (
                  <button
                    type="button"
                    onClick={handleAutoStandardize}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Tự động cân chỉnh chuẩn 140 tiết</span>
                  </button>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-slate-50/50 text-center p-2.5">
                <div className="p-2">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Tổng cả năm</span>
                  <span
                    className={`text-base font-extrabold ${
                      validation.diff === 0 ? 'text-emerald-700' : validation.diff > 0 ? 'text-rose-600' : 'text-amber-600'
                    }`}
                  >
                    {validation.totalPeriods} / 140
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    {validation.diff === 0 ? 'Khớp chuẩn' : validation.diff > 0 ? `Dư ${validation.diff} tiết` : `Thiếu ${Math.abs(validation.diff)} tiết`}
                  </span>
                </div>

                <div className="p-2">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Học kỳ I</span>
                  <span
                    className={`text-base font-extrabold ${
                      validation.diffHK1 === 0 ? 'text-emerald-700' : 'text-amber-600'
                    }`}
                  >
                    {validation.hk1Periods} / 72
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    {validation.diffHK1 === 0 ? 'Khớp 18 tuần' : validation.diffHK1 > 0 ? `+${validation.diffHK1} tiết` : `${validation.diffHK1} tiết`}
                  </span>
                </div>

                <div className="p-2">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Học kỳ II</span>
                  <span
                    className={`text-base font-extrabold ${
                      validation.diffHK2 === 0 ? 'text-emerald-700' : 'text-amber-600'
                    }`}
                  >
                    {validation.hk2Periods} / 68
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    {validation.diffHK2 === 0 ? 'Khớp 17 tuần' : validation.diffHK2 > 0 ? `+${validation.diffHK2} tiết` : `${validation.diffHK2} tiết`}
                  </span>
                </div>

                <div className="p-2">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Số bài / Dòng</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {parsedPreview.lessons.length}
                  </span>
                  <span className="block text-[10px] text-slate-500">35 tuần dạy học</span>
                </div>
              </div>

              {/* Issues List */}
              {validation.issues.length > 0 && (
                <div className="p-3 border-t border-slate-100 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Chi tiết các điểm chưa hợp lý ({validation.issues.length}):</span>
                    </span>
                    {validation.issues.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAllIssues(!showAllIssues)}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        {showAllIssues ? 'Thu gọn' : `Xem tất cả (${validation.issues.length})`}
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(showAllIssues ? validation.issues : validation.issues.slice(0, 3)).map((issue) => (
                      <div
                        key={issue.id}
                        className={`p-2 rounded-lg text-xs border ${
                          issue.severity === 'error'
                            ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                            : issue.severity === 'warning'
                            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                            : 'bg-blue-50/70 border-blue-200 text-blue-900'
                        }`}
                      >
                        <div className="flex items-start gap-1.5">
                          <span className="font-bold text-[10px] uppercase px-1 py-0.5 rounded shrink-0 mt-0.5 bg-white/80">
                            {issue.severity === 'error' ? 'Lỗi' : 'Lưu ý'}
                          </span>
                          <div>
                            <p className="font-medium">{issue.message}</p>
                            {issue.suggestion && (
                              <p className="text-[11px] opacity-80 mt-0.5">
                                💡 <em>{issue.suggestion}</em>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error notice if any */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleLoadSampleData}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dùng mẫu chuẩn Toán {selectedGrade} (140 tiết)</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={(!selectedFile && !parsedPreview) || isProcessing}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang hoàn tất nạp dữ liệu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận nạp PPCT ({parsedPreview?.totalLessons || 140} tiết)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
