<template>
  <div>
    <div v-if="loading">正在載入學員清單...</div>
    <div v-else>
      <div v-for="(students, branch) in studentsByBranch" :key="branch" class="branch-group">
        <h2 class="branch-title">{{ branch }}</h2>
        <div v-if="students.length > 0">
          <AdminStudentCard v-for="student in students" :key="student.uid" :student="student" />
        </div>
        <p v-else>此分店沒有學員。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useCourseStore } from '@/stores/course';
import AdminStudentCard from '@/components/AdminStudentCard.vue';

const authStore = useAuthStore();
const courseStore = useCourseStore();
const loading = ref(true);

onMounted(async () => {
  loading.value = true;
  await authStore.fetchAllStudents();
  // Fetch all courses so we can display course titles in the student card
  await courseStore.fetchAllCourses();
  loading.value = false;
});

const studentsByBranch = computed(() => {
  return authStore.studentList.reduce((acc, student) => {
    const branch = student.branch || '未分類';
    if (!acc[branch]) {
      acc[branch] = [];
    }
    acc[branch].push(student);
    return acc;
  }, {});
});
</script>

<style scoped>
.branch-group {
  margin-bottom: 32px;
}
.branch-title {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}
</style>