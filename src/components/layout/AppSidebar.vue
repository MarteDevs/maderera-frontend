<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
import { computed, inject } from 'vue';
import { 
    LayoutDashboard, 
    FileText, 
    Truck, 
    Package, 
    Database,
    Users,
    Settings,
    X,
    BarChart3,
    Send,
    Hexagon
} from 'lucide-vue-next';


const route = useRoute();

// Inyectar el estado del menú móvil
const mobileMenu = inject<any>('mobileMenu');

// Get user from localStorage
const user = computed(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
});

const isAdmin = computed(() => user.value?.rol === 'ADMIN');

const menuItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Requerimientos', path: '/requirements', icon: FileText },
    { label: 'Viajes', path: '/viajes', icon: Truck },
    { label: 'Despachos', path: '/despachos', icon: Send },
    { label: 'Inventario', path: '/inventory', icon: Package },
    { label: 'Maestros', path: '/maestros', icon: Database },
    { label: 'Reportes', path: '/reportes', icon: BarChart3 },
];

const adminMenuItems = [
    { label: 'Usuarios', path: '/usuarios', icon: Users, adminOnly: true },
];

const isActive = (path: string) => {
    if (path === '/') {
        return route.path === '/';
    }
    return route.path.startsWith(path);
};

// Cerrar menú al hacer clic en un link (solo en móvil)
const handleLinkClick = () => {
    if (mobileMenu?.isMobile.value) {
        mobileMenu?.closeMenu();
    }
};
</script>

<template>
    <!-- Backdrop oscuro para móvil -->
    <div 
        v-if="mobileMenu?.isMobileMenuOpen.value && mobileMenu?.isMobile.value"
        class="sidebar-backdrop"
        @click="mobileMenu?.closeMenu()"
    ></div>

    <!-- Sidebar -->
    <aside 
        class="sidebar" 
        :class="{ 
            'mobile-open': mobileMenu?.isMobileMenuOpen.value,
            'mobile-closed': !mobileMenu?.isMobileMenuOpen.value && mobileMenu?.isMobile.value
        }"
    >
        <!-- Botón cerrar (solo móvil) -->
        <button 
            v-if="mobileMenu?.isMobile.value"
            class="close-sidebar-btn"
            @click="mobileMenu?.closeMenu()"
            aria-label="Cerrar menú"
        >
            <X class="icon" />
        </button>

        <div class="sidebar-header">
            <div class="brand-logo">
                <div class="logo-icon-wrap">
                    <Hexagon class="brand-icon" />
                </div>
                <span class="logo-text">Inventra</span>
            </div>
        </div>
        
        <nav class="sidebar-nav">
            <ul>
                <li v-for="item in menuItems" :key="item.path">
                    <RouterLink 
                        :to="item.path" 
                        class="nav-link"
                        :class="{ 'router-link-active': isActive(item.path) }"
                        @click="handleLinkClick"
                    >
                        <component :is="item.icon" class="icon" />
                        <span>{{ item.label }}</span>
                    </RouterLink>
                </li>
                
                <!-- Admin Section -->
                <template v-if="isAdmin">
                    <li class="section-divider">
                        <span>Administración</span>
                    </li>
                    <li v-for="item in adminMenuItems" :key="item.path">
                        <RouterLink 
                            :to="item.path" 
                            class="nav-link"
                            :class="{ 'router-link-active': isActive(item.path) }"
                            @click="handleLinkClick"
                        >
                            <component :is="item.icon" class="icon" />
                            <span>{{ item.label }}</span>
                        </RouterLink>
                    </li>
                </template>
            </ul>
        </nav>

        <div class="sidebar-footer">
            <RouterLink to="/settings" class="nav-link" @click="handleLinkClick">
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
    position: relative;
}

.sidebar-header {
    height: 80px;
    display: flex;
    align-items: center;
    padding: 0 1.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.brand-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.logo-icon-wrap {
    background: linear-gradient(135deg, var(--primary) 0%, #ff6b6b 100%);
    padding: 0.4rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.brand-icon {
    color: white;
    width: 1.5rem;
    height: 1.5rem;
}

.logo-text {
    font-size: 1.4rem;
    font-weight: 800;
    color: white;
    letter-spacing: -0.03em;
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

.section-divider {
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    padding: 0 1.25rem;
}

.section-divider span {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.4);
}

/* Botón cerrar sidebar (solo móvil) */
.close-sidebar-btn {
    display: none; /* Oculto por defecto */
}

/* Backdrop para móvil */
.sidebar-backdrop {
    display: none; /* Oculto por defecto */
}

/* ============================================
   RESPONSIVE: MOBILE
   ============================================ */

@media (max-width: 767px) {
    .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 1000;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sidebar.mobile-open {
        transform: translateX(0);
    }

    /* Backdrop */
    .sidebar-backdrop {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999;
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    /* Botón cerrar */
    .close-sidebar-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        top: 1.25rem;
        right: 1.25rem;
        width: 36px;
        height: 36px;
        background-color: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: var(--radius-md);
        color: white;
        cursor: pointer;
        transition: all 0.2s;
        z-index: 10;
    }

    .close-sidebar-btn:hover {
        background-color: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
    }

    .close-sidebar-btn .icon {
        width: 1.5rem;
        height: 1.5rem;
    }
}
</style>
