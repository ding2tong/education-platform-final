<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2>課程列表</h2>
      <button class="btn btn--primary" @click="goToEditPage('new')">新增課程</button>
    </div>
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>課程標題</th>
            <th>分類</th>
            <th>狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in courseStore.courses" :key="course.id">
            <td>{{ course.title }}</td>
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
import { onMounted } from 'vue';
import { useCourseStore } from '@/stores/course';
import { useRouter } from 'vue-router';

const courseStore = useCourseStore();
const router = useRouter();

onMounted(() => {
  courseStore.fetchAllCourses();
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
</style>
