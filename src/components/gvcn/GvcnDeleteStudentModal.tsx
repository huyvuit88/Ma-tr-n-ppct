import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { GvcnStudent } from '../../types';

interface GvcnDeleteStudentModalProps {
  isOpen: boolean;
  student: GvcnStudent | null;
  onClose: () => void;
  onConfirmDelete: (studentId: string) => void;
}

export const GvcnDeleteStudentModal: React.FC<GvcnDeleteStudentModalProps> = ({
  isOpen,
  student,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase">
                Xác Nhận Xóa Học Sinh
              </h3>
              <p className="text-xs text-slate-500">Thao tác này sẽ xóa em khỏi danh sách lớp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-6 text-xs text-slate-700">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
            <p className="font-semibold text-rose-950 mb-1">
              Bạn có chắc chắn muốn xóa học sinh:
            </p>
            <div className="text-sm font-black text-rose-900">
              #{student.stt} — {student.name} ({student.gender}, Tổ {student.group})
            </div>
            {student.role && student.role !== 'Học sinh' && (
              <div className="mt-1 text-[11px] font-bold text-amber-800">
                Chức vụ hiện tại: {student.role}
              </div>
            )}
          </div>

          <p className="text-slate-600">
            • Học sinh sẽ bị xóa khỏi danh sách học sinh của lớp.
            <br />
            • Vị trí chỗ ngồi trên sơ đồ (nếu đang ngồi) sẽ được giải phóng thành ghế trống.
            <br />
            • Bạn có thể thêm lại học sinh bất kỳ lúc nào qua nút <strong>"+ Thêm học sinh"</strong>.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete(student.id);
              onClose();
            }}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-200 flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xác Nhận Xóa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
