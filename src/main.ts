import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './assets/styles/main.css'; // Will create this next
import './style.css'; // Vite default, keep or remove later
import App from './App.vue';
import router from './router';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.mount('#app');
