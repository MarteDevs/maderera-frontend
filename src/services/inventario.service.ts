import api from './api';
import type {
    Stock,
    MovimientoStock,
    AdjustStockInput,
    StockFilters,
    KardexFilters,
} from '../types/models';

// ============================================
// INVENTARIO
// ============================================

export const inventarioService = {
    /**
     * Consultar stock disponible con filtros
     */
    async getStock(filters?: StockFilters): Promise<{
        page: number;
        limit: number;
        data: Stock[];
    }> {
        const response = await api.get('/inventory/stock', { params: filters });
        return response.data.data;
    },

    /**
     * Consultar kardex (historial de movimientos)
     */
    async getKardex(filters?: KardexFilters): Promise<MovimientoStock[]> {
        const response = await api.get('/inventory/kardex', { params: filters });
        return response.data.data;
    },

    /**
     * Realizar ajuste manual de inventario
     */
    async adjustStock(data: AdjustStockInput): Promise<MovimientoStock> {
        const response = await api.post('/inventory/adjust', data);
        return response.data.data;
    },

    /**
     * Obtener movimientos de stock con paginación
     */
    async getMovements(params?: {
        tipo?: string;
        limit?: number;
        page?: number;
    }): Promise<MovimientoStock[]> {
        const response = await api.get('/inventory/movements', { params });
        return response.data.data;
    },

    /**
     * Exportar stock a Excel (si está implementado)
     */
    async exportStock(format: 'excel' | 'pdf' = 'excel'): Promise<Blob> {
        const response = await api.get(`/inventory/export?format=${format}`, {
            responseType: 'blob',
        });
        return response.data;
    },

    /**
     * Obtener productos con stock bajo (< 100)
     */
    async getLowStock(): Promise<Stock[]> {
        const response = await api.get('/inventory/stock', {
            params: { bajo_stock: true },
        });
        return response.data.data.data;
    },
};
