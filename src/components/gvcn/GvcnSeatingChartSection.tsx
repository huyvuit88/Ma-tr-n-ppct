import React, { useState, useMemo } from 'react';
import {
  GvcnClassInfo,
  GvcnStudent,
  GvcnSeatingChartConfig,
  GvcnSeatPosition,
} from '../../types';
import {
  LayoutGrid,
  RotateCw,
  Printer,
  Sparkles,
  Users,
  Settings,
  Trash2,
  HelpCircle,
  Award,
  AlertCircle,
  Eye,
  CheckCircle2,
  ArrowRightLeft,
  X,
  FileText,
  School,
  MapPin,
  Calendar,
  UserCheck,
  Edit3,
  Layers,
  Crown,
  UserPlus,
  Move,
  Search,
  Filter,
  Check,
  Plus,
} from 'lucide-react';
import {
  getBanCanSuInfo,
  BAN_CAN_SU_ROLE_PRESETS,
  formatSeatPositionLabel,
} from './gvcnSeatingUtils';
import { GvcnRoleAssignmentModal } from './GvcnRoleAssignmentModal';
import { GvcnStudentHoverCard, HoverStudentData } from './GvcnStudentHoverCard';
import { GvcnDeleteStudentModal } from './GvcnDeleteStudentModal';
import { GvcnQuickAddStudentModal } from './GvcnQuickAddStudentModal';

interface GvcnSeatingChartSectionProps {
  classInfo: GvcnClassInfo;
  students: GvcnStudent[];
  seatingChart: GvcnSeatingChartConfig;
  onUpdateSeatingChart: (newChart: GvcnSeatingChartConfig) => void;
  onSelectStudent?: (student: GvcnStudent) => void;
  onEditStudent?: (student: GvcnStudent) => void;
  onAddStudent?: (newStudent: GvcnStudent) => void;
  onDeleteStudent?: (studentId: string) => void;
  onUpdateStudent?: (student: GvcnStudent) => void;
  onUpdateStudents?: (students: GvcnStudent[]) => void;
  onOpenAddStudent?: () => void;
}

export type SeatingNameMode = 'full' | 'middle_first' | 'first_only';

/**
 * Định dạng tên học sinh hiển thị trên sơ đồ lớp:
 * - 'full': Hiển thị đầy đủ Họ và Tên (mặc định, rõ ràng nhất)
 * - 'middle_first': Hiển thị chữ lót và tên (ví dụ: "Văn An")
 * - 'first_only': Chỉ hiển thị tên chính (ví dụ: "An")
 * - Tự động hiển thị thêm chữ lót/họ nếu trùng tên với bạn khác trong lớp.
 */
export const formatSeatingStudentName = (
  student: GvcnStudent,
  allStudents: GvcnStudent[],
  mode: SeatingNameMode = 'full'
): { displayName: string; isFullName: boolean } => {
  if (!student || !student.name) return { displayName: '', isFullName: false };

  const fullName = student.name.trim();
  const words = fullName.split(/\s+/).filter(Boolean);

  if (words.length <= 1 || mode === 'full') {
    return { displayName: fullName, isFullName: true };
  }

  if (mode === 'first_only') {
    const firstName = words[words.length - 1];
    // Kiểm tra có học sinh khác trùng tên trong lớp không
    const duplicateCount = allStudents.filter((s) => {
      if (!s || !s.name) return false;
      const sWords = s.name.trim().split(/\s+/).filter(Boolean);
      return sWords.length > 0 && sWords[sWords.length - 1].toLowerCase() === firstName.toLowerCase();
    }).length;

    if (duplicateCount > 1) {
      // Trùng tên -> hiển thị chữ lót + tên hoặc cả họ tên để phân biệt rõ
      const middleAndLast = words.slice(Math.max(0, words.length - 2)).join(' ');
      return { displayName: middleAndLast, isFullName: false };
    }
    return { displayName: firstName, isFullName: false };
  }

  // mode === 'middle_first': Chữ lót và tên (bỏ từ đầu tiên là Họ)
  const middleAndLastName = words.slice(1).join(' ');

  // Kiểm tra trùng lặp chữ lót và tên trong toàn bộ danh sách lớp
  const normalizedShort = middleAndLastName.toLowerCase();
  const duplicateCount = allStudents.filter((s) => {
    if (!s || !s.name) return false;
    const sWords = s.name.trim().split(/\s+/).filter(Boolean);
    const sShort = sWords.length > 1 ? sWords.slice(1).join(' ') : s.name.trim();
    return sShort.toLowerCase() === normalizedShort;
  }).length;

  if (duplicateCount > 1) {
    // Trùng tên và chữ lót -> hiển thị đầy đủ họ và tên
    return { displayName: fullName, isFullName: true };
  }

  return { displayName: middleAndLastName, isFullName: false };
};

/**
 * Tự động tính kích thước font chữ giúp tên hiển thị rõ ràng,
 * co giãn linh hoạt theo độ dài tên để không bao giờ bị cắt cụt.
 */
export const getSeatingNameFontSize = (displayName: string): string => {
  const len = displayName.length;
  if (len > 18) {
    return 'text-[10px] leading-snug font-bold';
  }
  if (len > 13) {
    return 'text-[11px] leading-snug font-bold';
  }
  return 'text-[12px] leading-snug font-bold';
};

