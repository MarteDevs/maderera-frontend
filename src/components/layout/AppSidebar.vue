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
    width: 280px;
    height: 100vh;
    background: linear-gradient(180deg, var(--secondary) 0%, #0F172A 100%);
    color: white;
    display: flex;
    flex-direction: column;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
    z-index: 100;
}

.sidebar-header {
    height: 80px;
    display: flex;
    align-items: center;
    padding: 0 1.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.logo {
    font-size: 1.35rem;
    font-weight: 700;
    color: white;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    letter-spacing: -0.02em;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.sidebar-nav {
    flex: 1;
    padding: 2rem 1rem;
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
    gap: 1rem;
    padding: 0.875rem 1.25rem;
    border-radius: var(--radius-md);
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 500;
    font-size: 0.95rem;
    position: relative;
    overflow: hidden;
}

.nav-link:hover {
    background-color: rgba(255, 255, 255, 0.08);
    color: white;
    transform: translateX(4px);
}

.nav-link.router-link-active {
    background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(139, 30, 30, 0.4);
}

.nav-link.router-link-active::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: white;
    border-radius: 0 2px 2px 0;
}

.icon {
    width: 1.25rem;
    height: 1.25rem;
    transition: transform 0.3s;
}

.nav-link:hover .icon {
    transform: scale(1.1);
}

.sidebar-footer {
    padding: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(0, 0, 0, 0.1);
}
</style>
