import { defineStore } from 'pinia'
import { useCourseStore } from './course'
import {
  auth,
  db
} from '@/plugins/firebase'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  collection,
  getDocs,
  query,
  where,
  writeBatch
} from 'firebase/firestore'

import { useUiStore } from './ui';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: null,
    userProgress: {}, // Will hold progress per course, e.g., { courseId: { completedLessons: [] } }
    studentList: [],
  }),
  getters: {
    isLoggedIn: (state) => !!state.currentUser,
    isAdmin: (state) => state.currentUser?.role === 'admin',
    // Note: progressPercentage is now course-specific and should be calculated in the component
  },
  actions: {
    async fetchAllStudents() {
      if (!this.currentUser || this.currentUser.role !== 'admin') {
        this.studentList = [];
        return;
      }
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const students = [];
      usersSnapshot.forEach(doc => {
        if (doc.data().role === 'student') {
          students.push({ uid: doc.id, ...doc.data() });
        }
      });
      this.studentList = students;
    },
    init() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              this.currentUser = { uid: user.uid, ...userDoc.data() };
              if (this.currentUser.fullName) {
                this.loadUserData();
              }
            }
          } else {
            this.currentUser = null;
            this.userProgress = {};
          }
          resolve(); // Signal that the initial auth check is complete
        });
      });
    },
    async loginWithGoogle() {
      const uiStore = useUiStore();
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const newUser = {
          displayName: user.displayName,
          email: user.email,
          role: 'student',
          createdAt: new Date().toISOString(),
          fullName: '',
          branch: '',
        };
        await setDoc(userDocRef, newUser);
        this.currentUser = { uid: user.uid, ...newUser };
        uiStore.openProfileSetupModal();
      } else {
        this.currentUser = { uid: user.uid, ...userDoc.data() };
        if (!this.currentUser.fullName) {
          uiStore.openProfileSetupModal();
        } else {
          this.loadUserData();
        }
      }
    },
    async updateUserProfile(profileData) {
      if (!this.currentUser) return;
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      await updateDoc(userDocRef, {
        fullName: profileData.fullName,
        branch: profileData.branch,
      });
      this.currentUser.fullName = profileData.fullName;
      this.currentUser.branch = profileData.branch;
      this.loadUserData();
    },
    async adminUpdateUserProfile(userId, profileData) {
      if (!this.isAdmin) throw new Error('僅管理員可執行此操作');
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { fullName: profileData.fullName, branch: profileData.branch });
      await this.fetchAllStudents();
    },
    async logout() {
      await signOut(auth);
    },
    async loadUserData() {
      if (!this.currentUser) return;
      const baseProgressRef = collection(db, `users/${this.currentUser.uid}/progress`);
      const progressSnapshot = await getDocs(baseProgressRef);
      const progressData = {};
      progressSnapshot.forEach(doc => {
        progressData[doc.id] = { completedLessons: doc.data().completedLessons || [] };
      });

      const quizResultsRef = collection(db, `users/${this.currentUser.uid}/quizResults`);
      const quizResultsSnapshot = await getDocs(quizResultsRef);
      quizResultsSnapshot.forEach(doc => {
        const result = doc.data();
        if (progressData[result.courseId]) {
          if (!progressData[result.courseId].quizResults) {
            progressData[result.courseId].quizResults = [];
          }
          progressData[result.courseId].quizResults.push(result);
        } else {
          // This case might happen if a quiz is taken but no lessons are completed
          progressData[result.courseId] = { completedLessons: [], quizResults: [result] };
        }
      });

      this.userProgress = progressData;
    },
    async markLessonComplete(courseId, lessonId) {
      if (!this.currentUser || this.isAdmin) return;
      const progressDocRef = doc(db, `users/${this.currentUser.uid}/progress`, courseId);
      const progressDoc = await getDoc(progressDocRef);

      if (!progressDoc.exists() || !progressDoc.data().completedLessons.includes(lessonId)) {
        await setDoc(progressDocRef, { completedLessons: arrayUnion(lessonId) }, { merge: true });
        if (!this.userProgress[courseId]) {
          this.userProgress[courseId] = { completedLessons: [] };
        }
        this.userProgress[courseId].completedLessons.push(lessonId);
      }
    },
    isLessonCompleted(courseId, lessonId) {
      return this.userProgress[courseId]?.completedLessons?.includes(lessonId) || false;
    },
    async submitQuiz(courseId, quizId, answers, lessonId = null) {
      const courseStore = useCourseStore();
      if (!this.currentUser || this.isAdmin) return;

      const quizData = lessonId 
        ? courseStore.currentCourse?.lessons.find(l => l.id === lessonId)?.quiz
        : courseStore.currentCourse?.quiz;

      if (!quizData) return;

      let correctCount = 0;
      const details = [];
      const questions = quizData.questions;

      questions.forEach((question) => {
        const userAnswerIndex = answers[question.id];
        const isCorrect = userAnswerIndex === question.correct;
        if (isCorrect) correctCount++;
        details.push({
          question: question.question,
          userAnswer: userAnswerIndex !== undefined ? question.options[userAnswerIndex] : '未作答',
          correctAnswer: question.options[question.correct],
          explanation: question.explanation,
          isCorrect
        });
      });

      const score = Math.round((correctCount / questions.length) * 100);
      const quizResult = {
        courseId,
        quizId: quizData.id,
        lessonId, // Can be null
        score,
        answers: details,
        completedAt: new Date().toISOString()
      };

      // --- New Logic: Delete old results before saving new one ---
      const resultsRef = collection(db, `users/${this.currentUser.uid}/quizResults`);
      const q = query(resultsRef, where("quizId", "==", quizData.id));
      const oldResultsSnap = await getDocs(q);
      
      const batch = writeBatch(db);
      oldResultsSnap.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      const newResultRef = doc(resultsRef);
      batch.set(newResultRef, quizResult);
      
      await batch.commit();
      // ----------------------------------------------------------

      // If this was a lesson quiz, automatically mark the lesson as complete.
      if (lessonId) {
        await this.markLessonComplete(courseId, lessonId);
      }

      // Reload user data to make the new result available immediately
      await this.loadUserData();
    },
    // Admin functions - temporarily hardcoded for a single course view
    async getStudentProgress(userId) {
      const courseId = 'sleep-health-course'; // Hardcoded for now
      const courseStore = useCourseStore();
      await courseStore.fetchCourseDetails(courseId);
      const course = courseStore.currentCourse;

      const progressDoc = await getDoc(doc(db, `users/${userId}/progress`, courseId));
      if (progressDoc.exists() && course && course.lessons) {
        const progress = progressDoc.data();
        return Math.round((progress.completedLessons.length / course.lessons.length) * 100);
      }
      return 0;
    },
    async getStudentCompletedCount(userId) {
      const courseId = 'sleep-health-course'; // Hardcoded for now
      const progressDoc = await getDoc(doc(db, `users/${userId}/progress`, courseId));
      if (progressDoc.exists()) {
        return progressDoc.data().completedLessons.length;
      }
      return 0;
    },
    async getStudentQuizCount(userId) {
      const courseId = 'sleep-health-course'; // Hardcoded for now
      const q = query(collection(db, `users/${userId}/quizResults`), where("courseId", "==", courseId));
      const quizResultsSnapshot = await getDocs(q);
      return quizResultsSnapshot.size;
    },
    async getStudentAvgScore(userId) {
      const courseId = 'sleep-health-course'; // Hardcoded for now
      const q = query(collection(db, `users/${userId}/quizResults`), where("courseId", "==", courseId));
      const quizResultsSnapshot = await getDocs(q);
      if (quizResultsSnapshot.empty) return 0;
      const sum = quizResultsSnapshot.docs.reduce((acc, r) => acc + r.data().score, 0);
      return Math.round(sum / quizResultsSnapshot.size);
    },

    async fetchStudentProgressData(userId) {
      if (!this.isAdmin) return {};

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
      if (!this.isAdmin) return [];

      const courseStore = useCourseStore();
      await courseStore.fetchAllCourses();
      const allCourses = courseStore.courses;

      await this.fetchAllStudents();
      const allStudents = this.studentList;

      const allProgressData = [];

      for (const student of allStudents) {
        const progressCollectionRef = collection(db, `users/${student.uid}/progress`);
        const progressSnapshot = await getDocs(progressCollectionRef);
        const studentProgress = {};
        progressSnapshot.forEach(doc => {
          studentProgress[doc.id] = { completedLessons: doc.data().completedLessons || [] };
        });

        const quizResultsRef = collection(db, `users/${student.uid}/quizResults`);
        const quizResultsSnapshot = await getDocs(quizResultsRef);
        quizResultsSnapshot.forEach(doc => {
          const result = doc.data();
          if (studentProgress[result.courseId]) {
            if (!studentProgress[result.courseId].quizResults) {
              studentProgress[result.courseId].quizResults = [];
            }
            studentProgress[result.courseId].quizResults.push(result);
          } else {
            studentProgress[result.courseId] = { completedLessons: [], quizResults: [result] };
          }
        });

        // Now, create a flat entry for each course the student has interacted with
        for (const course of allCourses) {
          const progress = studentProgress[course.id];
          if (progress) {
            const courseDetails = await courseStore.fetchCourseDetails(course.id);
            const totalLessons = courseStore.currentCourse?.lessons?.length || 0;
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
})