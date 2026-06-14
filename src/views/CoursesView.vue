<template>
  <div class="courses-container">
    <header class="page-header">
      <h1 class="page-title">課程中心</h1>
      <p class="page-subtitle">探索豐富的專業課程，開啟您的學習之旅</p>
    </header>

    <!-- Filter & Control Bar -->
    <div class="control-panel card">
      <div class="search-section">
        <div class="search-wrapper">
          <input 
            type="text" 
            class="search-input" 
            v-model="searchQuery" 
            placeholder="搜尋感興趣的課程..."
          >
        </div>
      </div>
      
      <div class="filter-section">
        <div class="filter-group">
          <span class="filter-label">學習狀態</span>
          <div class="status-pills">
            <button
              v-for="status in statusOptions"
              :key="status"
              class="pill-btn"
              :class="{ 'active': statusFilter === status }"
              @click="statusFilter = status"
            >
              {{ status }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <span class="filter-label">類別篩選</span>
          <select class="category-select" v-model="selectedCategory">
            <option value="">所有分類</option>
            <option v-for="category in availableCategories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading / Empty State -->
    <div v-if="loading" class="mt-8">
      <CourseListSkeleton :count="4" />
    </div>
    
    <div v-else-if="Object.keys(groupedCourses).length === 0" class="empty-state card">
      <div class="empty-dot"></div>
      <h3>找不到符合條件的課程</h3>
      <p>試試看調整搜尋關鍵字或篩選條件</p>
      <button class="btn btn--primary mt-4" @click="resetFilters">重設篩選</button>
    </div>

    <!-- Course List Grouped by Category -->
    <div v-else class="groups-container">
      <div v-for="(courses, category) in groupedCourses" :key="category" class="category-section">
        <div class="section-header">
          <h2 class="category-name">{{ category }}</h2>
          <span class="course-count">{{ courses.length }} 門課程</span>
        </div>
        
        <div class="course-grid">
          <transition-group name="list" tag="div">
            <CourseItem 
              v-for="course in courses" 
              :key="course.id" 
              :course="course"
              :statusInfo="getCourseStatusInfo(course)"
              :bgColor="categoryColorMap[category]"
              :assignmentInfo="getAssignmentInfo(course.id)"
              @action="handleCourseAction"
            />
          </transition-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue';
import { useCourseStore } from '@/stores/course';
import { useAuthStore } from '@/stores/auth';
import { useAssignmentStore } from '@/stores/assignment';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import CourseItem from '@/components/CourseItem.vue';
import CourseListSkeleton from '@/components/CourseListSkeleton.vue';

const courseStore = useCourseStore();
const authStore = useAuthStore();
const assignmentStore = useAssignmentStore();
const router = useRouter();

const { userProgress } = storeToRefs(authStore);
const { categories: availableCategories } = storeToRefs(courseStore);

const searchQuery = ref('');
const statusOptions = ['全部', '未開始', '進行中', '已完成'];
const statusFilter = ref('全部');
const selectedCategory = ref('');
const loading = ref(true);

// Category Color Mapping
const categoryColorMap = computed(() => {
  const map = {};
  const colors = [
    'var(--color-pastel-purple)',
    'var(--color-pastel-orange)',
    'var(--color-pastel-blue)',
    'var(--color-pastel-green)'
  ];
  
  availableCategories.value.forEach((cat, index) => {
    map[cat] = colors[index % colors.length];
  });
  return map;
});

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      courseStore.fetchAllCourses(),
      authStore.fetchUserProgress(),
      courseStore.fetchCategories(),
      assignmentStore.fetchStudentAssignments()
    ]);
  } catch (error) {
    console.error('Error loading course center:', error);
  } finally {
    loading.value = false;
  }
});

const resetFilters = () => {
  searchQuery.value = '';
  statusFilter.value = '全部';
  selectedCategory.value = '';
};

const getAssignmentInfo = (courseId) => {
  const assignment = assignmentStore.studentAssignments
    .filter(item => item.courseId === courseId)
    .sort((a, b) => new Date(a.dueAt || 0) - new Date(b.dueAt || 0))[0];
  if (!assignment) return null;
  const dueAt = assignment.dueAt ? new Date(assignment.dueAt) : null;
  const isOverdue = dueAt ? dueAt < new Date() : false;
  return {
    isOverdue,
    label: isOverdue ? `已逾期 ${dueAt.toLocaleDateString('zh-TW')}` : `截止 ${dueAt.toLocaleDateString('zh-TW')}`,
  };
};

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

  if (statusFilter.value !== '全部') {
    courses = courses.filter(course => getCourseStatusInfo(course).status === statusFilter.value);
  }
  
  if (selectedCategory.value) {
    courses = courses.filter(course => course.category === selectedCategory.value);
  }

  if (searchQuery.value) {
    const lowerCaseQuery = searchQuery.value.toLowerCase();
    courses = courses.filter(course =>
      course.title.toLowerCase().includes(lowerCaseQuery) ||
      (course.description && course.description.toLowerCase().includes(lowerCaseQuery))
    );
  }

  const grouped = {};
  availableCategories.value.forEach(category => {
    const coursesInCategory = courses.filter(c => c.category === category);
    if (coursesInCategory.length > 0) {
      grouped[category] = coursesInCategory;
    }
  });

  return grouped;
});

const handleCourseAction = async (courseId) => {
  // Fetch course details to get lesson list
  await courseStore.fetchCourseDetails(courseId)
  const course = courseStore.currentCourse

  if (!course || !course.lessons || course.lessons.length === 0) {
    // Fallback: no lessons yet, go to course detail
    router.push({ name: 'course-detail', params: { id: courseId } })
    return
  }

  const progress = userProgress.value?.[courseId]
  const completedLessons = progress?.completedLessons || []

  // Find first incomplete lesson, or default to first lesson
  const firstIncomplete = course.lessons.find(l => !completedLessons.includes(l.id))
  const targetLesson = firstIncomplete || course.lessons[0]

  router.push({ name: 'lesson', params: { courseId, lessonId: targetLesson.id } })
};
</script>

<style scoped>
.courses-container {
  max-width: var(--container-lg);
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--space-32);
}

.page-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin-bottom: var(--space-8);
}

.page-subtitle {
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
}

.control-panel {
  padding: var(--space-24);
  margin-bottom: var(--space-32);
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

.search-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 14px 20px;
  border-radius: var(--radius-base);
  border: 1px solid var(--color-border);
  background-color: var(--color-secondary);
  font-size: var(--font-size-base);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  background-color: white;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-focus-ring);
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--space-24);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.filter-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin-left: 4px;
}

.status-pills {
  display: flex;
  gap: var(--space-8);
  background-color: var(--color-secondary);
  padding: 4px;
  border-radius: var(--radius-full);
}

.pill-btn {
  padding: 8px 20px;
  border-radius: var(--radius-full);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
}

.pill-btn.active {
  background-color: white;
  color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.category-select {
  padding: 10px 16px;
  border-radius: var(--radius-base);
  border: 1px solid var(--color-border);
  background-color: var(--color-secondary);
  font-size: var(--font-size-sm);
  min-width: 180px;
  cursor: pointer;
}

.category-section {
  margin-bottom: var(--space-32);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-16);
  padding: 0 var(--space-8);
}

.category-name {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.course-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.empty-state {
  text-align: center;
  padding: var(--space-32) * 2;
}

.empty-dot {
  width: 48px;
  height: 48px;
  background: var(--color-pastel-blue);
  border-radius: 50%;
  margin: 0 auto var(--space-16);
}

/* Animations */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
