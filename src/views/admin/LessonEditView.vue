<template>
  <div>
    <div class="lesson-header-actions">
      <h2>{{ pageTitle }}</h2>
    </div>
    <form @submit.prevent="saveLesson" class="lesson-form">
      <div class="lesson-editor-layout">
        <div class="editor-pane">
          <div class="card">
            <div class="card__body">
              <div class="form-group">
                <label class="form-label">單元標題</label>
                <input type="text" class="form-control" v-model="lesson.title" required>
              </div>
              <div class="form-group">
                <label class="form-label">單元描述</label>
                <textarea class="form-control" v-model="lesson.description" rows="1"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">單元內容 (Markdown)</label>
                <div class="prompt-guidance">
                  <strong>圖片提示詞品質基準</strong>
                  <span>每個圖片 Prompt 請包含：風格、光線、主體、場景、構圖、情緒或用途。</span>
                  <code>例：溫暖寫實攝影風格，午後柔和自然光，一位藥師在明亮藥局櫃台前整理保健品，近景構圖，乾淨專業、親切可信。</code>
                </div>
                <textarea
                  ref="markdownEditor"
                  class="form-control markdown-textarea"
                  v-model="lesson.content"
                  @paste="handlePaste"
                  placeholder="使用 --- 分隔投影片。圖片 Prompt 範例：水彩插畫風格，晨間柔光，主體是一盒保健品與量匙，放在乾淨白色桌面，俯視構圖，清爽、安心、適合課程封面。"
                ></textarea>
              </div>
              <div class="error-message" v-if="error">{{ error }}</div>
            </div>
          </div>
        </div>

        <div class="preview-pane">
          <div class="card">
            <div class="card__body">
              <h3>投影片預覽</h3>
              <div v-if="lesson.content" class="aspect-ratio-container">
                <RevealSlides :markdown="lesson.content" @slide-changed="handleSlideChange" />
              </div>
              <p v-else class="text-secondary">在此處輸入 Markdown 內容以預覽投影片。</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card lesson-quiz-card" v-if="!isNewLesson">
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
import RevealSlides from '@/components/RevealSlides.vue';
import { SLIDE_SEPARATOR_REGEX } from '@/utils/markdownSlides';

const route = useRoute();
const router = useRouter();
const courseStore = useCourseStore();

const courseId = route.params.courseId;
const lessonId = route.params.lessonId;
const isNewLesson = computed(() => !lessonId);

const lesson = ref({ title: '', description: '', content: '' });
const error = ref('');
const markdownEditor = ref(null);

const pageTitle = computed(() => {
  const baseTitle = isNewLesson.value ? '新增課程單元' : '編輯課程單元';
  const courseName = courseStore.currentCourse?.title;
  return courseName ? `${baseTitle} ：${courseName}` : baseTitle;
});

onMounted(async () => {
  // Fetch course details regardless of whether it's a new or existing lesson
  // to ensure we have the course name for the title.
  await courseStore.fetchCourseDetails(courseId);

  if (!isNewLesson.value) {
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

const handlePaste = (event) => {
  const pastedText = (event.clipboardData || window.clipboardData).getData('text');
  const urlRegex = /^(https?:\/\/[^\s]+)$/;

  // Check if the pasted text is a plain URL and not already an iframe
  if (urlRegex.test(pastedText) && !pastedText.includes('<iframe')) {
    event.preventDefault();
    const iframeTag = `<iframe src="${pastedText}"></iframe>`;
    
    // Insert the iframe tag at the current cursor position
    const textarea = event.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = lesson.value.content.substring(0, start) + iframeTag + lesson.value.content.substring(end);
    lesson.value.content = newContent;
  }
};

const handleSlideChange = (slideIndex) => {
  if (!markdownEditor.value || !lesson.value.content) return;

  const editor = markdownEditor.value;
  const content = lesson.value.content;
  const separatorRegex = new RegExp(SLIDE_SEPARATOR_REGEX.source, SLIDE_SEPARATOR_REGEX.flags);

  // Find all separator indices
  const separatorIndices = [0]; // The first slide starts at index 0
  let match;
  while ((match = separatorRegex.exec(content)) !== null) {
    separatorIndices.push(match.index);
  }

  if (slideIndex >= separatorIndices.length) return;

  const targetCharIndex = separatorIndices[slideIndex];

  // Set selection to the target position to make it visible
  editor.focus();
  editor.setSelectionRange(targetCharIndex, targetCharIndex);

  // Calculate and set scrollTop
  const lineHeight = parseFloat(getComputedStyle(editor).lineHeight);
  const lines = content.substring(0, targetCharIndex).split('\n').length;
  
  // Scroll the target line to the top of the textarea
  editor.scrollTop = (lines - 1) * lineHeight;
};
</script>

<style scoped>
.lesson-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-24);
  padding: 0 var(--space-24); /* Add padding to align with layout below */
}

.lesson-form {
  display: flex;
  flex-direction: column;
}

.lesson-editor-layout {
  display: flex;
  gap: var(--space-24);
  padding: 0 var(--space-24) var(--space-24);
  align-items: stretch; /* Make panes equal height */
}

.editor-pane,
.preview-pane {
  flex: 1;
  min-width: 0; /* Prevents flexbox overflow */
}

.editor-pane .card,
.preview-pane .card {
  height: 100%; /* Ensure card fills the pane height */
  display: flex;
  flex-direction: column;
}

.editor-pane .card__body,
.preview-pane .card__body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.editor-pane .form-group:last-of-type {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.markdown-textarea {
  flex-grow: 1;
  resize: vertical;
  font-family: monospace;
  min-height: 400px;
}

.prompt-guidance {
  display: grid;
  gap: var(--space-8);
  padding: var(--space-16);
  margin-bottom: var(--space-12);
  background: var(--color-secondary);
  border-radius: var(--radius-base);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.prompt-guidance strong {
  color: var(--color-text);
}

.prompt-guidance code {
  display: block;
  padding: var(--space-12);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  white-space: normal;
  line-height: 1.6;
}

.aspect-ratio-container {
  position: relative;
  width: 100%;
  max-width: 960px; /* Max width for the presentation */
  margin: auto; /* Center horizontally and vertically within flex container */
  height: 0;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  overflow: hidden;
}

.aspect-ratio-container > :deep(.reveal) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.text-secondary {
  color: var(--color-text-secondary);
  text-align: center;
  padding: var(--space-32);
}

.lesson-quiz-card {
  margin: 0 var(--space-24) var(--space-24); /* Align with layout, add bottom margin */
}

.form-actions {
  margin-top: var(--space-32); /* Re-add margin to position at bottom */
  display: flex;
  justify-content: flex-end;
  gap: var(--space-16);
  padding: 0 var(--space-24); /* Add padding to align with layout */
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .lesson-editor-layout {
    flex-direction: column;
  }
  .lesson-header-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-16);
  }
  .form-actions {
    width: 100%;
    justify-content: flex-start;
  }
  .lesson-quiz-card {
    margin: 0 var(--space-24) var(--space-24);
  }
}
</style>
