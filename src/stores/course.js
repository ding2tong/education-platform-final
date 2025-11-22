import { defineStore } from 'pinia'
import { db } from '@/plugins/firebase'
import { getDocs, collection, doc, getDoc, updateDoc, addDoc, deleteDoc, setDoc, writeBatch } from 'firebase/firestore'
import { useUiStore } from './ui'

export const useCourseStore = defineStore('course', {
  state: () => ({
    courses: [], // To hold the list of all courses
    currentCourse: null, // To hold the currently selected course, its lessons, and quiz
    categories: [], // To hold the order of categories
  }),
  getters: {
    // ... getters can be added later as needed
  },
  actions: {
    async fetchCategories() {
      const configRef = doc(db, 'config', 'courseSettings');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists() && configSnap.data().categories) {
        this.categories = configSnap.data().categories;
      } else {
        // Fallback to a default order if not set in DB
        this.categories = ['教育訓練', '商品教育', 'IG/電子報'];
      }
    },
    async updateCategoriesOrder(newOrder) {
      this.categories = newOrder; // Optimistic update
      const configRef = doc(db, 'config', 'courseSettings');
      try {
        await setDoc(configRef, { categories: newOrder }, { merge: true });
      } catch (error) {
        console.error("Error updating categories order: ", error);
        // Revert on error if needed, though optimistic update is usually fine here.
      }
    },
    async fetchAllCourses() {
      const uiStore = useUiStore();
      uiStore.setLoading(true);
      this.courses = [];
      try {
        const coursesCollection = collection(db, 'courses');
        const coursesSnapshot = await getDocs(coursesCollection);
        
        let coursesWithCount = await Promise.all(coursesSnapshot.docs.map(async (doc) => {
          const lessonsRef = collection(db, `courses/${doc.id}/lessons`);
          const lessonsSnapshot = await getDocs(lessonsRef);
          return { id: doc.id, ...doc.data(), lessonsCount: lessonsSnapshot.size };
        }));

        // Unified sorting logic
        coursesWithCount.sort((a, b) => {
          const orderA = a.order ?? Infinity;
          const orderB = b.order ?? Infinity;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          // If order is the same, newest first
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        this.courses = coursesWithCount;
      } catch (error) {
        console.error("Error fetching courses with lesson count: ", error);
        uiStore.setError('載入課程列表失敗。');
      } finally {
        uiStore.setLoading(false);
      }
    },
    async fetchCourseDetails(courseId) {
      // Fetch main course doc
      const courseRef = doc(db, 'courses', courseId);
      const courseSnap = await getDoc(courseRef);
      if (!courseSnap.exists()) {
        this.currentCourse = null;
        return;
      }
      const courseData = { id: courseSnap.id, ...courseSnap.data() };

      // Fetch lessons
      const lessonsRef = collection(db, `courses/${courseId}/lessons`);
      const lessonsSnapshot = await getDocs(lessonsRef);
      const lessons = lessonsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.order - b.order);

      // Fetch quiz
      const quizRef = collection(db, `courses/${courseId}/quizzes`);
      const quizSnapshot = await getDocs(quizRef);
      const quiz = quizSnapshot.empty ? null : { id: quizSnapshot.docs[0].id, ...quizSnapshot.docs[0].data() };

      this.currentCourse = { ...courseData, lessons, quiz };
    },
    async saveCourse(courseData) {
      const uiStore = useUiStore();
      uiStore.setLoading(true);
      try {
        if (courseData.id) {
          // Update existing course
          const courseRef = doc(db, 'courses', courseData.id);
          const { id, ...dataToSave } = courseData; // Don't save the id inside the document
          await updateDoc(courseRef, dataToSave);
          await this.fetchAllCourses(); // Refresh the list
          return courseData.id;
        } else {
          // Create new course, add createdAt and a default order
          const newCourseRef = await addDoc(collection(db, 'courses'), { 
            ...courseData, 
            createdAt: new Date().toISOString(),
            order: 0 // Default order to appear at the top
          });
          await this.fetchAllCourses(); // Refresh the list
          return newCourseRef.id; // Return the new ID
        }
      } catch (error) {
        console.error("Error saving course: ", error);
        uiStore.setError('儲存課程失敗，請稍後再試。');
        return null;
      } finally {
        uiStore.setLoading(false);
      }
    },
    async updateCourseOrder(orderedCourses) {
      const uiStore = useUiStore();
      uiStore.setLoading(true);
      try {
        const batch = writeBatch(db);
        orderedCourses.forEach((course, index) => {
          const courseRef = doc(db, 'courses', course.id);
          batch.update(courseRef, { order: index });

          // Optimistically update the local state
          const courseInState = this.courses.find(c => c.id === course.id);
          if (courseInState) {
            courseInState.order = index;
          }
        });
        await batch.commit();
        
        // Re-sort the local array to be safe, ensuring consistency
        this.courses.sort((a, b) => {
          const orderA = a.order ?? Infinity;
          const orderB = b.order ?? Infinity;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

      } catch (error) {
        console.error("Error updating course order: ", error);
        uiStore.setError('更新課程順序失敗。');
        // If the update fails, refresh from DB to revert changes
        await this.fetchAllCourses();
      } finally {
        uiStore.setLoading(false);
      }
    },
    async deleteCourse(courseId) {
      try {
        const batch = writeBatch(db);

        // 1. Delete the course document itself
        const courseRef = doc(db, 'courses', courseId);
        batch.delete(courseRef);

        // 2. Find all users and delete their progress/quiz results for this course
        const usersCollectionRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollectionRef);

        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          
          // Delete lesson progress for the course
          const progressDocRef = doc(db, `users/${userId}/progress`, courseId);
          batch.delete(progressDocRef);

          // Delete all quiz results for the course
          const quizResultsCollectionRef = collection(db, `users/${userId}/quizResults`);
          const q = query(quizResultsCollectionRef, where("courseId", "==", courseId));
          const quizResultsSnapshot = await getDocs(q);
          quizResultsSnapshot.forEach(quizDoc => {
            batch.delete(quizDoc.ref);
          });
        }

        // IMPORTANT: This does not delete subcollections (lessons, quizzes) within the course itself.
        // A proper implementation requires a Cloud Function for recursive deletion of subcollections.
        // For now, we are manually deleting user progress.

        await batch.commit();
        await this.fetchAllCourses(); // Refresh the list

      } catch (error) {
        console.error("Error deleting course and user progress: ", error);
        throw error;
      }
    },

    // Lesson Management Actions
    async saveLesson(courseId, lessonData) {
      try {
        const lessonsCollectionRef = collection(db, `courses/${courseId}/lessons`);
        if (lessonData.id) {
          // Update existing lesson
          const lessonRef = doc(lessonsCollectionRef, lessonData.id);
          const { id, ...dataToSave } = lessonData;
          await setDoc(lessonRef, dataToSave, { merge: true });
        } else {
          // Add new lesson
          const newLessonRef = doc(lessonsCollectionRef);
          const newOrder = (this.currentCourse?.lessons?.length || 0) + 1;
          await setDoc(newLessonRef, { ...lessonData, id: newLessonRef.id, order: newOrder });
        }
        await this.fetchCourseDetails(courseId); // Refresh current course to update lessons
      } catch (error) {
        console.error("Error saving lesson: ", error);
        throw error;
      }
    },
    async deleteLesson(courseId, lessonId) {
      try {
        const lessonRef = doc(db, `courses/${courseId}/lessons`, lessonId);
        await deleteDoc(lessonRef);
        // Reorder remaining lessons
        await this.fetchCourseDetails(courseId); // Get updated lessons
        const batch = writeBatch(db);
        this.currentCourse.lessons.forEach((lesson, index) => {
          const lessonDocRef = doc(db, `courses/${courseId}/lessons`, lesson.id);
          batch.update(lessonDocRef, { order: index + 1 });
        });
        await batch.commit();
        await this.fetchCourseDetails(courseId); // Refresh again after reordering
      } catch (error) {
        console.error("Error deleting lesson: ", error);
        throw error;
      }
    },
    async updateLessonsOrder(courseId, orderedLessons) {
      try {
        const batch = writeBatch(db);
        orderedLessons.forEach((lesson, index) => {
          const lessonRef = doc(db, `courses/${courseId}/lessons`, lesson.id);
          batch.update(lessonRef, { order: index + 1 });
        });
        await batch.commit();
        await this.fetchCourseDetails(courseId); // Refresh current course
      } catch (error) {
        console.error("Error updating lessons order: ", error);
        throw error;
      }
    },

    // Quiz Management Actions
    async saveCourseQuiz(courseId, quizData) {
      try {
        const quizRef = doc(db, `courses/${courseId}/quizzes`, 'main-quiz'); // Assuming one main quiz per course
        await setDoc(quizRef, quizData);
        await this.fetchCourseDetails(courseId); // Refresh current course to update quiz
      } catch (error) {
        console.error("Error saving course quiz: ", error);
        throw error;
      }
    },
    async saveLessonQuiz(courseId, lessonId, quizData) {
      try {
        const lessonRef = doc(db, `courses/${courseId}/lessons`, lessonId);
        // Ensure the lesson quiz object has its own ID before saving
        await updateDoc(lessonRef, { quiz: { ...quizData, id: lessonId } });
        await this.fetchCourseDetails(courseId); // Refresh current course to update lesson quiz
      } catch (error) {
        console.error("Error saving lesson quiz: ", error);
        throw error;
      }
    }
  }
})


