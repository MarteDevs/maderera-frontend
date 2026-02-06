import { defineStore } from 'pinia';
import { ref } from 'vue';
import { inventarioService, type ProductoStock, type MovimientoStock } from './inventario.service';

export const useInventarioStore = defineStore('inventario', () => {
    const stock = ref<ProductoStock[]>([]);
    const kardex = ref<MovimientoStock[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchStock(params?: { id_clasificacion?: number; search?: string }) {
        loading.value = true;
        error.value = null;
        try {
            const response = await inventarioService.getStock(params);
            stock.value = Array.isArray(response) ? response : (response.data || []);
        } catch (e: any) {
            console.error('Error fetching stock:', e);
            error.value = e.response?.data?.message || 'Error al cargar inventario';
        } finally {
            loading.value = false;
        }
    }

    async function fetchKardex(params?: { id_producto?: number; page?: number; limit?: number }) {
        loading.value = true;
        error.value = null;
        try {
            const response = await inventarioService.getKardex(params);
            // El kardex suele venir paginado
            kardex.value = Array.isArray(response) ? response : (response.data || []);
        } catch (e: any) {
            console.error('Error fetching kardex:', e);
            error.value = e.response?.data?.message || 'Error al cargar kardex';
        } finally {
            loading.value = false;
        }
    }

    return {
        stock,
        kardex,
        loading,
        error,
        fetchStock,
        fetchKardex
    };
});
