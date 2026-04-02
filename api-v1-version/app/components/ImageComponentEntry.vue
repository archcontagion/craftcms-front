<script setup lang="ts">
import Image from '~/components/Image.vue';
import type {ImageComponentEntryModel} from '~~/types';

const props = defineProps<{
  entry: ImageComponentEntryModel;
}>();
</script>

<template>
  <section
    v-if="props.entry.images.length > 0"
    :aria-label="props.entry.title ?? undefined"
  >
    <figure v-for="(asset, assetIndex) in props.entry.images" :key="`${props.entry.id}-img-${assetIndex}`">
      <Image
        :src="asset.url"
        :alt="asset.alt || asset.title || props.entry.title || 'Image'"
        width="100%"
        height="auto"
        fit="contain"
      />
      <figcaption v-if="asset.title && asset.title !== props.entry.title">
        {{ asset.title }}
      </figcaption>
    </figure>
  </section>
</template>
