import type { ComputedRef, MaybeRef, Ref } from "vue";
import { computed, ref, unref } from "vue";

/** Matches $bp-mobile in _variables.scss (768px). Above this = grid widths; below = 100% width. */
const MOBILE_BREAKPOINT_PX = 768;

const SECTION_GRID_UNITS = 12;

let isAboveMobileRef: Ref<boolean> | null = null;

function getIsAboveMobileRef() {
  if (isAboveMobileRef === null) {
    isAboveMobileRef = ref(false);
    if (typeof window !== "undefined") {
      const mql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT_PX + 1}px)`);
      isAboveMobileRef.value = mql.matches;
      mql.addEventListener("change", (e) => {
        isAboveMobileRef!.value = e.matches;
      });
    }
  }
  return isAboveMobileRef;
}

/**
 * Shared grid item width from colspan for both Section (read-only preview) and
 * ThemeRollerSection (theme roller preview). Expects parent to set:
 * - --section-col-gap
 * - --total-grid-items (only used when sectionColumns is not passed, for gap count fallback)
 * Below mobile breakpoint (768px) OR when section has only one column: items get 100% width.
 * minWidth: 0 allows the flex item to shrink so container right padding is respected when scaling.
 * At and above mobile with 2+ columns: colspan-based calc. Gap count uses section column count
 * so each row's items fill the row (e.g. 3 columns → 2 gaps, not total-items - 1).
 */
export function useSectionGridItemStyle(
  colspan: MaybeRef<number>,
  sectionColumns?: MaybeRef<number | undefined>,
): ComputedRef<Record<string, string>> {
  const isAboveMobile = getIsAboveMobileRef();
  return computed(() => {
    const above = isAboveMobile.value;
    const c = unref(colspan);
    const cols = sectionColumns !== undefined ? unref(sectionColumns) : undefined;
    const singleColumn = cols === 1;
    const useFullWidth = !above || singleColumn;
    if (useFullWidth) {
      return {
        width: "100% !important",
        minWidth: "0 !important",
        maxWidth: "100% !important",
        flex: "0 0 auto !important",
        overflow: "hidden",
      };
    }
    const gapCount =
      cols !== undefined && cols >= 1
        ? cols - 1
        : "(var(--total-grid-items, 1) - 1)";
    const width = `calc((100% - ${gapCount} * var(--section-col-gap)) * ${c} / ${SECTION_GRID_UNITS})`;
    return {
      width: `${width} !important`,
      minWidth: `${width} !important`,
      maxWidth: `${width} !important`,
      flex: "0 0 auto !important",
      overflow: "visible",
    };
  });
}
