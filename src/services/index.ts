// ============================================
// BARREL EXPORT - SERVICIOS
// ============================================

// Exportar todos los servicios desde un solo punto
export * from './maestros.service';
export * from './precios.service';
export * from './requerimientos.service';
export * from './viajes.service';
export * from './inventario.service';

// Re-exportar el cliente API base
export { default as api } from './api';
