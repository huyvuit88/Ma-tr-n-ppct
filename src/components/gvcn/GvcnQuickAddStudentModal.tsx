import React, { useState } from 'react';
import { UserPlus, X, Check, AlertCircle } from 'lucide-react';
import { GvcnStudent } from '../../types';
import { BAN_CAN_SU_ROLE_PRESETS } from './gvcnSeatingUtils';

interface GvcnQuickAddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (newStudent: GvcnStudent) => void;
  existingStudents: GvcnStudent[];
}

export const GvcnQuickAddStudentModal: React.FC<GvcnQuickAddStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
  existingStudents,
}) => {
  const nextStt =
    existingStudents.length > 0 ? Math.max(...existingStudents.map((s) => s.stt || 0)) + 1 : 1;

  const [stt, setStt] = useState<number>(nextStt);
  const [name, setName] = useState<string>('');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [group, setGroup] = useState<1 | 2 | 3 | 4>(1);
  const [role, setRole] = useState<string>('Học sinh');
  const [dob, setDob] = useState<string>('2012-01-01');
  const [parentName, setParentName] = useState<string>('');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      const calcStt =
        existingStudents.length > 0 ? Math.max(...existingStudents.map((s) => s.stt || 0)) + 1 : 1;
      setStt(calcStt);
      setName('');
      setGender('Nam');
      setGroup(1);
      setRole('Học sinh');
      setParentName('');
      setParentPhone('');
      setNote('');
      setErrorMsg(null);
    }
  }, [isOpen, existingStudents]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('Vui lòng nhập Họ và Tên của học sinh');
      return;
    }

    const newStudent: GvcnStudent = {
      id: `std-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      stt: Number(stt) || nextStt,
      studentCode: `2100${String(stt).padStart(4, '0')}`,
      name: cleanName,
      gender,
      dob,
      group: Number(group) as 1 | 2 | 3 | 4,
      role: role.trim() || 'Học sinh',
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      note: note.trim() || undefined,
      category: 'normal',
    };

    onAddStudent(newStudent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase">
                Thêm Học Sinh Vào Lớp
              </h3>
              <p className="text-xs text-slate-500">Cập nhật ngay vào danh sách lớp & sơ đồ chỗ ngồi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-4 gap-2.5">
            <div className="col-span-1">
              <label className="block font-bold text-slate-700 mb-1">Số TT</label>
              <input
                type="number"
                min={1}
                value={stt}
                onChange={(e) => setStt(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-black text-center text-slate-900"
              />
            </div>

            <div className="col-span-3">
              <label className="block font-bold text-slate-700 mb-1">
                Họ và Tên Học Sinh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="VD: Nguyễn Hoàng Nam..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Giới tính</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Nam' | 'Nữ')}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tổ sinh hoạt</label>
              <select
                value={group}
                onChange={(e) => setGroup(parseInt(e.target.value, 10) as 1 | 2 | 3 | 4)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
              >
                <option value={1}>Tổ 1</option>
                <option value={2}>Tổ 2</option>
                <option value={3}>Tổ 3</option>
                <option value={4}>Tổ 4</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngày sinh</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-[11px] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Chức vụ cán sự lớp</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
            >
              <option value="Học sinh">Học sinh (Thành viên)</option>
              {BAN_CAN_SU_ROLE_PRESETS.map((p) => (
                <option key={p.role} value={p.role}>
                  {p.emoji} {p.role}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Họ tên Phụ huynh</label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="VD: Nguyễn Văn Ba"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Số ĐT Phụ huynh</label>
              <input
                type="text"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="09xx..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi chú (Thị lực / Chiều cao...)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Cận thị 2 độ, ngồi bàn đầu..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md shadow-emerald-200 flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Thêm Học Sinh</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
