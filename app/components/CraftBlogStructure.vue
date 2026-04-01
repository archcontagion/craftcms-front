<script setup lang="ts">
type BlogEntry = {
  id: string;
  title: string;
  uri: string | null;
  slug: string | null;
  postDate: string | null;
};

const props = defineProps<{
  posts: BlogEntry[];
}>();

function resolvePostPath(blogEntry: BlogEntry): string {
  if (blogEntry.uri && blogEntry.uri.length > 0) {
    return `/${blogEntry.uri}`;
  }

  if (blogEntry.slug && blogEntry.slug.length > 0) {
    return `/${blogEntry.slug}`;
  }

  return '#';
}
</script>

<template>
  <section v-if="props.posts.length > 0">
    <h2>Blog</h2>
    <article v-for="blogEntry in props.posts" :key="blogEntry.id">
      <h3>
        <NuxtLink :to="resolvePostPath(blogEntry)">
          {{ blogEntry.title }}
        </NuxtLink>
      </h3>
      <p v-if="blogEntry.postDate">{{ blogEntry.postDate }}</p>
    </article>
  </section>
</template>
