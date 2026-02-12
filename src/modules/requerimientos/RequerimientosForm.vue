<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useRequerimientosStore } from '../../stores/requerimientos.store';
import { ArrowLeft, Save, Plus, Trash } from 'lucide-vue-next';
import SearchableSelect from '../../components/ui/SearchableSelect.vue';
import { 
    minasService, 
    proveedoresService, 
    supervisoresService, 
    productosService
} from '../../services/maestros.service';
import { preciosService } from '../../services/precios.service';
import type { Mina, Proveedor, Supervisor, Producto } from '../../types/models';

const router = useRouter();
const route = useRoute();
const store = useRequerimientosStore();

const isEditing = computed(() => route.params.id !== undefined);
const pageTitle = computed(() => isEditing.value ? 'Editar Requerimiento' : 'Nuevo Requerimiento');

// Estado del formulario
const formData = ref({
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_prometida: '',
    id_proveedor: '',
    id_mina: '',
    id_supervisor: '',
    observaciones: '',
    detalles: [] as any[]
});

// Listas para selectores
const minas = ref<Mina[]>([]);
const proveedores = ref<Proveedor[]>([]);
const supervisores = ref<Supervisor[]>([]);
const productos = ref<Producto[]>([]);
const preciosMap = ref<Record<number, number>>({}); // Mapa id_producto -> precio

// Estado UI
const saving = ref(false);

// Regla de negocio: Fecha Prometida = Fecha Emisión + 8 días
watch(() => formData.value.fecha_emision, (newDate) => {
    if (newDate) {
        const date = new Date(`${newDate}T00:00:00`); // Forzar zona horaria local/neutra para evitar desfases
        date.setDate(date.getDate() + 8);
        formData.value.fecha_prometida = date.toISOString().split('T')[0] ?? '';
    }
}, { immediate: true });

const handleProveedorChange = async () => {
    // Cuando cambia el proveedor, recargamos los precios
    const idProveedor = Number(formData.value.id_proveedor);
    if (!idProveedor) {
        preciosMap.value = {};
        return;
    }
    
    try {
        // Request ample limit to get all prices for this provider
        const response: any = await preciosService.getAll({ 
            id_proveedor: idProveedor, 
            activo: true,
            limit: 1000 // Ensure we get all prices
        } as any);

        console.log('💰 Precios raw response:', response);
        
        // Handle pagination structure { data: [], pagination: {} } vs plain array
        const preciosList = Array.isArray(response) ? response : (response.data || []);
        
        console.log('💰 Precios list:', preciosList);

        // Convertir array a mapa para búsqueda rápida
        preciosMap.value = preciosList.reduce((acc: any, curr: any) => {
            acc[curr.id_producto] = Number(curr.precio_compra_sugerido);
            return acc;
        }, {});
        
        console.log('💰 Precios Map:', preciosMap.value);
        
        // Actualizar precios de items ya agregados si existen en el nuevo mapa
        formData.value.detalles.forEach((d: any) => {
             if (d.id_producto && preciosMap.value[d.id_producto]) {
                 d.precio_proveedor = preciosMap.value[d.id_producto];
             }
        });
    } catch (e) {
        console.error('Error cargando precios del proveedor:', e);
        preciosMap.value = {};
    }
};

const handleProductChange = (detalle: any) => {
    const idProducto = Number(detalle.id_producto);
    
    // 1. Obtener precio de compra (Proveedor)
    if (idProducto && preciosMap.value[idProducto]) {
        detalle.precio_proveedor = preciosMap.value[idProducto];
    } else {
        detalle.precio_proveedor = 0;
    }

    // 2. Obtener precio de venta (Mina/Base) independentiente del proveedor
    const product = productos.value.find(p => p.id_producto === idProducto);
    if (product) {
        // Asumiendo que el modelo de producto tiene precio_venta_base (verificado en lints anteriores)
        detalle.precio_mina = product.precio_venta_base || 0;
    } else {
        detalle.precio_mina = 0;
    }
};

const cargarMaestros = async () => {
    try {
        const [m, p, s, prod] = await Promise.all([
            minasService.getAll({ limit: 100 }), // Traer todos (limit alto)
            proveedoresService.getAll({ limit: 100 }),
            supervisoresService.getAll({ limit: 100 }),
            productosService.getAll({ limit: 1000 })
        ]);
        
        minas.value = Array.isArray(m) ? m : (m as any).data || [];
        proveedores.value = Array.isArray(p) ? p : (p as any).data || [];
        supervisores.value = Array.isArray(s) ? s : (s as any).data || [];
        productos.value = Array.isArray(prod) ? prod : (prod as any).data || [];
        console.log('Productos cargados:', productos.value);

    } catch (e) {
        console.error('Error cargando maestros:', e);
    }
};

