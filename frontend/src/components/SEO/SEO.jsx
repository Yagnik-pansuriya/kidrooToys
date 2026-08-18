import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://kidroo.in';
const SITE_NAME = 'Kidroo Toys';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
const DEFAULT_DESCRIPTION = 'Shop premium kids toys online at Kidroo Toys. Discover educational toys, wooden toys, Montessori toys, building blocks, baby toys and more across India.';

const normalizeCanonical = (url) => {
  if (!url) return `${SITE_URL}/`;
  try {
    if (url.startsWith('/')) {
      return `${SITE_URL}${url}`;
    }
    const parsed = new URL(url);
    return `${SITE_URL}${parsed.pathname}${parsed.search}`;
  } catch {
    return `${SITE_URL}/`;
  }
};

const SEO = ({
  title,
  description,
  keywords,
  canonical,
  canonicalUrl, // fallback
  image,
  ogImage, // fallback
  type = 'website',
  ogType, // fallback
  ogTitle,
  ogDescription,
  twitterCard = 'summary_large_image',
  noIndex = false,
  jsonLd,
  children,
}) => {
  const finalTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Where Imagination Comes to Play 🧸`;
  const finalDescription = description || DEFAULT_DESCRIPTION;
  const finalCanonical = normalizeCanonical(canonical || canonicalUrl);
  const finalImage = image || ogImage || DEFAULT_IMAGE;
  const finalType = type || ogType || 'website';
  const finalOgTitle = ogTitle || finalTitle;
  const finalOgDescription = ogDescription || finalDescription;

  const jsonLdList = jsonLd
    ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).filter((item) => item && typeof item === 'object')
    : [];

  return (
    <Helmet>
      {/* Title */}
      <title>{finalTitle}</title>

      {/* Meta tags */}
      <meta name="description" content={finalDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'} />
      <meta name="googlebot" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'} />

      {/* Canonical URL */}
      <link rel="canonical" href={finalCanonical} />

      {/* Open Graph */}
      <meta property="og:type" content={finalType} />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={finalCanonical} />
      {finalImage && <meta property="og:image" content={finalImage} />}
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={finalOgTitle} />
      <meta name="twitter:description" content={finalOgDescription} />
      {finalImage && <meta name="twitter:image" content={finalImage} />}

      {/* JSON-LD Structured Data */}
      {jsonLdList.map((item, index) => (
        <script key={`jsonld-${index}`} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}

      {children}
    </Helmet>
  );
};

export default SEO;
