import api from './api';
import type { ProductoProveedor, PrecioHistorico, PaginatedResponse } from '../types/models';

// ============================================
// PRECIOS POR PROVEEDOR
// ============================================

export const preciosService = {
    /**
     * Obtener todos los precios con filtros opcionales
     */
    async getAll(params?: {
        provider_id?: number;
        product_id?: number;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResponse<ProductoProveedor>> {
        const response = await api.get('/prices', { params });
        return response.data.data;
    },

    /**
     * Crear o actualizar precio de un producto para un proveedor
     */
    async createOrUpdate(data: {
        id_proveedor: number;
        id_producto: number;
        precio_compra_sugerido: number;
    }): Promise<ProductoProveedor> {
        const response = await api.post('/prices', data);
        return response.data.data;
    },

    /**
     * Obtener histórico de cambios de precio
     */
    async getHistory(catalogId: number): Promise<PrecioHistorico[]> {
        const response = await api.get(`/prices/history/${catalogId}`);
        return response.data.data;
    },

    /**
     * Obtener precio sugerido para un producto de un proveedor
     */
    async getSuggestedPrice(providerId: number, productId: number): Promise<number | null> {
        try {
            const response = await api.get('/prices', {
                params: { provider_id: providerId, product_id: productId },
            });
            const prices = response.data.data.data;
            return prices.length > 0 ? prices[0].precio_compra_sugerido : null;
        } catch (error) {
            return null;
        }
    },
};
