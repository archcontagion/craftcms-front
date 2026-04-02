<script setup lang="ts">
const props = defineProps<{
  links: {
    href: string;
    label: string;
  }[];
}>();
</script>

<template>
  <div class="navbar">
    <nav class="navbar__links">
      <a
        v-for="link in props.links"
        :key="link.href"
        :href="link.href"
        class="navbar__link"
        >{{ link.label }}</a
      >
    </nav>
  </div>
</template>
