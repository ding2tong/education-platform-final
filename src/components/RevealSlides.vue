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

const emit = defineEmits(['slide-changed']);

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
      embedded: true,
      autoAnimate: true,
      plugins: [Markdown],
    });
    deck.initialize();
    deck.on('slidechanged', event => {
      // event.indexh is the horizontal slide index
      emit('slide-changed', event.indexh);
    });
  }
};

onMounted(() => {
  parseMarkdown(props.markdown);
  initializeReveal();
});

watch(() => props.markdown, async (newMarkdown) => {
  if (!deck) return;

  // 1. Get current state
  const indices = deck.getIndices();

  // 2. Update Vue's data, which will update the DOM
  parseMarkdown(newMarkdown);

  // 3. Wait for the DOM to be updated by Vue
  await nextTick();

  // 4. Tell Reveal.js to sync with the new DOM
  deck.sync();

  // 5. Restore the slide index, just in case sync() resets it
  // We check if the slide index is still valid for the new content length
  const newTotalSlides = deck.getTotalSlides();
  if (indices.h < newTotalSlides) {
    deck.slide(indices.h, indices.v, indices.f);
  } else {
    // If the current slide was deleted, go to the new last slide
    deck.slide(newTotalSlides - 1);
  }
});

const destroyDeck = () => {
  if (deck) {
    deck.destroy();
    deck = null;
  }
  // Explicitly remove reveal-scroll class from body
  document.body.classList.remove('reveal-scroll');

  // Remove any scrollbar elements added by reveal.js
  const scrollbar = document.querySelector('.scrollbar');
  if (scrollbar) {
    scrollbar.remove();
  }
};

onUnmounted(() => {
  destroyDeck();
});

defineExpose({
  destroyDeck
});
</script>

<style>
.reveal {
  /* height: 100%; */ /* Removed to allow parent to control size */
}
</style>
