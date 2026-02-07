import api from '../../services/api';

export interface ProductoStock {
    id_producto: number;
    producto: string; // Es producto, no nombre
    stock_actual: number;
    medida: string; // Viene como string desde la vista
    clasificacion?: string; // Viene como string desde la vista
    valor_total?: number;
}

export interface MovimientoStock {
    id_movimiento: number;
    fecha: string;
    tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE_POS' | 'AJUSTE_NEG' | 'DEVOLUCION' | 'AJUSTE_MANUAL';
    cantidad: number;
    producto: string;
    medida?: string;
    observacion?: string;
    usuario_registro?: string;
    codigo_viaje?: string;
    codigo_requerimiento?: string;
}

export interface AjusteStockInput {
    id_producto: number;
    tipo: 'AJUSTE_MANUAL' | 'AJUSTE_POS' | 'AJUSTE_NEG';
    cantidad: number;
    observacion: string;
}

export const inventarioService = {
    async getStock(params?: { page?: number; limit?: number; id_clasificacion?: number; search?: string }) {
        const response = await api.get('/inventory', { params });
        return response.data.data;
    },

    async getKardex(params?: { id_producto?: number; page?: number; limit?: number }) {
        const response = await api.get('/inventory/kardex', { params });
        // Response format: { status: 'success', data: { data: [], pagination: {} } }
        return response.data.data;
    },

    async adjustStock(data: AjusteStockInput) {
        const response = await api.post('/inventory/adjust', data);
        return response.data;
    }
};
