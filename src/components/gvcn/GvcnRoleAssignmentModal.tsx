import React, { useState } from 'react';
import { Award, Crown, X, Check, Trash2, ShieldAlert } from 'lucide-react';
import { GvcnStudent } from '../../types';
import { BAN_CAN_SU_ROLE_PRESETS, getBanCanSuInfo } from './gvcnSeatingUtils';

interface GvcnRoleAssignmentModalProps {
  isOpen: boolean;
  student: GvcnStudent | null;
  onClose: () => void;
  onSaveRole: (student: GvcnStudent, newRole: string) => void;
}

export const GvcnRoleAssignmentModal: React.FC<GvcnRoleAssignmentModalProps> = ({
  isOpen,
  student,
  onClose,
  onSaveRole,
}) => {
  const [selectedRole, setSelectedRole] = useState<string>(student?.role || 'Học sinh');
  const [customRoleInput, setCustomRoleInput] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  React.useEffect(() => {
    if (student) {
      const currentRole = student.role || 'Học sinh';
      setSelectedRole(currentRole);
      const isPreset = BAN_CAN_SU_ROLE_PRESETS.some((p) => p.role === currentRole) || currentRole === 'Học sinh';
      if (!isPreset && currentRole !== 'Học sinh') {
        setIsCustom(true);
        setCustomRoleInput(currentRole);
      } else {
        setIsCustom(false);
        setCustomRoleInput('');
      }
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const currentInfo = getBanCanSuInfo(selectedRole);

  const handleSelectPreset = (role: string) => {
    setSelectedRole(role);
    setIsCustom(false);
  };

  const handleApply = () => {
    const finalRole = isCustom ? customRoleInput.trim() || 'Học sinh' : selectedRole;
    onSaveRole(student, finalRole);
    onClose();
  };

  const handleRemoveRole = () => {
    onSaveRole(student, 'Học sinh');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase">
                Phân Công Chức Vụ Ban Cán Sự
              </h3>
              <p className="text-xs text-slate-500">
                Học sinh: <strong className="text-slate-900">#{student.stt} {student.name}</strong> (Tổ {student.group}, {student.gender})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status display */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Chức vụ lựa chọn:</span>
          <span className={`text-xs px-3 py-1 rounded-full font-black ${currentInfo.badgeClass}`}>
            {currentInfo.emoji} {selectedRole || 'Học sinh'}
          </span>
        </div>

        {/* Presets Grid */}
        <div className="space-y-3 mb-5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Chọn Chức Vụ Cán Sự:
          </label>

          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {BAN_CAN_SU_ROLE_PRESETS.map((item) => {
              const isSelected = !isCustom && selectedRole === item.role;
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleSelectPreset(item.role)}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-300 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <span className="text-base shrink-0">{item.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{item.role}</div>
                    <div className="text-[10px] text-slate-500 truncate">{item.desc}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-600 ml-auto shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Custom Role Option */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between ${
                isCustom
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-300'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span>✏️ Nhập chức vụ khác (tự định nghĩa)...</span>
              {isCustom && <Check className="w-4 h-4 text-indigo-600" />}
            </button>

            {isCustom && (
              <div className="mt-2">
                <input
                  type="text"
                  autoFocus
                  value={customRoleInput}
                  onChange={(e) => {
                    setCustomRoleInput(e.target.value);
                    setSelectedRole(e.target.value || 'Học sinh');
                  }}
                  placeholder="Nhập tên chức vụ (VD: Trưởng ban phát thanh, Phụ trách báo tường...)"
                  className="w-full bg-white border border-indigo-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleRemoveRole}
            className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-200"
            title="Gỡ chức vụ, chuyển về học sinh thông thường"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Gỡ Cán Sự (Về HS Thường)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-200 flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Lưu Chức Vụ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
