import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import App from './App.vue';
import router from './router';
import './styles/index.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(Toast, {
  position: window.innerWidth < 640 ? 'top-center' : 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  hideProgressBar: false,
});

app.mount('#app');
