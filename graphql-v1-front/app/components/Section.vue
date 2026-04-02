<script setup lang="ts">
/**
 * Section: layout container for section content.
 * Uses SectionElementGroup per column cell (sectionElement + its content blocks).
 * Presentational only; no drag/drop or selection (use Theme Roller wrappers for that).
 */
import type { SectionBlock, SectionProps } from "~/types/project";
import { computeEffectiveColspans } from "~/composables/useSectionEffectiveColspans";
import { useSpacers } from "~/composables/useSpacers";
import SectionElementGroup from "~/components/SectionElementGroup.vue";

const CONTENT_TYPES = new Set([
  "headline",
  "richtext",
  "button",
  "image",
  "slider",
  "hero",
  "graph",
  "modal",
]);

const props = defineProps<{
  section: SectionProps;
}>();

const { getSpacerTop, getSpacerBottom, getPaddingTop, getPaddingBottom } =
  useSpacers();

/** Map project spacer keys (e.g. spacer-md) to useSpacers SpacerSize (e.g. m). */
function toSpacerSize(value: string | undefined): string {
  if (!value) return "";
  const key = value.replace(/^spacer-/, "");
  const map: Record<string, string> = {
    none: "0",
    xxs: "xxs",
    xs: "xs",
    sm: "s",
    md: "m",
    lg: "l",
    xl: "xl",
    xxl: "xxl",
  };
  return map[key] ?? key;
}

/** Group blocks by sectionElement: each group is one sectionElement + its content blocks in that column. */
function groupsInColumn(
  blocks: SectionBlock[],
  columnIndex: number,
): { sectionElement: SectionBlock; contentBlocks: SectionBlock[] }[] {
  const colBlocks = blocks.filter((b) => b.columnIndex === columnIndex);
  const groups: {
    sectionElement: SectionBlock;
    contentBlocks: SectionBlock[];
  }[] = [];
  let current: {
    sectionElement: SectionBlock;
    contentBlocks: SectionBlock[];
  } | null = null;
  for (const b of colBlocks) {
    if (b.type === "sectionElement") {
      current = { sectionElement: b, contentBlocks: [] };
      groups.push(current);
    } else if (current && CONTENT_TYPES.has(b.type)) {
      current.contentBlocks.push(b);
    }
  }
  return groups;
}

const sectionColumns = computed(() => props.section.columns ?? 1);

const effectiveColspans = computed(() =>
  computeEffectiveColspans(props.section),
);
/** Column count from effective colspans (0 = auto, distributed). */
const sectionColumnCount = computed(
  () => effectiveColspans.value.sectionColumnCount,
);

/** Grid cells: one SectionElementGroup per (sectionElement + content blocks). */
const innerCells = computed(() => {
  const blocks = props.section.blocks ?? [];
  const count = sectionColumnCount.value;
  const cells: {
    type: "group";
    sectionElement: SectionBlock;
    contentBlocks: SectionBlock[];
    columnIndex: number;
  }[] = [];
  for (let columnIndex = 1; columnIndex <= count; columnIndex++) {
    const groups = groupsInColumn(blocks, columnIndex);
    for (const g of groups) {
      cells.push({
        type: "group",
        sectionElement: g.sectionElement,
        contentBlocks: g.contentBlocks,
        columnIndex,
      });
    }
  }
  return cells;
});

const containerClass = computed(() => {
  const section = props.section;
  const marginTop = getSpacerTop(toSpacerSize(section.marginTop));
  const marginBottom = getSpacerBottom(toSpacerSize(section.marginBottom));
  const paddingTop = getPaddingTop(toSpacerSize(section.paddingTop));
  const paddingBottom = getPaddingBottom(toSpacerSize(section.paddingBottom));
  const bleed = section.containerBleedOut ? "section__container--bleed" : null;

  return [
    "container",
    "section__container",
    marginTop,
    marginBottom,
    paddingTop,
    paddingBottom,
    bleed,
  ]
    .filter(Boolean)
    .join(" ");
});

const innerClass = computed(() => {
  const section = props.section;
  const top = getPaddingTop(toSpacerSize(section.paddingTop));
  const bottom = getPaddingBottom(toSpacerSize(section.paddingBottom));
  const custom = section.customClass?.trim() || "";

  return [
    "section__container-inner",
    "section__container-inner--flex-row",
    top,
    bottom,
    ...(custom ? [custom] : []),
  ]
    .filter(Boolean)
    .join(" ");
});

/** Bootstrap-like row: flex container without .grid so item widths come only from useSectionGridItemStyle(colspan). */
const sectionInnerStyle = computed(() => {
  const s = props.section;
  const style: Record<string, string> = {
    display: "flex",
    "flex-direction": "row",
    "flex-wrap": "wrap",
    "align-items": "flex-start",
    "--cols": String(sectionColumns.value),
    "--section-cols": String(sectionColumns.value),
    "--total-grid-items": String(innerCells.value.length),
    "column-gap": "var(--section-col-gap)",
  };
  if (s.paddingTop == null || s.paddingTop === "") {
    style.paddingTop = "0";
  }
  if (s.paddingBottom == null || s.paddingBottom === "") {
    style.paddingBottom = "0";
  }
  if (s.columnGap != null) {
    style["--section-col-gap"] = s.columnGap;
  }
  if (s.rowGap) {
    style["--section-row-gap"] = s.rowGap;
    style["row-gap"] = "var(--section-row-gap)";
  }
  return style;
});
</script>
<template>
  <section
    v-show="!section.hidden"
    :id="`section-${section.id}`"
    class="section"
    :class="section.containerBleedOut ? 'section--bleed' : null"
  >
    <div :class="containerClass">
      <div
        :class="innerClass"
        :data-cols="sectionColumns"
        :style="sectionInnerStyle"
      >
        <SectionElementGroup
          v-for="cell in innerCells"
          :key="cell.sectionElement.id"
          class="grid-item"
          :section="section"
          :section-element-block="cell.sectionElement"
          :content-blocks="cell.contentBlocks"
          :column-index="cell.columnIndex"
          :effective-colspan="
            effectiveColspans.effectiveColspanByBlockId[cell.sectionElement.id]
          "
        />
      </div>
    </div>
  </section>
</template>
