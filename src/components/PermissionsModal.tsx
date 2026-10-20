import React, { useState } from 'react';
import {
  useAuth,
  PERMISSION_LIST,
  ROLE_METAS,
  DEFAULT_ROLE_PERMISSIONS,
} from '../context/AuthContext';
import { useClassroom } from '../context/ClassroomContext';
import { UserRole, PermissionAction, User } from '../types';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Wrench,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Lock,
  Mail,
  Building,
  UserPlus,
  DoorOpen,
  Zap,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Search,
  ExternalLink,
  Info,
} from 'lucide-react';

export const PermissionsModal: React.FC = () => {
  const {
    isPermissionsModalOpen,
    closePermissionsModal,
    currentUser,
    users,
    switchUser,
    updateUserRole,
    updateUserRooms,
    addUser,
    deleteUser,
    resetDefaultUsers,
    canPerform,
  } = useAuth();

  const { classrooms } = useClassroom();

  const [activeTab, setActiveTab] = useState<'matrix' | 'users'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // State for Add User Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newDepartment, setNewDepartment] = useState('Khoa Điện tử Viễn thông');
  const [newRole, setNewRole] = useState<UserRole>('LECTURER');
  const [newAssignedRooms, setNewAssignedRooms] = useState<string[]>(['*']);

  // State for Room Assignment Modal
  const [editingRoomsUser, setEditingRoomsUser] = useState<User | null>(null);
  const [selectedRoomsForEdit, setSelectedRoomsForEdit] = useState<string[]>([]);

  if (!isPermissionsModalOpen) return null;

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 3500);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      showNotification('Vui lòng điền họ tên và email hợp lệ!', 'error');
      return;
    }

    const res = await addUser({
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      password: newPassword,
      role: newRole,
      roleTitle: ROLE_METAS[newRole].title,
      department: newDepartment.trim(),
      assignedRooms: newAssignedRooms,
      avatarInitials: newName
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .slice(-2)
        .join('')
        .toUpperCase() || 'NV',
      description: `Tài khoản ${ROLE_METAS[newRole].title} mới tạo. Tự động lưu vào Supabase.`,
    });

    if (res.success) {
      showNotification(`Đã tạo thành công tài khoản: ${newName} và lưu vào Database!`);
      setShowAddForm(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('123456');
    } else {
      showNotification(res.error || 'Lỗi khi tạo tài khoản', 'error');
    }
  };

  const handleOpenRoomAssignment = (user: User) => {
    setEditingRoomsUser(user);
    setSelectedRoomsForEdit([...user.assignedRooms]);
  };

  const handleSaveRoomAssignment = () => {
    if (editingRoomsUser) {
      updateUserRooms(editingRoomsUser.id, selectedRoomsForEdit);
      showNotification(`Đã cập nhật danh sách phòng phân quyền cho ${editingRoomsUser.name}`);
      setEditingRoomsUser(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <ShieldCheck className="h-4 w-4 text-purple-400" />;
      case 'LECTURER':
        return <GraduationCap className="h-4 w-4 text-blue-400" />;
      case 'TECHNICIAN':
        return <Wrench className="h-4 w-4 text-amber-400" />;
      case 'STUDENT':
        return <Users className="h-4 w-4 text-emerald-400" />;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Nghiêm trọng':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Cao':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Trung bình':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePermissionsModal();
      }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-5xl text-slate-100 overflow-hidden flex flex-col max-h-[94vh] animate-scaleUp">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  Trung Tâm Phân Quyền Hạn Tài Khoản (RBAC)
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Role-Based Access Control
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kiểm soát bảo vệ tiếp điểm Relay 220V, cơ sở dữ liệu Supabase và an toàn điện trường học
              </p>
            </div>
          </div>

          <button
            onClick={closePermissionsModal}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current User Session Bar */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400">
              {currentUser?.avatarInitials || 'AN'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{currentUser?.name || 'Chưa đăng nhập'}</span>
                {currentUser && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      ROLE_METAS[currentUser.role].badgeBg
                    } ${ROLE_METAS[currentUser.role].badgeText} ${
                      ROLE_METAS[currentUser.role].badgeBorder
                    }`}
                  >
                    {currentUser.roleTitle}
                  </span>
                )}
              </div>
              <span className="text-slate-400 text-[11px]">
                {currentUser?.email} · {currentUser?.department}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Phòng được giao:
            </span>
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700">
              {currentUser?.assignedRooms.includes('*')
                ? 'Toàn bộ phòng (*)'
                : currentUser?.assignedRooms.length
                ? currentUser.assignedRooms.join(', ')
                : 'Chưa gán phòng (Chỉ xem)'}
            </span>
          </div>
        </div>

        {/* Notification Banner */}
        {notice && (
          <div
            className={`px-6 py-2 text-xs flex items-center gap-2 border-b animate-fadeIn ${
              notice.type === 'error'
                ? 'bg-rose-950/70 border-rose-700 text-rose-200'
                : 'bg-emerald-950/70 border-emerald-700 text-emerald-200'
            }`}
          >
            {notice.type === 'error' ? (
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 bg-slate-950/50 border-b border-slate-800 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'border-purple-500 text-purple-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>1. Ma Trận Phân Quyền (Matrix)</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-purple-500 text-purple-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>2. Danh Sách Tài Khoản & Gán Quyền ({users.length})</span>
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: MA TRẬN PHÂN QUYỀN (MATRIX) */}
          {activeTab === 'matrix' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Nguyên Tắc An Toàn Tiếp Điểm Relay 220V & Dữ Liệu Trường Học
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Các thiết bị phụ tải trong phòng học (điều hòa 2.5HP dòng khởi động lớn, dàn đèn LED tuýp, quạt)
                      được đóng ngắt qua Relay Contactor 220V. Hệ thống phân quyền chặt chẽ theo 4 cấp bậc để ngăn chặn
                      sự cố chập cháy, phá hoại hoặc đóng ngắt nhầm ngoài giờ giảng dạy.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400">Trạng thái:</span>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                    Đang kích hoạt RBAC
                  </span>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                        <th className="py-3 px-4 font-semibold">Quyền Hạn & Thao Tác (Action)</th>
                        <th className="py-3 px-3 font-semibold text-center">Mức Rủi Ro</th>
                        <th className="py-3 px-3 font-semibold text-center text-purple-300 bg-purple-950/20">
                          👑 ADMIN
                        </th>
                        <th className="py-3 px-3 font-semibold text-center text-blue-300 bg-blue-950/20">
                          🎓 GIẢNG VIÊN
                        </th>
                        <th className="py-3 px-3 font-semibold text-center text-amber-300 bg-amber-950/20">
                          🔧 KỸ THUẬT
                        </th>
                        <th className="py-3 px-3 font-semibold text-center text-emerald-300 bg-emerald-950/20">
                          👤 SINH VIÊN
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {PERMISSION_LIST.map((perm) => {
                        const adminAllowed = DEFAULT_ROLE_PERMISSIONS.ADMIN[perm.action];
                        const lecturerAllowed = DEFAULT_ROLE_PERMISSIONS.LECTURER[perm.action];
                        const techAllowed = DEFAULT_ROLE_PERMISSIONS.TECHNICIAN[perm.action];
                        const studentAllowed = DEFAULT_ROLE_PERMISSIONS.STUDENT[perm.action];

                        return (
                          <tr key={perm.action} className="hover:bg-slate-850/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-200 text-xs flex items-center gap-2">
                                <span>{perm.name}</span>
                                <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                  {perm.action}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 max-w-md">
                                {perm.description}
                              </p>
                            </td>

                            <td className="py-3 px-3 text-center">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getRiskBadge(
                                  perm.riskLevel
                                )}`}
                              >
                                {perm.riskLevel}
                              </span>
                            </td>

                            {/* ADMIN */}
                            <td className="py-3 px-3 text-center bg-purple-950/10">
                              <div className="flex items-center justify-center gap-1 text-emerald-400 font-semibold">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-[11px]">Toàn quyền</span>
                              </div>
                            </td>

                            {/* LECTURER */}
                            <td className="py-3 px-3 text-center bg-blue-950/10">
                              {perm.action === 'CONTROL_DEVICE' ? (
                                <div className="flex items-center justify-center gap-1 text-blue-300 font-semibold">
                                  <DoorOpen className="h-4 w-4 text-blue-400" />
                                  <span className="text-[11px]">Phòng giao</span>
                                </div>
                              ) : lecturerAllowed ? (
                                <div className="flex items-center justify-center gap-1 text-emerald-400 font-semibold">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="text-[11px]">Cho phép</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1 text-slate-500">
                                  <XCircle className="h-4 w-4 text-slate-600" />
                                  <span className="text-[11px]">Bị chặn</span>
                                </div>
                              )}
                            </td>

                            {/* TECHNICIAN */}
                            <td className="py-3 px-3 text-center bg-amber-950/10">
                              {techAllowed ? (
                                <div className="flex items-center justify-center gap-1 text-emerald-400 font-semibold">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="text-[11px]">Cho phép</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1 text-slate-500">
                                  <XCircle className="h-4 w-4 text-slate-600" />
                                  <span className="text-[11px]">Bị chặn</span>
                                </div>
                              )}
                            </td>

                            {/* STUDENT */}
                            <td className="py-3 px-3 text-center bg-emerald-950/10">
                              {studentAllowed ? (
                                <div className="flex items-center justify-center gap-1 text-emerald-400 font-semibold">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="text-[11px]">Cho phép</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1 text-rose-400/80">
                                  <Lock className="h-3.5 w-3.5" />
                                  <span className="text-[11px]">Khóa an toàn</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DANH SÁCH TÀI KHOẢN & GÁN QUYỀN (USERS) */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Filter and Add User Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên, email, khoa..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                  >
                    <option value="ALL">Tất cả vai trò</option>
                    <option value="ADMIN">Quản trị viên</option>
                    <option value="LECTURER">Giảng viên</option>
                    <option value="TECHNICIAN">Kỹ thuật viên</option>
                    <option value="STUDENT">Sinh viên</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Thêm tài khoản mới</span>
                  </button>

                  <button
                    onClick={() => {
                      resetDefaultUsers();
                      showNotification('Đã khôi phục 4 tài khoản mặc định của hệ thống!');
                    }}
                    title="Khôi phục danh sách tài khoản mẫu ban đầu"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Add User Modal / Inline Form */}
              {showAddForm && (
                <form
                  onSubmit={handleCreateUser}
                  className="p-4 rounded-xl bg-slate-950 border border-purple-500/50 space-y-4 animate-scaleUp"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-purple-400" />
                      Tạo Tài Khoản Mới & Phân Cấp Vai Trò
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Họ và tên:</label>
                      <input
                        type="text"
                        required
                        placeholder="vd: ThS. Lê Văn Cường"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Email cơ sở giáo dục:</label>
                      <input
                        type="email"
                        required
                        placeholder="cuong.lv@campus.edu.vn"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Mật khẩu:</label>
                      <input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="123456"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Đơn vị / Khoa viện:</label>
                      <input
                        type="text"
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        placeholder="Khoa Điện tử Viễn thông"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Vai trò phân quyền:</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="ADMIN">Quản Trị Viên Cơ Sở Vật Chất (ADMIN)</option>
                        <option value="LECTURER">Giảng Viên Giảng Dạy (LECTURER)</option>
                        <option value="TECHNICIAN">Kỹ Thuật Viên IoT (TECHNICIAN)</option>
                        <option value="STUDENT">Sinh Viên - Chỉ Xem (STUDENT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Phòng học phân quyền:</label>
                      <select
                        value={newAssignedRooms.join(',')}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewAssignedRooms(val === '*' ? ['*'] : val.split(','));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="*">Toàn bộ phòng (*)</option>
                        <option value="cr-a101,cr-a102,A101,A102">Phòng A101 & A102</option>
                        <option value="cr-b204,B204">Phòng B204</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm"
                    >
                      Tạo tài khoản
                    </button>
                  </div>
                </form>
              )}

              {/* Users List Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                        <th className="py-3 px-4 font-semibold">Tài Khoản & Đơn Vị</th>
                        <th className="py-3 px-3 font-semibold">Vai Trò (Role)</th>
                        <th className="py-3 px-3 font-semibold">Phòng Được Giao</th>
                        <th className="py-3 px-3 font-semibold text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredUsers.map((user) => {
                        const isCurrent = currentUser?.id === user.id;

                        return (
                          <tr key={user.id} className="hover:bg-slate-850/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {user.avatarUrl ? (
                                  <img
                                    src={user.avatarUrl}
                                    alt={user.name}
                                    className="h-8 w-8 rounded-full object-cover border border-blue-500/50 shrink-0"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400 shrink-0">
                                    {user.avatarInitials}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-xs">{user.name}</span>
                                    {isCurrent && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                        Đang dùng
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {user.email} · {user.department}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <select
                                  value={user.role}
                                  onChange={(e) => {
                                    const r = e.target.value as UserRole;
                                    updateUserRole(user.id, r);
                                    showNotification(`Đã đổi vai trò của ${user.name} thành ${ROLE_METAS[r].title}`);
                                  }}
                                  className={`text-xs rounded-lg px-2 py-1 font-semibold border bg-slate-900 focus:outline-none ${
                                    ROLE_METAS[user.role].badgeBorder
                                  } ${ROLE_METAS[user.role].badgeText}`}
                                >
                                  <option value="ADMIN">ADMIN (Quản trị viên)</option>
                                  <option value="LECTURER">LECTURER (Giảng viên)</option>
                                  <option value="TECHNICIAN">TECHNICIAN (Kỹ thuật)</option>
                                  <option value="STUDENT">STUDENT (Sinh viên)</option>
                                </select>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {user.assignedRooms.includes('*') ? (
                                  <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800 text-purple-300 font-mono text-[11px]">
                                    Toàn trường (*)
                                  </span>
                                ) : user.assignedRooms.length > 0 ? (
                                  user.assignedRooms.map((r) => (
                                    <span
                                      key={r}
                                      className="px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-800 text-blue-300 font-mono text-[11px]"
                                    >
                                      {r}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-500 text-[11px] italic">
                                    Chưa gán (Chỉ xem)
                                  </span>
                                )}

                                <button
                                  onClick={() => handleOpenRoomAssignment(user)}
                                  title="Gán phòng được phép điều khiển"
                                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                >
                                  <Sliders className="h-3 w-3" />
                                </button>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    switchUser(user.id);
                                    showNotification(`Đã chuyển phiên làm việc sang: ${user.name}`);
                                  }}
                                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                                    isCurrent
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                  }`}
                                >
                                  {isCurrent ? 'Đang dùng' : 'Chọn phiên'}
                                </button>

                                {user.id !== 'user-admin' && (
                                  <button
                                    onClick={async () => {
                                      const res = await deleteUser(user.id);
                                      if (res.success) {
                                        showNotification(`Đã xóa tài khoản: ${user.name}`);
                                      } else {
                                        showNotification(res.error || 'Không thể xóa', 'error');
                                      }
                                    }}
                                    disabled={isCurrent}
                                    title={isCurrent ? 'Không thể xóa tài khoản đang đăng nhập' : 'Xóa tài khoản'}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 transition-colors disabled:opacity-30"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Lock className="h-3.5 w-3.5 text-slate-500" />
            <span>Phân quyền được áp dụng lập tức trên toàn bộ công tắc Relay 220V và Supabase.</span>
          </div>

          <button
            onClick={closePermissionsModal}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Đóng bảng phân quyền
          </button>
        </div>
      </div>

      {/* Nested Modal: Edit Assigned Rooms */}
      {editingRoomsUser && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 text-slate-100 space-y-4 animate-scaleUp">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <DoorOpen className="h-4 w-4 text-blue-400" />
                  Gán Phòng Học Phân Quyền
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chọn các phòng học mà <strong className="text-white">{editingRoomsUser.name}</strong> được quyền thao tác:
                </p>
              </div>
              <button
                onClick={() => setEditingRoomsUser(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRoomsForEdit.includes('*')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRoomsForEdit(['*']);
                    } else {
                      setSelectedRoomsForEdit([]);
                    }
                  }}
                  className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="font-bold text-xs text-white">Toàn bộ phòng học trong trường (*)</span>
                  <p className="text-[10px] text-slate-400">Không giới hạn theo từng phòng đơn lẻ</p>
                </div>
              </label>

              {!selectedRoomsForEdit.includes('*') && (
                <div className="max-h-56 overflow-y-auto space-y-1.5 p-1 border border-slate-800/80 rounded-xl bg-slate-950/60">
                  {classrooms.map((cr) => {
                    const isChecked =
                      selectedRoomsForEdit.includes(cr.id) ||
                      selectedRoomsForEdit.includes(cr.code) ||
                      selectedRoomsForEdit.includes(cr.name);

                    return (
                      <label
                        key={cr.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-900 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRoomsForEdit((prev) => [...prev, cr.code]);
                            } else {
                              setSelectedRoomsForEdit((prev) =>
                                prev.filter((r) => r !== cr.id && r !== cr.code && r !== cr.name)
                              );
                            }
                          }}
                          className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-white">{cr.name}</span>
                          <span className="text-slate-400 text-[11px] ml-2 font-mono">({cr.code} · {cr.building})</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingRoomsUser(null)}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveRoomAssignment}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-sm"
              >
                Lưu phân quyền phòng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
