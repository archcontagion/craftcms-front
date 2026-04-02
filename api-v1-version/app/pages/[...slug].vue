<script setup lang="ts">
import {computed} from 'vue';
import {useAsyncData} from 'nuxt/app';
import {useRoute} from 'vue-router';
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import type {FooterList, NavLink, SlugTitleLink} from '~~/types';

const config = useRuntimeConfig();

const currentRoute = useRoute();

const apiClientBase = config.public.apiClientBase;

/** Matrix-style fields: list or numeric-keyed map → array of blocks. */
function blocksFromField(field: unknown): unknown[] {
  if (Array.isArray(field)) {
    return field;
  }
  if (field && typeof field === 'object') {
    return Object.values(field as Record<string, unknown>);
  }
  return [];
}

/**
 * `fields.navLink`: resolved body shape (`url`) or globals (`value` + `type`).
 * Skips unresolved `{entry:…}` placeholders until the API expands them.
 */
function navLinkFieldToLink(
  navLink: unknown,
  blockTitleFallback: string | undefined,
): NavLink | null {
  if (!navLink || typeof navLink !== 'object') {
    return null;
  }
  const link = navLink as {
    url?: unknown;
    label?: unknown;
    title?: unknown;
    value?: unknown;
  };

  let href = '';
  if (typeof link.url === 'string' && link.url.trim() !== '') {
    href = link.url.trim();
  } else if (typeof link.value === 'string') {
    const raw = link.value.trim();
    if (raw !== '' && !raw.startsWith('{entry:')) {
      href = raw;
    }
  }
  if (!href) {
    return null;
  }

  const fromBlock =
    typeof blockTitleFallback === 'string' && blockTitleFallback.trim() !== ''
      ? blockTitleFallback.trim()
      : '';
  const fromLinkLabel =
    typeof link.label === 'string' && link.label.trim() !== ''
      ? link.label.trim()
      : '';
  const fromLinkTitle =
    typeof link.title === 'string' && link.title.trim() !== ''
      ? link.title.trim()
      : '';
  const label =
    fromBlock !== ''
      ? fromBlock
      : fromLinkLabel !== ''
        ? fromLinkLabel
        : fromLinkTitle;
  if (!label) {
    return null;
  }
  return {href, label};
}

function navBlockToSlugTitleLink(block: unknown): SlugTitleLink | null {
  if (!block || typeof block !== 'object') {
    return null;
  }
  const item = block as {
    type?: unknown;
    title?: unknown;
    fields?: {navLink?: unknown};
  };
  if (item.type !== 'navigationLink') {
    return null;
  }
  const blockTitle =
    typeof item.title === 'string' && item.title.trim() !== ''
      ? item.title.trim()
      : undefined;
  const mapped = navLinkFieldToLink(item.fields?.navLink, blockTitle);
  if (!mapped) {
    return null;
  }
  return {slug: mapped.href, title: mapped.label};
}

/** `fields.navigationHeader` (map or array) → `{ slug, title }[]` for `Header`. */
function navigationHeaderToNavLinks(
  navigationHeader: unknown,
): SlugTitleLink[] {
  const result: SlugTitleLink[] = [];
  for (const block of blocksFromField(navigationHeader)) {
    const mapped = navBlockToSlugTitleLink(block);
    if (mapped) {
      result.push(mapped);
    }
  }
  return result;
}

/**
 * Footer globals: either `footerLinklist` blocks with `linkList`, or a flat list of
 * `navigationLink` blocks (expanded API) → `lists` for `Footer`.
 */
function navigationFooterToFooterLists(
  navigationFooter: unknown,
): FooterList[] {
  const topBlocks = blocksFromField(navigationFooter);
  const onlyNavigationLinks =
    topBlocks.length > 0 &&
    topBlocks.every(
      (block) =>
        block &&
        typeof block === 'object' &&
        (block as {type?: unknown}).type === 'navigationLink',
    );

  if (onlyNavigationLinks) {
    const linkItems: SlugTitleLink[] = [];
    for (const block of topBlocks) {
      const mapped = navBlockToSlugTitleLink(block);
      if (mapped) {
        linkItems.push(mapped);
      }
    }
    return linkItems.length > 0 ? [{title: '', link: linkItems}] : [];
  }

  const lists: FooterList[] = [];
  for (const listBlock of topBlocks) {
    if (!listBlock || typeof listBlock !== 'object') {
      continue;
    }
    const block = listBlock as {
      fields?: {listtitle?: unknown; linkList?: unknown};
    };
    const listTitleField = block.fields?.listtitle;
    const listTitle =
      typeof listTitleField === 'string' && listTitleField.trim() !== ''
        ? listTitleField.trim()
        : '';
    const linkItems: SlugTitleLink[] = [];
    for (const item of blocksFromField(block.fields?.linkList)) {
      const mapped = navBlockToSlugTitleLink(item);
      if (mapped) {
        linkItems.push(mapped);
      }
    }
    if (linkItems.length > 0) {
      lists.push({title: listTitle, link: linkItems});
    }
  }
  return lists;
}

