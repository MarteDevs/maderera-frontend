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
        // Mapeo manual para ajustar la estructura anidada de Prisma al Frontend
        if (response.data.data && Array.isArray(response.data.data.data)) {
            response.data.data.data = response.data.data.data.map(mapViajeFromBackend);
        }
        return response.data.data;
    },

    async getById(id: number) {
        const response = await api.get(`/viajes/${id}`);
        return mapViajeFromBackend(response.data.data);
    },

    async getByRequerimiento(idRequerimiento: number) {
        const response = await api.get(`/viajes/requerimiento/${idRequerimiento}`);
        return response.data.data.map(mapViajeFromBackend);
    },

    async create(data: Viaje) {
        const response = await api.post('/viajes', data);
        return response.data;
    }
};

function mapViajeFromBackend(v: any): any {
    if (!v) return null;
    return {
        ...v,
        // Aplanar datos para la tabla (DataTable no soporta keys anidadas)
        req_codigo: v.requerimientos?.codigo || '---',
        prov_nombre: v.requerimientos?.proveedores?.nombre || '---',
        // Estructura anidada para el Modal de Detalles
        requerimiento: v.requerimientos ? {
            ...v.requerimientos,
            proveedor: v.requerimientos.proveedores
        } : undefined
    };
}
