<template>
  <div class="assignment-report">
    <div class="page-heading">
      <div>
        <h2>任務完成報表</h2>
        <p>查看指定課程任務在各店的完成比例與學生狀態。</p>
      </div>
      <button type="button" class="btn btn--outline btn--sm" @click="loadAssignments">重新整理任務</button>
    </div>

    <div class="card report-filter">
      <div class="card__body filter-body">
        <div class="form-group">
          <label class="form-label">選擇指定任務</label>
          <select v-model="selectedAssignmentId" class="form-control">
            <option disabled value="">請選擇任務</option>
            <option v-for="assignment in assignmentStore.assignments" :key="assignment.id" :value="assignment.id">
              {{ assignment.title }} - {{ assignment.courseTitle }}
            </option>
          </select>
        </div>
        <button type="button" class="btn btn--primary" :disabled="!selectedAssignmentId || loading" @click="generateReport">
          {{ loading ? '產生中...' : '產生報表' }}
        </button>
      </div>
    </div>

    <template v-if="report">
      <section class="report-header card">
        <div>
          <h3>{{ report.assignment.title }}</h3>
          <p>{{ report.assignment.courseTitle }}</p>
        </div>
        <div class="report-meta">
          <span>截止：{{ formatDateTime(report.assignment.dueAt) }}</span>
          <span>產生：{{ formatDateTime(report.generatedAt) }}</span>
        </div>
      </section>

      <section class="branch-grid">
        <div v-for="branch in report.branchStats" :key="branch.branch" class="branch-card card">
          <span class="branch-name">{{ branch.branch }}</span>
          <strong>{{ branch.completionRate || 0 }}%</strong>
          <p>{{ branch.completed }} / {{ branch.total }} 人完成</p>
          <div class="mini-bars">
            <span>準時 {{ branch.onTime }}</span>
            <span>逾期完成 {{ branch.overdueCompleted }}</span>
            <span>未完成 {{ branch.overdue + branch.inProgress }}</span>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card__body">
          <div class="table-header">
            <h3>學生完成狀態</h3>
            <button type="button" class="btn btn--outline btn--sm" @click="downloadCsv">匯出 CSV</button>
          </div>
          <div class="report-table">
            <div class="table-row table-head">
              <span>分店</span>
              <span>姓名</span>
              <span>單元進度</span>
              <span>測驗分數</span>
              <span>完成時間</span>
              <span>狀態</span>
            </div>
            <div v-for="row in report.rows" :key="row.uid" class="table-row">
              <span>{{ row.branch }}</span>
              <span>{{ row.fullName }}</span>
              <span>{{ row.completedLessons }} / {{ row.totalLessons }}</span>
              <span>{{ row.quizScore ?? '-' }}</span>
              <span>{{ row.completedAt ? formatDateTime(row.completedAt) : '-' }}</span>
              <span class="status-label" :class="row.status">{{ getStatusLabel(row.status) }}</span>
            </div>
          </div>
        </div>
      </section>
    </template>

    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useAssignmentStore } from '@/stores/assignment'

const assignmentStore = useAssignmentStore()
const selectedAssignmentId = ref('')
const report = ref(null)
const loading = ref(false)
const error = ref('')

onMounted(() => {
  loadAssignments()
})

const loadAssignments = async () => {
  error.value = ''
  try {
    await assignmentStore.fetchAssignments()
  } catch (err) {
    console.error(err)
    error.value = '載入指定任務失敗。'
  }
}

const generateReport = async () => {
  loading.value = true
  error.value = ''
  try {
    report.value = await assignmentStore.buildAssignmentReport(selectedAssignmentId.value)
  } catch (err) {
    console.error(err)
    error.value = err.message || '產生報表失敗。'
  } finally {
    loading.value = false
  }
}

const formatDateTime = (value) => value ? new Date(value).toLocaleString('zh-TW') : '-'

const getStatusLabel = (status) => {
  const labels = {
    completed: '準時完成',
    'overdue-completed': '逾期完成',
    overdue: '逾期未完成',
    'in-progress': '進行中',
  }
  return labels[status] || status
}

const downloadCsv = () => {
  if (!report.value) return
  const headers = ['分店', '姓名', 'Email', '單元進度', '測驗分數', '完成時間', '狀態']
  const rows = report.value.rows.map(row => [
    row.branch,
    row.fullName,
    row.email,
    `${row.completedLessons}/${row.totalLessons}`,
    row.quizScore ?? '',
    row.completedAt ? formatDateTime(row.completedAt) : '',
    getStatusLabel(row.status),
  ])
  const csv = [headers, ...rows]
    .map(cols => cols.map(col => `"${String(col).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${report.value.assignment.title}_完成報表.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
</script>

<style scoped>
.assignment-report {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

.page-heading,
.filter-body,
.report-header,
.report-meta,
.table-header {
  display: flex;
  gap: var(--space-16);
}

.page-heading,
.report-header,
.table-header {
  justify-content: space-between;
  align-items: flex-start;
}

.page-heading p,
.report-header p,
.report-meta,
.branch-card p,
.mini-bars {
  color: var(--color-text-secondary);
}

.filter-body {
  align-items: flex-end;
}

.filter-body .form-group {
  flex: 1;
  margin-bottom: 0;
}

.report-meta {
  flex-direction: column;
  align-items: flex-end;
  font-size: var(--font-size-sm);
}

.report-header,
.branch-card {
  padding: var(--space-20);
}

.branch-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-16);
}

.branch-name {
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}

.branch-card strong {
  display: block;
  font-size: 36px;
  margin: var(--space-8) 0;
}

.mini-bars {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: var(--space-12);
  font-size: var(--font-size-sm);
}

.report-table {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  overflow-x: auto;
}

.table-row {
  display: grid;
  grid-template-columns: 90px 140px 100px 90px 180px 110px;
  gap: var(--space-12);
  align-items: center;
  min-width: 760px;
  padding: var(--space-12);
  border-radius: var(--radius-base);
  background: var(--color-secondary);
}

.table-head {
  background: var(--color-pastel-purple);
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}

.status-label {
  font-weight: var(--font-weight-bold);
}

.status-label.completed {
  color: #15803d;
}

.status-label.overdue-completed {
  color: #b45309;
}

.status-label.overdue {
  color: var(--color-error);
}

.error-message {
  padding: var(--space-16);
  border-radius: var(--radius-base);
}

@media (max-width: 900px) {
  .page-heading,
  .filter-body,
  .report-header {
    flex-direction: column;
  }

  .branch-grid {
    grid-template-columns: 1fr;
  }

  .report-meta {
    align-items: flex-start;
  }
}
</style>
