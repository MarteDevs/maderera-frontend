<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDespachosStore } from '../../stores/despachos.store';
import { useMaestrosStore } from '../../stores/maestros.store';
import { storeToRefs } from 'pinia';
import DataTable from '../../components/ui/DataTable.vue';
import { Plus, Eye, Edit, Trash2, TruckIcon, Package, XCircle, Filter, ChevronDown, Calendar } from 'lucide-vue-next';
import type { Column } from '../../components/ui/DataTable.vue';

const router = useRouter();
const despachosStore = useDespachosStore();
const maestrosStore = useMaestrosStore();

const { despachos, loading, pagination } = storeToRefs(despachosStore);
const { minas } = storeToRefs(maestrosStore);

// Filters
const filters = ref({
    estado: undefined as 'PREPARANDO' | 'EN_TRANSITO' | 'ENTREGADO' | 'ANULADO' | undefined,
    id_mina: undefined as number | undefined,
    fecha_desde: '',
    fecha_hasta: '',
    search: ''
});

// Mobile
const showMobileFilters = ref(false);
const activeFiltersCount = computed(() => {
    let count = 0;
    if (filters.value.estado) count++;
    if (filters.value.id_mina) count++;
    if (filters.value.fecha_desde) count++;
    if (filters.value.fecha_hasta) count++;
    return count;
});

// Modals
const showConfirmModal = ref(false);
const showTransitoModal = ref(false);
const showEntregarModal = ref(false);
const showAnularModal = ref(false);
const selectedDespacho = ref<any>(null);
const motivoAnulacion = ref('');

// Table columns
const columns: Column[] = [
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'fecha_creacion', label: 'Fecha Creación', sortable: true },
    { key: 'mina', label: 'Mina' },
    { key: 'estado', label: 'Estado' },
    { key: 'total_productos', label: 'Total Productos' },
    { key: 'actions', label: 'Acciones', align: 'center' }
];

// Methods
const fetchDespachos = () => {
    despachosStore.fetchDespachos({
        ...filters.value,
        page: pagination.value.page,
        limit: pagination.value.limit
    });
};

const handleSearch = (value: string) => {
    filters.value.search = value;
    fetchDespachos();
};

const handlePageChange = (page: number) => {
    pagination.value.page = page;
    fetchDespachos();
};

const applyFilters = () => {
    pagination.value.page = 1;
    fetchDespachos();
};

const clearFilters = () => {
    filters.value = {
        estado: undefined,
        id_mina: undefined,
        fecha_desde: '',
        fecha_hasta: '',
        search: ''
    };
    applyFilters();
};

const getEstadoBadge = (estado: string) => {
    const badgeClasses: any = {
        'PREPARANDO': 'badge badge-info',
        'EN_TRANSITO': 'badge badge-warning',
        'ENTREGADO': 'badge badge-success',
        'ANULADO': 'badge badge-danger'
    };
    return badgeClasses[estado] || 'badge';
};

const getEstadoLabel = (estado: string) => {
    const labels: any = {
        'PREPARANDO': 'Preparando',
        'EN_TRANSITO': 'En Tránsito',
        'ENTREGADO': 'Entregado',
        'ANULADO': 'Anulado'
    };
    return labels[estado] || estado;
};

const canEdit = (despacho: any) => despacho.estado === 'PREPARANDO';
const canDelete = (despacho: any) => despacho.estado === 'PREPARANDO';
const canTransito = (despacho: any) => despacho.estado === 'PREPARANDO';
const canEntregar = (despacho: any) => despacho.estado === 'EN_TRANSITO';
const canAnular = (despacho: any) => despacho.estado !== 'ANULADO';

const crearDespacho = () => {
    router.push('/despachos/nuevo');
};

const verDetalle = (despacho: any) => {
    router.push(`/despachos/${despacho.id_despacho}`);
};

const editarDespacho = (despacho: any) => {
    router.push(`/despachos/${despacho.id_despacho}/editar`);
};

const confirmarEliminar = (despacho: any) => {
    selectedDespacho.value = despacho;
    showConfirmModal.value = true;
};

const eliminarDespacho = async () => {
    if (selectedDespacho.value) {
        await despachosStore.deleteDespacho(selectedDespacho.value.id_despacho);
        showConfirmModal.value = false;
        selectedDespacho.value = null;
    }
};

