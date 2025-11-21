<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2>課程列表</h2>
      <button class="btn btn--primary" @click="goToEditPage('new')">新增課程</button>
    </div>

    <div class="filter-bar">
      <div class="form-group">
        <input type="text" class="form-control" v-model="searchQuery" placeholder="搜尋課程標題...">
      </div>
      <div class="form-group">
        <select class="form-control" v-model="statusFilter">
          <option value="all">所有狀態</option>
          <option value="published">已上架</option>
          <option value="draft">草稿</option>
        </select>
      </div>
    </div>

    <div class="card">
      <div v-if="filteredCourses.length === 0 && !courseStore.isLoading" class="empty-state">
        <p class="empty-state-icon">📚</p>
        <p class="empty-state-text">目前沒有符合條件的課程。</p>
        <button class="btn btn--primary" @click="goToEditPage('new')">新增第一門課程</button>
      </div>
      <table v-else-if="filteredCourses.length > 0" class="table">
        <thead>
          <tr>
            <th>課程標題 (單元數)</th>
            <th>分類</th>
            <th>狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in filteredCourses" :key="course.id">
            <td>{{ course.title }} ({{ course.lessonsCount || 0 }})</td>
            <td>{{ course.category || 'N/A' }}</td>
            <td>
              <span :class="['status-badge', course.published ? 'status-published' : 'status-draft']">
                {{ course.published ? '已上架' : '草稿' }}
              </span>
            </td>
            <td>
              <button class="btn btn--sm btn--outline" @click="goToEditPage(course.id)">編輯</button>
              <button class="btn btn--sm btn--danger" @click="deleteCourse(course.id)" style="margin-left: 8px;">刪除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { useCourseStore } from '@/stores/course';
import { useRouter } from 'vue-router';

const courseStore = useCourseStore();
const router = useRouter();

const searchQuery = ref('');
const statusFilter = ref('all'); // 'all', 'published', 'draft'

onMounted(() => {
  courseStore.fetchAllCourses();
});

const filteredCourses = computed(() => {
  let courses = courseStore.courses;

  // Filter by status
  if (statusFilter.value !== 'all') {
    const isPublished = statusFilter.value === 'published';
    courses = courses.filter(course => course.published === isPublished);
  }

  // Filter by search query
  if (searchQuery.value) {
    const lowerCaseQuery = searchQuery.value.toLowerCase();
    courses = courses.filter(course => 
      course.title.toLowerCase().includes(lowerCaseQuery)
    );
  }

  return courses;
});

const goToEditPage = (courseId) => {
  router.push({ name: 'admin-course-edit', params: { id: courseId } });
};

const deleteCourse = async (courseId) => {
  if (confirm('您確定要刪除這門課程嗎？此操作將無法復原，且目前不會刪除其下的單元和測驗。')) {
    try {
      await courseStore.deleteCourse(courseId);
    } catch (error) {
      alert('刪除課程失敗，請查看 console。');
    }
  }
};
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.filter-bar .form-group {
  flex-grow: 1;
  margin-bottom: 0;
}

.filter-bar .form-group:first-child {
  flex-grow: 3; /* Make search bar wider */
}

.table {
  width: 100%;
  border-collapse: collapse;
}
.table th, .table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}
.status-badge {
  padding: 4px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}
.status-published {
  background-color: var(--color-success);
  color: var(--color-btn-primary-text);
}
.status-draft {
  background-color: var(--color-text-secondary);
  color: var(--color-btn-primary-text);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--color-text-secondary);
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
