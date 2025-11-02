<template>
  <div class="page">
    <div class="container">
      <h1>我的學習進度</h1>
      <div v-if="Object.keys(authStore.userProgress).length > 0" class="progress-list">
        <div v-for="(progress, courseId) in authStore.userProgress" :key="courseId" class="progress-item-card">
          <div class="progress-item-header" @click="toggleExpand(courseId)">
            <div class="course-title">
              <h3>{{ getCourseById(courseId)?.title || '課程載入中...' }}</h3>
              <span v-if="getLatestCourseQuizScore(progress)" class="score-badge">總測驗: {{ getLatestCourseQuizScore(progress) }} 分</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" :style="{ width: calculateProgress(progress, getCourseById(courseId)) + '%' }">
                {{ calculateProgress(progress, getCourseById(courseId)) }}%
              </div>
            </div>
          </div>
          <div v-if="expandedCourseId === courseId" class="progress-item-details">
            <h4>單元詳情</h4>
            <ul>
              <li v-for="lesson in getCourseById(courseId)?.lessons" :key="lesson.id" class="lesson-detail-item">
                <span>
                  <span class="completion-status" :class="{ completed: isLessonCompleted(courseId, lesson.id) }">✓</span>
                  {{ lesson.title }}
                </span>
                <span v-if="getLatestLessonQuizScore(progress, lesson.id)" class="score-badge score-badge--secondary">單元測驗: {{ getLatestLessonQuizScore(progress, lesson.id) }} 分</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <p v-else>您尚未開始任何課程。</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useCourseStore } from '@/stores/course';

const authStore = useAuthStore();
const courseStore = useCourseStore();
const expandedCourseId = ref(null);

onMounted(async () => {
  await authStore.loadUserData();
  await courseStore.fetchAllCourses();
  for (const courseId in authStore.userProgress) {
    if (!courseStore.courses.find(c => c.id === courseId)) {
      await courseStore.fetchCourseDetails(courseId);
    }
  }
});

const getCourseById = (courseId) => {
  return courseStore.courses.find(c => c.id === courseId);
};

const calculateProgress = (progress, course) => {
  if (!course || !course.lessons || course.lessons.length === 0) return 0;
  return Math.round((progress.completedLessons.length / course.lessons.length) * 100);
};

const toggleExpand = (courseId) => {
  expandedCourseId.value = expandedCourseId.value === courseId ? null : courseId;
};

const getLatestCourseQuizScore = (progress) => {
  if (!progress.quizResults || progress.quizResults.length === 0) return null;
  const courseQuizzes = progress.quizResults.filter(r => !r.lessonId);
  return courseQuizzes.length > 0 ? courseQuizzes[courseQuizzes.length - 1].score : null;
};

const getLatestLessonQuizScore = (progress, lessonId) => {
  if (!progress.quizResults || progress.quizResults.length === 0) return null;
  const lessonQuizzes = progress.quizResults.filter(r => r.lessonId === lessonId);
  return lessonQuizzes.length > 0 ? lessonQuizzes[lessonQuizzes.length - 1].score : null;
};

const isLessonCompleted = (courseId, lessonId) => {
  return authStore.userProgress[courseId]?.completedLessons?.includes(lessonId) || false;
};

</script>

<style scoped>
.progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.progress-item-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-card-border);
  transition: box-shadow 0.2s ease;
}
.progress-item-card:hover {
  box-shadow: var(--shadow-sm);
}
.progress-item-header {
  padding: 16px;
  cursor: pointer;
}
.course-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.course-title h3 {
  margin: 0;
}
.progress-item-details {
  padding: 0 16px 16px;
  border-top: 1px solid var(--color-border);
}
.progress-item-details h4 {
  margin-top: 16px;
  margin-bottom: 8px;
}
.lesson-detail-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}
.completion-status {
  color: transparent;
  margin-right: 8px;
}
.completion-status.completed {
  color: var(--color-success);
}
.score-badge--secondary {
  background-color: var(--color-secondary);
  color: var(--color-text);
}
</style>