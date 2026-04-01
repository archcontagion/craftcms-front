import {
  CRAFT_FIELD_HANDLES,
  isColumnContainerBodyContentBlockGraphqlTypename,
  isHeadlineBodyContentBlockGraphqlTypename,
  isHeroBodyContentBlockGraphqlTypename,
  isImageComponentBodyContentBlockGraphqlTypename,
  isNavigationLinkBodyContentBlockGraphqlTypename,
  isRichtextBodyContentBlockGraphqlTypename,
} from '../config/craft-cms';

import type {
  CraftAsset,
  CraftContentBlock,
  CraftOptionalBodyContentGraphql,
  CraftOptionalColumnGraphql,
  CraftSectionContainerEntry,
} from '../types/page-by-slug';

/**
 * `columnSpan` is plain text in Craft; GraphQL may still surface it as a number
 * for some field configurations.
 */
function normalizeColumnSpanFromCraftApi(raw: unknown): string | null {
  if (raw == null) {
    return null;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return String(raw);
  }
  return null;
}

/** Craft may return matrix data as an array or a keyed object (id → block). */
export function normalizeMatrixFieldToArray(
  raw: unknown,
): CraftOptionalBodyContentGraphql[] {
  if (raw == null) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw as CraftOptionalBodyContentGraphql[];
  }
  if (typeof raw === 'object') {
    return Object.values(raw as Record<string, unknown>).filter(
      (item): item is CraftOptionalBodyContentGraphql =>
        item != null && typeof item === 'object',
    ) as CraftOptionalBodyContentGraphql[];
  }
  return [];
}

/** CKEditor / Redactor / plain string — normalize to HTML string for the mapper. */
export function extractHtmlFromRichtextField(raw: unknown): string | null {
  if (raw == null) {
    return null;
  }
  if (typeof raw === 'string') {
    return raw;
  }
  if (typeof raw === 'object' && raw !== null && 'html' in raw) {
    const htmlValue = (raw as {html: unknown}).html;
    return typeof htmlValue === 'string' ? htmlValue : null;
  }
  return null;
}

export function normalizeProfileImageAssets(raw: unknown): CraftAsset[] {
  if (raw == null) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw as CraftAsset[];
  }
  return [raw as CraftAsset];
}

export function normalizeBioFromGraphql(raw: unknown): string | null {
  return extractHtmlFromRichtextField(raw);
}

