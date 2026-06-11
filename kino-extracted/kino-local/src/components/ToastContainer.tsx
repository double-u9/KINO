import React from 'react';
import { useToastStore } from '../store/useToastStore';
import { CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const config = {
  success: { Icon: CheckCircle2, color: 'rgba(239,239,239,0.9)' },
  info:    { Icon: Info,         color: 'rgba(239,239,239,0.6)' },
  error:   { Icon: AlertCircle,  color: '#F87171' },
} as const;

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2.5 z-[200] pointer-events-none w-80">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const { Icon, color } = config[toast.type ?? 'info'];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-edge pointer-events-auto"
              style={{
                background: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.08) inset',
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
              <span className="text-sm font-medium text-ink leading-snug">{toast.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
