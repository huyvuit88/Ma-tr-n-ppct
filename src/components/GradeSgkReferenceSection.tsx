import React, { useState } from 'react';
import {
  BookMarked,
  Link,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  TableProperties,
  Globe,
  BookOpen,
} from 'lucide-react';
import { SgkBook, PpctDataset } from '../types';
import {
  recognizeSgkFromUrl,
  OFFICIAL_SGK_LINKS,
} from '../utils/sgkParser';
import {
  DEFAULT_SGK_TOAN_6_TAP_1,
  DEFAULT_SGK_TOAN_6_TAP_2,
  DEFAULT_SGK_TOAN_7_TAP_1,
  DEFAULT_SGK_TOAN_7_TAP_2,
  DEFAULT_SGK_TOAN_8_TAP_1,
  DEFAULT_SGK_TOAN_8_TAP_2,
  DEFAULT_SGK_TOAN_9_TAP_1,
  DEFAULT_SGK_TOAN_9_TAP_2,
  DEFAULT_SGK_CANH_DIEU_9_TAP_1,
  DEFAULT_SGK_CANH_DIEU_9_TAP_2,
} from '../data/sgkData';

interface GradeSgkReferenceSectionProps {
  selectedGrade: string;
  sgkBooks: SgkBook[];
  activePpct?: PpctDataset;
  onUpdateSgkBooks: (books: SgkBook[]) => void;
  onLinkSgkToPpct?: (ppctId: string, volume1Id?: string, volume2Id?: string) => void;
  onApplySgkToMatrix?: (bookId: string, volume: 1 | 2 | 'all') => void;
}

