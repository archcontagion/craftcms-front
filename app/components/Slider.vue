<script setup lang="ts">
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-vue";
import "swiper/css";
import { Swiper, SwiperSlide } from "swiper/vue";
import type { Swiper as SwiperInstance } from "swiper";
import type { SliderSlide } from "~/types/project";
import Slide from "~/components/Slide.vue";

const SPACE_BETWEEN = 32;
const BLEED_SLIDES_PER_VIEW = 1.5;
/** Section padding-right in px so the last slide aligns to the content edge when bleed right. */
const SECTION_PADDING_RIGHT_PX = 54;
/** Same as above but 4px smaller on desktop. */
const SECTION_PADDING_RIGHT_PX_DESKTOP = 12;
/** Section padding-left in px so the first slide aligns to the content edge when bleed left. */
const SECTION_PADDING_LEFT_PX_MOBILE = 24;
/** Section padding-left in px so the first slide aligns to the content edge when bleed left. */
const SECTION_PADDING_LEFT_PX = 54;
/** Same as above but 4px smaller on desktop. */
const SECTION_PADDING_LEFT_PX_DESKTOP = -12;
/** Inset left/right (spacer-md = 2rem) so first and last slide are not cut off at tablet/desktop. */
const SLIDER_INSET_PX = 32;
/** Inset left/right on mobile (1rem) when bleed is none. */
const SLIDER_INSET_PX_MOBILE = 16;

const props = withDefaults(
  defineProps<{
    slides: SliderSlide[];
    /** When "right", slider bleeds to the right (1.5 / 2.5 / 3.5 slides, last slide aligns to content edge). When "left", same but bleeds left (first slide aligns to content edge). "none" for no bleed. */
    bleed?: "none" | "left" | "right";
    /** When true, show previous/next navigation links with chevrons to the left of the progress bar. */
    navigation?: boolean;
    /** When true, show current/total slide count to the left of the progress bar and display the progress bar. */
    pagination?: boolean;
  }>(),
  {
    bleed: "none",
    navigation: false,
    pagination: false,
  },
);

const swiperInstance = ref<SwiperInstance | null>(null);
const activeIndex = ref(0);
/** Scroll progress 0–1 from Swiper; completes at 100% when scrolled to end (accounts for slides in view). */
const scrollProgress = ref(0);

const showControlsRow = computed(() => props.navigation || props.pagination);

/** Progress bar width 0–100%; reaches 100% at end of scroll (or at "start" when bleed left). */
const progressBarWidth = computed(() => {
  const pct = scrollProgress.value * 100;
  const value = props.bleed === "left" ? 100 - pct : pct;
  return Math.min(100, Math.max(0, value));
});

/** Pagination label: 1-based current slide (human-readable). When bleed left, "1" is the last slide (rightmost). */
const paginationLabel = computed(() => {
  const total = props.slides.length;
  if (total <= 0) return "1 / 0";
  if (props.bleed === "left") {
    const progress = Number.isFinite(scrollProgress.value)
      ? scrollProgress.value
      : 1;
    const reversed = total - progress * (total - 1);
    const oneBased = Math.min(
      total,
      Math.max(1, Math.round(Number.isFinite(reversed) ? reversed : total)),
    );
    return `${oneBased} / ${total}`;
  }
  const rawPosition = scrollProgress.value * total;
  const position = Number.isFinite(rawPosition) ? rawPosition : 0;
  const oneBased =
    position <= 0
      ? 1
      : position >= total
        ? total
        : Math.min(total, Math.max(1, Math.round(position) + 1));
  const value = Number.isFinite(oneBased) ? oneBased : 1;
  return `${value} / ${total}`;
});

function goPrev() {
  swiperInstance.value?.slidePrev();
}

function goNext() {
  swiperInstance.value?.slideNext();
}

/** When bleed left, "Next" scrolls left (slidePrev) and "Prev" scrolls right (slideNext). */
function onPrevClick() {
  props.bleed === "left" ? goNext() : goPrev();
}

function onNextClick() {
  props.bleed === "left" ? goPrev() : goNext();
}

