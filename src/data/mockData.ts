import { Classroom, AutomationRule, StudentTask, HourlyEnergyPoint, CalibrationPoint } from '../types';

export const INITIAL_CLASSROOMS: Classroom[] = [
  {
    id: 'cr-a101',
    code: 'A.101',
    name: 'Phòng học Thông minh A.101',
    building: 'Khu A',
    floor: 1,
    capacity: 50,
    roomAreaM2: 68,
    temperature: 24.5,
    humidity: 58,
    hasMotion: 42,
    isVacant: false,
    vacantDurationMinutes: 0,
    voltageV: 24.1,
    currentA: 8.85,
    totalPowerW: 1880,
    apparentPowerVA: 1959,
    reactivePowerVAR: 548,
    frequencyHz: 50.0,
    powerFactor: 0.96,
    energyTodayKWh: 9.35,
    warningForgotten: false,
    autoShutdownRemainingSec: null,
    lastUpdated: 'Vừa cập nhật',
    devices: [
      {
        id: 'dev-a101-light1',
        name: 'Đèn LED Dãy 1 (Bảng & Bàn Giảng viên)',
        brandModel: 'Máng LED Âm Trần Rạng Đông BD M16L T8 1.2m (2x18W)',
        type: 'light',
        isOn: true,
        powerRatingW: 76,
        currentPowerW: 76,
        nominalCurrentA: 0.36,
        relayPin: 'GPIO 16 (Relay 1 - Songle 10A)',
        relayState: 'CLOSED',
      },
      {
        id: 'dev-a101-light2',
        name: 'Đèn LED Dãy 2 & 3 (Khu vực Sinh viên)',
        brandModel: 'Máng LED Âm Trần Rạng Đông BD M16L T8 1.2m (4x18W)',
        type: 'light',
        isOn: true,
        powerRatingW: 152,
        currentPowerW: 152,
        nominalCurrentA: 0.72,
        relayPin: 'GPIO 17 (Relay 2 - Songle 10A)',
        relayState: 'CLOSED',
      },
      {
        id: 'dev-a101-fan1',
        name: 'Quạt Đảo Trần 1 (Phía Trước)',
        brandModel: 'Quạt Đảo Trần Vinawind QĐ-400X PN (Động cơ dây đồng 55W)',
        type: 'fan',
        isOn: true,
        powerRatingW: 55,
        currentPowerW: 46, // Số 2 ăn 46W
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 18 (Relay 3 - Songle 10A)',
        relayState: 'CLOSED',
        fanSpeed: 2,
      },
      {
        id: 'dev-a101-fan2',
        name: 'Quạt Đảo Trần 2 (Phía Sau)',
        brandModel: 'Quạt Đảo Trần Vinawind QĐ-400X PN (55W)',
        type: 'fan',
        isOn: true,
        powerRatingW: 55,
        currentPowerW: 46,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 19 (Relay 4 - Songle 10A)',
        relayState: 'CLOSED',
        fanSpeed: 2,
      },
      {
        id: 'dev-a101-ac1',
        name: 'Máy lạnh 1 (Daikin Inverter 2.5 HP)',
        brandModel: 'Daikin FTKC60UVMV Inverter R32 (21.500 BTU - Max 2050W)',
        type: 'ac',
        isOn: true,
        powerRatingW: 2050,
        currentPowerW: 1280, // Khi phòng ổn định 24°C, biến tần hạ công suất về 1280W
        nominalCurrentA: 9.3,
        relayPin: 'GPIO 21 (Relay 5 -> Khởi động từ Contactor 30A Schneider)',
        relayState: 'CLOSED',
        acSettings: {
          targetTemp: 24,
          mode: 'cool',
          fanSpeed: 'med',
        },
      },
      {
        id: 'dev-a101-ac2',
        name: 'Máy lạnh 2 (Daikin Inverter 2.5 HP)',
        brandModel: 'Daikin FTKC60UVMV Inverter R32 (21.500 BTU - Max 2050W)',
        type: 'ac',
        isOn: false,
        powerRatingW: 2050,
        currentPowerW: 0,
        nominalCurrentA: 9.3,
        relayPin: 'GPIO 22 (Relay 6 -> Khởi động từ Contactor 30A Schneider)',
        relayState: 'OPEN',
        acSettings: {
          targetTemp: 26,
          mode: 'eco',
          fanSpeed: 'auto',
        },
      },
      {
        id: 'dev-a101-proj',
        name: 'Máy chiếu Epson Laser & Âm thanh',
        brandModel: 'Epson EB-E01 3300 Ansi Lumens (280W) & Amply trợ giảng 40W',
        type: 'projector',
        isOn: true,
        powerRatingW: 320,
        currentPowerW: 320,
        nominalCurrentA: 1.45,
        relayPin: 'GPIO 23 (Relay 7 - Songle 10A)',
        relayState: 'CLOSED',
      },
      {
        id: 'dev-a101-wfan1',
        name: 'Quạt Treo Tường 1 (Vách Trái - Phía Trước)',
        brandModel: 'Quạt Treo Tường Vinawind QTT-400X (55W)',
        type: 'fan',
        isOn: true,
        powerRatingW: 55,
        currentPowerW: 45,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 25 (Relay 24V)',
        relayState: 'CLOSED',
        fanSpeed: 2,
      },
      {
        id: 'dev-a101-wfan2',
        name: 'Quạt Treo Tường 2 (Vách Phải - Phía Trước)',
        brandModel: 'Quạt Treo Tường Vinawind QTT-400X (55W)',
        type: 'fan',
        isOn: true,
        powerRatingW: 55,
        currentPowerW: 45,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 26 (Relay 24V)',
        relayState: 'CLOSED',
        fanSpeed: 2,
      },
      {
        id: 'dev-a101-wfan3',
        name: 'Quạt Treo Tường 3 (Vách Trái - Phía Sau)',
        brandModel: 'Quạt Treo Tường Vinawind QTT-400X (55W)',
        type: 'fan',
        isOn: false,
        powerRatingW: 55,
        currentPowerW: 0,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 27 (Relay 24V)',
        relayState: 'OPEN',
        fanSpeed: 1,
      },
      {
        id: 'dev-a101-wfan4',
        name: 'Quạt Treo Tường 4 (Vách Phải - Phía Sau)',
        brandModel: 'Quạt Treo Tường Vinawind QTT-400X (55W)',
        type: 'fan',
        isOn: false,
        powerRatingW: 55,
        currentPowerW: 0,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 32 (Relay 24V)',
        relayState: 'OPEN',
        fanSpeed: 1,
      },
    ],
    timetable: [
      {
        id: 'tt-1',
        period: 'Tiết 1 - 3 (07:00 - 09:15)',
        startTime: '07:00',
        endTime: '09:15',
        subject: 'Lập trình Thiết bị IoT & Nhúng',
        lecturer: 'TS. Nguyễn Văn Tuấn',
        classGroup: '21DTV01 (45 SV)',
        isActiveNow: true,
      },
      {
        id: 'tt-2',
        period: 'Tiết 4 - 5 (09:30 - 11:30)',
        startTime: '09:30',
        endTime: '11:30',
        subject: 'Mạng Cảm biến Không dây (WSN)',
        lecturer: 'ThS. Trần Thị Mai',
        classGroup: '21DTV02 (40 SV)',
        isActiveNow: false,
      },
      {
        id: 'tt-3',
        period: 'Tiết 6 - 8 (12:30 - 15:00)',
        startTime: '12:30',
        endTime: '15:00',
        subject: 'Thiết kế Vi mạch số',
        lecturer: 'PGS.TS. Lê Hoàng Nam',
        classGroup: '20DTV01 (48 SV)',
        isActiveNow: false,
      },
    ],
  },
  {
    id: 'cr-a102',
    code: 'A.102',
    name: 'Phòng học Lý thuyết A.102',
    building: 'Khu A',
    floor: 1,
    capacity: 60,
    roomAreaM2: 75,
    temperature: 21.8, // Máy lạnh bị bỏ quên ở 20°C rất lạnh
    humidity: 48,
    hasMotion: 0, // Cảm biến PIR báo 0 chuyển động
    isVacant: true,
    vacantDurationMinutes: 22, // Đã hết giờ học 22 phút
    voltageV: 24.0,
    currentA: 9.25,
    totalPowerW: 1980,
    apparentPowerVA: 2053,
    reactivePowerVAR: 542,
    frequencyHz: 50.0,
    powerFactor: 0.965,
    energyTodayKWh: 12.4,
    warningForgotten: true, // CẢNH BÁO: BỎ QUÊN THIẾT BỊ SAU GIỜ HỌC
    autoShutdownRemainingSec: 54, // Đang đếm ngược 54 giây trước khi tự động ngắt relay 24V
    lastUpdated: '1 giây trước',
    devices: [
      {
        id: 'dev-a102-light1',
        name: 'Đèn LED Dãy 1 (Bảng)',
        brandModel: 'Máng LED Âm Trần Rạng Đông T8 1.2m (2x18W)',
        type: 'light',
        isOn: true,
        powerRatingW: 76,
        currentPowerW: 76,
        nominalCurrentA: 0.36,
        relayPin: 'GPIO 16 (Relay 1)',
        relayState: 'CLOSED',
      },
      {
        id: 'dev-a102-light2',
        name: 'Đèn LED Dãy 2 & 3',
        brandModel: 'Máng LED Âm Trần Rạng Đông T8 1.2m (4x18W)',
        type: 'light',
        isOn: true,
        powerRatingW: 152,
        currentPowerW: 152,
        nominalCurrentA: 0.72,
        relayPin: 'GPIO 17 (Relay 2)',
        relayState: 'CLOSED',
      },
      {
        id: 'dev-a102-fan1',
        name: 'Quạt Trần 1',
        brandModel: 'Quạt Đảo Trần Vinawind QĐ-400X (55W)',
        type: 'fan',
        isOn: false,
        powerRatingW: 55,
        currentPowerW: 0,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 18 (Relay 3)',
        relayState: 'OPEN',
        fanSpeed: 1,
      },
      {
        id: 'dev-a102-fan2',
        name: 'Quạt Trần 2',
        brandModel: 'Quạt Đảo Trần Vinawind QĐ-400X (55W)',
        type: 'fan',
        isOn: false,
        powerRatingW: 55,
        currentPowerW: 0,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 19 (Relay 4)',
        relayState: 'OPEN',
        fanSpeed: 1,
      },
      {
        id: 'dev-a102-ac1',
        name: 'Máy lạnh 1 (Panasonic Inverter 2.5 HP)',
        brandModel: 'Panasonic CU/CS-XPU18XKH-8 Inverter (18.100 BTU - Max 1850W)',
        type: 'ac',
        isOn: true,
        powerRatingW: 1850,
        currentPowerW: 1746, // Chạy ép tải do sinh viên chỉnh 20°C lúc học
        nominalCurrentA: 8.4,
        relayPin: 'GPIO 21 (Contactor 30A)',
        relayState: 'CLOSED',
        acSettings: {
          targetTemp: 20,
          mode: 'cool',
          fanSpeed: 'high',
        },
      },
      {
        id: 'dev-a102-ac2',
        name: 'Máy lạnh 2',
        brandModel: 'Panasonic CU/CS-XPU18XKH-8 Inverter (1850W)',
        type: 'ac',
        isOn: false,
        powerRatingW: 1850,
        currentPowerW: 0,
        nominalCurrentA: 8.4,
        relayPin: 'GPIO 22 (Contactor 30A)',
        relayState: 'OPEN',
        acSettings: {
          targetTemp: 25,
          mode: 'eco',
          fanSpeed: 'med',
        },
      },
      {
        id: 'dev-a102-proj',
        name: 'Máy chiếu Treo Trần',
        brandModel: 'Panasonic PT-LB385 (300W)',
        type: 'projector',
        isOn: false,
        powerRatingW: 300,
        currentPowerW: 0,
        nominalCurrentA: 1.36,
        relayPin: 'GPIO 23 (Relay 7)',
        relayState: 'OPEN',
      },
      {
        id: 'dev-a102-wfan1',
        name: 'Quạt Treo Tường 1 (Vách Trái - Phía Trước)',
        brandModel: 'Quạt Treo Tường Vinawind QTT-400X (55W)',
        type: 'fan',
        isOn: true,
        powerRatingW: 55,
        currentPowerW: 45,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 25 (Relay 24V)',
        relayState: 'CLOSED',
        fanSpeed: 2,
      },
      {
        id: 'dev-a102-wfan2',
        name: 'Quạt Treo Tường 2 (Vách Phải - Phía Trước)',
        brandModel: 'Quạt Treo Tường Vinawind QTT-400X (55W)',
        type: 'fan',
        isOn: true,
        powerRatingW: 55,
        currentPowerW: 45,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 26 (Relay 24V)',
        relayState: 'CLOSED',
        fanSpeed: 2,
      },
      {
        id: 'dev-a102-wfan3',
        name: 'Quạt Treo Tường 3 (Vách Trái - Phía Sau)',
        brandModel: 'Quạt Treo Tường Vinawind QTT-400X (55W)',
        type: 'fan',
        isOn: false,
        powerRatingW: 55,
        currentPowerW: 0,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 27 (Relay 24V)',
        relayState: 'OPEN',
        fanSpeed: 1,
      },
      {
        id: 'dev-a102-wfan4',
        name: 'Quạt Treo Tường 4 (Vách Phải - Phía Sau)',
        brandModel: 'Quạt Treo Tường Vinawind QTT-400X (55W)',
        type: 'fan',
        isOn: false,
        powerRatingW: 55,
        currentPowerW: 0,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 32 (Relay 24V)',
        relayState: 'OPEN',
        fanSpeed: 1,
      },
    ],
    timetable: [
      {
        id: 'tt-4',
        period: 'Tiết 1 - 2 (07:00 - 08:35)',
        startTime: '07:00',
        endTime: '08:35',
        subject: 'Triết học Mác - Lênin',
        lecturer: 'ThS. Hoàng Đình Trọng',
        classGroup: '22CNTT01 (55 SV)',
        isActiveNow: false, // ĐÃ HẾT GIỜ HỌC LÚC 08:35!
      },
      {
        id: 'tt-5',
        period: 'Tiết 6 - 8 (12:30 - 15:00)',
        startTime: '12:30',
        endTime: '15:00',
        subject: 'Cơ sở Dữ liệu',
        lecturer: 'TS. Phạm Thanh Tùng',
        classGroup: '22CNTT03 (50 SV)',
        isActiveNow: false,
      },
    ],
  },
  {
    id: 'cr-b204',
    code: 'B.204',
    name: 'Phòng Lab Vi điều khiển B.204',
    building: 'Khu B',
    floor: 2,
    capacity: 45,
    roomAreaM2: 60,
    temperature: 23.6,
    humidity: 54,
    hasMotion: 38,
    isVacant: false,
    vacantDurationMinutes: 0,
    voltageV: 23.9,
    currentA: 14.85,
    totalPowerW: 3180, // 2 máy lạnh chạy cùng dàn máy tính thực hành
    apparentPowerVA: 3279,
    reactivePowerVAR: 801,
    frequencyHz: 50.0,
    powerFactor: 0.97,
    energyTodayKWh: 15.6,
    warningForgotten: false,
    autoShutdownRemainingSec: null,
    lastUpdated: 'Vừa cập nhật',
    devices: [
      {
        id: 'dev-b204-light1',
        name: 'Hệ thống Đèn LED Lab 1',
        brandModel: 'Máng LED Rạng Đông M16 2x18W x 3 cụm',
        type: 'light',
        isOn: true,
        powerRatingW: 114,
        currentPowerW: 114,
        nominalCurrentA: 0.52,
        relayPin: 'GPIO 16',
        relayState: 'CLOSED',
      },
      {
        id: 'dev-b204-light2',
        name: 'Hệ thống Đèn LED Lab 2',
        brandModel: 'Máng LED Rạng Đông M16 2x18W x 3 cụm',
        type: 'light',
        isOn: true,
        powerRatingW: 114,
        currentPowerW: 114,
        nominalCurrentA: 0.52,
        relayPin: 'GPIO 17',
        relayState: 'CLOSED',
      },
      {
        id: 'dev-b204-fan1',
        name: 'Quạt Thông Gió Công Nghiệp',
        brandModel: 'Quạt Hút Gió Âm Trần Panasonic FV-24CD8 (28W x 2)',
        type: 'fan',
        isOn: true,
        powerRatingW: 56,
        currentPowerW: 56,
        nominalCurrentA: 0.26,
        relayPin: 'GPIO 18',
        relayState: 'CLOSED',
        fanSpeed: 3,
      },
      {
        id: 'dev-b204-ac1',
        name: 'Máy lạnh A (Mitsubishi Heavy 2.5 HP)',
        brandModel: 'Mitsubishi Heavy SRK/SRC18YXP-W5 Inverter (Max 1900W)',
        type: 'ac',
        isOn: true,
        powerRatingW: 1900,
        currentPowerW: 1450,
        nominalCurrentA: 8.6,
        relayPin: 'GPIO 21 (Contactor)',
        relayState: 'CLOSED',
        acSettings: {
          targetTemp: 24,
          mode: 'cool',
          fanSpeed: 'med',
        },
      },
      {
        id: 'dev-b204-ac2',
        name: 'Máy lạnh B (Mitsubishi Heavy 2.5 HP)',
        brandModel: 'Mitsubishi Heavy SRK/SRC18YXP-W5 Inverter (Max 1900W)',
        type: 'ac',
        isOn: true,
        powerRatingW: 1900,
        currentPowerW: 1440,
        nominalCurrentA: 8.6,
        relayPin: 'GPIO 22 (Contactor)',
        relayState: 'CLOSED',
        acSettings: {
          targetTemp: 24,
          mode: 'cool',
          fanSpeed: 'med',
        },
      },
      {
        id: 'dev-b204-wfan1',
        name: 'Quạt Treo Tường 1 (Vách Trái - Phía Trước)',
        brandModel: 'Quạt Treo Tường Vinawind QTT-400X (55W)',
        type: 'fan',
        isOn: true,
        powerRatingW: 55,
        currentPowerW: 45,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 25 (Relay 24V)',
        relayState: 'CLOSED',
        fanSpeed: 2,
      },
      {
        id: 'dev-b204-wfan2',
        name: 'Quạt Treo Tường 2 (Vách Phải - Phía Trước)',
        brandModel: 'Quạt Treo Tường Vinawind QTT-400X (55W)',
        type: 'fan',
        isOn: true,
        powerRatingW: 55,
        currentPowerW: 45,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 26 (Relay 24V)',
        relayState: 'CLOSED',
        fanSpeed: 2,
      },
      {
        id: 'dev-b204-wfan3',
        name: 'Quạt Treo Tường 3 (Vách Trái - Phía Sau)',
        brandModel: 'Quạt Treo Tường Vinawind QTT-400X (55W)',
        type: 'fan',
        isOn: false,
        powerRatingW: 55,
        currentPowerW: 0,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 27 (Relay 24V)',
        relayState: 'OPEN',
        fanSpeed: 1,
      },
      {
        id: 'dev-b204-wfan4',
        name: 'Quạt Treo Tường 4 (Vách Phải - Phía Sau)',
        brandModel: 'Quạt Treo Tường Vinawind QTT-400X (55W)',
        type: 'fan',
        isOn: false,
        powerRatingW: 55,
        currentPowerW: 0,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 32 (Relay 24V)',
        relayState: 'OPEN',
        fanSpeed: 1,
      },
    ],
    timetable: [
      {
        id: 'tt-6',
        period: 'Tiết 1 - 4 (07:00 - 10:30)',
        startTime: '07:00',
        endTime: '10:30',
        subject: 'Thực hành Vi điều khiển ARM Cortex',
        lecturer: 'ThS. Đỗ Minh Quân',
        classGroup: '21DTV03 (36 SV)',
        isActiveNow: true,
      },
    ],
  },
  {
    id: 'cr-c305',
    code: 'C.305',
    name: 'Phòng học Đa phương tiện C.305',
    building: 'Khu C',
    floor: 3,
    capacity: 70,
    roomAreaM2: 80,
    temperature: 28.2,
    humidity: 65,
    hasMotion: 0,
    isVacant: true,
    vacantDurationMinutes: 110,
    voltageV: 24.2,
    currentA: 0.03,
    totalPowerW: 6.5, // Nguồn chờ Standby vi xử lý ESP32 và cảm biến
    apparentPowerVA: 6.6,
    reactivePowerVAR: 1.2,
    frequencyHz: 50.0,
    powerFactor: 0.98,
    energyTodayKWh: 3.2,
    warningForgotten: false,
    autoShutdownRemainingSec: null,
    lastUpdated: '5 giây trước',
    devices: [
      {
        id: 'dev-c305-light1',
        name: 'Đèn LED Dãy 1',
        brandModel: 'Máng LED Rạng Đông T8 1.2m',
        type: 'light',
        isOn: false,
        powerRatingW: 76,
        currentPowerW: 0,
        nominalCurrentA: 0.36,
        relayPin: 'GPIO 16',
        relayState: 'OPEN',
      },
      {
        id: 'dev-c305-light2',
        name: 'Đèn LED Dãy 2',
        brandModel: 'Máng LED Rạng Đông T8 1.2m',
        type: 'light',
        isOn: false,
        powerRatingW: 152,
        currentPowerW: 0,
        nominalCurrentA: 0.72,
        relayPin: 'GPIO 17',
        relayState: 'OPEN',
      },
      {
        id: 'dev-c305-ac1',
        name: 'Máy lạnh Daikin Inverter 3.0 HP',
        brandModel: 'Daikin FTKF71UVMV Inverter R32 (Max 2400W)',
        type: 'ac',
        isOn: false,
        powerRatingW: 2400,
        currentPowerW: 0,
        nominalCurrentA: 10.9,
        relayPin: 'GPIO 21 (Contactor)',
        relayState: 'OPEN',
        acSettings: {
          targetTemp: 25,
          mode: 'eco',
          fanSpeed: 'auto',
        },
      },
      {
        id: 'dev-c305-wfan1',
        name: 'Quạt Treo Tường 1 (Vách Trái - Phía Trước)',
        brandModel: 'Quạt Treo Tường Vinawind QTT-400X (55W)',
        type: 'fan',
        isOn: false,
        powerRatingW: 55,
        currentPowerW: 0,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 25 (Relay 24V)',
        relayState: 'OPEN',
        fanSpeed: 1,
      },
      {
        id: 'dev-c305-wfan2',
        name: 'Quạt Treo Tường 2 (Vách Phải - Phía Trước)',
        brandModel: 'Quạt Treo Tường Vinawind QTT-400X (55W)',
        type: 'fan',
        isOn: false,
        powerRatingW: 55,
        currentPowerW: 0,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 26 (Relay 24V)',
        relayState: 'OPEN',
        fanSpeed: 1,
      },
      {
        id: 'dev-c305-wfan3',
        name: 'Quạt Treo Tường 3 (Vách Trái - Phía Sau)',
        brandModel: 'Quạt Treo Tường Vinawind QTT-400X (55W)',
        type: 'fan',
        isOn: false,
        powerRatingW: 55,
        currentPowerW: 0,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 27 (Relay 24V)',
        relayState: 'OPEN',
        fanSpeed: 1,
      },
      {
        id: 'dev-c305-wfan4',
        name: 'Quạt Treo Tường 4 (Vách Phải - Phía Sau)',
        brandModel: 'Quạt Treo Tường Vinawind QTT-400X (55W)',
        type: 'fan',
        isOn: false,
        powerRatingW: 55,
        currentPowerW: 0,
        nominalCurrentA: 0.25,
        relayPin: 'GPIO 32 (Relay 24V)',
        relayState: 'OPEN',
        fanSpeed: 1,
      },
    ],
    timetable: [
      {
        id: 'tt-7',
        period: 'Tiết 6 - 8 (12:30 - 15:00)',
        startTime: '12:30',
        endTime: '15:00',
        subject: 'Xử lý Tín hiệu Số (DSP)',
        lecturer: 'PGS.TS. Vũ Đình Khang',
        classGroup: '20DTV02 (60 SV)',
        isActiveNow: false,
      },
    ],
  },
  {
    id: 'cr-h01',
    code: 'H.01',
    name: 'Hội trường Lớn Giảng đường H.01',
    building: 'Khu H',
    floor: 1,
    capacity: 220,
    roomAreaM2: 260,
    temperature: 27.6,
    humidity: 62,
    hasMotion: 0,
    isVacant: true,
    vacantDurationMinutes: 50,
    voltageV: 24.0,
    currentA: 0.05,
    totalPowerW: 11.2,
    apparentPowerVA: 11.5,
    reactivePowerVAR: 2.5,
    frequencyHz: 50.0,
    powerFactor: 0.98,
    energyTodayKWh: 29.8,
    warningForgotten: false,
    autoShutdownRemainingSec: null,
    lastUpdated: 'Vừa cập nhật',
    devices: [
      {
        id: 'dev-h01-light1',
        name: 'Dàn Đèn Hội Trường & Sân Khấu',
        brandModel: 'Hệ thống LED Panel Âm Trần 600x600 Paragon 40W x 12 tấm',
        type: 'light',
        isOn: false,
        powerRatingW: 480,
        currentPowerW: 0,
        nominalCurrentA: 2.2,
        relayPin: 'GPIO 16 (Khởi động từ MCB)',
        relayState: 'OPEN',
      },
      {
        id: 'dev-h01-ac1',
        name: 'Cụm Điều Hòa Trung Tâm VRV Daikin 10 HP',
        brandModel: 'Daikin VRV IV-S RXMQ10AYM (3 pha - Điều khiển tiếp điểm 24V qua Contactor 60A)',
        type: 'ac',
        isOn: false,
        powerRatingW: 7800,
        currentPowerW: 0,
        nominalCurrentA: 35.5,
        relayPin: 'GPIO 21 (Khởi động từ Contactor 60A)',
        relayState: 'OPEN',
        acSettings: {
          targetTemp: 24,
          mode: 'cool',
          fanSpeed: 'high',
        },
      },
      {
        id: 'dev-h01-wfan1',
        name: 'Quạt Treo Tường 1 (Cánh Trái Hội Trường)',
        brandModel: 'Quạt Treo Tường Công Nghiệp Vinawind QTT-500 (85W)',
        type: 'fan',
        isOn: false,
        powerRatingW: 85,
        currentPowerW: 0,
        nominalCurrentA: 0.38,
        relayPin: 'GPIO 25 (Relay 24V)',
        relayState: 'OPEN',
        fanSpeed: 1,
      },
      {
        id: 'dev-h01-wfan2',
        name: 'Quạt Treo Tường 2 (Cánh Phải Hội Trường)',
        brandModel: 'Quạt Treo Tường Công Nghiệp Vinawind QTT-500 (85W)',
        type: 'fan',
        isOn: false,
        powerRatingW: 85,
        currentPowerW: 0,
        nominalCurrentA: 0.38,
        relayPin: 'GPIO 26 (Relay 24V)',
        relayState: 'OPEN',
        fanSpeed: 1,
      },
      {
        id: 'dev-h01-wfan3',
        name: 'Quạt Treo Tường 3 (Hàng Ghế Phía Sau Trái)',
        brandModel: 'Quạt Treo Tường Công Nghiệp Vinawind QTT-500 (85W)',
        type: 'fan',
        isOn: false,
        powerRatingW: 85,
        currentPowerW: 0,
        nominalCurrentA: 0.38,
        relayPin: 'GPIO 27 (Relay 24V)',
        relayState: 'OPEN',
        fanSpeed: 1,
      },
      {
        id: 'dev-h01-wfan4',
        name: 'Quạt Treo Tường 4 (Hàng Ghế Phía Sau Phải)',
        brandModel: 'Quạt Treo Tường Công Nghiệp Vinawind QTT-500 (85W)',
        type: 'fan',
        isOn: false,
        powerRatingW: 85,
        currentPowerW: 0,
        nominalCurrentA: 0.38,
        relayPin: 'GPIO 32 (Relay 24V)',
        relayState: 'OPEN',
        fanSpeed: 1,
      },
    ],
    timetable: [
      {
        id: 'tt-8',
        period: 'Tiết 9 - 11 (15:30 - 18:00)',
        startTime: '15:30',
        endTime: '18:00',
        subject: 'Hội thảo Công nghệ Bán dẫn & Vi mạch',
        lecturer: 'Khách mời Doanh nghiệp',
        classGroup: 'Toàn khoa Điện tử',
        isActiveNow: false,
      },
    ],
  },
];

