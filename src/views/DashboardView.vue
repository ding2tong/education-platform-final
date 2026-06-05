<template>
  <div class="dashboard-container">
    <header class="page-header">
      <h1 class="page-title">學習中心</h1>
      <p class="page-subtitle">歡迎回來，{{ authStore.currentUser?.displayName }}！繼續您的學習進度吧。</p>
    </header>

    <div v-if="!hasStartedAnyCourse" class="empty-state card">
      <div class="empty-dot"></div>
      <h3>尚未開始任何課程</h3>
      <p>挑選一個感興趣的主題，開始您的專業成長吧！</p>
      <router-link :to="{ name: 'courses' }" class="btn btn--primary mt-4">瀏覽所有課程</router-link>
    </div>

    <div v-else class="dashboard-content">
      <!-- Top Stats Grid -->
      <div class="stats-overview">
        <div class="stat-main card">
          <div class="stat-header">
            <h3>總體進度</h3>
            <span class="stat-percent">{{ overallCompletionPercentage }}%</span>
          </div>
          <div class="stat-progress-track">
            <div class="stat-progress-fill" :style="{ width: overallCompletionPercentage + '%' }"></div>
          </div>
          <div class="stat-footer">
            <span>已完成 {{ completedCoursesCount }} 門課程</span>
            <span>共追蹤 {{ totalTrackedCourses }} 門</span>
          </div>
        </div>

        <div class="stat-chart card">
          <h3>課程狀態</h3>
          <div class="chart-wrapper">
            <Doughnut v-if="doughnutChartData.datasets[0].data.length > 0" :data="doughnutChartData" :options="chartOptions" />
          </div>
        </div>
      </div>

      <!-- Detailed Progress -->
      <section class="progress-section">
        <h2 class="section-title">我的課程進度</h2>
        <div class="progress-grid">
          <div 
            v-for="course in trackedCourses" 
            :key="course.id" 
            class="progress-card card" 
            :class="{ expanded: expandedCourseId === course.id }"
          >
            <div class="progress-card-header" @click="toggleExpand(course.id)">
              <div class="course-info">
                <h3 class="course-name">{{ course.title }}</h3>
                <div class="score-pills">
                  <span v-if="getLatestCourseQuizScore(authStore.userProgress[course.id])" class="score-pill">
                    總測驗: {{ getLatestCourseQuizScore(authStore.userProgress[course.id]) }}
                  </span>
                </div>
              </div>
              <div class="progress-indicator">
                <div class="circular-progress">
                  {{ calculateProgress(authStore.userProgress[course.id], course) }}%
                </div>
                <div class="expand-icon">{{ expandedCourseId === course.id ? '−' : '+' }}</div>
              </div>
            </div>
            
            <transition name="expand">
              <div v-if="expandedCourseId === course.id" class="progress-details">
                <div class="details-divider"></div>
                <h4 class="details-title">單元詳情</h4>
                <div class="lessons-list">
                  <div v-for="lesson in course.lessons" :key="lesson.id" class="lesson-row">
                    <div class="lesson-status">
                      <span class="status-dot" :class="{ completed: isLessonCompleted(course.id, lesson.id) }"></span>
                      <span class="lesson-name">{{ lesson.title }}</span>
                    </div>
                    <div class="lesson-meta">
                      <span v-if="getLatestLessonQuizScore(authStore.userProgress[course.id], lesson.id)" class="score-badge">
                        {{ getLatestLessonQuizScore(authStore.userProgress[course.id], lesson.id) }} 分
                      </span>
                      <router-link 
                        :to="{ name: 'lesson', params: { courseId: course.id, lessonId: lesson.id } }" 
                        class="lesson-link"
                      >
                        {{ isLessonCompleted(course.id, lesson.id) ? '複習' : '開始' }}
                      </router-link>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useCourseStore } from '@/stores/course';
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, ArcElement);

const authStore = useAuthStore();
const courseStore = useCourseStore();
const expandedCourseId = ref(null);

onMounted(async () => {
  if (Object.keys(authStore.userProgress).length === 0) {
    await authStore.loadUserData();
  }
  if (courseStore.courses.length === 0) {
    await courseStore.fetchAllCourses();
  }
});

const hasStartedAnyCourse = computed(() => Object.keys(authStore.userProgress).length > 0);

const trackedCourses = computed(() => {
  return courseStore.courses
    .filter(course => authStore.userProgress[course.id] && course.published)
    .sort((a, b) => a.title.localeCompare(b.title));
});

const totalTrackedCourses = computed(() => trackedCourses.value.length);

const completedCoursesCount = computed(() => {
  return trackedCourses.value.filter(course => {
    const progress = authStore.userProgress[course.id];
    if (!progress || !course.lessons || course.lessons.length === 0) return false;
    return progress.completedLessons.length >= course.lessons.length;
  }).length;
});

