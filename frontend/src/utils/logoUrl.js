/**
 * Returns a logo URL with its transparent padding cropped away.
 *
 * Uploaded logos are often square canvases with the wordmark in the middle,
 * which makes them render tiny inside a short header. For Cloudinary URLs we
 * add the `e_trim` transformation so the image is cropped to its content.
 * Non-Cloudinary URLs are returned unchanged. Safe to call more than once.
 */
export function trimmedLogoUrl(url) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  if (url.includes('/upload/e_trim')) return url;
  return url.replace('/upload/', '/upload/e_trim/');
}