export const CALIBRATION_BENCHMARK_DATA: CalibrationPoint[] = [
  {
    parameter: 'Điện áp hệ thống (Voltage 24V)',
    unit: 'V',
    standardInstrument: 'Fluke 87V True RMS Multimeter',
    standardValue: 24.05,
    pzemValue: 24.02,
    absoluteError: -0.03,
    relativeErrorPercent: 0.12,
    status: 'ĐẠT TIÊU CHUẨN CẤP 1.0',
  },
  {
    parameter: 'Dòng điện tải nhỏ (Current 1A)',
    unit: 'A',
    standardInstrument: 'Fluke 87V + Kẹp dòng Fluke i400',
    standardValue: 1.025,
    pzemValue: 1.021,
    absoluteError: -0.004,
    relativeErrorPercent: 0.39,
    status: 'ĐẠT TIÊU CHUẨN CẤP 1.0',
  },
  {
    parameter: 'Dòng điện tải lớn (Current 10A)',
    unit: 'A',
    standardInstrument: 'Chauvin Arnoux CA 8336 Power Analyzer',
    standardValue: 9.482,
    pzemValue: 9.440,
    absoluteError: -0.042,
    relativeErrorPercent: 0.44,
    status: 'ĐẠT TIÊU CHUẨN CẤP 1.0',
  },
  {
    parameter: 'Công suất tác dụng (Active Power P)',
    unit: 'W',
    standardInstrument: 'Chauvin Arnoux CA 8336 Power Analyzer',
    standardValue: 2045.6,
    pzemValue: 2038.2,
    absoluteError: -7.4,
    relativeErrorPercent: 0.36,
    status: 'ĐẠT TIÊU CHUẨN CẤP 1.0',
  },
  {
    parameter: 'Hệ số công suất (Power Factor cos φ)',
    unit: '',
    standardInstrument: 'Chauvin Arnoux CA 8336',
    standardValue: 0.982,
    pzemValue: 0.980,
    absoluteError: -0.002,
    relativeErrorPercent: 0.20,
    status: 'ĐẠT TIÊU CHUẨN CẤP 1.0',
  },
  {
    parameter: 'Tần số lưới điện (Frequency)',
    unit: 'Hz',
    standardInstrument: 'Fluke 87V Frequency Counter',
    standardValue: 50.02,
    pzemValue: 50.00,
    absoluteError: -0.02,
    relativeErrorPercent: 0.04,
    status: 'ĐẠT TIÊU CHUẨN CẤP 1.0',
  },
  {
    parameter: 'Điện năng tích lũy (Energy kWh)',
    unit: 'kWh',
    standardInstrument: 'Công tơ điện tử kiểm chuẩn Gelex EMIC 1P2W',
    standardValue: 15.20,
    pzemValue: 15.14,
    absoluteError: -0.06,
    relativeErrorPercent: 0.39,
    status: 'ĐẠT TIÊU CHUẨN CẤP 1.0',
  },
];

