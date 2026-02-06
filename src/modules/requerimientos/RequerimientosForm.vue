<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useRequerimientosStore } from './requerimientos.store';
import { ArrowLeft, Save, Plus, Trash } from 'lucide-vue-next';
import { 
    minasService, 
    proveedoresService, 
    supervisoresService, 
    productosService 
} from '../../services/maestros.service';
import type { Mina, Proveedor, Supervisor, Producto } from '../../types/models';

const router = useRouter();
const route = useRoute();
const store = useRequerimientosStore();

const isEditing = computed(() => route.params.id !== undefined);
const pageTitle = computed(() => isEditing.value ? 'Editar Requerimiento' : 'Nuevo Requerimiento');

// Estado del formulario
const formData = ref({
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

// Estado UI
const saving = ref(false);

const cargarMaestros = async () => {
    try {
        const [m, p, s, prod] = await Promise.all([
            minasService.getAll({ limit: 100 }), // Traer todos (limit alto)
            proveedoresService.getAll({ limit: 100 }),
            supervisoresService.getAll({ limit: 100 }),
            productosService.getAll({ limit: 1000 })
        ]);
        
        // Asumiendo que devuelven PaginatedResponse o array directo, 
        // maestros.service.ts dice que devuelve PaginatedResponse<T> para getAll con params
        // pero productosService.getAll devuelve response.data.data directo.
        // Vamos a verificar si es array o objeto paginado.
        // Revisando el servicio: return response.data.data; que suele ser { data: [], pagination: {} } O array []
        // Si el backend sigue el estándar json: { status, data: { data: [], pagination... } }
        // Entonces response.data.data es el objeto paginado.
        // Si response.data.data es array, perfecto.
        // Ajustaremos dinámicamente:
        
        minas.value = Array.isArray(m) ? m : (m as any).data || [];
        proveedores.value = Array.isArray(p) ? p : (p as any).data || [];
        supervisores.value = Array.isArray(s) ? s : (s as any).data || [];
        productos.value = Array.isArray(prod) ? prod : (prod as any).data || [];

    } catch (e) {
        console.error('Error cargando maestros:', e);
    }
};

const addDetalle = () => {
    formData.value.detalles.push({
        id_producto: '',
        cantidad_solicitada: 1,
        precio_proveedor: 0,
        precio_mina: 0,
        observacion: ''
    });
};

const removeDetalle = (index: number) => {
    formData.value.detalles.splice(index, 1);
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
                id_producto: Number(d.id_producto)
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
                        <select v-model="formData.id_proveedor" class="form-control">
                            <option value="">Seleccione...</option>
                            <option v-for="m in proveedores" :key="m.id_proveedor" :value="m.id_proveedor">{{ m.nombre }}</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Mina</label>
                        <select v-model="formData.id_mina" class="form-control">
                            <option value="">Seleccione...</option>
                            <option v-for="m in minas" :key="m.id_mina" :value="m.id_mina">{{ m.nombre }}</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Supervisor</label>
                        <select v-model="formData.id_supervisor" class="form-control">
                            <option value="">Seleccione...</option>
                            <option v-for="m in supervisores" :key="m.id_supervisor" :value="m.id_supervisor">{{ m.nombre }}</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Fecha Prometida</label>
                        <input type="date" v-model="formData.fecha_prometida" class="form-control" />
                    </div>
                </div>

                <div class="form-group full-width">
                    <label>Observaciones</label>
                    <textarea v-model="formData.observaciones" class="form-control" rows="2"></textarea>
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
                                    <select v-model="detalle.id_producto" class="form-control dense">
                                        <option value="">Producto...</option>
                                        <option v-for="p in productos" :key="p.id_producto" :value="p.id_producto">{{ p.nombre }}</option>
                                    </select>
                                </td>
                                <td>
                                    <input type="number" v-model="detalle.cantidad_solicitada" class="form-control dense text-right" min="1" />
                                </td>
                                <td>
                                    <input type="number" v-model="detalle.precio_proveedor" class="form-control dense text-right" step="0.01" />
                                </td>
                                <td>
                                    <input type="number" v-model="detalle.precio_mina" class="form-control dense text-right" step="0.01" />
                                </td>
                                <td>
                                    <input type="text" v-model="detalle.observacion" class="form-control dense" />
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
</style>
