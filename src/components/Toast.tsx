import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertOctagon, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setIsVisible(true), 10);
    
    // Trigger leave animation before removal
    const leaveTimer = setTimeout(() => {
      setIsLeaving(true);
    }, 3700);

    const removeTimer = setTimeout(() => {
      onRemove(toast.id);
    }, 4000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(leaveTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, onRemove]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const config = {
    success: {
      bg: 'bg-slate-900/95 border-emerald-500/30',
      text: 'text-slate-100',
      icon: <CheckCircle size={18} className="text-emerald-400" />,
      stripe: 'bg-emerald-500'
    },
    error: {
      bg: 'bg-slate-900/95 border-rose-500/30',
      text: 'text-slate-100',
      icon: <AlertOctagon size={18} className="text-rose-400" />,
      stripe: 'bg-rose-500'
    },
    warning: {
      bg: 'bg-slate-900/95 border-amber-500/30',
      text: 'text-slate-100',
      icon: <AlertTriangle size={18} className="text-amber-400" />,
      stripe: 'bg-amber-500'
    },
    info: {
      bg: 'bg-slate-900/95 border-indigo-500/30',
      text: 'text-slate-100',
      icon: <Info size={18} className="text-indigo-400" />,
      stripe: 'bg-indigo-500'
    }
  };

  const style = config[toast.type];

  // Base styles
  let transformClasses = 'translate-y-4 opacity-0 scale-95';
  if (isVisible && !isLeaving) {
    transformClasses = 'translate-y-0 opacity-100 scale-100';
  } else if (isLeaving) {
    transformClasses = 'opacity-0 scale-95';
  }

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 border rounded-lg shadow-2xl backdrop-blur-md min-w-[280px] max-w-[380px] relative overflow-hidden transition-all duration-300 ${transformClasses} ${style.bg} ${style.text}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.stripe}`} />
      <div className="flex-shrink-0">{style.icon}</div>
      <div className="flex-grow text-sm font-medium pr-4">{toast.text}</div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};