function globalsPayloadFields(
  payload: unknown,
): {navigationHeader?: unknown; navigationFooter?: unknown} | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const root = payload as {fields?: unknown; data?: unknown};
  if (root.data && typeof root.data === 'object') {
    return globalsPayloadFields(root.data);
  }
  const fields = root.fields;
  if (!fields || typeof fields !== 'object') {
    return null;
  }
  return fields as {navigationHeader?: unknown; navigationFooter?: unknown};
}

const {data: headerData} = await useAsyncData('header-links', () =>
  $fetch<unknown>(apiClientBase + 'globals?handle=header'),
);

const {data: footerData} = await useAsyncData('footer-links', () =>
  $fetch<unknown>(apiClientBase + 'globals?handle=footer'),
);

const isHomeRoute = currentRoute.path === '/' || currentRoute.path === '';

/**
 * REST `uri` matches `entry.uri` in the CMS (no leading slash), e.g. `blog`, `blog/post-2`.
 * Vue Router paths are always like `/blog` — strip the leading slash for the API.
 */
function pathToEntryUri(routePath: string): string {
  const trimmed = routePath.trim();
  if (trimmed === '' || trimmed === '/') {
    return '';
  }
  return trimmed.replace(/^\/+/, '');
}

/**
 * Singles for the site homepage use the sentinel URI `__home__` in the CMS.
 * Requesting `entry` without `uri` often returns nothing — match the REST `uri` field.
 */
const HOME_ENTRY_URI = '__home__';

const pageRequestUrl = isHomeRoute
  ? `${apiClientBase}entry?uri=${encodeURIComponent(HOME_ENTRY_URI)}`
  : `${apiClientBase}entry?uri=${encodeURIComponent(pathToEntryUri(currentRoute.path))}`;

async function fetchEntryPayload(): Promise<unknown> {
  const primary = await $fetch<unknown>(pageRequestUrl);
  if (entryFromApiPayload(primary)) {
    return primary;
  }
  if (isHomeRoute) {
    const fallback = await $fetch<unknown>(`${apiClientBase}entry`);
    if (entryFromApiPayload(fallback)) {
      return fallback;
    }
  }
  return primary;
}

const {data: pagePayload, error: pageError} = await useAsyncData(
  `page-data-${currentRoute.path || '/'}`,
  fetchEntryPayload,
);

const pageFetchError = computed(() => pageError.value);

/**
 * REST payloads may expose the element as `entry`, `data.entry`, or the JSON root.
 */
function entryFromApiPayload(payload: unknown): unknown | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const root = payload as {entry?: unknown; data?: unknown};
  if (root.entry && typeof root.entry === 'object') {
    return root.entry;
  }
  if (root.data && typeof root.data === 'object') {
    const data = root.data as {entry?: unknown};
    if (data.entry && typeof data.entry === 'object') {
      return data.entry;
    }
    if (looksLikeEntry(data)) {
      return data;
    }
  }
  if (looksLikeEntry(payload)) {
    return payload;
  }
  return null;
}

function looksLikeEntry(value: object): boolean {
  const record = value as {id?: unknown; title?: unknown; fields?: unknown};
  return (
    (typeof record.id === 'number' || typeof record.id === 'string') &&
    (typeof record.title === 'string' || record.fields !== undefined)
  );
}

const pageEntry = computed(() => entryFromApiPayload(pagePayload.value));

const headerLinks = computed(() => {
  const fields = globalsPayloadFields(headerData.value);
  return navigationHeaderToNavLinks(fields?.navigationHeader);
});

const footerLinks = computed(() => {
  const fields = globalsPayloadFields(footerData.value);
  return navigationFooterToFooterLists(fields?.navigationFooter);
});
</script>

<template>
  <div class="container">
    <header>
      <Header :links="headerLinks" />
    </header>
    <main>
      <template v-if="pageEntry">
        <PageContent :entry="pageEntry" />
      </template>
      <template v-else-if="pageFetchError">
        <p>Unable to load this page from the CMS.</p>
      </template>
      <template v-else>
        <p>No entry found for this URL.</p>
      </template>
    </main>
    <footer>
      <Footer :lists="footerLinks" />
    </footer>
  </div>
</template>
