// affinity.js - Standalone modal widget
(function() {

  const API_URL = "https://shoapenglee.jp.ngrok.io/api"
  // Dynamically load afinity.css if not already present
  var cssId = 'afinity-css';
  if (!document.getElementById(cssId)) {
    var link = document.createElement('link');
    link.id = cssId;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = './afinity.css';
    document.head.appendChild(link);
  }

  let currentPage = 'main';
  let modalOverlay = null;
  let currentSubscription = null;
  let modalLoading = false;
  let lastFetchedZip = null;
  let zip = '';

  // Use the same image for all meals
  const MEAL_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=facearea&w=400&h=400';
  const MEALS = [
    { id: 1, title: 'Blueberry Maple Yogurt Parfait', price: 6.7, img: MEAL_IMAGE, qty: 1 },
    { id: 2, title: "Monica's Breakfast Burrito", price: 6.7, img: MEAL_IMAGE, qty: 1 },
    { id: 3, title: 'Backyard BBQ Chicken Salad', price: 6.7, img: MEAL_IMAGE, qty: 0 },
    { id: 4, title: 'Spicy Tuna Sushi Bowl', price: 7.2, img: MEAL_IMAGE, qty: 0 },
    { id: 5, title: 'Vegan Buddha Bowl', price: 7.0, img: MEAL_IMAGE, qty: 0 },
    { id: 6, title: 'Chicken Caesar Wrap', price: 6.5, img: MEAL_IMAGE, qty: 0 },
    { id: 7, title: 'Egg White Omelette', price: 6.2, img: MEAL_IMAGE, qty: 0 },
    { id: 8, title: 'Greek Yogurt Bowl', price: 6.3, img: MEAL_IMAGE, qty: 0 },
    { id: 9, title: 'Avocado Toast', price: 5.9, img: MEAL_IMAGE, qty: 0 },
    { id: 10, title: 'Turkey Club Sandwich', price: 7.1, img: MEAL_IMAGE, qty: 0 },
    { id: 11, title: 'Quinoa Power Salad', price: 7.4, img: MEAL_IMAGE, qty: 0 },
    { id: 12, title: 'Buffalo Chicken Wrap', price: 7.0, img: MEAL_IMAGE, qty: 0 },
    { id: 13, title: 'Classic Cobb Salad', price: 7.2, img: MEAL_IMAGE, qty: 0 },
    { id: 14, title: 'Miso Soup & Rice', price: 5.5, img: MEAL_IMAGE, qty: 0 },
    { id: 15, title: 'Fruit & Nut Parfait', price: 6.8, img: MEAL_IMAGE, qty: 0 },
  ];
  let selectedMeals = [];
  let originalSubscriptionMeals = [];
  let currentCatalogPayload = null;
  let currentCatalogVariants = null;

  // Add a new catalog for Cold Meals (use a subset or different items)
  const COLD_MEALS = [
    { id: 101, title: 'Chilled Soba Noodle Salad', price: 7.2, img: MEAL_IMAGE, qty: 0 },
    { id: 102, title: 'Cold Brew Oats', price: 5.9, img: MEAL_IMAGE, qty: 0 },
    { id: 103, title: 'Summer Berry Salad', price: 6.5, img: MEAL_IMAGE, qty: 0 },
    { id: 104, title: 'Iced Matcha Bowl', price: 6.8, img: MEAL_IMAGE, qty: 0 },
    { id: 105, title: 'Chilled Mango Chia Pudding', price: 6.4, img: MEAL_IMAGE, qty: 0 },
  ];

  // Add global US states array
  const US_STATES = [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' }, { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
  ];

  // Address state
  let address1 = '';
  let city = '';
  let state = '';
  
  // Fulfillment state
  let fulfillmentTime = '';
  let fulfillmentMethod = '';
  let deliveryDate = '';

  // Add static pickup locations
  const PICKUP_LOCATIONS = [
    {
      id: 1,
      name: 'West Hollywood',
      address: '8717 Santa Monica Blvd',
      distance: 1.9
    },
    {
      id: 2,
      name: 'Hollywood',
      address: '6775 Santa Monica Blvd',
      distance: 4.3
    },
    {
      id: 3,
      name: 'Mid-Wilshire',
      address: '5164 Wilshire Blvd.',
      distance: 4.7
    },
    {
      id: 4,
      name: 'Palms',
      address: '10419 Venice Blvd. 101 A',
      distance: 5.3
    }
  ];
  let selectedPickupLocationId = null;

  let pickupLocations = [];
  let pickupLocationsLoading = false;

  // Add at the top, after let pickupLocations = [];
  let pickupLocationsPromise = null;

  // Global object to store all requested changes
  let modalChanges = {};
  
  // Helper function to update modalChanges with logging
  function updateModalChanges(key, value) {
    modalChanges[key] = value;
    console.log('modalChanges updated:', key, '=', value);
    console.log('Current modalChanges:', JSON.parse(JSON.stringify(modalChanges)));
  }

  function showModalLoading() {
    if (!modalOverlay) return;
    let loading = modalOverlay.querySelector('.afinity-modal-loading');
    if (!loading) {
      loading = document.createElement('div');
      loading.className = 'afinity-modal-loading';
      loading.innerHTML = '<div class="afinity-modal-loading-spinner"></div><div class="afinity-modal-loading-text">Loading…</div>';
      modalOverlay.appendChild(loading);
    }
    loading.style.display = '';
  }
  function hideModalLoading() {
    if (!modalOverlay) return;
    const loading = modalOverlay.querySelector('.afinity-modal-loading');
    if (loading) loading.style.display = 'none';
  }

  async function fetchSubscriptionAndPickup(subscriptionId, zip) {
    modalLoading = true;
    showModalLoading();
    try {
      await Promise.all([
        // Subscription fetch is already happening elsewhere, so just fetch pickup locations here
        fetchPickupLocations(zip)
      ]);
    } finally {
      modalLoading = false;
    }
  }

  // Refactor fetchPickupLocations to cache by zip
  async function fetchPickupLocations(zip) {
    if (!zip) return [];
    if (pickupLocationsPromise && lastFetchedZip === zip) {
      return pickupLocationsPromise;
    }
    pickupLocationsLoading = true;
    renderPickupLocationsSection();
    lastFetchedZip = zip;
    pickupLocationsPromise = fetch(`${API_URL}/search/availability/${encodeURIComponent(zip)}`)
      .then(resp => resp.json())
      .then(data => {
        pickupLocations = (data.pickupLocations || []).map(loc => ({
          id: loc.location_id,
          name: loc.name,
          address: loc.shopifyLocation && loc.shopifyLocation.address
            ? `${loc.shopifyLocation.address.address1 || ''}${loc.shopifyLocation.address.city ? ', ' + loc.shopifyLocation.address.city : ''}${loc.shopifyLocation.address.zip ? ', ' + loc.shopifyLocation.address.zip : ''}`
            : '',
          distance: typeof loc.distance_from_entered_zip_code === 'number' ? loc.distance_from_entered_zip_code : null
        }));
        pickupLocationsLoading = false;
        renderPickupLocationsSection();
        return pickupLocations;
      })
      .catch(e => {
        pickupLocations = [];
        pickupLocationsLoading = false;
        renderPickupLocationsSection();
        return [];
      });
    return pickupLocationsPromise;
  }

  function renderPickupLocationsSection() {
    const section = modalOverlay && modalOverlay.querySelector('#afinity-method-section');
    if (section) {
      section.innerHTML = renderMethodSection();
      // Always set the select value to the current fulfillmentMethod
      const methodSelect = section.querySelector('#afinity-method');
      if (methodSelect) {
        methodSelect.value = modalChanges.fulfillmentMethod || fulfillmentMethod || 'Delivery';
        methodSelect.addEventListener('change', async (e) => {
          updateModalChanges('fulfillmentMethod', e.target.value);
          fulfillmentMethod = e.target.value;
          if (fulfillmentMethod === 'Pickup') {
            if (zip && (zip !== lastFetchedZip || pickupLocations.length === 0)) {
              pickupLocationsLoading = true;
              renderPickupLocationsSection();
              await fetchPickupLocations(zip);
            } else {
              renderPickupLocationsSection();
            }
          } else {
            renderPickupLocationsSection();
          }
        });
      }
      attachMethodSectionEvents();
    }
  }

  function renderMethodSection() {
    let method = modalChanges.fulfillmentMethod || fulfillmentMethod || 'Delivery';
    let pickupListHtml = '';
    if (method === 'Pickup') {
      if (pickupLocationsLoading) {
        pickupListHtml = '<div class="afinity-modal-pickup-list">Loading locations...</div>';
      } else if (pickupLocations.length === 0) {
        pickupListHtml = '<div class="afinity-modal-pickup-list">No pickup locations found.</div>';
      } else {
        pickupListHtml = `<div class="afinity-modal-pickup-list">
          ${pickupLocations.map(loc => `
            <label class="afinity-modal-pickup-item">
              <div class="afinity-modal-pickup-meta">
                <div class="afinity-modal-pickup-label">RETAIL LOCATION</div>
                <div class="afinity-modal-pickup-name">${loc.name}${loc.address ? ' – ' + loc.address : ''}</div>
              </div>
              <div class="afinity-modal-pickup-distance-container">
                ${loc.distance !== null ? `<div class="afinity-modal-pickup-distance">${loc.distance.toFixed(1)} mi</div>` : ''}
                <input type="radio" name="pickup-location" value="${loc.id}" ${(modalChanges.selectedPickupLocationId || selectedPickupLocationId) == loc.id ? 'checked' : ''} />
              </div>
            </label>
          `).join('')}
        </div>`;
      }
    }
    return `
      <div class="afinity-modal-row">
        <label for="afinity-method" class="afinity-modal-select-label">Method</label>
        <select id="afinity-method" class="afinity-modal-select-label">
          <option value="Delivery" ${method === 'Delivery' ? 'selected' : ''}>Delivery</option>
          <option value="Pickup" ${method === 'Pickup' ? 'selected' : ''}>Pickup</option>
        </select>
      </div>
      ${method === 'Pickup' ? pickupListHtml : `
        <div class="afinity-modal-row">
          <label for="afinity-address" class="afinity-modal-select-label">Address</label>
          <input id="afinity-address" type="text" placeholder="12345 Street Dr." value="${modalChanges.address1 || address1}" />
        </div>
        <div class="afinity-modal-row afinity-modal-address-row">
          <input id="afinity-city" type="text" placeholder="Anytown" style="flex:2; margin-right:8px;" value="${modalChanges.city || city}" />
          <select id="afinity-state" style="flex:1; margin-right:8px;">
            ${US_STATES.map(s => `<option value="${s.code}" ${(modalChanges.state || state) === s.code || (modalChanges.state || state) === s.name ? 'selected' : ''}>${s.code}</option>`).join('')}
          </select>
          <input id="afinity-zip" type="text" placeholder="12345" style="flex:1;" value="${modalChanges.zip || zip}" />
        </div>
      `}
      <div style="display:flex; justify-content:flex-end; margin-top:8px;">
        <button id="afinity-save-method-btn" class="afinity-modal-save-btn" type="button">Save</button>
      </div>
    `;
  }

  // Helper to format delivery date
  function formatDeliveryDate(dateStr) {
    if (!dateStr) return '';
    // dateStr is already in ISO format (YYYY-MM-DD), just format it directly
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  // Helper to convert state name to code
  function getStateCode(stateName) {
    if (!stateName) return '';
    const state = US_STATES.find(s => s.name === stateName || s.code === stateName);
    return state ? state.code : stateName;
  }
  
  // Helper to get delivery date from currentSubscription order attributes
  function getDeliveryDateFromSubscription() {
    if (!currentSubscription?.include?.address?.order_attributes) {
      return deliveryDate; 
    }
    
    const fulfillmentDateAttr = currentSubscription.include.address.order_attributes.find(attr => 
      attr.name === 'Fulfillment Date' 
    );
    
    if (fulfillmentDateAttr) {
      const fulfillmentDateTime = fulfillmentDateAttr.value;
      if (fulfillmentDateTime.includes('T')) {
        return fulfillmentDateTime.split('T')[0]; 
      } else {
        return fulfillmentDateTime; 
      }
    }
    
    // Fallback to next_charge_scheduled_at if no fulfillment date found
    if (currentSubscription.next_charge_scheduled_at) {
      return currentSubscription.next_charge_scheduled_at.split('T')[0];
    }
    
    return deliveryDate; // final fallback
  }
  // Optionally, set a price variable if you want to show price
  let price = '3.99'; // Replace with real price if available

  function renderModal() {
    // Create overlay if not present
    if (!modalOverlay) {
      modalOverlay = document.createElement('div');
      modalOverlay.className = 'afinity-modal-overlay';
      modalOverlay.id = 'afinity-modal-overlay';
      modalOverlay.innerHTML = '<div id="afinity-modal-content-root"></div>';
      document.body.appendChild(modalOverlay);
    }
    // Only update the content root
    const contentRoot = modalOverlay.querySelector('#afinity-modal-content-root');
    contentRoot.innerHTML = renderModalContent();
    attachModalEvents();
    // Always re-render the method section if on main page
    if (currentPage === 'main') {
      renderPickupLocationsSection();
    }
    attachMethodSectionEvents();
    if (modalLoading) showModalLoading(); else hideModalLoading();
  }

  function renderModalContent() {
    if (currentPage === 'main') {
      return renderMainPage();
    } else if (currentPage === 'meals') {
      return renderMealsPage();
    }
    return '';
  }

  function renderMainPage() {
    console.log('renderMainPage - address values:', { address1, city, state, zip });
    const currentDeliveryDate = getDeliveryDateFromSubscription();
    // Determine method
    let method = fulfillmentMethod || 'Delivery';
    return `
      <button class="afinity-modal-close" title="Close">&times;</button>
      <div class="afinity-modal-header">
        <span class="afinity-modal-date"><span class="afinity-modal-date-label">${formatDeliveryDate(currentDeliveryDate)}</span> <span class="afinity-modal-price">$${price}</span></span>
      </div>
      <div class="afinity-modal-content">
        <div class="afinity-modal-card-frequency">
          <button class="afinity-modal-back">< Back</button>
          <div class="afinity-modal-card-frequency-content">
            <div class="afinity-modal-row-frequency">
              <label class="afinity-modal-label-frequency" for="afinity-frequency">Frequency</label>
              <select id="afinity-frequency">
                <option>2 week subscription with 10% discount</option>
                <option>1 week subscription</option>
              </select>
            </div>
            <button class="afinity-modal-update-meals">Update Meals</button>
          </div>
          <div class="afinity-modal-cart-list">
            ${
              (currentCatalogVariants && currentCatalogVariants.variants &&
               currentSubscription && currentSubscription.include &&
               currentSubscription.include.bundle_selections &&
               Array.isArray(currentSubscription.include.bundle_selections.items))
                ? currentSubscription.include.bundle_selections.items.map(item => {
                    const variant = getVariantById(item.external_variant_id);
                    if (!variant) return '';
                    const img =
                      (variant?.product?.featuredMedia?.preview?.image?.url) ||
                      (variant?.product?.featuredMedia?.preview?.url) ||
                      (variant?.image?.url) ||
                      MEAL_IMAGE;
                    const title = variant ? (variant.product?.title || variant.sku || 'Meal') : (item.title || item.external_variant_id);
                    const qty = item.quantity || 1;
                    return `
                      <div class="afinity-modal-cart-item">
                        <img src="${img}" alt="${title}" />
                        <div>
                          <div class="afinity-modal-cart-title">${title}</div>
                          <div class="afinity-modal-cart-qty">x ${qty}</div>
                        </div>
                      </div>
                    `;
                  }).join('')
                : ''
            }
          </div>
        </div>
        <div class="afinity-modal-card">
          <div class="afinity-modal-card-title">Update Subscription Delivery or Pickup</div>
          <div id="afinity-method-section">
            ${renderMethodSection()}
          </div>
        </div>
        <div class="afinity-modal-card">
          <div class="afinity-modal-card-title">Update Subscription Date</div>
          <div class="afinity-modal-row">
            <label for="afinity-date" class="afinity-modal-select-label">Date</label>
            <input id="afinity-date" type="date" value="${currentDeliveryDate}" />
          </div>
          <div class="afinity-modal-row">
            <label for="afinity-time" class="afinity-modal-select-label">Time</label>
            <input id="afinity-time" type="time" value="${fulfillmentTime || '15:30'}" />
          </div>
          <div style="display:flex; justify-content:flex-end; margin-top:8px;">
            <button id="afinity-save-date-btn" class="afinity-modal-save-btn" type="button">Save</button>
          </div>
        </div>
        <div class="afinity-modal-card">
          <a href="#" class="afinity-modal-add-extra">&#8853; <span>Add extra meal to order</span></a>
        </div>
        <div class="afinity-modal-card afinity-modal-footer-card">
          <div class="afinity-modal-footer-actions">
            <div>
              <a href="#" class="afinity-cancel-subscription">
                Cancel subscription
              </a>
            </div>
            <div>
              <button class="afinity-modal-cancel-btn" type="button">Cancel</button>
              <button class="afinity-modal-save-btn" type="button">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderMealsPage() {
    const catalogVariants = getCatalogVariants();
    const currentDeliveryDate = getDeliveryDateFromSubscription();
    return `
      <button class="afinity-modal-close" title="Close">&times;</button>
      <div class="afinity-modal-header">
        <span class="afinity-modal-date"><span class="afinity-modal-date-label">${formatDeliveryDate(currentDeliveryDate)}</span> <span class="afinity-modal-price">$${price}</span></span>
      </div>
      <div class="afinity-modal-content">
        <div class="afinity-modal-card afinity-meals-header-card">
          <button class="afinity-modal-back">< Back</button>
          <div class="afinity-meals-header-flex" style="display:flex;align-items:flex-start;justify-content:space-between;gap:2rem;width:100%;">
            <div class="afinity-meals-header-left" style="flex:1;min-width:0;">
              <h2 class="afinity-meals-title">Update Subscription Meals</h2>
              <div class="afinity-meals-desc">Update your subscription meals. Remove or add more meals to your order.</div>
            </div>
            <div class="afinity-meals-date-select" style="font-size:16px;min-width:220px;max-width:260px;display:flex;flex-direction:column;align-items:flex-end;">
              <label class="afinity-modal-select-label">Delivery Date</label>
              <input id="afinity-meals-date" type="date" value="${currentDeliveryDate}" style="font-size:16px;padding:6px 10px;border-radius:4px;border:1px solid #ccc;min-width:160px;" />
            </div>
          </div>
        </div>
        <div class="afinity-meals-layout">
          <div class="afinity-meals-main">
            <h2 class="afinity-meals-section-title">All Meals</h2>
            <ul class="afinity-meals-grid">${renderMealsGrid()}</ul>
          </div>
          <div class="afinity-modal-card afinity-meals-sidebar">
            <h3>Current Meals in Subscription</h3>
            <ul class="afinity-meals-sidebar-list current-meals">
              ${originalSubscriptionMeals.map(origMeal => {
                const variant = getVariantById(origMeal.id);
                const img = variant ? getVariantImageByCatalog(variant) : MEAL_IMAGE;
                const title = variant ? (variant.product?.title || variant.sku || 'Meal') : origMeal.title;
                const sel = selectedMeals.find(m => m.id === origMeal.id);
                const qty = sel ? sel.qty : origMeal.qty;
                const price = (variant && variant.price && variant.price.amount) ? parseFloat(variant.price.amount) : 0;
                return `
                  <li class="afinity-meals-sidebar-item" data-meal-id="${origMeal.id}">
                    <img src="${img}" alt="${title}" />
                    <div class="afinity-meals-sidebar-details">
                      <div class="afinity-meals-sidebar-title">${title}</div>
                      <div class="afinity-meals-sidebar-price">$${price.toFixed(2)}</div>
                    </div>
                    <div class="afinity-meals-sidebar-qty-controls">
                      <button class="afinity-meals-sidebar-qty-btn" data-action="decrement" data-meal-id="${origMeal.id}">-</button>
                      <span class="afinity-meals-sidebar-qty">${qty}</span>
                      <button class="afinity-meals-sidebar-qty-btn" data-action="increment" data-meal-id="${origMeal.id}">+</button>
                    </div>
                  </li>
                `;
              }).join('')}
            </ul>
            <h3>Swap Meals to your Subscription</h3>
            <ul class="afinity-meals-sidebar-list swap-meals">
              ${selectedMeals.filter(m => m.qty > 0 && !originalSubscriptionMeals.some(o => o.id === m.id)).map(meal => {
                const variant = getVariantById(meal.id);
                const img = variant ? getVariantImageByCatalog(variant) : MEAL_IMAGE;
                const title = variant ? (variant.product?.title || variant.sku || 'Meal') : meal.title;
                const price = (variant && variant.price && variant.price.amount) ? parseFloat(variant.price.amount) : 0;
                return `
                  <li class="afinity-meals-sidebar-item" data-meal-id="${meal.id}">
                    <img src="${img}" alt="${title}" />
                    <div class="afinity-meals-sidebar-details">
                      <div class="afinity-meals-sidebar-title">${title}</div>
                      <div class="afinity-meals-sidebar-price">$${price.toFixed(2)}</div>
                    </div>
                    <div class="afinity-meals-sidebar-qty-controls">
                      <button class="afinity-meals-sidebar-qty-btn" data-action="decrement" data-meal-id="${meal.id}">-</button>
                      <span class="afinity-meals-sidebar-qty">${meal.qty}</span>
                      <button class="afinity-meals-sidebar-qty-btn" data-action="increment" data-meal-id="${meal.id}">+</button>
                    </div>
                  </li>
                `;
              }).join('')}
            </ul>
            <div class="afinity-meals-sidebar-footer">
              <div class="afinity-meals-sidebar-total">
                <span>Total:</span>
                <span class="afinity-meals-sidebar-total-price">$${calculateSidebarTotal().toFixed(2)}</span>
              </div>
              <button class="afinity-meals-swap-btn" ${selectedMeals.filter(m=>m.qty>0).length === 0 ? 'disabled' : ''}>
                Swap Items <span class="afinity-meals-swap-count">${selectedMeals.filter(m=>m.qty>0).length}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderMealsGrid() {
    const catalogVariants = getCatalogVariants();
    if (!catalogVariants.length) {
      return '<div class="afinity-meals-grid-loading">Loading meals…</div>';
    }
    return catalogVariants.map(variant => renderMealCard(variant)).join('');
  }

  // Add helper to get image for a variant
  function getVariantImageByCatalog(variant) {
    // Robust image selection for meals grid
    return (
      variant?.product?.featuredMedia?.preview?.image?.url ||
      variant?.product?.featuredMedia?.preview?.url ||
      variant?.image?.url ||
      MEAL_IMAGE
    );
  }

  // Helper to get all catalog variants for the current catalog
  function getCatalogVariants() {
    if (!currentCatalogVariants || !currentCatalogVariants.variants || !currentCatalogPayload) return [];
    return currentCatalogVariants.variants.filter(
      v => v.metafield && String(v.metafield.value) === String(currentCatalogPayload.catalogId.toString().split('gid://shopify/MarketCatalog/')[1])
    );
  }

  // Update renderMealCard to use variant data
  function renderMealCard(variant) {
    const img = getVariantImageByCatalog(variant);
    const title = variant.product?.title || variant.sku || 'Meal';
    const price = (variant && variant.price && variant.price.amount) ? parseFloat(variant.price.amount) : 0;
    // Preselect if in originalSubscriptionMeals or selectedMeals with qty > 0
    const isActive =
      originalSubscriptionMeals.some(m => String(m.id) === String(variant.id)) ||
      selectedMeals.find(m => String(m.id) === String(variant.id) && m.qty > 0);
    return `
      <li class="afinity-r-meals-grid__item" style="display: block;"
        data-product-start-date="2025-01-01"
        data-product-end-date="2025-12-31"
        data-is-first-variant="true"
      >
        <div class="afinity-r-card${isActive ? ' afinity-r-card--active' : ''}" 
          data-variant-id="${variant.id}"
          data-collection-id="1"
          data-product-id="${variant.id}"
          data-catalog-id="demo-catalog-id"
          data-selling-plan-groups="[]">
          <div class="afinity-r-card__container">
            <div class="afinity-r-card__image-link">
              <img
                src="${img}"
                alt="${title}"
                class="afinity-r-card__image"
                loading="lazy"
                width="220"
                height="200"
              >
            </div>
            <div class="afinity-r-card__details">
              <h3 class="afinity-r-card__title">
                <span class="afinity-r-card__title-link">
                  ${title}
                </span>
              </h3>
              <div class="afinity-r-card__footer">
                <div class="price__container price-block" data-variant-id="${variant.id}">
                  <span class="afinity-r-card__price--discount price-item--regular" data-variant-id="${variant.id}">
                    $${price.toFixed(2)}
                  </span>
                </div>
                <div class="price-action-wrapper" data-variant-id="${variant.id}">
                  ${isActive ? `
                    <button class="afinity-r-card__add-btn afinity-r-card__add-btn--smart afinity-r-card__remove-btn" type="button" data-meal-id="${variant.id}" style="background:#c0392b;">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="4" y="9" width="12" height="2" rx="1" fill="white"/>
                      </svg>
                    </button>
                  ` : `
                    <button class="afinity-r-card__add-btn afinity-r-card__add-btn--smart" type="button" data-meal-id="${variant.id}">
                      <svg width="20" height="20" class="icon icon-add-to-cart" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0ZM10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM10 5C10.5523 5 11 5.44772 11 6V9H14C14.5523 9 15 9.44772 15 10C15 10.5523 14.5523 11 14 11H11V14C11 14.5523 10.5523 15 10 15C9.44772 15 9 14.5523 9 14V11H6C5.44772 11 5 10.5523 5 10C5 9.44772 5.44772 9 6 9H9V6C9 5.44772 9.44772 5 10 5Z" fill="white"/>
                      </svg>
                    </button>
                  `}
                </div>
              </div>
            </div>
          </div>
        </div>
      </li>
    `;
  }

  // Helper function to calculate sidebar total
  function calculateSidebarTotal() {
    return selectedMeals.reduce((total, meal) => {
      return total + (meal.price * meal.qty);
    }, 0);
  }

  function attachModalEvents() {
    if (modalLoading) return;
    // Close modal
    modalOverlay.querySelector('.afinity-modal-close').onclick = () => modalOverlay.style.display = 'none';
    // Back button
    const backBtn = modalOverlay.querySelector('.afinity-modal-back');
    if (backBtn) backBtn.onclick = () => {
      if (currentPage === 'meals') {
        currentPage = 'main';
        renderModal(); // force rerender to main page
      } else {
        modalOverlay.style.display = 'none';
      }
    };
    // Edit contents or add extra meal
    const editBtn = modalOverlay.querySelector('.afinity-modal-update-meals');
    if (editBtn) editBtn.onclick = () => {
      currentPage = 'meals';
      renderModal();
    };
    const addExtraMeal = modalOverlay.querySelector('.afinity-modal-add-extra');
    if (addExtraMeal) addExtraMeal.onclick = (e) => {
      e.preventDefault();
      currentPage = 'meals';
      renderModal();
    };
    // Cancel/Save/Cancel subscription
    const cancelBtn = modalOverlay.querySelector('.afinity-modal-cancel-btn');
    if (cancelBtn) cancelBtn.onclick = () => modalOverlay.style.display = 'none';
    const saveBtn = modalOverlay.querySelector('.afinity-modal-save-btn');
    if (saveBtn) saveBtn.onclick = () => {
      // TODO: Save logic
      console.log('Saving changes:', modalChanges);
      modalOverlay.style.display = 'none';
    };
    const cancelSubBtn = modalOverlay.querySelector('.afinity-cancel-subscription');
    if (cancelSubBtn) cancelSubBtn.onclick = (e) => {
      e.preventDefault();
      // TODO: Cancel subscription logic
      alert('Cancel subscription clicked');
    };
    // Meal add/remove
    modalOverlay.querySelectorAll('.afinity-r-card__add-btn').forEach(btn => {
      btn.onclick = (e) => {
        const mealId = btn.getAttribute('data-meal-id');
        let sel = selectedMeals.find(m => String(m.id) === String(mealId));
        if (btn.classList.contains('afinity-r-card__remove-btn')) {
          // Remove from selectedMeals
          if (sel) {
            sel.qty = 0;
            // Optionally remove from array entirely:
            // selectedMeals = selectedMeals.filter(m => String(m.id) !== String(mealId));
          }
        } else {
          // Add or increment
          if (!sel) {
            selectedMeals.push({ id: mealId, qty: 1 });
          } else {
            sel.qty++;
          }
        }
        updateModalChanges('selectedMeals', JSON.parse(JSON.stringify(selectedMeals)));
        rerenderSidebarMeals();
      };
    });
    // Sidebar quantity controls
    modalOverlay.querySelectorAll('.afinity-meals-sidebar-qty-btn').forEach(btn => {
      btn.onclick = (e) => {
        const action = btn.getAttribute('data-action');
        const mealId = parseInt(btn.getAttribute('data-meal-id'));
        const idx = selectedMeals.findIndex(m => m.id === mealId);
        
        if (idx !== -1) {
          if (action === 'increment') {
            selectedMeals[idx].qty++;
            console.log(`Incremented meal ${mealId}, new qty: ${selectedMeals[idx].qty}`);
          } else if (action === 'decrement') {
            selectedMeals[idx].qty--;
            if (selectedMeals[idx].qty <= 0) {
              selectedMeals[idx].qty = 0;
              console.log(`Removed meal ${mealId} from sidebar`);
            } else {
              console.log(`Decremented meal ${mealId}, new qty: ${selectedMeals[idx].qty}`);
            }
          }
          updateModalChanges('selectedMeals', JSON.parse(JSON.stringify(selectedMeals)));
          rerenderSidebarMeals();
        }
      };
    });
    // Swap Items
    const swapBtn = modalOverlay.querySelector('.afinity-meals-swap-btn');
    if (swapBtn) swapBtn.onclick = () => {
      // TODO: Implement swap logic
      alert('Swap Items clicked');
    };
    // Date input on main page
    const mainDateInput = modalOverlay.querySelector('#afinity-date');
    if (mainDateInput) mainDateInput.onchange = (e) => {
      updateModalChanges('deliveryDate', e.target.value);
      deliveryDate = e.target.value;
    };
    // Date input on meals page
    const mealsDateInput = modalOverlay.querySelector('#afinity-meals-date');
    if (mealsDateInput) mealsDateInput.onchange = (e) => {
      updateModalChanges('deliveryDate', e.target.value);
      deliveryDate = e.target.value;
    };
    // Time input
    const mainTimeInput = modalOverlay.querySelector('#afinity-time');
    if (mainTimeInput) mainTimeInput.onchange = (e) => {
      updateModalChanges('fulfillmentTime', e.target.value);
      fulfillmentTime = e.target.value;
    };
    // Address inputs - ensure they update modalChanges
    const addressInput = modalOverlay.querySelector('#afinity-address');
    console.log('Found address input:', addressInput);
    if (addressInput) {
      addressInput.oninput = (e) => { 
        console.log('Address input changed:', e.target.value);
        updateModalChanges('address1', e.target.value); 
        address1 = e.target.value; 
      };
    }
    const cityInput = modalOverlay.querySelector('#afinity-city');
    console.log('Found city input:', cityInput);
    if (cityInput) {
      cityInput.oninput = (e) => { 
        console.log('City input changed:', e.target.value);
        updateModalChanges('city', e.target.value); 
        city = e.target.value; 
      };
    }
    const stateInput = modalOverlay.querySelector('#afinity-state');
    console.log('Found state input:', stateInput);
    if (stateInput) {
      stateInput.onchange = (e) => { 
        console.log('State input changed:', e.target.value);
        updateModalChanges('state', e.target.value); 
        state = e.target.value; 
      };
    }
    const zipInput = modalOverlay.querySelector('#afinity-zip');
    console.log('Found zip input:', zipInput);
    if (zipInput) {
      zipInput.oninput = (e) => { 
        console.log('Zip input changed:', e.target.value);
        updateModalChanges('zip', e.target.value); 
        zip = e.target.value; 
      };
    }
    // Save button for Delivery/Pickup/Address section
    const saveMethodBtn = modalOverlay.querySelector('#afinity-save-method-btn');
    if (saveMethodBtn) saveMethodBtn.onclick = () => {
      const methodAndAddress = {
        fulfillmentMethod: modalChanges.fulfillmentMethod,
        address1: modalChanges.address1,
        city: modalChanges.city,
        state: modalChanges.state,
        zip: modalChanges.zip,
        selectedPickupLocationId: modalChanges.selectedPickupLocationId
      };
      console.log('Save (Delivery/Pickup/Address):', methodAndAddress);
      // TODO: Call API or further logic here
    };
    // Save button for Date section
    const saveDateBtn = modalOverlay.querySelector('#afinity-save-date-btn');
    if (saveDateBtn) saveDateBtn.onclick = () => {
      const dateFields = {
        deliveryDate: modalChanges.deliveryDate,
        fulfillmentTime: modalChanges.fulfillmentTime
      };
      console.log('Save (Date):', dateFields);
      // TODO: Call API or further logic here
    };
  }

  function attachMethodSectionEvents() {
    if (modalLoading) return;
    // Listen for pickup location change
    const pickupRadios = modalOverlay.querySelectorAll('input[name="pickup-location"]');
    pickupRadios.forEach(radio => {
      radio.onchange = (e) => {
        updateModalChanges('selectedPickupLocationId', parseInt(e.target.value));
        selectedPickupLocationId = parseInt(e.target.value);
        renderPickupLocationsSection();
      };
    });
    // Listen for address, city, state, zip changes
    const addressInput = modalOverlay.querySelector('#afinity-address');
    console.log('attachMethodSectionEvents - Found address input:', addressInput);
    if (addressInput) addressInput.oninput = (e) => { 
      console.log('attachMethodSectionEvents - Address input changed:', e.target.value);
      updateModalChanges('address1', e.target.value); 
      address1 = e.target.value; 
    };
    const cityInput = modalOverlay.querySelector('#afinity-city');
    console.log('attachMethodSectionEvents - Found city input:', cityInput);
    if (cityInput) cityInput.oninput = (e) => { 
      console.log('attachMethodSectionEvents - City input changed:', e.target.value);
      updateModalChanges('city', e.target.value); 
      city = e.target.value; 
    };
    const stateInput = modalOverlay.querySelector('#afinity-state');
    console.log('attachMethodSectionEvents - Found state input:', stateInput);
    if (stateInput) stateInput.onchange = (e) => { 
      console.log('attachMethodSectionEvents - State input changed:', e.target.value);
      updateModalChanges('state', e.target.value); 
      state = e.target.value; 
    };
    const zipInput = modalOverlay.querySelector('#afinity-zip');
    console.log('attachMethodSectionEvents - Found zip input:', zipInput);
    if (zipInput) zipInput.oninput = (e) => { 
      console.log('attachMethodSectionEvents - Zip input changed:', e.target.value);
      updateModalChanges('zip', e.target.value); 
      zip = e.target.value; 
    };
  }

  // Helper to get catalogId
  function getCurrentCatalogId() {
    return currentCatalogPayload && currentCatalogPayload.catalogId;
  }

  // Listen for the event on document
  document.addEventListener('Recharge::click::manageSubscription', function(event) {
    event.preventDefault();
    showModalLoading();
    
    // Get subscription ID from the event
    const subscriptionId = event.detail?.payload?.subscriptionId || event.detail?.subscription_id || event.target?.getAttribute('data-subscription-id');
    
    if (subscriptionId) {
      // Fetch subscription data from API
      fetch(`${API_URL}/subscription/${subscriptionId}`)
        .then(response => response.json())
        .then(data => {
          console.log('Subscription data:', data);
          const payload = data.data;
          currentSubscription = payload
          const address = payload.include.address;
          // Extract data from API response
          address1 = address.address1 || '';
          city = address.city || '';
          state = getStateCode(address.province || '');
          zip = address.zip || '';
          
          console.log('Extracted address data:', { address1, city, state, zip });
          
          // Extract fulfillment date, time, and method from order attributes
          if (payload?.include?.address?.order_attributes) {
            const fulfillmentDateAttr = payload.include.address.order_attributes.find(attr => 
              attr.name === 'Fulfillment Date' 
            );
            if (fulfillmentDateAttr) {
              const fulfillmentDateTime = fulfillmentDateAttr.value;
              if (fulfillmentDateTime.includes('T')) {
                // Format: "2025-07-03T20:15:00-07:00"
                fulfillmentDate = fulfillmentDateTime.split('T')[0];
                fulfillmentTime = fulfillmentDateTime.split('T')[1].split('-')[0];
              } else {
                // Format: "2025-07-03"
                fulfillmentDate = fulfillmentDateTime;
                fulfillmentTime = '15:30'; // Default time
              }
            }
            
            const fulfillmentTypeAttr = payload.include.address.order_attributes.find(attr => attr.name.toLowerCase() === 'fulfillment type');
            if (fulfillmentTypeAttr && fulfillmentTypeAttr.value) {
              fulfillmentMethod = fulfillmentTypeAttr.value.trim().toLowerCase() === 'pickup' ? 'Pickup' : 'Delivery';
            } else {
              fulfillmentMethod = 'Delivery';
            }
          }
          
          // Update delivery date and price from subscription data
          // Use fulfillment date from order attributes as delivery date
          deliveryDate = getDeliveryDateFromSubscription();
          if (payload.price) {
            price = parseFloat(payload.price).toFixed(2);
          }
          
          currentPage = 'main';
          if (modalOverlay) {
            modalOverlay.style.display = '';
          }
          renderModal();
          fetchSubscriptionAndPickup(subscriptionId, zip);
          // Initialize modalChanges from subscription data
          modalChanges = {};
          updateModalChanges('address1', address1);
          updateModalChanges('city', city);
          updateModalChanges('state', state);
          updateModalChanges('zip', zip);
          updateModalChanges('fulfillmentMethod', fulfillmentMethod);
          updateModalChanges('deliveryDate', deliveryDate);
          updateModalChanges('fulfillmentTime', fulfillmentTime);
          updateModalChanges('selectedMeals', JSON.parse(JSON.stringify(selectedMeals)));
          // Only add selectedPickupLocationId if it's not null
          if (selectedPickupLocationId !== null) {
            updateModalChanges('selectedPickupLocationId', selectedPickupLocationId);
          }
          if (payload && payload.include && payload.include.bundle_selections && Array.isArray(payload.include.bundle_selections.items)) {
            originalSubscriptionMeals = payload.include.bundle_selections.items.map(item => {
              // Try to find a matching meal in MEALS or COLD_MEALS for title/img fallback
              const match = [...MEALS, ...COLD_MEALS].find(m => String(m.id) === String(item.external_variant_id));
              return {
                id: item.external_variant_id,
                title: match ? match.title : (item.title || item.external_variant_id),
                price: parseFloat(item.price) || (match ? match.price : 0),
                img: match ? match.img : MEAL_IMAGE,
                qty: item.quantity || 1
              };
            });
          } else {
            originalSubscriptionMeals = [];
          }
          let locationId = null;
          let locationName = null;
          if (payload && payload.include && payload.include.address && payload.include.address.order_attributes) {
            const locationIdAttr = payload.include.address.order_attributes.find(attr => attr.name.toLowerCase() === 'locationid');
            if (locationIdAttr) locationId = locationIdAttr.value;
            const locationNameAttr = payload.include.address.order_attributes.find(attr => attr.name.toLowerCase() === 'location name');
            if (locationNameAttr) locationName = locationNameAttr.value;
          }

          console.log('locationId:', locationId);
          console.log('locationName:', locationName);
          if (locationId && zip) {
            fetchPickupLocations(zip).then(pickupLocations => {
              const matchedLocation = pickupLocations.find(loc => String(loc.id) === String(locationId));
              const locationName = matchedLocation ? matchedLocation.name : null;
              console.log('locationId:', locationId);
              console.log('locationName (from availability API):', locationName);
              if (locationName) {
                fetch(`${API_URL}/location/catalog/${locationId}/${encodeURIComponent(locationName)}`)
                  .then(resp => resp.json())
                  .then(catalogPayload => {
                    currentCatalogPayload = catalogPayload;
                    console.log('Loaded catalog payload:', catalogPayload);
                    
                    // Fetch variants for this catalog
                    if (catalogPayload && catalogPayload.catalogId) {
                      const catalogId = catalogPayload.catalogId.replace('gid://shopify/MarketCatalog/', '');
                      fetch(`${API_URL}/subscriptions/${catalogId}/variants`)
                        .then(resp => resp.json())
                        .then(variantsData => {
                          currentCatalogVariants = variantsData;
                          rerenderModalCartList();
                          renderModal();
                        })
                        .catch(err => {
                          currentCatalogVariants = null;
                          console.error('Failed to load catalog variants:', err);
                        });
                    } else {
                    }
                  })
                  .catch(err => {
                    currentCatalogPayload = null;
                    console.error('Failed to load catalog payload:', err);
                  });
              } else {
                currentCatalogPayload = null;
                console.error('No matching locationName found for locationId:', locationId);
              }
            }).catch(err => {
              currentCatalogPayload = null;
              console.error('Failed to fetch pickup locations for zip:', zip, err);
            });
          } else {
            currentCatalogPayload = null;
          }
        })
        .catch(error => {
          console.error('Error fetching subscription data:', error);
          currentPage = 'main';
          if (modalOverlay) {
            modalOverlay.style.display = '';
          }
          renderModal();
        });
    } else {
      currentPage = 'main';
      if (modalOverlay) {
        modalOverlay.style.display = '';
      }
      renderModal();
      hideModalLoading();
    }
  });

  // Helper to get variant by id
  function getVariantById(variantId) {
    if (!currentCatalogVariants || !currentCatalogVariants.variants) return null;
    // Normalize both ids by stripping gid://shopify/ProductVariant/ if present
    const normalize = id => String(id).replace('gid://shopify/ProductVariant/', '');
    const targetId = normalize(variantId);
    return currentCatalogVariants.variants.find(v => normalize(v.id) === targetId);
  }

  // Add this function near other render helpers
  function rerenderModalCartList() {
    const cartList = document.querySelector('.afinity-modal-cart-list');
    if (!cartList) return;
    // Use bundle_selections.items as the source
    const items = (currentSubscription && currentSubscription.include && currentSubscription.include.bundle_selections && Array.isArray(currentSubscription.include.bundle_selections.items))
      ? currentSubscription.include.bundle_selections.items
      : [];
    cartList.innerHTML = items.map(item => {
      const variant = getVariantById(item.external_variant_id);
      const img =
        (variant?.product?.featuredMedia?.preview?.image?.url) ||
        (variant?.product?.featuredMedia?.preview?.url) ||
        (variant?.image?.url) ||
        MEAL_IMAGE;
      const title = variant ? (variant.product?.title || variant.sku || 'Meal') : (item.title || item.external_variant_id);
      const qty = item.quantity || 1;
      return `
        <div class="afinity-modal-cart-item">
          <img src="${img}" alt="${title}" />
          <div>
            <div class="afinity-modal-cart-title">${title}</div>
            <div class="afinity-modal-cart-qty">x ${qty}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Update rerenderSidebarMeals and renderSidebarMeals to recalculate and update the cart total
  function renderSidebarMeals() {
    // Current Meals in Subscription
    const sidebarList = document.querySelector('.afinity-meals-sidebar-list.current-meals');
    if (sidebarList) {
      sidebarList.innerHTML = originalSubscriptionMeals.map(origMeal => {
        const variant = getVariantById(origMeal.id);
        const img = variant ? getVariantImageByCatalog(variant) : MEAL_IMAGE;
        const title = variant ? (variant.product?.title || variant.sku || 'Meal') : origMeal.title;
        const sel = selectedMeals.find(m => m.id === origMeal.id);
        const qty = sel ? sel.qty : origMeal.qty;
        const price = (variant && variant.price && variant.price.amount) ? parseFloat(variant.price.amount) : 0;
        return `
          <li class="afinity-meals-sidebar-item" data-meal-id="${origMeal.id}">
            <img src="${img}" alt="${title}" />
            <div class="afinity-meals-sidebar-details">
              <div class="afinity-meals-sidebar-title">${title}</div>
              <div class="afinity-meals-sidebar-price">$${price.toFixed(2)}</div>
            </div>
            <div class="afinity-meals-sidebar-qty-controls">
              <button class="afinity-meals-sidebar-qty-btn" data-action="decrement" data-meal-id="${origMeal.id}">-</button>
              <span class="afinity-meals-sidebar-qty">${qty}</span>
              <button class="afinity-meals-sidebar-qty-btn" data-action="increment" data-meal-id="${origMeal.id}">+</button>
            </div>
          </li>
        `;
      }).join('');
    }
    // Swap Meals
    const swapList = document.querySelector('.afinity-meals-sidebar-list.swap-meals');
    if (swapList) {
      swapList.innerHTML = selectedMeals.filter(m => m.qty > 0 && !originalSubscriptionMeals.some(o => o.id === m.id)).map(meal => {
        const variant = getVariantById(meal.id);
        const img = variant ? getVariantImageByCatalog(variant) : MEAL_IMAGE;
        const title = variant ? (variant.product?.title || variant.sku || 'Meal') : meal.title;
        const price = (variant && variant.price && variant.price.amount) ? parseFloat(variant.price.amount) : 0;
        return `
          <li class="afinity-meals-sidebar-item" data-meal-id="${meal.id}">
            <img src="${img}" alt="${title}" />
            <div class="afinity-meals-sidebar-details">
              <div class="afinity-meals-sidebar-title">${title}</div>
              <div class="afinity-meals-sidebar-price">$${price.toFixed(2)}</div>
            </div>
            <div class="afinity-meals-sidebar-qty-controls">
              <button class="afinity-meals-sidebar-qty-btn" data-action="decrement" data-meal-id="${meal.id}">-</button>
              <span class="afinity-meals-sidebar-qty">${meal.qty}</span>
              <button class="afinity-meals-sidebar-qty-btn" data-action="increment" data-meal-id="${meal.id}">+</button>
            </div>
          </li>
        `;
      }).join('');
    }
    // Calculate total
    let total = 0;
    // Current Meals
    originalSubscriptionMeals.forEach(origMeal => {
      const variant = getVariantById(origMeal.id);
      const sel = selectedMeals.find(m => m.id === origMeal.id);
      const qty = sel ? sel.qty : origMeal.qty;
      const price = (variant && variant.price && variant.price.amount) ? parseFloat(variant.price.amount) : 0;
      total += price * qty;
    });
    // Swap Meals
    selectedMeals.filter(m => m.qty > 0 && !originalSubscriptionMeals.some(o => o.id === m.id)).forEach(meal => {
      const variant = getVariantById(meal.id);
      const price = (variant && variant.price && variant.price.amount) ? parseFloat(variant.price.amount) : 0;
      total += price * meal.qty;
    });
    // Update total in DOM
    const totalEl = document.querySelector('.afinity-meals-sidebar-total-price');
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  }

  function rerenderSidebarMeals() {
    renderSidebarMeals();
  }

  // At the very end of the IIFE, before it closes, trigger sidebar/cart calculations immediately
  rerenderSidebarMeals();
})(); 