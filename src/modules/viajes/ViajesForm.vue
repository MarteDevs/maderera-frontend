<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useViajesStore } from './viajes.store';
import { requerimientosService, type Requerimiento } from '../requerimientos/requerimientos.service';
import { productosService, medidasService } from '../../services/maestros.service';
import { ArrowLeft, Save, Truck, AlertTriangle, Plus, Trash2, Package } from 'lucide-vue-next';
import SearchableSelect from '../../components/ui/SearchableSelect.vue';
import FormModal from '../../components/ui/FormModal.vue';

const route = useRoute();
const router = useRouter();
const store = useViajesStore();

// State
const requerimiento = ref<Requerimiento | null>(null);
const loadingReq = ref(false);
const saving = ref(false);
const requerimientosOptions = ref<any[]>([]);
const selectedReqId = ref<number | string>('');

const formData = ref({
    numero_vale: '',
    etiqueta_viaje: '',
    observaciones: '',
    fecha_ingreso: new Date().toISOString().slice(0, 16),
    detalles: [] as any[]
});

// Extra items (productos no solicitados en el requerimiento)
const extraItems = ref<any[]>([]);
const allProductos = ref<any[]>([]);
const allMedidas = ref<any[]>([]);

const addExtraItem = () => {
    extraItems.value.push({
        es_extra: true,
        id_producto: '',
        id_medida: '',
        cantidad_recibida: 1,
        estado_entrega: 'OK',
        observacion: ''
    });
};

const removeExtraItem = (index: number) => {
    extraItems.value.splice(index, 1);
};

const etiquetasViajeOptions = Array.from({ length: 20 }, (_, i) => `${i + 1}-VIAJE`);


const idRequerimientoParam = Number(route.params.id_requerimiento);

// Refs for inputs
const valeInput = ref<HTMLInputElement | null>(null);
const etiquetaInput = ref<HTMLSelectElement | null>(null);
const fechaInput = ref<HTMLInputElement | null>(null);
const obsInput = ref<HTMLInputElement | null>(null);

// Desktop Refs
const recibidoInputsDesktop = ref<HTMLInputElement[]>([]);
const estadoInputsDesktop = ref<HTMLSelectElement[]>([]);
const obsItemInputsDesktop = ref<HTMLInputElement[]>([]);

// Mobile Refs
const recibidoInputsMobile = ref<HTMLInputElement[]>([]);
const estadoInputsMobile = ref<HTMLSelectElement[]>([]);
const obsItemInputsMobile = ref<HTMLInputElement[]>([]);

const saveBtn = ref<HTMLButtonElement | null>(null);

// Helper to focus visible element
const focusVisible = (index: number, desktopArr: HTMLElement[], mobileArr: HTMLElement[]) => {
    const desktopEl = desktopArr[index];
    if (desktopEl && desktopEl.offsetParent !== null) {
        desktopEl.focus();
        return;
    }
    const mobileEl = mobileArr[index];
    if (mobileEl && mobileEl.offsetParent !== null) {
        mobileEl.focus();
    }
};

// Methods
const handleEnter = (index: number, section: string) => {
    switch (section) {
        case 'vale':
            etiquetaInput.value?.focus();
            break;
        case 'etiqueta':
            fechaInput.value?.focus();
            break;
        case 'fecha':
            obsInput.value?.focus();
            break;
        case 'obs':
             if (recibidoInputsDesktop.value.length > 0 || recibidoInputsMobile.value.length > 0) {
                focusVisible(0, recibidoInputsDesktop.value, recibidoInputsMobile.value);
            } else {
                 // Si no hay detalles (no req selected), tal vez ir al save o nada
                 if (!requerimiento.value) alert('Seleccione un requerimiento primero');
            }
            break;
        case 'recibido':
            focusVisible(index, estadoInputsDesktop.value, estadoInputsMobile.value);
            break;
        case 'estado':
            focusVisible(index, obsItemInputsDesktop.value, obsItemInputsMobile.value);
            break;
        case 'obsItem':
            const nextIndex = index + 1;
            const hasNextDesktop = nextIndex < recibidoInputsDesktop.value.length;
            const hasNextMobile = nextIndex < recibidoInputsMobile.value.length;

            if (hasNextDesktop || hasNextMobile) {
                focusVisible(nextIndex, recibidoInputsDesktop.value, recibidoInputsMobile.value);
            } else {
                saveBtn.value?.focus();
            }
            break;
    }
};

// Computed


// Methods
const loadRequerimientosOptions = async () => {
    try {
        // Fetch PENDIENTE and PARCIAL requirements
        // Assuming getAll supports status filtering. If not, we might need multiple calls or backend change.
        // Based on analysis, getAll checks filters.estado.
        // We can't filter multiple statuses easily with current backend implementation unless we change it.
        // For now, let's fetch PENDIENTE. Users usually receive pending ones.
        // TODO: Update backend to support 'active' or array of statuses if needed.
        // Actually, let's try to fetch all non-completed/anulled. 
        // Or just fetch all and filter in frontend for now if the list isn't huge, or make two calls.
        const res = await requerimientosService.getAll({ limit: 100, estado: 'PENDIENTE' }); // Fetch pending
        const res2 = await requerimientosService.getAll({ limit: 100, estado: 'PARCIAL' }); // Fetch partial
        
        const allReqs = [...res.data, ...res2.data];
        
        requerimientosOptions.value = allReqs.map(r => ({
            id_requerimiento: r.id_requerimiento,
            label: `${r.codigo} - ${r.proveedores?.nombre} - ${r.minas?.nombre}` 
        }));

    } catch (e) {
        console.error('Error loading requerimientos options', e);
    }
};

