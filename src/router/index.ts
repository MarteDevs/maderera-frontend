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
        meta: { guest: true }
    },
    {
        path: '/',
        component: MainLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: DashboardView
            },
            {
                path: 'maestros',
                name: 'Maestros',
                component: MaestrosView
            },
            {
                path: 'requirements',
                name: 'Requerimientos',
                component: () => import('../modules/requerimientos/RequerimientosListView.vue')
            },
            {
                path: 'requirements/new',
                name: 'NuevoRequerimiento',
                component: () => import('../modules/requerimientos/RequerimientosForm.vue')
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
