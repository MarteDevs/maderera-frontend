<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight, Search } from 'lucide-vue-next';
import LoadingSpinner from './LoadingSpinner.vue';
import EmptyState from './EmptyState.vue';

export interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
}

interface Props {
    columns: Column[];
    data: T[];
    loading?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    emptyTitle?: string;
    emptyMessage?: string;
    // Paginación
    currentPage?: number;
    totalPages?: number;
    pageSize?: number;
    total?: number;
}

interface Emits {
    (e: 'search', value: string): void;
    (e: 'page-change', page: number): void;
    (e: 'row-click', row: T): void;
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    searchable: false,
    searchPlaceholder: 'Buscar...',
    emptyTitle: 'Sin datos',
    emptyMessage: 'No hay información para mostrar',
    currentPage: 1,
    totalPages: 1,
    pageSize: 20,
    total: 0,
});

const emit = defineEmits<Emits>();

const hasData = computed(() => props.data.length > 0);

const handleSearch = (event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    emit('search', value);
};

const handlePageChange = (page: number) => {
    if (page >= 1 && page <= props.totalPages) {
        emit('page-change', page);
    }
};

const handleRowClick = (row: T) => {
    emit('row-click', row);
};

const paginationInfo = computed(() => {
    const start = (props.currentPage - 1) * props.pageSize + 1;
    const end = Math.min(props.currentPage * props.pageSize, props.total);
    return `${start}-${end} de ${props.total}`;
});
</script>

<template>
    <div class="data-table">
        <!-- Enhanced Toolbar with 3 zones: Search | Filters | Actions -->
        <div v-if="searchable || $slots['toolbar-filters'] || $slots['toolbar-actions']" class="table-toolbar">
            <!-- Left: Search -->
            <div v-if="searchable" class="toolbar-search">
                <div class="search-box">
                    <Search class="search-icon" />
                    <input
                        type="text"
                        class="search-input"
                        :placeholder="searchPlaceholder"
                        @input="handleSearch"
                    />
                </div>
            </div>

            <!-- Center: Custom Filters -->
            <div v-if="$slots['toolbar-filters']" class="toolbar-filters">
                <slot name="toolbar-filters"></slot>
            </div>

            <!-- Right: Actions -->
            <div v-if="$slots['toolbar-actions']" class="toolbar-actions">
                <slot name="toolbar-actions"></slot>
            </div>
        </div>

        <!-- Table -->
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th
                            v-for="column in columns"
                            :key="column.key"
                            :style="{ width: column.width, textAlign: column.align || 'left' }"
                        >
                            {{ column.label }}
                        </th>
                        <th v-if="$slots.actions" class="actions-column">Acciones</th>
                    </tr>
                </thead>
                <tbody v-if="!loading && hasData">
                    <tr
                        v-for="(row, index) in data"
                        :key="index"
                        class="table-row"
                        @click="handleRowClick(row)"
                    >
                        <td
                            v-for="column in columns"
                            :key="column.key"
                            :style="{ textAlign: column.align || 'left' }"
                        >
                            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                                {{ row[column.key] }}
                            </slot>
                        </td>
                        <td v-if="$slots.actions" class="actions-cell">
                            <slot name="actions" :row="row"></slot>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Loading State -->
            <LoadingSpinner v-if="loading" />

            <!-- Empty State -->
            <EmptyState
                v-if="!loading && !hasData"
                :title="emptyTitle"
                :message="emptyMessage"
            >
                <template #action>
                    <slot name="empty-action"></slot>
                </template>
            </EmptyState>
        </div>

        <!-- Pagination -->
        <div v-if="!loading && hasData && totalPages > 1" class="table-pagination">
            <span class="pagination-info">{{ paginationInfo }}</span>

            <div class="pagination-controls">
                <button
                    class="pagination-btn"
                    :disabled="currentPage === 1"
                    @click="handlePageChange(currentPage - 1)"
                >
                    <ChevronLeft class="icon" />
                </button>

                <span class="pagination-pages">
                    Página {{ currentPage }} de {{ totalPages }}
                </span>

                <button
                    class="pagination-btn"
                    :disabled="currentPage === totalPages"
                    @click="handlePageChange(currentPage + 1)"
                >
                    <ChevronRight class="icon" />
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.data-table {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
    overflow: hidden;
}

.table-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 1.25rem;
    border-bottom: 1px solid var(--border);
    gap: 1rem;
}

.toolbar-search {
    flex: 0 1 auto;
    min-width: 250px;
}

.toolbar-filters {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.toolbar-actions {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
}

/* Responsive: stack on small screens */
@media (max-width: 768px) {
    .table-toolbar {
        flex-direction: column;
        align-items: stretch;
    }
    
    .toolbar-search,
    .toolbar-filters,
    .toolbar-actions {
        width: 100%;
        margin-left: 0;
    }
}

.search-box {
    position: relative;
    width: 100%;
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
    padding: 0.625rem 0.75rem 0.625rem 2.5rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font-size: 0.95rem;
    transition: border-color 0.2s;
}

.search-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(139, 0, 0, 0.1);
}

.table-container {
    overflow-x: auto;
    min-height: 200px;
}

.table {
    width: 100%;
    border-collapse: collapse;
}

.table thead {
    background-color: var(--background);
}

.table th {
    padding: 0.875rem 1.25rem;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--border);
}

.table tbody tr {
    border-bottom: 1px solid var(--border);
    transition: background-color 0.2s;
}

.table-row:hover {
    background-color: var(--background);
    cursor: pointer;
}

.table td {
    padding: 1rem 1.25rem;
    font-size: 0.95rem;
    color: var(--text);
}

.actions-column {
    width: 120px;
    text-align: center;
}

.actions-cell {
    text-align: center;
}

.table-pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--border);
}

.pagination-info {
    font-size: 0.875rem;
    color: var(--text-light);
}

.pagination-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.pagination-pages {
    font-size: 0.875rem;
    color: var(--text);
    font-weight: 500;
}

.pagination-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text);
    padding: 0.5rem;
    border-radius: var(--radius-md);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.pagination-btn:hover:not(:disabled) {
    background-color: var(--background);
    border-color: var(--primary);
    color: var(--primary);
}

.pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.icon {
    width: 1.25rem;
    height: 1.25rem;
}
</style>
