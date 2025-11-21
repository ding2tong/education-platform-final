<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2>總覽儀表板</h2>
      <button class="btn btn--primary" @click="exportToCSV">匯出 CSV</button>
    </div>

    <div class="filters" style="display: flex; gap: 16px; margin-bottom: 24px;">
      <div class="form-group">
        <label for="branch-filter" class="form-label">分店</label>
        <select id="branch-filter" class="form-control" v-model="selectedBranch">
          <option value="">所有分店</option>
          <option v-for="branch in formOptions.branchOptions" :key="branch" :value="branch">
            {{ branch }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label for="course-filter" class="form-label">課程</label>
        <select id="course-filter" class="form-control" v-model="selectedCourse">
          <option value="">所有課程</option>
          <option v-for="course in courseStore.courses" :key="course.id" :value="course.id">
            {{ course.title }}
          </option>
        </select>
      </div>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>分店</th>
            <th>姓名</th>
            <th>課程名稱</th>
            <th>進度</th>
            <th>最新測驗分數</th>
            <th>測驗次數</th>
            <th>註冊日期</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" style="text-align: center;">正在載入資料...</td>
          </tr>
          <tr v-else-if="filteredProgress.length === 0">
            <td colspan="7" style="text-align: center;">沒有可顯示的學員進度。</td>
          </tr>
          <tr v-for="(item, index) in filteredProgress" :key="index">
            <td>{{ item.branch }}</td>
            <td>{{ item.fullName }}</td>
            <td>{{ item.courseTitle }}</td>
            <td>{{ item.progressPercentage }}%</td>
            <td>{{ item.latestScore !== null ? item.latestScore + ' 分' : 'N/A' }}</td>
            <td>{{ item.quizAttempts }} 次</td>
            <td>{{ new Date(item.registeredAt).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAdminStore } from '@/stores/admin';
import { useCourseStore } from '@/stores/course';
import { formOptions } from '@/config/forms';

const adminStore = useAdminStore();
const courseStore = useCourseStore();
const allProgress = ref([]);
const loading = ref(true);
const selectedBranch = ref('');
const selectedCourse = ref('');

onMounted(async () => {
  loading.value = true;
  await courseStore.fetchAllCourses();
  allProgress.value = await adminStore.fetchAllStudentProgress();
  loading.value = false;
});

const filteredProgress = computed(() => {
  return allProgress.value.filter(item => {
    const branchMatch = !selectedBranch.value || item.branch === selectedBranch.value;
    // The data from fetchAllStudentProgress has courseTitle, not courseId.
    // Let's find the course id from the title or adjust the data structure.
    // For now, let's match by title if a course is selected.
    const selectedCourseTitle = selectedCourse.value ? courseStore.courses.find(c => c.id === selectedCourse.value)?.title : '';
    const courseMatch = !selectedCourse.value || item.courseTitle === selectedCourseTitle;
    return branchMatch && courseMatch;
  });
});

const exportToCSV = () => {
  alert('匯出 CSV 功能尚未實作');
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

.form-group {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}
</style>