import api from '../../services/api';

export interface ViajeDetalle {
    id_viaje_detalle?: number;
    id_detalle_requerimiento: number;
    cantidad_recibida: number;
    estado_entrega: 'OK' | 'RECHAZADO' | 'PARCIAL' | 'MUESTRA' | 'DA_ADO';
    observacion?: string;
    // relaciones
    producto_nombre?: string;
    cantidad_solicitada?: number;
}

export interface Viaje {
    id_viaje?: number;
    id_requerimiento: number;
    numero_viaje?: number;
    fecha_salida?: string;
    fecha_ingreso?: string;
    placa_vehiculo: string;
    conductor: string;
    observaciones?: string;
    detalles: ViajeDetalle[];
    // Relaciones
    requerimiento?: {
        codigo: string;
        proveedor?: { nombre: string };
    };
}

export const viajesService = {
    async getAll(page = 1, limit = 20) {
        const response = await api.get('/viajes', { params: { page, limit } });
        return response.data.data;
    },

    async getById(id: number) {
        const response = await api.get(`/viajes/${id}`);
        return response.data.data;
    },

    async getByRequerimiento(idRequerimiento: number) {
        const response = await api.get(`/viajes/requerimiento/${idRequerimiento}`);
        return response.data.data;
    },

    async create(data: Viaje) {
        const response = await api.post('/viajes', data);
        return response.data;
    }
};
