import React from 'react';
import { motion } from 'motion/react';
import { MapPin, QrCode, ChevronRight, FlaskConical, BookOpen, FileEdit, Book, Sparkles, ArrowUp, Calculator } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { UserProfile, Course, Task } from '@/src/types';

interface HomeScreenProps {
  user: UserProfile;
  currentCourse?: Course;
  todaySchedule: Course[];
  upcomingTasks: Task[];
}

export function HomeScreen({ user, currentCourse, todaySchedule, upcomingTasks }: HomeScreenProps) {
  const getCourseIcon = (type: string) => {
    switch (type) {
      case 'science': return <FlaskConical size={14} />;
      case 'book': return <BookOpen size={14} />;
      case 'calculus': return <Calculator size={14} />;
      default: return <BookOpen size={14} />;
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'report': return <FileEdit size={20} />;
      case 'reading': return <Book size={20} />;
      default: return <FileEdit size={20} />;
    }
  };

  return (
    <div className="pb-40">
      {/* Hero Section */}
      <section className="px-6 pt-6 pb-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-semibold text-primary tracking-tight leading-tight"
        >
          早上好,
        </motion.h2>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-semibold text-primary tracking-tight leading-tight"
        >
          {user.name}
        </motion.h2>
        <p className="text-lg text-on-surface-variant mt-2 font-medium">
          {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </section>

      {/* Current Class Card */}
      {currentCourse && (
        <section className="px-6 mb-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-container-lowest rounded-3xl p-7 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[64px] -mr-16 -mt-16 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-5 relative z-10">
              <div className="bg-primary/5 px-3 py-1 rounded-full flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-primary uppercase">进行中</span>
              </div>
              <span className="text-sm text-on-surface-variant font-medium">{currentCourse.time}</span>
            </div>
            
            <h3 className="text-2xl font-bold text-on-surface mb-2 relative z-10 tracking-tight">{currentCourse.name}</h3>
            <p className="text-sm text-on-surface-variant flex items-center gap-2 relative z-10 mb-8 opacity-80">
              <MapPin size={14} /> {currentCourse.location}
            </p>
            
            <div className="flex gap-4 relative z-10">
              <motion.button 
                whileTap={{ scale: 0.98 }}
                className="bg-primary text-on-primary rounded-2xl px-6 py-3.5 text-sm font-bold flex-1 shadow-lg shadow-primary/20 hover:opacity-95 transition-all"
              >
                打开课件
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                className="bg-surface-container-high/50 text-on-surface rounded-2xl px-4 py-3.5 text-sm font-medium flex items-center justify-center hover:bg-surface-container-high transition-colors"
              >
                <QrCode size={20} />
              </motion.button>
            </div>
          </motion.div>
        </section>
      )}

      {/* Today's Schedule */}
      <section className="px-6 mb-10">
        <div className="flex items-center justify-between mb-6 px-1">
          <h3 className="text-xl font-bold text-on-surface tracking-tight">今日日程</h3>
          <button className="text-xs font-bold text-primary uppercase tracking-widest hover:opacity-80">
            全部预览
          </button>
        </div>
        
        <div className="flex flex-col gap-4 relative">
          {todaySchedule.length > 0 && <div className="absolute left-[23.5px] top-4 bottom-4 w-[1px] bg-surface-container-high/50 -z-10" />}
          
          {todaySchedule.length > 0 ? todaySchedule.map((course, index) => (
            <motion.div 
              key={course.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-start gap-4"
            >
              <div className="flex flex-col items-center min-w-[48px] pt-1">
                <span className="text-xs text-on-surface-variant/60 font-bold">{course.time.split(' ')[0]}</span>
              </div>
              <div className="bg-surface-container-low/40 rounded-[24px] p-5 flex-1 border border-outline-variant/5">
                <h4 className="text-base font-bold text-on-surface tracking-tight">{course.name}</h4>
                <p className="text-xs text-on-surface-variant mt-1.5 flex items-center gap-1.5 opacity-70 font-medium">
                  {getCourseIcon(course.type)} {course.location}
                </p>
              </div>
            </motion.div>
          )) : (
            <div className="text-sm text-on-surface-variant/40 italic py-6 px-4 bg-surface-container-low/20 rounded-3xl border border-dashed border-outline-variant/10 text-center">今日暂无课程安排</div>
          )}
        </div>
      </section>

      {/* Upcoming Tasks */}
      <section className="px-6 mb-12">
        <h3 className="text-xl font-bold text-on-surface mb-6 px-1 tracking-tight">待办事项</h3>
        <div className="grid grid-cols-2 gap-4">
          {upcomingTasks.length > 0 ? upcomingTasks.map((task, index) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-surface-container-lowest rounded-[32px] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.02)] border border-outline-variant/5"
            >
              <div className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center mb-5",
                task.type === 'report' ? "bg-error-container/20 text-error" : "bg-secondary-container/20 text-secondary"
              )}>
                {getTaskIcon(task.type)}
              </div>
              <h4 className="text-base font-bold text-on-surface mb-1.5 leading-tight tracking-tight">{task.title}</h4>
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                task.type === 'report' ? "text-error" : "text-on-surface-variant/60"
              )}>{task.deadline}</p>
            </motion.div>
          )) : (
            <div className="col-span-2 text-sm text-on-surface-variant/40 italic py-8 text-center bg-surface-container-low/20 rounded-[32px] border border-dashed border-outline-variant/10">暂无待办事项</div>
          )}
        </div>
      </section>

      {/* Floating AI Assistant Bar */}
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[92%] max-w-sm px-0 z-40">
        <div className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/20 flex items-center p-1.5">
          <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} fill="white" stroke="white" />
          </div>
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm flex-1 text-on-surface placeholder:text-on-surface-variant/40 px-3 py-0" 
            placeholder="询问 AI 助手..." 
            type="text"
          />
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full bg-surface-container-highest/10 text-secondary flex items-center justify-center flex-shrink-0 hover:bg-surface-container-highest/20 transition-colors"
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
