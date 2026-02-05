<script setup lang="ts">
// Logic moved to layout
</script>

<template>
    <div class="dashboard-overview">
        <div class="welcome-card">
            <h3>Bienvenido al ERP Madera</h3>
            <p>Selecciona una opción del menú para comenzar.</p>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card">
                <span class="kpi-title">Requerimientos Activos</span>
                <span class="kpi-value">3</span>
            </div>
            <div class="kpi-card">
                <span class="kpi-title">Viajes en Tránsito</span>
                <span class="kpi-value">1</span>
            </div>
            <div class="kpi-card">
                <span class="kpi-title">Stock Eucalipto</span>
                <span class="kpi-value">150 m³</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dashboard-overview {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.welcome-card {
    background: white;
    padding: 1.5rem;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
}

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
}

.kpi-card {
    background: white;
    padding: 1.5rem;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.kpi-title {
    color: var(--text-light);
    font-size: 0.9rem;
    font-weight: 500;
}

.kpi-value {
    color: var(--primary);
    font-size: 2rem;
    font-weight: 700;
}
</style>
