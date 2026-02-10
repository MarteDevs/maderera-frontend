import { defineStore } from 'pinia';
import { ref } from 'vue';
import { despachosService, type CreateDespachoDTO, type UpdateDespachoDTO, type DespachoFilters } from '../services/despachos.service';

// Extender el tipo para incluir datos de stock/precios
export interface DetalleDespachoExtendido {
    id_producto: number;
    id_medida: number;
    cantidad_despachada: number;
    observacion: string;
    // Campos para mostrar
    producto_nombre?: string;
    medida_descripcion?: string;
    stock_actual?: number;
    precio_compra?: number;
    precio_venta?: number;
    subtotal?: number;
}

export const useDespachosStore = defineStore('despachos', () => {
    // State
    const despachos = ref<any[]>([]);
    const currentDespacho = ref<any | null>(null);
    const loading = ref(false);
    const pagination = ref({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    // Actions
    async function fetchDespachos(filters?: DespachoFilters) {
        loading.value = true;
        try {
            const response = await despachosService.getAll(filters);
            despachos.value = response.data;
            pagination.value = response.pagination;
        } catch (error: any) {
            console.error('Error al cargar despachos:', error);
            throw error;
        } finally {
            loading.value = false;
        }
    }

    async function fetchDespachoById(id: number) {
        loading.value = true;
        try {
            currentDespacho.value = await despachosService.getById(id);
            return currentDespacho.value;
        } catch (error: any) {
            console.error('Error al cargar despacho:', error);
            throw error;
        } finally {
            loading.value = false;
        }
    }

    async function createDespacho(data: CreateDespachoDTO) {
        loading.value = true;
        try {
            const newDespacho = await despachosService.create(data);
            return newDespacho;
        } catch (error: any) {
            console.error('Error al crear despacho:', error);
            throw error;
        } finally {
            loading.value = false;
        }
    }

    async function updateDespacho(id: number, data: UpdateDespachoDTO) {
        loading.value = true;
        try {
            const updated = await despachosService.update(id, data);
            return updated;
        } catch (error: any) {
            console.error('Error al actualizar despacho:', error);
            throw error;
        } finally {
            loading.value = false;
        }
    }

    async function deleteDespacho(id: number) {
        loading.value = true;
        try {
            await despachosService.delete(id);
            await fetchDespachos();
        } catch (error: any) {
            console.error('Error al eliminar despacho:', error);
            throw error;
        } finally {
            loading.value = false;
        }
    }

    async function cambiarATransito(id: number, fecha_salida?: string) {
        loading.value = true;
        try {
            await despachosService.cambiarATransito(id, fecha_salida);
            await fetchDespachos();
        } catch (error: any) {
            console.error('Error al enviar a tránsito:', error);
            throw error;
        } finally {
            loading.value = false;
        }
    }

    async function marcarEntregado(id: number, fecha_entrega?: string) {
        loading.value = true;
        try {
            await despachosService.marcarEntregado(id, fecha_entrega);
            await fetchDespachos();
        } catch (error: any) {
            console.error('Error al marcar como entregado:', error);
            throw error;
        } finally {
            loading.value = false;
        }
    }

    async function anularDespacho(id: number, motivo: string) {
        loading.value = true;
        try {
            await despachosService.anular(id, motivo);
            await fetchDespachos();
        } catch (error: any) {
            console.error('Error al anular despacho:', error);
            throw error;
        } finally {
            loading.value = false;
        }
    }

    return {
        despachos,
        currentDespacho,
        loading,
        pagination,
        fetchDespachos,
        fetchDespachoById,
        createDespacho,
        updateDespacho,
        deleteDespacho,
        cambiarATransito,
        marcarEntregado,
        anularDespacho
    };
});
