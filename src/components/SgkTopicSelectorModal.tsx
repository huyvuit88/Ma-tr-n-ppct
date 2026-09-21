import React, { useState, useMemo } from 'react';
import {
  X,
  BookOpen,
  Search,
  Check,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  BookMarked,
  Edit3,
} from 'lucide-react';
import { SgkBook, SgkLesson, SgkChapter, MatrixRow, MatrixConfig } from '../types';
import { INITIAL_SGK_BOOKS } from '../data/sgkData';
import { cleanContentWithoutNls } from '../utils/dateCalculations';

interface SgkTopicSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MatrixConfig;
  targetRow?: MatrixRow | null;
  allRows?: MatrixRow[];
  sgkBooks?: SgkBook[];
  onSelectTopic: (selection: {
    chapter: string;
    topic: string;
    lesson?: SgkLesson;
    applyYccd?: boolean;
    rowId?: string;
  }) => void;
  onStandardizeAllRows?: (newRows: MatrixRow[]) => void;
}

export const SgkTopicSelectorModal: React.FC<SgkTopicSelectorModalProps> = ({
  isOpen,
  onClose,
  config,
  targetRow,
  allRows,
  sgkBooks = INITIAL_SGK_BOOKS,
  onSelectTopic,
  onStandardizeAllRows,
}) => {
  const initialGrade = useMemo(() => {
    const g = String(config.grade || '9').replace(/\D/g, '') || '9';
    return g;
  }, [config.grade]);

  const [selectedGrade, setSelectedGrade] = useState<string>(initialGrade);
  const [selectedVolume, setSelectedVolume] = useState<'all' | 1 | 2>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [applyYccd, setApplyYccd] = useState<boolean>(true);

  // Manual custom text overrides
  const [customChapter, setCustomChapter] = useState<string>(() => targetRow?.chuong || '');
  const [customTopic, setCustomTopic] = useState<string>(() => targetRow?.noiDung || '');

  // Keep manual inputs synced if targetRow changes
  React.useEffect(() => {
    if (targetRow) {
      setCustomChapter(cleanContentWithoutNls(targetRow.chuong));
      setCustomTopic(cleanContentWithoutNls(targetRow.noiDung));
    }
  }, [targetRow]);

  // Combine default and user's custom SGK books
  const availableBooks = useMemo(() => {
    const list = sgkBooks && sgkBooks.length > 0 ? sgkBooks : INITIAL_SGK_BOOKS;
    return list.filter((b) => {
      const bGrade = String(b.grade || '').replace(/\D/g, '') || String(b.grade || '');
      if (selectedGrade && bGrade !== selectedGrade) return false;
      if (selectedVolume !== 'all' && b.volume !== selectedVolume) return false;
      return true;
    });
  }, [sgkBooks, selectedGrade, selectedVolume]);

  // Flattened chapters and lessons
  const filteredChapters = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const result: {
      book: SgkBook;
      chapter: SgkChapter;
      matchedLessons: SgkLesson[];
    }[] = [];

    availableBooks.forEach((book) => {
      book.chapters.forEach((ch) => {
        const chMatch = ch.title.toLowerCase().includes(q) || ch.shortTitle.toLowerCase().includes(q);
        const matchedLessons = ch.lessons.filter((l) => {
          if (!q) return true;
          if (chMatch) return true;
          return (
            l.title.toLowerCase().includes(q) ||
            l.shortTitle.toLowerCase().includes(q) ||
            (l.keyKnowledgePoints && l.keyKnowledgePoints.some((k) => k.toLowerCase().includes(q))) ||
            l.objectives.nhanBiet.toLowerCase().includes(q) ||
            l.objectives.thongHieu.toLowerCase().includes(q)
          );
        });

        if (matchedLessons.length > 0) {
          result.push({
            book,
            chapter: ch,
            matchedLessons,
          });
        }
      });
    });

    return result;
  }, [availableBooks, searchQuery]);

  if (!isOpen) return null;

  const handleApplyCustom = () => {
    if (!customTopic.trim()) return;
    onSelectTopic({
      chapter: customChapter.trim() || 'Chủ đề chung',
      topic: customTopic.trim(),
      applyYccd: false,
      rowId: targetRow?.id,
    });
    onClose();
  };

  const handleSelectLesson = (chapter: SgkChapter, lesson: SgkLesson) => {
    onSelectTopic({
      chapter: chapter.title,
      topic: lesson.title,
      lesson,
      applyYccd,
      rowId: targetRow?.id,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
              <BookOpen className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  Tùy chỉnh Tên Chương & Bài học chuẩn SGK Hiện Nay
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                  GDPT 2018
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Bám sát tên Chương, Chủ đề và Bài học theo SGK Toán (Kết nối tri thức / Cánh diều / Chân trời sáng tạo)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Row Context / Manual Edit Bar */}
        {targetRow && (
          <div className="bg-amber-50/80 border-b border-amber-200 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                <span>Đang điều chỉnh cho dòng kiến thức đang chọn:</span>
              </div>
              <button
                onClick={handleApplyCustom}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu tên tự nhập này</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                  Tên Chương / Chủ đề:
                </label>
                <input
                  type="text"
                  value={customChapter}
                  onChange={(e) => setCustomChapter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  placeholder="Nhập tên chương..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                  Tên Bài học / Nội dung kiến thức:
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  placeholder="Nhập tên bài học chuẩn..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Grade Switcher */}
            <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-2xs">
              {(['6', '7', '8', '9'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    selectedGrade === g
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Khối {g}
                </button>
              ))}
            </div>

            {/* Volume Switcher */}
            <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-2xs">
              <button
                onClick={() => setSelectedVolume('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedVolume === 'all'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cả 2 tập
              </button>
              <button
                onClick={() => setSelectedVolume(1)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedVolume === 1
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tập 1 (HK1)
              </button>
              <button
                onClick={() => setSelectedVolume(2)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedVolume === 2
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tập 2 (HK2)
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm chương, bài học, từ khóa..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Options checklist */}
        <div className="px-4 py-2 bg-blue-50/70 border-b border-blue-200 flex items-center justify-between text-xs text-blue-900">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={applyYccd}
              onChange={(e) => setApplyYccd(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span>
              Tự động cập nhật <strong>Yêu cầu cần đạt chuẩn</strong> tương ứng của bài học vào Bảng đặc tả
            </span>
          </label>

          <span className="text-[11px] text-blue-700">
            Tìm thấy: <strong>{filteredChapters.reduce((acc, c) => acc + c.matchedLessons.length, 0)} bài học</strong>
          </span>
        </div>

        {/* Main List of Chapters and Lessons */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {filteredChapters.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <BookMarked className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold">Không tìm thấy bài học nào phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">
                Thử thay đổi từ khóa tìm kiếm hoặc chuyển đổi khối/tập SGK ở thanh công cụ trên.
              </p>
            </div>
          ) : (
            filteredChapters.map(({ book, chapter, matchedLessons }) => (
              <div
                key={`${book.id}-${chapter.id}`}
                className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white"
              >
                {/* Chapter Banner */}
                <div className="px-4 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">{chapter.title}</h3>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {chapter.totalPeriods} tiết • {book.volume === 1 ? 'Tập 1' : 'Tập 2'}
                  </span>
                </div>

                {/* Lessons in this Chapter */}
                <div className="divide-y divide-slate-100">
                  {matchedLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="p-3 sm:p-4 hover:bg-blue-50/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{lesson.title}</span>
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                            {lesson.periods} tiết
                          </span>
                          {lesson.pageRange && (
                            <span className="text-[10px] text-slate-500">{lesson.pageRange}</span>
                          )}
                        </div>

                        {/* Key Knowledge Points */}
                        {lesson.keyKnowledgePoints && lesson.keyKnowledgePoints.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                            {lesson.keyKnowledgePoints.map((point, pIdx) => (
                              <span
                                key={pIdx}
                                className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/80"
                              >
                                {point}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Learning objectives preview */}
                        <div className="mt-2 text-[11px] text-slate-500 line-clamp-2">
                          <span className="font-semibold text-slate-700">Yêu cầu cần đạt: </span>
                          {lesson.objectives.nhanBiet.replace(/^- /gm, '').replace(/\n/g, '; ')}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => handleSelectLesson(chapter, lesson)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                        >
                          <span>Chọn bài này</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Hệ thống tự động đồng bộ tên Chương, Bài học và Yêu cầu cần đạt trên cả <strong>Khung ma trận</strong> và{' '}
            <strong>Bảng đặc tả</strong>.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
