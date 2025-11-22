<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2>課程列表</h2>
      <button class="btn btn--primary" @click="goToEditPage('new')">新增課程</button>
    </div>

    <draggable
      class="kanban-board"
      :list="courseCategories"
      group="categories"
      item-key="category"
      handle=".kanban-column-title"
      @end="onCategoryDragEnd"
    >
      <template #item="{ element: category }">
        <div class="kanban-column">
          <h3 class="kanban-column-title">{{ category }}</h3>
          <draggable
            class="kanban-list"
            :list="coursesByCategory[category]"
            group="courses"
            item-key="id"
            handle=".drag-handle"
            @end="onCourseDragEnd(category, $event)"
          >
            <template #item="{ element }">
              <div class="course-card">
                <div class="drag-handle">&#9776;</div>
                <div class="course-main-info">
                  <p class="course-title">{{ element.title }}</p>
                  <span :class="['status-badge', element.published ? 'status-published' : 'status-draft']">
                    {{ element.published ? '已上架' : '草稿' }}
                  </span>
                  <span class="lessons-count">單元: {{ element.lessonsCount || 0 }}</span>
                </div>
                <div class="course-actions">
                  <button class="btn btn--sm btn--outline" @click="goToEditPage(element.id)">編輯</button>
                  <button class="btn btn--sm btn--danger" @click="promptDelete(element)">刪除</button>
                </div>
              </div>
            </template>
          </draggable>
          <div v-if="!coursesByCategory[category] || coursesByCategory[category].length === 0" class="empty-column">
            <p>此分類沒有課程</p>
          </div>
        </div>
      </template>
    </draggable>

    <!-- Custom Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal active">
      <div class="modal-content">
        <div class="modal-header">
          <h3>確認刪除</h3>
        </div>
        <div class="modal-body">
          <p>您確定要刪除課程「<strong>{{ courseToDelete.title }}</strong>」嗎？</p>
          <p class="text-danger">此操作無法復原，且將一併刪除所有學員關於此課程的進度與測驗記錄。</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn--outline" @click="cancelDelete">取消</button>
          <button class="btn btn--danger" @click="confirmDelete">確認刪除</button>
        </div>
      </div>
    </div>
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

const showDeleteModal = ref(false);
const courseToDelete = ref(null);

onMounted(() => {
  courseStore.fetchAllCourses();
  courseStore.fetchCategories();
});

const coursesByCategory = computed(() => {
  const grouped = {};
  courseCategories.value.forEach(cat => grouped[cat] = []);

  courseStore.courses.forEach(course => {
    if (grouped[course.category]) {
      grouped[course.category].push(course);
    }
  });

  // Sort courses within each category by order, then by createdAt
  for (const category in grouped) {
    grouped[category].sort((a, b) => {
      const orderA = a.order ?? Infinity;
      const orderB = b.order ?? Infinity;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
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
  courseStore.updateCategoriesOrder(courseCategories.value);
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
    alert('刪除課程失敗，請查看 console。');
  } finally {
    cancelDelete();
  }
};
</script>

<style scoped>
.kanban-board {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.kanban-column {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 16px;
  border: 1px solid var(--color-border);
}

.kanban-column-title {
  margin-top: 0;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
  cursor: grab;
}

.kanban-list {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.course-card {
  display: flex;
  align-items: center;
  background-color: var(--color-background);
  border: 1px solid var(--color-border-hover);
  border-radius: var(--radius-base);
  padding: 8px 12px; /* Reduced padding */
  cursor: grab;
  transition: box-shadow 0.2s ease;
}
.course-card:hover {
  box-shadow: var(--shadow-sm);
}

.drag-handle {
  margin-right: 12px;
  color: var(--color-text-secondary);
  cursor: grab;
}

.course-main-info {
  flex-grow: 1;
  display: flex;
  align-items: center;
  gap: 12px; /* Spacing between items */
}

.course-title {
  font-weight: var(--font-weight-semibold);
  margin: 0; /* Remove bottom margin */
  font-size: var(--font-size-md); /* Adjust font size */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lessons-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.course-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0; /* Prevent actions from shrinking */
}

.status-badge {
  padding: 4px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  flex-shrink: 0; /* Prevent badge from shrinking */
}
.status-published {
  background-color: var(--color-success);
  color: var(--color-btn-primary-text);
}
.status-draft {
  background-color: var(--color-text-secondary);
  color: var(--color-btn-primary-text);
}

.empty-column {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 24px;
}

/* Modal Styles */
.modal.active {
  display: flex;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding-top: 24px;
}
.text-danger {
  color: var(--color-danger);
  font-weight: var(--font-weight-semibold);
  margin-top: 8px;
}
</style>
