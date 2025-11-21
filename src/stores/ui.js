import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    showProfileSetupModal: false,
    showEditUserModal: false,
    editingUser: null, // To hold the user object being edited by the admin
    isLoading: false,
    globalError: null, // Can be a string or an object
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
    setLoading(status) {
      this.isLoading = status;
    },
    setError(message) {
      this.globalError = message;
      // Automatically clear the error after a few seconds
      setTimeout(() => {
        this.clearError();
      }, 5000);
    },
    clearError() {
      this.globalError = null;
    },
  },
})
