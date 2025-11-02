<template>
  <div class="modal" :class="{ active: uiStore.showEditUserModal }" @click.self="closeModal">
    <div class="modal-content" v-if="uiStore.editingUser">
      <div class="modal-header">
        <h2>編輯學員資料</h2>
        <button class="modal-close" @click="closeModal">&times;</button>
      </div>
      <div class="modal-body">
        <p>您正在編輯 <strong>{{ uiStore.editingUser.displayName }}</strong> 的資料。</p>
        <form @submit.prevent="updateProfile">
          <div class="form-group">
            <label class="form-label">姓名 (全名)</label>
            <input type="text" class="form-control" v-model="profile.fullName" required>
          </div>
          <div class="form-group">
            <label class="form-label">所屬分店</label>
            <select class="form-control" v-model="profile.branch" required>
              <option disabled value="">請選擇分店</option>
              <option>寧夏</option>
              <option>三和</option>
              <option>武昌</option>
            </select>
          </div>
          <div class="error-message" v-if="error">{{ error }}</div>
          <button type="submit" class="btn btn--primary btn--full-width">儲存變更</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useUiStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';

const uiStore = useUiStore();
const authStore = useAuthStore();

const profile = ref({ fullName: '', branch: '' });
const error = ref('');

// Watch for when the editingUser changes in the store, and update the local form data
watch(() => uiStore.editingUser, (newUser) => {
  if (newUser) {
    profile.value.fullName = newUser.fullName || newUser.displayName || '';
    profile.value.branch = newUser.branch || '';
  } else {
    profile.value = { fullName: '', branch: '' };
  }
});

const closeModal = () => {
  uiStore.closeEditUserModal();
  error.value = '';
};

const updateProfile = async () => {
  error.value = '';
  if (!profile.value.fullName || !profile.value.branch) {
    error.value = '所有欄位都必須填寫';
    return;
  }

  try {
    await authStore.adminUpdateUserProfile(uiStore.editingUser.uid, profile.value);
    closeModal();
  } catch (e) {
    error.value = '更新失敗，請稍後再試';
    console.error(e);
  }
};
</script>

<style scoped>
.modal.active {
  pointer-events: auto;
}
.modal-content {
  pointer-events: auto;
}
</style>