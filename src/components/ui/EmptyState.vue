<script setup lang="ts">
import { PackageOpen } from 'lucide-vue-next';

interface Props {
    title?: string;
    message?: string;
    icon?: any;
}

withDefaults(defineProps<Props>(), {
    title: 'Sin datos',
    message: 'No hay información para mostrar',
});
</script>

<template>
    <div class="empty-state">
        <component :is="icon || PackageOpen" class="empty-icon" />
        <h3 class="empty-title">{{ title }}</h3>
        <p class="empty-message">{{ message }}</p>
        <slot name="action"></slot>
    </div>
</template>

<style scoped>
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
}

.empty-icon {
    width: 64px;
    height: 64px;
    color: var(--text-light);
    opacity: 0.5;
    margin-bottom: 1.5rem;
}

.empty-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 0.5rem 0;
}

.empty-message {
    font-size: 0.95rem;
    color: var(--text-light);
    margin: 0 0 1.5rem 0;
    max-width: 400px;
}
</style>
