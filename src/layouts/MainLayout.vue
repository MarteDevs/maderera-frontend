<script setup lang="ts">
import AppSidebar from '../components/layout/AppSidebar.vue';
import AppHeader from '../components/layout/AppHeader.vue';
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
    grid-template-columns: 260px 1fr;
    min-height: 100vh;
}

.main-content-wrapper {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    min-width: 0; /* CRITICAL FIX: Prevens grid blowout */
}

.page-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem 2rem;
    background-color: var(--background);
    width: 100%;
}
</style>
