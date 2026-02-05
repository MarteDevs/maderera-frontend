<script setup lang="ts">
import { useAuthStore } from '../../stores/auth.store';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const handleLogout = () => {
    authStore.logout();
};
</script>

<template>
    <div class="dashboard">
        <header class="topbar">
            <h2>Dashboard</h2>
            <div class="user-info">
                <span>Hola, {{ user?.username }}</span>
                <button @click="handleLogout" class="logout-btn">Salir</button>
            </div>
        </header>
        
        <main class="content">
            <div class="welcome-card">
                <h3>Bienvenido al ERP Madera</h3>
                <p>Selecciona una opción del menú para comenzar.</p>
                <!-- KPIs Placeholder -->
            </div>
        </main>
    </div>
</template>

<style scoped>
.dashboard {
    min-height: 100vh;
}

.topbar {
    background: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border);
}

.logout-btn {
    margin-left: 1rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--primary);
    color: var(--primary);
    border-radius: var(--radius-sm);
}

.logout-btn:hover {
    background: var(--primary);
    color: white;
}

.content {
    padding: 2rem;
}

.welcome-card {
    background: white;
    padding: 2rem;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
}
</style>
