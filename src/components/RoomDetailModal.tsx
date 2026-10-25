import React, { useState } from 'react';
import { Classroom, Device, DeviceType } from '../types';
import { useClassroom } from '../context/ClassroomContext';
import { useAuth } from '../context/AuthContext';
import { formatWatts } from '../utils/calculations';
import {
  X,
  Power,
  Zap,
  Thermometer,
  Droplets,
  Users,
  Wind,
  Lightbulb,
  Tv,
  AlertTriangle,
  Minus,
  Plus,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Clock,
  LogIn,
  Lock,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface RoomDetailModalProps {
  classroom: Classroom;
  onClose: () => void;
  onDeleteRoom?: (classroom: Classroom) => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  classroom,
  onClose,
  onDeleteRoom,
}) => {
  const {
    toggleDevice,
    setAcTemperature,
    setAcMode,
    setFanSpeed,
    turnAllOff,
    turnAllOn,
    cancelAutoShutdown,
    simulateScenario,
    toggleHardCutoff,
    addDeviceToRoom,
    deleteDeviceFromRoom,
  } = useClassroom();

  const { currentUser, canPerform, openLoginModal } = useAuth();
  const perm = canPerform('CONTROL_DEVICE', classroom.id);
  const [deniedMsg, setDeniedMsg] = useState<string | null>(null);

  // Add device form states
  const [showAddDevModal, setShowAddDevModal] = useState<boolean>(false);
  const [newDevName, setNewDevName] = useState<string>('');
  const [newDevBrand, setNewDevBrand] = useState<string>('');
  const [newDevType, setNewDevType] = useState<DeviceType>('fan');
  const [newDevPower, setNewDevPower] = useState<number>(55);
  const [newDevRelayPin, setNewDevRelayPin] = useState<string>('');
  const [newDevIsOn, setNewDevIsOn] = useState<boolean>(false);
  const [isSubmittingDev, setIsSubmittingDev] = useState<boolean>(false);

  // Delete device confirmation state
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [isDeletingDev, setIsDeletingDev] = useState<boolean>(false);
  const [devActionMsg, setDevActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const checkAllowed = (): boolean => {
    if (!currentUser) {
      setDeniedMsg('Hệ thống đã khóa điều khiển: Bạn đã đăng xuất hoặc chưa đăng nhập! Vui lòng đăng nhập để thao tác thiết bị.');
      openLoginModal();
      return false;
    }
    if (currentUser.role === 'STUDENT') {
      setDeniedMsg('Tài khoản Sinh viên ở chế độ Chỉ xem. Quyền đóng/ngắt thiết bị Relay 24V và Aptomat bị khóa!');
      return false;
    }
    if (!perm.allowed) {
      setDeniedMsg(perm.reason || 'Bạn không có quyền điều khiển thiết bị tại phòng này!');
      return false;
    }
    return true;
  };

  const handleToggle = (deviceId: string) => {
    if (!checkAllowed()) return;
    toggleDevice(classroom.id, deviceId);
  };

  const handleAllToggle = () => {
    if (!checkAllowed()) return;
    const anyOn = classroom.devices.some((d) => d.isOn);
    if (anyOn) {
      turnAllOff(classroom.id);
    } else {
      turnAllOn(classroom.id);
    }
  };

  const handleAcTemp = (deviceId: string, targetTemp: number) => {
    if (!checkAllowed()) return;
    setAcTemperature(classroom.id, deviceId, targetTemp);
  };

  const handleAcMode = (deviceId: string, mode: 'cool' | 'eco' | 'fan') => {
    if (!checkAllowed()) return;
    setAcMode(classroom.id, deviceId, mode);
  };

  const handleFanSpeedChange = (deviceId: string, speed: 1 | 2 | 3) => {
    if (!checkAllowed()) return;
    setFanSpeed(classroom.id, deviceId, speed);
  };

  const handleHardCutoffClick = () => {
    if (!checkAllowed()) return;
    toggleHardCutoff(classroom.id);
  };

  const handleEmergencyTurnOff = () => {
    if (!checkAllowed()) return;
    turnAllOff(classroom.id);
  };

  const handleCancelShutdown = () => {
    if (!checkAllowed()) return;
    cancelAutoShutdown(classroom.id);
  };

  const getDeviceIcon = (device: Device) => {
    switch (device.type) {
      case 'light':
        return <Lightbulb className="h-4 w-4" />;
      case 'fan':
        return <Wind className="h-4 w-4" />;
      case 'ac':
        return <Thermometer className="h-4 w-4" />;
      case 'projector':
        return <Tv className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const anyDeviceOn = classroom.devices.some((d) => d.isOn);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-4xl text-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              {classroom.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-base">
                  {classroom.name}
                </h3>
                <span className="text-xs text-slate-400">
                  {classroom.building} · Tầng {classroom.floor} · {classroom.capacity} chỗ
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-emerald-400" />
                  {classroom.lastUpdated}
                </span>
                <span>·</span>
                <span>Relay Bus: ESP32-WROOM Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAllToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                anyDeviceOn
                  ? 'bg-rose-900/40 text-rose-300 hover:bg-rose-900/70 border border-rose-700/60'
                  : 'bg-emerald-900/40 text-emerald-300 hover:bg-emerald-900/70 border border-emerald-700/60'
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              <span>{anyDeviceOn ? 'Ngắt toàn bộ phòng' : 'Bật chế độ vào lớp'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* RBAC Notice if restricted or action denied */}
        {(!perm.allowed || deniedMsg) && (
          <div className="bg-amber-950/70 border-b border-amber-800/80 px-5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-amber-200 text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                <strong>Phân quyền điều khiển:</strong> {deniedMsg || perm.reason}
              </span>
            </div>
            <button
              onClick={openLoginModal}
              className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shrink-0 transition-colors"
            >
              Đổi vai trò / Đăng nhập
            </button>
          </div>
        )}

        {/* Warning Banner if Overtime/Forgotten */}
        {classroom.warningForgotten && (
          <div className="bg-rose-950/70 border-b border-rose-800/80 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-200 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">
                  Cảnh báo: Phòng trống nhưng thiết bị vẫn đang bật sau giờ học!
                </p>
                <p className="text-rose-300/80 mt-0.5">
                  Phòng đã trống {classroom.vacantDurationMinutes} phút. Cảm biến PIR ghi nhận 0 chuyển động.
                  {classroom.autoShutdownRemainingSec !== null && (
                    <span className="font-bold text-amber-300 ml-1">
                      Hệ thống sẽ tự động ngắt relay 24V sau {classroom.autoShutdownRemainingSec}s!
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleEmergencyTurnOff}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium transition-colors cursor-pointer"
              >
                Ngắt điện ngay
              </button>
              <button
                onClick={handleCancelShutdown}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
              >
                Tạm hoãn ngắt
              </button>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Real-time Electrical & Environmental Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {/* Voltage */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Điện áp (V)</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-white">
                  {classroom.voltageV}
                </span>
                <span className="text-[11px] text-slate-400">V</span>
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="h-2.5 w-2.5" /> 50.0 Hz
              </span>
            </div>

            {/* Current */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Dòng điện (A)</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-amber-400">
                  {classroom.currentA}
                </span>
                <span className="text-[11px] text-slate-400">A</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                CT 100A PZEM
              </span>
            </div>

            {/* Power Active */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Công suất P (W)</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span
                  className={`text-lg font-bold font-mono ${
                    classroom.isHardCutoff || classroom.totalPowerW === 0
                      ? 'text-slate-400'
                      : !classroom.devices.some((d) => d.isOn)
                      ? 'text-cyan-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {classroom.totalPowerW}
                </span>
                <span className="text-[11px] text-slate-400">W</span>
              </div>
              <span className="text-[10px] block mt-0.5">
                {classroom.isHardCutoff || classroom.totalPowerW === 0 ? (
                  <span className="text-slate-500 font-mono">Đã ngắt CB 0W</span>
                ) : !classroom.devices.some((d) => d.isOn) ? (
                  <span className="text-cyan-400 font-mono" title="Nguồn chờ nuôi bo mạch vi điều khiển ESP32, module PZEM-004T & PIR">
                    Chờ tĩnh IoT
                  </span>
                ) : (
                  <span className="text-slate-400">cos φ: {classroom.powerFactor}</span>
                )}
              </span>
            </div>

            {/* Apparent Power S */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Biểu kiến S (VA)</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-purple-400">
                  {classroom.apparentPowerVA || Math.round(classroom.voltageV * classroom.currentA)}
                </span>
                <span className="text-[11px] text-slate-400">VA</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Q: {classroom.reactivePowerVAR || 0} VAR
              </span>
            </div>

            {/* Energy */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Điện hôm nay</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-blue-400">
                  {classroom.energyTodayKWh.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400">kWh</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Tích lũy từ 00h
              </span>
            </div>

            {/* Temperature */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Nhiệt độ phòng</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-amber-300">
                  {classroom.temperature}°C
                </span>
              </div>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Droplets className="h-2.5 w-2.5 text-cyan-400" /> {classroom.humidity}% RH
              </span>
            </div>

            {/* Occupancy / Motion */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Hiện diện (PIR)</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={`text-base font-semibold ${classroom.hasMotion > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {classroom.hasMotion > 0 ? `Có SV (${classroom.hasMotion})` : 'Phòng trống'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Users className="h-2.5 w-2.5" />
                {classroom.isVacant ? `Trống ${classroom.vacantDurationMinutes}p` : 'Đang học'}
              </span>
            </div>

            {/* Room Area & Power Density */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Mật độ tải</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-cyan-300">
                  {(classroom.totalPowerW / (classroom.roomAreaM2 || 68)).toFixed(1)}
                </span>
                <span className="text-[11px] text-slate-400">W/m²</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Diện tích: {classroom.roomAreaM2 || 68} m²
              </span>
            </div>
          </div>

          {/* Standby Power Explanation & Hard Cutoff Control */}
          {!classroom.devices.some((d) => d.isOn) && (
            <div className="p-4 rounded-xl bg-slate-900 border border-blue-900/40 text-xs text-slate-300 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs">
                      {classroom.isHardCutoff
                        ? '⚡ Trạng Thái Cắt Aptomat Tổng Cơ Khí (0.0 W)'
                        : '💡 Giải Thích Kỹ Thuật: Vì Sao Tắt Điện Vẫn Còn Công Suất 6.5W?'}
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {classroom.isHardCutoff
                        ? 'Toàn bộ nguồn điện 24V cấp vào phòng đã được ngắt hoàn toàn. Cảm biến đo điện ghi nhận công suất và dòng điện bằng 0.0.'
                        : 'Các tiếp điểm Relay 24V cho Đèn, Quạt, Máy lạnh đã NGẮT 100%. Mức ~6.5W (dòng 0.27A) còn lại chính là Nguồn Chờ Tĩnh (Standby Power) tiêu thụ bởi bộ nguồn nuôi vi điều khiển ESP32 và cảm biến PIR để duy trì kết nối mạng WiFi/MQTT và nhận lệnh điều khiển từ xa.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleHardCutoffClick}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer ${
                    classroom.isHardCutoff
                      ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-sm'
                      : 'bg-rose-950/70 hover:bg-rose-900 text-rose-300 border-rose-800'
                  }`}
                >
                  <Power className="h-3.5 w-3.5" />
                  <span>
                    {classroom.isHardCutoff ? 'Khôi Phục Nguồn Chờ (6.5W)' : 'Cắt Aptomat Tổng (Về 0W)'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Connected 24V Devices Control List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Danh Sách Thiết Bị & Tiếp Điểm Relay 24V
              </h4>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-slate-400 font-mono">
                  {classroom.devices.filter((d) => d.isOn).length} / {classroom.devices.length} Đang đóng tiếp điểm
                </span>
                {currentUser && currentUser.role !== 'STUDENT' && (
                  <button
                    onClick={() => setShowAddDevModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm Thiết Bị</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {classroom.devices.map((device) => {
                return (
                  <div
                    key={device.id}
                    className={`p-3.5 rounded-lg border transition-all ${
                      device.isOn
                        ? 'bg-slate-800/90 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-900/70 border-slate-800 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            device.isOn
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {getDeviceIcon(device)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-white">
                              {device.name}
                            </span>
                            {/* Relay state indicator */}
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                device.relayState === 'CLOSED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {device.relayState === 'CLOSED' ? 'RELAY ĐÓNG (24V)' : 'RELAY NGẮT'}
                            </span>
                          </div>
                          {device.brandModel && (
                            <p className="text-[11px] text-emerald-400/90 font-medium mt-0.5">
                              Model: {device.brandModel}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="font-mono text-[11px] text-slate-400">
                              {device.relayPin}
                            </span>
                            <span>·</span>
                            <span>Định mức: {device.powerRatingW}W ({device.nominalCurrentA || (device.powerRatingW / 24).toFixed(1)}A)</span>
                            <span>·</span>
                            <span className="font-mono text-amber-300 font-medium">
                              Thực tế: {device.currentPowerW}W
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Toggle & Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleToggle(device.id)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                            device.isOn
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          <Power className="h-3 w-3" />
                          <span>{device.isOn ? 'BẬT' : 'TẮT'}</span>
                        </button>

                        {currentUser && currentUser.role !== 'STUDENT' && (
                          <button
                            type="button"
                            onClick={() => setDeviceToDelete(device)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 border border-transparent hover:border-rose-800/60 transition-colors"
                            title="Xóa thiết bị này khỏi phòng học & Database"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Air Conditioner Dedicated Controls */}
                    {device.type === 'ac' && device.acSettings && (
                      <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Cài đặt nhiệt độ:</span>
                          <div className="flex items-center bg-slate-950 rounded border border-slate-700 p-0.5">
                            <button
                              disabled={!device.isOn}
                              onClick={() =>
                                handleAcTemp(
                                  device.id,
                                  device.acSettings!.targetTemp - 1
                                )
                              }
                              className="p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30 cursor-pointer"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 font-mono font-bold text-emerald-400">
                              {device.acSettings.targetTemp}°C
                            </span>
                            <button
                              disabled={!device.isOn}
                              onClick={() =>
                                handleAcTemp(
                                  device.id,
                                  device.acSettings!.targetTemp + 1
                                )
                              }
                              className="p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30 cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* AC Mode */}
                        <div className="flex items-center gap-1 bg-slate-950 rounded p-0.5 border border-slate-700">
                          {(['cool', 'eco', 'fan'] as const).map((mode) => (
                            <button
                              key={mode}
                              disabled={!device.isOn}
                              onClick={() => handleAcMode(device.id, mode)}
                              className={`px-2 py-0.5 rounded text-[11px] uppercase font-medium transition-colors cursor-pointer ${
                                device.acSettings?.mode === mode
                                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                                  : 'text-slate-400 hover:text-slate-200'
                              } disabled:opacity-40`}
                            >
                              {mode === 'cool' ? 'Lạnh' : mode === 'eco' ? 'Eco 26°' : 'Gió'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fan Speed Controls */}
                    {device.type === 'fan' && (
                      <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Cấp tốc độ quạt:</span>
                        <div className="flex items-center gap-1 bg-slate-950 rounded p-0.5 border border-slate-700">
                          {([1, 2, 3] as const).map((spd) => (
                            <button
                              key={spd}
                              disabled={!device.isOn}
                              onClick={() => handleFanSpeedChange(device.id, spd)}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                device.fanSpeed === spd
                                  ? 'bg-slate-800 text-emerald-400 font-bold'
                                  : 'text-slate-400 hover:text-white'
                              } disabled:opacity-40`}
                            >
                              Cấp {spd}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timetable of this classroom */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              Thời Khóa Biểu Phòng Học (TKB Học Vụ)
            </h4>
            <div className="space-y-2">
              {classroom.timetable.map((slot) => (
                <div
                  key={slot.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-md border text-xs gap-2 ${
                    slot.isActiveNow
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-900 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{slot.subject}</span>
                      {slot.isActiveNow && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                          ĐANG HỌC
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 mt-0.5">
                      {slot.period} · GV: {slot.lecturer} · Lớp: {slot.classGroup}
                    </p>
                  </div>
                  <span className="font-mono text-slate-300">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Thử nghiệm kịch bản:</span>
            <button
              onClick={() => simulateScenario('leave_empty_forget')}
              className="px-2 py-1 bg-amber-950/40 border border-amber-800/60 text-amber-300 rounded hover:bg-amber-900/50"
            >
              Tan học & Quên tắt điện
            </button>
            <button
              onClick={() => simulateScenario('students_enter')}
              className="px-2 py-1 bg-blue-950/40 border border-blue-800/60 text-blue-300 rounded hover:bg-blue-900/50"
            >
              Sinh viên vào lớp
            </button>
          </div>
          <div className="flex items-center gap-2">
            {onDeleteRoom && (
              <button
                type="button"
                onClick={() => onDeleteRoom(classroom)}
                title="Xóa phòng học này"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 text-rose-300 rounded font-medium transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Xóa phòng</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium transition-colors"
            >
              Đóng bảng
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification for Device Actions */}
      {devActionMsg && (
        <div
          className={`fixed top-5 right-5 z-70 px-4 py-3 rounded-xl border text-xs shadow-2xl flex items-center gap-2.5 animate-fadeIn ${
            devActionMsg.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/95 border-rose-500 text-rose-200'
          }`}
        >
          {devActionMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{devActionMsg.text}</span>
          <button
            onClick={() => setDevActionMsg(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Modal: Thêm Thiết Bị Mới Vào Phòng & Database */}
      {showAddDevModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 text-slate-100 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Thêm Thiết Bị Vào Phòng {classroom.name}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Lưu trực tiếp vào Cloud Database & Điều khiển qua Relay 24V
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddDevModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newDevName.trim()) return;
                setIsSubmittingDev(true);
                const res = await addDeviceToRoom(classroom.id, {
                  name: newDevName.trim(),
                  brandModel: newDevBrand.trim() || undefined,
                  type: newDevType,
                  powerRatingW: Number(newDevPower) || 55,
                  relayPin: newDevRelayPin.trim() || undefined,
                  isOn: newDevIsOn,
                });
                setIsSubmittingDev(false);
                if (res.success) {
                  setShowAddDevModal(false);
                  setNewDevName('');
                  setNewDevBrand('');
                  setNewDevRelayPin('');
                  setDevActionMsg({
                    type: 'success',
                    text: `Đã thêm thành công thiết bị vào phòng ${classroom.name} và lưu lên Database!`,
                  });
                  setTimeout(() => setDevActionMsg(null), 4000);
                } else {
                  setDevActionMsg({
                    type: 'error',
                    text: res.error || 'Lỗi khi lưu thiết bị vào database.',
                  });
                }
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên Thiết Bị <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newDevName}
                  onChange={(e) => setNewDevName(e.target.value)}
                  placeholder="Ví dụ: Quạt treo tường vách sau, Đèn LED chiếu sáng, v.v."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Loại Thiết Bị
                  </label>
                  <select
                    value={newDevType}
                    onChange={(e) => {
                      const t = e.target.value as DeviceType;
                      setNewDevType(t);
                      if (t === 'fan') setNewDevPower(55);
                      else if (t === 'light') setNewDevPower(76);
                      else if (t === 'ac') setNewDevPower(1850);
                      else if (t === 'projector') setNewDevPower(320);
                      else setNewDevPower(100);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="fan">Quạt Treo Tường / Quạt Đảo (Fan - 55W)</option>
                    <option value="light">Hệ Thống Đèn Chiếu Sáng (Light - 76W)</option>
                    <option value="ac">Điều Hòa Không Khí (AC Inverter - 1850W)</option>
                    <option value="projector">Máy Chiếu Giảng Đường (Projector - 320W)</option>
                    <option value="aux">Ổ Cắm Phụ / Thiết Bị Khác (Aux)</option>
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
                    min={1}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Hãng Sản Xuất / Model
                  </label>
                  <input
                    type="text"
                    value={newDevBrand}
                    onChange={(e) => setNewDevBrand(e.target.value)}
                    placeholder="Vinawind QTT-400X, Rạng Đông, Daikin, ..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Chân Relay Điều Khiển (ESP32)
                  </label>
                  <input
                    type="text"
                    value={newDevRelayPin}
                    onChange={(e) => setNewDevRelayPin(e.target.value)}
                    placeholder="Mặc định: GPIO 25 (Relay 24V)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Trạng thái khởi tạo:</span>
                  <span className="text-[11px] text-slate-400 block">
                    {newDevIsOn ? 'Đóng tiếp điểm Relay 24V ngay khi tạo' : 'Ngắt tiếp điểm Relay 24V (Mặc định)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setNewDevIsOn(!newDevIsOn)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    newDevIsOn
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {newDevIsOn ? 'BẬT (24V ON)' : 'TẮT (NGẮT)'}
                </button>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddDevModal(false)}
                  className="px-4 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDev}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isSubmittingDev ? 'Đang lưu database...' : 'Thêm Vào Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xác Nhận Xóa Thiết Bị Khỏi Database */}
      {deviceToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/60 rounded-2xl shadow-2xl w-full max-w-md p-6 text-slate-100 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Xác Nhận Xóa Thiết Bị</h4>
                <p className="text-xs text-rose-400">Thao tác cập nhật trực tiếp lên cơ sở dữ liệu</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Thiết bị:</span>
                <span className="font-bold text-white">{deviceToDelete.name}</span>
              </div>
              {deviceToDelete.brandModel && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Model:</span>
                  <span className="text-emerald-400 font-mono">{deviceToDelete.brandModel}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Phòng học:</span>
                <span className="text-white">{classroom.name} ({classroom.code})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Công suất & Relay:</span>
                <span className="text-amber-400 font-mono">
                  {deviceToDelete.powerRatingW}W · {deviceToDelete.relayPin}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Bạn có chắc chắn muốn xóa thiết bị này khỏi phòng học? Hệ thống sẽ cập nhật tải điện và giải phóng tiếp điểm relay 24V trên Cloud Database.
            </p>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingDev}
                onClick={() => setDeviceToDelete(null)}
                className="px-4 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeletingDev}
                onClick={async () => {
                  setIsDeletingDev(true);
                  const res = await deleteDeviceFromRoom(classroom.id, deviceToDelete.id);
                  setIsDeletingDev(false);
                  if (res.success) {
                    const devName = deviceToDelete.name;
                    setDeviceToDelete(null);
                    setDevActionMsg({
                      type: 'success',
                      text: `Đã xóa thiết bị "${devName}" khỏi phòng ${classroom.name} và database thành công!`,
                    });
                    setTimeout(() => setDevActionMsg(null), 4000);
                  } else {
                    setDevActionMsg({
                      type: 'error',
                      text: res.error || 'Không thể xóa thiết bị khỏi database.',
                    });
                  }
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/60 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeletingDev ? 'Đang xóa...' : 'Xác Nhận Xóa Khỏi Database'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
