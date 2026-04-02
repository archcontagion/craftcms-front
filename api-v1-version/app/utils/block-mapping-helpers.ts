import type {ContentAsset} from '~~/types';

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return null;
}

export function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function mapAsset(raw: unknown): ContentAsset | null {
  const asset = asRecord(raw);
  if (!asset || typeof asset.url !== 'string') {
    return null;
  }
  return {
    url: asset.url,
    title: stringOrNull(asset.title),
    alt: stringOrNull(asset.alt),
  };
}
