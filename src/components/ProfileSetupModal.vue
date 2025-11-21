<template>
  <div class="modal" :class="{ active: uiStore.showProfileSetupModal }">
    <div class="modal-content">
      <div class="modal-header">
        <h2>完善您的個人資料</h2>
      </div>
      <div class="modal-body">
        <p>歡迎加入！為了讓管理者更了解您，請完成以下基本資料。</p>
        <form @submit.prevent="updateProfile">
          <div class="form-group">
            <label class="form-label">姓名 (全名)</label>
            <input type="text" class="form-control" v-model="profile.fullName" required>
          </div>
          <div class="form-group">
            <label class="form-label">所屬分店</label>
            <select class="form-control" v-model="profile.branch" required>
              <option disabled value="">請選擇分店</option>
              <option v-for="branch in formOptions.branchOptions" :key="branch" :value="branch">
                {{ branch }}
              </option>
            </select>
          </div>
          <div class="error-message" v-if="error">{{ error }}</div>
          <button type="submit" class="btn btn--primary btn--full-width">儲存並開始學習</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useUiStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { formOptions } from '@/config/forms';

const uiStore = useUiStore();
const authStore = useAuthStore();

const profile = ref({
  fullName: '',
  branch: '',
});

const error = ref('');

const updateProfile = async () => {
  error.value = '';
  if (!profile.value.fullName || !profile.value.branch) {
    error.value = '請填寫所有欄位';
    return;
  }

  try {
    await authStore.updateUserProfile(profile.value);
    uiStore.closeProfileSetupModal();
  } catch (e) {
    error.value = '資料更新失敗，請稍後再試';
    console.error(e);
  }
};
</script>

