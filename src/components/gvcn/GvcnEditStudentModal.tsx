import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Users,
  Calendar,
  Phone,
  MapPin,
  FileText,
  Award,
  CheckCircle2,
  Shield,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';
import { GvcnStudent, GvcnClassInfo } from '../../types';

interface GvcnEditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: GvcnStudent | null;
  onSave: (updated: GvcnStudent) => void;
  classInfo?: GvcnClassInfo;
}

export const GvcnEditStudentModal: React.FC<GvcnEditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  onSave,
  classInfo,
}) => {
  const [formData, setFormData] = useState<Partial<GvcnStudent>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (student) {
      setFormData({
        ...student,
      });
      setErrors({});
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Vui lòng nhập họ và tên học sinh';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const updated: GvcnStudent = {
      ...student,
      stt: Number(formData.stt) || student.stt,
      name: (formData.name || '').trim(),
      studentCode: (formData.studentCode || '').trim() || student.studentCode,
      gender: (formData.gender as 'Nam' | 'Nữ') || student.gender,
      dob: (formData.dob || '').trim() || student.dob,
      group: (Number(formData.group) as 1 | 2 | 3 | 4) || student.group || 1,
      role: (formData.role || '').trim() || 'Học sinh',
      category: formData.category || student.category || 'normal',
      parentName: (formData.parentName || '').trim() || student.parentName,
      parentPhone: (formData.parentPhone || '').trim() || student.parentPhone,
      address: (formData.address || '').trim() || student.address,
      note: (formData.note || '').trim() || student.note,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
              <User className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Chỉnh Sửa Thông Tin Học Sinh</span>
                <span className="px-2 py-0.5 text-xs bg-emerald-600/80 text-white rounded-full font-bold">
                  STT #{student.stt}
                </span>
              </h3>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                {classInfo ? `${classInfo.className} • Năm học ${classInfo.academicYear}` : 'Hồ sơ học sinh'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Section 1: Thông tin cơ bản */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>Thông tin cơ bản & Hồ sơ lớp</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* STT */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  STT trong sổ
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.stt || ''}
                  onChange={(e) => setFormData({ ...formData, stt: parseInt(e.target.value) || 1 })}
                  className="w-full text-xs font-bold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Họ và tên */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className={`w-full text-xs font-bold border rounded-lg px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 ${
                    errors.name ? 'border-rose-500 bg-rose-50' : 'border-slate-300'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
              </div>

              {/* Mã vnEdu */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã học sinh (VnEdu)
                </label>
                <input
                  type="text"
                  value={formData.studentCode || ''}
                  onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                  placeholder="VNE9A1001"
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Giới tính */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giới tính
                </label>
                <select
                  value={formData.gender || 'Nam'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>

              {/* Ngày sinh */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày sinh (dd/mm/yyyy)
                </label>
                <input
                  type="text"
                  value={formData.dob || ''}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  placeholder="15/08/2011"
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Phân tổ */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tổ sinh hoạt
                </label>
                <select
                  value={formData.group || 1}
                  onChange={(e) => setFormData({ ...formData, group: Number(e.target.value) as any })}
                  className="w-full text-xs font-bold border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={1}>Tổ 1</option>
                  <option value={2}>Tổ 2</option>
                  <option value={3}>Tổ 3</option>
                  <option value={4}>Tổ 4</option>
                </select>
              </div>

              {/* Chức vụ ban cán sự */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chức vụ trong lớp
                </label>
                <select
                  value={formData.role || 'Học sinh'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Học sinh">Học sinh</option>
                  <option value="Lớp trưởng">Lớp trưởng</option>
                  <option value="Lớp phó học tập">Lớp phó học tập</option>
                  <option value="Lớp phó lao động">Lớp phó lao động</option>
                  <option value="Lớp phó văn thể">Lớp phó văn thể</option>
                  <option value="Tổ trưởng Tổ 1">Tổ trưởng Tổ 1</option>
                  <option value="Tổ trưởng Tổ 2">Tổ trưởng Tổ 2</option>
                  <option value="Tổ trưởng Tổ 3">Tổ trưởng Tổ 3</option>
                  <option value="Tổ trưởng Tổ 4">Tổ trưởng Tổ 4</option>
                  <option value="Tổ phó Tổ 1">Tổ phó Tổ 1</option>
                  <option value="Tổ phó Tổ 2">Tổ phó Tổ 2</option>
                  <option value="Tổ phó Tổ 3">Tổ phó Tổ 3</option>
                  <option value="Tổ phó Tổ 4">Tổ phó Tổ 4</option>
                  <option value="Thủ quỹ">Thủ quỹ</option>
                </select>
              </div>

              {/* Đối tượng phân loại */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phân loại đối tượng
                </label>
                <select
                  value={formData.category || 'normal'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="normal">Bình thường (Đại trà)</option>
                  <option value="gifted">Học sinh giỏi / Năng khiếu</option>
                  <option value="special_care">Cần quan tâm / Uốn nắn đặc biệt</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin gia đình & liên lạc */}
          <div className="pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Thông tin gia đình & Liên lạc phụ huynh</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ tên Cha / Mẹ / Người giám hộ
                </label>
                <input
                  type="text"
                  value={formData.parentName || ''}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn Hải"
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại liên lạc
                </label>
                <input
                  type="text"
                  value={formData.parentPhone || ''}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder="0912.345.678"
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ thường trú / Nơi ở hiện nay
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Thôn/Xã, Huyện/Tỉnh..."
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Ghi chú của GVCN */}
          <div className="pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ghi chú của GVCN (Sức khỏe, cá tính, lưu ý sư phạm)</span>
            </h4>
            <textarea
              rows={3}
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Nhập ghi chú riêng của thầy cô về em học sinh này..."
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu Thông Tin Học Sinh</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
