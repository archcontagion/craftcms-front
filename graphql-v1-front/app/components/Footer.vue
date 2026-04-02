<script setup lang="ts">
const props = defineProps<{
  links: {
    href: string;
    label: string;
  }[];
}>();
</script>

<template>
  <div class="footer">
    <nav class="footer__links">
      <a
        v-for="link in props.links"
        :key="link.href"
        :href="link.href"
        class="footer__link"
        >{{ link.label }}</a
      >
    </nav>
  </div>
</template>
