import { defineStore } from 'pinia';
import { ref } from 'vue';
import { viajesService, type Viaje } from './viajes.service';

export const useViajesStore = defineStore('viajes', () => {
    const viajes = ref<Viaje[]>([]);
    const currentViaje = ref<Viaje | null>(null);
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
        fecha_inicio: '',
        fecha_fin: ''
    });

    async function fetchViajes() {
        loading.value = true;
        error.value = null;
        try {
            const params: any = {
                page: pagination.value.page,
                limit: pagination.value.limit,
                search: filters.value.search || undefined,
                id_proveedor: filters.value.id_proveedor || undefined,
                id_mina: filters.value.id_mina || undefined,
                fecha_inicio: filters.value.fecha_inicio || undefined,
                fecha_fin: filters.value.fecha_fin || undefined
            };

            const response = await viajesService.getAll(params);

            if (response && response.data) {
                viajes.value = response.data;
                if (response.pagination) {
                    pagination.value.page = response.pagination.page;
                    pagination.value.total = response.pagination.total;
                    pagination.value.totalPages = response.pagination.totalPages;
                }
            } else if (Array.isArray(response)) {
                viajes.value = response;
            } else {
                viajes.value = [];
            }
        } catch (e: any) {
            console.error('Error fetching viajes:', e);
            error.value = e.response?.data?.message || 'Error al cargar viajes';
        } finally {
            loading.value = false;
        }
    }

    async function fetchViajesByRequerimiento(idReq: number) {
        loading.value = true;
        error.value = null;
        try {
            const response = await viajesService.getByRequerimiento(idReq);
            viajes.value = Array.isArray(response) ? response : [];
        } catch (e: any) {
            console.error('Error fetching viajes del requerimiento:', e);
            error.value = e.response?.data?.message || 'Error al cargar viajes del requerimiento';
        } finally {
            loading.value = false;
        }
    }

    async function createViaje(data: Viaje) {
        loading.value = true;
        error.value = null;
        try {
            await viajesService.create(data);
            await fetchViajes();
            return true;
        } catch (e: any) {
            console.error('Error creating viaje:', e);
            error.value = e.response?.data?.message || 'Error al registrar el viaje';
            return false;
        } finally {
            loading.value = false;
        }
    }

    function setPage(page: number) {
        pagination.value.page = page;
        fetchViajes();
    }

    function setFilters(newFilters: any) {
        filters.value = { ...filters.value, ...newFilters };
        pagination.value.page = 1;
        fetchViajes();
    }

    return {
        viajes,
        currentViaje,
        loading,
        error,
        pagination,
        filters,
        fetchViajes,
        fetchViajesByRequerimiento,
        createViaje,
        setPage,
        setFilters
    };
});
