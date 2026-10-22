# Analytics — 22 October 2026

GA4 property: `properties/560216242` (by ˈHevən), account `380016861`.
Web stream: `16183355176`, measurement ID `G-X9LYLZSKQF`.
Reporting timezone: America/Mexico_City. Currency: MXN. Standard property.

`assets/analytics.js` runs only on byheven.com / www.byheven.com and respects DNT and Global Privacy Control. The async Google tag waits for the first-view loader to finish, then uses an idle callback. It never participates in rendering, scroll, navigation or validation.

Enhanced measurement is disabled in the stream, so outbound WhatsApp URLs and form fields are not collected automatically. Page URLs omit query/hash values; only bounded campaign parameters are forwarded. External referrers retain only their origin. Google signals and ad personalization are disabled; advertising consent defaults to denied. Analytics storage is enabled for the requested site measurement. No name, email, phone number, message, business, budget or desired start date is sent by the custom instrumentation.

| Event | Meaning |
| --- | --- |
| page_view | A document viewed on the public site |
| view_case_study | A specific case document opened |
| select_project | A case link selected |
| click_whatsapp | An outbound WhatsApp link selected |
| booking_open | The Google Calendar scheduling link selected |
| contact_email | The email link selected |
| consultation_start | First focus inside the contact form |
| consultation_request | Validated consultation form prepared for WhatsApp |

`consultation_request` is contact intent, not proof that the visitor sent the WhatsApp message. `booking_open` is not a confirmed appointment. No purchase, revenue, generate_lead or booking-confirmed event is fabricated. Confirmed outcomes require evidence from the actual receiving system.

Run `npm run test:analytics` to verify host/privacy guards, event allowlists, loading behavior and HTML wiring; `npm run test:contact` checks the actual validated form and WhatsApp handoff.
