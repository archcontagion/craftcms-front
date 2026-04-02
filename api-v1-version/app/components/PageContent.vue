<script setup lang="ts">
import {computed} from 'vue';
import HeroComponent from '~/components/HeroComponent.vue';
import SectionContainer from '~/components/SectionContainer.vue';
import RichtextEntry from '~/components/RichtextEntry.vue';
import ImageComponentEntry from '~/components/ImageComponentEntry.vue';
import NavigationLinkEntry from '~/components/NavigationLinkEntry.vue';
import Headline from '~/components/Headline.vue';
import Richtext from '~/components/Richtext.vue';
import {mapRawBlockToView} from '~/utils/map-page-block';
import {useSpacers} from '~/composables/useSpacers';
import {asRecord, stringOrNull} from '~/utils/block-mapping-helpers';
import type {
  PageBlockView,
  PageSectionView,
  SectionSpacingFields,
} from '~~/types';

const props = defineProps<{
  entry: unknown;
}>();

const {getSectionSpacingClassList} = useSpacers();

function spacingFromSectionFields(
  sectionFields: Record<string, unknown> | null,
): SectionSpacingFields {
  if (!sectionFields) {
    return {
      paddingTop: null,
      paddingBottom: null,
      marginTop: null,
      marginBottom: null,
    };
  }
  return {
    paddingTop: stringOrNull(sectionFields.paddingTop),
    paddingBottom: stringOrNull(sectionFields.paddingBottom),
    marginTop: stringOrNull(sectionFields.marginTop),
    marginBottom: stringOrNull(sectionFields.marginBottom),
  };
}

const pageSections = computed((): PageSectionView[] => {
  const root = asRecord(props.entry);
  const fields = root ? asRecord(root.fields) : null;
  const rawSections = fields?.sections;
  if (!Array.isArray(rawSections)) {
    return [];
  }

  return rawSections.map((section, sectionIndex) => {
    const sectionRec = asRecord(section);
    const sectionFields = sectionRec ? asRecord(sectionRec.fields) : null;
    const bodyRaw = sectionFields?.bodyContent;
    const rawBlocks = Array.isArray(bodyRaw) ? bodyRaw : [];
    const spacing = spacingFromSectionFields(sectionFields);
    const wrapperClasses = getSectionSpacingClassList(spacing);
    const sectionKey =
      sectionRec && sectionRec.id != null
        ? String(sectionRec.id)
        : `section-${String(sectionIndex)}`;

    const blocks: PageBlockView[] = [];
    for (let blockIndex = 0; blockIndex < rawBlocks.length; blockIndex++) {
      const mapped = mapRawBlockToView(rawBlocks[blockIndex], blockIndex);
      if (mapped) {
        blocks.push(mapped);
      }
    }

    return {
      key: sectionKey,
      wrapperClasses,
      blocks,
    };
  });
});
</script>

<template>
  <div class="page-content">
    <template v-for="section in pageSections" :key="section.key">
      <div
        :class="
          section.wrapperClasses.length > 0 ? section.wrapperClasses : undefined
        "
      >
        <template v-for="item in section.blocks" :key="item.key">
          <HeroComponent v-if="item.kind === 'hero'" :blocks="item.blocks" />
          <section
            v-else-if="item.kind === 'headline'"
            class="section section-no-bg-color"
          >
            <div class="container section__container">
              <div class="section__container-inner">
                <div
                  class="section-element"
                  :id="`body-headline-${item.headline.blockId}`"
                >
                  <Headline
                    :title="item.headline.title"
                    :title-tag="item.headline.titleTag"
                    :style-tag="item.headline.styleTag"
                  />
                </div>
              </div>
            </div>
          </section>
          <RichtextEntry
            v-else-if="item.kind === 'richtext'"
            :entry="item.entry"
          />
          <SectionContainer
            v-else-if="item.kind === 'columns'"
            :entries="item.entries"
            :column-span="item.columnSpan ?? undefined"
          />
          <ImageComponentEntry
            v-else-if="item.kind === 'image'"
            :entry="item.entry"
          />
          <NavigationLinkEntry
            v-else-if="item.kind === 'navigationLink'"
            :entry="item.entry"
          />
          <section
            v-else-if="item.kind === 'richtextComponent'"
            class="section section-no-bg-color"
          >
            <div class="container section__container">
              <div class="section__container-inner">
                <div class="section-element">
                  <Richtext :content="item.html" />
                </div>
              </div>
            </div>
          </section>
        </template>
      </div>
    </template>
  </div>
</template>
