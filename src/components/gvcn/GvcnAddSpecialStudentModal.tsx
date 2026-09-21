import React, { useState } from 'react';
import { X, UserPlus, HeartHandshake, Sparkles, CheckCircle2 } from 'lucide-react';
import { GvcnSpecialStudent, GvcnStudent } from '../../types';

interface GvcnAddSpecialStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: GvcnStudent[];
  onAddSpecialStudent: (student: GvcnSpecialStudent) => void;
}

export const GvcnAddSpecialStudentModal: React.FC<GvcnAddSpecialStudentModalProps> = ({
  isOpen,
  onClose,
  students,
  onAddSpecialStudent,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [type, setType] = useState<'yeu_kem' | 'kho_khan' | 'ca_biet' | 'tam_ly'>('yeu_kem');
  const [typeLabel, setTypeLabel] = useState<string>('Học lực môn Toán yếu / hổng kiến thức');
  const [circumstance, setCircumstance] = useState<string>('');
  const [pedagogicalMeasures, setPedagogicalMeasures] = useState<string>('');
  const [assignedBuddy, setAssignedBuddy] = useState<string>('');
  const [initialNote, setInitialNote] = useState<string>('Bắt đầu lập hồ sơ kèm cặp, theo dõi chuyển biến');

  if (!isOpen) return null;

  const handleTypeChange = (newType: 'yeu_kem' | 'kho_khan' | 'ca_biet' | 'tam_ly') => {
    setType(newType);
    if (newType === 'yeu_kem') {
      setTypeLabel('Học lực môn Toán yếu / hổng kiến thức');
      setPedagogicalMeasures('Xếp ngồi cùng bàn với bạn học khá giỏi theo mô hình "Đôi bạn cùng tiến"; giao bài tập mức độ nhận biết và động viên kịp thời.');
    } else if (newType === 'kho_khan') {
      setTypeLabel('Hoàn cảnh gia đình khó khăn / thiếu thốn');
      setPedagogicalMeasures('Đề xuất miễn giảm các khoản đóng góp tự nguyện; trao tặng sách vở/học bổng; liên hệ động viên gia đình thường xuyên.');
    } else if (newType === 'ca_biet') {
      setTypeLabel('Nề nếp / Đi muộn / Thiếu tập trung');
      setPedagogicalMeasures('Giao trách nhiệm phụ trách công việc chung của lớp; phối hợp chặt chẽ cùng phụ huynh kiểm soát giờ giấc buổi tối; uốn nắn bằng kỷ luật tích cực.');
    } else {
      setTypeLabel('Tâm lý lứa tuổi / Rụt rè / Chưa tự giác');
      setPedagogicalMeasures('Tạo cơ hội phát biểu câu hỏi dễ để tạo sự tự tin; phân công tổ trưởng đôn đốc trước 15 phút đầu giờ; lắng nghe và chia sẻ chân thành.');
    }
  };

  const handleStudentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    setSelectedStudentId(sId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const foundStudent = students.find((s) => s.id === selectedStudentId);
    if (!foundStudent) return;

    const newRecord: GvcnSpecialStudent = {
      id: `sp-${Date.now()}`,
      studentId: foundStudent.id,
      studentName: foundStudent.name,
      group: foundStudent.group,
      type,
      typeLabel: typeLabel.trim() || 'Học sinh cần quan tâm đặc biệt',
      circumstance: circumstance.trim() || 'Chưa cập nhật chi tiết hoàn cảnh',
      pedagogicalMeasures: pedagogicalMeasures.trim() || 'Phân công đôi bạn cùng tiến và theo dõi sát nề nếp hàng tuần.',
      assignedBuddy: assignedBuddy.trim() || undefined,
      progressNotes: [
        {
          date: new Date().toLocaleDateString('vi-VN'),
          note: initialNote.trim() || 'Lập hồ sơ theo dõi sư phạm',
          status: 'stable',
        },
      ],
    };

    onAddSpecialStudent(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Thêm Hồ Sơ Học Sinh Cần Quan Tâm Đặc Biệt
              </h3>
              <p className="text-xs text-blue-200/90 mt-0.5">
                Thiết lập kế hoạch kèm cặp, biện pháp sư phạm và đôi bạn cùng tiến
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1 scrollbar-thin text-xs">
          {/* Select Student */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Chọn Học Sinh Cần Theo Dõi <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={selectedStudentId}
              onChange={handleStudentSelect}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-semibold text-slate-800"
            >
              <option value="">-- Bấm để chọn học sinh trong danh sách lớp --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.stt}. {s.name} (Tổ {s.group}) — {s.gender}
                </option>
              ))}
            </select>
          </div>

          {/* Type of Special Attention */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Phân Loại Đối Tượng Cần Quan Tâm <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('yeu_kem')}
                className={`p-2 rounded-xl border text-center font-bold transition-all ${
                  type === 'yeu_kem'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-400/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Học lực yếu
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('kho_khan')}
                className={`p-2 rounded-xl border text-center font-bold transition-all ${
                  type === 'kho_khan'
                    ? 'bg-amber-50 border-amber-400 text-amber-800 ring-2 ring-amber-400/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Hoàn cảnh khó khăn
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('ca_biet')}
                className={`p-2 rounded-xl border text-center font-bold transition-all ${
                  type === 'ca_biet'
                    ? 'bg-purple-50 border-purple-400 text-purple-800 ring-2 ring-purple-400/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Nề nếp / Đi muộn
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('tam_ly')}
                className={`p-2 rounded-xl border text-center font-bold transition-all ${
                  type === 'tam_ly'
                    ? 'bg-blue-50 border-blue-400 text-blue-800 ring-2 ring-blue-400/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Tâm lý lứa tuổi
              </button>
            </div>
          </div>

          {/* Type Label */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tiêu Đề / Đặc Điểm Nhận Diện
            </label>
            <input
              type="text"
              required
              value={typeLabel}
              onChange={(e) => setTypeLabel(e.target.value)}
              placeholder="ví dụ: Học lực môn Toán yếu / thường xuyên quên bài tập..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium"
            />
          </div>

          {/* Circumstance */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Hoàn Cảnh Gia Đình & Nguyên Nhân Thực Tế
            </label>
            <textarea
              rows={2}
              value={circumstance}
              onChange={(e) => setCircumstance(e.target.value)}
              placeholder="Mô tả hoàn cảnh (cha mẹ đi làm ăn xa, ở với ông bà, hổng kiến thức từ lớp dưới, ham chơi game...)"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Pedagogical Measures */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Biện Pháp Sư Phạm Của GVCN (Kèm Cặp & Cảm Hóa)
            </label>
            <textarea
              rows={2}
              value={pedagogicalMeasures}
              onChange={(e) => setPedagogicalMeasures(e.target.value)}
              placeholder="Kế hoạch của GVCN: Đôi bạn cùng tiến, trao đổi phụ huynh, giao việc tự quản, kiểm tra nhẹ nhàng..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Assigned Buddy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Phân Công "Đôi Bạn Cùng Tiến"
              </label>
              <select
                value={assignedBuddy}
                onChange={(e) => setAssignedBuddy(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium"
              >
                <option value="">-- Chọn bạn học khá giỏi hỗ trợ --</option>
                {students
                  .filter((s) => s.id !== selectedStudentId)
                  .map((s) => (
                    <option key={s.id} value={`${s.name} (Tổ ${s.group})`}>
                      {s.name} (Tổ {s.group})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ghi Chú Tiến Độ Đầu Tiên
              </label>
              <input
                type="text"
                value={initialNote}
                onChange={(e) => setInitialNote(e.target.value)}
                placeholder="Ghi nhận ban đầu..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!selectedStudentId}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu Hồ Sơ Học Sinh</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
