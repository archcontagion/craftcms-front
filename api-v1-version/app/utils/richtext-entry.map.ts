import type {RichtextEntryModel} from '~~/types';
import {asRecord, stringOrNull} from '~/utils/block-mapping-helpers';

export function mapRichtextBlock(
  block: Record<string, unknown>,
): RichtextEntryModel | null {
  const fields = asRecord(block.fields);
  const html = fields ? stringOrNull(fields.richtext) : null;
  if (!html || html.trim() === '') {
    return null;
  }
  return {
    id: String(block.id ?? 'richtext'),
    title: stringOrNull(block.title),
    richtextHtml: html,
  };
}
