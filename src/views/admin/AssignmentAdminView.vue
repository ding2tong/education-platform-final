<template>
  <div class="assignment-admin">
    <div class="page-heading">
      <div>
        <h2>指定課程任務</h2>
        <p>指定已上架課程給全部學生或特定分店，學生需完成所有單元與課程總測驗。</p>
      </div>
      <button type="button" class="btn btn--outline btn--sm" @click="resetForm">清空表單</button>
    </div>

    <form class="card assignment-form" @submit.prevent="saveAssignment">
      <div class="card__body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">任務名稱</label>
            <input v-model="form.title" class="form-control" type="text" placeholder="例如：六月新人必修訓練" required>
          </div>
          <div class="form-group">
            <label class="form-label">指定課程</label>
            <select v-model="form.courseId" class="form-control" required>
              <option disabled value="">請選擇已上架課程</option>
              <option v-for="course in publishedCourses" :key="course.id" :value="course.id">
                {{ course.title }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">開始時間</label>
            <input v-model="form.startsAt" class="form-control" type="datetime-local" required>
          </div>
          <div class="form-group">
            <label class="form-label">截止時間</label>
            <input v-model="form.dueAt" class="form-control" type="datetime-local" required>
          </div>
          <div class="form-group">
            <label class="form-label">任務狀態</label>
            <select v-model="form.status" class="form-control">
              <option value="active">啟用</option>
              <option value="draft">草稿</option>
              <option value="closed">關閉</option>
            </select>
          </div>
        </div>

        <div class="target-panel">
          <label class="form-label">指定對象</label>
          <div class="target-options">
            <label class="target-option">
              <input v-model="form.targetType" type="radio" value="all">
              <span>全部學生</span>
            </label>
            <label class="target-option">
              <input v-model="form.targetType" type="radio" value="branches">
              <span>指定分店</span>
            </label>
          </div>

          <div v-if="form.targetType === 'branches'" class="branch-options">
            <label v-for="branch in formOptions.branchOptions" :key="branch" class="branch-option">
              <input v-model="form.targetBranches" type="checkbox" :value="branch">
              <span>{{ branch }}</span>
            </label>
          </div>
        </div>

        <div class="form-note">完成條件固定為：完成所有單元 + 完成課程總測驗。截止後仍可補完成，報表會標記為逾期完成。</div>

        <div class="form-actions">
          <button type="submit" class="btn btn--primary">{{ form.id ? '更新任務' : '建立任務' }}</button>
        </div>
      </div>
    </form>

    <div class="assignment-list">
      <div v-for="assignment in assignmentStore.assignments" :key="assignment.id" class="assignment-card card">
        <div>
          <div class="assignment-title-row">
            <h3>{{ assignment.title }}</h3>
            <span class="status-pill" :class="assignment.status">{{ getStatusLabel(assignment.status) }}</span>
          </div>
          <p>{{ assignment.courseTitle }}</p>
          <div class="assignment-meta">
            <span>開始：{{ formatDateTime(assignment.startsAt) }}</span>
            <span>截止：{{ formatDateTime(assignment.dueAt) }}</span>
            <span>{{ getTargetText(assignment) }}</span>
          </div>
        </div>
        <div class="assignment-actions">
          <button type="button" class="btn btn--sm btn--outline" @click="editAssignment(assignment)">編輯</button>
          <button type="button" class="btn btn--sm btn--danger" @click="deleteAssignment(assignment)">刪除</button>
        </div>
      </div>
    </div>

    <p v-if="message" class="status-message">{{ message }}</p>
    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAssignmentStore } from '@/stores/assignment'
import { useCourseStore } from '@/stores/course'
import { formOptions } from '@/config/forms'

const assignmentStore = useAssignmentStore()
const courseStore = useCourseStore()

const message = ref('')
const error = ref('')

const emptyForm = () => ({
  id: '',
  title: '',
  courseId: '',
  startsAt: toDateTimeLocal(new Date()),
  dueAt: toDateTimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  targetType: 'all',
  targetBranches: [],
  status: 'active',
})

const form = ref(emptyForm())

const publishedCourses = computed(() => courseStore.courses.filter(course => course.published))

onMounted(async () => {
  await Promise.all([
    courseStore.fetchAllCourses(),
    assignmentStore.fetchAssignments(),
  ])
})

