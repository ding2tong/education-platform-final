<template>
  <div class="course-detail-view">
    <div class="container" v-if="courseStore.currentCourse">
      <nav class="breadcrumb">
        <button class="back-link" @click="$router.push('/courses')">
          返回課程中心
        </button>
      </nav>

      <header class="course-header card-soft" :style="{ backgroundColor: getCategoryColor(courseStore.currentCourse.category) }">
        <div class="header-content">
          <span class="category-tag">{{ courseStore.currentCourse.category }}</span>
          <h1 class="course-title">{{ courseStore.currentCourse.title }}</h1>
          <p class="course-desc">{{ courseStore.currentCourse.description }}</p>
          <div class="course-stats">
            <div class="stat-pill">
              <span>{{ courseStore.currentCourse.lessons?.length || 0 }} 個單元</span>
            </div>
            <div class="stat-pill" v-if="courseStore.currentCourse.quiz">
              <span>包含結業測驗</span>
            </div>
          </div>
        </div>
      </header>

      <div class="course-body">
        <div class="section-header">
          <h2 class="section-title">課程單元目錄</h2>
          <div class="progress-info" v-if="completionPercentage > 0">
            <span class="progress-label">整體進度</span>
            <div class="mini-progress-track">
              <div class="mini-progress-fill" :style="{ width: completionPercentage + '%' }"></div>
            </div>
            <span class="progress-value">{{ completionPercentage }}%</span>
          </div>
        </div>

        <div class="lessons-list">
          <div 
            v-for="(lesson, index) in courseStore.currentCourse.lessons" 
            :key="lesson.id" 
            class="lesson-card-soft"
            @click="viewLesson(lesson.id)"
          >
            <div class="lesson-number">{{ (index + 1).toString().padStart(2, '0') }}</div>
            <div class="lesson-content">
              <h3 class="lesson-title">{{ lesson.title }}</h3>
              <p class="lesson-description-short">{{ lesson.description }}</p>
            </div>
            <div class="lesson-action">
              <div v-if="authStore.isLessonCompleted(courseId, lesson.id)" class="lesson-status-badge completed">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>已完成</span>
              </div>
              <div v-else class="lesson-status-badge pending">
                <span>開始學習</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Quiz Section -->
        <div v-if="courseStore.currentCourse.quiz" class="quiz-cta-section">
          <div class="quiz-card card-soft">
            <div class="quiz-visual"></div>
            <div class="quiz-info">
              <h3 class="quiz-title">課程總結測驗</h3>
              <p class="quiz-subtitle">驗收您的學習成果，獲得專業認證</p>
            </div>
            <button 
              class="btn-quiz" 
              :class="{ 'btn-disabled': !canStartQuiz }"
              :disabled="!canStartQuiz"
              @click="startCourseQuiz"
            >
              {{ canStartQuiz ? '立即開始測驗' : '請先完成所有單元' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Skeleton Loading -->
    <div class="container" v-else>
      <div class="skeleton-header card-soft"></div>
      <div class="skeleton-body">
        <div class="skeleton-item" v-for="i in 3" :key="i"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCourseStore } from '@/stores/course';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const courseStore = useCourseStore();
const authStore = useAuthStore();
const courseId = route.params.id;

onMounted(() => {
  courseStore.fetchCourseDetails(courseId);
});

const categoryColorMap = {
  '專業知識': '#E3F2FD', // 淺藍
  '門市實務': '#E8F5E9', // 淺綠
  '產品介紹': '#FFF3E0', // 淺橘
  '衛教資訊': '#F3E5F5', // 淺紫
  '法規宣導': '#FFEBEE'  // 淺紅
};

const getCategoryColor = (cat) => categoryColorMap[cat] || '#FDFBF7';

const viewLesson = (lessonId) => {
  router.push({ name: 'lesson', params: { courseId: courseId, lessonId: lessonId } });
};

const startCourseQuiz = () => {
  router.push({ name: 'quiz', params: { courseId: courseId } });
};

const completionPercentage = computed(() => {
  if (!courseStore.currentCourse || !courseStore.currentCourse.lessons) return 0;
  const total = courseStore.currentCourse.lessons.length;
  if (total === 0) return 0;
  const completed = courseStore.currentCourse.lessons.filter(l => 
    authStore.isLessonCompleted(courseId, l.id)
  ).length;
  return Math.round((completed / total) * 100);
});

const canStartQuiz = computed(() => {
  // Option to restrict quiz until all lessons are done, or let them take it anytime
  // return completionPercentage.value === 100;
  return true; // For now allow any time
});
</script>

<style scoped>
.course-detail-view {
  animation: fadeIn 0.4s ease-out;
}

.breadcrumb {
  margin-bottom: var(--space-20);
}

.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--color-primary);
}

.course-header {
  padding: var(--space-40);
  margin-bottom: var(--space-40);
  position: relative;
  overflow: hidden;
}

.course-header::after {
  content: '';
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
}

.category-tag {
  display: inline-block;
  background: white;
  padding: 4px 16px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}

.course-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: 16px;
  color: var(--color-text);
}

.course-desc {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  max-width: 800px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.course-stats {
  display: flex;
  gap: 16px;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.5);
  padding: 8px 16px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-24);
}

.section-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-bold);
}

.mini-progress-track {
  width: 100px;
  height: 8px;
  background: var(--color-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-full);
}

.progress-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

/* Lessons List */
.lessons-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lesson-card-soft {
  background: white;
  padding: 24px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  gap: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: var(--shadow-sm);
  border: 2px solid transparent;
}

.lesson-card-soft:hover {
  transform: scale(1.01);
  box-shadow: var(--shadow-md);
  border-color: var(--color-secondary);
}

.lesson-number {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-secondary-dark, #ddd);
  opacity: 0.5;
}

.lesson-content {
  flex: 1;
}

.lesson-title {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  margin-bottom: 4px;
}

.lesson-description-short {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.lesson-status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  transition: all 0.2s ease;
}

.completed {
  background: #E8F5E9;
  color: #2E7D32;
}

.pending {
  background: var(--color-secondary);
  color: var(--color-text-secondary);
}

.lesson-card-soft:hover .pending {
  background: var(--color-primary);
  color: white;
}

/* Quiz Section */
.quiz-cta-section {
  margin-top: 64px;
}

.quiz-card {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 32px;
  background: #FDFBF7;
}

.quiz-visual {
  width: 80px;
  height: 80px;
  background: var(--color-pastel-purple);
  border-radius: 24px;
  flex-shrink: 0;
}

.quiz-info {
  flex: 1;
}

.quiz-title {
  font-size: 1.25rem;
  font-weight: var(--font-weight-bold);
  margin-bottom: 4px;
}

.quiz-subtitle {
  color: var(--color-text-secondary);
  margin: 0;
}

.btn-quiz {
  padding: 16px 32px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-bold);
  font-size: 1.1rem;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-quiz:not(:disabled):hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: var(--shadow-lg);
}

.btn-disabled {
  background: var(--color-secondary);
  color: var(--color-text-secondary);
  cursor: not-allowed;
  box-shadow: none;
}

/* Skeletons */
.skeleton-header {
  height: 200px;
  background: #eee;
  margin-bottom: 40px;
}
.skeleton-item {
  height: 100px;
  background: #f5f5f5;
  border-radius: 24px;
  margin-bottom: 16px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .quiz-card {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
}
</style>
