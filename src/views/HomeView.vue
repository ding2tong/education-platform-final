<template>
  <div class="page">
    <section class="hero">
      <div class="container">
        <h1>歡迎來到建祥教育訓練平台</h1>
        <p class="hero-subtitle">在這裡，您可以找到豐富的教育訓練與商品知識課程。</p>
        <button class="btn btn--primary btn--lg" @click="getStarted">立即開始學習</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const getStarted = async () => {
  if (authStore.isLoggedIn) {
    router.push('/courses');
  } else {
    try {
      await authStore.loginWithGoogle();
      router.push('/courses');
    } catch (error) {
      console.error('Login failed', error);
    }
  }
};
</script>

<style scoped>
.hero {
  background-color: var(--color-background);
  padding: var(--space-32) var(--space-16);
  text-align: center;
}

.hero h1 {
  margin-bottom: var(--space-16);
}

.hero-subtitle {
  font-size: var(--font-size-xl);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-24);
}
</style>