const addDetalle = () => {
    formData.value.detalles.push({
        id_producto: '',
        cantidad_solicitada: '',
        precio_proveedor: 0,
        precio_mina: 0,
        observacion: ''
    });
};

const removeDetalle = (index: number) => {
    formData.value.detalles.splice(index, 1);
};


// ... existing code ...

const formattedProductOptions = computed(() => {
    return productos.value.map((prod: any) => ({
        ...prod,
        full_label: `${prod.nombre} ${prod.medidas?.descripcion ? '- ' + prod.medidas.descripcion : ''}`
    }));
});

// Focus Refs
const proveedorRef = ref<any>(null);
const minaRef = ref<any>(null);
const supervisorRef = ref<any>(null);
const fechaEmisionRef = ref<HTMLInputElement | null>(null);
const observacionRef = ref<HTMLTextAreaElement | null>(null);

// Refs for dynamic rows (Map: rowIndex -> { fieldName: element })
const detailRefs = ref(new Map<number, { [key: string]: HTMLElement | any }>());

const setDetailRef = (el: any, rowIndex: number, field: string) => {
    if (el) {
        if (!detailRefs.value.has(rowIndex)) {
            detailRefs.value.set(rowIndex, {});
        }
        detailRefs.value.get(rowIndex)![field] = el;
    }
};

const focusNext = (nextRef: any) => {
    if (!nextRef) return;
    
    // Check if it's a DOM element or component with exposed focus method
    if (typeof nextRef.focus === 'function') {
        nextRef.focus();
    } else if (nextRef.$el) {
        // Fallback for components that don't expose focus but have $el
         const input = nextRef.$el.querySelector('input, select, textarea');
         if (input && typeof input.focus === 'function') {
             input.focus();
         }
    }
};

const handleProdSelectFocus = (index: number) => {
    // Focus Cantidad input for this row
    const rowRefs = detailRefs.value.get(index);
    if (rowRefs && rowRefs['cantidad']) {
        nextTick(() => {
            rowRefs['cantidad'].focus();
        });
    }
};

const focusProductSelect = (index: number) => {
    const rowRefs = detailRefs.value.get(index);
    if (rowRefs && rowRefs['producto']) {
        nextTick(() => {
            // SearchableSelect exposes focus()
            rowRefs['producto'].focus();
        });
    }
};

const fixDateYear = (field: 'fecha_emision' | 'fecha_prometida') => {
    // Explicitly cast to string since we know it's a date string if present
    const val = formData.value[field] as string;
    if (!val) return;
    
    const parts = val.split('-');
    if (parts.length === 3 && parts[0]) {
        let year = parseInt(parts[0]);
        // Handle 2 digit years (e.g. 26 -> 2026)
        if (year < 100) {
            year += 2000;
        } 
        // Handle years that have extra digits (e.g. 262026 -> 2026)
        // This often happens if user types 2026 on top of 26
        else if (year > 9999) {
            const yearStr = year.toString();
            // Take the last 4 digits as a heuristic
            // If user typed 2026 after 26, it might be 262026
            year = parseInt(yearStr.slice(-4));
        }

        // Reconstruct date
        parts[0] = year.toString();
        // Use type assertion to assign back
        (formData.value as any)[field] = parts.join('-');
    }
};

const save = async () => {
    saving.value = true;
    try {
        // Validaciones básicas
        if (!formData.value.id_proveedor || !formData.value.id_mina) {
            alert('Complete los campos obligatorios');
            return;
        }

        if (formData.value.detalles.length === 0) {
            alert('Agregue al menos un producto');
            return;
        }

        const payload = {
            ...formData.value,
            id_proveedor: Number(formData.value.id_proveedor),
            id_mina: Number(formData.value.id_mina),
            id_supervisor: Number(formData.value.id_supervisor),
            detalles: formData.value.detalles.map(d => ({
                ...d,
                id_producto: Number(d.id_producto),
                cantidad_solicitada: Number(d.cantidad_solicitada),
                precio_proveedor: Number(d.precio_proveedor),
                precio_mina: Number(d.precio_mina)
            }))
        };

        if (isEditing.value) {
            // await store.update(id, payload);
        } else {
            await store.createRequerimiento(payload as any);
        }
        router.push('/requirements');
    } catch (error) {
        console.error(error);
        alert('Error al guardar');
    } finally {
        saving.value = false;
    }
};

onMounted(() => {
    // Cargar listas de maestros
    cargarMaestros();
    addDetalle(); // Agregar una línea vacía por defecto
    // Focus first field
    if (proveedorRef.value) {
        proveedorRef.value.focus();
    }
});
</script>

