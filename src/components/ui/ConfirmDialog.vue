<script setup lang="ts">
import { ref, watch } from 'vue';
import { AlertTriangle } from 'lucide-vue-next';

interface Props {
    visible: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

interface Emits {
    (e: 'update:visible', value: boolean): void;
    (e: 'confirm'): void;
    (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
    title: 'Confirmar acción',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'warning',
    loading: false,
});

const emit = defineEmits<Emits>();

const showDialog = ref(props.visible);

watch(
    () => props.visible,
    (newVal) => {
        showDialog.value = newVal;
    }
);

const handleConfirm = () => {
    emit('confirm');
};

const handleCancel = () => {
    showDialog.value = false;
    emit('update:visible', false);
    emit('cancel');
};

const handleBackdropClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('dialog-backdrop')) {
        handleCancel();
    }
};
</script>

<template>
    <Teleport to="body">
        <Transition name="dialog">
            <div v-if="showDialog" class="dialog-backdrop" @click="handleBackdropClick">
                <div class="dialog-container" @click.stop>
                    <div :class="['dialog-icon', `icon-${variant}`]">
                        <AlertTriangle class="icon" />
                    </div>

                    <div class="dialog-content">
                        <h3 class="dialog-title">{{ title }}</h3>
                        <p class="dialog-message">{{ message }}</p>
                    </div>

                    <div class="dialog-actions">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            @click="handleCancel"
                            :disabled="loading"
                        >
                            {{ cancelText }}
                        </button>
                        <button
                            type="button"
                            :class="['btn', `btn-${variant}`]"
                            @click="handleConfirm"
                            :disabled="loading"
                        >
                            {{ loading ? 'Procesando...' : confirmText }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.dialog-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1001;
    padding: 1rem;
}

.dialog-container {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-width: 450px;
    width: 100%;
    padding: 2rem;
    text-align: center;
}

.dialog-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
}

.icon-danger {
    background-color: #fee2e2;
    color: #dc2626;
}

.icon-warning {
    background-color: #fef3c7;
    color: #d97706;
}

.icon-info {
    background-color: #dbeafe;
    color: #2563eb;
}

.icon {
    width: 32px;
    height: 32px;
}

.dialog-content {
    margin-bottom: 2rem;
}

.dialog-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 0.75rem 0;
}

.dialog-message {
    font-size: 0.95rem;
    color: var(--text-light);
    margin: 0;
    line-height: 1.5;
}

.dialog-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
}

.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.95rem;
    font-weight: 600;
    transition: all 0.2s;
    min-width: 100px;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-secondary {
    background-color: var(--background);
    color: var(--text);
}

.btn-secondary:hover:not(:disabled) {
    background-color: #e5e7eb;
}

.btn-danger {
    background-color: #dc2626;
    color: white;
}

.btn-danger:hover:not(:disabled) {
    background-color: #b91c1c;
}

.btn-warning {
    background-color: #d97706;
    color: white;
}

.btn-warning:hover:not(:disabled) {
    background-color: #b45309;
}

.btn-info {
    background-color: #2563eb;
    color: white;
}

.btn-info:hover:not(:disabled) {
    background-color: #1d4ed8;
}

/* Transitions */
.dialog-enter-active,
.dialog-leave-active {
    transition: opacity 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
    opacity: 0;
}

.dialog-enter-active .dialog-container,
.dialog-leave-active .dialog-container {
    transition: transform 0.3s ease;
}

.dialog-enter-from .dialog-container,
.dialog-leave-to .dialog-container {
    transform: scale(0.9);
}
</style>
