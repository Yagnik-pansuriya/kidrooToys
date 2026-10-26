// Google shows ~60 characters; cut long names on a word boundary
const capTitle = (text) => {
  if (text.length <= 70) return text;
  return text
    .slice(0, 66)
    .replace(/\s+\S*$/, '')
    .replace(/(\s+(&|and|with|for|of|-|\|))+$/i, '')
    .trim();
};

/**
 * Product names are long marketplace-style strings like
 * "Kidroo Hover Ball for Kids | Battery Operated ... | 3-10 Years - Blue".
 * For <title> we keep the first segment plus a short variant suffix
 * ("- Blue", "- 5 Rattles") so sibling variants get distinct titles.
 *
 * Mirrors shortProductTitle() in kidrooBackend/src/routes/seoRenderRoutes.ts —
 * the server-rendered title and this one must match.
 */
export const shortProductTitle = (name = '') => {
  const clean = String(name).replace(/\s+/g, ' ').trim();
  const head = clean.split(' | ')[0].trim();
  const variantMatch = clean.match(/\s-\s([^|]{1,24})$/);
  const variant = variantMatch ? variantMatch[1].trim() : '';
  if (variant && head !== clean && !head.toLowerCase().endsWith(variant.toLowerCase())) {
    return capTitle(`${head} - ${variant}`);
  }
  return capTitle(head);
};

export const titleCase = (text = '') =>
  String(text).trim().replace(/\s+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
