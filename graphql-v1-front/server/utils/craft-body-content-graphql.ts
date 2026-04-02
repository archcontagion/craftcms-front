import {
  CRAFT_GRAPHQL_SECTIONS_BODY_ROW_TYPENAMES,
  CRAFT_GRAPHQL_TYPENAMES,
  bodyContentFragmentsByTypename,
  buildSectionsMatrixSelectionForBodyContent,
} from '../config/craft-cms';
import {normalizeMatrixFieldToArray} from './page-by-slug-body-content-map';

/** Re-export — registry lives in `server/config/craft-cms.ts`. */
export { bodyContentFragmentsByTypename };

const BODY_CONTENT_DISCOVERY_INNER = `
              ... on EntryInterface {
                __typename
              }
            `;

function buildBodyContentDiscoveryQuery(
  sectionRowTypenames: readonly string[],
): string {
  const sectionsSelection = buildSectionsMatrixSelectionForBodyContent(
    BODY_CONTENT_DISCOVERY_INNER,
    sectionRowTypenames,
  );
  return `
  query BodyContentDiscovery($entryUri: [String]) {
    entries(uri: $entryUri, limit: 1) {
      ... on ${CRAFT_GRAPHQL_TYPENAMES.homeEntry} {
        id
        ${sectionsSelection}
      }
      ... on ${CRAFT_GRAPHQL_TYPENAMES.aboutEntry} {
        id
        ${sectionsSelection}
      }
      ... on ${CRAFT_GRAPHQL_TYPENAMES.pageEntry} {
        id
        ${sectionsSelection}
      }
    }
  }
`;
}

type DiscoveryFetchResponse = {
  data?: {
    entries?: Array<{
      sections?: unknown;
    }>;
  };
  errors?: Array<{message: string}>;
};

/**
 * Build the inner `bodyContent { … }` selection.
 *
 * Craft often returns matrix `__typename` values like `bodyContent_heroComponent_BlockType`
 * while fragments are keyed as `heroComponent_Entry`. Using only “matched” fragments then
 * omitted other block shapes and broke the query or returned empty unions — so we always
 * emit **all** registered inline fragments. Discovery still logs unknown typenames for devs.
 */
export function buildBodyContentSelection(discoveredTypenames: string[]): string {
  const registeredKeys = Object.keys(bodyContentFragmentsByTypename);
  const unique = [...new Set(discoveredTypenames.filter(Boolean))];
  const knownKeySet = new Set(registeredKeys);
  const unknown = unique.filter((typename) => !knownKeySet.has(typename));
  if (unknown.length > 0) {
    console.warn(
      '[craft-body-content] bodyContent __typename(s) not matching registry keys (fragments still all sent):',
      unknown,
    );
  }

  return registeredKeys.map((key) => bodyContentFragmentsByTypename[key]).join('\n');
}

/** Full matrix selection (all registered block types). Used as fallback and for field-part merge. */
export function getDefaultBodyContentInnerSelection(): string {
  return buildBodyContentSelection([]);
}

/**
 * Minimal query — returns each block’s `__typename` so we can assemble a smaller full query.
 */
export async function discoverBodyContentTypenames(
  graphqlEndpoint: string,
  requestHeaders: Record<string, string>,
  entryUri: string,
  sectionRowTypenames: readonly string[] = CRAFT_GRAPHQL_SECTIONS_BODY_ROW_TYPENAMES,
): Promise<string[]> {
  const response = await $fetch<DiscoveryFetchResponse>(graphqlEndpoint, {
    method: 'POST',
    headers: requestHeaders,
    body: {
      query: buildBodyContentDiscoveryQuery(sectionRowTypenames),
      variables: {
        entryUri: [entryUri],
      },
    },
  });

  if (response.errors?.length) {
    return [];
  }

  const sectionsField = response.data?.entries?.[0]?.sections;
  const sectionBlocks = normalizeMatrixFieldToArray(sectionsField);
  const discoveredTypenames: string[] = [];
  for (const sectionBlock of sectionBlocks) {
    const sectionRow = sectionBlock as {
      bodyContent?: unknown;
    };
    const rawBlocks = sectionRow.bodyContent;
    if (rawBlocks == null) {
      continue;
    }
    const blocksList = Array.isArray(rawBlocks)
      ? rawBlocks
      : Object.values(rawBlocks as Record<string, {__typename: string}>);
    for (const block of blocksList) {
      if (typeof block?.__typename === 'string') {
        discoveredTypenames.push(block.__typename);
      }
    }
  }
  return discoveredTypenames;
}
