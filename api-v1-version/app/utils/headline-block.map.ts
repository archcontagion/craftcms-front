import type {HeadlineBlockModel} from '~~/types';
import {asRecord} from '~/utils/block-mapping-helpers';

function parseTitleTag(raw: unknown): 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' {
  const value = typeof raw === 'string' ? raw.toLowerCase() : '';
  const allowed = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
  if (allowed.includes(value as (typeof allowed)[number])) {
    return value as (typeof allowed)[number];
  }
  return 'h2';
}

function parseStyleTag(
  raw: unknown,
): 'none' | 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' {
  const value = typeof raw === 'string' ? raw.trim() : '';
  const allowed = [
    'none',
    'display',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
  ] as const;
  if (allowed.includes(value as (typeof allowed)[number])) {
    return value as (typeof allowed)[number];
  }
  if (value === 'h2' || value === 'h3' || value === 'h1') {
    return value;
  }
  return 'none';
}

export function mapHeadlineBlock(
  block: Record<string, unknown>,
): HeadlineBlockModel | null {
  const fields = asRecord(block.fields);
  const headlineWrapper = fields ? asRecord(fields.headline) : null;
  const headlineFields = headlineWrapper
    ? asRecord(headlineWrapper.fields)
    : null;
  if (!headlineFields) {
    return null;
  }
  const titleRaw = headlineFields.headlinetitle;
  const title =
    typeof titleRaw === 'string' && titleRaw.trim() !== ''
      ? titleRaw.trim()
      : '';
  if (!title) {
    return null;
  }
  return {
    blockId: String(block.id ?? 'headline'),
    title,
    titleTag: parseTitleTag(headlineFields.headlinetag),
    styleTag: parseStyleTag(headlineFields.headlineclass),
  };
}
