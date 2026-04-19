import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scan, ImagePlus, FlaskConical, BookOpen, Clock, MapPin, Pencil, 
  Trash2, CheckCircle2, Type, CalendarClock, Plus, ClipboardList,
  Zap, Undo2, BrainCircuit, Sparkles
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { Course, Task } from '@/src/types';

interface AcademicScreenProps {
  todaySchedule: Course[];
  onAddCourse: (course: Omit<Course, 'id'>) => void;
  tasks: Task[];
  onToggleTask: (id: string) => void;
}

export function AcademicScreen({ todaySchedule, onAddCourse, tasks, onToggleTask }: AcademicScreenProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'tasks'>('schedule');
  
  // Schedule state
  const [formData, setFormData] = useState({ name: '', time: '', location: '' });
  const [aiPreviewData, setAiPreviewData] = useState<Course[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Task state
  const [taskFilter, setTaskFilter] = useState<'pending' | 'completed'>('pending');

  const filteredTasks = tasks.filter(task => task.status === taskFilter);

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.time && formData.location) {
      onAddCourse({
        name: formData.name,
        time: formData.time,
        location: formData.location,
        type: 'science'
      });
      setFormData({ name: '', time: '', location: '' });
    }
  };

  const simulateAiScan = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const mockResult: Course[] = [
        { id: 'ocr-1', name: '大学物理', time: '14:00 - 15:40', location: '实验楼 302', type: 'science' },
        { id: 'ocr-2', name: '近代史纲要', time: '16:00 - 17:40', location: '教学楼 A101', type: 'book' }
      ];
      setAiPreviewData(mockResult);
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="pb-40 pt-6 px-6 max-w-md mx-auto space-y-8">
      {/* Elegant Header & Page Switcher */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-on-surface tracking-tight">学业看板</h2>
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
             {activeTab === 'schedule' ? <CalendarClock size={20} /> : <ClipboardList size={20} />}
          </div>
        </div>

        <div className="flex bg-surface-container-low/50 p-1.5 rounded-[2rem] border border-outline-variant/10 relative overflow-hidden backdrop-blur-sm shadow-sm">
          {(['schedule', 'tasks'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 px-4 rounded-[1.5rem] text-xs font-bold transition-all relative z-10 tracking-widest uppercase",
                activeTab === tab ? "text-on-primary" : "text-on-surface-variant/40"
              )}
            >
              {tab === 'schedule' ? '智慧课表' : '待办提醒'}
              {activeTab === tab && (
                <motion.div
                  layoutId="active-academic-tab"
                  className="absolute inset-0 bg-primary rounded-[1.5rem] -z-10 shadow-lg shadow-primary/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence mode="wait">
        {activeTab === 'schedule' ? (
          <motion.div
            key="schedule-content"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-8"
          >
            {/* AI Upload Section */}
            <section className="bg-secondary-container/5 rounded-[3rem] p-8 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden border border-secondary/5">
              <div className="w-20 h-20 bg-surface-container-lowest rounded-[32px] flex items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-white/50">
                <Scan size={36} className={isProcessing ? "text-primary animate-spin" : "text-secondary"} strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-on-surface tracking-tight">智能识别课表</h3>
                <p className="text-on-surface-variant/60 text-[11px] font-bold tracking-widest uppercase">上传截图，AI 为您自动解析日程</p>
              </div>
              <motion.button 
                onClick={simulateAiScan}
                disabled={isProcessing}
                whileTap={{ scale: 0.98 }}
                className="bg-secondary text-on-secondary rounded-2xl px-8 py-4 font-bold text-xs tracking-widest uppercase shadow-xl shadow-secondary/10 flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? <Clock size={18} className="animate-spin" /> : <ImagePlus size={18} strokeWidth={2.5} />}
                <span>从相册导入识别</span>
              </motion.button>
            </section>

            {/* Identified List Preview */}
            {aiPreviewData.length > 0 && (
              <section className="space-y-4">
                <h4 className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant/40 uppercase ml-2">识别预览 ({aiPreviewData.length})</h4>
                <div className="space-y-3">
                  {aiPreviewData.map((course) => (
                    <div key={course.id} className="bg-surface-container-lowest rounded-[2rem] p-4 flex gap-4 items-center border border-outline-variant/5">
                      <div className="w-12 h-12 bg-secondary-container/10 text-secondary rounded-2xl flex items-center justify-center">
                        {course.type === 'science' ? <FlaskConical size={20} /> : <BookOpen size={20} />}
                      </div>
                      <div className="flex-grow">
                        <p className="font-bold text-sm text-on-surface">{course.name}</p>
                        <p className="text-[10px] text-on-surface-variant/60 font-bold uppercase">{course.time} • {course.location}</p>
                      </div>
                      <button onClick={() => setAiPreviewData(p => p.filter(c => c.id !== course.id))} className="p-2 text-error/40 hover:text-error transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                       aiPreviewData.forEach(c => { const {id, ...d} = c; onAddCourse(d); });
                       setAiPreviewData([]);
                    }}
                    className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold text-xs tracking-widest uppercase"
                  >
                    导入所有识别结果
                  </button>
                </div>
              </section>
            )}

            {/* Manual Form */}
            <section className="bg-surface-container-low/20 rounded-[3rem] p-8 border border-outline-variant/5">
              <h4 className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant/40 uppercase mb-6">人工辅助填报</h4>
              <form onSubmit={handleManualAdd} className="space-y-4">
                <input 
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-surface-container-lowest border-none rounded-2xl px-6 py-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/20" 
                  placeholder="课程名称" required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    value={formData.time}
                    onChange={(e) => setFormData(p => ({ ...p, time: e.target.value }))}
                    className="w-full bg-surface-container-lowest border-none rounded-2xl px-6 py-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/20" 
                    placeholder="时间 (例如 09:00)" required
                  />
                  <input 
                    value={formData.location}
                    onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                    className="w-full bg-surface-container-lowest border-none rounded-2xl px-6 py-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/20" 
                    placeholder="教室" required
                  />
                </div>
                <button type="submit" className="w-full bg-surface-container-highest/20 text-on-surface font-bold py-4 rounded-2xl border border-on-surface/5 flex items-center justify-center gap-2 text-xs">
                  <Plus size={16} /> 确认录入
                </button>
              </form>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="tasks-content"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
             {/* Sub Filter for Tasks */}
             <div className="flex bg-surface-container-low/30 p-1 rounded-2xl w-fit mx-auto border border-outline-variant/5 mb-6">
                {(['pending', 'completed'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setTaskFilter(f)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                      taskFilter === f ? "bg-white text-primary shadow-sm" : "text-on-surface-variant/40"
                    )}
                  >
                    {f === 'pending' ? '未完成' : '已完成'}
                  </button>
                ))}
             </div>

             <div className="space-y-4">
               <AnimatePresence mode="popLayout">
                 {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                   <motion.div
                     key={task.id}
                     layout
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     className="bg-surface-container-lowest rounded-[2.5rem] p-6 shadow-sm border border-outline-variant/5 relative overflow-hidden"
                   >
                     {task.urgencyLevel === 'high' && task.status === 'pending' && (
                       <div className="absolute top-0 right-0 bg-error/10 text-error px-4 py-1.5 rounded-bl-3xl text-[9px] font-bold tracking-widest">URGENT</div>
                     )}
                     <div className="flex gap-4">
                       <button 
                         onClick={() => onToggleTask(task.id)}
                         className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border",
                            task.status === 'pending' ? "bg-surface-container-low text-on-surface-variant/20 border-outline-variant/5" : "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20"
                         )}
                       >
                         {task.status === 'pending' ? <CheckCircle2 size={24} /> : <Undo2 size={20} />}
                       </button>
                       <div className="flex-grow pt-1">
                          <h4 className={cn("text-lg font-bold tracking-tight", task.status === 'completed' && "line-through opacity-30")}>{task.title}</h4>
                          <p className="text-[10px] text-on-surface-variant/40 font-bold uppercase mt-1 tracking-widest">{task.deadline}</p>
                       </div>
                     </div>
                     {task.aiHabitSummary && task.status === 'pending' && (
                       <div className="mt-5 bg-secondary/5 rounded-2xl p-4 border border-secondary/5 flex gap-3">
                         <BrainCircuit size={16} className="text-secondary flex-shrink-0 mt-0.5" />
                         <p className="text-[11px] text-on-surface-variant/70 leading-relaxed font-medium">{task.aiHabitSummary}</p>
                       </div>
                     )}
                   </motion.div>
                 )) : (
                   <div className="text-center py-20 text-[10px] font-bold text-on-surface-variant/20 tracking-[0.3em] uppercase">暂无数据</div>
                 )}
               </AnimatePresence>
             </div>

             <section className="bg-primary/5 rounded-[3rem] p-8 border border-primary/5 overflow-hidden relative">
               <Sparkles className="absolute -right-4 -bottom-4 text-primary opacity-10" size={100} />
               <h4 className="text-lg font-bold text-on-surface tracking-tight mb-2">学业洞察</h4>
               <p className="text-xs text-on-surface-variant/70 leading-relaxed">您的 AI 正在持续学习您的学业习惯，目前已识别到全周最高效时段为周三上午。</p>
             </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
