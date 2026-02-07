<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useViajesStore } from './viajes.store';
import { storeToRefs } from 'pinia';
import DataTable from '../../components/ui/DataTable.vue';
import { Search, X, Truck } from 'lucide-vue-next';
import type { Column } from '../../components/ui/DataTable.vue';

import { useMaestrosStore } from '../../stores/maestros.store';

// Store
const store = useViajesStore();
const maestrosStore = useMaestrosStore();
const { viajes, loading, pagination, filters } = storeToRefs(store);
const { proveedores, minas } = storeToRefs(maestrosStore);

// Modal State
const showModal = ref(false);
const selectedViaje = ref<any>(null);

// Columnas de la tabla
const columns: Column[] = [
    { key: 'id_viaje', label: 'Control #', sortable: true },
    { key: 'req_codigo', label: 'Requerimiento' }, 
    { key: 'prov_nombre', label: 'Proveedor' }, 
    { key: 'mina_nombre', label: 'Mina' },
    { key: 'placa_vehiculo', label: 'Placa' },
    { key: 'conductor', label: 'Conductor' },
    { key: 'fecha_ingreso', label: 'Ingreso', sortable: true },
    { key: 'actions', label: 'Acciones', align: 'center' }
];

// Methods
const openDetails = (viaje: any) => {
    selectedViaje.value = viaje;
    showModal.value = true;
};

const handlePageChange = (page: number) => {
    store.setPage(page);
};

const applyFilters = () => {
    store.fetchViajes();
};

const handleSearch = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    store.setFilters({ search: value });
};

// Cargar datos
onMounted(() => {
    store.fetchViajes();
    maestrosStore.fetchProveedores();
    maestrosStore.fetchMinas();
});
</script>

<template>
    <div class="viajes-view">
        <header class="page-header">
            <div class="header-content">
                <div>
                    <h1 class="page-title">Recepción de Viajes</h1>
                    <p class="page-description">Registro de ingresos de materia prima</p>
                </div>
            </div>
        </header>

        <div class="content-container">
            <!-- Filtros y Búsqueda -->
            <div class="filters-bar">
                <div class="filter-group">
                    <div class="search-box">
                        <Search class="search-icon" />
                        <input 
                            :value="filters.search"
                            @input="handleSearch"
                            type="text" 
                            placeholder="Buscar por placa, conductor..." 
                            class="search-input"
                        />
                    </div>
                </div>

                <div class="filter-group">
                    <select v-model="filters.id_proveedor" @change="applyFilters" class="filter-select">
                        <option value="">Todos los Proveedores</option>
                        <option v-for="prov in proveedores" :key="prov.id_proveedor" :value="prov.id_proveedor">
                            {{ prov.nombre }}
                        </option>
                    </select>

                    <select v-model="filters.id_mina" @change="applyFilters" class="filter-select">
                        <option value="">Todas las Minas</option>
                        <option v-for="mina in minas" :key="mina.id_mina" :value="mina.id_mina">
                            {{ mina.nombre }}
                        </option>
                    </select>
                </div>

                <div class="filter-group">
                    <input type="date" v-model="filters.fecha_inicio" @change="applyFilters" class="filter-date" title="Fecha Inicio" />
                    <span class="text-gray">-</span>
                    <input type="date" v-model="filters.fecha_fin" @change="applyFilters" class="filter-date" title="Fecha Fin" />
                </div>
            </div>

            <!-- Tabla -->
            <DataTable 
                :columns="columns" 
                :data="viajes" 
                :loading="loading"
                :current-page="pagination.page"
                :total-pages="pagination.totalPages"
                :total="pagination.total"
                :page-size="pagination.limit"
                @page-change="handlePageChange"
            >
                <template #cell-id_viaje="{ value }">
                    <span class="font-medium text-primary">#{{ value }}</span>
                </template>
                
                <template #cell-fecha_ingreso="{ value }">
                    {{ new Date(value).toLocaleString() }}
                </template>

                <template #cell-actions="{ row }">
                    <button class="btn-icon" title="Ver Detalle" @click="openDetails(row)">
                        Ver Detalle
                    </button>
                </template>
            </DataTable>
        </div>

        <!-- Modal de Detalles -->
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
            <div class="modal-content">
                <header class="modal-header">
                    <h3>Detalle de Recepción #{{ selectedViaje?.id_viaje }}</h3>
                    <button class="btn-close" @click="showModal = false">
                        <X class="icon" />
                    </button>
                </header>
                
                <div class="modal-body" v-if="selectedViaje">
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Requerimiento</label>
                            <span>{{ selectedViaje.requerimiento?.codigo }}</span>
                        </div>
                        <div class="info-item">
                            <label>Proveedor</label>
                            <span>{{ selectedViaje.requerimiento?.proveedor?.nombre }}</span>
                        </div>
                        <div class="info-item">
                            <label>Vehículo</label>
                            <span>{{ selectedViaje.placa_vehiculo }}</span>
                        </div>
                        <div class="info-item">
                            <label>Conductor</label>
                            <span>{{ selectedViaje.conductor }}</span>
                        </div>
                        <div class="info-item">
                            <label>Fecha Ingreso</label>
                            <span>{{ new Date(selectedViaje.fecha_ingreso).toLocaleString() }}</span>
                        </div>
                    </div>

                    <div class="items-list">
                        <h4>Material Recibido</h4>
                        <div class="table-mini-wrapper">
                            <table class="table-mini">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th class="text-right">Cantidad</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in selectedViaje.detalles" :key="item.id_viaje_detalle">
                                        <td>
                                            <div class="flex-center">
                                                <Truck class="icon-xs text-gray" />
                                                <div class="flex-col">
                                                    <span>{{ item.producto_nombre }}</span>
                                                    <span class="text-xs text-gray" v-if="item.unidad_medida">
                                                        ({{ item.unidad_medida }})
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="text-right bold">{{ item.cantidad_recibida }}</td>
                                        <td>
                                            <span class="badge" :class="item.estado_entrega.toLowerCase()">
                                                {{ item.estado_entrega }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="notes" v-if="selectedViaje.observaciones">
                        <label>Observaciones:</label>
                        <p>{{ selectedViaje.observaciones }}</p>
                    </div>
                </div>

                <footer class="modal-footer">
                    <button class="btn-secondary" @click="showModal = false">Cerrar</button>
                </footer>
            </div>
        </div>
    </div>
</template>

<style scoped>
.viajes-view {
    width: 100%;
}

.page-header {
    margin-bottom: 2rem;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.page-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
}

.page-description {
    color: var(--text-light);
    margin-top: 0.5rem;
}

.content-container {
    background: white;
    padding: 1.5rem;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
}

.filters-bar {
    margin-bottom: 1.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
}

.search-box {
    position: relative;
    max-width: 300px;
}

.search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1.25rem;
    height: 1.25rem;
    color: var(--text-light);
}

