import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { formatWatts, formatVND, calculateElectricityCost, getCurrentEVNTimeSlot, EVN_RATES } from '../utils/calculations';
import {
  LayoutDashboard,
  Tv,
  CalendarClock,
  BarChart3,
  Cpu,
  Power,
  Volume2,
  VolumeX,
  AlertTriangle,
  Zap,
  Building2,
  Clock,
  Receipt,
  X,
  CheckCircle2,
  User,
  LogIn,
  LogOut,
  ShieldCheck,
  GraduationCap,
  Wrench,
  Users,
  ChevronDown,
  Database,
  ExternalLink,
  Copy,
  Check,
  Plus,
} from 'lucide-react';
import { AddRoomModal } from './AddRoomModal';
import { GoogleIcon } from './GoogleIcon';
import { SqlServerModal } from './SqlServerModal';

export type ActiveTab = 'dashboard' | 'touch_panel' | 'schedule' | 'analytics' | 'hardware';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const {
    activeRoomCount,
    classrooms,
    totalCampusPowerW,
    totalEnergyTodayKWh,
    alertCount,
    globalAllOff,
    soundEnabled,
    toggleSound,
    includeVat,
    setIncludeVat,
    dbSyncStatus,
    supabaseStatus,
  } = useClassroom();

  const {
    currentUser,
    openLoginModal,
    logout,
    quickLogin,
    canPerform,
    openPermissionsModal,
    loginWithGoogle,
    isGoogleAuthLoading,
  } = useAuth();

  const [showGlobalOffModal, setShowGlobalOffModal] = useState<boolean>(false);
  const [showDbModal, setShowDbModal] = useState<boolean>(false);
  const [showSqlServerModal, setShowSqlServerModal] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);

  const currentSlot = getCurrentEVNTimeSlot();
  const estCost = calculateElectricityCost(totalEnergyTodayKWh, includeVat);

  const handleOpenAddRoom = () => {
    const perm = canPerform('ADD_ROOM');
    if (!perm.allowed) {
      setToastType('error');
      setToastMessage(perm.reason || 'Bạn không có quyền thêm phòng học mới vào hệ thống!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4500);
      return;
    }
    setShowAddModal(true);
  };

  const handleOpenGlobalOff = () => {
    const perm = canPerform('GLOBAL_SHUTDOWN');
    if (!perm.allowed) {
      setToastType('error');
      setToastMessage(perm.reason || 'Bạn không có quyền thực hiện thao tác này!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
      return;
    }
    setShowGlobalOffModal(true);
  };

  const handleConfirmGlobalOff = () => {
    globalAllOff();
    setShowGlobalOffModal(false);
    setToastType('success');
    setToastMessage(`Lệnh thành công: Đã ngắt tiếp điểm toàn bộ Relay 220V tại tất cả ${classrooms.length} phòng học! (Công suất hạ về chế độ chờ Standby 6.5W/phòng)`);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'LECTURER':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'TECHNICIAN':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'STUDENT':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      {/* Notification Banner */}
      {showSuccessToast && (
        <div className={`border-b px-4 py-2 text-xs flex items-center justify-between animate-fadeIn ${
          toastType === 'error'
            ? 'bg-rose-950 border-rose-600/80 text-rose-200'
            : 'bg-emerald-950 border-emerald-600/80 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            {toastType === 'error' ? (
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-semibold text-white">
              {toastMessage}
            </span>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Bar with System Branding and Global Campus Telemetry */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3 border-b border-slate-800/80">
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-white tracking-tight">
                  SmartClass Energy
                </h1>
                <span className="text-[11px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Số liệu thực tế · TCVN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Giám sát & Quản lý thiết bị phòng học từ xa · Nhóm 4-5 SV
              </p>
            </div>
          </div>

          {/* Real-time Campus Metrics */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-slate-300">
            {/* Live EVN Tariff Slot */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/80">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <div>
                <span className="text-[9px] text-slate-400 uppercase block leading-none">EVN 2941/QĐ-BCT</span>
                <span className="font-semibold text-white text-[11px]">
                  {currentSlot.name}: <strong className="text-amber-300">{currentSlot.rate.toLocaleString('vi-VN')} đ</strong>/kWh
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Phòng hoạt động</span>
                <span className="font-semibold text-white">
                  {activeRoomCount} / {classrooms.length} phòng
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Công suất toàn trường</span>
                <span className="font-mono font-semibold text-amber-300">
                  {formatWatts(totalCampusPowerW)}
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 block text-[10px] uppercase">Tiền điện thực tế</span>
                <button
                  onClick={() => setIncludeVat(!includeVat)}
                  title="Nhấn để đổi giữa có VAT 8% và chưa VAT"
                  className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 hover:text-white"
                >
                  {includeVat ? 'VAT 8%' : 'Chưa VAT'}
                </button>
              </div>
              <span className="font-mono font-medium text-emerald-300">
                {totalEnergyTodayKWh.toFixed(1)} kWh · {formatVND(estCost, false)}
              </span>
            </div>

            {alertCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                <span className="font-medium">{alertCount} phòng quên tắt!</span>
              </div>
            )}

            {/* Global Controls & User Profile */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={toggleSound}
                title={soundEnabled ? 'Tắt âm thanh relay & còi' : 'Bật âm thanh relay & còi'}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                aria-label="Toggle relay audio"
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
              </button>

              <button
                onClick={() => setShowDbModal(true)}
                title="Quản lý kết nối Database (Supabase & Cloud)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-colors text-xs text-slate-300"
              >
                <Database className={`h-3.5 w-3.5 ${supabaseStatus.configured ? 'text-emerald-400' : 'text-cyan-400'}`} />
                <span className="font-mono text-[11px] hidden sm:inline">
                  {supabaseStatus.configured ? 'Supabase & Cloud' : 'Supabase'}
                </span>
                <span className={`h-1.5 w-1.5 rounded-full ${supabaseStatus.configured ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'}`} />
              </button>

              <button
                onClick={handleOpenAddRoom}
                title="Thêm phòng học mới vào Supabase"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-500/80 transition-colors text-xs font-semibold text-white shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Thêm phòng</span>
              </button>

              <button
                onClick={openPermissionsModal}
                title="Quản lý phân quyền tài khoản & Ma trận RBAC"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/70 border border-purple-700/60 transition-colors text-xs font-semibold text-purple-200 shadow-sm cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                <span className="hidden sm:inline">Phân quyền</span>
              </button>

              <button
                onClick={() => setShowSqlServerModal(true)}
                title="Quản lý kết nối & Đồng bộ với Microsoft SQL Server"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-950/70 hover:bg-blue-900/80 border border-blue-700/70 transition-colors text-xs font-semibold text-blue-200 shadow-sm cursor-pointer"
              >
                <Database className="h-3.5 w-3.5 text-blue-400" />
                <span className="hidden sm:inline">SQL Server</span>
              </button>

              <button
                onClick={handleOpenGlobalOff}
                title="Ngắt nguồn 220V toàn bộ thiết bị các phòng học"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-200 bg-rose-950/70 hover:bg-rose-900 border border-rose-700/80 rounded-md transition-colors shadow-sm active:scale-95"
              >
                <Power className="h-3.5 w-3.5 text-rose-400" />
                <span>Tắt toàn trường</span>
              </button>

              <div className="h-5 w-px bg-slate-800 hidden sm:block mx-0.5" />

              {/* User Authentication Menu */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all text-xs"
                    title="Thông tin tài khoản & Phân quyền"
                  >
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="h-6 w-6 rounded-full object-cover border border-blue-400/60"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-[10px] text-emerald-400">
                        {currentUser.avatarInitials}
                      </div>
                    )}
                    <div className="text-left hidden sm:block">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-white block text-[11px] leading-tight max-w-[120px] truncate">
                          {currentUser.name}
                        </span>
                        {currentUser.authProvider === 'google' && (
                          <GoogleIcon className="w-2.5 h-2.5 shrink-0" />
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 block font-mono leading-none">
                        {currentUser.role}
                      </span>
                    </div>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border hidden md:inline-block ${getRoleBadgeStyle(currentUser.role)}`}>
                      {currentUser.roleTitle.split(' ')[0]}
                    </span>
                    <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setShowUserDropdown(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-40 animate-scaleUp text-slate-200">
                        {/* User Summary */}
                        <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                          {currentUser.avatarUrl ? (
                            <img
                              src={currentUser.avatarUrl}
                              alt={currentUser.name}
                              className="h-10 w-10 rounded-xl object-cover border border-blue-500/40 shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-400 shrink-0">
                              {currentUser.avatarInitials}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-white truncate">
                                {currentUser.name}
                              </span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(currentUser.role)}`}>
                                {currentUser.role}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                              {currentUser.email}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                              {currentUser.authProvider === 'google' ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                  <GoogleIcon className="w-2.5 h-2.5" /> Google Auth
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">
                                  {currentUser.department}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Role Details */}
                        <div className="mt-2.5 px-1 py-1.5 text-[11px] text-slate-400 border-b border-slate-800/80">
                          <span className="text-slate-300 font-semibold block mb-0.5">
                            Quyền hạn hiện tại ({currentUser.roleTitle}):
                          </span>
                          <span className="text-slate-400 block leading-relaxed">
                            {currentUser.role === 'ADMIN' && 'Toàn quyền: Bật/tắt tất cả phòng học, ngắt điện toàn trường khẩn cấp, cấu hình tự động.'}
                            {currentUser.role === 'LECTURER' && `Quản lý phòng được phân công (${currentUser.assignedRooms.includes('*') ? 'Toàn bộ' : currentUser.assignedRooms.join(', ')}). Không được ngắt toàn trường.`}
                            {currentUser.role === 'TECHNICIAN' && 'Kỹ thuật viên: Giám sát đo lường PZEM-004T, kiểm tra tiếp điểm Relay 220V.'}
                            {currentUser.role === 'STUDENT' && 'Chế độ Chỉ xem: Xem thông số nhiệt độ, lịch học, bị khóa lệnh điều khiển Relay 220V.'}
                          </span>
                        </div>

                        {/* Quick Role Switcher for Testing/Demo */}
                        <div className="mt-2.5 pt-1">
                          <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block mb-1.5 px-1">
                            Chuyển nhanh vai trò (Demo phân quyền):
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {DEMO_USERS.map((u) => (
                              <button
                                key={u.id}
                                onClick={() => {
                                  quickLogin(u.role);
                                  setShowUserDropdown(false);
                                  setToastType('success');
                                  setToastMessage(`Đã đổi vai trò sang: ${u.roleTitle}`);
                                  setShowSuccessToast(true);
                                  setTimeout(() => setShowSuccessToast(false), 3000);
                                }}
                                className={`p-1.5 text-left rounded-lg text-[11px] transition-colors border flex items-center gap-1.5 ${
                                  currentUser.role === u.role
                                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 font-semibold'
                                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                                }`}
                              >
                                {u.role === 'ADMIN' && <ShieldCheck className="h-3.5 w-3.5 text-purple-400 shrink-0" />}
                                {u.role === 'LECTURER' && <GraduationCap className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                                {u.role === 'TECHNICIAN' && <Wrench className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                                {u.role === 'STUDENT' && <Users className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                                <span className="truncate">{u.roleTitle.split(' ')[0]}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 pt-2 border-t border-slate-800 space-y-2">
                          <button
                            onClick={() => {
                              setShowUserDropdown(false);
                              openPermissionsModal();
                            }}
                            className="w-full py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-700/70 text-purple-200 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <ShieldCheck className="h-4 w-4 text-purple-400" />
                            <span>Quản lý phân quyền tài khoản (RBAC)</span>
                          </button>

                          <div className="flex items-center justify-between gap-1.5 pt-1">
                            <button
                              onClick={() => {
                                setShowUserDropdown(false);
                                openLoginModal();
                              }}
                              className="px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5"
                            >
                              <User className="h-3.5 w-3.5" />
                              <span>Đổi tài khoản</span>
                            </button>

                            <button
                              onClick={async () => {
                                setShowUserDropdown(false);
                                const res = await loginWithGoogle();
                                if (res.success && res.user) {
                                  setToastType('success');
                                  setToastMessage(`Đã đăng nhập Google: ${res.user.name}`);
                                  setShowSuccessToast(true);
                                  setTimeout(() => setShowSuccessToast(false), 3000);
                                }
                              }}
                              className="px-2 py-1 text-xs text-sky-300 hover:text-sky-200 hover:bg-sky-950/60 rounded-md transition-colors flex items-center gap-1.5"
                            >
                              <GoogleIcon className="w-3 h-3" />
                              <span>Đổi Google</span>
                            </button>

                            <button
                              onClick={() => {
                                logout();
                                setShowUserDropdown(false);
                                setToastType('success');
                                setToastMessage('Đã đăng xuất tài khoản. Bạn đang ở chế độ khách (Chỉ xem).');
                                setShowSuccessToast(true);
                                setTimeout(() => setShowSuccessToast(false), 3000);
                              }}
                              className="px-2 py-1 text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/60 rounded-md transition-colors flex items-center gap-1.5"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                              <span>Đăng xuất</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      const res = await loginWithGoogle();
                      if (res.success && res.user) {
                        setToastType('success');
                        setToastMessage(`Đăng nhập Google thành công: ${res.user.name} (${res.user.roleTitle})`);
                        setShowSuccessToast(true);
                        setTimeout(() => setShowSuccessToast(false), 3000);
                      } else if (!res.success && res.error) {
                        openLoginModal();
                      }
                    }}
                    disabled={isGoogleAuthLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors shadow-sm active:scale-95 border border-slate-200"
                    title="Đăng nhập tài khoản Google"
                  >
                    <GoogleIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Google</span>
                  </button>
                  <button
                    onClick={openLoginModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm active:scale-95"
                    title="Mở cổng đăng nhập hệ thống"
                  >
                    <LogIn className="h-3.5 w-3.5 text-slate-950" />
                    <span>Đăng nhập</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global All Off In-App Confirmation Modal */}
        {showGlobalOffModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-rose-700/80 rounded-2xl shadow-2xl w-full max-w-md p-6 text-slate-100 space-y-4 animate-scaleUp">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                  <Power className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Xác Nhận Ngắt Điện Toàn Trường?
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Lệnh này sẽ phát bản tin MQTT Broadcast ngắt tức thì tất cả tiếp điểm Relay 220V và Khởi động từ Contactor tại <strong className="text-rose-300">{classrooms.length} phòng học</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Số phòng đang mở điện:</span>
                  <span className="font-bold text-white">{activeRoomCount} phòng</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Công suất cắt giảm:</span>
                  <span className="font-bold text-emerald-400">{formatWatts(totalCampusPowerW)} → 32.5W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Trạng thái sau ngắt:</span>
                  <span className="font-mono text-cyan-300">Nguồn chờ tĩnh Standby</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGlobalOffModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmGlobalOff}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1.5 shadow-md shadow-rose-950"
                >
                  <Power className="h-3.5 w-3.5" />
                  <span>Xác Nhận Ngắt Điện Ngay</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Database & Supabase Integration Modal */}
        {showDbModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl p-6 text-slate-100 space-y-5 animate-scaleUp">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">
                      Cơ Sở Dữ Liệu & Đồng Bộ Thời Gian Thực
                    </h3>
                    <p className="text-xs text-slate-400">
                      Hệ thống hỗ trợ song song Cloud Database và Supabase (PostgreSQL)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDbModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Supabase Card */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-sm text-emerald-300">Supabase (PostgreSQL)</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    vvxieqsotbfhymaiqngb
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-slate-400">REST Endpoint:</span>
                    <span className="font-mono text-cyan-300 text-[11px] break-all">
                      https://vvxieqsotbfhymaiqngb.supabase.co/rest/v1/
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-slate-400">Trạng thái cấu hình:</span>
                    <span className="text-white font-medium">
                      {supabaseStatus.message}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-slate-200">
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Publishable Key đã kết nối:
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      sb_publishable_uesw...1v-
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Hệ thống đã nhận diện khóa API Publishable và đồng bộ trực tiếp với các bảng <code className="font-mono text-cyan-300">rooms</code> và <code className="font-mono text-cyan-300">devices</code> trên PostgreSQL của bạn. Số lượng phòng hiển thị trên Dashboard luôn khớp chính xác với database Supabase.
                  </p>
                </div>

                {/* SQL Schema Copy Button */}
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-xs text-slate-400">SQL Schema & Mở quyền RLS (rooms & devices):</span>
                  <button
                    onClick={() => {
                      const sql = `-- Mở quyền RLS cho bảng rooms và devices trên Supabase\nALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;\nDROP POLICY IF EXISTS "Allow all access to rooms" ON public.rooms;\nCREATE POLICY "Allow all access to rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);\n\nALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;\nDROP POLICY IF EXISTS "Allow all access to devices" ON public.devices;\nCREATE POLICY "Allow all access to devices" ON public.devices FOR ALL USING (true) WITH CHECK (true);\n\n-- Thêm dữ liệu mẫu vào rooms\nINSERT INTO public.rooms (room_name, building, is_active) VALUES\n  ('Phòng học A101 - Smart Lab IoT', 'Khu A', true),\n  ('Phòng học A102 - Trung tâm R&D', 'Khu A', true),\n  ('Phòng học B204 - Giảng đường Đa Năng', 'Khu B', false),\n  ('Phòng học C305 - Thực hành Điện - Điện Tử', 'Khu C', true),\n  ('Phòng học H01 - Hội trường lớn 250 chỗ', 'Khu H', false);`;
                      navigator.clipboard.writeText(sql);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 3000);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
                  >
                    {copiedSql ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    <span>{copiedSql ? 'Đã sao chép SQL!' : 'Sao chép SQL RLS & Mẫu'}</span>
                  </button>
                </div>
              </div>

              {/* Microsoft SQL Server Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-blue-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                    <span className="font-semibold text-xs text-white">Microsoft SQL Server (T-SQL Database)</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowDbModal(false);
                      setShowSqlServerModal(true);
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 hover:bg-blue-900 transition-colors"
                  >
                    Mở Quản Trị SQL Server →
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Kết nối trực tiếp tới CSDL SQL Server (cổng 1433), hỗ trợ đồng bộ danh sách phòng học và lưu trữ nhật ký cảm biến PZEM-004T.
                </p>
              </div>

              {/* Cloud Database (Firebase) Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-xs text-white">Cloud Firestore (Active Database)</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                    Thời gian thực (Real-time)
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Cơ sở dữ liệu đang lưu trữ và đồng bộ tức thời 5 phòng học, cảm biến PZEM-004T và trạng thái rơ le 220V cho toàn trường.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDbModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Room to Supabase */}
        <AddRoomModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={(name) => {
            setToastType('success');
            setToastMessage(`Đã thêm thành công "${name}" vào bảng rooms trên Supabase!`);
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 5000);
          }}
        />

        {/* Modal: SQL Server Database Integration */}
        <SqlServerModal
          isOpen={showSqlServerModal}
          onClose={() => setShowSqlServerModal(false)}
        />

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/80'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Quản Lý Từ Xa (Web Admin)</span>
          </button>

          <button
            onClick={() => setActiveTab('touch_panel')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'touch_panel'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/80'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Tv className="h-4 w-4" />
            <span>Bảng Điều Khiển Tại Chỗ (Touch Panel)</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'schedule'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/80'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <CalendarClock className="h-4 w-4" />
            <span>Lịch Học Vụ & Tự Động Ngắt</span>
            {alertCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'analytics'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/80'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Phân Tích & Tiết Kiệm Điện</span>
          </button>

          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'hardware'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/80'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span>Phần Cứng & Đồ Án Nhóm (ESP32 / 220V)</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
