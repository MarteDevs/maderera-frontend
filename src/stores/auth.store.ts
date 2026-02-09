import { defineStore } from 'pinia';
import api from '../services/api';
import { useToast } from '../composables/useToast';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || null as string | null,
        user: JSON.parse(localStorage.getItem('user') || 'null') as any | null,
    }),
    getters: {
        isAuthenticated: (state) => !!state.token,
    },
    actions: {
        async login(username: string, password: string) {
            const toast = useToast();
            try {
                const response = await api.post('/auth/login', { username, password });
                const { accessToken, user } = response.data.data;

                this.token = accessToken;
                this.user = user;

                localStorage.setItem('token', accessToken);
                localStorage.setItem('user', JSON.stringify(user));

                // Configurar header por defecto para futuras llamadas (redundante con interceptor pero seguro)
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

                toast.success(`Bienvenido, ${user.nombre || user.username}`);
                return true;
            } catch (error: any) {
                console.error('Login failed', error);
                const msg = error.response?.data?.message || 'Error al iniciar sesión';
                toast.error(msg);
                throw error;
            }
        },
        logout() {
            const toast = useToast();
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete api.defaults.headers.common['Authorization'];

            toast.info('Sesión cerrada correctamente');
            window.location.href = '/login';
        }
    }
});
