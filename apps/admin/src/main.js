import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth.store';
import './styles/index.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(Toast, {
  position: window.innerWidth < 640 ? 'top-center' : 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  hideProgressBar: false,
});

// ─── Auth Expiry Handler ─────────────────────────
// Fired by axios interceptor when token refresh fails or 403 received
window.addEventListener('admin:auth:expired', () => {
  const authStore = useAuthStore();
  authStore.logout();
  if (router.currentRoute.value.path !== '/login') {
    router.push('/login');
  }
});

app.mount('#app');
