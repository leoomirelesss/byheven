# Consultations: direct booking and WhatsApp

## Live booking

The contact section links directly to the public Google Calendar appointment schedule. It uses a normal external anchor, without an iframe or third-party scheduling script. The visual layout and shared motion are retained.

Verified visitor URL:
https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ3jK8hvrT8yHq5aVDeUpOYiuWhItsYSCyCf69eJDeVJQyuy0p4wl7zpXMiAbQOq7ev0js-Pgj68?gv=true

Owner-approved schedule, saved on 2026-10-21:

- Monday–Friday: 16:00–20:00; Saturday: 09:00–12:00; Sunday unavailable.
- Local time in Torreón: UTC−06:00. Google displays Central Standard Time – Mexico City (same local time as America/Monterrey).
- Free 25-minute consultation, Google Meet generated after booking.
- Ten-minute buffer, minimum 24 hours' notice, maximum three bookings per day, 60-day booking horizon.
- Availability checks enabled against the owner's primary calendar. Accepted/created busy events there prevent conflicting reservations. The current plan does not include checking additional calendars; commitments on other calendars must also be blocked on the primary calendar.
- Booking asks for name, surname, email and a required short description of the business need. No payment required.
- Google owns booking, confirmation and calendar invitations. No Google API credentials, customer calendar details or event titles are exposed in website code.

The public visitor page was opened and verified with weekday, Saturday and unavailable Sunday slots. No real/test appointment was submitted, so invite delivery, actual occupied-slot exclusion and cancellation/rescheduling still require an end-to-end booking with the owner. Do not describe those as tested.

## Alternative: WhatsApp request

Visitors can reserve directly without first filling the website form. Those who prefer a conversation can use the separate WhatsApp form or existing direct WhatsApp links.

- Required: name, deliberate service selection, estimated budget and desired start time.
- Optional: business/site and short description of the need.
- Budget and start show empty prompts. Visitors may explicitly select no budget yet or no date defined; these remain valid answers.
- USD estimates are monthly for Shopify administration and per project for web development and automation. Orientation requests keep the period undefined. An amount is cleared when its period changes.
- Budget ranges qualify the request; they do not advertise prices or reject inquiries. No budget is valid.
- The form prepares one encoded WhatsApp message. The visitor must send it; this alone does not reserve a meeting. The submit label identifies WhatsApp; the separate booking CTA identifies direct scheduling.
- Returning from WhatsApp preserves the form. No personal data is written to localStorage, sessionStorage, a database or analytics.
- `npm run test:contact` exercises the real controller and HTML fields, as well as the separate verified booking link. The build includes this check.
