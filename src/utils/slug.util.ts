/**
 * Converts a human title into a filesystem-friendly slug.
 * e.g. "Weekly product sync!" → "weekly-product-sync".
 */
export const slugify = (
  value: string,
  fallback = 'meetly-recording'
): string => {
  const slug = value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug : fallback;
};
