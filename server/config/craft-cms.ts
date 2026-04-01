/**
 * Single place to align this app with your Craft CMS GraphQL schema.
 *
 * **Automatic at runtime**
 * - `discoverBodyContentTypenames` (see `craft-body-content-graphql.ts`) queries the
 *   live home entry and reads which matrix block `__typename` values exist, so the
 *   API only requests fragment shapes that appear in content.
 *
 * **You must update this file when**
 * - A Craft **field handle** changes → edit `CRAFT_FIELD_HANDLES` only.
 * - You add a **new block type** to the body matrix → add one entry to
 *   `bodyContentFragmentsByTypename` with the field selection GraphQL needs for that
 *   block. Until you do, unknown typenames are logged to the console and those blocks
 *   are skipped in the built query (see `buildBodyContentSelection`).
 * - Section/entry **GraphQL type names** or **section handles** change (rare) →
 *   `CRAFT_GRAPHQL_TYPENAMES` / `CRAFT_ENTRY_TYPE_HANDLES`.
 * - The **sections** matrix block type that holds `bodyContent` (e.g.
 *   `sectionComponent_Entry`) → `CRAFT_GRAPHQL_TYPENAMES.sectionComponentEntry` if Craft
 *   renames it. Craft rejects queries that name an unregistered inline fragment type.
 *
 * **You may still need code changes in `page-by-slug.get.ts` when**
 * - A new block is a **new kind of UI** (not hero/columns/richtext/nav) — extend
 *   `mapMatrixFieldValueToContentBlocks`, or add a generic “passthrough” block type.
 */

/** Craft field handles (and global set *handles*) used in queries and mappers. */
export const CRAFT_FIELD_HANDLES = {
  /** Home/About → matrix of section blocks; `sectionComponent` rows hold `bodyContent`. */
  sections: 'sections',
  bodyContent: 'bodyContent',
  heroComponent: 'heroComponent',
  heroTitle: 'heroTitle',
  /** Matches GraphQL / CP serialization (`heroSubline` in Twig/API; field may also appear as `subline`). */
  heroSubline: 'heroSubline',
  heroImage: 'heroImage',
  columnContainer: 'columnContainer',
  /** Plain text on `columnContainer_Entry`, e.g. `6-6`, `4-8`, `4-4-4` (12-column grid). */
  columnSpan: 'columnSpan',
  columnComponent: 'columnComponent',
  /** On `columnComponent_Entry`: Content Block field; GraphQL must select nested block fields (e.g. `headlinetitle`). */
  headline: 'headline',
  /** Nested fields on headline Content Block (schema handles). */
  headlinetitle: 'headlinetitle',
  headlinetag: 'headlinetag',
  headlineclass: 'headlineclass',
  /** Asset field on `columnComponent_Entry` (adjust if your handle differs, e.g. `featuredImage`). */
  columnImage: 'image',
  richtext: 'richtext',
  globalSetHeader: 'header',
  globalSetFooter: 'footer',
  navigationHeader: 'navigationHeader',
  navigationFooter: 'navigationFooter',
  /** `sectionComponent` matrix row — Design tab (dropdown tokens: none, xs, lg, …). */
  paddingTop: 'paddingTop',
  paddingBottom: 'paddingBottom',
  marginTop: 'marginTop',
  marginBottom: 'marginBottom',
} as const;

/**
 * Matrix block “stem” in GraphQL `__typename` values:
 * `{segment}_Entry`, `bodyContent_{segment}_BlockType`, etc.
 * Must stay aligned with `bodyContentFragmentsByTypename` keys.
 */
export const BODY_CONTENT_MATRIX_BLOCK_SEGMENTS = {
  columnContainer: CRAFT_FIELD_HANDLES.columnContainer,
  richtext: CRAFT_FIELD_HANDLES.richtext,
  headline: CRAFT_FIELD_HANDLES.headline,
  navigationLink: 'navigationLink',
  imageComponent: 'imageComponent',
} as const;

/** Section `handle` values for `entries(type: "...")` queries. */
export const CRAFT_ENTRY_TYPE_HANDLES = {
  home: 'home',
  about: 'about',
  page: 'page',
  post: 'post',
} as const;

/**
 * GraphQL `__typename` / inline fragment names as emitted by Craft’s GraphQL API.
 * If Craft regenerates schema names, update here.
 */
export const CRAFT_GRAPHQL_TYPENAMES = {
  homeEntry: 'home_Entry',
  aboutEntry: 'about_Entry',
  /** Structure section `page` (uri e.g. `page/{slug}`). */
  pageEntry: 'page_Entry',
  /** Matrix block type inside `sections` that carries the page body matrix. */
  sectionComponentEntry: 'sectionComponent_Entry',
  postEntry: 'post_Entry',
  navigationLinkEntry: 'navigationLink_Entry',
  headerGlobalSet: 'header_GlobalSet',
  footerGlobalSet: 'footer_GlobalSet',
  heroComponentEntry: 'heroComponent_Entry',
  heroComponentContentBlock: 'heroComponent_ContentBlock',
  /** Child block type for the `headline` field on `columnComponent_Entry` (requires a sub-selection in GraphQL). */
  headlineContentBlock: 'headline_ContentBlock',
  columnComponentEntry: 'columnComponent_Entry',
} as const;

