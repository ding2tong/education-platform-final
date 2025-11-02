<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const loginWithGoogle = async () => {
  try {
    await authStore.loginWithGoogle()
    router.push('/courses')
  } catch (error) {
    console.error(error)
  }
}

const logout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <nav class="navbar">
    <div class="nav-container">
      <router-link to="/" class="nav-brand-link">
        <div class="nav-brand">建祥教育訓練平台</div>
      </router-link>
      <div class="nav-menu">
        <router-link to="/" class="nav-link">首頁</router-link>
        <router-link to="/courses" class="nav-link" v-if="authStore.isLoggedIn">課程</router-link>
        <router-link to="/dashboard" class="nav-link" v-if="authStore.isLoggedIn">學習進度</router-link>
        <router-link to="/admin" class="nav-link" v-if="authStore.isAdmin">管理後台</router-link>
      </div>
      <div class="nav-actions">
        <template v-if="!authStore.isLoggedIn">
          <button class="btn btn--sm btn--primary" @click="loginWithGoogle">使用 Google 登入</button>
        </template>
        <template v-else>
          <div class="user-menu">
            <span>{{ authStore.currentUser.displayName }}</span>
            <button class="btn btn--sm btn--outline" @click="logout">登出</button>
          </div>
        </template>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 16px 0;
}

.nav-container {
  max-width: var(--container-lg);
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.nav-brand-link {
  text-decoration: none;
  color: inherit; /* Inherit color from parent */
}

.nav-brand {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.nav-menu {
  display: flex;
  gap: 24px;
}

.nav-link {
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--color-primary);
}

.nav-link.router-link-exact-active {
  color: var(--color-primary);
}

.nav-actions {
  display: flex;
  align-items: center;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text);
}
</style>
