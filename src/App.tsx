/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ClassroomProvider } from './context/ClassroomContext';
import { Header, ActiveTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { RoomPanelTouch } from './components/RoomPanelTouch';
import { ScheduleAutomationView } from './components/ScheduleAutomationView';
import { AnalyticsView } from './components/AnalyticsView';
import { DatabaseManagementView } from './components/DatabaseManagementView';
import { LoginView } from './components/LoginView';
import { LoginModal } from './components/LoginModal';
import { PermissionsModal } from './components/PermissionsModal';

function MainApp() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Khi khởi động web luôn bắt đầu bằng đăng nhập trước
  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Global Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'touch_panel' && <RoomPanelTouch />}
        {activeTab === 'schedule' && <ScheduleAutomationView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'database' && <DatabaseManagementView />}
      </main>

      {/* Smart Campus System Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-300">
              SmartClass Energy · Hệ thống Giám sát & Quản lý Năng lượng Phòng học Thông minh
            </span>
            <span className="text-slate-400 block sm:inline sm:ml-2">
              · Nền tảng IoT Giám sát thời gian thực & Tự động hóa ngắt điện an toàn
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Vi điều khiển ESP32</span>
            <span>·</span>
            <span>Module PZEM-004T v3.0</span>
            <span>·</span>
            <span>Relay 220V Contactor</span>
            <span>·</span>
            <span>Cơ sở dữ liệu Supabase</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ClassroomProvider>
        <MainApp />
        <LoginModal />
        <PermissionsModal />
      </ClassroomProvider>
    </AuthProvider>
  );
}