export const INITIAL_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule-auto-off',
    name: 'Tự động ngắt điện khi phòng trống sau giờ học (Auto-Shutdown)',
    description: 'Sau khi kết thúc tiết học theo TKB và cảm biến PIR không phát hiện người quá 10 phút, hệ thống phát cảnh báo và tự ngắt tiếp điểm Relay 24V để chống lãng phí điện.',
    enabled: true,
    type: 'auto_off_vacant',
    paramMinutes: 10,
  },
  {
    id: 'rule-pre-class',
    name: 'Tự động bật thiết bị đón lớp (Pre-Class Warmup)',
    description: 'Tự động bật trước 1 dãy đèn và quạt thông gió 10 phút trước giờ vào lớp nếu phòng có lịch học được duyệt.',
    enabled: true,
    type: 'pre_class_on',
    paramMinutes: 10,
  },
  {
    id: 'rule-temp-limit',
    name: 'Khống chế ngưỡng nhiệt độ máy lạnh tối thiểu (Eco Limit >= 24°C)',
    description: 'Khóa không cho cài đặt máy lạnh thấp hơn 24°C tại bảng điều khiển để tránh việc sinh viên chỉnh 16-18°C gây sốc nhiệt và quá tải lưới điện.',
    enabled: true,
    type: 'temp_limit',
    paramTemp: 24,
  },
  {
    id: 'rule-night-cutoff',
    name: 'Cắt nguồn cưỡng bức ban đêm (Night Lockout 21:30 - 06:00)',
    description: 'Từ 21:30 đến 06:00 sáng hôm sau, tự động khóa và ngắt toàn bộ điện phòng học ngoại trừ hệ thống an ninh/camera.',
    enabled: true,
    type: 'night_cutoff',
  },
];

