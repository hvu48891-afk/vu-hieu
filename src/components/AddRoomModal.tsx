import React, { useState, useEffect } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { DeviceType } from '../types';
import {
  X,
  Database,
  Building,
  Plus,
  Zap,
  Lightbulb,
  Wind,
  Thermometer,
  Tv,
  Monitor,
  Users,
  Maximize2,
  Check,
  Copy,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Radio,
  Sliders,
} from 'lucide-react';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (roomName: string) => void;
}

interface DeviceOption {
  id: string;
  name: string;
  type: DeviceType;
  powerRatingW: number;
  included: boolean;
  initialOn: boolean;
  targetTemp?: number;
}

const DEFAULT_DEVICES: DeviceOption[] = [
  {
    id: 'light-1',
    name: 'Đèn LED Chiếu Sáng (6 bộ 36W)',
    type: 'light',
    powerRatingW: 216,
    included: true,
    initialOn: true,
  },
  {
    id: 'ac-1',
    name: 'Điều Hòa Daikin Inverter 2.5HP FTKC60',
    type: 'ac',
    powerRatingW: 1850,
    included: true,
    initialOn: true,
    targetTemp: 24,
  },
  {
    id: 'fan-1',
    name: 'Quạt Trần Vinawind QT-1400',
    type: 'fan',
    powerRatingW: 75,
    included: true,
    initialOn: false,
  },
  {
    id: 'proj-1',
    name: 'Máy Chiếu Laser Panasonic PT-VMZ51',
    type: 'projector',
    powerRatingW: 350,
    included: true,
    initialOn: true,
  },
  {
    id: 'pc-1',
    name: 'Máy Tính Bàn Giảng Viên & Âm Thanh',
    type: 'aux',
    powerRatingW: 250,
    included: false,
    initialOn: false,
  },
];

const PRESET_TEMPLATES = [
  {
    label: 'Lab IoT A201',
    name: 'Phòng học A201 - Thực hành IoT & Nhúng',
    building: 'Khu A',
    capacity: 45,
    area: 70,
  },
  {
    label: 'Giảng đường B302',
    name: 'Phòng học B302 - Giảng đường Đa năng',
    building: 'Khu B',
    capacity: 80,
    area: 95,
  },
  {
    label: 'Phòng Máy C105',
    name: 'Phòng học C105 - Phòng Thực hành Máy tính',
    building: 'Khu C',
    capacity: 50,
    area: 75,
  },
  {
    label: 'Hội trường H501',
    name: 'Hội trường H501 - Hội thảo Công nghệ',
    building: 'Khu H',
    capacity: 120,
    area: 160,
  },
];