const overallCompletionPercentage = computed(() => {
  if (totalTrackedCourses.value === 0) return 0;
  const totalLessons = trackedCourses.value.reduce((sum, course) => sum + (course.lessons?.length || 0), 0);
  if (totalLessons === 0) return 0;
  const completedLessons = trackedCourses.value.reduce((sum, course) => {
    const progress = authStore.userProgress[course.id];
    return sum + (progress?.completedLessons?.length || 0);
  }, 0);
  return Math.round((completedLessons / totalLessons) * 100);
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20
      }
    }
  },
  cutout: '70%'
};

const doughnutChartData = computed(() => {
  const completed = completedCoursesCount.value;
  const inProgress = totalTrackedCourses.value - completed;
  return {
    labels: ['已完成', '進行中'],
    datasets: [{ 
      backgroundColor: ['#4F46E5', '#EFEFFC'], 
      data: [completed, inProgress], 
      borderWidth: 0,
      hoverOffset: 4
    }],
  };
});

const toggleExpand = (courseId) => {
  expandedCourseId.value = expandedCourseId.value === courseId ? null : courseId;
};

const calculateProgress = (progress, course) => {
  if (!course || !course.lessons || course.lessons.length === 0) return 0;
  return Math.round((progress.completedLessons.length / course.lessons.length) * 100);
};

const getLatestCourseQuizScore = (progress) => {
  if (!progress?.quizResults || progress.quizResults.length === 0) return null;
  const courseQuizzes = progress.quizResults.filter(r => !r.lessonId);
  return courseQuizzes.length > 0 ? courseQuizzes[courseQuizzes.length - 1].score : null;
};

const getLatestLessonQuizScore = (progress, lessonId) => {
  if (!progress?.quizResults || progress.quizResults.length === 0) return null;
  const lessonQuizzes = progress.quizResults.filter(r => r.lessonId === lessonId);
  return lessonQuizzes.length > 0 ? lessonQuizzes[lessonQuizzes.length - 1].score : null;
};

const isLessonCompleted = (courseId, lessonId) => {
  return authStore.userProgress[courseId]?.completedLessons?.includes(lessonId) || false;
};
</script>

<style scoped>
.dashboard-container {
  max-width: var(--container-lg);
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--space-32);
}

.page-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-8);
  color: var(--color-text);
}

.page-subtitle {
  color: var(--color-text-secondary);
}

.stats-overview {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: var(--space-24);
  margin-bottom: var(--space-48);
}

.stat-main {
  padding: var(--space-32);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-24);
}

.stat-header h3 {
  margin: 0;
  font-size: var(--font-size-xl);
}

.stat-percent {
  font-size: 48px;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.stat-progress-track {
  height: 16px;
  background-color: var(--color-secondary);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-24);
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
}

.stat-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stat-footer {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.stat-chart {
  padding: var(--space-24);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-chart h3 {
  margin-bottom: var(--space-16);
  font-size: var(--font-size-lg);
}

.chart-wrapper {
  height: 200px;
  width: 100%;
}

.section-title {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--space-24);
  color: var(--color-text);
}

.progress-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.progress-card {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.progress-card-header {
  padding: var(--space-24);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.course-name {
  margin: 0 0 8px 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.score-pill {
  font-size: var(--font-size-sm);
  background-color: var(--color-pastel-purple);
  color: var(--color-primary);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-bold);
}

.progress-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-24);
}

.circular-progress {
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  font-size: var(--font-size-lg);
}

.expand-icon {
  width: 32px;
  height: 32px;
  background-color: var(--color-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.progress-card.expanded .expand-icon {
  transform: rotate(180deg);
}

.progress-details {
  padding: 0 var(--space-24) var(--space-24);
}

.details-divider {
  height: 1px;
  background-color: var(--color-border);
  margin-bottom: var(--space-16);
}

.details-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: var(--space-16);
  font-weight: var(--font-weight-bold);
}

.lessons-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.lesson-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--color-secondary);
  border-radius: var(--radius-base);
  transition: transform 0.2s ease;
}

.lesson-row:hover {
  transform: translateX(4px);
  background-color: var(--color-border);
}

.lesson-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #cbd5e1;
  border: 2px solid white;
}

.status-dot.completed {
  background-color: var(--color-success);
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
}

.lesson-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.lesson-meta {
  display: flex;
  align-items: center;
  gap: var(--space-16);
}

.score-badge {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-bold);
  background: white;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.lesson-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.lesson-link:hover {
  background: var(--color-primary);
  color: white;
}

.empty-state {
  text-align: center;
  padding: 64px 24px;
}

.empty-dot {
  width: 48px;
  height: 48px;
  background: var(--color-pastel-green);
  border-radius: 50%;
  margin: 0 auto var(--space-16);
}

/* Animations */
.expand-enter-active, .expand-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  max-height: 1000px;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
}

@media (max-width: 992px) {
  .stats-overview {
    grid-template-columns: 1fr;
  }
}
</style>