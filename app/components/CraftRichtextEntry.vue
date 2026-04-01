<script setup lang="ts">
import Headline from '~/components/Headline.vue';
import Richtext from '~/components/Richtext.vue';

type RichtextEntry = {
  id: string;
  title: string | null;
  richtextHtml: string | null;
};

const props = defineProps<{
  entry: RichtextEntry;
}>();
</script>

<template>
  <section class="section section-no-bg-color">
    <div class="container section__container">
      <div class="section__container-inner">
        <div
          v-if="props.entry.title"
          :id="`body-richtext-title-${props.entry.id}`"
          class="section-element"
        >
          <Headline :title="props.entry.title" title-tag="h3" style-tag="h3" />
        </div>
        <div
          v-if="props.entry.richtextHtml"
          :id="`body-richtext-content-${props.entry.id}`"
          class="section-element"
        >
          <Richtext :content="props.entry.richtextHtml" />
        </div>
      </div>
    </div>
  </section>
</template>
