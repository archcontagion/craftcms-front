import type {ContentAsset, SectionContainerEntry} from '~~/types';
import {asRecord, stringOrNull, mapAsset} from '~/utils/block-mapping-helpers';

function parseColumnButtonType(
  raw: unknown,
): 'primary' | 'secondary' | 'tertiary' {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (value === 'secondary' || value === 'tertiary') {
    return value;
  }
  return 'primary';
}

function parseColumnButtonSize(raw: unknown): 'small' | 'medium' | 'large' {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (value === 'small' || value === 'large') {
    return value;
  }
  return 'medium';
}

function navLinkToColumnLink(buttonFields: Record<string, unknown>): {
  linkHref: string | null;
  linkLabel: string | null;
  linkTarget: string | null;
} {
  const navLink = asRecord(buttonFields.navLink);
  const linkHref =
    navLink && typeof navLink.url === 'string' && navLink.url.trim() !== ''
      ? navLink.url.trim()
      : null;
  const linkTarget =
    navLink &&
    typeof navLink.target === 'string' &&
    navLink.target.trim() !== ''
      ? navLink.target.trim()
      : null;
  let linkLabel: string | null = null;
  const buttonTitle = buttonFields.buttonTitle;
  if (typeof buttonTitle === 'string' && buttonTitle.trim() !== '') {
    linkLabel = buttonTitle.trim();
  } else if (
    navLink &&
    typeof navLink.label === 'string' &&
    navLink.label.trim() !== ''
  ) {
    linkLabel = navLink.label.trim();
  } else if (navLink) {
    const element = asRecord(navLink.element);
    const elementTitle = element?.title;
    if (typeof elementTitle === 'string' && elementTitle.trim() !== '') {
      linkLabel = elementTitle.trim();
    }
  }
  return {linkHref, linkLabel, linkTarget};
}

export function mapColumnEntry(column: unknown): SectionContainerEntry {
  const rec = asRecord(column);
  const fields = rec ? (asRecord(rec.fields) ?? {}) : {};
  const headlineObj = asRecord(fields.headline);
  const headlineInner = headlineObj ? asRecord(headlineObj.fields) : null;
  const headlineText =
    headlineInner && typeof headlineInner.headlinetitle === 'string'
      ? headlineInner.headlinetitle.trim() || null
      : null;

  const columnRichtextHtml =
    typeof fields.richtext === 'string' && fields.richtext.trim() !== ''
      ? fields.richtext
      : null;

  const imageField = fields.image;
  const imageList = Array.isArray(imageField) ? imageField : [];
  const imageComponent = imageList
    .map((item) => mapAsset(item))
    .filter((asset): asset is ContentAsset => asset != null);

  const buttonObj = asRecord(fields.button);
  const buttonFields = buttonObj ? (asRecord(buttonObj.fields) ?? {}) : {};
  const {linkHref, linkLabel, linkTarget} =
    navLinkToColumnLink(buttonFields);
  const hasCta = Boolean(linkHref && linkLabel);

  return {
    id: rec && rec.id != null ? String(rec.id) : 'column',
    uri: null,
    slug: stringOrNull(rec?.slug),
    headline: headlineText,
    columnRichtextHtml,
    imageComponent,
    linkHref: hasCta ? linkHref : null,
    linkLabel: hasCta ? linkLabel : null,
    linkTarget: hasCta ? linkTarget : null,
    buttonType: parseColumnButtonType(buttonFields.buttonType),
    buttonSize: parseColumnButtonSize(buttonFields.buttonSize),
    buttonDisabled: buttonFields.disabled === true,
    buttonLoading: buttonFields.loading === true,
  };
}

export function mapColumnContainerBlock(block: Record<string, unknown>): {
  entries: SectionContainerEntry[];
  columnSpan: string | null;
} | null {
  const fields = asRecord(block.fields);
  if (!fields) {
    return null;
  }
  const rawColumns = fields.columnContainer;
  const columns = Array.isArray(rawColumns) ? rawColumns : [];
  const entries = columns.map((column) => mapColumnEntry(column));
  const columnSpan = stringOrNull(fields.columnSpan);
  return {entries, columnSpan};
}
