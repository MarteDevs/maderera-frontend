<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRequerimientosStore } from './requerimientos.store';
import { storeToRefs } from 'pinia';
import DataTable from '../../components/ui/DataTable.vue';
import { Plus, Search } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

import type { Column } from '../../components/ui/DataTable.vue';

// Store
const store = useRequerimientosStore();
const { requerimientos, loading } = storeToRefs(store);
const router = useRouter();

// Filtros
const searchQuery = ref('');

// Columnas de la tabla
const columns: Column[] = [
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'fecha_emision', label: 'Emisión', sortable: true },
    { key: 'fecha_prometida', label: 'Entrega', sortable: true },
    { key: 'proveedor.nombre', label: 'Proveedor' },
    { key: 'mina.nombre', label: 'Mina' },
    { key: 'estado', label: 'Estado', sortable: true },
    { key: 'actions', label: 'Acciones', align: 'center' }
];

// Cargar datos
onMounted(() => {
    store.fetchRequerimientos();
});

</script>

<template>
    <div class="requerimientos-view">
        <header class="page-header">
            <div class="header-content">
                <div>
                    <h1 class="page-title">Requerimientos</h1>
                    <p class="page-description">Gestiona las solicitudes de compra de madera</p>
                </div>
                <button class="btn-primary" @click="router.push('/requirements/new')">
                    <Plus class="icon" />
                    Nuevo Requerimiento
                </button>
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
                        placeholder="Buscar por código, proveedor..." 
                        class="search-input"
                    />
                </div>
            </div>

            <!-- Tabla -->
            <DataTable 
                :columns="columns" 
                :data="requerimientos" 
                :loading="loading"
                :search-query="searchQuery"
            >
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

                <template #cell-actions="{ row }">
                    <button class="btn-icon" title="Ver Detalle" @click="router.push(`/requirements/${row.id_requerimiento}`)">
                        Ver
                    </button>
                </template>
            </DataTable>
        </div>
    </div>
</template>

<style scoped>
.requerimientos-view {
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
</style>
