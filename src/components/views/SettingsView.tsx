import React, { useState, useRef, ChangeEvent } from 'react';
import {
  User,
  Camera,
  Mail,
  Shield,
  LogOut,
  Check,
  ChevronRight,
  Bell,
  Eye,
  Lock,
  Loader2,
  EyeOff,
} from 'lucide-react';
import { changePassword } from '../../services/auth.service';
import { useToast } from '../../components/ui/Toast';

interface SettingsViewProps {
  userName: string;
  userRole: string;
  userEmail: string;
  userAvatar: string;
  userBio: string;
  onUpdateProfile: (name: string, avatar: string, role: string, email: string, bio: string) => void;
  onLogout: () => void;
}

type TabKey = 'profile' | 'security';

export default function SettingsView({
  userName,
  userRole,
  userEmail,
  userAvatar,
  userBio,
  onUpdateProfile,
  onLogout,
}: SettingsViewProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [name, setName] = useState(userName);
  const [avatar, setAvatar] = useState(userAvatar);
  const [role, setRole] = useState(userRole);
  const [email, setEmail] = useState(userEmail);
  const [bio, setBio] = useState(userBio);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pwdOld, setPwdOld] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);

  const handleSave = () => {
    onUpdateProfile(name, avatar, role, email, bio);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleChangePassword = async () => {
    if (!pwdOld) {
      showToast('error', '请输入当前密码');
      return;
    }
    if (pwdNew.length < 6) {
      showToast('error', '新密码至少 6 位');
      return;
    }
    if (pwdNew !== pwdConfirm) {
      showToast('error', '两次密码输入不一致');
      return;
    }
    setPwdSaving(true);
    try {
      await changePassword(pwdOld, pwdNew);
      showToast('success', '密码修改成功');
      setPwdOld('');
      setPwdNew('');
      setPwdConfirm('');
    } catch (err) {
      showToast('error', (err as Error).message || '修改密码失败');
    } finally {
      setPwdSaving(false);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactElement }[] = [
    { key: 'profile', label: '基本设置', icon: <User size={16} /> },
    { key: 'security', label: '安全设置', icon: <Shield size={16} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-display font-extrabold text-midnight flex items-center gap-2">
              <User size={20} className="text-mahogany" />
              个人资料设置
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stony uppercase tracking-widest pl-1">显示名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-mahogany/50 outline-none transition-all shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stony uppercase tracking-widest pl-1">角色</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-mahogany/50 outline-none transition-all shadow-inner"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stony uppercase tracking-widest pl-1">登录邮箱</label>
              <div className="relative group">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stony group-focus-within:text-mahogany transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-mahogany/50 outline-none transition-all shadow-inner"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stony uppercase tracking-widest pl-1">个人简介（选填）</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="请输入您的个人简介..."
                rows={4}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-mahogany/50 outline-none transition-all shadow-inner resize-none"
              />
            </div>
            <div className="pt-4 flex justify-end gap-4">
              <button
                onClick={() => { setName(userName); setAvatar(userAvatar); setRole(userRole); setEmail(userEmail); setBio(userBio); }}
                className="px-6 py-3 text-stony font-bold text-sm hover:text-midnight transition-colors"
              >
                重置
              </button>
              <button
                onClick={handleSave}
                className={`px-10 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
                  isSaved ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-midnight text-white shadow-midnight/20 hover:bg-mahogany'
                }`}
              >
                {isSaved ? <Check size={18} /> : null}
                {isSaved ? '已保存' : '保存更改'}
              </button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-display font-extrabold text-midnight flex items-center gap-2">
              <Shield size={20} className="text-mahogany" />
              安全设置
            </h4>
            <div className="bg-gray-50 rounded-2xl p-6 space-y-5 border border-gray-100">
              <p className="text-sm font-bold text-midnight">修改登录密码</p>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stony uppercase tracking-widest pl-1">当前密码</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stony" />
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={pwdOld}
                    onChange={e => setPwdOld(e.target.value)}
                    placeholder="请输入当前密码"
                    className="w-full bg-white border border-gray-100 rounded-xl pl-12 pr-12 py-3 text-sm font-medium focus:ring-2 focus:ring-mahogany/50 outline-none transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stony hover:text-midnight transition-colors"
                  >
                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stony uppercase tracking-widest pl-1">新密码</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stony" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={pwdNew}
                    onChange={e => setPwdNew(e.target.value)}
                    placeholder="至少 6 位"
                    className="w-full bg-white border border-gray-100 rounded-xl pl-12 pr-12 py-3 text-sm font-medium focus:ring-2 focus:ring-mahogany/50 outline-none transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stony hover:text-midnight transition-colors"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stony uppercase tracking-widest pl-1">确认新密码</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stony" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={pwdConfirm}
                    onChange={e => setPwdConfirm(e.target.value)}
                    placeholder="请再次输入新密码"
                    className="w-full bg-white border border-gray-100 rounded-xl pl-12 pr-12 py-3 text-sm font-medium focus:ring-2 focus:ring-mahogany/50 outline-none transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stony hover:text-midnight transition-colors"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleChangePassword}
                  disabled={pwdSaving}
                  className="px-8 py-3 bg-mahogany text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:bg-mahogany/90 transition-colors disabled:opacity-50"
                >
                  {pwdSaving && <Loader2 size={16} className="animate-spin" />}
                  {pwdSaving ? '保存中...' : '保存密码'}
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="space-y-1">
        <h2 className="text-3xl lg:text-4xl font-display font-extrabold text-midnight tracking-tight">个人中心</h2>
        <p className="text-stony font-medium text-xs lg:text-sm text-balance">管理您的个人资料与安全设置。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="relative group mb-6">
              <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden border-4 border-gray-50 shadow-inner group-hover:opacity-90 transition-opacity">
                <img
                  src={avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-10 h-10 bg-mahogany text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all border-4 border-white"
              >
                <Camera size={16} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </div>
            <h3 className="text-xl font-display font-extrabold text-midnight mb-1 truncate w-full px-2">{name}</h3>
            <p className="text-xs font-bold text-stony uppercase tracking-widest opacity-60 mb-6 truncate w-full px-2">{role}</p>

            <button
              onClick={onLogout}
              className="w-full py-3 bg-red-50 text-red-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all active:scale-95"
            >
              <LogOut size={16} />
              退出登录
            </button>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === tab.key
                    ? 'bg-mahogany text-white shadow-lg shadow-mahogany/20'
                    : 'text-stony hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  {tab.icon}
                  {tab.label}
                </span>
                <ChevronRight size={16} className={activeTab === tab.key ? 'opacity-100' : 'opacity-40'} />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
