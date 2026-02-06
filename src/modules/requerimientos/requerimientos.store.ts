import { defineStore } from 'pinia';
import { ref } from 'vue';
import { requerimientosService, type Requerimiento } from './requerimientos.service';

export const useRequerimientosStore = defineStore('requerimientos', () => {
    const requerimientos = ref<Requerimiento[]>([]);
    const currentRequerimiento = ref<Requerimiento | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchRequerimientos() {
        loading.value = true;
        error.value = null;
        try {
            requerimientos.value = await requerimientosService.getAll();
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
            // Si el backend soporta endpoint de progreso separado, podrías llamarlo aquí y mezclarlo
            // const progress = await requerimientosService.getProgress(id);
            // if (currentRequerimiento.value) currentRequerimiento.value.porcentaje_progreso = progress.porcentaje_total;
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
            await fetchRequerimientos(); // Recargar lista
            return true;
        } catch (e: any) {
            console.error('Error creating requerimiento:', e);
            error.value = e.response?.data?.message || 'Error al crear el requerimiento';
            return false;
        } finally {
            loading.value = false;
        }
    }

    return {
        requerimientos,
        currentRequerimiento,
        loading,
        error,
        fetchRequerimientos,
        fetchRequerimientoById,
        createRequerimiento
    };
});
