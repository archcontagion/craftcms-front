import {
  CRAFT_ENTRY_TYPE_HANDLES,
  CRAFT_FIELD_HANDLES,
  CRAFT_GRAPHQL_SECTIONS_BODY_ROW_TYPENAMES,
  CRAFT_GRAPHQL_TYPENAMES,
  CRAFT_KNOWN_ENTRY_SLUGS,
} from '../config/craft-cms';
import {buildResolvedPageEntry} from '../utils/page-by-slug-entry-response';
import {
  buildOptionalSectionsPageEntryFields,
  fetchMergedOptionalEntryByFieldParts,
  mapOptionalEntryToContentBlocks,
  mergeOptionalPageEntries,
} from '../utils/page-by-slug-optional-entry';
import {
  buildBodyContentSelection,
  discoverBodyContentTypenames,
  getDefaultBodyContentInnerSelection,
} from '../utils/craft-body-content-graphql';

import type {
  CraftContentBlock,
  CraftGraphqlResponse,
  CraftHomeByTypeResponse,
  CraftOptionalPageFieldsEntry,
  CraftOptionalPageFieldsResponse,
} from '../types/page-by-slug';

function resolveSectionRowGraphqlTypenames(
  craftSectionsBodyRowGraphqlTypenames: unknown,
): readonly string[] {
  if (
    typeof craftSectionsBodyRowGraphqlTypenames === 'string' &&
    craftSectionsBodyRowGraphqlTypenames.trim().length > 0
  ) {
    const parsedTypenames = craftSectionsBodyRowGraphqlTypenames
      .split(',')
      .map((typenamePart) => typenamePart.trim())
      .filter((typenamePart) => typenamePart.length > 0);
    if (parsedTypenames.length > 0) {
      return parsedTypenames;
    }
  }
  return CRAFT_GRAPHQL_SECTIONS_BODY_ROW_TYPENAMES;
}

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();
  const graphqlEndpoint = runtimeConfig.craftGraphqlEndpoint?.trim();
  const graphqlToken = runtimeConfig.craftGraphqlToken?.trim();

  if (!graphqlEndpoint) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing NUXT_CRAFT_GRAPHQL_ENDPOINT.',
    });
  }

  if (!graphqlToken) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing NUXT_CRAFT_GRAPHQL_TOKEN.',
    });
  }

  const queryParameters = getQuery(event);
  const rawSlugParameter = queryParameters.slug;

  const normalizedUri =
    typeof rawSlugParameter === 'string' && rawSlugParameter.length > 0
      ? rawSlugParameter
      : '__home__';
  const graphqlUriFilter =
    normalizedUri === '__home__' ? '__home__' : normalizedUri;
  const graphqlSlugFallback =
    normalizedUri === '__home__'
      ? CRAFT_KNOWN_ENTRY_SLUGS.home
      : normalizedUri;

  const coreGraphQlQuery = `
    query PageData($entryUri: [String]) {
      entries(uri: $entryUri, limit: 1) {
        id
        title
        slug
        uri
        ... on ${CRAFT_GRAPHQL_TYPENAMES.postEntry} {
          postDate
        }
      }
      blogEntries(limit: 6) {
        ... on ${CRAFT_GRAPHQL_TYPENAMES.postEntry} {
          id
          title
          slug
          uri
          postDate
        }
      }
      headerGlobalSet: globalSet(handle: "${CRAFT_FIELD_HANDLES.globalSetHeader}") {
        ... on ${CRAFT_GRAPHQL_TYPENAMES.headerGlobalSet} {
          ${CRAFT_FIELD_HANDLES.navigationHeader} {
            ... on ${CRAFT_GRAPHQL_TYPENAMES.navigationLinkEntry} {
              id
              title
              slug
              uri
            }
          }
        }
      }
      footerGlobalSet: globalSet(handle: "${CRAFT_FIELD_HANDLES.globalSetFooter}") {
        ... on ${CRAFT_GRAPHQL_TYPENAMES.footerGlobalSet} {
          ${CRAFT_FIELD_HANDLES.navigationFooter} {
            ... on ${CRAFT_GRAPHQL_TYPENAMES.navigationLinkEntry} {
              id
              title
              slug
              uri
            }
          }
        }
      }
    }
  `;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${graphqlToken}`,
  };

  const craftGraphqlResponse = await $fetch<CraftGraphqlResponse>(
    graphqlEndpoint,
    {
      method: 'POST',
      headers: requestHeaders,
      body: {
        query: coreGraphQlQuery,
        variables: {
          entryUri: [graphqlUriFilter],
        },
      },
    },
  );

  if (craftGraphqlResponse.errors?.length) {
    throw createError({
      statusCode: 502,
      statusMessage:
        craftGraphqlResponse?.errors?.[0]?.message ?? 'Unknown error',
    });
  }

  let entry = craftGraphqlResponse.data?.entries?.[0] ?? null;

  if (!entry) {
    const fallbackEntryBySlugQuery = `
      query PageDataFallback($entrySlug: [String]) {
        entries(slug: $entrySlug, limit: 1) {
          id
          title
          slug
          uri
          ... on ${CRAFT_GRAPHQL_TYPENAMES.postEntry} {
            postDate
          }
        }
      }
    `;

    const fallbackResponse = await $fetch<CraftGraphqlResponse>(
      graphqlEndpoint,
      {
        method: 'POST',
        headers: requestHeaders,
        body: {
          query: fallbackEntryBySlugQuery,
          variables: {
            entrySlug: [graphqlSlugFallback],
          },
        },
      },
    );

    if (!fallbackResponse.errors?.length) {
      entry = fallbackResponse.data?.entries?.[0] ?? null;
    }
  }

  if (!entry && normalizedUri === '__home__') {
    const homeByTypeQuery = `
      query HomeByType {
        entries(type: "${CRAFT_ENTRY_TYPE_HANDLES.home}", limit: 1) {
          id
          title
          slug
          uri
        }
      }
    `;

    const homeByTypeResponse = await $fetch<CraftHomeByTypeResponse>(
      graphqlEndpoint,
      {
        method: 'POST',
        headers: requestHeaders,
        body: {
          query: homeByTypeQuery,
        },
      },
    );

    if (!homeByTypeResponse.errors?.length) {
      entry = homeByTypeResponse.data?.entries?.[0] ?? null;
    }
  }

  if (
    entry &&
    normalizedUri === '__home__' &&
    entry.uri !== '__home__' &&
    entry.slug === CRAFT_KNOWN_ENTRY_SLUGS.home
  ) {
    const homeByTypeQuery = `
      query HomeByType {
        entries(type: "${CRAFT_ENTRY_TYPE_HANDLES.home}", limit: 1) {
          id
          title
          slug
          uri
        }
      }
    `;

    const homeByTypeResponse = await $fetch<CraftHomeByTypeResponse>(
      graphqlEndpoint,
      {
        method: 'POST',
        headers: requestHeaders,
        body: {
          query: homeByTypeQuery,
        },
      },
    );

    if (!homeByTypeResponse.errors?.length) {
      const homeEntry = homeByTypeResponse.data?.entries?.[0];
      if (homeEntry) {
        entry = homeEntry;
      }
    }
  }

  let contentBlocks: CraftContentBlock[] = [];
  let mergedOptionalEntry: CraftOptionalPageFieldsEntry | null = null;

  if (entry) {
    const sectionRowGraphqlTypenames = resolveSectionRowGraphqlTypenames(
      runtimeConfig.craftSectionsBodyRowGraphqlTypenames,
    );

    const optionalUriForNested =
      entry.uri === '__home__' ? '__home__' : (entry.uri ?? graphqlUriFilter);

    const shouldDiscoverBodyContentTypenames = true;

    let bodyContentInnerSelection = getDefaultBodyContentInnerSelection();
    if (shouldDiscoverBodyContentTypenames) {
      const discoveredTypenames = await discoverBodyContentTypenames(
        graphqlEndpoint,
        requestHeaders,
        optionalUriForNested,
        sectionRowGraphqlTypenames,
      );
      if (discoveredTypenames.length > 0) {
        bodyContentInnerSelection =
          buildBodyContentSelection(discoveredTypenames);
      }
    }

    const optionalSectionsEntryFields = buildOptionalSectionsPageEntryFields(
      bodyContentInnerSelection,
      sectionRowGraphqlTypenames,
    );

    const optionalFieldsGraphQlQuery = `
      query OptionalPageFields($entryUri: [String]) {
        entries(uri: $entryUri, limit: 1) {
          ... on ${CRAFT_GRAPHQL_TYPENAMES.homeEntry} {
            ${optionalSectionsEntryFields}
          }
          ... on ${CRAFT_GRAPHQL_TYPENAMES.aboutEntry} {
            ${optionalSectionsEntryFields}
          }
          ... on ${CRAFT_GRAPHQL_TYPENAMES.pageEntry} {
            ${optionalSectionsEntryFields}
          }
        }
      }
    `;

    const optionalFieldsBySlugQuery = `
      query OptionalPageFieldsBySlug($entrySlug: [String]) {
        entries(slug: $entrySlug, limit: 1) {
          ... on ${CRAFT_GRAPHQL_TYPENAMES.homeEntry} {
            ${optionalSectionsEntryFields}
          }
          ... on ${CRAFT_GRAPHQL_TYPENAMES.aboutEntry} {
            ${optionalSectionsEntryFields}
          }
          ... on ${CRAFT_GRAPHQL_TYPENAMES.pageEntry} {
            ${optionalSectionsEntryFields}
          }
        }
      }
    `;

    const optionalHomeByTypeQuery = `
      query OptionalHomeByType {
        entries(type: "${CRAFT_ENTRY_TYPE_HANDLES.home}", limit: 1) {
          ... on ${CRAFT_GRAPHQL_TYPENAMES.homeEntry} {
            ${optionalSectionsEntryFields}
          }
        }
      }
    `;

    const optionalAboutByTypeQuery = `
      query OptionalAboutByType {
        entries(type: "${CRAFT_ENTRY_TYPE_HANDLES.about}", limit: 1) {
          ... on ${CRAFT_GRAPHQL_TYPENAMES.aboutEntry} {
            ${optionalSectionsEntryFields}
          }
        }
      }
    `;

    const optionalPageByTypeQuery = `
      query OptionalPageByType($entrySlug: [String]) {
        entries(type: "${CRAFT_ENTRY_TYPE_HANDLES.page}", slug: $entrySlug, limit: 1) {
          ... on ${CRAFT_GRAPHQL_TYPENAMES.pageEntry} {
            ${optionalSectionsEntryFields}
          }
        }
      }
    `;

    mergedOptionalEntry = {
      id: entry.id,
    };

    const optionalFieldsResponse =
      await $fetch<CraftOptionalPageFieldsResponse>(graphqlEndpoint, {
        method: 'POST',
        headers: requestHeaders,
        body: {
          query: optionalFieldsGraphQlQuery,
          variables: {
            entryUri: [optionalUriForNested],
          },
        },
      });

    if (optionalFieldsResponse.errors?.length) {
      console.warn(
        '[page-by-slug] Optional page fields query failed:',
        optionalFieldsResponse.errors.map((graphqlError) => graphqlError.message).join('; '),
      );
    }

    if (!optionalFieldsResponse.errors?.length) {
      const optionalEntry = optionalFieldsResponse.data?.entries?.[0];
      mergedOptionalEntry = mergeOptionalPageEntries(
        mergedOptionalEntry,
        optionalEntry,
      );
    }

    contentBlocks = mapOptionalEntryToContentBlocks(
      mergedOptionalEntry,
      entry.id,
    );

    if (contentBlocks.length === 0 && entry.slug && entry.slug.length > 0) {
      const optionalBySlugResponse =
        await $fetch<CraftOptionalPageFieldsResponse>(graphqlEndpoint, {
          method: 'POST',
          headers: requestHeaders,
          body: {
            query: optionalFieldsBySlugQuery,
            variables: {
              entrySlug: [entry.slug],
            },
          },
        });

      if (!optionalBySlugResponse.errors?.length) {
        const optionalEntry = optionalBySlugResponse.data?.entries?.[0];
        mergedOptionalEntry = mergeOptionalPageEntries(
          mergedOptionalEntry,
          optionalEntry,
        );
        contentBlocks = mapOptionalEntryToContentBlocks(
          mergedOptionalEntry,
          entry.id,
        );
      }
    }

    if (contentBlocks.length === 0 && entry.uri === '__home__') {
      const optionalByTypeResponse =
        await $fetch<CraftOptionalPageFieldsResponse>(graphqlEndpoint, {
          method: 'POST',
          headers: requestHeaders,
          body: {
            query: optionalHomeByTypeQuery,
          },
        });

      if (!optionalByTypeResponse.errors?.length) {
        const optionalEntry = optionalByTypeResponse.data?.entries?.[0];
        mergedOptionalEntry = mergeOptionalPageEntries(
          mergedOptionalEntry,
          optionalEntry,
        );
        contentBlocks = mapOptionalEntryToContentBlocks(
          mergedOptionalEntry,
          entry.id,
        );
      }
    }

    if (contentBlocks.length === 0 && entry.slug === CRAFT_KNOWN_ENTRY_SLUGS.about) {
      const optionalAboutByTypeResponse =
        await $fetch<CraftOptionalPageFieldsResponse>(graphqlEndpoint, {
          method: 'POST',
          headers: requestHeaders,
          body: {
            query: optionalAboutByTypeQuery,
          },
        });

      if (!optionalAboutByTypeResponse.errors?.length) {
        const optionalEntry = optionalAboutByTypeResponse.data?.entries?.[0];
        mergedOptionalEntry = mergeOptionalPageEntries(
          mergedOptionalEntry,
          optionalEntry,
        );
        contentBlocks = mapOptionalEntryToContentBlocks(
          mergedOptionalEntry,
          entry.id,
        );
      }
    }

    if (
      contentBlocks.length === 0 &&
      entry.slug &&
      normalizedUri.startsWith(`${CRAFT_ENTRY_TYPE_HANDLES.page}/`)
    ) {
      const optionalPageByTypeResponse =
        await $fetch<CraftOptionalPageFieldsResponse>(graphqlEndpoint, {
          method: 'POST',
          headers: requestHeaders,
          body: {
            query: optionalPageByTypeQuery,
            variables: {
              entrySlug: [entry.slug],
            },
          },
        });

      if (!optionalPageByTypeResponse.errors?.length) {
        const optionalEntry = optionalPageByTypeResponse.data?.entries?.[0];
        mergedOptionalEntry = mergeOptionalPageEntries(
          mergedOptionalEntry,
          optionalEntry,
        );
        contentBlocks = mapOptionalEntryToContentBlocks(
          mergedOptionalEntry,
          entry.id,
        );
      }
    }

    if (contentBlocks.length === 0) {
      const mergedByFieldParts = await fetchMergedOptionalEntryByFieldParts(
        graphqlEndpoint,
        requestHeaders,
        entry.id,
      );
      if (mergedByFieldParts) {
        mergedOptionalEntry = mergeOptionalPageEntries(
          mergedOptionalEntry,
          mergedByFieldParts,
        );
        contentBlocks = mapOptionalEntryToContentBlocks(
          mergedOptionalEntry,
          entry.id,
        );
      }
    }
  }

  return {
    entry: entry
      ? buildResolvedPageEntry(entry, contentBlocks, mergedOptionalEntry)
      : null,
    headerLinks:
      craftGraphqlResponse.data?.headerGlobalSet?.navigationHeader ?? [],
    footerLinks:
      craftGraphqlResponse.data?.footerGlobalSet?.navigationFooter ?? [],
    blogEntries: craftGraphqlResponse.data?.blogEntries ?? [],
  };
});
