<script setup lang="ts">
import type { SliderSlide } from "~/types/project";
import Image from "~/components/Image.vue";

const props = defineProps<{
  slide: SliderSlide;
}>();

const imageProps = computed(() => {
  const img = props.slide.image;
  if (typeof img === "string") {
    return {
      src: img,
      alt: props.slide.caption ?? "",
      width: 800,
      height: 500,
      fit: "cover" as const,
    };
  }
  return {
    src: img.src,
    alt: img.alt ?? props.slide.caption ?? "",
    width: img.width ?? 800,
    height: img.height ?? 500,
    fit: img.fit ?? "cover",
    lazy: img.lazy,
    aspectRatio: img.aspectRatio,
  };
});
</script>

<template>
  <div class="slide">
    <Image class="slide__image" v-bind="imageProps" />
    <span v-if="slide.caption" class="slide__caption">
      {{ slide.caption }}
    </span>
    <div v-if="slide.title || slide.text" class="slide__content">
      <h3 v-if="slide.title" class="slide__title">
        {{ slide.title }}
      </h3>
      <p v-if="slide.text" class="slide__text">
        {{ slide.text }}
      </p>
    </div>
  </div>
</template>
