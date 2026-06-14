<script setup>
defineProps({
  course: {
    type: Object,
    required: true
  },
  statusInfo: {
    type: Object,
    required: true
  },
  bgColor: {
    type: String,
    default: 'var(--color-surface)'
  },
  assignmentInfo: {
    type: Object,
    default: null
  }
});
defineEmits(['action']);
</script>

<template>
  <div class="course-card" :style="{ backgroundColor: bgColor }">
    <div class="course-content">
      <div class="course-main">
        <div v-if="assignmentInfo" class="assignment-badge" :class="{ overdue: assignmentInfo.isOverdue }">
          <span>必修</span>
          <span>{{ assignmentInfo.label }}</span>
        </div>
        <h3 class="course-title">{{ course.title }}</h3>
        <p class="course-description">{{ course.description }}</p>
      </div>
      
      <div class="course-meta">
        <div class="progress-container">
          <div class="progress-info">
            <span class="progress-label">學習進度</span>
            <span class="progress-value">{{ statusInfo.progressPercent }}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: statusInfo.progressPercent + '%' }"></div>
          </div>
        </div>
        
        <div class="actions">
          <button class="btn btn--white" @click="$emit('action', course.id)">
            {{ statusInfo.actionText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.course-card {
  padding: var(--space-24) var(--space-32);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  margin-bottom: var(--space-16);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.course-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: var(--shadow-md);
}

.course-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-32);
}

.course-main {
  flex: 1;
  min-width: 0;
}

.course-title {
  margin: 0 0 var(--space-8) 0;
  color: var(--color-text);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
}

.assignment-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: white;
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-8);
  box-shadow: var(--shadow-sm);
}

.assignment-badge.overdue {
  color: var(--color-error);
}

.course-description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.course-meta {
  display: flex;
  align-items: center;
  gap: var(--space-32);
  width: 350px;
  flex-shrink: 0;
}

.progress-container {
  flex: 1;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-8);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.progress-track {
  height: 10px;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: var(--radius-full);
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
}

.btn--white {
  background-color: white;
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  min-width: 120px;
}

.btn--white:hover {
  background-color: var(--color-primary);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
}

@media (max-width: 992px) {
  .course-meta {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .course-content {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-24);
  }
  .course-meta {
    width: 100%;
  }
  .course-card {
    padding: var(--space-24);
  }
}
</style>