export const AddRoomModal: React.FC<AddRoomModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addSupabaseRoom } = useClassroom();

  const [roomName, setRoomName] = useState<string>('Phòng học A202 - Kỹ thuật Vi xử lý');
  const [building, setBuilding] = useState<string>('Khu A');
  const [capacity, setCapacity] = useState<number>(50);
  const [roomAreaM2, setRoomAreaM2] = useState<number>(65);
  const [devices, setDevices] = useState<DeviceOption[]>(DEFAULT_DEVICES);

  // IoT Sensor checkboxes
  const [sensorPir, setSensorPir] = useState<boolean>(true);
  const [sensorPzem, setSensorPzem] = useState<boolean>(true);
  const [sensorDht, setSensorDht] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rlsBlocked, setRlsBlocked] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setRoomName(preset.name);
    setBuilding(preset.building);
    setCapacity(preset.capacity);
    setRoomAreaM2(preset.area);
  };

  const handleToggleDeviceIncluded = (id: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, included: !d.included } : d))
    );
  };

  const handleToggleDeviceInitialOn = (id: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, initialOn: !d.initialOn } : d))
    );
  };

  const handleChangeAcTemp = (id: string, temp: number) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, targetTemp: temp } : d))
    );
  };

  // Calculate estimated initial power
  const activeDevices = devices.filter((d) => d.included && d.initialOn);
  const totalEstimatedPower = activeDevices.reduce((sum, d) => {
    if (d.type === 'ac') return sum + Math.round(d.powerRatingW * 0.77);
    return sum + d.powerRatingW;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setErrorMessage('Vui lòng nhập tên phòng học!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setRlsBlocked(false);

    // Format selected devices to pass to database
    const devicesToCreate = devices
      .filter((d) => d.included)
      .map((d) => ({
        name: d.name,
        type: d.type,
        powerRatingW: d.powerRatingW,
        isOn: d.initialOn,
        targetTemp: d.targetTemp || 24,
      }));

    try {
      const res = await addSupabaseRoom(roomName.trim(), building, devicesToCreate);

      setIsSubmitting(false);

      if (res.success) {
        if (onSuccess) {
          onSuccess(roomName.trim());
        }
        onClose();
      } else if (res.rlsBlocked) {
        setRlsBlocked(true);
        setErrorMessage(
          'Supabase từ chối vì chính sách Row Level Security (RLS) đang chặn INSERT. Vui lòng chạy câu lệnh SQL bên dưới để cấp quyền!'
        );
      } else {
        setErrorMessage(res.error || 'Có lỗi xảy ra khi tạo phòng học trên Supabase.');
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi kết nối');
    }
  };

  const sqlPolicySnippet = `-- Mở toàn quyền thêm và sửa trên bảng rooms & devices
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to rooms" ON public.rooms;
CREATE POLICY "Allow all access to rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to devices" ON public.devices;
CREATE POLICY "Allow all access to devices" ON public.devices FOR ALL USING (true) WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlPolicySnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'light':
        return <Lightbulb className="h-4 w-4 text-amber-400" />;
      case 'ac':
        return <Wind className="h-4 w-4 text-cyan-400" />;
      case 'fan':
        return <Wind className="h-4 w-4 text-emerald-400" />;
      case 'projector':
        return <Tv className="h-4 w-4 text-purple-400" />;
      case 'aux':
        return <Monitor className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Thêm Phòng Học Mới
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Supabase PostgreSQL
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Khởi tạo phòng học kèm hệ thống đo điện PZEM-004T & Relay điều khiển 220V
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Đóng (ESC)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Mẫu phòng học nhanh:
              </span>
              <span className="text-[11px] text-slate-500">Bấm để điền nhanh thông số</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_TEMPLATES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1.5 text-xs text-left rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/60 text-slate-300 transition-colors flex items-center justify-between group"
                >
                  <span className="font-medium group-hover:text-emerald-400 truncate">
                    {preset.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {preset.building}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Basic Info */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              1. Thông Tin Cơ Bản Phòng Học
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tên phòng học <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ví dụ: Phòng học A205 - Kỹ thuật Vi xử lý"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Mã phòng (vd: A205) sẽ dùng cho topic MQTT: <code className="text-cyan-400 font-mono">smartclass/A205/telemetry</code>
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tòa nhà / Khu vực
                </label>
                <select
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700/80 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Khu A">Khu A - Tòa Nhà Công Nghệ</option>
                  <option value="Khu B">Khu B - Giảng Đường Trung Tâm</option>
                  <option value="Khu C">Khu C - Khu Thí Nghiệm & Lab</option>
                  <option value="Khu H">Khu H - Hội Trường & Đa Năng</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Users className="h-3 w-3 text-slate-400" />
                  Sức chứa (sinh viên)
                </label>
                <input
                  type="number"
                  min={10}
                  max={250}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Maximize2 className="h-3 w-3 text-slate-400" />
                  Diện tích phòng (m²)
                </label>
                <input
                  type="number"
                  min={20}
                  max={500}
                  value={roomAreaM2}
                  onChange={(e) => setRoomAreaM2(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Equipment & Relay Contactor */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  2. Cấu Hình Thiết Bị Điện (Relay 220V Contactor)
                </span>
                <span className="text-[11px] text-slate-400">
                  Chọn các thiết bị được trang bị sẵn trong phòng học này
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Ước tính tải ban đầu:</span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {totalEstimatedPower} W · ~{(totalEstimatedPower / (220 * 0.96)).toFixed(1)} A
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {devices.map((dev) => (
                <div
                  key={dev.id}
                  className={`p-2.5 rounded-lg border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    dev.included
                      ? 'bg-slate-900/90 border-slate-700/80'
                      : 'bg-slate-950/40 border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={dev.included}
                      onChange={() => handleToggleDeviceIncluded(dev.id)}
                      className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                    />
                    <div className="p-1.5 rounded-md bg-slate-800/80 border border-slate-700/50">
                      {getDeviceIcon(dev.type)}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        {dev.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Công suất định mức: {dev.powerRatingW} W
                      </span>
                    </div>
                  </div>

                  {dev.included && (
                    <div className="flex items-center gap-2 pl-7 sm:pl-0">
                      {dev.type === 'ac' && (
                        <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[11px]">
                          <span className="text-slate-400">Nhiệt độ:</span>
                          <input
                            type="number"
                            min={16}
                            max={30}
                            value={dev.targetTemp || 24}
                            onChange={(e) => handleChangeAcTemp(dev.id, Number(e.target.value))}
                            className="w-10 bg-transparent text-cyan-400 font-mono font-bold text-center focus:outline-none"
                          />
                          <span className="text-slate-400">°C</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleDeviceInitialOn(dev.id)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                          dev.initialOn
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {dev.initialOn ? 'Trạng thái: BẬT' : 'Trạng thái: TẮT'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: IoT Sensors */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              3. Tích Hợp Cảm Biến Giám Sát IoT
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sensorPzem}
                  onChange={(e) => setSensorPzem(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0"
                />
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>PZEM-004T (V, A, W, kWh)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sensorPir}
                  onChange={(e) => setSensorPir(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0"
                />
                <Radio className="h-3.5 w-3.5 text-blue-400" />
                <span>Cảm biến người PIR</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sensorDht}
                  onChange={(e) => setSensorDht(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0"
                />
                <Thermometer className="h-3.5 w-3.5 text-rose-400" />
                <span>Cảm biến DHT22 (T, H)</span>
              </label>
            </div>
          </div>

          {/* Error Message & RLS Solution */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-rose-300 font-semibold">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>

              {rlsBlocked && (
                <div className="pt-2 border-t border-rose-800/50 space-y-2">
                  <p className="text-slate-300">
                    Bạn chỉ cần mở quyền truy cập cho bảng <code className="text-amber-400 font-mono">rooms</code> và <code className="text-amber-400 font-mono">devices</code> bằng cách chạy lệnh sau trong Supabase SQL Editor:
                  </p>
                  <div className="relative">
                    <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre">
                      {sqlPolicySnippet}
                    </pre>
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="absolute top-2 right-2 px-2 py-1 text-[10px] font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                    >
                      {copiedSql ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedSql ? 'Đã sao chép' : 'Sao chép SQL'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Database Target Summary Card */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              <span>
                Bảng đích: <code className="text-emerald-400 font-mono font-semibold">public.rooms</code> & <code className="text-cyan-400 font-mono font-semibold">public.devices</code>
              </span>
            </div>
            <span className="text-slate-500 font-mono text-[10px] hidden sm:inline">
              vvxieqsotbfhymaiqngb.supabase.co
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-2 shadow-md shadow-emerald-950/40 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang lưu vào Supabase...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Tạo và Lưu Vào Supabase</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
