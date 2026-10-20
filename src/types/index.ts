export type DeviceType = 'light' | 'fan' | 'ac' | 'projector' | 'aux';

export interface Device {
  id: string;
  name: string;
  brandModel: string; // Tên hãng & model thực tế (vd: Rạng Đông LED Tube 18W, Daikin Inverter FTKC60)
  type: DeviceType;
  isOn: boolean;
  powerRatingW: number; // Công suất định mức danh định (W)
  currentPowerW: number; // Công suất tác dụng thực tế (W)
  nominalCurrentA: number; // Dòng điện danh định (A) ở 24V
  relayPin: string; // Chân Relay trên ESP32 (vd: GPIO 16, GPIO 21 Contactor 24V)
  relayState: 'OPEN' | 'CLOSED'; // OPEN = Ngắt, CLOSED = Đóng mạch 24V
  acSettings?: {
    targetTemp: number; // 16 - 30 °C
    mode: 'cool' | 'eco' | 'fan';
    fanSpeed: 'low' | 'med' | 'high' | 'auto';
  };
  fanSpeed?: 1 | 2 | 3;
}

export interface TimetableSlot {
  id: string;
  period: string; // "Tiết 1-3", "Tiết 4-5", v.v.
  startTime: string; // "07:00"
  endTime: string; // "09:15"
  subject: string;
  lecturer: string;
  classGroup: string;
  isActiveNow: boolean;
}

export interface CalibrationPoint {
  parameter: string; // Điện áp, Dòng điện, Công suất, Tần số, Cos phi
  unit: string;
  standardInstrument: string; // Thiết bị kiểm chuẩn (Fluke 87V, Chauvin Arnoux CA 8336)
  standardValue: number;
  pzemValue: number;
  absoluteError: number;
  relativeErrorPercent: number; // % Sai số thực tế (< 1%)
  status: 'ĐẠT TIÊU CHUẨN CẤP 1.0' | 'ĐẠT';
}

export interface Classroom {
  id: string;
  code: string; // "A101"
  name: string; // "Phòng học thông minh A.101"
  building: string; // "Tòa nhà A"
  floor: number;
  capacity: number; // 50 chỗ
  roomAreaM2: number; // Diện tích phòng (m2)
  
  // Trạng thái môi trường & cảm biến thực tế
  temperature: number; // °C (DHT22)
  humidity: number; // % RH (DHT22)
  hasMotion: number; // 0 = Không người, >0 = Có chuyển động (PIR/Radar)
  isVacant: boolean; // Phòng đang trống
  vacantDurationMinutes: number; // Số phút phòng trống liên tục
  
  // Thông số đo lường điện năng chuẩn công nghiệp
  voltageV: number; // Điện áp hệ thống thực tế (V) ~ 23.8 - 24.2V (Chuẩn 24V)
  currentA: number; // Dòng điện tổng (A)
  totalPowerW: number; // Công suất tác dụng P (W)
  apparentPowerVA: number; // Công suất biểu kiến S = V * I (VA)
  reactivePowerVAR: number; // Công suất phản kháng Q (VAR)
  frequencyHz: number; // Tần số lưới điện Việt Nam (50.0 Hz)
  powerFactor: number; // Hệ số công suất cos phi ~ 0.95 - 0.98
  energyTodayKWh: number; // Năng lượng tích lũy hôm nay (kWh)
  
  // Danh sách tải thiết bị
  devices: Device[];
  
  // Lịch học vụ
  timetable: TimetableSlot[];
  
  // Cảnh báo & Tự động hóa
  warningForgotten: boolean; // Cảnh báo: Quên tắt thiết bị khi phòng trống/hết giờ
  autoShutdownRemainingSec: number | null; // Đếm ngược tự ngắt relay (giây)
  isHardCutoff?: boolean; // Ngắt hoàn toàn Aptomat/CB tổng (Công suất về 0W thay vì 6.5W nguồn chờ)
  lastUpdated: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'auto_off_vacant' | 'pre_class_on' | 'temp_limit' | 'night_cutoff';
  paramMinutes?: number;
  paramTemp?: number;
}

export interface HourlyEnergyPoint {
  hour: string; // "07:00"
  totalKWh: number;
  acKWh: number;
  lightKWh: number;
  fanKWh: number;
  otherKWh: number;
}

export interface StudentTask {
  studentId: string;
  name: string;
  role: string;
  responsibilities: string[];
  hardwareDeliverables: string[];
  progressPercent: number;
}

export interface HardwareLog {
  id: string;
  timestamp: string;
  topic: string;
  payload: string;
  direction: 'IN' | 'OUT';
  type: 'TELEMETRY' | 'COMMAND' | 'ALARM';
}

export type UserRole = 'ADMIN' | 'LECTURER' | 'TECHNICIAN' | 'STUDENT';

export type PermissionAction =
  | 'ADD_ROOM'
  | 'DELETE_ROOM'
  | 'CONTROL_DEVICE'
  | 'GLOBAL_SHUTDOWN'
  | 'CONFIG_SCHEDULE'
  | 'SIMULATE_SCENARIO'
  | 'MANAGE_USERS'
  | 'VIEW_TELEMETRY';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: UserRole;
  roleTitle: string; // Tên chức danh tiếng Việt (vd: Quản Trị Viên Cơ Sở Vật Chất)
  department: string; // Đơn vị công tác (vd: Phòng Quản Trị Thiết Bị & CSVC)
  avatarInitials: string;
  avatarUrl?: string; // URL ảnh đại diện Google (nếu đăng nhập bằng Google)
  authProvider?: 'google' | 'password' | 'demo'; // Phương thức xác thực
  assignedRooms: string[]; // ['*'] for all, or ['cr-a101', 'cr-a102']
  customPermissions?: Partial<Record<PermissionAction, boolean>>;
  description?: string;
  createdAt?: string;
}

// ============================================================================
// Database Table Interfaces (Direct mapping to Supabase Tables)
// ============================================================================

export interface DbRoom {
  id: number;
  room_name: string;
  building: string;
  is_active: boolean;
  created_at?: string;
}

export interface DbDevice {
  id: number;
  room_id: number;
  device_name: string;
  device_type: DeviceType;
  is_on: boolean;
  target_temperature?: number | null;
  power_rating_watts: number;
  created_at?: string;
}

export interface DbSchedule {
  id: number;
  room_id: number;
  device_id?: number | null;
  schedule_name: string;
  start_time: string;
  end_time: string;
  days_of_week: string;
  action_command: 'AUTO_POWER_ON' | 'AUTO_POWER_OFF' | 'AC_SET_TEMP' | 'ALL_OFF';
  target_value?: string | number | null;
  is_enabled: boolean;
  created_at?: string;
}

export interface DbUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export interface DbActivityLog {
  id: number;
  device_id?: number | null;
  user_id?: number | null;
  control_source: 'WEB_ADMIN' | 'TOUCH_PANEL' | 'SCHEDULE_AUTO' | 'EMERGENCY_BUTTON' | 'SYSTEM';
  action_performed: string;
  created_at: string;
}

