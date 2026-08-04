import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

/**
 * Per-page SEO tags. Anything omitted falls back to the site defaults, so a
 * page can override only the title and still get a correct canonical, OG image
 * and description.
 *
 *   <SEO title="Shower Enclosures" description="..." />
 *
 * Note this is client-rendered. Google executes JS and will pick these up, but
 * WhatsApp/Twitter/LinkedIn crawlers do NOT — they only ever read the static
 * tags in index.html. Per-page social previews need SSR or prerendering; see
 * the note in index.html.
 */

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://ozobath.in').replace(/\/$/, '');
const DEFAULT_TITLE = 'OzoBath - Premium Shower Enclosures & Bathroom Fittings in India';
const DEFAULT_DESCRIPTION =
    'Shop premium shower enclosures, glass partitions, shower panels and designer bathroom fittings from OzoBath. Toughened glass, corrosion-resistant hardware and nationwide installation across India.';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

const SEO = ({
    title,
    description = DEFAULT_DESCRIPTION,
    image = DEFAULT_IMAGE,
    type = 'website',
    canonical,
    noindex = false,
    keywords,
    jsonLd,
    children,
}) => {
    const { pathname } = useLocation();

    // Titles are suffixed with the brand unless the page passes a full one.
    const fullTitle = title ? `${title} | OzoBath` : DEFAULT_TITLE;
    const url = canonical || `${SITE_URL}${pathname}`;
    const absoluteImage = image?.startsWith('http') ? image : `${SITE_URL}${image}`;

    return (
        <Helmet prioritizeSeoTags>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={url} />

            {noindex ? (
                <meta name="robots" content="noindex, nofollow" />
            ) : (
                <meta
                    name="robots"
                    content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
                />
            )}

            <meta property="og:type" content={type} />
            <meta property="og:site_name" content="OzoBath" />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={absoluteImage} />
            <meta property="og:locale" content="en_IN" />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={absoluteImage} />

            {jsonLd && (
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            )}

            {children}
        </Helmet>
    );
};

export default SEO;