const abrirTransitoModal = (despacho: any) => {
    selectedDespacho.value = despacho;
    showTransitoModal.value = true;
};

const enviarATransito = async () => {
    if (selectedDespacho.value) {
        await despachosStore.cambiarATransito(selectedDespacho.value.id_despacho);
        showTransitoModal.value = false;
        selectedDespacho.value = null;
    }
};

const abrirEntregarModal = (despacho: any) => {
    selectedDespacho.value = despacho;
    showEntregarModal.value = true;
};

const marcarComoEntregado = async () => {
    if (selectedDespacho.value) {
        await despachosStore.marcarEntregado(selectedDespacho.value.id_despacho);
        showEntregarModal.value = false;
        selectedDespacho.value = null;
    }
};

const abrirAnularModal = (despacho: any) => {
    selectedDespacho.value = despacho;
    motivoAnulacion.value = '';
    showAnularModal.value = true;
};

const anularDespacho = async () => {
    if (selectedDespacho.value && motivoAnulacion.value.length >= 10) {
        await despachosStore.anularDespacho(selectedDespacho.value.id_despacho, motivoAnulacion.value);
        showAnularModal.value = false;
        selectedDespacho.value = null;
        motivoAnulacion.value = '';
    }
};

onMounted(() => {
    fetchDespachos();
    maestrosStore.fetchMinas();
});
</script>

