import { GvcnSeatPosition } from '../../types';

export interface BanCanSuInfo {
  isLeader: boolean;
  roleType: 'monitor' | 'vice_monitor' | 'secretary' | 'group_leader' | 'group_vice' | 'treasurer' | 'red_flag' | 'officer' | 'other_leader' | 'member';
  label: string;
  shortLabel: string;
  badgeClass: string;
  borderClass: string;
  glowBg: string;
  tagBg: string;
  accentColor: string;
  emoji: string;
}

export const getBanCanSuInfo = (role?: string): BanCanSuInfo => {
  if (!role || role === 'Học sinh' || role === 'Thành viên') {
    return {
      isLeader: false,
      roleType: 'member',
      label: 'Học sinh',
      shortLabel: 'Học sinh',
      badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
      borderClass: '',
      glowBg: '',
      tagBg: 'bg-slate-100 text-slate-700',
      accentColor: 'text-slate-500',
      emoji: '👤',
    };
  }

  const r = role.toLowerCase();

  // 1. Lớp trưởng
  if (r.includes('lớp trưởng')) {
    return {
      isLeader: true,
      roleType: 'monitor',
      label: '👑 LỚP TRƯỞNG',
      shortLabel: '👑 Lớp Trưởng',
      badgeClass: 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-white font-black shadow-xs border border-amber-600',
      borderClass: 'border-2 border-amber-400 ring-2 ring-amber-300/80 shadow-md shadow-amber-200/50',
      glowBg: 'bg-gradient-to-b from-amber-50/95 via-yellow-50/50 to-white',
      tagBg: 'bg-amber-100 text-amber-950 border border-amber-300',
      accentColor: 'text-amber-700',
      emoji: '👑',
    };
  }

  // 2. Lớp phó (Học tập, Kỷ luật, Lao động, Văn thể mỹ)
  if (r.includes('lớp phó')) {
    return {
      isLeader: true,
      roleType: 'vice_monitor',
      label: `⭐ ${role.toUpperCase()}`,
      shortLabel: `⭐ ${role}`,
      badgeClass: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black shadow-xs border border-indigo-700',
      borderClass: 'border-2 border-indigo-400 ring-2 ring-indigo-300/70 shadow-md shadow-indigo-200/50',
      glowBg: 'bg-gradient-to-b from-indigo-50/95 via-purple-50/50 to-white',
      tagBg: 'bg-indigo-100 text-indigo-950 border border-indigo-300',
      accentColor: 'text-indigo-700',
      emoji: '⭐',
    };
  }

  // 3. Bí thư chi đoàn / Chi đội trưởng / Phó bí thư
  if (r.includes('bí thư') || r.includes('chi đội')) {
    return {
      isLeader: true,
      roleType: 'secretary',
      label: `🚩 ${role.toUpperCase()}`,
      shortLabel: `🚩 ${role}`,
      badgeClass: 'bg-gradient-to-r from-rose-600 to-red-600 text-white font-black shadow-xs border border-rose-700',
      borderClass: 'border-2 border-rose-400 ring-2 ring-rose-300/70 shadow-md shadow-rose-200/50',
      glowBg: 'bg-gradient-to-b from-rose-50/95 via-orange-50/40 to-white',
      tagBg: 'bg-rose-100 text-rose-950 border border-rose-300',
      accentColor: 'text-rose-700',
      emoji: '🚩',
    };
  }

  // 4. Tổ trưởng
  if (r.includes('tổ trưởng')) {
    return {
      isLeader: true,
      roleType: 'group_leader',
      label: `🎖️ ${role.toUpperCase()}`,
      shortLabel: `🎖️ ${role}`,
      badgeClass: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black shadow-xs border border-emerald-700',
      borderClass: 'border-2 border-emerald-400 ring-2 ring-emerald-300/70 shadow-md shadow-emerald-200/50',
      glowBg: 'bg-gradient-to-b from-emerald-50/95 via-teal-50/50 to-white',
      tagBg: 'bg-emerald-100 text-emerald-950 border border-emerald-300',
      accentColor: 'text-emerald-700',
      emoji: '🎖️',
    };
  }

  // 5. Tổ phó
  if (r.includes('tổ phó')) {
    return {
      isLeader: true,
      roleType: 'group_vice',
      label: `📋 ${role}`,
      shortLabel: `📋 ${role}`,
      badgeClass: 'bg-teal-600 text-white font-bold border border-teal-700 shadow-2xs',
      borderClass: 'border-2 border-teal-400 ring-1 ring-teal-200',
      glowBg: 'bg-gradient-to-b from-teal-50/90 to-white',
      tagBg: 'bg-teal-100 text-teal-950 border border-teal-200',
      accentColor: 'text-teal-700',
      emoji: '📋',
    };
  }

  // 6. Thủ quỹ, Cờ đỏ, Quản ca
  if (r.includes('quỹ') || r.includes('cờ đỏ') || r.includes('quản ca') || r.includes('sao đỏ')) {
    return {
      isLeader: true,
      roleType: 'officer',
      label: `💼 ${role}`,
      shortLabel: `💼 ${role}`,
      badgeClass: 'bg-cyan-600 text-white font-bold border border-cyan-700 shadow-2xs',
      borderClass: 'border-2 border-cyan-400 ring-1 ring-cyan-200',
      glowBg: 'bg-gradient-to-b from-cyan-50/90 to-white',
      tagBg: 'bg-cyan-100 text-cyan-950 border border-cyan-200',
      accentColor: 'text-cyan-700',
      emoji: '💼',
    };
  }

  // 7. Chức vụ khác
  return {
    isLeader: true,
    roleType: 'other_leader',
    label: `✨ ${role}`,
    shortLabel: `✨ ${role}`,
    badgeClass: 'bg-purple-600 text-white font-bold shadow-2xs',
    borderClass: 'border-2 border-purple-400',
    glowBg: 'bg-gradient-to-b from-purple-50/90 to-white',
    tagBg: 'bg-purple-100 text-purple-950 border border-purple-200',
    accentColor: 'text-purple-700',
    emoji: '✨',
  };
};

