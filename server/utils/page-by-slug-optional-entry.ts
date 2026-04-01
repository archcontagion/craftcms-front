import {
  CRAFT_FIELD_HANDLES,
  CRAFT_GRAPHQL_SECTIONS_BODY_ROW_TYPENAMES,
  CRAFT_GRAPHQL_TYPENAMES,
  buildSectionsMatrixSelectionForBodyContent,
} from '../config/craft-cms';
import {getDefaultBodyContentInnerSelection} from './craft-body-content-graphql';
import {
  mapMatrixFieldValueToContentBlocks,
  normalizeMatrixFieldToArray,
} from './page-by-slug-body-content-map';

import type {
  BlockFieldDefinition,
  CraftContentBlock,
  CraftContentSectionGroup,
  CraftOptionalPageFieldsEntry,
  CraftOptionalPageFieldsResponse,
  CraftSectionRowSpacing,
} from '../types/page-by-slug';

function normalizeSectionSpacingField(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Home and About share the same shape: `sections` → `sectionComponent_Entry` → `bodyContent`.
 * Pass the same inner matrix selection everywhere (including discovery-optimized fragments).
 */
export function buildOptionalSectionsPageEntryFields(
  bodyContentInnerSelection: string,
  sectionRowTypenames: readonly string[] = CRAFT_GRAPHQL_SECTIONS_BODY_ROW_TYPENAMES,
): string {
  return `
  id
  ${buildSectionsMatrixSelectionForBodyContent(bodyContentInnerSelection, sectionRowTypenames)}
`;
}

/**
 * Concatenate body matrix rows from every block in `sections` that exposes `bodyContent`,
 * in order. Does not rely on a specific `__typename` — Craft matrix/entry row names vary.
 */
export function extractBodyContentMatrixFromSectionsField(
  sectionsFieldValue: unknown,
): unknown {
  if (sectionsFieldValue == null) {
    return null;
  }
  const sectionBlocks = normalizeMatrixFieldToArray(sectionsFieldValue);
  const mergedBodyContent: unknown[] = [];
  for (const sectionBlock of sectionBlocks) {
    const sectionRow = sectionBlock as {
      bodyContent?: unknown;
    };
    if (sectionRow.bodyContent == null) {
      continue;
    }
    mergedBodyContent.push(
      ...normalizeMatrixFieldToArray(sectionRow.bodyContent),
    );
  }
  return mergedBodyContent.length > 0 ? mergedBodyContent : null;
}

/**
 * Preserves each `sections` matrix row: spacing (padding/margin) + inner `bodyContent` blocks.
 */
export function mapOptionalEntryToContentSections(
  optionalEntry: CraftOptionalPageFieldsEntry | null | undefined,
  pageEntryId: string | null,
): CraftContentSectionGroup[] {
  if (!optionalEntry) {
    return [];
  }
  const sectionsFieldValue = optionalEntry[CRAFT_FIELD_HANDLES.sections];
  if (sectionsFieldValue == null) {
    return [];
  }
  const sectionRows = normalizeMatrixFieldToArray(sectionsFieldValue);
  const sectionGroups: CraftContentSectionGroup[] = [];
  let sectionIndex = 0;
  for (const sectionRow of sectionRows) {
    const rowRecord = sectionRow as Record<string, unknown>;
    const rawSectionId = rowRecord.id;
    const sectionId =
      typeof rawSectionId === 'string' && rawSectionId.length > 0
        ? rawSectionId
        : typeof rawSectionId === 'number'
          ? String(rawSectionId)
          : `section-${sectionIndex}`;
    sectionIndex += 1;

    const paddingTop = normalizeSectionSpacingField(
      rowRecord[CRAFT_FIELD_HANDLES.paddingTop],
    );
    const paddingBottom = normalizeSectionSpacingField(
      rowRecord[CRAFT_FIELD_HANDLES.paddingBottom],
    );
    const marginTop = normalizeSectionSpacingField(
      rowRecord[CRAFT_FIELD_HANDLES.marginTop],
    );
    const marginBottom = normalizeSectionSpacingField(
      rowRecord[CRAFT_FIELD_HANDLES.marginBottom],
    );

    const rawBodyContent = rowRecord[CRAFT_FIELD_HANDLES.bodyContent];
    const innerBlocks = mapMatrixFieldValueToContentBlocks(
      rawBodyContent,
      pageEntryId,
    );

    const sectionRowSpacing: CraftSectionRowSpacing = {
      paddingTop,
      paddingBottom,
      marginTop,
      marginBottom,
    };

    const contentBlocksWithSectionSpacingOnColumns = innerBlocks.map(
      (block): CraftContentBlock => {
        if (block.blockType !== 'columnComponent') {
          return block;
        }
        return {
          ...block,
          sectionSpacing: sectionRowSpacing,
        };
      },
    );

    sectionGroups.push({
      id: sectionId,
      paddingTop,
      paddingBottom,
      marginTop,
      marginBottom,
      contentBlocks: contentBlocksWithSectionSpacingOnColumns,
    });
  }

  return sectionGroups;
}

export const blockFieldDefinitions: BlockFieldDefinition[] = [
  {
    fieldHandle: CRAFT_FIELD_HANDLES.sections,
    querySelection: buildSectionsMatrixSelectionForBodyContent(
      getDefaultBodyContentInnerSelection(),
      CRAFT_GRAPHQL_SECTIONS_BODY_ROW_TYPENAMES,
    ),
    mapToContentBlocks: (rawFieldValue, pageEntryId) =>
      mapMatrixFieldValueToContentBlocks(
        extractBodyContentMatrixFromSectionsField(rawFieldValue),
        pageEntryId,
      ),
  },
];

export function mergeOptionalPageEntries(
  base: CraftOptionalPageFieldsEntry,
  partial: CraftOptionalPageFieldsEntry | null | undefined,
): CraftOptionalPageFieldsEntry {
  if (!partial) {
    return base;
  }
  return {
    ...base,
    ...partial,
  };
}

export function mapOptionalEntryToContentBlocks(
  optionalEntry: CraftOptionalPageFieldsEntry | null | undefined,
  pageEntryId: string | null,
): CraftContentBlock[] {
  return mapOptionalEntryToContentSections(optionalEntry, pageEntryId).flatMap(
    (sectionGroup) => sectionGroup.contentBlocks,
  );
}

/**
 * When the combined optional query fails (any invalid field breaks the whole document),
 * fetch each registered field in its own request and merge. Skips fields that error.
 */
export async function fetchMergedOptionalEntryByFieldParts(
  graphqlEndpoint: string,
  requestHeaders: Record<string, string>,
  entryId: string,
): Promise<CraftOptionalPageFieldsEntry | null> {
  const mergedEntry: CraftOptionalPageFieldsEntry = {
    id: entryId,
  };

  for (const blockFieldDefinition of blockFieldDefinitions) {
    const fieldPartQuery = `
      query OptionalFieldPart($entryId: [QueryArgument]) {
        entries(id: $entryId, limit: 1) {
          ... on ${CRAFT_GRAPHQL_TYPENAMES.homeEntry} {
            id
            ${blockFieldDefinition.querySelection}
          }
          ... on ${CRAFT_GRAPHQL_TYPENAMES.aboutEntry} {
            id
            ${blockFieldDefinition.querySelection}
          }
          ... on ${CRAFT_GRAPHQL_TYPENAMES.pageEntry} {
            id
            ${blockFieldDefinition.querySelection}
          }
        }
      }
    `;

    const fieldPartResponse = await $fetch<CraftOptionalPageFieldsResponse>(
      graphqlEndpoint,
      {
        method: 'POST',
        headers: requestHeaders,
        body: {
          query: fieldPartQuery,
          variables: {
            entryId: [entryId],
          },
        },
      },
    );

    if (fieldPartResponse.errors?.length) {
      continue;
    }

    const partialEntry = fieldPartResponse.data?.entries?.[0];
    if (!partialEntry) {
      continue;
    }

    const fieldValue = partialEntry[blockFieldDefinition.fieldHandle];
    if (fieldValue !== undefined) {
      mergedEntry[blockFieldDefinition.fieldHandle] = fieldValue;
    }
  }

  const hasAnyContentField = blockFieldDefinitions.some(
    (blockFieldDefinition) =>
      mergedEntry[blockFieldDefinition.fieldHandle] !== undefined,
  );

  return hasAnyContentField ? mergedEntry : null;
}
