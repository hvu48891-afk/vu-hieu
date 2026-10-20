import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Classroom, AutomationRule, HardwareLog, DeviceType, PermissionAction } from '../types';
import { INITIAL_CLASSROOMS, INITIAL_AUTOMATION_RULES } from '../data/mockData';
import { playRelayClick, playWarningBeep, setSoundEnabled, getSoundEnabled } from '../utils/audio';
import { calculateRealisticAcPower } from '../utils/calculations';
import { dbService } from '../services/dbService';
import { validateFirestoreConnection } from '../lib/firebase';
import { SUPABASE_URL, isSupabaseConfigured, checkSupabaseConnection } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from './AuthContext';
import { Lock, ShieldAlert, X, LogIn } from 'lucide-react';

interface ClassroomContextType {
  classrooms: Classroom[];
  selectedClassroomId: string;
  selectedClassroom: Classroom;
  setSelectedClassroomId: (id: string) => void;
  toggleDevice: (classroomId: string, deviceId: string) => void;
  setAcTemperature: (classroomId: string, deviceId: string, temp: number) => void;
  setAcMode: (classroomId: string, deviceId: string, mode: 'cool' | 'eco' | 'fan') => void;
  setFanSpeed: (classroomId: string, deviceId: string, speed: 1 | 2 | 3) => void;
  turnAllOff: (classroomId: string) => void;
  turnAllOn: (classroomId: string) => void;
  globalAllOff: () => void;
  simulateScenario: (scenario: 'leave_empty_forget' | 'students_enter' | 'auto_shutdown_now') => void;
  cancelAutoShutdown: (classroomId: string) => void;
  automationRules: AutomationRule[];
  toggleRule: (ruleId: string) => void;
  hardwareLogs: HardwareLog[];
  soundEnabled: boolean;
  toggleSound: () => void;
  activeRoomCount: number;
  totalCampusPowerW: number;
  totalEnergyTodayKWh: number;
  alertCount: number;
  includeVat: boolean;
  setIncludeVat: (val: boolean) => void;
  dbSyncStatus: 'synced' | 'connecting' | 'offline';
  supabaseStatus: {
    configured: boolean;
    message: string;
    url: string;
  };
  supabaseRoomCount: number;
  isSupabasePrimary: boolean;
  sourceTable: 'rooms' | 'classrooms' | 'mock' | 'none';
  refreshFromSupabase: () => Promise<boolean>;
  seedSupabaseClassrooms: () => Promise<{ success: boolean; count: number; rlsBlocked?: boolean; error?: string }>;
  addSupabaseRoom: (
    name: string,
    building?: string,
    customDevices?: Array<{
      name: string;
      type: DeviceType;
      powerRatingW: number;
      isOn: boolean;
      targetTemp?: number;
    }>
  ) => Promise<{ success: boolean; rlsBlocked?: boolean; error?: string; roomId?: number }>;
  deleteRoom: (classroomId: string) => Promise<{ success: boolean; rlsBlocked?: boolean; error?: string }>;
  addDeviceToRoom: (
    classroomId: string,
    deviceData: {
      name: string;
      type: DeviceType;
      powerRatingW: number;
      isOn?: boolean;
      targetTemp?: number;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  deleteDeviceFromRoom: (classroomId: string, deviceId: string) => Promise<{ success: boolean; error?: string }>;
  loadDemoClassrooms: () => void;
  toggleHardCutoff: (classroomId: string) => void;
  authNotice: string | null;
  clearAuthNotice: () => void;
  isReadOnlySession: boolean;
}

const ClassroomContext = createContext<ClassroomContextType | null>(null);

const DEFAULT_EMPTY_ROOM: Classroom = {
  id: 'empty',
  code: '---',
  name: 'Chưa có phòng học trong Database',
  building: 'Trống',
  floor: 0,
  capacity: 0,
  roomAreaM2: 0,
  temperature: 25,
  humidity: 60,
  hasMotion: 0,
  isVacant: true,
  vacantDurationMinutes: 0,
  voltageV: 24.0,
  currentA: 0,
  totalPowerW: 0,
  apparentPowerVA: 0,
  reactivePowerVAR: 0,
  frequencyHz: 50.0,
  powerFactor: 0.98,
  energyTodayKWh: 0,
  devices: [],
  timetable: [],
  warningForgotten: false,
  autoShutdownRemainingSec: null,
  lastUpdated: 'Supabase 0 phòng',
};

export const ClassroomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, canPerform, openLoginModal } = useAuth();
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const isReadOnlySession = !currentUser || currentUser.role === 'STUDENT';

