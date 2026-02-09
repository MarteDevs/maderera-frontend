import { defineStore } from 'pinia';
import { requerimientosService } from '../services';
import { useToast } from '../composables/useToast';
import type {
    Requerimiento,
    CreateRequerimientoInput,
    RequerimientoProgress,
    RequerimientoFilters,
    EstadoRequerimiento,
} from '../types/models';

// ============================================
// REQUERIMIENTOS STORE
// ============================================

export const useRequerimientosStore = defineStore('requerimientos', {
    state: () => ({
        // Lista de requerimientos
        requerimientos: [] as Requerimiento[],
        pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 1,
        },

        // Requerimiento actual (detalle)
        currentRequerimiento: null as Requerimiento | null,
        currentProgress: null as RequerimientoProgress | null,

        // Estados de carga
        loading: false,
        loadingDetail: false,
        loadingProgress: false,

        // Filtros activos
        filters: {
            estado: undefined,
            id_proveedor: undefined,
            fecha_inicio: undefined,
            fecha_fin: undefined,
            search: undefined,
        } as RequerimientoFilters,

        // Error
        error: null as string | null,
    }),

    getters: {
        // Requerimientos por estado
        requerimientosPendientes: (state) =>
            state.requerimientos.filter((r) => r.estado === 'PENDIENTE'),

        requerimientosParciales: (state) =>
            state.requerimientos.filter((r) => r.estado === 'PARCIAL'),

        requerimientosCompletados: (state) =>
            state.requerimientos.filter((r) => r.estado === 'COMPLETADO'),

        requerimientosAnulados: (state) =>
            state.requerimientos.filter((r) => r.estado === 'ANULADO'),

        // Total de páginas (now accessed directly from pagination state)
        totalPages: (state) => state.pagination.totalPages,

        // Buscar por ID
        getRequerimientoById: (state) => (id: number) =>
            state.requerimientos.find((r) => r.id_requerimiento === id),

        // Verificar si se puede editar
        canEdit: (state) => (id: number) => {
            const req = state.requerimientos.find((r) => r.id_requerimiento === id);
            return req?.estado === 'PENDIENTE';
        },

        // Verificar si se puede anular
        canAnular: (state) => (id: number) => {
            const req = state.requerimientos.find((r) => r.id_requerimiento === id);
            return req?.estado !== 'ANULADO' && req?.estado !== 'COMPLETADO';
        },
    },

    actions: {
        // ============================================
        // LISTAR
        // ============================================

        async fetchRequerimientos(filters?: RequerimientoFilters) {
            this.loading = true;
            this.error = null;

            // Actualizar filtros si se proporcionan
            if (filters) {
                this.filters = { ...this.filters, ...filters };
            }

            try {
                const response = await requerimientosService.getAll({
                    ...this.filters,
                    page: this.pagination.page,
                    limit: this.pagination.limit,
                });

                this.requerimientos = response.data;
                this.pagination = response.pagination;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al cargar requerimientos';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        // ============================================
        // DETALLE
        // ============================================

        async fetchRequerimientoById(id: number) {
            this.loadingDetail = true;
            this.error = null;
            try {
                this.currentRequerimiento = await requerimientosService.getById(id);
                return this.currentRequerimiento;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al cargar requerimiento';
                throw error;
            } finally {
                this.loadingDetail = false;
            }
        },

        // ============================================
        // CREAR
        // ============================================

        async createRequerimiento(data: CreateRequerimientoInput) {
            this.loading = true;
            this.error = null;
            try {
                const requerimiento = await requerimientosService.create(data);
                this.requerimientos.unshift(requerimiento);
                this.pagination.total++;
                const toast = useToast();
                toast.success('Requerimiento creado exitosamente');
                return requerimiento;
            } catch (error: any) {
                const toast = useToast();
                this.error = error.response?.data?.message || 'Error al crear requerimiento';
                toast.error(this.error || 'Error desconocido');
                throw error;
            } finally {
                this.loading = false;
            }
        },

        // ============================================
        // ACTUALIZAR
        // ============================================

        async updateRequerimiento(id: number, data: Partial<CreateRequerimientoInput>) {
            this.loading = true;
            this.error = null;
            try {
                const requerimiento = await requerimientosService.update(id, data);
                const index = this.requerimientos.findIndex((r) => r.id_requerimiento === id);
                if (index !== -1) {
                    this.requerimientos[index] = requerimiento;
                }
                if (this.currentRequerimiento?.id_requerimiento === id) {
                    this.currentRequerimiento = requerimiento;
                }
                const toast = useToast();
                toast.success('Requerimiento actualizado exitosamente');
                return requerimiento;
            } catch (error: any) {
                const toast = useToast();
                this.error = error.response?.data?.message || 'Error al actualizar requerimiento';
                toast.error(this.error || 'Error desconocido');
                throw error;
            } finally {
                this.loading = false;
            }
        },

        // ============================================
        // CAMBIAR ESTADO
        // ============================================

        async updateStatus(id: number, estado: EstadoRequerimiento, motivo?: string) {
            this.loading = true;
            this.error = null;
            try {
                const requerimiento = await requerimientosService.updateStatus(id, {
                    estado,
                    motivo_anulacion: motivo,
                });
                const index = this.requerimientos.findIndex((r) => r.id_requerimiento === id);
                if (index !== -1) {
                    this.requerimientos[index] = requerimiento;
                }
                if (this.currentRequerimiento?.id_requerimiento === id) {
                    this.currentRequerimiento = requerimiento;
                }
                const toast = useToast();
                toast.success(`Estado actualizado a ${estado}`);
                return requerimiento;
            } catch (error: any) {
                const toast = useToast();
                this.error = error.response?.data?.message || 'Error al cambiar estado';
                toast.error(this.error || 'Error desconocido');
                throw error;
            } finally {
                this.loading = false;
            }
        },

        // ============================================
        // ANULAR
        // ============================================

        async anularRequerimiento(id: number, motivo: string) {
            return this.updateStatus(id, 'ANULADO', motivo);
        },

        // ============================================
        // PROGRESO
        // ============================================

        async fetchProgress(id: number) {
            this.loadingProgress = true;
            this.error = null;
            try {
                this.currentProgress = await requerimientosService.getProgress(id);
                return this.currentProgress;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al cargar progreso';
                throw error;
            } finally {
                this.loadingProgress = false;
            }
        },

        // ============================================
        // PAGINACIÓN
        // ============================================

        setPage(page: number) {
            this.pagination.page = page;
            this.fetchRequerimientos();
        },

        setLimit(limit: number) {
            this.pagination.limit = limit;
            this.pagination.page = 1;
            this.fetchRequerimientos();
        },

        nextPage() {
            if (this.pagination.page < this.pagination.totalPages) {
                this.pagination.page++;
                this.fetchRequerimientos();
            }
        },

        prevPage() {
            if (this.pagination.page > 1) {
                this.pagination.page--;
                this.fetchRequerimientos();
            }
        },

        // ============================================
        // FILTROS
        // ============================================

        setFilters(filters: Partial<RequerimientoFilters>) {
            this.filters = { ...this.filters, ...filters };
            this.pagination.page = 1;
            this.fetchRequerimientos();
        },

        clearFilters() {
            this.filters = {
                estado: undefined,
                id_proveedor: undefined,
                fecha_inicio: undefined,
                fecha_fin: undefined,
                search: undefined,
            };
            this.pagination.page = 1;
            this.fetchRequerimientos();
        },

        // ============================================
        // UTILIDADES
        // ============================================

        clearError() {
            this.error = null;
        },

        clearCurrent() {
            this.currentRequerimiento = null;
            this.currentProgress = null;
        },
    },
});
