import { defineStore } from 'pinia';
import { viajesService } from '../services';
import type { Viaje, CreateViajeInput } from '../types/models';

// ============================================
// VIAJES STORE
// ============================================

export const useViajesStore = defineStore('viajes', {
    state: () => ({
        // Lista de viajes
        viajes: [] as Viaje[],
        total: 0,
        page: 1,
        limit: 20,

        // Viaje actual (detalle)
        currentViaje: null as Viaje | null,

        // Viajes por requerimiento
        viajesByRequerimiento: {} as Record<number, Viaje[]>,

        // Estados de carga
        loading: false,
        loadingDetail: false,
        loadingByRequerimiento: false,

        // Error
        error: null as string | null,
    }),

    getters: {
        // Total de páginas
        totalPages: (state) => Math.ceil(state.total / state.limit),

        // Buscar viaje por ID
        getViajeById: (state) => (id: number) =>
            state.viajes.find((v) => v.id_viaje === id),

        // Obtener viajes de un requerimiento desde cache
        getViajesByRequerimiento: (state) => (idRequerimiento: number) =>
            state.viajesByRequerimiento[idRequerimiento] || [],

        // Contar viajes por requerimiento
        countViajesByRequerimiento: (state) => (idRequerimiento: number) =>
            state.viajesByRequerimiento[idRequerimiento]?.length || 0,
    },

    actions: {
        // ============================================
        // LISTAR
        // ============================================

        async fetchViajes(params?: { page?: number; limit?: number }) {
            this.loading = true;
            this.error = null;

            if (params?.page) this.page = params.page;
            if (params?.limit) this.limit = params.limit;

            try {
                const response = await viajesService.getAll({
                    page: this.page,
                    limit: this.limit,
                });

                this.viajes = response.data;
                this.total = response.total;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al cargar viajes';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        // ============================================
        // DETALLE
        // ============================================

        async fetchViajeById(id: number) {
            this.loadingDetail = true;
            this.error = null;
            try {
                this.currentViaje = await viajesService.getById(id);
                return this.currentViaje;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al cargar viaje';
                throw error;
            } finally {
                this.loadingDetail = false;
            }
        },

        // ============================================
        // CREAR (REGISTRAR VIAJE)
        // ============================================

        async createViaje(data: CreateViajeInput) {
            this.loading = true;
            this.error = null;
            try {
                const result = await viajesService.create(data);

                // Recargar viajes del requerimiento para actualizar la lista
                await this.fetchViajesByRequerimiento(data.id_requerimiento);

                // Agregar a la lista general si estamos en la primera página
                if (this.page === 1) {
                    await this.fetchViajes();
                }

                return result;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al registrar viaje';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        // ============================================
        // VIAJES POR REQUERIMIENTO
        // ============================================

        async fetchViajesByRequerimiento(idRequerimiento: number) {
            this.loadingByRequerimiento = true;
            this.error = null;
            try {
                const viajes = await viajesService.getByRequerimiento(idRequerimiento);
                this.viajesByRequerimiento[idRequerimiento] = viajes;
                return viajes;
            } catch (error: any) {
                this.error =
                    error.response?.data?.message || 'Error al cargar viajes del requerimiento';
                throw error;
            } finally {
                this.loadingByRequerimiento = false;
            }
        },

        // ============================================
        // ACTUALIZAR
        // ============================================

        async updateViaje(id: number, data: Partial<CreateViajeInput>) {
            this.loading = true;
            this.error = null;
            try {
                const viaje = await viajesService.update(id, data);
                const index = this.viajes.findIndex((v) => v.id_viaje === id);
                if (index !== -1) {
                    this.viajes[index] = viaje;
                }
                if (this.currentViaje?.id_viaje === id) {
                    this.currentViaje = viaje;
                }
                return viaje;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al actualizar viaje';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        // ============================================
        // ELIMINAR
        // ============================================

        async deleteViaje(id: number) {
            this.loading = true;
            this.error = null;
            try {
                await viajesService.delete(id);
                const index = this.viajes.findIndex((v) => v.id_viaje === id);
                if (index !== -1) {
                    this.viajes.splice(index, 1);
                    this.total--;
                }
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al eliminar viaje';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        // ============================================
        // PAGINACIÓN
        // ============================================

        setPage(page: number) {
            this.page = page;
            this.fetchViajes();
        },

        setLimit(limit: number) {
            this.limit = limit;
            this.page = 1;
            this.fetchViajes();
        },

        nextPage() {
            if (this.page < this.totalPages) {
                this.page++;
                this.fetchViajes();
            }
        },

        prevPage() {
            if (this.page > 1) {
                this.page--;
                this.fetchViajes();
            }
        },

        // ============================================
        // UTILIDADES
        // ============================================

        clearError() {
            this.error = null;
        },

        clearCurrent() {
            this.currentViaje = null;
        },

        clearViajesByRequerimiento(idRequerimiento: number) {
            delete this.viajesByRequerimiento[idRequerimiento];
        },
    },
});
