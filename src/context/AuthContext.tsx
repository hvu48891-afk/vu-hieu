import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, PermissionAction } from '../types';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { supabaseService } from '../services/supabaseService';
import { dbService } from '../services/dbService';

export interface PermissionMeta {
  action: PermissionAction;
  name: string;
  description: string;
  category: 'Cơ sở dữ liệu & Phòng học' | 'Điều khiển Tiếp điểm 220V' | 'Vận hành & Tự động' | 'Hệ thống & Người dùng';
  riskLevel: 'Thấp' | 'Trung bình' | 'Cao' | 'Nghiêm trọng';
}

export const PERMISSION_LIST: PermissionMeta[] = [
  {
    action: 'ADD_ROOM',
    name: 'Thêm phòng học mới',
    description: 'Tạo phòng học mới trong Supabase PostgreSQL, cấu hình thiết bị phụ tải và thông số diện tích/tầng.',
    category: 'Cơ sở dữ liệu & Phòng học',
    riskLevel: 'Trung bình',
  },
  {
    action: 'DELETE_ROOM',
    name: 'Xóa phòng học',
    description: 'Xóa bản ghi phòng học và ngừng theo dõi thiết bị khỏi hệ thống giám sát.',
    category: 'Cơ sở dữ liệu & Phòng học',
    riskLevel: 'Cao',
  },
  {
    action: 'CONTROL_DEVICE',
    name: 'Đóng/ngắt Relay 220V (Đèn, Máy lạnh, Quạt)',
    description: 'Thao tác điều khiển đóng cắt tải điện vật lý qua tiếp điểm Contactor/Relay và chỉnh nhiệt độ điều hòa.',
    category: 'Điều khiển Tiếp điểm 220V',
    riskLevel: 'Cao',
  },
  {
    action: 'GLOBAL_SHUTDOWN',
    name: 'Ngắt điện toàn trường khẩn cấp',
    description: 'Phát bản tin MQTT Broadcast ngắt tức thì tất cả tiếp điểm Relay tại mọi phòng học trên toàn trường.',
    category: 'Điều khiển Tiếp điểm 220V',
    riskLevel: 'Nghiêm trọng',
  },
  {
    action: 'CONFIG_SCHEDULE',
    name: 'Cài đặt TKB & Luật tự động hóa',
    description: 'Thiết lập thời khóa biểu học vụ, quy tắc tự ngắt khi phòng trống sau N phút, và biểu giá điện EVN.',
    category: 'Vận hành & Tự động',
    riskLevel: 'Trung bình',
  },
  {
    action: 'SIMULATE_SCENARIO',
    name: 'Kích hoạt mô phỏng kiểm thử phần cứng',
    description: 'Mô phỏng sự kiện cảm biến PIR (sinh viên vào phòng, quên tắt điện khi tan học) để nghiệm thu hệ thống.',
    category: 'Vận hành & Tự động',
    riskLevel: 'Thấp',
  },
  {
    action: 'MANAGE_USERS',
    name: 'Quản lý tài khoản & Phân quyền',
    description: 'Đổi vai trò, gán danh sách phòng phụ trách, thêm/xóa tài khoản và cấu hình quyền hạn chi tiết.',
    category: 'Hệ thống & Người dùng',
    riskLevel: 'Nghiêm trọng',
  },
  {
    action: 'VIEW_TELEMETRY',
    name: 'Xem thông số PZEM-004T & Giám sát',
    description: 'Xem điện áp V, dòng điện A, công suất P, tần số Hz, hệ số Cos phi và biểu đồ năng lượng.',
    category: 'Hệ thống & Người dùng',
    riskLevel: 'Thấp',
  },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Record<PermissionAction, boolean>> = {
  ADMIN: {
    ADD_ROOM: true,
    DELETE_ROOM: true,
    CONTROL_DEVICE: true,
    GLOBAL_SHUTDOWN: true,
    CONFIG_SCHEDULE: true,
    SIMULATE_SCENARIO: true,
    MANAGE_USERS: true,
    VIEW_TELEMETRY: true,
  },
  LECTURER: {
    ADD_ROOM: false,
    DELETE_ROOM: false,
    CONTROL_DEVICE: true, // Only in assignedRooms!
    GLOBAL_SHUTDOWN: false,
    CONFIG_SCHEDULE: false,
    SIMULATE_SCENARIO: false,
    MANAGE_USERS: false,
    VIEW_TELEMETRY: true,
  },
  TECHNICIAN: {
    ADD_ROOM: true, // Technician can provision hardware/rooms for testing
    DELETE_ROOM: false,
    CONTROL_DEVICE: true, // Can test relay across campus
    GLOBAL_SHUTDOWN: false, // Cannot emergency shutdown campus without admin
    CONFIG_SCHEDULE: true, // Can adjust timing for maintenance
    SIMULATE_SCENARIO: true, // Can test PIR/sensor simulation
    MANAGE_USERS: false,
    VIEW_TELEMETRY: true,
  },
  STUDENT: {
    ADD_ROOM: false,
    DELETE_ROOM: false,
    CONTROL_DEVICE: false, // Pure view-only!
    GLOBAL_SHUTDOWN: false,
    CONFIG_SCHEDULE: false,
    SIMULATE_SCENARIO: false,
    MANAGE_USERS: false,
    VIEW_TELEMETRY: true,
  },
};

export interface RoleMeta {
  role: UserRole;
  title: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  summary: string;
  description: string;
}

export const ROLE_METAS: Record<UserRole, RoleMeta> = {
  ADMIN: {
    role: 'ADMIN',
    title: 'Quản Trị Viên Cơ Sở Vật Chất',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/40',
    summary: 'Toàn quyền tối cao',
    description: 'Toàn quyền quản trị cơ sở dữ liệu Supabase, thêm/xóa phòng học, ngắt điện toàn trường khẩn cấp, phân quyền tài khoản và cấu hình hệ thống.',
  },
  LECTURER: {
    role: 'LECTURER',
    title: 'Giảng Viên Giảng Dạy',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-500/40',
    summary: 'Quản lý phòng được phân công',
    description: 'Được quyền bật/tắt thiết bị đèn, quạt, điều hòa tại các phòng học được phân công trong lịch giảng dạy. Bị hạn chế ngắt điện toàn trường và thêm phòng.',
  },
  TECHNICIAN: {
    role: 'TECHNICIAN',
    title: 'Kỹ Thuật Viên Hệ Thống IoT',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/40',
    summary: 'Kiểm thử phần cứng & Bảo trì',
    description: 'Có quyền đóng ngắt relay mọi phòng để đo kiểm PZEM-004T, thêm phòng học mới để tích hợp phần cứng, chạy kịch bản mô phỏng kiểm thử.',
  },
  STUDENT: {
    role: 'STUDENT',
    title: 'Sinh Viên (Chế độ Chỉ xem)',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40',
    summary: 'Chỉ xem dữ liệu (Read-only)',
    description: 'Chỉ được xem nhiệt độ, độ ẩm, lịch học và biểu đồ tiêu thụ điện. Toàn bộ nút bật/tắt Relay 220V bị khóa nhằm đảm bảo an toàn điện trường học.',
  },
};

export const DEMO_USERS: (User & { password: string; description: string })[] = [
  {
    id: 'user-admin',
    name: 'ThS. Trần Quang Vinh',
    email: 'admin@campus.edu.vn',
    password: 'admin',
    role: 'ADMIN',
    roleTitle: 'Quản Trị Viên Cơ Sở Vật Chất',
    department: 'Phòng Quản Trị Thiết Bị & CSVC',
    avatarInitials: 'QV',
    assignedRooms: ['*'],
    description: 'Toàn quyền: Bật/tắt tất cả phòng học, ngắt điện toàn trường khẩn cấp, cấu hình tự động hóa & biểu giá EVN.',
    createdAt: '2026-01-10',
  },
  {
    id: 'user-lecturer',
    name: 'TS. Nguyễn Văn Tuấn',
    email: 'giangvien@campus.edu.vn',
    password: 'gv',
    role: 'LECTURER',
    roleTitle: 'Giảng Viên Giảng Dạy',
    department: 'Bộ môn Mạng & Hệ thống Nhúng (Khoa ĐTVT)',
    avatarInitials: 'VT',
    assignedRooms: ['cr-a101', 'cr-a102', 'A101', 'A102'],
    description: 'Quyền điều khiển phòng A101 & A102: Thao tác bật/tắt đèn, quạt, chỉnh máy lạnh, không được ngắt điện toàn trường.',
    createdAt: '2026-02-15',
  },
  {
    id: 'user-tech',
    name: 'KS. Lê Hoàng Minh',
    email: 'kythuat@campus.edu.vn',
    password: 'kt',
    role: 'TECHNICIAN',
    roleTitle: 'Kỹ Thuật Viên Hệ Thống IoT',
    department: 'Trung Tâm Thí Nghiệm & Đo Kiểm Phần Cứng',
    avatarInitials: 'HM',
    assignedRooms: ['*'],
    description: 'Kỹ thuật viên: Giám sát thông số PZEM-004T, kiểm tra tiếp điểm Relay 220V, xem live MQTT console, test kịch bản, thêm phòng test.',
    createdAt: '2026-03-01',
  },
  {
    id: 'user-student',
    name: 'Nguyễn Quốc Bảo (SV 21DTV01)',
    email: 'sinhvien@campus.edu.vn',
    password: 'sv',
    role: 'STUDENT',
    roleTitle: 'Sinh Viên (Chế độ Chỉ xem)',
    department: 'Lớp 21DTV01 - Khoa Điện tử Viễn thông',
    avatarInitials: 'QB',
    assignedRooms: [],
    description: 'Chỉ xem (View-only): Xem lịch học vụ, nhiệt độ phòng, biểu đồ năng lượng, bị khóa quyền điều khiển Relay 220V.',
    createdAt: '2026-03-12',
  },
];

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  login: (email: string, password?: string) => { success: boolean; error?: string };
  logout: () => void;
  quickLogin: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isPermissionsModalOpen: boolean;
  openPermissionsModal: () => void;
  closePermissionsModal: () => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  updateUserRooms: (userId: string, rooms: string[]) => void;
  updateUserPermissions: (userId: string, customPermissions: Partial<Record<PermissionAction, boolean>>) => void;
  addUser: (userData: Omit<User, 'id'>) => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    name: string;
    email: string;
    username?: string;
    password?: string;
    role?: UserRole;
    department?: string;
  }) => Promise<{ success: boolean; user?: User; error?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  resetDefaultUsers: () => void;
  loginWithGoogle: () => Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithGoogleEmail: (email: string, name?: string, photoUrl?: string) => { success: boolean; user?: User; error?: string };
  isGoogleAuthLoading: boolean;
  canPerform: (
    action: PermissionAction,
    roomId?: string
  ) => { allowed: boolean; reason?: string };
  isReadOnlySession: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_SESSION_KEY = 'smartclass_auth_user_session';
const STORAGE_USERS_KEY = 'smartclass_auth_users_list_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load users list from storage or default
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEMO_USERS;
  });

  // Khi khởi động web luôn bắt đầu bằng đăng nhập trước
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState<boolean>(false);

  // Sync users list to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch {
      // ignore
    }
  }, [users]);

  // Sync current user session to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_SESSION_KEY);
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  // Load and sync users from Supabase 'users' table
  useEffect(() => {
    const loadSupabaseUsers = async () => {
      try {
        const sbUsers = await supabaseService.fetchUsers();
        if (sbUsers && sbUsers.length > 0) {
          setUsers((prev) => {
            const map = new Map<string, User>();
            prev.forEach((u) => map.set(u.email.toLowerCase(), u));

            sbUsers.forEach((row) => {
              const emailKey = row.email.toLowerCase();
              if (!map.has(emailKey)) {
                let mappedRole: UserRole = 'LECTURER';
                const r = row.role.toLowerCase();
                if (r === 'admin' || r === 'manager') mappedRole = 'ADMIN';
                else if (r === 'technician' || r === 'tech') mappedRole = 'TECHNICIAN';
                else if (r === 'student') mappedRole = 'STUDENT';

                const roleMeta = ROLE_METAS[mappedRole];
                const initials =
                  row.full_name
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(-2)
                    .join('')
                    .toUpperCase() || 'SB';

                const u: User = {
                  id: `user-sb-${row.id}`,
                  name: row.full_name || row.username,
                  email: row.email,
                  role: mappedRole,
                  roleTitle: roleMeta.title,
                  department: 'Cơ sở dữ liệu Supabase',
                  avatarInitials: initials,
                  authProvider: 'password',
                  assignedRooms: ['*'],
                  description: `Tài khoản đã đăng ký trên Supabase (ID: ${row.id}, @${row.username}).`,
                  createdAt: row.created_at ? row.created_at.split('T')[0] : '2026-10-15',
                };
                map.set(emailKey, u);
              }
            });

            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('[AuthContext] Load Supabase users failed:', err);
      }
    };

    loadSupabaseUsers();
  }, []);

  // If a user in `users` gets updated, keep `currentUser` updated if it's the same user
  useEffect(() => {
    if (currentUser) {
      const updated = users.find((u) => u.id === currentUser.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(currentUser)) {
        setCurrentUser(updated);
      }
    }
  }, [users, currentUser]);

  const login = useCallback(
    (identifier: string, password?: string): { success: boolean; error?: string } => {
      const cleanInput = identifier.trim().toLowerCase();
      if (!cleanInput) {
        return { success: false, error: 'Vui lòng nhập địa chỉ Email hoặc Tên đăng nhập!' };
      }

      // Tìm trong danh sách tài khoản đã đăng ký (email, username, hoặc tiền tố email)
      const matched = users.find((u) => {
        const uEmail = (u.email || '').toLowerCase().trim();
        const uUsername = (u.username || '').toLowerCase().trim();
        const uPrefix = uEmail.split('@')[0];
        return uEmail === cleanInput || (uUsername && uUsername === cleanInput) || uPrefix === cleanInput;
      });

      if (matched) {
        const inputPass = (password || '').trim();
        const expectedPass = (matched.password || '').trim();
        // Kiểm tra mật khẩu (khớp mật khẩu đã đăng ký, hoặc 123456)
        if (expectedPass && inputPass && inputPass !== expectedPass && inputPass !== '123456') {
          return {
            success: false,
            error: `Mật khẩu không chính xác cho tài khoản "${matched.name}". Vui lòng kiểm tra lại!`,
          };
        }
        setCurrentUser(matched);
        setIsLoginModalOpen(false);
        return { success: true };
      }

      return {
        success: false,
        error: `Tài khoản "${identifier}" chưa được đăng ký trong hệ thống. Vui lòng chuyển sang tab "Đăng Ký Tài Khoản" hoặc kiểm tra lại thông tin.`,
      };
    },
    [users]
  );

  const quickLogin = useCallback(
    (role: UserRole) => {
      const matched = users.find((u) => u.role === role) || DEMO_USERS.find((u) => u.role === role) || users[0];
      setCurrentUser(matched);
      setIsLoginModalOpen(false);
    },
    [users]
  );

  const switchUser = useCallback(
    (userId: string) => {
      const matched = users.find((u) => u.id === userId);
      if (matched) {
        setCurrentUser(matched);
      }
    },
    [users]
  );

  const [isGoogleAuthLoading, setIsGoogleAuthLoading] = useState<boolean>(false);

  // Auto-sync Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser && fbUser.email) {
        const email = fbUser.email.toLowerCase();
        setUsers((prevUsers) => {
          const existing = prevUsers.find((u) => u.email.toLowerCase() === email);
          if (existing) {
            const updated: User = {
              ...existing,
              avatarUrl: fbUser.photoURL || existing.avatarUrl,
              authProvider: 'google',
            };
            return prevUsers.map((u) => (u.id === existing.id ? updated : u));
          } else {
            const isAdminEmail =
              email.includes('hvu48891@gmail.com') ||
              email.includes('admin') ||
              email.includes('quanly');
            const assignedRole: UserRole = isAdminEmail ? 'ADMIN' : 'LECTURER';
            const roleMeta = ROLE_METAS[assignedRole];
            const displayName = fbUser.displayName || email.split('@')[0];
            const newUser: User = {
              id: `google-${fbUser.uid}`,
              name: displayName,
              email: fbUser.email || email,
              role: assignedRole,
              roleTitle: roleMeta.title,
              department: isAdminEmail ? 'Ban Quản Trị Hệ Thống Cơ Sở Vật Chất' : 'Giảng Viên Đại Học (Google Auth)',
              avatarInitials: displayName.slice(0, 2).toUpperCase(),
              avatarUrl: fbUser.photoURL || undefined,
              authProvider: 'google',
              assignedRooms: ['*'],
              description: `Tài khoản Google liên kết xác thực (${email}). Được cấp quyền ${roleMeta.title}.`,
              createdAt: new Date().toISOString().split('T')[0],
            };
            return [newUser, ...prevUsers];
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<{ success: boolean; user?: User; error?: string }> => {
    setIsGoogleAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      const email = fbUser.email || '';
      const displayName = fbUser.displayName || email.split('@')[0] || 'Tài khoản Google';
      const photoURL = fbUser.photoURL || undefined;

      const trimmedEmail = email.toLowerCase();
      let matched = users.find((u) => u.email.toLowerCase() === trimmedEmail);

      let targetUser: User;
      if (matched) {
        targetUser = {
          ...matched,
          avatarUrl: photoURL || matched.avatarUrl,
          authProvider: 'google',
        };
        setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? targetUser : u)));
      } else {
        const isAdminEmail =
          trimmedEmail.includes('hvu48891@gmail.com') ||
          trimmedEmail.includes('admin') ||
          trimmedEmail.includes('quanly');
        const assignedRole: UserRole = isAdminEmail ? 'ADMIN' : 'LECTURER';
        const roleMeta = ROLE_METAS[assignedRole];
        const initials = displayName.slice(0, 2).toUpperCase();

        targetUser = {
          id: `google-${fbUser.uid}`,
          name: displayName,
          email: email,
          role: assignedRole,
          roleTitle: roleMeta.title,
          department: isAdminEmail ? 'Ban Quản Trị Cơ Sở Vật Chất' : 'Giảng Viên Đại Học (Google)',
          avatarInitials: initials,
          avatarUrl: photoURL,
          authProvider: 'google',
          assignedRooms: ['*'],
          description: `Tài khoản Google liên kết xác thực (${email}). Phân quyền: ${roleMeta.title}.`,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setUsers((prev) => [targetUser, ...prev]);
      }

      setCurrentUser(targetUser);
      setIsLoginModalOpen(false);
      setIsGoogleAuthLoading(false);
      return { success: true, user: targetUser };
    } catch (err: unknown) {
      setIsGoogleAuthLoading(false);
      const errCode = (err as { code?: string })?.code || '';
      const errMsg = (err as { message?: string })?.message || String(err);
      console.warn('Google sign-in error:', errCode, errMsg);

      if (errCode === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Bạn đã đóng cửa sổ đăng nhập Google.' };
      }
      if (errCode === 'auth/popup-blocked') {
        return {
          success: false,
          error: 'Cửa sổ đăng nhập Google bị trình duyệt chặn (Popup Blocked). Vui lòng cho phép popup trong thanh địa chỉ hoặc dùng đăng nhập Google nhanh.',
        };
      }
      if (errCode === 'auth/unauthorized-domain') {
        return {
          success: false,
          error: 'auth/unauthorized-domain: Tên miền dev chưa nằm trong danh sách Authorized Domains của Firebase Auth. Bạn có thể sử dụng tính năng Đăng Nhập Google Nhanh bên dưới để tiếp tục.',
        };
      }
      return {
        success: false,
        error: `Lỗi đăng nhập Google: ${errMsg}`,
      };
    }
  }, [users]);

  const loginWithGoogleEmail = useCallback(
    (customEmail: string, customName?: string, photoUrl?: string): { success: boolean; user?: User; error?: string } => {
      const email = customEmail.trim().toLowerCase();
      if (!email.includes('@')) {
        return { success: false, error: 'Vui lòng nhập định dạng email Google hợp lệ!' };
      }
      const displayName = customName?.trim() || email.split('@')[0];
      const initials = displayName.slice(0, 2).toUpperCase();

      let matched = users.find((u) => u.email.toLowerCase() === email);
      let targetUser: User;

      if (matched) {
        targetUser = {
          ...matched,
          avatarUrl: photoUrl || matched.avatarUrl,
          authProvider: 'google',
        };
        setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? targetUser : u)));
      } else {
        const isAdminEmail =
          email.includes('hvu48891@gmail.com') ||
          email.includes('admin') ||
          email.includes('quanly');
        const assignedRole: UserRole = isAdminEmail ? 'ADMIN' : 'LECTURER';
        const roleMeta = ROLE_METAS[assignedRole];

        targetUser = {
          id: `google-account-${Date.now()}`,
          name: displayName,
          email: email,
          role: assignedRole,
          roleTitle: roleMeta.title,
          department: isAdminEmail ? 'Ban Quản Trị Cơ Sở Vật Chất' : 'Giảng Viên Đại Học (Google)',
          avatarInitials: initials,
          avatarUrl: photoUrl,
          authProvider: 'google',
          assignedRooms: ['*'],
          description: `Tài khoản Google liên kết xác thực (${email}). Cấp quyền ${roleMeta.title}.`,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setUsers((prev) => [targetUser, ...prev]);
      }

      setCurrentUser(targetUser);
      setIsLoginModalOpen(false);
      return { success: true, user: targetUser };
    },
    [users]
  );

  const logout = useCallback(() => {
    firebaseSignOut(auth).catch(() => {});
    setCurrentUser(null);
  }, []);

  const openLoginModal = useCallback(() => {
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const openPermissionsModal = useCallback(() => {
    setIsPermissionsModalOpen(true);
  }, []);

  const closePermissionsModal = useCallback(() => {
    setIsPermissionsModalOpen(false);
  }, []);

  const updateUserRole = useCallback((userId: string, newRole: UserRole) => {
    const roleMeta = ROLE_METAS[newRole];
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            role: newRole,
            roleTitle: roleMeta.title,
            description: roleMeta.description,
          };
        }
        return u;
      })
    );
  }, []);

  const updateUserRooms = useCallback((userId: string, rooms: string[]) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            assignedRooms: rooms,
          };
        }
        return u;
      })
    );
  }, []);

  const updateUserPermissions = useCallback(
    (userId: string, customPermissions: Partial<Record<PermissionAction, boolean>>) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            return {
              ...u,
              customPermissions,
            };
          }
          return u;
        })
      );
    },
    []
  );

  const addUser = useCallback(
    async (userData: Omit<User, 'id'>): Promise<{ success: boolean; error?: string }> => {
      if (!userData.email.trim() || !userData.name.trim()) {
        return { success: false, error: 'Họ tên và Email không được để trống!' };
      }
      const roleMeta = ROLE_METAS[userData.role];
      const newUser: User = {
        ...userData,
        id: 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        roleTitle: userData.roleTitle || roleMeta.title,
        avatarInitials:
          userData.avatarInitials ||
          userData.name
            .split(' ')
            .filter(Boolean)
            .map((n) => n[0])
            .slice(-2)
            .join('')
            .toUpperCase() ||
          'US',
        createdAt: new Date().toISOString().split('T')[0],
      };

      // Persist to Supabase 'users' table
      supabaseService.registerUser({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      }).catch(console.warn);

      // Persist to Firestore
      dbService.saveUser(newUser).catch(console.warn);

      setUsers((prev) => [newUser, ...prev]);
      return { success: true };
    },
    []
  );

  const register = useCallback(
    async (userData: {
      name: string;
      email: string;
      username?: string;
      password?: string;
      role?: UserRole;
      department?: string;
    }): Promise<{ success: boolean; user?: User; error?: string }> => {
      const cleanEmail = userData.email.trim().toLowerCase();
      const cleanName = userData.name.trim();

      if (!cleanEmail || !cleanName) {
        return { success: false, error: 'Vui lòng điền đầy đủ Họ tên và Email!' };
      }
      if (!cleanEmail.includes('@')) {
        return { success: false, error: 'Định dạng email không hợp lệ!' };
      }

      // Check if already registered
      const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return {
          success: false,
          error: `Email ${cleanEmail} đã tồn tại trong hệ thống! Vui lòng dùng email khác hoặc chuyển sang tab Đăng nhập.`,
        };
      }

      const selectedRole: UserRole = userData.role || 'LECTURER';
      const roleMeta = ROLE_METAS[selectedRole];
      const cleanPassword = userData.password || '123456';
      const cleanDept = userData.department?.trim() || 'Khoa Điện tử - Viễn thông / IoT';
      const initials =
        cleanName
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0])
          .slice(-2)
          .join('')
          .toUpperCase() || 'ND';

      const newUserId = 'user-' + Date.now();
      const newUser: User = {
        id: newUserId,
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        role: selectedRole,
        roleTitle: roleMeta.title,
        department: cleanDept,
        avatarInitials: initials,
        authProvider: 'password',
        assignedRooms: ['*'],
        description: `Tài khoản ${roleMeta.title} đăng ký trực tuyến. Đã ghi vào cơ sở dữ liệu Supabase & Cloud.`,
        createdAt: new Date().toISOString().split('T')[0],
      };

      // 1. Write directly to Supabase 'users' table
      const sbRes = await supabaseService.registerUser({
        name: cleanName,
        email: cleanEmail,
        username: userData.username,
        role: selectedRole,
      });

      if (!sbRes.success) {
        console.warn('[Supabase] Warning registering user to Supabase:', sbRes.error);
      }

      // 2. Write to Firestore 'users' collection
      await dbService.saveUser(newUser);

      // 3. Update React state and switch current session
      setUsers((prev) => [newUser, ...prev]);
      setCurrentUser(newUser);
      setIsLoginModalOpen(false);

      return { success: true, user: newUser };
    },
    [users]
  );

  const deleteUser = useCallback(
    async (userId: string): Promise<{ success: boolean; error?: string }> => {
      if (currentUser && currentUser.id === userId) {
        return { success: false, error: 'Không thể xóa tài khoản đang đăng nhập hiện tại!' };
      }
      if (userId === 'user-admin') {
        return { success: false, error: 'Không thể xóa Quản trị viên hệ thống gốc (Root Admin)!' };
      }

      const target = users.find((u) => u.id === userId);
      if (target) {
        // Delete from Supabase
        supabaseService.deleteUser(target.email).catch(console.warn);
      }
      // Delete from Firestore
      dbService.deleteUser(userId).catch(console.warn);

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      return { success: true };
    },
    [currentUser, users]
  );

  const resetDefaultUsers = useCallback(() => {
    setUsers(DEMO_USERS);
    setCurrentUser(DEMO_USERS[0]);
  }, []);

  /**
   * Check role-based permission
   */
  const canPerform = useCallback(
    (
      action: PermissionAction,
      roomId?: string
    ): { allowed: boolean; reason?: string } => {
      if (!currentUser) {
        if (action === 'VIEW_TELEMETRY') {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: 'Hệ thống đã khóa điều khiển: Bạn đã đăng xuất hoặc chưa đăng nhập! Vui lòng đăng nhập để thao tác hệ thống.',
        };
      }

      // Root ADMIN has full system-wide permissions
      if (currentUser.role === 'ADMIN') {
        return { allowed: true };
      }

      // STUDENT role is STRICTLY READ-ONLY: NO operations allowed on the system!
      if (currentUser.role === 'STUDENT') {
        if (action === 'VIEW_TELEMETRY') {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: 'Tài khoản Sinh viên ở chế độ Chỉ xem. Mọi thao tác đóng/ngắt thiết bị Relay 220V, Aptomat và cấu hình hệ thống bị khóa theo quy định!',
        };
      }

      // Check user custom permissions override first
      if (currentUser.customPermissions && currentUser.customPermissions[action] !== undefined) {
        const isCustomAllowed = currentUser.customPermissions[action];
        if (!isCustomAllowed) {
          return {
            allowed: false,
            reason: `Tài khoản của bạn đã bị Quản trị viên cấu hình vô hiệu hóa quyền '${action}'.`,
          };
        }
      } else {
        // Fallback to role default permissions
        const isRoleAllowed = DEFAULT_ROLE_PERMISSIONS[currentUser.role]?.[action] ?? false;
        if (!isRoleAllowed) {
          switch (action) {
            case 'GLOBAL_SHUTDOWN':
              return {
                allowed: false,
                reason: 'Chỉ Quản trị viên Cơ sở vật chất mới có quyền ngắt điện toàn trường khẩn cấp!',
              };
            case 'ADD_ROOM':
              return {
                allowed: false,
                reason: 'Chỉ Quản trị viên và Kỹ thuật viên IoT mới có quyền thêm phòng học mới vào cơ sở dữ liệu Supabase!',
              };
            case 'DELETE_ROOM':
              return {
                allowed: false,
                reason: 'Chỉ Quản trị viên Cơ sở vật chất mới có quyền xóa phòng học khỏi hệ thống!',
              };
            case 'MANAGE_USERS':
              return {
                allowed: false,
                reason: 'Chỉ Quản trị viên Cơ sở vật chất mới có quyền quản lý phân quyền và người dùng!',
              };
            case 'CONFIG_SCHEDULE':
              return {
                allowed: false,
                reason: 'Chỉ Quản trị viên và Kỹ thuật viên mới có quyền cấu hình luật tự động hóa và thời khóa biểu!',
              };
            case 'SIMULATE_SCENARIO':
              return {
                allowed: false,
                reason: 'Tài khoản Sinh viên không có quyền kích hoạt kịch bản mô phỏng kiểm thử phần cứng!',
              };
            case 'CONTROL_DEVICE':
              return {
                allowed: false,
                reason: 'Tài khoản Sinh viên ở chế độ Chỉ xem. Quyền đóng ngắt tiếp điểm Relay 220V bị khóa để đảm bảo an toàn điện trường học.',
              };
            default:
              return {
                allowed: false,
                reason: 'Bạn không có quyền thực hiện thao tác này.',
              };
          }
        }
      }

      // Detailed room scoping for CONTROL_DEVICE
      if (action === 'CONTROL_DEVICE') {
        if (currentUser.role === 'TECHNICIAN' || currentUser.assignedRooms.includes('*')) {
          return { allowed: true };
        }

        if (currentUser.role === 'LECTURER') {
          if (!roomId) return { allowed: true };

          // Normalize room IDs / codes (supports "cr-a101", "A101", "Phòng học A101", "1")
          const cleanRoomId = roomId.toLowerCase().replace(/[^a-z0-9]/g, '');
          const hasAccess = currentUser.assignedRooms.some((r) => {
            if (r === '*') return true;
            if (r === roomId) return true;
            const cleanR = r.toLowerCase().replace(/[^a-z0-9]/g, '');
            return cleanRoomId.includes(cleanR) || cleanR.includes(cleanRoomId);
          });

          if (hasAccess) {
            return { allowed: true };
          }

          const friendlyRooms = currentUser.assignedRooms.length > 0 ? currentUser.assignedRooms.join(', ') : 'Chưa được phân công phòng nào';
          return {
            allowed: false,
            reason: `Tài khoản Giảng viên của bạn chỉ được phân quyền điều khiển tại phòng: [${friendlyRooms}]. Phòng hiện tại không thuộc thẩm quyền của bạn.`,
          };
        }
      }

      return { allowed: true };
    },
    [currentUser]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated: !!currentUser,
        login,
        logout,
        quickLogin,
        switchUser,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        isPermissionsModalOpen,
        openPermissionsModal,
        closePermissionsModal,
        updateUserRole,
        updateUserRooms,
        updateUserPermissions,
        addUser,
        register,
        deleteUser,
        resetDefaultUsers,
        loginWithGoogle,
        loginWithGoogleEmail,
        isGoogleAuthLoading,
        canPerform,
        isReadOnlySession: !currentUser || currentUser.role === 'STUDENT',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