function setProgressFromSwiper(swiper: SwiperInstance) {
  activeIndex.value = swiper.activeIndex;
  scrollProgress.value = swiper.progress;
}

function onSwiper(swiper: SwiperInstance) {
  swiperInstance.value = swiper;
  setProgressFromSwiper(swiper);
}

function onSlideChange(swiper: SwiperInstance) {
  setProgressFromSwiper(swiper);
}

/** Swiper emits (swiper, progress); keep signature for vue-templated @progress. */
function onProgress(_swiper: SwiperInstance, progress: number) {
  scrollProgress.value = progress;
}

/** Key that changes when breakpoint or orientation changes so Swiper re-inits. */
const resolutionKey = ref(0);

function getResolutionKey(): number {
  if (typeof window === "undefined") return 0;
  const w = window.innerWidth;
  const breakpoint = w >= 1024 ? 2 : w >= 768 ? 1 : 0;
  const isLandscape = window.innerWidth > window.innerHeight;
  return breakpoint * 2 + (isLandscape ? 1 : 0);
}

function updateResolutionKey() {
  const next = getResolutionKey();
  if (next !== resolutionKey.value) resolutionKey.value = next;
}

onMounted(() => {
  resolutionKey.value = getResolutionKey();
  window.addEventListener("resize", updateResolutionKey);
  window.addEventListener("orientationchange", updateResolutionKey);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateResolutionKey);
  window.removeEventListener("orientationchange", updateResolutionKey);
});

const swiperOptions = computed(() => {
  const bleedRight = props.bleed === "right";
  const bleedLeft = props.bleed === "left";
  const bleedAny = bleedRight || bleedLeft;

  const options = {
    spaceBetween: SPACE_BETWEEN,
    slidesPerView: 1,
    centeredSlides: false,
    watchSlidesProgress: true,
    // Inset left/right (spacer-md) when no bleed; when bleed right/left, offset on opposite side so first/last slide aligns to content edge.
    slidesOffsetBefore: bleedRight
      ? 0
      : bleedLeft
        ? SPACE_BETWEEN + SECTION_PADDING_LEFT_PX
        : SLIDER_INSET_PX_MOBILE,
    slidesOffsetAfter: bleedRight
      ? SPACE_BETWEEN + SECTION_PADDING_RIGHT_PX
      : bleedLeft
        ? 0
        : SLIDER_INSET_PX_MOBILE,
    breakpoints: bleedRight
      ? {
          768: { slidesPerView: 2.5 },
          1024: {
            slidesPerView: 3.5,
            slidesOffsetAfter: SPACE_BETWEEN + SECTION_PADDING_RIGHT_PX_DESKTOP,
          },
        }
      : bleedLeft
        ? {
            320: {
              slidesPerView: 1.5,
              slidesOffsetAfter: SECTION_PADDING_LEFT_PX_MOBILE,
            },
            768: {
              slidesPerView: 2.5,
              slidesOffsetAfter:
                SPACE_BETWEEN + SECTION_PADDING_LEFT_PX_DESKTOP,
            },
            1024: {
              slidesPerView: 3.5,
              slidesOffsetBefore:
                SPACE_BETWEEN + SECTION_PADDING_LEFT_PX_DESKTOP,
              slidesOffsetAfter:
                SPACE_BETWEEN + SECTION_PADDING_LEFT_PX_DESKTOP,
            },
          }
        : {
            768: { slidesPerView: 2 },
            1024: {
              slidesPerView: 3,
              slidesOffsetBefore: 0,
              slidesOffsetAfter: 0,
            },
          },
    // Bleed: 1.5 mobile, 2.5 tablet, 3.5 desktop; otherwise 3 on desktop.
    ...(bleedAny ? { slidesPerView: BLEED_SLIDES_PER_VIEW } : {}),
    // Bleed left: start at last slide so rightmost slide is at content edge and slides bleed out to the left.
    ...(bleedLeft && props.slides.length > 0
      ? { initialSlide: props.slides.length - 1 }
      : {}),
  };
  // vue-swiper prop types reject some valid Swiper breakpoint shapes in strict TS; runtime config is correct.
  return options as any;
});

