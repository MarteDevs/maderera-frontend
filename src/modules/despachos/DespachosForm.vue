<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDespachosStore } from '../../stores/despachos.store';
import { useMaestrosStore } from '../../stores/maestros.store';
import { inventarioService } from '../../services/inventario.service';
import { storeToRefs } from 'pinia';
import { ArrowLeft, Save, Plus, Trash2, PackageCheck, AlertCircle, ChevronDown, Package } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const despachosStore = useDespachosStore();
const maestrosStore = useMaestrosStore();

const { minas, supervisores } = storeToRefs(maestrosStore);
const { loading } = storeToRefs(despachosStore);

// State
const isEditMode = computed(() => !!route.params.id);
const pageTitle = computed(() => isEditMode.value ? 'Editar Despacho' : 'Nuevo Despacho');
const inventarioData = ref<any[]>([]);
const loadingInventario = ref(false);

interface DetalleForm {
    id_producto: number;
    id_medida: number;
    cantidad_despachada: number;
    observacion: string;
    producto_nombre?: string;
    medida_descripcion?: string;
    stock_actual?: number;
    precio_compra?: number;
    precio_venta?: number;
    total_compra?: number;
    total_venta?: number;
}

const formData = ref({
    id_mina: undefined as number | undefined,
    id_supervisor: undefined as number | undefined,
    id_viaje: undefined as number | undefined,
    observaciones: '',
    detalles: [] as DetalleForm[]
});

const errors = ref({
    id_mina: '',
    detalles: ''
});

// Computed
const totalCompraGeneral = computed(() => {
    return formData.value.detalles.reduce((sum, d) => sum + (d.total_compra || 0), 0);
});

const totalVentaGeneral = computed(() => {
    return formData.value.detalles.reduce((sum, d) => sum + (d.total_venta || 0), 0);
});

const productosConStock = computed(() => {
    return inventarioData.value.filter(item => (item.stock_actual || 0) > 0);
});

// Methods
const loadInventario = async () => {
    loadingInventario.value = true;
    try {
        const response = await inventarioService.getStock();
        // Map backend fields to frontend expected fields
        inventarioData.value = (response.data || []).map((item: any) => ({
            id_producto: item.id_producto,
            id_medida: item.id_medida || 0,
            producto_nombre: item.producto,
            medida_descripcion: item.medida,
            stock_actual: item.stock_actual || 0,
            precio_venta: parseFloat(item.precio_venta_base) || 0,
            // Si no hay precio_compra, estimamos un 70% del precio de venta
            precio_compra: item.precio_compra_sugerido ? parseFloat(item.precio_compra_sugerido) : (parseFloat(item.precio_venta_base) || 0) * 0.7
        }));
    } catch (error) {
        console.error('Error cargando inventario:', error);
        inventarioData.value = [];
    } finally {
        loadingInventario.value = false;
    }
};

const getStockInfo = (id_producto: number) => {
    return inventarioData.value.find(item => item.id_producto === id_producto);
};

const loadDespacho = async () => {
    if (!isEditMode.value) return;
    
    const id = Number(route.params.id);
    try {
        const despacho = await despachosStore.fetchDespachoById(id);
        
        if (despacho.estado !== 'PREPARANDO') {
            alert('Solo se pueden editar despachos en estado PREPARANDO');
            router.push('/despachos');
            return;
        }

        formData.value = {
            id_mina: despacho.id_mina,
            id_supervisor: despacho.id_supervisor,
            id_viaje: despacho.id_viaje,
            observaciones: despacho.observaciones || '',
            detalles: despacho.despacho_detalles.map((d: any) => {
                const stockInfo = getStockInfo(d.id_producto);
                const total_compra = d.cantidad_despachada * (stockInfo?.precio_compra || 0);
                const total_venta = d.cantidad_despachada * (stockInfo?.precio_venta || 0);
                return {
                    id_producto: d.id_producto,
                    id_medida: d.id_medida,
                    cantidad_despachada: d.cantidad_despachada,
                    observacion: d.observacion || '',
                    producto_nombre: d.productos?.nombre || stockInfo?.producto_nombre,
                    medida_descripcion: d.medidas?.descripcion || stockInfo?.medida_descripcion,
                    stock_actual: stockInfo?.stock_actual || 0,
                    precio_compra: stockInfo?.precio_compra || 0,
                    precio_venta: stockInfo?.precio_venta || 0,
                    total_compra,
                    total_venta
                };
            })
        };
    } catch (error) {
        console.error('Error cargando despacho:', error);
        alert('Error al cargar el despacho');
        router.push('/despachos');
    }
};

