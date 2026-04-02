<script setup lang="ts">
/**
 * SVG chart: single line, lines+dots (multi-series), dots-only, vertical/horizontal columns.
 */
import type { GraphDisplayMode, GraphSeries } from "~/types/project";

const props = defineProps<{
  displayMode: GraphDisplayMode;
  series: GraphSeries[];
}>();

const W = 400;
const H = 220;
const padL = 48;
const padR = 20;
const padT = 16;
const padB = 36;

const plotW = W - padL - padR;
const plotH = H - padT - padB;

const SERIES_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#9333ea",
  "#ea580c",
  "#0891b2",
];

function parseX(x: string): number | null {
  const n = Number(String(x).trim());
  return Number.isFinite(n) ? n : null;
}

/** Series used for rendering (first only in `line` mode). */
const activeSeries = computed(() => {
  const s = props.series;
  if (props.displayMode === "line") return s.slice(0, 1);
  return s;
});

const ariaLabel = computed(() => {
  const n = activeSeries.value.length;
  const mode =
    props.displayMode === "lines" ? "lines and dots" : props.displayMode;
  return `Graph, ${n} series, ${mode} display`;
});

/** Collect x keys in first-seen order from active series. */
function categoricalKeys(seriesList: GraphSeries[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const ser of seriesList) {
    for (const p of ser.points) {
      const k = String(p.x);
      if (!seen.has(k)) {
        seen.add(k);
        order.push(k);
      }
    }
  }
  return order;
}

const scaleInfo = computed(() => {
  const list = activeSeries.value;
  const allY: number[] = [];
  for (const ser of list) {
    for (const p of ser.points) {
      const y = Number(p.y);
      if (Number.isFinite(y)) allY.push(y);
    }
  }
  if (allY.length === 0) allY.push(0, 1);

  let minY = Math.min(...allY);
  let maxY = Math.max(...allY);
  if (minY === maxY) {
    minY -= 1;
    maxY += 1;
  }
  const yPad = (maxY - minY) * 0.08;
  minY -= yPad;
  maxY += yPad;

  const isBar =
    props.displayMode === "columnsVertical" ||
    props.displayMode === "columnsHorizontal";

  let numericX = true;
  for (const ser of list) {
    for (const p of ser.points) {
      if (parseX(p.x) === null) {
        numericX = false;
        break;
      }
    }
    if (!numericX) break;
  }

  if (isBar) numericX = false;

  if (numericX) {
    const xs: number[] = [];
    for (const ser of list) {
      for (const p of ser.points) {
        const nx = parseX(p.x);
        if (nx !== null) xs.push(nx);
      }
    }
    let minX = Math.min(...xs);
    let maxX = Math.max(...xs);
    if (minX === maxX) {
      minX -= 1;
      maxX += 1;
    }
    const xPad = (maxX - minX) * 0.08;
    minX -= xPad;
    maxX += xPad;
    return {
      numericX: true as const,
      minX,
      maxX,
      minY,
      maxY,
      categories: [] as string[],
    };
  }

  const categories = categoricalKeys(list);
  if (categories.length === 0) categories.push("");

  return {
    numericX: false as const,
    minX: 0,
    maxX: categories.length,
    minY,
    maxY,
    categories,
  };
});

function xToPx(xVal: number, catKey?: string): number {
  const s = scaleInfo.value;
  if (s.numericX) {
    const t = (xVal - s.minX) / (s.maxX - s.minX);
    return padL + t * plotW;
  }
  const i = Math.max(0, s.categories.indexOf(catKey ?? String(xVal)));
  const n = Math.max(1, s.categories.length);
  return padL + ((i + 0.5) / n) * plotW;
}

function yToPx(yVal: number): number {
  const s = scaleInfo.value;
  const t = (yVal - s.minY) / (s.maxY - s.minY);
  return padT + (1 - t) * plotH;
}

function sortedPoints(
  ser: GraphSeries,
): { x: string; y: number; xNum: number | null }[] {
  const s = scaleInfo.value;
  const pts = ser.points.map((p) => ({
    x: String(p.x),
    y: Number(p.y),
    xNum: parseX(p.x),
  }));
  if (s.numericX) {
    return [...pts].sort((a, b) => (a.xNum ?? 0) - (b.xNum ?? 0));
  }
  const order = new Map(s.categories.map((c, i) => [c, i]));
  return [...pts].sort((a, b) => (order.get(a.x) ?? 0) - (order.get(b.x) ?? 0));
}

