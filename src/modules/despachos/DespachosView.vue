<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDespachosStore } from '../../stores/despachos.store';
import { useMaestrosStore } from '../../stores/maestros.store';
import { inventarioService } from '../../services/inventario.service';
import { storeToRefs } from 'pinia';
import DataTable from '../../components/ui/DataTable.vue';
import { Plus, Eye, Edit, Trash2, TruckIcon, Package, XCircle, Filter, ChevronDown, Calendar, X, FileText } from 'lucide-vue-next';
import type { Column } from '../../components/ui/DataTable.vue';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const generatePDF = () => {
    if (!selectedDespacho.value) return;

    const doc = new jsPDF();
    const despacho = selectedDespacho.value;

    // Header
    doc.setFontSize(20);
    doc.text(`Despacho ${despacho.codigo}`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha: ${new Date(despacho.fecha_creacion).toLocaleDateString()}`, 14, 28);
    
    // Status
    if (despacho.estado === 'ENTREGADO') {
        doc.setFillColor(220, 220, 220);
        doc.setTextColor(22, 163, 74); // Greenish
    } else {
        doc.setFillColor(253, 253, 253);
        doc.setTextColor(50, 50, 50);
    }
    // Simple text for status for now, or just skip simulated badge to keep it clean
    doc.text(`Estado: ${despacho.estado}`, 150, 20);
    doc.setTextColor(0);

    // Info Card Simulation
    doc.setDrawColor(200);
    doc.setFillColor(250, 250, 250);
    doc.rect(14, 35, 182, 25, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('MINA DESTINO', 20, 42);
    doc.text('SUPERVISOR', 80, 42);
    doc.text('TOTAL PRODUCTOS', 140, 42);

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(despacho.minas?.nombre || '---', 20, 50);
    doc.text(despacho.supervisores?.nombre || '---', 80, 50);
    doc.text(String(despacho.despacho_detalles?.length || 0), 140, 50);

    // Table
    const tableBody = despacho.despacho_detalles.map((item: any) => [
        `${item.productos?.nombre} ${item.medidas ? '(' + item.medidas.descripcion + ')' : ''}`,
        item.cantidad_despachada,
        `S/. ${Number(item.precio_compra).toFixed(2)}`,
        `S/. ${(Number(item.cantidad_despachada) * Number(item.precio_compra)).toFixed(2)}`,
        `S/. ${Number(item.precio_venta).toFixed(2)}`,
        `S/. ${(Number(item.cantidad_despachada) * Number(item.precio_venta)).toFixed(2)}`,
    ]);

    // Totals
    const totalCompra = despacho.despacho_detalles.reduce((acc: number, item: any) => acc + (Number(item.cantidad_despachada) * Number(item.precio_compra)), 0);
    const totalVenta = despacho.despacho_detalles.reduce((acc: number, item: any) => acc + (Number(item.cantidad_despachada) * Number(item.precio_venta)), 0);

    autoTable(doc, {
        startY: 65,
        head: [['Producto', 'Cant.', 'P. Compra', 'T. Compra', 'P. Venta', 'T. Venta']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [139, 30, 30], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { halign: 'center' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' }
        },
        foot: [[
            'Totales Generales', 
            '', 
            '', 
            `S/. ${totalCompra.toFixed(2)}`, 
            '', 
            `S/. ${totalVenta.toFixed(2)}`
        ]],
        footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
    });

    if (despacho.observaciones) {
        const finalY = (doc as any).lastAutoTable.finalY || 150;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('Observaciones:', 14, finalY + 10);
        doc.setTextColor(0);
        doc.text(despacho.observaciones, 14, finalY + 16, { maxWidth: 180 });
    }

    doc.save(`Despacho-${despacho.codigo}.pdf`);
};




const router = useRouter();
const despachosStore = useDespachosStore();
const maestrosStore = useMaestrosStore();

const { despachos, loading, pagination } = storeToRefs(despachosStore);
const { minas } = storeToRefs(maestrosStore);

const inventarioData = ref<any[]>([]);
const loadingInventario = ref(false);

// Filters
const filters = ref({
    estado: undefined as 'PREPARANDO' | 'EN_TRANSITO' | 'ENTREGADO' | 'ANULADO' | undefined,
    id_mina: undefined as number | undefined,
    fecha_desde: '',
    fecha_hasta: '',
    search: ''
});

// Mobile
const showMobileFilters = ref(false);
const activeFiltersCount = computed(() => {
    let count = 0;
    if (filters.value.estado) count++;
    if (filters.value.id_mina) count++;
    if (filters.value.fecha_desde) count++;
    if (filters.value.fecha_hasta) count++;
    return count;
});

// Modals
const showConfirmModal = ref(false);
const showTransitoModal = ref(false);
const showEntregarModal = ref(false);
const showAnularModal = ref(false);
const showDetailModal = ref(false); // Nuevo modal de detalle
const selectedDespacho = ref<any>(null);
const motivoAnulacion = ref('');

// Table columns
const columns: Column[] = [
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'fecha_creacion', label: 'Fecha Creación', sortable: true },
    { key: 'mina', label: 'Mina' },
    { key: 'estado', label: 'Estado' },
    { key: 'total_productos', label: 'Total Productos' },
    { key: 'actions', label: 'Acciones', align: 'center' }
];

// Methods
const loadInventario = async () => {
    if (inventarioData.value.length > 0) return; // Cache simple
    
    loadingInventario.value = true;
    try {
        const response = await inventarioService.getStock();
        inventarioData.value = (response.data || []).map((item: any) => ({
            id_producto: item.id_producto,
            id_medida: item.id_medida || 0,
            precio_venta: parseFloat(item.precio_venta_base) || 0,
            // Misma lógica que en el Form: Si no hay sugerido, 70% del venta
            precio_compra: item.precio_compra_sugerido ? parseFloat(item.precio_compra_sugerido) : (parseFloat(item.precio_venta_base) || 0) * 0.7
        }));
    } catch (error) {
        console.error('Error cargando precios de inventario:', error);
    } finally {
        loadingInventario.value = false;
    }
};

const getPrecioInfo = (id_producto: number) => {
    return inventarioData.value.find(item => item.id_producto === id_producto);
};

const fetchDespachos = () => {
    despachosStore.fetchDespachos({
        ...filters.value,
        page: pagination.value.page,
        limit: pagination.value.limit
    });
};

const handleSearch = (value: string) => {
    filters.value.search = value;
    fetchDespachos();
};

const handlePageChange = (page: number) => {
    pagination.value.page = page;
    fetchDespachos();
};

const applyFilters = () => {
    pagination.value.page = 1;
    fetchDespachos();
};

const clearFilters = () => {
    filters.value = {
        estado: undefined,
        id_mina: undefined,
        fecha_desde: '',
        fecha_hasta: '',
        search: ''
    };
    applyFilters();
};

const getEstadoBadge = (estado: string) => {
    const badgeClasses: any = {
        'PREPARANDO': 'badge badge-info',
        'EN_TRANSITO': 'badge badge-warning',
        'ENTREGADO': 'badge badge-success',
        'ANULADO': 'badge badge-danger'
    };
    return badgeClasses[estado] || 'badge';
};

const getEstadoLabel = (estado: string) => {
    const labels: any = {
        'PREPARANDO': 'Preparando',
        'EN_TRANSITO': 'En Tránsito',
        'ENTREGADO': 'Entregado',
        'ANULADO': 'Anulado'
    };
    return labels[estado] || estado;
};

const canEdit = (despacho: any) => despacho.estado === 'PREPARANDO';
const canDelete = (despacho: any) => despacho.estado === 'PREPARANDO';
const canTransito = (despacho: any) => despacho.estado === 'PREPARANDO';
const canEntregar = (despacho: any) => despacho.estado === 'EN_TRANSITO';
const canAnular = (despacho: any) => despacho.estado !== 'ANULADO';

const crearDespacho = () => {
    router.push('/despachos/nuevo');
};

const verDetalle = async (despacho: any) => {
    // Asegurar que tenemos los precios
    await loadInventario();

    // Enriquecer los detalles con precios
    const detallesEnriquecidos = despacho.despacho_detalles.map((d: any) => {
        const precios = getPrecioInfo(d.id_producto);
        return {
            ...d,
            precio_compra: precios?.precio_compra || 0,
            precio_venta: precios?.precio_venta || 0
        };
    });

    selectedDespacho.value = {
        ...despacho,
        despacho_detalles: detallesEnriquecidos
    };
    
    showDetailModal.value = true;
};

const editarDespacho = (despacho: any) => {
    router.push(`/despachos/${despacho.id_despacho}/editar`);
};

const confirmarEliminar = (despacho: any) => {
    selectedDespacho.value = despacho;
    showConfirmModal.value = true;
};

const eliminarDespacho = async () => {
    if (selectedDespacho.value) {
        await despachosStore.deleteDespacho(selectedDespacho.value.id_despacho);
        showConfirmModal.value = false;
        selectedDespacho.value = null;
    }
};

const abrirTransitoModal = (despacho: any) => {
    selectedDespacho.value = despacho;
    showTransitoModal.value = true;
};

const enviarATransito = async () => {
    if (selectedDespacho.value) {
        await despachosStore.cambiarATransito(selectedDespacho.value.id_despacho);
        showTransitoModal.value = false;
        selectedDespacho.value = null;
    }
};

const abrirEntregarModal = (despacho: any) => {
    selectedDespacho.value = despacho;
    showEntregarModal.value = true;
};

const marcarComoEntregado = async () => {
    if (selectedDespacho.value) {
        await despachosStore.marcarEntregado(selectedDespacho.value.id_despacho);
        showEntregarModal.value = false;
        selectedDespacho.value = null;
    }
};

const abrirAnularModal = (despacho: any) => {
    selectedDespacho.value = despacho;
    motivoAnulacion.value = '';
    showAnularModal.value = true;
};

const anularDespacho = async () => {
    if (selectedDespacho.value && motivoAnulacion.value.length >= 10) {
        await despachosStore.anularDespacho(selectedDespacho.value.id_despacho, motivoAnulacion.value);
        showAnularModal.value = false;
        selectedDespacho.value = null;
        motivoAnulacion.value = '';
    }
};

onMounted(() => {
    fetchDespachos();
    maestrosStore.fetchMinas();
});
</script>

<template>
    <div class="despachos-view">
        <header class="page-header">
            <div>
                <h1 class="page-title">Despachos a Mina</h1>
                <p class="page-description">Gestión de salidas de madera hacia minas</p>
            </div>
            <button @click="crearDespacho" class="btn btn-primary desktop-only">
                <Plus class="icon-sm" /> Nuevo Despacho
            </button>
        </header>

        <div class="content-container">

        <!-- Mobile View -->
        <div class="mobile-only">
            <!-- Mobile Search -->
            <div class="mobile-search-bar">
                <input 
                    type="text" 
                    class="mobile-search-input" 
                    placeholder="Buscar por código..."
                    v-model="filters.search"
                    @input="handleSearch(filters.search)"
                />
            </div>

            <!-- Mobile Filter Toggle -->
            <button 
                class="mobile-filter-toggle" 
                @click="showMobileFilters = !showMobileFilters">
                <div class="filter-toggle-left">
                    <Filter class="icon-sm" />
                    <span>Filtros</span>
                    <span v-if="activeFiltersCount > 0" class="filter-count-badge">{{ activeFiltersCount }}</span>
                </div>
                <ChevronDown class="icon-sm chevron" :class="{ 'chevron-open': showMobileFilters }" />
            </button>

            <!-- Mobile Filters Panel -->
            <div class="mobile-filter-panel" :class="{ 'panel-open': showMobileFilters }">
                <div class="filter-header">
                    <h3>Filtros</h3>
                    <button @click="showMobileFilters = false" class="btn-icon">
                        <XCircle class="icon-sm" />
                    </button>
                </div>

                <div class="filter-body">
                    <div class="form-group">
                        <label>Estado</label>
                        <select v-model="filters.estado" class="form-control">
                            <option :value="undefined">Todos los Estados</option>
                            <option value="PREPARANDO">Preparando</option>
                            <option value="EN_TRANSITO">En Tránsito</option>
                            <option value="ENTREGADO">Entregado</option>
                            <option value="ANULADO">Anulado</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Mina</label>
                        <select v-model.number="filters.id_mina" class="form-control">
                            <option :value="undefined">Todas las Minas</option>
                            <option v-for="mina in minas" :key="mina.id_mina" :value="mina.id_mina">
                                {{ mina.nombre }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Fecha Desde</label>
                        <input type="date" v-model="filters.fecha_desde" class="form-control" />
                    </div>

                    <div class="form-group">
                        <label>Fecha Hasta</label>
                        <input type="date" v-model="filters.fecha_hasta" class="form-control" />
                    </div>
                </div>

                <div class="filter-footer">
                    <button @click="clearFilters" class="btn btn-secondary btn-full">Limpiar</button>
                    <button @click="applyFilters(); showMobileFilters = false" class="btn btn-primary btn-full">Aplicar</button>
                </div>
            </div>

            <!-- Mobile Cards -->
            <div class="mobile-cards-container">
                <div v-for="despacho in despachos" :key="despacho.id_despacho" class="mobile-card">
                    <div class="mobile-card-header">
                        <div class="card-header-left">
                            <TruckIcon class="icon-md" />
                            <div>
                                <h3 class="card-title">{{ despacho.codigo }}</h3>
                                <p class="card-subtitle">{{ despacho.minas?.nombre || 'N/A' }}</p>
                            </div>
                        </div>
                        <span :class="getEstadoBadge(despacho.estado)">
                            {{ getEstadoLabel(despacho.estado) }}
                        </span>
                    </div>

                    <div class="mobile-card-body">
                        <div class="card-row">
                            <Calendar class="icon-xs" />
                            <span class="card-label">Creado:</span>
                            <span class="card-value">{{ new Date(despacho.fecha_creacion).toLocaleDateString() }}</span>
                        </div>
                        <div class="card-row">
                            <Package class="icon-xs" />
                            <span class="card-label">Productos:</span>
                            <span class="card-value">{{ despacho.despacho_detalles?.length || 0 }}</span>
                        </div>
                    </div>

                    <div class="mobile-card-actions">
                        <button @click="verDetalle(despacho)" class="btn btn-secondary btn-sm">
                            <Eye class="icon-xs" /> Ver
                        </button>
                        <button v-if="canTransito(despacho)" @click="abrirTransitoModal(despacho)" class="btn btn-primary btn-sm">
                            <TruckIcon class="icon-xs" /> Enviar
                        </button>
                        <button v-if="canEntregar(despacho)" @click="abrirEntregarModal(despacho)" class="btn btn-success btn-sm">
                            <Package class="icon-xs" /> Entregar
                        </button>
                    </div>
                </div>

                <div v-if="despachos.length === 0 && !loading" class="empty-state">
                    <p>No se encontraron despachos</p>
                </div>
            </div>

            <!-- Mobile FAB -->
            <button class="mobile-fab" @click="crearDespacho">
                <Plus class="icon-md" />
            </button>
        </div>

        <!-- Desktop View -->
        <div class="desktop-only table-wrapper">
            <DataTable
                :columns="columns"
                :data="despachos"
                :loading="loading"
                searchable
                search-placeholder="Buscar por código..."
                :current-page="pagination.page"
                :total-pages="pagination.totalPages"
                :total="pagination.total"
                :page-size="pagination.limit"
                @search="handleSearch"
                @page-change="handlePageChange"
            >

                <template #toolbar-filters>
                    <div class="filter-item">
                        <select v-model="filters.estado" @change="applyFilters" class="filter-select">
                            <option :value="undefined">Todos los Estados</option>
                            <option value="PREPARANDO">Preparando</option>
                            <option value="EN_TRANSITO">En Tránsito</option>
                            <option value="ENTREGADO">Entregado</option>
                            <option value="ANULADO">Anulado</option>
                        </select>
                    </div>

                    <div class="filter-item">
                        <select v-model.number="filters.id_mina" @change="applyFilters" class="filter-select">
                            <option :value="undefined">Todas las Minas</option>
                            <option v-for="mina in minas" :key="mina.id_mina" :value="mina.id_mina">
                                {{ mina.nombre }}
                            </option>
                        </select>
                    </div>

                    <div class="filter-item">
                        <input type="date" v-model="filters.fecha_desde" @change="applyFilters" class="filter-input" placeholder="Desde" />
                    </div>

                    <div class="filter-item">
                        <input type="date" v-model="filters.fecha_hasta" @change="applyFilters" class="filter-input" placeholder="Hasta" />
                    </div>

                    <button @click="clearFilters" class="btn btn-secondary btn-sm">Limpiar</button>
                </template>

                <template #cell-fecha_creacion="{ value }">
                    <span>{{ new Date(value).toLocaleDateString() }}</span>
                </template>

                <template #cell-mina="{ row }">
                    <span>{{ row.minas?.nombre || '-' }}</span>
                </template>

                <template #cell-estado="{ value }">
                    <span :class="getEstadoBadge(value)">
                        {{ getEstadoLabel(value) }}
                    </span>
                </template>

                <template #cell-total_productos="{ row }">
                    <span>{{ row.despacho_detalles?.length || 0 }}</span>
                </template>

                <template #cell-actions="{ row }">
                    <div class="action-buttons">
                        <button @click="verDetalle(row)" class="btn-icon" title="Ver Detalle">
                            <Eye class="icon-sm" />
                        </button>
                        <button 
                            v-if="canEdit(row)" 
                            @click="editarDespacho(row)" 
                            class="btn-icon" 
                            title="Editar">
                            <Edit class="icon-sm" />
                        </button>
                        <button 
                            v-if="canTransito(row)" 
                            @click="abrirTransitoModal(row)" 
                            class="btn-icon btn-primary" 
                            title="Enviar a Tránsito">
                            <TruckIcon class="icon-sm" />
                        </button>
                        <button 
                            v-if="canEntregar(row)" 
                            @click="abrirEntregarModal(row)" 
                            class="btn-icon btn-success" 
                            title="Marcar Entregado">
                            <Package class="icon-sm" />
                        </button>
                        <button 
                            v-if="canAnular(row)" 
                            @click="abrirAnularModal(row)" 
                            class="btn-icon btn-warning" 
                            title="Anular">
                            <XCircle class="icon-sm" />
                        </button>
                        <button 
                            v-if="canDelete(row)" 
                            @click="confirmarEliminar(row)" 
                            class="btn-icon btn-danger" 
                            title="Eliminar">
                            <Trash2 class="icon-sm" />
                        </button>
                    </div>
                </template>
            </DataTable>
        </div>
    </div>

        <!-- Modals -->
        <!-- Confirm Delete Modal -->
        <div v-if="showConfirmModal" class="modal-overlay" @click="showConfirmModal = false">
            <div class="modal-content" @click.stop>
                <h3>Confirmar Eliminación</h3>
                <p>¿Está seguro de eliminar el despacho <strong>{{ selectedDespacho?.codigo }}</strong>?</p>
                <div class="modal-actions">
                    <button @click="showConfirmModal = false" class="btn btn-secondary">Cancelar</button>
                    <button @click="eliminarDespacho" class="btn btn-danger">Eliminar</button>
                </div>
            </div>
        </div>

        <!-- Enviar a Tránsito Modal -->
        <div v-if="showTransitoModal" class="modal-overlay" @click="showTransitoModal = false">
            <div class="modal-content" @click.stop>
                <h3>Enviar a Tránsito</h3>
                <p>¿Confirmar envío del despacho <strong>{{ selectedDespacho?.codigo }}</strong> a tránsito?</p>
                <p class="text-muted">Se crearán los movimientos SALIDA en el kardex.</p>
                <div class="modal-actions">
                    <button @click="showTransitoModal = false" class="btn btn-secondary">Cancelar</button>
                    <button @click="enviarATransito" class="btn btn-primary">Confirmar</button>
                </div>
            </div>
        </div>

        <!-- Marcar Entregado Modal -->
        <div v-if="showEntregarModal" class="modal-overlay" @click="showEntregarModal = false">
            <div class="modal-content" @click.stop>
                <h3>Marcar como Entregado</h3>
                <p>¿Confirmar entrega del despacho <strong>{{ selectedDespacho?.codigo }}</strong>?</p>
                <div class="modal-actions">
                    <button @click="showEntregarModal = false" class="btn btn-secondary">Cancelar</button>
                    <button @click="marcarComoEntregado" class="btn btn-success">Confirmar</button>
                </div>
            </div>
        </div>

        <!-- Anular Despacho Modal -->
        <div v-if="showAnularModal" class="modal-overlay" @click="showAnularModal = false">
            <div class="modal-content" @click.stop>
                <h3>Anular Despacho</h3>
                <p>Despacho: <strong>{{ selectedDespacho?.codigo }}</strong></p>
                <div class="form-group">
                    <label>Motivo de Anulación *</label>
                    <textarea 
                        v-model="motivoAnulacion" 
                        rows="4" 
                        class="form-control"
                        placeholder="Ingrese el motivo de anulación (mínimo 10 caracteres)"
                    ></textarea>
                </div>
                <div class="modal-actions">
                    <button @click="showAnularModal = false" class="btn btn-secondary">Cancelar</button>
                    <button 
                        @click="anularDespacho" 
                        class="btn btn-danger"
                        :disabled="motivoAnulacion.length < 10"
                    >
                        Anular
                    </button>
                </div>
            </div>
        </div>

        <!-- Detalle Despacho Modal -->
        <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
            <div class="modal-content modal-lg">
                <header class="modal-header">
                    <h3>Despacho {{ selectedDespacho?.codigo }}</h3>
                    <button class="btn-close" @click="showDetailModal = false">
                        <X class="icon" />
                    </button>
                </header>
                
                <div class="modal-body" v-if="selectedDespacho">
                    <div class="status-bar">
                        <span class="badge" :class="getEstadoBadge(selectedDespacho.estado)">
                            {{ getEstadoLabel(selectedDespacho.estado) }}
                        </span>
                    </div>

                    <div class="info-grid">
                        <div class="info-item">
                            <label>Mina</label>
                            <span>{{ selectedDespacho.minas?.nombre || '---' }}</span>
                        </div>
                        <div class="info-item">
                            <label>Fecha Creación</label>
                            <span>{{ new Date(selectedDespacho.fecha_creacion).toLocaleDateString() }}</span>
                        </div>
                        <div class="info-item">
                            <label>Total Productos</label>
                            <span>{{ selectedDespacho.despacho_detalles?.length || 0 }}</span>
                        </div>
                        <div class="info-item" v-if="selectedDespacho.observaciones">
                            <label>Observaciones</label>
                            <span>{{ selectedDespacho.observaciones }}</span>
                        </div>
                    </div>

                    <div class="items-list">
                        <h4>Productos Despachados</h4>

                        <!-- Desktop Table -->
                        <div class="table-mini-wrapper desktop-only">
                            <table class="table-mini">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th class="text-right">Cantidad</th>
                                        <th class="text-right">P. Compra</th>
                                        <th class="text-right">Total Compra</th>
                                        <th class="text-right">P. Venta</th>
                                        <th class="text-right">Total Venta</th>
                                        <th>Observación</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in selectedDespacho.despacho_detalles" :key="item.id_detalle">
                                        <td>
                                            <div class="flex-center">
                                                <Package class="icon-xs text-gray" />
                                                {{ item.productos?.nombre }}
                                                <span class="text-xs text-gray" v-if="item.medidas">
                                                    ({{ item.medidas?.descripcion }})
                                                </span>
                                            </div>
                                        </td>
                                        <td class="text-right bold">{{ item.cantidad_despachada }}</td>
                                        <td class="text-right">S/. {{ Number(item.precio_compra).toFixed(2) }}</td>
                                        <td class="text-right">S/. {{ (Number(item.cantidad_despachada) * Number(item.precio_compra)).toFixed(2) }}</td>
                                        <td class="text-right">S/. {{ Number(item.precio_venta).toFixed(2) }}</td>
                                        <td class="text-right">S/. {{ (Number(item.cantidad_despachada) * Number(item.precio_venta)).toFixed(2) }}</td>
                                        <td>{{ item.observacion || '-' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Mobile Cards -->
                        <div class="product-cards mobile-only">
                            <div 
                                v-for="item in selectedDespacho.despacho_detalles" 
                                :key="item.id_detalle"
                                class="product-card">
                                <div class="product-card-header">
                                    <Package class="icon-sm" />
                                    <div class="product-name">
                                        <strong>{{ item.productos?.nombre }}</strong>
                                        <span class="product-medida" v-if="item.medidas">
                                            ({{ item.medidas?.descripcion }})
                                        </span>
                                    </div>
                                </div>
                                <div class="product-card-details">
                                    <div class="detail-row">
                                        <span class="detail-label">Cantidad:</span>
                                        <span class="detail-value bold">{{ item.cantidad_despachada }}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-label">P. Compra:</span>
                                        <span class="detail-value">S/. {{ Number(item.precio_compra).toFixed(2) }}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-label">Total Compra:</span>
                                        <span class="detail-value">S/. {{ (Number(item.cantidad_despachada) * Number(item.precio_compra)).toFixed(2) }}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-label">P. Venta:</span>
                                        <span class="detail-value">S/. {{ Number(item.precio_venta).toFixed(2) }}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-label">Total Venta:</span>
                                        <span class="detail-value">S/. {{ (Number(item.cantidad_despachada) * Number(item.precio_venta)).toFixed(2) }}</span>
                                    </div>
                                    <div class="detail-row" v-if="item.observacion">
                                        <span class="detail-label">Obs:</span>
                                        <span class="detail-value">{{ item.observacion }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <footer class="modal-footer">
                    <button class="btn btn-secondary" @click="generatePDF">
                        <FileText class="icon-sm" /> Crear PDF
                    </button>
                    <button class="btn btn-secondary" @click="showDetailModal = false">Cerrar</button>
                    <button 
                        v-if="canTransito(selectedDespacho)" 
                        @click="abrirTransitoModal(selectedDespacho); showDetailModal = false" 
                        class="btn btn-primary">
                        <TruckIcon class="icon-sm" /> Enviar a Tránsito
                    </button>
                </footer>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Page Header */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%);
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.page-title {
    font-size: 1.875rem;
    font-weight: 800;
    color: #111827;
    margin-bottom: 0.5rem;
    letter-spacing: -0.025em;
}

.page-description {
    color: #6b7280;
    font-size: 1rem;
}

.content-container {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Mobile Cards */
.mobile-cards-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: 5rem;
}

.mobile-card {
    background: white;
    border-radius: 16px;
    padding: 1.25rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    transition: transform 0.2s, box-shadow 0.2s;
}

.mobile-card:active {
    transform: scale(0.98);
}

.mobile-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
}

.card-header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.card-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #111827;
}

.card-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
}

.mobile-card-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
}

.card-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.card-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: #9ca3af;
    font-weight: 600;
    letter-spacing: 0.05em;
}

.card-value {
    font-size: 0.95rem;
    color: #374151;
    font-weight: 500;
}

.mobile-card-actions {
    display: flex;
    gap: 0.5rem;
    border-top: 1px solid #f3f4f6;
    padding-top: 1rem;
}

.mobile-card-actions .btn {
    flex: 1;
    justify-content: center;
}

/* Mobile Filters */
.mobile-search-bar {
    margin-bottom: 1rem;
}

.mobile-search-input {
    width: 100%;
    padding: 0.875rem 1rem;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    background: white;
    font-size: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.mobile-filter-toggle {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.875rem 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    color: #374151;
    font-weight: 600;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.filter-toggle-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.mobile-filter-panel {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    display: none;
    border: 1px solid #e5e7eb;
}

.mobile-filter-panel.panel-open {
    display: block;
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.filter-header h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
}

.filter-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.filter-footer {
    display: flex;
    gap: 1rem;
}

.btn-full {
    flex: 1;
    justify-content: center;
}

/* FAB */
.mobile-fab {
    position: fixed;
    bottom: 2rem;
    right: 1.5rem;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.5);
    z-index: 50;
    border: none;
    transition: transform 0.2s;
}

.mobile-fab:active {
    transform: scale(0.95);
}

/* Desktop */
.table-wrapper {
    overflow: hidden;
    border-radius: 12px;
}

/* Modals */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 2rem;
    border-radius: 16px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: #111827;
}

.modal-content p {
    color: #4b5563;
    margin-bottom: 1.5rem;
    line-height: 1.5;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
}

/* Badges */
.badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.025em;
}

.badge-info { background: #dbeafe; color: #1e40af; }
.badge-warning { background: #fef3c7; color: #92400e; }
.badge-success { background: #d1fae5; color: #065f46; }
.badge-danger { background: #fee2e2; color: #991b1b; }

/* Buttons */
.btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
}

.btn-primary {
    background-color: #8B1E1E; /* Deep Mahogany */
    color: white;
}

.btn-primary:hover {
    background-color: #630F0F;
}

.btn-secondary {
    background-color: #e5e7eb;
    color: #374151;
}

.btn-secondary:hover {
    background-color: #d1d5db;
}

.btn-danger {
    background-color: #ef4444;
    color: white;
}

.btn-danger:hover {
    background-color: #dc2626;
}

.btn-success {
    background-color: #10b981;
    color: white;
}

.btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    color: #4b5563;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-icon:hover {
    background-color: #f3f4f6;
    color: #111827;
}

.btn-icon.btn-primary { color: #8B1E1E; }
.btn-icon.btn-success { color: #059669; }
.btn-icon.btn-danger { color: #dc2626; }
.btn-icon.btn-warning { color: #d97706; }

/* Modal Details */
.modal-lg {
    max-width: 1000px;
    width: 95%;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
}

.btn-close {
    background: none;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    padding: 0.25rem;
    border-radius: 50%;
}

.btn-close:hover {
    background-color: #f3f4f6;
    color: #4b5563;
}

.status-bar {
    margin-bottom: 1.5rem;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.5rem;
    padding: 1.5rem;
    background: #f9fafb;
    border-radius: 12px;
    margin-bottom: 2rem;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.info-item label {
    font-size: 0.8rem;
    text-transform: uppercase;
    color: #6b7280;
    font-weight: 700;
    letter-spacing: 0.05em;
}

.info-item span {
    font-weight: 600;
    color: #111827;
    font-size: 1rem;
}

.items-list h4 {
    margin-bottom: 1rem;
    color: #374151;
    font-weight: 700;
    font-size: 1.1rem;
}

/* Mini Table */
.table-mini-wrapper {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
}

.table-mini {
    width: 100%;
    border-collapse: collapse;
}

.table-mini th {
    background: #f9fafb;
    text-align: left;
    padding: 1rem;
    font-size: 0.8rem;
    text-transform: uppercase;
    color: #6b7280;
    font-weight: 700;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e5e7eb;
}

.table-mini td {
    padding: 1rem;
    border-bottom: 1px solid #f3f4f6;
    font-size: 0.95rem;
    color: #374151;
}

.table-mini tr:last-child td {
    border-bottom: none;
}

.table-mini .text-right { text-align: right; }
.table-mini .bold { font-weight: 600; }

.flex-center {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.text-gray { color: #6b7280; }
.text-xs { font-size: 0.85rem; color: #6b7280; }

/* Product Cards (Mobile in Modal) */
.product-cards {
    display: none; /* Hidden by default on desktop */
}

/* ... rest ... */

.modal-footer {
    border-top: 1px solid #e5e7eb;
    padding-top: 1.5rem;
    margin-top: 1.5rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}

@media (max-width: 768px) {
    .product-cards {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .product-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
    }

    .product-card-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
    }

    .product-name {
        display: flex;
        flex-direction: column;
    }

    .product-medida {
        font-size: 0.75rem;
        color: #6b7280;
    }

    .product-card-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding-top: 0.75rem;
        border-top: 1px solid #f9fafb;
    }

    .detail-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
    }

    .detail-label { color: #6b7280; }
    .detail-value { font-weight: 500; color: #111827; }

    .despachos-view {
        padding: 1rem;
    }
    
    .page-header {
        display: none;
    }

    .content-container {
        background: transparent;
        box-shadow: none;
        padding: 0;
    }

    .modal-content {
        max-width: 100%;
        width: 100%;
        height: 100%;
        border-radius: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
    }

    .modal-body {
        flex: 1;
        overflow-y: auto;
    }
}
</style>
