import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  ShieldCheck,
  GraduationCap,
  Wrench,
  Users,
  CheckCircle2,
  AlertCircle,
  Zap,
  Loader2,
  UserPlus,
  LogIn,
  Lock,
  Mail,
  Activity,
  Clock,
  KeyRound,
  Eye,
  EyeOff,
  User as UserIcon,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, register, users } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('LECTURER');
  const [regDepartment, setRegDepartment] = useState('Khoa Điện tử - Viễn thông / IoT');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = login(identifier, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim();

    if (!cleanName || !cleanEmail) {
      setErrorMsg('Vui lòng nhập đầy đủ Họ và tên và Địa chỉ Email!');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Định dạng email không hợp lệ (ví dụ: nguyenvanan@campus.edu.vn)!');
      return;
    }

    if (regPassword.length < 4) {
      setErrorMsg('Mật khẩu bảo mật phải có ít nhất 4 ký tự!');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.');
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
        setSuccessMsg(`Đăng ký thành công tài khoản "${cleanName}" (${cleanEmail})! Bạn có thể đăng nhập ngay.`);
        setActiveTab('login');
        setIdentifier(cleanEmail);
        setPassword(regPassword);
      } else {
        setErrorMsg(res.error || 'Có lỗi xảy ra khi tạo tài khoản.');
      }
    } catch (err) {
      setIsRegistering(false);
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối khi đăng ký tài khoản');
    }
  };

  // Helper to fill login inputs with a registered account
  const handlePrefillAccount = (accountEmail: string, accountPass: string) => {
    setIdentifier(accountEmail);
    setPassword(accountPass);
    setErrorMsg(null);
    setSuccessMsg(`Đã điền thông tin tài khoản: ${accountEmail}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Bar Branding */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
            <Zap className="h-5 w-5 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm tracking-tight">SmartClass Energy</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                IoT Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Hệ thống giám sát và quản lý thiết bị phòng học từ xa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">Hệ thống sẵn sàng</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-semibold">ESP32 & PZEM-004T</span>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp">
          {/* Card Header */}
          <div className="p-6 sm:p-8 border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-3">
              <Lock className="w-3.5 h-3.5" />
              <span>Xác thực tài khoản hệ thống</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {activeTab === 'login' ? 'Đăng Nhập Tài Khoản' : 'Đăng Ký Tài Khoản Mới'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {activeTab === 'login'
                ? 'Đăng nhập bằng tài khoản đã đăng ký để truy cập bảng điều khiển thiết bị phòng học.'
                : 'Khởi tạo tài khoản người dùng mới và phân quyền sử dụng hệ thống.'}
            </p>

            {/* Tab Navigation: Only 2 tabs: Đăng Nhập & Đăng Ký */}
            <div className="grid grid-cols-2 gap-2 mt-6 p-1 bg-slate-950/90 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'login'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập Tài Khoản</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'register'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Đăng Ký Mới</span>
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          <div className="p-6 sm:p-8 space-y-5">
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-xs text-emerald-200 flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Thao tác thành công!</span>
                  <span className="leading-relaxed mt-0.5 block">{successMsg}</span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-200 flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: ĐĂNG NHẬP TÀI KHOẢN ĐÃ ĐĂNG KÝ */}
            {activeTab === 'login' && (
              <form onSubmit={handleFormLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Địa chỉ Email hoặc Tên đăng nhập
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="admin@campus.edu.vn hoặc tên đăng nhập"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Mật khẩu
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      {showPassword ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Ẩn mật khẩu</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Hiện mật khẩu</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                      required
                    />
                  </div>
                </div>

                {/* Pre-registered System Accounts Reference */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">
                      📋 Tài khoản mẫu đã đăng ký sẵn trong hệ thống:
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">Nhấn để điền</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                    {DEMO_USERS.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handlePrefillAccount(user.email, user.password)}
                        className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-emerald-500/40 text-left transition-all flex items-center justify-between group"
                      >
                        <div className="min-w-0 pr-1">
                          <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors block truncate text-[11px]">
                            {user.email}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {user.roleTitle} · pass: <code className="text-emerald-400">{user.password}</code>
                          </span>
                        </div>
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors shrink-0">
                          Điền
                        </span>
                      </button>
                    ))}
                  </div>
                  {users.length > DEMO_USERS.length && (
                    <p className="text-[10px] text-slate-500 pt-1">
                      + {users.length - DEMO_USERS.length} tài khoản mới khác được tạo trong cơ sở dữ liệu.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập Vào Bảng Điều Khiển</span>
                </button>

                <div className="text-center pt-2">
                  <span className="text-xs text-slate-400">
                    Chưa có tài khoản đăng ký?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('register');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2"
                    >
                      Đăng ký ngay tại đây
                    </button>
                  </span>
                </div>
              </form>
            )}

            {/* TAB 2: ĐĂNG KÝ TÀI KHOẢN MỚI */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Họ và tên <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Địa chỉ Email <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Vai trò tài khoản <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="LECTURER">Giảng viên (Quản lý phòng học)</option>
                      <option value="TECHNICIAN">Kỹ thuật viên (Giám sát & đo lường)</option>
                      <option value="STUDENT">Sinh viên (Chế độ chỉ xem)</option>
                      <option value="ADMIN">Quản trị viên (Toàn quyền hệ thống)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Phòng ban / Đơn vị
                    </label>
                    <input
                      type="text"
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      placeholder="Khoa Điện tử - Viễn thông / IoT"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Mật khẩu (ít nhất 4 ký tự) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Xác nhận mật khẩu <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
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
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-lg shadow-purple-950/40 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu tài khoản vào cơ sở dữ liệu...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Hoàn Tất Đăng Ký Tài Khoản</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <span className="text-xs text-slate-400">
                    Đã có tài khoản đã đăng ký?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('login');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2"
                    >
                      Quay lại màn hình đăng nhập
                    </button>
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* System Architecture Highlights */}
      <section className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 border-t border-slate-900">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
              <Activity className="w-4 h-4" />
              <span>Đo Lường PZEM-004T</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Giám sát chính xác điện áp 220V, dòng điện, công suất tác dụng và hệ số cos φ theo thời gian thực.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold mb-1">
              <Zap className="w-4 h-4" />
              <span>Bảo Vệ Relay 220V</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Điều khiển Contactor cách ly điện áp cao an toàn, chống quá tải và ngắt điện khẩn cấp toàn trường.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-1">
              <Clock className="w-4 h-4" />
              <span>Tự Động Học Vụ</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Cảm biến chuyển động PIR kết hợp thời khóa biểu, tự động ngắt điện khi phòng trống sau giờ học.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
              <KeyRound className="w-4 h-4" />
              <span>Phân Quyền RBAC</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Kiểm soát đa tầng quyền hạn Quản trị viên, Giảng viên, Kỹ thuật viên và bảo vệ an toàn cho Sinh viên.
            </p>
          </div>
        </div>
      </section>

      {/* Clean Modern Enterprise Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-xs text-slate-400 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Smart Campus IoT · Hệ thống Giám sát & Quản lý Thiết bị Phòng học Thông minh</span>
          <span className="text-slate-400">Vi điều khiển ESP32 · Module PZEM-004T v3.0 · Contactor Relay 220V</span>
        </div>
      </footer>
    </div>
  );
};
