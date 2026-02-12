import api from './api';
import type {
    Producto,
    Proveedor,
    Mina,
    Supervisor,
    Medida,
    Clasificacion,
    PaginatedResponse,
    QueryParams,
} from '../types/models';

// ============================================
// PRODUCTOS
// ============================================

export const productosService = {
    async getAll(params?: QueryParams): Promise<PaginatedResponse<Producto>> {
        const response = await api.get('/products', { params });
        console.log('📦 Respuesta completa de /products:', response.data);
        return response.data.data;
    },

    async getById(id: number): Promise<Producto> {
        const response = await api.get(`/products/${id}`);
        return response.data.data;
    },

    async create(data: Partial<Producto>): Promise<Producto> {
        const response = await api.post('/products', data);
        return response.data.data;
    },

    async update(id: number, data: Partial<Producto>): Promise<Producto> {
        const response = await api.put(`/products/${id}`, data);
        return response.data.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/products/${id}`);
    },
};

// ============================================
// PROVEEDORES
// ============================================

export const proveedoresService = {
    async getAll(params?: QueryParams): Promise<PaginatedResponse<Proveedor>> {
        const response = await api.get('/providers', { params });
        return response.data.data;
    },

    async getById(id: number): Promise<Proveedor> {
        const response = await api.get(`/providers/${id}`);
        return response.data.data;
    },

    async create(data: Partial<Proveedor>): Promise<Proveedor> {
        const response = await api.post('/providers', data);
        return response.data.data;
    },

    async update(id: number, data: Partial<Proveedor>): Promise<Proveedor> {
        const response = await api.put(`/providers/${id}`, data);
        return response.data.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/providers/${id}`);
    },
};

// ============================================
// MINAS
// ============================================

export const minasService = {
    async getAll(params?: QueryParams): Promise<PaginatedResponse<Mina>> {
        const response = await api.get('/mines', { params });
        return response.data.data;
    },

    async getById(id: number): Promise<Mina> {
        const response = await api.get(`/mines/${id}`);
        return response.data.data;
    },

    async create(data: Partial<Mina>): Promise<Mina> {
        const response = await api.post('/mines', data);
        return response.data.data;
    },

    async update(id: number, data: Partial<Mina>): Promise<Mina> {
        const response = await api.put(`/mines/${id}`, data);
        return response.data.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/mines/${id}`);
    },
};

// ============================================
// SUPERVISORES
// ============================================

export const supervisoresService = {
    async getAll(params?: QueryParams): Promise<PaginatedResponse<Supervisor>> {
        const response = await api.get('/supervisors', { params });
        return response.data.data;
    },

    async getById(id: number): Promise<Supervisor> {
        const response = await api.get(`/supervisors/${id}`);
        return response.data.data;
    },

    async create(data: Partial<Supervisor>): Promise<Supervisor> {
        const response = await api.post('/supervisors', data);
        return response.data.data;
    },

    async update(id: number, data: Partial<Supervisor>): Promise<Supervisor> {
        const response = await api.put(`/supervisors/${id}`, data);
        return response.data.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/supervisors/${id}`);
    },
};

// ============================================
// MEDIDAS (Solo lectura - catálogo)
// ============================================

export const medidasService = {
    async getAll(): Promise<Medida[]> {
        const response = await api.get('/products/medidas');
        return response.data.data;
    },

    async create(data: { descripcion: string }): Promise<Medida> {
        const response = await api.post('/products/medidas', data);
        return response.data.data;
    },
};

// ============================================
// CLASIFICACIONES (Solo lectura - catálogo)
// ============================================

export const clasificacionesService = {
    async getAll(): Promise<Clasificacion[]> {
        const response = await api.get('/products/clasificaciones');
        return response.data.data;
    },
};
