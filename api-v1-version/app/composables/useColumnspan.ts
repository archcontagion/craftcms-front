/**
 * Parses a hyphen-separated column span string (e.g. `6-6`, `7-5`, `4-4-4`) into
 * per-column grid units (1–12). Falls back to an even split when missing or invalid.
 */
export function parseColumnSpanUnits(
  columnSpan: string | null,
  columnCount: number,
): (number | null)[] {
  if (columnCount < 1) {
    return [];
  }

  const equalSplit = (): number[] => {
    const base = Math.floor(12 / columnCount);
    const remainder = 12 - base * columnCount;
    return Array.from({length: columnCount}, (_, index) =>
      index < remainder ? base + 1 : base,
    );
  };

  if (!columnSpan || !columnSpan.trim()) {
    return equalSplit();
  }

  const parts = columnSpan
    .split('-')
    .map((segment) => parseInt(segment.trim(), 10))
    .filter((value) => !Number.isNaN(value) && value >= 1 && value <= 12);

  if (parts.length !== columnCount) {
    return equalSplit();
  }

  const sum = parts.reduce((accumulator, value) => accumulator + value, 0);
  if (sum !== 12) {
    return equalSplit();
  }

  return parts;
}
