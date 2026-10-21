# Technical SEO — 21 October 2026

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
- Existing robots.txt and the eight-URL sitemap retained; no artificial last-modified dates or URL migrations.
- Build-time SEO guard checks metadata uniqueness, canonicals, real JPEG signatures/dimensions, image attributes, graph references, project destinations and prototype status. It fails the build on regressions.

## Validation and limits

Run `node scripts/verify-seo.mjs .` for source SEO checks. `npm run build` runs the existing checks, public-asset verification and SEO verification against the actual output.

Static body comparison allows only image alternative attributes to change. All style blocks, visible copy, links and motion settings are preserved.

These are source and build checks, not a Google Rich Results Test certification, a ranking forecast or a measured Core Web Vitals result. Graph entities and relations can be valid without qualifying for a Google rich-result feature.

## Remaining launch work

1. Release the approved version to the public canonical domain. Keep preview authentication enabled.
2. Check public responses, redirects, robots headers and canonical resolution; verify that page and social-image URLs are reachable without authentication.
3. Verify Search Console ownership, submit the sitemap and inspect the home and case URLs. Run Google's Rich Results Test against public URLs.
4. Inspect actual WhatsApp/social unfurls after publication. Preview authentication blocks third-party preview crawlers; platform caching can delay updated thumbnails.
5. Measure organic inquiries and conversion events separately from clicks to WhatsApp. No analytics identifiers or tracking were invented in this change.

The site targets the services actually shown in its content. No hidden keyword text, doorway pages, FAQ-rich-result promises or llms.txt ranking claims are added.
