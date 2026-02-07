import { defineStore } from 'pinia';
import { ref } from 'vue';
import { usuariosService, type Usuario, type CreateUsuarioInput, type UpdateUsuarioInput } from './usuarios.service';

export const useUsuariosStore = defineStore('usuarios', () => {
    const usuarios = ref<Usuario[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const pagination = ref({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    async function fetchUsuarios(params: { page?: number; limit?: number; search?: string } = {}) {
        loading.value = true;
        error.value = null;
        try {
            const query = {
                page: params.page || pagination.value.page,
                limit: params.limit || pagination.value.limit,
                search: params.search
            };

            const response = await usuariosService.getAll(query);
            usuarios.value = response.data;
            if (response.pagination) {
                pagination.value = {
                    page: response.pagination.page,
                    limit: response.pagination.limit,
                    total: response.pagination.total,
                    totalPages: response.pagination.totalPages
                };
            }
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Error al cargar usuarios';
            console.error(err);
        } finally {
            loading.value = false;
        }
    }

    function setPage(page: number) {
        pagination.value.page = page;
        fetchUsuarios({ page });
    }

    async function createUsuario(data: CreateUsuarioInput) {
        loading.value = true;
        error.value = null;
        try {
            await usuariosService.create(data);
            await fetchUsuarios(); // Refresh list
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Error al crear usuario';
            throw err;
        } finally {
            loading.value = false;
        }
    }

    async function updateUsuario(id: number, data: UpdateUsuarioInput) {
        loading.value = true;
        error.value = null;
        try {
            await usuariosService.update(id, data);
            await fetchUsuarios();
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Error al actualizar usuario';
            throw err;
        } finally {
            loading.value = false;
        }
    }

    async function changePassword(id: number, password: string) {
        loading.value = true;
        error.value = null;
        try {
            await usuariosService.changePassword(id, password);
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Error al cambiar contraseña';
            throw err;
        } finally {
            loading.value = false;
        }
    }

    async function toggleActive(id: number) {
        loading.value = true;
        error.value = null;
        try {
            await usuariosService.toggleActive(id);
            // Update local state to avoid full refetch if preferred, or just refetch
            const user = usuarios.value.find(u => u.id_usuario === id);
            if (user) {
                user.activo = !user.activo;
            }
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Error al cambiar estado de usuario';
            throw err;
        } finally {
            loading.value = false;
        }
    }

    return {
        usuarios,
        loading,
        error,
        pagination,
        fetchUsuarios,
        setPage,
        createUsuario,
        updateUsuario,
        changePassword,
        toggleActive
    };
});
