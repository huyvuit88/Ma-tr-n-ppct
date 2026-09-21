import React, { useState, useEffect } from 'react';
import { UserPlus, X, AlertCircle, CheckCircle2, User, Phone, MapPin, Calendar, Users, Award, HeartHandshake } from 'lucide-react';
import { GvcnStudent, GvcnTT22Evaluation } from '../../types';

interface GvcnAddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (newStudent: GvcnStudent) => void;
  existingStudents: GvcnStudent[];
}

export const GvcnAddStudentModal: React.FC<GvcnAddStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
  existingStudents,
}) => {
  // Auto calculate next STT
  const nextStt = existingStudents.length > 0
    ? Math.max(...existingStudents.map((s) => s.stt || 0)) + 1
    : 1;

  const [stt, setStt] = useState<number>(nextStt);
  const [studentCode, setStudentCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [dob, setDob] = useState<string>('2012-01-01');
  const [group, setGroup] = useState<1 | 2 | 3 | 4>(1);
  const [role, setRole] = useState<string>('Học sinh');
  const [category, setCategory] = useState<'normal' | 'gifted' | 'difficult' | 'special_care'>('normal');
  const [parentName, setParentName] = useState<string>('');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [studentPhone, setStudentPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const calcStt = existingStudents.length > 0
        ? Math.max(...existingStudents.map((s) => s.stt || 0)) + 1
        : 1;
      setStt(calcStt);
      setStudentCode(`2100${String(calcStt).padStart(4, '0')}`);
      setName('');
      setGender('Nam');
      setDob('2012-01-01');
      setGroup(((calcStt % 4) + 1) as 1 | 2 | 3 | 4);
      setRole('Học sinh');
      setCategory('normal');
      setParentName('');
      setParentPhone('');
      setStudentPhone('');
      setAddress('');
      setNote('');
      setErrorMsg(null);
    }
  }, [isOpen, existingStudents]);

  if (!isOpen) return null;

  // Format date to DD/MM/YYYY
  const formatDobDisplay = (val: string) => {
    if (!val) return '';
    if (val.includes('-')) {
      const [y, m, d] = val.split('-');
      return `${d}/${m}/${y}`;
    }
    return val;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('Vui lòng nhập họ và tên học sinh!');
      return;
    }

    if (existingStudents.some((s) => s.name.toLowerCase() === cleanName.toLowerCase() && s.dob === formatDobDisplay(dob))) {
      if (!window.confirm(`Đã có học sinh trùng họ tên "${cleanName}" trong lớp. Thầy/Cô có muốn tiếp tục thêm?`)) {
        return;
      }
    }

    const uniqueId = `student-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const formattedDob = formatDobDisplay(dob);

    // Initial pedagogy comments (without artificial grades!)
    const initialEvaluation: GvcnTT22Evaluation = {
      renLuyen: 'Tốt',
      hocTap: 'Chưa đánh giá',
      phamChat: 'Chăm ngoan, lễ phép, có tinh thần tương thân tương ái.',
      nangLuc: 'Chủ động trong các hoạt động học tập và sinh hoạt của tập thể.',
      nhanXetChung: `${cleanName} hòa đồng với bạn bè, chấp hành tốt nội quy trường lớp. Cần tiếp tục phát huy trong thời gian tới.`,
      khenThuong: 'Chưa xét',
      updatedAt: new Date().toISOString(),
    };

    const newStudent: GvcnStudent = {
      id: uniqueId,
      stt: Number(stt) || nextStt,
      studentCode: studentCode.trim() || undefined,
      name: cleanName,
      gender,
      dob: formattedDob,
      group,
      role: role.trim() || 'Học sinh',
      category,
      parentName: parentName.trim() || 'Phụ huynh em ' + cleanName,
      parentPhone: parentPhone.trim() || '0900000000',
      phone: studentPhone.trim() || undefined,
      address: address.trim() || undefined,
      note: note.trim() || undefined,
      tt22Evaluation: initialEvaluation,
    };

    onAddStudent(newStudent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <UserPlus className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Thêm mới học sinh vào lớp chủ nhiệm</h3>
              <p className="text-xs text-emerald-200/90">
                Nhập đầy đủ thông tin cá nhân, phân tổ, chức vụ và thông tin phụ huynh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Thông tin cơ bản */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-3 border-b border-slate-200 pb-2">
              <User className="w-4 h-4 text-emerald-700" />
              <span>1. Thông tin cá nhân học sinh</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Số TT <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={stt}
                  onChange={(e) => setStt(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs font-bold font-mono bg-slate-50 border border-slate-300 rounded-xl text-center focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Mã học sinh / vnEdu
                </label>
                <input
                  type="text"
                  placeholder="2100xxxx"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Giới tính <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'Nam' | 'Nữ')}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Ngày sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Phân tổ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={group}
                  onChange={(e) => setGroup(Number(e.target.value) as 1 | 2 | 3 | 4)}
                  className="w-full px-3 py-2 text-xs font-bold bg-emerald-50/60 border border-emerald-300 rounded-xl text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value={1}>Tổ 1</option>
                  <option value={2}>Tổ 2</option>
                  <option value={3}>Tổ 3</option>
                  <option value={4}>Tổ 4</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Chức vụ ban cán sự
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="Học sinh">Học sinh</option>
                  <option value="Lớp trưởng">Lớp trưởng</option>
                  <option value="Lớp phó học tập">Lớp phó học tập</option>
                  <option value="Lớp phó kỷ luật">Lớp phó kỷ luật</option>
                  <option value="Lớp phó lao động">Lớp phó lao động</option>
                  <option value="Bí thư Chi đội">Bí thư Chi đội</option>
                  <option value="Thủ quỹ">Thủ quỹ</option>
                  <option value="Tổ trưởng">Tổ trưởng</option>
                  <option value="Tổ phó">Tổ phó</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Phân loại & Đặc điểm */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-3 border-b border-slate-200 pb-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>2. Phân loại theo dõi sư phạm</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nhóm đối tượng
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="normal">Học sinh đại trà / Bình thường</option>
                  <option value="gifted">Học sinh có năng khiếu / Đội tuyển HSG</option>
                  <option value="difficult">Học sinh có hoàn cảnh gia đình khó khăn</option>
                  <option value="special_care">Học sinh cần quan tâm đặc biệt / Cần kèm cặp</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Số điện thoại học sinh (nếu có)
                </label>
                <input
                  type="tel"
                  placeholder="09xx..."
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Gia đình & Phụ huynh */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-3 border-b border-slate-200 pb-2">
              <HeartHandshake className="w-4 h-4 text-emerald-700" />
              <span>3. Thông tin gia đình & Sổ liên lạc</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-6">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Họ tên Cha / Mẹ / Người giám hộ
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ông Nguyễn Văn Bình (Bố)"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Số điện thoại liên lạc chính
                </label>
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-12">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Địa chỉ thường trú / Nơi ở hiện tại
                </label>
                <input
                  type="text"
                  placeholder="Số nhà, đường phố, thôn / xóm / tổ dân phố, xã / phường"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-12">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Ghi chú ban đầu của GVCN (Sức khỏe, hoàn cảnh, lưu ý)
                </label>
                <textarea
                  rows={2}
                  placeholder="Nhập các đặc điểm cần lưu ý (sức khỏe, vị trí ngồi phù hợp...)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm học sinh này</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
