<script setup lang="ts">
/**
 * One grid cell: wraps a sectionElement (structural) and its content blocks.
 * Renders Headline, Button, Image, Richtext directly—no SectionElement wrapper.
 */
import type { SectionBlock, SectionProps } from "~/types/project";
import { getBlockContent } from "~/utils/sectionBlockContent";
import Headline from "~/components/Headline.vue";
import Button from "~/components/Button.vue";
import Image from "~/components/Image.vue";
import Richtext from "~/components/Richtext.vue";
import Slider from "~/components/Slider.vue";
import Hero from "~/components/Hero.vue";
import Graph from "~/components/Graph.vue";
import ModalBlock from "~/components/ModalBlock.vue";
import { useSectionGridItemStyle } from "~/composables/useSectionGridItemStyle";

const props = defineProps<{
  section: SectionProps;
  sectionElementBlock: SectionBlock;
  contentBlocks: SectionBlock[];
  columnIndex: number;
  /** When set, used for width instead of block.colspan (e.g. from effective colspan distribution). */
  effectiveColspan?: number;
}>();

const colspan = computed(
  () =>
    props.effectiveColspan ??
    props.sectionElementBlock.colspan ??
    props.sectionElementBlock.columnSpan ??
    1,
);

const sectionColumns = computed(() => props.section.columns);
const gridItemStyle = useSectionGridItemStyle(colspan, sectionColumns);

const contentBlocksWithContent = computed(() =>
  props.contentBlocks
    .map((block) => ({ block, content: getBlockContent(block) }))
    .filter(
      (
        item,
      ): item is {
        block: SectionBlock;
        content: NonNullable<ReturnType<typeof getBlockContent>>;
      } => item.content !== null,
    ),
);
</script>

<template>
  <div
    v-show="!sectionElementBlock.hidden"
    class="grid-item section__element-group-wrapper"
    :style="gridItemStyle"
  >
    <div
      class="section__element-group"
      :data-colspan="colspan"
      data-accepts="headline,richtext,button,image,slider,hero,graph,modal"
    >
      <!-- sectionElement block is structural only; no visible output -->
      <template v-for="item in contentBlocksWithContent" :key="item.block.id">
        <div
          v-show="!item.block.hidden"
          :id="`block-${item.block.id}`"
          class="section-element"
        >
          <Headline
            v-if="item.content.type === 'headline'"
            v-bind="item.content.props"
          />
          <Button
            v-else-if="item.content.type === 'button'"
            v-bind="item.content.props"
          >
            Button
          </Button>
          <Image
            v-else-if="item.content.type === 'image'"
            v-bind="item.content.props"
          />
          <Richtext
            v-else-if="item.content.type === 'richtext'"
            v-bind="item.content.props"
          />
          <Slider
            v-else-if="item.content.type === 'slider'"
            v-bind="item.content.props"
          />
          <Hero
            v-else-if="item.content.type === 'hero'"
            v-bind="item.content.props"
          />
          <Graph
            v-else-if="item.content.type === 'graph'"
            v-bind="item.content.props"
          />
          <ModalBlock
            v-else-if="item.content.type === 'modal'"
            v-bind="item.content.props"
            :layout-block-id="item.block.id"
          />
        </div>
      </template>
    </div>
  </div>
</template>