export const BAN_CAN_SU_ROLE_PRESETS = [
  { role: 'Lớp trưởng', emoji: '👑', desc: 'Quản lý chung lớp học' },
  { role: 'Lớp phó học tập', emoji: '⭐', desc: 'Theo dõi bài vở, truy bài' },
  { role: 'Lớp phó kỷ luật', emoji: '🛡️', desc: 'Nề nếp, trật tự, tác phong' },
  { role: 'Lớp phó lao động', emoji: '🧹', desc: 'Vệ sinh, trực nhật lớp' },
  { role: 'Lớp phó văn thể mỹ', emoji: '🎨', desc: 'Văn nghệ, thể dục thể thao' },
  { role: 'Bí thư chi đoàn', emoji: '🚩', desc: 'Công tác Đoàn - Đội' },
  { role: 'Tổ trưởng Tổ 1', emoji: '🎖️', desc: 'Phụ trách Tổ 1' },
  { role: 'Tổ trưởng Tổ 2', emoji: '🎖️', desc: 'Phụ trách Tổ 2' },
  { role: 'Tổ trưởng Tổ 3', emoji: '🎖️', desc: 'Phụ trách Tổ 3' },
  { role: 'Tổ trưởng Tổ 4', emoji: '🎖️', desc: 'Phụ trách Tổ 4' },
  { role: 'Tổ phó Tổ 1', emoji: '📋', desc: 'Hỗ trợ Tổ 1' },
  { role: 'Tổ phó Tổ 2', emoji: '📋', desc: 'Hỗ trợ Tổ 2' },
  { role: 'Tổ phó Tổ 3', emoji: '📋', desc: 'Hỗ trợ Tổ 3' },
  { role: 'Tổ phó Tổ 4', emoji: '📋', desc: 'Hỗ trợ Tổ 4' },
  { role: 'Thủ quỹ', emoji: '💰', desc: 'Quản lý quỹ lớp' },
  { role: 'Đội cờ đỏ', emoji: '🚩', desc: 'Chấm điểm thi đua' },
];

export const formatSeatPositionLabel = (seat: GvcnSeatPosition): string => {
  const rowDesc = seat.deskRow === 1 ? 'Bàn 1 (Gần bảng)' : `Bàn ${seat.deskRow}`;
  const seatSide = seat.seatIndex === 0 ? 'Bên trái' : seat.seatIndex === 1 ? 'Bên phải' : `Ghế ${seat.seatIndex + 1}`;
  return `Dãy ${seat.deskCol} (Tổ ${seat.deskCol}) — ${rowDesc}, Ghế ${seatSide}`;
};
