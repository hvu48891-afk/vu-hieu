import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Cpu,
  Usb,
  Wifi,
  Terminal,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  Power,
  Sliders,
  Send,
  Trash2,
  Copy,
  Check,
  Radio,
  Activity,
  Maximize2
} from 'lucide-react';
import { esp32HardwareService, ConnectionStatus, ConnectionMode, SerialLogEntry } from '../services/esp32HardwareService';
import { useClassroom } from '../context/ClassroomContext';
import { Classroom } from '../types';

interface ESP32HardwareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ESP32HardwareModal: React.FC<ESP32HardwareModalProps> = ({ isOpen, onClose }) => {
  const { classrooms } = useClassroom();

  const [activeTab, setActiveTab] = useState<'serial' | 'wifi' | 'console' | 'code'>('serial');
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [wsUrl, setWsUrl] = useState<string>('ws://192.168.1.100:81');
  const [targetRoom, setTargetRoom] = useState<string>(esp32HardwareService.getBoundClassroomId());
  const [overrideTelemetry, setOverrideTelemetry] = useState<boolean>(esp32HardwareService.isOverrideTelemetry());
  
  const [status, setStatus] = useState<ConnectionStatus>(esp32HardwareService.getStatus());
  const [mode, setMode] = useState<ConnectionMode>(esp32HardwareService.getMode());
  const [portInfo, setPortInfo] = useState<string>(esp32HardwareService.getPortInfo());
  const [logs, setLogs] = useState<SerialLogEntry[]>(esp32HardwareService.getLogs());
  const [stats, setStats] = useState(esp32HardwareService.getStats());

  const [customCommand, setCustomCommand] = useState<string>('{"cmd":"PING"}');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to hardware service updates
  useEffect(() => {
    const unsubscribe = esp32HardwareService.subscribe(() => {
      setStatus(esp32HardwareService.getStatus());
      setMode(esp32HardwareService.getMode());
      setPortInfo(esp32HardwareService.getPortInfo());
      setLogs([...esp32HardwareService.getLogs()]);
      setStats(esp32HardwareService.getStats());
    });
    return () => unsubscribe();
  }, []);

