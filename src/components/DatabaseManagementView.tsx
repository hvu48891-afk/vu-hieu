import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../services/supabaseService';
import { useClassroom } from '../context/ClassroomContext';
import { useAuth } from '../context/AuthContext';
import { DbRoom, DbDevice, DbSchedule, DbUser, DbActivityLog, DeviceType } from '../types';
import {
  Database,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Cpu,
  Users,
  Activity,
  Zap,
  Power,
  Sliders,
  Check,
  X,
  ShieldCheck,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const DatabaseManagementView: React.FC = () => {
  const { classrooms, refreshFromSupabase } = useClassroom();
  const { currentUser, canPerform } = useAuth();

  // Active subtab: rooms, devices, schedules, activity_logs, users
  const [activeTableTab, setActiveTableTab] = useState<'rooms' | 'devices' | 'schedules' | 'activity_logs' | 'users'>('rooms');

  // Loading & notification state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Table Data states
  const [rooms, setRooms] = useState<DbRoom[]>([]);
  const [devices, setDevices] = useState<DbDevice[]>([]);
  const [schedules, setSchedules] = useState<DbSchedule[]>([]);
  const [users, setUsers] = useState<DbUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<DbActivityLog[]>([]);

  // Filtering
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [logSourceFilter, setLogSourceFilter] = useState<string>('all');

  // Modal / Form states
  const [showAddRoomModal, setShowAddRoomModal] = useState<boolean>(false);
  const [newRoomName, setNewRoomName] = useState<string>('');
  const [newRoomBuilding, setNewRoomBuilding] = useState<string>('Khu A');
  const [newRoomIsActive, setNewRoomIsActive] = useState<boolean>(true);

  const [showAddDeviceModal, setShowAddDeviceModal] = useState<boolean>(false);
  const [newDevRoomId, setNewDevRoomId] = useState<number>(1);
  const [newDevName, setNewDevName] = useState<string>('');
  const [newDevType, setNewDevType] = useState<DeviceType>('light');
  const [newDevPower, setNewDevPower] = useState<number>(200);
  const [newDevIsOn, setNewDevIsOn] = useState<boolean>(false);

  const [showAddScheduleModal, setShowAddScheduleModal] = useState<boolean>(false);
  const [newSchedRoomId, setNewSchedRoomId] = useState<number>(1);
  const [newSchedName, setNewSchedName] = useState<string>('');
  const [newSchedStart, setNewSchedStart] = useState<string>('07:00');
  const [newSchedEnd, setNewSchedEnd] = useState<string>('09:15');
  const [newSchedDays, setNewSchedDays] = useState<string>('2,3,4,5,6');
  const [newSchedCommand, setNewSchedCommand] = useState<'AUTO_POWER_ON' | 'AUTO_POWER_OFF' | 'AC_SET_TEMP' | 'ALL_OFF'>('AUTO_POWER_ON');

  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserUsername, setNewUserUsername] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<string>('lecturer');

  // Show temporary toast
  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Fetch all 5 tables from Supabase
  const loadAllTables = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rData, dData, sData, uData, lData] = await Promise.all([
        supabaseService.fetchRawRooms(),
        supabaseService.fetchRawDevices(),
        supabaseService.fetchSchedules(),
        supabaseService.fetchUsers(),
        supabaseService.fetchActivityLogs(100),
      ]);

      setRooms(rData);
      setDevices(dData);
      setSchedules(sData);
      setUsers(uData as DbUser[]);
      setActivityLogs(lData);
    } catch (err) {
      console.warn('Error loading database tables:', err);
      showFeedback('error', 'Lỗi khi kết nối lấy dữ liệu từ Supabase.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllTables();
  }, [loadAllTables]);

  // Handle Add Room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const res = await supabaseService.addRoom(newRoomName.trim(), newRoomBuilding.trim());

    if (res.success) {
      showFeedback('success', `Đã thêm phòng "${newRoomName}" vào bảng [rooms] trên Supabase!`);
      setShowAddRoomModal(false);
      setNewRoomName('');
      loadAllTables();
      refreshFromSupabase();
      supabaseService.logActivity({
        control_source: 'WEB_ADMIN',
        action_performed: `Thêm phòng học mới: ${newRoomName}`,
      });
    } else {
      showFeedback('error', res.error || 'Lỗi khi tạo phòng trên database.');
    }
  };

  // Handle Delete Room
  const handleDeleteRoom = async (roomId: number, roomName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phòng "${roomName}" (ID: ${roomId}) và tất cả thiết bị liên quan trên database?`)) {
      return;
    }
    const res = await supabaseService.deleteRoom(String(roomId));
    if (res.success) {
      showFeedback('success', `Đã xóa phòng "${roomName}" khỏi bảng [rooms]!`);
      loadAllTables();
      refreshFromSupabase();
      supabaseService.logActivity({
        control_source: 'WEB_ADMIN',
        action_performed: `Xóa phòng học ID: ${roomId} (${roomName})`,
      });
    } else {
      showFeedback('error', res.error || 'Lỗi khi xóa phòng trên database.');
    }
  };

  // Handle Toggle Room Active
  const handleToggleRoomActive = async (room: DbRoom) => {
    const updated = !room.is_active;
    const res = await supabaseService.updateRoom(room.id, { is_active: updated });
    if (res.success) {
      setRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, is_active: updated } : r)));
      showFeedback('success', `Đã đổi trạng thái phòng "${room.room_name}" thành: ${updated ? 'Hoạt động' : 'Tạm dừng'}`);
      refreshFromSupabase();
    } else {
      showFeedback('error', res.error || 'Lỗi cập nhật trạng thái phòng.');
    }
  };

  // Handle Create Device
  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevName.trim()) return;

    const res = await supabaseService.createDevice({
      room_id: Number(newDevRoomId),
      device_name: newDevName.trim(),
      device_type: newDevType,
      power_rating_watts: Number(newDevPower) || 100,
      is_on: newDevIsOn,
      target_temperature: newDevType === 'ac' ? 24 : null,
    });

    if (res.success) {
      showFeedback('success', `Đã thêm thiết bị "${newDevName}" vào bảng [devices]!`);
      setShowAddDeviceModal(false);
      setNewDevName('');
      loadAllTables();
      refreshFromSupabase();
      supabaseService.logActivity({
        device_id: res.data?.id,
        control_source: 'WEB_ADMIN',
        action_performed: `Thêm thiết bị mới "${newDevName}" vào phòng ID: ${newDevRoomId}`,
      });
    } else {
      showFeedback('error', res.error || 'Lỗi khi tạo thiết bị trên database.');
    }
  };

  // Handle Toggle Device On/Off in DB
  const handleToggleDevice = async (dev: DbDevice) => {
    const updated = !dev.is_on;
    const res = await supabaseService.updateDevice(dev.id, { is_on: updated });
    if (res.success) {
      setDevices((prev) => prev.map((d) => (d.id === dev.id ? { ...d, is_on: updated } : d)));
      showFeedback('success', `Đã ${updated ? 'BẬT' : 'TẮT'} thiết bị "${dev.device_name}" trên bảng [devices]!`);
      refreshFromSupabase();
      supabaseService.logActivity({
        device_id: dev.id,
        control_source: 'WEB_ADMIN',
        action_performed: `${updated ? 'BẬT' : 'TẮT'} thiết bị [${dev.device_name}] (Relay 220V)`,
      });
    } else {
      showFeedback('error', res.error || 'Lỗi cập nhật thiết bị.');
    }
  };

  // Handle Delete Device
  const handleDeleteDevice = async (deviceId: number, devName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa thiết bị "${devName}" (ID: ${deviceId}) khỏi database?`)) return;
    const res = await supabaseService.deleteDevice(deviceId);
    if (res.success) {
      showFeedback('success', `Đã xóa thiết bị "${devName}" khỏi bảng [devices]!`);
      loadAllTables();
      refreshFromSupabase();
      supabaseService.logActivity({
        device_id: deviceId,
        control_source: 'WEB_ADMIN',
        action_performed: `Xóa thiết bị ID: ${deviceId} (${devName})`,
      });
    } else {
      showFeedback('error', res.error || 'Lỗi xóa thiết bị.');
    }
  };

  // Handle Create Schedule
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedName.trim()) return;

    const res = await supabaseService.createSchedule({
      room_id: Number(newSchedRoomId),
      schedule_name: newSchedName.trim(),
      start_time: newSchedStart,
      end_time: newSchedEnd,
      days_of_week: newSchedDays,
      action_command: newSchedCommand,
      is_enabled: true,
    });

    if (res.success) {
      showFeedback('success', `Đã lưu lịch "${newSchedName}" vào bảng [schedules] trên database!`);
      setShowAddScheduleModal(false);
      setNewSchedName('');
      loadAllTables();
      supabaseService.logActivity({
        control_source: 'SCHEDULE_AUTO',
        action_performed: `Thêm lịch tự động mới: ${newSchedName} (${newSchedStart}-${newSchedEnd})`,
      });
    } else {
      showFeedback('error', res.error || 'Lỗi khi tạo lịch tự động trên database.');
    }
  };

  // Handle Toggle Schedule Enabled
  const handleToggleSchedule = async (sched: DbSchedule) => {
    const updated = !sched.is_enabled;
    const res = await supabaseService.toggleScheduleEnabled(sched.id, updated);
    if (res.success) {
      setSchedules((prev) => prev.map((s) => (s.id === sched.id ? { ...s, is_enabled: updated } : s)));
      showFeedback('success', `Đã ${updated ? 'KÍCH HOẠT' : 'TẠM TẮT'} lịch "${sched.schedule_name}"!`);
      supabaseService.logActivity({
        control_source: 'SCHEDULE_AUTO',
        action_performed: `${updated ? 'Kích hoạt' : 'Tắt'} lịch tự động ID: ${sched.id}`,
      });
    } else {
      showFeedback('error', res.error || 'Lỗi cập nhật lịch.');
    }
  };

  // Handle Delete Schedule
  const handleDeleteSchedule = async (scheduleId: number, schedName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa lịch "${schedName}" khỏi bảng [schedules]?`)) return;
    const res = await supabaseService.deleteSchedule(scheduleId);
    if (res.success) {
      showFeedback('success', `Đã xóa lịch "${schedName}" khỏi bảng [schedules]!`);
      loadAllTables();
      supabaseService.logActivity({
        control_source: 'SCHEDULE_AUTO',
        action_performed: `Xóa lịch tự động ID: ${scheduleId} (${schedName})`,
      });
    } else {
      showFeedback('error', res.error || 'Lỗi xóa lịch.');
    }
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const res = await supabaseService.registerUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      username: newUserUsername.trim() || undefined,
      role: newUserRole,
    });

    if (res.success) {
      showFeedback('success', `Đã thêm tài khoản "${newUserName}" vào bảng [users]!`);
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserUsername('');
      loadAllTables();
      supabaseService.logActivity({
        control_source: 'WEB_ADMIN',
        action_performed: `Tạo tài khoản người dùng mới: ${newUserEmail} (${newUserRole})`,
      });
    } else {
      showFeedback('error', res.error || 'Lỗi khi tạo người dùng.');
    }
  };

  // Handle Toggle User Active
  const handleToggleUserActive = async (user: DbUser) => {
    const updated = !user.is_active;
    const res = await supabaseService.updateUser(user.id, { is_active: updated });
    if (res.success) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: updated } : u)));
      showFeedback('success', `Đã ${updated ? 'Mở khóa' : 'Khóa'} tài khoản "${user.full_name}"!`);
      supabaseService.logActivity({
        user_id: user.id,
        control_source: 'WEB_ADMIN',
        action_performed: `${updated ? 'Mở khóa' : 'Khóa'} tài khoản ID: ${user.id} (${user.email})`,
      });
    } else {
      showFeedback('error', res.error || 'Lỗi cập nhật người dùng.');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId: number, email: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản "${email}" khỏi bảng [users]?`)) return;
    const res = await supabaseService.deleteUser(userId);
    if (res.success) {
      showFeedback('success', `Đã xóa tài khoản "${email}" khỏi database!`);
      loadAllTables();
      supabaseService.logActivity({
        user_id: userId,
        control_source: 'WEB_ADMIN',
        action_performed: `Xóa tài khoản ID: ${userId} (${email})`,
      });
    } else {
      showFeedback('error', res.error || 'Lỗi xóa tài khoản.');
    }
  };

  // Filtered devices
  const filteredDevices = devices.filter((d) => {
    if (selectedRoomFilter === 'all') return true;
    return String(d.room_id) === selectedRoomFilter;
  });

  // Filtered activity logs
  const filteredLogs = activityLogs.filter((log) => {
    if (logSourceFilter === 'all') return true;
    return log.control_source === logSourceFilter;
  });

  const getSourceBadgeClass = (source: string) => {
    switch (source) {
      case 'WEB_ADMIN':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'TOUCH_PANEL':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'SCHEDULE_AUTO':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'EMERGENCY_BUTTON':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Connected Database Identity & Live Sync Status */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Quản Trị Bảng Dữ Liệu Kết Nối (Supabase PostgreSQL)
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Đã kết nối trực tiếp
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Đồng bộ hai chiều với 5 bảng dữ liệu thực tế trên Supabase: <code className="text-cyan-300 font-mono">rooms</code>, <code className="text-cyan-300 font-mono">devices</code>, <code className="text-cyan-300 font-mono">schedules</code>, <code className="text-cyan-300 font-mono">activity_logs</code>, <code className="text-cyan-300 font-mono">users</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadAllTables}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span>{isLoading ? 'Đang tải...' : 'Làm mới bảng'}</span>
            </button>
          </div>
        </div>

        {/* 4 Quick Stat Counters matching Connected Tables */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Bảng rooms</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-white">{rooms.length}</span>
              <span className="text-[11px] text-slate-500">phòng</span>
            </div>
            <span className="text-[10px] text-emerald-400 block mt-0.5">
              {rooms.filter((r) => r.is_active).length} đang hoạt động
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Bảng devices</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-cyan-400">{devices.length}</span>
              <span className="text-[11px] text-slate-500">thiết bị</span>
            </div>
            <span className="text-[10px] text-cyan-400 block mt-0.5">
              {devices.filter((d) => d.is_on).length} đang đóng Relay
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Bảng schedules</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-amber-400">{schedules.length}</span>
              <span className="text-[11px] text-slate-500">quy tắc</span>
            </div>
            <span className="text-[10px] text-amber-400 block mt-0.5">
              {schedules.filter((s) => s.is_enabled).length} đang kích hoạt
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Bảng users</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-purple-400">{users.length}</span>
              <span className="text-[11px] text-slate-500">tài khoản</span>
            </div>
            <span className="text-[10px] text-purple-400 block mt-0.5">
              {users.filter((u) => u.is_active).length} đang mở khóa
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-400 block font-medium">Bảng activity_logs</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold font-mono text-emerald-400">{activityLogs.length}</span>
              <span className="text-[11px] text-slate-500">nhật ký</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Ghi log thời gian thực</span>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
              : 'bg-rose-950/80 border-rose-600 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Navigation Tabs corresponding directly to Database Tables */}
      <div className="border-b border-slate-800 flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 py-1">
          <button
            onClick={() => setActiveTableTab('rooms')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTableTab === 'rooms'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>1. Bảng rooms ({rooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTableTab('devices')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTableTab === 'devices'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span>2. Bảng devices ({devices.length})</span>
          </button>

          <button
            onClick={() => setActiveTableTab('schedules')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTableTab === 'schedules'
                ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>3. Bảng schedules ({schedules.length})</span>
          </button>

          <button
            onClick={() => setActiveTableTab('activity_logs')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTableTab === 'activity_logs'
                ? 'bg-slate-800 text-purple-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>4. Bảng activity_logs ({activityLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTableTab('users')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTableTab === 'users'
                ? 'bg-slate-800 text-blue-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>5. Bảng users ({users.length})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: BẢNG 'rooms' (Phòng học)
          ========================================================================= */}
      {activeTableTab === 'rooms' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                Danh Sách Phòng Học Trong Bảng [rooms]
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Các bản ghi phòng học đồng bộ với bảng điều khiển chính và cảm biến PZEM-004T.
              </p>
            </div>

            <button
              onClick={() => setShowAddRoomModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Phòng Mới Vào Database</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID (Khóa chính)</th>
                  <th className="py-3 px-4">Tên Phòng (room_name)</th>
                  <th className="py-3 px-4">Tòa Nhà (building)</th>
                  <th className="py-3 px-4">Trạng Thái (is_active)</th>
                  <th className="py-3 px-4">Ngày Tạo (created_at)</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {rooms.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{r.id}</td>
                    <td className="py-3 px-4 text-white font-semibold">{r.room_name}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px]">
                        {r.building}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleRoomActive(r)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border transition-colors ${
                          r.is_active
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${r.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        <span>{r.is_active ? 'Hoạt động (Active)' : 'Tắt (Inactive)'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : 'Mặc định'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteRoom(r.id, r.room_name)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/60 transition-colors"
                        title="Xóa phòng khỏi database"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: BẢNG 'devices' (Thiết bị & Relay)
          ========================================================================= */}
      {activeTableTab === 'devices' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="h-4 w-4 text-cyan-400" />
                Danh Sách Thiết Bị Trong Bảng [devices]
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Quản lý các tải công suất 220V (Đèn LED, Máy lạnh Daikin, Quạt trần, Máy chiếu) liên kết với từng phòng.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Room Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span>Lọc phòng:</span>
                <select
                  value={selectedRoomFilter}
                  onChange={(e) => setSelectedRoomFilter(e.target.value)}
                  className="bg-transparent border-0 text-white font-semibold focus:outline-none text-xs"
                >
                  <option value="all">Tất cả phòng ({devices.length})</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.room_name} (ID: {r.id})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowAddDeviceModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-sm active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm Thiết Bị Mới</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Phòng (room_id)</th>
                  <th className="py-3 px-4">Tên Thiết Bị (device_name)</th>
                  <th className="py-3 px-4">Loại (device_type)</th>
                  <th className="py-3 px-4">Công Suất (power_rating_watts)</th>
                  <th className="py-3 px-4">Nhiệt Độ AC (°C)</th>
                  <th className="py-3 px-4">Trạng Thái (is_on)</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredDevices.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-cyan-400 font-bold">{d.id}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[11px]">
                        Phòng ID: {d.room_id}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-semibold">{d.device_name}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
                        {d.device_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-300">{d.power_rating_watts} W</td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {d.device_type === 'ac' ? `${d.target_temperature ?? 24}°C` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleDevice(d)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                          d.is_on
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        <Power className={`h-3 w-3 ${d.is_on ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span>{d.is_on ? 'BẬT (CLOSED)' : 'TẮT (OPEN)'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteDevice(d.id, d.device_name)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/60 transition-colors"
                        title="Xóa thiết bị khỏi database"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: BẢNG 'schedules' (Lịch tự động)
          ========================================================================= */}
      {activeTableTab === 'schedules' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                Danh Sách Quy Tắc Học Vụ Trong Bảng [schedules]
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tự động đóng/ngắt contactor nguồn điện theo tiết học, ngày trong tuần và thời gian biểu.
              </p>
            </div>

            <button
              onClick={() => setShowAddScheduleModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-sm active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Lịch Tự Động Mới</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Phòng (room_id)</th>
                  <th className="py-3 px-4">Tên Lịch (schedule_name)</th>
                  <th className="py-3 px-4">Khung Giờ (start - end)</th>
                  <th className="py-3 px-4">Ngày (days_of_week)</th>
                  <th className="py-3 px-4">Lệnh (action_command)</th>
                  <th className="py-3 px-4">Kích Hoạt (is_enabled)</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Chưa có quy tắc nào trong bảng [schedules]. Hãy nhấn &quot;Thêm Lịch Tự Động Mới&quot; để tạo lịch!
                    </td>
                  </tr>
                ) : (
                  schedules.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-amber-400 font-bold">{s.id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-300">
                          Phòng ID: {s.room_id}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white font-semibold">{s.schedule_name}</td>
                      <td className="py-3 px-4 font-mono text-cyan-300">
                        {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px]">
                          T{s.days_of_week}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                          {s.action_command}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleSchedule(s)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                            s.is_enabled
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${s.is_enabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          <span>{s.is_enabled ? 'Đang chạy (Enabled)' : 'Tắt (Disabled)'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteSchedule(s.id, s.schedule_name)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/60 transition-colors"
                          title="Xóa lịch khỏi database"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: BẢNG 'activity_logs' (Nhật ký hoạt động)
          ========================================================================= */}
      {activeTableTab === 'activity_logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-400" />
                Nhật Ký Thao Tác Hệ Thống [activity_logs]
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Lịch sử thực tế ghi nhận từ Web Admin, Touch Panel tại chỗ, Tự động hóa lịch và Nút ngắt khẩn cấp.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span>Nguồn điều khiển:</span>
                <select
                  value={logSourceFilter}
                  onChange={(e) => setLogSourceFilter(e.target.value)}
                  className="bg-transparent border-0 text-white font-semibold focus:outline-none text-xs"
                >
                  <option value="all">Tất cả ({activityLogs.length})</option>
                  <option value="WEB_ADMIN">Web Admin</option>
                  <option value="TOUCH_PANEL">Touch Panel</option>
                  <option value="SCHEDULE_AUTO">Lịch tự động</option>
                  <option value="EMERGENCY_BUTTON">Ngắt khẩn cấp</option>
                  <option value="SYSTEM">Hệ thống ESP32</option>
                </select>
              </div>

              <button
                onClick={loadAllTables}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Làm mới nhật ký"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Nguồn (control_source)</th>
                  <th className="py-3 px-4">Hành Động Thực Hiện (action_performed)</th>
                  <th className="py-3 px-4">Device ID</th>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Thời Gian (created_at)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Chưa có bản ghi nào trong bảng [activity_logs].
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-purple-400 font-bold">{log.id}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getSourceBadgeClass(log.control_source)}`}>
                          {log.control_source}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white font-medium">{log.action_performed}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{log.device_id ?? '—'}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{log.user_id ?? '—'}</td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: BẢNG 'users' (Tài khoản người dùng)
          ========================================================================= */}
      {activeTableTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                Danh Sách Tài Khoản Trong Bảng [users]
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Phân quyền vai trò người dùng (manager/admin, lecturer, technician, student) và trạng thái hoạt động.
              </p>
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Tài Khoản Mới</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Họ và Tên (full_name)</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Vai Trò (role)</th>
                  <th className="py-3 px-4">Trạng Thái (is_active)</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-blue-400 font-bold">{u.id}</td>
                    <td className="py-3 px-4 text-white font-semibold">{u.full_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{u.username}</td>
                    <td className="py-3 px-4 font-mono text-cyan-300">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleUserActive(u)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                          u.is_active
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span>{u.is_active ? 'Hoạt động' : 'Bị Khóa'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/60 transition-colors"
                        title="Xóa tài khoản khỏi database"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: THÊM PHÒNG HỌC MỚI VÀO BẢNG 'rooms'
          ========================================================================= */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 text-slate-100 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-400" />
                Thêm Phòng Mới Vào Bảng [rooms]
              </h4>
              <button onClick={() => setShowAddRoomModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên Phòng (room_name) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Phòng học C301 - Smart IoT Lab"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tòa Nhà (building)
                </label>
                <input
                  type="text"
                  value={newRoomBuilding}
                  onChange={(e) => setNewRoomBuilding(e.target.value)}
                  placeholder="Khu A hoặc Khu B"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="roomActive"
                  checked={newRoomIsActive}
                  onChange={(e) => setNewRoomIsActive(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                />
                <label htmlFor="roomActive" className="text-xs text-slate-300 cursor-pointer">
                  Kích hoạt trạng thái hoạt động (is_active: true)
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-3.5 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950"
                >
                  Lưu Vào Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: THÊM THIẾT BỊ MỚI VÀO BẢNG 'devices'
          ========================================================================= */}
      {showAddDeviceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 text-slate-100 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus className="h-4 w-4 text-cyan-400" />
                Thêm Thiết Bị Vào Bảng [devices]
              </h4>
              <button onClick={() => setShowAddDeviceModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Thuộc Phòng Học (room_id)
                </label>
                <select
                  value={newDevRoomId}
                  onChange={(e) => setNewDevRoomId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.room_name} (ID: {r.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên Thiết Bị (device_name) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newDevName}
                  onChange={(e) => setNewDevName(e.target.value)}
                  placeholder="Đèn Tuýp LED Rạng Đông 18W"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Loại (device_type)
                  </label>
                  <select
                    value={newDevType}
                    onChange={(e) => setNewDevType(e.target.value as DeviceType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="light">Chiếu Sáng (Light)</option>
                    <option value="ac">Điều Hòa (AC)</option>
                    <option value="fan">Quạt Trần (Fan)</option>
                    <option value="projector">Máy Chiếu (Projector)</option>
                    <option value="aux">Ổ Cắm Phụ (Aux)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Công Suất Định Mức (W)
                  </label>
                  <input
                    type="number"
                    value={newDevPower}
                    onChange={(e) => setNewDevPower(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="devIsOn"
                  checked={newDevIsOn}
                  onChange={(e) => setNewDevIsOn(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-600 focus:ring-0"
                />
                <label htmlFor="devIsOn" className="text-xs text-slate-300 cursor-pointer">
                  Đóng mạch Relay ngay khi tạo (is_on: true)
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
                  className="px-3.5 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950"
                >
                  Lưu Vào Bảng devices
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: THÊM LỊCH MỚI VÀO BẢNG 'schedules'
          ========================================================================= */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 text-slate-100 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus className="h-4 w-4 text-amber-400" />
                Thêm Lịch Tự Động Vào Bảng [schedules]
              </h4>
              <button onClick={() => setShowAddScheduleModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Áp Dụng Cho Phòng (room_id)
                </label>
                <select
                  value={newSchedRoomId}
                  onChange={(e) => setNewSchedRoomId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.room_name} (ID: {r.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên Lịch Tự Động (schedule_name) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newSchedName}
                  onChange={(e) => setNewSchedName(e.target.value)}
                  placeholder="Tiết 1-3: Thực hành Lập trình IoT"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bắt đầu (start_time)
                  </label>
                  <input
                    type="time"
                    value={newSchedStart}
                    onChange={(e) => setNewSchedStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kết thúc (end_time)
                  </label>
                  <input
                    type="time"
                    value={newSchedEnd}
                    onChange={(e) => setNewSchedEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ngày (days_of_week)
                  </label>
                  <input
                    type="text"
                    value={newSchedDays}
                    onChange={(e) => setNewSchedDays(e.target.value)}
                    placeholder="2,3,4,5,6"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Lệnh (action_command)
                  </label>
                  <select
                    value={newSchedCommand}
                    onChange={(e) => setNewSchedCommand(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="AUTO_POWER_ON">Bật thiết bị (AUTO_POWER_ON)</option>
                    <option value="AUTO_POWER_OFF">Tắt thiết bị (AUTO_POWER_OFF)</option>
                    <option value="AC_SET_TEMP">Đặt nhiệt độ AC (AC_SET_TEMP)</option>
                    <option value="ALL_OFF">Ngắt toàn bộ (ALL_OFF)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddScheduleModal(false)}
                  className="px-3.5 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950"
                >
                  Lưu Vào Bảng schedules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: THÊM NGƯỜI DÙNG VÀO BẢNG 'users'
          ========================================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 text-slate-100 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-400" />
                Thêm Người Dùng Vào Bảng [users]
              </h4>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Họ và Tên (full_name) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Lê Hoàng Nam"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Địa Chỉ Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="nam.le@school.edu.vn"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    placeholder="nam_lh"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Vai Trò (role)
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="manager">Quản trị viên (manager / admin)</option>
                    <option value="lecturer">Giảng viên (lecturer)</option>
                    <option value="technician">Kỹ thuật viên (technician)</option>
                    <option value="student">Sinh viên (student)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3.5 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950"
                >
                  Lưu Vào Bảng users
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
