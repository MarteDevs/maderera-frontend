import api from '../../services/api';
import type { PaginatedResponse, QueryParams } from '../../types/models';

export interface Usuario {
    id_usuario: number;
    username: string;
    nombre_completo: string;
    rol: 'ADMIN' | 'LOGISTICA' | 'SUPERVISOR' | 'MINA';
    activo: boolean;
    ultimo_login?: string;
    id_supervisor?: number;
    supervisores?: {
        nombre: string;
    };
}

export interface CreateUsuarioInput {
    username: string;
    password?: string; // Optional because we might auto-generate or set later, but schema requires it
    nombre_completo: string;
    rol: string;
    id_supervisor?: number;
}

export interface UpdateUsuarioInput {
    nombre_completo?: string;
    rol?: string;
    activo?: boolean;
    id_supervisor?: number | null;
}

export const usuariosService = {
    async getAll(params?: QueryParams): Promise<PaginatedResponse<Usuario>> {
        const response = await api.get('/users', { params });
        return response.data.data; // Backend returns { status: 'success', data: { data: [], pagination: {} } }
    },

    async getById(id: number): Promise<Usuario> {
        const response = await api.get(`/users/${id}`);
        return response.data.data;
    },

    async create(data: CreateUsuarioInput): Promise<Usuario> {
        const response = await api.post('/users', data);
        return response.data.data;
    },

    async update(id: number, data: UpdateUsuarioInput): Promise<Usuario> {
        const response = await api.put(`/users/${id}`, data);
        return response.data.data;
    },

    async changePassword(id: number, password: string): Promise<void> {
        await api.patch(`/users/${id}/password`, { password });
    },

    async toggleActive(id: number): Promise<Usuario> {
        const response = await api.patch(`/users/${id}/toggle-active`);
        return response.data.data;
    }
};