<template>
    <div class="requerimientos-form">
        <header class="page-header">
            <button class="btn-back" @click="router.back()">
                <ArrowLeft class="icon" /> Volver
            </button>
            <h1 class="page-title">{{ pageTitle }}</h1>
        </header>

        <div class="form-container">
            <!-- Cabecera -->
            <div class="form-section header-section">
                <h3>Datos Generales</h3>
                <div class="grid-cols-3">
                    <div class="form-group">
                        <label>Proveedor</label>
                        <SearchableSelect
                            ref="proveedorRef"
                            v-model="formData.id_proveedor"
                            :options="proveedores"
                            label-key="nombre"
                            value-key="id_proveedor"
                            placeholder="Seleccione..."
                            @change="handleProveedorChange"
                            @next="focusNext(minaRef)"
                            @select="focusNext(minaRef)"
                        />
                    </div>

                    <div class="form-group">
                        <label>Mina</label>
                        <SearchableSelect
                            ref="minaRef"
                            v-model="formData.id_mina"
                            :options="minas"
                            label-key="nombre"
                            value-key="id_mina"
                            placeholder="Seleccione..."
                            @next="focusNext(supervisorRef)"
                            @select="focusNext(supervisorRef)"
                        />
                    </div>

                    <div class="form-group">
                        <label>Supervisor</label>
                        <SearchableSelect
                            ref="supervisorRef"
                            v-model="formData.id_supervisor"
                            :options="supervisores"
                            label-key="nombre"
                            value-key="id_supervisor"
                            placeholder="Seleccione..."
                            @next="focusNext(fechaEmisionRef)"
                            @select="focusNext(fechaEmisionRef)"
                        />
                    </div>

                    <div class="form-group">
                        <label>Fecha de Emisión</label>
                        <input 
                            ref="fechaEmisionRef"
                            type="date" 
                            v-model="formData.fecha_emision" 
                            class="form-control"
                            @keydown.enter.prevent="focusNext(observacionRef)"
                            @blur="fixDateYear('fecha_emision')"
                        />
                    </div>

                    <div class="form-group">
                        <label>Fecha Prometida</label>
                        <input 
                            ref="fechaPrometidaRef"
                            type="date" 
                            v-model="formData.fecha_prometida" 
                            class="form-control"
                            readonly 
                            tabindex="-1"
                        />
                    </div>
                </div>

                <div class="form-group full-width">
                    <label>Observaciones</label>
                    <textarea 
                        ref="observacionRef"
                        v-model="formData.observaciones" 
                        class="form-control" 
                        rows="2"
                        @keydown.enter.prevent="focusProductSelect(0)"
                    ></textarea>
                </div>
            </div>

            <!-- Detalles -->
            <div class="form-section details-section">
                <div class="section-header">
                    <h3>Productos</h3>
                    <button class="btn-secondary btn-sm" @click="addDetalle">
                        <Plus class="icon-sm" /> Agregar Item
                    </button>
                </div>

                <div class="table-responsive">
                    <table class="details-table">
                        <thead>
                            <tr>
                                <th style="width: 30%">Producto</th>
                                <th style="width: 10%">Cant.</th>
                                <th style="width: 15%">Precio Prov.</th>
                                <th style="width: 15%">Precio Mina</th>
                                <th>Observación</th>
                                <th style="width: 50px"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(detalle, index) in formData.detalles" :key="index">
                                <td>
                                    <SearchableSelect 
                                        :ref="(el) => setDetailRef(el, index, 'producto')"
                                        v-model="detalle.id_producto"
                                        :options="formattedProductOptions"
                                        label-key="full_label"
                                        value-key="id_producto"
                                        placeholder="Producto..."
                                        dense
                                        @change="handleProductChange(detalle)"
                                        @select="handleProdSelectFocus(index)"
                                        @next="handleProdSelectFocus(index)"
                                    />
                                </td>
                                <td>
                                    <input 
                                        :ref="(el) => setDetailRef(el, index, 'cantidad')"
                                        type="number" 
                                        v-model="detalle.cantidad_solicitada" 
                                        class="form-control dense text-right" 
                                        min="1" 
                                        @keydown.enter.prevent="() => {
                                             const refs = detailRefs.get(index);
                                             if (refs && refs['precio_prov']) refs['precio_prov'].focus();
                                        }"
                                    />
                                </td>
                                <td>
                                    <input 
                                        :ref="(el) => setDetailRef(el, index, 'precio_prov')"
                                        type="number" 
                                        v-model="detalle.precio_proveedor" 
                                        class="form-control dense text-right" 
                                        step="0.01" 
                                        @keydown.enter.prevent="() => {
                                             const refs = detailRefs.get(index);
                                             if (refs && refs['precio_mina']) refs['precio_mina'].focus();
                                        }"
                                    />
                                </td>
                                <td>
                                    <input 
                                        :ref="(el) => setDetailRef(el, index, 'precio_mina')"
                                        type="number" 
                                        v-model="detalle.precio_mina" 
                                        class="form-control dense text-right" 
                                        step="0.01" 
                                        @keydown.enter.prevent="() => {
                                             const refs = detailRefs.get(index);
                                             if (refs && refs['obs']) refs['obs'].focus();
                                        }"
                                    />
                                </td>
                                <td>
                                    <input 
                                        :ref="(el) => setDetailRef(el, index, 'obs')"
                                        type="text" 
                                        v-model="detalle.observacion" 
                                        class="form-control dense" 
                                        @keydown.enter.prevent
                                    />
                                </td>
                                <td>
                                    <button class="btn-icon danger" @click="removeDetalle(index)">
                                        <Trash class="icon-sm" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="form-actions">
                <button class="btn-secondary" @click="router.back()">Cancelar</button>
                <button class="btn-primary" @click="save" :disabled="saving">
                    <Save class="icon" />
                    {{ saving ? 'Guardando...' : 'Guardar Requerimiento' }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import '../../assets/styles/responsive-forms.css';

.requerimientos-form {
    max-width: 1000px;
    margin: 0 auto;
}

.page-header {
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.btn-back {
    background: none;
    border: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-light);
    cursor: pointer;
    font-size: 1rem;
}

.page-title {
    margin: 0;
    font-size: 1.5rem;
}

.form-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-section {
    background: white;
    padding: 1.5rem;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.form-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    color: var(--text);
}

.grid-cols-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text);
}