export const HOURLY_ENERGY_DATA: HourlyEnergyPoint[] = [
  { hour: '06:00', totalKWh: 0.6, acKWh: 0.0, lightKWh: 0.4, fanKWh: 0.2, otherKWh: 0.0 },
  { hour: '07:00', totalKWh: 5.8, acKWh: 3.5, lightKWh: 1.4, fanKWh: 0.6, otherKWh: 0.3 },
  { hour: '08:00', totalKWh: 11.2, acKWh: 7.9, lightKWh: 1.8, fanKWh: 0.8, otherKWh: 0.7 },
  { hour: '09:00', totalKWh: 13.5, acKWh: 10.1, lightKWh: 1.8, fanKWh: 0.8, otherKWh: 0.8 },
  { hour: '10:00', totalKWh: 12.1, acKWh: 8.8, lightKWh: 1.7, fanKWh: 0.8, otherKWh: 0.8 },
  { hour: '11:00', totalKWh: 5.2, acKWh: 3.2, lightKWh: 1.1, fanKWh: 0.5, otherKWh: 0.4 },
  { hour: '12:00', totalKWh: 1.8, acKWh: 0.9, lightKWh: 0.4, fanKWh: 0.3, otherKWh: 0.2 },
  { hour: '13:00', totalKWh: 9.4, acKWh: 6.8, lightKWh: 1.4, fanKWh: 0.6, otherKWh: 0.6 },
  { hour: '14:00', totalKWh: 13.8, acKWh: 10.4, lightKWh: 1.8, fanKWh: 0.8, otherKWh: 0.8 },
  { hour: '15:00', totalKWh: 13.4, acKWh: 10.0, lightKWh: 1.8, fanKWh: 0.8, otherKWh: 0.8 },
  { hour: '16:00', totalKWh: 8.1, acKWh: 5.7, lightKWh: 1.3, fanKWh: 0.6, otherKWh: 0.5 },
  { hour: '17:00', totalKWh: 2.8, acKWh: 1.5, lightKWh: 0.7, fanKWh: 0.4, otherKWh: 0.2 },
];

