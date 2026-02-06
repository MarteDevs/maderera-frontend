<script setup lang="ts">
import { ref } from 'vue';
import { Package, Users, Mountain, UserCheck } from 'lucide-vue-next';
import ProductosListView from './productos/ProductosListView.vue';
import ProveedoresListView from './proveedores/ProveedoresListView.vue';
import MinasListView from './minas/MinasListView.vue';
import SupervisoresListView from './supervisores/SupervisoresListView.vue';

type Tab = 'productos' | 'proveedores' | 'minas' | 'supervisores';

const activeTab = ref<Tab>('productos');

const tabs = [
    { id: 'productos' as Tab, label: 'Productos', icon: Package },
    { id: 'proveedores' as Tab, label: 'Proveedores', icon: Users },
    { id: 'minas' as Tab, label: 'Minas', icon: Mountain },
    { id: 'supervisores' as Tab, label: 'Supervisores', icon: UserCheck },
];
</script>

<template>
    <div class="maestros-view">
        <div class="page-header">
            <h1 class="page-title">Maestros</h1>
            <p class="page-description">
                Gestión de productos, proveedores, minas y supervisores del sistema
            </p>
        </div>

        <div class="tabs-container">
            <div class="tabs">
                <button
                    v-for="tab in tabs"
                    :key="tab.id"
                    :class="['tab', { active: activeTab === tab.id }]"
                    @click="activeTab = tab.id"
                >
                    <component :is="tab.icon" class="tab-icon" />
                    {{ tab.label }}
                </button>
            </div>

            <div class="tab-content">
                <ProductosListView v-if="activeTab === 'productos'" />
                <ProveedoresListView v-else-if="activeTab === 'proveedores'" />
                <MinasListView v-else-if="activeTab === 'minas'" />
                <SupervisoresListView v-else-if="activeTab === 'supervisores'" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.maestros-view {
    padding: 2rem;
}

.page-header {
    margin-bottom: 2rem;
}

.page-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 0.5rem 0;
}

.page-description {
    font-size: 1rem;
    color: var(--text-light);
    margin: 0;
}

.tabs-container {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
    overflow: hidden;
}

.tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
    background-color: var(--background);
    overflow-x: auto;
}

.tab {
    flex: 1;
    min-width: 150px;
    padding: 1rem 1.5rem;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-light);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;
    cursor: pointer;
}

.tab:hover {
    background-color: rgba(139, 0, 0, 0.05);
    color: var(--text);
}

.tab.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
    background-color: white;
}

.tab-icon {
    width: 1.25rem;
    height: 1.25rem;
}

.tab-content {
    padding: 1.5rem;
}
</style>
