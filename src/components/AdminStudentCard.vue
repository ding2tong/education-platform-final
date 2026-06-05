<template>
  <div class="student-card card-soft" :class="{ 'expanded': isExpanded }">
    <div class="student-card-header" @click="toggleExpand">
      <div class="student-avatar" :style="{ backgroundColor: getAvatarColor(student.fullName || student.displayName) }">
        {{ (student.fullName || student.displayName || 'U')[0].toUpperCase() }}
      </div>
      <div class="student-info">
        <span class="student-name">{{ student.fullName || student.displayName }}</span>
        <span class="student-email">{{ student.email }}</span>
      </div>
      <div class="expand-icon" :class="{ 'rotated': isExpanded }"></div>
    </div>
    
    <div v-if="isExpanded || loading" class="student-card-details">
      <div v-if="loading" class="state-loading">
        <div class="mini-loader"></div>
        <span>正在獲取最新數據...</span>
      </div>
      <div v-else-if="Object.keys(progressData).length > 0" class="progress-list">
        <div v-for="(progress, courseId) in progressData" :key="courseId" class="course-progress-item">
          <div class="course-meta">
            <span class="course-title-small">{{ getCourseById(courseId)?.title || '課程' }}</span>
            <span class="progress-percent-small">{{ calculateProgress(progress, getCourseById(courseId)) }}%</span>
          </div>
          <div class="progress-track-small">
            <div class="progress-fill-small" :style="{ width: calculateProgress(progress, getCourseById(courseId)) + '%' }"></div>
          </div>
        </div>
      </div>
      <div v-else class="state-empty">
        <p>此學員尚無課程進度記錄</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAdminStore } from '@/stores/admin';
import { useCourseStore } from '@/stores/course';

const props = defineProps({
  student: {
    type: Object,
    required: true,
  },
});

const adminStore = useAdminStore();
const courseStore = useCourseStore();

const isExpanded = ref(false);
const loading = ref(false);
const progressData = ref({});

const toggleExpand = async () => {
  isExpanded.value = !isExpanded.value;
  if (isExpanded.value && Object.keys(progressData.value).length === 0) {
    loading.value = true;
    try {
      progressData.value = await adminStore.fetchStudentProgressData(props.student.uid);
    } catch (e) {
      console.error(e);
    } finally {
      loading.value = false;
    }
  }
};

const getCourseById = (courseId) => {
  return courseStore.courses.find(c => c.id === courseId);
};

const calculateProgress = (progress, course) => {
  if (!course) return 0;
  const totalLessons = course.lessons?.length || course.lessonsCount || 0;
  if (totalLessons === 0) return 0;
  const completedCount = progress.completedLessons?.length || 0;
  return Math.round((completedCount / totalLessons) * 100);
};

const getAvatarColor = (name) => {
  const colors = ['#FFD1DC', '#D1E8FF', '#E1FFD1', '#FFF9D1', '#E8D1FF'];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
</script>

<style scoped>
.student-card {
  background: white;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  border: 2px solid transparent;
}

.student-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-secondary);
}

.student-card.expanded {
  transform: scale(1.02);
  z-index: 10;
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

.student-card-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.student-avatar {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: 1.2rem;
  color: rgba(0,0,0,0.3);
  box-shadow: inset 0 -2px 4px rgba(0,0,0,0.05);
}

.student-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.student-name {
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  font-size: 1.05rem;
}

.student-email {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.expand-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
  color: var(--color-text-secondary);
}

.expand-icon::after {
  content: '';
  display: block;
  width: 8px;
  height: 8px;
  border-right: 2.5px solid currentColor;
  border-bottom: 2.5px solid currentColor;
  transform: rotate(45deg) translateY(-2px);
  transition: transform 0.3s ease;
}

.expand-icon.rotated {
  color: var(--color-primary);
}

.expand-icon.rotated::after {
  transform: rotate(225deg) translateY(-2px);
}

.student-card-details {
  padding: 0 20px 20px 20px;
  animation: slideDown 0.3s ease-out;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--color-secondary);
}

.course-progress-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.course-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.course-title-small {
  font-size: 0.85rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.progress-percent-small {
  font-size: 0.8rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.progress-track-small {
  height: 8px;
  background-color: var(--color-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill-small {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.state-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.mini-loader {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-secondary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.state-empty {
  text-align: center;
  padding: 16px 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
