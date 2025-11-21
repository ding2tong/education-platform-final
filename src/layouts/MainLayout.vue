<script setup>
import '@/assets/main.css'; // Import global styles here
import Navbar from '@/components/Navbar.vue'
import ProfileSetupModal from '@/components/ProfileSetupModal.vue'
import EditUserModal from '@/components/EditUserModal.vue' // Import EditUserModal
import GlobalLoadingSpinner from '@/components/GlobalLoadingSpinner.vue';
import GlobalErrorNotification from '@/components/GlobalErrorNotification.vue';
import { useUiStore } from '@/stores/ui' // Import useUiStore

const uiStore = useUiStore()
</script>

<template>
  <div>
    <Navbar />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <ProfileSetupModal v-if="uiStore.showProfileSetupModal" />
    <EditUserModal v-if="uiStore.showEditUserModal" />
    <GlobalLoadingSpinner />
    <GlobalErrorNotification />
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(5px);
}
</style>
