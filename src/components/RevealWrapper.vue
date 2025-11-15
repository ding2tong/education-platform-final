<template>
  <iframe ref="iframe" @load="onIframeLoad" style="width: 100%; height: 70vh; border: 0;"></iframe>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  markdown: {
    type: String,
    required: true,
  },
});

const iframe = ref(null);

const updateIframeContent = () => {
  if (!iframe.value) return;

  const doc = iframe.value.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="stylesheet" href="/node_modules/reveal.js/dist/reveal.css">
        <link rel="stylesheet" href="/assets/reveal-theme-custom.css">
      </head>
      <body>
        <div class="reveal">
          <div class="slides">
            <section data-markdown>
              <textarea data-template>
                ${props.markdown}
              </textarea>
            </section>
          </div>
        </div>
        <script src="/node_modules/reveal.js/dist/reveal.js"></script>
        <script src="/node_modules/reveal.js/plugin/markdown/markdown.js"></script>
        <script>
          Reveal.initialize({
            plugins: [ RevealMarkdown ],
            viewDistance: 3,
            mobileViewDistance: 3,
          });
        </script>
      </body>
    </html>
  `);
  doc.close();
};

const onIframeLoad = () => {
  updateIframeContent();
};

watch(() => props.markdown, () => {
  updateIframeContent();
});
</script>
