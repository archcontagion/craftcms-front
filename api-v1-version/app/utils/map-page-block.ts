import {mapHeroFromBlock} from '~/utils/hero-component.map';
import {mapHeadlineBlock} from '~/utils/headline-block.map';
import {mapRichtextBlock} from '~/utils/richtext-entry.map';
import {mapColumnContainerBlock} from '~/utils/section-container.map';
import {mapImageComponentBlock} from '~/utils/image-component-entry.map';
import {mapNavigationLinkBlock} from '~/utils/navigation-link-entry.map';
import {mapRichtextComponentBlock} from '~/utils/richtext-component-block.map';
import {asRecord} from '~/utils/block-mapping-helpers';
import type {PageBlockView} from '~~/types';

export type {PageBlockView};

export function mapRawBlockToView(
  rawBlock: unknown,
  blockIndex: number,
): PageBlockView | null {
  const block = asRecord(rawBlock);
  if (!block) {
    return null;
  }
  const blockKey =
    block.id != null ? String(block.id) : `b-${String(blockIndex)}`;
  const type = block.type;

  if (type === 'heroComponent') {
    const hero = mapHeroFromBlock(block);
    if (!hero) {
      return null;
    }
    return {kind: 'hero', key: blockKey, blocks: [hero]};
  }

  if (type === 'headline') {
    const headline = mapHeadlineBlock(block);
    if (!headline) {
      return null;
    }
    return {kind: 'headline', key: blockKey, headline};
  }

  if (type === 'richtext') {
    const entry = mapRichtextBlock(block);
    if (!entry) {
      return null;
    }
    return {kind: 'richtext', key: blockKey, entry};
  }

  if (type === 'columnContainer') {
    const mapped = mapColumnContainerBlock(block);
    if (!mapped || mapped.entries.length === 0) {
      return null;
    }
    return {
      kind: 'columns',
      key: blockKey,
      entries: mapped.entries,
      columnSpan: mapped.columnSpan,
    };
  }

  if (type === 'imageComponent') {
    const entry = mapImageComponentBlock(block);
    if (!entry) {
      return null;
    }
    return {kind: 'image', key: blockKey, entry};
  }

  if (type === 'navigationLink') {
    const entry = mapNavigationLinkBlock(block);
    if (!entry) {
      return null;
    }
    return {kind: 'navigationLink', key: blockKey, entry};
  }

  if (type === 'richtextComponent') {
    const html = mapRichtextComponentBlock(block);
    if (!html) {
      return null;
    }
    return {kind: 'richtextComponent', key: blockKey, html};
  }

  return null;
}
