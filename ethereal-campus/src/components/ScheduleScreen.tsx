import React from 'react';
import { motion } from 'motion/react';
import { Scan, ImagePlus, FlaskConical, BookOpen, Clock, MapPin, Pencil, Trash2, CheckCircle2, Type, CalendarClock, Plus } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { Course } from '@/src/types';

interface ScheduleScreenProps {
  todaySchedule: Course[];
  onAddCourse: (course: Omit<Course, 'id'>) => void;
}

export function ScheduleScreen({ todaySchedule, onAddCourse }: ScheduleScreenProps) {
  const [formData, setFormData] = React.useState({
    name: '',
    time: '',
    location: ''
  });

  const [aiPreviewData, setAiPreviewData] = React.useState<Course[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.time && formData.location) {
      onAddCourse({
        name: formData.name,
        time: formData.time,
        location: formData.location,
        type: 'science' // Default for manual
      });
      setFormData({ name: '', time: '', location: '' });
    }
  };

  const simulateAiScan = () => {
    setIsProcessing(true);
    // Simulate OCR delay
    setTimeout(() => {
      const mockResult: Course[] = [
        { id: 'ocr-1', name: '大学物理', time: '14:00 - 15:40', location: '实验楼 302', type: 'science' },
        { id: 'ocr-2', name: '近代史纲要', time: '16:00 - 17:40', location: '教学楼 A101', type: 'book' }
      ];
      setAiPreviewData(mockResult);
      setIsProcessing(false);
    }, 2000);
  };

  const handleImportAll = () => {
    aiPreviewData.forEach(course => {
      const { id, ...courseData } = course;
      onAddCourse(courseData);
    });
    setAiPreviewData([]);
  };

  const removePreviewItem = (id: string) => {
    setAiPreviewData(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="pb-40 pt-6 space-y-8 px-6 max-w-md mx-auto">
      {/* AI Upload Section */}
      <section className="bg-secondary-container/10 rounded-[40px] p-8 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden border border-secondary/5">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="w-20 h-20 bg-surface-container-lowest rounded-[32px] flex items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-white/50">
          <Scan size={36} className={isProcessing ? "text-primary animate-spin" : "text-secondary"} strokeWidth={1.5} />
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-2xl font-bold text-on-surface tracking-tight">智能识别课表</h2>
          <p className="text-on-surface-variant/70 text-sm leading-relaxed font-medium">上传截图，AI 为您自动解析日程</p>
        </div>
        <motion.button 
          onClick={simulateAiScan}
          disabled={isProcessing}
          whileTap={{ scale: 0.98 }}
          className="bg-secondary text-on-secondary rounded-2xl px-8 py-4 font-bold text-sm tracking-wide hover:opacity-95 transition-all shadow-xl shadow-secondary/15 flex items-center gap-2 relative overflow-hidden group disabled:opacity-50"
        >
          {isProcessing ? <Clock size={20} className="animate-spin" /> : <ImagePlus size={20} strokeWidth={2.5} />}
          <span>{isProcessing ? '正在智能识别...' : '从相册导入识别'}</span>
        </motion.button>
      </section>

      {/* Identified Schedule Preview */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-on-surface-variant/40">识别预览</h3>
          <span className="text-[10px] font-bold bg-primary/5 text-primary px-3 py-1.5 rounded-full uppercase tracking-widest">
            {aiPreviewData.length} 节课程待同步
          </span>
        </div>
        
        <div className="space-y-4">
          {aiPreviewData.length > 0 ? aiPreviewData.map((course, index) => (
            <motion.div 
              key={course.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-surface-container-lowest rounded-[32px] p-5 flex gap-5 items-center relative shadow-[0_4px_16px_rgba(0,0,0,0.02)] border border-outline-variant/5"
            >
              <div className="flex-shrink-0 w-14 h-14 bg-secondary-container/10 text-secondary rounded-2xl flex items-center justify-center">
                {course.type === 'science' ? <FlaskConical size={26} strokeWidth={1.5} /> : <BookOpen size={26} strokeWidth={1.5} />}
              </div>
              <div className="flex-grow space-y-1">
                <h4 className="font-bold text-on-surface text-lg tracking-tight leading-tight">{course.name}</h4>
                <div className="flex flex-col gap-1 text-xs text-on-surface-variant/60 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>{course.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} />
                    <span>{course.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <button 
                  onClick={() => removePreviewItem(course.id)}
                  className="w-10 h-10 rounded-full bg-error/5 text-error flex items-center justify-center hover:bg-error/10 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          )) : (
            <div className="text-sm text-on-surface-variant/30 italic py-10 text-center bg-surface-container-low/20 rounded-[40px] border border-dashed border-outline-variant/10 font-medium">
              {isProcessing ? '正在处理图像数据...' : '上传课表截图，AI 自动填报卡片'}
            </div>
          )}
        </div>

        <div className="pt-2">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handleImportAll}
            disabled={aiPreviewData.length === 0} 
            className={cn(
              "w-full rounded-2xl py-4.5 font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-lg",
              aiPreviewData.length > 0 
                ? "bg-primary text-on-primary shadow-primary/20 hover:opacity-95" 
                : "bg-surface-container-low text-on-surface-variant/20 grayscale cursor-not-allowed"
            )}
          >
            <CheckCircle2 size={20} />
            导入所有识别结果
          </motion.button>
        </div>
      </section>

      {/* Manual Add Section */}
      <section className="space-y-6 pt-4">
        <div className="px-2">
          <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-on-surface-variant/40">手动录入</h3>
        </div>
        
        <form onSubmit={handleManualAdd} className="bg-surface-container-low/30 rounded-[40px] p-8 space-y-6 border border-outline-variant/5">
          <div className="space-y-3">
            <label className="block text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest ml-4">课程名称</label>
            <div className="relative">
              <input 
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                className="block w-full px-6 py-4.5 bg-surface-container-lowest border-none rounded-2xl text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-on-surface-variant/20 shadow-sm" 
                placeholder="例如：量子力学" 
                type="text"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest ml-4">时间</label>
              <input 
                value={formData.time}
                onChange={(e) => setFormData(p => ({ ...p, time: e.target.value }))}
                className="block w-full px-6 py-4.5 bg-surface-container-lowest border-none rounded-2xl text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-on-surface-variant/20 shadow-sm" 
                placeholder="09:00" 
                type="text"
                required
              />
            </div>
            
            <div className="space-y-3">
              <label className="block text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest ml-4">教室</label>
              <input 
                value={formData.location}
                onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                className="block w-full px-6 py-4.5 bg-surface-container-lowest border-none rounded-2xl text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-on-surface-variant/20 shadow-sm" 
                placeholder="理学楼 101" 
                type="text"
                required
              />
            </div>
          </div>
          
          <div className="pt-4">
            <motion.button 
              whileTap={{ scale: 0.98 }}
              className="w-full bg-surface-container-highest/10 text-on-surface font-bold py-4.5 rounded-2xl border border-on-surface/5 hover:bg-surface-container-highest/20 transition-all flex items-center justify-center gap-2" 
              type="submit"
            >
              <Plus size={20} />
              确认录入课表
            </motion.button>
          </div>
        </form>
      </section>
    </div>
  );
}
