# Search and AI discovery — 22 October 2026

Production: https://www.byheven.com/ . The approved visual design, motion,
copy and contact journeys are unchanged by this pass.

## Implemented

- Keep the existing wildcard robots allowance for Googlebot, Bingbot,
  OAI-SearchBot, PerplexityBot and Claude-SearchBot. No crawler-specific
  exclusions, hidden alternate pages, artificial reviews or keyword blocks.
- Recognize the brand as both “by ˈHevən” and “By Heven”. Retain the real
  Torreón, Coahuila address locality and Mexico service coverage.
- Connect the three existing Service entities with the published case studies
  documenting that work, in both directions. Preserve the MVP and prototype
  labels on D’OR OS and Academic Quest.
- Describe the existing ten FAQ questions and answers verbatim in JSON-LD.
  This is not a promise of FAQ rich results or an AI citation.
- Publish an IndexNow ownership file. `node scripts/submit-indexnow.mjs`
  validates the live file, then submits only the eight public canonical URLs.
  Run after a successful production release with changed content, not on a
  timer or on preview builds. HTTP 200/202 means received, not indexed.
- `verify-discovery.mjs` runs in the production build and guards crawl access,
  FAQ parity and the evidence relationships.

## Evidence and honest limits

EMYASA: 100 orders, more than MXN 200,000 in accumulated sales and more than
250 registered customers, June–22 October 2026, as reported by the owner.
Keep the fixed reporting period; do not update it automatically or describe
these figures as independently audited. Never infer revenue, adoption or
client endorsements for the other projects. The published case text is the
source of truth.

GA4 already retains sanitized referral origins and safe UTM parameters. Use
session source/medium and landing pages to inspect referred visits from AI
services; referrers are not always supplied, and clicks are not citations.
Use Search Console for index status and search visibility, and Bing Webmaster
Tools AI Performance for supported citation reporting after verification.

## Work that still matters beyond this technical pass

1. Verify the business in Bing Webmaster Tools and, if eligible, Google
   Business Profile. No paid advertising is required. Do not publish a private
   street address or create fictitious listings.
2. Add genuine client evidence and authorized testimonials to the existing
   cases. Ask clients for honest reviews; do not fabricate external mentions.
3. Develop a focused administration-of-Shopify page and useful first-hand
   resources when the next content/page phase is approved. Avoid duplicate
   city landing pages and generic bulk-generated articles.
4. Check neutral discovery queries over time, e.g. Shopify administration in
   Mexico, Shopify operation in Torreón, industrial B2B ecommerce and custom
   inventory software. Log engine, date, query, cited URL and actual contact
   outcomes. An own-brand search is not proof of recommendation visibility.

No provider can promise inclusion or clients. There is no special AI schema.
We do not add llms.txt as a ranking tactic: Google explicitly ignores it for
ranking and AI visibility. Crawl access and IndexNow do not force other
providers to index or recommend the business.

## Official references

- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.openai.com/api/docs/bots
- https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- https://www.indexnow.org/documentation
- https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/
