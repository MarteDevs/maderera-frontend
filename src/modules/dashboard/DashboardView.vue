<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { reportesService, type KpiData, type TopMina, type TendenciaData } from '../reportes/reportes.service';
import KpiCard from '../reportes/components/KpiCard.vue';
import SalesChart from '../reportes/components/SalesChart.vue';
import TopMinasChart from '../reportes/components/TopMinasChart.vue';
import { DollarSign, ShoppingCart, Truck, TrendingUp } from 'lucide-vue-next';

const loading = ref(true);
const kpis = ref<KpiData>({
    valorInventario: 0,
    gastoRequerimientos: 0,
    valorDespachado: 0,
    cantidadDespachos: 0,
    flujoNeto: 0
});
const topMinas = ref<TopMina[]>([]);
const tendencia = ref<TendenciaData[]>([]);

onMounted(async () => {
    try {
        const [kpiData, minasData, trendData] = await Promise.all([
            reportesService.getKpis(),
            reportesService.getTopMinas(),
            reportesService.getTendencia()
        ]);
        
        kpis.value = kpiData;
        topMinas.value = minasData;
        tendencia.value = trendData;
    } catch (error) {
        console.error('Error loading dashboard data', error);
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <div class="dashboard-overview">
        <!-- Hero Section -->
        <div class="hero-banner">
            <div class="hero-content">
                <h1 class="hero-title">Bienvenido al ERP Madera</h1>
                <p class="hero-subtitle">Resumen financiero y operativo en tiempo real.</p>
            </div>
            <div class="hero-pattern"></div>
        </div>

        <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Calculando métricas...</p>
        </div>

        <div v-else class="dashboard-content">
            <!-- KPI Grid -->
            <div class="kpi-grid">
                <KpiCard 
                    title="Valor Inventario" 
                    :value="kpis.valorInventario" 
                    :icon="DollarSign" 
                    prefix="S/."
                    color="bg-purple-100 text-purple-600"
                />
                <KpiCard 
                    title="Compras del Mes" 
                    :value="kpis.gastoRequerimientos" 
                    :icon="ShoppingCart" 
                    prefix="S/."
                    color="bg-red-100 text-red-600"
                />
                <KpiCard 
                    title="Ventas del Mes" 
                    :value="kpis.valorDespachado" 
                    :icon="TrendingUp" 
                    prefix="S/."
                    color="bg-green-100 text-green-600"
                />
                <KpiCard 
                    title="Despachos" 
                    :value="kpis.cantidadDespachos" 
                    :icon="Truck" 
                    color="bg-blue-100 text-blue-600"
                />
            </div>

            <!-- Charts Row -->
            <div class="charts-row">
                <div class="chart-card main-chart">
                    <h3>Tendencia Financiera (6 Meses)</h3>
                    <div class="chart-wrapper">
                        <SalesChart :data="tendencia" />
                    </div>
                </div>
                <div class="chart-card side-chart">
                    <h3>Top Minas (Valor)</h3>
                    <div class="chart-wrapper">
                        <TopMinasChart :data="topMinas" />
                    </div>
                </div>
            </div>

            <!-- Flujo Neto Summary -->
             <div class="summary-section">
                <div class="summary-card" :class="kpis.flujoNeto >= 0 ? 'positive' : 'negative'">
                    <h3>Flujo Neto del Mes (Ventas - Compras)</h3>
                    <span class="net-value">
                        {{ kpis.flujoNeto >= 0 ? '+' : '' }} S/. {{ kpis.flujoNeto.toLocaleString('es-PE', { minimumFractionDigits: 2 }) }}
                    </span>
                    <p class="net-subtitle">
                        {{ kpis.flujoNeto >= 0 ? 'Superávit Operativo' : 'Déficit Operativo' }} este mes
                    </p>
                </div>
             </div>
        </div>
    </div>
</template>

<style scoped>
.dashboard-overview {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding-bottom: 2rem;
}

/* Hero Banner */
.hero-banner {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    border-radius: var(--radius-lg);
    padding: 2.5rem 2.5rem;
    color: white;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-md);
}

.hero-content {
    position: relative;
    z-index: 2;
}

.hero-title {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.02em;
}

.hero-subtitle {
    font-size: 1rem;
    opacity: 0.9;
    margin: 0;
    font-weight: 300;
}

.hero-pattern {
    position: absolute;
    top: 0;
    right: 0;
    width: 60%;
    height: 100%;
    background-image: radial-gradient(circle at center, rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 20px 20px;
    opacity: 0.5;
    mask-image: linear-gradient(to left, black, transparent);
    -webkit-mask-image: linear-gradient(to left, black, transparent);
}

.dashboard-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

/* KPI Grid */
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.5rem;
}

/* Charts */
.charts-row {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.chart-card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
}

.chart-card h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #374151;
    margin-bottom: 1.5rem;
}

.main-chart {
    flex: 2;
    min-width: 400px;
}

.side-chart {
    flex: 1;
    min-width: 300px;
}

.chart-wrapper {
    height: 300px;
    position: relative;
}

/* Summary */
.summary-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    border: 1px solid #e5e7eb;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.net-value {
    display: block;
    font-size: 2.5rem;
    font-weight: 800;
    margin: 0.5rem 0;
}

.positive .net-value { color: #166534; }
.negative .net-value { color: #dc2626; }

.positive .net-subtitle { color: #15803d; }
.negative .net-subtitle { color: #b91c1c; }

/* In case needed elsewhere */
.bg-orange { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); }
.bg-blue { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); }
.bg-emerald { background: linear-gradient(135deg, #10B981 0%, #059669 100%); }
.bg-red { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); }
.text-orange { color: #D97706; }
.text-blue { color: #2563EB; }
.text-emerald { color: #059669; }
.text-red { color: #DC2626; }

/* Loading */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    color: #6b7280;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top-color: #8B1E1E;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
    .charts-row {
        flex-direction: column;
    }
    .main-chart, .side-chart {
        width: 100%;
    }
}
</style>
