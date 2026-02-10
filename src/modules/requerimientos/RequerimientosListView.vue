<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRequerimientosStore } from '../../stores/requerimientos.store';
import { storeToRefs } from 'pinia';
import DataTable from '../../components/ui/DataTable.vue';
import { Plus, Truck, X, FileText, Calendar, Building2, MapPin, Filter, ChevronDown } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

import type { Column } from '../../components/ui/DataTable.vue';

import { useMaestrosStore } from '../../stores/maestros.store';

// Stores
const store = useRequerimientosStore();
const maestrosStore = useMaestrosStore();
const { requerimientos, loading, pagination, filters } = storeToRefs(store);
const { proveedores, minas } = storeToRefs(maestrosStore);
const router = useRouter();

// Columnas de la tabla
const columns: Column[] = [
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'fecha_emision', label: 'Emisión', sortable: true },
    { key: 'fecha_prometida', label: 'Entrega', sortable: true },
    { key: 'proveedores', label: 'Proveedor' },
    { key: 'minas', label: 'Mina' },
    { key: 'estado', label: 'Estado', sortable: true },
    { key: 'actions', label: 'Acciones', align: 'center' }
];

// Methods
const openDetails = (req: any) => {
    selectedReq.value = req;
    showModal.value = true;
};

const handlePageChange = (page: number) => {
    store.setPage(page);
};

const applyFilters = () => {
    store.fetchRequerimientos();
};

const handleSearch = (value: string) => {
    store.setFilters({ search: value });
};

// Modal State
const showModal = ref(false);
const selectedReq = ref<any>(null);

// Mobile filters state
const showMobileFilters = ref(false);
const activeFiltersCount = ref(0);

// Cargar datos
onMounted(() => {
    store.fetchRequerimientos();
    maestrosStore.fetchProveedores();
    maestrosStore.fetchMinas();
});
</script>

