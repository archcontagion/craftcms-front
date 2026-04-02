<script setup lang="ts">
import Image from "~/components/Image.vue";
import Headline from "~/components/Headline.vue";

const props = withDefaults(
  defineProps<{
    imageSrc: string;
    imageAlt: string;
    imageFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
    roofline?: string;
    headline: string;
    headlineTag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    headlineStyle?:
      | "none"
      | "display"
      | "h1"
      | "h2"
      | "h3"
      | "h4"
      | "h5"
      | "h6";
  }>(),
  {
    imageFit: "cover",
    headlineTag: "h1",
    headlineStyle: "display",
  },
);
</script>

<template>
  <div class="hero">
    <div class="hero__bg">
      <Image
        :src="props.imageSrc"
        :alt="props.imageAlt"
        width="100%"
        height="100%"
        :fit="props.imageFit"
        class="hero__img"
      />
    </div>
    <div class="hero__content">
      <div v-if="props.roofline" class="hero__roofline">
        {{ props.roofline }}
      </div>
      <Headline
        :title="props.headline"
        :title-tag="props.headlineTag"
        :style-tag="props.headlineStyle"
        margin-top="spacer-none"
        margin-bottom="spacer-none"
        class="hero__headline"
      />
    </div>
  </div>
</template>