const addDetalle = () => {
    formData.value.detalles.push({
        id_producto: 0,
        id_medida: 0,
        cantidad_despachada: 0,
        observacion: '',
        stock_actual: 0,
        precio_compra: 0,
        precio_venta: 0,
        total_compra: 0,
        total_venta: 0
    });
};

const removeDetalle = (index: number) => {
    formData.value.detalles.splice(index, 1);
};

const onProductoChange = (index: number) => {
    const detalle = formData.value.detalles[index];
    if (!detalle) return;
    
    const stockInfo = getStockInfo(detalle.id_producto);
    
    if (stockInfo) {
        detalle.id_medida = stockInfo.id_medida;
        detalle.stock_actual = stockInfo.stock_actual || 0;
        detalle.precio_compra = stockInfo.precio_compra || 0;
        detalle.precio_venta = stockInfo.precio_venta || 0;
        detalle.producto_nombre = stockInfo.producto_nombre;
        detalle.medida_descripcion = stockInfo.medida_descripcion;
        
        calcularSubtotal(index);
    }
};

const onCantidadChange = (index: number) => {
    calcularSubtotal(index);
};

const calcularSubtotal = (index: number) => {
    const detalle = formData.value.detalles[index];
    if (detalle) {
        detalle.total_compra = detalle.cantidad_despachada * (detalle.precio_compra || 0);
        detalle.total_venta = detalle.cantidad_despachada * (detalle.precio_venta || 0);
    }
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(value);
};

const validate = (): boolean => {
    errors.value = { id_mina: '', detalles: '' };
    let isValid = true;

    if (!formData.value.id_mina) {
        errors.value.id_mina = 'Debe seleccionar una mina';
        isValid = false;
    }

    if (formData.value.detalles.length === 0) {
        errors.value.detalles = 'Debe agregar al menos un producto';
        isValid = false;
    }

    const hasInvalidDetalles = formData.value.detalles.some(
        d => !d.id_producto || !d.id_medida || d.cantidad_despachada <= 0
    );

    if (hasInvalidDetalles) {
        errors.value.detalles = 'Todos los productos deben tener cantidad válida';
        isValid = false;
    }

    const hasStockIssues = formData.value.detalles.some(
        d => d.cantidad_despachada > (d.stock_actual || 0)
    );

    if (hasStockIssues) {
        errors.value.detalles = 'Algunas cantidades superan el stock disponible';
        isValid = false;
    }

    return isValid;
};

const save = async () => {
    if (!validate()) {
        alert('Por favor complete todos los campos requeridos y verifique el stock');
        return;
    }

    try {
        const payload = {
            id_mina: formData.value.id_mina!,
            id_supervisor: formData.value.id_supervisor,
            id_viaje: formData.value.id_viaje,
            observaciones: formData.value.observaciones,
            detalles: formData.value.detalles.map(d => ({
                id_producto: d.id_producto,
                id_medida: d.id_medida,
                cantidad_despachada: d.cantidad_despachada,
                observacion: d.observacion
            }))
        };

        if (isEditMode.value) {
            const id = Number(route.params.id);
            await despachosStore.updateDespacho(id, payload);
            alert('Despacho actualizado exitosamente');
        } else {
            await despachosStore.createDespacho(payload);
            alert('Despacho creado exitosamente');
        }

        router.push('/despachos');
    } catch (error: any) {
        console.error('Error al guardar:', error);
        alert(error.response?.data?.message || 'Error al guardar el despacho');
    }
};

onMounted(async () => {
    maestrosStore.fetchMinas();
    maestrosStore.fetchSupervisores();
    
    await loadInventario();
    
    if (isEditMode.value) {
        loadDespacho();
    } else {
        addDetalle();
    }
});
</script>

