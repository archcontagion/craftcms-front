/** CMS asset shape used by heroes, images, and column images. */
export type ContentAsset = {
  url: string;
  title: string | null;
  alt: string | null;
};

export type HeroComponentBlock = {
  id: string;
  title: string | null;
  heroTitle: string | null;
  heroSubline: string | null;
  heroImage: ContentAsset[];
};

export type HeadlineBlockModel = {
  blockId: string;
  title: string;
  titleTag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  styleTag: 'none' | 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
};

export type RichtextEntryModel = {
  id: string;
  title: string | null;
  richtextHtml: string | null;
};

export type SectionContainerEntry = {
  id: string;
  uri: string | null;
  slug: string | null;
  headline: string | null;
  columnRichtextHtml: string | null;
  imageComponent: ContentAsset[];
  linkHref?: string | null;
  linkLabel?: string | null;
  linkTarget?: string | null;
  buttonType?: 'primary' | 'secondary' | 'tertiary';
  buttonSize?: 'small' | 'medium' | 'large';
  buttonDisabled?: boolean;
  buttonLoading?: boolean;
};

export type ImageComponentEntryModel = {
  id: string;
  title: string | null;
  images: ContentAsset[];
};

export type NavigationLinkEntryModel = {
  id: string;
  title: string;
  uri: string | null;
  slug: string | null;
};

export type PageBlockView =
  | { kind: 'hero'; key: string; blocks: HeroComponentBlock[] }
  | { kind: 'headline'; key: string; headline: HeadlineBlockModel }
  | { kind: 'richtext'; key: string; entry: RichtextEntryModel }
  | {
      kind: 'columns';
      key: string;
      entries: SectionContainerEntry[];
      columnSpan: string | null;
    }
  | { kind: 'image'; key: string; entry: ImageComponentEntryModel }
  | { kind: 'navigationLink'; key: string; entry: NavigationLinkEntryModel }
  | { kind: 'richtextComponent'; key: string; html: string };

export type PageSectionView = {
  key: string;
  wrapperClasses: string[];
  blocks: PageBlockView[];
};

/**
 * Spacer size tokens used for consistent vertical spacing (top/bottom).
 * Maps to responsive utility classes (e.g. mt-s, mt-lg-m).
 */
export type SpacerSize =
  | ''
  | '0'
  | 'xxs'
  | 'xs'
  | 's'
  | 'm'
  | 'l'
  | 'xl'
  | 'xxl';

/** Section / matrix spacing fields (`paddingTop`, `marginTop`, …). */
export type SectionSpacingFields = {
  paddingTop: string | null;
  paddingBottom: string | null;
  marginTop: string | null;
  marginBottom: string | null;
};

export type NavLink = {href: string; label: string};

/** `slug` is the anchor `href` (matches `Header` / `Footer` prop names). */
export type SlugTitleLink = {slug: string; title: string};

export type FooterList = {
  title: string;
  link: SlugTitleLink[];
};

export type BlogEntry = {
  id: string;
  title: string;
  slug: string | null;
  uri: string | null;
  postDate: string | null;
};

/** Theme / project settings from API (CSS variable buckets). */
export type ProjectSettings = {
  globalSettings: Record<string, string>;
  typography: Record<string, string>;
  colors: Record<string, string>;
  button: Record<string, string>;
  image: Record<string, string>;
};

export type ThemeVariables = ProjectSettings;

export const SECTION_GRID_UNITS = 12;

export type SectionBlock = {
  id: string;
  type: string;
  columnIndex: number;
  colspan?: number;
  columnSpan?: number;
};

export type SectionProps = {
  blocks?: SectionBlock[];
  columns?: number;
};
