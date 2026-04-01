const GRID_UNITS = 12;

/**
 * Replaces unicode hyphen/dash/minus with ASCII `-`. Editors often insert U+2011
 * (non-breaking hyphen) so `4‑8` does not match `/[-–—]+/` and would otherwise
 * parse as a single segment and trigger the equal split fallback.
 */
function normalizeColumnSpanDashCharacters(input: string): string {
  return input.replace(
    /[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g,
    '-',
  );
}

/**
 * Parses Craft plain text like `6-6`, `4-8`, `4-4-4` into per-column grid units.
 * When invalid, empty, or count/sum mismatch, returns an equal split across `columnCount`.
 */
export function parseCraftColumnSpanUnits(
  raw: string | null | undefined,
  columnCount: number,
): number[] {
  if (columnCount < 1) {
    return [];
  }

  const equalSplit = (): number[] => {
    if (columnCount <= 0) {
      return [];
    }
    const base = Math.floor(GRID_UNITS / columnCount);
    const remainder = GRID_UNITS - base * columnCount;
    return Array.from({length: columnCount}, (unused, columnIndex) => {
      return base + (columnIndex < remainder ? 1 : 0);
    });
  };

  if (typeof raw !== 'string') {
    return equalSplit();
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return equalSplit();
  }

  const withAsciiDashes = normalizeColumnSpanDashCharacters(trimmed);
  const segments = withAsciiDashes
    .split(/[-]+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  const units = segments
    .map((segment) => parseInt(segment, 10))
    .filter(
      (value) =>
        !Number.isNaN(value) && Number.isFinite(value) && value >= 1 && value <= GRID_UNITS,
    );

  if (units.length !== columnCount) {
    return equalSplit();
  }

  const sum = units.reduce((accumulator, value) => accumulator + value, 0);
  if (sum !== GRID_UNITS) {
    return equalSplit();
  }

  return units;
}
