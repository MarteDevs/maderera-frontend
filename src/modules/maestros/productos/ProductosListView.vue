<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Plus, Edit, Trash2 } from 'lucide-vue-next';
import { useMaestrosStore } from '../../../stores';
import { DataTable, FormModal, ConfirmDialog } from '../../../components/ui';
import type { Column } from '../../../components/ui/DataTable.vue';
import type { Producto } from '../../../types/models';

console.log('🚀 ProductosListView: Componente cargado');

const maestrosStore = useMaestrosStore();

// Estado
const showFormModal = ref(false);
const showDeleteDialog = ref(false);
const editingProducto = ref<Producto | null>(null);
const deletingProducto = ref<Producto | null>(null);

// Formulario
const formData = ref({
    nombre: '',
    id_medida: 0,
    id_clasificacion: undefined as number | undefined,
    precio_venta_base: 0,
    observaciones: '',
});

// Columnas de la tabla
const columns: Column[] = [
    { key: 'id_producto', label: 'ID', width: '80px' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'medida', label: 'Medida', width: '150px' },
    { key: 'clasificacion', label: 'Clasificación', width: '150px' },
    { key: 'stock_actual', label: 'Stock', width: '100px', align: 'right' },
    { key: 'precio_venta_base', label: 'Precio', width: '120px', align: 'right' },
];

// Computed
const productos = computed(() =>
    maestrosStore.productos.map((p) => ({
        ...p,
        medida: p.medidas?.descripcion || '-',
        clasificacion: p.clasificaciones?.nombre || '-',
    }))
);

const medidas = computed(() => maestrosStore.medidas);
const clasificaciones = computed(() => maestrosStore.clasificaciones);

const isEditing = computed(() => editingProducto.value !== null);
const modalTitle = computed(() => (isEditing.value ? 'Editar Producto' : 'Nuevo Producto'));

// Métodos
onMounted(async () => {
    console.log('🔍 ProductosListView: onMounted iniciado');
    try {
        console.log('📡 Llamando a fetchProductos y fetchCatalogos...');
        await Promise.all([
            maestrosStore.fetchProductos(),
            maestrosStore.fetchCatalogos(),
        ]);
        console.log('✅ Datos cargados:', {
            productos: maestrosStore.productos.length,
            medidas: maestrosStore.medidas.length,
            clasificaciones: maestrosStore.clasificaciones.length
        });
    } catch (error) {
        console.error('❌ Error al cargar datos:', error);
    }
});

const openCreateModal = () => {
    editingProducto.value = null;
    formData.value = {
        nombre: '',
        id_medida: 0,
        id_clasificacion: undefined,
        precio_venta_base: 0,
        observaciones: '',
    };
    showFormModal.value = true;
};

const openEditModal = (producto: Producto) => {
    editingProducto.value = producto;
    formData.value = {
        nombre: producto.nombre,
        id_medida: producto.id_medida,
        id_clasificacion: producto.id_clasificacion,
        precio_venta_base: producto.precio_venta_base,
        observaciones: producto.observaciones || '',
    };
    showFormModal.value = true;
};

const handleSubmit = async () => {
    try {
        if (isEditing.value && editingProducto.value) {
            await maestrosStore.updateProducto(editingProducto.value.id_producto, formData.value);
        } else {
            await maestrosStore.createProducto(formData.value);
        }
        showFormModal.value = false;
    } catch (error) {
        console.error('Error al guardar producto:', error);
    }
};

const openDeleteDialog = (producto: Producto) => {
    deletingProducto.value = producto;
    showDeleteDialog.value = true;
};

const handleDelete = async () => {
    if (!deletingProducto.value) return;

    try {
        await maestrosStore.deleteProducto(deletingProducto.value.id_producto);
        showDeleteDialog.value = false;
        deletingProducto.value = null;
    } catch (error) {
        console.error('Error al eliminar producto:', error);
    }
};

const handleSearch = (query: string) => {
    maestrosStore.fetchProductos({ search: query });
};
</script>

