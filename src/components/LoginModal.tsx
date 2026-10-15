import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  X,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Wrench,
  Users,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowRight,
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, login, quickLogin, currentUser } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'quick' | 'form'>('quick');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLoginModal();
      }
    };
    if (isLoginModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoginModalOpen, closeLoginModal]);

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = login(email, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Đăng nhập không thành công.');
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <ShieldCheck className="h-5 w-5 text-purple-400" />;
      case 'LECTURER':
        return <GraduationCap className="h-5 w-5 text-blue-400" />;
      case 'TECHNICIAN':
        return <Wrench className="h-5 w-5 text-amber-400" />;
      case 'STUDENT':
        return <Users className="h-5 w-5 text-emerald-400" />;
    }
  };

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'LECTURER':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'TECHNICIAN':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'STUDENT':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeLoginModal();
      }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-xl text-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Cổng Đăng Nhập Hệ Thống
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Phân Quyền RBAC
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Xác thực phân quyền quản lý thiết bị phòng học & tiếp điểm 220V
              </p>
            </div>
          </div>

          <button
            onClick={closeLoginModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current status if already logged in */}
        {currentUser && (
          <div className="bg-slate-950 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              Đang đăng nhập: <strong className="text-white">{currentUser.name}</strong> ({currentUser.roleTitle})
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getRoleBadgeClass(currentUser.role)}`}>
              {currentUser.role}
            </span>
          </div>
        )}

        {/* Tab switcher */}
        <div className="p-2 bg-slate-950/40 border-b border-slate-800 flex gap-2 px-6">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'quick'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Đăng Nhập Nhanh Theo Vai Trò (Demo)
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'form'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Đăng Nhập Email / Mật Khẩu
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tab 1: Quick 1-Click Role Login */}
          {activeTab === 'quick' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Chọn một tài khoản tương ứng với vai trò để kiểm thử phân quyền đóng ngắt Relay 220V:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {DEMO_USERS.map((user) => {
                  const isCurrent = currentUser?.id === user.id;

                  return (
                    <div
                      key={user.id}
                      onClick={() => quickLogin(user.role)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between group ${
                        isCurrent
                          ? 'bg-slate-800/90 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80">
                            {getRoleIcon(user.role)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                                {user.name}
                              </span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getRoleBadgeClass(user.role)}`}>
                                {user.roleTitle}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5">
                                  <CheckCircle2 className="h-3 w-3" /> Đang dùng
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 block mt-0.5">
                              {user.email} · {user.department}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                              isCurrent
                                ? 'bg-emerald-500 text-slate-950 font-bold'
                                : 'bg-slate-800 group-hover:bg-slate-700 text-slate-200'
                            }`}
                          >
                            <span>{isCurrent ? 'Đang kích hoạt' : 'Chọn vai trò'}</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/70 leading-relaxed">
                        🔑 <strong>Quyền hạn:</strong> {user.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Standard Email & Password Form */}
          {activeTab === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Tài Khoản Email Cơ Sở Giáo Dục:
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@campus.edu.vn"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Mật Khẩu Xác Thực:
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••• (Demo: 123456 hoặc để trống)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                💡 <strong>Gợi ý tài khoản demo đồ án:</strong>
                <ul className="mt-1 space-y-0.5 text-slate-300">
                  <li>• Quản trị viên: <code>admin@campus.edu.vn</code> (pass: <code>admin</code> hoặc <code>123456</code>)</li>
                  <li>• Giảng viên: <code>giangvien@campus.edu.vn</code> (pass: <code>gv</code> hoặc <code>123456</code>)</li>
                  <li>• Kỹ thuật viên: <code>kythuat@campus.edu.vn</code> (pass: <code>kt</code> hoặc <code>123456</code>)</li>
                  <li>• Sinh viên: <code>sinhvien@campus.edu.vn</code> (pass: <code>sv</code> hoặc <code>123456</code>)</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeLoginModal}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm"
                >
                  Đăng Nhập
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
