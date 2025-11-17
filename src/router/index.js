import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MainLayout from '@/layouts/MainLayout.vue'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    // always scroll to top
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView
        },
        {
          path: 'courses',
          name: 'courses',
          component: () => import('../views/CoursesView.vue')
        },
        {
          path: 'courses/:id',
          name: 'course-detail',
          component: () => import('../views/CourseDetailView.vue')
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'admin',
          component: () => import('../views/AdminView.vue'),
          meta: { requiresAuth: true, requiresAdmin: true },
          children: [
            { path: '', redirect: '/admin/dashboard' },
            {
              path: 'students',
              name: 'admin-students',
              component: () => import('../views/admin/StudentAdminView.vue')
            },
            {
              path: 'courses',
              name: 'admin-courses',
              component: () => import('../views/admin/CourseAdminView.vue')
            },
            {
              path: 'courses/edit/:id',
              name: 'admin-course-edit',
              component: () => import('../views/admin/CourseEditView.vue')
            },
            {
              path: 'dashboard',
              name: 'admin-dashboard',
              component: () => import('../views/admin/DashboardAdminView.vue')
            },
            {
              path: 'help',
              name: 'admin-help',
              component: () => import('../views/admin/HelpView.vue')
            },

            {
              path: 'courses/:courseId/lessons/new',
              name: 'admin-lesson-new',
              component: () => import('../views/admin/LessonEditView.vue')
            },
            {
              path: 'courses/:courseId/lessons/:lessonId/edit',
              name: 'admin-lesson-edit',
              component: () => import('../views/admin/LessonEditView.vue')
            },
            {
              path: 'courses/:courseId/quiz/edit/:lessonId?',
              name: 'admin-quiz-edit',
              component: () => import('../views/admin/QuizEditView.vue')
            }
          ]
        },
        {
          path: 'courses/:courseId/lesson/:lessonId',
          name: 'lesson',
          component: () => import('../views/LessonView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'courses/:courseId/quiz',
          name: 'quiz',
          component: () => import('../views/QuizView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'quiz-result/:courseId',
          name: 'quiz-result',
          component: () => import('../views/QuizResultView.vue'),
          meta: { requiresAuth: true }
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);

  if (requiresAuth && !authStore.isLoggedIn) {
    // Redirect to home if not logged in
    next({ name: 'home' });
  } else if (requiresAdmin && !authStore.isAdmin) {
    // Redirect to home if not an admin
    next({ name: 'home' });
  } else {
    // Otherwise, allow navigation
    next();
  }
});

export default router