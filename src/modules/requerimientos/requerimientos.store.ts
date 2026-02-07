import { defineStore } from 'pinia';
import { ref } from 'vue';
import { requerimientosService, type Requerimiento } from './requerimientos.service';

export const useRequerimientosStore = defineStore('requerimientos', () => {
    const requerimientos = ref<Requerimiento[]>([]);
    const currentRequerimiento = ref<Requerimiento | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Paginación y Filtros
    const pagination = ref({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    const filters = ref({
        search: '',
        id_proveedor: '',
        id_mina: '',
        estado: '',
        fecha_inicio: '',
        fecha_fin: ''
    });

    async function fetchRequerimientos() {
        loading.value = true;
        error.value = null;
        try {
            // Construir params limpiando valores vacíos
            const params: any = {
                page: pagination.value.page,
                limit: pagination.value.limit,
                search: filters.value.search || undefined,
                id_proveedor: filters.value.id_proveedor || undefined,
                id_mina: filters.value.id_mina || undefined,
                estado: filters.value.estado || undefined,
                fecha_inicio: filters.value.fecha_inicio || undefined,
                fecha_fin: filters.value.fecha_fin || undefined
            };

            const response = await requerimientosService.getAll(params);

            if (response && response.data) {
                requerimientos.value = response.data;
                // Actualizar info de paginación si viene en la respuesta
                if (response.pagination) {
                    pagination.value.page = response.pagination.page;
                    pagination.value.total = response.pagination.total;
                    pagination.value.totalPages = response.pagination.totalPages;
                }
            } else if (Array.isArray(response)) {
                // Fallback si la respuesta no es paginada (no debería ocurrir con el servicio actualizado)
                requerimientos.value = response;
            } else {
                requerimientos.value = [];
            }
        } catch (e: any) {
            console.error('Error fetching requerimientos:', e);
            error.value = e.response?.data?.message || 'Error al cargar requerimientos';
        } finally {
            loading.value = false;
        }
    }

    async function fetchRequerimientoById(id: number) {
        loading.value = true;
        error.value = null;
        try {
            currentRequerimiento.value = await requerimientosService.getById(id);
        } catch (e: any) {
            console.error('Error fetching requerimiento details:', e);
            error.value = e.response?.data?.message || 'Error al cargar el detalle del requerimiento';
        } finally {
            loading.value = false;
        }
    }

    async function createRequerimiento(data: Requerimiento) {
        loading.value = true;
        error.value = null;
        try {
            await requerimientosService.create(data);
            await fetchRequerimientos();
            return true;
        } catch (e: any) {
            console.error('Error creating requerimiento:', e);
            error.value = e.response?.data?.message || 'Error al crear el requerimiento';
            return false;
        } finally {
            loading.value = false;
        }
    }

    function setPage(page: number) {
        pagination.value.page = page;
        fetchRequerimientos();
    }

    function setFilters(newFilters: any) {
        filters.value = { ...filters.value, ...newFilters };
        pagination.value.page = 1; // Resetear a primera página al filtrar
        fetchRequerimientos();
    }

    return {
        requerimientos,
        currentRequerimiento,
        loading,
        error,
        pagination,
        filters,
        fetchRequerimientos,
        fetchRequerimientoById,
        createRequerimiento,
        setPage,
        setFilters
    };
});
