<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useViajesStore } from './viajes.store';
import { storeToRefs } from 'pinia';
import DataTable from '../../components/ui/DataTable.vue';
import { X, Truck, Filter, ChevronDown, Calendar, Building2, MapPin } from 'lucide-vue-next';
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

// Mobile State
const showMobileFilters = ref(false);
const activeFiltersCount = computed(() => {
    let count = 0;
    if (filters.value.id_proveedor) count++;
    if (filters.value.id_mina) count++;
    if (filters.value.fecha_inicio) count++;
    if (filters.value.fecha_fin) count++;
    return count;
});

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

const handleSearch = (value: string) => {
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
        <h1 class="view-title">Recepción de Viajes</h1>
        <p class="view-description">Registro de ingresos de materia prima</p>

        <!-- Mobile View -->
        <div class="mobile-only">
            <!-- Mobile Search -->
            <div class="mobile-search-bar">
                <input 
                    type="text" 
                    class="mobile-search-input" 
                    placeholder="Buscar por placa, conductor..."
                    @input="handleSearch(($event.target as HTMLInputElement).value)"
                />
            </div>

            <!-- Mobile Filter Toggle -->
            <button 
                class="mobile-filter-toggle" 
                @click="showMobileFilters = !showMobileFilters">
                <div class="filter-toggle-left">
                    <Filter class="icon-sm" />
                    <span>Filtros</span>
                    <span v-if="activeFiltersCount > 0" class="filter-count-badge">{{ activeFiltersCount }}</span>
                </div>
                <ChevronDown class="icon-sm chevron" :class="{ 'chevron-open': showMobileFilters }" />
            </button>

            <!-- Mobile Filters Panel -->
            <div class="mobile-filter-panel" :class="{ 'panel-open': showMobileFilters }">
                <div class="mobile-filter-group">
                    <label>Proveedor</label>
                    <select v-model="filters.id_proveedor" @change="applyFilters" class="mobile-filter-select">
                        <option value="">Todos los Proveedores</option>
                        <option v-for="prov in proveedores" :key="prov.id_proveedor" :value="prov.id_proveedor">
                            {{ prov.nombre }}
                        </option>
                    </select>
                </div>

                <div class="mobile-filter-group">
                    <label>Mina</label>
                    <select v-model="filters.id_mina" @change="applyFilters" class="mobile-filter-select">
                        <option value="">Todas las Minas</option>
                        <option v-for="mina in minas" :key="mina.id_mina" :value="mina.id_mina">
                            {{ mina.nombre }}
                        </option>
                    </select>
                </div>

                <div class="mobile-filter-group">
                    <label>Rango de Fechas</label>
                    <div class="mobile-date-range">
                        <input type="date" v-model="filters.fecha_inicio" @change="applyFilters" class="mobile-filter-date" />
                        <span>-</span>
                        <input type="date" v-model="filters.fecha_fin" @change="applyFilters" class="mobile-filter-date" />
                    </div>
                </div>
            </div>

            <!-- Mobile Cards List -->
            <div class="mobile-cards-list">
                <!-- Loading state -->
                <div v-if="loading" class="mobile-loading">
                    <div class="skeleton-card" v-for="i in 3" :key="i"></div>
                </div>

                <!-- Empty state -->
                <div v-else-if="!viajes || viajes.length === 0" class="mobile-empty-state">
                    <Truck class="empty-icon" />
                    <p>No se encontraron viajes</p>
                </div>

                <!-- Cards -->
                <div 
                    v-else
                    v-for="viaje in viajes" 
                    :key="viaje.id_viaje"
                    class="mobile-card"
                    @click="openDetails(viaje)">
                    
                    <div class="mobile-card-header">
                        <div class="card-id">
                            <Truck class="icon-sm" />
                            <strong>#{{ viaje.id_viaje }}</strong>
                        </div>
                    </div>

                    <div class="mobile-card-body">
                        <div class="card-row">
                            <span class="card-label">Requerimiento:</span>
                            <span class="card-value">{{ (viaje as any).req_codigo || viaje.requerimiento?.codigo || 'N/A' }}</span>
                        </div>
                        <div class="card-row">
                            <Building2 class="icon-xs" />
                            <span class="card-label">Proveedor:</span>
                            <span class="card-value">{{ (viaje as any).prov_nombre || viaje.requerimiento?.proveedor?.nombre || 'N/A' }}</span>
                        </div>
                        <div class="card-row">
                            <MapPin class="icon-xs" />
                            <span class="card-label">Mina:</span>
                            <span class="card-value">{{ (viaje as any).mina_nombre || 'N/A' }}</span>
                        </div>
                        <div class="card-row">
                            <Calendar class="icon-xs" />
                            <span class="card-label">Vehículo:</span>
                            <span class="card-value">{{ viaje.placa_vehiculo }}</span>
                        </div>
                        <div class="card-row">
                            <span class="card-label">Conductor:</span>
                            <span class="card-value">{{ viaje.conductor }}</span>
                        </div>
                        <div class="card-row">
                            <span class="card-label">Ingreso:</span>
                            <span class="card-value text-muted">{{ viaje.fecha_ingreso ? new Date(viaje.fecha_ingreso).toLocaleString() : 'N/A' }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mobile Pagination -->
            <div class="mobile-pagination" v-if="pagination.totalPages > 1">
                <button 
                    class="pagination-btn" 
                    :disabled="pagination.page === 1"
                    @click="handlePageChange(pagination.page - 1)">
                    Anterior
                </button>
                <span class="pagination-info">
                    Página {{ pagination.page }} de {{ pagination.totalPages }}
                </span>
                <button 
                    class="pagination-btn" 
                    :disabled="pagination.page >= pagination.totalPages"
                    @click="handlePageChange(pagination.page + 1)">
                    Siguiente
                </button>
            </div>
        </div>

        <!-- Desktop Table (Hidden on Mobile) -->
        <div class="desktop-only">
            <!-- Tabla con Toolbar Integrado -->
            <DataTable 
                :columns="columns" 
                :data="viajes" 
                :loading="loading"
                searchable
                search-placeholder="Buscar por placa, conductor..."
                :current-page="pagination.page"
                :total-pages="pagination.totalPages"
                :total="pagination.total"
                :page-size="pagination.limit"
                @search="handleSearch"
                @page-change="handlePageChange"
            >
                <!-- Filtros en el toolbar -->
                <template #toolbar-filters>
                    <div class="filter-item">
                        <select v-model="filters.id_proveedor" @change="applyFilters" class="filter-select">
                            <option value="">Todos los Proveedores</option>
                            <option v-for="prov in proveedores" :key="prov.id_proveedor" :value="prov.id_proveedor">
                                {{ prov.nombre }}
                            </option>
                        </select>
                    </div>

                    <div class="filter-item">
                        <select v-model="filters.id_mina" @change="applyFilters" class="filter-select">
                            <option value="">Todas las Minas</option>
                            <option v-for="mina in minas" :key="mina.id_mina" :value="mina.id_mina">
                                {{ mina.nombre }}
                            </option>
                        </select>
                    </div>

                    <div class="filter-item">
                        <div class="date-range">
                            <input type="date" v-model="filters.fecha_inicio" @change="applyFilters" class="filter-date" />
                            <span>-</span>
                            <input type="date" v-model="filters.fecha_fin" @change="applyFilters" class="filter-date" />
                        </div>
                    </div>
                </template>
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
</template>

<style scoped>
@import '../../assets/styles/mobile-cards.css';

.viajes-view {
    padding: 2rem;
}

.view-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 0.5rem 0;
}

.view-description {
    color: var(--text-light);
    margin: 0 0 2rem 0;
}

/* Filters in toolbar */
.filter-item {
    margin-right: 1.5rem;
}

.filter-select {
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background-color: white;
    font-size: 0.875rem;
    color: var(--text);
    min-width: 160px;
    max-width: 200px;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.filter-select:hover {
    border-color: var(--text-light);
}

.filter-select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(139, 0, 0, 0.1);
}

.filter-date {
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background-color: white;
    font-size: 0.875rem;
    color: var(--text);
    min-width: 140px;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.filter-date:hover {
    border-color: var(--text-light);
}

.filter-date:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(139, 0, 0, 0.1);
}

.date-range {
    display: flex;
    align-items: center;
    gap: 0.75rem;
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
