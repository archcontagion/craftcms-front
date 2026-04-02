<script setup lang="ts">
import type {BlogEntry} from '~~/types';

const props = defineProps<{
  entry: BlogEntry;
}>();
</script>

<template>
  <article>
    <NuxtLink to="/blog">Back to Blog</NuxtLink>
    <h1>{{ props.entry.title }}</h1>
    <p v-if="props.entry.postDate">{{ props.entry.postDate }}</p>
  </article>
</template>
