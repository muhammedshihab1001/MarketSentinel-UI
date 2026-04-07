import { toast } from 'sonner';

export const notify = {
  success: (message: string, description?: string) => {
    toast.success(message, { description });
  },
  error: (message: string, description?: string) => {
    toast.error(message, { description });
  },
  info: (message: string, description?: string) => {
    toast(message, { description });
  },
  warning: (message: string, description?: string) => {
    toast.message(message, {
      description,
      style: { background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#f59e0b' }
    });
  },
};
