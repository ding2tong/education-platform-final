<template>
  <div>
    <div v-if="isLoading">
      <p>正在載入單元資料...</p>
    </div>
    <div v-else>
    <h2>{{ isNewLesson ? '新增課程單元' : `編輯單元 - 課程：${courseTitle}` }}</h2>
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
              <label class="form-label">單元內容 (貼上網址或輸入 Markdown)</label>
              <textarea class="form-control content-input" v-model="lesson.content" @paste="handlePaste" rows="10"></textarea>
              <div class="input-helper">
                支援 YouTube 網址、一般網址和 Markdown。
              </div>
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCourseStore } from '@/stores/course';

const route = useRoute();
const router = useRouter();
const courseStore = useCourseStore();

const courseId = route.params.courseId;
const lessonId = route.params.lessonId;
const isNewLesson = computed(() => !lessonId);

const lesson = ref({ title: '', description: '', content: '' });
const courseTitle = ref('');
const error = ref('');
const isLoading = ref(true);

onMounted(async () => {
  await courseStore.fetchCourseDetails(courseId);
  if (courseStore.currentCourse) {
    courseTitle.value = courseStore.currentCourse.title;
  }

  if (!isNewLesson.value) {
    const lessonData = courseStore.currentCourse?.lessons?.find(l => l.id === lessonId);
    if (lessonData) {
      lesson.value = { ...lessonData };
    }
  }
  isLoading.value = false;
});

const handlePaste = (event) => {
  const pastedText = (event.clipboardData || window.clipboardData).getData('text');
  
  // YouTube URL regex
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const youtubeMatch = pastedText.match(youtubeRegex);

  if (youtubeMatch && youtubeMatch[1]) {
    event.preventDefault();
    const videoId = youtubeMatch[1];
    const embedCode = `<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    lesson.value.content = embedCode;
    return;
  }

  // General URL regex
  const urlRegex = /^(https?:\/\/[^\s]+)$/;
  if (urlRegex.test(pastedText)) {
    event.preventDefault();
    const embedCode = `<iframe src="${pastedText}"></iframe>`;
    lesson.value.content = embedCode;
  }
};

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



/* Apply consistent spacing and styles to form elements */

.form-group {

  margin-bottom: var(--space-24);

}



.form-label {

  display: block;

  margin-bottom: var(--space-8);

  font-weight: var(--font-weight-medium);

}



.form-control {

  display: block;

  width: 100%;

  padding: var(--space-8) var(--space-12);

  font-size: var(--font-size-base);

  font-family: var(--font-family-base);

  line-height: 1.5;

  color: var(--color-text);

  background-color: var(--color-surface);

  border: 1px solid var(--color-border);

  border-radius: var(--radius-base);

  transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;

}



.form-control:focus {

  color: var(--color-text);

  background-color: var(--color-surface);

  border-color: var(--color-primary);

  outline: 0;

  box-shadow: 0 0 0 0.25rem var(--color-focus-ring);

}



textarea.form-control {

  min-height: 120px;

}



.content-input {

  min-height: 200px;

  font-family: monospace;

  font-size: 14px;

}



.input-helper {

  font-size: var(--font-size-sm);

  color: var(--color-text-secondary);

  margin-top: var(--space-8);

}

</style>