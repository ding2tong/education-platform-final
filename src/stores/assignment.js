import { defineStore } from 'pinia'
import { db } from '@/plugins/firebase'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { useAuthStore } from './auth'
import { useCourseStore } from './course'

const DEFAULT_ASSIGNMENT_STATUS = 'active'

const isStudentUser = (user) => !user.role || user.role === 'student'

const assignmentTargetsUser = (assignment, user) => {
  if (!user) return false
  if (assignment.targetType === 'branches') {
    return assignment.targetBranches?.includes(user.branch)
  }
  if (assignment.targetType === 'users') {
    return assignment.targetUserIds?.includes(user.uid)
  }
  return true
}

const getAssignmentTiming = (assignment, completedAt) => {
  const now = new Date()
  const dueAt = assignment.dueAt ? new Date(assignment.dueAt) : null
  const completedDate = completedAt ? new Date(completedAt) : null

  if (completedDate && dueAt && completedDate > dueAt) return 'overdue-completed'
  if (completedDate) return 'completed'
  if (dueAt && now > dueAt) return 'overdue'
  return 'in-progress'
}

export const useAssignmentStore = defineStore('assignment', {
  state: () => ({
    assignments: [],
    studentAssignments: [],
  }),
  getters: {
    activeAssignments: (state) => state.assignments.filter(assignment => assignment.status === 'active'),
  },
  actions: {
    async fetchAssignments() {
      const authStore = useAuthStore()
      if (!authStore.canManageCourses) {
        this.assignments = []
        return
      }

      const snapshot = await getDocs(collection(db, 'assignments'))
      this.assignments = snapshot.docs
        .map(assignmentDoc => ({ id: assignmentDoc.id, ...assignmentDoc.data() }))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    },

    async saveAssignment(assignmentData) {
      const authStore = useAuthStore()
      if (!authStore.canManageCourses) throw new Error('僅管理員或老師可執行此操作')

      const now = new Date().toISOString()
      const payload = {
        title: assignmentData.title,
        courseId: assignmentData.courseId,
        courseTitle: assignmentData.courseTitle,
        startsAt: assignmentData.startsAt,
        dueAt: assignmentData.dueAt,
        targetType: assignmentData.targetType || 'all',
        targetBranches: assignmentData.targetType === 'branches' ? assignmentData.targetBranches || [] : [],
        targetUserIds: assignmentData.targetType === 'users' ? assignmentData.targetUserIds || [] : [],
        status: assignmentData.status || DEFAULT_ASSIGNMENT_STATUS,
        requireQuiz: true,
        updatedAt: now,
      }

      if (assignmentData.id) {
        await setDoc(doc(db, 'assignments', assignmentData.id), payload, { merge: true })
      } else {
        await addDoc(collection(db, 'assignments'), {
          ...payload,
          createdBy: authStore.currentUser?.uid || '',
          createdAt: now,
        })
      }

      await this.fetchAssignments()
    },

    async deleteAssignment(assignmentId) {
      const authStore = useAuthStore()
      if (!authStore.canManageCourses) throw new Error('僅管理員或老師可執行此操作')
      await deleteDoc(doc(db, 'assignments', assignmentId))
      await this.fetchAssignments()
    },

    async fetchStudentAssignments() {
      const authStore = useAuthStore()
      const user = authStore.currentUser
      if (!user) {
        this.studentAssignments = []
        return
      }

      try {
        const snapshot = await getDocs(query(collection(db, 'assignments'), where('status', '==', 'active')))
        const now = new Date()
        this.studentAssignments = snapshot.docs
          .map(assignmentDoc => ({ id: assignmentDoc.id, ...assignmentDoc.data() }))
          .filter(assignment => {
            const startsAt = assignment.startsAt ? new Date(assignment.startsAt) : null
            return (!startsAt || startsAt <= now) && assignmentTargetsUser(assignment, user)
          })
          .sort((a, b) => new Date(a.dueAt || 0) - new Date(b.dueAt || 0))
      } catch (error) {
        console.error('Error fetching student assignments:', error)
        this.studentAssignments = []
      }
    },

    async buildAssignmentReport(assignmentId) {
      const authStore = useAuthStore()
      if (!authStore.canManageCourses) throw new Error('僅管理員或老師可檢視報表')

      const assignmentRef = doc(db, 'assignments', assignmentId)
      const assignmentSnap = await getDoc(assignmentRef)
      if (!assignmentSnap.exists()) throw new Error('找不到指定任務')

      const assignment = { id: assignmentSnap.id, ...assignmentSnap.data() }
      const courseStore = useCourseStore()
      await courseStore.fetchCourseDetails(assignment.courseId)
      const course = courseStore.currentCourse
      const lessonIds = course?.lessons?.map(lesson => lesson.id) || []

      const usersSnapshot = await getDocs(collection(db, 'users'))
      const teacherBranch = authStore.isTeacher ? authStore.currentUser?.branch || '' : ''
      const targetUsers = usersSnapshot.docs
        .map(userDoc => ({ uid: userDoc.id, ...userDoc.data() }))
        .filter(user => {
          const branchAllowed = authStore.isTeacher ? !!teacherBranch && user.branch === teacherBranch : true
          return isStudentUser(user) && assignmentTargetsUser(assignment, user) && branchAllowed
        })

      const rows = []
      for (const user of targetUsers) {
        const progressSnap = await getDoc(doc(db, `users/${user.uid}/progress`, assignment.courseId))
        const completedLessons = progressSnap.exists() ? progressSnap.data().completedLessons || [] : []
        const quizResultsSnap = await getDocs(query(
          collection(db, `users/${user.uid}/quizResults`),
          where('courseId', '==', assignment.courseId)
        ))
        const courseQuizResults = quizResultsSnap.docs
          .map(resultDoc => resultDoc.data())
          .filter(result => !result.lessonId)
          .sort((a, b) => new Date(a.completedAt || 0) - new Date(b.completedAt || 0))
        const latestCourseQuiz = courseQuizResults[courseQuizResults.length - 1] || null
        const completedAllLessons = lessonIds.length > 0 && lessonIds.every(lessonId => completedLessons.includes(lessonId))
        const completed = completedAllLessons && !!latestCourseQuiz
        const completedAt = completed ? latestCourseQuiz.completedAt : null
        const status = getAssignmentTiming(assignment, completedAt)

        rows.push({
          uid: user.uid,
          fullName: user.fullName || user.displayName || '未命名使用者',
          email: user.email || '',
          branch: user.branch || '未分類',
          completedLessons: completedLessons.length,
          totalLessons: lessonIds.length,
          quizScore: latestCourseQuiz?.score ?? null,
          completedAt,
          status,
        })
      }

      const branchStats = rows.reduce((stats, row) => {
        if (!stats[row.branch]) {
          stats[row.branch] = {
            branch: row.branch,
            total: 0,
            completed: 0,
            onTime: 0,
            overdueCompleted: 0,
            overdue: 0,
            inProgress: 0,
          }
        }
        const branch = stats[row.branch]
        branch.total += 1
        if (row.status === 'completed') {
          branch.completed += 1
          branch.onTime += 1
        } else if (row.status === 'overdue-completed') {
          branch.completed += 1
          branch.overdueCompleted += 1
        } else if (row.status === 'overdue') {
          branch.overdue += 1
        } else {
          branch.inProgress += 1
        }
        branch.completionRate = Math.round((branch.completed / branch.total) * 100)
        return stats
      }, {})

      return {
        assignment,
        course,
        generatedAt: new Date().toISOString(),
        rows,
        branchStats: Object.values(branchStats).sort((a, b) => a.branch.localeCompare(b.branch)),
      }
    },
  },
})
