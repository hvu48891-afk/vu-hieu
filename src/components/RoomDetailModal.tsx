import React, { useState } from 'react';
import { Classroom, Device } from '../types';
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
  Trash2,
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
  } = useClassroom();

  const { currentUser, canPerform, openLoginModal } = useAuth();
  const perm = canPerform('CONTROL_DEVICE', classroom.id);
  const [deniedMsg, setDeniedMsg] = useState<string | null>(null);

  const handleToggle = (deviceId: string) => {
    if (!perm.allowed) {
      setDeniedMsg(perm.reason || 'Bạn không có quyền điều khiển thiết bị tại phòng này!');
      return;
    }
    toggleDevice(classroom.id, deviceId);
  };

  const handleAllToggle = () => {
    if (!perm.allowed) {
      setDeniedMsg(perm.reason || 'Bạn không có quyền điều khiển phòng học này!');
      return;
    }
    const anyOn = classroom.devices.some((d) => d.isOn);
    if (anyOn) {
      turnAllOff(classroom.id);
    } else {
      turnAllOn(classroom.id);
    }
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
                      Hệ thống sẽ tự động ngắt relay 220V sau {classroom.autoShutdownRemainingSec}s!
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => turnAllOff(classroom.id)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium transition-colors"
              >
                Ngắt điện ngay
              </button>
              <button
                onClick={() => cancelAutoShutdown(classroom.id)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
              >
                Tạm hoãn ngắt
              </button>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Real-time Electrical & Environmental Gauges (PZEM-004T & Sensors) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {/* Voltage */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Điện áp lưới (V)</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-white">
                  {classroom.voltageV}
                </span>
                <span className="text-[11px] text-slate-400">VAC</span>
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
                        ? 'Toàn bộ nguồn điện 220V cấp vào phòng đã được ngắt hoàn toàn. Cảm biến PZEM-004T ghi nhận công suất và dòng điện bằng 0.0.'
                        : 'Các tiếp điểm Relay 220V cho Đèn, Quạt, Máy lạnh đã NGẮT 100%. Mức ~6.5W (dòng 0.03A) còn lại chính là Nguồn Chờ Tĩnh (Standby Power) tiêu thụ bởi bộ nguồn xung 220V/5V nuôi vi điều khiển ESP32, module PZEM-004T và cảm biến PIR để duy trì kết nối mạng WiFi/MQTT và nhận lệnh điều khiển từ xa.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleHardCutoff(classroom.id)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors shrink-0 flex items-center justify-center gap-1.5 ${
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

          {/* Connected 220V Devices Control List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Danh Sách Thiết Bị & Tiếp Điểm Relay 220V
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {classroom.devices.filter((d) => d.isOn).length} / {classroom.devices.length} Đang đóng tiếp điểm
              </span>
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
                              {device.relayState === 'CLOSED' ? 'RELAY ĐÓNG (220V)' : 'RELAY NGẮT'}
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
                            <span>Định mức: {device.powerRatingW}W ({device.nominalCurrentA || (device.powerRatingW / 220).toFixed(1)}A)</span>
                            <span>·</span>
                            <span className="font-mono text-amber-300 font-medium">
                              Thực tế: {device.currentPowerW}W
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Toggle Button */}
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
                                setAcTemperature(
                                  classroom.id,
                                  device.id,
                                  device.acSettings!.targetTemp - 1
                                )
                              }
                              className="p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 font-mono font-bold text-emerald-400">
                              {device.acSettings.targetTemp}°C
                            </span>
                            <button
                              disabled={!device.isOn}
                              onClick={() =>
                                setAcTemperature(
                                  classroom.id,
                                  device.id,
                                  device.acSettings!.targetTemp + 1
                                )
                              }
                              className="p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30"
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
                              onClick={() => setAcMode(classroom.id, device.id, mode)}
                              className={`px-2 py-0.5 rounded text-[11px] uppercase font-medium transition-colors ${
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
                              onClick={() => setFanSpeed(classroom.id, device.id, spd)}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
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
    </div>
  );
};
