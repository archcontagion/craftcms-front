<script setup lang="ts">
const props = defineProps<{
  links: {
    slug: string;
    title: string;
  }[];
}>();
</script>

<template>
  <div class="navbar">
    <nav class="navbar__links">
      <a
        v-for="link in props.links"
        :key="link.slug"
        :href="link.slug"
        class="navbar__link"
        >{{ link.title }}</a
      >
    </nav>
  </div>
</template>
