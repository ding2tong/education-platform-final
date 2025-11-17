<script setup>
import { computed, onMounted } from 'vue'
import RevealSlides from '@/components/RevealSlides.vue'
import { useRoute, useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()
const authStore = useAuthStore()

const courseId = route.params.courseId
const lessonId = route.params.lessonId

onMounted(() => {
  // Ensure the course details, including lessons, are loaded
  if (!courseStore.currentCourse || courseStore.currentCourse.id !== courseId) {
    courseStore.fetchCourseDetails(courseId)
  }
})

const lesson = computed(() => {
  return courseStore.currentCourse?.lessons?.find((l) => l.id === lessonId)
})

const iframeSrc = computed(() => {
  if (!lesson.value?.content) return null
  const match = lesson.value.content.match(/<iframe.*?src="(.*?)".*?<\/iframe>/)
  return match ? match[1] : null
})

const openOriginalLink = () => {
  if (iframeSrc.value) {
    window.open(iframeSrc.value, '_blank')
  }
}

const markComplete = () => {
  authStore.markLessonComplete(courseId, lessonId)
  alert('已標記為完成！')
}

const startQuiz = (isLessonQuiz) => {
  const params = { courseId: courseId }
  const query = {}
  if (isLessonQuiz) {
    query.lessonId = lessonId
  }
  router.push({ name: 'quiz', params: params, query: query })
}
</script>

<template>
  <div class="page">
    <div class="container" v-if="lesson">
      <div class="lesson-header">
        <button
          class="btn btn--outline btn--sm back-btn"
          @click="$router.push({ name: 'course-detail', params: { id: courseId } })"
        >
          ← 返回單元列表
        </button>
        <h2>{{ lesson.title }}</h2>
      </div>
      <div class="lesson-content-wrapper">
        <RevealSlides :key="lessonId" :markdown="lesson.content" />
        <div class="section-actions">
          <button class="btn btn--primary" @click="markComplete">標記為完成</button>
          <button class="btn btn--secondary" @click="openOriginalLink" v-if="iframeSrc">
            打開原始連結
          </button>
          <button class="btn btn--secondary" @click="startQuiz(true)" v-if="lesson.quiz">
            開始單元測驗
          </button>
          <button
            class="btn btn--secondary"
            @click="startQuiz(false)"
            v-else-if="lesson.id === 'lesson4'"
          >
            開始課程總測驗
          </button>
        </div>
      </div>
    </div>
    <div class="container" v-else>
      <p>正在載入單元資料...</p>
    </div>
  </div>
</template>

<style scoped>
.lesson-header {
  position: sticky;
  top: 65px; /* Adjust this value based on your navbar height */
  background-color: var(--color-background);
  padding: var(--space-16) 0;
  z-index: 99;
}

.lesson-header h2 {
  margin-top: var(--space-16);
}

.lesson-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  padding-top: var(--space-4); /* Add padding to avoid content being hidden by the sticky header */
}

.section-actions {
  display: flex;
  gap: var(--space-16);
  margin-top: var(--space-4);
}
</style>
