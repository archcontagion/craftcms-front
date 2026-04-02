import type {ContentAsset, HeroComponentBlock} from '~~/types';
import {asRecord, stringOrNull, mapAsset} from '~/utils/block-mapping-helpers';

export function mapHeroFromBlock(
  block: Record<string, unknown>,
): HeroComponentBlock | null {
  const fields = asRecord(block.fields);
  const heroWrapper = fields ? asRecord(fields.heroComponent) : null;
  const heroFields = heroWrapper ? asRecord(heroWrapper.fields) : null;
  if (!heroFields) {
    return null;
  }
  const heroId =
    heroWrapper && heroWrapper.id != null
      ? String(heroWrapper.id)
      : String(block.id ?? 'hero');
  const rawImages = heroFields.heroImage;
  const imageList = Array.isArray(rawImages) ? rawImages : [];
  const heroImage = imageList
    .map((item) => mapAsset(item))
    .filter((asset): asset is ContentAsset => asset != null);

  return {
    id: heroId,
    title: stringOrNull(block.title),
    heroTitle: stringOrNull(heroFields.heroTitle),
    heroSubline: stringOrNull(heroFields.heroSubline),
    heroImage,
  };
}