const handleReqChange = async () => {
    if (!selectedReqId.value) {
        requerimiento.value = null;
        formData.value.detalles = [];
        return;
    }
    await loadRequerimiento(Number(selectedReqId.value));
};

const loadRequerimiento = async (id: number) => {
    loadingReq.value = true;
    try {
        const req = await requerimientosService.getById(id);
        requerimiento.value = req;
        selectedReqId.value = id;
        
        // Inicializar detalles del viaje basados en los items del requerimiento
        formData.value.detalles = req.detalles.map((d: any) => ({
            id_detalle_requerimiento: d.id_detalle,
            producto_nombre: d.producto?.nombre,
            // Intentar obtener medida de la relación anidada
            unidad_medida: d.producto?.medidas?.descripcion || d.producto?.medida?.descripcion || 'UNIDAD',
            cantidad_solicitada: d.cantidad_solicitada,
            cantidad_pendiente: d.cantidad_solicitada - (d.cantidad_entregada || 0),
            cantidad_recibida: 0,
            estado_entrega: 'OK',
            observacion: ''
        })).filter((d: any) => d.cantidad_pendiente > 0); // Solo mostrar pendientes? usually yes
        
    } catch (e) {
        console.error('Error cargando requerimiento', e);
        alert('No se pudo cargar el requerimiento');
        if (idRequerimientoParam) router.back();
    } finally {
        loadingReq.value = false;
        nextTick(() => {
            valeInput.value?.focus();
        });
    }
};

const save = async () => {
    // Validaciones básicas
    if (!selectedReqId.value) return alert('Seleccione un requerimiento');
    

    // Validar que al menos un item tenga cantidad > 0
    const itemsRecibidos = formData.value.detalles.filter(d => d.cantidad_recibida > 0);
    if (itemsRecibidos.length === 0) return alert('Debe registrar la recepción de al menos un item');

    // Validar cantidades excesivas (opcional, warning)
    const excesos = formData.value.detalles.some(d => d.cantidad_recibida > d.cantidad_pendiente);
    if (excesos && !confirm('Algunas cantidades superan lo pendiente. ¿Desea continuar?')) return;

    // Mostrar modal de confirmación
    showConfirmModal.value = true;
};

const executeSave = async () => {
    saving.value = true;
    showConfirmModal.value = false;
    
    try {
        // Recalcular items recibidos por si cambiaron (aunque el modal bloquea edición, es seguro)
        const itemsRecibidos = formData.value.detalles.filter(d => d.cantidad_recibida > 0);
        
        // Validate extra items
        const extraValidados = extraItems.value.filter(e => e.id_producto && e.id_medida && e.cantidad_recibida > 0);

        const payload = {
            id_requerimiento: Number(selectedReqId.value),
            numero_vale: formData.value.numero_vale,
            etiqueta_viaje: formData.value.etiqueta_viaje,
            fecha_ingreso: new Date(formData.value.fecha_ingreso).toISOString(),
            observaciones: formData.value.observaciones,
            detalles: [
                ...itemsRecibidos.map(d => ({
                    es_extra: false,
                    id_detalle_requerimiento: d.id_detalle_requerimiento,
                    cantidad_recibida: Number(d.cantidad_recibida),
                    estado_entrega: d.estado_entrega,
                    observacion: d.observacion
                })),
                ...extraValidados.map(e => ({
                    es_extra: true,
                    id_producto: Number(e.id_producto),
                    id_medida: Number(e.id_medida),
                    cantidad_recibida: Number(e.cantidad_recibida),
                    estado_entrega: e.estado_entrega || 'OK',
                    observacion: e.observacion
                }))
            ]
        };

        const success = await store.createViaje(payload);
        if (success) {
            showSuccessModal.value = true;
        } else {
            alert('Error al guardar el viaje');
        }
    } catch (e) {
        console.error(e);
        alert('Ocurrió un error inesperado');
    } finally {
        saving.value = false;
    }
};

const closeSuccessModal = () => {
    showSuccessModal.value = false;
    router.push('/viajes');
};

onMounted(async () => {
    // Load master data for extra items
    const [prods, meds] = await Promise.all([
        productosService.getAll({ limit: 500 }).catch(() => ({ data: [] })),
        medidasService.getAll().catch(() => [])
    ]);
    allProductos.value = (prods as any).data || [];
    allMedidas.value = Array.isArray(meds) ? meds : [];

    if (idRequerimientoParam) {
        await loadRequerimiento(idRequerimientoParam);
    } else {
        await loadRequerimientosOptions();
    }
});

// Modal state
const showSuccessModal = ref(false);
const showConfirmModal = ref(false);
</script>