<template>
    <div class="despachos-view">
        <h1 class="view-title">Despachos a Mina</h1>
        <p class="view-description">Gestión de salidas de madera hacia minas</p>

        <!-- Mobile View -->
        <div class="mobile-only">
            <!-- Mobile Search -->
            <div class="mobile-search-bar">
                <input 
                    type="text" 
                    class="mobile-search-input" 
                    placeholder="Buscar por código..."
                    v-model="filters.search"
                    @input="handleSearch(filters.search)"
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
                    <label>Estado</label>
                    <select v-model="filters.estado" class="mobile-filter-select">
                        <option :value="undefined">Todos los Estados</option>
                        <option value="PREPARANDO">Preparando</option>
                        <option value="EN_TRANSITO">En Tránsito</option>
                        <option value="ENTREGADO">Entregado</option>
                        <option value="ANULADO">Anulado</option>
                    </select>
                </div>

                <div class="mobile-filter-group">
                    <label>Mina</label>
                    <select v-model.number="filters.id_mina" class="mobile-filter-select">
                        <option :value="undefined">Todas las Minas</option>
                        <option v-for="mina in minas" :key="mina.id_mina" :value="mina.id_mina">
                            {{ mina.nombre }}
                        </option>
                    </select>
                </div>

                <div class="mobile-filter-group">
                    <label>Fecha Desde</label>
                    <input type="date" v-model="filters.fecha_desde" class="mobile-filter-date" />
                </div>

                <div class="mobile-filter-group">
                    <label>Fecha Hasta</label>
                    <input type="date" v-model="filters.fecha_hasta" class="mobile-filter-date" />
                </div>

                <div class="mobile-filter-actions">
                    <button @click="clearFilters" class="btn btn-secondary btn-sm">Limpiar</button>
                    <button @click="applyFilters(); showMobileFilters = false" class="btn btn-primary btn-sm">Aplicar</button>
                </div>
            </div>

            <!-- Mobile Cards -->
            <div class="mobile-cards-container">
                <div v-for="despacho in despachos" :key="despacho.id_despacho" class="mobile-card">
                    <div class="mobile-card-header">
                        <div class="card-header-left">
                            <TruckIcon class="icon-md" />
                            <div>
                                <h3 class="card-title">{{ despacho.codigo }}</h3>
                                <p class="card-subtitle">{{ despacho.minas?.nombre || 'N/A' }}</p>
                            </div>
                        </div>
                        <span :class="getEstadoBadge(despacho.estado)">
                            {{ getEstadoLabel(despacho.estado) }}
                        </span>
                    </div>

                    <div class="mobile-card-body">
                        <div class="card-row">
                            <Calendar class="icon-xs" />
                            <span class="card-label">Creado:</span>
                            <span class="card-value">{{ new Date(despacho.fecha_creacion).toLocaleDateString() }}</span>
                        </div>
                        <div class="card-row">
                            <Package class="icon-xs" />
                            <span class="card-label">Productos:</span>
                            <span class="card-value">{{ despacho.despacho_detalles?.length || 0 }}</span>
                        </div>
                    </div>

                    <div class="mobile-card-actions">
                        <button @click="verDetalle(despacho)" class="btn btn-secondary btn-sm">
                            <Eye class="icon-xs" /> Ver
                        </button>
                        <button v-if="canTransito(despacho)" @click="abrirTransitoModal(despacho)" class="btn btn-primary btn-sm">
                            <TruckIcon class="icon-xs" /> Enviar
                        </button>
                        <button v-if="canEntregar(despacho)" @click="abrirEntregarModal(despacho)" class="btn btn-success btn-sm">
                            <Package class="icon-xs" /> Entregar
                        </button>
                    </div>
                </div>

                <div v-if="despachos.length === 0 && !loading" class="empty-state">
                    <p>No se encontraron despachos</p>
                </div>
            </div>

            <!-- Mobile FAB -->
            <button class="mobile-fab" @click="crearDespacho">
                <Plus class="icon-md" />
            </button>
        </div>

        <!-- Desktop View -->
        <div class="desktop-only">
            <DataTable
                :columns="columns"
                :data="despachos"
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
                <template #toolbar-actions>
                    <button @click="crearDespacho" class="btn btn-primary">
                        <Plus class="icon-sm" /> Nuevo Despacho
                    </button>
                </template>

                <template #toolbar-filters>
                    <div class="filter-item">
                        <select v-model="filters.estado" @change="applyFilters" class="filter-select">
                            <option :value="undefined">Todos los Estados</option>
                            <option value="PREPARANDO">Preparando</option>
                            <option value="EN_TRANSITO">En Tránsito</option>
                            <option value="ENTREGADO">Entregado</option>
                            <option value="ANULADO">Anulado</option>
                        </select>
                    </div>

                    <div class="filter-item">
                        <select v-model.number="filters.id_mina" @change="applyFilters" class="filter-select">
                            <option :value="undefined">Todas las Minas</option>
                            <option v-for="mina in minas" :key="mina.id_mina" :value="mina.id_mina">
                                {{ mina.nombre }}
                            </option>
                        </select>
                    </div>

                    <div class="filter-item">
                        <input type="date" v-model="filters.fecha_desde" @change="applyFilters" class="filter-input" placeholder="Desde" />
                    </div>

                    <div class="filter-item">
                        <input type="date" v-model="filters.fecha_hasta" @change="applyFilters" class="filter-input" placeholder="Hasta" />
                    </div>

                    <button @click="clearFilters" class="btn btn-secondary btn-sm">Limpiar</button>
                </template>

                <template #cell-fecha_creacion="{ value }">
                    <span>{{ new Date(value).toLocaleDateString() }}</span>
                </template>

                <template #cell-mina="{ row }">
                    <span>{{ row.minas?.nombre || '-' }}</span>
                </template>

                <template #cell-estado="{ value }">
                    <span :class="getEstadoBadge(value)">
                        {{ getEstadoLabel(value) }}
                    </span>
                </template>

                <template #cell-total_productos="{ row }">
                    <span>{{ row.despacho_detalles?.length || 0 }}</span>
                </template>

                <template #cell-actions="{ row }">
                    <div class="action-buttons">
                        <button @click="verDetalle(row)" class="btn-icon" title="Ver Detalle">
                            <Eye class="icon-sm" />
                        </button>
                        <button 
                            v-if="canEdit(row)" 
                            @click="editarDespacho(row)" 
                            class="btn-icon" 
                            title="Editar">
                            <Edit class="icon-sm" />
                        </button>
                        <button 
                            v-if="canTransito(row)" 
                            @click="abrirTransitoModal(row)" 
                            class="btn-icon btn-primary" 
                            title="Enviar a Tránsito">
                            <TruckIcon class="icon-sm" />
                        </button>
                        <button 
                            v-if="canEntregar(row)" 
                            @click="abrirEntregarModal(row)" 
                            class="btn-icon btn-success" 
                            title="Marcar Entregado">
                            <Package class="icon-sm" />
                        </button>
                        <button 
                            v-if="canAnular(row)" 
                            @click="abrirAnularModal(row)" 
                            class="btn-icon btn-warning" 
                            title="Anular">
                            <XCircle class="icon-sm" />
                        </button>
                        <button 
                            v-if="canDelete(row)" 
                            @click="confirmarEliminar(row)" 
                            class="btn-icon btn-danger" 
                            title="Eliminar">
                            <Trash2 class="icon-sm" />
                        </button>
                    </div>
                </template>
            </DataTable>
        </div>

        <!-- Modals -->
        <!-- Confirm Delete Modal -->
        <div v-if="showConfirmModal" class="modal-overlay" @click="showConfirmModal = false">
            <div class="modal-content" @click.stop>
                <h3>Confirmar Eliminación</h3>
                <p>¿Está seguro de eliminar el despacho <strong>{{ selectedDespacho?.codigo }}</strong>?</p>
                <div class="modal-actions">
                    <button @click="showConfirmModal = false" class="btn btn-secondary">Cancelar</button>
                    <button @click="eliminarDespacho" class="btn btn-danger">Eliminar</button>
                </div>
            </div>
        </div>

        <!-- Enviar a Tránsito Modal -->
        <div v-if="showTransitoModal" class="modal-overlay" @click="showTransitoModal = false">
            <div class="modal-content" @click.stop>
                <h3>Enviar a Tránsito</h3>
                <p>¿Confirmar envío del despacho <strong>{{ selectedDespacho?.codigo }}</strong> a tránsito?</p>
                <p class="text-muted">Se crearán los movimientos SALIDA en el kardex.</p>
                <div class="modal-actions">
                    <button @click="showTransitoModal = false" class="btn btn-secondary">Cancelar</button>
                    <button @click="enviarATransito" class="btn btn-primary">Confirmar</button>
                </div>
            </div>
        </div>

        <!-- Marcar Entregado Modal -->
        <div v-if="showEntregarModal" class="modal-overlay" @click="showEntregarModal = false">
            <div class="modal-content" @click.stop>
                <h3>Marcar como Entregado</h3>
                <p>¿Confirmar entrega del despacho <strong>{{ selectedDespacho?.codigo }}</strong>?</p>
                <div class="modal-actions">
                    <button @click="showEntregarModal = false" class="btn btn-secondary">Cancelar</button>
                    <button @click="marcarComoEntregado" class="btn btn-success">Confirmar</button>
                </div>
            </div>
        </div>

        <!-- Anular Despacho Modal -->
        <div v-if="showAnularModal" class="modal-overlay" @click="showAnularModal = false">
            <div class="modal-content" @click.stop>
                <h3>Anular Despacho</h3>
                <p>Despacho: <strong>{{ selectedDespacho?.codigo }}</strong></p>
                <div class="form-group">
                    <label>Motivo de Anulación *</label>
                    <textarea 
                        v-model="motivoAnulacion" 
                        rows="4" 
                        class="form-control"
                        placeholder="Ingrese el motivo de anulación (mínimo 10 caracteres)"
                    ></textarea>
                </div>
                <div class="modal-actions">
                    <button @click="showAnularModal = false" class="btn btn-secondary">Cancelar</button>
                    <button 
                        @click="anularDespacho" 
                        class="btn btn-danger"
                        :disabled="motivoAnulacion.length < 10"
                    >
                        Anular
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import '../../assets/styles/mobile-cards.css';

