<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Plus, Edit, Trash2 } from 'lucide-vue-next';
import { useMaestrosStore } from '../../../stores';
import { DataTable, FormModal, ConfirmDialog } from '../../../components/ui';
import type { Column } from '../../../components/ui/DataTable.vue';
import type { Mina } from '../../../types/models';

const maestrosStore = useMaestrosStore();

const showFormModal = ref(false);
const showDeleteDialog = ref(false);
const editingMina = ref<Mina | null>(null);
const deletingMina = ref<Mina | null>(null);

const formData = ref({
    nombre: '',
    razon_social: '',
    ruc: '',
    ubicacion: '',
    contacto: '',
});

const columns: Column[] = [
    { key: 'id_mina', label: 'ID', width: '80px' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'razon_social', label: 'Razón Social' },
    { key: 'ruc', label: 'RUC', width: '120px' },
    { key: 'ubicacion', label: 'Ubicación' },
    { key: 'contacto', label: 'Contacto' },
];

const isEditing = computed(() => editingMina.value !== null);
const modalTitle = computed(() => (isEditing.value ? 'Editar Mina' : 'Nueva Mina'));

onMounted(() => {
    maestrosStore.fetchMinas();
});

const openCreateModal = () => {
    editingMina.value = null;
    formData.value = { nombre: '', razon_social: '', ruc: '', ubicacion: '', contacto: '' };
    showFormModal.value = true;
};

const openEditModal = (mina: Mina) => {
    editingMina.value = mina;
    formData.value = {
        nombre: mina.nombre,
        razon_social: mina.razon_social || '',
        ruc: mina.ruc || '',
        ubicacion: mina.ubicacion || '',
        contacto: mina.contacto || '',
    };
    showFormModal.value = true;
};

const handleSubmit = async () => {
    try {
        if (isEditing.value && editingMina.value) {
            await maestrosStore.updateMina(editingMina.value.id_mina, formData.value);
        } else {
            await maestrosStore.createMina(formData.value);
        }
        showFormModal.value = false;
    } catch (error) {
        console.error('Error:', error);
    }
};

const openDeleteDialog = (mina: Mina) => {
    deletingMina.value = mina;
    showDeleteDialog.value = true;
};

const handleDelete = async () => {
    if (!deletingMina.value) return;
    try {
        await maestrosStore.deleteMina(deletingMina.value.id_mina);
        showDeleteDialog.value = false;
    } catch (error) {
        console.error('Error:', error);
    }
};
</script>

<template>
    <div class="minas-view">
        <DataTable
            :columns="columns"
            :data="maestrosStore.minasActivas"
            :loading="maestrosStore.minasLoading"
            searchable
            search-placeholder="Buscar minas..."
            empty-title="Sin minas"
            empty-message="No hay minas registradas"
        >
            <template #toolbar-actions>
                <button class="btn btn-primary" @click="openCreateModal">
                    <Plus class="icon" />
                    Nueva Mina
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

        <FormModal v-model:visible="showFormModal" :title="modalTitle" :loading="maestrosStore.minasLoading">
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
                <div class="form-group">
                    <label>Ubicación</label>
                    <input v-model="formData.ubicacion" />
                </div>
                <div class="form-group">
                    <label>Contacto</label>
                    <input v-model="formData.contacto" />
                </div>
            </form>

            <template #footer>
                <button class="btn btn-secondary" @click="showFormModal = false">Cancelar</button>
                <button class="btn btn-primary" @click="handleSubmit">Guardar</button>
            </template>
        </FormModal>

        <ConfirmDialog
            v-model:visible="showDeleteDialog"
            title="Eliminar Mina"
            :message="`¿Eliminar '${deletingMina?.nombre}'?`"
            variant="danger"
            @confirm="handleDelete"
        />
    </div>
</template>

<style scoped src="../../../assets/maestros-common.css"></style>
