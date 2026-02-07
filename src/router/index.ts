import { createRouter, createWebHistory } from 'vue-router';
// Import views lazily
const LoginView = () => import('../modules/auth/LoginView.vue');
const MainLayout = () => import('../layouts/MainLayout.vue');
const DashboardView = () => import('../modules/dashboard/DashboardView.vue');
const MaestrosView = () => import('../modules/maestros/MaestrosView.vue');

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: LoginView,
        meta: { guest: true, title: 'Login' }
    },
    {
        path: '/',
        component: MainLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: DashboardView,
                meta: { title: 'Panel de Control' }
            },
            {
                path: 'maestros',
                name: 'Maestros',
                component: MaestrosView,
                meta: { title: 'Maestros' }
            },
            {
                path: 'requirements',
                name: 'Requerimientos',
                component: () => import('../modules/requerimientos/RequerimientosListView.vue'),
                meta: { title: 'Requerimientos' }
            },
            {
                path: 'requirements/new',
                name: 'NuevoRequerimiento',
                component: () => import('../modules/requerimientos/RequerimientosForm.vue'),
                meta: { title: 'Nuevo Requerimiento' }
            },
            {
                path: 'requirements/:id',
                name: 'DetalleRequerimiento',
                component: () => import('../modules/requerimientos/RequerimientosForm.vue'),
                meta: { title: 'Editar Requerimiento' }
            },
            {
                path: 'viajes',
                name: 'Viajes',
                component: () => import('../modules/viajes/ViajesListView.vue'),
                meta: { title: 'Viajes' }
            },
            {
                path: 'viajes/new/:id_requerimiento',
                name: 'NuevoViaje',
                component: () => import('../modules/viajes/ViajesForm.vue'),
                meta: { title: 'Registrar Viaje' }
            },
            {
                path: 'inventory',
                name: 'Inventario',
                component: () => import('../modules/inventario/InventarioView.vue'),
                meta: { title: 'Inventario' }
            },
            {
                path: 'usuarios',
                name: 'Usuarios',
                component: () => import('../modules/usuarios/UsuariosListView.vue'),
                meta: { title: 'Gestión de Usuarios', requiresRole: 'ADMIN' }
            },
            // Future routes will go here
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, _from, next) => {
    const isAuthenticated = !!localStorage.getItem('token');

    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login');
    } else if (to.meta.guest && isAuthenticated) {
        next('/');
    } else {
        next();
    }
});

export default router;
