import React, { useState, useRef } from 'react';
import {
  Users,
  Upload,
  Download,
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Phone,
  Sparkles,
  BookOpen,
  UserPlus,
  Crown,
  Trash2,
  MapPin,
} from 'lucide-react';
import { GvcnStudent, GvcnClassInfo, GvcnSeatingChartConfig, GvcnSeatPosition } from '../../types';
import {
  parseVnEduStudentList,
  parseVnEduGradeSheet,
  generateSampleVnEduStudentExcel,
  generateSampleVnEduGradeExcel,
} from '../../utils/vneduExcel';
import { GvcnEditStudentModal } from './GvcnEditStudentModal';
import { GvcnRoleAssignmentModal } from './GvcnRoleAssignmentModal';
import { GvcnDeleteStudentModal } from './GvcnDeleteStudentModal';
import { GvcnStudentHoverCard, HoverStudentData } from './GvcnStudentHoverCard';
import { getBanCanSuInfo } from './gvcnSeatingUtils';

interface GvcnStudentGradesSectionProps {
  students: GvcnStudent[];
  classInfo: GvcnClassInfo;
  seatingChart?: GvcnSeatingChartConfig;
  onUpdateStudents: (updated: GvcnStudent[]) => void;
  onSelectStudent: (student: GvcnStudent) => void;
  onOpenAddStudent?: () => void;
  onEditStudent?: (student: GvcnStudent) => void;
  onDeleteStudent?: (studentId: string) => void;
  onUpdateStudent?: (student: GvcnStudent) => void;
}

