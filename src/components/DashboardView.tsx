import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { useAuth } from '../context/AuthContext';
import { Classroom } from '../types';
import { formatWatts } from '../utils/calculations';
import { esp32HardwareService } from '../services/esp32HardwareService';
import { RoomDetailModal } from './RoomDetailModal';
import { AddRoomModal } from './AddRoomModal';
import { DeleteRoomModal } from './DeleteRoomModal';
import {
  Zap,
  Building,
  Thermometer,
  Users,
  Power,
  Cpu,
  AlertTriangle,
  Lightbulb,
  Wind,
  CheckCircle2,
  Clock,
  Sparkles,
  SlidersHorizontal,
  ShieldAlert,
  LogIn,
  Lock,
  X,
  Database,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Terminal,
  Server,
  Layers,
  ArrowRight,
  Trash2,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    classrooms,
    turnAllOff,
    turnAllOn,
    toggleDevice,
    simulateScenario,
    setSelectedClassroomId,
    activeRoomCount,
    includeVat,
    openESP32Modal,
    supabaseStatus,
    supabaseRoomCount,
    sourceTable,
    refreshFromSupabase,
    seedSupabaseClassrooms,
    addSupabaseRoom,
    deleteRoom,
    loadDemoClassrooms,
    toggleHardCutoff,
  } = useClassroom();

  const { currentUser, canPerform, openLoginModal } = useAuth();

  const [buildingFilter, setBuildingFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'WARNING' | 'VACANT'>('ALL');
  const [modalClassroom, setModalClassroom] = useState<Classroom | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Modals for Supabase interactions
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [roomToDelete, setRoomToDelete] = useState<Classroom | null>(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteRlsBlocked, setDeleteRlsBlocked] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const handleDeviceToggle = (classroomId: string, deviceId: string) => {
    if (!currentUser) {
      setAuthNotice('Hệ thống đã khóa điều khiển: Bạn đã đăng xuất hoặc chưa đăng nhập! Vui lòng đăng nhập để thao tác thiết bị.');
      openLoginModal();
      return;
    }
    if (currentUser.role === 'STUDENT') {
      setAuthNotice('Tài khoản Sinh viên ở chế độ Chỉ xem. Quyền đóng/ngắt thiết bị Relay 24V bị khóa!');
      return;
    }
    const perm = canPerform('CONTROL_DEVICE', classroomId);
    if (!perm.allowed) {
      setAuthNotice(perm.reason || 'Bạn không có quyền điều khiển thiết bị tại phòng này!');
      return;
    }
    toggleDevice(classroomId, deviceId);
  };

  const handleRoomTurnAllOff = (classroomId: string) => {
    if (!currentUser) {
      setAuthNotice('Hệ thống đã khóa điều khiển: Bạn đã đăng xuất hoặc chưa đăng nhập! Vui lòng đăng nhập để thao tác ngắt điện.');
      openLoginModal();
      return;
    }
    if (currentUser.role === 'STUDENT') {
      setAuthNotice('Tài khoản Sinh viên ở chế độ Chỉ xem. Quyền đóng/ngắt thiết bị Relay 24V bị khóa!');
      return;
    }
    const perm = canPerform('CONTROL_DEVICE', classroomId);
    if (!perm.allowed) {
      setAuthNotice(perm.reason || 'Bạn không có quyền ngắt điện tại phòng này!');
      return;
    }
    turnAllOff(classroomId);
  };

  const handleRoomTurnAllOn = (classroomId: string) => {
    if (!currentUser) {
      setAuthNotice('Hệ thống đã khóa điều khiển: Bạn đã đăng xuất hoặc chưa đăng nhập! Vui lòng đăng nhập để bật thiết bị.');
      openLoginModal();
      return;
    }
    if (currentUser.role === 'STUDENT') {
      setAuthNotice('Tài khoản Sinh viên ở chế độ Chỉ xem. Quyền đóng/ngắt thiết bị Relay 24V bị khóa!');
      return;
    }
    const perm = canPerform('CONTROL_DEVICE', classroomId);
    if (!perm.allowed) {
      setAuthNotice(perm.reason || 'Bạn không có quyền bật thiết bị tại phòng này!');
      return;
    }
    turnAllOn(classroomId);
  };

  const handleRoomToggleAll = (cr: Classroom) => {
    const anyOn = cr.devices.some((d) => d.isOn);
    if (anyOn) {
      handleRoomTurnAllOff(cr.id);
    } else {
      handleRoomTurnAllOn(cr.id);
    }
  };

  const handleHardCutoffClick = (cr: Classroom) => {
    if (!currentUser) {
      setAuthNotice('Hệ thống đã khóa điều khiển: Bạn đã đăng xuất hoặc chưa đăng nhập! Vui lòng đăng nhập để thao tác Aptomat.');
      openLoginModal();
      return;
    }
    if (currentUser.role === 'STUDENT') {
      setAuthNotice('Tài khoản Sinh viên ở chế độ Chỉ xem. Quyền thao tác Aptomat tổng bị khóa!');
      return;
    }
    const perm = canPerform('CONTROL_DEVICE', cr.id);
    if (!perm.allowed) {
      setAuthNotice(perm.reason || 'Bạn không có quyền thao tác Aptomat phòng này!');
      return;
    }
    toggleHardCutoff(cr.id);
  };

  const handleSimulate = (scenario: 'leave_empty_forget' | 'students_enter' | 'auto_shutdown_now') => {
    if (!currentUser) {
      setAuthNotice('Hệ thống đã khóa: Bạn đã đăng xuất hoặc chưa đăng nhập! Vui lòng đăng nhập để chạy thử kịch bản.');
      openLoginModal();
      return;
    }
    if (currentUser.role === 'STUDENT') {
      setAuthNotice('Tài khoản Sinh viên ở chế độ Chỉ xem. Không có quyền chạy thử mô phỏng kiểm thử phần cứng!');
      return;
    }
    const perm = canPerform('SIMULATE_SCENARIO');
    if (!perm.allowed) {
      setAuthNotice(perm.reason || 'Bạn không có quyền kích hoạt kịch bản mô phỏng!');
      return;
    }
    simulateScenario(scenario);
  };

  const handleAddRoomClick = () => {
    if (!currentUser) {
      setAuthNotice('Hệ thống đã khóa: Bạn đã đăng xuất hoặc chưa đăng nhập! Vui lòng đăng nhập để thêm phòng học.');
      openLoginModal();
      return;
    }
    if (currentUser.role === 'STUDENT') {
      setAuthNotice('Tài khoản Sinh viên ở chế độ Chỉ xem. Không có quyền thêm phòng học mới vào hệ thống!');
      return;
    }
    const perm = canPerform('ADD_ROOM');
    if (!perm.allowed) {
      setAuthNotice(perm.reason || 'Chỉ Quản trị viên và Kỹ thuật viên mới có quyền thêm phòng học mới!');
      return;
    }
    setShowAddModal(true);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    const ok = await refreshFromSupabase();
    setIsRefreshing(false);
    if (ok) {
      setActionMessage({
        text: `Đồng bộ thành công! Đã nạp chính xác ${classrooms.length} phòng học từ bảng 'rooms' trên Supabase.`,
        type: 'success',
      });
    } else {
      setActionMessage({
        text: 'Không thể đồng bộ từ Supabase. Vui lòng kiểm tra lại kết nối.',
        type: 'error',
      });
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleSeedDatabase = async () => {
    if (!currentUser) {
      setAuthNotice('Vui lòng đăng nhập để nạp dữ liệu mẫu!');
      openLoginModal();
      return;
    }
    if (currentUser.role === 'STUDENT') {
      setAuthNotice('Tài khoản Sinh viên không có quyền nạp dữ liệu mẫu vào cơ sở dữ liệu!');
      return;
    }
    const perm = canPerform('ADD_ROOM');
    if (!perm.allowed) {
      setAuthNotice(perm.reason || 'Chỉ Quản trị viên và Kỹ thuật viên mới có quyền nạp dữ liệu mẫu!');
      return;
    }
    setIsSubmitting(true);
    setActionMessage(null);
    const res = await seedSupabaseClassrooms();
    setIsSubmitting(false);

    if (res.success) {
      setActionMessage({
        text: `Đã nạp thành công ${res.count} phòng học vào bảng 'rooms' trên Supabase!`,
        type: 'success',
      });
    } else if (res.rlsBlocked) {
      setActionMessage({
        text: 'Bảng rooms đang bật RLS (Row Level Security). Vui lòng chạy câu lệnh mở quyền trong Supabase SQL Editor!',
        type: 'warning',
      });
      setShowSqlModal(true);
    } else {
      setActionMessage({
        text: `Lỗi khi nạp dữ liệu: ${res.error || 'Vui lòng kiểm tra lại kết nối Supabase'}`,
        type: 'error',
      });
    }
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleDeleteRoomClick = (cr: Classroom) => {
    if (!currentUser) {
      setAuthNotice('Hệ thống đã khóa: Bạn đã đăng xuất hoặc chưa đăng nhập! Vui lòng đăng nhập để xóa phòng học.');
      openLoginModal();
      return;
    }
    if (currentUser.role === 'STUDENT') {
      setAuthNotice('Tài khoản Sinh viên ở chế độ Chỉ xem. Không có quyền xóa phòng học khỏi hệ thống!');
      return;
    }
    const perm = canPerform('DELETE_ROOM', cr.id);
    if (!perm.allowed) {
      setAuthNotice(perm.reason || 'Chỉ Quản trị viên mới có quyền xóa phòng học khỏi hệ thống!');
      return;
    }
    setRoomToDelete(cr);
    setDeleteError(null);
    setDeleteRlsBlocked(false);
  };

  const handleConfirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    setIsDeletingRoom(true);
    setDeleteError(null);
    setDeleteRlsBlocked(false);

    const res = await deleteRoom(roomToDelete.id);
    setIsDeletingRoom(false);

    if (res.success) {
      setActionMessage({
        text: `Đã xóa thành công phòng học ${roomToDelete.code} (${roomToDelete.name})!`,
        type: 'success',
      });
      if (modalClassroom?.id === roomToDelete.id) {
        setModalClassroom(null);
      }
      setRoomToDelete(null);
      setTimeout(() => setActionMessage(null), 4000);
    } else if (res.rlsBlocked) {
      setDeleteRlsBlocked(true);
      setDeleteError('Supabase đang chặn thao tác xóa do Row Level Security (RLS).');
    } else {
      setDeleteError(res.error || 'Lỗi khi xóa phòng học trên Supabase.');
    }
  };


  // Filter classrooms
  const filteredClassrooms = classrooms.filter((cr) => {
    if (buildingFilter !== 'ALL' && cr.building !== buildingFilter) return false;
    if (statusFilter === 'ACTIVE') return cr.devices.some((d) => d.isOn);
    if (statusFilter === 'WARNING') return cr.warningForgotten;
    if (statusFilter === 'VACANT') return cr.isVacant;
    return true;
  });

  const buildings = ['ALL', 'Khu A', 'Khu B', 'Khu C', 'Khu H'];

  const sqlPolicySnippet = `-- 1. Mở toàn quyền truy cập (RLS) cho bảng rooms và devices trên Supabase
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to rooms" ON public.rooms;
CREATE POLICY "Allow all access to rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to devices" ON public.devices;
CREATE POLICY "Allow all access to devices" ON public.devices FOR ALL USING (true) WITH CHECK (true);

-- 2. Thêm ngay các phòng học mẫu vào bảng rooms
INSERT INTO public.rooms (room_name, building, is_active) VALUES
  ('Phòng học A101 - Smart Lab IoT', 'Khu A', true),
  ('Phòng học A102 - Trung tâm R&D', 'Khu A', true),
  ('Phòng học B204 - Giảng đường Đa Năng', 'Khu B', false),
  ('Phòng học C305 - Thực hành Điện - Điện Tử', 'Khu C', true),
  ('Phòng học H01 - Hội trường lớn 250 chỗ', 'Khu H', false);

-- 3. Thêm thiết bị vào phòng
INSERT INTO public.devices (room_id, device_name, device_type, is_on) VALUES
  (1, 'Đèn LED Chiếu Sáng (6 bộ 36W)', 'light', true),
  (1, 'Điều Hòa Daikin Inverter 2.5HP', 'ac', true),
  (1, 'Quạt Trần Vinawind 75W', 'fan', false),
  (1, 'Máy Chiếu Panasonic Laser 350W', 'projector', true),
  (2, 'Đèn LED Chiếu Sáng (6 bộ 36W)', 'light', true),
  (2, 'Điều Hòa Daikin Inverter 2.5HP', 'ac', true),
  (2, 'Quạt Trần Vinawind 75W', 'fan', true);`;

  return (
    <div className="space-y-6">
      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-fadeIn ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-600/70 text-emerald-200'
              : actionMessage.type === 'warning'
              ? 'bg-amber-950/80 border-amber-600/70 text-amber-200'
              : 'bg-rose-950/80 border-rose-600/70 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Supabase Live Connection & Count Sync Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Cơ Sở Dữ Liệu Supabase PostgreSQL
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {sourceTable === 'rooms' ? "Bảng 'rooms'" : sourceTable === 'classrooms' ? "Bảng 'classrooms'" : "Bảng 'rooms'"}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                Khớp {classrooms.length} phòng học
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              URL: <span className="font-mono text-slate-300">https://vvxieqsotbfhymaiqngb.supabase.co</span> · Tự động đồng bộ realtime qua WebSocket
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 disabled:opacity-50"
            title="Tải lại số lượng phòng học trực tiếp từ Supabase"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>Đồng bộ lại</span>
          </button>

          <button
            onClick={handleAddRoomClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm phòng mới</span>
          </button>

          <button
            onClick={() => setShowSqlModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Xem và sao chép SQL mở quyền RLS hoặc tạo phòng"
          >
            <Terminal className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">SQL & RLS</span>
          </button>
        </div>
      </div>

      {/* Persistent Session Notice for Logged Out or Student Account */}
      {!currentUser && (
        <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200 text-xs shadow-lg shadow-amber-950/30">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <span>Chế độ Xem Khách (Đã Đăng Xuất)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase font-semibold">
                  Khóa điều khiển
                </span>
              </div>
              <p className="text-amber-200/90 mt-1 leading-relaxed">
                Hệ thống đang khóa toàn bộ thao tác điều khiển thiết bị Relay 24V, Aptomat tổng và thêm/xóa phòng học. Bạn chỉ có quyền xem thông số đo lường điện năng. Vui lòng đăng nhập tài khoản có thẩm quyền để thao tác.
              </p>
            </div>
          </div>
          <button
            onClick={openLoginModal}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1.5 shadow-sm text-xs cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            <span>Đăng nhập ngay</span>
          </button>
        </div>
      )}

      {currentUser?.role === 'STUDENT' && (
        <div className="p-4 rounded-xl border border-blue-500/50 bg-blue-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-blue-200 text-xs shadow-lg shadow-blue-950/30">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0 mt-0.5 sm:mt-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <span>Tài Khoản Sinh Viên: {currentUser.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase font-semibold">
                  Chỉ Xem (Read-Only)
                </span>
              </div>
              <p className="text-blue-200/90 mt-1 leading-relaxed">
                Theo quy định an toàn điện trường học, tài khoản Sinh viên chỉ có quyền xem giám sát năng lượng và thời khóa biểu. Mọi thao tác đóng/ngắt thiết bị Relay 24V, Aptomat tổng và cấu hình hệ thống bị KHÓA.
              </p>
            </div>
          </div>
          <button
            onClick={openLoginModal}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-700/60 rounded-lg transition-colors shrink-0 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            <span>Đổi tài khoản khác</span>
          </button>
        </div>
      )}

      {/* RBAC Permission Warning Banner */}
      {authNotice && (
        <div className="bg-amber-950/80 border border-amber-600/70 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 animate-scaleUp shadow-lg shadow-amber-950/40">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Hạn Chế Phân Quyền (RBAC)
                {currentUser && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Vai trò: {currentUser.roleTitle}
                  </span>
                )}
              </h4>
              <p className="text-xs text-amber-200/90 mt-0.5">
                {authNotice}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openLoginModal}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Đổi Vai Trò / Đăng Nhập</span>
            </button>
            <button
              onClick={() => setAuthNotice(null)}
              className="p-1.5 text-amber-400 hover:text-white rounded-lg hover:bg-amber-900/40 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-medium">Tổng Công Suất Tiêu Thụ</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {formatWatts(classrooms.reduce((s, c) => s + c.totalPowerW, 0))}
            </span>
            <span className="text-xs text-slate-400">toàn trường</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {classrooms.length > 0 ? 'Tải điều hòa chiếm ~68% tổng công suất' : 'Chưa có tải điện đang hoạt động'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-medium">Tổng Điện Năng Hôm Nay</span>
            <Building className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {classrooms.reduce((s, c) => s + c.energyTodayKWh, 0).toFixed(2)} kWh
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-300">
            Cấp nguồn: <span className="font-semibold text-white">24.0V</span> · Hệ số công suất: <span className="font-semibold text-emerald-400">cos φ ≈ 0.98</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-medium">Số Lượng Phòng Học (Supabase)</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${classrooms.length > 0 ? 'text-white' : 'text-amber-400'}`}>
              {activeRoomCount} / {classrooms.length}
            </span>
            <span className="text-xs text-slate-400">
              phòng ({activeRoomCount} đang mở điện)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {classrooms.length === 0
              ? 'Bảng rooms trên Supabase hiện có 0 phòng'
              : `${classrooms.filter((c) => !c.isVacant).length} phòng đang có sinh viên`}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-medium">Cảnh Báo Quên Tắt Thiết Bị</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono ${
                classrooms.some((c) => c.warningForgotten)
                  ? 'text-rose-400'
                  : 'text-emerald-400'
              }`}
            >
              {classrooms.filter((c) => c.warningForgotten).length} phòng
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {classrooms.some((c) => c.warningForgotten)
              ? 'Đang kích hoạt quy trình tự ngắt relay 24V'
              : 'Tất cả phòng trống an toàn'}
          </div>
        </div>
      </div>

      {/* Physical ESP32 Hardware Link Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${
            esp32HardwareService.getStatus() === 'connected'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
          }`}>
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                Giao Tiếp Mạch Thực Tế ESP32 (PZEM-004T 24V · Relay 24V · PIR)
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                esp32HardwareService.getStatus() === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${esp32HardwareService.getStatus() === 'connected' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                {esp32HardwareService.getStatus() === 'connected'
                  ? `ĐÃ KẾT NỐI (${esp32HardwareService.getPortInfo()})`
                  : 'CHƯA KẾT NỐI MẠCH THẬT'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hỗ trợ kết nối trực tiếp cổng Serial USB (Web Serial API trên Chrome/Edge) hoặc qua WiFi/WebSocket để truyền nhận lệnh và đo lường trực tiếp.
            </p>
          </div>
        </div>

        <button
          onClick={openESP32Modal}
          className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-950/40 shrink-0"
        >
          <Cpu className="w-4 h-4" />
          <span>{esp32HardwareService.getStatus() === 'connected' ? 'Cấu Hình & Terminal ESP32' : 'Kết Nối Mạch ESP32'}</span>
        </button>
      </div>

      {/* When 0 classrooms are in Supabase: Dedicated, Helpful Onboarding / Empty State */}
      {classrooms.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-md">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Database className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Cơ Sở Dữ Liệu Supabase Hiện Có 0 Phòng Học
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Dashboard đã kết nối thành công tới database <strong className="text-cyan-300">Supabase</strong> qua bảng <code className="text-emerald-300 font-mono bg-slate-950 px-1 py-0.5 rounded">rooms</code>. Số lượng phòng hiển thị hiện tại là <span className="text-amber-400 font-mono font-bold">0 phòng</span>, hoàn toàn khớp với dữ liệu thực tế trên Supabase.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-2">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-left flex flex-col justify-between space-y-3 hover:border-emerald-600/50 transition-colors">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Cách 1: Nạp Mẫu
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  Nạp tự động 5 phòng học mẫu (A101, A102, B204, C305, H01) kèm thiết bị đo điện vào bảng rooms.
                </p>
              </div>
              <button
                onClick={handleSeedDatabase}
                disabled={isSubmitting}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span>Nạp 5 phòng mẫu vào Supabase</span>
              </button>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-left flex flex-col justify-between space-y-3 hover:border-cyan-600/50 transition-colors">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Cách 2: Tạo Thủ Công
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  Thêm trực tiếp phòng học mới theo nhu cầu thực tế của trường (Tên phòng, Tòa nhà, cảm biến).
                </p>
              </div>
              <button
                onClick={handleAddRoomClick}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm phòng học mới</span>
              </button>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-left flex flex-col justify-between space-y-3 hover:border-amber-600/50 transition-colors">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5" /> Cách 3: Chạy SQL
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  Mở quyền ghi RLS hoặc dán script SQL trực tiếp trong Supabase SQL Editor chỉ với 1 cú nhấp.
                </p>
              </div>
              <button
                onClick={() => setShowSqlModal(true)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-800/60 transition-colors flex items-center justify-center gap-1.5"
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>Xem câu lệnh SQL RLS</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={loadDemoClassrooms}
              className="text-xs text-slate-400 hover:text-slate-200 underline transition-colors"
            >
              Hoặc xem nhanh giao diện với dữ liệu mô phỏng tạm thời (không lưu database)
            </button>
          </div>
        </div>
      )}

      {/* Filter and Quick Scenario Demo Bar (only when classrooms exist) */}
      {classrooms.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Lọc theo:</span>
            </div>

            {/* Building filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {buildings.map((b) => (
                <button
                  key={b}
                  onClick={() => setBuildingFilter(b)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    buildingFilter === b
                      ? 'bg-slate-800 text-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {b === 'ALL' ? 'Tất cả tòa' : b}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'ACTIVE', label: 'Đang mở điện' },
                { id: 'WARNING', label: 'Cảnh báo quên tắt' },
                { id: 'VACANT', label: 'Phòng trống' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id as typeof statusFilter)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === st.id
                      ? 'bg-slate-800 text-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Demo Scenario Simulator Shortcuts */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Kịch bản kiểm thử:
            </span>
            <button
              onClick={() => handleSimulate('leave_empty_forget')}
              title="Mô phỏng: Hết giờ học, sinh viên ra về nhưng quên tắt điều hòa và đèn!"
              className="px-2.5 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 rounded-lg transition-colors cursor-pointer"
            >
              Mô phỏng quên tắt (Tan học)
            </button>
            <button
              onClick={() => handleSimulate('students_enter')}
              title="Mô phỏng: Cảm biến PIR phát hiện sinh viên vào phòng"
              className="px-2.5 py-1.5 text-xs font-medium text-blue-300 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/60 rounded-lg transition-colors cursor-pointer"
            >
              Mô phỏng vào lớp
            </button>
          </div>
        </div>
      )}

      {/* Classroom Section Title & Quick Add Bar */}
      {classrooms.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Building className="h-4 w-4 text-emerald-400" />
              <span>Danh Sách Phòng Học Giám Sát</span>
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
              {filteredClassrooms.length} / {classrooms.length} phòng
            </span>
          </div>

          <button
            onClick={handleAddRoomClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm phòng học mới</span>
          </button>
        </div>
      )}

      {/* Classroom Grid */}
      {classrooms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClassrooms.map((cr) => {
            const anyOn = cr.devices.some((d) => d.isOn);
            const acDevice = cr.devices.find((d) => d.type === 'ac');
            const lightsOn = cr.devices.filter((d) => d.type === 'light' && d.isOn).length;
            const fansOn = cr.devices.filter((d) => d.type === 'fan' && d.isOn).length;
            const acOn = cr.devices.filter((d) => d.type === 'ac' && d.isOn).length;

            return (
              <div
                key={cr.id}
                className={`rounded-xl border transition-all flex flex-col justify-between overflow-hidden ${
                  cr.warningForgotten
                    ? 'bg-slate-900/95 border-rose-500/70 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500/30'
                    : anyOn
                    ? 'bg-slate-900 border-slate-700/80 hover:border-slate-600'
                    : 'bg-slate-900/70 border-slate-800/80 opacity-90'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-slate-800/80">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white">
                          {cr.code}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {cr.building} · T{cr.floor}
                        </span>
                        {cr.warningForgotten ? (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                            QUÊN TẮT ĐIỆN!
                          </span>
                        ) : anyOn ? (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {!cr.isVacant ? 'ĐANG CÓ LỚP' : 'ĐANG MỞ ĐIỆN'}
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            ĐÃ TẮT HẾT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                        {cr.name}
                      </p>
                    </div>

                    {/* Master Power Toggle for this room */}
                    <button
                      onClick={() => handleRoomToggleAll(cr)}
                      title={
                        !currentUser
                          ? 'Đã khóa điều khiển (Chưa đăng nhập)'
                          : currentUser.role === 'STUDENT'
                          ? 'Đã khóa điều khiển (Tài khoản Sinh viên)'
                          : anyOn
                          ? 'Ngắt toàn bộ relay phòng'
                          : 'Bật thiết bị phòng'
                      }
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        anyOn
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Overtime countdown if warning */}
                  {cr.warningForgotten && (
                    <div className="mt-3 p-2 rounded bg-rose-950/60 border border-rose-800/80 text-xs text-rose-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="h-3.5 w-3.5 text-rose-400 animate-spin" />
                        Trống {cr.vacantDurationMinutes}p sau giờ học!
                      </span>
                      {cr.autoShutdownRemainingSec !== null && (
                        <span className="font-mono font-bold text-amber-300">
                          Tự ngắt sau: {cr.autoShutdownRemainingSec}s
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Metrics & Environment */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2 py-1 text-center bg-slate-950/60 rounded-lg p-2 border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Công suất</span>
                      {cr.isHardCutoff || cr.totalPowerW === 0 ? (
                        <>
                          <span className="text-sm font-bold font-mono text-slate-400">
                            0 W
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono block leading-none mt-0.5">
                            Ngắt CB 0W
                          </span>
                        </>
                      ) : !anyOn ? (
                        <>
                          <span className="text-sm font-bold font-mono text-cyan-400">
                            {formatWatts(cr.totalPowerW)}
                          </span>
                          <span
                            className="text-[9px] text-cyan-400/90 font-mono block leading-none mt-0.5 cursor-help"
                            title="Nguồn chờ tĩnh (Standby) nuôi bo mạch vi điều khiển ESP32, module PZEM-004T & cảm biến PIR"
                          >
                            Chờ tĩnh IoT
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-bold font-mono text-emerald-400">
                          {formatWatts(cr.totalPowerW)}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Nhiệt độ</span>
                      <span className="text-sm font-semibold font-mono text-amber-300">
                        {cr.temperature}°C
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Điện tích lũy</span>
                      <span className="text-sm font-semibold font-mono text-blue-400">
                        {cr.energyTodayKWh.toFixed(1)} kWh
                      </span>
                    </div>
                  </div>

                  {/* Quick device status indicators */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1 ${lightsOn > 0 ? 'text-amber-300' : 'text-slate-500'}`}>
                        <Lightbulb className="h-3.5 w-3.5" />
                        <span>{lightsOn} Đèn</span>
                      </span>
                      <span className={`flex items-center gap-1 ${fansOn > 0 ? 'text-cyan-300' : 'text-slate-500'}`}>
                        <Wind className="h-3.5 w-3.5" />
                        <span>{fansOn} Quạt</span>
                      </span>
                      <span className={`flex items-center gap-1 ${acOn > 0 ? 'text-blue-300 font-medium' : 'text-slate-500'}`}>
                        <Thermometer className="h-3.5 w-3.5" />
                        <span>
                          {acOn > 0 ? `${acOn} Máy lạnh (${acDevice?.acSettings?.targetTemp || 24}°C)` : 'Máy lạnh tắt'}
                        </span>
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {cr.voltageV}V
                    </span>
                  </div>
                </div>

                {/* Card Footer / Quick Controls */}
                <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedClassroomId(cr.id);
                      setModalClassroom(cr);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <span>Điều khiển & Giám sát</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {acDevice && (
                      <button
                        onClick={() => handleDeviceToggle(cr.id, acDevice.id)}
                        title="Bật/Tắt máy lạnh"
                        className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                          acDevice.isOn
                            ? 'bg-blue-900/50 text-blue-300 border border-blue-700/60'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        AC: {acDevice.isOn ? 'BẬT' : 'TẮT'}
                      </button>
                    )}
                    {anyOn ? (
                      <button
                        onClick={() => handleRoomTurnAllOff(cr.id)}
                        title="Ngắt nhanh toàn bộ thiết bị phòng"
                        className="px-2 py-1 text-xs rounded font-medium bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-800/60 transition-colors"
                      >
                        Ngắt điện
                      </button>
                    ) : (
                      <button
                        onClick={() => handleHardCutoffClick(cr)}
                        title={
                          !currentUser
                            ? 'Đã khóa điều khiển Aptomat (Chưa đăng nhập)'
                            : currentUser.role === 'STUDENT'
                            ? 'Đã khóa điều khiển Aptomat (Tài khoản Sinh viên)'
                            : cr.isHardCutoff
                            ? 'Bật lại nguồn chờ nuôi bo mạch IoT ESP32 (6.5W)'
                            : 'Ngắt hoàn toàn Aptomat tổng về 0W (Total Cutoff)'
                        }
                        className={`px-2 py-1 text-xs rounded font-medium border transition-colors cursor-pointer ${
                          cr.isHardCutoff
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                            : 'bg-cyan-950/50 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/60'
                        }`}
                      >
                        {cr.isHardCutoff ? 'Bật chờ 6.5W' : 'Ngắt CB 0W'}
                      </button>
                    )}

                    {/* Delete Room Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoomClick(cr);
                      }}
                      title="Xóa phòng học này khỏi hệ thống & cơ sở dữ liệu Supabase"
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/60 rounded border border-transparent hover:border-rose-800/60 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for full detailed controls */}
      {modalClassroom && (
        <RoomDetailModal
          classroom={classrooms.find((c) => c.id === modalClassroom.id) || modalClassroom}
          onClose={() => setModalClassroom(null)}
          onDeleteRoom={(cr) => handleDeleteRoomClick(cr)}
        />
      )}

      {/* Modal: Add New Room to Supabase */}
      <AddRoomModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(name) => {
          setActionMessage({
            text: `Đã tạo thành công "${name}" vào bảng 'rooms' trên Supabase!`,
            type: 'success',
          });
          setTimeout(() => setActionMessage(null), 5000);
        }}
      />

      {/* Modal: Confirm Delete Room */}
      <DeleteRoomModal
        isOpen={Boolean(roomToDelete)}
        classroom={roomToDelete}
        onClose={() => {
          if (!isDeletingRoom) {
            setRoomToDelete(null);
            setDeleteError(null);
            setDeleteRlsBlocked(false);
          }
        }}
        onConfirm={handleConfirmDeleteRoom}
        isDeleting={isDeletingRoom}
        errorMessage={deleteError}
        rlsBlocked={deleteRlsBlocked}
      />

      {/* Modal: SQL & RLS Script for Supabase SQL Editor */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Câu Lệnh SQL Cho Supabase SQL Editor</h3>
                  <p className="text-[11px] text-slate-400">Chạy câu lệnh này trên Supabase nếu gặp lỗi Row Level Security (RLS)</p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Dán vào <strong>SQL Editor</strong> của dự án <code>vvxieqsotbfhymaiqngb</code>:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sqlPolicySnippet);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 3000);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  {copiedSql ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                  <span>{copiedSql ? 'Đã chép vào bộ nhớ!' : 'Sao chép toàn bộ SQL'}</span>
                </button>
              </div>

              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-60 leading-relaxed">
                {sqlPolicySnippet}
              </pre>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Các bước thực hiện trên Supabase:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
                <li>Truy cập <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Supabase Dashboard</a> và chọn project <code>vvxieqsotbfhymaiqngb</code>.</li>
                <li>Vào tab <strong>SQL Editor</strong> ở thanh menu bên trái.</li>
                <li>Nhấn <strong>New Query</strong>, dán đoạn mã SQL trên rồi nhấn <strong>Run</strong> (hoặc Ctrl+Enter).</li>
                <li>Quay lại ứng dụng này và nhấn nút <strong>Đồng bộ lại</strong> trên thanh trạng thái.</li>
              </ol>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
