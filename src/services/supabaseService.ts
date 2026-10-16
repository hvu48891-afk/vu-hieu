import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { Classroom, Device, HardwareLog } from '../types';
import { INITIAL_CLASSROOMS } from '../data/mockData';

// Helper to create realistic devices for a room if devices table does not have records yet
function createDefaultRoomDevices(roomId: string, code: string): Device[] {
  return [
    {
      id: `dev-${roomId}-light-1`,
      name: `Hệ Thống Đèn LED Chiếu Sáng (${code})`,
      brandModel: 'Rạng Đông LED Tube 18W x 6 bóng',
      type: 'light',
      isOn: true,
      powerRatingW: 108,
      currentPowerW: 108,
      nominalCurrentA: 0.52,
      relayPin: 'GPIO 16 (Relay 1)',
      relayState: 'CLOSED',
    },
    {
      id: `dev-${roomId}-ac-1`,
      name: `Điều Hòa Không Khí 2.5HP (${code})`,
      brandModel: 'Daikin Inverter FTKC60UVMV',
      type: 'ac',
      isOn: true,
      powerRatingW: 1950,
      currentPowerW: 1420,
      nominalCurrentA: 8.86,
      relayPin: 'GPIO 21 (Contactor 30A)',
      relayState: 'CLOSED',
      acSettings: {
        targetTemp: 24,
        mode: 'cool',
        fanSpeed: 'med',
      },
    },
    {
      id: `dev-${roomId}-fan-1`,
      name: `Quạt Trần Đảo Gió (${code})`,
      brandModel: 'Vinawind QT-1400 75W',
      type: 'fan',
      isOn: false,
      powerRatingW: 75,
      currentPowerW: 0,
      nominalCurrentA: 0.35,
      relayPin: 'GPIO 17 (Relay 2)',
      relayState: 'OPEN',
      fanSpeed: 2,
    },
    {
      id: `dev-${roomId}-proj-1`,
      name: `Máy Chiếu Giảng Đường (${code})`,
      brandModel: 'Panasonic PT-VMZ51 350W',
      type: 'projector',
      isOn: true,
      powerRatingW: 350,
      currentPowerW: 320,
      nominalCurrentA: 1.55,
      relayPin: 'GPIO 19 (Relay 3)',
      relayState: 'CLOSED',
    },
  ];
}

