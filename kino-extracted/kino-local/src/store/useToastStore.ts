import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = uuidv4();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
}));
