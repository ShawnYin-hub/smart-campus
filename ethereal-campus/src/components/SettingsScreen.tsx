import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, Lock, Smartphone, Languages, BellRing, Info, LogOut, ChevronRight, Check, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { UserProfile } from '@/src/types';

interface SettingsScreenProps {
  user: UserProfile;
  onLogout: () => void;
  onShowMessage: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
}

export function SettingsScreen({ user, onLogout, onShowMessage }: SettingsScreenProps) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'zh' | 'en'>('zh');
  const [passwordData, setPasswordData] = useState({ old: '', new: '', confirm: '' });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      onShowMessage("提示", "两次输入的新密码不一致", "error");
      return;
    }
    onShowMessage("修改成功", "您的登录密码已成功更新。", "success");
    setShowPasswordForm(false);
    setPasswordData({ old: '', new: '', confirm: '' });
  };

  const handleLanguageSelect = (lang: 'zh' | 'en') => {
    setCurrentLanguage(lang);
    onShowMessage("语言已切换", lang === 'zh' ? "语言已设置为：中文" : "Language set to: English", "success");
    setShowLanguagePicker(false);
  };

  const showAboutInfo = () => {
    onShowMessage(
      "关于 BHSFIC 智慧校园",
      "版本 v1.4.2\n我们将 AI 与校园生活深度融合，为您提供无感识别、智能课表、语音请假等创新体验。",
      "info"
    );
  };

  return (
    <div className="pb-40 pt-6 px-6 max-w-md mx-auto space-y-8 relative">
      {/* Profile Summary */}
      <section className="flex flex-col items-center justify-center pt-4 pb-8">
        <div className="relative mb-6">
          <img 
            alt="User Avatar" 
            className="w-24 h-24 rounded-full object-cover shadow-sm ring-4 ring-surface-container-lowest" 
            src={user.avatarUrl}
            referrerPolicy="no-referrer"
          />
          <motion.button 
            onClick={() => onShowMessage("提示", "头像修改功能维护中", "info")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute bottom-0 right-0 bg-primary text-on-primary rounded-full p-2 shadow-sm border-2 border-surface-container-lowest"
          >
            <Pencil size={14} />
          </motion.button>
        </div>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight mb-1">{user.name}</h1>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low px-4 py-1.5 rounded-full">ID: {user.id}</p>
      </section>

      {/* Account Security Section */}
      <section>
        <h2 className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-[0.2em] mb-3 px-4">账号安全</h2>
        <div className="bg-surface-container-lowest rounded-3xl overflow-hidden flex flex-col p-2 gap-1 ambient-shadow border border-outline-variant/5">
          <button 
            onClick={() => setShowPasswordForm(true)}
            className="flex items-center justify-between w-full p-4 rounded-2xl hover:bg-surface-container-low transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary">
                <Lock size={20} />
              </div>
              <span className="font-bold text-on-surface text-base group-hover:text-primary transition-colors">修改密码</span>
            </div>
            <ChevronRight size={20} className="text-on-surface-variant/30" />
          </button>
        </div>
      </section>

      {/* App Settings Section */}
      <section>
        <h2 className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-[0.2em] mb-3 px-4">应用设置</h2>
        <div className="bg-surface-container-lowest rounded-3xl overflow-hidden flex flex-col p-2 gap-1 ambient-shadow border border-outline-variant/5">
          <button 
            onClick={() => setShowLanguagePicker(true)}
            className="flex items-center justify-between w-full p-4 rounded-2xl hover:bg-surface-container-low transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest/50 flex items-center justify-center text-on-surface-variant">
                <Languages size={20} />
              </div>
              <span className="font-bold text-on-surface text-base group-hover:text-primary transition-colors">语言</span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant/60">
              <span className="text-sm font-semibold text-primary">{currentLanguage === 'zh' ? '中文' : 'English'}</span>
              <ChevronRight size={20} />
            </div>
          </button>
          
          <div className="flex items-center justify-between w-full p-4 rounded-2xl hover:bg-surface-container-low transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest/50 flex items-center justify-center text-on-surface-variant">
                <BellRing size={20} />
              </div>
              <span className="font-bold text-on-surface text-base">消息通知</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer scale-90">
              <input checked readOnly className="sr-only peer" type="checkbox" />
              <div className="w-11 h-6 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary opacity-80" />
            </label>
          </div>
        </div>
      </section>

      {/* Help & Support Section */}
      <section>
        <h2 className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-[0.2em] mb-3 px-4">帮助与支持</h2>
        <div className="bg-surface-container-lowest rounded-3xl overflow-hidden flex flex-col p-2 gap-1 ambient-shadow border border-outline-variant/5">
          <button 
            onClick={showAboutInfo}
            className="flex items-center justify-between w-full p-4 rounded-2xl hover:bg-surface-container-low transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                <Info size={20} />
              </div>
              <span className="font-bold text-on-surface text-base group-hover:text-primary transition-colors">关于应用</span>
            </div>
            <ChevronRight size={20} className="text-on-surface-variant/30" />
          </button>
        </div>
      </section>

      {/* Logout Button */}
      <section className="pt-6 pb-8">
        <motion.button 
          onClick={onLogout}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-error/5 text-error font-bold text-lg py-5 rounded-full hover:bg-error/10 transition-colors flex items-center justify-center gap-3"
        >
          <LogOut size={22} />
          退出当前登录
        </motion.button>
      </section>

      {/* Update Password Form Overlay */}
      <AnimatePresence>
        {showPasswordForm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPasswordForm(false)} className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="relative w-full max-w-sm bg-surface-container-lowest rounded-[2.5rem] p-8 ambient-shadow space-y-6">
              <h3 className="text-xl font-bold text-on-surface">修改登录密码</h3>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-4">当前密码</label>
                  <input required type="password" value={passwordData.old} onChange={e => setPasswordData(p => ({...p, old: e.target.value}))} className="w-full bg-surface-container-low border-0 rounded-full py-4 px-6 text-sm" placeholder="请输入原密码" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-4">新密码</label>
                  <input required type="password" value={passwordData.new} onChange={e => setPasswordData(p => ({...p, new: e.target.value}))} className="w-full bg-surface-container-low border-0 rounded-full py-4 px-6 text-sm" placeholder="请输入新密码" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-4">确认新密码</label>
                  <input required type="password" value={passwordData.confirm} onChange={e => setPasswordData(p => ({...p, confirm: e.target.value}))} className="w-full bg-surface-container-low border-0 rounded-full py-4 px-6 text-sm" placeholder="请再次输入新密码" />
                </div>
                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => setShowPasswordForm(false)} className="flex-1 py-4 rounded-full bg-surface-container-low font-bold text-on-surface-variant">取消</button>
                  <button type="submit" className="flex-1 py-4 rounded-full bg-primary font-bold text-on-primary shadow-lg shadow-primary/20">确认修改</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showLanguagePicker && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLanguagePicker(false)} className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-surface-container-lowest rounded-t-[2.5rem] p-8 ambient-shadow space-y-6">
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-xl font-bold text-on-surface">选择系统语言</h3>
                <button onClick={() => setShowLanguagePicker(false)} className="p-2 bg-surface-container-low rounded-full"><X size={18} /></button>
              </div>
              <div className="space-y-3">
                <button onClick={() => handleLanguageSelect('zh')} className={cn("w-full flex items-center justify-between p-5 rounded-3xl transition-all", currentLanguage === 'zh' ? "bg-primary-container/20 border-2 border-primary" : "bg-surface-container-low")}>
                  <span className={cn("font-bold text-lg", currentLanguage === 'zh' ? "text-primary" : "text-on-surface")}>简体中文 (默认)</span>
                  {currentLanguage === 'zh' && <Check size={24} className="text-primary" />}
                </button>
                <button onClick={() => handleLanguageSelect('en')} className={cn("w-full flex items-center justify-between p-5 rounded-3xl transition-all", currentLanguage === 'en' ? "bg-primary-container/20 border-2 border-primary" : "bg-surface-container-low")}>
                  <span className={cn("font-bold text-lg", currentLanguage === 'en' ? "text-primary" : "text-on-surface")}>English</span>
                  {currentLanguage === 'en' && <Check size={24} className="text-primary" />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
