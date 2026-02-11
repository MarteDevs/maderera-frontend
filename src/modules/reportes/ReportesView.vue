<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { reportesService, type KpiData, type TopMina, type TendenciaData } from './reportes.service';
import KpiCard from './components/KpiCard.vue';
import SalesChart from './components/SalesChart.vue';
import TopMinasChart from './components/TopMinasChart.vue';
import { DollarSign, ShoppingCart, Truck, TrendingUp, Download } from 'lucide-vue-next';

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
        console.error('Error loading reports data', error);
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <div class="reportes-container">
        <!-- Header -->
        <div class="page-header">
            <div>
                <h1 class="page-title">Reportes y Analítica</h1>
                <p class="page-subtitle">Visualización detallada de indicadores financieros y operativos</p>
            </div>
            <button class="btn-download">
                <Download :size="18" />
                <span>Exportar PDF</span>
            </button>
        </div>

        <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Cargando datos...</p>
        </div>

        <div v-else class="content-grid">
            <!-- KPI Summary Strip -->
            <div class="kpi-strip">
                <KpiCard 
                    title="Valor Inventario" 
                    :value="kpis.valorInventario" 
                    :icon="DollarSign" 
                    prefix="S/."
                    color="bg-purple-100 text-purple-600"
                />
                <KpiCard 
                    title="Compras (Mes)" 
                    :value="kpis.gastoRequerimientos" 
                    :icon="ShoppingCart" 
                    prefix="S/."
                    color="bg-red-100 text-red-600"
                />
                <KpiCard 
                    title="Ventas (Mes)" 
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

            <!-- Charts Section -->
            <div class="charts-section">
                <div class="chart-card full-width">
                    <div class="card-header">
                        <h3>Evolución Financiera</h3>
                        <div class="card-actions">
                            <select class="period-select">
                                <option>Últimos 6 meses</option>
                                <option>Este año</option>
                            </select>
                        </div>
                    </div>
                    <div class="chart-wrapper large">
                        <SalesChart :data="tendencia" />
                    </div>
                </div>

                <div class="chart-row">
                    <div class="chart-card">
                        <h3>Top Minas por Valor</h3>
                        <div class="chart-wrapper">
                            <TopMinasChart :data="topMinas" />
                        </div>
                    </div>
                    
                    <div class="summary-card" :class="kpis.flujoNeto >= 0 ? 'positive' : 'negative'">
                        <h3>Balance del Periodo</h3>
                        <div class="balance-content">
                            <span class="label">Flujo Neto</span>
                            <span class="net-value">
                                {{ kpis.flujoNeto >= 0 ? '+' : '' }} S/. {{ kpis.flujoNeto.toLocaleString('es-PE', { minimumFractionDigits: 2 }) }}
                            </span>
                            <span class="status-badge">
                                {{ kpis.flujoNeto >= 0 ? 'Superávit' : 'Déficit' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.reportes-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding-bottom: 2rem;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.page-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
}

.page-subtitle {
    margin-top: 0.5rem;
    color: #6b7280;
}

.btn-download {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: white;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-download:hover {
    background-color: #f3f4f6;
    border-color: #9ca3af;
}

.content-grid {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.kpi-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.5rem;
}

.charts-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.chart-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    border: 1px solid #e5e7eb;
}

.full-width {
    width: 100%;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.card-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
}

.period-select {
    padding: 0.375rem 2rem 0.375rem 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid #d1d5db;
    font-size: 0.875rem;
    color: #374151;
    background-color: white;
}

.chart-wrapper {
    position: relative;
    width: 100%;
}

.chart-wrapper.large {
    height: 350px;
}

.chart-row {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
}

@media (max-width: 1024px) {
    .chart-row {
        grid-template-columns: 1fr;
    }
}

.summary-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.summary-card h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1.5rem 0;
    text-align: center;
}

.balance-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.net-value {
    font-size: 2rem;
    font-weight: 800;
    line-height: 1;
}

.positive .net-value { color: #059669; }
.negative .net-value { color: #dc2626; }

.status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
}

.positive .status-badge {
    background-color: #d1fae5;
    color: #065f46;
}

.negative .status-badge {
    background-color: #fee2e2;
    color: #991b1b;
}

/* Loading */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    color: #6b7280;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>
