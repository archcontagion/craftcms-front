import type {SectionSpacingFields, SpacerSize} from '~~/types';

export type {SectionSpacingFields, SpacerSize};

/**
 * Spacer size tokens used for consistent vertical spacing (top/bottom).
 * Maps to responsive utility classes (e.g. mt-s, mt-lg-m).
 */
export const spacer_top_classes: Record<SpacerSize, string> = {
  0: "mt-none",
  xxs: "mt-xxs",
  xs: "mt-xs",
  s: "mt-s",
  m: "mt-s mt-lg-m",
  l: "mt-m mt-lg-l",
  xl: "mt-l mt-lg-xl",
  xxl: "mt-xxl mt-lg-xxl",
  "": "mt-none",
};

export const spacer_bottom_classes: Record<SpacerSize, string> = {
  0: "mb-none",
  xxs: "mb-xxs",
  xs: "mb-xs",
  s: "mb-s",
  m: "mb-s mb-lg-m",
  l: "mb-m mb-lg-l",
  xl: "mb-l mb-lg-xl",
  xxl: "mb-xxl mb-lg-xxl",
  "": "mb-none",
};

export const padding_top_classes: Record<SpacerSize, string> = {
  0: "pt-none",
  xxs: "pt-xxs",
  xs: "pt-xs",
  s: "pt-s",
  m: "pt-s pt-lg-m",
  l: "pt-m pt-lg-l",
  xl: "pt-l pt-lg-xl",
  xxl: "pt-xxl pt-lg-xxl",
  "": "pt-none",
};

export const padding_bottom_classes: Record<SpacerSize, string> = {
  0: "pb-none",
  xxs: "pb-xxs",
  xs: "pb-xs",
  s: "pb-s",
  m: "pb-s pb-lg-m",
  l: "pb-m pb-lg-l",
  xl: "pb-l pb-lg-xl",
  xxl: "pb-xxl pb-lg-xxl",
  "": "pb-none",
};

/**
 * Maps CMS dropdown tokens (`sm`, `md`, `lg`) to internal spacer keys (`s`, `m`, `l`).
 * Aligns with `SectionContainer` prop tokens and REST payloads.
 */
export function spacingTokenToUseSpacersSize(
  value: string | null | undefined,
): string {
  if (!value) {
    return "";
  }
  const key = value.replace(/^spacer-/, "").trim();
  const tokenAliasMap: Record<string, string> = {
    none: "0",
    xxs: "xxs",
    xs: "xs",
    sm: "s",
    md: "m",
    lg: "l",
    xl: "xl",
    xxl: "xxl",
  };
  return tokenAliasMap[key] ?? key;
}

/**
 * Composable for mapping spacer values to CSS utility classes.
 *
 * **Usage:** Call from components that need top/bottom spacing. In this project,
 * spacing is applied by `app/storyblok/StoryblokWrapper.vue`, which uses
 * `useSpacers()` and reads `blok.spacing_top` / `blok.spacing_bottom`. Any
 * Storyblok component that should have configurable spacing must be rendered
 * inside `StoryblokWrapper` (as the wrapper’s root or by wrapping the
 * component’s content with it).
 *
 * @returns `getPaddingTop(value)` and `getPaddingBottom(value)` — return
 *   class strings for the given SpacerSize (e.g. "mt-s mt-lg-m").
 */
export function useSpacers() {
  const getPaddingTop = (value: string | number | undefined) => {
    const paddingValue = Array.isArray(value) ? value[0] : value;
    return (
      padding_top_classes[paddingValue as SpacerSize] || padding_top_classes[""]
    );
  };

  const getPaddingBottom = (value: string | number | undefined) => {
    const paddingValue = Array.isArray(value) ? value[0] : value;
    return (
      padding_bottom_classes[paddingValue as SpacerSize] ||
      padding_bottom_classes[""]
    );
  };

  const getSpacerTop = (value: string | number | undefined) => {
    const paddingValue = Array.isArray(value) ? value[0] : value;
    return (
      spacer_top_classes[paddingValue as SpacerSize] || spacer_top_classes[""]
    );
  };

  const getSpacerBottom = (value: string | number | undefined) => {
    const paddingValue = Array.isArray(value) ? value[0] : value;

    return (
      spacer_bottom_classes[paddingValue as SpacerSize] ||
      spacer_bottom_classes[""]
    );
  };

  const getSectionSpacingClassList = (
    fields: SectionSpacingFields,
  ): string[] => {
    const marginTop = spacingTokenToUseSpacersSize(fields.marginTop);
    const marginBottom = spacingTokenToUseSpacersSize(fields.marginBottom);
    const paddingTop = spacingTokenToUseSpacersSize(fields.paddingTop);
    const paddingBottom = spacingTokenToUseSpacersSize(
      fields.paddingBottom,
    );
    return [
      getSpacerTop(marginTop),
      getSpacerBottom(marginBottom),
      getPaddingTop(paddingTop),
      getPaddingBottom(paddingBottom),
    ].filter(Boolean);
  };

  return {
    getSpacerTop,
    getSpacerBottom,
    getPaddingTop,
    getPaddingBottom,
    getSectionSpacingClassList,
  };
}
