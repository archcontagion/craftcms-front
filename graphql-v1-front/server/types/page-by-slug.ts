export type CraftAsset = {
  url: string;
  title: string | null;
  alt: string | null;
  width: number | null;
  height: number | null;
};

export type CraftLinkEntry = {
  id: string;
  title: string;
  uri: string | null;
  slug: string | null;
};

export type CraftHeroComponentBlock = {
  id: string;
  title: string | null;
  heroTitle: string | null;
  heroSubline: string | null;
  heroImage: CraftAsset[];
};

export type CraftSectionContainerEntry = {
  id: string;
  slug: string | null;
  uri: string | null;
  /** Plain-text child field on `columnComponent_Entry` — drives `<Headline>` only (not native entry `title`). */
  headline: string | null;
  columnRichtextHtml: string | null;
  imageComponent: CraftAsset[];
};

export type CraftRichtextEntry = {
  id: string;
  title: string | null;
  richtextHtml: string | null;
};

export type CraftNavigationLinkBlock = {
  id: string;
  title: string;
  uri: string | null;
  slug: string | null;
};

export type CraftImageComponentEntry = {
  id: string;
  title: string | null;
  images: CraftAsset[];
};

/** Dropdown values from Craft section “Design” fields (padding/margin). */
export type CraftSectionSpacingToken = string;

/** Spacing from one `sections` matrix row (`sectionComponent`), shared by all blocks in that row. */
export type CraftSectionRowSpacing = {
  paddingTop: CraftSectionSpacingToken | null;
  paddingBottom: CraftSectionSpacingToken | null;
  marginTop: CraftSectionSpacingToken | null;
  marginBottom: CraftSectionSpacingToken | null;
};

export type CraftContentSectionGroup = {
  id: string;
  paddingTop: CraftSectionSpacingToken | null;
  paddingBottom: CraftSectionSpacingToken | null;
  marginTop: CraftSectionSpacingToken | null;
  marginBottom: CraftSectionSpacingToken | null;
  contentBlocks: CraftContentBlock[];
};

export type CraftBlogEntry = {
  id: string;
  title: string;
  uri: string | null;
  slug: string | null;
  postDate: string | null;
};

export type CraftPageEntry = {
  id: string;
  title: string;
  slug: string | null;
  uri: string | null;
  postDate?: string | null;
  heroComponentFieldEntries?: CraftHeroComponentBlock[];
  columnContainerFieldEntries?: CraftSectionContainerEntry[];
  contentBlocks?: CraftContentBlock[];
  /** One item per `sections` matrix row (`sectionComponent`), with spacing + inner body blocks. */
  contentSections?: CraftContentSectionGroup[];
};

export type CraftContentBlock =
  | {
      id: string;
      blockType: 'heroComponent_ContentBlock';
      heroBlock: CraftHeroComponentBlock;
    }
  | {
      id: string;
      blockType: 'columnComponent';
      sectionEntries: CraftSectionContainerEntry[];
      /** Plain text from CMS, e.g. `6-6`, `4-8` — 12-column grid units per column. */
      columnSpan?: string | null;
      /** Present when this block came from a `sections` row — drives `CraftSectionContainer` spacers. */
      sectionSpacing?: CraftSectionRowSpacing | null;
    }
  | {
      id: string;
      blockType: 'richtext_Entry';
      richtextEntry: CraftRichtextEntry;
    }
  | {
      id: string;
      blockType: 'navigationLink_Entry';
      navigationLinkEntry: CraftNavigationLinkBlock;
    }
  | {
      id: string;
      blockType: 'imageComponent_Entry';
      imageEntry: CraftImageComponentEntry;
    };

export type CraftGraphqlResponse = {
  data?: {
    entries?: CraftPageEntry[];
    blogEntries?: CraftBlogEntry[];
    headerGlobalSet?: {
      navigationHeader?: CraftLinkEntry[];
    } | null;
    footerGlobalSet?: {
      navigationFooter?: CraftLinkEntry[];
    } | null;
  };
  errors?: Array<{message: string}>;
};

export type CraftOptionalColumnGraphql = {
  id: string;
  /** Native entry title — fallback when the `headline` content block is empty. */
  title?: string | null;
  slug: string | null;
  uri: string | null;
  headline?: string | null;
  richtext?: {html: string | null} | null;
  /** Asset field handle may be `image` (see `CRAFT_FIELD_HANDLES.columnImage`). */
  image?: CraftAsset[] | CraftAsset | null;
  columnImage?: CraftAsset[] | CraftAsset | null;
};

export type CraftOptionalBodyContentGraphql = {
  __typename?: string;
  id?: string;
  title?: string | null;
  /** Body matrix `headline_Entry` or nested column headline blocks. */
  headline?: unknown;
  richtext?: {html: string | null} | null;
  uri?: string | null;
  slug?: string | null;
  /** Nested column blocks: field handle is `columnContainer` on `columnContainer_Entry` (not `columnComponent`). */
  columnContainer?: CraftOptionalColumnGraphql[] | null;
  columnComponent?: CraftOptionalColumnGraphql[] | null;
  /**
   * Hero block may expose fields on the block (`heroTitle` …) or nested under `heroComponent`
   * (field handle on the block type), depending on the field layout.
   */
  heroComponent?: {
    heroTitle?: string | null;
    /** Schema handle is `subline` (see `CRAFT_FIELD_HANDLES.heroSubline`). */
    subline?: string | null;
    heroSubline?: string | null;
    heroImage?: CraftAsset[];
  } | null;
  heroTitle?: string | null;
  /** Hero ContentBlock field handle in schema is `subline`. */
  subline?: string | null;
  heroSubline?: string | null;
  heroImage?: CraftAsset[];
  /** Standalone image block (`imageComponent_Entry`) uses asset field `image`. */
  image?: CraftAsset[] | CraftAsset | null;
  /** `columnContainer_Entry` — width pattern for 12-column grid. */
  columnSpan?: string | null;
};

export type CraftOptionalPageFieldsEntry = {
  id: string;
  [fieldHandle: string]: unknown;
};

export type CraftOptionalPageFieldsResponse = {
  data?: {
    entries?: CraftOptionalPageFieldsEntry[];
  };
  errors?: Array<{message: string}>;
};

export type CraftHomeByTypeResponse = {
  data?: {
    entries?: CraftPageEntry[];
  };
  errors?: Array<{message: string}>;
};

export type BlockFieldDefinition = {
  /** Field on home/about whose matrix blocks contain the body (e.g. `sections`). */
  fieldHandle: string;
  querySelection: string;
  mapToContentBlocks: (
    rawFieldValue: unknown,
    pageEntryId: string | null,
  ) => CraftContentBlock[];
};
