<script setup lang="ts">
/**
 * Dialog shell: default slot is the main body; optional header / footer slots.
 * Use v-model to open/close. Content can be any components (e.g. Headline, forms).
 */
import { IconX } from "@tabler/icons-vue";

defineOptions({ name: "AppModal" });

/** Runtime props (no TS generics) so ESLint’s Vue script parser accepts the file. */
const open = defineModel({ type: Boolean, default: false });

const props = defineProps({
  title: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
  closeOnBackdrop: { type: Boolean, default: true },
  closeOnEscape: { type: Boolean, default: true },
  showCloseButton: { type: Boolean, default: true },
});

const slots = useSlots();
const modalHeadingId = useId();

const showHeader = computed(
  () => Boolean(props.title) || Boolean(slots.header),
);

const dialogAriaLabelledby = computed(() => {
  return showHeader.value ? modalHeadingId : undefined;
});

const dialogAriaLabel = computed(() => {
  if (showHeader.value) return undefined;
  return props.ariaLabel;
});

function close() {
  open.value = false;
}

function onBackdropPointerDown(event: PointerEvent) {
  if (props.closeOnBackdrop && event.target === event.currentTarget) close();
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (!open.value || !props.closeOnEscape) return;
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    close();
  }
}

watch(
  open,
  (isOpen) => {
    if (!import.meta.client) return;
    if (isOpen) {
      document.addEventListener("keydown", onDocumentKeydown, true);
      const prev = document.body.style.overflow;
      document.body.dataset.modalPrevOverflow = prev;
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("keydown", onDocumentKeydown, true);
      const prev = document.body.dataset.modalPrevOverflow ?? "";
      document.body.style.overflow = prev;
      delete document.body.dataset.modalPrevOverflow;
    }
  },
  { flush: "post" },
);

onUnmounted(() => {
  if (!import.meta.client) return;
  document.removeEventListener("keydown", onDocumentKeydown, true);
  if (document.body.dataset.modalPrevOverflow !== undefined) {
    document.body.style.overflow =
      document.body.dataset.modalPrevOverflow ?? "";
    delete document.body.dataset.modalPrevOverflow;
  }
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal-backdrop"
      role="presentation"
      @pointerdown="onBackdropPointerDown"
    >
      <div
        class="modal-panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="dialogAriaLabelledby"
        :aria-label="dialogAriaLabel"
        @pointerdown.stop
      >
        <button
          v-if="showCloseButton"
          type="button"
          class="modal-close"
          aria-label="Close dialog"
          @click="close"
        >
          <IconX :size="20" aria-hidden="true" />
        </button>

        <header v-if="showHeader" :id="modalHeadingId" class="modal-header">
          <slot name="header">
            <h2 class="modal-title">{{ title }}</h2>
          </slot>
        </header>

        <div class="modal-body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="modal-footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>
