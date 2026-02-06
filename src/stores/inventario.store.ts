import { defineStore } from 'pinia';
import { inventarioService } from '../services';
import type {
    Stock,
    MovimientoStock,
    AdjustStockInput,
    StockFilters,
    KardexFilters,
} from '../types/models';

// ============================================
// INVENTARIO STORE
// ============================================

export const useInventarioStore = defineStore('inventario', {
    state: () => ({
        // Stock
        stock: [] as Stock[],
        stockPage: 1,
        stockLimit: 50,
        stockLoading: false,

        // Kardex
        kardex: [] as MovimientoStock[],
        kardexLoading: false,

        // Filtros
        stockFilters: {
            search: undefined,
            id_clasificacion: undefined,
            id_medida: undefined,
            bajo_stock: false,
        } as StockFilters,

        kardexFilters: {
            id_producto: undefined,
            fecha_inicio: undefined,
            fecha_fin: undefined,
            tipo_movimiento: undefined,
            limit: 100,
        } as KardexFilters,

        // Stock bajo
        lowStock: [] as Stock[],
        lowStockLoading: false,

        // Error
        error: null as string | null,
    }),

    getters: {
        // Productos con stock crítico (< 50)
        stockCritico: (state) => state.stock.filter((s) => s.stock_actual < 50),

        // Productos con stock bajo (< 100)
        stockBajo: (state) => state.stock.filter((s) => s.stock_actual < 100),

        // Buscar stock por producto
        getStockByProducto: (state) => (idProducto: number) =>
            state.stock.find((s) => s.id_producto === idProducto),

        // Movimientos de entrada
        movimientosEntrada: (state) =>
            state.kardex.filter((m) => m.tipo === 'ENTRADA' || m.tipo === 'AJUSTE_POS'),

        // Movimientos de salida
        movimientosSalida: (state) =>
            state.kardex.filter((m) => m.tipo === 'SALIDA' || m.tipo === 'AJUSTE_NEG'),

        // Total de productos en stock
        totalProductos: (state) => state.stock.length,

        // Valor total del inventario
        valorTotalInventario: (state) =>
            state.stock.reduce((total, s) => total + s.stock_actual * s.precio_venta_base, 0),
    },

    actions: {
        // ============================================
        // STOCK
        // ============================================

        async fetchStock(filters?: StockFilters) {
            this.stockLoading = true;
            this.error = null;

            // Actualizar filtros si se proporcionan
            if (filters) {
                this.stockFilters = { ...this.stockFilters, ...filters };
            }

            try {
                const response = await inventarioService.getStock({
                    ...this.stockFilters,
                    page: this.stockPage,
                    limit: this.stockLimit,
                });

                this.stock = response.data;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al cargar stock';
                throw error;
            } finally {
                this.stockLoading = false;
            }
        },

        // ============================================
        // KARDEX
        // ============================================

        async fetchKardex(filters?: KardexFilters) {
            this.kardexLoading = true;
            this.error = null;

            // Actualizar filtros si se proporcionan
            if (filters) {
                this.kardexFilters = { ...this.kardexFilters, ...filters };
            }

            try {
                this.kardex = await inventarioService.getKardex(this.kardexFilters);
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al cargar kardex';
                throw error;
            } finally {
                this.kardexLoading = false;
            }
        },

        // ============================================
        // AJUSTE MANUAL
        // ============================================

        async adjustStock(data: AdjustStockInput) {
            this.stockLoading = true;
            this.error = null;
            try {
                const movimiento = await inventarioService.adjustStock(data);

                // Recargar stock y kardex
                await Promise.all([this.fetchStock(), this.fetchKardex()]);

                return movimiento;
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al ajustar stock';
                throw error;
            } finally {
                this.stockLoading = false;
            }
        },

        // ============================================
        // STOCK BAJO
        // ============================================

        async fetchLowStock() {
            this.lowStockLoading = true;
            this.error = null;
            try {
                this.lowStock = await inventarioService.getLowStock();
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al cargar stock bajo';
                throw error;
            } finally {
                this.lowStockLoading = false;
            }
        },

        // ============================================
        // EXPORTAR
        // ============================================

        async exportStock(format: 'excel' | 'pdf' = 'excel') {
            this.stockLoading = true;
            this.error = null;
            try {
                const blob = await inventarioService.exportStock(format);

                // Crear link de descarga
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `stock_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'
                    }`;
                link.click();
                window.URL.revokeObjectURL(url);
            } catch (error: any) {
                this.error = error.response?.data?.message || 'Error al exportar stock';
                throw error;
            } finally {
                this.stockLoading = false;
            }
        },

        // ============================================
        // FILTROS
        // ============================================

        setStockFilters(filters: Partial<StockFilters>) {
            this.stockFilters = { ...this.stockFilters, ...filters };
            this.stockPage = 1;
            this.fetchStock();
        },

        clearStockFilters() {
            this.stockFilters = {
                search: undefined,
                id_clasificacion: undefined,
                id_medida: undefined,
                bajo_stock: false,
            };
            this.stockPage = 1;
            this.fetchStock();
        },

        setKardexFilters(filters: Partial<KardexFilters>) {
            this.kardexFilters = { ...this.kardexFilters, ...filters };
            this.fetchKardex();
        },

        clearKardexFilters() {
            this.kardexFilters = {
                id_producto: undefined,
                fecha_inicio: undefined,
                fecha_fin: undefined,
                tipo_movimiento: undefined,
                limit: 100,
            };
            this.fetchKardex();
        },

        // ============================================
        // PAGINACIÓN (STOCK)
        // ============================================

        setStockPage(page: number) {
            this.stockPage = page;
            this.fetchStock();
        },

        setStockLimit(limit: number) {
            this.stockLimit = limit;
            this.stockPage = 1;
            this.fetchStock();
        },

        // ============================================
        // UTILIDADES
        // ============================================

        clearError() {
            this.error = null;
        },

        clearKardex() {
            this.kardex = [];
        },
    },
});
