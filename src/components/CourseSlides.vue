<template>
  <div class="reveal" ref="revealEl">
    <div class="slides">
      <section data-markdown data-separator="---" data-separator-vertical="--">
        <textarea data-template>{{ markdownContent }}</textarea>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import Reveal from 'reveal.js';
import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js';
import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/white.css';

const props = defineProps({
  courseMarkdown: {
    type: String,
    required: true,
  },
});

const markdownContent = ref('');
const revealEl = ref(null); // Template ref
let deck;

watch(() => props.courseMarkdown, (newValue) => {
  markdownContent.value = newValue;
  // Use nextTick to ensure the DOM is updated before re-syncing reveal.js
  nextTick(() => {
    if (deck) {
      deck.sync();
      deck.slide(0); // Reset to the first slide on content change
    }
  });
}, { immediate: true });

onMounted(() => {
  if (revealEl.value) {
    deck = new Reveal(revealEl.value, {
      embedded: true, // Important for running in a component
    });
    deck.initialize({
      plugins: [Markdown],
      hash: true,
    });
  }
});
</script>

<style>
/* Make reveal.js container fill the viewport */
.reveal {
  height: 100vh;
  width: 100%;
}
</style>
