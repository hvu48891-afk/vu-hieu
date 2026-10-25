import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
  Loader2,
  UserPlus,
  User as UserIcon,
  LogIn,
  Eye,
  EyeOff,
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    closeLoginModal,
    login,
    register,
    currentUser,
    users,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState<string | null>(null);
  const [regErrorMsg, setRegErrorMsg] = useState<string | null>(null);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('LECTURER');
  const [regDepartment, setRegDepartment] = useState('Khoa Điện tử - Viễn thông / IoT');
  const [isRegistering, setIsRegistering] = useState(false);

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
    setLoginErrorMsg(null);
    setRegSuccessMsg(null);
    const res = login(identifier, password);
    if (!res.success) {
      setLoginErrorMsg(res.error || 'Tài khoản và mật khẩu không đúng. Vui lòng kiểm tra lại!');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorMsg(null);
    setRegSuccessMsg(null);

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim();

    if (!cleanName || !cleanEmail) {
      setRegErrorMsg('Vui lòng nhập đầy đủ Họ và tên và Địa chỉ Email!');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setRegErrorMsg('Định dạng email không hợp lệ (ví dụ: nguyenvanan@campus.edu.vn)!');
      return;
    }

    if (regPassword.length < 4) {
      setRegErrorMsg('Mật khẩu bảo mật phải có ít nhất 4 ký tự!');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegErrorMsg('Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.');
      return;
    }

    setIsRegistering(true);

    try {
      const res = await register({
        name: cleanName,
        email: cleanEmail,
        username: regUsername.trim() || undefined,
        password: regPassword,
        role: regRole,
        department: regDepartment.trim() || undefined,
      });

      setIsRegistering(false);

      if (res.success) {
        setRegSuccessMsg(
          `Đăng ký thành công tài khoản "${cleanName}"! Vui lòng nhập mật khẩu để đăng nhập.`
        );
        setActiveTab('login');
        setIdentifier(cleanEmail);
        setPassword('');
        setLoginErrorMsg(null);
        setRegErrorMsg(null);
      } else {
        setRegErrorMsg(res.error || 'Có lỗi xảy ra khi tạo tài khoản.');
      }
    } catch (err) {
      setIsRegistering(false);
      setRegErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối khi đăng ký tài khoản');
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
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg text-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
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
                  Xác Thực Tài Khoản
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Đăng nhập tài khoản đã đăng ký để điều khiển thiết bị phòng học
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
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getRoleBadgeClass(currentUser.role)}`}>
              {currentUser.role}
            </span>
          </div>
        )}

        {/* Tab switcher: Only 2 tabs: Đăng Nhập & Đăng Ký */}
        <div className="p-2 bg-slate-950/40 border-b border-slate-800 grid grid-cols-2 gap-2 px-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginErrorMsg(null);
              setRegErrorMsg(null);
              setRegSuccessMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng Nhập Tài Khoản</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setLoginErrorMsg(null);
              setRegErrorMsg(null);
              setRegSuccessMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Đăng Ký Tài Khoản Mới</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: FORM LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {regSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-xs text-emerald-200 flex items-start gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Thao tác thành công!</span>
                    <span className="leading-relaxed mt-0.5 block">{regSuccessMsg}</span>
                  </div>
                </div>
              )}

              {loginErrorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-700 text-xs text-rose-200 flex items-start gap-2.5 animate-fadeIn shadow-lg shadow-rose-950/50">
                  <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Đăng nhập không thành công</span>
                    <span className="leading-relaxed mt-0.5 block">{loginErrorMsg}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Địa chỉ Email hoặc Tên đăng nhập:
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@campus.edu.vn"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Mật khẩu:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ẩn</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Hiện</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER NEW ACCOUNT */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {regErrorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-700 text-xs text-rose-200 flex items-start gap-2.5 animate-fadeIn shadow-lg shadow-rose-950/50">
                  <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Đăng ký không thành công</span>
                    <span className="leading-relaxed mt-0.5 block">{regErrorMsg}</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Họ và tên <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Nguyễn Văn An"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Email đăng ký <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nguyenvanan@campus.edu.vn"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Vai trò tài khoản <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="LECTURER">Giảng viên (Quản lý phòng học)</option>
                    <option value="TECHNICIAN">Kỹ thuật viên (Giám sát thiết bị)</option>
                    <option value="STUDENT">Sinh viên (Chỉ xem dữ liệu)</option>
                    <option value="ADMIN">Quản trị viên (Toàn quyền hệ thống)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Khoa / Đơn vị
                  </label>
                  <input
                    type="text"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    placeholder="Khoa Điện tử - Viễn thông"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Mật khẩu <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Xác nhận mật khẩu <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-lg shadow-purple-950/40 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu tài khoản lên cơ sở dữ liệu...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Hoàn Tất Đăng Ký Tài Khoản</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
