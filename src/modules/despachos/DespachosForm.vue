<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDespachosStore } from '../../stores/despachos.store';
import { useMaestrosStore } from '../../stores/maestros.store';
import { inventarioService } from '../../services/inventario.service';
import { storeToRefs } from 'pinia';
import { ArrowLeft, Save, Plus, Trash2, PackageCheck, AlertCircle } from 'lucide-vue-next';

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
        <header class="page-header">
            <div class="header-content">
                <div class="title-group">
                    <button class="btn-back" @click="router.back()">
                        <ArrowLeft class="icon" />
                    </button>
                    <div>
                        <h1 class="page-title">{{ pageTitle }}</h1>
                        <p class="page-subtitle">Complete la información del despacho</p>
                    </div>
                </div>
                <div class="actions desktop-only">
                    <button class="btn-secondary" @click="router.back()">Cancelar</button>
                    <button class="btn-primary" @click="save" :disabled="loading">
                        <Save class="icon" />
                        {{ loading ? 'Guardando...' : 'Guardar' }}
                    </button>
                </div>
            </div>
        </header>

        <div class="form-container">
            <!-- Datos Generales -->
            <div class="form-section">
                <h2 class="section-title">
                    <PackageCheck class="icon" />
                    Datos del Despacho
                </h2>

                <div class="form-grid">
                    <div class="form-group" :class="{ 'has-error': errors.id_mina }">
                        <label class="required">Mina Destino</label>
                        <select v-model.number="formData.id_mina" class="form-control">
                            <option :value="undefined">Seleccione una mina</option>
                            <option v-for="mina in minas" :key="mina.id_mina" :value="mina.id_mina">
                                {{ mina.nombre }}
                            </option>
                        </select>
                        <span v-if="errors.id_mina" class="error-message">{{ errors.id_mina }}</span>
                    </div>

                    <div class="form-group">
                        <label>Supervisor</label>
                        <select v-model.number="formData.id_supervisor" class="form-control">
                            <option :value="undefined">Seleccione un supervisor</option>
                            <option v-for="sup in supervisores" :key="sup.id_supervisor" :value="sup.id_supervisor">
                                {{ sup.nombre }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group full-width">
                        <label>Observaciones</label>
                        <textarea 
                            v-model="formData.observaciones" 
                            class="form-control"
                            rows="3"
                            placeholder="Observaciones adicionales..."
                        ></textarea>
                    </div>
                </div>
            </div>

            <!-- Productos -->
            <div class="form-section">
                <div class="section-header">
                    <h2 class="section-title">Productos a Despachar</h2>
                    <button class="btn btn-primary btn-sm" @click="addDetalle">
                        <Plus class="icon-xs" /> Agregar Producto
                    </button>
                </div>

                <div v-if="errors.detalles" class="alert alert-error">
                    <AlertCircle class="icon-sm" />
                    {{ errors.detalles }}
                </div>

                <!-- Desktop Table -->
                <div class="desktop-only">
                    <div class="table-responsive">
                        <table class="productos-table">
                            <thead>
                                <tr>
                                    <th style="width: 18%">Producto *</th>
                                    <th style="width: 10%">Medida</th>
                                    <th style="width: 7%">Stock</th>
                                    <th style="width: 10%">P. Compra</th>
                                    <th style="width: 10%">P. Venta</th>
                                    <th style="width: 8%">Cantidad *</th>
                                    <th style="width: 10%">Total Compra</th>
                                    <th style="width: 10%">Total Venta</th>
                                    <th style="width: 12%">Observación</th>
                                    <th style="width: 5%"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(detalle, index) in formData.detalles" :key="index">
                                    <td>
                                        <select 
                                            v-model.number="detalle.id_producto" 
                                            @change="onProductoChange(index)"
                                            class="form-control"
                                        >
                                            <option :value="0">Seleccione</option>
                                            <option 
                                                v-for="prod in productosConStock" 
                                                :key="prod.id_producto" 
                                                :value="prod.id_producto"
                                            >
                                                {{ prod.producto_nombre }} - {{ prod.medida_descripcion }}
                                            </option>
                                        </select>
                                    </td>
                                    <td>
                                        <input 
                                            type="text"
                                            :value="detalle.medida_descripcion || '-'"
                                            class="form-control"
                                            disabled
                                        />
                                    </td>
                                    <td>
                                        <span class="stock-badge" :class="{ 'low-stock': (detalle.stock_actual || 0) < detalle.cantidad_despachada }">
                                            {{ detalle.stock_actual || 0 }}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="price-display">{{ formatCurrency(detalle.precio_compra || 0) }}</span>
                                    </td>
                                    <td>
                                        <span class="price-display">{{ formatCurrency(detalle.precio_venta || 0) }}</span>
                                    </td>
                                    <td>
                                        <input 
                                            type="number"
                                            v-model.number="detalle.cantidad_despachada"
                                            @input="onCantidadChange(index)"
                                            class="form-control"
                                            min="1"
                                            :max="detalle.stock_actual"
                                            placeholder="0"
                                        />
                                    </td>
                                    <td>
                                        <span class="subtotal-display">{{ formatCurrency(detalle.total_compra || 0) }}</span>
                                    </td>
                                    <td>
                                        <span class="subtotal-display">{{ formatCurrency(detalle.total_venta || 0) }}</span>
                                    </td>
                                    <td>
                                        <input 
                                            type="text"
                                            v-model="detalle.observacion"
                                            class="form-control"
                                            placeholder="..."
                                        />
                                    </td>
                                    <td>
                                        <button 
                                            @click="removeDetalle(index)" 
                                            class="btn-icon btn-danger"
                                            type="button"
                                        >
                                            <Trash2 class="icon-xs" />
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="formData.detalles.length > 0" class="total-row">
                                    <td colspan="6" class="text-right"><strong>TOTALES GENERALES:</strong></td>
                                    <td><strong class="total-amount">{{ formatCurrency(totalCompraGeneral) }}</strong></td>
                                    <td><strong class="total-amount">{{ formatCurrency(totalVentaGeneral) }}</strong></td>
                                    <td colspan="2"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Mobile Cards -->
                <div class="mobile-only">
                    <div class="producto-card" v-for="(detalle, index) in formData.detalles" :key="index">
                        <div class="card-header">
                            <span class="card-number">Producto #{{ index + 1 }}</span>
                            <button @click="removeDetalle(index)" class="btn-icon btn-danger btn-sm">
                                <Trash2 class="icon-xs" />
                            </button>
                        </div>

                        <div class="card-body">
                            <div class="form-group">
                                <label class="required">Producto</label>
                                <select 
                                    v-model.number="detalle.id_producto" 
                                    @change="onProductoChange(index)"
                                    class="form-control"
                                >
                                    <option :value="0">Seleccione</option>
                                    <option 
                                        v-for="prod in productosConStock" 
                                        :key="prod.id_producto" 
                                        :value="prod.id_producto"
                                    >
                                        {{ prod.producto_nombre }} - {{ prod.medida_descripcion }}
                                    </option>
                                </select>
                            </div>

                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="label">Medida:</span>
                                    <span class="value">{{ detalle.medida_descripcion || '-' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">Stock:</span>
                                    <span class="value stock-badge" :class="{ 'low-stock': (detalle.stock_actual || 0) < detalle.cantidad_despachada }">
                                        {{ detalle.stock_actual || 0 }}
                                    </span>
                                </div>
                                <div class="info-item">
                                    <span class="label">P. Compra:</span>
                                    <span class="value">{{ formatCurrency(detalle.precio_compra || 0) }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">P. Venta:</span>
                                    <span class="value">{{ formatCurrency(detalle.precio_venta || 0) }}</span>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="required">Cantidad</label>
                                <input 
                                    type="number"
                                    v-model.number="detalle.cantidad_despachada"
                                    @input="onCantidadChange(index)"
                                    class="form-control"
                                    min="1"
                                    :max="detalle.stock_actual"
                                    placeholder="0"
                                />
                            </div>

                            <div class="totales-mobile">
                                <div class="total-item">
                                    <span class="label">Total Compra:</span>
                                    <span class="value">{{ formatCurrency(detalle.total_compra || 0) }}</span>
                                </div>
                                <div class="total-item">
                                    <span class="label">Total Venta:</span>
                                    <span class="value">{{ formatCurrency(detalle.total_venta || 0) }}</span>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Observación</label>
                                <input 
                                    type="text"
                                    v-model="detalle.observacion"
                                    class="form-control"
                                    placeholder="Observación..."
                                />
                            </div>
                        </div>
                    </div>

                    <div v-if="formData.detalles.length > 0" class="totales-generales-mobile">
                        <div class="total-item">
                            <span class="label">TOTAL COMPRA:</span>
                            <span class="value">{{ formatCurrency(totalCompraGeneral) }}</span>
                        </div>
                        <div class="total-item total-venta">
                            <span class="label">TOTAL VENTA:</span>
                            <span class="value">{{ formatCurrency(totalVentaGeneral) }}</span>
                        </div>
                    </div>

                    <div v-if="formData.detalles.length === 0" class="empty-state">
                        <p>No hay productos agregados</p>
                        <button class="btn btn-primary btn-sm" @click="addDetalle">
                            <Plus class="icon-xs" /> Agregar Primer Producto
                        </button>
                    </div>
                </div>
            </div>

            <!-- Mobile Actions -->
            <div class="mobile-only mobile-actions">
                <button class="btn btn-secondary btn-block" @click="router.back()">
                    Cancelar
                </button>
                <button class="btn btn-primary btn-block" @click="save" :disabled="loading">
                    <Save class="icon" />
                    {{ loading ? 'Guardando...' : 'Guardar Despacho' }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.despachos-form-view {
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
}

.page-header {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    padding: 1.75rem 2rem;
    position: sticky;
    top: 0;
    z-index: 10;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.header-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.title-group {
    display: flex;
    align-items: center;
    gap: 1.25rem;
}

.btn-back {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
}

.btn-back:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
}

.page-title {
    font-size: 1.75rem;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
}

.page-subtitle {
    color: #6b7280;
    margin: 0.375rem 0 0 0;
    font-size: 0.9rem;
    font-weight: 500;
}

.actions {
    display: flex;
    gap: 0.75rem;
}

.form-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
}

.form-section {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;
}

.form-section:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.section-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 0 1.5rem 0;
    padding-bottom: 1rem;
    border-bottom: 2px solid #f3f4f6;
}

.section-title .icon {
    color: #667eea;
    width: 24px;
    height: 24px;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group.full-width {
    grid-column: 1 / -1;
}

.form-group.has-error .form-control {
    border-color: #ef4444;
    background: #fef2f2;
}

.form-group label {
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
}

.form-group label.required::after {
    content: '*';
    color: #ef4444;
    font-weight: 700;
    margin-left: 0.25rem;
}

.form-control {
    padding: 0.75rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    font-size: 0.9rem;
    font-family: inherit;
    transition: all 0.2s ease;
    background: #ffffff;
}

.form-control:hover {
    border-color: #cbd5e1;
}

.form-control:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.form-control:disabled {
    background: #f9fafb;
    cursor: not-allowed;
    color: #9ca3af;
}

.error-message {
    color: #ef4444;
    font-size: 0.8rem;
    margin-top: 0.375rem;
    font-weight: 500;
}

.alert {
    padding: 1rem 1.25rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 500;
}

.alert-error {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    color: #991b1b;
    border: 2px solid #fca5a5;
}

.table-responsive {
    overflow-x: auto;
    margin: 1.5rem 0;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
}

.productos-table {
    width: 100%;
    border-collapse: collapse;
}

.productos-table th {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    padding: 1rem;
    text-align: left;
    font-weight: 700;
    font-size: 0.85rem;
    color: #374151;
    border-bottom: 2px solid #d1d5db;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
}

.productos-table td {
    padding: 1rem;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: middle;
}

.productos-table tbody tr {
    transition: all 0.2s ease;
}

.productos-table tbody tr:hover {
    background: #f9fafb;
}

.total-row {
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    font-weight: 700;
}

.total-row td {
    border-bottom: none;
    padding: 1.25rem 1rem;
}

.text-right {
    text-align: right;
}

.stock-badge {
    display: inline-block;
    padding: 0.375rem 0.75rem;
    background: #d1fae5;
    color: #065f46;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
}

.stock-badge.low-stock {
    background: #fee2e2;
    color: #991b1b;
}

.price-display,
.subtotal-display {
    font-weight: 600;
    color: #374151;
    font-size: 0.9rem;
}

.total-amount {
    color: #667eea;
    font-size: 1.125rem;
}

.producto-card {
    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1.25rem;
    border: 2px solid #e5e7eb;
}

.producto-card .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e5e7eb;
}

.card-number {
    font-weight: 700;
    color: #667eea;
    font-size: 1rem;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin: 1rem 0;
    padding: 1rem;
    background: white;
    border-radius: 12px;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.info-item .label {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.info-item .value {
    font-size: 0.9rem;
    color: #1f2937;
    font-weight: 600;
}

.subtotal-mobile,
.totales-mobile {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    border-radius: 12px;
    margin: 1rem 0;
}

.totales-mobile {
    flex-direction: column;
    gap: 0.75rem;
}

.totales-mobile .total-item {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 0.75rem;
    background: white;
    border-radius: 8px;
}

.subtotal-mobile .label,
.totales-mobile .label {
    font-weight: 700;
    color: #374151;
    font-size: 0.9rem;
}

.subtotal-mobile .value,
.totales-mobile .value {
    font-weight: 700;
    color: #667eea;
    font-size: 1.125rem;
}

.totales-generales-mobile {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.totales-generales-mobile .total-item {
    padding: 1.25rem;
    border-radius: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.totales-generales-mobile .total-item:first-child {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: white;
}

.totales-generales-mobile .total-item.total-venta {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

.totales-generales-mobile .label {
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: 1px;
}

.totales-generales-mobile .value {
    font-weight: 700;
    font-size: 1.5rem;
}

.subtotal-mobile .value {
    font-weight: 700;
    color: #667eea;
    font-size: 1.125rem;
}

.total-mobile {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.total-mobile .label {
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: 1px;
}

.total-mobile .value {
    font-weight: 700;
    font-size: 1.5rem;
}

.empty-state {
    text-align: center;
    padding: 3rem;
    color: #9ca3af;
}

.empty-state p {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 1.25rem;
}

.mobile-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    position: sticky;
    bottom: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 1) 100%);
    backdrop-filter: blur(10px);
    padding: 1.25rem;
    border-top: 2px solid #e5e7eb;
    margin: 0 -2rem;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
}

@media (max-width: 768px) {
    .page-header {
        padding: 1.25rem;
    }

    .page-title {
        font-size: 1.375rem;
    }

    .form-container {
        padding: 1rem;
    }

    .form-section {
        padding: 1.25rem;
    }

    .form-grid {
        grid-template-columns: 1fr;
    }

    .section-header {
        flex-direction: column;
        gap: 1rem;
    }

    .mobile-actions {
        margin: 0 -1.25rem;
    }
}
</style>
