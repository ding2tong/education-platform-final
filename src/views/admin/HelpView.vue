<template>
  <div class="page">
    <div class="container">
      <div class="card">
        <div class="card__body">
          <div class="markdown-body" v-html="renderedMarkdown"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import MarkdownIt from 'markdown-it';
import guideContent from '../../TEACHER_GUIDE.md?raw';

const md = new MarkdownIt();
const renderedMarkdown = ref('');

onMounted(() => {
  renderedMarkdown.value = md.render(guideContent);
});
</script>

<style scoped>
.markdown-body {
  padding: 2rem;
  line-height: 1.7;
}

/* Basic styling for rendered markdown */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5em;
  margin-top: 1.5em;
  margin-bottom: 1em;
}

.markdown-body :deep(code) {
  background-color: var(--color-secondary);
  padding: 0.2em 0.4em;
  border-radius: var(--radius-sm);
  font-size: 0.9em;
}

.markdown-body :deep(pre) {
  background-color: #2d2d2d;
  color: #f8f8f2;
  padding: 1em;
  border-radius: var(--radius-base);
  overflow-x: auto;
}

.markdown-body :deep(pre) code {
  background-color: transparent;
  padding: 0;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid var(--color-border);
  padding-left: 1em;
  color: var(--color-text-secondary);
  margin-left: 0;
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1em;
  margin-bottom: 1em;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--color-border);
  padding: 0.75em;
}

.markdown-body :deep(th) {
  background-color: var(--color-secondary);
}
</style>
