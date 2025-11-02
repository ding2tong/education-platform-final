<template>
  <div class="page">
    <div class="container">
      <h1>管理後台</h1>
      <div class="admin-nav">
        <router-link to="/admin/dashboard" class="admin-nav-link">總覽儀表板</router-link>
        <router-link to="/admin/courses" class="admin-nav-link">課程管理</router-link>
        <router-link to="/admin/students" class="admin-nav-link">學員清單管理</router-link>
      </div>
      <div class="admin-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-nav {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 24px;
}
.admin-nav-link {
  padding: 12px 16px;
  text-decoration: none;
  color: var(--color-text-secondary);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.admin-nav-link.router-link-exact-active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}
</style>
