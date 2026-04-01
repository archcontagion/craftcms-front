<script setup lang="ts">
import { useSpacers } from "~/composables/useSpacers";

const props = withDefaults(
  defineProps<{
    title: string;
    titleTag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    styleTag: "none" | "display" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    marginTop?: string;
    marginBottom?: string;
  }>(),
  {
    styleTag: "none",
    marginTop: "spacer-none",
    marginBottom: "spacer-none",
  },
);

const { getSpacerTop, getSpacerBottom } = useSpacers();

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

const headlineClass = computed(() => {
  const top = getSpacerTop(toSpacerSize(props.marginTop));
  const bottom = getSpacerBottom(toSpacerSize(props.marginBottom));
  const styleClass = props.styleTag === "none" ? "" : props.styleTag;
  return ["headline", styleClass, top, bottom].filter(Boolean).join(" ");
});
</script>

<template>
  <component :is="titleTag" :class="headlineClass">
    {{ title }}
  </component>
</template>
