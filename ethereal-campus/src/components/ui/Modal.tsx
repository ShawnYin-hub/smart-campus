import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
  children?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, description, type = 'info', children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-surface-container-lowest rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center gap-6"
          >
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              type === 'success' ? "bg-secondary-container/30 text-secondary" :
              type === 'error' ? "bg-error-container/30 text-error" :
              "bg-primary-container/30 text-primary"
            )}>
              {type === 'success' && <CheckCircle2 size={32} />}
              {type === 'error' && <AlertCircle size={32} />}
              {type === 'info' && <Info size={32} />}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-on-surface">{title}</h3>
              {description && <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>}
            </div>

            {children}

            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
