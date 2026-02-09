<script setup lang="ts">
import { useToast } from '../../composables/useToast';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-vue-next';

const { toasts, removeToast } = useToast();

const getIcon = (type: string) => {
    switch (type) {
        case 'success': return CheckCircle;
        case 'error': return AlertCircle;
        case 'warning': return AlertTriangle;
        default: return Info;
    }
};
</script>

<template>
    <div class="toast-container">
        <TransitionGroup name="toast">
            <div
                v-for="toast in toasts"
                :key="toast.id"
                :class="['toast', `toast-${toast.type}`]"
            >
                <component :is="getIcon(toast.type)" class="toast-icon" />
                <span class="toast-message">{{ toast.message }}</span>
                <button class="toast-close" @click="removeToast(toast.id)">
                    <X class="icon-sm" />
                </button>
            </div>
        </TransitionGroup>
    </div>
</template>

<style scoped>
.toast-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    pointer-events: none;
}

.toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border-radius: 0.5rem;
    min-width: 300px;
    max-width: 400px;
    border-left: 4px solid;
    animation: slideIn 0.3s ease-out forwards;
}

.toast-success { border-left-color: #10B981; }
.toast-success .toast-icon { color: #10B981; }

.toast-error { border-left-color: #EF4444; }
.toast-error .toast-icon { color: #EF4444; }

.toast-warning { border-left-color: #F59E0B; }
.toast-warning .toast-icon { color: #F59E0B; }

.toast-info { border-left-color: #3B82F6; }
.toast-info .toast-icon { color: #3B82F6; }

.toast-message {
    flex: 1;
    font-size: 0.875rem;
    color: #1F2937;
    font-weight: 500;
}

.toast-close {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #9CA3AF;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.toast-close:hover { color: #4B5563; }

.icon-sm { width: 1rem; height: 1rem; }
.toast-icon { width: 1.25rem; height: 1.25rem; }

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