export const STUDENT_GROUP_TASKS: StudentTask[] = [
  {
    studentId: 'SV-01',
    name: 'Sinh viên 1 - Trưởng nhóm Phần cứng',
    role: 'Kỹ sư Thiết kế Mạch Điều Khiển 24V & An Toàn Điện',
    responsibilities: [
      'Thiết kế sơ đồ nguyên lý mạch tủ điện phòng học chuẩn 24V theo tiêu chuẩn kỹ thuật',
      'Đấu nối cụm Module Relay 8 kênh Songle 10A và Contactor điều khiển',
      'Tích hợp Module cách ly quang Optocoupler EL817 chống nhiễu ngược về vi điều khiển ESP32',
      'Đảm bảo an toàn điện: Cầu chì bảo vệ, bảo vệ quá tải, chống chạm chập, tiếp địa tủ điện',
    ],
    hardwareDeliverables: [
      'Module Relay 8 kênh 24V có Optocoupler cách ly',
      'Contactor Relay 24V Schneider TeSys',
      'Bộ nguồn bảo vệ 24V & Hộp tủ điện sắt sơn tĩnh điện',
    ],
    progressPercent: 95,
  },
  {
    studentId: 'SV-02',
    name: 'Sinh viên 2 - Lập trình Nhúng IoT',
    role: 'Kỹ sư Firmware Vi điều khiển ESP32 & Giao thức Mạng',
    responsibilities: [
      'Lập trình ESP32 NodeMCU giao tiếp UART2 với module đo điện PZEM-004T v3.0 (CT 100A)',
      'Đọc tín hiệu cảm biến nhiệt độ DHT22, cảm biến chuyển động hồng ngoại PIR HC-SR501',
      'Xử lý logic đóng/ngắt relay an toàn, bảo vệ chống hồ quang và xung dội tiếp điểm (Debounce)',
      'Lập trình giao thức truyền thông MQTT / WebSocket gửi JSON lên Cloud Server',
    ],
    hardwareDeliverables: [
      'Kit phát triển ESP32-WROOM-32D Dual-Core',
      'Module đo điện áp, dòng điện, công suất PZEM-004T v3.0 (Biến dòng CT 100A)',
      'Cảm biến PIR HC-SR501 & DHT22 chính hãng',
    ],
    progressPercent: 92,
  },
  {
    studentId: 'SV-03',
    name: 'Sinh viên 3 - Bảng điều khiển Tại chỗ',
    role: 'Kỹ sư Giao diện HMI Phòng Học & Màn Hình Cảm Ứng',
    responsibilities: [
      'Thiết kế cụm bảng điều khiển gắn tường tại phòng học (Wall Smart Touch Switch Panel)',
      'Lập trình giao diện màn hình cảm ứng Nextion 7-inch / ESP32 Touch Screen',
      'Cung cấp phím cảm ứng trực tiếp bật/tắt đèn, quạt, chỉnh nhiệt độ điều hòa 16-30°C',
      'Đồng bộ trạng thái 2 chiều tức thời giữa nút bấm tại phòng và hệ thống quản lý từ xa qua MQTT',
    ],
    hardwareDeliverables: [
      'Màn hình cảm ứng HMI Nextion / ESP32-S3 Touch LCD 7 inch',
      'Cụm nút nhấn cảm ứng điện dung TTP223 dự phòng',
      'Còi Buzzer báo động âm thanh khi quá nhiệt hoặc cảnh báo quên tắt',
    ],
    progressPercent: 90,
  },
  {
    studentId: 'SV-04',
    name: 'Sinh viên 4 - Web Quản lý & Lập lịch',
    role: 'Kỹ sư Phần mềm Dashboard & Tự Động Hóa Thời Khóa Biểu',
    responsibilities: [
      'Xây dựng Web Dashboard trung tâm cho phòng Quản lý Cơ sở vật chất trường học',
      'Giám sát đa phòng học theo sơ đồ tầng/tòa nhà, hiển thị trạng thái và công suất thời gian thực',
      'Phát triển tính năng Lập lịch học vụ theo Thời khóa biểu (TKB) của Phòng Đào tạo',
      'Xây dựng cơ chế cảnh báo tự động khi phát hiện phòng trống mà vẫn chạy máy lạnh/đèn',
    ],
    hardwareDeliverables: [
      'Web Dashboard Responsive trên PC, Máy tính bảng và Smartphone',
      'REST API & MQTT Broker (Mosquitto/EMQX) kết nối ESP32',
      'Module đồng bộ lịch học tự động',
    ],
    progressPercent: 94,
  },
  {
    studentId: 'SV-05',
    name: 'Sinh viên 5 - Phân tích Điện năng & Báo cáo',
    role: 'Kỹ sư Đo kiểm, Tính toán Kinh tế & Hiệu Chuẩn Sai Số',
    responsibilities: [
      'Thực nghiệm đo kiểm và hiệu chuẩn sai số của cảm biến PZEM-004T so với công tơ điện tử EVN (< 0.8%)',
      'Xây dựng thuật toán phân tích biểu đồ phụ tải theo giờ và tối ưu hóa điện năng 24V theo thời gian học vụ',
      'Tính toán chỉ số hiệu quả năng lượng (kWh tiết kiệm được, số giờ giảm chạy không tải, giảm phát thải CO2)',
      'Soạn thảo hồ sơ đề tài tốt nghiệp, sơ đồ mạch in PCB Altium, tài liệu hướng dẫn vận hành',
    ],
    hardwareDeliverables: [
      'Bảng số liệu kiểm chuẩn thực nghiệm sai số đo lường đạt cấp chính xác 1.0',
      'Báo cáo phân tích kinh tế & thời gian hoàn vốn giải pháp (ROI)',
      'Tập hồ sơ kỹ thuật hệ thống và báo cáo vận hành',
    ],
    progressPercent: 90,
  },
];

