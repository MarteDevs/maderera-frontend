import api from '../../services/api';

export interface RequerimientoDetalle {
    id_detalle?: number;
    id_producto: number;
    cantidad_solicitada: number;
    cantidad_entregada?: number;
    precio_proveedor: number;
    precio_mina: number;
    observacion?: string;
    // Campos opcionales para visualización
    producto?: {
        nombre: string;
        medida?: { descripcion: string };
    };
}

export interface Requerimiento {
    id_requerimiento?: number;
    codigo?: string;
    fecha_emision?: string;
    fecha_prometida: string;
    id_proveedor: number;
    id_mina: number;
    id_supervisor: number;
    estado?: 'PENDIENTE' | 'PARCIAL' | 'COMPLETADO' | 'ANULADO';
    observaciones?: string;
    detalles: RequerimientoDetalle[];
    // Relaciones para visualización
    proveedor?: { nombre: string };
    mina?: { nombre: string };
    supervisor?: { nombre: string };
    porcentaje_progreso?: number;
}

export const requerimientosService = {
    async getAll() {
        // TODO: Agregar soporte para paginación si el backend lo soporta
        const response = await api.get('/requirements');
        return response.data.data;
    },

    async getById(id: number) {
        const response = await api.get(`/requirements/${id}`);
        return response.data.data;
    },

    async create(data: Requerimiento) {
        const response = await api.post('/requirements', data);
        return response.data;
    },

    async update(id: number, data: Partial<Requerimiento>) {
        const response = await api.put(`/requirements/${id}`, data);
        return response.data;
    },

    async updateStatus(id: number, status: string, motivo?: string) {
        const response = await api.patch(`/requirements/${id}/status`, { estado: status, motivo });
        return response.data;
    },

    async getProgress(id: number) {
        const response = await api.get(`/requirements/${id}/progress`);
        return response.data.data;
    }
};
