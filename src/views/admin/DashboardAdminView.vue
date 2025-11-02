<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2>總覽儀表板</h2>
      <button class="btn btn--primary" @click="exportToCSV">匯出 CSV</button>
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
          <tr v-else-if="allProgress.length === 0">
            <td colspan="7" style="text-align: center;">沒有可顯示的學員進度。</td>
          </tr>
          <tr v-for="(item, index) in allProgress" :key="index">
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
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const allProgress = ref([]);
const loading = ref(true);

onMounted(async () => {
  loading.value = true;
  // This action needs to be created
  allProgress.value = await authStore.fetchAllStudentProgress();
  loading.value = false;
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
</style>
