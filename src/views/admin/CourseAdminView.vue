<template>
  <div class="course-admin">
    <div class="header-container">
      <div class="title-group">
        <h2 class="section-title">課程教材管理</h2>
        <p class="section-subtitle">拖拽排序課程分類與內容，規劃學員的學習路徑</p>
      </div>
      <button class="btn-create-course" @click="goToEditPage('new')">
        <span class="plus-icon">+</span> 新增課程
      </button>
    </div>

    <draggable
      class="kanban-board"
      :list="displayCategories"
      group="categories"
      item-key="category"
      handle=".column-drag-handle"
      @end="onCategoryDragEnd"
    >
      <template #item="{ element: category }">
        <div class="kanban-column card-soft" :style="{ backgroundColor: getCategoryPastel(category) }">
          <div class="kanban-column-header">
            <div class="column-drag-handle">⋮⋮</div>
            <h3 class="column-title">{{ category }}</h3>
            <span class="course-count-tag">{{ coursesByCategory[category]?.length || 0 }}</span>
          </div>
          
          <draggable
            class="kanban-list"
            :list="coursesByCategory[category]"
            group="courses"
            item-key="id"
            handle=".course-drag-handle"
            @end="onCourseDragEnd(category, $event)"
          >
            <template #item="{ element }">
              <div class="course-kanban-card">
                 <div class="course-drag-handle">
                    <span class="drag-dots">::</span>
                 </div>
                <div class="course-info">
                  <div class="course-title-row">
                    <p class="course-card-title">{{ element.title }}</p>
                    <span :class="['status-dot', element.published ? 'is-published' : 'is-draft']"></span>
                  </div>
                  <div class="course-meta-row">
                    <span class="meta-tag">{{ element.lessonsCount || 0 }} 單元</span>
                    <span class="status-text">{{ element.published ? '已上架' : '草稿' }}</span>
                  </div>
                </div>
                <div class="course-card-actions">
                  <button class="icon-btn edit" @click="goToEditPage(element.id)" title="編輯">
                    編輯
                  </button>
                  <button class="icon-btn delete" @click="promptDelete(element)" title="刪除">
                    刪除
                  </button>
                </div>
              </div>
            </template>
          </draggable>
          
          <div v-if="!coursesByCategory[category] || coursesByCategory[category].length === 0" class="empty-column-soft">
            <p>尚無課程</p>
          </div>
        </div>
      </template>
    </draggable>

    <!-- Custom Confirmation Modal -->
    <transition name="fade">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
        <div class="modal-card card-soft">
          <div class="modal-header">
            <h3>確認刪除課程</h3>
          </div>
          <div class="modal-body">
            <p>您確定要刪除「<strong>{{ courseToDelete.title }}</strong>」嗎？</p>
            <p class="modal-note">這將會永久移除所有相關單元、測驗以及學員的學習紀錄。</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="cancelDelete">取消返回</button>
            <button class="btn-danger-soft" @click="confirmDelete">確認永久刪除</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { useCourseStore } from '@/stores/course';
import { useRouter } from 'vue-router';
import draggable from 'vuedraggable';
import { storeToRefs } from 'pinia';

const courseStore = useCourseStore();
const router = useRouter();

const { categories: courseCategories } = storeToRefs(courseStore);
const UNCATEGORIZED_CATEGORY = '未分類';

const showDeleteModal = ref(false);
const courseToDelete = ref(null);

onMounted(() => {
  courseStore.fetchAllCourses();
  courseStore.fetchCategories();
});

const displayCategories = computed({
  get() {
    const categories = [...courseCategories.value];
    courseStore.courses.forEach((course) => {
      const category = course.category || UNCATEGORIZED_CATEGORY;
      if (!categories.includes(category)) {
        categories.push(category);
      }
    });
    return categories;
  },
  set(newOrder) {
    courseCategories.value = newOrder;
  }
});

