import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, QrCode, FlaskConical, BookOpen, Calculator, Sparkles, ArrowUp, Zap, Clock, ClipboardList, ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { UserProfile, Course, AISummarizedNotice, Task } from '@/src/types';

interface HomeScreenProps {
  user: UserProfile;
  currentCourse?: Course;
  todaySchedule: Course[];
  aiNotices: AISummarizedNotice[];
  tasks: Task[];
}

export function HomeScreen({ user, currentCourse, todaySchedule, aiNotices, tasks }: HomeScreenProps) {
  const getCourseIcon = (type: string) => {
    switch (type) {
      case 'science': return <FlaskConical size={14} />;
      case 'book': return <BookOpen size={14} />;
      case 'calculus': return <Calculator size={14} />;
      default: return <BookOpen size={14} />;
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');

  return (
    <div className="pb-40">
      {/* Hero Header */}
      <section className="px-6 pt-6 pb-4">
        <motion.div
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           className="flex items-center justify-between"
        >
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.4em] mb-1">
              {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
            <h2 className="text-3xl font-bold text-primary tracking-tight">你好, {user.name}</h2>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-surface-container-low/50 border border-outline-variant/10 flex items-center justify-center text-on-surface-variant/40">
            <Zap size={20} />
          </div>
        </motion.div>
      </section>

      {/* AI Proactive Summary "Popup" Card */}
      <AnimatePresence mode="wait">
        {aiNotices.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="px-6 mb-8"
          >
            <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-on-surface/5 relative group cursor-pointer active:scale-[0.99] transition-transform">
              {/* Subtle AI indicator - tiny spark in the top right corner */}
              <div className="absolute top-6 right-6 text-primary/30">
                <Sparkles size={14} fill="currentColor" />
              </div>

              {aiNotices.map((notice) => (
                <div key={notice.id} className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase opacity-60">
                      智慧动向
                    </p>
                    <h3 className="text-xl font-bold text-on-surface tracking-tight">
                      {notice.event}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[11px] font-bold text-on-surface-variant/40 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Clock size={12} strokeWidth={2.5} /> {notice.time}</span>
                    <span className="opacity-20">•</span>
                    <span className="flex items-center gap-1.5"><MapPin size={12} strokeWidth={2.5} /> {notice.location}</span>
                  </div>

                  <p className="text-xs text-on-surface-variant/60 leading-relaxed font-medium pb-1 border-l-2 border-primary/10 pl-3 italic">
                    {notice.originalText}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Routine Mode: Today's Overview */}
      <motion.div 
        layout
        className={cn(
          "space-y-10",
          aiNotices.length > 0 ? "pt-2" : "pt-4"
        )}
      >
        {/* Current Class (if any) */}
        {currentCourse && (
          <section className="px-6">
            <motion.div 
              layout
              className="bg-surface-container-lowest rounded-[2.5rem] p-7 border border-outline-variant/10 shadow-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 bg-error/5 px-2.5 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                  <span className="text-[9px] font-bold text-error uppercase tracking-widest">进行中</span>
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{currentCourse.time}</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface tracking-tight mb-2">{currentCourse.name}</h3>
              <p className="text-xs text-on-surface-variant/60 font-medium flex items-center gap-1.5">
                <MapPin size={12} /> {currentCourse.location}
              </p>
            </motion.div>
          </section>
        )}

        {/* Schedule & Tasks Grid/Stack */}
        <section className="px-6 space-y-10">
          {/* Today's Schedule Mini List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-bold text-on-surface tracking-tight">今日日程</h3>
              {aiNotices.length === 0 && (
                <div className="w-8 h-8 rounded-full bg-surface-container-low/50 flex items-center justify-center text-on-surface-variant/40">
                  <ChevronRight size={16} />
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-3">
              {todaySchedule.length > 0 ? todaySchedule.map((course, idx) => (
                <div key={course.id} className="bg-surface-container-low/20 rounded-[2rem] p-5 flex items-center gap-4 border border-outline-variant/5">
                  <div className="text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-widest w-12 text-center">
                    {course.time.split(' ')[0]}
                  </div>
                  <div className="h-8 w-px bg-outline-variant/10" />
                  <div className="flex-grow">
                    <p className="font-bold text-sm text-on-surface">{course.name}</p>
                    <p className="text-[10px] text-on-surface-variant/50 font-bold uppercase tracking-wide mt-0.5">{course.location}</p>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center bg-surface-container-low/10 rounded-[2.5rem] border border-dashed border-outline-variant/10 text-[10px] font-bold text-on-surface-variant/20 uppercase tracking-[0.3em]">暂无课程安排</div>
              )}
            </div>
          </div>

          {/* Home Tasks Summary */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-on-surface tracking-tight px-1">任务概览</h3>
            <div className="grid grid-cols-2 gap-4">
               {pendingTasks.slice(0, 2).map((task) => (
                 <div key={task.id} className="bg-surface-container-lowest rounded-[2rem] p-5 shadow-sm border border-outline-variant/5">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors",
                      task.urgencyLevel === 'high' ? "bg-error/5 text-error" : "bg-primary/5 text-primary"
                    )}>
                      {task.urgencyLevel === 'high' ? <Zap size={18} fill="currentColor" /> : <ClipboardList size={18} />}
                    </div>
                    <p className="font-bold text-sm text-on-surface line-clamp-1 tracking-tight">{task.title}</p>
                    <p className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest mt-1.5">{task.deadline}</p>
                 </div>
               ))}
               {pendingTasks.length === 0 && (
                 <div className="col-span-2 py-8 text-center bg-surface-container-low/10 rounded-[2.5rem] border border-dashed border-outline-variant/10 text-[10px] font-bold text-on-surface-variant/20 uppercase tracking-[0.3em]">所有任务已完成</div>
               )}
            </div>
          </div>
        </section>
      </motion.div>

      {/* Floating Assistant */}
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[92%] max-w-sm px-0 z-40">
        <div className="bg-surface-container-lowest/95 backdrop-blur-xl rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-white/20 flex items-center p-2">
          <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
            <Sparkles size={18} fill="currentColor" />
          </div>
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm flex-1 text-on-surface placeholder:text-on-surface-variant/30 px-4 py-0 font-medium" 
            placeholder="询问 AI 今日习惯洞察..." 
            type="text"
          />
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full bg-surface-container-highest/20 text-primary flex items-center justify-center flex-shrink-0"
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
