<template>
  <div v-if="uiStore.globalError" class="error-notification">
    <div class="error-content">
      <p>{{ errorMessage }}</p>
      <button @click="uiStore.clearError()" class="close-btn">&times;</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUiStore } from '@/stores/ui';
const uiStore = useUiStore();

const errorMessage = computed(() => {
  if (typeof uiStore.globalError === 'object' && uiStore.globalError.message) {
    return uiStore.globalError.message;
  }
  return uiStore.globalError;
});
</script>

<style scoped>
.error-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: var(--color-error);
  color: white;
  padding: 16px;
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-md);
  z-index: 10000;
  min-width: 250px;
  max-width: 400px;
  animation: slide-in 0.3s ease-out;
}

.error-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-content p {
  margin: 0;
  margin-right: 16px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.7;
}

.close-btn:hover {
  opacity: 1;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
