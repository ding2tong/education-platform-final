<template>
  <div class="page">
    <div class="container">
      <h1>所有課程</h1>

      <div class="filter-bar">
        <div class="form-group">
          <input type="text" class="form-control" v-model="searchQuery" placeholder="搜尋課程標題或描述...">
        </div>
        <div class="form-group">
          <select class="form-control" v-model="selectedCategory">
            <option value="">所有分類</option>
            <option v-for="category in availableCategories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
      </div>

      <p v-if="courseStore.courses.length === 0">正在載入課程...</p>
      <div v-else>
        <div v-for="(courses, category) in groupedCourses" :key="category">
          <h2 class="category-title">{{ category }}</h2>
          <transition-group name="list-item" tag="div" class="course-grid">
            <div 
              class="card" 
              v-for="(course, index) in courses" 
              :key="course.id" 
              :style="{ 'transition-delay': `${index * 50}ms` }"
              style="margin-bottom: 24px;"
            >
              <div class="card__body" style="cursor: pointer;" @click="viewCourse(course.id)">
                <h3>{{ course.title }}</h3>
                <p>{{ course.description }}</p>
              </div>
            </div>
          </transition-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue';
import { useCourseStore } from '@/stores/course';
import { useRouter } from 'vue-router';

const courseStore = useCourseStore();
const router = useRouter();

const searchQuery = ref('');
const selectedCategory = ref('');

onMounted(() => {
  courseStore.fetchAllCourses();
});

const availableCategories = computed(() => {
  const categories = new Set(courseStore.courses.map(c => c.category).filter(Boolean));
  return Array.from(categories);
});

const groupedCourses = computed(() => {
  // 1. Start with published courses
  let filteredCourses = courseStore.courses.filter(course => course.published);

  // 2. Filter by selected category
  if (selectedCategory.value) {
    filteredCourses = filteredCourses.filter(course => course.category === selectedCategory.value);
  }

  // 3. Filter by search query
  if (searchQuery.value) {
    const lowerCaseQuery = searchQuery.value.toLowerCase();
    filteredCourses = filteredCourses.filter(course =>
      course.title.toLowerCase().includes(lowerCaseQuery) ||
      (course.description && course.description.toLowerCase().includes(lowerCaseQuery))
    );
  }

  // 4. Group the final list
  return filteredCourses.reduce((acc, course) => {
    const category = course.category || '未分類';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(course);
    return acc;
  }, {});
});

const viewCourse = (courseId) => {
  router.push({ name: 'course-detail', params: { id: courseId } });
};
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  margin-top: 16px;
}

.filter-bar .form-group {
  flex-grow: 1;
  margin-bottom: 0;
}

.filter-bar .form-group:first-child {
  flex-grow: 2; /* Make search bar wider */
}

.category-title {
  margin-top: 32px;
  margin-bottom: 16px;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 8px;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

h1 {
  color: var(--color-text);
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
