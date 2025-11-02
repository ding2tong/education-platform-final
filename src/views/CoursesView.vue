<template>
  <div class="page active">
    <div class="container">
      <h1>所有課程</h1>
      <p v-if="courseStore.courses.length === 0">正在載入課程...</p>
      <div v-else>
        <div v-for="(courses, category) in groupedCourses" :key="category">
          <h2 class="category-title">{{ category }}</h2>
          <div class="course-grid">
            <div class="card" v-for="course in courses" :key="course.id" style="margin-bottom: 24px;">
              <div class="card__body" style="cursor: pointer;" @click="viewCourse(course.id)">
                <h3>{{ course.title }}</h3>
                <p>{{ course.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useCourseStore } from '@/stores/course';
import { useRouter } from 'vue-router';

const courseStore = useCourseStore();
const router = useRouter();

onMounted(() => {
  courseStore.fetchAllCourses();
});

const groupedCourses = computed(() => {
  const publishedCourses = courseStore.courses.filter(course => course.published);
  return publishedCourses.reduce((acc, course) => {
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
.category-title {
  margin-top: 32px;
  margin-bottom: 16px;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 8px;
}
</style>