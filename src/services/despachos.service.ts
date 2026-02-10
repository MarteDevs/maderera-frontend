import api from './api';

export interface DespachoDetalle {
    id_producto: number;
    id_medida: number;
    cantidad_despachada: number;
    observacion?: string;
}

export interface CreateDespachoDTO {
    id_mina: number;
    id_supervisor?: number;
    id_viaje?: number;
    observaciones?: string;
    detalles: DespachoDetalle[];
}

export interface UpdateDespachoDTO {
    id_mina?: number;
    id_supervisor?: number;
    id_viaje?: number;
    observaciones?: string;
    detalles?: DespachoDetalle[];
}

export interface DespachoFilters {
    page?: number;
    limit?: number;
    estado?: 'PREPARANDO' | 'EN_TRANSITO' | 'ENTREGADO' | 'ANULADO';
    id_mina?: number;
    id_viaje?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    search?: string;
}

export const despachosService = {
    /**
     * Listar despachos con filtros
     */
    async getAll(filters?: DespachoFilters) {
        const response = await api.get('/despachos', { params: filters });
        return response.data;
    },

    /**
     * Obtener un despacho por ID
     */
    async getById(id: number) {
        const response = await api.get(`/despachos/${id}`);
        return response.data;
    },

    /**
     * Crear nuevo despacho
     */
    async create(data: CreateDespachoDTO) {
        const response = await api.post('/despachos', data);
        return response.data;
    },

    /**
     * Actualizar despacho (solo PREPARANDO)
     */
    async update(id: number, data: UpdateDespachoDTO) {
        const response = await api.put(`/despachos/${id}`, data);
        return response.data;
    },

    /**
     * Eliminar despacho (solo PREPARANDO)
     */
    async delete(id: number) {
        const response = await api.delete(`/despachos/${id}`);
        return response.data;
    },

    /**
     * Cambiar a EN_TRANSITO
     */
    async cambiarATransito(id: number, fecha_salida?: string) {
        const response = await api.patch(`/despachos/${id}/transito`, { fecha_salida });
        return response.data;
    },

    /**
     * Marcar como ENTREGADO
     */
    async marcarEntregado(id: number, fecha_entrega?: string) {
        const response = await api.patch(`/despachos/${id}/entregar`, { fecha_entrega });
        return response.data;
    },

    /**
     * Anular despacho
     */
    async anular(id: number, motivo_anulacion: string) {
        const response = await api.patch(`/despachos/${id}/anular`, { motivo_anulacion });
        return response.data;
    }
};