.form-control {
    padding: 0.625rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font-size: 0.95rem;
    width: 100%;
}

.form-control.dense {
    padding: 0.4rem;
    font-size: 0.9rem;
}

.text-right {
    text-align: right;
}

.full-width {
    grid-column: 1 / -1;
    margin-top: 1rem;
}

/* Table Styles */
.table-responsive {
    overflow-x: auto;
}

.details-table {
    width: 100%;
    border-collapse: collapse;
}

.details-table th {
    text-align: left;
    padding: 0.75rem;
    font-size: 0.85rem;
    color: var(--text-light);
    border-bottom: 1px solid var(--border);
}

.details-table td {
    padding: 0.5rem;
    vertical-align: top;
}

.btn-icon {
    background: none;
    border: none;
    color: var(--text-light);
    cursor: pointer;
    padding: 0.25rem;
}

.btn-icon.danger:hover {
    color: #ef4444;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
}

.btn-primary, .btn-secondary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-md);
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
}

.btn-primary {
    background-color: var(--primary);
    color: white;
}

.btn-secondary {
    background-color: white;
    border-color: var(--border);
    color: var(--text);
}

.btn-sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
}

.icon { width: 1.25rem; height: 1.25rem; }
.icon-sm { width: 1rem; height: 1rem; }

/* ============================================
   MOBILE RESPONSIVE
   ============================================ */

@media (max-width: 767px) {
    .requerimientos-form {
        padding: 0;
    }

    .page-header {
        padding: 1rem;
        margin-bottom: 1rem;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }

    .page-title {
        font-size: 1.5rem;
    }

    .form-container {
        padding: 0;
    }

    .form-section {
        margin-bottom: 1rem;
        border-radius: 0;
    }

    .form-section h3 {
        font-size: 1.1rem;
    }

    /* Grid to single column on mobile */
    .grid-cols-3 {
        grid-template-columns: 1fr !important;
        gap: 1rem;
    }

    .form-group {
        margin-bottom: 0;
    }

    .full-width {
        grid-column: 1 / -1;
    }

    /* Table responsive behavior */
    .table-responsive {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }

    .details-table {
        min-width: 600px; /* Force horizontal scroll for table */
        font-size: 0.85rem;
    }

    .details-table th,
    .details-table td {
        padding: 0.5rem 0.4rem;
    }

    .details-table select,
    .details-table input {
        font-size: 14px; /* Prevent zoom on iOS */
    }

    /* Form actions */
    .form-actions {
        padding: 1rem;
        flex-direction: column-reverse;
        gap: 0.75rem;
    }

    .form-actions button {
        width: 100%;
        justify-content: center;
    }

    .btn-back {
        width: auto;
        padding: 0.5rem;
    }

    /* Section header for mobile */
    .section-header {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
    }

    .section-header button {
        width: 100%;
        justify-content: center;
    }
}
</style>
