<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Plus, Edit, Trash2 } from 'lucide-vue-next';
import { useMaestrosStore } from '../../../stores';
import { DataTable, FormModal, ConfirmDialog } from '../../../components/ui';
import type { Column } from '../../../components/ui/DataTable.vue';
import type { Supervisor } from '../../../types/models';

const maestrosStore = useMaestrosStore();

const showFormModal = ref(false);
const showDeleteDialog = ref(false);
const editingSupervisor = ref<Supervisor | null>(null);
const deletingSupervisor = ref<Supervisor | null>(null);

const formData = ref({
    nombre: '',
    telefono: '',
    email: '',
});

const columns: Column[] = [
    { key: 'id_supervisor', label: 'ID', width: '80px' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'telefono', label: 'Teléfono', width: '150px' },
    { key: 'email', label: 'Email' },
];

const isEditing = computed(() => editingSupervisor.value !== null);
const modalTitle = computed(() => (isEditing.value ? 'Editar Supervisor' : 'Nuevo Supervisor'));

onMounted(() => {
    maestrosStore.fetchSupervisores();
});

const openCreateModal = () => {
    editingSupervisor.value = null;
    formData.value = { nombre: '', telefono: '', email: '' };
    showFormModal.value = true;
};

const openEditModal = (supervisor: Supervisor) => {
    editingSupervisor.value = supervisor;
    formData.value = {
        nombre: supervisor.nombre,
        telefono: supervisor.telefono || '',
        email: supervisor.email || '',
    };
    showFormModal.value = true;
};

const handleSubmit = async () => {
    try {
        if (isEditing.value && editingSupervisor.value) {
            await maestrosStore.updateSupervisor(editingSupervisor.value.id_supervisor, formData.value);
        } else {
            await maestrosStore.createSupervisor(formData.value);
        }
        showFormModal.value = false;
    } catch (error) {
        console.error('Error:', error);
    }
};

const openDeleteDialog = (supervisor: Supervisor) => {
    deletingSupervisor.value = supervisor;
    showDeleteDialog.value = true;
};

const handleDelete = async () => {
    if (!deletingSupervisor.value) return;
    try {
        await maestrosStore.deleteSupervisor(deletingSupervisor.value.id_supervisor);
        showDeleteDialog.value = false;
    } catch (error) {
        console.error('Error:', error);
    }
};
</script>

<template>
    <div class="supervisores-view">
        <DataTable
            :columns="columns"
            :data="maestrosStore.supervisoresActivos"
            :loading="maestrosStore.supervisoresLoading"
            searchable
            search-placeholder="Buscar supervisores..."
            empty-title="Sin supervisores"
            empty-message="No hay supervisores registrados"
        >
            <template #toolbar-actions>
                <button class="btn btn-primary" @click="openCreateModal">
                    <Plus class="icon" />
                    Nuevo Supervisor
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

        <FormModal v-model:visible="showFormModal" :title="modalTitle" :loading="maestrosStore.supervisoresLoading" size="sm">
            <form @submit.prevent="handleSubmit" class="form">
                <div class="form-group">
                    <label>Nombre *</label>
                    <input v-model="formData.nombre" required />
                </div>
                <div class="form-group">
                    <label>Teléfono</label>
                    <input v-model="formData.telefono" type="tel" />
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input v-model="formData.email" type="email" />
                </div>
            </form>

            <template #footer>
                <button class="btn btn-secondary" @click="showFormModal = false">Cancelar</button>
                <button class="btn btn-primary" @click="handleSubmit">Guardar</button>
            </template>
        </FormModal>

        <ConfirmDialog
            v-model:visible="showDeleteDialog"
            title="Eliminar Supervisor"
            :message="`¿Eliminar '${deletingSupervisor?.nombre}'?`"
            variant="danger"
            @confirm="handleDelete"
        />
    </div>
</template>

<style scoped src="../../../assets/maestros-common.css"></style>
