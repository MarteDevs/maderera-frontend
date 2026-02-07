<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useInventarioStore } from './inventario.store';
import { useMaestrosStore } from '../../stores/maestros.store';
import { storeToRefs } from 'pinia';
import DataTable from '../../components/ui/DataTable.vue';
import { Package, History } from 'lucide-vue-next';
import type { Column } from '../../components/ui/DataTable.vue';

const store = useInventarioStore();
const maestrosStore = useMaestrosStore();
const { stock, kardex, loading, stockPagination, stockFilters, kardexPagination, kardexFilters } = storeToRefs(store);
const { productos, medidas } = storeToRefs(maestrosStore);

// Tabs
const activeTab = ref<'stock' | 'kardex'>('stock');

// Columnas Stock
const stockColumns: Column[] = [
    { key: 'producto', label: 'Producto', sortable: true },
    { key: 'medida', label: 'Medida' },
    { key: 'clasificacion', label: 'Clasificación' },
    { key: 'stock_actual', label: 'Stock Actual', sortable: true, align: 'center' }
];

// Columnas Kardex
const kardexColumns: Column[] = [
    { key: 'fecha', label: 'Fecha/Hora', sortable: true },
    { key: 'tipo', label: 'Tipo Movimiento' },
    { key: 'producto', label: 'Producto' },
    { key: 'medida', label: 'Medida' },
    { key: 'cantidad', label: 'Cantidad', align: 'center' },
    { key: 'usuario_registro', label: 'Usuario' },
    { key: 'codigo_viaje', label: 'Ref.' }
];

// Methods Stock
const handleStockPageChange = (page: number) => {
    store.setStockPage(page);
};

const handleStockSearch = (value: string) => {
    store.setStockFilters({ search: value });
};

// Methods Kardex
const handleKardexPageChange = (page: number) => {
    store.setKardexPage(page);
};

const loadData = () => {
    if (activeTab.value === 'stock') {
        store.fetchStock();
    } else {
        store.fetchKardex();
    }
};

onMounted(() => {
    loadData();
    maestrosStore.fetchProductos();
    maestrosStore.fetchCatalogos(); // Trae medidas y clasificaciones
});

watch(activeTab, () => {
    loadData();
});
</script>

