<template>
  <div class="page">
    <div class="container">
      <h1>我的儀表板</h1>

      <div v-if="!hasStartedAnyCourse" class="empty-state">
        <p class="empty-state-icon">🚀</p>
        <p class="empty-state-text">您尚未開始任何課程，開始學習吧！</p>
        <router-link :to="{ name: 'courses' }" class="btn btn--primary">瀏覽所有課程</router-link>
      </div>

      <div v-else>
        <!-- Graphical Dashboard -->
        <div class="dashboard-grid">
          <div class="stats-column">
            <div class="card stat-card">
              <div class="card__body">
                <h4>總完成課程</h4>
                <p class="stat-number">{{ completedCoursesCount }} / {{ totalTrackedCourses }}</p>
              </div>
            </div>
            <div class="card stat-card">
              <div class="card__body">
                <h4>總完成率</h4>
                <p class="stat-number">{{ overallCompletionPercentage }}%</p>
              </div>
            </div>
          </div>
          <div class="card chart-card chart-card--doughnut">
            <div class="card__body">
              <h3>學習進度概覽</h3>
              <div class="doughnut-container">
                <Doughnut v-if="doughnutChartData.datasets[0].data.length > 0" :data="doughnutChartData" :options="chartOptions" />
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Progress List -->
        <div class="detailed-progress">
          <h2 class="section-title">詳細學習紀錄</h2>
          <div class="progress-list">
            <div v-for="course in trackedCourses" :key="course.id" class="progress-item-card">
              <div class="progress-item-header" @click="toggleExpand(course.id)">
                <div class="course-title">
                  <h3>{{ course.title }}</h3>
                  <span v-if="getLatestCourseQuizScore(authStore.userProgress[course.id])" class="score-badge">
                    總測驗: {{ getLatestCourseQuizScore(authStore.userProgress[course.id]) }} 分
                  </span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar" :style="{ width: calculateProgress(authStore.userProgress[course.id], course) + '%' }">
                    {{ calculateProgress(authStore.userProgress[course.id], course) }}%
                  </div>
                </div>
              </div>
              <div v-if="expandedCourseId === course.id" class="progress-item-details">
                <h4>單元詳情</h4>
                <ul>
                  <li v-for="lesson in course.lessons" :key="lesson.id" class="lesson-detail-item">
                    <span>
                      <span class="completion-status" :class="{ completed: isLessonCompleted(course.id, lesson.id) }">✓</span>
                      {{ lesson.title }}
                    </span>
                    <span v-if="getLatestLessonQuizScore(authStore.userProgress[course.id], lesson.id)" class="score-badge score-badge--secondary">
                      單元測驗: {{ getLatestLessonQuizScore(authStore.userProgress[course.id], lesson.id) }} 分
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useCourseStore } from '@/stores/course';
import { Doughnut } from 'vue-chartjs'; // Bar removed
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js'; // BarElement, CategoryScale, LinearScale removed

ChartJS.register(Title, Tooltip, Legend, ArcElement); // Only register needed elements

const authStore = useAuthStore();
const courseStore = useCourseStore();
const expandedCourseId = ref(null);

// --- Lifecycle ---
onMounted(async () => {
  if (Object.keys(authStore.userProgress).length === 0) {
    await authStore.loadUserData();
  }
  if (courseStore.courses.length === 0) {
    await courseStore.fetchAllCourses();
  }
});

// --- Computed Properties for Dashboard ---
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

// averageScore and barChartData are no longer needed
// const averageScore = computed(() => { ... });
// const barChartData = computed(() => { ... });

// --- Chart Configurations ---
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
};

const doughnutChartData = computed(() => {
  const completed = completedCoursesCount.value;
  const inProgress = totalTrackedCourses.value - completed;
  return {
    labels: ['已完成', '進行中'],
    datasets: [{ backgroundColor: ['#33a6b8', '#e0e0e0'], data: [completed, inProgress] }],
  };
});

// --- Methods for Detailed List ---
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
/* --- Dashboard Grid Styles --- */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 2fr; /* Two columns: stats and doughnut */
  gap: 24px;
  /* align-items: start; */ /* Removed to allow stretching */
  margin-bottom: 48px;
}

.stats-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%; /* Ensure it takes full height of grid cell */
  justify-content: space-between; /* Distribute children evenly */
}

.stat-card h4 {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  margin-bottom: 8px;
}
.stat-card .stat-number {
  font-size: 2.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin: 0;
}
.chart-card {
  padding: 24px;
}
.chart-card h3 {
  margin-bottom: 24px;
  text-align: center;
}
.chart-card--doughnut {
  grid-column: span 1;
}
.doughnut-container {
  position: relative;
  height: 250px; /* Give doughnut a fixed height */
  display: flex; /* Use flex to center chart */
  justify-content: center;
  align-items: center;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr; /* Stack columns on small screens */
  }
}

/* --- Detailed Progress List Styles --- */
.section-title {
  margin-bottom: 16px;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 8px;
}
.progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.progress-item-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-base);
  border: 1px solid var(--color-card-border);
  transition: box-shadow 0.2s ease;
}
.progress-item-card:hover {
  box-shadow: var(--shadow-sm);
}
.progress-item-header {
  padding: 16px;
  cursor: pointer;
}
.course-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.course-title h3 {
  margin: 0;
}
.progress-bar-container {
  width: 100%;
  background-color: var(--color-secondary);
  border-radius: var(--radius-full);
  height: 24px;
  overflow: hidden;
}
.progress-bar {
  background-color: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 12px;
  font-weight: bold;
  transition: width 0.5s ease-in-out;
}
.progress-item-details {
  padding: 0 16px 16px;
  border-top: 1px solid var(--color-border);
}
.progress-item-details h4 {
  margin-top: 16px;
  margin-bottom: 8px;
}
.progress-item-details ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.lesson-detail-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}
.lesson-detail-item:last-child {
  border-bottom: none;
}
.completion-status {
  color: transparent;
  margin-right: 8px;
  font-weight: bold;
}
.completion-status.completed {
  color: var(--color-success);
}
.score-badge {
  background-color: var(--color-primary);
  color: white;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
}
.score-badge--secondary {
  background-color: var(--color-secondary);
  color: var(--color-text);
}

/* --- Empty State --- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--color-text-secondary);
  background-color: var(--color-surface);
  border-radius: var(--radius-base);
}
.empty-state-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}
.empty-state-text {
  font-size: 1.2rem;
  margin-bottom: 24px;
}
</style>