<script setup lang="ts">
const props = defineProps<{
  content: string;
}>();
</script>

<template>
  <div class="richtext" v-html="content"></div>
</template>
