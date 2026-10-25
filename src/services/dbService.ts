import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { supabaseService } from './supabaseService';
import { Classroom, AutomationRule, TimetableSlot } from '../types';
import { INITIAL_CLASSROOMS, INITIAL_AUTOMATION_RULES } from '../data/mockData';

const CLASSROOMS_COLLECTION = 'classrooms';
const SCHEDULES_COLLECTION = 'schedules';
const SETTINGS_COLLECTION = 'settings';

export const dbService = {
  // Đồng bộ khởi tạo dữ liệu phòng học lên database nếu chưa có
  async initClassroomsIfEmpty(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, CLASSROOMS_COLLECTION));
      if (snap.empty) {
        console.log('[Database] Chưa có phòng học nào trên Cloud Database, tiến hành nạp cấu hình thực tế...');
        const batch = writeBatch(db);
        for (const cr of INITIAL_CLASSROOMS) {
          const docRef = doc(db, CLASSROOMS_COLLECTION, cr.id);
          batch.set(docRef, cr);
        }
        await batch.commit();
        console.log('[Database] Nạp thành công 5 phòng học lên Cloud Database.');
      }
    } catch (err) {
      console.warn('[Database] initClassroomsIfEmpty fallback:', err);
    }
  },

  // Lắng nghe realtime từ Firestore cho danh sách phòng học
  subscribeClassrooms(
    onData: (rooms: Classroom[]) => void,
    onError?: (err: Error) => void
  ) {
    return onSnapshot(
      collection(db, CLASSROOMS_COLLECTION),
      (snapshot) => {
        if (!snapshot.empty) {
          const rooms: Classroom[] = [];
          snapshot.forEach((d) => {
            rooms.push(d.data() as Classroom);
          });
          // Giữ đúng thứ tự mã phòng A101 -> B202
          rooms.sort((a, b) => a.id.localeCompare(b.id));
          onData(rooms);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, CLASSROOMS_COLLECTION);
        if (onError) onError(error);
      }
    );
  },

  // Cập nhật 1 phòng học lên database
  async saveClassroom(classroom: Classroom): Promise<void> {
    const docPath = `${CLASSROOMS_COLLECTION}/${classroom.id}`;
    try {
      await setDoc(doc(db, CLASSROOMS_COLLECTION, classroom.id), classroom, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }

    // Đồng bộ sang Supabase (nếu đã cấu hình)
    if (supabaseService.isConfigured()) {
      supabaseService.saveClassroom(classroom).catch((err) => {
        console.warn('[Supabase Sync Warning]:', err);
      });
    }
  },

  // Cập nhật trạng thái nhiều phòng (ví dụ: Tắt toàn trường)
  async saveAllClassrooms(classrooms: Classroom[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const cr of classrooms) {
        const docRef = doc(db, CLASSROOMS_COLLECTION, cr.id);
        batch.set(docRef, cr, { merge: true });
      }
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, CLASSROOMS_COLLECTION);
    }

    // Đồng bộ sang Supabase (nếu đã cấu hình)
    if (supabaseService.isConfigured()) {
      supabaseService.saveAllClassrooms(classrooms).catch((err: unknown) => {
        console.warn('[Supabase Sync Warning]:', err);
      });
    }
  },

  // Xóa 1 phòng học khỏi database Cloud và Supabase
  async deleteClassroom(classroomId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, CLASSROOMS_COLLECTION, classroomId));
    } catch (error) {
      console.warn('[Firestore] deleteClassroom error:', error);
    }

    if (supabaseService.isConfigured()) {
      supabaseService.deleteRoom(classroomId).catch((err: unknown) => {
        console.warn('[Supabase Delete Sync Warning]:', err);
      });
    }
  },

  // Lưu cấu hình hệ thống (như quy tắc tự động hoặc âm thanh)
  async saveAutomationRules(rules: AutomationRule[]): Promise<void> {
    const docPath = `${SETTINGS_COLLECTION}/automation`;
    try {
      await setDoc(doc(db, SETTINGS_COLLECTION, 'automation'), { rules, updatedAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  // Lưu thông tin người dùng vào Firestore
  async saveUser(user: any): Promise<void> {
    const docPath = `users/${user.id}`;
    try {
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
    } catch (error) {
      console.warn('[Firestore] saveUser warning:', error);
    }
  },

  // Xóa người dùng khỏi Firestore
  async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      console.warn('[Firestore] deleteUser warning:', error);
    }
  },

  // Lấy toàn bộ người dùng đã đăng ký từ Firestore
  async fetchUsers(): Promise<any[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: any[] = [];
      snap.forEach((d) => {
        list.push(d.data());
      });
      return list;
    } catch (err) {
      console.warn('[Firestore] fetchUsers error:', err);
      return [];
    }
  },

  // Lưu lịch học vụ vào Firestore collection 'schedules'
  async saveSchedule(slot: TimetableSlot): Promise<void> {
    const docPath = `${SCHEDULES_COLLECTION}/${slot.id}`;
    try {
      await setDoc(doc(db, SCHEDULES_COLLECTION, slot.id), {
        ...slot,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.warn('[Firestore] saveSchedule warning:', error);
    }
  },

  // Xóa lịch học vụ khỏi Firestore collection 'schedules'
  async deleteSchedule(slotId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, SCHEDULES_COLLECTION, slotId));
    } catch (error) {
      console.warn('[Firestore] deleteSchedule warning:', error);
    }
  },

  // Lấy toàn bộ lịch học vụ từ Firestore
  async fetchSchedules(): Promise<TimetableSlot[]> {
    try {
      const snap = await getDocs(collection(db, SCHEDULES_COLLECTION));
      const list: TimetableSlot[] = [];
      snap.forEach((d) => {
        list.push(d.data() as TimetableSlot);
      });
      return list;
    } catch (err) {
      console.warn('[Firestore] fetchSchedules error:', err);
      return [];
    }
  }
};