<template>
    <div class="productos-view">
        <DataTable
            :columns="columns"
            :data="productos"
            :loading="maestrosStore.productosLoading"
            searchable
            search-placeholder="Buscar productos..."
            empty-title="Sin productos"
            empty-message="No hay productos registrados en el sistema"
            @search="handleSearch"
        >
            <!-- Botón crear en toolbar -->
            <template #toolbar-actions>
                <button class="btn btn-primary" @click="openCreateModal">
                    <Plus class="icon" />
                    Nuevo Producto
                </button>
            </template>

            <!-- Columna de stock con formato -->
            <template #cell-stock_actual="{ value }">
                <span :class="{ 'text-danger': value < 50, 'text-warning': value < 100 }">
                    {{ value }}
                </span>
            </template>

            <!-- Columna de precio con formato -->
            <template #cell-precio_venta_base="{ value }">
                S/. {{ Number(value || 0).toFixed(2) }}
            </template>

            <!-- Acciones -->
            <template #actions="{ row }">
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" @click.stop="openEditModal(row)" title="Editar">
                        <Edit class="icon" />
                    </button>
                    <button class="btn-icon btn-delete" @click.stop="openDeleteDialog(row)" title="Eliminar">
                        <Trash2 class="icon" />
                    </button>
                </div>
            </template>

            <!-- Acción en estado vacío -->
            <template #empty-action>
                <button class="btn btn-primary" @click="openCreateModal">
                    <Plus class="icon" />
                    Crear Primer Producto
                </button>
            </template>
        </DataTable>

        <!-- Modal de formulario -->
        <FormModal
            v-model:visible="showFormModal"
            :title="modalTitle"
            :loading="maestrosStore.productosLoading"
            size="md"
        >
            <form @submit.prevent="handleSubmit" class="product-form">
                <div class="form-group">
                    <label for="nombre">Nombre *</label>
                    <input
                        id="nombre"
                        v-model="formData.nombre"
                        type="text"
                        required
                        placeholder="Ej: Poste de Eucalipto"
                    />
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="medida">Medida *</label>
                        <select id="medida" v-model.number="formData.id_medida" required>
                            <option :value="0" disabled>Seleccionar medida</option>
                            <option v-for="medida in medidas" :key="medida.id_medida" :value="medida.id_medida">
                                {{ medida.descripcion }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="clasificacion">Clasificación</label>
                        <select id="clasificacion" v-model.number="formData.id_clasificacion">
                            <option :value="undefined">Sin clasificación</option>
                            <option
                                v-for="clasificacion in clasificaciones"
                                :key="clasificacion.id_clasificacion"
                                :value="clasificacion.id_clasificacion"
                            >
                                {{ clasificacion.nombre }}
                            </option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="precio">Precio de Venta Base *</label>
                    <input
                        id="precio"
                        v-model.number="formData.precio_venta_base"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="0.00"
                    />
                </div>

                <div class="form-group">
                    <label for="observaciones">Observaciones</label>
                    <textarea
                        id="observaciones"
                        v-model="formData.observaciones"
                        rows="3"
                        placeholder="Observaciones adicionales..."
                    ></textarea>
                </div>
            </form>

            <template #footer>
                <button
                    type="button"
                    class="btn btn-secondary"
                    @click="showFormModal = false"
                    :disabled="maestrosStore.productosLoading"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    class="btn btn-primary"
                    @click="handleSubmit"
                    :disabled="maestrosStore.productosLoading"
                >
                    {{ maestrosStore.productosLoading ? 'Guardando...' : 'Guardar' }}
                </button>
            </template>
        </FormModal>

        <!-- Diálogo de confirmación -->
        <ConfirmDialog
            v-model:visible="showDeleteDialog"
            title="Eliminar Producto"
            :message="`¿Estás seguro de eliminar el producto '${deletingProducto?.nombre}'? Esta acción no se puede deshacer.`"
            confirm-text="Eliminar"
            variant="danger"
            :loading="maestrosStore.productosLoading"
            @confirm="handleDelete"
        />
    </div>
</template>

<style scoped>
.productos-view {
    padding: 0;
}

.btn {
    padding: 0.625rem 1.25rem;
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.95rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
    cursor: pointer;
}

.btn-primary {
    background-color: var(--primary);
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background-color: var(--primary-hover);
}

.btn-secondary {
    background-color: var(--background);
    color: var(--text);
}

.btn-secondary:hover:not(:disabled) {
    background-color: #e5e7eb;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
}

.btn-icon {
    background: transparent;
    border: none;
    padding: 0.5rem;
    border-radius: var(--radius-sm);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.btn-edit {
    color: #2563eb;
}

.btn-edit:hover {
    background-color: #dbeafe;
}

.btn-delete {
    color: #dc2626;
}

.btn-delete:hover {
    background-color: #fee2e2;
}

.icon {
    width: 1.125rem;
    height: 1.125rem;
}

.text-danger {
    color: #dc2626;
    font-weight: 600;
}

.text-warning {
    color: #d97706;
    font-weight: 600;
}

/* Formulario */
.product-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text);
}

.form-group input,
.form-group select,
.form-group textarea {
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font-size: 0.95rem;
    transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(139, 0, 0, 0.1);
}

.form-group textarea {
    resize: vertical;
    font-family: inherit;
}
</style>
