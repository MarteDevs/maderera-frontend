import { defineStore } from 'pinia';
import api from '../services/api';

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
            try {
                const response = await api.post('/auth/login', { username, password });
                const { accessToken, user } = response.data.data;

                this.token = accessToken;
                this.user = user;

                localStorage.setItem('token', accessToken);
                localStorage.setItem('user', JSON.stringify(user));

                // Configurar header por defecto para futuras llamadas (redundante con interceptor pero seguro)
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

                return true;
            } catch (error) {
                console.error('Login failed', error);
                throw error;
            }
        },
        logout() {
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete api.defaults.headers.common['Authorization'];
            window.location.href = '/login';
        }
    }
});
