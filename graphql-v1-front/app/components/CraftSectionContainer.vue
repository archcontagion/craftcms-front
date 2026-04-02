<script setup lang="ts">
/**
 * Column layout for Craft `columnContainer` blocks. Each column (`entries[]` item) is one
 * grid cell and may include, in order (all optional):
 * 1. **Headline** — from Craft `headline` block when set; else entry `title` (see mapper)
 * 2. **Richtext** — `Richtext` from `columnRichtextHtml`
 * 3. **Image** — one or more `Image` from `imageComponent`
 *
 * Width uses `.grid-item.colspan-{1–12}` from `layout/_grid.scss`, matching
 * `useSectionGridItemStyle` (12-column flex row with `--section-cols` and `--section-col-gap`).
 * Optional `columnSpan` from CMS: plain text `6-6`, `4-8`, `4-4-4`, etc.
 */
import Headline from '~/components/Headline.vue';
import Image from '~/components/Image.vue';
import Richtext from '~/components/Richtext.vue';
import {useSpacers} from '~/composables/useSpacers';
import {parseCraftColumnSpanUnits} from '~/utils/craft-column-span';
import type {CSSProperties} from 'vue';

type SectionContainerEntry = {
  id: string;
  uri: string | null;
  slug: string | null;
  /** Craft `headline` field — sole source for `<Headline>` (not native entry `title`). */
  headline: string | null;
  /** Shown via `Richtext` when non-empty. */
  columnRichtextHtml: string | null;
  /** Shown via `Image` (one section-element per asset). */
  imageComponent: Array<{
    url: string;
    title: string | null;
    alt: string | null;
  }>;
};

const props = withDefaults(
  defineProps<{
    entries: SectionContainerEntry[];
    /** Craft `columnSpan` plain text on the column container entry (`6-6`, `4-8`, …). */
    columnSpan?: string | null;
    /** Same token shape as Section.vue / Storyblok (e.g. `spacer-md`, `spacer-none`). */
    marginTop?: string;
    marginBottom?: string;
    paddingTop?: string;
    paddingBottom?: string;
    containerBleedOut?: boolean;
    /** Extra classes on the inner flex row (e.g. from CMS). */
    customClass?: string;
  }>(),
  {
    columnSpan: undefined,
    marginTop: undefined,
    marginBottom: undefined,
    paddingTop: undefined,
    paddingBottom: undefined,
    containerBleedOut: false,
    customClass: undefined,
  },
);

const {getSpacerTop, getSpacerBottom, getPaddingTop, getPaddingBottom} =
  useSpacers();

/**
 * Craft CMS dropdowns use `sm`, `md`, `lg`; `useSpacers()` uses `s`, `m`, `l`
 * (see `padding_top_classes` keys in `useSpacers.ts`).
 */
function craftSpacingTokenToUseSpacersSize(value: string | undefined): string {
  if (!value) {
    return '';
  }
  const key = value.replace(/^spacer-/, '').trim();
  const craftToSpacer: Record<string, string> = {
    none: '0',
    xxs: 'xxs',
    xs: 'xs',
    sm: 's',
    md: 'm',
    lg: 'l',
    xl: 'xl',
    xxl: 'xxl',
  };
  return craftToSpacer[key] ?? key;
}

const containerClass = computed(() => {
  const marginTopClass = getSpacerTop(
    craftSpacingTokenToUseSpacersSize(props.marginTop),
  );
  const marginBottomClass = getSpacerBottom(
    craftSpacingTokenToUseSpacersSize(props.marginBottom),
  );
  const paddingTopClass = getPaddingTop(
    craftSpacingTokenToUseSpacersSize(props.paddingTop),
  );
  const paddingBottomClass = getPaddingBottom(
    craftSpacingTokenToUseSpacersSize(props.paddingBottom),
  );
  const bleed = props.containerBleedOut ? 'section__container--bleed' : null;

  return [
    'container',
    'section__container',
    marginTopClass,
    marginBottomClass,
    paddingTopClass,
    paddingBottomClass,
    bleed,
  ]
    .filter(Boolean)
    .join(' ');
});

