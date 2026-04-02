<script setup lang="ts">
import {navigateTo, useAsyncData} from 'nuxt/app';
import {useRoute} from 'vue-router';
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';
import CraftDynamicContentBlocks from '../components/CraftDynamicContentBlocks.vue';
import CraftBlogStructure from '../components/CraftBlogStructure.vue';
import CraftBlogEntry from '../components/CraftBlogEntry.vue';
import {
  normalizeSlugSegmentsFromRoute,
  resolveCraftNavigationHref,
  type CraftNavigationLink,
} from '../utils/craft-slug-page';

type CraftAsset = {
  url: string;
  title: string | null;
  alt: string | null;
};

type HeroComponentBlock = {
  id: string;
  title: string | null;
  heroTitle: string | null;
  heroSubline: string | null;
  heroImage: CraftAsset[];
};

type SectionContainerEntry = {
  id: string;
  uri: string | null;
  slug: string | null;
  headline: string | null;
  columnRichtextHtml: string | null;
  imageComponent: CraftAsset[];
};

type RichtextEntry = {
  id: string;
  title: string | null;
  richtextHtml: string | null;
};

type BodyNavigationLinkEntry = {
  id: string;
  title: string;
  uri: string | null;
  slug: string | null;
};

type ImageComponentEntry = {
  id: string;
  title: string | null;
  images: CraftAsset[];
};

type BlogEntry = {
  id: string;
  title: string;
  uri: string | null;
  slug: string | null;
  postDate: string | null;
};

type SectionRowSpacing = {
  paddingTop: string | null;
  paddingBottom: string | null;
  marginTop: string | null;
  marginBottom: string | null;
};

type ContentBlock =
  | {
      id: string;
      blockType: 'heroComponent_ContentBlock';
      heroBlock: HeroComponentBlock;
    }
  | {
      id: string;
      blockType: 'columnComponent';
      sectionEntries: SectionContainerEntry[];
      columnSpan?: string | null;
      sectionSpacing?: SectionRowSpacing | null;
    }
  | {
      id: string;
      blockType: 'richtext_Entry';
      richtextEntry: RichtextEntry;
    }
  | {
      id: string;
      blockType: 'navigationLink_Entry';
      navigationLinkEntry: BodyNavigationLinkEntry;
    }
  | {
      id: string;
      blockType: 'imageComponent_Entry';
      imageEntry: ImageComponentEntry;
    };

type ContentSectionGroup = {
  id: string;
  paddingTop: string | null;
  paddingBottom: string | null;
  marginTop: string | null;
  marginBottom: string | null;
  contentBlocks: ContentBlock[];
};

type PageApiResponse = {
  entry: {
    id: string;
    title: string;
    slug: string | null;
    uri: string | null;
    postDate?: string | null;
    heroComponentFieldEntries?: HeroComponentBlock[];
    columnContainerFieldEntries?: SectionContainerEntry[];
    contentBlocks?: ContentBlock[];
    contentSections?: ContentSectionGroup[];
  } | null;
  headerLinks: CraftNavigationLink[];
  footerLinks: CraftNavigationLink[];
  blogEntries: BlogEntry[];
};

const currentRoute = useRoute();
const slugParameter = currentRoute.params.slug as string[] | string | undefined;
const slugSegments = normalizeSlugSegmentsFromRoute(slugParameter);
const normalizedSlug =
  slugSegments.length > 0 ? slugSegments.join('/') : '__home__';

if (normalizedSlug === 'home') {
  await navigateTo('/');
}

const isBlogSlugChosen =
  normalizedSlug === 'blog' || normalizedSlug.startsWith('blog/');
const isSingleBlogSlugChosen = normalizedSlug.startsWith('blog/');
const {data: pageResponse, error: pageError} =
  await useAsyncData<PageApiResponse>(`page-${normalizedSlug}`, async () => {
    const encodedSlug = encodeURIComponent(normalizedSlug);
    return await $fetch<PageApiResponse>(
      `/api/page-by-slug?slug=${encodedSlug}`,
    );
  });

type NavigationItem = {
  href: string;
  label: string;
};

const headerLinks = computed<NavigationItem[]>(() => {
  const fetchedHeaderLinks = pageResponse.value?.headerLinks ?? [];
  const mappedHeaderLinks = fetchedHeaderLinks.map((navigationLink) => ({
    href: resolveCraftNavigationHref(navigationLink),
    label: navigationLink.title,
  }));
  const hasBlogLink = mappedHeaderLinks.some(
    (navigationItem) => navigationItem.href === '/blog',
  );

  if (hasBlogLink) {
    return mappedHeaderLinks;
  }

  return [
    ...mappedHeaderLinks,
    {
      href: '/blog',
      label: 'Blog',
    },
  ];
});

const footerLinks = computed<NavigationItem[]>(() => {
  const fetchedFooterLinks = pageResponse.value?.footerLinks ?? [];
  return fetchedFooterLinks.map((navigationLink) => ({
    href: resolveCraftNavigationHref(navigationLink),
    label: navigationLink.title,
  }));
});

const singleBlogEntry = computed<BlogEntry | null>(() => {
  const fetchedEntry = pageResponse.value?.entry;
  if (!fetchedEntry) {
    return null;
  }

  return {
    id: fetchedEntry.id,
    title: fetchedEntry.title,
    uri: fetchedEntry.uri,
    slug: fetchedEntry.slug,
    postDate: fetchedEntry.postDate ?? null,
  };
});
</script>

<template>
  <div class="container">
    <header>
      <Header :links="headerLinks" />
    </header>
    <main>
      <template v-if="pageResponse?.entry">
        <CraftBlogEntry
          v-if="isSingleBlogSlugChosen && singleBlogEntry"
          :entry="singleBlogEntry"
        />
        <template v-else>
          <CraftDynamicContentBlocks
            :content-blocks="pageResponse.entry.contentBlocks ?? []"
            :content-sections="pageResponse.entry.contentSections"
          />
        </template>
        <CraftBlogStructure
          v-if="isBlogSlugChosen && !isSingleBlogSlugChosen"
          :posts="pageResponse.blogEntries ?? []"
        />
      </template>
      <template v-else-if="pageError">
        <p>Unable to load this page from Craft CMS.</p>
      </template>
      <template v-else>
        <p>No Craft entry found for this URL.</p>
      </template>
    </main>
    <footer>
      <Footer :links="footerLinks" />
    </footer>
  </div>
</template>

<style scoped>
.container {
  max-width: 1920px;
  margin: 0 auto;
}
</style>
