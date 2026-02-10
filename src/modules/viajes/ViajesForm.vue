<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useViajesStore } from './viajes.store';
import { requerimientosService, type Requerimiento } from '../requerimientos/requerimientos.service';
import { ArrowLeft, Save, Truck } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const store = useViajesStore();

// State
const requerimiento = ref<Requerimiento | null>(null);
const loadingReq = ref(false);
const saving = ref(false);

const formData = ref({
    placa_vehiculo: '',
    conductor: '',
    observaciones: '',
    fecha_ingreso: new Date().toISOString().slice(0, 16),
    detalles: [] as any[]
});

const idRequerimiento = Number(route.params.id_requerimiento);

// Computed


// Methods
const loadRequerimiento = async () => {
    loadingReq.value = true;
    try {
        const req = await requerimientosService.getById(idRequerimiento);
        requerimiento.value = req;
        
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
        }));
    } catch (e) {
        console.error('Error cargando requerimiento', e);
        alert('No se pudo cargar el requerimiento');
        router.back();
    } finally {
        loadingReq.value = false;
    }
};

const save = async () => {
    // Validaciones básicas
    if (!formData.value.placa_vehiculo) return alert('Ingrese la placa del vehículo');
    if (!formData.value.conductor) return alert('Ingrese el nombre del conductor');
    
    // Validar que al menos un item tenga cantidad > 0
    const itemsRecibidos = formData.value.detalles.filter(d => d.cantidad_recibida > 0);
    if (itemsRecibidos.length === 0) return alert('Debe registrar la recepción de al menos un item');

    // Validar cantidades excesivas (opcional, warning)
    const excesos = formData.value.detalles.some(d => d.cantidad_recibida > d.cantidad_pendiente);
    if (excesos && !confirm('Algunas cantidades superan lo pendiente. ¿Desea continuar?')) return;

    saving.value = true;
    try {
        const payload = {
            id_requerimiento: idRequerimiento,
            placa_vehiculo: formData.value.placa_vehiculo,
            conductor: formData.value.conductor,
            fecha_ingreso: new Date(formData.value.fecha_ingreso).toISOString(),
            observaciones: formData.value.observaciones,
            detalles: itemsRecibidos.map(d => ({
                id_detalle_requerimiento: d.id_detalle_requerimiento,
                cantidad_recibida: Number(d.cantidad_recibida),
                estado_entrega: d.estado_entrega,
                observacion: d.observacion
            }))
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

onMounted(() => {
    if (!idRequerimiento) {
        alert('ID de requerimiento no válido');
        router.push('/requirements');
        return;
    }
    loadRequerimiento();
});

// Modal state
const showSuccessModal = ref(false);
</script>

<template>
    <div class="viajes-form-view">
        <header class="page-header">
            <div class="header-content">
                <div class="title-group">
                    <button class="btn-back" @click="router.back()">
                        <ArrowLeft class="icon" />
                    </button>
                    <div>
                        <h1 class="page-title">Registrar Recepción (Viaje)</h1>
                        <p class="page-subtitle" v-if="requerimiento">
                            Requerimiento #{{ requerimiento.codigo }} - {{ requerimiento.proveedor?.nombre }}
                        </p>
                    </div>
                </div>
                <div class="actions">
                    <button class="btn-secondary" @click="router.back()">Cancelar</button>
                    <button class="btn-primary" @click="save" :disabled="saving">
                        <Save class="icon" />
                        {{ saving ? 'Guardando...' : 'Guardar Recepción' }}
                    </button>
                </div>
            </div>
        </header>

        <div v-if="loadingReq" class="loading-state">
            Cargando datos del requerimiento...
        </div>

        <div v-else class="form-container">
            <!-- Datos del Transporte -->
            <div class="form-section">
                <h3>Datos de Transporte</h3>
                <div class="grid-cols-3">
                    <div class="form-group">
                        <label>Placa Vehículo</label>
                        <input v-model="formData.placa_vehiculo" type="text" class="form-control" placeholder="ABC-123" />
                    </div>
                    <div class="form-group">
                        <label>Conductor</label>
                        <input v-model="formData.conductor" type="text" class="form-control" placeholder="Nombre completo" />
                    </div>
                    <div class="form-group">
                        <label>Fecha Llegada</label>
                        <input v-model="formData.fecha_ingreso" type="datetime-local" class="form-control" />
                    </div>
                </div>
                <div class="form-group full-width">
                    <label>Observaciones del Viaje</label>
                    <textarea v-model="formData.observaciones" class="form-control" rows="2"></textarea>
                </div>
            </div>

            <!-- Detalles de Recepción -->
            <div class="form-section">
                <h3>Detalle de Carga</h3>

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
                            <tr v-for="detalle in formData.detalles" :key="detalle.id_detalle_requerimiento" :class="{ 'row-completed': detalle.cantidad_pendiente <= 0 }">
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
                                        v-model.number="detalle.cantidad_recibida" 
                                        type="number" 
                                        min="0" 
                                        class="form-control text-center"
                                        :class="{ 'bg-blue-50': detalle.cantidad_recibida > 0, 'bg-green-50': detalle.cantidad_pendiente <= 0 }"
                                        :disabled="detalle.cantidad_pendiente <= 0"
                                    />
                                </td>
                                <td>
                                    <select v-model="detalle.estado_entrega" class="form-control dense" :disabled="detalle.cantidad_pendiente <= 0">
                                        <option value="OK">Conforme (OK)</option>
                                        <option value="PARCIAL">Parcial</option>
                                        <option value="MUESTRA">Muestra</option>
                                        <option value="DAÑADO">Dañado</option>
                                        <option value="RECHAZADO">Rechazado</option>
                                    </select>
                                </td>
                                <td>
                                    <input v-model="detalle.observacion" type="text" class="form-control dense" placeholder="..." :disabled="detalle.cantidad_pendiente <= 0" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Mobile: Product Cards -->
                <div class="product-cards mobile-only">
                    <div 
                        v-for="detalle in formData.detalles" 
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
                                />
                            </div>

                            <!-- Status Select -->
                            <div class="form-group-mobile">
                                <label>Estado de Entrega</label>
                                <select 
                                    v-model="detalle.estado_entrega" 
                                    class="form-control-mobile" 
                                    :disabled="detalle.cantidad_pendiente <= 0">
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
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

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

.viajes-form-view {
    max-width: 1200px;
    margin: 0 auto;
}

.page-header {
    margin-bottom: 2rem;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.title-group {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
}

.page-subtitle {
    color: var(--text-light);
    margin: 0;
    font-size: 0.9rem;
}

.btn-back {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text);
    display: flex;
    align-items: center;
    padding: 0.5rem;
    border-radius: 50%;
    transition: background-color 0.2s;
}

.btn-back:hover {
    background-color: var(--bg-light);
}

.actions {
    display: flex;
    gap: 0.75rem;
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
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
}

.form-section h3 {
    margin-top: 0;
    margin-bottom: 1.25rem;
    font-size: 1.1rem;
    color: var(--text);
    border-bottom: 1px solid var(--border-light);
    padding-bottom: 0.75rem;
}

.grid-cols-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    margin-bottom: 1rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.form-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text);
}

.form-control {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    transition: border-color 0.2s;
}

.form-control:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px var(--primary-light);
}

