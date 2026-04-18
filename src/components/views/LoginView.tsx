import { useState, FormEvent } from 'react';
import {
  Lock,
  User,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'motion/react';

interface LoginViewProps {
  onLogin: (username: string, password: string) => void;
  appName: string;
  logoUrl: string;
  isLoading?: boolean;
  error?: string;
}

export default function LoginView({
  onLogin,
  appName,
  logoUrl,
  isLoading = false,
  error = '',
}: LoginViewProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    onLogin(identifier, password);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 selection:bg-mahogany/10 transition-colors duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-mahogany/5 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-midnight/5 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] p-10 lg:p-12 shadow-2xl shadow-gray-200/50 border border-gray-100 relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-white rounded-2xl shadow-xl shadow-mahogany/10 border border-gray-50 flex items-center justify-center mb-6 overflow-hidden"
          >
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
          </motion.div>
          <h1 className="text-3xl font-display font-extrabold text-midnight tracking-tight mb-2 uppercase italic">{appName}</h1>
          <p className="text-stony text-sm font-medium">欢迎回来，请登录您的管理账户</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stony uppercase tracking-[0.2em] pl-1">用户名或邮箱</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stony group-focus-within:text-mahogany transition-colors" size={18} />
              <input 
                type="text" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="请输入您的账号..."
                className="w-full bg-gray-50 border border-transparent focus:border-mahogany/20 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-mahogany/5 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-stony uppercase tracking-[0.2em] pl-1">密码</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stony group-focus-within:text-mahogany transition-colors" size={18} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-transparent focus:border-mahogany/20 rounded-2xl py-3.5 pl-12 pr-12 text-sm font-medium outline-none focus:ring-4 focus:ring-mahogany/5 transition-all shadow-inner"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stony hover:text-midnight transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-500 font-bold text-center">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-mahogany focus:ring-mahogany cursor-pointer" />
              <span className="text-xs text-stony font-bold group-hover:text-midnight transition-colors">记住我</span>
            </label>
            <button type="button" className="text-xs text-mahogany font-bold hover:underline">忘记密码？</button>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-midnight text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-midnight/20 hover:bg-mahogany transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none mt-8"
          >
            {isLoading ? (
              <Sparkles className="animate-spin" size={20} />
            ) : (
              <>
                <span>立即登录</span>
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-10 border-t border-gray-50 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-stony font-bold text-[10px] uppercase tracking-widest">
            <ShieldCheck size={14} />
            校园安全验证已开启
          </div>
          <p className="text-[10px] text-stony/60 font-medium text-center max-w-[240px]">
            如遇登录困难，请联系系统管理员或所在校区信息中心。
          </p>
        </div>
      </motion.div>
    </div>
  );
}
