import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { supabaseService } from './supabaseService';
import { Classroom, AutomationRule } from '../types';
import { INITIAL_CLASSROOMS, INITIAL_AUTOMATION_RULES } from '../data/mockData';

const CLASSROOMS_COLLECTION = 'classrooms';
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

  // Lưu cấu hình hệ thống (như quy tắc tự động hoặc âm thanh)
  async saveAutomationRules(rules: AutomationRule[]): Promise<void> {
    const docPath = `${SETTINGS_COLLECTION}/automation`;
    try {
      await setDoc(doc(db, SETTINGS_COLLECTION, 'automation'), { rules, updatedAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }
};
