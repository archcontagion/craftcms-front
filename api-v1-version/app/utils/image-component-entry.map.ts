import type {ContentAsset, ImageComponentEntryModel} from '~~/types';
import {asRecord, stringOrNull, mapAsset} from '~/utils/block-mapping-helpers';

export function mapImageComponentBlock(
  block: Record<string, unknown>,
): ImageComponentEntryModel | null {
  const fields = asRecord(block.fields);
  if (!fields) {
    return null;
  }
  const rawImages =
    fields.images ?? fields.image ?? fields.imageComponent ?? [];
  const list = Array.isArray(rawImages) ? rawImages : [];
  const images = list
    .map((item) => mapAsset(item))
    .filter((asset): asset is ContentAsset => asset != null);
  if (images.length === 0) {
    return null;
  }
  return {
    id: String(block.id ?? 'image'),
    title: stringOrNull(block.title),
    images,
  };
}