<template>
    <div class="despachos-form-view">
        <!-- Main Layout -->
        <div class="content-wrapper">
            <!-- Header Section -->
            <header class="page-header-premium">
                <div class="header-breadcrumb">
                    <span class="breadcrumb-item">Despachos</span>
                    <span class="breadcrumb-separator">/</span>
                    <span class="breadcrumb-current">{{ isEditMode ? 'Editar' : 'Nuevo' }}</span>
                </div>
                <div class="header-content">
                    <div class="title-group">
                        <button class="btn-back-premium" @click="router.back()">
                            <ArrowLeft class="icon" />
                        </button>
                        <div class="title-text">
                            <h1 class="page-title">{{ pageTitle }}</h1>
                            <p class="page-subtitle">Complete la información del despacho</p>
                        </div>
                    </div>
                    <div class="actions desktop-only">
                        <button class="btn-ghost" @click="router.back()">Cancelar</button>
                        <button class="btn-primary-premium" @click="save" :disabled="loading">
                            <Save class="icon" />
                            <span>{{ loading ? 'Guardando...' : 'Guardar Despacho' }}</span>
                        </button>
                    </div>
                </div>
            </header>

            <div class="form-container">
                <!-- Datos Generales Card -->
                <div class="premium-card">
                    <div class="card-header-premium">
                        <div class="card-icon">
                            <PackageCheck class="icon" />
                        </div>
                        <div class="card-title">
                            <h3>Datos Generales</h3>
                            <p>Información básica del traslado</p>
                        </div>
                    </div>

                    <div class="card-body-premium">
                        <div class="form-grid">
                            <div class="form-group" :class="{ 'has-error': errors.id_mina }">
                                <label class="required">Mina Destino</label>
                                <div class="select-wrapper">
                                    <select v-model.number="formData.id_mina" class="form-control-premium">
                                        <option :value="undefined">Seleccione una mina</option>
                                        <option v-for="mina in minas" :key="mina.id_mina" :value="mina.id_mina">
                                            {{ mina.nombre }}
                                        </option>
                                    </select>
                                    <ChevronDown class="select-icon" />
                                </div>
                                <span v-if="errors.id_mina" class="error-message">{{ errors.id_mina }}</span>
                            </div>

                            <div class="form-group">
                                <label>Supervisor Responsable</label>
                                <div class="select-wrapper">
                                    <select v-model.number="formData.id_supervisor" class="form-control-premium">
                                        <option :value="undefined">Seleccione un supervisor</option>
                                        <option v-for="sup in supervisores" :key="sup.id_supervisor" :value="sup.id_supervisor">
                                            {{ sup.nombre }}
                                        </option>
                                    </select>
                                    <ChevronDown class="select-icon" />
                                </div>
                            </div>

                            <div class="form-group full-width">
                                <label>Observaciones</label>
                                <textarea 
                                    v-model="formData.observaciones" 
                                    class="form-control-premium textarea"
                                    rows="3"
                                    placeholder="Ingrese cualquier observación relevante para este despacho..."
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Productos Card -->
                <div class="premium-card">
                    <div class="card-header-premium flex-between">
                        <div class="header-left">
                            <div class="card-icon secondary">
                                <Package class="icon" />
                            </div>
                            <div class="card-title">
                                <h3>Productos a Despachar</h3>
                                <p>Detalle de items e inventario</p>
                            </div>
                        </div>
                        <button class="btn-secondary-premium btn-sm" @click="addDetalle">
                            <Plus class="icon-xs" /> Agregar Producto
                        </button>
                    </div>

                    <div class="card-body-premium">
                        <div v-if="errors.detalles" class="alert-premium error">
                            <AlertCircle class="icon-sm" />
                            {{ errors.detalles }}
                        </div>

                        <!-- Desktop Table -->
                        <div class="desktop-only table-wrapper-premium">
                            <table class="table-premium">
                                <thead>
                                    <tr>
                                        <th style="width: 20%">Producto</th>
                                        <th style="width: 8%" class="text-center">Stock</th>
                                        <th style="width: 10%" class="text-right">P. Compra</th>
                                        <th style="width: 10%" class="text-right">P. Venta</th>
                                        <th style="width: 10%" class="text-center">Cantidad</th>
                                        <th style="width: 10%" class="text-right">T. Compra</th>
                                        <th style="width: 10%" class="text-right">T. Venta</th>
                                        <th style="width: 15%">Observación</th>
                                        <th style="width: 4%"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(detalle, index) in formData.detalles" :key="index">
                                        <td>
                                            <div class="product-select-wrapper">
                                                <select 
                                                    v-model.number="detalle.id_producto" 
                                                    @change="onProductoChange(index)"
                                                    class="form-control-premium dense"
                                                >
                                                    <option :value="0">Seleccione Producto</option>
                                                    <option 
                                                        v-for="prod in productosConStock" 
                                                        :key="prod.id_producto" 
                                                        :value="prod.id_producto"
                                                    >
                                                        {{ prod.producto_nombre }} - {{ prod.medida_descripcion || 'S/M' }}
                                                    </option>
                                                </select>
                                                <div v-if="detalle.medida_descripcion" class="medida-badge">
                                                    {{ detalle.medida_descripcion }}
                                                </div>
                                            </div>
                                        </td>
                                        <td class="text-center">
                                            <span class="stock-pill" :class="{ 'low': (detalle.stock_actual || 0) < detalle.cantidad_despachada }">
                                                {{ detalle.stock_actual || 0 }}
                                            </span>
                                        </td>
                                        <td class="text-right font-mono text-sm text-gray">
                                            {{ formatCurrency(detalle.precio_compra || 0) }}
                                        </td>
                                        <td class="text-right font-mono text-sm font-medium">
                                            {{ formatCurrency(detalle.precio_venta || 0) }}
                                        </td>
                                        <td>
                                            <input 
                                                type="number"
                                                v-model.number="detalle.cantidad_despachada"
                                                @input="onCantidadChange(index)"
                                                class="form-control-premium dense text-center"
                                                min="1"
                                                :max="detalle.stock_actual"
                                            />
                                        </td>
                                        <td class="text-right font-mono font-bold text-gray-700">
                                            {{ formatCurrency(detalle.total_compra || 0) }}
                                        </td>
                                        <td class="text-right font-mono font-bold text-primary">
                                            {{ formatCurrency(detalle.total_venta || 0) }}
                                        </td>
                                        <td>
                                            <input 
                                                type="text"
                                                v-model="detalle.observacion"
                                                class="form-control-premium dense"
                                                placeholder="..."
                                            />
                                        </td>
                                        <td class="text-center">
                                            <button 
                                                @click="removeDetalle(index)" 
                                                class="btn-icon-danger"
                                                title="Eliminar línea"
                                            >
                                                <Trash2 class="icon-xs" />
                                            </button>
                                        </td>
                                    </tr>
                                    <tr v-if="formData.detalles.length === 0">
                                        <td colspan="9" class="empty-row">
                                            No hay productos agregados. Haga clic en <span class="text-primary">Agregar Producto</span>.
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot v-if="formData.detalles.length > 0">
                                    <tr class="total-row-premium">
                                        <td colspan="5" class="text-right label">TOTALES GENERALES</td>
                                        <td class="text-right value text-gray-700">{{ formatCurrency(totalCompraGeneral) }}</td>
                                        <td class="text-right value">{{ formatCurrency(totalVentaGeneral) }}</td>
                                        <td colspan="2"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <!-- Mobile Cards -->
                        <div class="mobile-only product-list-mobile">
                            <div class="mobile-card-item" v-for="(detalle, index) in formData.detalles" :key="index">
                                <div class="mobile-card-header">
                                    <div class="product-info-mobile">
                                        <span class="index-badge">#{{ index + 1 }}</span>
                                        <select 
                                            v-model.number="detalle.id_producto" 
                                            @change="onProductoChange(index)"
                                            class="form-control-premium mobile-select"
                                        >
                                            <option :value="0">Seleccione Producto</option>
                                            <option v-for="prod in productosConStock" :key="prod.id_producto" :value="prod.id_producto">
                                                {{ prod.producto_nombre }} - {{ prod.medida_descripcion || 'S/M' }}
                                            </option>
                                        </select>
                                    </div>
                                    <button @click="removeDetalle(index)" class="btn-icon-danger sm">
                                        <Trash2 class="icon-xs" />
                                    </button>
                                </div>

                                <div class="mobile-card-body">
                                    <div class="mobile-grid-row">
                                        <div class="mobile-field">
                                            <label>Medida</label>
                                            <span class="static-value">{{ detalle.medida_descripcion || '-' }}</span>
                                        </div>
                                        <div class="mobile-field">
                                            <label>Stock</label>
                                            <span class="stock-pill" :class="{ 'low': (detalle.stock_actual || 0) < detalle.cantidad_despachada }">
                                                {{ detalle.stock_actual || 0 }}
                                            </span>
                                        </div>
                                    </div>

                                    <div class="mobile-grid-row">
                                        <div class="mobile-field">
                                            <label>Cantidad</label>
                                            <input 
                                                type="number"
                                                v-model.number="detalle.cantidad_despachada"
                                                @input="onCantidadChange(index)"
                                                class="form-control-premium dense"
                                            />
                                        </div>
                                        <div class="mobile-field text-right">
                                            <label>Total Venta</label>
                                            <span class="price-value-lg">{{ formatCurrency(detalle.total_venta || 0) }}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="mobile-field full">
                                        <input 
                                            type="text"
                                            v-model="detalle.observacion"
                                            class="form-control-premium dense"
                                            placeholder="Observación..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div v-if="formData.detalles.length > 0" class="mobile-summary-card">
                                <div class="summary-row">
                                    <span>Total Compra</span>
                                    <span>{{ formatCurrency(totalCompraGeneral) }}</span>
                                </div>
                                <div class="summary-row highlight">
                                    <span>Total Venta</span>
                                    <span>{{ formatCurrency(totalVentaGeneral) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mobile Sticky Actions -->
            <div class="mobile-actions-bar mobile-only">
                <button class="btn-ghost mobile" @click="router.back()">Cancelar</button>
                <button class="btn-primary-premium mobile" @click="save" :disabled="loading">
                    {{ loading ? 'Guardando...' : 'Guardar' }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.despachos-form-view {
    min-height: 100vh;
    background-color: #f3f4f6;
    padding-bottom: 2rem;
}

.content-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
}

/* Premium Header */
.page-header-premium {
    padding: 2rem 0;
    margin-bottom: 1rem;
}

.header-breadcrumb {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.breadcrumb-current {
    color: #111827;
    font-weight: 600;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}

.title-group {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.btn-back-premium {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: white;
    border: 1px solid #e5e7eb;
    color: #374151;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-back-premium:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    transform: translateX(-2px);
}

.title-text h1 {
    font-size: 1.875rem;
    font-weight: 800;
    color: #111827;
    margin: 0;
    line-height: 1.2;
    letter-spacing: -0.025em;
}

.title-text p {
    color: #6b7280;
    margin: 0.25rem 0 0 0;
    font-size: 0.95rem;
}

/* Premium Buttons */
.btn-primary-premium {
    background: #8B1E1E;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 6px -1px rgba(139, 30, 30, 0.2);
}

.btn-primary-premium:hover:not(:disabled) {
    background: #701111;
    transform: translateY(-1px);
    box-shadow: 0 6px 8px -1px rgba(139, 30, 30, 0.3);
}

.btn-primary-premium:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.btn-secondary-premium {
    background: white;
    border: 1px solid #e5e7eb;
    color: #374151;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-secondary-premium:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    color: #111827;
}

.btn-ghost {
    background: transparent;
    border: none;
    color: #6b7280;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    transition: color 0.2s;
}

.btn-ghost:hover {
    color: #111827;
}

/* Premium Cards */
.form-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.premium-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.02);
    overflow: hidden;
}

.card-header-premium {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    align-items: center;
    gap: 1rem;
    background: #ffffff;
}

.card-header-premium.flex-between {
    justify-content: space-between;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.card-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #fee2e2;
    color: #8B1E1E;
    display: flex;
    align-items: center;
    justify-content: center;
}

.card-icon.secondary {
    background: #eff6ff;
    color: #3b82f6;
}

.card-title h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: #111827;
}

.card-title p {
    margin: 0.125rem 0 0 0;
    font-size: 0.875rem;
    color: #6b7280;
}

.card-body-premium {
    padding: 2rem;
}

/* Form Styles */
.form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
}

