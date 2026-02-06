// ============================================
// TIPOS DE MODELOS - MADERA ERP
// ============================================

// ============================================
// MAESTROS
// ============================================

export interface Producto {
    id_producto: number;
    nombre: string;
    id_medida: number;
    id_clasificacion?: number;
    precio_venta_base: number;
    stock_actual: number;
    observaciones?: string;
    medidas?: Medida;
    clasificaciones?: Clasificacion;
    deleted_at?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Proveedor {
    id_proveedor: number;
    nombre: string;
    razon_social?: string;
    ruc?: string;
    contacto?: string;
    telefono?: string;
    deleted_at?: string;
}

export interface Mina {
    id_mina: number;
    nombre: string;
    razon_social?: string;
    ruc?: string;
    ubicacion?: string;
    contacto?: string;
    deleted_at?: string;
}

export interface Supervisor {
    id_supervisor: number;
    nombre: string;
    telefono?: string;
    email?: string;
    deleted_at?: string;
}

export interface Medida {
    id_medida: number;
    descripcion: string;
    largo_mts?: number;
    diametro_min_cm?: number;
    diametro_max_cm?: number;
    deleted_at?: string;
}

export interface Clasificacion {
    id_clasificacion: number;
    nombre: string;
    descripcion?: string;
    activo: boolean;
    deleted_at?: string;
}

export interface ProductoProveedor {
    id_catalogo: number;
    id_proveedor: number;
    id_producto: number;
    precio_compra_sugerido: number;
    fecha_actualizacion?: string;
    activo: boolean;
    productos?: Producto;
    proveedores?: Proveedor;
}

export interface PrecioHistorico {
    id_historico: number;
    id_catalogo: number;
    precio_anterior: number;
    precio_nuevo: number;
    fecha_cambio: string;
    usuario_cambio?: string;
}

// ============================================
// REQUERIMIENTOS
// ============================================

export type EstadoRequerimiento = 'PENDIENTE' | 'PARCIAL' | 'COMPLETADO' | 'ANULADO' | 'RECHAZADO';

export interface Requerimiento {
    id_requerimiento: number;
    codigo: string;
    fecha_emision: string;
    fecha_prometida?: string;
    id_proveedor: number;
    id_mina: number;
    id_supervisor: number;
    estado: EstadoRequerimiento;
    observaciones?: string;
    motivo_anulacion?: string;
    created_at?: string;
    updated_at?: string;
    proveedores?: Proveedor;
    minas?: Mina;
    supervisores?: Supervisor;
    requerimiento_detalles?: RequerimientoDetalle[];
}

export interface RequerimientoDetalle {
    id_detalle: number;
    id_requerimiento: number;
    id_producto: number;
    cantidad_solicitada: number;
    cantidad_entregada: number;
    unidad_medida: string;
    precio_proveedor: number;
    precio_mina: number;
    observacion?: string;
    productos?: Producto;
}

export interface CreateRequerimientoInput {
    id_proveedor: number;
    id_mina: number;
    id_supervisor: number;
    fecha_prometida?: string;
    observaciones?: string;
    detalles: {
        id_producto: number;
        cantidad_solicitada: number;
        precio_proveedor: number;
        precio_mina: number;
        observacion?: string;
    }[];
}

export interface RequerimientoProgress {
    id_requerimiento: number;
    codigo: string;
    estado: EstadoRequerimiento;
    porcentaje_total: number;
    detalles: {
        id_producto: number;
        producto: string;
        solicitado: number;
        entregado: number;
        porcentaje: number;
    }[];
}

// ============================================
// VIAJES
// ============================================

export type EstadoEntrega = 'OK' | 'RECHAZADO' | 'PARCIAL' | 'MUESTRA' | 'DAÑADO';

export interface Viaje {
    id_viaje: number;
    id_requerimiento: number;
    numero_viaje: number;
    fecha_salida?: string;
    fecha_ingreso: string;
    placa_vehiculo?: string;
    conductor?: string;
    observaciones?: string;
    created_at?: string;
    updated_at?: string;
    requerimientos?: Requerimiento;
    viaje_detalles?: ViajeDetalle[];
}

export interface ViajeDetalle {
    id_viaje_detalle: number;
    id_viaje: number;
    id_detalle_requerimiento: number;
    cantidad_recibida: number;
    estado_entrega: EstadoEntrega;
    observacion?: string;
    requerimiento_detalles?: RequerimientoDetalle;
}

export interface CreateViajeInput {
    id_requerimiento: number;
    placa_vehiculo?: string;
    conductor?: string;
    fecha_ingreso?: string;
    observaciones?: string;
    detalles: {
        id_detalle_requerimiento: number;
        cantidad_recibida: number;
        estado_entrega: EstadoEntrega;
        observacion?: string;
    }[];
}

// ============================================
// INVENTARIO
// ============================================

export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE_POS' | 'AJUSTE_NEG' | 'DEVOLUCION' | 'AJUSTE_MANUAL';

export interface Stock {
    id_producto: number;
    producto: string;
    medida: string;
    clasificacion?: string;
    stock_actual: number;
    precio_venta_base: number;
}

export interface MovimientoStock {
    id_movimiento: number;
    id_producto: number;
    tipo: TipoMovimiento;
    cantidad: number;
    fecha: string;
    observacion?: string;
    usuario_registro?: string;
    id_viaje?: number;
    id_requerimiento?: number;
    productos?: Producto;
}

export interface AdjustStockInput {
    id_producto: number;
    cantidad: number;
    tipo_movimiento: TipoMovimiento;
    observaciones: string;
}

// ============================================
// PAGINACIÓN Y RESPUESTAS
// ============================================

export interface PaginatedResponse<T> {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    data: T[];
}

export interface ApiResponse<T> {
    status: 'success' | 'error';
    message?: string;
    data?: T;
}

// ============================================
// FILTROS Y QUERIES
// ============================================

export interface QueryParams {
    page?: number;
    limit?: number;
    search?: string;
    [key: string]: any;
}

export interface RequerimientoFilters extends QueryParams {
    estado?: EstadoRequerimiento;
    id_proveedor?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
}

export interface StockFilters extends QueryParams {
    id_clasificacion?: number;
    id_medida?: number;
    bajo_stock?: boolean;
}

export interface KardexFilters {
    id_producto?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    tipo_movimiento?: TipoMovimiento;
    limit?: number;
}
