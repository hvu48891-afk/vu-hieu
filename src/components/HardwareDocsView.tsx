import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { STUDENT_GROUP_TASKS, ESP32_SAMPLE_CODE } from '../data/mockData';
import {
  Cpu,
  Users,
  Code2,
  Terminal,
  ShieldAlert,
  Copy,
  Check,
  Zap,
  Radio,
  FileText,
  Boxes,
  CheckCircle2,
} from 'lucide-react';

export const HardwareDocsView: React.FC = () => {
  const { hardwareLogs } = useClassroom();
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'tasks' | 'wiring' | 'code' | 'bus'>('tasks');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ESP32_SAMPLE_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner for 4-5 Students Capstone Project */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shrink-0">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">
                  Tài Liệu Kỹ Thuật & Hồ Sơ Đồ Án (Dành Cho Nhóm 4 - 5 Sinh Viên)
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Capstone Thesis 2026
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Đề tài: <strong>Hệ thống giám sát và quản lý thiết bị phòng học từ xa</strong> · Quy mô 4-5 thành viên.
                Bao gồm thiết kế cụm phần cứng công tắc Relay 220V, mạch đo năng lượng PZEM-004T v3.0, firmware ESP32,
                bảng điều khiển tại chỗ và Web App đồng bộ hai chiều.
              </p>
            </div>
          </div>

          {/* Sub-tab selection */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0 overflow-x-auto">
            <button
              onClick={() => setSelectedTab('tasks')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedTab === 'tasks' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Phân Công Nhóm
            </button>
            <button
              onClick={() => setSelectedTab('wiring')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedTab === 'wiring' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sơ Đồ Đấu Nối 220V
            </button>
            <button
              onClick={() => setSelectedTab('code')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedTab === 'code' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mã Nguồn ESP32 (C++)
            </button>
            <button
              onClick={() => setSelectedTab('bus')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedTab === 'bus' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Giao Thức MQTT Bus
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Student Team Division of Responsibilities */}
      {selectedTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-emerald-400" />
              Bảng Phân Công Nhiệm Vụ 5 Thành Viên Trong Nhóm Đồ Án
            </h3>
            <span className="text-xs text-slate-400">
              Tổng tiến độ hoàn thiện đề tài: <strong className="text-emerald-400">92%</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STUDENT_GROUP_TASKS.map((st) => (
              <div
                key={st.studentId}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {st.studentId}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      {st.progressPercent}%
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-2">
                    {st.name}
                  </h4>
                  <p className="text-xs text-purple-400 font-medium">
                    {st.role}
                  </p>

                  <div className="mt-3 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                      Trách nhiệm chính:
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                      {st.responsibilities.map((r, i) => (
                        <li key={i} className="leading-snug">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300 block mb-1">Sản phẩm bàn giao:</span>
                  <div className="flex flex-wrap gap-1">
                    {st.hardwareDeliverables.map((item, i) => (
                      <span key={i} className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-400 border border-slate-800 text-[10px]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Hardware Wiring Architecture & 220V Safety */}
      {selectedTab === 'wiring' && (
        <div className="space-y-5">
          {/* Safety warning */}
          <div className="bg-rose-950/60 border border-rose-800/80 rounded-xl p-4 text-rose-200 text-xs flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-rose-100 text-sm block">
                QUY TẮC AN TOÀN ĐIỆN 220V AC TRONG PHÒNG THÍ NGHIỆM ĐỒ ÁN:
              </strong>
              <p className="leading-relaxed">
                1. Toàn bộ cụm điều khiển phải được cấp nguồn qua Aptomat chống giật RCBO 30mA.
                <br />
                2. Phải dùng mạch cách ly quang (Optocoupler EL817 / PC817) giữa vi điều khiển ESP32 (3.3V) và cuộn hút Relay để triệt tiêu dòng rò và xung điện áp cao.
                <br />
                3. Điều hòa không khí có dòng khởi động lớn (Inrush Current lên đến 25A) BẮT BUỘC phải dùng Khởi động từ (Contactor AC 220V 25A - 30A), không đóng ngắt trực tiếp bằng relay 10A xanh nhỏ để tránh dính tiếp điểm gây cháy!
              </p>
            </div>
          </div>

          {/* System Diagram Specifications */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Boxes className="h-4 w-4 text-emerald-400" />
              Sơ Đồ Khối Kiến Trúc Phần Cứng Tủ Điều Khiển Phòng Học
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-cyan-400 block text-sm">
                  1. Khối Cảm Biến (Inputs)
                </span>
                <p className="text-slate-400 leading-relaxed">
                  - <strong>PZEM-004T v3.0</strong>: Đo V, A, W, kWh, Cos φ qua cuộn biến dòng CT 100A.
                  <br />
                  - <strong>PIR HC-SR501</strong>: Phát hiện chuyển động sinh viên.
                  <br />
                  - <strong>DHT22</strong>: Đo nhiệt độ & độ ẩm phòng học.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-emerald-400 block text-sm">
                  2. Khối Vi Điều Khiển (MCU)
                </span>
                <p className="text-slate-400 leading-relaxed">
                  - <strong>ESP32 NodeMCU-32S</strong>: Dual-core 240MHz, tích hợp WiFi 802.11b/g/n & Bluetooth BLE.
                  <br />
                  - Cổng UART2 giao tiếp PZEM.
                  <br />
                  - Xử lý bộ lọc nhiễu tín hiệu và giao thức MQTT.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-amber-400 block text-sm">
                  3. Khối Chấp Hành (220V Switch)
                </span>
                <p className="text-slate-400 leading-relaxed">
                  - <strong>Module 4/8 Relay Songle 10A</strong>: Đóng ngắt đèn LED và quạt đảo trần.
                  <br />
                  - <strong>Contactor Schneider 30A</strong>: Đóng ngắt nguồn động lực máy lạnh 2.5 HP.
                  <br />
                  - Diode Dập Xung (Flyback) & Snubber RC.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-purple-400 block text-sm">
                  4. Khối Hiển Thị & Giao Tiếp
                </span>
                <p className="text-slate-400 leading-relaxed">
                  - <strong>HMI Touch Panel</strong> tại phòng học: Phím cảm ứng bật/tắt trực tiếp.
                  <br />
                  - <strong>MQTT Broker (Mosquitto)</strong>: Đồng bộ 2 chiều tức thời với Web Admin.
                  <br />
                  - Web Dashboard trung tâm trường học.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Complete ESP32 Arduino C++ Firmware */}
      {selectedTab === 'code' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="h-4 w-4 text-emerald-400" />
                Mã Nguồn C++ Nạp Vi Điều Khiển ESP32 (Arduino IDE)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mã nguồn thực tế hoàn chỉnh đã test cùng PZEM-004T v3.0, Relay Active-LOW, MQTT JSON.
              </p>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 rounded-lg transition-colors border border-slate-700"
            >
              {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copiedCode ? 'Đã sao chép' : 'Sao chép C++ Code'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed">
            {ESP32_SAMPLE_CODE}
          </pre>
        </div>
      )}

      {/* Tab 4: Live Hardware Bus Telemetry Log Console */}
      {selectedTab === 'bus' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                Console Giám Sát Gói Tin IoT (MQTT Broker Live Bus)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Các bản tin Telemetry JSON và Lệnh điều khiển gửi nhận giữa ESP32 và Server
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <Radio className="h-3.5 w-3.5 animate-pulse" /> WebSocket MQTT: 1883 CONNECTED
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs space-y-2 max-h-96 overflow-y-auto">
            {hardwareLogs.map((log) => (
              <div
                key={log.id}
                className={`p-2 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-1 ${
                  log.type === 'ALARM'
                    ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                    : log.type === 'COMMAND'
                    ? 'bg-blue-950/30 border-blue-800/60 text-blue-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                  <span
                    className={`text-[9px] px-1 rounded font-bold ${
                      log.direction === 'IN'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {log.direction}
                  </span>
                  <span className="text-emerald-400 font-semibold">{log.topic}</span>
                </div>
                <div className="text-slate-300 truncate max-w-xl text-[11px]">
                  {log.payload}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
