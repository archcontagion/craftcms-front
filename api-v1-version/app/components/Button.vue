<script setup lang="ts">
const props = defineProps<{
  type: 'primary' | 'secondary' | 'tertiary';
  size: 'small' | 'medium' | 'large';
  /** When set, renders an `<a>` for navigation instead of `<button>`. */
  href?: string | null;
  /** Passed to `<a>` (e.g. `_blank`). */
  target?: string | null;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}>();

const buttonClass = computed(() => {
  return `btn btn-${props.type} btn-${props.size}`;
});

const isLink = computed(() => Boolean(props.href?.trim()));

const anchorRel = computed(() =>
  props.target === '_blank' ? 'noopener noreferrer' : undefined,
);

function onAnchorClick(event: MouseEvent) {
  if (props.disabled || props.loading) {
    event.preventDefault();
  }
}
</script>

<template>
  <div class="btn-wrapper">
    <a
      v-if="isLink"
      :href="href ?? undefined"
      :target="target ?? undefined"
      :rel="anchorRel"
      :class="buttonClass"
      :aria-disabled="disabled || loading"
      :aria-busy="loading"
      @click="onAnchorClick"
    >
      <slot />
    </a>
    <button
      v-else
      :class="buttonClass"
      :disabled="disabled || loading"
      :aria-busy="loading"
      @click="onClick"
    >
      <slot />
    </button>
  </div>
</template>
