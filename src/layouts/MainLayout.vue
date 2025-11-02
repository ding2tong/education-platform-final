<script setup>
import '@/assets/main.css'; // Import global styles here
import Navbar from '@/components/Navbar.vue'
import ProfileSetupModal from '@/components/ProfileSetupModal.vue'
import LessonEditor from '@/components/LessonEditor.vue'
import QuizEditor from '@/components/QuizEditor.vue'
import EditUserModal from '@/components/EditUserModal.vue' // Import EditUserModal
import { useUiStore } from '@/stores/ui' // Import useUiStore

const uiStore = useUiStore()
</script>

<template>
  <div>
    <Navbar />
    <main class="main-content">
      <router-view />
    </main>
    <ProfileSetupModal v-if="uiStore.showProfileSetupModal" />
    <LessonEditor v-if="uiStore.showLessonEditorModal" />
    <QuizEditor v-if="uiStore.showQuizEditorModal" />
    <EditUserModal v-if="uiStore.showEditUserModal" />
  </div>
</template>
