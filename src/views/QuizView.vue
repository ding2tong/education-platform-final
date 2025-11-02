<template>
  <div class="page">
    <div class="container" v-if="quiz">
      <button class="btn btn--outline btn--sm back-btn" @click="$router.push({ name: 'course-detail', params: { id: courseId } })">← 返回單元列表</button>
      <h1>{{ quiz.title }}</h1>
      <div class="quiz-question" v-for="(question, index) in quiz.questions" :key="question.id">
        <h4>問題 {{ index + 1 }}：{{ question.question }}</h4>
        <div class="quiz-options">
          <div
            class="quiz-option"
            v-for="(option, optIndex) in question.options"
            :key="optIndex"
            :class="{ selected: quizAnswers[question.id] === optIndex }"
            @click="selectAnswer(question.id, optIndex)"
          >
            {{ option }}
          </div>
        </div>
      </div>
      <button class="btn btn--primary" @click="submitQuiz" style="margin-top: 24px;">提交測驗</button>
    </div>
    <div class="container" v-else>
      <p>正在載入測驗...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCourseStore } from '@/stores/course';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const courseStore = useCourseStore();
const authStore = useAuthStore();

const courseId = route.params.courseId;
const lessonId = route.query.lessonId; // Check for lessonId in the query
const quizAnswers = ref({});

onMounted(() => {
  if (!courseStore.currentCourse || courseStore.currentCourse.id !== courseId) {
    courseStore.fetchCourseDetails(courseId);
  }
});

const quiz = computed(() => {
  if (!courseStore.currentCourse) return null;
  if (lessonId) {
    // It's a lesson quiz
    const lesson = courseStore.currentCourse.lessons.find(l => l.id === lessonId);
    return lesson?.quiz || null;
  } else {
    // It's a course quiz
    return courseStore.currentCourse.quiz;
  }
});

const selectAnswer = (questionId, optionIndex) => {
  quizAnswers.value[questionId] = optionIndex;
};

const submitQuiz = async () => {
  if (!quiz.value) return;
  await authStore.submitQuiz(courseId, quiz.value.id, quizAnswers.value, lessonId);
  router.push({ name: 'quiz-result', params: { courseId: courseId }, query: { lessonId: lessonId } });
};
</script>