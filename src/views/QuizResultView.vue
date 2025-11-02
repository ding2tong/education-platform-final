<template>
  <div class="page active">
    <div class="container">
      <h1>測驗結果</h1>
      <div v-if="latestResult">
        <div class="result-summary">
          <h3>測驗完成</h3>
          <div class="result-score">{{ latestResult.score }} 分</div>
          <p>{{ feedback }}</p>
        </div>
        <div class="result-details">
          <h3>詳細結果</h3>
          <div
            class="result-item"
            v-for="(answer, index) in latestResult.answers"
            :key="index"
            :class="{ correct: answer.isCorrect, incorrect: !answer.isCorrect }"
          >
            <h4>問題 {{ index + 1 }}：{{ answer.question }}</h4>
            <p><strong>您的答案：</strong>{{ answer.userAnswer }}</p>
            <p><strong>正確答案：</strong>{{ answer.correctAnswer }}</p>
            <p style="margin-top: 8px;">{{ answer.explanation }}</p>
          </div>
        </div>
        <button class="btn btn--primary" @click="$router.push({ name: 'course-detail', params: { id: courseId } })">返回單元列表</button>
        <button class="btn btn--outline" @click="$router.push('/dashboard')" style="margin-left: 16px;">返回學習進度</button>
      </div>
      <div v-else>
        <p>沒有可顯示的測驗結果。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const route = useRoute();
const courseId = route.params.courseId;
const lessonId = route.query.lessonId; // Can be undefined

// Ensure user data is loaded, especially on a page refresh
onMounted(() => {
  if (Object.keys(authStore.userProgress).length === 0) {
    authStore.loadUserData();
  }
});

const latestResult = computed(() => {
  const courseProgress = authStore.userProgress[courseId];
  if (!courseProgress || !courseProgress.quizResults || courseProgress.quizResults.length === 0) {
    return null;
  }

  // Filter results based on whether it's a lesson quiz or course quiz
  const relevantResults = courseProgress.quizResults.filter(r => {
    return lessonId ? r.lessonId === lessonId : !r.lessonId;
  });

  return relevantResults.length > 0 ? relevantResults[relevantResults.length - 1] : null;
});

const feedback = computed(() => {
  if (!latestResult.value) return '';
  const score = latestResult.value.score;
  if (score >= 80) {
    return '優秀！您對睡眠健康知識掌握得很好。繼續保持健康的睡眠習慣。';
  } else if (score >= 60) {
    return '不錯！您對睡眠健康有一定的了解。建議重新閱讀課程內容以加深印象。';
  } else {
    return '還需努力！建議您仔細閱讀課程內容，並實踐改善睡眠的建議。';
  }
});
</script>