.search-input {
    width: 100%;
    padding: 0.625rem 1rem 0.625rem 2.5rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
}

.filter-group {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
}

.filter-select {
    padding: 0.625rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background-color: white;
    font-size: 0.875rem;
    color: var(--text);
    min-width: 150px;
}

.filter-date {
    padding: 0.625rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background-color: white;
    font-size: 0.875rem;
    color: var(--text);
}

.btn-icon {
    background: none;
    border: none;
    color: var(--primary);
    font-weight: 500;
    cursor: pointer;
    font-size: 0.9rem;
}

.btn-icon:hover {
    text-decoration: underline;
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
}

.modal-content {
    background: white;
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 500px;
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    max-height: 90vh;
}

.modal-header {
    padding: 1.25rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--text);
}

.btn-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-light);
    padding: 0.25rem;
    border-radius: 50%;
}

.btn-close:hover {
    background-color: var(--bg-light);
}

.modal-body {
    padding: 1.5rem;
    overflow-y: auto;
}

.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
    background: var(--bg-light);
    padding: 1rem;
    border-radius: var(--radius-md);
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.info-item label {
    font-size: 0.75rem;
    color: var(--text-light);
    font-weight: 600;
    text-transform: uppercase;
}

.info-item span {
    font-weight: 500;
    color: var(--text);
}

.items-list h4 {
    margin: 0 0 0.75rem 0;
    font-size: 1rem;
    color: var(--text);
}

.table-mini-wrapper {
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
}

.table-mini {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}

.table-mini th, .table-mini td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--border-light);
}

.table-mini th {
    background: var(--bg-light);
    font-weight: 600;
    font-size: 0.8rem;
}

.table-mini tr:last-child td {
    border-bottom: none;
}

.modal-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
}

.badge {
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
}

.badge.ok { background: #dcfce7; color: #166534; }
.badge.rechazado { background: #fee2e2; color: #991b1b; }
.badge.parcial { background: #fef9c3; color: #854d0e; }

.icon { width: 1.25rem; height: 1.25rem; }
.icon-xs { width: 1rem; height: 1rem; }
.text-gray { color: var(--text-light); }
.text-right { text-align: right; }
.flex-center { display: flex; align-items: center; gap: 0.5rem; }
.bold { font-weight: 600; }
.flex-col { display: flex; flex-direction: column; }
</style>
