Affinity Footer Script (afinity-footer.js)

Overview
- This script is intended for the Recharge Customer Portal (Admin > Customer portal > Theme > Footer HTML/CSS/JS).
- Paste the contents of `afinity-footer.js` into the Footer JavaScript area. It runs on every portal page load and observes DOM changes to keep content up to date.

What it does
- Heading date nudging: Finds Recharge H1/H2 headings that contain a date (e.g., Wed, August 20, 2025) and rewrites them to be +2 days forward. Uses the `America/Los_Angeles` time zone.
- Hides nearby Edit buttons next to those headings to avoid user edits to auto-managed content.
- Removes generic “Edit” buttons elsewhere in the portal.
- Limits “Upcoming orders” card list display to the first 4 items.
- Renames address/payment wording:
  - "Your addresses & payment details" → "Your payment details"
  - "Address & payment details" → "Payment details"
  The script re-applies these changes whenever the DOM changes so the labels stay corrected.

Installation
1) In Recharge Admin, go to Customer portal > Theme > Footer HTML/CSS/JS.
2) Paste the contents of `afinity-footer.js` in the Footer JS field.
3) Save and publish.

How it works (high level)
- Uses `MutationObserver` to watch for added nodes matching Recharge heading selectors and re-runs updates.
- Uses a robust date regex to identify dates and formats with `Intl.DateTimeFormat` in the LA timezone.
- Scans for text-only nodes to precisely replace the two target phrases for “Payment details”.

Key functions
- formatDatePlusDays(dateText, daysToAdd): Parses a date and returns a localized string shifted forward by N days.
- shouldSkipElement(el): Skips nodes that are totals or dollar amounts (avoids mutating money rows).
- hideEditButtonNearby(el): Hides nearby edit buttons for a heading that was rewritten.
- updateRechargeHeadings(): Applies the date rewrite across all found headings.
- limitUpcomingOrdersToFour(): Removes extra upcoming order cards beyond the first four.
- replaceTextContent(): Rewrites the two address/payment texts wherever they appear as single text nodes.

Troubleshooting
- If headings do not change: ensure the Footer JS is published and that the portal uses the default Recharge heading classes (`.recharge-heading-h1`, `.recharge-heading-h2`).
- If the wording isn’t changing: inspect the DOM to confirm the text appears as a single text node. The observer keeps trying as dynamic content is inserted, but heavily nested structures may require adjusting selectors (see script comments).

Notes
- This footer script is intentionally side-effect free outside of the targeted areas. It does not depend on the main `afinity.js` modal script.