<template>
    <div class="viajes-form-view">
        <!-- Hero Header Banner -->
        <header class="viajes-hero-header">
            <div class="hero-left">
                <button class="btn-back-hero" @click="router.back()">
                    <ArrowLeft class="icon" />
                </button>
                <div class="hero-text">
                    <div class="hero-badge"><Truck class="icon-xs" /> Recepción de Material</div>
                    <h1 class="hero-title">Registrar Viaje</h1>
                    <p class="hero-subtitle" v-if="requerimiento">
                        📋 {{ requerimiento.codigo }}
                        <span class="hero-sep">·</span>
                        🏭 {{ requerimiento.proveedor?.nombre }}
                        <span class="hero-sep" v-if="requerimiento.mina">·</span>
                        <span v-if="requerimiento.mina">⛏ {{ requerimiento.mina?.nombre }}</span>
                    </p>
                    <p class="hero-subtitle-placeholder" v-else>Seleccione un requerimiento para continuar</p>
                </div>
            </div>
        </header>

        <div v-if="loadingReq" class="loading-state">
            Cargando datos del requerimiento...
        </div>

        <div v-else class="form-container">
            <!-- Datos del Transporte -->
            <div class="form-section section-transport">
                <div class="section-icon-header">
                    <div class="section-icon-wrap transport-icon">
                        <Truck class="icon-md" />
                    </div>
                    <div>
                        <h3>Datos de Transporte</h3>
                        <p class="section-desc">Información del requerimiento y número de guía</p>
                    </div>
                </div>

                <div class="form-group full-width" style="margin-bottom: 1.5rem;">
                     <label class="field-label">📦 Requerimiento</label>
                     <SearchableSelect 
                         v-model="selectedReqId"
                         :options="requerimientosOptions"
                         label-key="label"
                         value-key="id_requerimiento"
                         placeholder="Buscar requerimiento (Código, Proveedor, Mina)..."
                         :disabled="!!route.params.id_requerimiento"
                         @change="handleReqChange"
                     />
                </div>

                <div class="transport-fields-grid">
                    <div class="form-group">
                        <label class="field-label">🗒 Nro. Vale / Guía</label>
                        <input ref="valeInput" v-model="formData.numero_vale" type="text" class="form-control form-control-enhanced" placeholder="001-000123" @keydown.enter.prevent="handleEnter(0, 'vale')" />
                    </div>
                    <div class="form-group">
                        <label class="field-label">🚛 Nro. Viaje</label>
                        <input
                            ref="etiquetaInput"
                            v-model="formData.etiqueta_viaje"
                            type="text"
                            list="viaje-options"
                            class="form-control form-control-enhanced"
                            placeholder="Ej: 4-VIAJE o escribe..."
                            autocomplete="off"
                            @keydown.enter.prevent="handleEnter(0, 'etiqueta')"
                        />
                        <datalist id="viaje-options">
                            <option v-for="v in etiquetasViajeOptions" :key="v" :value="v" />
                        </datalist>
                    </div>
                    <div class="form-group">
                        <label class="field-label">📅 Fecha de Llegada</label>
                        <input ref="fechaInput" v-model="formData.fecha_ingreso" type="datetime-local" class="form-control form-control-enhanced" @keydown.enter.prevent="handleEnter(0, 'fecha')" />
                    </div>
                    <div class="form-group">
                        <label class="field-label">💬 Observaciones</label>
                        <input ref="obsInput" v-model="formData.observaciones" class="form-control form-control-enhanced" placeholder="Opcional..." @keydown.enter.prevent="handleEnter(0, 'obs')" />
                    </div>
                </div>
            </div>

            <!-- Detalles de Recepción -->
            <div class="form-section section-carga">
                <div class="section-icon-header">
                    <div class="section-icon-wrap carga-icon">
                        <Package class="icon-md" />
                    </div>
                    <div>
                        <h3>Detalle de Carga</h3>
                        <p class="section-desc">Registra las cantidades recibidas por producto</p>
                    </div>
                    <div class="carga-stats" v-if="formData.detalles.length > 0">
                        <div class="stat-chip stat-total">
                            <span class="stat-num">{{ formData.detalles.length }}</span>
                            <span class="stat-lbl">Items</span>
                        </div>
                        <div class="stat-chip stat-recibidos">
                            <span class="stat-num">{{ formData.detalles.filter(d => d.cantidad_recibida > 0).length }}</span>
                            <span class="stat-lbl">Con cantidad</span>
                        </div>
                    </div>
                </div>

                <!-- Desktop: Table -->
                <div class="table-responsive desktop-only">
                    <table class="details-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th class="text-center">Solicitado</th>
                                <th class="text-center">Pendiente</th>
                                <th class="text-center" width="120px">Recibido</th>
                                <th width="140px">Estado</th>
                                <th>Observación Item</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(detalle, index) in formData.detalles" :key="detalle.id_detalle_requerimiento" :class="{ 'row-completed': detalle.cantidad_pendiente <= 0 }">
                                <td>
                                    <div class="product-info">
                                        <Truck class="icon-sm text-gray" />
                                        <div class="flex-col">
                                            <span>{{ detalle.producto_nombre }}</span>
                                            <span class="text-xs text-gray">{{ detalle.unidad_medida }}</span>
                                        </div>
                                    </div>
                                </td>
                                <td class="text-center">{{ detalle.cantidad_solicitada }}</td>
                                <td class="text-center font-bold">{{ detalle.cantidad_pendiente }}</td>
                                <td>
                                    <input 
                                        :ref="(el) => { if (el) recibidoInputsDesktop[index] = el as HTMLInputElement }"
                                        v-model.number="detalle.cantidad_recibida" 
                                        type="number" 
                                        min="0" 
                                        class="form-control text-center"
                                        :class="{ 'bg-blue-50': detalle.cantidad_recibida > 0, 'bg-green-50': detalle.cantidad_pendiente <= 0 }"
                                        :disabled="detalle.cantidad_pendiente <= 0"
                                        @keydown.enter.prevent="handleEnter(index, 'recibido')"
                                    />
                                </td>
                                <td>
                                    <select 
                                        :ref="(el) => { if (el) estadoInputsDesktop[index] = el as HTMLSelectElement }"
                                        v-model="detalle.estado_entrega" 
                                        class="form-control dense" 
                                        :disabled="detalle.cantidad_pendiente <= 0"
                                        @keydown.enter.prevent="handleEnter(index, 'estado')"
                                    >
                                        <option value="OK">Conforme (OK)</option>
                                        <option value="PARCIAL">Parcial</option>
                                        <option value="MUESTRA">Muestra</option>
                                        <option value="DAÑADO">Dañado</option>
                                        <option value="RECHAZADO">Rechazado</option>
                                    </select>
                                </td>
                                <td>
                                    <input 
                                        :ref="(el) => { if (el) obsItemInputsDesktop[index] = el as HTMLInputElement }"
                                        v-model="detalle.observacion" 
                                        type="text" 
                                        class="form-control dense" 
                                        placeholder="..." 
                                        :disabled="detalle.cantidad_pendiente <= 0" 
                                        @keydown.enter.prevent="handleEnter(index, 'obsItem')"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Mobile: Product Cards -->
                <div class="product-cards mobile-only">
                    <div 
                        v-for="(detalle, index) in formData.detalles" 
                        :key="detalle.id_detalle_requerimiento"
                        class="product-card"
                        :class="{ 'card-completed': detalle.cantidad_pendiente <= 0 }">
                        
                        <div class="product-card-header">
                            <Truck class="icon-sm" />
                            <div class="product-name">
                                <strong>{{ detalle.producto_nombre }}</strong>
                                <span class="product-medida">{{ detalle.unidad_medida }}</span>
                            </div>
                        </div>

                        <div class="product-card-body">
                            <!-- Quantities Grid -->
                            <div class="quantities-grid">
                                <div class="quantity-item">
                                    <label>Solicitado</label>
                                    <span class="quantity-value">{{ detalle.cantidad_solicitada }}</span>
                                </div>
                                <div class="quantity-item highlight">
                                    <label>Pendiente</label>
                                    <span class="quantity-value bold">{{ detalle.cantidad_pendiente }}</span>
                                </div>
                            </div>

                            <!-- Received Input -->
                            <div class="form-group-mobile">
                                <label>Cantidad Recibida</label>
                                <input 
                                    v-model.number="detalle.cantidad_recibida" 
                                    type="number" 
                                    min="0" 
                                    class="form-control-mobile"
                                    :class="{ 'input-active': detalle.cantidad_recibida > 0 }"
                                    :disabled="detalle.cantidad_pendiente <= 0"
                                    placeholder="0"
                                    :ref="(el) => { if (el) recibidoInputsMobile[index] = el as HTMLInputElement }"
                                    @keydown.enter.prevent="handleEnter(index, 'recibido')"
                                />
                            </div>

                            <!-- Status Select -->
                            <div class="form-group-mobile">
                                <label>Estado de Entrega</label>
                                <select 
                                    v-model="detalle.estado_entrega" 
                                    class="form-control-mobile" 
                                    :disabled="detalle.cantidad_pendiente <= 0"
                                    :ref="(el) => { if (el) estadoInputsMobile[index] = el as HTMLSelectElement }"
                                    @keydown.enter.prevent="handleEnter(index, 'estado')"
                                >
                                    <option value="OK">✓ Conforme (OK)</option>
                                    <option value="PARCIAL">⚠ Parcial</option>
                                    <option value="MUESTRA">📦 Muestra</option>
                                    <option value="DAÑADO">⚠ Dañado</option>
                                    <option value="RECHAZADO">✗ Rechazado</option>
                                </select>
                            </div>

                            <!-- Observation Input -->
                            <div class="form-group-mobile">
                                <label>Observación</label>
                                <input 
                                    v-model="detalle.observacion" 
                                    type="text" 
                                    class="form-control-mobile" 
                                    placeholder="Notas adicionales..." 
                                    :disabled="detalle.cantidad_pendiente <= 0" 
                                    :ref="(el) => { if (el) obsItemInputsMobile[index] = el as HTMLInputElement }"
                                    @keydown.enter.prevent="handleEnter(index, 'obsItem')"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Productos Extra (No solicitados en el Requerimiento) -->
            <div class="form-section extra-items-section">
                <div class="section-header-flex">
                    <div>
                        <h3>Productos Extra</h3>
                        <p class="section-hint">Registra productos que llegaron pero NO estaban en el requerimiento original.</p>
                    </div>
                    <button type="button" class="btn-add-extra" @click="addExtraItem">
                        <Plus class="icon-xs" /> Agregar Producto Extra
                    </button>
                </div>

                <div v-if="extraItems.length === 0" class="empty-extra-hint">
                    <span>Sin productos extra en este viaje.</span>
                </div>

                <div v-else class="extra-items-list">
                    <div v-for="(item, index) in extraItems" :key="index" class="extra-item-row">
                        <div class="extra-item-fields">
                            <div class="form-group">
                                <label>Producto *</label>
                                <select v-model="item.id_producto" class="form-control">
                                    <option value="">Seleccionar...</option>
                                    <option v-for="p in allProductos" :key="p.id_producto" :value="p.id_producto">
                                        {{ p.nombre }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Medida *</label>
                                <select v-model="item.id_medida" class="form-control">
                                    <option value="">Seleccionar...</option>
                                    <option v-for="m in allMedidas" :key="m.id_medida" :value="m.id_medida">
                                        {{ m.descripcion }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-group form-group-sm">
                                <label>Cantidad *</label>
                                <input v-model.number="item.cantidad_recibida" type="number" min="1" class="form-control" />
                            </div>
                            <div class="form-group">
                                <label>Estado</label>
                                <select v-model="item.estado_entrega" class="form-control">
                                    <option value="OK">✓ Conforme (OK)</option>
                                    <option value="PARCIAL">⚠ Parcial</option>
                                    <option value="MUESTRA">📦 Muestra</option>
                                    <option value="RECHAZADO">✗ Rechazado</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Observación</label>
                                <input v-model="item.observacion" type="text" class="form-control" placeholder="Opcional..." />
                            </div>
                        </div>
                        <button type="button" class="btn-remove-extra" @click="removeExtraItem(index)" title="Eliminar">
                            <Trash2 class="icon-xs" />
                        </button>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="form-actions">
                <button class="btn-secondary" @click="router.back()">Cancelar</button>
                <button ref="saveBtn" class="btn-primary" @click="save" :disabled="saving">
                    <Save class="icon" />
                    {{ saving ? 'Guardando...' : 'Guardar Recepción' }}
                </button>
            </div>

        </div>

        <!-- Confirmation Modal -->
        <FormModal
            v-model:visible="showConfirmModal"
            title="Confirmar Recepción"
            :loading="saving"
            size="lg"
        >
            <div class="confirmation-content">
                <div class="alert-box mb-4">
                    <AlertTriangle class="text-warning icon-md" />
                    <p>Verifique los datos de recepción antes de confirmar.</p>
                </div>

                <div class="summary-grid">
                    <div class="summary-item">
                        <label>Requerimiento:</label>
                        <span>{{ requerimiento?.codigo || '-' }}</span>
                    </div>
                    <div class="summary-item">
                        <label>Proveedor:</label>
                        <span>{{ requerimiento?.proveedor?.nombre || '-' }}</span>
                    </div>
                    <div class="summary-item">
                        <label>Mina:</label>
                        <span>{{ requerimiento?.mina?.nombre || '-' }}</span>
                    </div>
                    <div class="summary-item">
                        <label>N° Vale:</label>
                        <span>{{ formData.numero_vale || '-' }}</span>
                    </div>
                    <div class="summary-item">
                        <label>N° Viaje (Manual):</label>
                        <span>{{ formData.etiqueta_viaje || '-' }}</span>
                    </div>

                    <div class="summary-item full-width">
                        <label>Fecha Recepción:</label>
                        <span>{{ new Date(formData.fecha_ingreso).toLocaleString() }}</span>
                    </div>
                    <div class="summary-item full-width" v-if="formData.observaciones">
                        <label>Observaciones:</label>
                        <span>{{ formData.observaciones }}</span>
                    </div>
                </div>

                <h4 class="mt-4 mb-2">Materiales a Recibir</h4>
                <div class="table-responsive summary-table-container">
                    <table class="details-table summary-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th class="text-center">Cant. Recibida</th>
                                <th>Estado</th>
                                <th>Obs. Item</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="detalle in formData.detalles.filter(d => d.cantidad_recibida > 0)" :key="detalle.id_detalle_requerimiento">
                                <td>
                                    <strong>{{ detalle.producto_nombre }}</strong>
                                    <div class="text-xs text-muted">{{ detalle.unidad_medida }}</div>
                                </td>
                                <td class="text-center font-bold" style="font-size: 1.1em;">
                                    {{ detalle.cantidad_recibida }}
                                </td>
                                <td>
                                    <span class="badge" :class="detalle.estado_entrega.toLowerCase()">
                                        {{ detalle.estado_entrega }}
                                    </span>
                                </td>
                                <td class="text-muted text-sm">{{ detalle.observacion || '-' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <template #footer>
                <button class="btn-secondary" @click="showConfirmModal = false" :disabled="saving">
                    Seguir Editando
                </button>
                <button class="btn-primary" @click="executeSave" :disabled="saving">
                    <Save class="icon" />
                    {{ saving ? 'Guardando...' : 'Confirmar Recepción' }}
                </button>
            </template>
        </FormModal>

        <!-- Success Modal -->
        <div v-if="showSuccessModal" class="modal-overlay">
            <div class="modal-content success-modal">
                <div class="success-icon-wrapper">
                    <Truck class="icon-lg text-success" />
                </div>
                <h3>¡Viaje Registrado!</h3>
                <p>La recepción e ingreso a almacén se han procesado correctamente.</p>
                <div class="modal-actions">
                    <button class="btn-primary full-width-btn" @click="closeSuccessModal">
                        Continuar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import '../../assets/styles/responsive-forms.css';

/* ── Base ────────────────────────────────── */
.viajes-form-view {
    max-width: 1240px;
    margin: 0 auto;
    padding-bottom: 3rem;
}

/* ── Hero Header ─────────────────────────── */
.viajes-hero-header {
    background: linear-gradient(135deg, #1e40af 0%, #4f46e5 60%, #7c3aed 100%);
    border-radius: 1rem;
    padding: 1.75rem 2rem;
    margin-bottom: 1.75rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 8px 30px rgba(79, 70, 229, 0.35);
    position: relative;
    overflow: hidden;
}
.viajes-hero-header::after {
    content: '';
    position: absolute;
    right: -40px;
    top: -40px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
    pointer-events: none;
}

.hero-left {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex: 1;
}

.btn-back-hero {
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.25);
    color: white;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
    flex-shrink: 0;
}
.btn-back-hero:hover {
    background: rgba(255,255,255,0.28);
}

.hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(255,255,255,0.18);
    color: rgba(255,255,255,0.9);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    margin-bottom: 0.4rem;
    border: 1px solid rgba(255,255,255,0.2);
}
.hero-title {
    color: white;
    font-size: 1.75rem;
    font-weight: 800;
    margin: 0 0 0.35rem 0;
    line-height: 1.2;
}
.hero-subtitle {
    color: rgba(255,255,255,0.82);
    margin: 0;
    font-size: 0.88rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
}
.hero-sep { opacity: 0.5; }
.hero-subtitle-placeholder {
    color: rgba(255,255,255,0.55);
    margin: 0;
    font-size: 0.88rem;
    font-style: italic;
}

/* ── Form Container ──────────────────────── */
.form-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* ── Section Cards ───────────────────────── */
.form-section {
    background: white;
    padding: 1.75rem;
    border-radius: 0.875rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
    border: 1px solid #e5e7eb;
    transition: box-shadow 0.2s;
}
.form-section:hover {
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

/* Section Icon Headers */
.section-icon-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding-bottom: 1.25rem;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid #f3f4f6;
}
.section-icon-wrap {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: white;
}
.transport-icon {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}
.carga-icon {
    background: linear-gradient(135deg, #059669, #047857);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);
}
.extra-section-icon {
    background: linear-gradient(135deg, #f57c00, #ef6c00);
    box-shadow: 0 4px 12px rgba(245, 124, 0, 0.35);
}

.section-icon-header h3 {
    margin: 0 0 0.2rem 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #111827;
}
.section-desc {
    margin: 0;
    font-size: 0.8rem;
    color: #6b7280;
}

/* Stats chips for Carga section */
.carga-stats {
    display: flex;
    gap: 0.6rem;
    margin-left: auto;
    align-items: center;
}
.stat-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.4rem 0.85rem;
    border-radius: 8px;
    min-width: 58px;
}
.stat-total {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
}
.stat-recibidos {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
}
.stat-num {
    font-weight: 800;
    font-size: 1.1rem;
    line-height: 1;
    color: #1e40af;
}
.stat-recibidos .stat-num { color: #065f46; }
.stat-lbl {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #6b7280;
    margin-top: 2px;
}

/* ── Transport Fields Grid ───────────────── */
.transport-fields-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.25rem;
}

/* ── Form Group & Label ──────────────────── */
.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}
.field-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

/* ── Form Controls ───────────────────────── */
.form-control {
    padding: 0.5rem 0.75rem;
    border: 1.5px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    background: #fafafa;
    width: 100%;
    box-sizing: border-box;
}
.form-control-enhanced {
    padding: 0.6rem 0.875rem;
    border: 1.5px solid #c7d2fe;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: white;
    transition: border-color 0.2s, box-shadow 0.2s;
}
.form-control:focus,
.form-control-enhanced:focus,
.form-control-mobile:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
    background: white;
}
.form-control.dense {
    padding: 0.375rem 0.5rem;
    font-size: 0.82rem;
}

/* ── Table ───────────────────────────────── */
.table-responsive { overflow-x: auto; border-radius: 0.625rem; }
.details-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}
.details-table th {
    background: linear-gradient(90deg, #1e40af, #4f46e5);
    color: white;
    font-weight: 700;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0.85rem 0.875rem;
    text-align: left;
    border-bottom: none;
}
.details-table th:first-child { border-radius: 0.625rem 0 0 0; }
.details-table th:last-child  { border-radius: 0 0.625rem 0 0; }
.details-table td {
    padding: 0.7rem 0.875rem;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: middle;
}
.details-table tbody tr:hover td {
    background-color: #f8faff;
}
.row-completed td {
    background-color: #fef2f2;
    color: #9f1239;
}
.row-completed .text-gray { color: #be123c; }
.row-completed input,
.row-completed select {
    background: rgba(255,255,255,0.6);
    border-color: #fca5a5;
    color: #9f1239;
}

.product-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.flex-col { display: flex; flex-direction: column; }

/* ── Utility ─────────────────────────────── */
.text-center { text-align: center; }
.text-right  { text-align: right; }
.font-bold   { font-weight: 600; }
.text-gray   { color: #9ca3af; }
.text-xs     { font-size: 0.75rem; }
.text-sm     { font-size: 0.875rem; }
.text-warning { color: #f59e0b; }
.text-muted  { color: #6b7280; }
.text-success { color: #059669; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-4 { margin-top: 1rem; }
.full-width { grid-column: 1 / -1; }

.bg-blue-50 { background: #eff6ff !important; color: #1e40af; }
.bg-green-50 { background: #ecfdf5 !important; cursor: not-allowed; color: #065f46 !important; }

/* ── Buttons ─────────────────────────────── */
.btn-primary, .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.5rem;
    border-radius: 0.625rem;
    font-weight: 600;
    font-size: 0.9rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
}
.btn-primary {
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    color: white;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
}
.btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #4338ca, #4f46e5);
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45);
    transform: translateY(-1px);
}
.btn-primary:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
}
.btn-secondary {
    background: white;
    color: #374151;
    border: 1.5px solid #d1d5db;
}
.btn-secondary:hover {
    background: #f9fafb;
    border-color: #9ca3af;
}
.form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding-top: 0.5rem;
}
.full-width-btn { width: 100%; justify-content: center; }

/* ── Icons ───────────────────────────────── */
.icon    { width: 1.25rem; height: 1.25rem; }
.icon-xs { width: 0.875rem; height: 0.875rem; }
.icon-sm { width: 1rem; height: 1rem; }
.icon-md { width: 1.35rem; height: 1.35rem; }
.icon-lg { width: 3rem; height: 3rem; }

/* ── Loading ─────────────────────────────── */
.loading-state {
    text-align: center;
    padding: 4rem;
    color: #9ca3af;
    font-size: 0.95rem;
}

/* ── Badges ──────────────────────────────── */
.badge {
    display: inline-block;
    padding: 0.25rem 0.6rem;
    border-radius: 5px;
    font-size: 0.72rem;
    font-weight: 700;
}
.badge.ok       { background: #dcfce7; color: #166534; }
.badge.parcial  { background: #fef9c3; color: #854d0e; }
.badge.muestra  { background: #dbeafe; color: #1e40af; }
.badge.dañado   { background: #fee2e2; color: #991b1b; }
.badge.rechazado{ background: #fecaca; color: #7f1d1d; }

.badge-extra {
    display: inline-block;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
    background: #f57c00;
    color: white;
    letter-spacing: 0.04em;
    vertical-align: middle;
    margin-left: 4px;
}

/* ── Modal ───────────────────────────────── */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(3px);
}
.success-modal {
    background: white;
    padding: 2.5rem;
    border-radius: 1rem;
    text-align: center;
    max-width: 420px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.success-icon-wrapper {
    margin-bottom: 1rem;
    display: inline-flex;
    padding: 1rem;
    border-radius: 50%;
    background: #dcfce7;
}
.success-modal h3 { margin: 0 0 0.5rem; font-size: 1.3rem; color: #111827; }
.success-modal p  { color: #6b7280; margin: 0 0 1.5rem; }

/* ── Alert Box ───────────────────────────── */
.alert-box {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #fff7ed;
    border: 1px solid #fed7aa;
    padding: 0.875rem;
    border-radius: 0.625rem;
    color: #9a3412;
}

/* ── Summary (Confirm Modal) ─────────────── */
.summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    background: #f9fafb;
    padding: 1rem;
    border-radius: 0.625rem;
    margin-bottom: 1.5rem;
}
.summary-item { display: flex; flex-direction: column; }
.summary-item.full-width { grid-column: 1 / -1; }
.summary-item label {
    font-size: 0.72rem;
    color: #9ca3af;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.2rem;
}
.summary-item span { font-weight: 600; color: #111827; }
.summary-table-container { border: 1px solid #e5e7eb; border-radius: 0.625rem; overflow: hidden; }
.summary-table th { background: #f3f4f6; font-size: 0.78rem; text-transform: uppercase; }
.summary-table td { padding: 0.7rem; border-bottom: 1px solid #f3f4f6; }

/* ============================================
   MOBILE RESPONSIVE
   ============================================ */

@media (max-width: 900px) {
    .transport-fields-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    .carga-stats { display: none; }
}

@media (max-width: 767px) {
    .viajes-form-view {
        padding: 0;
    }

    .viajes-hero-header {
        border-radius: 0;
        padding: 1.25rem 1rem;
        margin-bottom: 1rem;
    }
    .hero-title { font-size: 1.3rem; }

    .form-container {
        padding: 0;
    }

    .form-section {
        margin-bottom: 1rem;
        border-radius: 0;
        padding: 1rem;
    }

    .section-icon-header {
        flex-wrap: wrap;
    }

    .transport-fields-grid {
        grid-template-columns: 1fr;
        gap: 0.875rem;
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
        min-width: 700px; /* Force horizontal scroll for table */
        font-size: 0.85rem;
    }

    .details-table th,
    .details-table td {
        padding: 0.5rem 0.4rem;
    }

    .details-table select,
    .details-table input {
        font-size: 14px; /* Prevent zoom on iOS */
        min-width: 60px;
    }

    .product-info {
        gap: 4px;
    }

    .product-info .icon-sm {
        width: 14px;
        height: 14px;
    }

    /* Mobile Product Cards */
    .product-cards {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 0;
    }

    .product-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        overflow: hidden;
        border-left: 4px solid var(--primary);
    }

    .product-card.card-completed {
        opacity: 0.6;
        border-left-color: var(--success);
        background: #f0fdf4;
    }

    .product-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px;
        background: var(--background);
        border-bottom: 1px solid var(--border);
    }

    .product-card-header .icon-sm {
        color: var(--primary);
        flex-shrink: 0;
        width: 20px;
        height: 20px;
    }

    .product-name {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
    }

    .product-name strong {
        font-size: 0.95rem;
        color: var(--text);
        line-height: 1.3;
    }

    .product-medida {
        font-size: 0.8rem;
        color: var(--text-muted);
    }

    .product-card-body {
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    /* Quantities Grid */
    .quantities-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }

    .quantity-item {
        background: var(--background);
        padding: 10px;
        border-radius: 8px;
        text-align: center;
    }

    .quantity-item.highlight {
        background: #fef3c7;
        border: 1px solid #f59e0b;
    }

    .quantity-item label {
        display: block;
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-bottom: 4px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .quantity-value {
        display: block;
        font-size: 1.25rem;
        color: var(--text);
        font-weight: 600;
    }

    .quantity-value.bold {
        font-size: 1.5rem;
        color: #f59e0b;
    }

    /* Mobile Form Groups */
    .form-group-mobile {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .form-group-mobile label {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text);
    }

    .form-control-mobile {
        width: 100%;
        padding: 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 16px; /* Prevent iOS zoom */
        background: white;
        transition: all 0.2s;
    }

    .form-control-mobile:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-control-mobile:disabled {
        background: var(--background);
        color: var(--text-muted);
        cursor: not-allowed;
    }

    .form-control-mobile.input-active {
        border-color: var(--primary);
        background: #eff6ff;
    }

    select.form-control-mobile {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        padding-right: 36px;
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

    /* Success modal full-screen on mobile */
    .modal-overlay {
        padding: 1rem;
    }

    .success-modal {
        width: 100%;
        max-width: 100%;
    }

    .success-icon-wrapper svg {
        width: 48px;
        height: 48px;
    }

    .success-modal h2 {
        font-size: 1.3rem;
    }

    .success-modal p {
        font-size: 0.95rem;
    }

    .full-width-btn {
        width: 100%;
    }

    /* Loading state */
    .loading-state {
        padding: 2rem 1rem;
        font-size: 0.95rem;
    }
}

/* Extra Items Section */
.extra-items-section {
    border-top: 2px dashed var(--primary-muted, #c97d7d);
    padding-top: 1.5rem;
}

.section-header-flex {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
}

.section-header-flex h3 {
    margin: 0;
}

.section-hint {
    font-size: 0.85rem;
    color: #888;
    margin: 0.25rem 0 0;
}

.btn-add-extra {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: var(--primary, #8B1E1E);
    color: white;
    border: none;
    border-radius: var(--radius, 6px);
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: opacity 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
}

.btn-add-extra:hover {
    opacity: 0.85;
}

.extra-items-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.extra-item-row {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: var(--radius, 6px);
    padding: 1rem;
}

.extra-item-fields {
    display: grid;
    grid-template-columns: 2fr 1fr 80px 1fr 1.5fr;
    gap: 0.75rem;
    flex: 1;
}

.form-group-sm {
    min-width: 70px;
}

.btn-remove-extra {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    background: transparent;
    border: 1px solid #e0e0e0;
    border-radius: var(--radius, 6px);
    cursor: pointer;
    color: #d32f2f;
    transition: all 0.2s;
    flex-shrink: 0;
}

.btn-remove-extra:hover {
    background: #ffeaea;
    border-color: #d32f2f;
}

.empty-extra-hint {
    text-align: center;
    color: #aaa;
    font-size: 0.875rem;
    padding: 1rem;
    border: 1px dashed #ddd;
    border-radius: var(--radius, 6px);
}

.icon-xs {
    width: 14px;
    height: 14px;
}

@media (max-width: 767px) {
    .extra-item-fields {
        grid-template-columns: 1fr 1fr;
    }

    .extra-item-row {
        flex-direction: column;
        align-items: stretch;
    }

    .btn-remove-extra {
        width: 100%;
        height: 36px;
    }
}
</style>

