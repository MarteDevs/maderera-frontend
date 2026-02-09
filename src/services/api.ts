import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle Errors (e.g., 401)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si el error es 401 y no hemos reintentado aún
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Importar store dinámicamente para evitar dependencias circulares
                const { useAuthStore } = await import('../stores/auth.store');
                const authStore = useAuthStore();

                // Intentar renovar el token
                const success = await authStore.refreshAccessToken();

                if (success) {
                    // Actualizar el header de autorización
                    originalRequest.headers.Authorization = `Bearer ${authStore.token}`;
                    // Reintentar la petición original
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error('Error al renovar sesión', refreshError);
            }

            // Si falla la renovación, limpiar y redirigir
            const { useAuthStore } = await import('../stores/auth.store');
            const authStore = useAuthStore();
            authStore.logout();
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default api;
