<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useRequerimientosStore } from '../requerimientos/requerimientos.store';
import { useViajesStore } from '../viajes/viajes.store';
import { useInventarioStore } from '../inventario/inventario.store';
import { useRouter } from 'vue-router';
import { FileClock, Truck, PackageCheck, AlertTriangle } from 'lucide-vue-next';

// ... (logic remains the same) ...
const router = useRouter();
const reqStore = useRequerimientosStore();
const viajesStore = useViajesStore();
const invStore = useInventarioStore();

const loading = ref(true);

onMounted(async () => {
    try {
        await Promise.all([
            reqStore.fetchRequerimientos(),
            viajesStore.fetchViajes(),
            invStore.fetchStock()
        ]);
    } catch (e) {
        console.error('Error loading dashboard data', e);
    } finally {
        loading.value = false;
    }
});

const activeReqs = computed(() => reqStore.requerimientos.filter(r => r.estado === 'PENDIENTE').length);
const totalViajes = computed(() => viajesStore.viajes.length);
const totalProductos = computed(() => invStore.stock.length);
const lowStock = computed(() => invStore.stock.filter(p => (p.stock_actual || 0) < 10).length);

const navigateTo = (path: string) => router.push(path);
</script>

<template>
    <div class="dashboard-overview">
        <!-- Hero Section -->
        <div class="hero-banner">
            <div class="hero-content">
                <h1 class="hero-title">Bienvenido al ERP Madera</h1>
                <p class="hero-subtitle">Gestión integral de logística y operaciones en tiempo real.</p>
            </div>
            <div class="hero-pattern"></div>
        </div>

        <!-- KPI Grid -->
        <div class="kpi-grid">
            <!-- Skeletons -->
            <template v-if="loading">
                <div class="kpi-card skeleton-card" v-for="i in 4" :key="i">
                    <div class="skeleton-icon"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-value"></div>
                    </div>
                </div>
            </template>

            <!-- Real Content -->
            <template v-else>
                <div class="kpi-card card-hover" @click="navigateTo('/requirements')">
                    <div class="icon-wrapper bg-orange">
                        <FileClock class="icon" />
                    </div>
                    <div class="kpi-content">
                        <span class="kpi-title">Requerimientos Pendientes</span>
                        <span class="kpi-value text-orange">{{ activeReqs }}</span>
                    </div>
                </div>
                
                <div class="kpi-card card-hover" @click="navigateTo('/viajes')">
                    <div class="icon-wrapper bg-blue">
                        <Truck class="icon" />
                    </div>
                    <div class="kpi-content">
                        <span class="kpi-title">Viajes Registrados</span>
                        <span class="kpi-value text-blue">{{ totalViajes }}</span>
                    </div>
                </div>
                
                <div class="kpi-card card-hover" @click="navigateTo('/inventory')">
                        <div class="icon-wrapper bg-emerald">
                        <PackageCheck class="icon" />
                    </div>
                    <div class="kpi-content">
                        <span class="kpi-title">Productos en Stock</span>
                        <span class="kpi-value text-emerald">{{ totalProductos }}</span>
                    </div>
                </div>

                <div class="kpi-card card-hover" @click="navigateTo('/inventory')">
                    <div class="icon-wrapper bg-red">
                        <AlertTriangle class="icon" />
                    </div>
                    <div class="kpi-content">
                        <span class="kpi-title">Alerta Stock Bajo</span>
                        <span class="kpi-value text-red">{{ lowStock }}</span>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.dashboard-overview {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

/* Hero Banner */
.hero-banner {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    border-radius: var(--radius-lg);
    padding: 3rem 2.5rem;
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
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.02em;
}

.hero-subtitle {
    font-size: 1.1rem;
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

/* KPI Grid */
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.5rem;
}

.kpi-card {
    background: var(--surface);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    border: 1px solid var(--border);
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s ease;
}

.icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.icon {
    width: 24px;
    height: 24px;
    color: white;
}

.bg-orange { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3); }
.bg-blue { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
.bg-emerald { background: linear-gradient(135deg, #10B981 0%, #059669 100%); box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
.bg-red { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); }

.kpi-content {
    display: flex;
    flex-direction: column;
}

.kpi-title {
    font-size: 0.9rem;
    color: var(--text-muted);
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.kpi-value {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.2;
}

.text-orange { color: #D97706; }
.text-blue { color: #2563EB; }
.text-emerald { color: #059669; }
.text-red { color: #DC2626; }
</style>
