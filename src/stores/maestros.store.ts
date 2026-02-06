import { defineStore } from 'pinia';
import {
    productosService,
    proveedoresService,
    minasService,
    supervisoresService,
    medidasService,
    clasificacionesService,
} from '../services';
import type {
    Producto,
    Proveedor,
    Mina,
    Supervisor,
    Medida,
    Clasificacion,
} from '../types/models';

// ============================================
// MAESTROS STORE
// ============================================

export const useMaestrosStore = defineStore('maestros', {
    state: () => ({
        // Productos
        productos: [] as Producto[],
        productosTotal: 0,
        productosLoading: false,

        // Proveedores
        proveedores: [] as Proveedor[],
        proveedoresTotal: 0,
        proveedoresLoading: false,

        // Minas
        minas: [] as Mina[],
        minasTotal: 0,
        minasLoading: false,

        // Supervisores
        supervisores: [] as Supervisor[],
        supervisoresTotal: 0,
        supervisoresLoading: false,

        // Catálogos
        medidas: [] as Medida[],
        clasificaciones: [] as Clasificacion[],
        catalogosLoading: false,

        // UI State
        error: null as string | null,
    }),

    getters: {
        // Productos activos (no eliminados)
        productosActivos: (state) =>
            state.productos.filter((p) => !p.deleted_at),

        // Proveedores activos
        proveedoresActivos: (state) =>
            state.proveedores.filter((p) => !p.deleted_at),

        // Minas activas
        minasActivas: (state) => state.minas.filter((m) => !m.deleted_at),

        // Supervisores activos
        supervisoresActivos: (state) =>
            state.supervisores.filter((s) => !s.deleted_at),

        // Buscar producto por ID
        getProductoById: (state) => (id: number) =>
            state.productos.find((p) => p.id_producto === id),

        // Buscar proveedor por ID
        getProveedorById: (state) => (id: number) =>
            state.proveedores.find((p) => p.id_proveedor === id),

        // Buscar mina por ID
        getMinaById: (state) => (id: number) =>
            state.minas.find((m) => m.id_mina === id),

        // Buscar supervisor por ID
        getSupervisorById: (state) => (id: number) =>
            state.supervisores.find((s) => s.id_supervisor === id),
    },

    actions: {
        // ============================================
        // PRODUCTOS
        // ============================================

        async fetchProductos(params?: { page?: number; limit?: number; search?: string }) {
            this.productosLoading = true;
            this.error = null;
            try {
                const response = await productosService.getAll(params);
                this.productos = response.data;
                this.productosTotal = response.total;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al cargar productos';
                throw error;
            } finally {
                this.productosLoading = false;
            }
        },

        async createProducto(data: Partial<Producto>) {
            this.productosLoading = true;
            this.error = null;
            try {
                const producto = await productosService.create(data);
                this.productos.unshift(producto);
                this.productosTotal++;
                return producto;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al crear producto';
                throw error;
            } finally {
                this.productosLoading = false;
            }
        },

        async updateProducto(id: number, data: Partial<Producto>) {
            this.productosLoading = true;
            this.error = null;
            try {
                const producto = await productosService.update(id, data);
                const index = this.productos.findIndex((p) => p.id_producto === id);
                if (index !== -1) {
                    this.productos[index] = producto;
                }
                return producto;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al actualizar producto';
                throw error;
            } finally {
                this.productosLoading = false;
            }
        },

        async deleteProducto(id: number) {
            this.productosLoading = true;
            this.error = null;
            try {
                await productosService.delete(id);
                const index = this.productos.findIndex((p) => p.id_producto === id);
                if (index !== -1) {
                    this.productos.splice(index, 1);
                    this.productosTotal--;
                }
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al eliminar producto';
                throw error;
            } finally {
                this.productosLoading = false;
            }
        },

        // ============================================
        // PROVEEDORES
        // ============================================

        async fetchProveedores(params?: { page?: number; limit?: number }) {
            this.proveedoresLoading = true;
            this.error = null;
            try {
                const response = await proveedoresService.getAll(params);
                this.proveedores = response.data;
                this.proveedoresTotal = response.total;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al cargar proveedores';
                throw error;
            } finally {
                this.proveedoresLoading = false;
            }
        },

        async createProveedor(data: Partial<Proveedor>) {
            this.proveedoresLoading = true;
            this.error = null;
            try {
                const proveedor = await proveedoresService.create(data);
                this.proveedores.unshift(proveedor);
                this.proveedoresTotal++;
                return proveedor;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al crear proveedor';
                throw error;
            } finally {
                this.proveedoresLoading = false;
            }
        },

        async updateProveedor(id: number, data: Partial<Proveedor>) {
            this.proveedoresLoading = true;
            this.error = null;
            try {
                const proveedor = await proveedoresService.update(id, data);
                const index = this.proveedores.findIndex((p) => p.id_proveedor === id);
                if (index !== -1) {
                    this.proveedores[index] = proveedor;
                }
                return proveedor;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al actualizar proveedor';
                throw error;
            } finally {
                this.proveedoresLoading = false;
            }
        },

        async deleteProveedor(id: number) {
            this.proveedoresLoading = true;
            this.error = null;
            try {
                await proveedoresService.delete(id);
                const index = this.proveedores.findIndex((p) => p.id_proveedor === id);
                if (index !== -1) {
                    this.proveedores.splice(index, 1);
                    this.proveedoresTotal--;
                }
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al eliminar proveedor';
                throw error;
            } finally {
                this.proveedoresLoading = false;
            }
        },

        // ============================================
        // MINAS
        // ============================================

        async fetchMinas(params?: { page?: number; limit?: number }) {
            this.minasLoading = true;
            this.error = null;
            try {
                const response = await minasService.getAll(params);
                this.minas = response.data;
                this.minasTotal = response.total;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al cargar minas';
                throw error;
            } finally {
                this.minasLoading = false;
            }
        },

        async createMina(data: Partial<Mina>) {
            this.minasLoading = true;
            this.error = null;
            try {
                const mina = await minasService.create(data);
                this.minas.unshift(mina);
                this.minasTotal++;
                return mina;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al crear mina';
                throw error;
            } finally {
                this.minasLoading = false;
            }
        },

        async updateMina(id: number, data: Partial<Mina>) {
            this.minasLoading = true;
            this.error = null;
            try {
                const mina = await minasService.update(id, data);
                const index = this.minas.findIndex((m) => m.id_mina === id);
                if (index !== -1) {
                    this.minas[index] = mina;
                }
                return mina;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al actualizar mina';
                throw error;
            } finally {
                this.minasLoading = false;
            }
        },

        async deleteMina(id: number) {
            this.minasLoading = true;
            this.error = null;
            try {
                await minasService.delete(id);
                const index = this.minas.findIndex((m) => m.id_mina === id);
                if (index !== -1) {
                    this.minas.splice(index, 1);
                    this.minasTotal--;
                }
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al eliminar mina';
                throw error;
            } finally {
                this.minasLoading = false;
            }
        },

        // ============================================
        // SUPERVISORES
        // ============================================

        async fetchSupervisores(params?: { page?: number; limit?: number }) {
            this.supervisoresLoading = true;
            this.error = null;
            try {
                const response = await supervisoresService.getAll(params);
                this.supervisores = response.data;
                this.supervisoresTotal = response.total;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al cargar supervisores';
                throw error;
            } finally {
                this.supervisoresLoading = false;
            }
        },

        async createSupervisor(data: Partial<Supervisor>) {
            this.supervisoresLoading = true;
            this.error = null;
            try {
                const supervisor = await supervisoresService.create(data);
                this.supervisores.unshift(supervisor);
                this.supervisoresTotal++;
                return supervisor;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al crear supervisor';
                throw error;
            } finally {
                this.supervisoresLoading = false;
            }
        },

        async updateSupervisor(id: number, data: Partial<Supervisor>) {
            this.supervisoresLoading = true;
            this.error = null;
            try {
                const supervisor = await supervisoresService.update(id, data);
                const index = this.supervisores.findIndex((s) => s.id_supervisor === id);
                if (index !== -1) {
                    this.supervisores[index] = supervisor;
                }
                return supervisor;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al actualizar supervisor';
                throw error;
            } finally {
                this.supervisoresLoading = false;
            }
        },

        async deleteSupervisor(id: number) {
            this.supervisoresLoading = true;
            this.error = null;
            try {
                await supervisoresService.delete(id);
                const index = this.supervisores.findIndex((s) => s.id_supervisor === id);
                if (index !== -1) {
                    this.supervisores.splice(index, 1);
                    this.supervisoresTotal--;
                }
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al eliminar supervisor';
                throw error;
            } finally {
                this.supervisoresLoading = false;
            }
        },

        // ============================================
        // CATÁLOGOS
        // ============================================

        async fetchCatalogos() {
            this.catalogosLoading = true;
            this.error = null;
            try {
                const [medidas, clasificaciones] = await Promise.all([
                    medidasService.getAll(),
                    clasificacionesService.getAll(),
                ]);
                this.medidas = medidas;
                this.clasificaciones = clasificaciones;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al cargar catálogos';
                throw error;
            } finally {
                this.catalogosLoading = false;
            }
        },

        // ============================================
        // UTILIDADES
        // ============================================

        clearError() {
            this.error = null;
        },
    },
});
