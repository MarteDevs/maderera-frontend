import { defineStore } from 'pinia';
import { ref } from 'vue';
import { inventarioService, type ProductoStock, type MovimientoStock } from './inventario.service';

export const useInventarioStore = defineStore('inventario', () => {
    const stock = ref<ProductoStock[]>([]);
    const kardex = ref<MovimientoStock[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // --- Stock State --- //
    const stockPagination = ref({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    const stockFilters = ref({
        search: '',
        id_clasificacion: undefined as number | undefined,
        id_medida: undefined as number | undefined,
        bajo_stock: false
    });

    // --- Kardex State --- //
    const kardexPagination = ref({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    const kardexFilters = ref({
        id_producto: undefined as number | undefined,
        tipo_movimiento: '' as any,
        fecha_inicio: '',
        fecha_fin: ''
    });

    async function fetchStock() {
        loading.value = true;
        error.value = null;
        try {
            const params = {
                page: stockPagination.value.page,
                limit: stockPagination.value.limit,
                search: stockFilters.value.search || undefined,
                id_clasificacion: stockFilters.value.id_clasificacion || undefined,
                id_medida: stockFilters.value.id_medida || undefined,
                bajo_stock: stockFilters.value.bajo_stock || undefined
            };

            const response = await inventarioService.getStock(params);

            // Stock response might be paginated or array depending on service implementation
            if (response && response.data) {
                stock.value = response.data;
                if (response.page) stockPagination.value.page = response.page;
                if (response.total) stockPagination.value.total = response.total; // Necesita que backend devuelva total
                // Si backend no devuelve paginación completa para stock (solo limit/offset sin count), 
                // asumimos que si devolvió data < limit, es la última página.
            } else if (Array.isArray(response)) {
                stock.value = response;
            } else {
                stock.value = [];
            }
        } catch (e: any) {
            console.error('Error fetching stock:', e);
            error.value = e.response?.data?.message || 'Error al cargar inventario';
        } finally {
            loading.value = false;
        }
    }

    async function fetchKardex() {
        loading.value = true;
        error.value = null;
        try {
            const params = {
                page: kardexPagination.value.page,
                limit: kardexPagination.value.limit,
                id_producto: kardexFilters.value.id_producto || undefined,
                tipo_movimiento: kardexFilters.value.tipo_movimiento || undefined,
                fecha_inicio: kardexFilters.value.fecha_inicio || undefined,
                fecha_fin: kardexFilters.value.fecha_fin || undefined
            };

            const response = await inventarioService.getKardex(params);

            if (response && response.data) {
                kardex.value = response.data;
                if (response.pagination) {
                    kardexPagination.value = { ...kardexPagination.value, ...response.pagination };
                }
            } else if (Array.isArray(response)) {
                kardex.value = response;
            } else {
                kardex.value = [];
            }
        } catch (e: any) {
            console.error('Error fetching kardex:', e);
            error.value = e.response?.data?.message || 'Error al cargar kardex';
        } finally {
            loading.value = false;
        }
    }

    // --- Actions --- //
    function setStockPage(page: number) {
        stockPagination.value.page = page;
        fetchStock();
    }

    function setStockFilters(newFilters: any) {
        stockFilters.value = { ...stockFilters.value, ...newFilters };
        stockPagination.value.page = 1;
        fetchStock();
    }

    function setKardexPage(page: number) {
        kardexPagination.value.page = page;
        fetchKardex();
    }

    function setKardexFilters(newFilters: any) {
        kardexFilters.value = { ...kardexFilters.value, ...newFilters };
        kardexPagination.value.page = 1;
        fetchKardex();
    }

    return {
        stock,
        kardex,
        loading,
        error,
        // Stock
        stockPagination,
        stockFilters,
        fetchStock,
        setStockPage,
        setStockFilters,
        // Kardex
        kardexPagination,
        kardexFilters,
        fetchKardex,
        setKardexPage,
        setKardexFilters
    };
});
