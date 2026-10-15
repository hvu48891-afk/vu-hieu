import React, { useState, useEffect } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { formatWatts } from '../utils/calculations';
import {
  Lightbulb,
  Wind,
  Thermometer,
  Tv,
  Power,
  Users,
  Droplets,
  Clock,
  Sparkles,
  ShieldAlert,
  Sliders,
  ChevronDown,
  Volume2,
  Plus,
} from 'lucide-react';
import { AddRoomModal } from './AddRoomModal';

export const RoomPanelTouch: React.FC = () => {
  const {
    classrooms,
    selectedClassroomId,
    setSelectedClassroomId,
    selectedClassroom,
    toggleDevice,
    setAcTemperature,
    setAcMode,
    setFanSpeed,
    turnAllOff,
    turnAllOn,
    cancelAutoShutdown,
    soundEnabled,
  } = useClassroom();

  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const room = selectedClassroom;
  const currentSlot = room.timetable.find((t) => t.isActiveNow) || room.timetable[0];
  const acDevice = room.devices.find((d) => d.type === 'ac');
  const lightDevices = room.devices.filter((d) => d.type === 'light');
  const fanDevices = room.devices.filter((d) => d.type === 'fan');
  const projDevice = room.devices.find((d) => d.type === 'projector');

  const anyDeviceOn = room.devices.some((d) => d.isOn);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Selector & Notice bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs text-slate-400 font-medium">
            Chọn phòng học mô phỏng:
          </span>
          <div className="relative">
            <select
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-emerald-400 text-xs font-semibold rounded-lg px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:border-emerald-500"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name} ({c.building})
                </option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white transition-colors"
            title="Thêm phòng học mới vào hệ thống Supabase"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm phòng</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Đồng bộ 2 chiều MQTT với Web Admin
          </span>
          {soundEnabled && (
            <span className="flex items-center gap-1 text-slate-400">
              <Volume2 className="h-3 w-3" /> Hiệu ứng tiếng cơ Relay 220V
            </span>
          )}
        </div>
      </div>

      {/* Physical Smart Wall Touch Panel Frame (Mô phỏng Màn hình HMI cảm ứng gắn tường phòng học) */}
      <div className="relative p-3 sm:p-5 bg-gradient-to-b from-slate-800 to-slate-950 rounded-3xl shadow-2xl border-4 border-slate-700/80 ring-1 ring-slate-900">
        {/* Wall Mount Screws / Accents */}
        <div className="absolute top-2 left-4 w-2 h-2 rounded-full bg-slate-600/60 shadow-inner" />
        <div className="absolute top-2 right-4 w-2 h-2 rounded-full bg-slate-600/60 shadow-inner" />
        <div className="absolute bottom-2 left-4 w-2 h-2 rounded-full bg-slate-600/60 shadow-inner" />
        <div className="absolute bottom-2 right-4 w-2 h-2 rounded-full bg-slate-600/60 shadow-inner" />

        {/* Inner LCD / OLED Screen Area */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 sm:p-6 text-slate-100 shadow-inner space-y-6">
          {/* Top Panel Bar: Clock, Room Name, Subject, Environmental Sensors */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black font-mono text-emerald-400 tracking-wider">
                  {room.code}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                  {room.building} · Tầng {room.floor}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                  Sức chứa: {room.capacity} SV
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <Clock className="h-3 w-3 text-slate-400" />
                <span>
                  {currentSlot
                    ? `${currentSlot.period}: ${currentSlot.subject} (GV: ${currentSlot.lecturer})`
                    : 'Chưa có lịch thời khóa biểu'}
                </span>
              </p>
            </div>

            {/* Environmental & Time Display */}
            <div className="flex items-center gap-4 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800">
              <div className="text-right">
                <span className="text-lg font-bold font-mono text-white block">
                  {currentTime}
                </span>
                <span className="text-[10px] text-slate-400 uppercase">Đồng hồ trường học</span>
              </div>

              <div className="h-8 w-px bg-slate-800" />

              <div className="flex items-center gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Nhiệt độ phòng</span>
                  <span className="font-mono font-bold text-amber-300 flex items-center gap-1">
                    <Thermometer className="h-3 w-3" /> {room.temperature}°C
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Độ ẩm</span>
                  <span className="font-mono font-medium text-cyan-300 flex items-center gap-1">
                    <Droplets className="h-3 w-3" /> {room.humidity}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Hiện diện</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      room.hasMotion > 0 ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    <Users className="h-3 w-3" />
                    {room.hasMotion > 0 ? 'Có người' : 'Phòng trống'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Banner if Overtime / Forgotten */}
          {room.warningForgotten && (
            <div className="bg-rose-950/80 border border-rose-700/80 rounded-xl p-3 text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-pulse">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
                <div>
                  <strong className="text-white">CẢNH BÁO TẠI PHÒNG:</strong> Đã hết giờ học nhưng chưa tắt thiết bị!
                  {room.autoShutdownRemainingSec !== null && (
                    <span className="text-amber-300 font-bold ml-1">
                      Hệ thống tự động ngắt điện sau {room.autoShutdownRemainingSec} giây.
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => turnAllOff(room.id)}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded"
                >
                  Tắt ngay
                </button>
                <button
                  onClick={() => cancelAutoShutdown(room.id)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                >
                  Gia hạn sử dụng
                </button>
              </div>
            </div>
          )}

          {/* Main Controls Split: Left = Direct Lighting & Fans Touch Keys, Right = Air Conditioner Dial */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols): Touch Buttons for Lights, Fans, Projector */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  Cụm Công Tắc Cảm Ứng Chiếu Sáng & Quạt (220V)
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Công suất tức thời: <strong className="text-emerald-400">{formatWatts(room.totalPowerW)}</strong>
                </span>
              </div>

              {/* Lighting Touch Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {lightDevices.map((light, idx) => (
                  <button
                    key={light.id}
                    onClick={() => toggleDevice(room.id, light.id)}
                    className={`p-4 rounded-xl text-left border transition-all relative overflow-hidden flex flex-col justify-between h-28 ${
                      light.isOn
                        ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/60 shadow-lg shadow-amber-950/20'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={`p-2 rounded-lg ${
                          light.isOn
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Lightbulb className="h-5 w-5" />
                      </div>
                      {/* LED status indicator dot */}
                      <span
                        className={`w-3 h-3 rounded-full border ${
                          light.isOn
                            ? 'bg-emerald-400 border-emerald-300 shadow-sm shadow-emerald-400'
                            : 'bg-rose-950 border-rose-800'
                        }`}
                      />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-white block">
                        {idx === 0 ? 'Đèn Bảng & Giảng Viên (Rạng Đông 76W)' : 'Đèn Lớp Học Sinh Viên (Rạng Đông 152W)'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {light.isOn ? `Đang sáng · P = ${light.currentPowerW}W (${light.nominalCurrentA || 0.36}A)` : 'Relay ngắt · 0W'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Fan Touch Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {fanDevices.map((fan, idx) => (
                  <div
                    key={fan.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                      fan.isOn
                        ? 'bg-cyan-950/30 border-cyan-500/50'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-md ${
                            fan.isOn ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Wind className={`h-4 w-4 ${fan.isOn ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-white block">
                            Quạt Đảo Trần {idx + 1} (Vinawind)
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {fan.isOn ? `Số ${fan.fanSpeed || 2} · ${fan.currentPowerW}W` : 'Tắt · 0W'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleDevice(room.id, fan.id)}
                        className={`px-2.5 py-1 text-xs font-bold rounded ${
                          fan.isOn ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {fan.isOn ? 'BẬT' : 'TẮT'}
                      </button>
                    </div>

                    {/* Speed selector */}
                    <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-800">
                      <span className="text-slate-400">Tốc độ gió:</span>
                      <div className="flex items-center gap-1 bg-slate-950 rounded p-0.5 border border-slate-800">
                        {([1, 2, 3] as const).map((spd) => (
                          <button
                            key={spd}
                            disabled={!fan.isOn}
                            onClick={() => setFanSpeed(room.id, fan.id, spd)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                              fan.fanSpeed === spd
                                ? 'bg-cyan-500 text-slate-950 font-bold'
                                : 'text-slate-400 hover:text-white'
                            } disabled:opacity-30`}
                          >
                            Số {spd}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Projector Touch Button */}
              {projDevice && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    projDevice.isOn
                      ? 'bg-purple-950/30 border-purple-500/50'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        projDevice.isOn ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Tv className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-white block">
                        Máy Chiếu & Âm Thanh Giảng Đường
                      </span>
                      <span className="text-xs text-slate-400">
                        {projDevice.isOn ? `Laser Projector · ${projDevice.currentPowerW}W` : 'Chế độ chờ Standby'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleDevice(room.id, projDevice.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                      projDevice.isOn ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {projDevice.isOn ? 'BẬT CHIẾU' : 'TẮT CHIẾU'}
                  </button>
                </div>
              )}
            </div>

            {/* Right Column (5 cols): Air Conditioner Touch HMI Dial & Direct Setpoint */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-blue-500/20 text-blue-400">
                      <Thermometer className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase text-white">
                        Điều Hòa Không Khí (Máy Lạnh 1)
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Contactor 30A · Daikin Inverter
                      </span>
                    </div>
                  </div>

                  {acDevice && (
                    <button
                      onClick={() => toggleDevice(room.id, acDevice.id)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                        acDevice.isOn
                          ? 'bg-blue-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {acDevice.isOn ? 'AC: BẬT' : 'AC: TẮT'}
                    </button>
                  )}
                </div>

                {/* Digital Thermostat Display */}
                {acDevice && acDevice.acSettings ? (
                  <div className="mt-4 flex flex-col items-center">
                    <div className="relative w-44 h-44 rounded-full border-4 border-slate-800 bg-slate-950 flex flex-col items-center justify-center shadow-inner">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                        Nhiệt độ cài đặt
                      </span>
                      <div className="text-5xl font-black font-mono text-blue-400 tracking-tight my-1">
                        {acDevice.acSettings.targetTemp}
                        <span className="text-2xl text-slate-400 font-sans">°C</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {acDevice.isOn ? `Công suất: ${acDevice.currentPowerW}W` : 'Máy đang tắt'}
                      </span>

                      {/* Cool glow effect when active */}
                      {acDevice.isOn && (
                        <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-pulse pointer-events-none" />
                      )}
                    </div>

                    {/* Quick Temp Adjust Buttons */}
                    <div className="flex items-center gap-4 mt-4">
                      <button
                        disabled={!acDevice.isOn}
                        onClick={() =>
                          setAcTemperature(
                            room.id,
                            acDevice.id,
                            acDevice.acSettings!.targetTemp - 1
                          )
                        }
                        className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xl font-bold text-white flex items-center justify-center transition-transform active:scale-95"
                      >
                        -
                      </button>

                      <div className="text-center px-2">
                        <span className="text-[11px] text-slate-400 block">Khuyến nghị tiết kiệm</span>
                        <span className="text-xs font-bold text-emerald-400">25°C - 26°C Eco</span>
                      </div>

                      <button
                        disabled={!acDevice.isOn}
                        onClick={() =>
                          setAcTemperature(
                            room.id,
                            acDevice.id,
                            acDevice.acSettings!.targetTemp + 1
                          )
                        }
                        className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xl font-bold text-white flex items-center justify-center transition-transform active:scale-95"
                      >
                        +
                      </button>
                    </div>

                    {/* Mode buttons */}
                    <div className="grid grid-cols-3 gap-2 w-full mt-4">
                      {(['cool', 'eco', 'fan'] as const).map((mode) => (
                        <button
                          key={mode}
                          disabled={!acDevice.isOn}
                          onClick={() => setAcMode(room.id, acDevice.id, mode)}
                          className={`py-2 px-1 text-xs rounded-lg font-medium transition-colors text-center ${
                            acDevice.acSettings?.mode === mode
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          } disabled:opacity-40`}
                        >
                          {mode === 'cool' ? 'Làm lạnh' : mode === 'eco' ? 'Eco 26°' : 'Quạt gió'}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 text-center py-10">
                    Phòng không trang bị máy lạnh hoặc chưa kết nối relay.
                  </div>
                )}
              </div>

              {/* Classroom Master Presets (Nút ngữ cảnh một chạm) */}
              <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Phím Tắt Ngữ Cảnh Nhanh (Smart Presets)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => turnAllOn(room.id)}
                    className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-700/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Vào Lớp (Chuẩn)</span>
                  </button>

                  <button
                    onClick={() => turnAllOff(room.id)}
                    className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-700/70 hover:bg-rose-900/70 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Power className="h-3.5 w-3.5" />
                    <span>Tan Học (Tắt Hết)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Physical 220V Relays Status Bar (Visual Indicator for hardware contacts) */}
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Trạng Thái Tiếp Điểm Cụm Relay 220V Thực Tế (Hardware Contactors)
              </span>
              <span className="font-mono text-emerald-400">
                PZEM-004T: {room.voltageV}V · {room.currentA}A · {room.powerFactor} PF
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {room.devices.map((d, i) => (
                <div
                  key={d.id}
                  className={`p-2 rounded-lg border text-center text-xs font-mono transition-colors ${
                    d.relayState === 'CLOSED'
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-[10px] block opacity-70">Kênh {i + 1}</span>
                  <span className="text-xs block truncate" title={d.name}>
                    {d.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] mt-0.5 block">
                    {d.relayState === 'CLOSED' ? '● 220V ON' : '○ NGẮT'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AddRoomModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
};
