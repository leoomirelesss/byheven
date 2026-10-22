# Technical SEO — launched 22 October 2026

Scope: the existing eight public pages. No layout, animation, timing, visible copy or navigation changes.

## Implemented

- Unique, service-led titles and descriptions in static HTML, with the exact brand `by ˈHevən`.
- Self-referencing production canonicals and consistent Open Graph URLs.
- Open Graph and Twitter large-image metadata on every page, with absolute URLs, accurate dimensions and image descriptions.
- Lightweight JPEG share copies of the approved project heroes; the home uses the existing phone artwork. These assets do not replace on-page images or load as additional page media.
- Home JSON-LD: Organization, WebSite, WebPage, three Service entities and an OfferCatalog linked to those services. The organization uses verified existing contact details and social links, not a fabricated storefront address, reviews or ratings.
- Project index: CollectionPage and ItemList for the six visible projects.
- Case pages: WebPage, CreativeWork, ImageObject and BreadcrumbList. D’OR OS remains an MVP; Academic Quest remains a prototype. No invented outcomes, app-store listings, prices or publication dates.
- Descriptive hero and gallery image alternatives. Decorative images retain empty alternatives. Gallery descriptions survive the reduced-motion/mobile path without changing animation logic.
- Public robots.txt allows crawling and declares the eight-URL sitemap. Each URL has a fixed lastmod of 2026-10-22, the actual public release of the redesigned content. Update a URL’s lastmod only after a significant content change; do not stamp every build.
- Build-time SEO guard checks metadata uniqueness, canonicals, real JPEG signatures/dimensions, image attributes, graph references, project destinations and prototype status. It fails the build on regressions.

## Validation and limits

Run `node scripts/verify-seo.mjs .` for source SEO checks. `npm run build` runs the existing checks, public-asset verification and SEO verification against the actual output.

Static body comparison allows only image alternative attributes to change. All style blocks, visible copy, links and motion settings are preserved.

These are source and build checks, not a Google Rich Results Test certification, a ranking forecast or a measured Core Web Vitals result. Graph entities and relations can be valid without qualifying for a Google rich-result feature.

## Public launch verification — 22 October 2026

- Approved source 25caef3 was released to main in merge commit 3f03d1e; production deployment dpl_DF5pdgxBMgasYBJbipj5PMCNFea3 is READY.
- https://byheven.com/ redirects to https://www.byheven.com/. Both domains are verified and assigned to the existing Vercel project. Preview protection remains enabled.
- All eight canonical pages return public HTTP 200 and the approved source; robots headers/meta allow indexing. Every social JPEG is publicly accessible.
- robots.txt and sitemap.xml return public HTTP 200 with their expected content. The retired /diseno-web-torreon/ URL redirects to /case-studies/; a nonexistent route returns HTTP 404.
- Search Console property sc-domain:byheven.com is verified with owner access. The updated sitemap was submitted on 22 October 2026. Google fetched it and reported eight submitted URLs, zero errors and zero warnings.
- Home inspection reports indexed, robots allowed and matching user/Google canonicals. Its last crawl predates this release. The case index and individual cases still require Google’s crawl/indexing; sitemap acceptance is not confirmation that those pages are indexed.

## Follow-up

1. Review Google’s processing of the eight URLs and its next crawl of the home. Inspect coverage before making indexing claims.
2. Measure organic inquiries and conversion events separately from WhatsApp clicks. No analytics identifiers or tracking have been invented.
3. Check actual social unfurls; platform caches can delay refreshed thumbnails.

No rankings, rich results, traffic or sales are guaranteed by this technical release. No hidden keyword text, doorway pages, FAQ-rich-result promises or llms.txt ranking claims are added.
