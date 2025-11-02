import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    showProfileSetupModal: false,
    showEditUserModal: false,
    editingUser: null, // To hold the user object being edited by the admin
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
  },
})
