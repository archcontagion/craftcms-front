<script setup lang="ts">
/**
 * Section block: opens AppModal. Body is an ordered list of components (`innerBlocks` from settings).
 */
import type { ModalInnerBlockItem } from "~/types/project";
import Modal from "~/components/Modal.vue";
import Headline from "~/components/Headline.vue";
import Button from "~/components/Button.vue";
import Image from "~/components/Image.vue";
import Richtext from "~/components/Richtext.vue";
import Slider from "~/components/Slider.vue";
import Hero from "~/components/Hero.vue";
import Graph from "~/components/Graph.vue";
import { getBlockContent } from "~/utils/sectionBlockContent";
import { innerItemAsSectionBlock } from "~/utils/modalInnerBlocks";

const props = withDefaults(
  defineProps<{
    triggerLabel: string;
    title?: string;
    ariaLabel?: string;
    innerBlocks: ModalInnerBlockItem[];
    triggerType?: "primary" | "secondary" | "tertiary";
    triggerSize?: "small" | "medium" | "large";
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    showCloseButton?: boolean;
    layoutBlockId?: string;
    editorMode?: boolean;
    modalParentSectionId?: string;
  }>(),
  {
    triggerType: "primary",
    triggerSize: "medium",
    closeOnBackdrop: true,
    closeOnEscape: true,
    showCloseButton: true,
    editorMode: false,
  },
);

const open = ref(false);
const projectStore = useProjectStore();

const triggerClass = computed(
  () => `btn btn-${props.triggerType} btn-${props.triggerSize}`,
);

const innerWithContent = computed(() =>
  props.innerBlocks
    .map((item) => {
      const content = getBlockContent(innerItemAsSectionBlock(item));
      return content ? { item, content } : null;
    })
    .filter(
      (
        row,
      ): row is {
        item: ModalInnerBlockItem;
        content: NonNullable<ReturnType<typeof getBlockContent>>;
      } => row !== null,
    ),
);

function selectInner(itemId: string) {
  if (
    !props.editorMode ||
    !props.layoutBlockId ||
    !props.modalParentSectionId
  )
    return;
  projectStore.setSelectedElement({
    type: "modalBodyBlock",
    sectionId: props.modalParentSectionId,
    modalBlockId: props.layoutBlockId,
    blockId: itemId,
  });
}
</script>

<template>
  <div class="modal-block btn-wrapper">
    <button type="button" :class="triggerClass" @click="open = true">
      {{ triggerLabel }}
    </button>
    <Modal
      v-model="open"
      :title="title"
      :aria-label="ariaLabel"
      :close-on-backdrop="closeOnBackdrop"
      :close-on-escape="closeOnEscape"
      :show-close-button="showCloseButton"
    >
      <div>
        <template v-if="innerWithContent.length === 0 && editorMode">
          <p>Add inner blocks in the modal settings panel.</p>
        </template>
        <template
          v-for="{ item, content } in innerWithContent"
          :key="item.id"
        >
          <div
            v-show="!item.hidden"
            :id="`block-${item.id}`"
            role="presentation"
            @click.stop="selectInner(item.id)"
          >
            <Headline
              v-if="content.type === 'headline'"
              v-bind="content.props"
            />
            <Button
              v-else-if="content.type === 'button'"
              v-bind="content.props"
            >
              Button
            </Button>
            <Image
              v-else-if="content.type === 'image'"
              v-bind="content.props"
            />
            <Richtext
              v-else-if="content.type === 'richtext'"
              v-bind="content.props"
            />
            <Slider
              v-else-if="content.type === 'slider'"
              v-bind="content.props"
            />
            <Hero
              v-else-if="content.type === 'hero'"
              v-bind="content.props"
            />
            <Graph
              v-else-if="content.type === 'graph'"
              v-bind="content.props"
            />
          </div>
        </template>
      </div>
    </Modal>
  </div>
</template>
