import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TopBar } from './components/layout/TopBar';
import { BottomNav, Screen } from './components/layout/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { ScheduleScreen } from './components/ScheduleScreen';
import { LeaveScreen } from './components/LeaveScreen';
import { RecognitionScreen } from './components/RecognitionScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AuthScreen } from './components/AuthScreen';
import { Modal } from './components/ui/Modal';
import type { AppData, Course, Task, RecognitionHistory, LeaveRequest } from './types';

/**
 * INITIAL EMPTY STATE
 */
const EMPTY_DATA: AppData = {
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
  upcomingTasks: [],
  recognitionHistory: [],
  leaveHistory: []
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [appData, setAppData] = useState<AppData>(EMPTY_DATA);
  
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
    setAppData(EMPTY_DATA);
    setActiveScreen('home');
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
            upcomingTasks={appData.upcomingTasks} 
          />
        );
      case 'schedule':
        return (
          <ScheduleScreen 
            todaySchedule={appData.todaySchedule} 
            onAddCourse={addCourse}
          />
        );
      case 'services':
        return (
          <LeaveScreen 
            leaveHistory={appData.leaveHistory} 
            onSubmitLeave={addLeaveRequest}
          />
        );
      case 'recognition':
        return (
          <RecognitionScreen 
            history={appData.recognitionHistory} 
            onAddRecognition={addRecognition}
          />
        );
      case 'settings':
        return (
          <SettingsScreen 
            user={appData.user} 
            onLogout={handleLogout}
            onShowMessage={showModal}
          />
        );
      default:
        return <HomeScreen user={appData.user} todaySchedule={appData.todaySchedule} upcomingTasks={appData.upcomingTasks} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center">
      <div className="w-full max-w-md min-h-screen relative flex flex-col bg-surface shadow-2xl">
        <TopBar school={appData.school} />
        
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
