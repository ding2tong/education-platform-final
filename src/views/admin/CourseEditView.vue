<template>
  <div>
    <h2>{{ isNewCourse ? '新增課程' : '編輯課程' }}</h2>
    <form @submit.prevent="saveCourse">
      <div class="card" style="margin-top: 24px;">
        <div class="card__body">
          <div class="form-group">
            <label class="form-label">課程標題</label>
            <input type="text" class="form-control" v-model="course.title" required>
          </div>
          <div class="form-group">
            <label class="form-label">課程描述</label>
            <textarea class="form-control" v-model="course.description" rows="3"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">課程分類</label>
              <select class="form-control" v-model="course.category" required>
                <option disabled value="">請選擇分類</option>
                <option>教育訓練</option>
                <option>商品教育</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">上架狀態</label>
              <select class="form-control" v-model="course.published">
                <option :value="true">已上架</option>
                <option :value="false">草稿</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Lesson Management Section -->
      <div class="card" style="margin-top: 24px;" v-if="!isNewCourse">
        <div class="card__body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3>課程單元管理</h3>
            <button type="button" class="btn btn--primary btn--sm" @click="addLesson">新增單元</button>
          </div>
          <draggable v-model="localLessons" item-key="id" handle=".drag-handle" @end="onLessonDragEnd">
            <template #item="{element, index}">
              <div class="lesson-item">
                <div class="drag-handle">&#9776;</div>
                <span>{{ index + 1 }}. {{ element.title }}</span>
                <div class="lesson-actions">
                  <button type="button" class="btn btn--sm btn--outline" @click="editLesson(element.id)">編輯</button>
                  <button type="button" class="btn btn--sm btn--danger" @click="deleteLesson(element.id)">刪除</button>
                </div>
              </div>
            </template>
          </draggable>
          <p v-if="localLessons.length === 0">目前沒有課程單元。</p>
        </div>
      </div>

      <!-- Quiz Management Section -->
      <div class="card" style="margin-top: 24px;" v-if="!isNewCourse">
        <div class="card__body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3>測驗內容管理</h3>
            <button type="button" class="btn btn--primary btn--sm" @click="editQuiz">編輯測驗</button>
          </div>
          <div v-if="quiz && quiz.questions.length > 0">
            <div v-for="(question, index) in quiz.questions" :key="question.id" class="lesson-item">
              <span>問題 {{ index + 1 }}. {{ question.question }}</span>
            </div>
          </div>
          <p v-else>目前沒有測驗題目。</p>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn--outline" @click="$router.push({ name: 'admin-courses' })">取消</button>
        <button type="submit" class="btn btn--primary">儲存課程</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCourseStore } from '@/stores/course';
import draggable from 'vuedraggable';

const route = useRoute();
const router = useRouter();
const courseStore = useCourseStore();

const courseId = route.params.id;
const isNewCourse = computed(() => courseId === 'new');

const course = ref({ title: '', description: '', category: '', published: false });
const localLessons = ref([]);

const lessons = computed(() => courseStore.currentCourse?.lessons || []);
const quiz = computed(() => courseStore.currentCourse?.quiz || { questions: [] });

// Keep localLessons in sync with the store
watch(lessons, (newLessons) => {
  localLessons.value = [...newLessons];
}, { immediate: true });

onMounted(async () => {
  if (!isNewCourse.value) {
    await courseStore.fetchCourseDetails(courseId);
    if (courseStore.currentCourse) {
      course.value = { ...courseStore.currentCourse };
    }
  }
});

const saveCourse = async () => {
  try {
    await courseStore.saveCourse(course.value);
    router.push({ name: 'admin-courses' });
  } catch (error) {
    alert('儲存課程失敗，請查看 console。');
  }
};

const onLessonDragEnd = async () => {
  try {
    await courseStore.updateLessonsOrder(courseId, localLessons.value);
  } catch (error) {
    alert('更新單元順序失敗，請查看 console。');
    // Revert to store order if save fails
    localLessons.value = [...lessons.value];
  }
};

// Lesson Management Actions
const addLesson = () => {
  router.push({ name: 'admin-lesson-new', params: { courseId } });
};
const editLesson = (lessonId) => {
  router.push({ name: 'admin-lesson-edit', params: { courseId, lessonId } });
};
const deleteLesson = async (lessonId) => {
  if (confirm('您確定要刪除這個單元嗎？')) {
    try {
      await courseStore.deleteLesson(courseId, lessonId);
    } catch (error) {
      alert('刪除單元失敗，請查看 console。');
    }
  }
};

// Quiz Management Actions
const editQuiz = () => {
  router.push({ name: 'admin-quiz-edit', params: { courseId } });
};
</script>

<style scoped>
.drag-handle {
  cursor: grab;
  margin-right: 16px;
  font-size: 1.2em;
}

.lesson-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  margin-bottom: 8px;
  background-color: var(--color-surface);
}

.lesson-item > span {
  flex-grow: 1;
}

.lesson-actions {
  display: flex;
  gap: var(--space-8);
}

.form-actions {
  margin-top: var(--space-32);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-16);
}

.form-row {
  display: flex;
  gap: var(--space-24);
  margin-bottom: var(--space-24);
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}
</style>
