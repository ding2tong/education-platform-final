<template>
  <div class="course-list-skeleton">
    <div v-for="i in count" :key="i" class="skeleton-item">
      <div class="skeleton-info">
        <div class="skeleton-title"></div>
        <div class="skeleton-desc"></div>
        <div class="skeleton-progress"></div>
      </div>
      <div class="skeleton-actions">
        <div class="skeleton-badge"></div>
        <div class="skeleton-btn"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 3
  }
});
</script>

<style scoped>
.course-list-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-item {
  display: flex;
  align-items: center;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px 24px;
}

.skeleton-info {
  flex-grow: 1;
  margin-right: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.skeleton-title {
  width: 150px;
  height: 24px;
  background-color: var(--color-surface-secondary);
  border-radius: var(--radius-sm);
  animation: pulse 1.5s infinite;
}

.skeleton-desc {
  flex-grow: 1;
  height: 16px;
  background-color: var(--color-surface-secondary);
  border-radius: var(--radius-sm);
  animation: pulse 1.5s infinite;
}

.skeleton-progress {
  width: 100px;
  height: 16px;
  background-color: var(--color-surface-secondary);
  border-radius: var(--radius-sm);
  margin-left: 16px;
  animation: pulse 1.5s infinite;
}

.skeleton-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.skeleton-badge {
  width: 60px;
  height: 24px;
  background-color: var(--color-surface-secondary);
  border-radius: var(--radius-full);
  animation: pulse 1.5s infinite;
}

.skeleton-btn {
  width: 80px;
  height: 36px;
  background-color: var(--color-surface-secondary);
  border-radius: var(--radius-md);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0.6; }
}
</style>