export const GvcnStudentGradesSection: React.FC<GvcnStudentGradesSectionProps> = ({
  students,
  classInfo,
  seatingChart,
  onUpdateStudents,
  onSelectStudent,
  onOpenAddStudent,
  onEditStudent,
  onDeleteStudent,
  onUpdateStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<number | 'all'>('all');
  const [selectedRank, setSelectedRank] = useState<string | 'all'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingStudent, setEditingStudent] = useState<GvcnStudent | null>(null);
  const [hoveredData, setHoveredData] = useState<HoverStudentData | null>(null);
  const [deleteModalStudent, setDeleteModalStudent] = useState<GvcnStudent | null>(null);
  const [roleModalStudent, setRoleModalStudent] = useState<GvcnStudent | null>(null);

  const studentFileInputRef = useRef<HTMLInputElement>(null);
  const gradeFileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Hover xem thông tin và vị trí học sinh
  const handleStudentMouseEnter = (student: GvcnStudent, e: React.MouseEvent) => {
    let seatInfo = null;
    if (seatingChart?.seats) {
      const allSeats = Object.entries(seatingChart.seats) as [string, GvcnSeatPosition][];
      for (const [key, pos] of allSeats) {
        if (pos.studentId === student.id) {
          const otherIdx = pos.seatIndex === 0 ? 1 : 0;
          const otherKey = `${pos.deskRow}-${pos.deskCol}-${otherIdx}`;
          const otherSeat = seatingChart.seats[otherKey];
          const neighbor = otherSeat?.studentId ? students.find((st) => st.id === otherSeat.studentId) : null;
          seatInfo = {
            deskRow: pos.deskRow,
            deskCol: pos.deskCol,
            seatIndex: pos.seatIndex,
            side: pos.seatIndex === 0 ? ('Trái' as const) : ('Phải' as const),
            neighborName: neighbor?.name,
            note: pos.note,
          };
          break;
        }
      }
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setHoveredData({
      student,
      seatInfo,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleStudentMouseLeave = () => {
    setHoveredData(null);
  };

  // Lưu chức vụ ban cán sự
  const handleSaveRole = (student: GvcnStudent, newRole: string) => {
    const updated = { ...student, role: newRole };
    if (onUpdateStudent) {
      onUpdateStudent(updated);
    } else {
      onUpdateStudents(students.map((s) => (s.id === student.id ? updated : s)));
    }
    showNotification('success', `Đã cập nhật chức vụ của em ${student.name}: ${newRole || 'Học sinh'}`);
    setRoleModalStudent(null);
  };

  // Xóa học sinh khỏi lớp
  const handleConfirmDeleteStudent = (studentId: string) => {
    const target = students.find((s) => s.id === studentId);
    if (onDeleteStudent) {
      onDeleteStudent(studentId);
    } else {
      onUpdateStudents(students.filter((s) => s.id !== studentId));
    }
    showNotification('success', `Đã xóa học sinh ${target?.name || ''} khỏi danh sách lớp`);
    setDeleteModalStudent(null);
  };

  // Upload danh sách học sinh từ file Excel VnEdu
  const handleUploadStudentList = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const parsed = await parseVnEduStudentList(file);
      if (parsed.length === 0) {
        showNotification('error', 'Không tìm thấy dữ liệu học sinh hợp lệ trong file!');
      } else {
        onUpdateStudents(parsed);
        showNotification(
          'success',
          `Đã tải lên thành công ${parsed.length} học sinh từ file Excel VnEdu!`
        );
      }
    } catch (err: any) {
      console.error(err);
      showNotification('error', `Lỗi xử lý file Excel: ${err.message || 'Định dạng không hợp lệ'}`);
    } finally {
      setIsProcessing(false);
      if (studentFileInputRef.current) studentFileInputRef.current.value = '';
    }
  };

  // Upload bảng điểm từ file Excel VnEdu
  const handleUploadGradeSheet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const { updatedStudents, matchedCount } = await parseVnEduGradeSheet(file, students);
      if (matchedCount === 0) {
        showNotification('error', 'Không khớp được học sinh nào trong file bảng điểm với danh sách lớp hiện tại!');
      } else {
        onUpdateStudents(updatedStudents);
        showNotification(
          'success',
          `Đã cập nhật bảng điểm VnEdu cho ${matchedCount} học sinh thành công!`
        );
      }
    } catch (err: any) {
      console.error(err);
      showNotification('error', `Lỗi xử lý file bảng điểm: ${err.message || 'Định dạng không hợp lệ'}`);
    } finally {
      setIsProcessing(false);
      if (gradeFileInputRef.current) gradeFileInputRef.current.value = '';
    }
  };

  // Lọc danh sách học sinh
  const filteredStudents = students.filter((s) => {
    const matchGroup = selectedGroup === 'all' || s.group === selectedGroup;
    const hasGrades = typeof s.grades?.dtbChung === 'number';
    let matchRank = true;
    if (selectedRank === 'no_grade') {
      matchRank = !hasGrades;
    } else if (selectedRank === 'has_grade') {
      matchRank = hasGrades;
    } else if (selectedRank !== 'all') {
      matchRank = hasGrades && (s.tt22Evaluation?.hocTap === selectedRank);
    }

    const q = (searchQuery || '').toLowerCase();
    const matchSearch =
      (s.name || '').toLowerCase().includes(q) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(q)) ||
      (s.parentPhone || '').includes(searchQuery) ||
      (s.parentName || '').toLowerCase().includes(q);
    return matchGroup && matchRank && matchSearch;
  });

  const studentsWithoutGrades = students.filter(
    (s) => !s.grades || typeof s.grades.dtbChung !== 'number'
  ).length;

  return (
    <div className="space-y-5">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={studentFileInputRef}
        onChange={handleUploadStudentList}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />
      <input
        type="file"
        ref={gradeFileInputRef}
        onChange={handleUploadGradeSheet}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Top Banner & Actions Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-700" />
              <span>Quản Lý Hồ Sơ Lớp & Bảng Điểm VnEdu</span>
              <span className="px-2.5 py-0.5 text-xs bg-emerald-100 text-emerald-800 rounded-full font-bold">
                {students.length} Học sinh
              </span>
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Cho phép tải lên danh sách học sinh và bảng điểm theo mẫu vnEdu, đồng bộ điểm số và xem hồ sơ toàn diện 360°
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Thêm học sinh cụ thể từng em */}
            {onOpenAddStudent && (
              <button
                onClick={onOpenAddStudent}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs border border-emerald-600/40 cursor-pointer"
                title="Thêm học sinh mới vào danh sách lớp"
              >
                <UserPlus className="w-4 h-4 text-emerald-200" />
                <span>Thêm Học Sinh Mới</span>
              </button>
            )}

            {/* Tải lên DS học sinh */}
            <button
              onClick={() => studentFileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-200" />
              <span>Tải Lên DS Học Sinh (VnEdu)</span>
            </button>

            {/* Tải lên Bảng điểm */}
            <button
              onClick={() => gradeFileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-200" />
              <span>Tải Lên Bảng Điểm (VnEdu)</span>
            </button>

            {/* Tải file mẫu */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => generateSampleVnEduStudentExcel(classInfo.className)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200"
                title="Tải file Excel mẫu danh sách học sinh vnEdu"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Mẫu DS VnEdu</span>
              </button>

              <button
                onClick={() => generateSampleVnEduGradeExcel(classInfo.className)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200"
                title="Tải file Excel mẫu bảng điểm vnEdu"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Mẫu Bảng Điểm</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold animate-fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Search and Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-semibold">Tổ:</span>
              <button
                onClick={() => setSelectedGroup('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  selectedGroup === 'all'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Tất cả
              </button>
              {[1, 2, 3, 4].map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGroup(g)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    selectedGroup === g
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tổ {g}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 text-xs ml-0 sm:ml-2">
              <span className="text-slate-500 font-semibold">Học lực / Điểm số:</span>
              <select
                value={selectedRank}
                onChange={(e) => setSelectedRank(e.target.value)}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-100 border border-slate-200 rounded-lg focus:outline-hidden"
              >
                <option value="all">Tất cả ({students.length} HS)</option>
                <option value="no_grade">Chưa có điểm ({studentsWithoutGrades} HS)</option>
                <option value="has_grade">Đã có điểm ({students.length - studentsWithoutGrades} HS)</option>
                <option value="Tốt">Xếp loại Tốt (ĐTB ≥ 8.0)</option>
                <option value="Khá">Xếp loại Khá (ĐTB 6.5 - 7.9)</option>
                <option value="Đạt">Xếp loại Đạt (ĐTB 5.0 - 6.4)</option>
                <option value="Chưa đạt">Xếp loại Chưa đạt (&lt; 5.0)</option>
              </select>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tên, mã HS, số ĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Main Student and Grade Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {studentsWithoutGrades > 0 && (
          <div className="px-4 py-2.5 bg-amber-50/80 border-b border-amber-200/80 flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
              <span>
                <strong>Thông tin hồ sơ:</strong> Hiện có <strong>{studentsWithoutGrades}/{students.length}</strong> học sinh chỉ hiển thị thông tin lý lịch (chưa có điểm). Khi Thầy/Cô tải lên file <strong>Bảng Điểm VnEdu</strong>, điểm số và kết quả học lực sẽ tự động áp dụng vào hồ sơ.
              </span>
            </div>
            <button
              onClick={() => gradeFileInputRef.current?.click()}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 flex-shrink-0 shadow-2xs"
            >
              <Upload className="w-3 h-3" />
              <span>Tải Bảng Điểm Ngay</span>
            </button>
          </div>
        )}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3.5 py-3 text-center w-12">STT</th>
                <th className="px-3.5 py-3">Mã vnEdu</th>
                <th className="px-3.5 py-3">Họ và Tên</th>
                <th className="px-3.5 py-3 text-center">Giới Tính</th>
                <th className="px-3.5 py-3">Ngày Sinh</th>
                <th className="px-3.5 py-3 text-center">Tổ</th>
                <th className="px-3.5 py-3">Chức Vụ</th>
                <th className="px-3.5 py-3 text-center">ĐTB</th>
                <th className="px-3.5 py-3 text-center">Học Lực (TT22)</th>
                <th className="px-3.5 py-3 text-center">Rèn Luyện</th>
                <th className="px-3.5 py-3">Phụ Huynh & SĐT</th>
                <th className="px-3.5 py-3 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-500">
                    Không tìm thấy học sinh phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const evalData = s.tt22Evaluation;
                  const hasGrades = typeof s.grades?.dtbChung === 'number';
                  const dtb = hasGrades ? s.grades!.dtbChung! : null;
                  const hocLuc = hasGrades ? (evalData?.hocTap || (dtb! >= 8.0 ? 'Tốt' : dtb! >= 6.5 ? 'Khá' : dtb! >= 5.0 ? 'Đạt' : 'Chưa đạt')) : null;
                  const renLuyen = evalData?.renLuyen || 'Tốt';
                  const roleInfo = getBanCanSuInfo(s.role);

                  return (
                    <tr
                      key={s.id}
                      onClick={() => onSelectStudent(s)}
                      onMouseEnter={(e) => handleStudentMouseEnter(s, e)}
                      onMouseLeave={handleStudentMouseLeave}
                      className="hover:bg-emerald-50/60 transition-colors cursor-pointer group relative"
                    >
                      <td className="px-3.5 py-3 text-center font-bold text-slate-500">
                        {s.stt}
                      </td>

                      <td className="px-3.5 py-3 font-mono text-emerald-800 font-bold">
                        {s.studentCode || `VNE9A1${String(s.stt).padStart(3, '0')}`}
                      </td>

                      <td className="px-3.5 py-3">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 flex items-center gap-1.5">
                          <span>{s.name}</span>
                          {s.category === 'gifted' && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-md font-bold">
                              HSG
                            </span>
                          )}
                          {s.category === 'special_care' && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded-md font-bold">
                              Lưu ý
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3.5 py-3 text-center font-medium">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            s.gender === 'Nữ'
                              ? 'bg-pink-100 text-pink-700'
                              : 'bg-sky-100 text-sky-700'
                          }`}
                        >
                          {s.gender}
                        </span>
                      </td>

                      <td className="px-3.5 py-3 text-slate-600 font-mono text-[11px]">
                        {s.dob}
                      </td>

                      <td className="px-3.5 py-3 text-center font-bold text-slate-700">
                        Tổ {s.group}
                      </td>

                      <td className="px-3.5 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          {roleInfo.isLeader ? (
                            <button
                              type="button"
                              onClick={() => setRoleModalStudent(s)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 shadow-2xs transition-all hover:scale-105 cursor-pointer ${roleInfo.badgeClass}`}
                              title="Bấm để chỉnh sửa chức vụ ban cán sự"
                            >
                              <span>{roleInfo.emoji}</span>
                              <span className="whitespace-nowrap">{roleInfo.label}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setRoleModalStudent(s)}
                              className="text-slate-600 hover:text-emerald-700 text-xs font-medium flex items-center gap-1 group/role cursor-pointer"
                              title="Bấm để gán chức vụ ban cán sự"
                            >
                              <span>{s.role || 'Học sinh'}</span>
                              <Crown className="w-3 h-3 text-slate-300 group-hover/role:text-amber-500 transition-colors" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-3.5 py-3 text-center font-mono">
                        {dtb !== null ? (
                          <span className="font-black text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {dtb.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold" title="Chưa có điểm">—</span>
                        )}
                      </td>

                      <td className="px-3.5 py-3 text-center font-bold">
                        {hocLuc ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                              hocLuc === 'Tốt'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : hocLuc === 'Khá'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : hocLuc === 'Đạt'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {hocLuc}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500 border border-slate-200">
                            Chưa có điểm
                          </span>
                        )}
                      </td>

                      <td className="px-3.5 py-3 text-center font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                            renLuyen === 'Tốt'
                              ? 'bg-emerald-100 text-emerald-800'
                              : renLuyen === 'Khá'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {renLuyen}
                        </span>
                      </td>

                      <td className="px-3.5 py-3">
                        <div className="text-[11px]">
                          <span className="font-semibold text-slate-800 block truncate max-w-[140px]">
                            {s.parentName}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">
                            {s.parentPhone}
                          </span>
                        </div>
                      </td>

                      <td className="px-3.5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectStudent(s)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all shadow-2xs border border-emerald-200 cursor-pointer"
                            title="Xem chi tiết hồ sơ toàn diện 360°"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="hidden sm:inline">Hồ sơ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRoleModalStudent(s)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all shadow-2xs border border-amber-200 cursor-pointer"
                            title="Gán hoặc chỉnh sửa chức vụ ban cán sự"
                          >
                            <Crown className="w-3.5 h-3.5 text-amber-600" />
                            <span className="hidden md:inline">Chức vụ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onEditStudent) {
                                onEditStudent(s);
                              } else {
                                setEditingStudent(s);
                              }
                            }}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all shadow-2xs border border-indigo-200 cursor-pointer"
                            title="Tùy chỉnh, chỉnh sửa thông tin học sinh"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModalStudent(s)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all shadow-2xs border border-rose-200 cursor-pointer"
                            title="Xóa học sinh khỏi danh sách lớp"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span className="hidden md:inline">Xóa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Hiển thị {filteredStudents.length} / {students.length} học sinh • Bấm vào bất kỳ dòng nào để mở <strong>Hồ Sơ Toàn Diện 360°</strong>
          </span>
          <div className="flex items-center gap-4">
            <span>Tốt: {students.filter((s) => (s.grades?.dtbChung || 7.5) >= 8.0).length} HS</span>
            <span>Khá: {students.filter((s) => (s.grades?.dtbChung || 7.5) >= 6.5 && (s.grades?.dtbChung || 7.5) < 8.0).length} HS</span>
            <span>Đạt: {students.filter((s) => (s.grades?.dtbChung || 7.5) < 6.5).length} HS</span>
          </div>
        </div>
      </div>

      {/* Modal Tùy chỉnh chỉnh sửa thông tin học sinh */}
      <GvcnEditStudentModal
        isOpen={!!editingStudent}
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
        onSave={(updated) => {
          const nextList = students.map((st) => (st.id === updated.id ? updated : st));
          onUpdateStudents(nextList);
          showNotification('success', `Đã cập nhật thông tin học sinh ${updated.name} thành công!`);
        }}
        classInfo={classInfo}
      />

      {/* Modal Phân công / Đổi chức vụ ban cán sự */}
      <GvcnRoleAssignmentModal
        isOpen={!!roleModalStudent}
        student={roleModalStudent}
        onClose={() => setRoleModalStudent(null)}
        onSaveRole={handleSaveRole}
      />

      {/* Modal Xác nhận xóa học sinh */}
      <GvcnDeleteStudentModal
        isOpen={!!deleteModalStudent}
        student={deleteModalStudent}
        onClose={() => setDeleteModalStudent(null)}
        onConfirmDelete={handleConfirmDeleteStudent}
      />

      {/* Bảng nhỏ thông tin & vị trí học sinh khi rê chuột */}
      <GvcnStudentHoverCard data={hoveredData} />
    </div>
  );
};
