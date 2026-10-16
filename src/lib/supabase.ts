import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration provided by user / environment:
// New Supabase Project: vvxieqsotbfhymaiqngb
const rawUrl =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.NEXT_PUBLIC_SUPABASE_URL ||
      import.meta.env?.VITE_SUPABASE_URL ||
      import.meta.env?.SUPABASE_URL)) ||
  'https://vvxieqsotbfhymaiqngb.supabase.co';

const rawKey =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env?.VITE_SUPABASE_ANON_KEY ||
      import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env?.SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env?.SUPABASE_ANON_KEY)) ||
  'sb_publishable_1Mix0ghq8t1un6GGAx-foA_PbkoMLlZ';

// Standard Supabase project endpoint (trimmed of /rest/v1/ suffix for @supabase/supabase-js)
export const projectUrl = String(rawUrl).trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const supabaseUrl = projectUrl;
export const supabaseKey = String(rawKey).trim();
export const SUPABASE_URL = projectUrl;
export const SUPABASE_ANON_KEY = supabaseKey;

// Primary initialized Supabase client instance
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function getSupabaseClient(): SupabaseClient {
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.trim().length > 0);
}

export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  status: 'connected' | 'missing_key' | 'error';
  message: string;
  roomCount?: number;
}> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      status: 'missing_key',
      message: 'Chưa cấu hình Supabase Key để xác thực API.'
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      status: 'error',
      message: 'Không thể khởi tạo client Supabase.'
    };
  }

  try {
    // Check primary 'rooms' table first
    const { data: rooms, error: roomsError, count: roomsCount } = await client
      .from('rooms')
      .select('*', { count: 'exact', head: true });

    if (!roomsError) {
      const count = roomsCount ?? (rooms ? rooms.length : 0);
      return {
        connected: true,
        status: 'connected',
        message: `Kết nối Supabase thành công! Bảng 'rooms' có ${count} phòng học.`,
        roomCount: count
      };
    }

    // If 'rooms' not found, check 'classrooms' table
    const { data: classrooms, error: classError, count: classCount } = await client
      .from('classrooms')
      .select('*', { count: 'exact', head: true });

    if (!classError) {
      const count = classCount ?? (classrooms ? classrooms.length : 0);
      return {
        connected: true,
        status: 'connected',
        message: `Kết nối Supabase thành công! Bảng 'classrooms' có ${count} phòng học.`,
        roomCount: count
      };
    }

    // If neither table exists yet, client is still authenticated
    if (
      roomsError.code === '42P01' ||
      roomsError.code === 'PGRST205' ||
      roomsError.message?.includes('not find the table')
    ) {
      return {
        connected: true,
        status: 'connected',
        message: 'Kết nối API Supabase thành công! (Chưa có bảng rooms hoặc classrooms).',
        roomCount: 0
      };
    }

    return {
      connected: false,
      status: 'error',
      message: `Lỗi kết nối Supabase: ${roomsError.message} (${roomsError.code || ''})`
    };
  } catch (err) {
    return {
      connected: false,
      status: 'error',
      message: err instanceof Error ? err.message : 'Lỗi kết nối tới Supabase'
    };
  }
}