const rootAttrs = computed(() => ({
  "data-bleed": props.bleed === "none" ? undefined : props.bleed,
  "data-navigation": props.navigation ? "true" : undefined,
  "data-pagination": props.pagination ? "true" : undefined,
}));

/** Ref to slider root for finding parent section container. */
const sliderRoot = ref<HTMLElement | null>(null);
/** Parent section container we added the bleed class to (for cleanup). */
const sectionContainerWithBleed = ref<HTMLElement | null>(null);

function getSectionContainer(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;
  let current: HTMLElement | null = el.parentElement;
  while (current) {
    if (current.classList?.contains("section__container")) return current;
    current = current.parentElement;
  }
  return null;
}

function updateParentSectionBleedClass() {
  const root = sliderRoot.value;
  const container = getSectionContainer(root);

  const prev = sectionContainerWithBleed.value;
  if (prev) {
    prev.classList.remove("section__container--slider-bleed--right");
    prev.classList.remove("section__container--slider-bleed--left");
    prev.classList.remove("section__container--slider-bleed--none");
    sectionContainerWithBleed.value = null;
  }

  if (props.bleed === "right" && container) {
    container.classList.add("section__container--slider-bleed--right");
    sectionContainerWithBleed.value = container;
  }
  if (props.bleed === "left" && container) {
    container.classList.add("section__container--slider-bleed--left");
    sectionContainerWithBleed.value = container;
  }
  if (props.bleed === "none" && container) {
    container.classList.add("section__container--slider-bleed--none");
    sectionContainerWithBleed.value = container;
  }
}

watch([sliderRoot, () => props.bleed], updateParentSectionBleedClass, {
  immediate: true,
});

onUnmounted(() => {
  const prev = sectionContainerWithBleed.value;
  if (prev) {
    prev.classList.remove("section__container--slider-bleed--right");
    prev.classList.remove("section__container--slider-bleed--left");
    prev.classList.remove("section__container--slider-bleed--none");
    sectionContainerWithBleed.value = null;
  }
});
</script>

<template>
  <div ref="sliderRoot" class="slider" v-bind="rootAttrs">
    <Swiper
      v-if="slides.length"
      :key="resolutionKey"
      v-bind="swiperOptions"
      @swiper="onSwiper"
      @slide-change="onSlideChange"
      @progress="onProgress"
    >
      <SwiperSlide v-for="(slide, i) in slides" :key="i">
        <Slide :slide="slide" />
      </SwiperSlide>
    </Swiper>
    <div
      v-if="showControlsRow && slides.length"
      class="slider-controls"
      role="group"
      aria-label="Slider controls"
    >
      <template v-if="navigation">
        <button
          type="button"
          class="slider-controls__nav slider-controls__nav--prev"
          :aria-label="props.bleed === 'left' ? 'Next slide' : 'Previous slide'"
          :disabled="
            props.bleed === 'left'
              ? activeIndex >= props.slides.length - 1
              : activeIndex <= 0
          "
          @click="onPrevClick"
        >
          <IconChevronLeft :size="20" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="slider-controls__nav slider-controls__nav--next"
          :aria-label="props.bleed === 'left' ? 'Previous slide' : 'Next slide'"
          :disabled="
            props.bleed === 'left'
              ? activeIndex <= 0
              : activeIndex >= props.slides.length - 1
          "
          @click="onNextClick"
        >
          <IconChevronRight :size="20" aria-hidden="true" />
        </button>
      </template>
      <template v-if="pagination">
        <span class="slider-controls__pagination" aria-live="polite">
          {{ paginationLabel }}
        </span>
      </template>
      <div
        class="slider-controls__progress"
        role="progressbar"
        :aria-valuenow="scrollProgress"
        aria-valuemin="0"
        aria-valuemax="1"
        :aria-label="`Progress: ${paginationLabel}`"
      >
        <div
          class="slider-controls__progress-fill"
          :style="{ width: `${progressBarWidth}%` }"
        />
      </div>
    </div>
  </div>
</template>
