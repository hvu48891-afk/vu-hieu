import React from 'react';
import { Classroom } from '../types';
import { AlertTriangle, Trash2, X, ShieldAlert, Database, Loader2 } from 'lucide-react';

interface DeleteRoomModalProps {
  isOpen: boolean;
  classroom: Classroom | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  errorMessage?: string | null;
  rlsBlocked?: boolean;
}

export const DeleteRoomModal: React.FC<DeleteRoomModalProps> = ({
  isOpen,
  classroom,
  onClose,
  onConfirm,
  isDeleting,
  errorMessage,
  rlsBlocked,
}) => {
  if (!isOpen || !classroom) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md text-slate-100 overflow-hidden flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-rose-950/20">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Xác Nhận Xóa Phòng Học</h3>
              <p className="text-xs text-rose-300/80">Thao tác này sẽ xóa vĩnh viễn dữ liệu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white">{classroom.name}</span>
              <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                {classroom.code}
              </span>
            </div>
            <div className="text-slate-400 text-[11px] flex items-center gap-3">
              <span>Tòa nhà: <strong className="text-slate-200">{classroom.building}</strong></span>
              <span>Tầng: <strong className="text-slate-200">{classroom.floor}</strong></span>
              <span>Thiết bị: <strong className="text-slate-200">{classroom.devices.length} phụ tải</strong></span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/50 flex items-start gap-2.5 text-rose-200">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-xs">Cảnh báo xóa dữ liệu:</p>
              <p className="text-[11px] text-rose-300/90 mt-0.5 leading-relaxed">
                Phòng học <strong>{classroom.code}</strong> cùng toàn bộ các thiết bị (đèn, điều hòa, quạt, máy chiếu) và lịch trình sẽ bị xóa khỏi cơ sở dữ liệu Supabase và hệ thống giám sát.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-xs text-red-200 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldAlert className="h-4 w-4 text-red-400" />
                <span>Không thể xóa phòng học</span>
              </div>
              <p className="text-[11px] leading-relaxed">{errorMessage}</p>
              {rlsBlocked && (
                <div className="text-[10px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                  <span>Chính sách RLS của Supabase đang chặn quyền DELETE. Vui lòng cấp quyền trong SQL Editor:</span>
                  <pre className="mt-1 text-cyan-300 font-mono">CREATE POLICY "Allow All Delete" ON public.rooms FOR DELETE USING (true);</pre>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span>Đồng bộ tự động với Supabase table: <code className="text-slate-300">public.rooms</code></span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Xác nhận xóa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
