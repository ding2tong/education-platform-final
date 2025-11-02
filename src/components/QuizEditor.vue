<template>
  <div class="modal" :class="{ active: uiStore.showQuizEditorModal }" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>編輯測驗</h2>
        <button class="modal-close" @click="closeModal">&times;</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="saveQuiz">
          <div class="form-group">
            <label class="form-label">測驗標題</label>
            <input type="text" class="form-control" v-model="quiz.title" required>
          </div>

          <h3>測驗題目</h3>
          <div v-for="(question, qIndex) in quiz.questions" :key="qIndex" class="card" style="margin-bottom: 16px;">
            <div class="card__body">
              <div class="form-group">
                <label class="form-label">問題 {{ qIndex + 1 }}</label>
                <input type="text" class="form-control" v-model="question.question" required>
              </div>
              <div class="form-group">
                <label class="form-label">選項</label>
                <div v-for="(option, oIndex) in question.options" :key="oIndex" class="form-group form-group--inline">
                  <input type="text" class="form-control" v-model="question.options[oIndex]" required style="flex-grow: 1;">
                  <button type="button" class="btn btn--sm btn--danger" @click="removeOption(qIndex, oIndex)" v-if="question.options.length > 2">移除</button>
                </div>
                <button type="button" class="btn btn--sm btn--outline" @click="addOption(qIndex)">新增選項</button>
              </div>
              <div class="form-group">
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
          <button type="submit" class="btn btn--primary btn--full-width" style="margin-top: 24px;">儲存測驗</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useUiStore } from '@/stores/ui';
import { useCourseStore } from '@/stores/course';

const uiStore = useUiStore();
const courseStore = useCourseStore();

const quiz = ref({
  title: '',
  questions: [],
});

const error = ref('');

// Watch for changes in uiStore.editingQuiz and populate the form
watch(() => uiStore.editingQuiz, (newQuiz) => {
  if (newQuiz) {
    quiz.value = { ...newQuiz };
  } else {
    quiz.value = { title: '', questions: [] };
  }
}, { immediate: true });

const closeModal = () => {
  uiStore.closeQuizEditorModal();
  error.value = '';
};

const addQuestion = () => {
  quiz.value.questions.push({
    id: `q${quiz.value.questions.length + 1}`,
    question: '',
    options: ['', ''],
    correct: 0,
    explanation: '',
  });
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
    const courseId = uiStore.currentEditingCourseId;
    const lessonId = uiStore.editingLessonId;
    if (lessonId) {
      // It's a lesson quiz, we need a new store action for this
      await courseStore.saveLessonQuiz(courseId, lessonId, quiz.value);
    } else {
      // It's a course quiz
      await courseStore.saveCourseQuiz(courseId, quiz.value);
    }
    // Explicitly fetch details to refresh the store before closing the modal
    await courseStore.fetchCourseDetails(courseId);
    closeModal();
  } catch (e) {
    error.value = '儲存測驗失敗，請稍後再試';
    console.error(e);
  }
};
</script>

<style scoped>
.modal.active {
  pointer-events: auto;
}
.modal-content {
  pointer-events: auto;
}
</style>