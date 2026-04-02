<script setup lang="ts">
import Image from '~/components/Image.vue';
import type {HeroComponentBlock} from '~~/types';

const props = defineProps<{
  blocks: HeroComponentBlock[];
}>();

function primaryHeadline(heroBlock: HeroComponentBlock): string {
  const fromHeroTitle = heroBlock.heroTitle?.trim();
  if (fromHeroTitle) {
    return fromHeroTitle;
  }
  return '';
}
</script>

<template>
  <section v-if="props.blocks.length > 0">
    <article v-for="heroBlock in props.blocks" :key="heroBlock.id" class="hero">
      <div class="hero__bg">
        <Image
          v-for="(asset, assetIndex) in heroBlock.heroImage"
          :key="`${heroBlock.id}-hero-image-${assetIndex}`"
          :src="asset.url"
          :alt="
            asset.alt ||
            asset.title ||
            primaryHeadline(heroBlock) ||
            'Hero image'
          "
          width="100%"
          height="100%"
          fit="cover"
          class="hero__img"
        />
      </div>
      <div class="hero__content">
        <p v-if="heroBlock.heroSubline" class="hero__roofline">
          {{ heroBlock.heroSubline }}
        </p>
        <h2 v-if="primaryHeadline(heroBlock)" class="hero__headline">
          {{ primaryHeadline(heroBlock) }}
        </h2>
      </div>
    </article>
  </section>
</template>