/** Slugs used in app logic (home URI, about page, etc.). */
export const CRAFT_KNOWN_ENTRY_SLUGS = {
  home: 'home',
  about: 'about',
} as const;

/**
 * GraphQL `__typename` values for rows inside the `sections` field that expose `bodyContent`.
 * Matrix vs entry field naming differs by Craft version — inspect `sections { __typename }` in GraphiQL.
 * Override with env `NUXT_CRAFT_SECTIONS_BODY_ROW_GRAPHQL_TYPENAMES` (comma-separated).
 */
export const CRAFT_GRAPHQL_SECTIONS_BODY_ROW_TYPENAMES: readonly string[] = [
  CRAFT_GRAPHQL_TYPENAMES.sectionComponentEntry,
];

/**
 * Nested `headline` Content Block field selection (avoid tying to a single GraphQL type name;
 * Craft’s generated `__typename` for blocks can differ from `headline_ContentBlock`).
 */
export function buildHeadlineNestedFieldSelection(): string {
  return `
              ${CRAFT_FIELD_HANDLES.headline} {
                __typename
                ${CRAFT_FIELD_HANDLES.headlinetitle}
                ${CRAFT_FIELD_HANDLES.headlinetag}
                ${CRAFT_FIELD_HANDLES.headlineclass}
              }`;
}

/**
 * Column `headline` is a Content Block field — sub-select layout handles.
 */
export function buildColumnHeadlineFieldSelection(): string {
  return buildHeadlineNestedFieldSelection();
}

/**
 * `sections { ... on RowType { bodyContent { … } } }` — one inline fragment per possible row type.
 */
export function buildSectionsMatrixSelectionForBodyContent(
  bodyContentInnerSelection: string,
  sectionRowTypenames: readonly string[] = CRAFT_GRAPHQL_SECTIONS_BODY_ROW_TYPENAMES,
): string {
  const rowFragments = sectionRowTypenames
    .map(
      (rowTypename) => `
      ... on ${rowTypename} {
        id
        ${CRAFT_FIELD_HANDLES.paddingTop}
        ${CRAFT_FIELD_HANDLES.paddingBottom}
        ${CRAFT_FIELD_HANDLES.marginTop}
        ${CRAFT_FIELD_HANDLES.marginBottom}
        ${CRAFT_FIELD_HANDLES.bodyContent} {
          ${bodyContentInnerSelection}
        }
      }`,
    )
    .join('\n');
  return `
    ${CRAFT_FIELD_HANDLES.sections} {
${rowFragments}
    }
  `;
}

/** Prefix for matrix block typenames from the bodyContent field (e.g. `bodyContent_*_BlockType`). */
export const BODY_CONTENT_MATRIX_TYPENAME_PREFIX = `${CRAFT_FIELD_HANDLES.bodyContent}_`;

export const MATRIX_BLOCK_TYPE_SUFFIX = '_BlockType';

/**
 * Matches Craft’s variants for a body matrix block: `segment_Entry`,
 * `bodyContent_segment_BlockType`, and suffix forms used in some schemas.
 */
export function matchesBodyContentMatrixBlockTypename(
  typename: string | undefined,
  segment: string,
): boolean {
  if (!typename) {
    return false;
  }
  const entryForm = `${segment}_Entry`;
  const matrixFull = `${BODY_CONTENT_MATRIX_TYPENAME_PREFIX}${segment}${MATRIX_BLOCK_TYPE_SUFFIX}`;
  const blockTypeSuffix = `${segment}${MATRIX_BLOCK_TYPE_SUFFIX}`;
  if (typename === entryForm || typename === matrixFull) {
    return true;
  }
  if (typename.endsWith(entryForm) || typename.endsWith(blockTypeSuffix)) {
    return true;
  }
  return false;
}

export function isColumnContainerBodyContentBlockGraphqlTypename(
  typename: string | undefined,
): boolean {
  return matchesBodyContentMatrixBlockTypename(
    typename,
    BODY_CONTENT_MATRIX_BLOCK_SEGMENTS.columnContainer,
  );
}

export function isRichtextBodyContentBlockGraphqlTypename(
  typename: string | undefined,
): boolean {
  return matchesBodyContentMatrixBlockTypename(
    typename,
    BODY_CONTENT_MATRIX_BLOCK_SEGMENTS.richtext,
  );
}

export function isNavigationLinkBodyContentBlockGraphqlTypename(
  typename: string | undefined,
): boolean {
  return matchesBodyContentMatrixBlockTypename(
    typename,
    BODY_CONTENT_MATRIX_BLOCK_SEGMENTS.navigationLink,
  );
}

