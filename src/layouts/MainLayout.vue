<script setup>
import '@/assets/main.css'; // Import global styles here
import AppSidebar from '@/components/AppSidebar.vue'
import ProfileSetupModal from '@/components/ProfileSetupModal.vue'
import EditUserModal from '@/components/EditUserModal.vue'
import GlobalLoadingSpinner from '@/components/GlobalLoadingSpinner.vue'
import GlobalErrorNotification from '@/components/GlobalErrorNotification.vue'
import { useUiStore } from '@/stores/ui'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const uiStore = useUiStore()
const route = useRoute()

const isFullWidth = computed(() => route.meta?.fullWidth === true)
</script>

<template>
  <div class="app-layout">
    <AppSidebar />
    <main class="main-content" :class="{ 'sidebar-collapsed': uiStore.sidebarCollapsed }">
      <!-- Full-width mode: no padding wrapper (e.g. LessonView) -->
      <template v-if="isFullWidth">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </template>

      <!-- Normal mode: padded content wrapper -->
      <template v-else>
        <div class="content-wrapper">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </template>
    </main>

    <ProfileSetupModal v-if="uiStore.showProfileSetupModal" />
    <EditUserModal v-if="uiStore.showEditUserModal" />
    <GlobalLoadingSpinner />
    <GlobalErrorNotification />
  </div>
</template>

<style>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex-grow: 1;
  margin-left: 260px;
  background-color: var(--color-background);
  transition: margin-left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  min-width: 0;
}

.main-content.sidebar-collapsed {
  margin-left: 72px;
}

.content-wrapper {
  padding: var(--space-32) var(--space-24);
  max-width: var(--container-xl);
  margin: 0 auto;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 72px;
  }
  .content-wrapper {
    padding: var(--space-24) var(--space-16);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