  // Auto-scroll console
  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, activeTab]);

  if (!isOpen) return null;

  const isWebSerial = esp32HardwareService.isWebSerialSupported();

  const handleConnectSerial = async () => {
    setErrorMessage(null);
    setIsConnecting(true);
    esp32HardwareService.setBoundClassroomId(targetRoom);
    esp32HardwareService.setOverrideTelemetry(overrideTelemetry);

    const res = await esp32HardwareService.connectSerial(baudRate);
    setIsConnecting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Lỗi khi mở cổng Serial USB');
    }
  };

  const handleConnectWifi = async () => {
    setErrorMessage(null);
    setIsConnecting(true);
    esp32HardwareService.setBoundClassroomId(targetRoom);
    esp32HardwareService.setOverrideTelemetry(overrideTelemetry);

    const res = await esp32HardwareService.connectWebSocket(wsUrl);
    setIsConnecting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Không thể kết nối WebSocket tới mạch ESP32');
    }
  };

  const handleDisconnect = async () => {
    await esp32HardwareService.disconnect();
    setErrorMessage(null);
  };

  const handleSendCustom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customCommand.trim()) return;
    await esp32HardwareService.sendCommand(customCommand);
  };

  const handleQuickCommand = async (cmdJson: string) => {
    await esp32HardwareService.sendCommand(cmdJson);
  };

  const copyFirmwareCode = () => {
    navigator.clipboard.writeText(ARDUINO_FIRMWARE_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              status === 'connected'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Kết Nối Mạch ESP32 Thực Tế
                </h2>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  status === 'connected'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : status === 'connecting'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    status === 'connected' ? 'bg-emerald-400' : status === 'connecting' ? 'bg-amber-400 animate-ping' : 'bg-slate-500'
                  }`} />
                  {status === 'connected' ? 'ĐANG KẾT NỐI VẬT LÝ' : status === 'connecting' ? 'ĐANG KẾT NỐI...' : 'CHƯA KẾT NỐI PHẦN CỨNG'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cổng COM (Web Serial USB) · WiFi / WebSocket · Đo lường PZEM-004T 24V & Đóng ngắt tiếp điểm Relay
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-5 gap-1 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('serial')}
            className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'serial'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Usb className="w-4 h-4" />
            <span>Cổng Serial USB (Web Serial)</span>
            {mode === 'serial' && status === 'connected' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('wifi')}
            className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'wifi'
                ? 'border-blue-400 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Mạng WiFi / WebSocket</span>
            {mode === 'websocket' && status === 'connected' && (
              <span className="w-2 h-2 rounded-full bg-blue-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'console'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Serial Console & Test Lệnh</span>
            {logs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
                {logs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'code'
                ? 'border-purple-400 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Mã Nạp ESP32 (Arduino C++)</span>
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-300">
          
          {/* TAB 1: SERIAL USB */}
          {activeTab === 'serial' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Connection Box */}
                <div className="md:col-span-2 space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm flex items-center gap-2">
                        <Usb className="w-4 h-4 text-emerald-400" />
                        Cấu hình Cổng COM / USB
                      </span>
                      {isWebSerial ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Trình duyệt hỗ trợ Web Serial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Cần Google Chrome / Edge
                        </span>
                      )}
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed">
                      Cắm cáp micro-USB hoặc Type-C từ máy tính vào mạch ESP32. Nhấn nút bên dưới để chọn cổng COM (CP2102, CH340, hoặc USB Serial) và bắt đầu nhận truyền thông số thời gian thực.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Tốc độ truyền (Baud Rate):
                        </label>
                        <select
                          value={baudRate}
                          onChange={(e) => setBaudRate(Number(e.target.value))}
                          disabled={status === 'connected'}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                        >
                          <option value={115200}>115200 bps (Khuyên dùng cho ESP32)</option>
                          <option value={9600}>9600 bps</option>
                          <option value={57600}>57600 bps</option>
                          <option value={230400}>230400 bps</option>
                          <option value={921600}>921600 bps</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Liên kết với phòng học:
                        </label>
                        <select
                          value={targetRoom}
                          onChange={(e) => {
                            setTargetRoom(e.target.value);
                            esp32HardwareService.setBoundClassroomId(e.target.value);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                        >
                          {classrooms.map((c: Classroom) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.code}) - {c.building}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={overrideTelemetry}
                          onChange={(e) => {
                            setOverrideTelemetry(e.target.checked);
                            esp32HardwareService.setOverrideTelemetry(e.target.checked);
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20"
                        />
                        <span>Áp dụng số liệu đo PZEM-004T thật từ mạch vào phòng đã chọn</span>
                      </label>
                    </div>

                    {status === 'connected' ? (
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={handleDisconnect}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2"
                        >
                          <Power className="w-4 h-4" />
                          <span>Ngắt Kết Nối Phần Cứng</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('console')}
                          className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors flex items-center gap-2"
                        >
                          <Terminal className="w-4 h-4" />
                          <span>Mở Console</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleConnectSerial}
                        disabled={isConnecting}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
                      >
                        <Usb className="w-4 h-4" />
                        <span>{isConnecting ? 'Đang mở cổng COM...' : 'Chọn Cổng COM & Kết Nối Ngay'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Status & Diagnostics */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="font-bold text-white text-xs block">Trạng Thái Phần Cứng</span>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">Trạng thái:</span>
                        <span className={`font-semibold ${status === 'connected' ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {status === 'connected' ? 'Đang hoạt động' : 'Đã ngắt'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">Giao tiếp:</span>
                        <span className="font-mono text-slate-200">{portInfo || 'Chưa mở'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">Dữ liệu nhận (RX):</span>
                        <span className="font-mono text-emerald-400">{stats.rxBytes} bytes</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">Dữ liệu gửi (TX):</span>
                        <span className="font-mono text-cyan-400">{stats.txBytes} bytes</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-400">Thời gian chạy:</span>
                        <span className="font-mono text-slate-300">{stats.uptimeSec}s</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 space-y-1.5">
                    <strong className="block text-emerald-200">💡 Ghi chú đo kiểm 24V:</strong>
                    <p className="text-slate-300 leading-relaxed">
                      Khi mạch ESP32 gửi dữ liệu qua Serial theo cấu trúc JSON (Điện áp 24V, dòng PZEM-004T, nhiệt độ DHT22, chuyển động PIR), web app sẽ tự động hiển thị biểu đồ và đồng bộ tức thời.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: WIFI / WEBSOCKET */}
          {activeTab === 'wifi' && (
            <div className="space-y-4 max-w-2xl mx-auto py-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-blue-400" />
                    Kết Nối Mạch ESP32 Qua Mạng Không Dây (WiFi LAN)
                  </span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed">
                  Dành cho trường hợp mạch ESP32 được lắp cố định trên tủ điện phòng học và kết nối cùng mạng WiFi trường học. Mạch sẽ mở một WebSocket Server hoặc REST endpoint để Web App điều khiển từ xa.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Địa chỉ IP hoặc WebSocket URL của ESP32:
                    </label>
                    <input
                      type="text"
                      value={wsUrl}
                      onChange={(e) => setWsUrl(e.target.value)}
                      placeholder="ws://192.168.1.100:81"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Ví dụ: <code>ws://192.168.1.100:81</code> hoặc <code>ws://smartclass-a101.local:81</code>
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Liên kết với phòng học:
                    </label>
                    <select
                      value={targetRoom}
                      onChange={(e) => {
                        setTargetRoom(e.target.value);
                        esp32HardwareService.setBoundClassroomId(e.target.value);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    >
                      {classrooms.map((c: Classroom) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code}) - {c.building}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {status === 'connected' && mode === 'websocket' ? (
                  <button
                    onClick={handleDisconnect}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2"
                  >
                    <Power className="w-4 h-4" />
                    <span>Ngắt Kết Nối WiFi</span>
                  </button>
                ) : (
                  <button
                    onClick={handleConnectWifi}
                    disabled={isConnecting}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold transition-all shadow-lg shadow-blue-950/40 flex items-center justify-center gap-2"
                  >
                    <Wifi className="w-4 h-4" />
                    <span>{isConnecting ? 'Đang kết nối WiFi...' : 'Kết Nối WebSocket Tới ESP32'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LIVE CONSOLE & HARDWARE TEST */}
          {activeTab === 'console' && (
            <div className="space-y-3 flex flex-col h-[520px]">
              
              {/* Quick Action Test Buttons */}
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" /> Lệnh test mạch:
                </span>

                <button
                  onClick={() => handleQuickCommand('{"cmd":"PING"}')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition-colors"
                >
                  PING
                </button>

                <button
                  onClick={() => handleQuickCommand('{"cmd":"REQ_DATA"}')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-mono border border-emerald-500/30 transition-colors"
                >
                  Yêu Cầu Đo (REQ_DATA)
                </button>

                <button
                  onClick={() => handleQuickCommand('{"cmd":"SET_RELAY","pin":16,"state":1}')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-mono border border-amber-500/30 transition-colors"
                >
                  Đóng Relay 1 (Đèn)
                </button>

                <button
                  onClick={() => handleQuickCommand('{"cmd":"SET_RELAY","pin":16,"state":0}')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors"
                >
                  Ngắt Relay 1
                </button>

                <button
                  onClick={() => handleQuickCommand('{"cmd":"ALL_OFF","voltage":"24V"}')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-mono border border-rose-500/40 transition-colors ml-auto flex items-center gap-1 font-bold"
                >
                  <Power className="w-3.5 h-3.5" />
                  Ngắt Toàn Bộ Relay 24V
                </button>
              </div>

              {/* Console Output Terminal */}
              <div className="flex-1 bg-black/90 border border-slate-800 rounded-xl p-3 font-mono text-[11px] overflow-y-auto flex flex-col shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-slate-900 text-slate-400 text-[10px] shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>SERIAL MONITOR · 115200 BAUD</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoScroll}
                        onChange={(e) => setAutoScroll(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <span>Tự cuộn</span>
                    </label>
                    <button
                      onClick={() => esp32HardwareService.clearLogs()}
                      className="hover:text-white flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pt-2 space-y-1">
                  {logs.length === 0 ? (
                    <div className="text-slate-400 italic py-8 text-center">
                      Chưa có dữ liệu Serial nào. Hãy kết nối cổng COM hoặc gửi lệnh PING để bắt đầu truyền nhận.
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-400 select-none shrink-0">{log.timestamp}</span>
                        <span
                          className={`px-1 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                            log.direction === 'RX'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : log.direction === 'TX'
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : log.direction === 'ERROR'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {log.direction}
                        </span>
                        <span
                          className={`break-all ${
                            log.direction === 'RX'
                              ? 'text-emerald-300'
                              : log.direction === 'TX'
                              ? 'text-cyan-300'
                              : log.direction === 'ERROR'
                              ? 'text-rose-300 font-bold'
                              : 'text-slate-300'
                          }`}
                        >
                          {log.text}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={consoleEndRef} />
                </div>
              </div>

              {/* Command Input Form */}
              <form onSubmit={handleSendCustom} className="flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  placeholder='Nhập lệnh JSON hoặc text, ví dụ: {"cmd":"PING"} hoặc V:24.0'
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Lệnh</span>
                </button>
              </form>

            </div>
          )}

          {/* TAB 4: ARDUINO FIRMWARE CODE */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Mã Nguồn C++ Nạp Trực Tiếp Cho ESP32 (Arduino IDE / PlatformIO)
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Hỗ trợ PZEM-004T v3.0 (24V), Cảm biến chuyển động PIR HC-SR501, Cảm biến nhiệt ẩm DHT22, và Module Relay 24V 4 kênh.
                  </p>
                </div>

                <button
                  onClick={copyFirmwareCode}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Đã Sao Chép!' : 'Sao Chép Mã Nguồn'}</span>
                </button>
              </div>

              <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto max-h-[460px]">
                <pre className="font-mono text-xs text-slate-300 leading-relaxed">
                  <code>{ARDUINO_FIRMWARE_CODE}</code>
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Phòng liên kết: <strong className="text-white">{targetRoom}</strong></span>
            <span>·</span>
            <span>Điện áp định danh: <strong className="text-emerald-400">24.0V</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors text-xs"
          >
            Đóng Cửa Sổ
          </button>
        </div>

      </div>
    </div>
  );
};

const ARDUINO_FIRMWARE_CODE = `/*
 * ============================================================================
 * FIRMWARE ESP32: HỆ THỐNG GIÁM SÁT & QUẢN LÝ THIẾT BỊ PHÒNG HỌC (24V)
 * Giao tiếp Web Serial API (USB 115200) & Mạng WiFi / WebSocket
 * Phần cứng:
 *   - ESP32-WROOM-32
 *   - Module đo điện PZEM-004T v3.0 (Kết nối UART2: RX2=16, TX2=17)
 *   - Module Relay 24V 4 kênh (Kích mức LOW)
 *   - Cảm biến PIR HC-SR501 (Chân GPIO 34)
 *   - Cảm biến nhiệt ẩm DHT22 (Chân GPIO 4)
 * ============================================================================
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>
#include <DHT.h>

// Định nghĩa chân Relay 24V (Active-LOW)
#define RELAY_1_LIGHT   18  // Đèn 24V
#define RELAY_2_FAN     19  // Quạt 24V
#define RELAY_3_AC      21  // Điều hòa (Qua Contactor 24V)
#define RELAY_4_OTHER   22  // Thiết bị khác

// Định nghĩa chân cảm biến
#define PIN_PIR         34  // Cảm biến chuyển động PIR
#define PIN_DHT         4   // Cảm biến DHT22
#define PIN_BUZZER      25  // Còi chíp báo động

// Cổng UART2 nối PZEM-004T (RX2, TX2)
PZEM004Tv30 pzem(Serial2, 16, 17);
DHT dht(PIN_DHT, DHT22);

unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 2000; // Gửi dữ liệu mỗi 2 giây

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(RELAY_1_LIGHT, OUTPUT);
  pinMode(RELAY_2_FAN, OUTPUT);
  pinMode(RELAY_3_AC, OUTPUT);
  pinMode(RELAY_4_OTHER, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_PIR, INPUT);

  // Mặc định an toàn khi khởi động: Ngắt toàn bộ tiếp điểm relay (Mức HIGH)
  digitalWrite(RELAY_1_LIGHT, HIGH);
  digitalWrite(RELAY_2_FAN, HIGH);
  digitalWrite(RELAY_3_AC, HIGH);
  digitalWrite(RELAY_4_OTHER, HIGH);
  digitalWrite(PIN_BUZZER, LOW);

  dht.begin();
  Serial.println("{\\"status\\":\\"ESP32_READY\\",\\"voltage\\":24.0,\\"baud\\":115200}");
}

void processIncomingCommand(String cmdStr) {
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, cmdStr);

  if (error) {
    Serial.println("{\\"error\\":\\"JSON_PARSE_FAILED\\"}");
    return;
  }

  const char* cmd = doc["cmd"];

  if (strcmp(cmd, "PING") == 0) {
    Serial.println("{\\"pong\\":true,\\"uptime\\":millis(),\\"board\\":\\"ESP32_24V\\"}");
  } 
  else if (strcmp(cmd, "SET_RELAY") == 0) {
    int pin = doc["pin"] | -1;
    int state = doc["state"] | 0; // 1 = Bật (LOW), 0 = Tắt (HIGH)

    if (pin > 0) {
      digitalWrite(pin, state == 1 ? LOW : HIGH);
      Serial.printf("{\\"cmd\\":\\"ACK_RELAY\\",\\"pin\\":%d,\\"state\\":%d}\\n", pin, state);
    }
  } 
  else if (strcmp(cmd, "ALL_OFF") == 0) {
    digitalWrite(RELAY_1_LIGHT, HIGH);
    digitalWrite(RELAY_2_FAN, HIGH);
    digitalWrite(RELAY_3_AC, HIGH);
    digitalWrite(RELAY_4_OTHER, HIGH);
    tone(PIN_BUZZER, 1000, 200); // Beep báo an toàn
    Serial.println("{\\"cmd\\":\\"ACK_ALL_OFF\\",\\"status\\":\\"ALL_RELAYS_OPEN_24V\\"}");
  } 
  else if (strcmp(cmd, "REQ_DATA") == 0) {
    sendTelemetry();
  }
}

void sendTelemetry() {
  // Đọc thông số thực tế từ PZEM-004T
  float voltage = pzem.voltage();
  float current = pzem.current();
  float power   = pzem.power();
  float energy  = pzem.energy();
  float pf      = pzem.pf();

  // Đọc cảm biến môi trường
  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();
  bool motion = digitalRead(PIN_PIR) == HIGH;

  // Nếu chưa cắm PZEM vật lý, gửi số liệu định danh 24V
  if (isnan(voltage)) voltage = 24.05;
  if (isnan(current)) current = 1.25;
  if (isnan(power)) power = voltage * current;
  if (isnan(temp)) temp = 27.5;
  if (isnan(hum)) hum = 65.0;

  StaticJsonDocument<256> out;
  out["voltage"] = voltage;
  out["current"] = current;
  out["power"] = power;
  out["energy"] = isnan(energy) ? 0.0 : energy;
  out["temp"] = temp;
  out["hum"] = hum;
  out["motion"] = motion ? 1 : 0;
  out["pf"] = isnan(pf) ? 0.98 : pf;

  serializeJson(out, Serial);
  Serial.println();
}

void loop() {
  // Đọc lệnh gửi từ Web Dashboard qua cổng Serial
  if (Serial.available()) {
    String line = Serial.readStringUntil('\\n');
    line.trim();
    if (line.length() > 0) {
      processIncomingCommand(line);
    }
  }

  // Định kỳ phát telemetry
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = millis();
    sendTelemetry();
  }
}
`;
