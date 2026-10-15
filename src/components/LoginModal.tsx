import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { UserRole } from '../types';
import { GoogleIcon } from './GoogleIcon';
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
  Loader2,
  Sparkles,
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    closeLoginModal,
    login,
    quickLogin,
    currentUser,
    loginWithGoogle,
    loginWithGoogleEmail,
    isGoogleAuthLoading,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'google' | 'quick' | 'form'>('google');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('hvu48891@gmail.com');
  const [customGoogleName, setCustomGoogleName] = useState('Vũ Hoàng');

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

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    const res = await loginWithGoogle();
    if (!res.success && res.error) {
      setErrorMsg(res.error);
    }
  };

  const handleGoogleEmailQuickLogin = (emailToUse: string, nameToUse: string) => {
    setErrorMsg(null);
    const res = loginWithGoogleEmail(emailToUse, nameToUse);
    if (!res.success && res.error) {
      setErrorMsg(res.error);
    }
  };

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
                  Google & RBAC
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Xác thực tài khoản Google và phân quyền điều khiển thiết bị phòng học
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
            <div className="flex items-center gap-2">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="h-5 w-5 rounded-full object-cover border border-emerald-500/50"
                />
              ) : (
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              )}
              <span className="text-slate-400">
                Đang dùng: <strong className="text-white">{currentUser.name}</strong> ({currentUser.roleTitle})
              </span>
              {currentUser.authProvider === 'google' && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-sky-500/10 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded font-mono">
                  <GoogleIcon className="w-2.5 h-2.5" /> Google
                </span>
              )}
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getRoleBadgeClass(currentUser.role)}`}>
              {currentUser.role}
            </span>
          </div>
        )}

        {/* Quick Google Sign-In Top Banner */}
        <div className="p-4 bg-gradient-to-r from-blue-950/40 via-slate-900 to-emerald-950/30 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white shadow-sm shrink-0">
              <GoogleIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Đăng nhập tài khoản Google</span>
                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 rounded">
                  Khuyên dùng
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Tự động nhận diện quyền Quản trị viên (ADMIN) hoặc Giảng viên
              </p>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleAuthLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
          >
            {isGoogleAuthLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Đang kết nối Google...</span>
              </>
            ) : (
              <>
                <GoogleIcon className="w-4 h-4" />
                <span>Đăng nhập với Google</span>
              </>
            )}
          </button>
        </div>

        {/* Tab switcher */}
        <div className="p-2 bg-slate-950/40 border-b border-slate-800 flex gap-1.5 px-6">
          <button
            onClick={() => setActiveTab('google')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-slate-800 text-blue-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GoogleIcon className="w-3.5 h-3.5" />
            <span>Tài Khoản Google</span>
          </button>
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'quick'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vai Trò Demo</span>
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'form'
                ? 'bg-slate-800 text-purple-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-purple-400" />
            <span>Email / Mật Khẩu</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-200 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
              <div className="pt-2 border-t border-rose-900/60 flex items-center justify-between">
                <span className="text-[11px] text-rose-300">
                  👉 Bạn có thể đăng nhập tức thì bằng tài khoản Google bên dưới:
                </span>
                <button
                  onClick={() => handleGoogleEmailQuickLogin(customGoogleEmail, customGoogleName)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                >
                  Dùng {customGoogleEmail}
                </button>
              </div>
            </div>
          )}

          {/* Tab: Google Details & One-Click Presets */}
          {activeTab === 'google' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <GoogleIcon className="w-4 h-4" />
                    Đăng Nhập Trực Tiếp Qua Google Auth:
                  </h4>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                    Firebase & OAuth2
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nhấn nút bên dưới để mở cửa sổ xác thực an toàn của Google. Hệ thống sẽ đọc tên, ảnh đại diện và email để phân quyền tự động.
                </p>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleAuthLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-75"
                >
                  {isGoogleAuthLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Đang mở cửa sổ Google OAuth...</span>
                    </>
                  ) : (
                    <>
                      <GoogleIcon className="w-4 h-4" />
                      <span>Đăng nhập bằng tài khoản Google</span>
                    </>
                  )}
                </button>
              </div>

              {/* Fast Google Accounts Preset */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Đăng Nhập Nhanh Tài Khoản Google Đã Liên Kết:
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-mono">1 Click</span>
                </div>

                <div className="space-y-2">
                  {/* User's primary Google email */}
                  <div
                    onClick={() => handleGoogleEmailQuickLogin('hvu48891@gmail.com', 'Vũ Hoàng (Chủ Hệ Thống)')}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800/80 hover:border-blue-500/50 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold text-xs">
                        VH
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white group-hover:text-blue-400 transition-colors">
                            hvu48891@gmail.com
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            ADMIN CSVC
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Tài khoản chủ sở hữu hệ thống · Toàn quyền điều khiển thiết bị toàn trường
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>

                  {/* Lecturer Google Demo */}
                  <div
                    onClick={() => handleGoogleEmailQuickLogin('giangvien.iot@gmail.com', 'TS. Giảng Viên Google')}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800/80 hover:border-blue-500/50 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold text-xs">
                        GV
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white group-hover:text-blue-400 transition-colors">
                            giangvien.iot@gmail.com
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                            LECTURER
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Tài khoản Giảng viên Google · Quản lý phòng học & điều khiển relay
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>

                {/* Custom Google Email Form */}
                <div className="pt-2 border-t border-slate-800/70">
                  <span className="text-[11px] text-slate-400 block mb-2">
                    Hoặc nhập bất kỳ địa chỉ Gmail nào của bạn:
                  </span>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        placeholder="youremail@gmail.com"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGoogleEmailQuickLogin(customGoogleEmail, customGoogleName)}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm shrink-0 flex items-center gap-1"
                    >
                      <GoogleIcon className="w-3.5 h-3.5" />
                      <span>Đăng nhập</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Policy & Auto-role info */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block">
                  ⚙️ Cơ chế phân quyền tự động khi đăng nhập bằng Google:
                </span>
                <p>• Email quản trị (<code>hvu48891@gmail.com</code> hoặc có <code>admin</code>): Nhận ngay quyền <strong>ADMIN Cơ Sở Vật Chất</strong>.</p>
                <p>• Các email Google khác: Tự động khởi tạo quyền <strong>Giảng Viên (LECTURER)</strong> với quyền bật/tắt tiếp điểm thiết bị và điều hòa.</p>
                <p>• Có thể thay đổi quyền chi tiết tại mục <strong>Phân Quyền RBAC</strong> sau khi đăng nhập.</p>
              </div>
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
