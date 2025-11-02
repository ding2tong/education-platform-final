import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    showProfileSetupModal: false,
    showEditUserModal: false,
    editingUser: null, // To hold the user object being edited by the admin
    showLessonEditorModal: false,
    editingLesson: null,
    showQuizEditorModal: false,
    editingQuiz: null,
    currentEditingCourseId: null, // To know which course we are editing lessons/quiz for
    editingLessonId: null, // To know which lesson we are editing a quiz for
  }),
  actions: {
    openProfileSetupModal() {
      this.showProfileSetupModal = true
    },
    closeProfileSetupModal() {
      this.showProfileSetupModal = false
    },
    openEditUserModal(user) {
      this.editingUser = user;
      this.showEditUserModal = true;
    },
    closeEditUserModal() {
      this.showEditUserModal = false;
      this.editingUser = null;
    },
    openLessonEditorModal(courseId, lesson = null) {
      this.currentEditingCourseId = courseId;
      this.editingLesson = lesson;
      this.showLessonEditorModal = true;
    },
    closeLessonEditorModal() {
      this.showLessonEditorModal = false;
      this.editingLesson = null;
    },
    openQuizEditorModal(courseId, quiz = null, lessonId = null) {
      this.currentEditingCourseId = courseId;
      this.editingQuiz = quiz;
      this.editingLessonId = lessonId; // Store the lessonId if it's a lesson quiz
      this.showQuizEditorModal = true;
    },
    closeQuizEditorModal() {
      this.showQuizEditorModal = false;
      this.editingQuiz = null;
      this.editingLessonId = null;
    },
    // Action to be called when leaving the main course edit view
    clearAdminEditingState() {
      this.currentEditingCourseId = null;
      this.editingLesson = null;
      this.editingQuiz = null;
      this.editingLessonId = null;
    }
  },
})
