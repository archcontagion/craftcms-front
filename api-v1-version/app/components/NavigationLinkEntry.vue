<script setup lang="ts">
import type {NavigationLinkEntryModel} from '~~/types';

const props = defineProps<{
  entry: NavigationLinkEntryModel;
}>();

const resolvedPath = computed(() => {
  if (props.entry.uri && props.entry.uri.length > 0) {
    return `/${props.entry.uri}`;
  }

  if (props.entry.slug && props.entry.slug.length > 0) {
    return `/${props.entry.slug}`;
  }

  return '#';
});
</script>

<template>
  <section class="section section-no-bg-color">
    <div class="container section__container">
      <div class="section__container-inner">
        <a :id="`body-navigation-link-${props.entry.id}`" :href="resolvedPath">
          {{ props.entry.title }}
        </a>
      </div>
    </div>
  </section>
</template>
