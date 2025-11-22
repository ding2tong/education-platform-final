<template>
  <div class="page">
    <div class="container">
      <h1>所有課程</h1>

      <!-- Filter & Control Bar -->
      <div class="filter-control-bar">
        <div class="status-filters">
          <button
            v-for="status in statusOptions"
            :key="status"
            class="btn btn--sm"
            :class="{ 'btn--primary': statusFilter === status, 'btn--outline': statusFilter !== status }"
            @click="statusFilter = status"
          >
            {{ status }}
          </button>
        </div>
        <div class="form-group">
          <select class="form-control" v-model="selectedCategory">
            <option value="">所有分類</option>
            <option v-for="category in availableCategories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
        <div class="search-filter">
          <input type="text" class="form-control" v-model="searchQuery" placeholder="搜尋課程...">
        </div>
      </div>

      <!-- Loading / Empty State -->
      <div v-if="loading" class="loading-placeholder">正在載入課程與您的學習進度...</div>
      <div v-else-if="Object.keys(groupedCourses).length === 0" class="empty-state">
        <p>找不到符合條件的課程。</p>
        <p>試試看調整您的篩選條件。</p>
      </div>

      <!-- Course List -->
      <div v-else>
        <div v-for="(courses, category) in groupedCourses" :key="category" class="category-group">
          <h2 class="category-title">{{ category }}</h2>
          <div class="course-list">
            <transition-group name="list-item" tag="div">
              <div v-for="course in courses" :key="course.id" class="course-item">
                <div class="course-info">
                  <h3 class="course-title">{{ course.title }}</h3>
                  <p class="course-description">{{ course.description }}</p>
                  <div class="course-progress-display">
                    <div class="progress-bar">
                      <div class="progress-bar-fill" :style="{ width: getCourseStatusInfo(course).progressPercent + '%' }"></div>
                    </div>
                    <span class="progress-text">({{ getCourseStatusInfo(course).completedLessons }}/{{ getCourseStatusInfo(course).totalLessons }})</span>
                  </div>
                </div>
                <div class="course-actions">
                  <span :class="['status-badge', getCourseStatusInfo(course).statusClass]">
                    {{ getCourseStatusInfo(course).statusText }}
                  </span>
                  <button class="btn btn--primary" @click="handleCourseAction(course.id)">
                    {{ getCourseStatusInfo(course).actionText }}
                  </button>
                </div>
              </div>
            </transition-group>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue';
import { useCourseStore } from '@/stores/course';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

const courseStore = useCourseStore();
const authStore = useAuthStore();
const router = useRouter();

const { userProgress } = storeToRefs(authStore);
const { categories: availableCategories } = storeToRefs(courseStore);

const searchQuery = ref('');
const statusOptions = ['全部', '未開始', '進行中', '已完成'];
const statusFilter = ref('全部');
const selectedCategory = ref('');
const loading = ref(true);

onMounted(async () => {
  loading.value = true;
  await Promise.all([
    courseStore.fetchAllCourses(),
    authStore.fetchUserProgress(),
    courseStore.fetchCategories() // Ensure categories are fetched
  ]);
  loading.value = false;
});

const getCourseStatusInfo = (course) => {
  if (!userProgress.value || !course) {
    return { 
      status: '未開始', 
      progressPercent: 0, 
      completedLessons: 0, 
      totalLessons: course.lessonsCount || 0,
      statusText: '未開始', 
      actionText: '開始學習', 
      statusClass: 'status-not-started' 
    };
  }

  const progress = userProgress.value[course.id];
  const totalLessons = course.lessonsCount || 0;
  const completedLessons = progress?.completedLessons?.length || 0;

  if (!progress || totalLessons === 0) {
    return { 
      status: '未開始', 
      progressPercent: 0, 
      completedLessons: 0, 
      totalLessons: totalLessons,
      statusText: '未開始', 
      actionText: '開始學習', 
      statusClass: 'status-not-started' 
    };
  }

  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  if (progressPercent >= 100) {
    return { 
      status: '已完成', 
      progressPercent: 100, 
      completedLessons: completedLessons, 
      totalLessons: totalLessons,
      statusText: '已完成', 
      actionText: '重新複習', 
      statusClass: 'status-completed' 
    };
  }
  
  return { 
    status: '進行中', 
    progressPercent: progressPercent, 
    completedLessons: completedLessons, 
    totalLessons: totalLessons,
    statusText: '進行中', 
    actionText: '繼續學習', 
    statusClass: 'status-in-progress' 
  };
};