const innerClass = computed(() => {
  const top = getPaddingTop(
    craftSpacingTokenToUseSpacersSize(props.paddingTop),
  );
  const bottom = getPaddingBottom(
    craftSpacingTokenToUseSpacersSize(props.paddingBottom),
  );
  const custom = props.customClass?.trim() || '';

  return [
    'section__container-inner',
    'section__container-inner--flex-row',
    top,
    bottom,
    ...(custom ? [custom] : []),
  ]
    .filter(Boolean)
    .join(' ');
});

const sectionColumnCount = computed(() => Math.max(1, props.entries.length));

/** Per-column grid units (1–12); drives `.colspan-{n}` in `_grid.scss`. */
const columnSpanUnitsList = computed(() =>
  parseCraftColumnSpanUnits(props.columnSpan ?? null, props.entries.length),
);

function colspanClassForColumn(columnIndex: number): string {
  const units = columnSpanUnitsList.value[columnIndex];
  if (units == null || units < 1) {
    return 'colspan-12';
  }
  return `colspan-${String(units)}`;
}

const sectionInnerStyle = computed<CSSProperties & Record<string, string>>(
  () => {
    const style: Record<string, string> = {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      '--cols': String(sectionColumnCount.value),
      '--section-cols': String(sectionColumnCount.value),
      '--total-grid-items': String(props.entries.length),
      columnGap: 'var(--section-col-gap)',
    };
    if (props.paddingTop == null || props.paddingTop === '') {
      style.paddingTop = '0';
    }
    if (props.paddingBottom == null || props.paddingBottom === '') {
      style.paddingBottom = '0';
    }
    return style;
  },
);

function headlinePlainText(
  sectionContainerEntry: SectionContainerEntry,
): string {
  return sectionContainerEntry.headline?.trim() ?? '';
}
</script>

<template>
  <section
    v-if="props.entries.length > 0"
    class="section section-no-bg-color"
    :class="props.containerBleedOut ? 'section--bleed' : null"
  >
    <div :class="containerClass">
      <div
        :class="innerClass"
        :data-cols="sectionColumnCount"
        :style="sectionInnerStyle"
      >
        <div
          v-for="(sectionContainerEntry, columnIndex) in props.entries"
          :key="sectionContainerEntry.id"
          class="grid-item section__element-group-wrapper"
          :class="colspanClassForColumn(columnIndex)"
        >
          <div
            class="section__element-group"
            :data-colspan="columnSpanUnitsList[columnIndex] ?? undefined"
            data-accepts="headline,richtext,image"
          >
            <!-- Headline (optional) -->
            <div
              v-if="headlinePlainText(sectionContainerEntry)"
              :id="`block-${sectionContainerEntry.id}-headline`"
              class="section-element section-element--headline"
            >
              <Headline
                :title="headlinePlainText(sectionContainerEntry)"
                title-tag="h3"
                style-tag="h3"
              />
            </div>
            <!-- Richtext (optional) -->
            <div
              v-if="sectionContainerEntry.columnRichtextHtml"
              :id="`block-${sectionContainerEntry.id}-richtext`"
              class="section-element section-element--richtext"
            >
              <Richtext :content="sectionContainerEntry.columnRichtextHtml" />
            </div>
            <!-- Image(s) (optional, one block per asset) -->
            <div
              v-for="(
                asset, assetIndex
              ) in sectionContainerEntry.imageComponent"
              :id="`block-${sectionContainerEntry.id}-image-${assetIndex}`"
              :key="`${sectionContainerEntry.id}-column-image-${assetIndex}`"
              class="section-element section-element--image"
            >
              <Image
                :src="asset.url"
                :alt="
                  asset.alt ||
                  asset.title ||
                  sectionContainerEntry.headline?.trim() ||
                  'Section image'
                "
                width="100%"
                height="auto"
                fit="cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
