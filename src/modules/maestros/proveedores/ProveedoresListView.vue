<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Plus, Edit, Trash2 } from 'lucide-vue-next';
import { useMaestrosStore } from '../../../stores';
import { DataTable, FormModal, ConfirmDialog } from '../../../components/ui';
import type { Column } from '../../../components/ui/DataTable.vue';
import type { Proveedor } from '../../../types/models';

const maestrosStore = useMaestrosStore();

const showFormModal = ref(false);
const showDeleteDialog = ref(false);
const editingProveedor = ref<Proveedor | null>(null);
const deletingProveedor = ref<Proveedor | null>(null);

const formData = ref({
    nombre: '',
    razon_social: '',
    ruc: '',
    contacto: '',
    telefono: '',
});

const columns: Column[] = [
    { key: 'id_proveedor', label: 'ID', width: '80px' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'razon_social', label: 'Razón Social' },
    { key: 'ruc', label: 'RUC', width: '120px' },
    { key: 'contacto', label: 'Contacto' },
    { key: 'telefono', label: 'Teléfono', width: '130px' },
];

const isEditing = computed(() => editingProveedor.value !== null);
const modalTitle = computed(() => (isEditing.value ? 'Editar Proveedor' : 'Nuevo Proveedor'));

onMounted(() => {
    maestrosStore.fetchProveedores();
});

const openCreateModal = () => {
    editingProveedor.value = null;
    formData.value = { nombre: '', razon_social: '', ruc: '', contacto: '', telefono: '' };
    showFormModal.value = true;
};

const openEditModal = (proveedor: Proveedor) => {
    editingProveedor.value = proveedor;
    formData.value = {
        nombre: proveedor.nombre,
        razon_social: proveedor.razon_social || '',
        ruc: proveedor.ruc || '',
        contacto: proveedor.contacto || '',
        telefono: proveedor.telefono || '',
    };
    showFormModal.value = true;
};

const handleSubmit = async () => {
    try {
        if (isEditing.value && editingProveedor.value) {
            await maestrosStore.updateProveedor(editingProveedor.value.id_proveedor, formData.value);
        } else {
            await maestrosStore.createProveedor(formData.value);
        }
        showFormModal.value = false;
    } catch (error) {
        console.error('Error:', error);
    }
};

const openDeleteDialog = (proveedor: Proveedor) => {
    deletingProveedor.value = proveedor;
    showDeleteDialog.value = true;
};

const handleDelete = async () => {
    if (!deletingProveedor.value) return;
    try {
        await maestrosStore.deleteProveedor(deletingProveedor.value.id_proveedor);
        showDeleteDialog.value = false;
    } catch (error) {
        console.error('Error:', error);
    }
};
</script>

<template>
    <div class="proveedores-view">
        <DataTable
            :columns="columns"
            :data="maestrosStore.proveedores"
            :loading="maestrosStore.proveedoresLoading"
            searchable
            search-placeholder="Buscar proveedores..."
            empty-title="Sin proveedores"
            empty-message="No hay proveedores registrados"
            :current-page="maestrosStore.proveedoresPagination.page"
            :total-pages="maestrosStore.proveedoresPagination.totalPages"
            :total="maestrosStore.proveedoresPagination.total"
            :page-size="maestrosStore.proveedoresPagination.limit"
            @page-change="maestrosStore.setProveedoresPage"
            @search="(q) => maestrosStore.fetchProveedores({ search: q, page: 1 })"
        >
            <template #toolbar-actions>
                <button class="btn btn-primary" @click="openCreateModal">
                    <Plus class="icon" />
                    Nuevo Proveedor
                </button>
            </template>

            <template #actions="{ row }">
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" @click.stop="openEditModal(row)">
                        <Edit class="icon" />
                    </button>
                    <button class="btn-icon btn-delete" @click.stop="openDeleteDialog(row)">
                        <Trash2 class="icon" />
                    </button>
                </div>
            </template>
        </DataTable>

        <FormModal v-model:visible="showFormModal" :title="modalTitle" :loading="maestrosStore.proveedoresLoading">
            <form @submit.prevent="handleSubmit" class="form">
                <div class="form-group">
                    <label>Nombre *</label>
                    <input v-model="formData.nombre" required />
                </div>
                <div class="form-group">
                    <label>Razón Social</label>
                    <input v-model="formData.razon_social" />
                </div>
                <div class="form-group">
                    <label>RUC</label>
                    <input v-model="formData.ruc" maxlength="11" />
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Contacto</label>
                        <input v-model="formData.contacto" />
                    </div>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input v-model="formData.telefono" type="tel" />
                    </div>
                </div>
            </form>

            <template #footer>
                <button class="btn btn-secondary" @click="showFormModal = false">Cancelar</button>
                <button class="btn btn-primary" @click="handleSubmit">Guardar</button>
            </template>
        </FormModal>

        <ConfirmDialog
            v-model:visible="showDeleteDialog"
            title="Eliminar Proveedor"
            :message="`¿Eliminar '${deletingProveedor?.nombre}'?`"
            variant="danger"
            @confirm="handleDelete"
        />
    </div>
</template>

<style scoped src="../../../assets/maestros-common.css"></style>