const groupedCourses = computed(() => {
  if (loading.value || !courseStore.courses) return {};

  let courses = courseStore.courses.filter(c => c.published);

  // Filter by status
  if (statusFilter.value !== '全部') {
    courses = courses.filter(course => getCourseStatusInfo(course).status === statusFilter.value);
  }
  
  // Filter by category
  if (selectedCategory.value) {
    courses = courses.filter(course => course.category === selectedCategory.value);
  }

  // Filter by search query
  if (searchQuery.value) {
    const lowerCaseQuery = searchQuery.value.toLowerCase();
    courses = courses.filter(course =>
      course.title.toLowerCase().includes(lowerCaseQuery) ||
      (course.description && course.description.toLowerCase().includes(lowerCaseQuery))
    );
  }

  // Group the final list
  const grouped = {};
  availableCategories.value.forEach(category => {
    const coursesInCategory = courses.filter(c => c.category === category);
    if (coursesInCategory.length > 0) {
      grouped[category] = coursesInCategory;
    }
  });

  return grouped;
});

const handleCourseAction = (courseId) => {
  router.push({ name: 'course-detail', params: { id: courseId } });
};
</script>

<style scoped>
.page {
  padding-top: 32px;
  padding-bottom: 64px;
}

h1 {
  margin-bottom: 24px;
}

.filter-control-bar {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  gap: 16px;
  flex-wrap: wrap;
}

.status-filters {
  display: flex;
  gap: 8px;
}

.filter-control-bar .form-group {
  margin-bottom: 0;
  min-width: 150px;
}

.search-filter {
  flex-grow: 1;
  min-width: 200px;
}

.category-group {
  margin-bottom: 48px;
}

.category-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-primary);
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.course-item {
  display: flex;
  align-items: center;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px 24px; /* Reduced padding */
  transition: all 0.2s ease;
}

.course-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.course-info {
  flex-grow: 1;
  margin-right: 24px;
  display: flex; /* Make course-info a flex container */
  align-items: center;
  gap: 12px; /* Spacing between elements */
}

.course-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0; /* Remove margin */
  flex-shrink: 0; /* Prevent title from shrinking */
  flex-grow: 0; /* Prevent title from growing */
  white-space: normal; /* Allow title to wrap if needed */
  overflow: visible; /* Ensure full title is visible */
  text-overflow: clip; /* Ensure full title is visible */
  max-width: 30%; /* Give title a max-width to prevent it from pushing everything too much */
}

.course-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0; /* Remove margin */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1; /* Allow description to take available space */
  min-width: 0; /* Allow description to shrink */
  text-align: right; /* Align description to the right */
}

.course-progress-display {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0; /* Prevent shrinking */
  margin-left: 16px; /* Add some space */
}

.progress-bar {
  width: 80px; /* Fixed width for progress bar */
  height: 8px;
  background-color: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}

.progress-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.course-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.status-badge {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.status-badge.status-completed {
  background-color: var(--color-success);
  color: var(--color-btn-primary-text);
}
.status-badge.status-in-progress {
  background-color: var(--color-warning);
  color: var(--color-btn-primary-text);
}
.status-badge.status-not-started {
  background-color: var(--color-surface-secondary);
  color: var(--color-text-secondary);
}

.loading-placeholder, .empty-state {
  text-align: center;
  padding: 64px 0;
  color: var(--color-text-secondary);
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
}

.empty-state p {
  margin: 0;
}

/* Staggered list animation */
.list-item-enter-active,
.list-item-leave-active {
  transition: all 0.5s ease;
}
.list-item-enter-from,
.list-item-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