<template>
    <div class="inventario-view">
        <header class="page-header">
            <div>
                <h1 class="page-title">Inventario</h1>
                <p class="page-description">Control de stock y movimientos (Kardex)</p>
            </div>
        </header>

        <div class="content-container">
            <!-- Tabs Navigation -->
            <div class="tabs">
                <button 
                    class="tab-btn" 
                    :class="{ active: activeTab === 'stock' }"
                    @click="activeTab = 'stock'"
                >
                    <Package class="icon-sm" /> Stock Actual
                </button>
                <button 
                    class="tab-btn" 
                    :class="{ active: activeTab === 'kardex' }"
                    @click="activeTab = 'kardex'"
                >
                    <History class="icon-sm" /> Kardex (Movimientos)
                </button>
            </div>

            <div class="tab-content">
                <!-- Tabla de Stock -->
                <DataTable 
                    v-if="activeTab === 'stock'"
                    :columns="stockColumns" 
                    :data="stock" 
                    :loading="loading"
                    searchable
                    search-placeholder="Buscar producto..."
                    :current-page="stockPagination.page"
                    :total-pages="stockPagination.totalPages"
                    :total="stockPagination.total"
                    :page-size="stockPagination.limit"
                    @search="handleStockSearch"
                    @page-change="handleStockPageChange"
                >
                    <template #toolbar-filters>
                        <div class="filter-item">
                            <select v-model="stockFilters.id_medida" class="filter-select">
                                <option :value="undefined">Todas las Medidas</option>
                                <option v-for="medida in medidas" :key="medida.id_medida" :value="medida.id_medida">
                                    {{ medida.descripcion }}
                                </option>
                            </select>
                        </div>
                    </template>
                    <template #cell-stock_actual="{ value }">
                        <span 
                            class="badge" 
                            :class="value > 0 ? 'badge-success' : 'badge-danger'"
                        >
                            {{ value }}
                        </span>
                    </template>
                </DataTable>

                <!-- Tabla de Kardex -->
                <DataTable 
                    v-if="activeTab === 'kardex'"
                    :columns="kardexColumns" 
                    :data="kardex" 
                    :loading="loading"
                    :current-page="kardexPagination.page"
                    :total-pages="kardexPagination.totalPages"
                    :total="kardexPagination.total"
                    :page-size="kardexPagination.limit"
                    @page-change="handleKardexPageChange"
                >
                    <template #toolbar-filters>
                        <div class="filter-item">
                            <select v-model="kardexFilters.id_producto" class="filter-select">
                                <option :value="undefined">Todos los Productos</option>
                                <option v-for="prod in productos" :key="prod.id_producto" :value="prod.id_producto">
                                    {{ prod.nombre }}
                                </option>
                            </select>
                        </div>

                        <div class="filter-item">
                            <select v-model="kardexFilters.tipo_movimiento" class="filter-select">
                                <option value="">Todos los Movimientos</option>
                                <option value="ENTRADA">ENTRADA</option>
                                <option value="SALIDA">SALIDA</option>
                                <option value="AJUSTE_POS">AJUSTE (+)</option>
                                <option value="AJUSTE_NEG">AJUSTE (-)</option>
                                <option value="DEVOLUCION">DEVOLUCION</option>
                            </select>
                        </div>

                        <div class="filter-item">
                            <div class="date-range">
                                <input type="date" v-model="kardexFilters.fecha_inicio" class="filter-date" />
                                <span>-</span>
                                <input type="date" v-model="kardexFilters.fecha_fin" class="filter-date" />
                            </div>
                        </div>
                    </template>
                    <template #cell-fecha="{ value }">
                        {{ new Date(value).toLocaleString() }}
                    </template>
                    
                    <template #cell-tipo="{ value }">
                        <span 
                            class="badge"
                            :class="{
                                'badge-success': ['ENTRADA', 'AJUSTE_POS', 'DEVOLUCION'].includes(value),
                                'badge-danger': ['SALIDA', 'AJUSTE_NEG'].includes(value)
                            }"
                        >
                            {{ value }}
                        </span>
                    </template>

                    <template #cell-cantidad="{ value, row }">
                        <span :class="['ENTRADA', 'AJUSTE_POS', 'DEVOLUCION'].includes(row.tipo) ? 'text-success' : 'text-danger'">
                            {{ ['ENTRADA', 'AJUSTE_POS', 'DEVOLUCION'].includes(row.tipo) ? '+' : '-' }}{{ Math.abs(value) }}
                        </span>
                    </template>
                </DataTable>
            </div>
        </div>
    </div>
</template>

<style scoped>
.inventario-view { width: 100%; }

.page-header { margin-bottom: 2rem; }
.page-title { font-size: 1.875rem; font-weight: 700; color: var(--text); margin: 0; }
.page-description { color: var(--text-light); margin-top: 0.5rem; }

.content-container {
    background: white;
    padding: 1.5rem;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
}

.tabs {
    display: flex;
    gap: 1rem;
    border-bottom: 1px solid var(--border-light);
    margin-bottom: 1.5rem;
}

.tab-btn {
    padding: 0.75rem 1.5rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-light);
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
}

.tab-btn:hover { color: var(--primary); }

.tab-btn.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
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

.badge {
    padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;
}
.badge-success { background-color: #d1fae5; color: #059669; }
.badge-danger { background-color: #fee2e2; color: #dc2626; }

.text-success { color: #059669; font-weight: 600; }
.text-danger { color: #dc2626; font-weight: 600; }

.icon-sm { width: 1.1rem; height: 1.1rem; }

.filters-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
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
</style>
