import React, { useState } from 'react';
import {
  X,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  CheckCircle2,
  Smartphone,
  Laptop,
  ArrowRightLeft,
  Users,
  BookOpen,
  FileText,
  Shield,
  LogOut,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isSuperAdmin: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  datasetsCount: number;
  totalLessonsCount: number;
  matrixRowsCount: number;
  studentsCount: number;
  hasSeatingChart: boolean;
  onForceSync: () => Promise<void>;
  onForcePull: () => Promise<void>;
  onForcePush: () => Promise<void>;
  onOpenWhitelist: () => void;
  onLogout: () => Promise<void>;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  user,
  isSuperAdmin,
  isSyncing,
  lastSyncTime,
  datasetsCount,
  totalLessonsCount,
  matrixRowsCount,
  studentsCount,
  hasSeatingChart,
  onForceSync,
  onForcePull,
  onForcePush,
  onOpenWhitelist,
  onLogout,
}) => {
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleAction = async (type: 'sync' | 'pull' | 'push') => {
    setLocalLoading(type);
    setActionSuccessMessage(null);
    try {
      if (type === 'sync') {
        await onForceSync();
        setActionSuccessMessage('Đã đồng bộ hóa 2 chiều thành công với đám mây!');
      } else if (type === 'pull') {
        await onForcePull();
        setActionSuccessMessage('Đã tải thành công tài liệu & dữ liệu mới nhất từ đám mây về thiết bị này!');
      } else {
        await onForcePush();
        setActionSuccessMessage('Đã lưu tất cả tài liệu & dữ liệu từ thiết bị này lên đám mây an toàn!');
      }
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      alert('Có lỗi khi đồng bộ: ' + (err?.message || 'Kiểm tra kết nối'));
    } finally {
      setLocalLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-inner flex-shrink-0">
              <Cloud className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                Đồng Bộ Tài Khoản Gmail Đa Thiết Bị
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Xem tài liệu trên điện thoại khi laptop đã tải lên • Đồng bộ tức thì
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* User Account Info Card */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
            <div className="flex items-center gap-3 min-w-0">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="w-11 h-11 rounded-full border-2 border-emerald-300 shadow-xs flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-lg flex-shrink-0 shadow-xs">
                  {user?.email?.charAt(0).toUpperCase() || 'G'}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {user?.displayName || 'Thầy/Cô Giáo'}
                  </span>
                  {isSuperAdmin && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Quản trị viên
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 font-mono truncate">{user?.email}</div>
                <div className="text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Trực tuyến • Đã xác thực bảo mật</span>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex-shrink-0"
              title="Đăng xuất khỏi tài khoản này"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Device Sync Status Illustration */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between gap-2 text-center">
              <div className="flex-1 flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-1.5 shadow-xs">
                  <Laptop className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Laptop / Máy tính</span>
                <span className="text-[10px] text-slate-500">Tải file Word/Excel, tạo đề</span>
              </div>

              <div className="flex flex-col items-center px-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <ArrowRightLeft className="w-4 h-4 animate-pulse" />
                </div>
                <span className="text-[10px] font-bold text-emerald-800 mt-1">Cùng Gmail</span>
              </div>

              <div className="flex-1 flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-1.5 shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Điện thoại di động</span>
                <span className="text-[10px] text-slate-500">Tra cứu nhanh trên lớp học</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Đồng bộ gần nhất:</span>
                <strong className="text-slate-800 font-mono">{lastSyncTime || 'Vừa xong'}</strong>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-emerald-100 text-emerald-800">
                {isMobile ? '📱 Bạn đang ở Điện thoại' : '💻 Bạn đang ở Laptop/Máy tính'}
              </span>
            </div>
          </div>

          {/* Success message banner */}
          {actionSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span className="font-semibold">{actionSuccessMessage}</span>
            </div>
          )}

          {/* Synced Materials Stats Grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Dữ liệu & Tài liệu đang lưu trữ trên Cloud</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium">Bộ PPCT</span>
                </div>
                <div className="text-lg font-black text-slate-900">
                  {datasetsCount} <span className="text-xs font-normal text-slate-500">bộ</span>
                </div>
                <div className="text-[11px] text-slate-500">{totalLessonsCount} tiết dạy</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium">Ma trận đề</span>
                </div>
                <div className="text-lg font-black text-slate-900">
                  {matrixRowsCount} <span className="text-xs font-normal text-slate-500">mục</span>
                </div>
                <div className="text-[11px] text-slate-500">BGD 2025</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium">Hồ sơ GVCN</span>
                </div>
                <div className="text-lg font-black text-slate-900">
                  {studentsCount} <span className="text-xs font-normal text-slate-500">học sinh</span>
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold">
                  {hasSeatingChart ? '✓ Có sơ đồ chỗ ngồi' : 'Chưa xếp chỗ'}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleAction('pull')}
                disabled={isSyncing || localLoading !== null}
                className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.99] cursor-pointer"
                title="Tải ngay các tài liệu PPCT và hồ sơ vừa tải từ laptop về điện thoại này"
              >
                {localLoading === 'pull' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CloudDownload className="w-4 h-4" />
                )}
                <span>Tải dữ liệu mới từ Cloud về máy</span>
              </button>

              <button
                onClick={() => handleAction('push')}
                disabled={isSyncing || localLoading !== null}
                className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                title="Đẩy dữ liệu hiện tại trên thiết bị này lên lưu trữ an toàn trên đám mây"
              >
                {localLoading === 'push' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CloudUpload className="w-4 h-4 text-emerald-700" />
                )}
                <span>Lưu dữ liệu từ máy lên Cloud</span>
              </button>
            </div>

            <button
              onClick={() => handleAction('sync')}
              disabled={isSyncing || localLoading !== null}
              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-700 ${isSyncing || localLoading === 'sync' ? 'animate-spin' : ''}`} />
              <span>Đồng bộ 2 chiều tức thì (Kiểm tra & Cập nhật mới nhất)</span>
            </button>
          </div>

          {/* Helpful Tips Section */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <HelpCircle className="w-4 h-4 text-emerald-700" />
              <span>Hướng dẫn sử dụng đồng bộ:</span>
            </div>
            <p className="leading-relaxed">
              • <strong>Trên Laptop:</strong> Thầy/Cô đăng nhập Gmail và tải lên kế hoạch bài dạy (file Word .docx hoặc Excel), xếp sơ đồ vị trí lớp hoặc lập ma trận đề.
            </p>
            <p className="leading-relaxed">
              • <strong>Trên Điện thoại:</strong> Thầy/Cô mở trình duyệt (Safari / Chrome) và đăng nhập cùng tài khoản Gmail <strong>{user?.email}</strong>. Tất cả tài liệu sẽ tự động xuất hiện để Thầy/Cô tra cứu nhanh khi lên lớp.
            </p>
          </div>

          {/* Super admin whitelist button */}
          {isSuperAdmin && (
            <div className="pt-1 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500">Quyền Quản trị viên:</span>
              <button
                onClick={() => {
                  onClose();
                  onOpenWhitelist();
                }}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-amber-700" />
                <span>Quản lý danh sách Gmail được phép</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
