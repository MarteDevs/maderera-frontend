import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { inventarioService, type ProductoStock, type MovimientoStock } from './inventario.service';

export const useInventarioStore = defineStore('inventario', () => {
    // Raw data from API (no filters)
    const allStock = ref<ProductoStock[]>([]);
    const allKardex = ref<MovimientoStock[]>([]);
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

    // --- Computed: Filtered Stock --- //
    const filteredStock = computed(() => {
        let result = [...allStock.value];

        // Apply search filter
        if (stockFilters.value.search) {
            const search = stockFilters.value.search.toLowerCase();
            result = result.filter(item =>
                item.producto?.toLowerCase().includes(search) ||
                item.medida?.toLowerCase().includes(search) ||
                item.clasificacion?.toLowerCase().includes(search)
            );
        }

        // Apply bajo_stock filter
        if (stockFilters.value.bajo_stock) {
            result = result.filter(item => (item.stock_actual || 0) < 100);
        }

        return result;
    });

    // --- Computed: Paginated Stock --- //
    const stock = computed(() => {
        const start = (stockPagination.value.page - 1) * stockPagination.value.limit;
        const end = start + stockPagination.value.limit;

        // Update pagination totals
        const total = filteredStock.value.length;
        stockPagination.value.total = total;
        stockPagination.value.totalPages = Math.ceil(total / stockPagination.value.limit);

        return filteredStock.value.slice(start, end);
    });

    // --- Computed: Filtered Kardex --- //
    const filteredKardex = computed(() => {
        let result = [...allKardex.value];

        if (kardexFilters.value.id_producto) {
            // Since kardex doesn't have id_producto, we filter by product name matching
            // The frontend will need to get the product name from maestros
            // For now, skip this filter until we can properly match
        }

        if (kardexFilters.value.tipo_movimiento) {
            result = result.filter(item => item.tipo === kardexFilters.value.tipo_movimiento);
        }

        if (kardexFilters.value.fecha_inicio && kardexFilters.value.fecha_fin) {
            const start = new Date(kardexFilters.value.fecha_inicio);
            const end = new Date(kardexFilters.value.fecha_fin);
            result = result.filter(item => {
                const fecha = new Date(item.fecha);
                return fecha >= start && fecha <= end;
            });
        }

        return result;
    });

    // --- Computed: Paginated Kardex --- //
    const kardex = computed(() => {
        const start = (kardexPagination.value.page - 1) * kardexPagination.value.limit;
        const end = start + kardexPagination.value.limit;

        // Update pagination totals
        const total = filteredKardex.value.length;
        kardexPagination.value.total = total;
        kardexPagination.value.totalPages = Math.ceil(total / kardexPagination.value.limit);

        return filteredKardex.value.slice(start, end);
    });

    async function fetchStock() {
        loading.value = true;
        error.value = null;
        try {
            // Fetch ALL stock without filters (backend only does basic query)
            const response = await inventarioService.getStock({
                page: 1,
                limit: 10000 // Get all records
            });

            if (response && response.data) {
                allStock.value = response.data;
            } else if (Array.isArray(response)) {
                allStock.value = response;
            } else {
                allStock.value = [];
            }

            // Reset to page 1
            stockPagination.value.page = 1;
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
            // Fetch ALL kardex without filters
            const response = await inventarioService.getKardex({
                page: 1,
                limit: 10000 // Get all records
            });

            if (response && response.data) {
                allKardex.value = response.data;
            } else if (Array.isArray(response)) {
                allKardex.value = response;
            } else {
                allKardex.value = [];
            }

            // Reset to page 1
            kardexPagination.value.page = 1;
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
        // No need to fetch - computed property handles it
    }

    function setStockFilters(newFilters: any) {
        stockFilters.value = { ...stockFilters.value, ...newFilters };
        stockPagination.value.page = 1; // Reset to first page
        // No need to fetch - computed property handles it
    }

    function setKardexPage(page: number) {
        kardexPagination.value.page = page;
        // No need to fetch - computed property handles it
    }

    function setKardexFilters(newFilters: any) {
        kardexFilters.value = { ...kardexFilters.value, ...newFilters };
        kardexPagination.value.page = 1; // Reset to first page
        // No need to fetch - computed property handles it
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
