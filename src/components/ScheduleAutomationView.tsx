import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Sliders,
  Power,
  Users,
  Building2,
} from 'lucide-react';

export const ScheduleAutomationView: React.FC = () => {
  const {
    classrooms,
    automationRules,
    toggleRule,
    simulateScenario,
    selectedClassroomId,
    setSelectedClassroomId,
    selectedClassroom,
    turnAllOff,
  } = useClassroom();

  const [activeDay, setActiveDay] = useState<string>('Thứ 4 (Hôm nay)');
  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4 (Hôm nay)', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  const room = selectedClassroom;

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <CalendarClock className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Hệ Thống Tự Động Hóa Theo Thời Khóa Biểu Học Vụ
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Giải pháp trọng tâm giải quyết bài toán{' '}
                <strong className="text-emerald-400">quên tắt điều hòa, quạt và đèn sau giờ học</strong>.
                Hệ thống kết hợp dữ liệu TKB phòng học và cảm biến hiện diện PIR để tự động cắt nguồn Relay 220V,
                tiết kiệm 20% - 35% chi phí tiền điện mỗi tháng cho nhà trường.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => simulateScenario('leave_empty_forget')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/80 rounded-lg shadow-sm transition-colors"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Chạy Thử Kịch Bản Quên Tắt Điện</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two columns layout: Left = Timetable Schedule, Right = Smart Automation Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Timetable Matrix */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold uppercase text-slate-300">
                  Lịch Học Vụ:
                </span>
                <select
                  value={selectedClassroomId}
                  onChange={(e) => setSelectedClassroomId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-emerald-400 text-xs font-bold rounded px-2.5 py-1 focus:outline-none"
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day of Week Selector */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {days.map((d) => (
                  <button
                    key={d}
                    onClick={() => setActiveDay(d)}
                    className={`px-2 py-1 text-[11px] rounded transition-colors whitespace-nowrap ${
                      activeDay === d
                        ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Timetable slots */}
            <div className="mt-4 space-y-3">
              {room.timetable.map((slot, index) => {
                return (
                  <div
                    key={slot.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      slot.isActiveNow
                        ? 'bg-emerald-950/20 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/20'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold text-sm ${
                              slot.isActiveNow ? 'text-white' : 'text-slate-200'
                            }`}
                          >
                            {slot.subject}
                          </span>
                          {slot.isActiveNow && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse font-bold">
                              TIẾT ĐANG DIỄN RA
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>Giảng viên: <strong className="text-slate-300">{slot.lecturer}</strong></span>
                          <span>·</span>
                          <span>Lớp: <strong className="text-slate-300">{slot.classGroup}</strong></span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-bold text-slate-300 block">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {slot.period}
                        </span>
                      </div>
                    </div>

                    {/* Automation link for this period */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span>Tự động kiểm tra sau {slot.endTime}: Hẹn giờ ngắt 10 phút</span>
                      </span>
                      <span className="text-slate-400">
                        Hệ thống Relay: Sẵn sàng
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Smart Rules Configuration & Simulator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-400" />
              Cấu Hình Quy Tắc Tự Động Hóa (Automation Rules)
            </h3>

            <div className="space-y-3">
              {automationRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    rule.enabled
                      ? 'bg-slate-950/80 border-slate-700/80'
                      : 'bg-slate-950/30 border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">
                          {rule.name}
                        </span>
                        {rule.enabled ? (
                          <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-300">
                            BẬT
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-500">
                            TẮT
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {rule.description}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`px-2.5 py-1 text-xs font-bold rounded shrink-0 transition-colors ${
                        rule.enabled
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {rule.enabled ? 'ĐANG BẬT' : 'TẮT'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Test Bench Playground */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Bàn Thử Nghiệm Tình Huống Thực Tế (Test Bench)
            </h3>

            <p className="text-xs text-slate-400">
              Thử nghiệm trực tiếp cho Hội đồng bảo vệ đồ án hoặc kiểm tra vận hành hệ thống:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => simulateScenario('leave_empty_forget')}
                className="w-full p-2.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-200 text-xs font-medium text-left flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-bold block">1. Mô phỏng: Tan học & Bỏ quên thiết bị</span>
                  <span className="text-[11px] text-amber-300/80">
                    Cảm biến PIR = 0, máy lạnh/đèn vẫn chạy -&gt; Kích hoạt đếm ngược tự ngắt
                  </span>
                </div>
                <Play className="h-4 w-4 text-amber-400 shrink-0 ml-2" />
              </button>

              <button
                onClick={() => simulateScenario('students_enter')}
                className="w-full p-2.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/60 text-blue-200 text-xs font-medium text-left flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-bold block">2. Mô phỏng: Sinh viên vào lớp học mới</span>
                  <span className="text-[11px] text-blue-300/80">
                    Cảm biến PIR phát hiện người -&gt; Hủy đếm ngược, duy trì nguồn điện
                  </span>
                </div>
                <Users className="h-4 w-4 text-blue-400 shrink-0 ml-2" />
              </button>

              <button
                onClick={() => turnAllOff(selectedClassroomId)}
                className="w-full p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium text-left flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-bold block">3. Reset: Ngắt an toàn toàn bộ phòng</span>
                  <span className="text-[11px] text-slate-400">
                    Mở tiếp điểm Relay về trạng thái mở (0W)
                  </span>
                </div>
                <RotateCcw className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
