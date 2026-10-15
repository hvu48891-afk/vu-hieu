// Utility calculations for Electrical Energy, Power and EVN Tariff in Vietnam
// Tham chiếu: Quyết định số 2941/QĐ-BCT của Bộ Công Thương về Biểu giá bán lẻ điện

export interface EVNTariffStructure {
  NORMAL: number; // VNĐ / kWh (Giờ bình thường: 04:00 - 09:30, 11:30 - 17:00, 20:00 - 22:00)
  PEAK: number;   // VNĐ / kWh (Giờ cao điểm: 09:30 - 11:30, 17:00 - 20:00)
  OFF_PEAK: number; // VNĐ / kWh (Giờ thấp điểm: 22:00 - 04:00)
  AVERAGE_EDU: number; // VNĐ / kWh (Giá bán lẻ điện bình quân cho Cơ sở Giáo dục - Đào tạo dưới 6kV)
  VAT_PERCENT: number; // Thuế GTGT VAT (8% hoặc 10%)
}

export const EVN_RATES: EVNTariffStructure = {
  NORMAL: 1864, // Chưa VAT
  PEAK: 3102,   // Chưa VAT
  OFF_PEAK: 1155, // Chưa VAT
  AVERAGE_EDU: 2050, // Chưa VAT (Cơ quan hành chính, trường học cấp điện áp < 6kV)
  VAT_PERCENT: 8,
};

// Hệ số phát thải lưới điện Việt Nam (Cục Biến đổi khí hậu - Bộ Tài nguyên và Môi trường)
export const CO2_PER_KWH_KG = 0.7221; 

export const formatVND = (amount: number, includeVat: boolean = true): string => {
  const finalAmount = includeVat ? amount * (1 + EVN_RATES.VAT_PERCENT / 100) : amount;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Math.round(finalAmount));
};

export const formatKWh = (val: number): string => {
  return val.toFixed(2) + ' kWh';
};

export const formatWatts = (val: number): string => {
  if (val >= 1000) {
    return (val / 1000).toFixed(2) + ' kW';
  }
  return Math.round(val) + ' W';
};

/**
 * Xác định khung giờ giá điện EVN hiện tại
 */
export const getCurrentEVNTimeSlot = (): {
  slot: 'PEAK' | 'NORMAL' | 'OFF_PEAK';
  name: string;
  rate: number;
} => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const totalMin = h * 60 + m;

  // Giờ thấp điểm: 22:00 (1320m) đến 04:00 (240m)
  if (totalMin >= 1320 || totalMin < 240) {
    return { slot: 'OFF_PEAK', name: 'Giờ Thấp Điểm (Đêm)', rate: EVN_RATES.OFF_PEAK };
  }

  // Giờ cao điểm: 09:30 - 11:30 (570m - 690m) và 17:00 - 20:00 (1020m - 1200m)
  const isMorningPeak = totalMin >= 570 && totalMin < 690;
  const isEveningPeak = totalMin >= 1020 && totalMin < 1200;
  if (isMorningPeak || isEveningPeak) {
    return { slot: 'PEAK', name: 'Giờ Cao Điểm', rate: EVN_RATES.PEAK };
  }

  // Còn lại: Giờ bình thường
  return { slot: 'NORMAL', name: 'Giờ Bình Thường', rate: EVN_RATES.NORMAL };
};

export const calculateElectricityCost = (kwh: number, includeVat: boolean = true): number => {
  const baseCost = kwh * EVN_RATES.AVERAGE_EDU;
  return Math.round(includeVat ? baseCost * (1 + EVN_RATES.VAT_PERCENT / 100) : baseCost);
};

export const calculateCO2Reduction = (kwhSaved: number): number => {
  return Number((kwhSaved * CO2_PER_KWH_KG).toFixed(1));
};

/**
 * Tính toán công suất thực tế điều hòa Inverter theo nhiệt độ cài đặt và nhiệt độ phòng thực tế
 */
export const calculateRealisticAcPower = (
  ratedPowerW: number,
  targetTemp: number,
  roomTemp: number,
  mode: 'cool' | 'eco' | 'fan'
): number => {
  if (mode === 'fan') {
    return 45; // Chỉ quạt gió dàn lạnh chạy, máy nén tắt
  }

  // Độ chênh lệch nhiệt độ
  const tempDiff = roomTemp - targetTemp;

  if (mode === 'eco') {
    // Chế độ Eco khống chế tần số biến tần, tiết kiệm ~25%
    if (tempDiff <= 0.5) return Math.round(ratedPowerW * 0.38); // Duy trì mát 700 - 800W
    return Math.round(ratedPowerW * 0.65);
  }

  // Chế độ làm lạnh thường (Cool)
  if (tempDiff > 4) {
    // Máy nén chạy hết công suất (Full-load pull down)
    return ratedPowerW; // ~ 1950W - 2050W
  } else if (tempDiff > 1.5) {
    return Math.round(ratedPowerW * 0.78); // ~ 1500W - 1600W
  } else {
    // Đã đạt ngưỡng nhiệt độ cài đặt, Inverter hạ tần số duy trì
    return Math.round(ratedPowerW * 0.42); // ~ 800W - 900W
  }
};

