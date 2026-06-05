<template>
  <div class="admin-container">
    <header class="admin-header">
      <h1 class="admin-title">管理中心</h1>
      <p class="admin-subtitle">管理學員、課程與系統設定</p>
    </header>

    <div class="admin-tabs-container">
      <div class="admin-tabs card">
        <router-link to="/admin/dashboard" class="tab-btn">
          學員進度總覽
        </router-link>
        <router-link to="/admin/courses" class="tab-btn">
          課程教材管理
        </router-link>
      </div>
    </div>

    <div class="admin-view-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup>
// No logic needed for this layout component
</script>

<style scoped>
.admin-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

.admin-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: 8px;
  color: var(--color-text);
}

.admin-subtitle {
  color: var(--color-text-secondary);
}

.admin-tabs-container {
  display: flex;
  margin-bottom: var(--space-16);
}

.admin-tabs {
  display: flex;
  padding: 6px;
  background-color: var(--color-secondary);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
}

.tab-btn {
  padding: 10px 24px;
  border-radius: var(--radius-full);
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  white-space: nowrap;
}

.tab-btn.router-link-active {
  background-color: white;
  color: var(--color-primary);
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  font-weight: var(--font-weight-bold);
  transform: scale(1.05);
}

.admin-view-content {
  margin-top: var(--space-16);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .admin-tabs {
    width: 100%;
    justify-content: center;
  }
}
</style>
