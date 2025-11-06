<template>
  <div class="page">
    <div class="container" v-if="lesson">
      <button class="btn btn--outline btn--sm back-btn" @click="$router.push({ name: 'course-detail', params: { id: courseId } })">← 返回單元列表</button>
      <div class="lesson-content-wrapper">
        <RevealSlides :key="lessonId" :markdown="lesson.content" />
        <div class="section-actions">
          <button class="btn btn--primary" @click="markComplete">標記為完成</button>
          <button class="btn btn--secondary" @click="startQuiz(true)" v-if="lesson.quiz">開始單元測驗</button>
          <button class="btn btn--secondary" @click="startQuiz(false)" v-else-if="lesson.id === 'lesson4'">開始課程總測驗</button>
        </div>
      </div>
    </div>
    <div class="container" v-else>
      <p>正在載入單元資料...</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import RevealSlides from '@/components/RevealSlides.vue';
import { useRoute, useRouter } from 'vue-router';
import { useCourseStore } from '@/stores/course';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const courseStore = useCourseStore();
const authStore = useAuthStore();

const courseId = route.params.courseId;
const lessonId = route.params.lessonId;

onMounted(() => {
  // Ensure the course details, including lessons, are loaded
  if (!courseStore.currentCourse || courseStore.currentCourse.id !== courseId) {
    courseStore.fetchCourseDetails(courseId);
  }
});

const lesson = computed(() => {
  return courseStore.currentCourse?.lessons?.find(l => l.id === lessonId);
});



const markComplete = () => {
  authStore.markLessonComplete(courseId, lessonId);
  alert('已標記為完成！');
};

const startQuiz = (isLessonQuiz) => {
  const params = { courseId: courseId };
  const query = {};
  if (isLessonQuiz) {
    query.lessonId = lessonId;
  }
  router.push({ name: 'quiz', params: params, query: query });
};
</script>

<style scoped>
.back-btn {
  margin-bottom: var(--space-16);
}

.lesson-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-16); /* Reduced gap */
}

.section-actions {
  display: flex;
  gap: var(--space-16);
}
</style>
