/**
 * Route helpers for `[...slug].vue` — slug normalization and Craft navigation link → path.
 */

export type CraftNavigationLink = {
  id: string;
  title: string;
  uri: string | null;
  slug: string | null;
};

export function normalizeSlugSegmentsFromRoute(
  slugParameter: string[] | string | undefined,
): string[] {
  if (Array.isArray(slugParameter)) {
    return slugParameter;
  }
  return slugParameter ? [slugParameter] : [];
}

export function resolveCraftNavigationHref(
  navigationLink: CraftNavigationLink,
): string {
  if (navigationLink.uri && navigationLink.uri.length > 0) {
    return `/${navigationLink.uri}`;
  }

  if (navigationLink.slug && navigationLink.slug.length > 0) {
    return `/${navigationLink.slug}`;
  }

  return '#';
}
