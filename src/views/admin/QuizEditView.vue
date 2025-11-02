<template>
  <div>
    <h2>編輯測驗</h2>
    <form @submit.prevent="saveQuiz">
      <div class="card" style="margin-top: 24px;">
        <div class="card__body">
          <div class="form-group">
            <label class="form-label">測驗標題</label>
            <input type="text" class="form-control" v-model="quiz.title" required>
          </div>

          <h3>測驗題目</h3>
          <div v-for="(question, qIndex) in quiz.questions" :key="qIndex" class="card" style="margin-bottom: 16px;">
            <div class="card-header" @click="toggleQuestion(qIndex)">
              <h4>問題 {{ qIndex + 1 }}：{{ question.question || '新問題' }}</h4>
              <span class="collapse-icon">{{ expandedQuestionIndex === qIndex ? '−' : '+' }}</span>
            </div>
            <div class="card__body" v-if="expandedQuestionIndex === qIndex">
              <div class="form-group">
                <label class="form-label">問題 {{ qIndex + 1 }}</label>
                <input type="text" class="form-control" v-model="question.question" required>
              </div>
              <div class="options-section">
                <div class="form-group">
                  <label class="form-label">選項</label>
                </div>
                <div class="options-group">
                  <div v-for="(option, oIndex) in question.options" :key="oIndex" class="form-group form-group--inline">
                    <input type="text" class="form-control" v-model="question.options[oIndex]" required style="flex-grow: 1;">
                    <button type="button" class="remove-option-btn" @click="removeOption(qIndex, oIndex)" v-if="question.options.length > 2">X</button>
                  </div>
                  <button type="button" class="btn btn--sm btn--outline" @click="addOption(qIndex)">新增選項</button>
                </div>
              </div>
              <div class="form-group correct-answer-group">
                <label class="form-label">正確答案</label>
                <select class="form-control" v-model="question.correct" required>
                  <option v-for="(option, oIndex) in question.options" :key="oIndex" :value="oIndex">{{ option }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">解釋 (Markdown)</label>
                <textarea class="form-control" v-model="question.explanation" rows="3"></textarea>
              </div>
              <button type="button" class="btn btn--sm btn--danger" @click="removeQuestion(qIndex)">移除問題</button>
            </div>
          </div>
          <button type="button" class="btn btn--primary" @click="addQuestion">新增問題</button>

          <div class="error-message" v-if="error">{{ error }}</div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn--outline" @click="cancel">取消</button>
        <button type="submit" class="btn btn--primary">儲存測驗</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCourseStore } from '@/stores/course';

const route = useRoute();
const router = useRouter();
const courseStore = useCourseStore();

const courseId = route.params.courseId;
const lessonId = ref(route.params.lessonId);

const quiz = ref({ title: '', questions: [] });
const error = ref('');
const expandedQuestionIndex = ref(null);

onMounted(async () => {
  console.log('QuizEditView mounted');
  console.log('courseId:', courseId);
  console.log('lessonId:', lessonId.value);
  await courseStore.fetchCourseDetails(courseId);
  if (lessonId.value) {
    const lesson = courseStore.currentCourse?.lessons?.find(l => l.id === lessonId.value);
    if (lesson?.quiz) {
      quiz.value = { ...lesson.quiz };
    } else {
      // New unit quiz
      quiz.value.title = `${lesson.title}_單元測驗`;
    }
  } else if (courseStore.currentCourse?.quiz) {
    quiz.value = { ...courseStore.currentCourse.quiz };
  } else {
    // New course quiz
    quiz.value.title = `${courseStore.currentCourse.title}_課程測驗`;
  }
});

const toggleQuestion = (index) => {
  expandedQuestionIndex.value = expandedQuestionIndex.value === index ? null : index;
};

const addQuestion = () => {
  if (!quiz.value.questions) {
    quiz.value.questions = [];
  }
  quiz.value.questions.push({
    id: `q${quiz.value.questions.length + 1}`,
    question: '',
    options: ['', '', '', ''],
    correct: 0,
    explanation: '',
  });
  expandedQuestionIndex.value = quiz.value.questions.length - 1;
};

const removeQuestion = (qIndex) => {
  if (confirm('確定要移除這個問題嗎？')) {
    quiz.value.questions.splice(qIndex, 1);
  }
};

const addOption = (qIndex) => {
  quiz.value.questions[qIndex].options.push('');
};

const removeOption = (qIndex, oIndex) => {
  if (confirm('確定要移除這個選項嗎？')) {
    quiz.value.questions[qIndex].options.splice(oIndex, 1);
  }
};

const saveQuiz = async () => {
  console.log('Saving quiz...');
  console.log('courseId:', courseId);
  console.log('lessonId:', lessonId.value);
  error.value = '';
  if (!quiz.value.title || quiz.value.questions.length === 0) {
    error.value = '測驗標題和題目為必填項';
    return;
  }
  for (const q of quiz.value.questions) {
    if (!q.question || q.options.some(opt => !opt) || q.correct === undefined) {
      error.value = '所有問題、選項和正確答案都必須填寫';
      return;
    }
  }

  try {
    if (lessonId.value) {
      await courseStore.saveLessonQuiz(courseId, lessonId.value, quiz.value);
      router.push({ name: 'admin-lesson-edit', params: { courseId, lessonId: lessonId.value } });
    } else {
      await courseStore.saveCourseQuiz(courseId, quiz.value);
      router.push({ name: 'admin-course-edit', params: { id: courseId } });
    }
  } catch (e) {
    error.value = '儲存測驗失敗，請稍後再試';
    console.error(e);
  }
};

const cancel = () => {
  if (lessonId.value) {
    router.push({ name: 'admin-lesson-edit', params: { courseId, lessonId: lessonId.value } });
  } else {
    router.push({ name: 'admin-course-edit', params: { id: courseId } });
  }
};
</script>

<style scoped>
.form-group--inline {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.form-actions {
  margin-top: var(--space-32);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-16);
}

.options-section {
  margin-left: var(--space-24);
}

.options-group {
  margin-top: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.remove-option-btn {
  background: none;
  border: none;
  color: var(--color-error);
  font-size: var(--font-size-xl);
  cursor: pointer;
  padding: 0 var(--space-8);
}

.remove-option-btn:hover {
  color: var(--color-primary-active);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-16);
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
}

.card-header h4 {
  margin: 0;
}

.collapse-icon {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
}

.correct-answer-group {
  margin-top: var(--space-16);
}
</style>
