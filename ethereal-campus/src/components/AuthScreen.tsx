import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, ArrowRight, Sparkles, School } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (credentials: { name: string; id: string }) => void;
  schoolName: string;
  schoolLogo: string;
}

export function AuthScreen({ onLogin, schoolName, schoolLogo }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && studentId) {
      onLogin({ name, id: studentId });
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-12">
        {/* Logo Section */}
        <div className="flex flex-col items-center text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-surface-container-low rounded-[2rem] flex items-center justify-center p-3 ambient-shadow"
          >
            <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-4xl font-display font-bold text-primary tracking-tight uppercase">
              {schoolName}
            </h1>
            <p className="text-on-surface-variant font-medium">智慧校园管理系统</p>
          </div>
        </div>

        {/* Form Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-container-lowest rounded-[2.5rem] p-8 ambient-shadow space-y-8"
        >
          <div className="flex justify-center gap-8 border-b border-surface-container pb-4">
            <button 
              onClick={() => setIsLogin(true)}
              className={`text-sm font-bold tracking-widest uppercase transition-colors ${isLogin ? 'text-primary border-b-2 border-primary pb-4 -mb-4.5' : 'text-on-surface-variant/50'}`}
            >
              登录
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`text-sm font-bold tracking-widest uppercase transition-colors ${!isLogin ? 'text-primary border-b-2 border-primary pb-4 -mb-4.5' : 'text-on-surface-variant/50'}`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-4">真实姓名</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-on-surface-variant/40">
                  <User size={18} />
                </div>
                <input 
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-low border-0 rounded-full py-4 pl-12 pr-6 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
                  placeholder="请输入您的姓名"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-4">学号 / 账号</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-on-surface-variant/40">
                  <Lock size={18} />
                </div>
                <input 
                  required
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-surface-container-low border-0 rounded-full py-4 pl-12 pr-6 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all"
                  placeholder="请输入您的学号"
                />
              </div>
            </div>

            <motion.button 
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-primary text-on-primary font-bold py-5 rounded-full shadow-lg shadow-primary/20 flex items-center justify-center gap-3 hover:opacity-95 transition-opacity"
            >
              <span>{isLogin ? '立即进入' : '完成注册'}</span>
              <ArrowRight size={20} />
            </motion.button>
          </form>
        </motion.div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-4 text-on-surface-variant/40">
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
            <Sparkles size={14} />
            <span>AI Powered Infrastructure</span>
          </div>
        </div>
      </div>
    </div>
  );
}
