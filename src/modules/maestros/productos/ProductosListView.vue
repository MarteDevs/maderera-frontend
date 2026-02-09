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
    proveedores: [] as Array<{ id_proveedor: number, precio_compra_sugerido: number }>
});

// Columnas de la tabla
const columns: Column[] = [
    { key: 'id_producto', label: 'ID', width: '80px' },
    { key: 'nombre', label: 'Nombre', width: '25%' }, // Flexible con mínimo
    { key: 'medida', label: 'Medida', width: '20%' },
    { key: 'clasificacion', label: 'Clasificación', width: '15%' },
    { key: 'stock_actual', label: 'Stock', width: '120px', align: 'right' },
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
        console.log('📡 Llamando a fetchProductos, Catalogos y Proveedores...');
        await Promise.all([
            maestrosStore.fetchProductos(),
            maestrosStore.fetchCatalogos(),
            maestrosStore.fetchProveedores() // New fetch
        ]);
        console.log('✅ Datos cargados');
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
        proveedores: []
    };
    showFormModal.value = true;
};

const openEditModal = (producto: Producto) => {
    editingProducto.value = producto;
    
    // Map existing providers if any
    const existingProveedores = producto.producto_proveedores?.map((pp: any) => ({
        id_proveedor: pp.id_proveedor,
        precio_compra_sugerido: pp.precio_compra_sugerido
    })) || [];

    formData.value = {
        nombre: producto.nombre,
        id_medida: producto.id_medida,
        id_clasificacion: producto.id_clasificacion,
        precio_venta_base: producto.precio_venta_base,
        observaciones: producto.observaciones || '',
        proveedores: existingProveedores
    };
    showFormModal.value = true;
};

const addProveedorRow = () => {
    formData.value.proveedores.push({ id_proveedor: 0, precio_compra_sugerido: 0 });
};

const removeProveedorRow = (index: number) => {
    formData.value.proveedores.splice(index, 1);
};

const handleSubmit = async () => {
    try {
        // Validation: remove items with no provider selected
        // Validation: remove items with no provider selected
        const validProveedores = formData.value.proveedores
            .filter(p => p.id_proveedor > 0)
            .map(p => ({
                ...p,
                precio_compra_sugerido: Number(p.precio_compra_sugerido)
            }));

        const payload = { 
            ...formData.value, 
            precio_venta_base: Number(formData.value.precio_venta_base),
            proveedores: validProveedores 
        };

        if (isEditing.value && editingProducto.value) {
            await maestrosStore.updateProducto(editingProducto.value.id_producto, payload);
        } else {
            await maestrosStore.createProducto(payload);
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
    maestrosStore.fetchProductos({ search: query, page: 1 });
};

const handlePageChange = (page: number) => {
    maestrosStore.setProductosPage(page);
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
            :current-page="maestrosStore.productosPagination.page"
            :total-pages="maestrosStore.productosPagination.totalPages"
            :total="maestrosStore.productosPagination.total"
            :page-size="maestrosStore.productosPagination.limit"
            @page-change="handlePageChange"
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

                <!-- Sección Precios Proveedores -->
                <div class="form-section">
                    <div class="section-header">
                        <h4>Precios de Proveedores</h4>
                        <button type="button" class="btn-text" @click="addProveedorRow">
                            <Plus class="icon-sm" /> Agregar
                        </button>
                    </div>
                    
                    <div v-if="formData.proveedores.length === 0" class="empty-message">
                        Sin proveedores asignados
                    </div>

                    <div v-else class="proveedores-list">
                        <div v-for="(item, index) in formData.proveedores" :key="index" class="proveedor-row">
                            <select v-model="item.id_proveedor" required>
                                <option :value="0" disabled>Seleccionar Proveedor</option>
                                <option v-for="prov in maestrosStore.proveedores" :key="prov.id_proveedor" :value="prov.id_proveedor">
                                    {{ prov.nombre }}
                                </option>
                            </select>
                            <input 
                                v-model.number="item.precio_compra_sugerido" 
                                type="number" 
                                step="0.01" 
                                placeholder="Precio S/."
                                required
                            />
                            <button type="button" class="btn-icon btn-delete-row" @click="removeProveedorRow(index)">
                                <Trash2 class="icon-sm" />
                            </button>
                        </div>
                    </div>
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

/* Sección Proveedores */
.form-section {
    border-top: 1px solid var(--border);
    padding-top: 1rem;
    margin-top: 0.5rem;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.section-header h4 {
    margin: 0;
    font-size: 0.95rem;
    color: var(--text);
}

.btn-text {
    background: none;
    border: none;
    color: var(--primary);
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.btn-text:hover {
    text-decoration: underline;
}

.proveedores-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.proveedor-row {
    display: grid;
    grid-template-columns: 2fr 1fr auto;
    gap: 0.75rem;
    align-items: center;
}

.proveedor-row select,
.proveedor-row input {
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
}

.btn-delete-row {
    color: #9ca3af;
    padding: 0.25rem;
}

.btn-delete-row:hover {
    color: #ef4444;
    background-color: #fee2e2;
}

.empty-message {
    text-align: center;
    color: var(--text-light);
    font-size: 0.85rem;
    padding: 1rem;
    background-color: var(--bg-light);
    border-radius: var(--radius-md);
    border: 1px dashed var(--border);
}

.icon-sm {
    width: 1rem;
    height: 1rem;
}
</style>