.form-group label.required::after {
    content: "*";
    color: #ef4444;
    margin-left: 0.25rem;
}

.form-control-premium {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.95rem;
    color: #111827;
    transition: all 0.2s;
    background: #ffffff;
}

.form-control-premium:focus {
    outline: none;
    border-color: #8B1E1E;
    box-shadow: 0 0 0 3px rgba(139, 30, 30, 0.1);
}

.select-wrapper {
    position: relative;
}

.select-icon {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    pointer-events: none;
    width: 16px;
    height: 16px;
}

.form-control-premium.dense {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
}

.form-control-premium.textarea {
    resize: vertical;
    min-height: 100px;
}

/* Premium Table */
.table-wrapper-premium {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
}

.table-premium {
    width: 100%;
    border-collapse: collapse;
}

.table-premium th {
    background: #f9fafb;
    padding: 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #6b7280;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e5e7eb;
}

.table-premium td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: middle;
}

.product-select-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.medida-badge {
    display: inline-block;
    font-size: 0.7rem;
    background: #f3f4f6;
    color: #4b5563;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    width: fit-content;
    font-weight: 600;
}

.stock-pill {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: #dcfce7;
    color: #166534;
    border-radius: 9999px;
    font-weight: 700;
    font-size: 0.85rem;
}

