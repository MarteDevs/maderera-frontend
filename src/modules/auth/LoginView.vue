<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import { LogIn } from 'lucide-vue-next';

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
    loading.value = true;
    error.value = '';
    try {
        await authStore.login(username.value, password.value);
        router.push('/');
    } catch (e) {
        error.value = 'Credenciales inválidas. Intente nuevamente.';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <h1>Madera ERP</h1>
                <p>Ingreso al Sistema</p>
            </div>
            
            <form @submit.prevent="handleLogin" class="login-form">
                <div class="form-group">
                    <label for="username">Usuario</label>
                    <input 
                        id="username"
                        type="text" 
                        v-model="username" 
                        placeholder="admin" 
                        required 
                        autofocus
                    />
                </div>
                
                <div class="form-group">
                    <label for="password">Contraseña</label>
                    <input 
                        id="password"
                        type="password" 
                        v-model="password" 
                        placeholder="••••••" 
                        required 
                    />
                </div>
                
                <div v-if="error" class="error-msg">
                    {{ error }}
                </div>

                <button type="submit" :disabled="loading" class="btn-primary">
                    <LogIn v-if="!loading" class="icon-sm" />
                    <span v-else>Cargando...</span>
                    {{ loading ? '' : 'Ingresar' }}
                </button>
            </form>
        </div>
    </div>
</template>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: var(--background);
}

.login-card {
    background: var(--surface);
    padding: 2.5rem;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    width: 100%;
    max-width: 400px;
    border: 1px solid var(--border);
}

.login-header {
    text-align: center;
    margin-bottom: 2rem;
}

.login-header h1 {
    color: var(--primary);
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
}

.login-header p {
    color: var(--text-light);
    margin-top: 0.5rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
}

.form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font-size: 1rem;
    transition: border-color 0.2s;
    box-sizing: border-box; /* Fix width overflow */
}

.form-group input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(139, 0, 0, 0.1);
}

.btn-primary {
    width: 100%;
    padding: 0.8rem;
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
    background-color: var(--primary-hover);
}

.btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.error-msg {
    color: #e74c3c;
    background: #fde8e8;
    padding: 0.75rem;
    border-radius: var(--radius-sm);
    margin-bottom: 1rem;
    font-size: 0.9rem;
    text-align: center;
}

.icon-sm {
    width: 1.25rem;
    height: 1.25rem;
}
</style>
