<template>
  <div class="page">
    <div class="container" v-if="courseStore.currentCourse">
      <button class="btn btn--outline btn--sm back-btn" @click="$router.push('/courses')">← 返回所有課程</button>
      <h1>{{ courseStore.currentCourse.title }}</h1>
      <p>{{ courseStore.currentCourse.description }}</p>
      <hr style="margin: 20px 0;" />
      <h2>課程單元</h2>
      <div class="card" v-for="lesson in courseStore.currentCourse.lessons" :key="lesson.id" style="margin-bottom: 24px;">
        <div class="card__body" style="cursor: pointer;" @click="viewLesson(lesson.id)">
          <h3>{{ lesson.title }}</h3>
          <p>{{ lesson.description }}</p>
          <span class="completion-badge" v-if="authStore.isLessonCompleted(courseId, lesson.id)">✓ 已完成</span>
        </div>
      </div>

      <!-- Add Quiz Button -->
      <div v-if="courseStore.currentCourse.quiz" class="quiz-section">
        <button class="btn btn--primary btn--lg" @click="startCourseQuiz">
          開始課程總測驗
        </button>
      </div>
    </div>
    <!-- Skeleton Loading State -->
    <div class="container" v-else>
      <div class="skeleton skeleton-button" style="width: 120px; margin-bottom: 24px;"></div>
      <div class="skeleton skeleton-title" style="margin-bottom: 16px;"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text" style="width: 80%;"></div>
      <hr style="margin: 20px 0;" />
      <div class="skeleton skeleton-subtitle" style="margin-bottom: 24px;"></div>
      <div class="card" style="margin-bottom: 24px;">
        <div class="card__body">
          <div class="skeleton skeleton-card-title"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
      </div>
      <div class="card" style="margin-bottom: 24px;">
        <div class="card__body">
          <div class="skeleton skeleton-card-title"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCourseStore } from '@/stores/course';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const courseStore = useCourseStore();
const authStore = useAuthStore();
const courseId = route.params.id;

onMounted(() => {
  courseStore.fetchCourseDetails(courseId);
});

const viewLesson = (lessonId) => {
  router.push({ name: 'lesson', params: { courseId: courseId, lessonId: lessonId } });
};

const startCourseQuiz = () => {
  router.push({ name: 'quiz', params: { courseId: courseId } });
};
</script>

<style scoped>
.back-btn {
  margin-bottom: var(--space-16);
}

.completion-badge {
  display: inline-block;
  background-color: var(--color-success);
  color: white;
  padding: 4px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  margin-top: var(--space-12);
}

.quiz-section {
  margin-top: 48px;
  text-align: center;
}

.btn--lg {
  padding: 16px 32px;
  font-size: var(--font-size-lg);
}

/* Skeleton Styles */
.skeleton {
  background-color: #e0e0e0;
  border-radius: var(--radius-base);
  animation: shimmer 1.5s infinite linear;
  background-image: linear-gradient(90deg, #e0e0e0 0px, #f0f0f0 40px, #e0e0e0 80px);
  background-size: 600px;
}

.skeleton-button { height: 32px; }
.skeleton-title { height: 36px; width: 60%; }
.skeleton-subtitle { height: 28px; width: 30%; }
.skeleton-text { height: 16px; margin-top: 8px; }
.skeleton-card-title { height: 24px; width: 70%; margin-bottom: 12px; }

@keyframes shimmer {
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
}
</style>
