import React from 'react';
import { Bell } from 'lucide-react';
import { motion } from 'motion/react';
import type { SchoolInfo } from '@/src/types';

interface TopBarProps {
  school: SchoolInfo;
  onNotifyClick: () => void;
}

export function TopBar({ school, onNotifyClick }: TopBarProps) {
  return (
    <header className="flex justify-between items-center px-6 py-4 w-full sticky top-0 glass z-50 ambient-shadow">
      <div className="flex items-center gap-3">
        <img
          alt={`${school.name} logo`}
          className="w-10 h-10 rounded-full object-cover shadow-sm"
          src={school.logoUrl}
          referrerPolicy="no-referrer"
        />
        <h1 className="font-display font-bold tracking-[-0.03em] text-2xl text-primary uppercase">
          {school.name}
        </h1>
      </div>
      <motion.button 
        onClick={onNotifyClick}
        whileTap={{ scale: 0.9 }}
        className="text-primary hover:opacity-80 transition-opacity flex items-center justify-center relative"
      >
        <Bell size={24} />
        <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-white" />
      </motion.button>
    </header>
  );
}
