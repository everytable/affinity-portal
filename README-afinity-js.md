Affinity Portal Customization (afinity.js)

Purpose
- Provides a comprehensive client-side customization layer for the Recharge Customer Portal. It injects a modal UI that allows customers to manage delivery method, address, date/time selection, pickup locations, and meal selections tied to a subscription, while integrating with Everytable APIs for availability, fees, and product filtering.

Where it runs
- Loaded on the Customer Portal pages. It listens for Recharge lifecycle events like `Recharge::location::change` and also uses `MutationObserver` to tailor behavior on `/customer` and `/overview` sections.

Major features
- Subscription overview and orders helpers
- Modal to edit delivery/pickup details
- Date and time selection with availability checks
- Pickup locations loading and selection
- Meal selection UI (update, add one-time items, swap)
- Fee calculations (packaging, delivery, conditional thresholds)
- Safe subscription updates (debounced/guarded calls)
- Validation and user feedback (toasts, loading states)
- Wording fixes for Payment details (Customer page)

Key interactions and flows
- Authentication: Initializes Recharge client with a Storefront Access Token if available (`recharge.init`).
- Observers:
  - `/customer`: Removes “Manage addresses” link, enforces wording fixes ("Payment details" and "Your payment details").
  - `/overview`: Hides internal edit address button and applies wording fixes as needed.
  Both observers are started on initial load and whenever `Recharge::location::change` fires.

- Availability lookups:
  - `fetchAvailableDates(zip, selectedPickupLocationId)`: Calls Everytable API for delivery/pickup windows; updates allowed dates and times.
  - `performZipCodeAvailabilitySearch(zipCode)`: Quick validation endpoint to see if a zip has deliverable days and locations; updates UI and clears pickers when not deliverable.

- Date/time pickers:
  - `setupDatePicker(fulfillmentType)`: Installs Flatpickr with allowed dates.
  - `generateTimeOptions(selectedDate)` and `reinitializeTimePicker()`: Produce available time slots based on server data.
  - `clearDateAndTime()` and `clearAndResetDateTimeForPickupLocation(locationId)`: Reset flows when method or zip changes.

- Delivery vs Pickup:
  - `renderMethodSection()` builds the UI with address fields, state/zip, method select, and the "Check Delivery Availability" button (disabled by default).
  - `attachMethodSectionEvents()` and other handlers ensure the availability button only enables after the user changes the zip to a new 5‑digit value.
  - `fetchPickupLocations(zip)`: Loads nearby locations and caches per zip.

- Validation:
  - `validateDateAndTimeSelection()`: Validates that date, time, and (for delivery) the zip is deliverable before saving.

- Saving flows:
  - `saveDate()`: Persists delivery date/time changes and refreshes subscription and availability data; updates meal availability displays accordingly.
  - `updateSubscriptionSafely(subscriptionId, updatePayload)`: Wrapper to apply updates reliably with error handling and state refresh.

- Meals:
  - `renderMealsPage()` and `renderMealsPageSidebar()`: Build the meals browsing and cart UI for updates and one-time additions.
  - `filterSelectedMealsByAvailability(selectedMealsArray, subscriptionDate)`: Filters items by availability on the chosen date to avoid invalid selections.
  - `attachMealCardEvents()` and `attachSidebarQuantityEvents()`: Wire quantity and selection controls.

- Fees and totals:
  - `getHiddenFees()` and `calculateSubscriptionTotal()`: Derive delivery and packaging fees.
  - `calculateConditionalFeesForMealsPage()` and `fetchDeliveryFeeThreshold()`: Compute dynamic fees based on thresholds and selected meals.

- UI utilities:
  - `showToast(message, type)`: Feedback messages (success, error, info).
  - `showModalLoading()` / `hideModalLoading()`: Loading overlays for async operations.
  - `renderModal()` / `attachModalEvents()`: Life cycle to render and attach event handlers.

Important behaviors and customizations
- Payment wording fixes on `/customer`:
  - `applyPaymentDetailsTextFixes()`: Broad text replacement for target phrases.
  - `applyCustomerPaymentDetailsFixes()`: Precise targeting that updates the sidebar link via `data-testid="recharge-internal-address-&-payment-details"` and upgrades the page title to "Your payment details" with H2-like styling.
  These run on load, on navigation changes, and within observers to persist after mutations.

- Check Delivery Availability button enablement:
  - Disabled by default on initial render and method changes; only enabled after the user edits the zip and it differs from the original and is exactly 5 digits. Pointer events are also gated to prevent accidental clicks.

Configuration constants and state
- `API_URL`, `apiToken`: Provided by the environment.
- Address state: `address1`, `address2`, `city`, `state`, `zip`.
- Fulfillment state: `fulfillmentMethod`, `deliveryDate`, `fulfillmentTime`.
- Various globals for caching: pickup locations, availability data, selected meals, original subscription meals, etc.

Event hooks
- `Recharge::location::change`: Starts observers appropriate for the current section; reapplies wording fixes.
- Multiple input event bindings for address/zip/method fields and meals UI.

Extending safely
- When changing UI enablement logic, prefer idempotent functions and centralize style changes (opacity, cursor, pointer-events) to avoid state drift during re-renders.
- Use selectors already present (e.g., `data-testid` on Recharge elements) for stable targeting.
- For new API calls, add error handling and ensure UI state (loading overlay, disabled buttons) is restored on failure paths.

Dependencies
- Flatpickr for date input and jQuery timepicker for time selection (loaded by the host page).
- Recharge client via a `recharge-client` script for storefront auth/session.

Known limitations
- The script depends on specific DOM structures/classes from Recharge; major updates to their templates may require selector adjustments.
- Some UI strings are replaced via text content; deeply nested or iconified structures may need additional selectors.

How to deploy
- Include `afinity.js` in the portal’s theme assets or inject via a custom script tag.
- Ensure `API_URL` and `apiToken` globals are defined on the page.
- Verify observers run on both initial load and navigation changes in the portal shell.

File map highlights (selected)
- Orders: `handleOrdersPage`, `loadCustomerOrders`, `renderOrdersSection`, `renderOrderDetails`, `generatePaginationControls`.
- Modal core: `renderModal`, `renderModalContent`, `attachModalEvents`.
- Address/method: `renderMethodSection`, `renderPickupLocationsSection`, `attachMethodSectionEvents`.
- Availability: `fetchAvailableDates`, `performZipCodeAvailabilitySearch`, `setupDatePicker`, `reinitializeTimePicker`.
- Meals: `renderMealsPage`, `renderMealsPageSidebar`, `renderMealsGrid`, `renderMealCard*`, `attachMealCardEvents`.
- Validation/save: `validateDateAndTimeSelection`, `saveDate`, `updateSubscriptionSafely`.
- Utilities: `showToast`, `getLocalISOFromDateAndTime`, `parseTimeString`, `formatDeliveryDate`, `formatTimeForDisplay`.

Support
- If something stops working after a Recharge update, re-check selectors (especially `data-testid` and heading classes) and console errors. Re-run availability calls manually to validate API responses.