export const GradeSgkReferenceSection: React.FC<GradeSgkReferenceSectionProps> = ({
  selectedGrade,
  sgkBooks,
  activePpct,
  onUpdateSgkBooks,
  onLinkSgkToPpct,
  onApplySgkToMatrix,
}) => {
  const [expandedVolume, setExpandedVolume] = useState<1 | 2 | null>(null);
  const [inputUrlVol, setInputUrlVol] = useState<1 | 2 | null>(null);
  const [urlInputText, setUrlInputText] = useState<string>('');
  const [urlLoading, setUrlLoading] = useState<boolean>(false);
  const [urlStatusMsg, setUrlStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Lọc duy nhất SGK của khối đang được chọn (không hiển thị tất cả các khối khác)
  const gradeBooks = sgkBooks.filter((b) => (b.grade || '9') === selectedGrade);
  const vol1Book = gradeBooks.find((b) => b.volume === 1);
  const vol2Book = gradeBooks.find((b) => b.volume === 2);

  // Liên kết SGK mẫu chuẩn cho khối hiện tại
  const handleApplyDefaultStandard = (volume: 1 | 2, series: 'kntt' | 'canhdieu' = 'kntt') => {
    let standardBook: SgkBook;
    if (selectedGrade === '6') {
      standardBook = volume === 1 ? DEFAULT_SGK_TOAN_6_TAP_1 : DEFAULT_SGK_TOAN_6_TAP_2;
    } else if (selectedGrade === '7') {
      standardBook = volume === 1 ? DEFAULT_SGK_TOAN_7_TAP_1 : DEFAULT_SGK_TOAN_7_TAP_2;
    } else if (selectedGrade === '8') {
      standardBook = volume === 1 ? DEFAULT_SGK_TOAN_8_TAP_1 : DEFAULT_SGK_TOAN_8_TAP_2;
    } else {
      // Khối 9
      if (series === 'canhdieu') {
        standardBook = volume === 1 ? DEFAULT_SGK_CANH_DIEU_9_TAP_1 : DEFAULT_SGK_CANH_DIEU_9_TAP_2;
      } else {
        standardBook = volume === 1 ? DEFAULT_SGK_TOAN_9_TAP_1 : DEFAULT_SGK_TOAN_9_TAP_2;
      }
    }

    const updated = [
      ...sgkBooks.filter(
        (b) => !((b.grade || '9') === selectedGrade && b.volume === volume)
      ),
      standardBook,
    ];
    onUpdateSgkBooks(updated);

    if (activePpct && onLinkSgkToPpct) {
      if (volume === 1) onLinkSgkToPpct(activePpct.id, standardBook.id, undefined);
      else onLinkSgkToPpct(activePpct.id, undefined, standardBook.id);
    }

    setUrlStatusMsg({
      type: 'success',
      text: `Đã nạp bộ SGK Toán ${selectedGrade} Tập ${volume} (${standardBook.title}) làm nguồn tham chiếu ma trận & đề.`,
    });
    setTimeout(() => setUrlStatusMsg(null), 4000);
  };

  // Xử lý nạp qua Link URL (Drive / Web)
  const handleSubmitUrl = async (volume: 1 | 2) => {
    if (!urlInputText.trim()) return;
    try {
      setUrlLoading(true);
      setUrlStatusMsg(null);
      const res = await recognizeSgkFromUrl(urlInputText.trim(), volume, selectedGrade);
      const newBook: SgkBook = {
        ...res.book,
        grade: selectedGrade,
        volume,
      };

      const updated = [
        ...sgkBooks.filter(
          (b) => !((b.grade || '9') === selectedGrade && b.volume === volume)
        ),
        newBook,
      ];
      onUpdateSgkBooks(updated);

      if (activePpct && onLinkSgkToPpct) {
        if (volume === 1) onLinkSgkToPpct(activePpct.id, newBook.id, undefined);
        else onLinkSgkToPpct(activePpct.id, undefined, newBook.id);
      }

      setUrlStatusMsg({
        type: 'success',
        text: `Đã kết nối SGK Khối ${selectedGrade} Tập ${volume} từ liên kết thành công! Dữ liệu đã sẵn sàng tham chiếu ma trận và đề.`,
      });
      setInputUrlVol(null);
      setUrlInputText('');
      setTimeout(() => setUrlStatusMsg(null), 4000);
    } catch (err: any) {
      setUrlStatusMsg({
        type: 'error',
        text: err.message || 'Không thể nhận diện liên kết SGK. Vui lòng kiểm tra lại đường dẫn.',
      });
    } finally {
      setUrlLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Cơ sở SGK Online Khối {selectedGrade}
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Tự động tham chiếu theo cấu trúc
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Hệ thống tự động căn cứ theo nội dung SGK online theo cấu trúc chuẩn GDPT 2018 và PPCT đã nạp để sinh ma trận và đề kiểm tra mà không cần tải lên file SGK thủ công.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://hanhtrangso.nxbgd.vn"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/20 transition-colors"
            title="Mở thư viện sách giáo khoa trực tuyến Hành Trang Số (NXB Giáo Dục)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
            <span>Hành Trang Số Online</span>
          </a>
        </div>
      </div>

      {/* Status toast message */}
      {urlStatusMsg && (
        <div
          className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 ${
            urlStatusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-b border-rose-200'
          }`}
        >
          {urlStatusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{urlStatusMsg.text}</span>
        </div>
      )}

      {/* Grid 2 Volume: Tập 1 & Tập 2 */}
      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TẬP 1 */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                  Tập 1 (Học kỳ 1 • Tuần 1 – 18)
                </span>
                {vol1Book ? (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã sẵn sàng
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-700">
                    Chưa nạp dữ liệu
                  </span>
                )}
              </div>

              {vol1Book && onApplySgkToMatrix && (
                <button
                  type="button"
                  onClick={() => onApplySgkToMatrix(vol1Book.id, 1)}
                  className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
                  title="Áp dụng SGK Tập 1 này làm nguồn tạo Ma trận đề"
                >
                  <TableProperties className="w-3 h-3" />
                  Áp dụng vào Ma trận
                </button>
              )}
            </div>

            {vol1Book ? (
              <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {vol1Book.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {vol1Book.publisher} • {vol1Book.chapters.length} chương •{' '}
                      {vol1Book.chapters.reduce((s, c) => s + c.lessons.length, 0)} bài học
                    </p>
                  </div>
                </div>

                {/* Toggle xem danh sách bài & YCCĐ */}
                <button
                  type="button"
                  onClick={() => setExpandedVolume(expandedVolume === 1 ? null : 1)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 pt-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>
                    {expandedVolume === 1 ? 'Thu gọn bài học & YCCĐ' : 'Xem các chương, bài học & YCCĐ'}
                  </span>
                  {expandedVolume === 1 ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {expandedVolume === 1 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 max-h-60 overflow-y-auto space-y-2 text-xs">
                    {vol1Book.chapters.map((ch) => (
                      <div key={ch.id} className="p-2 bg-slate-50 rounded-md border border-slate-100">
                        <div className="font-bold text-slate-800">{ch.title}</div>
                        <ul className="mt-1 space-y-1 pl-3 list-disc text-slate-600">
                          {ch.lessons.map((l) => (
                            <li key={l.id} className="leading-snug">
                              <span className="font-medium text-slate-800">{l.title}</span>
                              {l.objectives?.nhanBiet && (
                                <p className="text-[10px] text-slate-500 italic line-clamp-1 mt-0.5">
                                  YCCĐ: {l.objectives.nhanBiet.split('\n')[0].replace(/^[-•]\s*/, '')}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 bg-white p-3 rounded-lg border border-dashed border-slate-200">
                Chưa có SGK Toán {selectedGrade} Tập 1. Thầy/Cô hãy nhập Link (Google Drive / Học liệu) hoặc chọn bộ sách chuẩn bên dưới để hệ thống đối chiếu YCCĐ khi ra đề.
              </p>
            )}
          </div>

          {/* Action buttons for Volume 1 */}
          <div className="space-y-2 pt-1 border-t border-slate-200/60">
            {inputUrlVol === 1 ? (
              <div className="space-y-2 bg-white p-2.5 rounded-lg border border-emerald-200">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Nhập liên kết SGK Toán {selectedGrade} Tập 1:</span>
                  <button
                    type="button"
                    onClick={() => setInputUrlVol(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Đóng
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInputText}
                    onChange={(e) => setUrlInputText(e.target.value)}
                    placeholder="https://drive.google.com/... hoặc link sách điện tử"
                    className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    disabled={urlLoading || !urlInputText.trim()}
                    onClick={() => handleSubmitUrl(1)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {urlLoading ? 'Đang nạp...' : 'Xác nhận'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInputUrlVol(1);
                    setUrlInputText('');
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <Link className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nhập Link Online</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyDefaultStandard(1, 'kntt')}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  title="Dùng cấu trúc SGK Kết nối tri thức"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>KNTT Chuẩn</span>
                </button>

                {selectedGrade === '9' && (
                  <button
                    type="button"
                    onClick={() => handleApplyDefaultStandard(1, 'canhdieu')}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="Dùng cấu trúc SGK Cánh Diều"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cánh Diều Chuẩn</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TẬP 2 */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                  Tập 2 (Học kỳ 2 • Tuần 19 – 35)
                </span>
                {vol2Book ? (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã sẵn sàng
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-700">
                    Chưa nạp dữ liệu
                  </span>
                )}
              </div>

              {vol2Book && onApplySgkToMatrix && (
                <button
                  type="button"
                  onClick={() => onApplySgkToMatrix(vol2Book.id, 2)}
                  className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
                  title="Áp dụng SGK Tập 2 này làm nguồn tạo Ma trận đề"
                >
                  <TableProperties className="w-3 h-3" />
                  Áp dụng vào Ma trận
                </button>
              )}
            </div>

            {vol2Book ? (
              <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {vol2Book.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {vol2Book.publisher} • {vol2Book.chapters.length} chương •{' '}
                      {vol2Book.chapters.reduce((s, c) => s + c.lessons.length, 0)} bài học
                    </p>
                  </div>
                </div>

                {/* Toggle xem danh sách bài & YCCĐ */}
                <button
                  type="button"
                  onClick={() => setExpandedVolume(expandedVolume === 2 ? null : 2)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 pt-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>
                    {expandedVolume === 2 ? 'Thu gọn bài học & YCCĐ' : 'Xem các chương, bài học & YCCĐ'}
                  </span>
                  {expandedVolume === 2 ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {expandedVolume === 2 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 max-h-60 overflow-y-auto space-y-2 text-xs">
                    {vol2Book.chapters.map((ch) => (
                      <div key={ch.id} className="p-2 bg-slate-50 rounded-md border border-slate-100">
                        <div className="font-bold text-slate-800">{ch.title}</div>
                        <ul className="mt-1 space-y-1 pl-3 list-disc text-slate-600">
                          {ch.lessons.map((l) => (
                            <li key={l.id} className="leading-snug">
                              <span className="font-medium text-slate-800">{l.title}</span>
                              {l.objectives?.nhanBiet && (
                                <p className="text-[10px] text-slate-500 italic line-clamp-1 mt-0.5">
                                  YCCĐ: {l.objectives.nhanBiet.split('\n')[0].replace(/^[-•]\s*/, '')}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 bg-white p-3 rounded-lg border border-dashed border-slate-200">
                Chưa có SGK Toán {selectedGrade} Tập 2. Thầy/Cô hãy nhập Link (Google Drive / Học liệu) hoặc chọn bộ sách chuẩn bên dưới để hệ thống đối chiếu YCCĐ khi ra đề.
              </p>
            )}
          </div>

          {/* Action buttons for Volume 2 */}
          <div className="space-y-2 pt-1 border-t border-slate-200/60">
            {inputUrlVol === 2 ? (
              <div className="space-y-2 bg-white p-2.5 rounded-lg border border-emerald-200">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Nhập liên kết SGK Toán {selectedGrade} Tập 2:</span>
                  <button
                    type="button"
                    onClick={() => setInputUrlVol(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Đóng
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInputText}
                    onChange={(e) => setUrlInputText(e.target.value)}
                    placeholder="https://drive.google.com/... hoặc link sách điện tử"
                    className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    disabled={urlLoading || !urlInputText.trim()}
                    onClick={() => handleSubmitUrl(2)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {urlLoading ? 'Đang nạp...' : 'Xác nhận'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInputUrlVol(2);
                    setUrlInputText('');
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <Link className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nhập Link Online</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyDefaultStandard(2, 'kntt')}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  title="Dùng cấu trúc SGK Kết nối tri thức"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>KNTT Chuẩn</span>
                </button>

                {selectedGrade === '9' && (
                  <button
                    type="button"
                    onClick={() => handleApplyDefaultStandard(2, 'canhdieu')}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="Dùng cấu trúc SGK Cánh Diều"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cánh Diều Chuẩn</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
