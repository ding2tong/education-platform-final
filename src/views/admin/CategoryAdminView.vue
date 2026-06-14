<template>
  <div class="category-admin">
    <div class="page-heading">
      <div>
        <h2>課程分類管理</h2>
        <p>管理課程大分類，並可在每個大分類下新增子分類。</p>
      </div>
      <div class="heading-actions">
        <button type="button" class="btn btn--outline btn--sm" @click="resetFromStore">還原</button>
        <button type="button" class="btn btn--primary btn--sm" @click="saveCategories">儲存分類</button>
      </div>
    </div>

    <div class="card">
      <div class="card__body">
        <div class="category-table-wrap">
          <table class="category-table">
            <thead>
              <tr>
                <th>順序</th>
                <th>大分類</th>
                <th>子分類</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(category, categoryIndex) in editableTree" :key="category.localId">
                <td>
                  <span class="category-order">{{ categoryIndex + 1 }}</span>
                </td>
                <td class="category-name-cell">
                  <input
                    v-model="category.name"
                    class="form-control"
                    type="text"
                    placeholder="大分類名稱，例如：教育訓練"
                  >
                </td>
                <td class="subcategory-cell">
                  <div v-if="category.subcategories.length" class="subcategory-chips">
                    <span
                      v-for="(subcategory, subcategoryIndex) in category.subcategories"
                      :key="`${category.localId}-${subcategoryIndex}`"
                      class="subcategory-chip"
                    >
                      <input
                        :value="subcategory"
                        type="text"
                        aria-label="子分類名稱"
                        @input="category.subcategories[subcategoryIndex] = $event.target.value"
                      >
                      <button
                        type="button"
                        class="chip-remove"
                        :aria-label="`移除 ${subcategory || '子分類'}`"
                        @click="removeSubcategory(categoryIndex, subcategoryIndex)"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                  <p v-else class="empty-subcategory">尚未設定子分類</p>
                  <div class="add-subcategory-row">
                    <input
                      v-model="category.newSubcategory"
                      class="form-control"
                      type="text"
                      placeholder="輸入子分類後新增"
                      @keydown.enter.prevent="addSubcategory(categoryIndex)"
                    >
                    <button type="button" class="btn btn--sm btn--outline" @click="addSubcategory(categoryIndex)">新增</button>
                  </div>
                </td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="btn btn--sm btn--outline" @click="moveCategory(categoryIndex, -1)" :disabled="categoryIndex === 0">上移</button>
                    <button type="button" class="btn btn--sm btn--outline" @click="moveCategory(categoryIndex, 1)" :disabled="categoryIndex === editableTree.length - 1">下移</button>
                    <button type="button" class="btn btn--sm btn--danger" @click="removeCategory(categoryIndex)">刪除</button>
                  </div>
                </td>
              </tr>
              <tr v-if="!editableTree.length">
                <td colspan="4" class="table-empty">目前沒有分類，請新增第一個大分類。</td>
              </tr>
            </tbody>
          </table>
        </div>

        <button type="button" class="add-category-btn" @click="addCategory">+ 新增大分類</button>
      </div>
    </div>

    <p class="note">儲存後，課程編輯頁會使用這裡的大分類與子分類。既有課程的大分類名稱若被改名，需要手動回到課程編輯頁調整。</p>
    <p v-if="message" class="status-message">{{ message }}</p>
    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useCourseStore } from '@/stores/course';

const courseStore = useCourseStore();
const editableTree = ref([]);
const message = ref('');
const error = ref('');

onMounted(async () => {
  await courseStore.fetchCategories();
  resetFromStore();
});

const resetFromStore = () => {
  editableTree.value = courseStore.categoryTree.map((category, index) => ({
    localId: `${Date.now()}-${index}-${category.name}`,
    name: category.name,
    subcategories: [...(category.subcategories || [])],
    newSubcategory: '',
  }));
  message.value = '';
  error.value = '';
};

const addCategory = () => {
  editableTree.value.push({
    localId: `${Date.now()}-${editableTree.value.length}`,
    name: '',
    subcategories: [],
    newSubcategory: '',
  });
};

const removeCategory = (index) => {
  if (confirm('確定要刪除這個大分類嗎？既有課程不會自動改分類。')) {
    editableTree.value.splice(index, 1);
  }
};

const moveCategory = (index, direction) => {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= editableTree.value.length) return;
  const [category] = editableTree.value.splice(index, 1);
  editableTree.value.splice(targetIndex, 0, category);
};

