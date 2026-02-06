import api from './api';
import type {
    Requerimiento,
    CreateRequerimientoInput,
    RequerimientoProgress,
    PaginatedResponse,
    RequerimientoFilters,
    EstadoRequerimiento,
} from '../types/models';

// ============================================
// REQUERIMIENTOS
// ============================================

export const requerimientosService = {
    /**
     * Obtener todos los requerimientos con filtros y paginación
     */
    async getAll(filters?: RequerimientoFilters): Promise<PaginatedResponse<Requerimiento>> {
        const response = await api.get('/requirements', { params: filters });
        return response.data.data;
    },

    /**
     * Obtener un requerimiento por ID con todos sus detalles
     */
    async getById(id: number): Promise<Requerimiento> {
        const response = await api.get(`/requirements/${id}`);
        return response.data.data;
    },

    /**
     * Crear un nuevo requerimiento
     */
    async create(data: CreateRequerimientoInput): Promise<Requerimiento> {
        const response = await api.post('/requirements', data);
        return response.data.data;
    },

    /**
     * Actualizar un requerimiento existente (solo si está PENDIENTE)
     */
    async update(id: number, data: Partial<CreateRequerimientoInput>): Promise<Requerimiento> {
        const response = await api.put(`/requirements/${id}`, data);
        return response.data.data;
    },

    /**
     * Cambiar el estado de un requerimiento
     */
    async updateStatus(
        id: number,
        data: { estado: EstadoRequerimiento; motivo_anulacion?: string }
    ): Promise<Requerimiento> {
        const response = await api.patch(`/requirements/${id}/status`, data);
        return response.data.data;
    },

    /**
     * Anular un requerimiento
     */
    async anular(id: number, motivo: string): Promise<Requerimiento> {
        return this.updateStatus(id, {
            estado: 'ANULADO',
            motivo_anulacion: motivo,
        });
    },

    /**
     * Obtener el progreso de cumplimiento de un requerimiento
     */
    async getProgress(id: number): Promise<RequerimientoProgress> {
        const response = await api.get(`/requirements/${id}/progress`);
        return response.data.data;
    },

    /**
     * Exportar requerimiento a PDF (si está implementado en backend)
     */
    async exportToPdf(id: number): Promise<Blob> {
        const response = await api.get(`/requirements/${id}/export?format=pdf`, {
            responseType: 'blob',
        });
        return response.data;
    },
};