<template>
    <div class="requerimientos-view">
        <h1 class="view-title">Requerimientos</h1>
        <p class="view-description">Gestiona las solicitudes de compra de madera</p>

        <!-- Mobile View -->
        <div class="mobile-only">
            <!-- Actions Bar -->
            <div class="mobile-actions-bar">
                <button class="btn btn-primary" @click="router.push('/requirements/new')">
                    <Plus class="icon" />
                    Nuevo
                </button>

                <button class="mobile-filter-toggle" @click="showMobileFilters = !showMobileFilters">
                    <div class="filter-toggle-content">
                        <Filter :size="18" />
                        <span>Filtros</span>
                        <span v-if="activeFiltersCount > 0" class="filter-count-badge">{{ activeFiltersCount }}</span>
                    </div>
                    <ChevronDown :size="18" class="chevron-icon" :class="{ 'open': showMobileFilters }" />
                </button>
            </div>

            <!-- Mobile Filters Panel -->
            <div v-show="showMobileFilters" class="mobile-filter-panel">
                <div class="mobile-filter-item">
                    <label>Proveedor</label>
                    <select v-model="filters.id_proveedor" @change="applyFilters">
                        <option :value="undefined">Todos</option>
                        <option v-for="prov in proveedores" :key="prov.id_proveedor" :value="prov.id_proveedor">
                            {{ prov.nombre }}
                        </option>
                    </select>
                </div>

                <div class="mobile-filter-item">
                    <label>Mina</label>
                    <select v-model="filters.id_mina" @change="applyFilters">
                        <option :value="undefined">Todas</option>
                        <option v-for="mina in minas" :key="mina.id_mina" :value="mina.id_mina">
                            {{ mina.nombre }}
                        </option>
                    </select>
                </div>

                <div class="mobile-filter-item">
                    <label>Estado</label>
                    <select v-model="filters.estado" @change="applyFilters">
                        <option :value="undefined">Todos</option>
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="PARCIAL">PARCIAL</option>
                        <option value="COMPLETADO">COMPLETADO</option>
                        <option value="ANULADO">ANULADO</option>
                    </select>
                </div>

                <div class="mobile-filter-item">
                    <label>Rango de fechas</label>
                    <div class="mobile-date-range">
                        <input type="date" v-model="filters.fecha_inicio" @change="applyFilters" />
                        <span>-</span>
                        <input type="date" v-model="filters.fecha_fin" @change="applyFilters" />
                    </div>
                </div>
            </div>

            <!-- Search Bar -->
            <div class="mobile-search">
                <input 
                    type="text" 
                    placeholder="Buscar por código..." 
                    :value="filters.search"
                    @input="handleSearch(($event.target as HTMLInputElement).value)"
                />
            </div>

            <!-- Mobile Cards -->
            <div class="mobile-cards">
                <div v-for="req in requerimientos" :key="req.id_requerimiento" class="mobile-card">
                    <div class="card-header">
                        <h3 class="card-title">{{ req.codigo }}</h3>
                        <span class="badge" :class="`badge-${req.estado?.toLowerCase()}`">
                            {{ req.estado }}
                        </span>
                    </div>

                    <div class="card-body">
                        <div class="info-row">
                            <Calendar class="icon-sm" />
                            <span>{{ new Date(req.fecha_emision).toLocaleDateString() }}</span>
                        </div>
                        <div class="info-row">
                            <Building2 class="icon-sm" />
                            <span>{{ req.proveedores?.nombre || '---' }}</span>
                        </div>
                        <div class="info-row">
                            <MapPin class="icon-sm" />
                            <span>{{ req.minas?.nombre || '---' }}</span>
                        </div>
                    </div>

                    <div class="card-actions">
                        <button 
                            v-if="req.estado !== 'ANULADO' && req.estado !== 'COMPLETADO'"
                            @click="router.push(`/viajes/new/${req.id_requerimiento}`)" 
                            class="btn-card-action primary">
                            <Truck :size="18" />
                            Registrar Viaje
                        </button>
                        <button @click="openDetails(req)" class="btn-icon">
                            <FileText :size="20" />
                        </button>
                    </div>
                </div>

                <!-- Empty state -->
                <div v-if="requerimientos.length === 0 && !loading" class="empty-state-mobile">
                    <FileText :size="48" style="opacity: 0.3" />
                    <p>No hay requerimientos</p>
                </div>

                <!-- Loading skeleton -->
                <div v-if="loading" class="mobile-cards">
                    <div v-for="i in 3" :key="i" class="mobile-card skeleton-card">
                        <div class="skeleton-header"></div>
                        <div class="skeleton-body"></div>
                    </div>
                </div>
            </div>

            <!-- Mobile Pagination -->
            <div v-if="pagination.totalPages > 1" class="mobile-pagination">
                <button 
                    @click="handlePageChange(pagination.page - 1)"
                    :disabled="pagination.page === 1"
                    class="pagination-btn">
                    Anterior
                </button>
                <span class="pagination-info">
                    {{ pagination.page }} / {{ pagination.totalPages }}
                </span>
                <button 
                    @click="handlePageChange(pagination.page + 1)"
                    :disabled="pagination.page === pagination.totalPages"
                    class="pagination-btn">
                    Siguiente
                </button>
            </div>
        </div>

        <!-- Desktop Table (Hidden on Mobile) -->
        <div class="desktop-only">
            <!-- Tabla con Toolbar Integrado -->
        <DataTable 
            :columns="columns" 
            :data="requerimientos" 
            :loading="loading"
            searchable
            search-placeholder="Buscar por código..."
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
                        <option :value="undefined">Todos los Proveedores</option>
                        <option v-for="prov in proveedores" :key="prov.id_proveedor" :value="prov.id_proveedor">
                            {{ prov.nombre }}
                        </option>
                    </select>
                </div>

                <div class="filter-item">
                    <select v-model="filters.id_mina" @change="applyFilters" class="filter-select">
                        <option :value="undefined">Todas las Minas</option>
                        <option v-for="mina in minas" :key="mina.id_mina" :value="mina.id_mina">
                            {{ mina.nombre }}
                        </option>
                    </select>
                </div>

                <div class="filter-item">
                    <select v-model="filters.estado" @change="applyFilters" class="filter-select">
                        <option :value="undefined">Todos los Estados</option>
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="PARCIAL">PARCIAL</option>
                        <option value="COMPLETADO">COMPLETADO</option>
                        <option value="ANULADO">ANULADO</option>
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

            <!-- Botón de acción principal -->
            <template #toolbar-actions>
                <button class="btn btn-primary" @click="router.push('/requirements/new')">
                    <Plus class="icon" />
                    Nuevo Requerimiento
                </button>
            </template>
                <template #cell-codigo="{ value }">
                    <span class="font-medium text-primary">{{ value }}</span>
                </template>

                <template #cell-estado="{ value }">
                    <span 
                        class="status-badge" 
                        :class="`status-${value?.toLowerCase()}`"
                    >
                        {{ value }}
                    </span>
                </template>
                
                <template #cell-fecha_emision="{ value }">
                    {{ new Date(value).toLocaleDateString() }}
                </template>

                <template #cell-fecha_prometida="{ value }">
                    {{ value ? new Date(value).toLocaleDateString() : '-' }}
                </template>

                <template #cell-proveedores="{ value }">
                    <span class="font-medium">{{ value?.nombre || '---' }}</span>
                </template>

                <template #cell-minas="{ value }">
                    <span>{{ value?.nombre || '---' }}</span>
                </template>

                <template #cell-actions="{ row }">
                    <button 
                        class="btn-icon" 
                        title="Registrar Ingreso (Viaje)" 
                        @click="router.push(`/viajes/new/${row.id_requerimiento}`)"
                        v-if="row.estado !== 'ANULADO' && row.estado !== 'COMPLETADO'"
                    >
                        <Truck class="icon-sm" />
                    </button>
                    <button class="btn-icon" title="Ver Detalle" @click="openDetails(row)">
                        Ver
                    </button>
                </template>
            </DataTable>
            
            <!-- DEBUG: Temporary data inspection -->
            <!-- 
            <div style="margin-top: 20px; padding: 10px; background: #eee; font-size: 12px;">
                <pre>{{ requerimientos[0] }}</pre>
            </div>
             -->
        </div>

        <!-- Modal de Detalles -->
        <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
            <div class="modal-content">
                <header class="modal-header">
                    <h3>Requerimiento {{ selectedReq?.codigo }}</h3>
                    <button class="btn-close" @click="showModal = false">
                        <X class="icon" />
                    </button>
                </header>
                
                <div class="modal-body" v-if="selectedReq">
                    <div class="status-bar">
                        <span class="status-badge" :class="`status-${selectedReq.estado?.toLowerCase()}`">
                            {{ selectedReq.estado }}
                        </span>
                    </div>

                    <div class="info-grid">
                        <div class="info-item">
                            <label>Proveedor</label>
                            <span>{{ selectedReq.proveedores?.nombre || selectedReq.prov_nombre || '---' }}</span>
                        </div>
                        <div class="info-item">
                            <label>Mina / Destino</label>
                            <span>{{ selectedReq.minas?.nombre || selectedReq.mina_nombre || '---' }}</span>
                        </div>
                        <div class="info-item">
                            <label>Fecha Emisión</label>
                            <span>{{ new Date(selectedReq.fecha_emision).toLocaleDateString() }}</span>
                        </div>
                        <div class="info-item">
                            <label>Fecha Entrega</label>
                            <span>{{ new Date(selectedReq.fecha_prometida).toLocaleDateString() }}</span>
                        </div>
                    </div>

                    <div class="items-list">
                        <h4>Detalle de Productos</h4>
                        <div class="table-mini-wrapper">
                            <table class="table-mini">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th class="text-right">Cant. Solicitada</th>
                                        <th class="text-right">Precio Prov.</th>
                                        <th class="text-right">Precio Mina</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in selectedReq.requerimiento_detalles" :key="item.id_detalle">
                                        <td>
                                            <div class="flex-center">
                                                <FileText class="icon-xs text-gray" />
                                                {{ item.productos?.nombre }}
                                                <span class="text-xs text-gray" v-if="item.productos?.medidas || item.productos?.medida">
                                                    ({{ item.productos.medidas?.descripcion || item.productos.medida?.descripcion }})
                                                </span>
                                            </div>
                                        </td>
                                        <td class="text-right bold">{{ item.cantidad_solicitada }}</td>
                                        <td class="text-right">S/. {{ item.precio_proveedor }}</td>
                                        <td class="text-right">S/. {{ item.precio_mina }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="notes" v-if="selectedReq.observaciones">
                        <label>Observaciones:</label>
                        <p>{{ selectedReq.observaciones }}</p>
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
@import '../../assets/styles/mobile-cards.css';

.requerimientos-view {
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

/* Status Badges */
.status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
}

.status-pendiente {
    background-color: #fef3c7;
    color: #d97706;
}

.status-completado {
    background-color: #d1fae5;
    color: #059669;
}

.status-anulado {
    background-color: #fee2e2;
    color: #dc2626;
}

.status-parcial {
    background-color: #dbeafe;
    color: #2563eb;
}

.btn-primary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--primary);
    color: white;
    padding: 0.625rem 1.25rem;
    border-radius: var(--radius-md);
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
}

