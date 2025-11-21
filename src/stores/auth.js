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
  }),
  getters: {
    isLoggedIn: (state) => !!state.currentUser,
    isAdmin: (state) => state.currentUser?.role === 'admin',
  },
  actions: {
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
  }
})