# Consultation requests

The home contact form now prepares a free 25-minute consultation request for the existing WhatsApp number. It does not claim to reserve a meeting or save a lead server-side. The visitor must send the prepared WhatsApp message.

## Current behavior

- Required: name, deliberate service selection, short description of the need.
- Optional: business/site, estimated budget, desired start time.
- USD estimates are monthly for Shopify administration and per project for web development and automation. Orientation requests keep the period undefined. An amount is cleared when its period changes.
- Budget ranges do not advertise service prices or automatically reject inquiries. No budget is a valid answer.
- WhatsApp receives one encoded message with the request context. The form remains intact when returning from WhatsApp; no personal data is written to localStorage, sessionStorage, a database or analytics.
- Direct WhatsApp links remain available. Layout, shared motion, page transitions and SEO metadata are retained.
- `npm run test:contact` exercises the actual controller and real HTML controls. The production build includes this check.

## Connect real scheduling

The owner's Google Calendar account, actual working hours and public appointment-schedule URL have not been supplied or connected. Do not invent a booking URL, expose calendar events, show assumed time slots, or claim that a request is confirmed.

Once the owner provides the appointment-schedule link:

1. Verify the owning account and availability calendars. Keep personal event details private.
2. Configure the approved meeting duration (25 minutes), a 10-minute buffer, at least 24 hours' notice and a maximum of three appointments per day. Confirm the owner's available days/hours and use America/Monterrey as the owner's time zone.
3. Enable calendar availability checks and Google Meet conferencing. Confirm whether checking secondary calendars and reminders requires an eligible plan.
4. Link the real booking page from the consultation section. Keep the current form for WhatsApp requests so visitors do not have to submit the same details twice to reserve a time.
5. Test public booking, occupied slots, confirmation, cancellation and rescheduling with the owner. Use a clearly labeled test appointment and remove it after the test.

Reference: https://support.google.com/calendar/answer/10729749
