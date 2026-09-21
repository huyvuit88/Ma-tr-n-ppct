import React from 'react';
import {
  MapPin,
  Award,
  Phone,
  User,
  Users,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Move,
} from 'lucide-react';
import { GvcnStudent, GvcnSeatPosition } from '../../types';
import { getBanCanSuInfo, formatSeatPositionLabel } from './gvcnSeatingUtils';

export interface HoverStudentData {
  student: GvcnStudent;
  x: number;
  y: number;
  seatInfo: {
    col: number;
    row: number;
    seatIdx: number;
    seatKey: string;
    seatmateName?: string;
    note?: string;
  } | null;
}

interface GvcnStudentHoverCardProps {
  data: HoverStudentData | null;
}

export const GvcnStudentHoverCard: React.FC<GvcnStudentHoverCardProps> = ({ data }) => {
  if (!data) return null;

  const { student, x, y, seatInfo } = data;
  const roleInfo = getBanCanSuInfo(student.role);

  // Calculate clamped position so the card never overflows the screen boundaries
  const cardWidth = 320;
  const cardHeight = 310;
  const padding = 16;

  let left = x + 16;
  if (left + cardWidth > window.innerWidth - padding) {
    left = x - cardWidth - 16;
  }
  if (left < padding) left = padding;

  let top = y - 40;
  if (top + cardHeight > window.innerHeight - padding) {
    top = window.innerHeight - cardHeight - padding;
  }
  if (top < padding) top = padding;

  return (
    <div
      style={{ top: `${top}px`, left: `${left}px`, width: `${cardWidth}px` }}
      className="fixed z-50 pointer-events-none transition-all duration-150 ease-out"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border-2 border-emerald-500/80 ring-4 ring-emerald-500/15 text-slate-800 space-y-3">
        {/* Header: STT, Avatar, Name */}
        <div className="flex items-start gap-3 pb-2.5 border-b border-slate-100">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
              student.gender === 'Nam'
                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                : 'bg-rose-100 text-rose-900 border border-rose-300'
            }`}
          >
            #{student.stt}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-black text-slate-900 tracking-tight leading-tight truncate">
                {student.name}
              </h4>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                  student.gender === 'Nam' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {student.gender}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
              <span>Mã HS: <strong>{student.studentCode || `2100${String(student.stt).padStart(4, '0')}`}</strong></span>
              <span>•</span>
              <span>Tổ {student.group}</span>
            </div>
          </div>
        </div>

        {/* VỊ TRÍ CHỖ NGỒI (NỔI BẬT NHẤT) */}
        <div>
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-600" />
            <span>Vị Trí Chỗ Ngồi Trong Lớp</span>
          </div>

          {seatInfo ? (
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-2.5 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>DÃY {seatInfo.col} — BÀN {seatInfo.row}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-full">
                  Ghế {seatInfo.seatIdx === 0 ? 'Trái' : 'Phải'} (G{seatInfo.seatIdx + 1})
                </span>
              </div>

              <div className="text-[11px] text-emerald-900 flex items-center gap-1">
                <span>Vị trí hàng:</span>
                <strong className="font-bold">
                  {seatInfo.row === 1 ? 'Bàn đầu (Gần bảng viết & bục giảng)' : `Hàng số ${seatInfo.row} (Tổ ${seatInfo.col})`}
                </strong>
              </div>

              {seatInfo.seatmateName ? (
                <div className="text-[11px] text-slate-700 pt-1 border-t border-emerald-200/60 flex items-center gap-1">
                  <span className="text-slate-500">Bạn cùng bàn:</span>
                  <strong className="text-emerald-950 font-bold">{seatInfo.seatmateName}</strong>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 italic pt-1 border-t border-emerald-200/60">
                  (Đang ngồi một mình, ghế bên cạnh còn trống)
                </div>
              )}

              {seatInfo.note && (
                <div className="text-[10px] text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded font-semibold">
                  Ghi chú ghế: {seatInfo.note}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2 text-amber-900 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="text-xs">
                <strong className="font-bold">Chưa xếp chỗ ngồi!</strong>
                <p className="text-[10px] text-amber-700">Kéo thả em này vào ghế trống trên sơ đồ để xếp chỗ.</p>
              </div>
            </div>
          )}
        </div>

        {/* Chức vụ Ban cán sự */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[10px] font-bold text-slate-500">Chức vụ:</div>
          {roleInfo.isLeader ? (
            <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${roleInfo.badgeClass}`}>
              {roleInfo.shortLabel}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              Học sinh
            </span>
          )}
        </div>

        {/* Liên hệ phụ huynh */}
        {(student.parentName || student.parentPhone) && (
          <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-150 flex items-center justify-between">
            <span className="flex items-center gap-1 truncate">
              <User className="w-3 h-3 text-slate-400 shrink-0" />
              <span>PH: <strong>{student.parentName || 'Chưa cập nhật'}</strong></span>
            </span>
            {student.parentPhone && (
              <span className="flex items-center gap-1 font-mono font-bold text-slate-700 shrink-0">
                <Phone className="w-2.5 h-2.5 text-emerald-600" />
                {student.parentPhone}
              </span>
            )}
          </div>
        )}

        {/* Interaction Hint */}
        <div className="text-[9.5px] text-slate-400 text-center flex items-center justify-center gap-1 pt-0.5">
          <Move className="w-2.5 h-2.5 text-slate-400" />
          <span>Có thể kéo thả học sinh này trực tiếp vào sơ đồ chỗ ngồi</span>
        </div>
      </div>
    </div>
  );
};
