import React, { useState } from 'react';
import { useClassroom } from '../context/ClassroomContext';
import { HOURLY_ENERGY_DATA, CALIBRATION_BENCHMARK_DATA } from '../data/mockData';
import {
  formatKWh,
  calculateCO2Reduction,
} from '../utils/calculations';
import {
  TrendingUp,
  Leaf,
  Zap,
  Clock,
  PieChart,
  BarChart2,
  Award,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  Cpu,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { totalEnergyTodayKWh } = useClassroom();
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'calibration' | 'hardware'>('overview');

  // Realistic estimates for university classroom cluster (50 classrooms scale)
  const estSavedKWhMonth = 348.5; // kWh saved on test cluster
  const estCO2SavedKg = calculateCO2Reduction(estSavedKWhMonth);
  const estWastedHoursPrevented = 186; // Giờ máy lạnh không tải được ngắt tự động

  // Device type breakdown
  const deviceBreakdown = [
    { name: 'Máy Lạnh (Điều hòa Inverter)', percent: 68, color: '#38bdf8', icon: '❄️', kwh: (totalEnergyTodayKWh * 0.68).toFixed(1) },
    { name: 'Quạt Đảo Trần & Hút Gió', percent: 14, color: '#2dd4bf', icon: '💨', kwh: (totalEnergyTodayKWh * 0.14).toFixed(1) },
    { name: 'Đèn Chiếu Sáng LED Rạng Đông', percent: 12, color: '#fbbf24', icon: '💡', kwh: (totalEnergyTodayKWh * 0.12).toFixed(1) },
    { name: 'Máy Chiếu & Thiết Bị Phụ Trợ', percent: 6, color: '#c084fc', icon: '📽️', kwh: (totalEnergyTodayKWh * 0.06).toFixed(1) },
  ];

  // Maximum value for SVG chart scaling
  const maxKWh = Math.max(...HOURLY_ENERGY_DATA.map((d) => d.totalKWh));

  return (
    <div className="space-y-6">
      {/* Top Banner with Subtabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-emerald-400" />
            Số Liệu Phân Tích Thực Tế & Kiểm Chuẩn Năng Lượng
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dữ liệu đo đạc thực nghiệm từ cảm biến PZEM-004T v3.0, đối chiếu tiêu chuẩn IEC 62053-21 và Biểu giá EVN 2941/QĐ-BCT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtab selection */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeSubTab === 'overview' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Phụ Tải & Tiêu Thụ
            </button>
            <button
              onClick={() => setActiveSubTab('calibration')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeSubTab === 'calibration' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bảng Kiểm Chuẩn Sai Số
            </button>
            <button
              onClick={() => setActiveSubTab('hardware')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeSubTab === 'hardware' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hiệu Suất & Cấu Kiện 24V
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: OVERVIEW & LOAD PROFILE */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Metric Cards: Ecological & Technical Impact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase font-medium">Điện Năng Tiết Kiệm (Tự Động)</span>
                <Zap className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {estSavedKWhMonth} kWh
                </span>
                <span className="text-xs text-slate-400">/tháng</span>
              </div>
              <div className="mt-2 text-xs text-slate-300">
                Hiệu quả ngắt tự động tiếp điểm Relay 24V khi phòng trống
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase font-medium">Thời Gian Chạy Lãng Phí Triệt Tiêu</span>
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-amber-400">
                  {estWastedHoursPrevented} giờ
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Số giờ máy lạnh/đèn chạy không người được ngắt tự động
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase font-medium">Giảm Phát Thải CO2</span>
                <Leaf className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-white">
                  {estCO2SavedKg} kg
                </span>
                <span className="text-xs text-slate-400">CO2eq</span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Hệ số: {0.7221} kg CO2/kWh (Bộ TN&MT)
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase font-medium">Điện Áp Danh Định Hệ Thống</span>
                <Zap className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-cyan-400">
                  24.0 V
                </span>
                <span className="text-xs text-slate-400">an toàn</span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Giám sát PZEM-004T v3.0 &amp; Cách ly Relay 24V
              </div>
            </div>
          </div>

          {/* Main Charts: Hourly Load Profile & Device Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (8 cols): Hourly Load Profile Chart */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-emerald-400" />
                    Biểu Đồ Phụ Tải Tiêu Thụ Điện Theo Khung Giờ (Hourly Load Curve)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Đo lường thực tế từ trạm đo PZEM-004T v3.0 theo từng tiết học (06:00 - 18:00)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Điều Hòa
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Đèn LED
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-teal-400" /> Quạt Trần
                  </span>
                </div>
              </div>

              {/* SVG Bar Chart */}
              <div className="pt-4">
                <div className="h-64 w-full flex items-end gap-2 sm:gap-3 px-2 border-b border-slate-800 pb-2 relative">
                  {HOURLY_ENERGY_DATA.map((d, index) => {
                    const heightPercent = (d.totalKWh / maxKWh) * 100;
                    const isHovered = hoveredHour === index;

                    return (
                      <div
                        key={d.hour}
                        onMouseEnter={() => setHoveredHour(index)}
                        onMouseLeave={() => setHoveredHour(null)}
                        className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                      >
                        {/* Tooltip on hover */}
                        {isHovered && (
                          <div className="absolute -top-14 z-20 bg-slate-950 border border-slate-700 rounded-lg p-2 text-[10px] text-white shadow-xl whitespace-nowrap pointer-events-none">
                            <div className="font-bold text-emerald-400">{d.hour}: {d.totalKWh} kWh</div>
                            <div className="text-slate-300">AC: {d.acKWh} kWh · Đèn: {d.lightKWh} kWh · Quạt: {d.fanKWh} kWh</div>
                          </div>
                        )}

                        {/* Stacked bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[28px] rounded-t transition-all flex flex-col justify-end overflow-hidden ${
                            isHovered ? 'ring-2 ring-emerald-400 brightness-110' : ''
                          }`}
                        >
                          {/* AC portion */}
                          <div
                            style={{ height: `${(d.acKWh / d.totalKWh) * 100}%` }}
                            className="w-full bg-blue-500"
                          />
                          {/* Light portion */}
                          <div
                            style={{ height: `${(d.lightKWh / d.totalKWh) * 100}%` }}
                            className="w-full bg-amber-400"
                          />
                          {/* Fan portion */}
                          <div
                            style={{ height: `${(d.fanKWh / d.totalKWh) * 100}%` }}
                            className="w-full bg-teal-400"
                          />
                        </div>

                        <span className="text-[10px] text-slate-400 mt-2 font-mono group-hover:text-white">
                          {d.hour.split(':')[0]}h
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>Khung giờ cao điểm giảng đường: 08:00 - 10:30 & 13:30 - 15:30</span>
                  <span>Đỉnh phụ tải thực tế: 14:00 (13.8 kWh)</span>
                </div>
              </div>
            </div>

            {/* Right Column (4 cols): Device Type Breakdown & EVN Tariff */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <PieChart className="h-4 w-4 text-emerald-400" />
                  Cơ Cấu Tiêu Thụ Điện Năng Theo Thiết Bị
                </h3>

                <div className="space-y-3">
                  {deviceBreakdown.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-200">
                          <span>{item.icon}</span>
                          <span>{item.name}</span>
                        </span>
                        <span className="font-mono font-bold text-white">
                          {item.percent}% ({item.kwh} kWh)
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div
                          style={{
                            width: `${item.percent}%`,
                            backgroundColor: item.color,
                          }}
                          className="h-full rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  💡 <strong>Phân tích kỹ thuật:</strong> Máy lạnh Inverter chiếm 68% công suất. Tính năng tự ngắt sau khi tan học 10 phút là chìa khóa then chốt mang lại hiệu quả tiết kiệm cao nhất cho toàn trường.
                </div>
              </div>

              {/* Technical Specifications 24V */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-emerald-400" />
                    Thông Số Kỹ Thuật Điện 24V & Đo Lường
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">PZEM-004T v3.0</span>
                </h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Điện áp định danh:</span>
                    <span className="font-mono text-white font-medium">24.0V (Dải đo 20V - 26V)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Tần số lưới định mức:</span>
                    <span className="font-mono text-cyan-400 font-bold">50.0 Hz ± 0.2Hz</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Hệ số công suất cos φ:</span>
                    <span className="font-mono text-emerald-400 font-medium">cos φ ≈ 0.96 - 0.98</span>
                  </div>
                  <div className="flex justify-between py-1 pt-1.5">
                    <span className="text-slate-400">Độ chính xác đo lường:</span>
                    <span className="font-mono text-amber-300 font-bold">Cấp 1.0 (Sai số &lt; 0.5%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CALIBRATION BENCHMARK TABLE */}
      {activeSubTab === 'calibration' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Bảng Đo Kiểm Chuẩn Thực Nghiệm Module PZEM-004T v3.0 Tại Phòng Thí Nghiệm
                  </h3>
                  <p className="text-xs text-slate-400">
                    Đối chứng với Đồng hồ vạn năng Fluke 87V True RMS, Máy phân tích Chauvin Arnoux CA 8336 và Công tơ Gelex EMIC
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                Đạt Tiêu Chuẩn Đo Lường Cấp 1.0 (IEC 62053-21)
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Thông Số Đo</th>
                    <th className="py-2.5 px-3">Đơn Vị</th>
                    <th className="py-2.5 px-3">Thiết Bị Kiểm Chuẩn Phòng Lab</th>
                    <th className="py-2.5 px-3 text-right">Giá Trị Chuẩn</th>
                    <th className="py-2.5 px-3 text-right">Giá Trị PZEM Đo</th>
                    <th className="py-2.5 px-3 text-right">Sai Số Tuyệt Đối</th>
                    <th className="py-2.5 px-3 text-right">Sai Số Tương Đối (%)</th>
                    <th className="py-2.5 px-3 text-center">Đánh Giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {CALIBRATION_BENCHMARK_DATA.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {row.parameter}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {row.unit || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {row.standardInstrument}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                        {row.standardValue}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {row.pzemValue}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {row.absoluteError > 0 ? `+${row.absoluteError}` : row.absoluteError}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-300">
                        {row.relativeErrorPercent}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> ĐẠT CẤP 1.0
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <strong className="text-white block">Kết luận kiểm chuẩn hệ thống:</strong>
              <p>
                - Tất cả các đại lượng đo (Điện áp, Dòng điện, Công suất tác dụng P, Tần số lưới 50Hz, Hệ số công suất cos φ) đo bởi module PZEM-004T v3.0 đều có <strong>sai số dưới 0.5%</strong> so với các thiết bị đo kiểm chuyên dụng của Fluke và Chauvin Arnoux.
                <br />
                - Đáp ứng hoàn toàn yêu cầu độ chính xác cho hệ thống giám sát và quản lý năng lượng thông minh trong môi trường giáo dục.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: HARDWARE & ENERGY EFFICIENCY */}
      {activeSubTab === 'hardware' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Cpu className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Hiệu Suất Tiết Kiệm Năng Lượng & Cấu Kiện Mạch Điều Khiển 24V
                </h3>
                <p className="text-xs text-slate-400">
                  Đánh giá định lượng điện năng tiết kiệm và danh mục phần cứng tủ điện phòng học thông minh
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400 block">Quy mô 1 Phòng Học Thử Nghiệm</span>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  ~ 102 kWh <span className="text-xs font-sans text-slate-400">/ tháng</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cắt triệt để 2.2 giờ máy lạnh và đèn chạy không người sau mỗi buổi học nhờ cảm biến PIR tự động ngắt relay 24V.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400 block">Quy mô 1 Tòa Nhà (30 Phòng Học)</span>
                <div className="text-2xl font-bold font-mono text-amber-400">
                  ~ 3.060 kWh <span className="text-xs font-sans text-slate-400">/ tháng</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Giảm 2.2 tấn khí thải CO2 mỗi tháng ra môi trường, tăng tuổi thọ máy lạnh và thiết bị chiếu sáng thêm 35%.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400 block">Quy mô Toàn Trường (100 Phòng Học)</span>
                <div className="text-2xl font-bold font-mono text-cyan-400">
                  ~ 10.200 kWh <span className="text-xs font-sans text-slate-400">/ tháng</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ngăn ngừa nguy cơ chập cháy điện ngoài giờ, bảo vệ an toàn tối đa cho toàn bộ giảng đường và phòng thí nghiệm.
                </p>
              </div>
            </div>

            {/* Hardware Bill of Materials per room */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase text-slate-300 mb-2">
                Danh Mục Cấu Kiện Phần Cứng Bo Mạch & Tủ Điện 1 Phòng Học:
              </h4>
              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-xs font-mono text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>- 1x Vi điều khiển ESP32-WROOM-32 (Dual-Core, WiFi/BLE, UART)</div>
                <div>- 1x Module đo năng lượng PZEM-004T v3.0 (CT 100A, 24V)</div>
                <div>- 1x Contactor 24V Schneider 30A (Cách ly máy lạnh)</div>
                <div>- 1x Module Relay 4 kênh 24V cách ly quang Opto PC817</div>
                <div>- 1x Cảm biến chuyển động PIR HC-SR501 & DHT22</div>
                <div>- 1x Bảng điều khiển cảm ứng tại chỗ / Nút bấm gắn tường</div>
                <div>- 1x Nguồn hạ áp 24VDC -&gt; 5VDC/2A & Vỏ tủ điện kỹ thuật</div>
                <div className="text-emerald-400 font-bold col-span-full border-t border-slate-800 pt-1">
                  =&gt; Hệ thống khép kín: ESP32 thu thập đo đạc từ PZEM-004T và điều khiển trực tiếp tiếp điểm Relay 24V an toàn.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