// Convert a Supabase 'rooms' row into a full Classroom model
function mapRoomRowToClassroom(row: any, devicesFromDb: any[], schedulesFromDb: any[] = []): Classroom {
  const roomId = row.id ?? row.room_id;
  const roomIdStr = String(roomId);
  const name = row.room_name || row.name || `Phòng học ${roomIdStr}`;
  const codeMatch = name.match(/([A-Z][0-9]{2,4}|[A-Z]-[0-9]{2,4}|[A-Za-z0-9]+)/);
  const code = row.code || (codeMatch ? codeMatch[0] : `P${roomIdStr}`);
  const building = row.building || 'Khu A';
  const isActive = row.is_active ?? true;

  // Filter devices belonging to this room from Supabase 'devices' table
  const matchedDevs = devicesFromDb.filter((d: any) => String(d.room_id) === roomIdStr);

  let devices: Device[];
  if (matchedDevs.length > 0) {
    devices = matchedDevs.map((d: any, idx: number) => {
      const devType = (['light', 'fan', 'ac', 'projector', 'aux'].includes(d.device_type)
        ? d.device_type
        : 'light') as Device['type'];
      const isOn = Boolean(d.is_on);
      const rating = Number(d.power_rating_watts) || (devType === 'ac' ? 1850 : devType === 'projector' ? 350 : devType === 'fan' ? 75 : 216);
      const currentPower = isOn ? (devType === 'ac' ? Math.round(rating * 0.77) : rating) : 0;
      const targetTemp = d.target_temperature != null ? Number(d.target_temperature) : 24;

      return {
        id: String(d.id ?? d.device_id ?? `dev-${roomIdStr}-${idx}`),
        name: d.device_name || `Thiết bị ${d.id}`,
        brandModel: d.model || (devType === 'ac' ? 'Daikin Inverter 2.5HP FTKC60' : devType === 'light' ? 'Rạng Đông LED Tube 18W' : devType === 'fan' ? 'Vinawind QT-1400 75W' : 'Panasonic Laser PT-VMZ51'),
        type: devType,
        isOn,
        powerRatingW: rating,
        currentPowerW: currentPower,
        nominalCurrentA: Number((rating / 220).toFixed(2)),
        relayPin: `GPIO ${16 + (idx % 6)}`,
        relayState: isOn ? 'CLOSED' : 'OPEN',
        ...(devType === 'ac'
          ? {
              acSettings: {
                targetTemp,
                mode: 'cool' as const,
                fanSpeed: 'med' as const,
              },
            }
          : {}),
      };
    });
  } else {
    devices = createDefaultRoomDevices(roomIdStr, code);
  }

  // Filter schedules from database for this room
  const matchedSchedules = schedulesFromDb.filter((s: any) => String(s.room_id) === roomIdStr);
  const timetable = matchedSchedules.map((s: any, idx: number) => ({
    id: `sched-${s.id || idx}`,
    period: s.schedule_name || `Lịch ${idx + 1}`,
    startTime: (s.start_time || '07:00').substring(0, 5),
    endTime: (s.end_time || '11:30').substring(0, 5),
    subject: s.schedule_name || 'Lịch học vụ tự động',
    lecturer: s.action_command === 'TURN_ON' ? 'Tự động kích hoạt thiết bị' : s.action_command === 'TURN_OFF' ? 'Tự động ngắt điện chống lãng phí' : `Cài đặt nhiệt độ ${s.target_value || 25}°C`,
    classGroup: s.days_of_week || 'T2-T7',
    isActiveNow: Boolean(s.is_enabled),
  }));

  const rawDevicesPower = devices.reduce((sum, d) => sum + (d.isOn ? d.currentPowerW : 0), 0);
  const totalPowerW = rawDevicesPower === 0 ? 6.5 : rawDevicesPower;
  const voltageV = 221.4;
  const currentA = Number((totalPowerW / (voltageV * 0.96)).toFixed(2));
  const apparentPowerVA = Math.round(voltageV * currentA);
  const reactivePowerVAR = Math.round(Math.sqrt(Math.max(0, apparentPowerVA * apparentPowerVA - totalPowerW * totalPowerW)));

  return {
    id: `cr-${roomIdStr}`,
    code,
    name,
    building,
    floor: parseInt(code.replace(/[^0-9]/g, '').slice(0, 1) || '1', 10),
    capacity: 50,
    roomAreaM2: 72,
    temperature: 24.5,
    humidity: 58,
    hasMotion: isActive ? 40 : 0,
    isVacant: !isActive,
    vacantDurationMinutes: isActive ? 0 : 25,
    voltageV,
    currentA,
    totalPowerW,
    apparentPowerVA,
    reactivePowerVAR,
    frequencyHz: 50.0,
    powerFactor: 0.96,
    energyTodayKWh: Number((totalPowerW > 0 ? (totalPowerW * 4.5) / 1000 : 0.8).toFixed(2)),
    devices,
    timetable,
    warningForgotten: false,
    autoShutdownRemainingSec: null,
    lastUpdated: 'Đồng bộ Supabase',
  };
}