/** Hero Content Block may expose `heroSubline` (API/Twig) or `subline` (field handle). */
function readHeroSublineFromGraphql(
  nestedHero: unknown,
  bodyContentEntry: CraftOptionalBodyContentGraphql,
): string | null {
  const fromRecord = (record: Record<string, unknown>): string | null => {
    const heroSublineRaw = record.heroSubline ?? record.subline;
    if (typeof heroSublineRaw === 'string') {
      const trimmed = heroSublineRaw.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return null;
  };
  if (nestedHero != null && typeof nestedHero === 'object') {
    const fromNested = fromRecord(nestedHero as Record<string, unknown>);
    if (fromNested != null) {
      return fromNested;
    }
  }
  const topLevel = fromRecord(bodyContentEntry as Record<string, unknown>);
  return topLevel;
}

/** Turn stored HTML into a single line for `<Headline>` (plain text). */
function plainTextFromHeadlineHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * `headline` on `columnComponent_Entry` is a `headline_ContentBlock` (or list), not a scalar.
 * Tries `title`, `heading`, `headline`, then `richtext.html` when present on the loaded object.
 */
export function normalizeHeadlinePlainTextFromGraphql(
  raw: unknown,
): string | null {
  if (raw == null) {
    return null;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (Array.isArray(raw)) {
    for (const headlineBlock of raw) {
      const extracted = normalizeHeadlinePlainTextFromGraphql(headlineBlock);
      if (extracted != null) {
        return extracted;
      }
    }
    return null;
  }
  if (typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    const headlineTitleField = record[CRAFT_FIELD_HANDLES.headlinetitle];
    if (typeof headlineTitleField === 'string') {
      const trimmedHeadlineTitle = headlineTitleField.trim();
      if (trimmedHeadlineTitle.length > 0) {
        return trimmedHeadlineTitle;
      }
    }
    if (typeof record.title === 'string') {
      const trimmed = record.title.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
    if (typeof record.heading === 'string') {
      const trimmed = record.heading.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
    if (typeof record.headline === 'string') {
      const trimmed = record.headline.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
    const richtextField = record.richtext;
    if (richtextField != null && typeof richtextField === 'object') {
      const html = extractHtmlFromRichtextField(richtextField);
      if (html != null && html.trim().length > 0) {
        return plainTextFromHeadlineHtml(html);
      }
    }
  }
  return null;
}

/**
 * Column `<Headline>` text: nested `headline` field first, then Craft entry `title`
 * when editors use the native title instead of the headline block.
 */
function headlinePlainTextForColumnEntry(
  columnEntry: CraftOptionalColumnGraphql,
): string | null {
  const fromHeadlineField = normalizeHeadlinePlainTextFromGraphql(
    columnEntry[CRAFT_FIELD_HANDLES.headline],
  );
  if (fromHeadlineField != null && fromHeadlineField.length > 0) {
    return fromHeadlineField;
  }
  const entryTitle = columnEntry.title;
  if (typeof entryTitle === 'string' && entryTitle.trim().length > 0) {
    return entryTitle.trim();
  }
  return null;
}

/**
 * Map the body matrix field value to normalized content blocks for the API response.
 */
export function mapMatrixFieldValueToContentBlocks(
  rawFieldValue: unknown,
  pageEntryId: string | null,
): CraftContentBlock[] {
  const bodyContentEntries = normalizeMatrixFieldToArray(rawFieldValue);

  const mappedBlocks: CraftContentBlock[] = [];
  for (const bodyContentEntry of bodyContentEntries) {
    if (!bodyContentEntry.id) {
      continue;
    }

    const nestedHero =
      bodyContentEntry[CRAFT_FIELD_HANDLES.heroComponent] ?? null;
    const resolvedHeroTitle =
      nestedHero?.[CRAFT_FIELD_HANDLES.heroTitle] ??
      bodyContentEntry[CRAFT_FIELD_HANDLES.heroTitle] ??
      null;
    const resolvedHeroSubline = readHeroSublineFromGraphql(
      nestedHero,
      bodyContentEntry,
    );
    const resolvedHeroImage =
      nestedHero?.[CRAFT_FIELD_HANDLES.heroImage] ??
      bodyContentEntry[CRAFT_FIELD_HANDLES.heroImage] ??
      [];

    const isColumnContainerTypename =
      isColumnContainerBodyContentBlockGraphqlTypename(
        bodyContentEntry.__typename,
      );
    const nestedColumnEntries = normalizeMatrixFieldToArray(
      bodyContentEntry[CRAFT_FIELD_HANDLES.columnContainer] ??
        bodyContentEntry[CRAFT_FIELD_HANDLES.columnComponent],
    ) as CraftOptionalColumnGraphql[];

    if (isColumnContainerTypename || nestedColumnEntries.length > 0) {
      if (nestedColumnEntries.length === 0) {
        continue;
      }

      const normalizedSectionEntries: CraftSectionContainerEntry[] =
        nestedColumnEntries
          .filter(
            (
              columnEntry,
            ): columnEntry is CraftOptionalColumnGraphql & {
              id: string;
            } =>
              typeof columnEntry.id === 'string' && columnEntry.id.length > 0,
          )
          .map((columnEntry) => ({
            id: columnEntry.id,
            slug: columnEntry.slug ?? null,
            uri: columnEntry.uri ?? null,
            headline: headlinePlainTextForColumnEntry(columnEntry),
            columnRichtextHtml: extractHtmlFromRichtextField(
              columnEntry[CRAFT_FIELD_HANDLES.richtext],
            ),
            imageComponent: normalizeProfileImageAssets(
              columnEntry[CRAFT_FIELD_HANDLES.columnImage],
            ),
          }));

      const columnSpan = normalizeColumnSpanFromCraftApi(
        bodyContentEntry[CRAFT_FIELD_HANDLES.columnSpan],
      );

      mappedBlocks.push({
        id: `column-component-${bodyContentEntry.id}`,
        blockType: 'columnComponent',
        sectionEntries: normalizedSectionEntries,
        columnSpan,
      });
      continue;
    }

    if (
      isImageComponentBodyContentBlockGraphqlTypename(
        bodyContentEntry.__typename,
      )
    ) {
      const imageFieldValue =
        bodyContentEntry[CRAFT_FIELD_HANDLES.columnImage] ?? null;
      const imageAssets = normalizeProfileImageAssets(imageFieldValue);
      mappedBlocks.push({
        id: `body-image-${bodyContentEntry.id}`,
        blockType: 'imageComponent_Entry',
        imageEntry: {
          id: bodyContentEntry.id,
          title:
            typeof bodyContentEntry.title === 'string'
              ? bodyContentEntry.title
              : null,
          images: imageAssets,
        },
      });
      continue;
    }

    if (
      isHeadlineBodyContentBlockGraphqlTypename(bodyContentEntry.__typename)
    ) {
      const headlineFromNestedField = normalizeHeadlinePlainTextFromGraphql(
        bodyContentEntry[CRAFT_FIELD_HANDLES.headline],
      );
      const entryTitle =
        typeof bodyContentEntry.title === 'string'
          ? bodyContentEntry.title.trim()
          : '';
      const resolvedTitle: string | null =
        entryTitle.length > 0 ? entryTitle : headlineFromNestedField;
      mappedBlocks.push({
        id: `body-headline-${bodyContentEntry.id}`,
        blockType: 'richtext_Entry',
        richtextEntry: {
          id: bodyContentEntry.id,
          title: resolvedTitle,
          richtextHtml: null,
        },
      });
      continue;
    }

    const hasRichtextField =
      bodyContentEntry[CRAFT_FIELD_HANDLES.richtext] !== undefined &&
      bodyContentEntry[CRAFT_FIELD_HANDLES.richtext] !== null;
    const isRichtextTypename = isRichtextBodyContentBlockGraphqlTypename(
      bodyContentEntry.__typename,
    );

    const heroImageFieldValue = bodyContentEntry[CRAFT_FIELD_HANDLES.heroImage];
    const isHeroByFields =
      nestedHero != null ||
      bodyContentEntry[CRAFT_FIELD_HANDLES.heroTitle] !== undefined ||
      bodyContentEntry[CRAFT_FIELD_HANDLES.heroSubline] !== undefined ||
      (Array.isArray(heroImageFieldValue) && heroImageFieldValue.length > 0);

    const isHeroBlock =
      isHeroBodyContentBlockGraphqlTypename(bodyContentEntry.__typename) ||
      (isHeroByFields && !hasRichtextField);

    if (isHeroBlock) {
      mappedBlocks.push({
        id: bodyContentEntry.id,
        blockType: 'heroComponent_ContentBlock',
        heroBlock: {
          id: bodyContentEntry.id,
          title: bodyContentEntry.title ?? null,
          heroTitle: resolvedHeroTitle,
          heroSubline: resolvedHeroSubline,
          heroImage: resolvedHeroImage,
        },
      });
      continue;
    }

    if (hasRichtextField || isRichtextTypename) {
      mappedBlocks.push({
        id: `body-richtext-${bodyContentEntry.id}`,
        blockType: 'richtext_Entry',
        richtextEntry: {
          id: bodyContentEntry.id,
          title: bodyContentEntry.title ?? null,
          richtextHtml: extractHtmlFromRichtextField(
            bodyContentEntry[CRAFT_FIELD_HANDLES.richtext],
          ),
        },
      });
      continue;
    }

    const isNavigationTypename =
      isNavigationLinkBodyContentBlockGraphqlTypename(
        bodyContentEntry.__typename,
      );

    if (isNavigationTypename) {
      mappedBlocks.push({
        id: `body-navigation-link-${bodyContentEntry.id}`,
        blockType: 'navigationLink_Entry',
        navigationLinkEntry: {
          id: bodyContentEntry.id,
          title: bodyContentEntry.title ?? '',
          uri: bodyContentEntry.uri ?? null,
          slug: bodyContentEntry.slug ?? null,
        },
      });
    }
  }

  return mappedBlocks;
}
