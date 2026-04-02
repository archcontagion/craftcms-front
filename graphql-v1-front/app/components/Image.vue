<script setup lang="ts">
const props = defineProps<{
  src: string;
  alt: string;
  width: number | string;
  height: number | string;
  fit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  lazy?: boolean;
  class?: string;
  aspectRatio?: number;
}>();

const numericWidth = computed(() =>
  typeof props.width === 'number' ? props.width : undefined,
);
const numericHeight = computed(() =>
  typeof props.height === 'number' ? props.height : undefined,
);
const dimensionStyle = computed(() => {
  const style: Record<string, string> = { display: 'block' };
  if (typeof props.width === 'string') style.width = props.width;
  if (typeof props.height === 'string') style.height = props.height;
  return style;
});
</script>

<template>
  <NuxtImg
    draggable="false"
    :src="src"
    :loading="lazy ? 'lazy' : 'eager'"
    :alt="alt"
    :width="numericWidth ?? '100%'"
    :height="numericHeight ?? 'auto'"
    :fit="fit"
    :aspectRatio="aspectRatio"
    :class="['img', props.class]"
    :style="dimensionStyle"
  />
</template>
