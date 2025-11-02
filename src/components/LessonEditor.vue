<template>
  <div class="modal" :class="{ active: uiStore.showLessonEditorModal }" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ isNewLesson ? '新增課程單元' : '編輯課程單元' }}</h2>
        <button class="modal-close" @click="closeModal">&times;</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="saveLesson">
          <div class="form-group">
            <label class="form-label">單元標題</label>
            <input type="text" class="form-control" v-model="lesson.title" required>
          </div>
          <div class="form-group">
            <label class="form-label">單元描述</label>
            <textarea class="form-control" v-model="lesson.description" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">單元內容 (Markdown)</label>
            <textarea class="form-control" v-model="lesson.content" rows="10"></textarea>
          </div>
          <div class="error-message" v-if="error">{{ error }}</div>
          <hr style="margin: 20px 0;" />
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4>單元小測驗</h4>
            <button type="button" class="btn btn--secondary btn--sm" @click="editLessonQuiz">{{ lesson.quiz ? '編輯測驗' : '新增測驗' }}</button>
          </div>
          <p v-if="lesson.quiz">此單元包含一個小測驗。</p>
          <p v-else>此單元沒有小測驗。</p>
          <hr style="margin: 20px 0;" />
          <button type="submit" class="btn btn--primary btn--full-width">儲存單元</button>
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

const lesson = ref({
  id: '',
  title: '',
  description: '',
  content: '',
});

const isNewLesson = ref(true);
const error = ref('');

// Watch for changes in uiStore.editingLesson and populate the form
watch(() => uiStore.editingLesson, (newLesson) => {
  if (newLesson) {
    lesson.value = { ...newLesson };
    isNewLesson.value = false;
  } else {
    lesson.value = { id: '', title: '', description: '', content: '' };
    isNewLesson.value = true;
  }
}, { immediate: true });

const closeModal = () => {
  uiStore.closeLessonEditorModal();
  error.value = '';
};

const saveLesson = async () => {
  error.value = '';
  if (!lesson.value.title || !lesson.value.content) {
    error.value = '標題和內容為必填項';
    return;
  }

  try {
    const courseId = uiStore.currentEditingCourseId;
    await courseStore.saveLesson(courseId, lesson.value);
    // Explicitly fetch details to refresh the store before closing the modal
    await courseStore.fetchCourseDetails(courseId);
    closeModal();
  } catch (e) {
    error.value = '儲存單元失敗，請稍後再試';
    console.error(e);
  }
};

const editLessonQuiz = () => {
  // This will require a new UI store action and state
  uiStore.openQuizEditorModal(uiStore.currentEditingCourseId, lesson.value.quiz, lesson.value.id);
};
</script>
