<template>
  <div>
    <h2>{{ isNewLesson ? '新增課程單元' : '編輯課程單元' }}</h2>
    <form @submit.prevent="saveLesson">
      <div class="card" style="margin-top: 24px;">
        <div class="card__body">
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
        </div>
      </div>

      <div class="card" style="margin-top: 24px;" v-if="!isNewLesson">
        <div class="card__body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3>單元小測驗</h3>
            <button type="button" class="btn btn--primary btn--sm" @click="editLessonQuiz">編輯測驗</button>
          </div>
          <p v-if="lesson.quiz && lesson.quiz.questions.length > 0">此單元包含一個小測驗。</p>
          <p v-else>此單元沒有小測驗。</p>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn--outline" @click="cancel">取消</button>
        <button type="submit" class="btn btn--primary">儲存單元</button>
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
const lessonId = route.params.lessonId;
const isNewLesson = computed(() => !lessonId);

const lesson = ref({ title: '', description: '', content: '' });
const error = ref('');

onMounted(async () => {
  if (!isNewLesson.value) {
    await courseStore.fetchCourseDetails(courseId);
    const lessonData = courseStore.currentCourse?.lessons?.find(l => l.id === lessonId);
    if (lessonData) {
      lesson.value = { ...lessonData };
    }
  }
});

const saveLesson = async () => {
  error.value = '';
  if (!lesson.value.title || !lesson.value.content) {
    error.value = '標題和內容為必填項';
    return;
  }

  try {
    await courseStore.saveLesson(courseId, lesson.value);
    router.push({ name: 'admin-course-edit', params: { id: courseId } });
  } catch (e) {
    error.value = '儲存單元失敗，請稍後再試';
    console.error(e);
  }
};

const cancel = () => {
  router.push({ name: 'admin-course-edit', params: { id: courseId } });
};

const editLessonQuiz = () => {
  router.push({ name: 'admin-quiz-edit', params: { courseId, lessonId } });
};
</script>

<style scoped>
.form-actions {
  margin-top: var(--space-32);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-16);
}
</style>