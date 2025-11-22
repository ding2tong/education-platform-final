<template>
  <div class="student-card">
    <div class="student-card-header" @click="toggleExpand">
      <span>{{ student.fullName || student.displayName }}</span>
      <span class="student-email">{{ student.email }}</span>
    </div>
    <div v-if="isExpanded" class="student-card-details">
      <div v-if="loading">正在載入學員進度...</div>
      <div v-else-if="Object.keys(progressData).length > 0">
        <div v-for="(progress, courseId) in progressData" :key="courseId" class="course-progress-item">
          <strong>{{ getCourseById(courseId)?.title || '課程' }}</strong>
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: calculateProgress(progress, getCourseById(courseId)) + '%' }">
              {{ calculateProgress(progress, getCourseById(courseId)) }}%
            </div>
          </div>
        </div>
      </div>
      <div v-else>該學員尚未開始任何課程。</div>
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
    progressData.value = await adminStore.fetchStudentProgressData(props.student.uid);
    loading.value = false;
  }
};

const getCourseById = (courseId) => {
  return courseStore.courses.find(c => c.id === courseId);
};

const calculateProgress = (progress, course) => {
  if (!course || !course.lessonsCount || course.lessonsCount === 0) return 0;
  const completedCount = progress.completedLessons?.length || 0;
  return Math.round((completedCount / course.lessonsCount) * 100);
};
</script>

<style scoped>
.student-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  margin-bottom: 8px;
}
.student-card-header {
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.student-card-header:hover {
  background-color: var(--color-secondary);
}
.student-email {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
.student-card-details {
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
}
.course-progress-item {
  margin-bottom: 12px;
}
.course-progress-item:last-child {
  margin-bottom: 0;
}
</style>
