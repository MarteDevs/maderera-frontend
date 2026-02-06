<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    loading?: boolean;
    size?: 'sm' | 'md' | 'lg';
    fullscreen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    loading: true,
    size: 'md',
    fullscreen: false,
});

const sizeClasses = computed(() => {
    switch (props.size) {
        case 'sm':
            return 'spinner-sm';
        case 'lg':
            return 'spinner-lg';
        default:
            return 'spinner-md';
    }
});
</script>

<template>
    <div v-if="loading" :class="['loading-container', { 'fullscreen': fullscreen }]">
        <div :class="['spinner', sizeClasses]"></div>
    </div>
</template>

<style scoped>
.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
}

.loading-container.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    z-index: 9999;
}

.spinner {
    border: 3px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

.spinner-sm {
    width: 20px;
    height: 20px;
    border-width: 2px;
}

.spinner-md {
    width: 40px;
    height: 40px;
    border-width: 3px;
}

.spinner-lg {
    width: 60px;
    height: 60px;
    border-width: 4px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
