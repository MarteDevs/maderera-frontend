<script setup lang="ts">
import { ref, watch } from 'vue';
import { X } from 'lucide-vue-next';

interface Props {
    visible: boolean;
    title: string;
    loading?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    persistent?: boolean;
}

interface Emits {
    (e: 'update:visible', value: boolean): void;
    (e: 'close'): void;
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    size: 'md',
    persistent: false,
});

const emit = defineEmits<Emits>();

const showModal = ref(props.visible);

watch(
    () => props.visible,
    (newVal) => {
        showModal.value = newVal;
    }
);

const closeModal = () => {
    showModal.value = false;
    emit('update:visible', false);
    emit('close');
};

const handleBackdropClick = (e: MouseEvent) => {
    if (props.persistent) return;
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
        closeModal();
    }
};
</script>

<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="showModal" class="modal-backdrop" @click="handleBackdropClick">
                <div :class="['modal-container', `modal-${size}`]" @click.stop>
                    <div class="modal-header">
                        <h2 class="modal-title">{{ title }}</h2>
                        <button
                            type="button"
                            class="modal-close"
                            @click="closeModal"
                            :disabled="loading"
                        >
                            <X class="icon" />
                        </button>
                    </div>

                    <div class="modal-body">
                        <slot></slot>
                    </div>

                    <div v-if="$slots.footer" class="modal-footer">
                        <slot name="footer"></slot>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 1rem;
}

.modal-container {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    width: 100%;
}

.modal-sm {
    max-width: 400px;
}

.modal-md {
    max-width: 600px;
}

.modal-lg {
    max-width: 800px;
}

.modal-xl {
    max-width: 1200px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
}

.modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text);
    margin: 0;
}

.modal-close {
    background: transparent;
    border: none;
    color: var(--text-light);
    padding: 0.5rem;
    border-radius: var(--radius-md);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-close:hover:not(:disabled) {
    background-color: var(--background);
    color: var(--text);
}

.modal-close:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
}

.modal-footer {
    padding: 1.5rem;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}

.icon {
    width: 1.25rem;
    height: 1.25rem;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
    transition: transform 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
    transform: scale(0.9);
}
</style>
