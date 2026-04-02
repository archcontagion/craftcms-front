import { asRecord, stringOrNull } from '~/utils/block-mapping-helpers';

export function mapRichtextComponentBlock(
  block: Record<string, unknown>,
): string | null {
  const fields = asRecord(block.fields);
  const html = fields ? stringOrNull(fields.richtext) : null;
  if (!html || html.trim() === '') {
    return null;
  }
  return html;
}