.btn-primary:hover {
    background-color: var(--primary-dark);
}

.icon {
    width: 1.25rem;
    height: 1.25rem;
}

.btn-icon {
    background: none;
    border: none;
    color: var(--primary);
    font-weight: 500;
    cursor: pointer;
    font-size: 0.9rem;
    margin-left: 0.5rem;
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
    max-width: 600px;
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

.status-bar {
    margin-bottom: 1rem;
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

.icon-xs { width: 1rem; height: 1rem; }
.icon-sm { width: 1.1rem; height: 1.1rem; }
.text-gray { color: var(--text-light); }
.text-xs { font-size: 0.75rem; }
.text-right { text-align: right; }
.flex-center { display: flex; align-items: center; gap: 0.5rem; }
.bold { font-weight: 600; }

/* ============================================
   MOBILE STYLES
   ============================================ */

@media (max-width: 767px) {
    .requerimientos-view {
        padding: 0;
    }

    .view-title {
        font-size: 1.5rem;
        padding: 1.5rem 1rem 0.5rem 1rem;
    }

    .view-description {
        padding: 0 1rem;
        margin-bottom: 1rem;
    }

    /* Mobile Actions Bar */
   .mobile-actions-bar {
        display: flex;
        gap: 8px;
        padding: 0 1rem 1rem 1rem;
    }

    .mobile-actions-bar .btn-primary {
        flex: 1;
        justify-content: center;
        font-size: 0.9rem;
    }

    /* Mobile Filter Item */
    .mobile-filter-item {
        margin-bottom: 12px;
    }

    .mobile-filter-item label {
        display: block;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-muted);
        margin-bottom: 6px;
    }

    .mobile-filter-item select,
    .mobile-filter-item input {
        width: 100%;
        font-size: 16px; /* Prevent zoom on iOS */
    }

    .mobile-date-range {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .mobile-date-range input {
        flex: 1;
    }

    /* Mobile Search */
    .mobile-search {
        padding: 0 1rem 12px 1rem;
    }

    .mobile-search input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 16px; /* Prevent zoom on iOS */
    }

    /* Mobile Pagination */
    .mobile-pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: white;
        border-top: 1px solid var(--border);
        position: sticky;
        bottom: 0;
    }

    .pagination-btn {
        padding: 10px 20px;
        background: var(--background);
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text);
        cursor: pointer;
        transition: all 0.2s;
        min-width: 44px;
        min-height: 44px;
    }

    .pagination-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .pagination-btn:not(:disabled):active {
        background: var(--border);
        transform: scale(0.95);
    }

    .pagination-info {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text-muted);
    }

    /* Mobile Empty State */
    .empty-state-mobile {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1rem;
        color: var(--text-muted);
        text-align: center;
    }

    .empty-state-mobile p {
        margin-top: 1rem;
        font-size: 1rem;
    }

    /* Skeleton Cards */
    .skeleton-card {
        pointer-events: none;
    }

    .skeleton-header {
        height: 24px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
        border-radius: 4px;
        margin-bottom: 12px;
    }

    .skeleton-body {
        height: 60px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
        border-radius: 4px;
    }

    @keyframes loading {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }
}
</style>