export const supabaseService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  /**
   * Fetches classrooms directly from Supabase.
   * Checks table 'rooms' first (with linked 'devices' and 'schedules'), falling back to 'classrooms'.
   * Returns an array of Classroom (may be empty if table has 0 rows).
   * Returns null only if database query fails or tables don't exist.
   */
  async fetchClassrooms(): Promise<{
    classrooms: Classroom[];
    sourceTable: 'rooms' | 'classrooms' | 'none';
    rawCount: number;
  } | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      // 1. Try querying table 'rooms' (User's real Supabase table)
      const { data: roomsData, error: roomsError, count: roomsCount } = await supabase
        .from('rooms')
        .select('*', { count: 'exact' });

      if (!roomsError && roomsData !== null) {
        // Query associated devices if available
        let devicesData: any[] = [];
        try {
          const { data: devRows } = await supabase.from('devices').select('*');
          if (devRows) devicesData = devRows;
        } catch (e) {
          console.warn('[Supabase] Could not query devices table:', e);
        }

        // Query associated schedules if available
        let schedulesData: any[] = [];
        try {
          const { data: schedRows } = await supabase.from('schedules').select('*');
          if (schedRows) schedulesData = schedRows;
        } catch (e) {
          console.warn('[Supabase] Could not query schedules table:', e);
        }

        // Sort rooms by id numerically or by code
        const sortedRooms = [...roomsData].sort((a, b) => {
          const aId = Number(a.id ?? a.room_id) || 0;
          const bId = Number(b.id ?? b.room_id) || 0;
          return aId - bId;
        });

        const classrooms = sortedRooms.map((row) =>
          mapRoomRowToClassroom(row, devicesData, schedulesData)
        );

        return {
          classrooms,
          sourceTable: 'rooms',
          rawCount: roomsCount ?? roomsData.length,
        };
      }

      // 2. Fallback: try table 'classrooms'
      const { data: classData, error: classError, count: classCount } = await supabase
        .from('classrooms')
        .select('*', { count: 'exact' });

      if (!classError && classData !== null) {
        const sortedClassrooms = [...classData].sort((a, b) => String(a.id).localeCompare(String(b.id)));
        const classrooms = sortedClassrooms.map((row: any) => ({
          ...row.data,
          id: row.id,
          code: row.code || row.data?.code,
          name: row.name || row.data?.name,
        })) as Classroom[];

        return {
          classrooms,
          sourceTable: 'classrooms',
          rawCount: classCount ?? classData.length,
        };
      }

      console.warn('[Supabase] Neither "rooms" nor "classrooms" found in schema cache:', {
        roomsError: roomsError?.message,
        classError: classError?.message,
      });
      return null;
    } catch (err) {
      console.warn('[Supabase] fetchClassrooms exception:', err);
      return null;
    }
  },

  /**
   * Subscribe to realtime Postgres changes on 'rooms', 'devices', and 'schedules'
   */
  subscribeToRooms(onUpdate: () => void): () => void {
    const supabase = getSupabaseClient();
    if (!supabase) return () => {};

    try {
      const channel = supabase
        .channel('public-rooms-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
          console.log('[Supabase Realtime] Rooms table changed, triggering re-fetch...');
          onUpdate();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
          console.log('[Supabase Realtime] Devices table changed, triggering re-fetch...');
          onUpdate();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
          console.log('[Supabase Realtime] Schedules table changed, triggering re-fetch...');
          onUpdate();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classrooms' }, () => {
          console.log('[Supabase Realtime] Classrooms table changed, triggering re-fetch...');
          onUpdate();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('[Supabase] Could not establish realtime channel:', e);
      return () => {};
    }
  },

  /**
   * Save / update a classroom and its devices to Supabase
   */
  async saveClassroom(classroom: Classroom): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Client not initialized' };

    try {
      const numericId = parseInt(classroom.id.replace(/[^0-9]/g, ''), 10);
      const isAnyDeviceOn = classroom.devices.some((d) => d.isOn);

      // If 'rooms' table exists, update room status
      if (!isNaN(numericId)) {
        await supabase
          .from('rooms')
          .update({
            room_name: classroom.name,
            building: classroom.building,
            is_active: isAnyDeviceOn,
          })
          .eq('id', numericId);

        // Update devices in 'devices' table
        for (const dev of classroom.devices) {
          const devNumId = parseInt(dev.id.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(devNumId)) {
            const updatePayload: Record<string, any> = {
              is_on: dev.isOn,
            };
            if (dev.type === 'ac' && dev.acSettings) {
              updatePayload.target_temperature = dev.acSettings.targetTemp;
            }
            await supabase
              .from('devices')
              .update(updatePayload)
              .eq('id', devNumId);
          }
        }
      }

      // Also attempt upsert into 'classrooms' if the table exists
      try {
        await supabase
          .from('classrooms')
          .upsert(
            {
              id: classroom.id,
              code: classroom.code,
              name: classroom.name,
              building: classroom.building,
              total_power_w: classroom.totalPowerW,
              current_a: classroom.currentA,
              temperature: classroom.temperature,
              is_vacant: classroom.isVacant,
              updated_at: new Date().toISOString(),
              data: classroom,
            },
            { onConflict: 'id' }
          );
      } catch {
        // Table 'classrooms' may not exist, which is fine
      }

      return { success: true };
    } catch (err) {
      console.warn('[Supabase] saveClassroom exception:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  async saveAllClassrooms(classrooms: Classroom[]): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      for (const cr of classrooms) {
        await this.saveClassroom(cr);
      }
      return true;
    } catch (err) {
      console.warn('[Supabase] saveAllClassrooms exception:', err);
      return false;
    }
  },

  /**
   * Add a new room into the Supabase database
   */
  async addRoom(
    roomName: string,
    building: string = 'Khu A',
    customDevices?: Array<{
      name: string;
      type: string;
      powerRatingW: number;
      isOn: boolean;
      targetTemp?: number;
    }>
  ): Promise<{ success: boolean; error?: string; rlsBlocked?: boolean; data?: any; roomId?: number }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Client not initialized' };

    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert([{ room_name: roomName, building, is_active: true }])
        .select();

      if (error) {
        const isRls = error.code === '42501' || error.message.includes('row-level security');
        return {
          success: false,
          error: error.message,
          rlsBlocked: isRls,
        };
      }

      // Also create devices in devices table if room was created
      if (data && data[0]?.id) {
        const roomId = data[0].id;
        try {
          if (customDevices && customDevices.length > 0) {
            const devRows = customDevices.map((d) => ({
              room_id: roomId,
              device_name: d.name,
              device_type: d.type,
              is_on: d.isOn,
              power_rating_watts: d.powerRatingW,
              ...(d.type === 'ac' ? { target_temperature: d.targetTemp || 24 } : {}),
            }));
            await supabase.from('devices').insert(devRows);
          } else {
            await supabase.from('devices').insert([
              { room_id: roomId, device_name: 'Đèn LED Chiếu Sáng (6 bộ 36W)', device_type: 'light', is_on: true, power_rating_watts: 216 },
              { room_id: roomId, device_name: 'Điều Hòa Daikin Inverter 2.5HP', device_type: 'ac', is_on: true, target_temperature: 24, power_rating_watts: 1850 },
              { room_id: roomId, device_name: 'Quạt Trần Vinawind 75W', device_type: 'fan', is_on: false, power_rating_watts: 75 },
              { room_id: roomId, device_name: 'Máy Chiếu Panasonic Laser 350W', device_type: 'projector', is_on: true, power_rating_watts: 350 },
            ]);
          }
        } catch (e) {
          console.warn('[Supabase] Could not insert default devices:', e);
        }
        return { success: true, data, roomId };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown exception' };
    }
  },

  /**
   * Delete a room from Supabase ('rooms' + linked 'devices' and 'schedules')
   */
  async deleteRoom(
    roomIdOrCode: string
  ): Promise<{ success: boolean; error?: string; rlsBlocked?: boolean }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Client not initialized' };

    try {
      // 1. Extract numeric id if format is "cr-1", "1", etc.
      const cleanNumericId = roomIdOrCode.replace(/^cr-/, '');
      const numId = parseInt(cleanNumericId, 10);

      if (!isNaN(numId)) {
        // Delete related child rows first to avoid foreign key constraints
        try {
          await supabase.from('devices').delete().eq('room_id', numId);
        } catch (e) {
          console.warn('[Supabase] Warning deleting child devices:', e);
        }
        try {
          await supabase.from('schedules').delete().eq('room_id', numId);
        } catch (e) {
          console.warn('[Supabase] Warning deleting child schedules:', e);
        }

        const { error: roomsError } = await supabase.from('rooms').delete().eq('id', numId);
        if (roomsError) {
          const isRls = roomsError.code === '42501' || roomsError.message.includes('row-level security');
          return {
            success: false,
            error: roomsError.message,
            rlsBlocked: isRls,
          };
        }
      }

      // 2. Also try deleting by room_name or code if string
      try {
        await supabase.from('rooms').delete().eq('room_name', roomIdOrCode);
      } catch {
        // ignore
      }

      // 3. Fallback: also delete from 'classrooms' table if exists
      try {
        await supabase.from('classrooms').delete().eq('id', roomIdOrCode);
      } catch {
        // ignore
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown exception while deleting room',
      };
    }
  },

  /**
   * Seed sample classrooms into Supabase ('rooms' + 'devices' or 'classrooms')
   */
  async seedSampleRooms(): Promise<{
    success: boolean;
    count: number;
    rlsBlocked?: boolean;
    error?: string;
  }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, count: 0, error: 'Client not configured' };

    const sampleRooms = [
      { room_name: 'Phòng học A101 - Smart Lab IoT', building: 'Khu A', is_active: true },
      { room_name: 'Phòng học A102 - Trung tâm R&D', building: 'Khu A', is_active: true },
      { room_name: 'Phòng học B204 - Giảng đường Đa Năng', building: 'Khu B', is_active: false },
      { room_name: 'Phòng học C305 - Thực hành Điện - Điện Tử', building: 'Khu C', is_active: true },
      { room_name: 'Phòng học H01 - Hội trường lớn 250 chỗ', building: 'Khu H', is_active: false },
    ];

    try {
      // Try inserting into 'rooms'
      const { data: insertedRooms, error: insertError } = await supabase
        .from('rooms')
        .insert(sampleRooms)
        .select();

      if (insertError) {
        const isRls = insertError.code === '42501' || insertError.message.includes('row-level security');
        return {
          success: false,
          count: 0,
          rlsBlocked: isRls,
          error: insertError.message,
        };
      }

      // If rooms inserted, also populate devices
      if (insertedRooms && insertedRooms.length > 0) {
        const deviceRows: any[] = [];
        insertedRooms.forEach((r) => {
          const rId = r.id;
          deviceRows.push(
            { room_id: rId, device_name: 'Đèn LED Chiếu Sáng (6 bộ 36W)', device_type: 'light', is_on: true, power_rating_watts: 216 },
            { room_id: rId, device_name: 'Điều Hòa Daikin Inverter 2.5HP', device_type: 'ac', is_on: true, target_temperature: 24, power_rating_watts: 1850 },
            { room_id: rId, device_name: 'Quạt Trần Vinawind 75W', device_type: 'fan', is_on: false, power_rating_watts: 75 },
            { room_id: rId, device_name: 'Máy Chiếu Panasonic Laser 350W', device_type: 'projector', is_on: true, power_rating_watts: 350 }
          );
        });

        try {
          await supabase.from('devices').insert(deviceRows);
        } catch (e) {
          console.warn('[Supabase] Inserting sample devices failed:', e);
        }

        return {
          success: true,
          count: insertedRooms.length,
        };
      }

      return { success: false, count: 0, error: 'No rooms returned from insert' };
    } catch (err) {
      return {
        success: false,
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown exception',
      };
    }
  },

  async logHardwareEvent(log: HardwareLog): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('hardware_logs').insert([
        {
          topic: log.topic,
          payload: log.payload,
          direction: log.direction,
          type: log.type,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.warn('[Supabase] logHardwareEvent error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[Supabase] logHardwareEvent exception:', err);
      return false;
    }
  },

  /**
   * Fetch all registered users from Supabase 'users' table
   */
  async fetchUsers(): Promise<Array<{
    id: number;
    username: string;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at?: string;
  }>> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && Array.isArray(data)) {
        return data;
      }
      if (error) {
        console.warn('[Supabase] fetchUsers notice:', error.message);
      }
    } catch (e) {
      console.warn('[Supabase] fetchUsers exception:', e);
    }
    return [];
  },

  /**
   * Register a new user and persist directly into Supabase 'users' table
   */
  async registerUser(userData: {
    name: string;
    email: string;
    username?: string;
    role: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Chưa khởi tạo client Supabase' };

    try {
      const cleanEmail = userData.email.trim().toLowerCase();
      const fallbackUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      const username = userData.username?.trim() || fallbackUsername;
      
      // Map role to database enum / string
      let dbRole = 'lecturer';
      const r = userData.role.toLowerCase();
      if (r === 'admin' || r === 'manager') dbRole = 'manager';
      else if (r === 'technician' || r === 'tech') dbRole = 'technician';
      else if (r === 'student') dbRole = 'student';
      else dbRole = 'lecturer';

      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            username,
            full_name: userData.name.trim(),
            email: cleanEmail,
            role: dbRole,
            is_active: true,
          },
        ])
        .select();

      if (error) {
        console.warn('[Supabase] registerUser error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data?.[0] };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Lỗi khi ghi tài khoản vào Supabase',
      };
    }
  },

  /**
   * Delete a user from Supabase 'users' table
   */
  async deleteUser(emailOrId: string | number): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Client not configured' };

    try {
      if (typeof emailOrId === 'number' || !isNaN(Number(emailOrId))) {
        await supabase.from('users').delete().eq('id', Number(emailOrId));
      } else {
        await supabase.from('users').delete().eq('email', emailOrId.toLowerCase());
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Error deleting user' };
    }
  },
};
