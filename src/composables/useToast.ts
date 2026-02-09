import { ref } from 'vue';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

const toasts = ref<Toast[]>([]);

export function useToast() {
    const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substring(2);
        toasts.value.push({ id, message, type, duration });

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };

    const removeToast = (id: string) => {
        const index = toasts.value.findIndex(t => t.id === id);
        if (index !== -1) {
            toasts.value.splice(index, 1);
        }
    };

    return {
        toasts,
        addToast,
        removeToast,
        success: (msg: string, duration?: number) => addToast(msg, 'success', duration),
        error: (msg: string, duration?: number) => addToast(msg, 'error', duration),
        warning: (msg: string, duration?: number) => addToast(msg, 'warning', duration),
        info: (msg: string, duration?: number) => addToast(msg, 'info', duration),
    };
}
