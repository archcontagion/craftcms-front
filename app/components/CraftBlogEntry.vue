<script setup lang="ts">
type BlogEntry = {
  id: string;
  title: string;
  slug: string | null;
  uri: string | null;
  postDate: string | null;
};

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
