import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserCheck, Utensils, DoorOpen, LogOut, CheckCircle2, ChevronRight, Camera, Image } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { RecognitionHistory } from '@/src/types';

interface RecognitionScreenProps {
  history: RecognitionHistory[];
  onAddRecognition: (rec: Omit<RecognitionHistory, 'id'>) => void;
}

export function RecognitionScreen({ history, onAddRecognition }: RecognitionScreenProps) {
  const [showEnrollOptions, setShowEnrollOptions] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'entry': return <UserCheck size={24} />;
      case 'dining': return <Utensils size={24} />;
      case 'library': return <DoorOpen size={24} />;
      default: return <UserCheck size={24} />;
    }
  };

  return (
    <div className="pb-40 pt-6 px-6 max-w-md mx-auto flex flex-col gap-10">
      {/* Face Enrollment Section */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-on-surface tracking-tight">人脸录入</h2>
        
        <div className="relative overflow-hidden rounded-[2.5rem] bg-surface-container-low p-8 flex flex-col items-center justify-center text-center transition-all duration-300 ambient-shadow">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary-container/20 blur-2xl" />
          
          <AnimatePresence mode="wait">
            {!showEnrollOptions ? (
              <motion.div 
                key="main"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="relative z-10 flex flex-col items-center gap-5"
              >
                <div className="w-20 h-20 rounded-full bg-surface-container-lowest flex items-center justify-center ambient-shadow transition-transform">
                  <User size={40} className="text-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold text-on-surface">校园无感通行</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    请录入面部信息，<br />用于进出校园及食堂消费身份校验
                  </p>
                </div>
                <motion.button 
                  onClick={() => setShowEnrollOptions(true)}
                  whileTap={{ scale: 0.95 }}
                  className="mt-2 bg-primary text-on-primary rounded-full px-8 py-3.5 text-sm font-bold tracking-wide shadow-lg shadow-primary/20"
                >
                  开始录入
                </motion.button>
              </motion.div>
            ) : (
              <motion.div 
                key="options"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="relative z-10 flex flex-col gap-4 w-full"
              >
                <button className="flex items-center gap-4 bg-surface-container-lowest p-5 rounded-3xl hover:bg-surface-container-high transition-colors text-left group">
                  <div className="w-12 h-12 rounded-full bg-primary-container/20 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface">现场拍摄</h4>
                    <p className="text-xs text-on-surface-variant">启用摄像头录入数据</p>
                  </div>
                </button>
                <button className="flex items-center gap-4 bg-surface-container-lowest p-5 rounded-3xl hover:bg-surface-container-high transition-colors text-left group">
                  <div className="w-12 h-12 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Image size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface">本地导入</h4>
                    <p className="text-xs text-on-surface-variant">从相册选择照片上传</p>
                  </div>
                </button>
                <button 
                  onClick={() => setShowEnrollOptions(false)}
                  className="mt-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest hover:text-primary transition-colors"
                >
                  返回上级
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Identification History Section */}
      <section className="flex flex-col gap-6">
        <div className="flex justify-between items-end px-1">
          <h2 className="text-xl font-bold text-on-surface tracking-tight">通行历史</h2>
          <button className="text-xs font-bold text-primary uppercase tracking-widest hover:opacity-80">查看全部</button>
        </div>

        {/* History List */}
        <div className="flex flex-col gap-3">
          {history.length > 0 ? history.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "bg-surface-container-lowest rounded-2xl p-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors duration-200 ambient-shadow border border-outline-variant/10",
                item.status === 'leave' && "opacity-60"
              )}
            >
              <div className={cn(
                "w-12 h-12 shrink-0 rounded-full flex items-center justify-center",
                item.status === 'success' ? "bg-primary-container/20 text-primary" : "bg-surface-container-high text-on-surface-variant"
              )}>
                {getIcon(item.type)}
              </div>
              <div className="flex-grow flex flex-col gap-0.5">
                <span className="font-bold text-on-surface text-base">{item.location}</span>
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{item.time}</span>
              </div>
              <div className={cn(
                "shrink-0 flex items-center gap-1",
                item.status === 'success' ? "text-primary" : "text-on-surface-variant"
              )}>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {item.status === 'success' ? '通过' : '离校'}
                </span>
                {item.status === 'success' ? <CheckCircle2 size={14} /> : <LogOut size={14} />}
              </div>
            </motion.div>
          )) : (
            <div className="text-sm text-on-surface-variant/50 italic py-8 text-center bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/30">
              暂无通行数据记录
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
