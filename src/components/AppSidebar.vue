<script setup>
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const uiStore = useUiStore()
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
  <aside class="sidebar" :class="{ 'collapsed': uiStore.sidebarCollapsed }">

    <!-- Toggle Button -->
    <button class="toggle-btn" @click="uiStore.toggleSidebar" :title="uiStore.sidebarCollapsed ? '展開選單' : '收合選單'">
      <span class="toggle-arrow" :class="{ 'flipped': uiStore.sidebarCollapsed }"></span>
    </button>

    <!-- Brand -->
    <div class="sidebar-header">
      <router-link to="/" class="brand-link">
        <div class="brand-logo">J</div>
        <div class="brand-info" v-show="!uiStore.sidebarCollapsed">
          <span class="brand-text">建祥教育</span>
          <span class="brand-tagline">專業藥師成長平台</span>
        </div>
      </router-link>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <router-link
        to="/"
        class="nav-item"
        active-class=""
        exact-active-class="router-link-active"
        :title="uiStore.sidebarCollapsed ? '平台首頁' : ''"
      >
        <span class="nav-dot"></span>
        <span class="nav-text" v-show="!uiStore.sidebarCollapsed">平台首頁</span>
      </router-link>

      <router-link to="/courses" class="nav-item" v-if="authStore.isLoggedIn" :title="uiStore.sidebarCollapsed ? '課程中心' : ''">
        <span class="nav-dot"></span>
        <span class="nav-text" v-show="!uiStore.sidebarCollapsed">課程中心</span>
      </router-link>

      <router-link to="/dashboard" class="nav-item" v-if="authStore.isLoggedIn" :title="uiStore.sidebarCollapsed ? '我的進度' : ''">
        <span class="nav-dot"></span>
        <span class="nav-text" v-show="!uiStore.sidebarCollapsed">我的進度</span>
      </router-link>

      <template v-if="authStore.canManageCourses">
        <div class="nav-divider"></div>
        <router-link to="/admin" class="nav-item admin-nav-item" :title="uiStore.sidebarCollapsed ? '管理後台' : ''">
          <span class="nav-dot admin-dot"></span>
          <span class="nav-text" v-show="!uiStore.sidebarCollapsed">管理後台</span>
        </router-link>
      </template>
    </nav>

    <!-- Footer -->
    <div class="sidebar-footer">
      <template v-if="!authStore.isLoggedIn">
        <button class="btn-login-soft" @click="loginWithGoogle">
          <span v-show="!uiStore.sidebarCollapsed">Google 快速登入</span>
          <span v-show="uiStore.sidebarCollapsed" class="collapsed-login-dot"></span>
        </button>
      </template>
      <template v-else>
        <div class="user-card-mini" :class="{ 'collapsed-user': uiStore.sidebarCollapsed }">
          <div class="user-avatar-small">
            {{ (authStore.currentUser.displayName || 'U')[0].toUpperCase() }}
          </div>
          <div class="user-details" v-show="!uiStore.sidebarCollapsed">
            <span class="user-name-small">{{ authStore.currentUser.displayName }}</span>
            <button class="btn-logout-mini" @click="logout">登出系統</button>
          </div>
        </div>
      </template>
    </div>
  </aside>
</template>

<style scoped>
/* ── Base ── */
.sidebar {
  width: 260px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background-color: white;
  display: flex;
  flex-direction: column;
  padding: var(--space-32) var(--space-20);
  z-index: 100;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.03);
  transition: width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
}

.sidebar.collapsed {
  width: 72px;
  padding: var(--space-32) 12px;
}

/* ── Toggle Button ── */
.toggle-btn {
  position: absolute;
  top: 84px;
  right: -14px;
  width: 28px;
  height: 28px;
  background: white;
  border: 2px solid var(--color-secondary);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.25s ease;
  z-index: 101;
}

.toggle-btn:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.toggle-btn:hover .toggle-arrow {
  border-color: white;
}

.toggle-arrow {
  display: block;
  width: 7px;
  height: 7px;
  border-right: 2px solid var(--color-text-secondary);
  border-bottom: 2px solid var(--color-text-secondary);
  transform: rotate(135deg) translateY(-1px);
  transition: transform 0.3s ease, border-color 0.25s ease;
}

.toggle-arrow.flipped {
  transform: rotate(-45deg) translateY(-1px);
}

/* ── Brand ── */
.sidebar-header {
  margin-bottom: var(--space-40);
  padding: 0 4px;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  overflow: hidden;
}

.brand-logo {
  width: 44px;
  height: 44px;
  min-width: 44px;
  background: var(--color-primary);
  color: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 1.4rem;
  box-shadow: 0 6px 14px rgba(79, 70, 229, 0.25);
}

.brand-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  white-space: nowrap;
}

.brand-text {
  font-weight: var(--font-weight-bold);
  font-size: 1.1rem;
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.brand-tagline {
  font-size: 0.65rem;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

/* ── Nav ── */
.sidebar-nav {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 18px;
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-bold);
  font-size: 0.93rem;
  transition: all 0.25s ease;
  white-space: nowrap;
  overflow: hidden;
}

.nav-item:hover {
  background-color: var(--color-secondary);
  color: var(--color-primary);
  transform: translateX(4px);
}

.nav-item.router-link-active {
  background-color: #EEF0FF;
  color: var(--color-primary);
}

.collapsed .nav-item {
  justify-content: center;
  padding: 12px;
}

.collapsed .nav-item:hover {
  transform: none;
}

/* Nav dot indicator */
.nav-dot {
  width: 8px;
  height: 8px;
  min-width: 8px;
  border-radius: 50%;
  background-color: currentColor;
  opacity: 0.35;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.nav-item.router-link-active .nav-dot {
  opacity: 1;
  transform: scale(1.3);
}

.nav-item:hover .nav-dot {
  opacity: 0.8;
}

.admin-dot {
  background-color: var(--color-primary);
}

.nav-text {
  overflow: hidden;
  white-space: nowrap;
}

.nav-divider {
  height: 1px;
  background: var(--color-secondary);
  margin: 10px 14px;
}

/* ── Footer ── */
.sidebar-footer {
  margin-top: auto;
  padding-top: var(--space-24);
}

.btn-login-soft {
  width: 100%;
  padding: 14px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 18px;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.2);
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-login-soft:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(79, 70, 229, 0.3);
}

.collapsed-login-dot {
  display: block;
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
}

.user-card-mini {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background-color: var(--color-secondary);
  border-radius: 22px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.user-card-mini.collapsed-user {
  justify-content: center;
  padding: 8px;
  background: transparent;
}

.user-avatar-small {
  width: 38px;
  height: 38px;
  min-width: 38px;
  background: white;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: 0.95rem;
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.user-details {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  white-space: nowrap;
}

.user-name-small {
  font-weight: var(--font-weight-bold);
  font-size: 0.82rem;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-logout-mini {
  background: transparent;
  border: none;
  padding: 0;
  text-align: left;
  font-size: 0.72rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-weight: var(--font-weight-bold);
  transition: color 0.2s ease;
}

.btn-logout-mini:hover {
  color: #E53E3E;
}
</style>
