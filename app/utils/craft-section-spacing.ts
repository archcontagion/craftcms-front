/**
 * Builds BEM modifier classes for `.section__container-inner` from Craft dropdown
 * values (none, xxs, xs, sm, md, lg, xl, xxl). Your SCSS should define rules such as
 * `.section__container-inner--padding-top-lg { … }`.
 */

const SECTION_CONTAINER_INNER_BASE = 'section__container-inner';

export type CraftSectionSpacingFields = {
  paddingTop: string | null;
  paddingBottom: string | null;
  marginTop: string | null;
  marginBottom: string | null;
};

function spacingTokenForClassName(raw: string): string {
  return raw.trim().replace(/[^a-z0-9-]/gi, '');
}

/**
 * Class list: base `section__container-inner` plus one modifier per set side,
 * e.g. `section__container-inner--margin-top-xxl`.
 */
export function craftSectionSpacingToClassList(
  spacing: CraftSectionSpacingFields,
): string[] {
  const classes = [SECTION_CONTAINER_INNER_BASE];
  if (spacing.paddingTop) {
    const token = spacingTokenForClassName(spacing.paddingTop);
    if (token.length > 0) {
      classes.push(
        `${SECTION_CONTAINER_INNER_BASE}--padding-top-${token}`,
      );
    }
  }
  if (spacing.paddingBottom) {
    const token = spacingTokenForClassName(spacing.paddingBottom);
    if (token.length > 0) {
      classes.push(
        `${SECTION_CONTAINER_INNER_BASE}--padding-bottom-${token}`,
      );
    }
  }
  if (spacing.marginTop) {
    const token = spacingTokenForClassName(spacing.marginTop);
    if (token.length > 0) {
      classes.push(`${SECTION_CONTAINER_INNER_BASE}--margin-top-${token}`);
    }
  }
  if (spacing.marginBottom) {
    const token = spacingTokenForClassName(spacing.marginBottom);
    if (token.length > 0) {
      classes.push(
        `${SECTION_CONTAINER_INNER_BASE}--margin-bottom-${token}`,
      );
    }
  }
  return classes;
}