const addSubcategory = (categoryIndex) => {
  const category = editableTree.value[categoryIndex];
  const value = category.newSubcategory.trim();
  if (!value) return;
  const existingNames = category.subcategories.map(subcategory => subcategory.trim());
  if (existingNames.includes(value)) {
    error.value = '同一個大分類下，子分類名稱不可重複。';
    return;
  }
  category.subcategories.push(value);
  category.newSubcategory = '';
  error.value = '';
};

const removeSubcategory = (categoryIndex, subcategoryIndex) => {
  editableTree.value[categoryIndex].subcategories.splice(subcategoryIndex, 1);
};

const saveCategories = async () => {
  message.value = '';
  error.value = '';
  const names = editableTree.value.map(category => category.name.trim()).filter(Boolean);
  if (names.length !== new Set(names).size) {
    error.value = '大分類名稱不可重複。';
    return;
  }
  const hasDuplicatedSubcategory = editableTree.value.some((category) => {
    const subcategoryNames = category.subcategories.map(subcategory => subcategory.trim()).filter(Boolean);
    return subcategoryNames.length !== new Set(subcategoryNames).size;
  });
  if (hasDuplicatedSubcategory) {
    error.value = '同一個大分類下，子分類名稱不可重複。';
    return;
  }

  try {
    await courseStore.saveCategoryTree(editableTree.value);
    resetFromStore();
    message.value = '課程分類已儲存。';
  } catch (err) {
    console.error(err);
    error.value = '儲存分類失敗，請稍後再試。';
  }
};
</script>

<style scoped>
.category-admin {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

.page-heading,
.heading-actions {
  display: flex;
  align-items: center;
  gap: var(--space-12);
}

.page-heading {
  justify-content: space-between;
  align-items: flex-end;
}

.page-heading h2 {
  margin-bottom: var(--space-8);
}

.page-heading p,
.note {
  color: var(--color-text-secondary);
}

.category-table-wrap {
  overflow-x: auto;
}

.category-table {
  width: 100%;
  min-width: 860px;
  border-collapse: separate;
  border-spacing: 0 var(--space-10);
}

.category-table th {
  padding: 0 var(--space-16) var(--space-8);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-align: left;
  white-space: nowrap;
}

.category-table td {
  padding: var(--space-16);
  background: var(--color-secondary);
  vertical-align: top;
}

.category-table td:first-child {
  border-radius: var(--radius-base) 0 0 var(--radius-base);
}

.category-table td:last-child {
  border-radius: 0 var(--radius-base) var(--radius-base) 0;
}

.category-order {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: var(--color-pastel-purple);
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}

.category-name-cell {
  width: 28%;
}

.subcategory-cell {
  width: 44%;
}

.subcategory-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
  margin-bottom: var(--space-12);
}

.subcategory-chip {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  max-width: 100%;
  gap: var(--space-6);
  padding: var(--space-4) var(--space-6) var(--space-4) var(--space-10);
  border: 1px solid var(--color-secondary-active);
  border-radius: var(--radius-full);
  background: #fff;
}

.subcategory-chip input {
  width: 132px;
  min-width: 80px;
  border: 0;
  background: transparent;
  color: var(--color-text-primary);
  font: inherit;
  outline: 0;
}

.chip-remove {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: var(--radius-full);
  display: grid;
  place-items: center;
  background: var(--color-secondary);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-weight: var(--font-weight-bold);
}

.chip-remove:hover {
  color: var(--color-danger);
}

.empty-subcategory {
  margin: 0 0 var(--space-12);
  color: var(--color-text-secondary);
}

.add-subcategory-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) auto;
  gap: var(--space-8);
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
  justify-content: flex-end;
}

.table-empty {
  color: var(--color-text-secondary);
  text-align: center;
}

.add-category-btn {
  border: 2px dashed var(--color-secondary-active);
  background: white;
  color: var(--color-primary);
  border-radius: var(--radius-base);
  padding: var(--space-12) var(--space-16);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.add-category-btn {
  width: 100%;
  margin-top: var(--space-20);
}

.status-message,
.error-message,
.note {
  padding: var(--space-16);
  border-radius: var(--radius-base);
}

.status-message {
  background: var(--color-pastel-green);
  color: #15803d;
}

.note {
  background: var(--color-pastel-blue);
}

@media (max-width: 900px) {
  .page-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .heading-actions {
    align-self: stretch;
  }
}
</style>