export function isHeadlineBodyContentBlockGraphqlTypename(
  typename: string | undefined,
): boolean {
  return matchesBodyContentMatrixBlockTypename(
    typename,
    BODY_CONTENT_MATRIX_BLOCK_SEGMENTS.headline,
  );
}

export function isImageComponentBodyContentBlockGraphqlTypename(
  typename: string | undefined,
): boolean {
  return matchesBodyContentMatrixBlockTypename(
    typename,
    BODY_CONTENT_MATRIX_BLOCK_SEGMENTS.imageComponent,
  );
}

const heroBodyContentExactTypenames = new Set<string>([
  CRAFT_GRAPHQL_TYPENAMES.heroComponentEntry,
  CRAFT_GRAPHQL_TYPENAMES.heroComponentContentBlock,
]);

/**
 * Whether a GraphQL `__typename` is a hero block inside the body matrix.
 * Covers `heroComponent_Entry`, `heroComponent_ContentBlock`, and
 * `bodyContent_heroComponent_BlockType`-style matrix names — do not duplicate this logic in route code.
 */
export function isHeroBodyContentBlockGraphqlTypename(
  typename: string | undefined,
): boolean {
  if (!typename) {
    return false;
  }
  if (heroBodyContentExactTypenames.has(typename)) {
    return true;
  }
  return matchesBodyContentMatrixBlockTypename(
    typename,
    CRAFT_FIELD_HANDLES.heroComponent,
  );
}

/** Shared asset selection for inline fragments (duplicated in GraphQL only via this string). */
export const CRAFT_GRAPHQL_ASSET_FIELDS = `
  ... on AssetInterface {
    url
    title
    alt
    width
    height
  }
`;

/**
 * Full field selection per bodyContent union member (`__typename` → fragment).
 * This is the only registry GraphQL needs: new block types in the CMS get a new key here.
 *
 * Keys must match the `__typename` returned for each block.
 */
export const bodyContentFragmentsByTypename: Record<string, string> = {
  [CRAFT_GRAPHQL_TYPENAMES.heroComponentEntry]: `
        ... on ${CRAFT_GRAPHQL_TYPENAMES.heroComponentEntry} {
          __typename
          id
          title
          ${CRAFT_FIELD_HANDLES.heroComponent} {
            ... on ${CRAFT_GRAPHQL_TYPENAMES.heroComponentContentBlock} {
              ${CRAFT_FIELD_HANDLES.heroTitle}
              ${CRAFT_FIELD_HANDLES.heroSubline}
              ${CRAFT_FIELD_HANDLES.heroImage} {
                ${CRAFT_GRAPHQL_ASSET_FIELDS}
              }
            }
          }
        }`,
  [`${BODY_CONTENT_MATRIX_BLOCK_SEGMENTS.richtext}_Entry`]: `
        ... on ${BODY_CONTENT_MATRIX_BLOCK_SEGMENTS.richtext}_Entry {
          id
          title
          ${CRAFT_FIELD_HANDLES.richtext} {
            html
          }
        }`,
  [`${BODY_CONTENT_MATRIX_BLOCK_SEGMENTS.navigationLink}_Entry`]: `
        ... on ${BODY_CONTENT_MATRIX_BLOCK_SEGMENTS.navigationLink}_Entry {
          id
          title
          slug
          uri
        }`,
  [`${BODY_CONTENT_MATRIX_BLOCK_SEGMENTS.headline}_Entry`]: `
        ... on ${BODY_CONTENT_MATRIX_BLOCK_SEGMENTS.headline}_Entry {
          __typename
          id
          title
${buildHeadlineNestedFieldSelection()}
        }`,
  [`${BODY_CONTENT_MATRIX_BLOCK_SEGMENTS.imageComponent}_Entry`]: `
        ... on ${BODY_CONTENT_MATRIX_BLOCK_SEGMENTS.imageComponent}_Entry {
          __typename
          id
          title
          ${CRAFT_FIELD_HANDLES.columnImage} {
            ${CRAFT_GRAPHQL_ASSET_FIELDS}
          }
        }`,
  [`${BODY_CONTENT_MATRIX_BLOCK_SEGMENTS.columnContainer}_Entry`]: `
        ... on ${BODY_CONTENT_MATRIX_BLOCK_SEGMENTS.columnContainer}_Entry {
          __typename
          id
          ${CRAFT_FIELD_HANDLES.columnSpan}
          ${CRAFT_FIELD_HANDLES.columnContainer} {
            ... on ${CRAFT_GRAPHQL_TYPENAMES.columnComponentEntry} {
              __typename
              id
              title
              slug
              uri
              ${buildColumnHeadlineFieldSelection()}
              ${CRAFT_FIELD_HANDLES.richtext} {
                html
              }
              ${CRAFT_FIELD_HANDLES.columnImage} {
                ${CRAFT_GRAPHQL_ASSET_FIELDS}
              }
            }
          }
        }`,
};
