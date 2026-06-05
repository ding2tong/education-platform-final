<script setup>
import { computed, onMounted, onUnmounted, watch, ref } from 'vue'
import RevealSlides from '@/components/RevealSlides.vue'
import { useRoute, useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

// ── 響應式路由參數（切換單元時自動更新）──
const courseId = computed(() => route.params.courseId)
const lessonId = computed(() => route.params.lessonId)
const revealSlidesRef = ref(null)

// 記住進入前的狀態
let wasCollapsedBefore = false

onMounted(async () => {
  if (!courseStore.currentCourse || courseStore.currentCourse.id !== courseId.value) {
    await courseStore.fetchCourseDetails(courseId.value)
  }
  wasCollapsedBefore = uiStore.sidebarCollapsed
  if (!uiStore.sidebarCollapsed) uiStore.toggleSidebar()
})

onUnmounted(() => {
  if (!wasCollapsedBefore && uiStore.sidebarCollapsed) uiStore.toggleSidebar()
  if (revealSlidesRef.value) revealSlidesRef.value.destroyDeck()
})

// ── 監聽課程切換（若跳到不同課程） ──
watch(courseId, async (newId) => {
  if (!courseStore.currentCourse || courseStore.currentCourse.id !== newId) {
    await courseStore.fetchCourseDetails(newId)
  }
})

const lesson = computed(() => {
  return courseStore.currentCourse?.lessons?.find((l) => l.id === lessonId.value)
})

const lessons = computed(() => courseStore.currentCourse?.lessons || [])

const completedCount = computed(() =>
  lessons.value.filter(l => authStore.isLessonCompleted(courseId.value, l.id)).length
)

const progressPercent = computed(() => {
  if (!lessons.value.length) return 0
  return Math.round((completedCount.value / lessons.value.length) * 100)
})

const iframeSrc = computed(() => {
  if (!lesson.value?.content) return null
  const match = lesson.value.content.match(/<iframe.*?src="(.*?)".*?<\/iframe>/)
  return match ? match[1] : null
})

const openOriginalLink = () => {
  if (iframeSrc.value) window.open(iframeSrc.value, '_blank')
}

const markComplete = () => {
  authStore.markLessonComplete(courseId.value, lessonId.value)
}

const startQuiz = (isLessonQuiz) => {
  const params = { courseId: courseId.value }
  const query = {}
  if (isLessonQuiz) query.lessonId = lessonId.value
  router.push({ name: 'quiz', params, query })
}

const goToLesson = (targetLessonId) => {
  router.push({ name: 'lesson', params: { courseId: courseId.value, lessonId: targetLessonId } })
}

const goBack = () => {
  router.push({ name: 'courses' })
}

const currentIndex = computed(() =>
  lessons.value.findIndex(l => l.id === lessonId.value)
)
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < lessons.value.length - 1)

const goPrev = () => {
  if (hasPrev.value) goToLesson(lessons.value[currentIndex.value - 1].id)
}
const goNext = () => {
  if (hasNext.value) goToLesson(lessons.value[currentIndex.value + 1].id)
}
</script>

<template>
  <div class="lesson-page" @before-leave="revealSlidesRef?.destroyDeck()">

    <!-- ── Left: Course Outline Panel ── -->
    <aside class="outline-panel">
      <div class="outline-header">
        <button class="back-btn" @click="goBack">課程中心</button>
        <h3 class="outline-course-title">{{ courseStore.currentCourse?.title }}</h3>
      </div>

      <div class="outline-progress">
        <div class="outline-progress-bar">
          <div class="outline-progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <span class="outline-progress-label">{{ progressPercent }}% 課程進度</span>
      </div>

      <div class="outline-divider"></div>

      <nav class="outline-nav">
        <div
          v-for="(l, idx) in lessons"
          :key="l.id"
          class="outline-item"
          :class="{
            'is-active': l.id === lessonId,
            'is-done': authStore.isLessonCompleted(courseId, l.id)
          }"
          @click="goToLesson(l.id)"
        >
          <div class="outline-check">
            <div class="check-ring" :class="{ 'done': authStore.isLessonCompleted(courseId, l.id), 'active': l.id === lessonId }">
              <span v-if="authStore.isLessonCompleted(courseId, l.id)" class="check-tick"></span>
              <span v-else class="check-num">{{ (idx + 1).toString().padStart(2, '0') }}</span>
            </div>
          </div>
          <div class="outline-text">
            <span class="outline-lesson-title">{{ l.title }}</span>
          </div>
        </div>
      </nav>
    </aside>

    <!-- ── Right: Main Content ── -->
    <main class="lesson-main" v-if="lesson">
      <!-- Top nav bar -->
      <nav class="lesson-topbar">
        <div class="topbar-left">
          <span class="topbar-breadcrumb">{{ courseStore.currentCourse?.title }}</span>
          <span class="topbar-sep">/</span>
          <h1 class="topbar-title">{{ lesson.title }}</h1>
        </div>
        <div class="topbar-right">
          <div class="status-badge" :class="authStore.isLessonCompleted(courseId, lessonId) ? 'done' : 'pending'">
            {{ authStore.isLessonCompleted(courseId, lessonId) ? '已完成' : '學習中' }}
          </div>
        </div>
      </nav>

      <!-- Player -->
      <div class="player-wrap">
        <RevealSlides ref="revealSlidesRef" :key="lessonId" :markdown="lesson.content" />
      </div>

      <!-- Bottom actions -->
      <div class="lesson-footer">
        <div class="footer-nav">
          <button class="nav-btn" :disabled="!hasPrev" @click="goPrev">上一單元</button>
          <button class="nav-btn" :disabled="!hasNext" @click="goNext">下一單元</button>
        </div>
        <div class="footer-actions">
          <button class="btn-secondary" @click="openOriginalLink" v-if="iframeSrc">原始連結</button>
          <button class="btn-quiz" @click="startQuiz(true)" v-if="lesson.quiz">單元小測驗</button>
          <button
            class="btn-complete"
            :class="{ 'is-done': authStore.isLessonCompleted(courseId, lessonId) }"
            @click="markComplete"
          >
            {{ authStore.isLessonCompleted(courseId, lessonId) ? '已完成' : '標記為完成' }}
          </button>
        </div>
      </div>
    </main>

    <!-- Loading -->
    <div class="lesson-loading" v-else>
      <div class="loader-ring"></div>
      <p>正在載入學習內容...</p>
    </div>
  </div>
