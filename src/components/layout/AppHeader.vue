<script setup lang="ts">
import { useAuthStore } from '../../stores/auth.store';
import { LogOut, User } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const route = useRoute();

const pageTitle = computed(() => (route.meta.title as string) || 'Panel de Control');

const handleLogout = () => {
    authStore.logout();
};
</script>

<template>
    <header class="header">
        <div class="header-left">
            <!-- Placeholder for Breadcrumbs or Page Title -->
            <h2 class="page-title">{{ pageTitle }}</h2>
        </div>

        <div class="header-right">
            <div class="user-profile">
                <div class="avatar">
                    <User class="icon" />
                </div>
                <div class="user-info">
                    <span class="username">{{ user?.username || 'Usuario' }}</span>
                    <span class="role">{{ user?.rol || 'Rol' }}</span>
                </div>
            </div>
            <button @click="handleLogout" class="logout-btn" title="Cerrar Sesión">
                <LogOut class="icon" />
            </button>
        </div>
    </header>
</template>

<style scoped>
.header {
    height: 64px;
    background-color: white;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    position: sticky;
    top: 0;
    z-index: 90;
}

.page-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text);
    margin: 0;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.user-profile {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.avatar {
    width: 36px;
    height: 36px;
    background-color: var(--background);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--text-light);
}

.user-info {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
}

.username {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text);
}

.role {
    font-size: 0.75rem;
    color: var(--text-light);
}

.logout-btn {
    background: transparent;
    border: none;
    color: var(--text-light);
    padding: 0.5rem;
    border-radius: var(--radius-md);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.logout-btn:hover {
    background-color: #fee2e2;
    color: #ef4444;
}

.icon {
    width: 1.25rem;
    height: 1.25rem;
}
</style>
