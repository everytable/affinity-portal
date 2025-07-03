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
  let selectedMeals = [...MEALS];

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
      hideModalLoading();
    }
  }

  async function fetchPickupLocations(zip) {
    if (!zip) return [];
    pickupLocationsLoading = true;
    renderPickupLocationsSection();
    try {
      const resp = await fetch(`${"https://admin-app.everytable-sh.com" || API_URL }/api/search/availability/${encodeURIComponent(zip)}`);
      const data = await resp.json();
      // Use the API's pickupLocations array, include distance
      pickupLocations = (data.pickupLocations || []).map(loc => ({
        id: loc.location_id,
        name: loc.name,
        address: loc.shopifyLocation && loc.shopifyLocation.address
          ? `${loc.shopifyLocation.address.address1 || ''}${loc.shopifyLocation.address.city ? ', ' + loc.shopifyLocation.address.city : ''}${loc.shopifyLocation.address.zip ? ', ' + loc.shopifyLocation.address.zip : ''}`
          : '',
        distance: typeof loc.distance_from_entered_zip_code === 'number' ? loc.distance_from_entered_zip_code : null
      }));
      console.log("PICKUP LOCATIONS", pickupLocations);
      // Don't preselect any location - let user choose
      selectedPickupLocationId = null;
    } catch (e) {
      pickupLocations = [];
    }
    pickupLocationsLoading = false;
    renderPickupLocationsSection();
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
              lastFetchedZip = zip;
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
            ${selectedMeals.filter(m=>m.qty>0).map(meal => `
              <div class="afinity-modal-cart-item">
                <img src="${meal.img}" alt="${meal.title}" />
                <div>
                  <div class="afinity-modal-cart-title">${meal.title}</div>
                  <div class="afinity-modal-cart-qty">x ${meal.qty}</div>
                </div>
              </div>
            `).join('')}
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
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M3 6h10M5 6v7a2 2 0 0 0 2 2h2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path></svg>
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
              <div class="afinity-meals-date-select" style="min-width:220px;max-width:260px;display:flex;flex-direction:column;align-items:flex-end;">
                <label class="afinity-modal-select-label">Delivery Date</label>
                <input id="afinity-meals-date" type="date" value="${currentDeliveryDate}" style="font-size:1rem;padding:6px 10px;border-radius:4px;border:1px solid #ccc;min-width:160px;" />
              </div>
            </div>
          </div>
          <div class="afinity-meals-layout">
          <div class="afinity-meals-main">
            <h2 class="afinity-meals-section-title">Hot Meals</h2>
            <ul class="afinity-meals-grid">
              ${MEALS.slice(0, 3).map(meal => renderMealCard(meal)).join('')}
            </ul>
            <h2 class="afinity-meals-section-title" style="margin-top:2rem;">Cold Meals</h2>
            <ul class="afinity-meals-grid">
              ${COLD_MEALS.slice(0, 3).map(meal => renderMealCard(meal)).join('')}
            </ul>
          </div>
          <div class="afinity-modal-card afinity-meals-sidebar">
            <h3>Current Meals in Subscription</h3>
            <ul class="afinity-meals-sidebar-list">
              ${selectedMeals.filter(m=>m.qty>0).map(meal => `
                <li>
                  <img src="${meal.img}" alt="${meal.title}" />
                  <div>
                    <div class="afinity-meals-sidebar-title">${meal.title}</div>
                    <div class="afinity-meals-sidebar-qty">x ${meal.qty}</div>
                  </div>
                </li>
              `).join('')}
            </ul>
            <h3>New meals to your Subscription</h3>
            <button class="afinity-meals-swap-btn">Swap Items <span class="afinity-meals-swap-count">0</span></button>
          </div>
        </div>
      </div>
    `;
  }

  // Helper to render a meal card (reuse for both catalogs)
  function renderMealCard(meal) {
    return `
      <li class="afinity-r-meals-grid__item" style="display: block;"
        data-product-start-date="2025-01-01"
        data-product-end-date="2025-12-31"
        data-is-first-variant="true"
      >
        <div class="afinity-r-card" 
          data-variant-id="${meal.id}"
          data-collection-id="1"
          data-product-id="${meal.id}"
          data-catalog-id="demo-catalog-id"
          data-selling-plan-groups="[]">
          <div class="afinity-r-card__container">
            <div class="afinity-r-card__image-link">
              <img
                src="${meal.img}"
                alt="${meal.title}"
                class="afinity-r-card__image"
                loading="lazy"
                width="220"
                height="200"
              >
            </div>
            <div class="afinity-r-card__details">
              <h3 class="afinity-r-card__title">
                <span class="afinity-r-card__title-link">
                  ${meal.title}
                </span>
              </h3>
              <div class="afinity-r-card__footer">
                <div class="price__container price-block" data-variant-id="${meal.id}">
                  <span class="afinity-r-card__price--discount price-item--regular" data-variant-id="${meal.id}">
                    $${meal.price.toFixed(2)}
                  </span>
                </div>
                <div class="price-action-wrapper" data-variant-id="${meal.id}">
                  ${selectedMeals.find(m=>m.id===meal.id&&m.qty>0) ? `
                    <button class="afinity-r-card__add-btn afinity-r-card__add-btn--smart afinity-r-card__remove-btn" type="button" data-meal-id="${meal.id}" style="background:#c0392b;">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="4" y="9" width="12" height="2" rx="1" fill="white"/>
                      </svg>
                    </button>
                  ` : `
                    <button class="afinity-r-card__add-btn afinity-r-card__add-btn--smart" type="button" data-meal-id="${meal.id}">
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
    modalOverlay.querySelectorAll('.afinity-r-card__remove-btn').forEach(btn => {
      btn.onclick = (e) => {
        const mealId = parseInt(btn.getAttribute('data-meal-id'));
        const idx = selectedMeals.findIndex(m => m.id === mealId);
        if (idx !== -1) {
          selectedMeals[idx].qty = 0;
          updateModalChanges('selectedMeals', JSON.parse(JSON.stringify(selectedMeals)));
        }
        renderModal();
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

  // Listen for the event on document
  document.addEventListener('Recharge::click::manageSubscription', function(event) {
    event.preventDefault();
    
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
        })
        .catch(error => {
          console.error('Error fetching subscription data:', error);
          // Fallback to default modal if API fails
          currentPage = 'main';
          if (modalOverlay) {
            modalOverlay.style.display = '';
          }
          renderModal();
        });
    } else {
      // Fallback if no subscription ID
      currentPage = 'main';
      if (modalOverlay) {
        modalOverlay.style.display = '';
      }
      renderModal();
    }
  });
})(); 