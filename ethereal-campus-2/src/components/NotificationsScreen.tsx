import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, User, School, ScrollText, ChevronRight, MailOpen, Mail } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { Notification } from '@/src/types';

interface NotificationsScreenProps {
  notifications: Notification[];
}

export function NotificationsScreen({ notifications }: NotificationsScreenProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'school': return <School size={20} />;
      case 'teacher': return <User size={20} />;
      case 'homework': return <ScrollText size={20} />;
      default: return <Bell size={20} />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'school': return "bg-primary/10 text-primary";
      case 'teacher': return "bg-secondary/10 text-secondary";
      case 'homework': return "bg-error/10 text-error";
      default: return "bg-surface-container-high text-on-surface-variant";
    }
  };

  return (
    <div className="pb-40 pt-6 px-6 max-w-md mx-auto space-y-8">
      {/* Header */}
      <section className="flex items-center justify-between px-2">
        <h2 className="text-3xl font-bold text-on-surface tracking-tight">原始通知</h2>
        <div className="flex items-center gap-2 bg-surface-container-low/50 px-3 py-1.5 rounded-full border border-outline-variant/10">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
            {notifications.filter(n => !n.isRead).length} 条未读
          </span>
        </div>
      </section>

      {/* Notifications List */}
      <section className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notif, index) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "group relative bg-surface-container-lowest rounded-[2rem] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.01)] border transition-all duration-300",
                notif.isRead ? "border-outline-variant/5 opacity-70" : "border-primary/10 shadow-[0_8px_24px_rgba(var(--primary-rgb),0.03)]"
              )}
            >
              {!notif.isRead && (
                <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full" />
              )}

              <div className="flex gap-5">
                <div className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500",
                  getColor(notif.type)
                )}>
                  {getIcon(notif.type)}
                </div>

                <div className="flex-grow space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface tracking-tight leading-none">
                      {notif.sender}
                    </span>
                    <span className="text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-widest leading-none">
                      {notif.time}
                    </span>
                  </div>
                  <p className={cn(
                    "text-[13px] leading-relaxed transition-colors",
                    notif.isRead ? "text-on-surface-variant/60" : "text-on-surface font-medium"
                  )}>
                    {notif.content}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-outline-variant/5 flex justify-end">
                <button className={cn(
                  "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
                  notif.isRead ? "text-on-surface-variant/30" : "text-primary hover:text-primary-dim"
                )}>
                  {notif.isRead ? <MailOpen size={14} /> : <Mail size={14} />}
                  {notif.isRead ? '查看详情' : '立即处理'}
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-surface-container-low/30 text-on-surface-variant/20 flex items-center justify-center">
              <Bell size={32} />
            </div>
            <p className="text-sm font-bold text-on-surface-variant/30 uppercase tracking-[0.3em]">
              没有收到任何通知
            </p>
          </div>
        )}
      </section>

      {/* Tip Section */}
      <section className="bg-surface-container-low/30 rounded-[2.5rem] p-6 text-center border border-dashed border-outline-variant/10">
        <p className="text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-[0.2em]">
          以上为学校管理系统下发的原始数据
          <br />
          首页的 AI 智能摘要会自动提炼关键信息
        </p>
      </section>
    </div>
  );
}
