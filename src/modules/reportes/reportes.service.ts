
import api from '../../services/api';

export interface KpiData {
    valorInventario: number;
    gastoRequerimientos: number;
    valorDespachado: number;
    cantidadDespachos: number;
    flujoNeto: number;
}

export interface TopMina {
    nombre: string;
    valor: number;
}

export interface TendenciaData {
    periodo: string;
    gastos: number;
    ventas: number;
}

export const reportesService = {
    async getKpis(): Promise<KpiData> {
        const response = await api.get('/reportes/kpis');
        return response.data;
    },

    async getTopMinas(): Promise<TopMina[]> {
        const response = await api.get('/reportes/top-minas');
        return response.data;
    },

    async getTendencia(): Promise<TendenciaData[]> {
        const response = await api.get('/reportes/tendencia');
        return response.data;
    }
};