export const ESP32_SAMPLE_CODE = `/**
 * FIRMWARE: HỆ THỐNG GIÁM SÁT VÀ QUẢN LÝ THIẾT BỊ PHÒNG HỌC TỪ XA
 * Firmware: ESP32-WROOM-32 kết nối PZEM-004T v3.0, Relay 24V, PIR, DHT22
 * Nhóm kỹ thuật: Kỹ sư IoT & Nhúng
 * Giao thức: MQTT / WebSocket / REST API
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <PZEM004Tv30.h>
#include <DHT.h>
#include <ArduinoJson.h>

// --- CẤU HÌNH WIFI & MQTT BROKER ---
const char* ssid = "CAMPUS_IOT_WIFI";
const char* password = "Password@2026";
const char* mqtt_server = "broker.smartclass-energy.edu.vn";
const int mqtt_port = 1883;
const char* classroom_id = "A101";

// --- ĐỊNH NGHĨA CHÂN PIN TRÊN ESP32 ---
#define RELAY_LIGHT_1   16  // Relay 1: Đèn bảng (24V - Rạng Đông LED 76W)
#define RELAY_LIGHT_2   17  // Relay 2: Đèn lớp (24V - Rạng Đông LED 152W)
#define RELAY_FAN_1     18  // Relay 3: Quạt trước (24V - Vinawind 55W)
#define RELAY_FAN_2     19  // Relay 4: Quạt sau (24V - Vinawind 55W)
#define RELAY_AC_1      21  // Relay 5: Điều hòa 1 (Qua Contactor 30A Schneider - Daikin 2050W)
#define RELAY_PROJECTOR 23  // Relay 6: Máy chiếu Epson & Âm thanh
#define PIN_PIR         34  // Cảm biến chuyển động PIR HC-SR501
#define PIN_DHT         4   // Cảm biến DHT22
#define PIN_BUZZER      25  // Còi chíp báo động

// Cổng UART2 kết nối PZEM-004T v3.0 (RX2=16, TX2=17 hoặc tùy biến chân 26, 27)
PZEM004Tv30 pzem(Serial2, 26, 27);
DHT dht(PIN_DHT, DHT22);

WiFiClient espClient;
PubSubClient client(espClient);

// Biến lưu trạng thái đo lường thực tế
float voltage = 0.0, current = 0.0, power = 0.0, energy = 0.0, frequency = 50.0, pf = 0.98;
float temperature = 0.0, humidity = 0.0;
bool motionDetected = false;
unsigned long lastTelemetry = 0;

void setup() {
  Serial.begin(115200);
  
  // Khởi tạo chân ngõ ra Relay (Kích mức LOW cho module cách ly quang PC817)
  pinMode(RELAY_LIGHT_1, OUTPUT);
  pinMode(RELAY_LIGHT_2, OUTPUT);
  pinMode(RELAY_FAN_1, OUTPUT);
  pinMode(RELAY_FAN_2, OUTPUT);
  pinMode(RELAY_AC_1, OUTPUT);
  pinMode(RELAY_PROJECTOR, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  
  // Mặc định an toàn khi khởi động: Ngắt toàn bộ tiếp điểm relay (HIGH với active-low)
  digitalWrite(RELAY_LIGHT_1, HIGH);
  digitalWrite(RELAY_LIGHT_2, HIGH);
  digitalWrite(RELAY_FAN_1, HIGH);
  digitalWrite(RELAY_FAN_2, HIGH);
  digitalWrite(RELAY_AC_1, HIGH);
  digitalWrite(RELAY_PROJECTOR, HIGH);
  digitalWrite(PIN_BUZZER, LOW);

  pinMode(PIN_PIR, INPUT);
  dht.begin();

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
}

void setup_wifi() {
  Serial.print("Dang ket noi WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi da ket noi! IP: " + WiFi.localIP().toString());
}

// Nhận lệnh điều khiển từ xa từ Web Dashboard hoặc Bảng cảm ứng tại chỗ
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<256> doc;
  deserializeJson(doc, payload, length);

  const char* cmd = doc["command"]; // "TOGGLE_RELAY", "ALL_OFF", "SET_AC_TEMP"
  const char* device = doc["device"];
  bool state = doc["state"];

  if (strcmp(cmd, "TOGGLE_RELAY") == 0) {
    int pin = getPinByDeviceName(device);
    if (pin != -1) {
      digitalWrite(pin, state ? LOW : HIGH); // Module Relay Active-LOW
      Serial.printf("Relay %s -> %s\\n", device, state ? "DONG TIEP DIEM (24V ON)" : "NGAT (24V OFF)");
    }
  } else if (strcmp(cmd, "ALL_OFF") == 0) {
    // Ngắt toàn bộ tiếp điểm relay khi tan học hoặc phòng trống quá thời gian quy định
    digitalWrite(RELAY_LIGHT_1, HIGH);
    digitalWrite(RELAY_LIGHT_2, HIGH);
    digitalWrite(RELAY_FAN_1, HIGH);
    digitalWrite(RELAY_FAN_2, HIGH);
    digitalWrite(RELAY_AC_1, HIGH);
    digitalWrite(RELAY_PROJECTOR, HIGH);
    tone(PIN_BUZZER, 1000, 200); // Kêu beep báo hiệu an toàn
    Serial.println("DA NGAT AN TOAN TOAN BO RELAY 24V PHONG HOC!");
  }
}

void loop() {
  if (!client.connected()) reconnectMQTT();
  client.loop();

  // Đọc dữ liệu cảm biến định kỳ mỗi 2 giây
  if (millis() - lastTelemetry > 2000) {
    lastTelemetry = millis();
    readSensorsAndPublish();
  }
}

void readSensorsAndPublish() {
  voltage   = pzem.voltage();
  current   = pzem.current();
  power     = pzem.power();
  energy    = pzem.energy();
  frequency = pzem.frequency();
  pf        = pzem.pf();

  temperature = dht.readTemperature();
  humidity    = dht.readHumidity();
  motionDetected = (digitalRead(PIN_PIR) == HIGH);

  // Đóng gói JSON gửi lên Web Server
  StaticJsonDocument<384> doc;
  doc["class_id"] = classroom_id;
  doc["voltage"]  = isnan(voltage) ? 221.4 : voltage;
  doc["current"]  = isnan(current) ? 0.0 : current;
  doc["power"]    = isnan(power) ? 0.0 : power;
  doc["energy"]   = isnan(energy) ? 0.0 : energy;
  doc["freq"]     = isnan(frequency) ? 50.0 : frequency;
  doc["pf"]       = isnan(pf) ? 0.98 : pf;
  doc["temp"]     = isnan(temperature) ? 25.0 : temperature;
  doc["humi"]     = isnan(humidity) ? 60.0 : humidity;
  doc["motion"]   = motionDetected;

  char buffer[384];
  serializeJson(doc, buffer);
  client.publish("smartclass/A101/telemetry", buffer);
}

int getPinByDeviceName(const char* name) {
  if (strcmp(name, "light1") == 0) return RELAY_LIGHT_1;
  if (strcmp(name, "light2") == 0) return RELAY_LIGHT_2;
  if (strcmp(name, "fan1") == 0) return RELAY_FAN_1;
  if (strcmp(name, "fan2") == 0) return RELAY_FAN_2;
  if (strcmp(name, "ac1") == 0) return RELAY_AC_1;
  if (strcmp(name, "projector") == 0) return RELAY_PROJECTOR;
  return -1;
}

void reconnectMQTT() {
  while (!client.connected()) {
    if (client.connect("ESP32_Classroom_A101")) {
      client.subscribe("smartclass/A101/control");
    } else {
      delay(2000);
    }
  }
}
`;
