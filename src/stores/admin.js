import { defineStore } from 'pinia';
import { db } from '@/plugins/firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { useAuthStore } from './auth';
import { useCourseStore } from './course';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    studentList: [],
  }),
  actions: {
    async fetchAllStudents() {
      const authStore = useAuthStore();
      if (!authStore.isAdmin) {
        this.studentList = [];
        return;
      }
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const students = [];
      usersSnapshot.forEach(doc => {
        // We can fetch all users and filter on the client, or add a where clause
        // For simplicity and depending on the number of users, client-side filter is okay for now.
        if (doc.data().role !== 'admin') {
            students.push({ uid: doc.id, ...doc.data() });
        }
      });
      this.studentList = students;
    },

    async adminUpdateUserProfile(userId, profileData) {
      const authStore = useAuthStore();
      if (!authStore.isAdmin) throw new Error('僅管理員可執行此操作');
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { fullName: profileData.fullName, branch: profileData.branch });
      await this.fetchAllStudents(); // Refresh the list
    },

    async fetchStudentProgressData(userId) {
      const authStore = useAuthStore();
      if (!authStore.isAdmin) return {};

      const progressCollectionRef = collection(db, `users/${userId}/progress`);
      const progressSnapshot = await getDocs(progressCollectionRef);
      const progressData = {};
      progressSnapshot.forEach(doc => {
        progressData[doc.id] = { completedLessons: doc.data().completedLessons || [] };
      });

      const quizResultsRef = collection(db, `users/${userId}/quizResults`);
      const quizResultsSnapshot = await getDocs(quizResultsRef);
      quizResultsSnapshot.forEach(doc => {
        const result = doc.data();
        if (progressData[result.courseId]) {
          if (!progressData[result.courseId].quizResults) {
            progressData[result.courseId].quizResults = [];
          }
          progressData[result.courseId].quizResults.push(result);
        } else {
          progressData[result.courseId] = { completedLessons: [], quizResults: [result] };
        }
      });

      return progressData;
    },

    async fetchAllStudentProgress() {
      const authStore = useAuthStore();
      if (!authStore.isAdmin) return [];

      const courseStore = useCourseStore();
      await courseStore.fetchAllCourses();
      const allCourses = courseStore.courses;

      await this.fetchAllStudents();
      const allStudents = this.studentList;

      const allProgressData = [];

      for (const student of allStudents) {
        const studentProgress = await this.fetchStudentProgressData(student.uid);

        for (const course of allCourses) {
          const progress = studentProgress[course.id];
          if (progress) {
            // To get total lessons, we need course details, which might not be fully loaded.
            // Let's ensure course details are available.
            if (!course.lessons) {
              await courseStore.fetchCourseDetails(course.id);
            }
            const currentCourse = courseStore.courses.find(c => c.id === course.id);
            const totalLessons = currentCourse?.lessons?.length || 0;
            const progressPercentage = totalLessons > 0 ? Math.round((progress.completedLessons.length / totalLessons) * 100) : 0;
            
            const courseQuizzes = progress.quizResults?.filter(r => !r.lessonId) || [];
            const latestScore = courseQuizzes.length > 0 ? courseQuizzes[courseQuizzes.length - 1].score : null;

            allProgressData.push({
              branch: student.branch,
              fullName: student.fullName,
              courseTitle: course.title,
              progressPercentage: progressPercentage,
              latestScore: latestScore,
              quizAttempts: courseQuizzes.length,
              registeredAt: student.createdAt,
            });
          }
        }
      }
      return allProgressData;
    }
  }
});
