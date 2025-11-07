<template>
  <div ref="revealContainer" class="reveal">
    <div class="slides">
      <section v-for="(slide, index) in slides" :key="index" v-html="slide"></section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import Reveal from 'reveal.js';
import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js';
import 'reveal.js/dist/reveal.css';
import '@/assets/reveal-theme-custom.css';
import markdownit from 'markdown-it';

const props = defineProps({
  markdown: {
    type: String,
    required: true,
  },
});

const slides = ref([]);
const md = markdownit({ html: true });
const revealContainer = ref(null);
let deck;

const parseMarkdown = (markdownText) => {
  const slideContents = markdownText.split(/^---s*$/m).map(content => md.render(content));
  slides.value = slideContents;
};

const initializeReveal = async () => {
  if (deck) {
    deck.destroy();
  }
  await nextTick();
  if (revealContainer.value) {
    deck = new Reveal(revealContainer.value, {
      autoAnimate: true,
      plugins: [Markdown],
    });
    deck.initialize();
  }
};

onMounted(() => {
  parseMarkdown(props.markdown);
  initializeReveal();
});

watch(() => props.markdown, (newMarkdown) => {
  parseMarkdown(newMarkdown);
  initializeReveal();
});

onUnmounted(() => {
  if (deck) {
    deck.destroy();
  }
});
</script>

<style>
.reveal {
  height:70vh;
}
</style>
