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
import markdownitIframe from 'markdown-it-iframe';

const props = defineProps({
  markdown: {
    type: String,
    required: true,
  },
});

const slides = ref([]);
const md = markdownit({ html: true }).use(markdownitIframe);
const revealContainer = ref(null);
let deck;

const parseMarkdown = (markdownText) => {
  const slideContents = markdownText.split(/^---s*$/m).map(content => {
    const iframeRegex = /<iframe(.*?)src="(.*?)"(.*?)<\/iframe>/g;
    const processedContent = content.replace(iframeRegex, (match, preAttributes, src, postAttributes) => {
      if (src.includes('youtube.com')) {
        return `<div class="iframe-container youtube-iframe-container"><iframe${preAttributes}src="${src}"${postAttributes}></iframe></div>`;
      } else {
        return `<div class="iframe-container scaled-iframe-container"><iframe${preAttributes}src="${src}"${postAttributes}></iframe></div>`;
      }
    });
    return md.render(processedContent);
  });

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
  // Explicitly remove reveal-scroll class from body
  document.body.classList.remove('reveal-scroll');

  // Remove any scrollbar elements added by reveal.js
  const scrollbar = document.querySelector('.scrollbar');
  if (scrollbar) {
    scrollbar.remove();
  }
});
</script>

<style>
.reveal {
  height: 70vh;
}
</style>
