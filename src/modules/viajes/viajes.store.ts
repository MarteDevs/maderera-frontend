import { defineStore } from 'pinia';
import { ref } from 'vue';
import { viajesService, type Viaje } from './viajes.service';

export const useViajesStore = defineStore('viajes', () => {
    const viajes = ref<Viaje[]>([]);
    const currentViaje = ref<Viaje | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchViajes(page = 1, limit = 20) {
        loading.value = true;
        error.value = null;
        try {
            const response = await viajesService.getAll(page, limit);
            if (response && response.data && Array.isArray(response.data)) {
                viajes.value = response.data;
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
            return true;
        } catch (e: any) {
            console.error('Error creating viaje:', e);
            error.value = e.response?.data?.message || 'Error al registrar el viaje';
            return false;
        } finally {
            loading.value = false;
        }
    }

    return {
        viajes,
        currentViaje,
        loading,
        error,
        fetchViajes,
        fetchViajesByRequerimiento,
        createViaje
    };
});
