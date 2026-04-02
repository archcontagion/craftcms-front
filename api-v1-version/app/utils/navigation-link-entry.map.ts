import type {NavigationLinkEntryModel} from '~~/types';
import {asRecord} from '~/utils/block-mapping-helpers';

export function mapNavigationLinkBlock(
  block: Record<string, unknown>,
): NavigationLinkEntryModel | null {
  const fields = asRecord(block.fields);
  const navLink = fields ? asRecord(fields.navLink) : null;
  const titleFromBlock =
    typeof block.title === 'string' && block.title.trim() !== ''
      ? block.title.trim()
      : '';
  const labelFromLink =
    navLink && typeof navLink.label === 'string' ? navLink.label.trim() : '';
  const title = titleFromBlock || labelFromLink;
  if (!title) {
    return null;
  }
  let uri: string | null = null;
  if (navLink && typeof navLink.url === 'string' && navLink.url !== '') {
    try {
      const parsed = new URL(navLink.url);
      uri = parsed.pathname.replace(/^\/+/, '') || null;
    } catch {
      uri =
        navLink.url.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+/, '') ||
        null;
    }
  }
  const element = navLink ? asRecord(navLink.element) : null;
  const slug =
    element && typeof element.slug === 'string' ? element.slug : null;

  return {
    id: String(block.id ?? 'nav'),
    title,
    uri,
    slug,
  };
}
