<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useViajesStore } from './viajes.store';
import { storeToRefs } from 'pinia';
import DataTable from '../../components/ui/DataTable.vue';
import { Search } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import type { Column } from '../../components/ui/DataTable.vue';

// Store
const store = useViajesStore();
const { viajes, loading } = storeToRefs(store);
const router = useRouter();

// Filtros
const searchQuery = ref('');

// Columnas de la tabla
const columns: Column[] = [
    { key: 'id_viaje', label: 'Control #', sortable: true },
    { key: 'requerimientos.codigo', label: 'Requerimiento' },
    { key: 'requerimientos.proveedores.nombre', label: 'Proveedor' },
    { key: 'placa_vehiculo', label: 'Placa' },
    { key: 'conductor', label: 'Conductor' },
    { key: 'fecha_ingreso', label: 'Ingreso', sortable: true },
    { key: 'actions', label: 'Acciones', align: 'center' }
];

// Cargar datos
onMounted(() => {
    store.fetchViajes();
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
                <!-- El botón de Nuevo Viaje se hace desde el Requerimiento, o podría ser aquí seleccionando uno -->
            </div>
        </header>

        <div class="content-container">
            <!-- Filtros y Búsqueda -->
            <div class="filters-bar">
                <div class="search-box">
                    <Search class="search-icon" />
                    <input 
                        v-model="searchQuery" 
                        type="text" 
                        placeholder="Buscar por placa, conductor..." 
                        class="search-input"
                    />
                </div>
            </div>

            <!-- Tabla -->
            <DataTable 
                :columns="columns" 
                :data="viajes" 
                :loading="loading"
                :search-query="searchQuery"
            >
                <template #cell-id_viaje="{ value }">
                    <span class="font-medium text-primary">#{{ value }}</span>
                </template>
                
                <template #cell-fecha_ingreso="{ value }">
                    {{ new Date(value).toLocaleString() }}
                </template>

                <template #cell-actions="{ row }">
                    <button class="btn-icon" title="Ver Detalle" @click="router.push(`/viajes/${row.id_viaje}`)">
                        Ver
                    </button>
                </template>
            </DataTable>
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
</style>
