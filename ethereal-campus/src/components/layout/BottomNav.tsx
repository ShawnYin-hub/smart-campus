import React from 'react';
import { Home, Calendar, LayoutGrid, Scan, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

export type Screen = 'home' | 'schedule' | 'services' | 'recognition' | 'settings';

interface BottomNavProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}

export function BottomNav({ activeScreen, setActiveScreen }: BottomNavProps) {
  const navItems = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'schedule', label: '课程', icon: Calendar },
    { id: 'services', label: '服务', icon: LayoutGrid },
    { id: 'recognition', label: '识别', icon: Scan },
    { id: 'settings', label: '设置', icon: Settings },
  ] as const;

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-50 flex justify-around items-center h-16 bg-surface-container-lowest/80 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/20">
      {navItems.map(({ id, label, icon: Icon }) => {
        const isActive = activeScreen === id;
        return (
          <button
            key={id}
            onClick={() => setActiveScreen(id)}
            className="relative flex flex-col items-center justify-center h-full flex-1 outline-none group"
          >
            <div className="relative flex flex-col items-center gap-0.5">
              <Icon 
                size={22} 
                className={cn(
                  "transition-all duration-500",
                  isActive ? "text-primary scale-110" : "text-on-surface-variant/40 group-hover:text-on-surface-variant/70"
                )} 
                strokeWidth={isActive ? 2.2 : 1.8} 
              />
              <span className={cn(
                "text-[10px] font-bold tracking-tight transition-all duration-500",
                isActive ? "text-primary opacity-100" : "text-on-surface-variant/40"
              )}>
                {label}
              </span>
              
              {isActive && (
                <motion.div 
                  layoutId="active-nav-dot"
                  className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
}
