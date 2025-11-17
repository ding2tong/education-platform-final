import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// This must be done after Pinia is installed
const authStore = useAuthStore();

// Wait for Firebase auth to be initialized before mounting the app
authStore.init().then(() => {
  app.mount('#app')
})
