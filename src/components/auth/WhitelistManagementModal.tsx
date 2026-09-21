import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, CheckCircle2, AlertCircle, X, Search, Mail, UserCheck, RefreshCw } from 'lucide-react';
import { User } from 'firebase/auth';
import {
  SUPER_ADMIN_EMAIL,
  WhitelistEntry,
  getWhitelistUsers,
  addEmailToWhitelist,
  removeEmailFromWhitelist,
} from '../../lib/firebase';

interface WhitelistManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const WhitelistManagementModal: React.FC<WhitelistManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadList = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getWhitelistUsers();
      setWhitelist(data);
    } catch (err: any) {
      setErrorMsg('Không thể tải danh sách cấp quyền: ' + (err?.message || 'Lỗi kết nối'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadList();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const email = newEmail.trim().toLowerCase();
    if (!email) {
      setErrorMsg('Vui lòng nhập địa chỉ Gmail!');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Địa chỉ email không đúng định dạng!');
      return;
    }

    if (whitelist.some((u) => u.email.toLowerCase() === email)) {
      setErrorMsg(`Email "${email}" đã có trong danh sách cấp quyền!`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addEmailToWhitelist(email, newName.trim(), currentUser);
      setSuccessMsg(`Đã cấp quyền thành công cho tài khoản ${email}!`);
      setNewEmail('');
      setNewName('');
      await loadList();
    } catch (err: any) {
      setErrorMsg('Lỗi khi thêm quyền: ' + (err?.message || 'Vui lòng thử lại'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveEmail = async (email: string) => {
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      alert('Không thể xóa quyền của Quản trị viên trưởng!');
      return;
    }

    if (!window.confirm(`Thầy/Cô có chắc chắn muốn thu hồi quyền truy cập của ${email}?`)) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await removeEmailFromWhitelist(email);
      setSuccessMsg(`Đã thu hồi quyền truy cập của ${email}!`);
      await loadList();
    } catch (err: any) {
      setErrorMsg('Lỗi khi xóa quyền: ' + (err?.message || 'Vui lòng thử lại'));
    }
  };

  const filteredList = whitelist.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Shield className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Phân quyền truy cập ứng dụng (Gmail Whitelist)
              </h3>
              <p className="text-xs text-emerald-200/90">
                Chỉ các tài khoản trong danh sách này mới có thể đăng nhập & sử dụng
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Notifications */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form to add a new Gmail */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <span>Cấp quyền cho tài khoản Gmail mới</span>
            </h4>

            <form onSubmit={handleAddEmail} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-6">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Địa chỉ Gmail <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="ví dụ: giaovien.toan@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="sm:col-span-4">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Họ tên / Ghi chú GV
                </label>
                <input
                  type="text"
                  placeholder="Cô Nguyễn Thu Hằng - GV Toán"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[34px] flex items-center justify-center gap-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Đang thêm...' : 'Cấp quyền'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Whitelisted Users */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Danh sách được cấp quyền ({whitelist.length})
                </span>
                <button
                  onClick={loadList}
                  disabled={loading}
                  title="Tải lại danh sách"
                  className="text-slate-400 hover:text-emerald-700 p-1 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm Gmail hoặc họ tên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 font-bold">
                    <th className="px-3 py-2.5">Tài khoản Gmail</th>
                    <th className="px-3 py-2.5">Họ tên / Vai trò</th>
                    <th className="px-3 py-2.5 text-center">Phân quyền</th>
                    <th className="px-3 py-2.5 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading && whitelist.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        Đang kết nối Firestore và tải danh sách...
                      </td>
                    </tr>
                  ) : filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        Không tìm thấy tài khoản nào phù hợp
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((entry) => {
                      const isSuper = entry.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

                      return (
                        <tr key={entry.email} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-3 py-2.5 font-mono font-medium text-slate-900">
                            <div className="flex items-center gap-1.5">
                              {isSuper && <Shield className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />}
                              <span>{entry.email}</span>
                            </div>
                          </td>

                          <td className="px-3 py-2.5 text-slate-700">
                            {entry.name ? (
                              <span className="font-semibold text-slate-800">{entry.name}</span>
                            ) : (
                              <span className="text-slate-400 italic">Chưa ghi chú tên</span>
                            )}
                          </td>

                          <td className="px-3 py-2.5 text-center">
                            {isSuper ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                Quản trị viên trưởng
                              </span>
                            ) : entry.role === 'admin' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                                Quản trị viên
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Giáo viên
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-2.5 text-center">
                            {isSuper ? (
                              <span className="text-[11px] text-slate-400 italic">Mặc định</span>
                            ) : (
                              <button
                                onClick={() => handleRemoveEmail(entry.email)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Thu hồi quyền sử dụng"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            Quản trị viên đăng nhập: <strong>{currentUser?.email || SUPER_ADMIN_EMAIL}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
