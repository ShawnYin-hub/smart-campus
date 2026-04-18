import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Brain, FileEdit, Calendar, Hospital, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { LeaveRequest } from '@/src/types';

interface LeaveScreenProps {
  leaveHistory: LeaveRequest[];
  onSubmitLeave: (request: Omit<LeaveRequest, 'id' | 'status'>) => void;
}

export function LeaveScreen({ leaveHistory, onSubmitLeave }: LeaveScreenProps) {
  const [formData, setFormData] = React.useState({
    type: '事假',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [aiState, setAiState] = React.useState<'idle' | 'listening' | 'recognized'>('idle');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.startDate && formData.endDate && formData.reason) {
      onSubmitLeave({
        type: formData.type,
        dateRange: `${formData.startDate} - ${formData.endDate}`,
        reason: formData.reason
      });
      setFormData({ type: '事假', startDate: '', endDate: '', reason: '' });
    }
  };

  const startListening = () => {
    setAiState('listening');
    // Simulate AI processing
    setTimeout(() => {
      setAiState('recognized');
    }, 2500);
  };

  const handleAiConfirm = () => {
    onSubmitLeave({
      type: '病假',
      dateRange: '12月5日 - 12月6日 (2天)',
      reason: '重感冒'
    });
    setAiState('idle');
  };

  return (
    <div className="pb-40 pt-6 px-6 max-w-md mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-primary tracking-tight">请假服务</h1>
        <p className="text-on-surface-variant text-sm">请选择输入方式提交您的请假申请。</p>
      </div>

      {/* AI Voice Input Section */}
      <section className="bg-surface-container-low rounded-2xl p-6 relative overflow-hidden flex flex-col gap-6">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
            <Mic size={20} />
          </div>
          <h2 className="text-xl font-bold text-secondary">AI 语音助理</h2>
        </div>
        
        <p className="text-on-surface-variant text-sm leading-relaxed">
          {aiState === 'listening' ? '正在倾听您的需求...' : '直接告诉我您的请假需求，例如：“我明天感冒了，需要请假两天。”'}
        </p>
        
        <div className="flex flex-col items-center justify-center py-10">
          <div className="relative">
            {/* Animated Pulses */}
            {aiState === 'listening' && (
              <>
                <div className="absolute inset-0 rounded-full bg-secondary opacity-30 pulse-ring" />
                <div className="absolute inset-0 rounded-full bg-secondary opacity-20 pulse-ring" style={{ animationDelay: '0.6s' }} />
              </>
            )}
            
            <motion.button 
              onClick={startListening}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              animate={aiState === 'listening' ? { scale: [1, 1.05, 1] } : {}}
              transition={aiState === 'listening' ? { repeat: Infinity, duration: 1.5 } : {}}
              className={cn(
                "w-28 h-28 rounded-full flex items-center justify-center shadow-2xl relative z-10 transition-all duration-500",
                aiState === 'listening' ? "bg-secondary text-on-secondary scale-110" : "bg-secondary text-on-secondary soft-glow"
              )}
            >
              <Mic size={44} strokeWidth={1.5} />
            </motion.button>
          </div>
          <span className="mt-8 text-xs font-bold text-secondary tracking-[0.2em] uppercase opacity-80">
            {aiState === 'listening' ? '请说话...' : '点击开始倾听'}
          </span>
        </div>

        {/* AI Recognized Info Card - Only shown when AI identifies content */}
        <AnimatePresence>
          {aiState === 'recognized' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-surface-container-lowest frosted rounded-xl p-6 border border-outline-variant/20 flex flex-col gap-6 shadow-sm relative z-10"
            >
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-secondary" />
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">AI 已智能识别</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wide">原因</span>
                  <span className="text-base text-on-surface font-semibold">重感冒</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wide">时间</span>
                  <span className="text-base text-on-surface font-semibold">12月5日-6日</span>
                </div>
              </div>
              
              <div className="flex gap-4 mt-2">
                <button 
                  onClick={() => setAiState('idle')}
                  className="flex-1 bg-surface-container-low text-secondary py-3 rounded-full text-sm font-medium transition-all"
                >
                  修改
                </button>
                <button 
                  onClick={handleAiConfirm}
                  className="flex-1 bg-primary text-on-primary py-3 rounded-full text-sm font-medium transition-all shadow-lg"
                >
                  确认提交
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Traditional Form Section */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-surface-container pb-4">
          <div className="w-10 h-10 rounded-full bg-primary-container/30 flex items-center justify-center text-primary">
            <FileEdit size={20} />
          </div>
          <h2 className="text-lg font-bold text-primary">手动填写</h2>
        </div>
        
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">请假类型</label>
            <select 
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full bg-surface-container-low border-0 rounded-full py-3.5 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all appearance-none"
            >
              <option>事假</option>
              <option>病假</option>
              <option>年假</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">开始日期</label>
              <input 
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full bg-surface-container-low border-0 rounded-full py-3.5 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest" 
                type="date" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">结束日期</label>
              <input 
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full bg-surface-container-low border-0 rounded-full py-3.5 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest" 
                type="date" 
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">请假事由</label>
            <textarea 
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full bg-surface-container-low border-0 rounded-xl p-6 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all min-h-[140px] resize-none" 
              placeholder="详细描述您的请假原因..."
            />
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.98 }}
            className="w-full bg-primary text-on-primary font-bold py-4 rounded-full mt-2 shadow-lg hover:opacity-95 transition-all" 
            type="submit"
          >
            提交申请
          </motion.button>
        </form>
      </section>

      {/* Application History */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-on-surface px-1">申请记录</h3>
        <div className="flex flex-col gap-4">
          {leaveHistory.length > 0 ? leaveHistory.map((leave, index) => (
            <motion.div 
              key={leave.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-surface-container-lowest rounded-2xl p-4 flex items-center justify-between ambient-shadow border border-outline-variant/10"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  leave.type === '病假' ? "bg-error-container/10 text-error" : "bg-secondary-container/20 text-secondary"
                )}>
                  {leave.type === '病假' ? <Hospital size={24} /> : <FileText size={24} />}
                </div>
                <div>
                  <p className="font-bold text-on-surface">{leave.type}</p>
                  <p className="text-xs text-on-surface-variant">{leave.dateRange}</p>
                </div>
              </div>
              <span className="px-4 py-1.5 bg-surface-container-low text-on-surface-variant text-[10px] rounded-full font-bold uppercase tracking-wider">
                {leave.status === 'approved' ? '已批准' : leave.status === 'pending' ? '待审核' : '已驳回'}
              </span>
            </motion.div>
          )) : (
            <div className="text-sm text-on-surface-variant/50 italic py-8 text-center bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/30">
              暂无请假记录
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
