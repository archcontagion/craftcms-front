/**
 * Theme Roller editor: HTML5 drag/drop helpers and shared payload parsing.
 *
 * Tree and palette drags set both `application/json` and THEME_ROLLER_TREE_DRAG_MIME so drops
 * still work when the browser only exposes one type.
 */

export const THEME_ROLLER_TREE_DRAG_MIME =
  "application/x-theme-roller-tree-drag" as const;

/** Payload read from dataTransfer on drop (shape varies by drag source). */
export interface ThemeRollerDragPayload {
  type: string;
  zone?: string;
  blockId?: string;
  sectionId?: string;
  sectionElementId?: string;
  sectionIndex?: number;
  /** When set, the drag originated from a block rendered inside a modal (inner list). */
  modalBlockId?: string;
}

export function parseThemeRollerDragPayload(
  event: DragEvent,
): ThemeRollerDragPayload | null {
  const raw =
    event.dataTransfer?.getData("application/json") ||
    event.dataTransfer?.getData(THEME_ROLLER_TREE_DRAG_MIME) ||
    event.dataTransfer?.getData("text/plain");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ThemeRollerDragPayload;
  } catch {
    return null;
  }
}

/**
 * dragleave fires when entering a child of the same element; only clear highlight when the
 * pointer truly leaves the drop target.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragleave_event
 */
export function clearDropHighlightOnRealLeave(
  event: DragEvent,
  clear: () => void,
): void {
  const dropTargetElement = event.currentTarget;
  if (!(dropTargetElement instanceof HTMLElement)) return;
  const enteredElement = event.relatedTarget;
  if (
    enteredElement instanceof Node &&
    dropTargetElement.contains(enteredElement)
  )
    return;
  clear();
}

/**
 * Insertion slot keys inside a section group: after sectionElement (`:s`) or after a content block (`:a:`).
 */
export function editorInsertSlotKeyStart(sectionElementId: string): string {
  return `ig:${sectionElementId}:s`;
}

export function editorInsertSlotKeyAfter(
  sectionElementId: string,
  blockId: string,
): string {
  return `ig:${sectionElementId}:a:${blockId}`;
}

/** Anchor block id for insertBlockAfter / moveSectionBlockToPosition. */
export function parseEditorInsertSlotKey(
  key: string,
): { afterBlockId: string } | null {
  if (!key.startsWith("ig:")) return null;
  const parts = key.split(":");
  if (parts.length === 3 && parts[2] === "s" && parts[1]) {
    return { afterBlockId: parts[1] };
  }
  if (parts.length === 4 && parts[2] === "a" && parts[3]) {
    return { afterBlockId: parts[3] };
  }
  return null;
}

/** Green bar shown inside insertion strips / column drop zones (inline only; no SCSS). */
export const editorDropIndicatorBarStyle: Record<string, string> = {
  height: "6px",
  borderRadius: "3px",
  backgroundColor: "#238636",
  margin: "4px 0",
};

/** Narrower margin when the bar sits inside a group column. */
export const editorDropIndicatorBarStyleGroup: Record<string, string> = {
  ...editorDropIndicatorBarStyle,
  margin: "0 2px",
};
