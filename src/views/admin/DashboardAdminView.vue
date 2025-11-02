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
          <option>寧夏</option>
          <option>三和</option>
          <option>武昌</option>
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
import { useAuthStore } from '@/stores/auth';
import { useCourseStore } from '@/stores/course';

const authStore = useAuthStore();
const courseStore = useCourseStore();
const allProgress = ref([]);
const loading = ref(true);
const selectedBranch = ref('');
const selectedCourse = ref('');

onMounted(async () => {
  loading.value = true;
  await courseStore.fetchAllCourses();
  allProgress.value = await authStore.fetchAllStudentProgress();
  loading.value = false;
});

const filteredProgress = computed(() => {
  return allProgress.value.filter(item => {
    const branchMatch = !selectedBranch.value || item.branch === selectedBranch.value;
    const courseMatch = !selectedCourse.value || item.courseId === selectedCourse.value;
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