.despachos-view {
    padding: var(--spacing-lg);
}

.view-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: var(--spacing-xs);
}

.view-description {
    color: var(--text-muted);
    margin-bottom: var(--spacing-lg);
}

.action-buttons {
    display: flex;
    gap: var(--spacing-xs);
    justify-content: center;
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
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: var(--spacing-lg);
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
    box-shadow: var(--shadow-xl);
}

.modal-content h3 {
    margin-bottom: var(--spacing-md);
    color: var(--text);
}

.modal-content p {
    margin-bottom: var(--spacing-md);
    color: var(--text-muted);
}

.modal-actions {
    display: flex;
    gap: var(--spacing-sm);
    justify-content: flex-end;
    margin-top: var(--spacing-lg);
}

.form-group {
    margin-bottom: var(--spacing-md);
}

.form-group label {
    display: block;
    margin-bottom: var(--spacing-xs);
    font-weight: 600;
    color: var(--text);
}

.form-control {
    width: 100%;
    padding: var(--spacing-sm);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: inherit;
}

.form-control:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.empty-state {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--text-muted);
}

@media (max-width: 768px) {
    .despachos-view {
        padding: var(--spacing-md);
        padding-bottom: 80px;
    }

    .modal-content {
        max-width: 100%;
        margin: var(--spacing-md);
    }
}
</style>
