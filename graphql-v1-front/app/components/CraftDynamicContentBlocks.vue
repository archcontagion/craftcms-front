<script setup lang="ts">
import {computed} from 'vue';
import CraftHeroComponent from '~/components/CraftHeroComponent.vue';
import CraftSectionContainer from '~/components/CraftSectionContainer.vue';
import CraftRichtextEntry from '~/components/CraftRichtextEntry.vue';
import CraftNavigationLinkEntry from '~/components/CraftNavigationLinkEntry.vue';
import CraftImageComponentEntry from '~/components/CraftImageComponentEntry.vue';
import {
  craftSectionSpacingToClassList,
  type CraftSectionSpacingFields,
} from '~/utils/craft-section-spacing';

type CraftAsset = {
  url: string;
  title: string | null;
  alt: string | null;
};

type HeroComponentBlock = {
  id: string;
  title: string | null;
  heroTitle: string | null;
  heroSubline: string | null;
  heroImage: CraftAsset[];
};

type SectionContainerEntry = {
  id: string;
  uri: string | null;
  slug: string | null;
  headline: string | null;
  columnRichtextHtml: string | null;
  imageComponent: CraftAsset[];
};

type RichtextEntry = {
  id: string;
  title: string | null;
  richtextHtml: string | null;
};

type NavigationLinkEntry = {
  id: string;
  title: string;
  uri: string | null;
  slug: string | null;
};

type ImageComponentEntry = {
  id: string;
  title: string | null;
  images: CraftAsset[];
};

type SectionRowSpacing = {
  paddingTop: string | null;
  paddingBottom: string | null;
  marginTop: string | null;
  marginBottom: string | null;
};

type ContentBlock =
  | {
      id: string;
      blockType: 'heroComponent_ContentBlock';
      heroBlock: HeroComponentBlock;
    }
  | {
      id: string;
      blockType: 'columnComponent';
      sectionEntries: SectionContainerEntry[];
      /** CMS plain text, e.g. `6-6`, `4-8` — 12-column units per column. */
      columnSpan?: string | null;
      sectionSpacing?: SectionRowSpacing | null;
    }
  | {
      id: string;
      blockType: 'richtext_Entry';
      richtextEntry: RichtextEntry;
    }
  | {
      id: string;
      blockType: 'navigationLink_Entry';
      navigationLinkEntry: NavigationLinkEntry;
    }
  | {
      id: string;
      blockType: 'imageComponent_Entry';
      imageEntry: ImageComponentEntry;
    };

type ContentSectionGroup = {
  id: string;
  paddingTop: string | null;
  paddingBottom: string | null;
  marginTop: string | null;
  marginBottom: string | null;
  contentBlocks: ContentBlock[];
};

type RenderRow = {
  key: string;
  /** `section__container-inner` + spacing modifiers; `null` when using flat layout wrapper. */
  sectionContainerClasses: string[] | null;
  flatWrapperStyle: Record<string, string> | null;
  blocks: ContentBlock[];
};

const props = defineProps<{
  contentBlocks: ContentBlock[];
  contentSections?: ContentSectionGroup[] | null;
}>();

const renderRows = computed<RenderRow[]>(() => {
  const sections = props.contentSections;
  if (sections && sections.length > 0) {
    return sections.map((section) => {
      const spacingFields: CraftSectionSpacingFields = {
        paddingTop: section.paddingTop,
        paddingBottom: section.paddingBottom,
        marginTop: section.marginTop,
        marginBottom: section.marginBottom,
      };
      return {
        key: section.id,
        sectionContainerClasses:
          craftSectionSpacingToClassList(spacingFields),
        flatWrapperStyle: null,
        blocks: section.contentBlocks,
      };
    });
  }
  return [
    {
      key: 'page-body',
      sectionContainerClasses: null,
      flatWrapperStyle: {display: 'contents'},
      blocks: props.contentBlocks,
    },
  ];
});
</script>

<template>
  <template v-for="row in renderRows" :key="row.key">
    <div
      :class="row.sectionContainerClasses ?? undefined"
      :style="row.flatWrapperStyle ?? undefined"
    >
      <template v-for="contentBlock in row.blocks" :key="contentBlock.id">
        <CraftHeroComponent
          v-if="contentBlock.blockType === 'heroComponent_ContentBlock'"
          :blocks="[contentBlock.heroBlock]"
        />
        <CraftSectionContainer
          v-else-if="contentBlock.blockType === 'columnComponent'"
          :entries="contentBlock.sectionEntries"
          :column-span="contentBlock.columnSpan ?? undefined"
          :margin-top="contentBlock.sectionSpacing?.marginTop ?? undefined"
          :margin-bottom="contentBlock.sectionSpacing?.marginBottom ?? undefined"
          :padding-top="contentBlock.sectionSpacing?.paddingTop ?? undefined"
          :padding-bottom="contentBlock.sectionSpacing?.paddingBottom ?? undefined"
        />
        <CraftRichtextEntry
          v-else-if="contentBlock.blockType === 'richtext_Entry'"
          :entry="contentBlock.richtextEntry"
        />
        <CraftNavigationLinkEntry
          v-else-if="contentBlock.blockType === 'navigationLink_Entry'"
          :entry="contentBlock.navigationLinkEntry"
        />
        <CraftImageComponentEntry
          v-else-if="contentBlock.blockType === 'imageComponent_Entry'"
          :entry="contentBlock.imageEntry"
        />
      </template>
    </div>
  </template>
</template>
