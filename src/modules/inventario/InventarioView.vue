<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useInventarioStore } from './inventario.store';
import { storeToRefs } from 'pinia';
import DataTable from '../../components/ui/DataTable.vue';
import { Search, Package, History } from 'lucide-vue-next';
import type { Column } from '../../components/ui/DataTable.vue';

const store = useInventarioStore();
const { stock, kardex, loading } = storeToRefs(store);

// Tabs
const activeTab = ref<'stock' | 'kardex'>('stock');

// Filtros
const searchQuery = ref('');

// Columnas Stock
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
    { key: 'producto.nombre', label: 'Producto' },
    { key: 'cantidad', label: 'Cantidad', align: 'center' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'referencia', label: 'Ref.' } // ID Viaje o Req
];

const loadData = () => {
    if (activeTab.value === 'stock') {
        store.fetchStock({ search: searchQuery.value });
    } else {
        store.fetchKardex({ page: 1, limit: 50 }); // Carga inicial
    }
};

onMounted(() => {
    loadData();
});

watch([activeTab, searchQuery], () => {
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
                <!-- Barra de búsqueda (solo para Stock por ahora) -->
                <div class="actions-bar" v-if="activeTab === 'stock'">
                    <div class="search-box">
                        <Search class="search-icon" />
                        <input 
                            v-model="searchQuery" 
                            type="text" 
                            placeholder="Buscar producto..." 
                            class="search-input"
                        />
                    </div>
                </div>

                <!-- Tabla de Stock -->
                <DataTable 
                    v-if="activeTab === 'stock'"
                    :columns="stockColumns" 
                    :data="stock" 
                    :loading="loading"
                >
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
                >
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

.actions-bar { margin-bottom: 1rem; }

.search-box { position: relative; max-width: 300px; }
.search-icon {
    position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%);
    width: 1.25rem; height: 1.25rem; color: var(--text-light);
}
.search-input {
    width: 100%; padding: 0.625rem 1rem 0.625rem 2.5rem;
    border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 0.875rem;
}

.badge {
    padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;
}
.badge-success { background-color: #d1fae5; color: #059669; }
.badge-danger { background-color: #fee2e2; color: #dc2626; }

.text-success { color: #059669; font-weight: 600; }
.text-danger { color: #dc2626; font-weight: 600; }

.icon-sm { width: 1.1rem; height: 1.1rem; }
</style>
