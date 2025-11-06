<template>
  <div class="page quiz-page">
    <div class="container" v-if="quiz && currentQuestion">
      <div class="quiz-header">
        <h1>{{ quiz.title }}</h1>
        <div class="progress-bar">
          <div class="progress-bar__inner" :style="{ width: `${progressPercentage}%` }"></div>
        </div>
        <p class="progress-text">問題 {{ currentQuestionIndex + 1 }} / {{ quiz.questions.length }}</p>
      </div>

      <div class="quiz-card">
        <div class="quiz-card__question">
          <p>{{ currentQuestion.question }}</p>
        </div>
        <div class="quiz-card__options">
          <div
            v-for="(option, index) in currentQuestion.options"
            :key="index"
            class="option"
            :class="getOptionClass(index)"
            @click="selectAnswer(index)"
          >
            <span class="option__letter">{{ getOptionLabel(index) }}</span>
            <span class="option__text">{{ option }}</span>
          </div>
        </div>
      </div>

      <div class="quiz-footer">
        <div v-if="answerChecked" class="explanation-card" :class="isCorrect ? 'explanation-card--correct' : 'explanation-card--incorrect'">
          <h4>{{ isCorrect ? '答對了！' : '再加強' }}</h4>
          <p>{{ currentQuestion.explanation }}</p>
        </div>
        <button v-if="!answerChecked" @click="checkAnswer" :disabled="selectedAnswer === null" class="btn btn--primary btn--lg">確認答案</button>
        <button v-else @click="nextQuestion" class="btn btn--primary btn--lg">{{ isLastQuestion ? '完成測驗' : '下一題' }}</button>
      </div>

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
const lessonId = route.query.lessonId;

const quiz = ref(null);
const currentQuestionIndex = ref(0);
const selectedAnswer = ref(null);
const answerChecked = ref(false);
const quizAnswers = ref({});

onMounted(async () => {
  if (!courseStore.currentCourse || courseStore.currentCourse.id !== courseId) {
    await courseStore.fetchCourseDetails(courseId);
  }
  
  if (lessonId) {
    const lesson = courseStore.currentCourse?.lessons.find(l => l.id === lessonId);
    quiz.value = lesson?.quiz || null;
  } else {
    quiz.value = courseStore.currentCourse?.quiz || null;
  }
});

const currentQuestion = computed(() => quiz.value?.questions[currentQuestionIndex.value]);
const progressPercentage = computed(() => ((currentQuestionIndex.value) / quiz.value.questions.length) * 100);
const isLastQuestion = computed(() => currentQuestionIndex.value === quiz.value.questions.length - 1);
const isCorrect = computed(() => selectedAnswer.value === currentQuestion.value.correct);

const selectAnswer = (index) => {
  if (!answerChecked.value) {
    selectedAnswer.value = index;
  }
};

const getOptionLabel = (index) => String.fromCharCode(65 + index);

const getOptionClass = (index) => {
  if (!answerChecked.value) {
    return { selected: selectedAnswer.value === index };
  }
  if (index === currentQuestion.value.correct) {
    return { correct: true };
  }
  if (index === selectedAnswer.value && index !== currentQuestion.value.correct) {
    return { incorrect: true };
  }
  return {};
};

const checkAnswer = () => {
  if (selectedAnswer.value === null) return;
  answerChecked.value = true;
  quizAnswers.value[currentQuestion.value.id] = selectedAnswer.value;
};

const nextQuestion = () => {
  if (isLastQuestion.value) {
    submitQuiz();
  } else {
    currentQuestionIndex.value++;
    selectedAnswer.value = null;
    answerChecked.value = false;
  }
};

const submitQuiz = async () => {
  if (!quiz.value) return;
  await authStore.submitQuiz(courseId, quiz.value.id, quizAnswers.value, lessonId);
  router.push({ name: 'quiz-result', params: { courseId: courseId }, query: { lessonId: lessonId } });
};

</script>

<style scoped>
.quiz-page {
  background-color: var(--color-background);
}

.container {
  max-width: 800px;
}

.quiz-header {
  text-align: center;
  margin-bottom: var(--space-32);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--color-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin: var(--space-16) 0 var(--space-8) 0;
}

.progress-bar__inner {
  height: 100%;
  background-color: var(--color-primary);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.quiz-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-24);
  box-shadow: var(--shadow-md);
}

.quiz-card__question p {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--space-24) 0;
}

.quiz-card__options {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.option {
  display: flex;
  align-items: center;
  padding: var(--space-16);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all 0.2s ease;
}

.option:hover {
  border-color: var(--color-primary);
}

.option.selected {
  border-color: var(--color-primary);
  background-color: var(--color-secondary);
}

.option.correct {
  border-color: var(--color-success);
  background-color: #e6f7f3;
  color: var(--color-success);
  font-weight: var(--font-weight-bold);
}

.option.incorrect {
  border-color: var(--color-error);
  background-color: #fff0f0;
  color: var(--color-error);
}

.option__letter {
  font-weight: var(--font-weight-bold);
  margin-right: var(--space-16);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-full);
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.option.selected .option__letter {
  border-color: var(--color-primary);
}

.option.correct .option__letter {
  background-color: var(--color-success);
  color: white;
  border-color: var(--color-success);
}

.option.incorrect .option__letter {
  background-color: var(--color-error);
  color: white;
  border-color: var(--color-error);
}

.quiz-footer {
  margin-top: var(--space-32);
  text-align: center;
}

.explanation-card {
  padding: var(--space-16);
  border-radius: var(--radius-base);
  margin-bottom: var(--space-24);
  text-align: left;
}

.explanation-card--correct {
  background-color: #e6f7f3;
  border-left: 5px solid var(--color-success);
}

.explanation-card--incorrect {
  background-color: #fff0f0;
  border-left: 5px solid var(--color-error);
}

.btn--lg {
  padding: var(--space-16) var(--space-32);
  font-size: var(--font-size-lg);
  min-width: 200px;
}
</style>