const linePaths = computed(() => {
  if (
    props.displayMode !== "line" &&
    props.displayMode !== "lines" &&
    props.displayMode !== "dots"
  )
    return [];
  const s = scaleInfo.value;
  return activeSeries.value.map((ser, si) => {
    const pts = sortedPoints(ser).filter((p) => Number.isFinite(p.y));
    const d = pts
      .map((p) => {
        const px = s.numericX ? xToPx(p.xNum ?? 0) : xToPx(0, p.x);
        const py = yToPx(p.y);
        return `${px},${py}`;
      })
      .join(" ");
    return { si, d, pts, color: SERIES_COLORS[si % SERIES_COLORS.length] };
  });
});

const verticalBars = computed(() => {
  if (props.displayMode !== "columnsVertical") return [];
  const s = scaleInfo.value;
  const nCat = s.categories.length;
  const nSer = activeSeries.value.length;
  if (nCat === 0 || nSer === 0) return [];

  const slotW = plotW / nCat;
  const groupW = slotW * 0.72;
  const barW = groupW / nSer;
  const baseY = yToPx(s.minY);

  const out: {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
  }[] = [];

  for (let ci = 0; ci < nCat; ci++) {
    const cat = s.categories[ci]!;
    const slotLeft = padL + ci * slotW;
    const center = slotLeft + slotW / 2;
    const groupLeft = center - groupW / 2;
    for (let j = 0; j < nSer; j++) {
      const ser = activeSeries.value[j]!;
      const pt = ser.points.find((p) => String(p.x) === cat);
      const yv = pt ? Number(pt.y) : 0;
      if (!Number.isFinite(yv)) continue;
      const topY = yToPx(yv);
      const h = Math.max(0, baseY - topY);
      const x = groupLeft + j * barW + barW * 0.06;
      const w = barW * 0.88;
      out.push({
        x,
        y: topY,
        w,
        h,
        color: SERIES_COLORS[j % SERIES_COLORS.length]!,
      });
    }
  }
  return out;
});

const horizontalBars = computed(() => {
  if (props.displayMode !== "columnsHorizontal") return [];
  const s = scaleInfo.value;
  const nCat = s.categories.length;
  const nSer = activeSeries.value.length;
  if (nCat === 0 || nSer === 0) return [];

  const slotH = plotH / nCat;
  const groupH = slotH * 0.72;
  const barH = groupH / nSer;
  const x0 = padL;
  const denom = s.maxY - s.minY || 1;

  const out: {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
  }[] = [];

  for (let ci = 0; ci < nCat; ci++) {
    const cat = s.categories[ci]!;
    const slotTop = padT + ci * slotH;
    const center = slotTop + slotH / 2;
    const groupTop = center - groupH / 2;
    for (let j = 0; j < nSer; j++) {
      const ser = activeSeries.value[j]!;
      const pt = ser.points.find((p) => String(p.x) === cat);
      const xv = pt ? Number(pt.y) : 0;
      if (!Number.isFinite(xv)) continue;
      const w = Math.max(0, ((xv - s.minY) / denom) * plotW);
      const y = groupTop + j * barH + barH * 0.06;
      const h = barH * 0.88;
      out.push({
        x: x0,
        y,
        w,
        h,
        color: SERIES_COLORS[j % SERIES_COLORS.length]!,
      });
    }
  }
  return out;
});

/** Bottom axis: numeric value ticks (horizontal bar mode). */
const valueTicksBottom = computed(() => {
  if (props.displayMode !== "columnsHorizontal") return [];
  const s = scaleInfo.value;
  const ticks = 5;
  const denom = s.maxY - s.minY || 1;
  const out: { px: number; label: string }[] = [];
  for (let i = 0; i <= ticks; i++) {
    const t = i / ticks;
    const v = s.minY + t * (s.maxY - s.minY);
    out.push({
      px: padL + ((v - s.minY) / denom) * plotW,
      label: v.toFixed(1),
    });
  }
  return out;
});

/** Left axis: category labels (horizontal bar mode). */
const categoryTicksLeft = computed(() => {
  if (props.displayMode !== "columnsHorizontal") return [];
  const s = scaleInfo.value;
  const n = Math.max(1, s.categories.length);
  const slotH = plotH / n;
  return s.categories.map((c, i) => ({
    py: padT + (i + 0.5) * slotH,
    label: c.length > 10 ? `${c.slice(0, 9)}…` : c,
  }));
});

const xAxisTicks = computed(() => {
  const s = scaleInfo.value;
  if (s.numericX) {
    const ticks = 5;
    const out: { px: number; label: string }[] = [];
    for (let i = 0; i <= ticks; i++) {
      const t = i / ticks;
      const v = s.minX + t * (s.maxX - s.minX);
      out.push({ px: xToPx(v), label: v.toFixed(1) });
    }
    return out;
  }
  return s.categories.map((c, i) => ({
    px: padL + ((i + 0.5) / s.categories.length) * plotW,
    label: c.length > 8 ? `${c.slice(0, 7)}…` : c,
  }));
});