  const clearAuthNotice = useCallback(() => {
    setAuthNotice(null);
  }, []);

  const requirePerm = useCallback(
    (action: PermissionAction, roomId?: string): boolean => {
      if (!currentUser) {
        const reason = 'Hệ thống đã khóa điều khiển: Bạn đã đăng xuất hoặc chưa đăng nhập! Vui lòng đăng nhập để thao tác hệ thống.';
        setAuthNotice(reason);
        openLoginModal();
        setTimeout(() => setAuthNotice(null), 5500);
        return false;
      }
      if (currentUser.role === 'STUDENT') {
        const reason = 'Tài khoản Sinh viên ở chế độ Chỉ xem. Mọi thao tác đóng/ngắt thiết bị Relay 24V, Aptomat và cấu hình hệ thống bị khóa!';
        setAuthNotice(reason);
        setTimeout(() => setAuthNotice(null), 5500);
        return false;
      }
      const perm = canPerform(action, roomId);
      if (!perm.allowed) {
        setAuthNotice(perm.reason || 'Bạn không có quyền thực hiện thao tác này!');
        setTimeout(() => setAuthNotice(null), 5000);
        return false;
      }
      return true;
    },
    [canPerform, currentUser, openLoginModal]
  );

  // Initialize with empty array so that count starts accurately reflecting database
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(INITIAL_AUTOMATION_RULES);
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [includeVat, setIncludeVat] = useState<boolean>(true);
  const [dbSyncStatus, setDbSyncStatus] = useState<'synced' | 'connecting' | 'offline'>('connecting');
  const [supabaseRoomCount, setSupabaseRoomCount] = useState<number>(0);
  const [isSupabasePrimary, setIsSupabasePrimary] = useState<boolean>(true);
  const [sourceTable, setSourceTable] = useState<'rooms' | 'classrooms' | 'mock' | 'none'>('rooms');
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    message: string;
    url: string;
  }>({
    configured: isSupabaseConfigured(),
    url: SUPABASE_URL,
    message: 'Đang kết nối cơ sở dữ liệu Supabase...'
  });
  const isSyncingFromCloud = useRef(false);
  const [hardwareLogs, setHardwareLogs] = useState<HardwareLog[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      topic: 'smartclass/telemetry',
      payload: '{"V":221.4,"I":0.0,"P":0,"PF":0.96,"Freq":50.0,"status":"SUPABASE_SYNCED"}',
      direction: 'IN',
      type: 'TELEMETRY',
    },
    {
      id: 'log-2',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      topic: 'smartclass/database/status',
      payload: '{"provider":"Supabase PostgreSQL","project":"vvxieqsotbfhymaiqngb","tables":["rooms","devices"]}',
      direction: 'IN',
      type: 'TELEMETRY',
    },
  ]);

  const addHardwareLog = useCallback((topic: string, payload: string, direction: 'IN' | 'OUT', type: 'TELEMETRY' | 'COMMAND' | 'ALARM') => {
    const newLog: HardwareLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      topic,
      payload,
      direction,
      type,
    };
    setHardwareLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  }, []);

  // Fetch classrooms from Supabase
  const loadFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      const result = await supabaseService.fetchClassrooms();
      if (result !== null) {
        setDbSyncStatus('synced');
        setIsSupabasePrimary(true);
        setSourceTable(result.sourceTable);
        setSupabaseRoomCount(result.rawCount);
        setClassrooms(result.classrooms);

        if (result.classrooms.length > 0) {
          setSelectedClassroomId((prev) =>
            result.classrooms.some((c) => c.id === prev) ? prev : result.classrooms[0].id
          );
        } else {
          setSelectedClassroomId('');
        }

        setSupabaseStatus({
          configured: true,
          url: SUPABASE_URL,
          message: `Đồng bộ trực tiếp từ bảng '${result.sourceTable}' (${result.rawCount} phòng học thực tế trên Supabase)`,
        });

        addHardwareLog(
          'smartclass/supabase/sync',
          JSON.stringify({ table: result.sourceTable, count: result.rawCount, timestamp: new Date().toISOString() }),
          'IN',
          'TELEMETRY'
        );
        return true;
      }
    } catch (e) {
      console.warn('[Supabase load error]:', e);
    }
    return false;
  }, [addHardwareLog]);

  // Initial loading & realtime setup
  useEffect(() => {
    let unsubscribeSupabase: (() => void) | undefined;
    let unsubscribeFirestore: (() => void) | undefined;

    async function initDatabase() {
      // 1. Try Supabase first
      const supabaseOk = await loadFromSupabase();

      if (supabaseOk) {
        // Subscribe to realtime Postgres updates on rooms/devices
        unsubscribeSupabase = supabaseService.subscribeToRooms(() => {
          loadFromSupabase();
        });
        return;
      }

      // 2. Fallback to Firestore if Supabase failed
      try {
        const isOnline = await validateFirestoreConnection();
        if (isOnline) {
          await dbService.initClassroomsIfEmpty();
          unsubscribeFirestore = dbService.subscribeClassrooms(
            (rooms) => {
              isSyncingFromCloud.current = true;
              setClassrooms(rooms);
              setIsSupabasePrimary(false);
              setSourceTable('mock');
              setDbSyncStatus('synced');
              if (rooms.length > 0) setSelectedClassroomId(rooms[0].id);
              setTimeout(() => {
                isSyncingFromCloud.current = false;
              }, 100);
            },
            (err) => {
              console.warn('[Database] Sync error:', err);
              setDbSyncStatus('offline');
            }
          );
        } else {
          setDbSyncStatus('offline');
        }
      } catch (e) {
        console.warn('[Database] Connection failed:', e);
        setDbSyncStatus('offline');
      }

      // Check connection status message
      checkSupabaseConnection().then((res) => {
        setSupabaseStatus({
          configured: res.connected,
          url: SUPABASE_URL,
          message: res.message,
        });
      });
    }

    initDatabase();

    return () => {
      if (unsubscribeSupabase) unsubscribeSupabase();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [loadFromSupabase]);

  const refreshFromSupabase = useCallback(async (): Promise<boolean> => {
    setDbSyncStatus('connecting');
    const ok = await loadFromSupabase();
    if (ok) {
      const conn = await checkSupabaseConnection();
      setSupabaseStatus({
        configured: conn.connected,
        url: SUPABASE_URL,
        message: conn.message,
      });
    }
    return ok;
  }, [loadFromSupabase]);

  const seedSupabaseClassrooms = useCallback(async () => {
    if (!requirePerm('ADD_ROOM')) {
      return { success: false, count: 0, error: 'Không có quyền nạp phòng học!' };
    }
    const res = await supabaseService.seedSampleRooms();
    if (res.success) {
      await loadFromSupabase();
    }
    return res;
  }, [loadFromSupabase, requirePerm]);

  const addSupabaseRoom = useCallback(
    async (
      name: string,
      building: string = 'Khu A',
      customDevices?: Array<{
        name: string;
        type: DeviceType;
        powerRatingW: number;
        isOn: boolean;
        targetTemp?: number;
      }>
    ) => {
      if (!requirePerm('ADD_ROOM')) {
        return { success: false, error: 'Bạn không có quyền thêm phòng học mới!' };
      }
      setDbSyncStatus('connecting');
      const res = await supabaseService.addRoom(name, building, customDevices);
      if (res.success) {
        await loadFromSupabase();
        if (res.roomId) {
          setSelectedClassroomId(`cr-${res.roomId}`);
        }
        addHardwareLog(
          'smartclass/rooms/created',
          JSON.stringify({ event: 'ROOM_CREATED', roomName: name, building, roomId: res.roomId }),
          'OUT',
          'COMMAND'
        );
      }
      return res;
    },
    [loadFromSupabase, addHardwareLog, requirePerm]
  );

  const deleteRoom = useCallback(
    async (classroomId: string): Promise<{ success: boolean; rlsBlocked?: boolean; error?: string }> => {
      if (!requirePerm('DELETE_ROOM', classroomId)) {
        return { success: false, error: 'Bạn không có quyền xóa phòng học khỏi hệ thống!' };
      }
      setDbSyncStatus('connecting');

      const targetRoom = classrooms.find((c) => c.id === classroomId);
      const roomName = targetRoom?.name || classroomId;
      const roomCode = targetRoom?.code || classroomId;

      // 1. Delete from Supabase database
      const res = await supabaseService.deleteRoom(classroomId);

      if (!res.success && res.rlsBlocked) {
        setDbSyncStatus('synced');
        return res;
      }

      // 2. Delete from cloud database cache
      await dbService.deleteClassroom(classroomId);

      // 3. Immediately update classrooms state
      setClassrooms((prev) => {
        const remaining = prev.filter((c) => c.id !== classroomId);
        return remaining;
      });

      // 4. Update selected classroom if needed
      setSelectedClassroomId((prevSelected) => {
        if (prevSelected === classroomId) {
          const remaining = classrooms.filter((c) => c.id !== classroomId);
          return remaining[0]?.id || 'empty';
        }
        return prevSelected;
      });

      // 5. Update supabase room count state
      setSupabaseRoomCount((prev) => Math.max(0, prev - 1));

      // 6. Log hardware event
      addHardwareLog(
        'smartclass/rooms/deleted',
        JSON.stringify({
          event: 'ROOM_DELETED',
          classroomId,
          code: roomCode,
          name: roomName,
        }),
        'OUT',
        'COMMAND'
      );

      setDbSyncStatus('synced');
      return { success: true };
    },
    [classrooms, addHardwareLog, requirePerm]
  );

  const addDeviceToRoom = useCallback(
    async (
      classroomId: string,
      deviceData: {
        name: string;
        type: DeviceType;
        powerRatingW: number;
        isOn?: boolean;
        targetTemp?: number;
      }
    ): Promise<{ success: boolean; error?: string }> => {
      if (!requirePerm('CONTROL_DEVICE', classroomId)) {
        return { success: false, error: 'Bạn không có quyền thêm thiết bị.' };
      }
      const numericRoomId = parseInt(classroomId.replace(/[^0-9]/g, ''), 10);
      if (isNaN(numericRoomId)) {
        return { success: false, error: 'Mã phòng không hợp lệ.' };
      }
      const res = await supabaseService.createDevice({
        room_id: numericRoomId,
        device_name: deviceData.name,
        device_type: deviceData.type,
        power_rating_watts: deviceData.powerRatingW,
        is_on: deviceData.isOn ?? false,
        target_temperature: deviceData.targetTemp ?? (deviceData.type === 'ac' ? 24 : null),
      });
      if (res.success) {
        await loadFromSupabase();
        supabaseService.logActivity({
          device_id: res.data?.id,
          control_source: 'WEB_ADMIN',
          action_performed: `Thêm thiết bị "${deviceData.name}" (${deviceData.powerRatingW}W) vào phòng ID: ${numericRoomId}`,
        });
        return { success: true };
      }
      return { success: false, error: res.error };
    },
    [requirePerm, loadFromSupabase]
  );

  const deleteDeviceFromRoom = useCallback(
    async (classroomId: string, deviceId: string): Promise<{ success: boolean; error?: string }> => {
      if (!requirePerm('CONTROL_DEVICE', classroomId)) {
        return { success: false, error: 'Bạn không có quyền xóa thiết bị.' };
      }
      const numericDevId = parseInt(deviceId.replace(/[^0-9]/g, ''), 10);
      if (isNaN(numericDevId)) {
        return { success: false, error: 'Mã thiết bị không hợp lệ.' };
      }
      const res = await supabaseService.deleteDevice(numericDevId);
      if (res.success) {
        await loadFromSupabase();
        supabaseService.logActivity({
          device_id: numericDevId,
          control_source: 'WEB_ADMIN',
          action_performed: `Xóa thiết bị ID: ${numericDevId} khỏi phòng [${classroomId}]`,
        });
        return { success: true };
      }
      return { success: false, error: res.error };
    },
    [requirePerm, loadFromSupabase]
  );

  const loadDemoClassrooms = useCallback(() => {
    if (!requirePerm('SIMULATE_SCENARIO')) return;
    setClassrooms(INITIAL_CLASSROOMS);
    setSelectedClassroomId('cr-a101');
    setIsSupabasePrimary(false);
    setSourceTable('mock');
    addHardwareLog(
      'smartclass/local/demo',
      '{"status":"LOADED_5_LOCAL_DEMO_ROOMS"}',
      'IN',
      'TELEMETRY'
    );
  }, [addHardwareLog, requirePerm]);

  const toggleSound = useCallback(() => {
    setSoundActive((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      return next;
    });
  }, []);

  // Recalculate electrical power and current for a classroom based on real physical formulas
  const recalcClassroomElectrics = (cr: Classroom): Classroom => {
    let totalP = 0;
    const updatedDevices = cr.devices.map((d) => {
      if (!d.isOn) {
        return { ...d, currentPowerW: 0, relayState: 'OPEN' as const };
      }
      let power = d.powerRatingW;
      if (d.type === 'ac' && d.acSettings) {
        power = calculateRealisticAcPower(
          d.powerRatingW,
          d.acSettings.targetTemp,
          cr.temperature,
          d.acSettings.mode
        );
      } else if (d.type === 'fan' && d.fanSpeed) {
        if (d.fanSpeed === 1) power = 35;
        else if (d.fanSpeed === 2) power = 46;
        else power = 55;
      }
      return { ...d, currentPowerW: power, relayState: 'CLOSED' as const };
    });

    totalP = updatedDevices.reduce((sum, d) => sum + d.currentPowerW, 0);
    // Nếu tất cả phụ tải tắt:
    // - Khi cắt Aptomat tổng (isHardCutoff): công suất = 0W
    // - Khi ở chế độ chờ thông thường: công suất = 6.5W (Nguồn nuôi bo mạch ESP32, PZEM-004T & PIR)
    if (totalP === 0) {
      totalP = cr.isHardCutoff ? 0 : 6.5;
    }

    const pf = cr.powerFactor || 0.96;
    const currentA = totalP === 0 ? 0 : Number((totalP / (cr.voltageV * pf)).toFixed(2));
    const apparentPowerVA = totalP === 0 ? 0 : Math.round(cr.voltageV * currentA);
    const reactivePowerVAR = totalP === 0 ? 0 : Math.round(Math.sqrt(Math.max(0, apparentPowerVA * apparentPowerVA - totalP * totalP)));

    const anyMajorLoadOn = updatedDevices.some((d) => d.isOn && (d.type === 'ac' || d.type === 'light'));
    const warning = cr.isVacant && anyMajorLoadOn && cr.vacantDurationMinutes >= 5;

    return {
      ...cr,
      devices: updatedDevices,
      totalPowerW: totalP,
      currentA,
      apparentPowerVA,
      reactivePowerVAR,
      frequencyHz: 50.0,
      warningForgotten: warning,
      lastUpdated: 'Vừa cập nhật',
    };
  };

  const toggleDevice = useCallback((classroomId: string, deviceId: string) => {
    if (!requirePerm('CONTROL_DEVICE', classroomId)) return;
    setClassrooms((prev) =>
      prev.map((cr) => {
        if (cr.id !== classroomId) return cr;
        let nextDeviceState = false;
        let targetDeviceName = '';
        const updatedDevices = cr.devices.map((d) => {
          if (d.id === deviceId) {
            nextDeviceState = !d.isOn;
            targetDeviceName = d.name;
            return {
              ...d,
              isOn: nextDeviceState,
              relayState: nextDeviceState ? ('CLOSED' as const) : ('OPEN' as const),
            };
          }
          return d;
        });

        playRelayClick(nextDeviceState ? 'on' : 'off');
        addHardwareLog(
          `smartclass/${cr.code}/cmd`,
          `{"cmd":"SET_RELAY","device":"${targetDeviceName}","state":${nextDeviceState ? '"CLOSED_24V_ON"' : '"OPEN_24V_OFF"'}}`,
          'OUT',
          'COMMAND'
        );

        const updatedClassroom = recalcClassroomElectrics({
          ...cr,
          devices: updatedDevices,
        });

        // Persist to Supabase and dbService
        supabaseService.saveClassroom(updatedClassroom).catch(console.error);
        dbService.saveClassroom(updatedClassroom).catch(console.error);

        return updatedClassroom;
      })
    );
  }, [addHardwareLog, requirePerm]);

  const setAcTemperature = useCallback((classroomId: string, deviceId: string, temp: number) => {
    if (!requirePerm('CONTROL_DEVICE', classroomId)) return;
    const ecoRule = automationRules.find((r) => r.type === 'temp_limit' && r.enabled);
    const minTemp = ecoRule?.paramTemp || 16;
    const boundedTemp = Math.max(minTemp, Math.min(30, temp));

    setClassrooms((prev) =>
      prev.map((cr) => {
        if (cr.id !== classroomId) return cr;
        const updatedDevices = cr.devices.map((d) => {
          if (d.id === deviceId && d.type === 'ac' && d.acSettings) {
            return {
              ...d,
              acSettings: { ...d.acSettings, targetTemp: boundedTemp },
            };
          }
          return d;
        });

        addHardwareLog(
          `smartclass/${cr.code}/cmd`,
          `{"cmd":"SET_AC_TEMP","targetTemp":${boundedTemp}}`,
          'OUT',
          'COMMAND'
        );

        const updatedRoom = recalcClassroomElectrics({
          ...cr,
          devices: updatedDevices,
        });

        supabaseService.saveClassroom(updatedRoom).catch(console.error);
        dbService.saveClassroom(updatedRoom).catch(console.error);
        return updatedRoom;
      })
    );
  }, [automationRules, addHardwareLog, requirePerm]);

  const setAcMode = useCallback((classroomId: string, deviceId: string, mode: 'cool' | 'eco' | 'fan') => {
    if (!requirePerm('CONTROL_DEVICE', classroomId)) return;
    setClassrooms((prev) =>
      prev.map((cr) => {
        if (cr.id !== classroomId) return cr;
        const updatedDevices = cr.devices.map((d) => {
          if (d.id === deviceId && d.type === 'ac' && d.acSettings) {
            return {
              ...d,
              acSettings: { ...d.acSettings, mode },
            };
          }
          return d;
        });
        const updatedRoom = recalcClassroomElectrics({ ...cr, devices: updatedDevices });
        supabaseService.saveClassroom(updatedRoom).catch(console.error);
        dbService.saveClassroom(updatedRoom).catch(console.error);
        return updatedRoom;
      })
    );
  }, [requirePerm]);

  const setFanSpeed = useCallback((classroomId: string, deviceId: string, speed: 1 | 2 | 3) => {
    if (!requirePerm('CONTROL_DEVICE', classroomId)) return;
    setClassrooms((prev) =>
      prev.map((cr) => {
        if (cr.id !== classroomId) return cr;
        const updatedDevices = cr.devices.map((d) => {
          if (d.id === deviceId && d.type === 'fan') {
            return { ...d, fanSpeed: speed };
          }
          return d;
        });
        const updatedRoom = recalcClassroomElectrics({ ...cr, devices: updatedDevices });
        supabaseService.saveClassroom(updatedRoom).catch(console.error);
        dbService.saveClassroom(updatedRoom).catch(console.error);
        return updatedRoom;
      })
    );
  }, [requirePerm]);

  const turnAllOff = useCallback((classroomId: string) => {
    if (!requirePerm('CONTROL_DEVICE', classroomId)) return;
    playRelayClick('off');
    setClassrooms((prev) =>
      prev.map((cr) => {
        if (cr.id !== classroomId) return cr;
        const turnedOffDevices = cr.devices.map((d) => ({
          ...d,
          isOn: false,
          currentPowerW: 0,
          relayState: 'OPEN' as const,
        }));

        addHardwareLog(
          `smartclass/${cr.code}/cmd`,
          `{"cmd":"TURN_ALL_OFF"}`,
          'OUT',
          'COMMAND'
        );

        const updatedRoom = recalcClassroomElectrics({
          ...cr,
          devices: turnedOffDevices,
          warningForgotten: false,
          autoShutdownRemainingSec: null,
        });

        supabaseService.saveClassroom(updatedRoom).catch(console.error);
        dbService.saveClassroom(updatedRoom).catch(console.error);

        return updatedRoom;
      })
    );
  }, [addHardwareLog, requirePerm]);

  const turnAllOn = useCallback((classroomId: string) => {
    if (!requirePerm('CONTROL_DEVICE', classroomId)) return;
    playRelayClick('on');
    setClassrooms((prev) =>
      prev.map((cr) => {
        if (cr.id !== classroomId) return cr;
        const turnedOnDevices = cr.devices.map((d) => ({
          ...d,
          isOn: true,
          relayState: 'CLOSED' as const,
        }));

        addHardwareLog(
          `smartclass/${cr.code}/cmd`,
          `{"cmd":"CLASS_MODE_ON"}`,
          'OUT',
          'COMMAND'
        );

        const updatedRoom = recalcClassroomElectrics({
          ...cr,
          devices: turnedOnDevices,
          isVacant: false,
          hasMotion: 35,
          warningForgotten: false,
          autoShutdownRemainingSec: null,
        });

        supabaseService.saveClassroom(updatedRoom).catch(console.error);
        dbService.saveClassroom(updatedRoom).catch(console.error);

        return updatedRoom;
      })
    );
  }, [addHardwareLog, requirePerm]);

  const globalAllOff = useCallback(() => {
    if (!requirePerm('GLOBAL_SHUTDOWN')) return;
    playRelayClick('off');
    setClassrooms((prev) => {
      const updatedRooms = prev.map((cr) => {
        const offDevices = cr.devices.map((d) => ({
          ...d,
          isOn: false,
          currentPowerW: 0,
          relayState: 'OPEN' as const,
        }));
        return {
          ...cr,
          devices: offDevices,
          totalPowerW: 6.5,
          currentA: 0.03,
          apparentPowerVA: 7,
          reactivePowerVAR: 1,
          isVacant: true,
          hasMotion: 0,
          vacantDurationMinutes: 0,
          warningForgotten: false,
          autoShutdownRemainingSec: null,
          lastUpdated: 'Tắt toàn trường khẩn cấp',
        };
      });

      dbService.saveAllClassrooms(updatedRooms).catch(console.error);
      return updatedRooms;
    });
    addHardwareLog(
      'smartclass/broadcast/cmd',
      '{"cmd":"GLOBAL_EMERGENCY_ALL_OFF"}',
      'OUT',
      'COMMAND'
    );
  }, [addHardwareLog, requirePerm]);

  const cancelAutoShutdown = useCallback((classroomId: string) => {
    if (!requirePerm('CONTROL_DEVICE', classroomId)) return;
    setClassrooms((prev) =>
      prev.map((cr) => {
        if (cr.id !== classroomId) return cr;
        return {
          ...cr,
          autoShutdownRemainingSec: null,
          warningForgotten: false,
          vacantDurationMinutes: 0,
        };
      })
    );
    addHardwareLog(
      `smartclass/${classroomId}/cmd`,
      '{"cmd":"CANCEL_AUTO_OFF_TIMER"}',
      'OUT',
      'COMMAND'
    );
  }, [addHardwareLog, requirePerm]);

  const toggleHardCutoff = useCallback((classroomId: string) => {
    if (!requirePerm('CONTROL_DEVICE', classroomId)) return;
    setClassrooms((prev) =>
      prev.map((cr) => {
        if (cr.id !== classroomId) return cr;
        const nextHardCutoff = !cr.isHardCutoff;

        let updatedDevices = cr.devices;
        if (nextHardCutoff) {
          // If cutting off completely, ensure all devices are off
          updatedDevices = cr.devices.map((d) => ({
            ...d,
            isOn: false,
            currentPowerW: 0,
            relayState: 'OPEN' as const,
          }));
        }

        const updatedRoom = recalcClassroomElectrics({
          ...cr,
          isHardCutoff: nextHardCutoff,
          devices: updatedDevices,
          lastUpdated: nextHardCutoff ? 'Đã ngắt Aptomat (0W)' : 'Khôi phục nguồn chờ ESP32 (6.5W)',
        });

        addHardwareLog(
          `smartclass/${cr.code}/cmd`,
          JSON.stringify({ cmd: nextHardCutoff ? 'HARD_CUTOFF_0W' : 'STANDBY_MODE_6.5W' }),
          'OUT',
          'COMMAND'
        );

        supabaseService.saveClassroom(updatedRoom).catch(console.error);
        dbService.saveClassroom(updatedRoom).catch(console.error);
        return updatedRoom;
      })
    );
  }, [addHardwareLog, requirePerm]);

  const simulateScenario = useCallback(
    (scenario: 'leave_empty_forget' | 'students_enter' | 'auto_shutdown_now') => {
      if (!requirePerm('SIMULATE_SCENARIO')) return;
      if (scenario === 'leave_empty_forget') {
        playWarningBeep();
        setClassrooms((prev) =>
          prev.map((cr) => {
            if (cr.id === selectedClassroomId) {
              const devices = cr.devices.map((d) => {
                if (d.type === 'ac' || d.type === 'light') {
                  return { ...d, isOn: true, relayState: 'CLOSED' as const };
                }
                return d;
              });
              return recalcClassroomElectrics({
                ...cr,
                devices,
                isVacant: true,
                vacantDurationMinutes: 15,
                hasMotion: 0,
                warningForgotten: true,
                autoShutdownRemainingSec: 30,
              });
            }
            return cr;
          })
        );
      } else if (scenario === 'students_enter') {
        playRelayClick('on');
        setClassrooms((prev) =>
          prev.map((cr) => {
            if (cr.id === selectedClassroomId) {
              return {
                ...cr,
                isVacant: false,
                vacantDurationMinutes: 0,
                hasMotion: 45,
                warningForgotten: false,
                autoShutdownRemainingSec: null,
              };
            }
            return cr;
          })
        );
      } else if (scenario === 'auto_shutdown_now') {
        turnAllOff(selectedClassroomId);
      }
    },
    [selectedClassroomId, turnAllOff, requirePerm]
  );

  const toggleRule = useCallback((ruleId: string) => {
    if (!requirePerm('CONFIG_SCHEDULE')) return;
    setAutomationRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  }, [requirePerm]);

  // 1-second interval ticker for countdowns and live telemetry micro-variations
  useEffect(() => {
    const timer = setInterval(() => {
      setClassrooms((prev) =>
        prev.map((cr) => {
          let updated = { ...cr };

          if (updated.autoShutdownRemainingSec !== null && updated.autoShutdownRemainingSec > 0) {
            const nextSec = updated.autoShutdownRemainingSec - 1;
            if (nextSec <= 0) {
              playRelayClick('off');
              const turnedOff = updated.devices.map((d) => ({
                ...d,
                isOn: false,
                currentPowerW: 0,
                relayState: 'OPEN' as const,
              }));
              addHardwareLog(
                `smartclass/${cr.code}/event`,
                '{"event":"AUTO_SHUTDOWN_TRIGGERED_RELAYS_OPENED"}',
                'IN',
                'ALARM'
              );
              return {
                ...updated,
                devices: turnedOff,
                totalPowerW: 6.5,
                currentA: 0.03,
                apparentPowerVA: 7,
                reactivePowerVAR: 1,
                isVacant: true,
                hasMotion: 0,
                vacantDurationMinutes: 0,
                warningForgotten: false,
                autoShutdownRemainingSec: null,
                lastUpdated: 'Vừa tự động ngắt relay bảo vệ!',
              };
            } else {
              if (nextSec % 10 === 0 && nextSec <= 30) {
                playWarningBeep();
              }
              updated = { ...updated, autoShutdownRemainingSec: nextSec };
            }
          }

          const vJitter = Number((24.0 + Math.sin(Date.now() / 3000) * 0.3).toFixed(1));
          updated.voltageV = vJitter;

          return updated;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [addHardwareLog]);

  const selectedClassroom =
    classrooms.find((c) => c.id === selectedClassroomId) || classrooms[0] || DEFAULT_EMPTY_ROOM;

  const activeRoomCount = classrooms.filter((c) =>
    c.devices.some((d) => d.isOn)
  ).length;

  const totalCampusPowerW = classrooms.reduce(
    (sum, c) => sum + c.totalPowerW,
    0
  );

  const totalEnergyTodayKWh = Number(
    classrooms.reduce((sum, c) => sum + c.energyTodayKWh, 0).toFixed(2)
  );

  const alertCount = classrooms.filter(
    (c) => c.warningForgotten || (c.autoShutdownRemainingSec !== null && c.autoShutdownRemainingSec > 0)
  ).length;

  return (
    <ClassroomContext.Provider
      value={{
        classrooms,
        selectedClassroomId,
        selectedClassroom,
        setSelectedClassroomId,
        toggleDevice,
        setAcTemperature,
        setAcMode,
        setFanSpeed,
        turnAllOff,
        turnAllOn,
        globalAllOff,
        simulateScenario,
        cancelAutoShutdown,
        automationRules,
        toggleRule,
        hardwareLogs,
        soundEnabled: soundActive,
        toggleSound,
        activeRoomCount,
        totalCampusPowerW,
        totalEnergyTodayKWh,
        alertCount,
        includeVat,
        setIncludeVat,
        dbSyncStatus,
        supabaseStatus,
        supabaseRoomCount,
        isSupabasePrimary,
        sourceTable,
        refreshFromSupabase,
        seedSupabaseClassrooms,
        addSupabaseRoom,
        deleteRoom,
        addDeviceToRoom,
        deleteDeviceFromRoom,
        loadDemoClassrooms,
        toggleHardCutoff,
        authNotice,
        clearAuthNotice,
        isReadOnlySession,
      }}
    >
      {children}
      {authNotice && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-rose-950/95 border-2 border-rose-600 rounded-xl p-4 shadow-2xl text-rose-100 flex items-start gap-3 backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="p-2 rounded-lg bg-rose-600/30 text-rose-300 shrink-0 mt-0.5">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
          </div>
          <div className="flex-1 text-xs space-y-1.5">
            <p className="font-bold text-sm text-white flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-rose-400" />
              Thao Tác Bị Khóa
            </p>
            <p className="text-rose-200 leading-relaxed">{authNotice}</p>
            {!currentUser && (
              <button
                onClick={() => {
                  clearAuthNotice();
                  openLoginModal();
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-md font-semibold text-xs transition-colors shadow-sm"
              >
                <LogIn className="h-3.5 w-3.5" />
                Đăng Nhập Để Thao Tác
              </button>
            )}
          </div>
          <button
            onClick={clearAuthNotice}
            className="p-1 text-rose-400 hover:text-white rounded hover:bg-rose-900/50"
            title="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </ClassroomContext.Provider>
  );
};

export const useClassroom = () => {
  const context = useContext(ClassroomContext);
  if (!context) {
    throw new Error('useClassroom must be used within ClassroomProvider');
  }
  return context;
};
