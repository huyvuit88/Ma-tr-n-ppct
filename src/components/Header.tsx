import React from 'react';
import { GraduationCap, Calendar, Clock, RotateCcw, Radio, Cloud, RefreshCw, Shield } from 'lucide-react';
import { formatDateVN, formatTimeVN, getDayOfWeekVN, parseDate } from '../utils/dateCalculations';
import { User } from 'firebase/auth';
import { isSuperAdminEmail } from '../lib/firebase';

interface HeaderProps {
  currentDateStr: string;
  startDateWeek1Str: string;
  currentWeek: number;
  term: 1 | 2;
  isBeforeTerm: boolean;
  isRealTime: boolean;
  liveTime: Date;
  onDateChange: (newDate: string) => void;
  onSyncRealTime: () => void;
  onResetDate?: () => void;
  user?: User | null;
  isSyncing?: boolean;
  lastSyncTime?: string | null;
  onOpenCloudSync?: () => void;
  onOpenWhitelist?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDateStr,
  startDateWeek1Str,
  currentWeek,
  term,
  isBeforeTerm,
  isRealTime,
  liveTime,
  onDateChange,
  onSyncRealTime,
  onResetDate,
  user,
  isSyncing,
  lastSyncTime,
  onOpenCloudSync,
  onOpenWhitelist,
}) => {
  const currentDate = parseDate(currentDateStr);
  const startDate = parseDate(startDateWeek1Str);

  const termText = term === 1 ? 'HK I' : 'HK II';
  const weekText = isBeforeTerm ? 'tuần 0' : `tuần ${currentWeek}`;
  const isSuper = Boolean(user && isSuperAdminEmail(user.email));

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                Tiến độ PPCT & Ma trận đề kiểm tra
              </h1>
            </div>
            <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5 sm:gap-2 flex-wrap mt-0.5 sm:mt-1">
              {isRealTime ? (
                <>
                  {/* Pulsing Live indicator */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Thời gian thực</span>
                  </span>

                  <span className="font-semibold text-slate-800">
                    {getDayOfWeekVN(liveTime)}, {formatDateVN(liveTime)}
                  </span>

                  <span className="font-mono text-[11px] sm:text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                    {formatTimeVN(liveTime)}
                  </span>
                </>
              ) : (
                <>
                  {/* Simulation indicator */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <Clock className="w-3 h-3 text-amber-700" />
                    <span>Đang mô phỏng</span>
                  </span>

                  <span>
                    Ngày xem: <strong className="text-slate-900">{formatDateVN(currentDate)}</strong>
                  </span>
                </>
              )}

              <span className="text-slate-300 hidden sm:inline">—</span>

              <span>
                đang ở <strong>{weekText}</strong> ({termText}),
              </span>

              <span className="text-slate-500 text-xs hidden md:inline">
                tuần 1 bắt đầu <strong>{formatDateVN(startDate)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Cloud Sync & Date Simulation Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between md:justify-end">
          {/* Cloud Sync Button */}
          {onOpenCloudSync && (
            <button
              type="button"
              onClick={onOpenCloudSync}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                user
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={
                user
                  ? `Đang kết nối: ${user.email}${lastSyncTime ? ` (Đồng bộ: ${lastSyncTime})` : ''}`
                  : 'Đồng bộ Cloud Firestore: Lưu dữ liệu đa thiết bị'
              }
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              ) : (
                <Cloud className={`w-3.5 h-3.5 ${user ? 'text-emerald-700' : 'text-slate-500'}`} />
              )}
              <span className="hidden sm:inline">
                {isSyncing ? 'Đang đồng bộ...' : user ? 'Cloud đã kết nối' : 'Đồng bộ Cloud'}
              </span>
              {user && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
              )}
            </button>
          )}

          {/* Super Admin Whitelist shortcut */}
          {isSuper && onOpenWhitelist && (
            <button
              type="button"
              onClick={onOpenWhitelist}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-all cursor-pointer shadow-xs"
              title="Quản lý danh sách cấp quyền GV (Whitelist)"
            >
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden lg:inline">Phân quyền GV</span>
            </button>
          )}

          {/* Date Controls: Real-time vs Simulation */}
          <div className="flex items-center gap-2">
            {isRealTime ? (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 sm:px-2.5 py-1 text-xs text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
                <span className="font-medium text-slate-600 hidden sm:inline">Mô phỏng:</span>
                <input
                  type="date"
                  value={currentDateStr}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                  title="Chọn ngày khác để kiểm tra tiến độ của tuần học đó"
                />
                <button
                  onClick={onSyncRealTime}
                  className="text-emerald-700 hover:text-emerald-900 p-1 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                  title="Làm mới đồng bộ thời gian thực"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-amber-50/90 border border-amber-300 rounded-xl px-2 sm:px-2.5 py-1 text-xs">
                <span className="font-medium text-amber-900 hidden sm:inline">Mô phỏng:</span>
                <input
                  type="date"
                  value={currentDateStr}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none text-slate-800 cursor-pointer"
                />
                <button
                  onClick={onSyncRealTime}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Quay lại thời gian thực tế ngay bây giờ"
                >
                  <Radio className="w-3 h-3 text-emerald-200 animate-pulse" />
                  <span>Về thực tế</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
