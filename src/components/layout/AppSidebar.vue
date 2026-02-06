<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { 
    LayoutDashboard, 
    FileText, 
    Truck, 
    Package, 
    Database, 
    Settings
} from 'lucide-vue-next';

const menuItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Requerimientos', path: '/requirements', icon: FileText },
    { label: 'Viajes', path: '/viajes', icon: Truck },
    { label: 'Inventario', path: '/inventory', icon: Package },
    { label: 'Maestros', path: '/maestros', icon: Database },
];
</script>

<template>
    <aside class="sidebar">
        <div class="sidebar-header">
            <span class="logo">🌲 Madera ERP</span>
        </div>
        
        <nav class="sidebar-nav">
            <ul>
                <li v-for="item in menuItems" :key="item.path">
                    <RouterLink :to="item.path" class="nav-link">
                        <component :is="item.icon" class="icon" />
                        <span>{{ item.label }}</span>
                    </RouterLink>
                </li>
            </ul>
        </nav>

        <div class="sidebar-footer">
            <RouterLink to="/settings" class="nav-link">
                <Settings class="icon" />
                <span>Configuración</span>
            </RouterLink>
        </div>
    </aside>
</template>

<style scoped>
.sidebar {
    width: 260px;
    height: 100vh;
    background-color: var(--secondary);
    color: white;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    /* Fixed position removed to work with Grid layout */
}

.sidebar-header {
    height: 64px;
    display: flex;
    align-items: center;
    padding: 0 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--surface);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.sidebar-nav {
    flex: 1;
    padding: 1.5rem 1rem;
    overflow-y: auto;
}

.sidebar-nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    color: #94a3b8; /* Slate 400 */
    transition: all 0.2s;
    font-weight: 500;
}

.nav-link:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: white;
}

.nav-link.router-link-active {
    background-color: var(--primary);
    color: white;
}

.icon {
    width: 1.25rem;
    height: 1.25rem;
}

.sidebar-footer {
    padding: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
