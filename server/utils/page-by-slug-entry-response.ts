import {mapOptionalEntryToContentSections} from './page-by-slug-optional-entry';

import type {
  CraftContentBlock,
  CraftOptionalPageFieldsEntry,
  CraftPageEntry,
} from '../types/page-by-slug';

/**
 * Merge core entry data with resolved body blocks and hero/column extracts.
 * Home and About use the same sections/bodyContent pipeline — no entry-type-specific fields here.
 */
export function buildResolvedPageEntry(
  entry: CraftPageEntry,
  contentBlocks: CraftContentBlock[],
  mergedOptionalEntry: CraftOptionalPageFieldsEntry | null,
): CraftPageEntry {
  const heroComponentFieldEntries = contentBlocks
    .filter(
      (contentBlock) => contentBlock.blockType === 'heroComponent_ContentBlock',
    )
    .map((contentBlock) => contentBlock.heroBlock);
  const columnContainerFieldEntries = contentBlocks
    .filter((contentBlock) => contentBlock.blockType === 'columnComponent')
    .flatMap((contentBlock) => contentBlock.sectionEntries);

  const contentSections = mapOptionalEntryToContentSections(
    mergedOptionalEntry,
    entry.id,
  );

  return {
    ...entry,
    heroComponentFieldEntries,
    columnContainerFieldEntries,
    contentBlocks,
    contentSections:
      contentSections.length > 0 ? contentSections : undefined,
  };
}
