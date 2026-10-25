import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Play,
  Copy,
  Check,
  HardDrive,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Sliders,
  Terminal,
  Activity,
} from 'lucide-react';
import {
  getSqlServerConfig,
  saveSqlServerConfig,
  testSqlServerConnection,
  executeTSqlQuery,
  syncClassroomsToSqlServer,
  SqlServerConfig,
  SqlServerStatus,
  SqlQueryResult,
} from '../services/sqlServerService';
import { useClassroom } from '../context/ClassroomContext';
import { formatWatts } from '../utils/calculations';

interface SqlServerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlServerModal: React.FC<SqlServerModalProps> = ({ isOpen, onClose }) => {
  const { classrooms } = useClassroom();

  const [activeTab, setActiveTab] = useState<'config' | 'sync' | 'query' | 'script'>('config');
  const [config, setConfig] = useState<SqlServerConfig>(getSqlServerConfig());
  const [status, setStatus] = useState<SqlServerStatus>({
    connected: false,
    status: 'disconnected',
    message: 'Chưa kiểm tra kết nối',
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Query console state
  const [queryInput, setQueryInput] = useState<string>(
    'SELECT Id, Code, Name, Building, Floor, TotalPowerW, CurrentA, TemperatureC, IsVacant FROM [dbo].[Classrooms];'
  );
  const [queryResult, setQueryResult] = useState<SqlQueryResult | null>(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);

  // Copy state
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getSqlServerConfig());
      // Run quick status check
      handleTestConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    saveSqlServerConfig(config);
    handleTestConnection();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await testSqlServerConnection(config);
      setStatus(res);
    } catch (err: unknown) {
      setStatus({
        connected: false,
        status: 'error',
        message: err instanceof Error ? err.message : 'Lỗi kết nối tới SQL Server',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncClassroomsToSqlServer(classrooms, config);
      if (res.success) {
        setSyncFeedback(res.message);
        setStatus((prev) => ({
          ...prev,
          connected: true,
          roomCount: res.syncedCount,
          lastSyncAt: new Date().toLocaleTimeString('vi-VN'),
        }));
      } else {
        setSyncFeedback(res.message || 'Lỗi khi đồng bộ dữ liệu vào SQL Server.');
      }
    } catch (err: unknown) {
      setSyncFeedback(err instanceof Error ? err.message : 'Lỗi đồng bộ dữ liệu.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRunQuery = async () => {
    if (!queryInput.trim()) return;
    setIsExecutingQuery(true);
    try {
      const res = await executeTSqlQuery(queryInput, config);
      setQueryResult(res);
    } catch (err: unknown) {
      setQueryResult({
        success: false,
        error: err instanceof Error ? err.message : 'Lỗi thực thi truy vấn.',
      });
    } finally {
      setIsExecutingQuery(false);
    }
  };

  const fullTSqlScript = `-- ============================================================================
-- SQL SERVER (T-SQL) DATABASE SCHEMA FOR SMARTCLASS ENERGY IOT SYSTEM
-- ============================================================================
USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'${config.database}')
BEGIN
    CREATE DATABASE [${config.database}] COLLATE Vietnamese_CI_AS;
    PRINT N'Đã tạo Database [${config.database}] thành công!';
END
GO

USE [${config.database}];
GO

-- 1. Bảng Phòng Học (Classrooms)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Classrooms]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Classrooms] (
        [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
        [Code] NVARCHAR(50) NOT NULL,
        [Name] NVARCHAR(150) NOT NULL,
        [Building] NVARCHAR(50) NOT NULL DEFAULT N'Khu A',
        [Floor] INT NOT NULL DEFAULT 1,
        [Capacity] INT NOT NULL DEFAULT 40,
        [TotalPowerW] DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        [CurrentA] DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
        [VoltageV] DECIMAL(8, 2) NOT NULL DEFAULT 24.00,
        [TemperatureC] DECIMAL(5, 1) NOT NULL DEFAULT 25.0,
        [HumidityPct] DECIMAL(5, 1) NOT NULL DEFAULT 60.0,
        [IsVacant] BIT NOT NULL DEFAULT 0,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 2. Bảng Đo Lường Điện Năng PZEM-004T (EnergyTelemetry)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EnergyTelemetry]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[EnergyTelemetry] (
        [Id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ClassroomId] NVARCHAR(50) NOT NULL,
        [VoltageV] DECIMAL(8, 2) NOT NULL DEFAULT 24.00,
        [CurrentA] DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
        [ActivePowerW] DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        [FrequencyHz] DECIMAL(6, 2) NOT NULL DEFAULT 50.00,
        [PowerFactor] DECIMAL(4, 2) NOT NULL DEFAULT 0.95,
        [EnergyTotalKWh] DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
        [RecordedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_EnergyTelemetry_Classrooms FOREIGN KEY ([ClassroomId]) 
            REFERENCES [dbo].[Classrooms]([Id]) ON DELETE CASCADE
    );
END
GO`;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-4xl text-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  Cổng Kết Nối Microsoft SQL Server (MSSQL)
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    status.connected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {status.connected ? '● Đã Kết Nối' : '○ Chưa Kết Nối'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Giao tiếp cơ sở dữ liệu quan hệ, đồng bộ phòng học & thông số cảm biến năng lượng
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-950 px-6 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-blue-400" />
              Máy chủ: <strong className="text-white font-mono">{config.server}:{config.port}</strong>
            </span>
            <span className="text-slate-400">
              Database: <strong className="text-cyan-300 font-mono">{config.database}</strong>
            </span>
            {status.serverVersion && (
              <span className="text-slate-500 text-[11px] hidden md:inline">
                ({status.serverVersion})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {status.latencyMs !== undefined && (
              <span className="text-[11px] font-mono text-slate-400">
                Ping: <strong className="text-emerald-400">{status.latencyMs}ms</strong>
              </span>
            )}
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`h-3 w-3 ${isTesting ? 'animate-spin text-blue-400' : ''}`} />
              <span>{isTesting ? 'Đang kiểm tra...' : 'Kiểm tra'}</span>
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="p-2 bg-slate-950/40 border-b border-slate-800 flex gap-2 px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'config'
                ? 'bg-slate-800 text-blue-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Cấu Hình Kết Nối</span>
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'sync'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Đồng Bộ Dữ Liệu</span>
          </button>
          <button
            onClick={() => setActiveTab('query')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'query'
                ? 'bg-slate-800 text-purple-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-purple-400" />
            <span>Truy Vấn T-SQL Trực Tiếp</span>
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'script'
                ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-amber-400" />
            <span>Kịch Bản CSDL (T-SQL Script)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status Message Alert */}
          {status.message && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                status.connected
                  ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-800/80 text-rose-200'
              }`}
            >
              {status.connected ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">
                  {status.connected ? 'Kết Nối Sẵn Sàng' : 'Thông Báo Trạng Thái Kết Nối:'}
                </span>
                <span className="leading-relaxed">{status.message}</span>
              </div>
            </div>
          )}

          {/* TAB 1: CẤU HÌNH KẾT NỐI (CONFIG) */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Server className="h-4 w-4 text-blue-400" />
                    Thông Số Kết Nối Microsoft SQL Server:
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">Cổng TDS mặc định: 1433</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Địa chỉ Máy chủ (Server / Host):
                    </label>
                    <input
                      type="text"
                      value={config.server}
                      onChange={(e) => setConfig({ ...config, server: e.target.value })}
                      placeholder="127.0.0.1 hoặc sql.campus.edu.vn"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Cổng kết nối (Port):
                    </label>
                    <input
                      type="number"
                      value={config.port}
                      onChange={(e) => setConfig({ ...config, port: Number(e.target.value) || 1433 })}
                      placeholder="1433"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Tên Database (Database Name):
                    </label>
                    <input
                      type="text"
                      value={config.database}
                      onChange={(e) => setConfig({ ...config, database: e.target.value })}
                      placeholder="SmartClassEnergyDB"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Tài khoản SQL Server (User):
                    </label>
                    <input
                      type="text"
                      value={config.user}
                      onChange={(e) => setConfig({ ...config, user: e.target.value })}
                      placeholder="sa"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Mật khẩu (Password):
                    </label>
                    <input
                      type="password"
                      value={config.password || ''}
                      onChange={(e) => setConfig({ ...config, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Thời gian chờ (Timeout giây):
                    </label>
                    <input
                      type="number"
                      value={config.connectionTimeout}
                      onChange={(e) => setConfig({ ...config, connectionTimeout: Number(e.target.value) || 15 })}
                      placeholder="15"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Advanced switches */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={config.trustServerCertificate}
                      onChange={(e) => setConfig({ ...config, trustServerCertificate: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0"
                    />
                    <span>Chấp nhận chứng chỉ tự ký (TrustServerCertificate = true)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={config.encrypt}
                      onChange={(e) => setConfig({ ...config, encrypt: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0"
                    />
                    <span>Bắt buộc mã hóa SSL (Encrypt = true - Dùng cho Azure SQL)</span>
                  </label>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Chế độ vận hành:</span>
                    <select
                      value={config.mode}
                      onChange={(e) => setConfig({ ...config, mode: e.target.value as 'real' | 'virtual' })}
                      className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none"
                    >
                      <option value="real">Kết nối Trực tiếp qua TCP/IP (Thực tế)</option>
                      <option value="virtual">Mô Phỏng SQL Server Sandbox (Kiểm thử offline)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Đang thử...' : 'Thử Kết Nối'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveConfig}
                      className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
                    >
                      Lưu Cấu Hình
                    </button>
                  </div>
                </div>
              </div>

              {/* Network Tip */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1.5">
                <span className="font-semibold text-slate-300 block">
                  💡 Hướng dẫn cấu hình kết nối SQL Server từ xa:
                </span>
                <p>1. <strong>Bật TCP/IP:</strong> Mở <em>SQL Server Configuration Manager</em> → Network Configuration → Protocols → chuyển <code>TCP/IP</code> sang <strong>Enabled</strong>.</p>
                <p>2. <strong>Mở cổng tường lửa:</strong> Cho phép cổng TCP <code>1433</code> trong Windows Firewall.</p>
                <p>3. <strong>Bật Mixed Mode Authentication:</strong> Cho phép đăng nhập bằng tài khoản <code>sa</code> (SQL Server and Windows Authentication mode).</p>
                <p>4. Nếu SQL Server nằm trên máy nội bộ (LAN), bạn có thể dùng địa chỉ IP LAN hoặc công cụ port forwarding như <code>ngrok tcp 1433</code>.</p>
              </div>
            </div>
          )}

          {/* TAB 2: ĐỒNG BỘ DỮ LIỆU (SYNC) */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sync Classrooms */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-emerald-400" />
                      Đồng Bộ Phòng Học & Trạng Thái Relay
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      [dbo].[Classrooms]
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Đẩy toàn bộ <strong>{classrooms.length} phòng học</strong>, thông số công suất, dòng điện và nhiệt độ vào bảng <code>Classrooms</code> trên SQL Server theo cơ chế MERGE (Upsert).
                  </p>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Số phòng đang giám sát:</span>
                      <strong className="text-white">{classrooms.length} phòng</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tổng phụ tải đang chạy:</span>
                      <strong className="text-emerald-400">
                        {formatWatts(classrooms.reduce((acc, r) => acc + (r.totalPowerW || 0), 0))}
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={handleSyncData}
                    disabled={isSyncing}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Phòng Học Sang SQL Server'}</span>
                  </button>
                </div>

                {/* Energy Telemetry */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-blue-400" />
                      Nhật Ký Cảm Biến PZEM-004T
                    </h4>
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                      [dbo].[EnergyTelemetry]
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Lưu trữ lịch sử điện áp U (V), dòng điện I (A), công suất P (W), tần số F (Hz) và hệ số Cos φ định kỳ vào cơ sở dữ liệu SQL Server để phục vụ báo cáo và phân tích năng lượng.
                  </p>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tần suất ghi nhận:</span>
                      <strong className="text-cyan-300">Thời gian thực (Real-time)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Chỉ số giám sát:</span>
                      <span className="text-slate-300">Voltage, Current, Power, Energy</span>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      setIsSyncing(true);
                      await handleSyncData();
                      setIsSyncing(false);
                    }}
                    disabled={isSyncing}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Ghi Nhận Mẫu Đo Lường Năng Lượng</span>
                  </button>
                </div>
              </div>

              {syncFeedback && (
                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-800/80 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{syncFeedback}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRUY VẤN T-SQL (QUERY RUNNER) */}
          {activeTab === 'query' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-purple-400" />
                    Trình Thực Thi Câu Lệnh T-SQL Trực Tiếp:
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setQueryInput('SELECT * FROM [dbo].[Classrooms] ORDER BY [Building], [Floor];')
                      }
                      className="px-2 py-0.5 text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
                    >
                      Xem Classrooms
                    </button>
                    <button
                      onClick={() =>
                        setQueryInput('SELECT TOP 10 * FROM [dbo].[EnergyTelemetry] ORDER BY [RecordedAt] DESC;')
                      }
                      className="px-2 py-0.5 text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
                    >
                      Xem Telemetry
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed"
                    placeholder="Nhập câu lệnh T-SQL (vd: SELECT * FROM [dbo].[Classrooms];)"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Hỗ trợ: SELECT, INSERT, UPDATE, MERGE, EXEC
                  </span>

                  <button
                    onClick={handleRunQuery}
                    disabled={isExecutingQuery}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                  >
                    <Play className={`h-3.5 w-3.5 ${isExecutingQuery ? 'animate-pulse' : ''}`} />
                    <span>{isExecutingQuery ? 'Đang thực thi...' : 'Chạy Lệnh (Execute)'}</span>
                  </button>
                </div>
              </div>

              {/* Query Result Table */}
              {queryResult && (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80">
                  <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-xs">
                    <span className="font-semibold text-slate-300">
                      Kết Quả Truy Vấn ({queryResult.rows?.length || 0} bản ghi)
                    </span>
                    {queryResult.executionTimeMs !== undefined && (
                      <span className="text-[11px] font-mono text-slate-400">
                        Thời gian: <strong className="text-cyan-300">{queryResult.executionTimeMs}ms</strong>
                      </span>
                    )}
                  </div>

                  {queryResult.error ? (
                    <div className="p-4 text-xs text-rose-300 bg-rose-950/40 font-mono">
                      {queryResult.error}
                    </div>
                  ) : queryResult.rows && queryResult.rows.length > 0 ? (
                    <div className="overflow-x-auto max-h-60">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                            {queryResult.columns?.map((col) => (
                              <th key={col} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                          {queryResult.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                              {queryResult.columns?.map((col) => (
                                <td key={col} className="py-2 px-3 whitespace-nowrap text-slate-200">
                                  {String(row[col] ?? 'NULL')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 text-xs text-slate-400 text-center">
                      Câu lệnh thực thi thành công. Không có bản ghi trả về.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: KỊCH BẢN CSDL T-SQL SCRIPT */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    T-SQL Script Khởi Tạo Bảng & Ràng Buộc Khóa Ngoại
                  </h4>
                  <p className="text-xs text-slate-400">
                    Chạy file <code>sqlserver-schema.sql</code> trong SQL Server Management Studio (SSMS) để tạo toàn bộ cấu trúc
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(fullTSqlScript);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 3000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  {copiedScript ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedScript ? 'Đã sao chép T-SQL!' : 'Sao Chép Script'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-72 leading-relaxed">
                  {fullTSqlScript}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            Tương thích SQL Server 2016 - 2022 / Express / Azure SQL
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
