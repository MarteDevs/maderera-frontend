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
        productosPagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
        },
        productosLoading: false,

        // Proveedores
        proveedores: [] as Proveedor[],
        proveedoresPagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
        },
        proveedoresLoading: false,

        // Minas
        minas: [] as Mina[],
        minasPagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
        },
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

        async fetchProductos(params: { page?: number; limit?: number; search?: string } = {}) {
            this.productosLoading = true;
            this.error = null;
            try {
                // Use default pagination if not provided
                const query = {
                    page: params.page || this.productosPagination.page,
                    limit: params.limit || this.productosPagination.limit,
                    search: params.search
                };

                console.log('🔄 Store: Llamando a productosService.getAll...', query);
                const response = await productosService.getAll(query);
                console.log('📊 Store: Respuesta recibida:', response);

                this.productos = response.data;
                if (response.pagination) {
                    this.productosPagination = response.pagination;
                }

                console.log('✅ Store: Productos guardados:', this.productos.length);
            } catch (error: any) {
                console.error('❌ Store: Error al cargar productos:', error);
                this.error = error.response?.data?.message || 'Error al cargar productos';
                throw error;
            } finally {
                this.productosLoading = false;
            }
        },

        setProductosPage(page: number) {
            this.productosPagination.page = page;
            this.fetchProductos({ page });
        },

        async createProducto(data: Partial<Producto>) {
            this.productosLoading = true;
            this.error = null;
            try {
                const producto = await productosService.create(data);
                await this.fetchProductos(); // Refresh list to respect pagination/sorting
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
                // Refresh list to ensure data consistency
                await this.fetchProductos();
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
                await this.fetchProductos(); // Refresh
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

        async fetchProveedores(params: { page?: number; limit?: number; search?: string } = {}) {
            this.proveedoresLoading = true;
            this.error = null;
            try {
                const query = {
                    page: params.page || this.proveedoresPagination.page,
                    limit: params.limit || this.proveedoresPagination.limit,
                    search: params.search
                };

                const response = await proveedoresService.getAll(query);
                this.proveedores = response.data;
                if (response.pagination) {
                    this.proveedoresPagination = response.pagination;
                }
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al cargar proveedores';
                throw error;
            } finally {
                this.proveedoresLoading = false;
            }
        },

        setProveedoresPage(page: number) {
            this.proveedoresPagination.page = page;
            this.fetchProveedores({ page });
        },

        async createProveedor(data: Partial<Proveedor>) {
            this.proveedoresLoading = true;
            this.error = null;
            try {
                const proveedor = await proveedoresService.create(data);
                await this.fetchProveedores();
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
                await this.fetchProveedores();
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
                await this.fetchProveedores();
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

        async fetchMinas(params: { page?: number; limit?: number; search?: string } = {}) {
            this.minasLoading = true;
            this.error = null;
            try {
                const query = {
                    page: params.page || this.minasPagination.page,
                    limit: params.limit || this.minasPagination.limit,
                    search: params.search
                };

                const response = await minasService.getAll(query);
                this.minas = response.data;
                if (response.pagination) {
                    this.minasPagination = response.pagination;
                }
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al cargar minas';
                throw error;
            } finally {
                this.minasLoading = false;
            }
        },

        setMinasPage(page: number) {
            this.minasPagination.page = page;
            this.fetchMinas({ page });
        },

        async createMina(data: Partial<Mina>) {
            this.minasLoading = true;
            this.error = null;
            try {
                const mina = await minasService.create(data);
                await this.fetchMinas();
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
                await this.fetchMinas();
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
                await this.fetchMinas();
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

        async fetchSupervisores(params: { page?: number; limit?: number; search?: string } = {}) {
            this.supervisoresLoading = true;
            this.error = null;
            try {
                const query = {
                    page: params.page || 1,
                    limit: params.limit || 10,
                    search: params.search
                };

                const response = await supervisoresService.getAll(query);
                this.supervisores = response.data;
                // Asumimos que supervisores también tendrá paginación pronto o ya la tiene
                if (response.pagination) {
                    // Si decidimos agregar supervisoresPagination al state, aquí lo actualizaríamos
                    // Por ahora solo evitamos el error de acceso a propiedad inexistente
                    this.supervisoresTotal = response.pagination.total;
                }
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