const coursesByCategory = computed(() => {
  const grouped = {};
  displayCategories.value.forEach(cat => grouped[cat] = []);

  courseStore.courses.forEach(course => {
    const category = course.category || UNCATEGORIZED_CATEGORY;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(course);
  });

  for (const category in grouped) {
    grouped[category].sort((a, b) => {
      const orderA = a.order ?? Infinity;
      const orderB = b.order ?? Infinity;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }
  return grouped;
});

const onCourseDragEnd = (category, event) => {
  const updatedList = coursesByCategory.value[category];
  courseStore.updateCourseOrder(updatedList);
};

const onCategoryDragEnd = () => {
  courseStore.updateCategoriesOrder(displayCategories.value);
};

const goToEditPage = (courseId) => {
  router.push({ name: 'admin-course-edit', params: { id: courseId } });
};

const promptDelete = (course) => {
  courseToDelete.value = course;
  showDeleteModal.value = true;
};

const cancelDelete = () => {
  showDeleteModal.value = false;
  courseToDelete.value = null;
};

const confirmDelete = async () => {
  if (!courseToDelete.value) return;
  try {
    await courseStore.deleteCourse(courseToDelete.value.id);
  } catch (error) {
    console.error(error);
  } finally {
    cancelDelete();
  }
};

const getCategoryPastel = (category) => {
  const map = {
    '專業知識': '#E3F2FD',
    '門市實務': '#E8F5E9',
    '產品介紹': '#FFF3E0',
    '衛教資訊': '#F3E5F5',
    '法規宣導': '#FFEBEE'
  };
  return map[category] || '#F5F5F5';
};
</script>

<style scoped>
.course-admin {
  animation: fadeIn 0.4s ease-out;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--space-32);
}

.section-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: 8px;
}

.section-subtitle {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.btn-create-course {
  background-color: var(--color-primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-create-course:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.kanban-board {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

.kanban-column {
  padding: var(--space-20);
  min-height: 120px;
}

.kanban-column-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: var(--space-16);
}

.column-drag-handle {
  cursor: grab;
  color: rgba(0,0,0,0.2);
  font-size: 1.2rem;
  user-select: none;
  letter-spacing: 0.1em;
}

.column-title {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  margin: 0;
  flex: 1;
}

.course-count-tag {
  background: white;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
}

.kanban-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  min-height: 50px;
}

.course-kanban-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.course-kanban-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.course-drag-handle {
  cursor: grab;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: bold;
  letter-spacing: 0.05em;
}

.course-info {
  flex: 1;
  min-width: 0;
}

.course-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.course-card-title {
  font-weight: var(--font-weight-bold);
  font-size: 0.95rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.is-published { background-color: #4CAF50; box-shadow: 0 0 6px rgba(76, 175, 80, 0.4); }
.is-draft { background-color: #9E9E9E; }

.course-meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-tag {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  background: var(--color-secondary);
  padding: 2px 8px;
  border-radius: 4px;
}

.status-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.course-card-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: auto;
  height: auto;
  padding: 4px 10px;
  border-radius: 8px;
  border: none;
  background: var(--color-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 0.7rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

.icon-btn:hover {
  transform: scale(1.1);
}

.icon-btn.edit:hover { background-color: #E3F2FD; color: #1976D2; }
.icon-btn.delete:hover { background-color: #FFEBEE; color: #D32F2F; }

.empty-column-soft {
  padding: 32px;
  text-align: center;
  color: var(--color-text-secondary);
  background: rgba(255,255,255,0.3);
  border-radius: var(--radius-lg);
  border: 2px dashed rgba(0,0,0,0.05);
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  width: 90%;
  max-width: 400px;
  background: white;
  padding: var(--space-32);
  text-align: center;
}

.modal-warning-icon {
  display: none;
}

.modal-note {
  font-size: 0.9rem;
  color: var(--color-danger);
  margin-top: 12px;
  font-weight: var(--font-weight-medium);
}

.modal-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.btn-secondary {
  padding: 12px;
  border-radius: var(--radius-full);
  border: none;
  background: var(--color-secondary);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.btn-danger-soft {
  padding: 12px;
  border-radius: var(--radius-full);
  border: none;
  background: #FFEBEE;
  color: #D32F2F;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