.stock-pill.low {
    background: #fee2e2;
    color: #991b1b;
}

.btn-icon-danger {
    background: transparent;
    border: none;
    color: #ef4444;
    padding: 0.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-icon-danger:hover {
    background: #fee2e2;
}

.total-row-premium {
    background: #f9fafb;
    font-weight: 700;
}

.total-row-premium td {
    padding: 1.25rem 1rem;
    border-top: 2px solid #e5e7eb;
}

.total-row-premium .value {
    color: #8B1E1E;
    font-size: 1.125rem;
}

.empty-row {
    padding: 3rem;
    text-align: center;
    color: #6b7280;
    font-size: 0.95rem;
}

/* Mobile Styles */
.mobile-actions-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 1rem;
    z-index: 50;
    box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.03);
}

.mobile-actions-bar .mobile {
    flex: 1;
    justify-content: center;
}

.mobile-card-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.mobile-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1rem;
}

.product-info-mobile {
    flex: 1;
    margin-right: 0.75rem;
}

.index-badge {
    font-size: 0.7rem;
    color: #6b7280;
    font-weight: 700;
    margin-bottom: 0.25rem;
    display: block;
}

.mobile-grid-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
}

.mobile-field label {
    display: block;
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
    font-weight: 600;
}

.static-value {
    font-weight: 600;
    color: #374151;
    font-size: 0.9rem;
}

.price-value-lg {
    font-weight: 700;
    color: #8B1E1E;
    font-size: 1.1rem;
}

.mobile-summary-card {
    background: #111827;
    color: white;
    border-radius: 12px;
    padding: 1.25rem;
    margin-top: 1.5rem;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    color: #9ca3af;
    font-size: 0.9rem;
}

.summary-row.highlight {
    color: white;
    font-weight: 700;
    font-size: 1.1rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #374151;
    margin-bottom: 0;
}

@media (max-width: 768px) {
    .content-wrapper {
        padding: 0 1rem;
    }
    
    .page-header-premium {
        padding: 1.5rem 0;
    }

    .form-grid {
        grid-template-columns: 1fr;
    }
    
    .card-body-premium {
        padding: 1.5rem 1rem;
    }

    .full-width {
        grid-column: span 1;
    }

    .card-title h3 {
        font-size: 1rem;
    }
}
</style>
