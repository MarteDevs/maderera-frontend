
<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TopMina {
    nombre: string;
    valor: number;
}

const props = defineProps<{
    data: TopMina[];
}>();

const chartData = computed(() => ({
    labels: props.data.map(d => d.nombre),
    datasets: [
        {
            label: 'Valor Despachado (S/.)',
            backgroundColor: [
                '#3b82f6',
                '#8b5cf6',
                '#10b981',
                '#f59e0b',
                '#ef4444'
            ],
            data: props.data.map(d => d.valor),
            borderRadius: 6
        }
    ]
}));

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const, // Horizontal bar chart
    plugins: {
        legend: {
            display: false
        }
    },
    scales: {
        x: {
            beginAtZero: true,
            ticks: {
                callback: (value: any) => `S/. ${value}`
            }
        }
    }
};
</script>

<template>
    <div class="chart-container">
        <Bar :data="chartData" :options="chartOptions" />
    </div>
</template>

<style scoped>
.chart-container {
    position: relative;
    height: 100%;
    width: 100%;
}
</style>
