
<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendData {
    periodo: string;
    gastos: number;
    ventas: number;
}

const props = defineProps<{
    data: TrendData[];
}>();

const chartData = computed(() => ({
    labels: props.data.map(d => d.periodo),
    datasets: [
        {
            label: 'Ventas (Despachos)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: '#10b981',
            data: props.data.map(d => d.ventas),
            fill: true,
            tension: 0.4
        },
        {
            label: 'Gastos (Requerimientos)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: '#ef4444',
            data: props.data.map(d => d.gastos),
            fill: true,
            tension: 0.4
        }
    ]
}));

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top' as const,
        },
        tooltip: {
            mode: 'index' as const,
            intersect: false,
        }
    },
    scales: {
        y: {
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
        <Line :data="chartData" :options="chartOptions" />
    </div>
</template>

<style scoped>
.chart-container {
    position: relative;
    height: 100%;
    width: 100%;
}
</style>
