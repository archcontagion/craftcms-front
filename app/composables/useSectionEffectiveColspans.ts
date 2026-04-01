import type { ComputedRef, Ref } from "vue";
import type { SectionBlock, SectionProps } from "~/types/project";
import { SECTION_GRID_UNITS } from "~/types/project";

/**
 * Section element blocks in row order (by columnIndex, then by array index).
 */
function getSectionElementBlocksInOrder(section: SectionProps): SectionBlock[] {
  const blocks = section.blocks ?? [];
  return blocks
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => b.type === "sectionElement")
    .sort((a, b) => a.b.columnIndex - b.b.columnIndex || a.i - b.i)
    .map(({ b }) => b);
}

/**
 * Raw colspan: 0 or undefined = auto, 1-12 = explicit.
 */
function rawColspan(b: SectionBlock): number | undefined {
  const v = b.colspan ?? b.columnSpan;
  if (v === undefined) return undefined;
  if (v >= 1 && v <= SECTION_GRID_UNITS) return v;
  return undefined; // treat out-of-range as auto
}

/**
 * Compute effective colspans for all section element blocks in a section.
 * - 0 or undefined = auto: each gets one column slot = SECTION_GRID_UNITS / section.columns (so section.columns elements fit per row).
 * - 1-12 = explicit, used as-is.
 */
export function computeEffectiveColspans(section: SectionProps): {
  effectiveColspanByBlockId: Record<string, number>;
  sectionColumnCount: number;
} {
  const sectionElements = getSectionElementBlocksInOrder(section);
  const result: Record<string, number> = {};
  if (sectionElements.length === 0) {
    return { effectiveColspanByBlockId: result, sectionColumnCount: 1 };
  }

  const cols = Math.max(1, section.columns ?? 1);
  const slotSize = Math.max(1, Math.floor(SECTION_GRID_UNITS / cols));

  const rawList = sectionElements.map((b) => rawColspan(b));

  sectionElements.forEach((b, i) => {
    const raw = rawList[i];
    if (raw != null && raw >= 1 && raw <= SECTION_GRID_UNITS) {
      result[b.id] = raw;
    } else {
      result[b.id] = slotSize;
    }
  });

  /** Number of column slots to render: one per group so all groups align in one row; no empty drop slots between. */
  const sectionColumnCount =
    sectionElements.length === 0 ? 1 : sectionElements.length;

  return { effectiveColspanByBlockId: result, sectionColumnCount };
}

/**
 * Composable: effective colspans and section column count for a section.
 * Pass a ref or computed so updates are reactive.
 */
export function useSectionEffectiveColspans(
  section: Ref<SectionProps> | ComputedRef<SectionProps>
) {
  return computed(() => computeEffectiveColspans(section.value));
}
