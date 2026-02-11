
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    title: string;
    value: string | number;
    icon: any;
    trend?: number; // Porcentaje de cambio (opcional para v2)
    color?: string; // Clase de color (bg-blue-500, etc.)
    prefix?: string;
}>();

const formattedValue = computed(() => {
    if (typeof props.value === 'number') {
        return props.prefix 
            ? `${props.prefix} ${props.value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : props.value;
    }
    return props.value;
});
</script>

<template>
    <div class="kpi-card">
        <div class="kpi-icon" :class="color || 'bg-blue-100 text-blue-600'">
            <component :is="icon" class="icon" />
        </div>
        <div class="kpi-content">
            <span class="kpi-title">{{ title }}</span>
            <span class="kpi-value">{{ formattedValue }}</span>
        </div>
    </div>
</template>

<style scoped>
.kpi-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: transform 0.2s;
    border: 1px solid #e5e7eb;
}

.kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.kpi-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon {
    width: 24px;
    height: 24px;
}

.kpi-content {
    display: flex;
    flex-direction: column;
}

.kpi-title {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
}

.kpi-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
}

/* Colores predefinidos */
.bg-blue-100 { background-color: #dbeafe; }
.text-blue-600 { color: #2563eb; }

.bg-green-100 { background-color: #dcfce7; }
.text-green-600 { color: #166534; }

.bg-red-100 { background-color: #fee2e2; }
.text-red-600 { color: #dc2626; }

.bg-purple-100 { background-color: #f3e8ff; }
.text-purple-600 { color: #9333ea; }
</style>