export const GvcnSeatingChartSection: React.FC<GvcnSeatingChartSectionProps> = ({
  classInfo,
  students,
  seatingChart,
  onUpdateSeatingChart,
  onSelectStudent,
  onEditStudent,
  onAddStudent,
  onDeleteStudent,
  onUpdateStudent,
  onUpdateStudents,
  onOpenAddStudent,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedSeatKey, setSelectedSeatKey] = useState<string | null>(null);
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);

  // Drag-and-drop state between seats and lists
  interface DragItem {
    type: 'seat' | 'unassigned' | 'list';
    studentId: string;
    fromRow?: number;
    fromCol?: number;
    fromIdx?: number;
    seatKey?: string;
  }
  const [dragSource, setDragSource] = useState<DragItem | null>(null);
  const [dragOverSeatKey, setDragOverSeatKey] = useState<string | null>(null);

  // Modal states for role, delete, quick add
  const [roleModalStudent, setRoleModalStudent] = useState<GvcnStudent | null>(null);
  const [deleteModalStudent, setDeleteModalStudent] = useState<GvcnStudent | null>(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState<boolean>(false);

  // Hover mini-card state and highlighted seat state
  const [hoveredData, setHoveredData] = useState<HoverStudentData | null>(null);
  const [hoveredStudentId, setHoveredStudentId] = useState<string | null>(null);

  // Student list filter and search states
  const [studentListFilter, setStudentListFilter] = useState<'all' | 'unseated' | 'seated' | 'leaders' | 1 | 2 | 3 | 4>('all');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [showStudentListSection, setShowStudentListSection] = useState<boolean>(true);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [printIncludeHeaderFooter, setPrintIncludeHeaderFooter] = useState<boolean>(false);
  const [seatNoteModal, setSeatNoteModal] = useState<{ seatKey: string; currentNote: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [nameDisplayMode, setNameDisplayMode] = useState<SeatingNameMode>(() => {
    const saved = localStorage.getItem('gvcn_seating_name_mode');
    if (saved === 'full' || saved === 'middle_first' || saved === 'first_only') return saved as SeatingNameMode;
    return 'full';
  });
  const [cardDensity, setCardDensity] = useState<'standard' | 'spacious'>(() => {
    const saved = localStorage.getItem('gvcn_seating_card_density');
    if (saved === 'standard' || saved === 'spacious') return saved;
    return 'standard';
  });

  const handleSetNameDisplayMode = (mode: SeatingNameMode) => {
    setNameDisplayMode(mode);
    localStorage.setItem('gvcn_seating_name_mode', mode);
  };

  const handleSetCardDensity = (density: 'standard' | 'spacious') => {
    setCardDensity(density);
    localStorage.setItem('gvcn_seating_card_density', density);
  };

  // Map nhanh học sinh theo ID
  const studentMap = useMemo(() => {
    const map = new Map<string, GvcnStudent>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  // Danh sách ID học sinh đã có chỗ
  const seatedStudentIds = useMemo(() => {
    const set = new Set<string>();
    const allSeats = Object.values(seatingChart.seats || {}) as GvcnSeatPosition[];
    allSeats.forEach((seat) => {
      if (seat.studentId) set.add(seat.studentId);
    });
    return set;
  }, [seatingChart]);

  // Thông tin ghế đang được chọn
  const selectedSeatData = useMemo(() => {
    if (!selectedSeatKey) return null;
    const parts = selectedSeatKey.split('-').map(Number);
    if (parts.length < 3) return null;
    const [r, c, idx] = parts;
    const seat = (seatingChart.seats && seatingChart.seats[selectedSeatKey]) || {
      deskRow: r,
      deskCol: c,
      seatIndex: idx,
    };
    const student = seat.studentId ? studentMap.get(seat.studentId) : null;
    return { row: r, col: c, seatIdx: idx, seat, student };
  }, [selectedSeatKey, seatingChart, studentMap]);

  // Học sinh chưa xếp chỗ
  const unassignedStudents = useMemo(() => {
    return students.filter((s) => !seatedStudentIds.has(s.id));
  }, [students, seatedStudentIds]);

  // Danh sách học sinh theo bộ lọc và tìm kiếm
  const filteredStudentList = useMemo(() => {
    return students.filter((s) => {
      // Bộ lọc danh mục
      if (studentListFilter === 'unseated') {
        if (seatedStudentIds.has(s.id)) return false;
      } else if (studentListFilter === 'seated') {
        if (!seatedStudentIds.has(s.id)) return false;
      } else if (studentListFilter === 'leaders') {
        if (!getBanCanSuInfo(s.role).isLeader) return false;
      } else if (typeof studentListFilter === 'number') {
        if (s.group !== studentListFilter) return false;
      }

      // Ô tìm kiếm
      if (studentSearchQuery.trim()) {
        const q = studentSearchQuery.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(q);
        const matchStt = s.stt.toString().includes(q);
        const matchRole = (s.role || '').toLowerCase().includes(q);
        return matchName || matchStt || matchRole;
      }

      return true;
    });
  }, [students, studentListFilter, studentSearchQuery, seatedStudentIds]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper lấy thông tin ghế
  const getSeat = (row: number, col: number, seatIdx: number): GvcnSeatPosition => {
    const key = `${row}-${col}-${seatIdx}`;
    return seatingChart.seats?.[key] || { deskRow: row, deskCol: col, seatIndex: seatIdx };
  };

  // Cập nhật 1 ghế
  const updateSeat = (row: number, col: number, seatIdx: number, studentId?: string, note?: string) => {
    const key = `${row}-${col}-${seatIdx}`;
    const newSeats: Record<string, GvcnSeatPosition> = { ...(seatingChart.seats || {}) };

    // Nếu học sinh này đang ngồi ở ghế khác, xóa ở ghế cũ trước
    if (studentId) {
      (Object.entries(newSeats) as [string, GvcnSeatPosition][]).forEach(([k, s]) => {
        if (s && s.studentId === studentId && k !== key) {
          newSeats[k] = { ...s, studentId: undefined };
        }
      });
    }

    newSeats[key] = {
      deskRow: row,
      deskCol: col,
      seatIndex: seatIdx,
      studentId: studentId,
      note: note !== undefined ? note : newSeats[key]?.note,
    };

    onUpdateSeatingChart({
      ...seatingChart,
      seats: newSeats,
      updatedAt: new Date().toLocaleDateString('vi-VN'),
    });
  };

  // Click vào ô ghế
  const handleSeatClick = (row: number, col: number, seatIdx: number) => {
    const key = `${row}-${col}-${seatIdx}`;
    const seat = getSeat(row, col, seatIdx);

    // 1. Đang chọn 1 học sinh chưa xếp chỗ -> xếp vào ghế này
    if (selectedStudentId) {
      updateSeat(row, col, seatIdx, selectedStudentId);
      const student = studentMap.get(selectedStudentId);
      showToast(`Đã xếp em ${student?.name || ''} vào Bàn ${row}, Dãy ${col}`);
      setSelectedStudentId(null);
      setSelectedSeatKey(null);
      return;
    }

    // 2. Đang chọn 1 ghế khác -> Đổi chỗ 2 ghế cho nhau (Swap)
    if (selectedSeatKey && selectedSeatKey !== key) {
      const [fromRow, fromCol, fromIdx] = selectedSeatKey.split('-').map(Number);
      const fromSeat = getSeat(fromRow, fromCol, fromIdx);

      const studentFrom = fromSeat.studentId;
      const studentTo = seat.studentId;

      const newSeats = { ...seatingChart.seats };
      newSeats[selectedSeatKey] = {
        ...fromSeat,
        studentId: studentTo,
      };
      newSeats[key] = {
        ...seat,
        studentId: studentFrom,
      };

      onUpdateSeatingChart({
        ...seatingChart,
        seats: newSeats,
        updatedAt: new Date().toLocaleDateString('vi-VN'),
      });

      const name1 = studentFrom ? studentMap.get(studentFrom)?.name : 'chỗ trống';
      const name2 = studentTo ? studentMap.get(studentTo)?.name : 'chỗ trống';
      showToast(`Đã hoán đổi chỗ ngồi giữa: ${name1} ⇄ ${name2}`);

      setSelectedSeatKey(null);
      return;
    }

    // 3. Chọn/bỏ chọn ghế này
    if (selectedSeatKey === key) {
      setSelectedSeatKey(null);
    } else {
      setSelectedSeatKey(key);
    }
  };

  // Gỡ học sinh khỏi ghế
  const handleRemoveFromSeat = (row: number, col: number, seatIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const seat = getSeat(row, col, seatIdx);
    if (!seat.studentId) return;

    const studentName = studentMap.get(seat.studentId)?.name || 'Học sinh';
    updateSeat(row, col, seatIdx, undefined);
    showToast(`Đã gỡ em ${studentName} khỏi vị trí bàn`);
    if (selectedSeatKey === `${row}-${col}-${seatIdx}`) {
      setSelectedSeatKey(null);
    }
  };

  // Ban cán sự list
  const banCanSuStudents = useMemo(() => {
    return students.filter((s) => getBanCanSuInfo(s.role).isLeader);
  }, [students]);

  // Drag and drop handlers (kéo thả giữa các ghế và từ danh sách)
  const handleDragStartFromSeat = (row: number, col: number, idx: number, studentId: string, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', studentId);
    e.dataTransfer.effectAllowed = 'move';
    setDragSource({
      type: 'seat',
      studentId,
      fromRow: row,
      fromCol: col,
      fromIdx: idx,
      seatKey: `${row}-${col}-${idx}`,
    });
  };

  const handleDragStartFromList = (studentId: string, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', studentId);
    e.dataTransfer.effectAllowed = 'move';
    setDragSource({
      type: 'list',
      studentId,
    });
  };

  const handleDragStartFromUnassigned = (studentId: string, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', studentId);
    e.dataTransfer.effectAllowed = 'move';
    setDragSource({
      type: 'unassigned',
      studentId,
    });
  };

  const handleDragOverSeat = (key: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSeatKey !== key) {
      setDragOverSeatKey(key);
    }
  };

  const handleDropOnSeat = (row: number, col: number, seatIdx: number) => {
    const targetKey = `${row}-${col}-${seatIdx}`;
    setDragOverSeatKey(null);

    // Fallback for legacy draggedStudentId
    if (!dragSource) {
      if (draggedStudentId) {
        updateSeat(row, col, seatIdx, draggedStudentId);
        const student = studentMap.get(draggedStudentId);
        showToast(`Đã xếp em ${student?.name || ''} vào Bàn ${row}, Dãy ${col}`);
        setDraggedStudentId(null);
        setSelectedStudentId(null);
      }
      return;
    }

    const { studentId, type, fromRow, fromCol, fromIdx, seatKey: sourceSeatKey } = dragSource;
    const targetSeat = getSeat(row, col, seatIdx);
    const targetStudentId = targetSeat.studentId;
    const sourceStudent = studentMap.get(studentId);
    const targetStudent = targetStudentId ? studentMap.get(targetStudentId) : null;

    // Dropped on exactly the same seat -> do nothing
    if (type === 'seat' && sourceSeatKey === targetKey) {
      setDragSource(null);
      return;
    }

    // Case 1: Dragged from another seat -> SWAP (hoán đổi) hoặc MOVE
    if (type === 'seat' && sourceSeatKey) {
      const newSeats = { ...(seatingChart.seats || {}) };
      const sourceSeat = getSeat(fromRow!, fromCol!, fromIdx!);

      newSeats[sourceSeatKey] = {
        ...sourceSeat,
        studentId: targetStudentId,
      };
      newSeats[targetKey] = {
        ...targetSeat,
        studentId: studentId,
      };

      onUpdateSeatingChart({
        ...seatingChart,
        seats: newSeats,
        updatedAt: new Date().toLocaleDateString('vi-VN'),
      });

      if (targetStudent) {
        showToast(`Đã hoán đổi vị trí: ${sourceStudent?.name || 'HS'} ⇄ ${targetStudent.name}`);
      } else {
        showToast(`Đã chuyển em ${sourceStudent?.name || 'HS'} sang Bàn ${row}, Dãy ${col} (Ghế ${seatIdx + 1})`);
      }

      setDragSource(null);
      setSelectedSeatKey(null);
      return;
    }

    // Case 2: Dragged from list or unassigned
    updateSeat(row, col, seatIdx, studentId);
    if (targetStudent) {
      showToast(`Đã xếp em ${sourceStudent?.name || 'HS'} vào ghế, em ${targetStudent.name} chuyển về danh sách chưa xếp chỗ`);
    } else {
      showToast(`Đã xếp em ${sourceStudent?.name || 'HS'} vào Bàn ${row}, Dãy ${col} (Ghế ${seatIdx + 1})`);
    }

    setDragSource(null);
    setSelectedStudentId(null);
    setSelectedSeatKey(null);
  };

  // Drop on unassigned area to unseat a student
  const handleDropOnUnassignedZone = () => {
    if (dragSource && dragSource.type === 'seat' && dragSource.seatKey) {
      const { fromRow, fromCol, fromIdx, studentId } = dragSource;
      updateSeat(fromRow!, fromCol!, fromIdx!, undefined);
      const s = studentMap.get(studentId);
      showToast(`Đã gỡ em ${s?.name || 'HS'} khỏi sơ đồ về danh sách chưa xếp chỗ`);
      setDragSource(null);
    }
  };

  // Lưu chức vụ ban cán sự
  const handleSaveRole = (student: GvcnStudent, newRole: string) => {
    const updated = { ...student, role: newRole };
    if (onUpdateStudent) {
      onUpdateStudent(updated);
    } else if (onUpdateStudents) {
      onUpdateStudents(students.map((s) => (s.id === student.id ? updated : s)));
    }
    showToast(`Đã cập nhật chức vụ của em ${student.name}: ${newRole || 'Học sinh'}`);
    setRoleModalStudent(null);
  };

  // Xóa học sinh khỏi lớp
  const handleConfirmDeleteStudent = (studentId: string) => {
    const s = studentMap.get(studentId);
    const name = s?.name || 'học sinh';

    // Xóa khỏi sơ đồ ghế nếu đang ngồi
    const newSeats: Record<string, GvcnSeatPosition> = { ...(seatingChart.seats || {}) };
    let seatChanged = false;
    Object.entries(newSeats).forEach(([k, seat]) => {
      if (seat && seat.studentId === studentId) {
        newSeats[k] = { ...seat, studentId: undefined };
        seatChanged = true;
      }
    });
    if (seatChanged) {
      onUpdateSeatingChart({
        ...seatingChart,
        seats: newSeats,
        updatedAt: new Date().toLocaleDateString('vi-VN'),
      });
    }

    if (onDeleteStudent) {
      onDeleteStudent(studentId);
    } else if (onUpdateStudents) {
      onUpdateStudents(students.filter((st) => st.id !== studentId));
    }

    showToast(`Đã xóa học sinh ${name} khỏi danh sách lớp`);
    setDeleteModalStudent(null);
    if (selectedSeatData?.student?.id === studentId) {
      setSelectedSeatKey(null);
    }
  };

  // Thêm học sinh mới
  const handleAddStudent = (newStudent: GvcnStudent) => {
    if (onAddStudent) {
      onAddStudent(newStudent);
    } else if (onUpdateStudents) {
      onUpdateStudents([...students, newStudent].sort((a, b) => (a.stt || 0) - (b.stt || 0)));
    }
    showToast(`Đã thêm em ${newStudent.name} vào danh sách lớp!`);
    setShowQuickAddModal(false);
  };

  // Hover xem thông tin và vị trí học sinh
  const handleStudentMouseEnter = (student: GvcnStudent, e: React.MouseEvent) => {
    let seatInfo = null;
    const allSeats = Object.entries(seatingChart.seats || {}) as [string, GvcnSeatPosition][];
    for (const [key, pos] of allSeats) {
      if (pos.studentId === student.id) {
        const otherIdx = pos.seatIndex === 0 ? 1 : 0;
        const otherKey = `${pos.deskRow}-${pos.deskCol}-${otherIdx}`;
        const otherSeat = seatingChart.seats?.[otherKey];
        const seatmate = otherSeat?.studentId ? studentMap.get(otherSeat.studentId) : null;
        seatInfo = {
          col: pos.deskCol,
          row: pos.deskRow,
          seatIdx: pos.seatIndex,
          seatKey: key,
          seatmateName: seatmate?.name,
          note: pos.note,
        };
        break;
      }
    }

    setHoveredData({
      student,
      x: e.clientX,
      y: e.clientY,
      seatInfo,
    });
    setHoveredStudentId(student.id);
  };

  const handleStudentMouseLeave = () => {
    setHoveredData(null);
    setHoveredStudentId(null);
  };

  // ========================================================
  // CÁC THUẬT TOÁN TỰ ĐỘNG XẾP CHỖ THÔNG MINH
  // ========================================================

  // 1. Tự động xếp theo 4 Tổ (Tổ 1 -> Dãy 1, Tổ 2 -> Dãy 2, Tổ 3 -> Dãy 3, Tổ 4 -> Dãy 4)
  const autoAssignByGroups = () => {
    const newSeats: Record<string, GvcnSeatPosition> = {};
    const cols = seatingChart.columns || 4;
    const rows = seatingChart.rows || 6;
    const seatsPerDesk = seatingChart.seatsPerDesk || 2;

    for (let col = 1; col <= cols; col++) {
      const groupStudents = students.filter((s) => s.group === col);
      // Ưu tiên đưa cán sự lớp/tổ trưởng hoặc bạn cận thị lên đầu
      groupStudents.sort((a, b) => {
        const isLeaderA = a.role && a.role !== 'Học sinh' ? 1 : 0;
        const isLeaderB = b.role && b.role !== 'Học sinh' ? 1 : 0;
        return isLeaderB - isLeaderA;
      });

      let studentIdx = 0;
      for (let row = 1; row <= rows; row++) {
        for (let seatIdx = 0; seatIdx < seatsPerDesk; seatIdx++) {
          const key = `${row}-${col}-${seatIdx}`;
          if (studentIdx < groupStudents.length) {
            newSeats[key] = {
              deskRow: row,
              deskCol: col,
              seatIndex: seatIdx,
              studentId: groupStudents[studentIdx].id,
            };
            studentIdx++;
          } else {
            newSeats[key] = {
              deskRow: row,
              deskCol: col,
              seatIndex: seatIdx,
              studentId: undefined,
            };
          }
        }
      }
    }

    onUpdateSeatingChart({
      ...seatingChart,
      seats: newSeats,
      updatedAt: new Date().toLocaleDateString('vi-VN'),
    });
    showToast('Đã tự động xếp 42 học sinh theo đúng 4 Tổ vào 4 Dãy bàn!');
  };

  // 2. Xoay chuyển vị trí dãy bàn theo tuần (Tuần luân chuyển định kỳ)
  // Dãy 1 -> Dãy 2 -> Dãy 3 -> Dãy 4 -> Dãy 1
  const rotateColumnsWeekly = () => {
    const cols = seatingChart.columns || 4;
    const rows = seatingChart.rows || 6;
    const seatsPerDesk = seatingChart.seatsPerDesk || 2;
    const newSeats: Record<string, GvcnSeatPosition> = {};

    for (let col = 1; col <= cols; col++) {
      const nextCol = col === cols ? 1 : col + 1; // Dãy cũ chuyển sang dãy kế tiếp
      for (let row = 1; row <= rows; row++) {
        for (let sIdx = 0; sIdx < seatsPerDesk; sIdx++) {
          const oldKey = `${row}-${col}-${sIdx}`;
          const newKey = `${row}-${nextCol}-${sIdx}`;
          const currentSeat = seatingChart.seats?.[oldKey];

          newSeats[newKey] = {
            deskRow: row,
            deskCol: nextCol,
            seatIndex: sIdx,
            studentId: currentSeat?.studentId,
            note: currentSeat?.note,
          };
        }
      }
    }

    onUpdateSeatingChart({
      ...seatingChart,
      seats: newSeats,
      updatedAt: new Date().toLocaleDateString('vi-VN'),
    });
    showToast(`Đã xoay chuyển dãy bàn theo tuần thành công: Dãy 1 ➔ Dãy 2 ➔ Dãy 3 ➔ Dãy 4 ➔ Dãy 1`);
  };

  // 3. Xếp xen kẽ Nam - Nữ (Mỗi bàn 1 Nam, 1 Nữ)
  const autoAssignAlternatingGender = () => {
    const boys = students.filter((s) => s.gender === 'Nam');
    const girls = students.filter((s) => s.gender === 'Nữ');
    const newSeats: Record<string, GvcnSeatPosition> = {};
    const cols = seatingChart.columns || 4;
    const rows = seatingChart.rows || 6;

    let boyIdx = 0;
    let girlIdx = 0;

    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= cols; col++) {
        // Ghế trái
        const key0 = `${row}-${col}-0`;
        if (row % 2 === 1) {
          // Hàng lẻ: Nam bên trái, Nữ bên phải
          newSeats[key0] = {
            deskRow: row,
            deskCol: col,
            seatIndex: 0,
            studentId: boyIdx < boys.length ? boys[boyIdx++].id : undefined,
          };
        } else {
          // Hàng chẵn: Nữ bên trái, Nam bên phải
          newSeats[key0] = {
            deskRow: row,
            deskCol: col,
            seatIndex: 0,
            studentId: girlIdx < girls.length ? girls[girlIdx++].id : undefined,
          };
        }

        // Ghế phải
        const key1 = `${row}-${col}-1`;
        if (row % 2 === 1) {
          newSeats[key1] = {
            deskRow: row,
            deskCol: col,
            seatIndex: 1,
            studentId: girlIdx < girls.length ? girls[girlIdx++].id : undefined,
          };
        } else {
          newSeats[key1] = {
            deskRow: row,
            deskCol: col,
            seatIndex: 1,
            studentId: boyIdx < boys.length ? boys[boyIdx++].id : undefined,
          };
        }
      }
    }

    onUpdateSeatingChart({
      ...seatingChart,
      seats: newSeats,
      updatedAt: new Date().toLocaleDateString('vi-VN'),
    });
    showToast('Đã xếp chỗ xen kẽ Nam - Nữ hài hòa cho toàn bộ các bàn!');
  };

  // 4. Xóa trắng sơ đồ
  const clearAllSeats = () => {
    if (window.confirm('Thầy/Cô có chắc chắn muốn xóa toàn bộ chỗ ngồi để sắp xếp lại từ đầu?')) {
      onUpdateSeatingChart({
        ...seatingChart,
        seats: {},
        updatedAt: new Date().toLocaleDateString('vi-VN'),
      });
      setSelectedSeatKey(null);
      setSelectedStudentId(null);
      showToast('Đã xóa toàn bộ sơ đồ chỗ ngồi');
    }
  };

  // 5. In sơ đồ lớp học độc lập - Đảm bảo chính xác 1 trang A4 rõ nét
  const handleDirectPrintSinglePage = () => {
    const isLandscape = printOrientation === 'landscape';
    const existingIframe = document.getElementById('seating-print-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'seating-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const printElement = document.getElementById('printable-seating-chart');
    if (!printElement) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Sơ đồ chỗ ngồi lớp ${classInfo.className || ''}</title>
          <style>
            @page {
              size: A4 ${isLandscape ? 'landscape' : 'portrait'};
              margin: 4mm 5mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            .print-page-box {
              width: 100%;
              height: 98vh;
              max-height: 98vh;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-after: avoid;
              break-after: avoid;
              page-break-inside: avoid;
              break-inside: avoid;
              overflow: hidden;
              box-sizing: border-box;
            }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="p-0 m-0">
          <div class="print-page-box">
            ${printElement.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      }
    }, 350);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border border-emerald-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* HEADER CARD: THÔNG TIN HÀNH CHÍNH LỚP HỌC & PHÒNG HỌC */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-emerald-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/30 flex items-center gap-1">
                <School className="w-3.5 h-3.5" />
                {classInfo.schoolName || 'TRƯỜNG THCS VÀ THPT PHÚ THÀNH'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200 text-xs font-bold border border-teal-400/30 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Năm học: {classInfo.academicYear || '2026 - 2027'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-xs font-bold border border-amber-400/30 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {classInfo.room || 'Dãy cũ, Tầng trệt, Phòng 4'}
              </span>
            </div>

            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-emerald-400" />
              <span>Sơ Đồ Vị Trí Lớp Học & Chỗ Ngồi — {classInfo.className || 'Lớp 9A1'}</span>
            </h2>

            <p className="text-xs text-slate-300 mt-1 flex items-center gap-3">
              <span>
                <strong>GVCN:</strong> {classInfo.homeroomTeacher || 'Dương Văn Trong'}
              </span>
              <span>•</span>
              <span>
                <strong>Sĩ số:</strong> {students.length} học sinh (Đã xếp: {seatedStudentIds.size}/{students.length})
              </span>
              <span>•</span>
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Ban cán sự: {banCanSuStudents.length} em</span>
              </span>
              <span>•</span>
              <span>
                <strong>Ghế trống:</strong> {Math.max(0, (seatingChart.columns || 4) * (seatingChart.rows || 6) * (seatingChart.seatsPerDesk || 2) - seatedStudentIds.size)} vị trí
              </span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (onOpenAddStudent) onOpenAddStudent();
                else setShowQuickAddModal(true);
              }}
              className="px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all hover:scale-[1.02]"
              title="Thêm học sinh mới vào lớp"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Thêm Học Sinh</span>
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className="px-3.5 py-2 bg-white text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              title="In sơ đồ lớp A4"
            >
              <Printer className="w-4 h-4 text-emerald-700" />
              <span>In Sơ Đồ Lớp (A4)</span>
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3.5 py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-500/40 shadow-sm transition-all"
              title="Tùy chỉnh số dãy bàn, số hàng"
            >
              <Settings className="w-4 h-4" />
              <span>Cài Đặt Phòng</span>
            </button>
          </div>
        </div>
      </div>

      {/* THANH CÔNG CỤ THAO TÁC TỰ ĐỘNG & ĐIỀU KHIỂN */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Thao Tác Xếp Chỗ Nhanh:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={autoAssignByGroups}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
              title="Tự động xếp 4 Tổ vào 4 Dãy tương ứng"
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xếp Theo 4 Tổ</span>
            </button>

            <button
              onClick={rotateColumnsWeekly}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
              title="Đảo luân phiên các dãy bàn mỗi tuần (Dãy 1 ➔ 2 ➔ 3 ➔ 4 ➔ 1)"
            >
              <RotateCw className="w-3.5 h-3.5 text-teal-600" />
              <span>Xoay Vòng Tuần (1➔2➔3➔4)</span>
            </button>

            <button
              onClick={autoAssignAlternatingGender}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
              title="Mỗi bàn gồm 1 bạn Nam và 1 bạn Nữ"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
              <span>Xen Kẽ Nam - Nữ</span>
            </button>

            <button
              onClick={clearAllSeats}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
              title="Xóa toàn bộ chỗ ngồi để xếp lại"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Làm Trống Ghế</span>
            </button>
          </div>
        </div>

        {/* Hướng dẫn thao tác nhanh */}
        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>
              <strong>Mẹo thao tác:</strong> Kéo thả học sinh từ danh sách vào ghế, hoặc Click vào 1 học sinh rồi click vào ghế. Nhấp liên tiếp 2 ghế để <strong>hoán đổi vị trí (Swap)</strong>.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Nam
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Nữ
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-500" /> Cán sự
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-emerald-600" /> Có ghi chú
            </span>
          </div>
        </div>

        {/* Thanh tùy chọn hiển thị tên học sinh & kích cỡ ô ghế */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/70 p-2 rounded-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hiển thị tên học sinh:</span>
            </span>
            <div className="inline-flex rounded-lg bg-white p-0.5 border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => handleSetNameDisplayMode('full')}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                  nameDisplayMode === 'full'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Hiển thị đầy đủ Họ và Tên rõ ràng, không cắt xén (Khuyên dùng)"
              >
                Họ và Tên đầy đủ
              </button>
              <button
                type="button"
                onClick={() => handleSetNameDisplayMode('middle_first')}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                  nameDisplayMode === 'middle_first'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Bỏ từ đầu tiên (Họ), hiển thị Chữ lót & Tên (Ví dụ: Văn An)"
              >
                Chữ lót & Tên
              </button>
              <button
                type="button"
                onClick={() => handleSetNameDisplayMode('first_only')}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                  nameDisplayMode === 'first_only'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chỉ hiển thị Tên chính (Ví dụ: An)"
              >
                Tên chính
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700">Kích cỡ ô:</span>
            <div className="inline-flex rounded-lg bg-white p-0.5 border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => handleSetCardDensity('standard')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                  cardDensity === 'standard'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tiêu chuẩn
              </button>
              <button
                type="button"
                onClick={() => handleSetCardDensity('spacious')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                  cardDensity === 'spacious'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tăng khoảng đệm để tên hiển thị to rõ nhất"
              >
                Rộng rãi (Chữ to)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KHU VỰC MẶT BẰNG LỚP HỌC (VISUAL CLASSROOM GRID) */}
      <div className="bg-slate-100/80 p-5 rounded-3xl border border-slate-300 shadow-inner">
        {/* KHU VỰC BỤC GIẢNG & BẢNG LỚP HỌC */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="relative bg-gradient-to-b from-emerald-900 to-emerald-950 text-white rounded-2xl py-3.5 px-6 shadow-md border-4 border-amber-900/30 text-center">
            {/* Cửa ra vào */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 ${
                seatingChart.doorPosition === 'left' ? 'left-3' : 'right-3'
              } px-2.5 py-1 bg-amber-700/80 border border-amber-500 text-[10px] font-bold rounded-lg text-amber-100 flex items-center gap-1 shadow-sm`}
            >
              <span>🚪 CỬA RA VÀO LỚP</span>
            </div>

            {/* Bàn giáo viên */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 ${
                seatingChart.teacherDeskPosition === 'left' ? 'left-28' : 'right-28'
              } px-3 py-1.5 bg-amber-800 border-2 border-amber-600 rounded-xl shadow-md flex items-center gap-1.5`}
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-300" />
              <div className="text-left">
                <div className="text-[10px] font-black text-amber-200">BÀN GIÁO VIÊN</div>
                <div className="text-[9px] text-white font-medium truncate max-w-[120px]">
                  {classInfo.homeroomTeacher || 'Dương Văn Trong'}
                </div>
              </div>
            </div>

            {/* Bảng phấn */}
            <div className="inline-block px-8 py-1 rounded-md bg-emerald-800/60 border border-emerald-600/40">
              <span className="text-xs font-black tracking-widest text-emerald-200 uppercase">
                {seatingChart.boardLabel || 'BẢNG LỚP HỌC & MÀN CHIẾU (PHÒNG 4 — DÃY CŨ, TẦNG TRỆT)'}
              </span>
            </div>
          </div>
        </div>

        {/* LƯỚI CÁC DÃY BÀN HỌC SINH (4 DÃY TƯƠNG ỨNG 4 TỔ) */}
        <div className="overflow-x-auto pb-4 pt-1">
          <div
            className="grid gap-4 max-w-6xl mx-auto min-w-[860px]"
            style={{
              gridTemplateColumns: `repeat(${seatingChart.columns || 4}, minmax(210px, 1fr))`,
            }}
          >
            {Array.from({ length: seatingChart.columns || 4 }).map((_, colIdx) => {
              const col = colIdx + 1;
              const groupLeader = students.find((s) => s.group === col && s.role?.includes('Tổ trưởng'));

              return (
                <div
                  key={col}
                  className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-col"
                >
                  {/* Header dãy bàn */}
                  <div className="pb-2.5 mb-2.5 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-emerald-900 uppercase">
                        DÃY {col} (TỔ {col})
                      </span>
                      {groupLeader && (
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                          Tổ trưởng: {groupLeader.name}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                      {students.filter((s) => s.group === col).length} HS
                    </span>
                  </div>

                  {/* Các hàng bàn của dãy này */}
                  <div className="space-y-2.5 flex-1">
                    {Array.from({ length: seatingChart.rows || 6 }).map((_, rowIdx) => {
                      const row = rowIdx + 1;
                      const seatsPerDesk = seatingChart.seatsPerDesk || 2;

                      return (
                        <div
                          key={row}
                          className="bg-slate-50/90 rounded-xl p-1.5 border border-slate-200 relative group/desk hover:border-emerald-300 transition-all"
                        >
                          {/* Nhãn hàng bàn */}
                          <div className="text-[9px] font-bold text-slate-400 mb-1 px-1 flex items-center justify-between">
                            <span>BÀN {row}</span>
                            {row === 1 && (
                              <span className="text-[8px] text-emerald-600 font-semibold">Gần bảng</span>
                            )}
                          </div>

                          {/* Các chỗ ngồi trong bàn (2 ghế / bàn) */}
                          <div
                            className="grid gap-1.5"
                            style={{
                              gridTemplateColumns: `repeat(${seatsPerDesk}, minmax(0, 1fr))`,
                            }}
                          >
                            {Array.from({ length: seatsPerDesk }).map((_, sIdx) => {
                              const seat = getSeat(row, col, sIdx);
                              const key = `${row}-${col}-${sIdx}`;
                              const student = seat.studentId ? studentMap.get(seat.studentId) : undefined;
                              const isSelected = selectedSeatKey === key;
                              const isHovered = hoveredStudentId === student?.id;
                              const isDragTarget = dragOverSeatKey === key;
                              const roleInfo = student ? getBanCanSuInfo(student.role) : null;
                              const nameInfo = student ? formatSeatingStudentName(student, students, nameDisplayMode) : null;
                              const fontClass = nameInfo ? getSeatingNameFontSize(nameInfo.displayName) : '';

                              return (
                                <div
                                  key={sIdx}
                                  draggable={!!student}
                                  onDragStart={(e) => {
                                    if (student) handleDragStartFromSeat(row, col, sIdx, student.id, e);
                                  }}
                                  onDragEnd={() => {
                                    setDragSource(null);
                                    setDragOverSeatKey(null);
                                  }}
                                  onDragOver={(e) => handleDragOverSeat(key, e)}
                                  onDragLeave={() => {
                                    if (dragOverSeatKey === key) setDragOverSeatKey(null);
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    handleDropOnSeat(row, col, sIdx);
                                  }}
                                  onClick={() => handleSeatClick(row, col, sIdx)}
                                  onMouseEnter={(e) => {
                                    if (student) handleStudentMouseEnter(student, e);
                                  }}
                                  onMouseLeave={handleStudentMouseLeave}
                                  className={`${
                                    cardDensity === 'spacious' ? 'min-h-[76px] p-2' : 'min-h-[64px] p-1.5'
                                  } rounded-xl border text-left cursor-pointer transition-all relative flex flex-col justify-between group/seat ${
                                    isHovered
                                      ? 'ring-4 ring-emerald-500 scale-[1.05] z-30 shadow-2xl bg-emerald-100/95 border-emerald-600 animate-pulse'
                                      : isDragTarget
                                      ? 'ring-4 ring-amber-500 scale-[1.03] z-20 bg-amber-100 border-amber-600 shadow-xl'
                                      : isSelected
                                      ? 'ring-2 ring-emerald-600 bg-emerald-50 border-emerald-500 shadow-md scale-[1.02]'
                                      : student
                                      ? roleInfo?.isLeader
                                        ? `${roleInfo.borderClass} ${roleInfo.glowBg}`
                                        : student.gender === 'Nam'
                                        ? 'bg-blue-50/80 border-blue-200 hover:bg-blue-100/90 hover:border-blue-300 shadow-2xs'
                                        : 'bg-rose-50/80 border-rose-200 hover:bg-rose-100/90 hover:border-rose-300 shadow-2xs'
                                      : 'bg-white border-dashed border-slate-300 hover:bg-emerald-50/50 hover:border-emerald-400'
                                  }`}
                                  title={
                                    student
                                      ? `Kéo em này để đổi chỗ ngồi!\nHọ và tên: ${student.name} (${student.gender || 'Học sinh'})\nChức vụ: ${student.role || 'Học sinh'}\n${seat.note ? `Ghi chú: ${seat.note}` : ''}`
                                      : 'Ghế trống - Nhấp hoặc kéo học sinh thả vào đây'
                                  }
                                >
                                  {/* Hiệu ứng nổi bật khi rê chuột ở danh sách học sinh */}
                                  {isHovered && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-40 bg-emerald-700 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap animate-bounce flex items-center gap-1">
                                      <MapPin className="w-2.5 h-2.5" />
                                      <span>VỊ TRÍ CỦA EM</span>
                                    </div>
                                  )}

                                  {student ? (
                                    <>
                                      {/* Dòng 1: STT và các nút thao tác nhanh (Chức vụ, Sửa, Xóa khỏi lớp, Gỡ ghế) */}
                                      <div className="flex items-center justify-between gap-1 leading-none">
                                        <div className="flex items-center gap-1">
                                          <span
                                            className={`text-[9.5px] font-black px-1.5 py-0.5 rounded shrink-0 shadow-2xs ${
                                              student.gender === 'Nam'
                                                ? 'bg-blue-200 text-blue-900 border border-blue-300/60'
                                                : 'bg-rose-200 text-rose-900 border border-rose-300/60'
                                            }`}
                                          >
                                            #{student.stt}
                                          </span>

                                          {/* Huy hiệu Ban cán sự trên thẻ (nếu có) */}
                                          {roleInfo?.isLeader && (
                                            <span className="text-[11px] leading-none" title={roleInfo.label}>
                                              {roleInfo.emoji}
                                            </span>
                                          )}
                                        </div>

                                        {/* Cụm nút thao tác */}
                                        <div className="flex items-center gap-0.5 opacity-60 group-hover/seat:opacity-100 hover:opacity-100 transition-opacity">
                                          {/* Nút phân công / sửa chức vụ */}
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setRoleModalStudent(student);
                                            }}
                                            className="text-slate-400 hover:text-amber-600 rounded p-0.5 hover:bg-white/90 transition-colors"
                                            title={`Gán / Đổi chức vụ cho ${student.name}`}
                                          >
                                            <Crown className="w-3 h-3 text-amber-600" />
                                          </button>

                                          {onEditStudent && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onEditStudent(student);
                                              }}
                                              className="text-slate-400 hover:text-indigo-600 rounded p-0.5 hover:bg-white/80 transition-colors"
                                              title={`Tùy chỉnh thông tin ${student.name}`}
                                            >
                                              <Edit3 className="w-3 h-3" />
                                            </button>
                                          )}

                                          {/* Nút xóa học sinh khỏi danh sách lớp */}
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setDeleteModalStudent(student);
                                            }}
                                            className="text-slate-400 hover:text-rose-600 rounded p-0.5 hover:bg-white/80 transition-colors"
                                            title={`Xóa ${student.name} khỏi danh sách lớp`}
                                          >
                                            <Trash2 className="w-3 h-3 text-rose-500" />
                                          </button>

                                          {/* Nút gỡ học sinh khỏi ghế */}
                                          <button
                                            type="button"
                                            onClick={(e) => handleRemoveFromSeat(row, col, sIdx, e)}
                                            className="text-slate-400 hover:text-rose-700 rounded p-0.5 hover:bg-white/80 transition-colors"
                                            title="Gỡ học sinh khỏi ghế này"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Dòng 2: TÊN HỌC SINH HIỂN THỊ TRỌN VẸN VÀ RÕ RÀNG */}
                                      <div className="flex-1 flex flex-col justify-center my-0.5">
                                        <div
                                          className={`text-slate-900 tracking-tight leading-snug break-words ${fontClass}`}
                                          title={`Họ và tên: ${student.name} (Có thể kéo thả để đổi chỗ)`}
                                        >
                                          {nameInfo?.displayName}
                                        </div>
                                      </div>

                                      {/* Dòng 3: Chức vụ Cán sự / Tổ / Ghi chú */}
                                      <div className="flex items-center justify-between mt-0.5 pt-1 border-t border-slate-200/50 text-[9px]">
                                        {roleInfo?.isLeader ? (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setRoleModalStudent(student);
                                            }}
                                            className={`px-1.5 py-0.2 rounded text-[8.5px] font-black flex items-center gap-0.5 max-w-[95px] truncate shadow-2xs hover:scale-105 transition-transform ${roleInfo.badgeClass}`}
                                            title={`Nhấp để đổi chức vụ của ${student.name}`}
                                          >
                                            <span className="truncate">{roleInfo.shortLabel}</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setRoleModalStudent(student);
                                            }}
                                            className="text-slate-500 hover:text-amber-700 font-medium flex items-center gap-0.5 hover:bg-amber-50 px-1 py-0.2 rounded transition-colors group/role"
                                            title={`Bấm để gán chức vụ cho ${student.name}`}
                                          >
                                            <span>Tổ {student.group}</span>
                                            <Crown className="w-2.5 h-2.5 text-slate-300 group-hover/role:text-amber-600 ml-0.5" />
                                          </button>
                                        )}

                                        {seat.note ? (
                                          <span
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSeatNoteModal({ seatKey: key, currentNote: seat.note || '' });
                                            }}
                                            className="text-emerald-700 bg-emerald-100/90 px-1 py-0.2 rounded font-semibold truncate max-w-[65px] hover:bg-emerald-200 cursor-pointer"
                                            title={seat.note}
                                          >
                                            {seat.note}
                                          </span>
                                        ) : (
                                          <span className="text-[8px] text-slate-400">G{sIdx + 1}</span>
                                        )}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-1.5">
                                      <span className="text-[10px] font-semibold text-slate-400">Trống</span>
                                      <span className="text-[8px] text-slate-400">G{sIdx + 1}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cửa sổ thông gió / Phía sau lớp */}
        <div className="mt-6 text-center">
          <div className="inline-block px-6 py-1 bg-slate-200 text-slate-600 rounded-full text-[10px] font-bold tracking-wider uppercase border border-slate-300">
            PHÍA SAU LỚP HỌC (BẢNG TIN & CỬA SỔ THÔNG GIÓ)
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU KHIỂN VỊ TRÍ GHẾ ĐANG CHỌN */}
      {selectedSeatData && (
        <div className="bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
            <div>
              <div className="text-xs font-black text-emerald-950 uppercase flex items-center gap-2">
                <span>VỊ TRÍ ĐANG CHỌN: DÃY {selectedSeatData.col} (TỔ {selectedSeatData.col}) — BÀN {selectedSeatData.row}, GHẾ {selectedSeatData.seatIdx + 1}</span>
                {selectedSeatData.seat.note && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    Ghi chú: {selectedSeatData.seat.note}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {selectedSeatData.student ? (
                  <span>
                    Học sinh: <strong className="text-slate-900">#{selectedSeatData.student.stt} {selectedSeatData.student.name}</strong> ({selectedSeatData.student.gender}, Tổ {selectedSeatData.student.group}, {selectedSeatData.student.role || 'Học sinh'})
                  </span>
                ) : (
                  <span className="italic text-slate-400">Chỗ ngồi đang trống (Nhấp học sinh bên dưới để xếp vào đây)</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedSeatData.student && onEditStudent && (
              <button
                type="button"
                onClick={() => onEditStudent(selectedSeatData.student!)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                title="Tùy chỉnh thông tin học sinh này"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Tùy Chỉnh Thông Tin</span>
              </button>
            )}

            {selectedSeatData.student && onSelectStudent && (
              <button
                type="button"
                onClick={() => onSelectStudent(selectedSeatData.student!)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                title="Xem hồ sơ toàn diện 360°"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Hồ Sơ 360°</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setSeatNoteModal({ seatKey: selectedSeatKey!, currentNote: selectedSeatData.seat.note || '' })}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Ghi Chú Ghế</span>
            </button>

            {selectedSeatData.student && (
              <button
                type="button"
                onClick={(e) => handleRemoveFromSeat(selectedSeatData.row, selectedSeatData.col, selectedSeatData.seatIdx, e)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Gỡ Khỏi Ghế</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedSeatKey(null)}
              className="px-2.5 py-1.5 text-slate-400 hover:text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              title="Bỏ chọn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* KHU VỰC HỌC SINH CHƯA XẾP CHỖ (HỖ TRỢ KÉO THẢ TỪ GHẾ VỀ ĐÂY) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={handleDropOnUnassignedZone}
        className={`rounded-2xl p-4 shadow-xs transition-all ${
          unassignedStudents.length > 0
            ? 'bg-amber-50/90 border-2 border-dashed border-amber-300'
            : 'bg-emerald-50/50 border border-dashed border-emerald-200 py-3'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            {unassignedStudents.length > 0 ? (
              <AlertCircle className="w-4 h-4 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800">
              Học Sinh Chưa Xếp Chỗ ({unassignedStudents.length} em):
            </h3>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
              (Có thể kéo thả học sinh từ ghế trên sơ đồ thả vào đây để gỡ khỏi ghế)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onOpenAddStudent) onOpenAddStudent();
                else setShowQuickAddModal(true);
              }}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs"
            >
              <UserPlus className="w-3 h-3" />
              <span>+ Thêm Học Sinh</span>
            </button>
          </div>
        </div>

        {unassignedStudents.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {unassignedStudents.map((s) => {
              const isSelected = selectedStudentId === s.id;
              const roleInfo = getBanCanSuInfo(s.role);
              return (
                <div
                  key={s.id}
                  draggable
                  onDragStart={(e) => handleDragStartFromUnassigned(s.id, e)}
                  onMouseEnter={(e) => handleStudentMouseEnter(s, e)}
                  onMouseLeave={handleStudentMouseLeave}
                  onClick={() => setSelectedStudentId(isSelected ? null : s.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-grab active:cursor-grabbing transition-all flex items-center gap-2 shadow-2xs ${
                    isSelected
                      ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400 shadow-md scale-105'
                      : s.gender === 'Nam'
                      ? 'bg-blue-100/90 text-blue-900 border-blue-300 hover:bg-blue-200/90'
                      : 'bg-rose-100/90 text-rose-900 border-rose-300 hover:bg-rose-200/90'
                  }`}
                  title={`Kéo thả vào ghế trống để xếp chỗ\nRê chuột để xem thông tin`}
                >
                  <span className="font-mono text-[10px] opacity-80">#{s.stt}</span>
                  <span>{s.name}</span>
                  {roleInfo.isLeader && (
                    <span className="text-[11px]" title={roleInfo.label}>
                      {roleInfo.emoji}
                    </span>
                  )}
                  <span className="text-[10px] font-normal opacity-75">T{s.group}</span>

                  <div className="flex items-center gap-0.5 ml-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setRoleModalStudent(s)}
                      className="text-slate-400 hover:text-amber-600 p-0.5 rounded hover:bg-white/60"
                      title={`Phân công chức vụ cho ${s.name}`}
                    >
                      <Crown className="w-3 h-3 text-amber-600" />
                    </button>
                    {onEditStudent && (
                      <button
                        type="button"
                        onClick={() => onEditStudent(s)}
                        className="text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-white/60"
                        title={`Tùy chỉnh thông tin ${s.name}`}
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleteModalStudent(s)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-white/60"
                      title={`Xóa ${s.name} khỏi danh sách lớp`}
                    >
                      <Trash2 className="w-3 h-3 text-rose-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-emerald-800 font-medium">
            Toàn bộ <strong>{students.length}</strong> học sinh trong lớp đều đã được xếp chỗ ngồi trên sơ đồ!
          </p>
        )}
      </div>

      {/* DANH SÁCH HỌC SINH TOÀN DIỆN KÈM VỊ TRÍ SƠ ĐỒ & KÉO THẢ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Danh Sách Học Sinh & Vị Trí Ghế Ngồi ({filteredStudentList.length}/{students.length} em)
            </h3>
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              (Rê chuột vào bất kỳ học sinh nào để xem bảng nhỏ thông tin và vị trí ghế)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên, STT, chức vụ..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (onOpenAddStudent) onOpenAddStudent();
                else setShowQuickAddModal(true);
              }}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Thêm Học Sinh</span>
            </button>
          </div>
        </div>

        {/* Bộ lọc học sinh */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Bộ lọc:
          </span>

          <button
            type="button"
            onClick={() => setStudentListFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              studentListFilter === 'all'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({students.length})
          </button>

          <button
            type="button"
            onClick={() => setStudentListFilter('unseated')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              studentListFilter === 'unseated'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Chưa xếp chỗ ({unassignedStudents.length})
          </button>

          <button
            type="button"
            onClick={() => setStudentListFilter('seated')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              studentListFilter === 'seated'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Đã có chỗ ({seatedStudentIds.size})
          </button>

          <button
            type="button"
            onClick={() => setStudentListFilter('leaders')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              studentListFilter === 'leaders'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Ban cán sự ({banCanSuStudents.length})
          </button>

          {[1, 2, 3, 4].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setStudentListFilter(g as 1 | 2 | 3 | 4)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                studentListFilter === g
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tổ {g}
            </button>
          ))}
        </div>

        {/* Lưới học sinh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
          {filteredStudentList.map((s) => {
            const roleInfo = getBanCanSuInfo(s.role);
            const isHovered = hoveredStudentId === s.id;

            // Tìm vị trí ghế hiện tại của học sinh
            let currentSeatInfo: { row: number; col: number; seatIdx: number; seatKey: string } | null = null;
            const allSeats = Object.entries(seatingChart.seats || {}) as [string, GvcnSeatPosition][];
            for (const [key, pos] of allSeats) {
              if (pos.studentId === s.id) {
                currentSeatInfo = {
                  row: pos.deskRow,
                  col: pos.deskCol,
                  seatIdx: pos.seatIndex,
                  seatKey: key,
                };
                break;
              }
            }

            return (
              <div
                key={s.id}
                draggable
                onDragStart={(e) => handleDragStartFromList(s.id, e)}
                onMouseEnter={(e) => handleStudentMouseEnter(s, e)}
                onMouseLeave={handleStudentMouseLeave}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-grab active:cursor-grabbing relative flex flex-col justify-between ${
                  isHovered
                    ? 'ring-2 ring-emerald-500 bg-emerald-50 border-emerald-400 shadow-md scale-[1.02]'
                    : roleInfo.isLeader
                    ? `${roleInfo.borderClass} ${roleInfo.glowBg}`
                    : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 shadow-2xs'
                }`}
                title={`Kéo thả học sinh vào sơ đồ để đổi hoặc xếp ghế\nRê chuột để xem bảng nhỏ`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9.5px] font-black px-1.5 py-0.2 rounded font-mono ${
                          s.gender === 'Nam'
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : 'bg-rose-100 text-rose-900 border border-rose-200'
                        }`}
                      >
                        #{s.stt}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                        {s.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setRoleModalStudent(s)}
                        className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-white transition-colors"
                        title={`Gán / Đổi chức vụ cho ${s.name}`}
                      >
                        <Crown className="w-3 h-3 text-amber-600" />
                      </button>
                      {onEditStudent && (
                        <button
                          type="button"
                          onClick={() => onEditStudent(s)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-white transition-colors"
                          title={`Sửa thông tin ${s.name}`}
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteModalStudent(s)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-white transition-colors"
                        title={`Xóa ${s.name} khỏi danh sách lớp`}
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                      </button>
                    </div>
                  </div>

                  {/* Chức vụ ban cán sự */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {roleInfo.isLeader ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRoleModalStudent(s);
                        }}
                        className={`px-2 py-0.5 rounded text-[9px] font-black flex items-center gap-1 shadow-2xs ${roleInfo.badgeClass}`}
                        title="Bấm để chỉnh sửa chức vụ"
                      >
                        <span>{roleInfo.emoji}</span>
                        <span className="truncate">{roleInfo.shortLabel}</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                        Tổ {s.group} • Học sinh
                      </span>
                    )}
                  </div>
                </div>

                {/* Vị trí trên sơ đồ lớp */}
                <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                  {currentSeatInfo ? (
                    <div className="flex items-center gap-1 text-emerald-800 font-bold">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>
                        Dãy {currentSeatInfo.col} — Bàn {currentSeatInfo.row} (G{currentSeatInfo.seatIdx + 1})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-700 font-semibold">
                      <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>Chưa xếp chỗ</span>
                    </div>
                  )}

                  {currentSeatInfo && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSeat(currentSeatInfo!.row, currentSeatInfo!.col, currentSeatInfo!.seatIdx, undefined);
                        showToast(`Đã gỡ em ${s.name} khỏi chỗ ngồi`);
                      }}
                      className="text-slate-400 hover:text-rose-600 px-1 py-0.2 rounded hover:bg-rose-50 text-[9px]"
                      title="Gỡ khỏi ghế này"
                    >
                      Gỡ ghế
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL CÀI ĐẶT BỐ TRÍ PHÒNG HỌC */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-700" />
                <span>Cài Đặt Cấu Hình Phòng Học</span>
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Số Dãy Bàn</label>
                <select
                  value={seatingChart.columns || 4}
                  onChange={(e) =>
                    onUpdateSeatingChart({
                      ...seatingChart,
                      columns: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                >
                  <option value={3}>3 Dãy (Phòng học nhỏ)</option>
                  <option value={4}>4 Dãy (Chuẩn 4 Tổ THCS/THPT)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số Hàng Bàn Mỗi Dãy</label>
                <select
                  value={seatingChart.rows || 6}
                  onChange={(e) =>
                    onUpdateSeatingChart({
                      ...seatingChart,
                      rows: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                >
                  <option value={4}>4 Hàng</option>
                  <option value={5}>5 Hàng</option>
                  <option value={6}>6 Hàng (Chuẩn lớp 40-45 HS)</option>
                  <option value={7}>7 Hàng</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số Ghế Mỗi Bàn</label>
                <select
                  value={seatingChart.seatsPerDesk || 2}
                  onChange={(e) =>
                    onUpdateSeatingChart({
                      ...seatingChart,
                      seatsPerDesk: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                >
                  <option value={2}>2 Ghế / Bàn (Bàn đôi tiêu chuẩn)</option>
                  <option value={3}>3 Ghế / Bàn (Bàn ba học sinh)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vị Trí Bàn GV</label>
                  <select
                    value={seatingChart.teacherDeskPosition || 'left'}
                    onChange={(e) =>
                      onUpdateSeatingChart({
                        ...seatingChart,
                        teacherDeskPosition: e.target.value as 'left' | 'right',
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="left">Bên Trái bục giảng</option>
                    <option value="right">Bên Phải bục giảng</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vị Trí Cửa Ra Vào</label>
                  <select
                    value={seatingChart.doorPosition || 'right'}
                    onChange={(e) =>
                      onUpdateSeatingChart({
                        ...seatingChart,
                        doorPosition: e.target.value as 'left' | 'right',
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="right">Cửa Bên Phải</option>
                    <option value="left">Cửa Bên Trái</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiêu Đề Bảng Lớp Học</label>
                <input
                  type="text"
                  value={seatingChart.boardLabel || ''}
                  onChange={(e) =>
                    onUpdateSeatingChart({
                      ...seatingChart,
                      boardLabel: e.target.value,
                    })
                  }
                  placeholder="BẢNG LỚP HỌC & MÀN CHIẾU — PHÒNG 4"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium"
                />
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Hoàn Tất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GHI CHÚ VỊ TRÍ CHỖ NGỒI */}
      {seatNoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 mb-2">Thêm Ghi Chú Cho Vị Trí Ghế</h4>
            <input
              type="text"
              autoFocus
              value={seatNoteModal.currentNote}
              onChange={(e) =>
                setSeatNoteModal({ ...seatNoteModal, currentNote: e.target.value })
              }
              placeholder="VD: Cận thị, Chiều cao khiêm tốn, Kèm nề nếp..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium mb-3"
            />
            <div className="flex justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setSeatNoteModal(null)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const [r, c, idx] = seatNoteModal.seatKey.split('-').map(Number);
                  updateSeat(r, c, idx, undefined, seatNoteModal.currentNote);
                  setSeatNoteModal(null);
                  showToast('Đã lưu ghi chú vị trí ghế');
                }}
                className="px-4 py-1.5 bg-emerald-800 text-white rounded-lg"
              >
                Lưu Ghi Chú
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IN SƠ ĐỒ LỚP HỌC (PRINT PREVIEW A4) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex flex-col p-2 sm:p-4 overflow-y-auto">
          <div className="max-w-5xl w-full mx-auto bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto border border-slate-700">
            {/* Header modal & Print toolbar */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>In Sơ Đồ Chỗ Ngồi Lớp Học</span>
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-600/30 text-emerald-300 rounded-full border border-emerald-500/30 font-semibold">
                      Chuẩn A4 • 1 Trang duy nhất
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Chỉ in cấu trúc sơ đồ lớp, cửa vào, bàn giáo viên, bảng và vị trí học sinh rõ nét
                  </p>
                </div>
              </div>

              {/* Toolbar controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Orientation toggle */}
                <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setPrintOrientation('landscape')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      printOrientation === 'landscape'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Khổ ngang: Rộng rãi nhất cho 4 dãy bàn"
                  >
                    Khổ Ngang (A4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintOrientation('portrait')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      printOrientation === 'portrait'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Khổ dọc"
                  >
                    Khổ Dọc (A4)
                  </button>
                </div>

                {/* Scope toggle: Classroom only vs Full official */}
                <button
                  type="button"
                  onClick={() => setPrintIncludeHeaderFooter(!printIncludeHeaderFooter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    !printIncludeHeaderFooter
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                  title="Bấm để chuyển đổi giữa chỉ in sơ đồ lớp tối giản hoặc kèm quốc hiệu/chữ ký"
                >
                  {!printIncludeHeaderFooter ? 'Chỉ sơ đồ lớp (Khuyên dùng)' : 'Kèm Quốc hiệu & Chữ ký'}
                </button>

                {/* Print button */}
                <button
                  type="button"
                  onClick={handleDirectPrintSinglePage}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  title="In trực tiếp 1 bản duy nhất ra máy in hoặc lưu PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Đúng 1 Bản</span>
                </button>

                {/* Close modal */}
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Khung trang A4 để in (Clean Single-Page Printable Layout) */}
            <div
              className={`p-6 bg-white text-slate-950 print:p-0 print:m-0 overflow-auto flex flex-col justify-between ${
                printOrientation === 'landscape' ? 'aspect-[1.414/1] min-h-[580px]' : 'aspect-[1/1.414] min-h-[720px]'
              }`}
              id="printable-seating-chart"
            >
              {/* PHẦN TIÊU ĐỀ BẢN IN */}
              {printIncludeHeaderFooter ? (
                /* Quốc hiệu & Tên trường đầy đủ */
                <div className="flex justify-between items-start pb-2 border-b-2 border-slate-900 mb-2.5 text-center">
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-700">
                      {classInfo.schoolName || 'TRƯỜNG THCS VÀ THPT PHÚ THÀNH'}
                    </div>
                    <div className="text-xs font-black text-slate-900 uppercase">
                      LỚP: {classInfo.className || '9A1'} — NĂM HỌC {classInfo.academicYear || '2026 - 2027'}
                    </div>
                    <div className="text-[9px] text-slate-600 font-semibold">
                      Phòng: {classInfo.room || 'Phòng 4 — Dãy cũ, Tầng trệt'}
                    </div>
                  </div>

                  <div className="text-center">
                    <h1 className="text-sm font-black uppercase tracking-wider text-slate-900">
                      SƠ ĐỒ BỐ TRÍ CHỖ NGỒI HỌC SINH
                    </h1>
                    <p className="text-[9px] text-slate-600 italic">
                      GVCN: <strong>{classInfo.homeroomTeacher || 'Dương Văn Trong'}</strong> | Sĩ số:{' '}
                      <strong>{students.length}</strong> học sinh (Nam: {classInfo.maleCount || 20}, Nữ:{' '}
                      {classInfo.femaleCount || 22})
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-[9px] font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                    <div className="text-[8.5px] font-semibold text-slate-700">Độc lập - Tự do - Hạnh phúc</div>
                    <div className="text-[8px] text-slate-500 italic mt-0.5">
                      Ban hành: {seatingChart.updatedAt || new Date().toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
              ) : (
                /* Tiêu đề tối giản: Tối ưu 100% diện tích cho sơ đồ lớp */
                <div className="flex justify-between items-center pb-2 border-b-2 border-slate-900 mb-2 px-1">
                  <div className="text-left">
                    <span className="text-xs uppercase font-extrabold text-slate-700 mr-2">
                      {classInfo.schoolName || 'TRƯỜNG THCS VÀ THPT PHÚ THÀNH'}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      • Phòng: {classInfo.room || 'Phòng 4'}
                    </span>
                  </div>

                  <div className="text-center">
                    <h1 className="text-sm font-black uppercase tracking-widest text-slate-950">
                      SƠ ĐỒ CHỖ NGỒI LỚP {classInfo.className || '9A1'}
                    </h1>
                    <div className="text-[9px] text-slate-600 font-semibold">
                      Năm học {classInfo.academicYear || '2026 - 2027'}
                    </div>
                  </div>

                  <div className="text-right text-[10px] text-slate-700 font-bold">
                    GVCN: <span className="text-slate-950 font-black">{classInfo.homeroomTeacher || 'Dương Văn Trong'}</span> | Sĩ số:{' '}
                    <span className="font-black">{students.length}</span> HS
                  </div>
                </div>
              )}

              {/* KHU VỰC PHÍA TRƯỚC PHÒNG HỌC: CỬA VÀO, BÀN GIÁO VIÊN VÀ BẢNG LỚP HỌC */}
              <div className="mb-2.5 bg-slate-100 border-2 border-slate-900 rounded-lg p-1.5 flex items-center justify-between gap-2 shadow-2xs">
                {/* 1. Cửa vào bên Trái (nếu cấu hình doorPosition === 'left') */}
                {seatingChart.doorPosition === 'left' && (
                  <div className="flex-shrink-0 px-3 py-1 bg-amber-100 border-2 border-amber-800 rounded text-[9.5px] font-black text-amber-950 flex items-center gap-1.5 uppercase">
                    <span>🚪 CỬA RA VÀO CHÍNH (VÀO ➡️)</span>
                  </div>
                )}

                {/* 2. Bàn Giáo Viên bên Trái (nếu cấu hình teacherDeskPosition === 'left') */}
                {seatingChart.teacherDeskPosition === 'left' && (
                  <div className="flex-shrink-0 px-3 py-1 bg-slate-200 border-2 border-slate-800 rounded text-[9.5px] font-black text-slate-900 flex items-center gap-1.5">
                    <span>🪑 BÀN GIÁO VIÊN: {classInfo.homeroomTeacher || 'Dương Văn Trong'}</span>
                  </div>
                )}

                {/* 3. BẢNG PHẤN & BỤC GIẢNG CHÍNH GIỮA */}
                <div className="flex-1 bg-emerald-900 border-2 border-emerald-950 rounded py-1 px-4 text-center text-emerald-100 font-black text-[10.5px] uppercase tracking-wider shadow-2xs">
                  [ BỤC GIẢNG & BẢNG LỚP HỌC ]
                </div>

                {/* 4. Bàn Giáo Viên bên Phải (nếu cấu hình teacherDeskPosition === 'right') */}
                {seatingChart.teacherDeskPosition === 'right' && (
                  <div className="flex-shrink-0 px-3 py-1 bg-slate-200 border-2 border-slate-800 rounded text-[9.5px] font-black text-slate-900 flex items-center gap-1.5">
                    <span>🪑 BÀN GIÁO VIÊN: {classInfo.homeroomTeacher || 'Dương Văn Trong'}</span>
                  </div>
                )}

                {/* 5. Cửa vào bên Phải (nếu cấu hình doorPosition === 'right' hoặc mặc định) */}
                {seatingChart.doorPosition !== 'left' && (
                  <div className="flex-shrink-0 px-3 py-1 bg-amber-100 border-2 border-amber-800 rounded text-[9.5px] font-black text-amber-950 flex items-center gap-1.5 uppercase">
                    <span>(⬅️ VÀO) 🚪 CỬA RA VÀO CHÍNH</span>
                  </div>
                )}
              </div>

              {/* BẢNG LƯỚI CÁC DÃY BÀN VÀ VỊ TRÍ HỌC SINH */}
              <div
                className="grid gap-2.5 flex-1 mb-2"
                style={{
                  gridTemplateColumns: `repeat(${seatingChart.columns || 4}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: seatingChart.columns || 4 }).map((_, colIdx) => {
                  const col = colIdx + 1;
                  return (
                    <div
                      key={col}
                      className="border-2 border-slate-900 rounded-lg p-1.5 bg-white flex flex-col justify-between"
                    >
                      {/* Tiêu đề Dãy / Tổ */}
                      <div className="text-center font-black text-[10px] bg-slate-200 border border-slate-800 py-0.5 mb-1.5 uppercase tracking-wide rounded">
                        DÃY {col} • TỔ {col}
                      </div>

                      {/* Các bàn trong dãy */}
                      <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                        {Array.from({ length: seatingChart.rows || 6 }).map((_, rowIdx) => {
                          const row = rowIdx + 1;
                          const s0 = getSeat(row, col, 0);
                          const s1 = getSeat(row, col, 1);
                          const st0 = s0.studentId ? studentMap.get(s0.studentId) : null;
                          const st1 = s1.studentId ? studentMap.get(s1.studentId) : null;
                          const st0Info = st0 ? formatSeatingStudentName(st0, students, nameDisplayMode) : null;
                          const st1Info = st1 ? formatSeatingStudentName(st1, students, nameDisplayMode) : null;

                          return (
                            <div
                              key={row}
                              className="border border-slate-500 p-1 rounded bg-slate-50 text-[9px] flex flex-col justify-center"
                            >
                              <div className="text-[7.5px] text-slate-500 font-bold uppercase text-center mb-0.5">
                                BÀN {row}
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-center font-medium">
                                {/* Vị trí 1 (Trái) */}
                                <div
                                  className="border border-slate-400 p-1 bg-white rounded flex flex-col items-center justify-center min-h-[26px]"
                                  title={st0 ? `Họ tên: ${st0.name} (${st0.gender})` : 'Ghế trống'}
                                >
                                  {st0 ? (
                                    <>
                                      <div className="font-black text-slate-950 text-[9.5px] leading-tight break-words w-full">
                                        {st0.stt}. {st0Info?.displayName}
                                      </div>
                                      <div className="text-[7.5px] text-slate-500 font-bold flex items-center justify-center gap-0.5 mt-0.5">
                                        <span>({st0.gender === 'Nam' ? 'N' : 'Nữ'})</span>
                                        {st0.roleInClass && (
                                          <span className="text-emerald-800 font-black">[{st0.roleInClass}]</span>
                                        )}
                                      </div>
                                    </>
                                  ) : (
                                    <span className="text-slate-400 italic text-[8.5px]">- Trống -</span>
                                  )}
                                </div>

                                {/* Vị trí 2 (Phải) */}
                                <div
                                  className="border border-slate-400 p-1 bg-white rounded flex flex-col items-center justify-center min-h-[26px]"
                                  title={st1 ? `Họ tên: ${st1.name} (${st1.gender})` : 'Ghế trống'}
                                >
                                  {st1 ? (
                                    <>
                                      <div className="font-black text-slate-950 text-[9.5px] leading-tight break-words w-full">
                                        {st1.stt}. {st1Info?.displayName}
                                      </div>
                                      <div className="text-[7.5px] text-slate-500 font-bold flex items-center justify-center gap-0.5 mt-0.5">
                                        <span>({st1.gender === 'Nam' ? 'N' : 'Nữ'})</span>
                                        {st1.roleInClass && (
                                          <span className="text-emerald-800 font-black">[{st1.roleInClass}]</span>
                                        )}
                                      </div>
                                    </>
                                  ) : (
                                    <span className="text-slate-400 italic text-[8.5px]">- Trống -</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* LỐI ĐI HÀNH LANG & HƯỚNG CUỐI LỚP */}
              <div className="text-center text-[8px] font-bold text-slate-400 uppercase py-0.5 border-t border-dashed border-slate-300">
                [ HÀNG GHẾ CUỐI LỚP • HÀNH LANG LỚP HỌC ]
              </div>

              {/* CHÂN TRANG & CHỮ KÝ (NẾU BẬT CHẾ ĐỘ CHÍNH THỨC) */}
              {printIncludeHeaderFooter && (
                <div className="flex justify-between items-start pt-2 border-t border-slate-900 text-[9.5px] font-semibold text-center mt-1">
                  <div>
                    <div className="font-bold">LỚP TRƯỞNG</div>
                    <div className="text-[8px] text-slate-400 italic mb-7">(Ký và ghi rõ họ tên)</div>
                    <div className="font-bold text-slate-900">
                      {classInfo.boardOfLeaders?.monitor?.split('(')[0]?.trim() || 'Trần Minh Anh'}
                    </div>
                  </div>

                  <div>
                    <div className="italic text-[8.5px] text-slate-600 mb-0.5">
                      Phú Thành, ngày ..... tháng ..... năm 2026
                    </div>
                    <div className="font-bold uppercase text-slate-900">GIÁO VIÊN CHỦ NHIỆM</div>
                    <div className="text-[8px] text-slate-400 italic mb-7">(Ký và ghi rõ họ tên)</div>
                    <div className="font-black text-xs text-slate-950">
                      {classInfo.homeroomTeacher || 'Dương Văn Trong'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PHÂN CÔNG / ĐỔI CHỨC VỤ BAN CÁN SỰ */}
      <GvcnRoleAssignmentModal
        isOpen={!!roleModalStudent}
        student={roleModalStudent}
        onClose={() => setRoleModalStudent(null)}
        onSaveRole={handleSaveRole}
      />

      {/* MODAL XÁC NHẬN XÓA HỌC SINH KHỎI LỚP */}
      <GvcnDeleteStudentModal
        isOpen={!!deleteModalStudent}
        student={deleteModalStudent}
        onClose={() => setDeleteModalStudent(null)}
        onConfirmDelete={handleConfirmDeleteStudent}
      />

      {/* MODAL THÊM HỌC SINH NHANH */}
      <GvcnQuickAddStudentModal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        onAddStudent={handleAddStudent}
        existingStudents={students}
      />

      {/* BẢNG NHỎ THÔNG TIN & VỊ TRÍ HỌC SINH KHI RÊ CHUỘT */}
      <GvcnStudentHoverCard data={hoveredData} />
    </div>
  );
};
