import api from './api';
import type { Viaje, CreateViajeInput, PaginatedResponse, QueryParams } from '../types/models';

// ============================================
// VIAJES
// ============================================

export const viajesService = {
    /**
     * Obtener todos los viajes con filtros opcionales
     */
    async getAll(params?: QueryParams): Promise<PaginatedResponse<Viaje>> {
        const response = await api.get('/trips', { params });
        return response.data.data;
    },

    /**
     * Obtener un viaje por ID con todos sus detalles
     */
    async getById(id: number): Promise<Viaje> {
        const response = await api.get(`/trips/${id}`);
        return response.data.data;
    },

    /**
     * Registrar un nuevo viaje
     * Esto actualizará automáticamente el stock y el progreso del requerimiento
     */
    async create(data: CreateViajeInput): Promise<{ id_viaje: number; message: string }> {
        const response = await api.post('/trips', data);
        return response.data.data;
    },

    /**
     * Obtener todos los viajes asociados a un requerimiento
     */
    async getByRequerimiento(idRequerimiento: number): Promise<Viaje[]> {
        const response = await api.get(`/trips/by-requirement/${idRequerimiento}`);
        return response.data.data;
    },

    /**
     * Actualizar un viaje existente (si está permitido)
     */
    async update(id: number, data: Partial<CreateViajeInput>): Promise<Viaje> {
        const response = await api.put(`/trips/${id}`, data);
        return response.data.data;
    },

    /**
     * Eliminar un viaje (si está permitido)
     */
    async delete(id: number): Promise<void> {
        await api.delete(`/trips/${id}`);
    },
};