.form-control.dense {
    padding: 0.375rem 0.5rem;
}

.full-width {
    grid-column: 1 / -1;
}

.table-responsive {
    overflow-x: auto;
}

.details-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}

.details-table th,
.details-table td {
    padding: 0.75rem;
    border-bottom: 1px solid var(--border-light);
    text-align: left;
}

.details-table th {
    font-weight: 600;
    color: var(--text-light);
    background-color: var(--bg-light);
}

.product-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.text-center { text-align: center; }
.font-bold { font-weight: 600; }
.text-gray { color: var(--text-light); }
.bg-blue-50 {
    background-color: #eff6ff !important;
    color: var(--plugin-text);
}
.bg-green-50 {
    background-color: #f0fdf4 !important;
    cursor: not-allowed;
    color: #166534 !important;
}

.btn-primary, .btn-secondary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    border-radius: var(--radius-md);
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background-color: var(--primary);
    color: white;
}

.btn-primary:hover {
    background-color: var(--primary-dark);
}

.btn-secondary {
    background-color: white;
    color: var(--text);
    border: 1px solid var(--border);
}

.btn-secondary:hover {
    background-color: var(--bg-light);
}

.icon { width: 1.25rem; height: 1.25rem; }
.icon-sm { width: 1rem; height: 1rem; }
.icon-lg { width: 3rem; height: 3rem; }

.loading-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-light);
}

.flex-col {
    display: flex;
    flex-direction: column;
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
}

.success-modal {
    background: white;
    padding: 2rem;
    border-radius: var(--radius-lg);
    text-align: center;
    max-width: 400px;
    width: 90%;
    box-shadow: var(--shadow-lg);
}

.success-icon-wrapper {
    margin-bottom: 1rem;
    display: inline-flex;
    padding: 1rem;
    border-radius: 50%;
    background-color: #dcfce7;
}

.text-success { color: #166534; }

.success-modal h3 {
    margin: 0 0 0.5rem 0;
    color: var(--text);
    font-size: 1.25rem;
}

.success-modal p {
    color: var(--text-light);
    margin: 0 0 1.5rem 0;
}

.full-width-btn {
    width: 100%;
    justify-content: center;
}

/* New Styles */
.row-completed td {
    background-color: #fee2e2; /* Reddish tone for completed items */
    color: #7f1d1d;
}

.row-completed .text-gray {
    color: #991b1b;
}

.row-completed input,
.row-completed select {
    background-color: rgba(255, 255, 255, 0.5);
    border-color: #fca5a5;
    color: #7f1d1d;
}

/* Enhanced Table Header */
.details-table th {
    background-color: var(--primary);
    color: white;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    border-bottom: none;
}

/* ============================================
   MOBILE RESPONSIVE
   ============================================ */

@media (max-width: 767px) {
    .viajes-form-view {
        padding: 0;
    }

    .page-header {
        padding: 1rem;
        margin-bottom: 1rem;
    }

    .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .title-group {
        width: 100%;
    }

    .title-group h1 {
        font-size: 1.5rem;
    }

    .req-info {
        font-size: 0.85rem;
    }

    .form-container {
        padding: 0;
    }

    .form-section {
        margin-bottom: 1rem;
        border-radius: 0;
        padding: 1rem;
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
</style>
