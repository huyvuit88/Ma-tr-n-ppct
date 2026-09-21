import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Upload,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Layers,
  FileImage,
  RefreshCw,
  FileText,
  Clipboard,
  UserCheck,
  Zap,
  ArrowRight,
  Edit3,
} from 'lucide-react';
import { TeacherTimetableConfig, TimetableSlot } from '../../types';
import { getDefaultTeacherTimetable } from '../../utils/timetableScheduler';

interface TimetableUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: TeacherTimetableConfig;
  onSaveConfig: (config: TeacherTimetableConfig) => void;
  targetWeek?: number;
  initialFile?: {
    dataUrl: string;
    fileName: string;
    isPdf: boolean;
  } | null;
}

export const TimetableUploadModal: React.FC<TimetableUploadModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
  targetWeek,
  initialFile,
}) => {
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [fileSizeText, setFileSizeText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [detectedTeachers, setDetectedTeachers] = useState<Array<{ name: string; subject?: string; slotsCount?: number }>>([]);
  const [allTeacherSlots, setAllTeacherSlots] = useState<Record<string, TimetableSlot[]>>({});

  // Quick class rename in modal
  const [isQuickRenameOpen, setIsQuickRenameOpen] = useState<boolean>(false);
  const [quickOldClass, setQuickOldClass] = useState<string>('');
  const [quickNewClass, setQuickNewClass] = useState<string>('');

  // Form states for editable config
  const [teacherName, setTeacherName] = useState<string>(currentConfig.teacherName || 'Dương Văn Trong');
  const [schoolName, setSchoolName] = useState<string>(currentConfig.schoolName || 'TRƯỜNG THCS VÀ THPT PHÚ THÀNH');
  const [appliedDate, setAppliedDate] = useState<string>(currentConfig.appliedDate || '2026-09-07');
  
  // Scope of application (all weeks, specific week, or from week X onwards)
  const [applyScope, setApplyScope] = useState<'all' | 'specific' | 'from_week'>('specific');
  const [selectedTargetWeek, setSelectedTargetWeek] = useState<number>(() => targetWeek || currentConfig.appliedWeek || 1);

  const [slots, setSlots] = useState<TimetableSlot[]>(() => {
    // Ưu tiên nạp đúng slots của tuần được chọn nếu đã có
    const initialWeek = targetWeek || currentConfig.appliedWeek || 1;
    if (currentConfig.weeklySlots && currentConfig.weeklySlots[initialWeek] && currentConfig.weeklySlots[initialWeek].length > 0) {
      return currentConfig.weeklySlots[initialWeek];
    }
    return currentConfig.slots && currentConfig.slots.length > 0
      ? currentConfig.slots
      : getDefaultTeacherTimetable().slots;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Computed detected classes list
  const detectedClasses = useMemo(() => {
    const classSet = new Set<string>();
    slots.forEach((s) => {
      if (s.className) classSet.add(s.className);
    });
    return Array.from(classSet).sort();
  }, [slots]);

  // Call AI OCR endpoint on server
  const handleAnalyzeWithAI = async (
    customFileUrl?: string,
    customIsPdf?: boolean,
    customTeacher?: string
  ) => {
    const filePayload = customFileUrl || selectedFileUrl;
    if (!filePayload) {
      setErrorMsg('Vui lòng chọn ảnh, tải lên tệp PDF hoặc nhấn Ctrl+V để dán ảnh Thời khóa biểu trước.');
      return;
    }

    const checkPdf = customIsPdf !== undefined ? customIsPdf : isPdf;
    const targetTeacher = (customTeacher !== undefined ? customTeacher : teacherName).trim();

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const mimeType = checkPdf
        ? 'application/pdf'
        : filePayload.startsWith('data:image/png')
        ? 'image/png'
        : 'image/jpeg';

      const res = await fetch('/api/parse-tkb-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: filePayload,
          mimeType,
          targetTeacherName: targetTeacher || 'Dương Văn Trong',
          teacherName: targetTeacher,
          schoolName: schoolName.trim(),
        }),
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.slots) && data.slots.length > 0) {
        setSlots(data.slots);
        if (data.teacherName) setTeacherName(data.teacherName);
        if (data.schoolName) setSchoolName(data.schoolName);
        if (data.appliedDate) setAppliedDate(data.appliedDate);
        if (typeof data.appliedWeek === 'number' && data.appliedWeek >= 1 && data.appliedWeek <= 35) {
          setSelectedTargetWeek(data.appliedWeek);
          setApplyScope('specific');
        }
        if (Array.isArray(data.detectedTeachers) && data.detectedTeachers.length > 0) {
          setDetectedTeachers(data.detectedTeachers);
        }
        if (data.allTeacherSlots && typeof data.allTeacherSlots === 'object') {
          setAllTeacherSlots(data.allTeacherSlots);
        }

        const classList = Array.from(new Set(data.slots.map((s: any) => s.className).filter(Boolean))).sort().join(', ');
        setSuccessMsg(
          data.summary ||
            `Đã nhận diện thành công TKB môn Toán của giáo viên ${data.teacherName || targetTeacher} (${data.slots.length} tiết: Lớp ${classList})! Bấm nút "Đồng bộ TKB ngay" để áp dụng.`
        );
      } else {
        setErrorMsg(
          data.message ||
            'Không tìm thấy tiết dạy trong tệp đính kèm. Thầy/Cô có thể dùng TKB mẫu Khối 7 & 9 hoặc chỉnh sửa trực tiếp bên dưới.'
        );
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ phân tích: ' + (err?.message || 'Thử lại sau.'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Switch to another teacher detected in Column 1
  const handleSelectDetectedTeacher = (tName: string) => {
    setTeacherName(tName);
    if (allTeacherSlots[tName] && allTeacherSlots[tName].length > 0) {
      setSlots(allTeacherSlots[tName]);
      const classList = Array.from(new Set(allTeacherSlots[tName].map((s) => s.className))).sort().join(', ');
      setSuccessMsg(`Đã nạp TKB của giáo viên ${tName} (${allTeacherSlots[tName].length} tiết: Lớp ${classList}). Bấm "Đồng bộ TKB ngay" để cập nhật.`);
    } else if (selectedFileUrl) {
      handleAnalyzeWithAI(selectedFileUrl, isPdf, tName);
    }
  };

  // Đồng bộ lại khi targetWeek thay đổi
  useEffect(() => {
    if (targetWeek) {
      setSelectedTargetWeek(targetWeek);
      if (currentConfig.weeklySlots && currentConfig.weeklySlots[targetWeek] && currentConfig.weeklySlots[targetWeek].length > 0) {
        setSlots(currentConfig.weeklySlots[targetWeek]);
      }
    }
  }, [targetWeek, currentConfig.weeklySlots]);

  // Handle initialFile prop if provided when modal opens
  useEffect(() => {
    if (initialFile && initialFile.dataUrl) {
      setSelectedFileUrl(initialFile.dataUrl);
      setFileName(initialFile.fileName || 'Ảnh từ Clipboard');
      setIsPdf(initialFile.isPdf || false);
      // Automatically trigger AI OCR analysis immediately
      handleAnalyzeWithAI(initialFile.dataUrl, initialFile.isPdf || false, teacherName);
    }
  }, [initialFile]);

  // Process selected file (Image or PDF)
  const processSelectedFile = (file: File, customName?: string) => {
    const isFilePdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isFilePdf && !isImage) {
      setErrorMsg('Vui lòng chọn file hình ảnh (JPG, PNG, WEBP) hoặc tệp PDF Thời khóa biểu.');
      return;
    }

    // Format file size
    const sizeInKb = Math.round(file.size / 1024);
    setFileSizeText(sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`);

    setErrorMsg(null);
    setSuccessMsg(null);
    setFileName(customName || file.name);
    setIsPdf(isFilePdf);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedFileUrl(base64);
      // Automatically trigger AI OCR analysis immediately
      handleAnalyzeWithAI(base64, isFilePdf, teacherName);
    };
    reader.readAsDataURL(file);
  };

  // Global Ctrl+V clipboard paste listener when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept if user is typing into an input or textarea
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            processSelectedFile(file, `Ảnh_chụp_màn_hình_${new Date().toLocaleTimeString('vi-VN').replace(/:/g, '-')}.png`);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, teacherName]);

  if (!isOpen) return null;

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  // Handle Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Clipboard paste button trigger
  const handleManualPasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File([blob], `Ảnh_chụp_màn_hình_${Date.now()}.png`, { type: imageType });
            processSelectedFile(file);
            setSuccessMsg('Đã dán ảnh từ Clipboard thành công! Nhấn "Trích xuất TKB bằng AI" để đồng bộ.');
            return;
          }
        }
      }
      // If no direct read or blocked by browser permissions, prompt user to press Ctrl+V
      setErrorMsg('Vui lòng chụp ảnh màn hình (Win + Shift + S hoặc PrtScn), sau đó bấm tổ hợp phím Ctrl + V để dán trực tiếp vào đây.');
    } catch {
      setErrorMsg('Vui lòng bấm tổ hợp phím Ctrl + V trên bàn phím để dán trực tiếp ảnh chụp màn hình.');
    }
  };

  // Nạp nhanh TKB mẫu Toán 7 & 9 (theo ảnh TKB năm học 2026-2027)
  const handleLoadDefaultPreset = () => {
    const def = getDefaultTeacherTimetable();
    setSlots(def.slots);
    setTeacherName(def.teacherName);
    setSchoolName(def.schoolName);
    setAppliedDate(def.appliedDate);
    setSelectedTargetWeek(1);
    setApplyScope('all');
    setSuccessMsg('Đã nạp Thời khóa biểu chuẩn theo ảnh mẫu TKB 2026-2027 (7A4, 9A4, 9A5) áp dụng từ 07/09/2026.');
    setErrorMsg(null);
  };

  // Thêm 1 tiết dạy thủ công
  const handleAddSlot = () => {
    const newSlot: TimetableSlot = {
      id: `slot-manual-${Date.now()}`,
      dayOfWeek: 2,
      period: 1,
      session: 'sang',
      className: '7A4',
      grade: '7',
      subject: 'Toán',
      room: 'Phòng 7A4',
    };
    setSlots((prev) => [...prev, newSlot]);
  };

  // Cập nhật 1 slot
  const handleUpdateSlot = (id: string, updates: Partial<TimetableSlot>) => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated = { ...s, ...updates };
        if (updates.className !== undefined) {
          const trimmed = updates.className.trim().toUpperCase();
          updated.className = trimmed;
          const match = trimmed.match(/\b(1[0-2]|[6-9])|([6-9])/);
          if (match) {
            updated.grade = match[0];
          }
          if (!s.room || s.room === `Phòng ${s.className}` || s.room === '') {
            updated.room = `Phòng ${trimmed}`;
          }
        }
        return updated;
      })
    );
  };

  // Đổi tên lớp hàng loạt trong danh sách slot
  const handleQuickRenameClass = () => {
    if (!quickOldClass || !quickNewClass.trim()) return;
    const trimmed = quickNewClass.trim().toUpperCase();
    const match = trimmed.match(/\b(1[0-2]|[6-9])|([6-9])/);
    const inferredGrade = match ? match[0] : '9';

    setSlots((prev) =>
      prev.map((s) => {
        if (s.className?.toUpperCase() === quickOldClass.toUpperCase()) {
          return {
            ...s,
            className: trimmed,
            grade: inferredGrade,
            room: !s.room || s.room === `Phòng ${s.className}` ? `Phòng ${trimmed}` : s.room,
          };
        }
        return s;
      })
    );
    setIsQuickRenameOpen(false);
    setQuickNewClass('');
  };

  // Xóa 1 slot
  const handleDeleteSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  // Lưu toàn bộ cấu hình TKB và đồng bộ vào hệ thống theo tuần
  const handleSave = () => {
    if (slots.length === 0) {
      setErrorMsg('Vui lòng thêm ít nhất 1 tiết dạy trong thời khóa biểu.');
      return;
    }

    const updatedWeeklySlots: Record<number, TimetableSlot[]> = {
      ...(currentConfig.weeklySlots || {}),
    };
    const updatedWeeklyDates: Record<number, string> = {
      ...(currentConfig.weeklyAppliedDates || {}),
    };

    if (applyScope === 'specific') {
      updatedWeeklySlots[selectedTargetWeek] = slots;
      if (appliedDate) updatedWeeklyDates[selectedTargetWeek] = appliedDate;
    } else if (applyScope === 'from_week') {
      for (let w = selectedTargetWeek; w <= 35; w++) {
        updatedWeeklySlots[w] = slots;
      }
      if (appliedDate) updatedWeeklyDates[selectedTargetWeek] = appliedDate;
    } else {
      // 'all': áp dụng chung cho tất cả các tuần
      for (let w = 1; w <= 35; w++) {
        updatedWeeklySlots[w] = slots;
      }
      if (appliedDate) updatedWeeklyDates[1] = appliedDate;
    }

    const updatedConfig: TeacherTimetableConfig = {
      ...currentConfig,
      teacherName: teacherName.trim(),
      schoolName: schoolName.trim(),
      appliedDate: appliedDate || '2026-09-07',
      appliedWeek: selectedTargetWeek,
      slots,
      weeklySlots: updatedWeeklySlots,
      weeklyAppliedDates: updatedWeeklyDates,
      lastPhotoUploadedAt: selectedFileUrl ? new Date().toISOString() : currentConfig.lastPhotoUploadedAt,
      lastPhotoName: fileName || currentConfig.lastPhotoName,
      sourceImageBase64: !isPdf ? (selectedFileUrl || currentConfig.sourceImageBase64) : currentConfig.sourceImageBase64,
    };

    onSaveConfig(updatedConfig);
    onClose();
  };

  const dayLabels: Record<number, string> = {
    2: 'Thứ Hai',
    3: 'Thứ Ba',
    4: 'Thứ Tư',
    5: 'Thứ Năm',
    6: 'Thứ Sáu',
    7: 'Thứ Bảy',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-850 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Camera className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>Nạp Thời Khóa Biểu</span>
                <span className="text-[11px] font-normal bg-emerald-700/80 border border-emerald-500/40 px-2 py-0.5 rounded-full text-emerald-100">
                  Ảnh • PDF • Dán Ctrl+V
                </span>
              </h2>
              <p className="text-xs text-emerald-100">
                Nhận diện chính xác giáo viên <strong>Dương Văn Trong</strong> & tự động đồng bộ xếp bài dạy PPCT
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Section 1: Upload / Paste Dropzone */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Tải lên tệp PDF, Ảnh TKB hoặc Dán trực tiếp từ màn hình (Ctrl+V)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualPasteClipboard}
                  className="text-xs font-bold text-teal-800 hover:text-teal-950 bg-teal-100/80 hover:bg-teal-200 px-3 py-1 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  title="Dán ảnh chụp màn hình từ bộ nhớ tạm"
                >
                  <Clipboard className="w-3.5 h-3.5 text-teal-700" />
                  Dán ảnh (Ctrl+V)
                </button>
                <button
                  type="button"
                  onClick={handleLoadDefaultPreset}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100/70 hover:bg-emerald-200 px-3 py-1 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Nạp TKB mẫu 2026-2027
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
              {/* Upload Dropzone */}
              <div className="md:col-span-8 flex flex-col">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,.pdf"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group flex-1 ${
                    isDragging
                      ? 'border-emerald-600 bg-emerald-50 scale-[1.01]'
                      : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 group-hover:scale-110 flex items-center justify-center transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 group-hover:scale-110 flex items-center justify-center transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 group-hover:scale-110 flex items-center justify-center transition-transform">
                      <Clipboard className="w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      Tải lên tệp PDF hoặc Ảnh TKB • Dán ảnh màn hình (Ctrl+V)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Hỗ trợ tệp <strong>.PDF</strong>, ảnh <strong>JPG, PNG, WEBP</strong> hoặc ảnh vừa chụp bằng <strong>Win + Shift + S</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-700" />
                      Chụp camera
                    </button>
                    <span className="text-[11px] text-emerald-700 bg-emerald-100/60 font-semibold px-2 py-0.5 rounded border border-emerald-300/60">
                      Phím tắt Ctrl + V dán trực tiếp
                    </span>
                    <span className="text-[11px] text-slate-400">hoặc kéo thả tệp vào đây</span>
                  </div>
                </div>
              </div>

              {/* Preview Box */}
              <div className="md:col-span-4 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl p-3 min-h-[150px]">
                {selectedFileUrl ? (
                  <div className="w-full space-y-2 text-center">
                    {isPdf ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                        <FileText className="w-10 h-10 text-red-600 mx-auto mb-1" />
                        <span className="inline-block px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                          Tệp tài liệu PDF
                        </span>
                        <p className="text-xs font-bold text-slate-800 truncate mt-1.5">{fileName}</p>
                        {fileSizeText && <p className="text-[10px] text-slate-500">{fileSizeText}</p>}
                      </div>
                    ) : (
                      <div className="relative max-h-28 overflow-hidden rounded-lg border border-slate-200 mx-auto bg-slate-100">
                        <img
                          src={selectedFileUrl}
                          alt="TKB Preview"
                          className="w-full h-auto object-cover max-h-28"
                        />
                      </div>
                    )}

                    <p className="text-[11px] font-semibold text-slate-700 truncate max-w-[200px] mx-auto">
                      {fileName || 'Tệp TKB đã sẵn sàng'}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleAnalyzeWithAI()}
                      disabled={isProcessing}
                      className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang nhận diện TKB {teacherName || 'Thầy Trong'}...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Trích xuất TKB bằng AI</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 p-2">
                    <FileImage className="w-8 h-8 mx-auto stroke-1 mb-1 text-slate-300" />
                    <p className="text-xs font-medium">Chưa có tệp nào</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Tải lên file PDF hoặc nhấn Ctrl+V</p>
                  </div>
                )}
              </div>
            </div>

            {/* Target Teacher & Column 1 Structure Callout */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-950 flex flex-wrap items-center gap-1.5">
                      <span>Đích danh giáo viên nhận diện (Cột đầu): </span>
                      <input
                        type="text"
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        className="px-2 py-0.5 bg-white border border-emerald-300 rounded font-bold text-emerald-900 text-xs w-44 focus:ring-1 focus:ring-emerald-500"
                        placeholder="Dương Văn Trong"
                      />
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Cột đầu là Tên giáo viên, các cột tiếp theo là Thứ Hai đến Thứ Bảy, nội dung trong ô là môn Toán và các lớp học cụ thể.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {detectedClasses.map((cls) => (
                    <span
                      key={cls}
                      className="text-[11px] font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-300 shadow-2xs"
                    >
                      Toán {cls}
                    </span>
                  ))}
                  <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100/90 px-2 py-1 rounded border border-emerald-200 shrink-0">
                    {slots.length} tiết/tuần
                  </span>
                </div>
              </div>

              {/* Detected Teachers Quick Switcher */}
              {detectedTeachers.length > 0 && (
                <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-emerald-900">
                    Giáo viên tìm thấy ở Cột đầu ({detectedTeachers.length}):
                  </span>
                  {detectedTeachers.map((t, idx) => {
                    const isSelected = teacherName.trim().toLowerCase() === t.name.trim().toLowerCase();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectDetectedTeacher(t.name)}
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold transition-all border ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                            : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                        }`}
                      >
                        {t.name} {t.slotsCount ? `(${t.slotsCount} tiết)` : ''}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notifications */}
            {successMsg && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-medium animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 shrink-0"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Đồng bộ TKB ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Section 2: General Information & Application Scope */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Giáo viên phụ trách
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Ví dụ: Dương Văn Trong"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Đơn vị trường học
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Ví dụ: TRƯỜNG THCS VÀ THPT PHÚ THÀNH"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  Ngày áp dụng TKB
                </label>
                <input
                  type="date"
                  value={appliedDate}
                  onChange={(e) => setAppliedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Scope of Application: Tuần 1, Tuần 2, hay Tất cả các tuần */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span>Tuần áp dụng cho Thời khóa biểu này:</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  (Mở Tuần 1 có TKB Tuần 1, mở Tuần 2 có TKB Tuần 2 - đồng bộ theo PPCT)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    applyScope === 'all'
                      ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 text-emerald-950 font-bold'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="applyScope"
                    checked={applyScope === 'all'}
                    onChange={() => setApplyScope('all')}
                    className="text-emerald-700 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold">Chung cả năm (Tuần 1 - 35)</div>
                    <div className="text-[11px] font-normal text-slate-500">Dùng chung nếu TKB không đổi</div>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    applyScope === 'specific'
                      ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 text-emerald-950 font-bold'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="applyScope"
                    checked={applyScope === 'specific'}
                    onChange={() => setApplyScope('specific')}
                    className="text-emerald-700 focus:ring-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold flex items-center justify-between gap-1">
                      <span>Chỉ riêng tuần này:</span>
                      <select
                        value={selectedTargetWeek}
                        onChange={(e) => {
                          setSelectedTargetWeek(Number(e.target.value));
                          setApplyScope('specific');
                        }}
                        className="px-2 py-0.5 bg-white border border-emerald-400 rounded-md font-bold text-emerald-900 text-xs shadow-2xs"
                      >
                        {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => (
                          <option key={w} value={w}>Tuần {w}</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">TKB đặc thù của riêng tuần đã chọn</div>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    applyScope === 'from_week'
                      ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 text-emerald-950 font-bold'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="applyScope"
                    checked={applyScope === 'from_week'}
                    onChange={() => setApplyScope('from_week')}
                    className="text-emerald-700 focus:ring-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold flex items-center justify-between gap-1">
                      <span>Áp dụng từ:</span>
                      <select
                        value={selectedTargetWeek}
                        onChange={(e) => {
                          setSelectedTargetWeek(Number(e.target.value));
                          setApplyScope('from_week');
                        }}
                        className="px-2 py-0.5 bg-white border border-emerald-400 rounded-md font-bold text-emerald-900 text-xs shadow-2xs"
                      >
                        {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => (
                          <option key={w} value={w}>Tuần {w} trở đi</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">Thay đổi TKB từ tuần này đến hết kỳ</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Slots Verification & Editor */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>2. Danh sách tiết dạy trong tuần ({slots.length} tiết)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Hệ thống tự động xếp chính xác từng tiết PPCT vào các buổi dạy tương ứng.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {detectedClasses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickRenameOpen(!isQuickRenameOpen);
                      if (!quickOldClass && detectedClasses[0]) {
                        setQuickOldClass(detectedClasses[0]);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-xs font-bold transition-all shrink-0 shadow-2xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-purple-700" />
                    <span>Đổi tên lớp hàng loạt</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAddSlot}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shrink-0 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm tiết dạy</span>
                </button>
              </div>
            </div>

            {/* Quick Class Rename Tool Bar */}
            {isQuickRenameOpen && (
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2 animate-in fade-in">
                <div className="text-xs font-bold text-purple-950 flex items-center justify-between">
                  <span>Thay thế tên lớp trong bảng TKB:</span>
                  <button
                    type="button"
                    onClick={() => setIsQuickRenameOpen(false)}
                    className="text-purple-600 hover:text-purple-900 text-xs font-semibold"
                  >
                    Đóng ✕
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-700">Đổi lớp:</span>
                  <select
                    value={quickOldClass}
                    onChange={(e) => setQuickOldClass(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800"
                  >
                    {detectedClasses.map((c) => (
                      <option key={c} value={c}>
                        Lớp {c}
                      </option>
                    ))}
                  </select>

                  <span className="font-semibold text-slate-700">→ Sang lớp:</span>
                  <input
                    type="text"
                    value={quickNewClass}
                    onChange={(e) => setQuickNewClass(e.target.value.toUpperCase())}
                    placeholder="VD: 7A2, 9A1..."
                    className="w-28 px-2 py-1 bg-white border border-purple-300 rounded font-bold text-purple-950 uppercase"
                  />

                  <button
                    type="button"
                    disabled={!quickNewClass.trim()}
                    onClick={handleQuickRenameClass}
                    className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded font-bold disabled:opacity-50 shadow-2xs"
                  >
                    Đổi ngay
                  </button>
                </div>
              </div>
            )}

            {/* Slots Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-2.5 px-3 w-12 text-center">STT</th>
                    <th className="py-2.5 px-3">Thứ trong tuần</th>
                    <th className="py-2.5 px-3 w-28">Tiết dạy</th>
                    <th className="py-2.5 px-3 w-28">Buổi</th>
                    <th className="py-2.5 px-3 w-32">Lớp</th>
                    <th className="py-2.5 px-3">Nội dung / Môn</th>
                    <th className="py-2.5 px-3 w-28">Phòng</th>
                    <th className="py-2.5 px-2 w-12 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slots.map((slot, index) => (
                    <tr key={slot.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={slot.dayOfWeek}
                          onChange={(e) => handleUpdateSlot(slot.id, { dayOfWeek: Number(e.target.value) })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-800"
                        >
                          <option value={2}>Thứ Hai</option>
                          <option value={3}>Thứ Ba</option>
                          <option value={4}>Thứ Tư</option>
                          <option value={5}>Thứ Năm</option>
                          <option value={6}>Thứ Sáu</option>
                          <option value={7}>Thứ Bảy</option>
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={slot.period}
                          onChange={(e) => handleUpdateSlot(slot.id, { period: Number(e.target.value) })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-800"
                        >
                          <option value={1}>Tiết 1</option>
                          <option value={2}>Tiết 2</option>
                          <option value={3}>Tiết 3</option>
                          <option value={4}>Tiết 4</option>
                          <option value={5}>Tiết 5</option>
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={slot.session}
                          onChange={(e) =>
                            handleUpdateSlot(slot.id, { session: e.target.value as 'sang' | 'chieu' })
                          }
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 font-medium"
                        >
                          <option value="sang">Sáng</option>
                          <option value="chieu">Chiều</option>
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={slot.className}
                          onChange={(e) => handleUpdateSlot(slot.id, { className: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-bold text-emerald-950 uppercase"
                          placeholder="7A4, 9A4..."
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={slot.subject}
                          onChange={(e) => handleUpdateSlot(slot.id, { subject: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 font-medium"
                          placeholder="Toán, Chào cờ, SHL..."
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={slot.room || ''}
                          onChange={(e) => handleUpdateSlot(slot.id, { room: e.target.value })}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-600"
                          placeholder="P. học"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                          title="Xóa tiết này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Tổng cộng: <strong className="text-emerald-900">{slots.length} tiết/tuần</strong> • Áp dụng:{' '}
            <strong className="text-emerald-900">
              {applyScope === 'all'
                ? 'Tất cả 35 tuần'
                : applyScope === 'specific'
                ? `Tuần ${selectedTargetWeek}`
                : `Từ Tuần ${selectedTargetWeek} trở đi`}
            </strong>{' '}
            • Ngày: <strong>{appliedDate}</strong>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Đồng bộ & Tự động xếp PPCT vào TKB</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
