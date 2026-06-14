<template>
  <div class="role-admin">
    <div class="page-heading">
      <div>
        <h2>帳號權限管理</h2>
        <p>調整已登入帳號的角色。只有 admin 可以修改權限。</p>
      </div>
      <button type="button" class="btn btn--primary btn--sm" @click="loadUsers">重新整理</button>
    </div>

    <div class="role-summary">
      <div v-for="role in roleOptions" :key="role.value" class="summary-card card">
        <span class="summary-label">{{ role.label }}</span>
        <strong>{{ roleCounts[role.value] || 0 }}</strong>
        <p>{{ role.description }}</p>
      </div>
    </div>

    <div class="card">
      <div class="card__body">
        <div v-if="loading" class="empty-state">正在載入帳號...</div>
        <div v-else-if="adminStore.userList.length === 0" class="empty-state">目前沒有可管理的帳號。</div>
        <div v-else class="user-list">
          <div v-for="user in adminStore.userList" :key="user.uid" class="user-row">
            <div class="user-avatar">{{ getInitial(user) }}</div>
            <div class="user-info">
              <strong>{{ user.fullName || user.displayName || '未命名使用者' }}</strong>
              <span>{{ user.email || '無 email' }}</span>
            </div>
            <select
              class="form-control role-select"
              :value="user.role || 'student'"
              :disabled="savingUserId === user.uid || user.uid === authStore.currentUser?.uid"
              @change="updateRole(user, $event.target.value)"
            >
              <option v-for="role in roleOptions" :key="role.value" :value="role.value">
                {{ role.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <p v-if="message" class="status-message">{{ message }}</p>
    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useAdminStore } from '@/stores/admin';
import { useAuthStore } from '@/stores/auth';

const adminStore = useAdminStore();
const authStore = useAuthStore();

const loading = ref(false);
const savingUserId = ref('');
const message = ref('');
const error = ref('');

const roleOptions = [
  { value: 'student', label: 'Student', description: '只能學習課程、測驗與查看自己的進度。' },
  { value: 'teacher', label: 'Teacher', description: '可管理課程教材與課程分類。' },
  { value: 'admin', label: 'Admin', description: '可管理帳號權限、學員進度、課程與分類。' },
];

const roleCounts = computed(() => {
  return adminStore.userList.reduce((counts, user) => {
    const role = user.role || 'student';
    counts[role] = (counts[role] || 0) + 1;
    return counts;
  }, {});
});

onMounted(() => {
  loadUsers();
});

const loadUsers = async () => {
  loading.value = true;
  message.value = '';
  error.value = '';
  try {
    await adminStore.fetchAllUsers();
  } catch (err) {
    console.error(err);
    error.value = '載入帳號失敗，請稍後再試。';
  } finally {
    loading.value = false;
  }
};

const updateRole = async (user, role) => {
  message.value = '';
  error.value = '';
  savingUserId.value = user.uid;
  try {
    await adminStore.adminUpdateUserRole(user.uid, role);
    message.value = `已將 ${user.fullName || user.displayName || user.email} 更新為 ${role}。`;
  } catch (err) {
    console.error(err);
    error.value = err.message || '更新角色失敗。';
  } finally {
    savingUserId.value = '';
  }
};

const getInitial = (user) => {
  return (user.fullName || user.displayName || user.email || 'U').charAt(0).toUpperCase();
};
</script>

<style scoped>
.role-admin {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-16);
}

.page-heading h2 {
  margin-bottom: var(--space-8);
}

.page-heading p,
.summary-card p,
.user-info span {
  color: var(--color-text-secondary);
}

.role-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-16);
}

.summary-card {
  padding: var(--space-20);
}

.summary-label {
  display: block;
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-8);
}

.summary-card strong {
  display: block;
  font-size: 32px;
  margin-bottom: var(--space-8);
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.user-row {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 180px;
  align-items: center;
  gap: var(--space-16);
  padding: var(--space-16);
  background: var(--color-secondary);
  border-radius: var(--radius-base);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  display: grid;
  place-items: center;
  background: var(--color-pastel-purple);
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}

.user-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.role-select {
  margin: 0;
}

.empty-state,
.status-message,
.error-message {
  padding: var(--space-16);
  border-radius: var(--radius-base);
}

.empty-state {
  color: var(--color-text-secondary);
  background: var(--color-secondary);
}

.status-message {
  background: var(--color-pastel-green);
  color: #15803d;
}

@media (max-width: 800px) {
  .role-summary {
    grid-template-columns: 1fr;
  }

  .user-row {
    grid-template-columns: 48px 1fr;
  }

  .role-select {
    grid-column: 1 / -1;
  }
}
</style>
