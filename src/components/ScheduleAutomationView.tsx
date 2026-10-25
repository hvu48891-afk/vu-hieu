import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { TimetableSlot } from '../types';
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
  Plus,
  Pencil,
  Trash2,
  Clock,
  BookOpen,
  User,
  X,
  Check,
  Calendar,
  AlertCircle,
  HelpCircle,
  Eye,
} from 'lucide-react';

const STANDARD_PERIODS = [
  { period: 'Tiết 1 - 3 (Sáng)', start: '07:00', end: '09:15' },
  { period: 'Tiết 4 - 6 (Sáng)', start: '09:30', end: '11:45' },
  { period: 'Tiết 7 - 9 (Chiều)', start: '12:30', end: '14:45' },
  { period: 'Tiết 10 - 12 (Chiều)', start: '15:00', end: '17:15' },
  { period: 'Tiết 13 - 15 (Tối)', start: '17:30', end: '19:45' },
];

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
    addTimetableSlot,
    updateTimetableSlot,
    deleteTimetableSlot,
  } = useClassroom();

  const [roomFilterId, setRoomFilterId] = useState<string>('ALL'); // 'ALL' or specific roomId
  const [activeDay, setActiveDay] = useState<string>('Tất cả');
  const days = ['Tất cả', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  
  // Form fields
  const [formRoomId, setFormRoomId] = useState<string>(selectedClassroomId);
  const [formSubject, setFormSubject] = useState('');
  const [formLecturer, setFormLecturer] = useState('');
  const [formClassGroup, setFormClassGroup] = useState('');
  const [formDayOfWeek, setFormDayOfWeek] = useState('Thứ 4');
  const [formPeriod, setFormPeriod] = useState('Tiết 1 - 3');
  const [formStartTime, setFormStartTime] = useState('07:00');
  const [formEndTime, setFormEndTime] = useState('09:15');
  const [formExpectedStudents, setFormExpectedStudents] = useState<number>(45);
  const [formNote, setFormNote] = useState('');
  const [formIsActiveNow, setFormIsActiveNow] = useState(false);
  
  // Delete confirm state
  const [deletingSlot, setDeletingSlot] = useState<TimetableSlot | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const room = selectedClassroom;

  // Filter slots across all rooms or selected room
  const allSlots: TimetableSlot[] = roomFilterId === 'ALL'
    ? classrooms.flatMap((c) =>
        (c.timetable || []).map((s) => ({
          ...s,
          roomId: s.roomId || c.id,
          roomCode: s.roomCode || c.code,
          roomName: s.roomName || c.name,
        }))
      )
    : (classrooms.find((c) => c.id === roomFilterId)?.timetable || []).map((s) => ({
        ...s,
        roomId: s.roomId || roomFilterId,
        roomCode: s.roomCode || classrooms.find((c) => c.id === roomFilterId)?.code,
        roomName: s.roomName || classrooms.find((c) => c.id === roomFilterId)?.name,
      }));

  const filteredSlots = activeDay === 'Tất cả'
    ? allSlots
    : allSlots.filter((s) => !s.dayOfWeek || s.dayOfWeek === activeDay || s.dayOfWeek.includes(activeDay));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openAddModal = (suggestedRoomId?: string) => {
    setEditingSlotId(null);
    const chosenRoomId = suggestedRoomId || (roomFilterId !== 'ALL' ? roomFilterId : selectedClassroomId || classrooms[0]?.id || 'cr-a101');
    setFormRoomId(chosenRoomId);
    setFormSubject('');
    setFormLecturer('');
    setFormClassGroup('');
    setFormDayOfWeek(activeDay === 'Tất cả' ? 'Thứ 4' : activeDay);
    setFormPeriod('Tiết 1 - 3');
    setFormStartTime('07:00');
    setFormEndTime('09:15');
    const targetRoom = classrooms.find((c) => c.id === chosenRoomId);
    setFormExpectedStudents(targetRoom?.capacity ? Math.min(targetRoom.capacity, 45) : 45);
    setFormNote('');
    setFormIsActiveNow(false);
    setIsModalOpen(true);
  };

  const openEditModal = (slot: TimetableSlot) => {
    setEditingSlotId(slot.id);
    setFormRoomId(slot.roomId || room.id);
    setFormSubject(slot.subject);
    setFormLecturer(slot.lecturer);
    setFormClassGroup(slot.classGroup);
    setFormDayOfWeek(slot.dayOfWeek || 'Thứ 4');
    setFormPeriod(slot.period);
    setFormStartTime(slot.startTime);
    setFormEndTime(slot.endTime);
    setFormExpectedStudents(slot.expectedStudents || 45);
    setFormNote(slot.note || '');
    setFormIsActiveNow(slot.isActiveNow);
    setIsModalOpen(true);
  };

  const handlePeriodPresetSelect = (preset: typeof STANDARD_PERIODS[0]) => {
    setFormPeriod(preset.period);
    setFormStartTime(preset.start);
    setFormEndTime(preset.end);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim()) {
      alert('Vui lòng nhập tên môn học / học phần!');
      return;
    }

    const targetRoomId = formRoomId || room.id;
    const targetRoom = classrooms.find((c) => c.id === targetRoomId || c.code === targetRoomId);
    const roomCode = targetRoom?.code || '';
    const roomName = targetRoom?.name || '';

    if (editingSlotId) {
      // Find current room owner
      const currentOwnerRoom = classrooms.find((c) =>
        (c.timetable || []).some((s) => s.id === editingSlotId)
      ) || targetRoom || room;

      const res = await updateTimetableSlot(currentOwnerRoom.id, editingSlotId, {
        roomId: targetRoomId,
        roomCode,
        roomName,
        subject: formSubject.trim(),
        lecturer: formLecturer.trim() || 'Chưa phân công',
        classGroup: formClassGroup.trim() || 'Lớp mở',
        dayOfWeek: formDayOfWeek,
        period: formPeriod.trim(),
        startTime: formStartTime,
        endTime: formEndTime,
        expectedStudents: Number(formExpectedStudents) || 40,
        note: formNote.trim(),
        isActiveNow: formIsActiveNow,
      });

      if (res.success) {
        showToast(`Đã lưu cập nhật vào Database cho phòng ${roomCode}: ${formSubject.trim()}`);
        setIsModalOpen(false);
      } else {
        alert(res.error || 'Lỗi khi cập nhật tiết học.');
      }
    } else {
      // Add new slot
      const res = await addTimetableSlot(targetRoomId, {
        roomId: targetRoomId,
        roomCode,
        roomName,
        subject: formSubject.trim(),
        lecturer: formLecturer.trim() || 'Chưa phân công',
        classGroup: formClassGroup.trim() || 'Lớp mở',
        dayOfWeek: formDayOfWeek,
        period: formPeriod.trim(),
        startTime: formStartTime,
        endTime: formEndTime,
        expectedStudents: Number(formExpectedStudents) || 40,
        note: formNote.trim(),
        isActiveNow: formIsActiveNow,
      });

      if (res.success) {
        showToast(`Đã lưu tiết học vào Database phòng ${roomCode}: ${formSubject.trim()}`);
        setIsModalOpen(false);
      } else {
        alert(res.error || 'Lỗi khi thêm tiết học.');
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSlot) return;
    const ownerRoom = classrooms.find((c) =>
      (c.timetable || []).some((s) => s.id === deletingSlot.id)
    ) || room;

    const res = await deleteTimetableSlot(ownerRoom.id, deletingSlot.id);
    if (res.success) {
      showToast(`Đã xóa tiết học "${deletingSlot.subject}" khỏi Database`);
      setDeletingSlot(null);
    } else {
      alert(res.error || 'Lỗi khi xóa lịch học.');
    }
  };

  const handleToggleSlotActive = async (slot: TimetableSlot) => {
    const nextState = !slot.isActiveNow;
    const ownerRoom = classrooms.find((c) =>
      (c.timetable || []).some((s) => s.id === slot.id)
    ) || room;

    await updateTimetableSlot(ownerRoom.id, slot.id, { isActiveNow: nextState });
    showToast(
      nextState
        ? `Đã kích hoạt tiết học "${slot.subject}" đang diễn ra tại phòng ${slot.roomCode || ownerRoom.code}!`
        : `Đã tắt trạng thái đang diễn ra của "${slot.subject}"`
    );
  };

  const handleLoadSampleTimetable = async () => {
    const sampleSlots: Omit<TimetableSlot, 'id'>[] = [
      {
        subject: 'IoT & Lập Trình Hệ Thống Nhúng (24V Relay)',
        lecturer: 'TS. Nguyễn Văn Tuấn',
        classGroup: '21DTV01 (Nhóm 1)',
        dayOfWeek: 'Thứ 4',
        period: 'Tiết 1 - 3 (Sáng)',
        startTime: '07:00',
        endTime: '09:15',
        expectedStudents: 48,
        note: 'Yêu cầu phòng bật máy chiếu và 2 điều hòa nhiệt độ 24°C',
        isActiveNow: true,
      },
      {
        subject: 'Mạng Cảm Biến Không Dây & Đo Lường PZEM',
        lecturer: 'ThS. Lê Hoàng Minh',
        classGroup: '21DTV02',
        dayOfWeek: 'Thứ 4',
        period: 'Tiết 4 - 6 (Sáng)',
        startTime: '09:30',
        endTime: '11:45',
        expectedStudents: 42,
        note: 'Thực hành nối dây và giám sát công suất',
        isActiveNow: false,
      },
      {
        subject: 'Thiết Kế Mạch In PCB & Tự Động Hóa Tủ Điện',
        lecturer: 'TS. Trần Quang Vinh',
        classGroup: '20DTV_CLC',
        dayOfWeek: 'Thứ 4',
        period: 'Tiết 7 - 9 (Chiều)',
        startTime: '12:30',
        endTime: '14:45',
        expectedStudents: 38,
        note: 'Tự động kiểm tra phòng sau 14:45',
        isActiveNow: false,
      },
      {
        subject: 'Thí Nghiệm Hệ Thống Điều Khiển Số',
        lecturer: 'TS. Nguyễn Văn Tuấn',
        classGroup: '22DTV01',
        dayOfWeek: 'Thứ 6',
        period: 'Tiết 1 - 3 (Sáng)',
        startTime: '07:00',
        endTime: '09:15',
        expectedStudents: 45,
        note: 'Tiết học thí nghiệm',
        isActiveNow: false,
      },
    ];

    for (const s of sampleSlots) {
      await addTimetableSlot(room.id, s);
    }
    showToast('Đã nạp 4 tiết học mẫu tiêu chuẩn vào thời khóa biểu phòng học!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-3.5 rounded-xl bg-emerald-600 text-white font-medium text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <CalendarClock className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">
                  Quản Lý Thời Khóa Biểu &amp; Tự Động Hóa Học Vụ
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  Relay 24V Auto-Cutoff
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Hệ thống tự động liên kết thời khóa biểu học vụ với cảm biến hiện diện PIR. Khi hết giờ học mà phòng trống sau 10 phút, tiếp điểm Relay 24V sẽ tự động mở để triệt tiêu điện năng tiêu thụ lãng phí.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => simulateScenario('leave_empty_forget')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/80 rounded-lg shadow-sm transition-colors"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Test: Quên Tắt Điện Sau Tan Học</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two columns layout: Left = Timetable Management, Right = Smart Automation Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Timetable Matrix & Management */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            
            {/* Top Toolbar: Room Select & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold uppercase text-slate-300">
                  Xem phòng:
                </span>
                <select
                  value={roomFilterId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRoomFilterId(val);
                    if (val !== 'ALL') {
                      setSelectedClassroomId(val);
                    }
                  }}
                  className="bg-slate-950 border border-slate-700 text-emerald-400 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">🏢 Toàn trường: Tất cả các phòng ({classrooms.length})</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      Phòng {c.code} - {c.name} ({c.building})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddModal()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm shadow-emerald-950/40 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Tiết Học Mới</span>
                </button>
              </div>
            </div>

            {/* Day of Week Selector */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 border-b border-slate-800/60">
              <div className="flex items-center gap-1 overflow-x-auto">
                {days.map((d) => (
                  <button
                    key={d}
                    onClick={() => setActiveDay(d)}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap ${
                      activeDay === d
                        ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                {filteredSlots.length} tiết học
              </span>
            </div>

            {/* Timetable slots list */}
            <div className="space-y-3">
              {filteredSlots.length === 0 ? (
                <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-slate-800/60 p-6 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Chưa có lịch học vụ nào {activeDay !== 'Tất cả' ? `vào ${activeDay}` : ''}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Hãy thêm tiết học mới hoặc nạp lịch học mẫu tiêu chuẩn của trường để kích hoạt tính năng tự ngắt thông minh.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      onClick={() => openAddModal()}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm Tiết Học Đầu Tiên</span>
                    </button>
                    <button
                      onClick={handleLoadSampleTimetable}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Nạp Lịch Mẫu Tiêu Chuẩn</span>
                    </button>
                  </div>
                </div>
              ) : (
                filteredSlots.map((slot) => {
                  return (
                    <div
                      key={slot.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        slot.isActiveNow
                          ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`font-bold text-sm tracking-wide ${
                                slot.isActiveNow ? 'text-white' : 'text-slate-100'
                              }`}
                            >
                              {slot.subject}
                            </span>
                            
                            {/* Room Badge */}
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                              <Building2 className="w-3 h-3 text-emerald-400" />
                              <span>Phòng {slot.roomCode || room.code}</span>
                            </span>

                            {slot.dayOfWeek && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                {slot.dayOfWeek}
                              </span>
                            )}

                            {slot.isActiveNow ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse font-bold">
                                ● TIẾT ĐANG DIỄN RA
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">
                                Chưa bắt đầu
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1 text-slate-300">
                              <Building2 className="w-3 h-3 text-emerald-400" />
                              <span>Phòng học: <strong className="text-emerald-300">{slot.roomName || (classrooms.find(c => c.id === slot.roomId)?.name) || room.name}</strong></span>
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-emerald-400" />
                              <span>GV: <strong className="text-slate-200">{slot.lecturer}</strong></span>
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-cyan-400" />
                              <span>Lớp: <strong className="text-slate-200">{slot.classGroup}</strong></span>
                            </span>
                            {slot.expectedStudents && (
                              <>
                                <span>·</span>
                                <span>Sĩ số: <strong className="text-slate-300">{slot.expectedStudents} SV</strong></span>
                              </>
                            )}
                          </div>

                          {slot.note && (
                            <p className="text-[11px] text-slate-400 italic bg-slate-900/60 rounded px-2 py-1 border border-slate-800 inline-block">
                              Ghi chú: {slot.note}
                            </p>
                          )}
                        </div>

                        {/* Right Timing & Action Controls */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="text-right">
                            <span className="font-mono text-xs font-bold text-slate-200 block">
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
                              {slot.period}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 pt-1">
                            <button
                              onClick={() => handleToggleSlotActive(slot)}
                              title={slot.isActiveNow ? 'Tắt trạng thái đang diễn ra' : 'Đặt làm tiết học đang diễn ra ngay'}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                slot.isActiveNow
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                              }`}
                            >
                              <Play className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => openEditModal(slot)}
                              title="Chỉnh sửa tiết học"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => setDeletingSlot(slot)}
                              title="Xóa tiết học khỏi thời khóa biểu"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Automation Status Indicator */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span>Hẹn giờ ngắt sau {slot.endTime}: Tự ngắt sau 10 phút nếu phòng trống</span>
                        </span>
                        <span className="text-slate-400 font-mono">
                          Relay 24V: Sẵn sàng
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {filteredSlots.length > 0 && (
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/60 text-xs">
                <button
                  onClick={handleLoadSampleTimetable}
                  className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors text-[11px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nạp thêm lịch học mẫu</span>
                </button>

                <button
                  onClick={() => openAddModal()}
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm tiết học mới</span>
                </button>
              </div>
            )}

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
              Thử nghiệm trực tiếp các tình huống kiểm tra vận hành hệ thống:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => simulateScenario('leave_empty_forget')}
                className="w-full p-2.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-200 text-xs font-medium text-left flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-bold block">1. Mô phỏng: Tan học &amp; Bỏ quên thiết bị</span>
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

      {/* MODAL: ADD / EDIT TIMETABLE SLOT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingSlotId ? 'Chỉnh Sửa Lịch Học Vụ & Phòng Học' : 'Thêm Tiết Học Mới & Chọn Phòng Học'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingSlotId ? 'Cập nhật thông tin tiết học và phòng học tương ứng' : 'Chỉ định phòng học cho lớp học và lưu trực tiếp vào Database'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* Select Classroom */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    Lớp Học Ở Phòng Nào? <span className="text-rose-400">*</span>:
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Đồng bộ Database &amp; Cloud</span>
                </label>
                <select
                  value={formRoomId}
                  onChange={(e) => {
                    const chosenId = e.target.value;
                    setFormRoomId(chosenId);
                    const chosenRoom = classrooms.find((c) => c.id === chosenId);
                    if (chosenRoom && !editingSlotId) {
                      setFormExpectedStudents(Math.min(chosenRoom.capacity, 45));
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
                  required
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      Phòng {c.code} - {c.name} ({c.building} · {c.capacity} chỗ · Tiếp điểm 24V)
                    </option>
                  ))}
                </select>
                {(() => {
                  const currentTargetRoom = classrooms.find((c) => c.id === formRoomId);
                  return currentTargetRoom ? (
                    <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                      <span>Vị trí: <strong className="text-slate-200">{currentTargetRoom.building} (Tầng {currentTargetRoom.floor})</strong></span>
                      <span>Sức chứa: <strong className="text-slate-200">{currentTargetRoom.capacity} sinh viên</strong></span>
                      <span>Điện áp: <strong className="text-emerald-400 font-mono">24V An Toàn</strong></span>
                    </div>
                  ) : null;
                })()}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tên Môn Học / Học Phần <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Ví dụ: IoT & Hệ thống nhúng, Mạng máy tính..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Giảng Viên Phụ Trách:
                  </label>
                  <input
                    type="text"
                    value={formLecturer}
                    onChange={(e) => setFormLecturer(e.target.value)}
                    placeholder="TS. Nguyễn Văn Tuấn"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nhóm / Lớp Sinh Viên:
                  </label>
                  <input
                    type="text"
                    value={formClassGroup}
                    onChange={(e) => setFormClassGroup(e.target.value)}
                    placeholder="21DTV01, 20CNTT02..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Day of week & Preset Tiết học */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Thứ Trong Tuần:
                  </label>
                  <select
                    value={formDayOfWeek}
                    onChange={(e) => setFormDayOfWeek(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="Thứ 2">Thứ 2</option>
                    <option value="Thứ 3">Thứ 3</option>
                    <option value="Thứ 4">Thứ 4</option>
                    <option value="Thứ 5">Thứ 5</option>
                    <option value="Thứ 6">Thứ 6</option>
                    <option value="Thứ 7">Thứ 7</option>
                    <option value="Chủ Nhật">Chủ Nhật</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Sĩ Số Dự Kiến:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={250}
                    value={formExpectedStudents}
                    onChange={(e) => setFormExpectedStudents(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Quick Period Presets */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                  <span>Khung Tiết Học Chuẩn:</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Bấm để điền nhanh giờ</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {STANDARD_PERIODS.map((p) => (
                    <button
                      key={p.period}
                      type="button"
                      onClick={() => handlePeriodPresetSelect(p)}
                      className={`p-1.5 rounded-lg border text-left transition-colors text-[11px] ${
                        formPeriod === p.period
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span className="block truncate">{p.period}</span>
                      <span className="text-[10px] font-mono text-slate-500">{p.start} - {p.end}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Start & End Time */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                    Giờ Bắt Đầu:
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-semibold mb-1">
                    Giờ Kết Thúc:
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Custom Period Label */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tên Khung Tiết (Hiển thị):
                </label>
                <input
                  type="text"
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                  placeholder="Ví dụ: Tiết 1 - 3 (Sáng), Ca Tối..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Ghi Chú Vận Hành / Thiết Bị:
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Ví dụ: Cần bật máy chiếu & 2 điều hòa nhiệt độ 24°C"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Active Now Toggle */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Đặt làm tiết học Đang Diễn Ra</span>
                  <span className="text-[11px] text-slate-400">
                    Phục vụ kiểm thử trực tiếp kịch bản tự ngắt Relay 24V khi hết giờ học
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsActiveNow}
                  onChange={(e) => setFormIsActiveNow(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingSlotId ? 'Lưu Thay Đổi & Cập Nhật Database' : 'Thêm Tiết Học & Lưu Vào Database'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Xác Nhận Xóa Tiết Học</h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa tiết học <strong className="text-white">"{deletingSlot.subject}"</strong> ({deletingSlot.period} - {deletingSlot.startTime} đến {deletingSlot.endTime}) khỏi thời khóa biểu phòng {room.name}?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingSlot(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/40"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
