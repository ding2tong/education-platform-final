<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const isMenuOpen = ref(false)

const loginWithGoogle = async () => {
  try {
    await authStore.loginWithGoogle()
    router.push('/courses')
    isMenuOpen.value = false
  } catch (error) {
    console.error(error)
  }
}

const logout = () => {
  authStore.logout()
  router.push('/')
  isMenuOpen.value = false
}

const closeMenu = () => {
  isMenuOpen.value = false
}
</script>

<template>
  <nav class="navbar">
    <div class="nav-container">
      <router-link to="/" class="nav-brand-link" @click="closeMenu">
        <div class="nav-brand">建祥教育訓練平台</div>
      </router-link>

      <button class="hamburger" @click="isMenuOpen = !isMenuOpen" :class="{ 'is-active': isMenuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div class="nav-menu-wrapper" :class="{ 'is-open': isMenuOpen }">
        <div class="nav-menu">
          <router-link to="/" class="nav-link" @click="closeMenu">首頁</router-link>
          <router-link to="/courses" class="nav-link" v-if="authStore.isLoggedIn" @click="closeMenu">課程</router-link>
          <router-link to="/dashboard" class="nav-link" v-if="authStore.isLoggedIn" @click="closeMenu">學習進度</router-link>
          <router-link to="/admin" class="nav-link" v-if="authStore.isAdmin" @click="closeMenu">管理後台</router-link>
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
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 16px 0;
  position: sticky;
  top: 0;
  z-index: 100;
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
  color: inherit;
}

.nav-brand {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.nav-menu-wrapper {
  display: flex;
  align-items: center;
  gap: 24px;
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

.hamburger {
  display: none;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  z-index: 101;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .nav-menu-wrapper {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background-color: var(--color-surface);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 0;
    box-shadow: var(--shadow-md);
    transition: transform 0.3s ease-in-out;
    transform: translateX(100%);
  }

  .nav-menu-wrapper.is-open {
    display: flex;
    transform: translateX(0);
  }

  .nav-menu {
    flex-direction: column;
    text-align: center;
    gap: 32px;
  }

  .nav-link {
    font-size: var(--font-size-xl);
  }

  .nav-actions {
    margin-top: 32px;
  }

  .hamburger {
    display: block;
  }
  
  .hamburger span {
    display: block;
    width: 25px;
    height: 3px;
    margin: 5px 0;
    background-color: var(--color-text);
    transition: all 0.3s ease-in-out;
  }

  .hamburger.is-active span:nth-child(1) {
    transform: translateY(8px) rotate(45deg);
  }
  .hamburger.is-active span:nth-child(2) {
    opacity: 0;
  }
  .hamburger.is-active span:nth-child(3) {
    transform: translateY(-8px) rotate(-45deg);
  }
}
</style>