</template>

<style scoped>
/* ── Page Layout ── */
.lesson-page {
  display: flex;
  min-height: 100vh;
  background: var(--color-background);
  animation: fadeIn 0.3s ease-out;
}

/* ── Outline Panel ── */
.outline-panel {
  width: 280px;
  min-width: 280px;
  height: 100vh;
  position: sticky;
  top: 0;
  background: white;
  border-right: 1px solid var(--color-secondary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 2px 0 16px rgba(0, 0, 0, 0.03);
}

.outline-header {
  padding: 24px 20px 16px;
}

.back-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  padding: 0;
  margin-bottom: 12px;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.back-btn::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-left: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
}

.back-btn:hover {
  color: var(--color-primary);
}

.outline-course-title {
  font-size: 0.95rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin: 0;
  line-height: 1.4;
}

.outline-progress {
  padding: 0 20px 16px;
}

.outline-progress-bar {
  height: 5px;
  background: var(--color-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: 6px;
}

.outline-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.outline-progress-label {
  font-size: 0.72rem;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-bold);
}

.outline-divider {
  height: 1px;
  background: var(--color-secondary);
  margin: 0 20px;
}

.outline-nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px;
  scrollbar-width: thin;
  scrollbar-color: var(--color-secondary) transparent;
}

.outline-nav::-webkit-scrollbar {
  width: 4px;
}
.outline-nav::-webkit-scrollbar-track {
  background: transparent;
}
.outline-nav::-webkit-scrollbar-thumb {
  background: var(--color-secondary);
  border-radius: 4px;
}

/* Outline Item */
.outline-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 10px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;
}

.outline-item:hover {
  background: var(--color-secondary);
}

.outline-item.is-active {
  background: #EEF0FF;
}

.outline-item.is-active .outline-lesson-title {
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}

/* Check ring */
.outline-check {
  flex-shrink: 0;
  margin-top: 1px;
}

.check-ring {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #D1D5DB;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
}

.check-ring.done {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.check-ring.active:not(.done) {
  border-color: var(--color-primary);
}

.check-tick {
  display: block;
  width: 6px;
  height: 10px;
  border-right: 2px solid white;
  border-bottom: 2px solid white;
  transform: rotate(45deg) translate(-1px, -1px);
}

.check-num {
  font-size: 0.62rem;
  font-weight: var(--font-weight-bold);
  color: #9CA3AF;
}

.check-ring.active:not(.done) .check-num {
  color: var(--color-primary);
}

.outline-lesson-title {
  font-size: 0.84rem;
  color: var(--color-text);
  line-height: 1.4;
  font-weight: var(--font-weight-medium);
}

/* ── Main Content ── */
.lesson-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 24px 28px;
}

/* Top bar */
.lesson-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
}

.topbar-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.topbar-breadcrumb {
  font-size: 0.78rem;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
}

.topbar-sep {
  color: var(--color-text-secondary);
  opacity: 0.4;
}

.topbar-title {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar-right {
  flex-shrink: 0;
}

.status-badge {
  padding: 5px 14px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
}

.status-badge.done {
  background: #E8F5E9;
  color: #2E7D32;
}

.status-badge.pending {
  background: var(--color-secondary);
  color: var(--color-text-secondary);
}

/* Player */
.player-wrap {
  flex: 1;
  background: #000;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  margin-bottom: 20px;
  aspect-ratio: 16/9;
  min-height: 0;
}

.player-wrap :deep(.reveal) {
  width: 100%;
  height: 100%;
}

/* Footer */
.lesson-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 8px;
}

.footer-nav {
  display: flex;
  gap: 8px;
}

.footer-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.nav-btn {
  padding: 9px 18px;
  background: var(--color-secondary);
  color: var(--color-text-secondary);
  border: none;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-bold);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:not(:disabled):hover {
  background: var(--color-primary);
  color: white;
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 9px 18px;
  background: var(--color-secondary);
  color: var(--color-text-secondary);
  border: none;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-bold);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #E5E7EB;
  color: var(--color-text);
}

.btn-quiz {
  padding: 9px 20px;
  background: #FFF3E0;
  color: #E65100;
  border: none;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-bold);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-quiz:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 12px rgba(230, 81, 0, 0.15);
}

.btn-complete {
  padding: 9px 22px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-bold);
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-complete:hover:not(.is-done) {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.3);
}

.btn-complete.is-done {
  background: #4CAF50;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
  cursor: default;
}

/* Loading */
.lesson-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  gap: 16px;
}

.loader-ring {
  width: 44px;
  height: 44px;
  border: 3px solid var(--color-secondary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Animations */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 768px) {
  .outline-panel {
    display: none;
  }
  .lesson-main {
    padding: 16px;
  }
}
</style>
