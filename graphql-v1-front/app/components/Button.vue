<script setup lang="ts">
const props = defineProps<{
  type: 'primary' | 'secondary' | 'tertiary';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}>();

const buttonClass = computed(() => {
  return `btn btn-${props.type} btn-${props.size}`;
});
</script>

<template>
  <div class="btn-wrapper">
    <button
      :class="buttonClass"
      :disabled="disabled"
      :loading="loading"
      @click="onClick"
    >
      <slot />
    </button>
  </div>
</template>
