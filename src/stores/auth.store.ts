import { defineStore } from 'pinia';
import api from '../services/api';
import { useToast } from '../composables/useToast';
import type { User, AuthResponse } from '../types/models';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || null as string | null,
        refreshToken: localStorage.getItem('refreshToken') || null as string | null,
        user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,
    }),
    getters: {
        isAuthenticated: (state) => !!state.token,
    },
    actions: {
        async login(username: string, password: string) {
            const toast = useToast();
            try {
                const response = await api.post<{ data: AuthResponse }>('/auth/login', { username, password });
                const { accessToken, refreshToken, user } = response.data.data;

                this.token = accessToken;
                this.refreshToken = refreshToken;
                this.user = user;

                localStorage.setItem('token', accessToken);
                if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('user', JSON.stringify(user));

                // Configurar header por defecto para futuras llamadas
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

        async refreshAccessToken() {
            if (!this.refreshToken) {
                this.logout();
                return false;
            }

            try {
                // Usamos axios directamente para evitar el interceptor en esta llamada
                const response = await api.post('/auth/refresh', { refreshToken: this.refreshToken });
                const { accessToken } = response.data.data;

                this.token = accessToken;
                localStorage.setItem('token', accessToken);
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                return true;
            } catch (error) {
                console.error('Refresh token failed', error);
                this.logout();
                return false;
            }
        },

        logout() {
            const toast = useToast();
            this.token = null;
            this.refreshToken = null;
            this.user = null;

            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            delete api.defaults.headers.common['Authorization'];

            toast.info('Sesión cerrada');
            window.location.href = '/login';
        }
    }
});
