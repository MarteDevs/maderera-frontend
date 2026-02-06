<script setup lang="ts">
import { computed } from 'vue';
import type { EstadoRequerimiento, EstadoEntrega } from '../../types/models';

interface Props {
    status: EstadoRequerimiento | EstadoEntrega | string;
    type?: 'requerimiento' | 'entrega' | 'custom';
}

const props = withDefaults(defineProps<Props>(), {
    type: 'custom',
});

const badgeClass = computed(() => {
    if (props.type === 'requerimiento') {
        switch (props.status) {
            case 'PENDIENTE':
                return 'badge-warning';
            case 'PARCIAL':
                return 'badge-info';
            case 'COMPLETADO':
                return 'badge-success';
            case 'ANULADO':
            case 'RECHAZADO':
                return 'badge-danger';
            default:
                return 'badge-default';
        }
    } else if (props.type === 'entrega') {
        switch (props.status) {
            case 'OK':
                return 'badge-success';
            case 'RECHAZADO':
            case 'DAÑADO':
                return 'badge-danger';
            case 'PARCIAL':
                return 'badge-warning';
            case 'MUESTRA':
                return 'badge-info';
            default:
                return 'badge-default';
        }
    }
    return 'badge-default';
});

const displayText = computed(() => {
    return props.status.replace(/_/g, ' ');
});
</script>

<template>
    <span :class="['status-badge', badgeClass]">
        {{ displayText }}
    </span>
</template>

<style scoped>
.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.badge-success {
    background-color: #d1fae5;
    color: #065f46;
}

.badge-warning {
    background-color: #fef3c7;
    color: #92400e;
}

.badge-danger {
    background-color: #fee2e2;
    color: #991b1b;
}

.badge-info {
    background-color: #dbeafe;
    color: #1e40af;
}

.badge-default {
    background-color: var(--background);
    color: var(--text-light);
}
</style>
