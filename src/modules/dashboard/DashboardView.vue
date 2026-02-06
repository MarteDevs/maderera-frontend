<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRequerimientosStore } from '../requerimientos/requerimientos.store';
import { useViajesStore } from '../viajes/viajes.store';
import { useInventarioStore } from '../inventario/inventario.store';
import { useRouter } from 'vue-router';

const router = useRouter();
const reqStore = useRequerimientosStore();
const viajesStore = useViajesStore();
const invStore = useInventarioStore();

onMounted(async () => {
    // Cargar datos resumen (idealmente el backend tendría un endpoint /dashboard, 
    // pero por ahora usamos los stores existentes para obtener counts)
    await Promise.all([
        reqStore.fetchRequerimientos(),
        viajesStore.fetchViajes(),
        invStore.fetchStock()
    ]);
});

// KPIs Computados
const activeReqs = computed(() => reqStore.requerimientos.filter(r => r.estado === 'PENDIENTE').length);
const totalViajes = computed(() => viajesStore.viajes.length);
const totalProductos = computed(() => invStore.stock.length);
const lowStock = computed(() => invStore.stock.filter(p => (p.stock_actual || 0) < 10).length);

const navigateTo = (path: string) => router.push(path);
</script>

<template>
    <div class="dashboard-overview">
        <div class="welcome-card">
            <h3>Bienvenido al ERP Madera</h3>
            <p>Resumen de operaciones en tiempo real.</p>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card hoverable" @click="navigateTo('/requirements')">
                <span class="kpi-title">Requerimientos Pendientes</span>
                <span class="kpi-value text-primary">{{ activeReqs }}</span>
            </div>
            
            <div class="kpi-card hoverable" @click="navigateTo('/viajes')">
                <span class="kpi-title">Viajes Registrados</span>
                <span class="kpi-value text-blue">{{ totalViajes }}</span>
            </div>
            
            <div class="kpi-card hoverable" @click="navigateTo('/inventory')">
                <span class="kpi-title">Productos en Stock</span>
                <span class="kpi-value text-green">{{ totalProductos }}</span>
            </div>

            <div class="kpi-card hoverable" @click="navigateTo('/inventory')">
                 <span class="kpi-title">Stock Bajo (&lt; 10)</span>
                 <span class="kpi-value text-red">{{ lowStock }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dashboard-overview {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.welcome-card {
    background: white;
    padding: 1.5rem;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
}

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
}

.kpi-card {
    background: white;
    padding: 1.5rem;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: transform 0.2s, box-shadow 0.2s;
}

.kpi-card.hoverable:hover {
    transform: translateY(-2px);
    cursor: pointer;
    box-shadow: var(--shadow-md);
}

.kpi-title {
    color: var(--text-light);
    font-size: 0.9rem;
    font-weight: 500;
}

.kpi-value {
    font-size: 2.25rem;
    font-weight: 700;
}

.text-primary { color: var(--primary); }
.text-blue { color: #2563eb; }
.text-green { color: #059669; }
.text-red { color: #dc2626; }
</style>
