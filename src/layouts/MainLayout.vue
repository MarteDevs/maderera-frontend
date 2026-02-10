<script setup lang="ts">
import { provide } from 'vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import AppHeader from '../components/layout/AppHeader.vue';
import { useMobileMenu } from '../composables/useMobileMenu';

const mobileMenu = useMobileMenu();

// Proveer el estado del menú a componentes hijos
provide('mobileMenu', mobileMenu);
</script>

<template>
    <div class="main-layout">
        <AppSidebar />
        
        <div class="main-content-wrapper">
            <AppHeader />
            
            <main class="page-content">
                <router-view />
            </main>
        </div>
    </div>
</template>

<style scoped>
.main-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    min-height: 100vh;
}

.main-content-wrapper {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    min-width: 0; /* CRITICAL FIX: Prevents grid blowout */
}

.page-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem 2rem;
    background-color: var(--background);
    width: 100%;
}

/* ============================================
   RESPONSIVE: MOBILE & TABLET
   ============================================ */

/* Mobile: Sidebar oculto, solo main content */
@media (max-width: 767px) {
    .main-layout {
        grid-template-columns: 1fr; /* Solo main content */
    }
    
    .page-content {
        padding: 1rem; /* Menos padding en móvil */
    }
}

/* Tablet: Opcional - sidebar colapsable */
@media (min-width: 768px) and (max-width: 1023px) {
    .main-layout {
        grid-template-columns: 280px 1fr; /* Mantener sidebar normal en tablet */
    }
}
</style>
