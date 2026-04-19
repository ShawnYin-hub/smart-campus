import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TopBar } from './components/layout/TopBar';
import { BottomNav, Screen } from './components/layout/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { AcademicScreen } from './components/AcademicScreen';
import { NotificationsScreen } from './components/NotificationsScreen';
import { RecognitionScreen } from './components/RecognitionScreen';
import { LeaveScreen } from './components/LeaveScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AuthScreen } from './components/AuthScreen';
import { Modal } from './components/ui/Modal';
import type { AppData, Course, Task, RecognitionHistory, LeaveRequest, Notification, AISummarizedNotice } from './types';

/**
 * INITIAL DATA WITH MOCKED AI INSIGHTS
 */
const INITIAL_DATA: AppData = {
  user: {
    name: "学生姓名",
    id: "学号",
    avatarUrl: "https://picsum.photos/seed/placeholder/200/200"
  },
  school: {
    name: "BHSFIC",
    logoUrl: "https://lh3.googleusercontent.com/aida/ADBb0ujlMi9G4I8FiJuz5WRpq_sQ1MnU2hb49KUNEyxAdk-gsB6ceAVz19X3CQA8veAot8fpF_HgGvp9ztulZ6CSl_F1Z7AMJJw1bHlyYZzlUbaSdzXssChkybU44igJtUpST8OyMBog9PpGD92IJmcj7yy6Leu6EKLTWVACHxVo8hYe3IzPi7gKpRHMm2vachKNn6RQT1DUnLYbidEikoaXnrLhyX4XkeTjxRMhJ3cSLja7maqHkCDm1tiLTv3h_lmpwYEgieKnra_k"
  },
  currentCourse: undefined,
  todaySchedule: [],
  tasks: [
    { 
      id: 't1', 
      title: '大学物理实验报告', 
      deadline: '明天 18:00', 
      type: 'report', 
      status: 'pending',
      aiHabitSummary: '建议提前 2 小时开始：系统检测到您通常会有 1.5 小时的“最后时刻压力”期。',
      urgencyLevel: 'high'
    },
    { 
      id: 't2', 
      title: '英美文学名著导读', 
      deadline: '后天 10:00', 
      type: 'reading', 
      status: 'pending',
      aiHabitSummary: '根据习惯，您在清晨阅读效率最高。',
      urgencyLevel: 'medium'
    }
  ],
  notifications: [
    { id: 'n1', sender: '教务处', content: '关于下周一教学楼 A 区停电维护的通知。', time: '10:30', type: 'school', isRead: false },
    { id: 'n2', sender: '张老师 (物理)', content: '同学们，明天的物理实验课请务必带好实验记录本。', time: '14:20', type: 'teacher', isRead: true },
    { id: 'n3', sender: '智能助手', content: '您有一项即将到期的作业，AI 建议您阅读相关文献。', time: '16:45', type: 'homework', isRead: false }
  ],
  aiNotices: [
    { id: 'ai1', event: '物理实验课集合', time: '明天 14:00', location: '实验楼 302', originalText: '张老师：明天的物理实验课请务必带好记录本，我们两点在 302 见。' }
  ],
  recognitionHistory: [],
  leaveHistory: []
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [appData, setAppData] = useState<AppData>(INITIAL_DATA);
  
  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    type?: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    type: 'info'
  });

  const showModal = (title: string, description?: string, type: 'success' | 'error' | 'info' = 'info') => {
    setModalConfig({ isOpen: true, title, description, type });
  };

  const handleLogin = (credentials: { name: string; id: string }) => {
    setAppData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        name: credentials.name,
        id: credentials.id,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${credentials.name}`
      }
    }));
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAppData(INITIAL_DATA);
    setActiveScreen('home');
  };

  const toggleTaskStatus = (id: string) => {
    setAppData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending' } : t)
    }));
  };

  // Logic Updaters
  const addCourse = (course: Omit<Course, 'id'>) => {
    const newCourse = { ...course, id: Math.random().toString(36).substr(2, 9) };
    setAppData(prev => ({
      ...prev,
      todaySchedule: [...prev.todaySchedule, newCourse]
    }));
    showModal("课表更新成功", `课程 ${course.name} 已成功添加到您的当日课表。`, "success");
  };

  const addLeaveRequest = (request: Omit<LeaveRequest, 'id' | 'status'>) => {
    const newRequest: LeaveRequest = { 
      ...request, 
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending' 
    };
    setAppData(prev => ({
      ...prev,
      leaveHistory: [newRequest, ...prev.leaveHistory]
    }));
    showModal("申请提交成功", "您的请假申请已提交，请耐心等待管理员审核。", "success");
  };

  const addRecognition = (rec: Omit<RecognitionHistory, 'id'>) => {
    const newRec = { ...rec, id: Math.random().toString(36).substr(2, 9) };
    setAppData(prev => ({
      ...prev,
      recognitionHistory: [newRec, ...prev.recognitionHistory]
    }));
  };

  if (!isLoggedIn) {
    return <AuthScreen onLogin={handleLogin} schoolName={appData.school.name} schoolLogo={appData.school.logoUrl} />;
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return (
          <HomeScreen 
            user={appData.user} 
            currentCourse={appData.currentCourse} 
            todaySchedule={appData.todaySchedule} 
            aiNotices={appData.aiNotices}
            tasks={appData.tasks}
          />
        );
      case 'academic':
        return (
          <AcademicScreen 
            todaySchedule={appData.todaySchedule} 
            onAddCourse={addCourse} 
            tasks={appData.tasks}
            onToggleTask={toggleTaskStatus}
          />
        );
      case 'services':
        return <LeaveScreen leaveHistory={appData.leaveHistory} onSubmitLeave={addLeaveRequest} />;
      case 'notifications':
        return <NotificationsScreen notifications={appData.notifications} />;
      case 'recognition':
        return <RecognitionScreen history={appData.recognitionHistory} onAddRecognition={addRecognition} />;
      case 'settings':
        return <SettingsScreen user={appData.user} onLogout={handleLogout} onShowMessage={showModal} />;
      default:
        return (
          <HomeScreen 
            user={appData.user} 
            todaySchedule={appData.todaySchedule} 
            aiNotices={appData.aiNotices} 
            tasks={appData.tasks}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center">
      <div className="w-full max-w-md min-h-screen relative flex flex-col bg-surface shadow-2xl">
        <TopBar school={appData.school} onNotifyClick={() => setActiveScreen('notifications')} />
        
        <main className="flex-1 relative overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full h-full"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </main>

        <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />

        {/* Global Modal */}
        <Modal 
          isOpen={modalConfig.isOpen} 
          onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
          title={modalConfig.title}
          description={modalConfig.description}
          type={modalConfig.type}
        />
      </div>
    </div>
  );
}
