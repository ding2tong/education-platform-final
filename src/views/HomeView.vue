<template>
  <div class="home-container">
    <div class="hero-section card">
      <div class="hero-content">
        <div class="badge">Eduhouse 2.0</div>
        <h1>開啟您的專業成長之路</h1>
        <p class="hero-subtitle">
          建祥藥局專屬教育平台，整合最新商品知識與臨床實務，<br>
          讓學習變得更簡單、更直覺。
        </p>
        <div class="hero-actions">
          <button class="btn btn--primary btn--lg" @click="getStarted">
            {{ authStore.isLoggedIn ? '進入課程中心' : '立即開始學習' }}
          </button>
          <button class="btn btn--outline btn--lg" v-if="!authStore.isLoggedIn">了解更多</button>
        </div>
      </div>
      <div class="hero-visual">
        <div class="blob-container">
          <div class="blob purple"></div>
          <div class="blob orange"></div>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card card">
        <div class="stat-accent accent-purple"></div>
        <div class="stat-info">
          <h3>豐富課程</h3>
          <p>涵蓋所有專業領域</p>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-accent accent-blue"></div>
        <div class="stat-info">
          <h3>隨時學習</h3>
          <p>支援多裝置流暢體驗</p>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-accent accent-orange"></div>
        <div class="stat-info">
          <h3>測驗評估</h3>
          <p>即時回饋學習成效</p>
        </div>
      </div>
    </div>
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
.home-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-32);
}

.hero-section {
  display: flex;
  align-items: center;
  padding: 64px;
  background-color: var(--color-surface);
  position: relative;
  overflow: hidden;
}

.hero-content {
  flex: 1;
  z-index: 1;
}

.badge {
  display: inline-block;
  padding: 6px 16px;
  background-color: var(--color-pastel-purple);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-24);
}

.hero-section h1 {
  font-size: 48px;
  line-height: 1.1;
  margin-bottom: var(--space-24);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
}

.hero-subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-32);
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: var(--space-16);
}

.hero-visual {
  flex: 0.8;
  display: flex;
  justify-content: center;
  position: relative;
}

.blob-container {
  position: relative;
  width: 300px;
  height: 300px;
}

.blob {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.4;
  animation: float 6s infinite ease-in-out;
}

.blob.purple {
  background-color: var(--color-primary);
  top: 0;
  left: 0;
}

.blob.orange {
  background-color: #f6ad55;
  bottom: 0;
  right: 0;
  animation-delay: -3s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, 10px) scale(1.1); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-24);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-24);
  padding: var(--space-24);
}

.stat-accent {
  width: 8px;
  height: 64px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.accent-purple { background-color: #C7C5F4; }
.accent-blue   { background-color: #93C5FD; }
.accent-orange { background-color: #FCD34D; }

.stat-info h3 {
  margin: 0 0 4px 0;
  font-size: var(--font-size-lg);
}

.stat-info p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

@media (max-width: 1200px) {
  .hero-section h1 {
    font-size: 36px;
  }
}

@media (max-width: 1024px) {
  .hero-section {
    padding: 48px;
    flex-direction: column;
    text-align: center;
  }
  .hero-actions {
    justify-content: center;
  }
  .hero-visual {
    display: none;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>