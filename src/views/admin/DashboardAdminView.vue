<template>
  <div class="admin-dashboard">
    <div class="header-container">
      <div class="title-group">
        <h2 class="section-title">學員學習數據</h2>
        <p class="section-subtitle">即時追蹤各分店學員的課程進度與測驗表現</p>
      </div>
      <div class="header-actions">
        <div class="view-toggle-container">
          <button 
            class="toggle-btn" 
            :class="{ active: viewMode === 'card' }"
            @click="viewMode = 'card'"
          >
            卡片
          </button>
          <button 
            class="toggle-btn" 
            :class="{ active: viewMode === 'table' }"
            @click="viewMode = 'table'"
          >
            列表
          </button>
        </div>
        <button class="btn-export" @click="exportToCSV">
          <span>匯出 CSV</span>
        </button>
      </div>
    </div>

    <!-- Aggregate Metrics -->
    <div class="metrics-grid">
      <div class="metric-card card-soft pastel-blue">
        <div class="metric-info">
          <span class="metric-label">總註冊學員</span>
          <p class="metric-value">{{ adminStore.studentList.length }} <span class="unit">人</span></p>
        </div>
      </div>
      <div class="metric-card card-soft pastel-green">
        <div class="metric-info">
          <span class="metric-label">進行中課程</span>
          <p class="metric-value">{{ allProgress.length }} <span class="unit">堂</span></p>
        </div>
      </div>
      <div class="metric-card card-soft pastel-orange">
        <div class="metric-info">
          <span class="metric-label">平均完課率</span>
          <p class="metric-value">{{ averageCompletion }} <span class="unit">%</span></p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-container card">
      <div class="filter-item">
        <label class="filter-label">分店篩選</label>
        <select class="soft-select" v-model="selectedBranch">
          <option value="">所有分店</option>
          <option v-for="branch in formOptions.branchOptions" :key="branch" :value="branch">
            {{ branch }}
          </option>
        </select>
      </div>
      <div class="filter-item" v-if="viewMode === 'table'">
        <label class="filter-label">課程篩選</label>
        <select class="soft-select" v-model="selectedCourse">
          <option value="">所有課程</option>
          <option v-for="course in courseStore.courses" :key="course.id" :value="course.id">
            {{ course.title }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state card">
      <div class="loader"></div>
      <p>正在同步學員數據...</p>
    </div>

    <!-- View Modes -->
    <div v-else class="content-view">
      <!-- Card View (Directory) -->
      <transition name="stagger">
        <div v-if="viewMode === 'card'">
          <div v-if="Object.keys(studentsByBranch).length === 0" class="empty-state">
            <p>目前沒有符合條件的學員資料</p>
          </div>
          <div v-for="(students, branch) in studentsByBranch" :key="branch" class="branch-section">
            <div class="branch-header">
              <span class="branch-dot"></span>
              <h3 class="branch-name">{{ branch }}</h3>
              <span class="branch-count">{{ students.length }} 位學員</span>
            </div>
            <div class="student-grid">
              <AdminStudentCard v-for="student in students" :key="student.uid" :student="student" />
            </div>
          </div>
        </div>

        <!-- Table View (Data) -->
        <div v-else-if="viewMode === 'table'" class="table-card card">
          <div class="table-wrapper">
            <table class="soft-table">
              <thead>
                <tr>
                  <th>分店</th>
                  <th>姓名</th>
                  <th>課程名稱</th>
                  <th>進度</th>
                  <th>測驗分數</th>
                  <th>次數</th>
                  <th>註冊日</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredProgress.length === 0">
                  <td colspan="7" class="empty-cell">沒有符合篩選條件的進度紀錄</td>
                </tr>
                <tr v-for="(item, index) in filteredProgress" :key="index">
                  <td><span class="branch-pill">{{ item.branch }}</span></td>
                  <td class="student-name">{{ item.fullName }}</td>
                  <td class="course-name">{{ item.courseTitle }}</td>
                  <td>
                    <div class="progress-box">
                      <div class="progress-bar-container">
                        <div class="progress-bar-fill" :style="{ width: item.progressPercentage + '%' }"></div>
                      </div>
                      <span class="progress-number">{{ item.progressPercentage }}%</span>
                    </div>
                  </td>
                  <td class="score-cell">
                    <span :class="['score-pill', getScoreClass(item.latestScore)]">
                      {{ item.latestScore !== null ? item.latestScore : '-' }}
                    </span>
                  </td>
                  <td class="attempts-cell">{{ item.quizAttempts }}</td>
                  <td class="date-cell">{{ new Date(item.registeredAt).toLocaleDateString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAdminStore } from '@/stores/admin';
import { useCourseStore } from '@/stores/course';
import { formOptions } from '@/config/forms';
import AdminStudentCard from '@/components/AdminStudentCard.vue';

const adminStore = useAdminStore();
const courseStore = useCourseStore();
const allProgress = ref([]);
const loading = ref(true);
const selectedBranch = ref('');
const selectedCourse = ref('');
const viewMode = ref('card');

onMounted(async () => {
  loading.value = true;
  await Promise.all([
    courseStore.fetchAllCourses(),
    adminStore.fetchAllStudents()
  ]);
  allProgress.value = await adminStore.fetchAllStudentProgress();
  loading.value = false;
});

const studentsByBranch = computed(() => {
  return adminStore.studentList
    .filter(student => !selectedBranch.value || student.branch === selectedBranch.value)
    .reduce((acc, student) => {
      const branch = student.branch || '未分類';
      if (!acc[branch]) acc[branch] = [];
      acc[branch].push(student);
      return acc;
    }, {});
});

const filteredProgress = computed(() => {
  return allProgress.value.filter(item => {
    const branchMatch = !selectedBranch.value || item.branch === selectedBranch.value;
    const selectedCourseTitle = selectedCourse.value ? courseStore.courses.find(c => c.id === selectedCourse.value)?.title : '';
    const courseMatch = !selectedCourse.value || item.courseTitle === selectedCourseTitle;
    return branchMatch && courseMatch;
  });
});

const averageCompletion = computed(() => {
  if (allProgress.value.length === 0) return 0;
  const sum = allProgress.value.reduce((acc, item) => acc + item.progressPercentage, 0);
  return Math.round(sum / allProgress.value.length);
});

const getScoreClass = (score) => {
  if (score === null) return '';
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-medium';
  return 'score-low';
};

const exportToCSV = () => {
  // Implementation logic for CSV export
  const headers = ['分店', '姓名', '課程', '進度', '分數', '次數', '註冊日'];
  const rows = filteredProgress.value.map(item => [
    item.branch,
    item.fullName,
    item.courseTitle,
    `${item.progressPercentage}%`,
    item.latestScore || '-',
    item.quizAttempts,
    new Date(item.registeredAt).toLocaleDateString()
  ]);
  
  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `student_progress_${new Date().toLocaleDateString()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<style scoped>
.admin-dashboard {
  animation: fadeIn 0.5s ease-out;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--space-32);
}

.section-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: 8px;
}

.section-subtitle {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.header-actions {
  display: flex;
  gap: var(--space-16);
}

.view-toggle-container {
  display: flex;
  padding: 4px;
  background-color: var(--color-secondary);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
}

.toggle-btn {
  padding: 8px 20px;
  border-radius: var(--radius-full);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: var(--font-size-sm);
}

.toggle-btn.active {
  background-color: white;
  color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.btn-export {
  padding: 10px 24px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-export:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Metrics Cards */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-24);
  margin-bottom: var(--space-32);
}

.metric-card {
  display: flex;
  align-items: center;
  gap: var(--space-20);
  padding: var(--space-24);
  transition: transform 0.3s ease;
}

.metric-label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.metric-value {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin: 0;
}

.unit {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  opacity: 0.7;
}

/* Colors */
.pastel-blue { background-color: #E3F2FD; }
.pastel-green { background-color: #E8F5E9; }
.pastel-orange { background-color: #FFF3E0; }

/* Filters */
.filters-container {
  display: flex;
  gap: var(--space-24);
  padding: var(--space-20);
  margin-bottom: var(--space-32);
  background: white;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.soft-select {
  padding: 10px 16px;
  border-radius: var(--radius-md);
  border: 2px solid var(--color-secondary);
  background: white;
  color: var(--color-text);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  outline: none;
  transition: border-color 0.3s ease;
}

.soft-select:focus {
  border-color: var(--color-primary);
}

/* Branch Sections */
.branch-section {
  margin-bottom: var(--space-40);
}

.branch-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: var(--space-20);
  padding-left: 8px;
}

.branch-dot {
  width: 12px;
  height: 12px;
  background-color: var(--color-primary);
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(74, 144, 226, 0.1);
}

.branch-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.branch-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background: var(--color-secondary);
  padding: 2px 12px;
  border-radius: var(--radius-full);
}

.student-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-20);
}

/* Table Styles */
.table-card {
  padding: 0;
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.soft-table {
  width: 100%;
  border-collapse: collapse;
}

.soft-table th {
  background-color: var(--color-secondary);
  padding: 16px 20px;
  text-align: left;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.soft-table td {
  padding: 20px;
  border-bottom: 1px solid rgba(0,0,0,0.03);
  font-size: var(--font-size-sm);
}

.student-name {
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
}

.course-name {
  color: var(--color-text-secondary);
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.branch-pill {
  padding: 4px 12px;
  background: var(--color-secondary);
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: var(--font-weight-bold);
}

.progress-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar-container {
  width: 100px;
  height: 8px;
  background: var(--color-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-full);
}

.progress-number {
  font-weight: var(--font-weight-bold);
  min-width: 40px;
}

.score-pill {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-bold);
  font-size: 12px;
}

.score-high { background: #E8F5E9; color: #2E7D32; }
.score-medium { background: #FFF3E0; color: #EF6C00; }
.score-low { background: #FFEBEE; color: #C62828; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .header-container {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>