const yAxisTicks = computed(() => {
  const s = scaleInfo.value;
  const ticks = 5;
  const out: { py: number; label: string }[] = [];
  for (let i = 0; i <= ticks; i++) {
    const t = i / ticks;
    const v = s.minY + t * (s.maxY - s.minY);
    out.push({ py: yToPx(v), label: v.toFixed(1) });
  }
  return out;
});
</script>

<template>
  <div class="graph" role="img" :aria-label="ariaLabel">
    <svg
      class="graph__svg"
      :viewBox="`0 0 ${W} ${H}`"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- plot frame -->
      <rect
        class="graph__plot-bg"
        :x="padL"
        :y="padT"
        :width="plotW"
        :height="plotH"
      />
      <line
        class="graph__axis"
        :x1="padL"
        :y1="padT + plotH"
        :x2="padL + plotW"
        :y2="padT + plotH"
      />
      <line
        class="graph__axis"
        :x1="padL"
        :y1="padT"
        :x2="padL"
        :y2="padT + plotH"
      />

      <!-- grid -->
      <g class="graph__grid">
        <line
          v-for="(tk, i) in yAxisTicks"
          :key="'gy' + i"
          class="graph__grid-line"
          :x1="padL"
          :y1="tk.py"
          :x2="padL + plotW"
          :y2="tk.py"
        />
      </g>

      <!-- vertical bars -->
      <g v-if="displayMode === 'columnsVertical'">
        <rect
          v-for="(b, i) in verticalBars"
          :key="'vb' + i"
          :x="b.x"
          :y="b.y"
          :width="b.w"
          :height="b.h"
          :fill="b.color"
          class="graph__bar"
        />
      </g>

      <!-- horizontal bars -->
      <g v-if="displayMode === 'columnsHorizontal'">
        <rect
          v-for="(b, i) in horizontalBars"
          :key="'hb' + i"
          :x="b.x"
          :y="b.y"
          :width="b.w"
          :height="b.h"
          :fill="b.color"
          class="graph__bar"
        />
      </g>

      <!-- lines -->
      <g
        v-if="displayMode === 'line' || displayMode === 'lines'"
        class="graph__lines"
      >
        <template v-for="row in linePaths" :key="'pl' + row.si">
          <polyline
            v-if="row.pts.length > 1"
            fill="none"
            :stroke="row.color"
            stroke-width="1"
            stroke-linejoin="round"
            stroke-linecap="round"
            :points="row.d"
          />
        </template>
      </g>

      <!-- dots (dots-only, or markers on top of polylines in lines mode) -->
      <g
        v-if="displayMode === 'dots' || displayMode === 'lines'"
        class="graph__dots"
      >
        <g v-for="row in linePaths" :key="'dg' + row.si">
          <circle
            v-for="(p, pi) in row.pts"
            :key="'dc' + row.si + '-' + pi"
            :cx="scaleInfo.numericX ? xToPx(p.xNum ?? 0) : xToPx(0, p.x)"
            :cy="yToPx(p.y)"
            :r="2"
            :fill="row.color"
            class="graph__dot"
          />
        </g>
      </g>

      <!-- x tick labels (categories or numeric x); hidden in horizontal bar mode -->
      <g
        v-if="displayMode !== 'columnsHorizontal'"
        class="graph__ticks graph__ticks--x"
      >
        <text
          v-for="(tk, i) in xAxisTicks"
          :key="'tx' + i"
          class="graph__tick-label"
          :x="tk.px"
          :y="H - 6"
          text-anchor="middle"
        >
          {{ tk.label }}
        </text>
      </g>

      <!-- y tick labels (values); hidden in horizontal bar mode -->
      <g
        v-if="displayMode !== 'columnsHorizontal'"
        class="graph__ticks graph__ticks--y"
      >
        <text
          v-for="(tk, i) in yAxisTicks"
          :key="'ty' + i"
          class="graph__tick-label graph__tick-label--y"
          :x="padL - 8"
          :y="tk.py"
          text-anchor="end"
          dominant-baseline="middle"
        >
          {{ tk.label }}
        </text>
      </g>

      <!-- horizontal bar: values along bottom, categories along left -->
      <g v-if="displayMode === 'columnsHorizontal'" class="graph__ticks">
        <text
          v-for="(tk, i) in valueTicksBottom"
          :key="'vb' + i"
          class="graph__tick-label"
          :x="tk.px"
          :y="H - 6"
          text-anchor="middle"
        >
          {{ tk.label }}
        </text>
        <text
          v-for="(tk, i) in categoryTicksLeft"
          :key="'cl' + i"
          class="graph__tick-label graph__tick-label--y"
          :x="padL - 6"
          :y="tk.py"
          text-anchor="end"
          dominant-baseline="middle"
        >
          {{ tk.label }}
        </text>
      </g>
    </svg>
  </div>
</template>