function toDateTimeLocal(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

const localToIso = (value) => value ? new Date(value).toISOString() : ''

const isoToLocal = (value) => value ? toDateTimeLocal(new Date(value)) : ''

const saveAssignment = async () => {
  message.value = ''
  error.value = ''
  const selectedCourse = courseStore.courses.find(course => course.id === form.value.courseId)
  if (!selectedCourse) {
    error.value = '請選擇課程。'
    return
  }
  if (form.value.targetType === 'branches' && form.value.targetBranches.length === 0) {
    error.value = '請至少選擇一個分店。'
    return
  }
  if (new Date(form.value.dueAt) <= new Date(form.value.startsAt)) {
    error.value = '截止時間必須晚於開始時間。'
    return
  }

  try {
    await assignmentStore.saveAssignment({
      ...form.value,
      courseTitle: selectedCourse.title,
      startsAt: localToIso(form.value.startsAt),
      dueAt: localToIso(form.value.dueAt),
    })
    message.value = form.value.id ? '指定任務已更新。' : '指定任務已建立。'
    resetForm()
  } catch (err) {
    console.error(err)
    error.value = err.message || '儲存指定任務失敗。'
  }
}

const editAssignment = (assignment) => {
  form.value = {
    id: assignment.id,
    title: assignment.title,
    courseId: assignment.courseId,
    startsAt: isoToLocal(assignment.startsAt),
    dueAt: isoToLocal(assignment.dueAt),
    targetType: assignment.targetType || 'all',
    targetBranches: [...(assignment.targetBranches || [])],
    status: assignment.status || 'active',
  }
}

const deleteAssignment = async (assignment) => {
  if (!confirm(`確定要刪除「${assignment.title}」嗎？`)) return
  try {
    await assignmentStore.deleteAssignment(assignment.id)
    message.value = '指定任務已刪除。'
  } catch (err) {
    console.error(err)
    error.value = '刪除指定任務失敗。'
  }
}

const resetForm = () => {
  form.value = emptyForm()
}

const formatDateTime = (value) => value ? new Date(value).toLocaleString('zh-TW') : '未設定'

const getTargetText = (assignment) => {
  if (assignment.targetType === 'branches') return `指定分店：${assignment.targetBranches?.join('、') || '未設定'}`
  return '全部學生'
}

const getStatusLabel = (status) => {
  const labels = { active: '啟用', draft: '草稿', closed: '關閉' }
  return labels[status] || status
}
</script>

<style scoped>
.assignment-admin,
.assignment-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

.page-heading,
.assignment-card,
.assignment-title-row,
.assignment-meta,
.assignment-actions,
.target-options,
.branch-options {
  display: flex;
  gap: var(--space-12);
}

.page-heading,
.assignment-card {
  justify-content: space-between;
  align-items: flex-start;
}

.page-heading p,
.assignment-card p,
.assignment-meta,
.form-note {
  color: var(--color-text-secondary);
}

.assignment-form {
  overflow: hidden;
}

.form-row {
  display: flex;
  gap: var(--space-24);
  flex-wrap: wrap;
}

.form-row .form-group {
  flex: 1;
  min-width: 220px;
}

.target-panel {
  padding: var(--space-16);
  border-radius: var(--radius-base);
  background: var(--color-secondary);
  margin-bottom: var(--space-24);
}

.target-options,
.branch-options {
  flex-wrap: wrap;
}

.target-option,
.branch-option {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-full);
  background: white;
  font-weight: var(--font-weight-bold);
}

.form-note {
  padding: var(--space-12);
  border-radius: var(--radius-base);
  background: var(--color-pastel-blue);
  margin-bottom: var(--space-24);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.assignment-card {
  padding: var(--space-20);
}

.assignment-title-row {
  align-items: center;
  margin-bottom: var(--space-8);
}

.assignment-title-row h3 {
  margin: 0;
}

.assignment-meta {
  flex-wrap: wrap;
  margin-top: var(--space-12);
  font-size: var(--font-size-sm);
}

.assignment-actions {
  flex-shrink: 0;
}

.status-pill {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  background: var(--color-secondary);
}

.status-pill.active {
  background: var(--color-pastel-green);
  color: #15803d;
}

.status-pill.draft {
  background: var(--color-pastel-orange);
  color: #b45309;
}

.status-pill.closed {
  background: var(--color-secondary-active);
}

.status-message,
.error-message {
  padding: var(--space-16);
  border-radius: var(--radius-base);
}

.status-message {
  background: var(--color-pastel-green);
  color: #15803d;
}

@media (max-width: 800px) {
  .page-heading,
  .assignment-card {
    flex-direction: column;
  }
}
</style>
