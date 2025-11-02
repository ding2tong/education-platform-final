<template>
  <div class="page active">
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
    </div>
    <div class="container" v-else>
      <p>正在載入課程資料...</p>
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
  // This will need to be updated to the new nested route
  router.push({ name: 'lesson', params: { courseId: courseId, lessonId: lessonId } });
};
</script>
