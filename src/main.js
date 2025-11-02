import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// This must be done after Pinia is installed
import { useAuthStore } from './stores/auth';
const authStore = useAuthStore();
authStore.init();

app.mount('#app')
