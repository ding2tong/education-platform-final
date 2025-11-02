<template>
  <div class="page active">
    <div class="container" v-if="lesson">
      <button class="btn btn--outline btn--sm back-btn" @click="$router.push({ name: 'course-detail', params: { id: courseId } })">← 返回單元列表</button>
      <div class="section-content-detail">
        <h2>{{ lesson.title }}</h2>
        <div v-html="formattedContent"></div>
      </div>
      <div class="section-actions">
        <button class="btn btn--primary" @click="markComplete">標記為完成</button>
        <button class="btn btn--secondary" @click="startQuiz(true)" v-if="lesson.quiz">開始單元測驗</button>
        <button class="btn btn--secondary" @click="startQuiz(false)" v-else-if="lesson.id === 'lesson4'">開始課程總測驗</button>
      </div>
    </div>
    <div class="container" v-else>
      <p>正在載入單元資料...</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
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

const formattedContent = computed(() => {
  if (lesson.value) {
    // Simple markdown to HTML conversion
    return lesson.value.content
      .replace(/^# (.*$)/gim, '<h2>$1</h2>')
      .replace(/^## (.*$)/gim, '<h3>$1</h3>')
      .replace(/^### (.*$)/gim, '<h4>$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.*)$/gim, '<p>$1</p>')
      .replace(/<\/p><p><h/g, '</p><h')
      .replace(/<\/h([2-4])><p>/g, '</h$1>')
      .replace(/<p><li>/g, '<ul><li>')
      .replace(/<\/li><\/p>/g, '</li></ul>');
  }
  return '';
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