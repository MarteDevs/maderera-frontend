<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Plus, Edit, Lock, UserCheck, UserX } from 'lucide-vue-next';
import { useUsuariosStore } from './usuarios.store';
import { DataTable, FormModal } from '../../components/ui';
import type { Column } from '../../components/ui/DataTable.vue';
import type { Usuario, CreateUsuarioInput, UpdateUsuarioInput } from './usuarios.service';
import { useMaestrosStore } from '../../stores';

const usuariosStore = useUsuariosStore();
const maestrosStore = useMaestrosStore();

// Estado
const showFormModal = ref(false);
const showPasswordModal = ref(false);
const editingUsuario = ref<Usuario | null>(null);
const changingPasswordUsuario = ref<Usuario | null>(null);

// Formulario de usuario
const formData = ref<CreateUsuarioInput & { id?: number }>({
    username: '',
    password: '',
    nombre_completo: '',
    rol: 'SUPERVISOR',
    id_supervisor: undefined
});

// Formulario de contraseña
const passwordData = ref({
    password: '',
    confirmPassword: ''
});

// Columnas de la tabla
const columns: Column[] = [
    { key: 'id_usuario', label: 'ID', width: '80px' },
    { key: 'username', label: 'Usuario', width: '15%' },
    { key: 'nombre_completo', label: 'Nombre Completo', width: '25%' },
    { key: 'rol', label: 'Rol', width: '12%' },
    { key: 'supervisor', label: 'Supervisor', width: '15%' },
    { key: 'activo', label: 'Estado', width: '10%', align: 'center' },
    { key: 'ultimo_login', label: 'Último Login', width: '15%' },
];

// Computed
const usuarios = computed(() =>
    usuariosStore.usuarios.map((u: Usuario) => ({
        ...u,
        supervisor: u.supervisores?.nombre || '-',
    }))
);

const supervisores = computed(() => maestrosStore.supervisores);
const isEditing = computed(() => editingUsuario.value !== null);
const modalTitle = computed(() => (isEditing.value ? 'Editar Usuario' : 'Nuevo Usuario'));
const passwordModalTitle = computed(() => `Cambiar Contraseña - ${changingPasswordUsuario.value?.username || ''}`);

// Métodos
onMounted(async () => {
    await Promise.all([
        usuariosStore.fetchUsuarios(),
        maestrosStore.fetchSupervisores()
    ]);
});

const openCreateModal = () => {
    editingUsuario.value = null;
    formData.value = {
        username: '',
        password: '',
        nombre_completo: '',
        rol: 'SUPERVISOR',
        id_supervisor: undefined
    };
    showFormModal.value = true;
};

const openEditModal = (usuario: Usuario) => {
    editingUsuario.value = usuario;
    formData.value = {
        id: usuario.id_usuario,
        username: usuario.username,
        password: '', // Don't show password
        nombre_completo: usuario.nombre_completo,
        rol: usuario.rol,
        id_supervisor: usuario.id_supervisor
    };
    showFormModal.value = true;
};

const openPasswordModal = (usuario: Usuario) => {
    changingPasswordUsuario.value = usuario;
    passwordData.value = {
        password: '',
        confirmPassword: ''
    };
    showPasswordModal.value = true;
};

const handleSubmit = async () => {
    try {
        if (isEditing.value && editingUsuario.value) {
            const updatePayload: UpdateUsuarioInput = {
                nombre_completo: formData.value.nombre_completo,
                rol: formData.value.rol,
                id_supervisor: formData.value.id_supervisor || null
            };
            await usuariosStore.updateUsuario(editingUsuario.value.id_usuario, updatePayload);
        } else {
            if (!formData.value.password) {
                alert('La contraseña es requerida para nuevos usuarios');
                return;
            }
            await usuariosStore.createUsuario(formData.value as CreateUsuarioInput);
        }
        showFormModal.value = false;
    } catch (error) {
        console.error('Error al guardar usuario:', error);
    }
};

const handlePasswordChange = async () => {
    if (!changingPasswordUsuario.value) return;
    
    if (passwordData.value.password !== passwordData.value.confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }

    if (passwordData.value.password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }

    try {
        await usuariosStore.changePassword(changingPasswordUsuario.value.id_usuario, passwordData.value.password);
        showPasswordModal.value = false;
        alert('Contraseña actualizada correctamente');
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
    }
};

const toggleActiveStatus = async (usuario: Usuario) => {
    try {
        await usuariosStore.toggleActive(usuario.id_usuario);
    } catch (error) {
        console.error('Error al cambiar estado:', error);
    }
};

const handleSearch = (query: string) => {
    usuariosStore.fetchUsuarios({ search: query, page: 1 });
};

const handlePageChange = (page: number) => {
    usuariosStore.setPage(page);
};
</script>

<template>
    <div class="usuarios-view">
        <DataTable
            :columns="columns"
            :data="usuarios"
            :loading="usuariosStore.loading"
            searchable
            search-placeholder="Buscar usuarios..."
            empty-title="Sin usuarios"
            empty-message="No hay usuarios registrados en el sistema"
            :current-page="usuariosStore.pagination.page"
            :total-pages="usuariosStore.pagination.totalPages"
            :total="usuariosStore.pagination.total"
            :page-size="usuariosStore.pagination.limit"
            @page-change="handlePageChange"
            @search="handleSearch"
        >
            <!-- Botón crear en toolbar -->
            <template #toolbar-actions>
                <button class="btn btn-primary" @click="openCreateModal">
                    <Plus class="icon" />
                    Nuevo Usuario
                </button>
            </template>

            <!-- Columna de rol con badge -->
            <template #cell-rol="{ value }">
                <span class="badge" :class="`badge-${value.toLowerCase()}`">
                    {{ value }}
                </span>
            </template>

            <!-- Columna de estado -->
            <template #cell-activo="{ value, row }">
                <button 
                    class="btn-icon" 
                    :class="value ? 'text-success' : 'text-muted'"
                    @click.stop="toggleActiveStatus(row as Usuario)"
                    :title="value ? 'Desactivar' : 'Activar'"
                >
                    <UserCheck v-if="value" class="icon" />
                    <UserX v-else class="icon" />
                </button>
            </template>

            <!-- Columna de último login -->
            <template #cell-ultimo_login="{ value }">
                {{ value ? new Date(value).toLocaleDateString('es-PE') : 'Nunca' }}
            </template>

            <!-- Acciones -->
            <template #actions="{ row }">
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" @click.stop="openEditModal(row as Usuario)" title="Editar">
                        <Edit class="icon" />
                    </button>
                    <button class="btn-icon btn-warning" @click.stop="openPasswordModal(row as Usuario)" title="Cambiar Contraseña">
                        <Lock class="icon" />
                    </button>
                </div>
            </template>
        </DataTable>

        <!-- Modal de formulario -->
        <FormModal
            :visible="showFormModal"
            :title="modalTitle"
            @close="showFormModal = false"
            @submit="handleSubmit"
        >
            <div class="form-grid">
                <div class="form-group">
                    <label>Usuario *</label>
                    <input
                        v-model="formData.username"
                        type="text"
                        required
                        :disabled="isEditing"
                        placeholder="username"
                    />
                </div>

                <div class="form-group" v-if="!isEditing">
                    <label>Contraseña *</label>
                    <input
                        v-model="formData.password"
                        type="password"
                        required
                        placeholder="Mínimo 6 caracteres"
                    />
                </div>

                <div class="form-group full-width">
                    <label>Nombre Completo *</label>
                    <input
                        v-model="formData.nombre_completo"
                        type="text"
                        required
                        placeholder="Nombre completo del usuario"
                    />
                </div>

                <div class="form-group">
                    <label>Rol *</label>
                    <select v-model="formData.rol" required>
                        <option value="ADMIN">Administrador</option>
                        <option value="LOGISTICA">Logística</option>
                        <option value="SUPERVISOR">Supervisor</option>
                        <option value="MINA">Mina</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Supervisor (Opcional)</label>
                    <select v-model="formData.id_supervisor">
                        <option :value="undefined">-- Ninguno --</option>
                        <option v-for="sup in supervisores" :key="sup.id_supervisor" :value="sup.id_supervisor">
                            {{ sup.nombre }}
                        </option>
                    </select>
                </div>
            </div>
        </FormModal>

        <!-- Modal de cambio de contraseña -->
        <FormModal
            :visible="showPasswordModal"
            :title="passwordModalTitle"
            @close="showPasswordModal = false"
            @submit="handlePasswordChange"
        >
            <div class="form-grid">
                <div class="form-group full-width">
                    <label>Nueva Contraseña *</label>
                    <input
                        v-model="passwordData.password"
                        type="password"
                        required
                        placeholder="Mínimo 6 caracteres"
                    />
                </div>

                <div class="form-group full-width">
                    <label>Confirmar Contraseña *</label>
                    <input
                        v-model="passwordData.confirmPassword"
                        type="password"
                        required
                        placeholder="Repite la contraseña"
                    />
                </div>
            </div>
        </FormModal>
    </div>
</template>

<style scoped>
.usuarios-view {
    padding: 1.5rem;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group.full-width {
    grid-column: 1 / -1;
}

.form-group label {
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text);
}

.form-group input,
.form-group select {
    padding: 0.625rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font-size: 0.95rem;
}

.form-group input:disabled {
    background-color: var(--bg-light);
    cursor: not-allowed;
}

.badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
    font-weight: 500;
}

.badge-admin {
    background-color: #dc2626;
    color: white;
}

.badge-logistica {
    background-color: #2563eb;
    color: white;
}

.badge-supervisor {
    background-color: #059669;
    color: white;
}

.badge-mina {
    background-color: #7c3aed;
    color: white;
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
}

.btn-warning {
    color: #f59e0b;
}

.btn-warning:hover {
    background-color: rgba(245, 158, 11, 0.1);
}

.text-success {
    color: #10b981;
}

.text-muted {
    color: #6b7280;
}
</style>
