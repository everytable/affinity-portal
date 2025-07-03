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

  // Example static meal data for demo
  const MEALS = [
    {
      id: 1,
      title: 'Blueberry Maple Yogurt Parfait',
      price: 6.7,
      img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=facearea&w=400&h=400',
      qty: 1
    },
    {
      id: 2,
      title: "Monica's Breakfast Burrito",
      price: 6.7,
      img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=facearea&w=400&h=400',
      qty: 1
    },
    {
      id: 3,
      title: 'Backyard BBQ Chicken Salad',
      price: 6.7,
      img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=facearea&w=400&h=400',
      qty: 0
    },
    {
      id: 3,
      title: 'Backyard BBQ Chicken Salad',
      price: 6.7,
      img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=facearea&w=400&h=400',
      qty: 0
    },
    {
      id: 3,
      title: 'Backyard BBQ Chicken Salad',
      price: 6.7,
      img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=facearea&w=400&h=400',
      qty: 0
    },
    {
      id: 3,
      title: 'Backyard BBQ Chicken Salad',
      price: 6.7,
      img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=facearea&w=400&h=400',
      qty: 0
    },
    {
      id: 3,
      title: 'Backyard BBQ Chicken Salad',
      price: 6.7,
      img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=facearea&w=400&h=400',
      qty: 0
    },
    {
      id: 3,
      title: 'Backyard BBQ Chicken Salad',
      price: 6.7,
      img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=facearea&w=400&h=400',
      qty: 0
    },
    {
      id: 3,
      title: 'Backyard BBQ Chicken Salad',
      price: 6.7,
      img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=facearea&w=400&h=400',
      qty: 0
    },
    {
      id: 3,
      title: 'Backyard BBQ Chicken Salad',
      price: 6.7,
      img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=facearea&w=400&h=400',
      qty: 0
    },
    {
      id: 3,
      title: 'Backyard BBQ Chicken Salad',
      price: 6.7,
      img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=facearea&w=400&h=400',
      qty: 0
    },
    {
      id: 3,
      title: 'Backyard BBQ Chicken Salad',
      price: 6.7,
      img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=facearea&w=400&h=400',
      qty: 0
    },
    {
      id: 3,
      title: 'Backyard BBQ Chicken Salad',
      price: 6.7,
      img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=facearea&w=400&h=400',
      qty: 0
    }
  ];
  let selectedMeals = [...MEALS];

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
  let zip = '';
  
  // Fulfillment state
  let fulfillmentDate = '';
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
  let selectedPickupLocationId = PICKUP_LOCATIONS[0].id;

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

  function renderMethodSection() {
    // Determine method
    let method = fulfillmentMethod || 'Delivery';
    return `
      <div class="afinity-modal-row">
        <label for="afinity-method">Method</label>
        <select id="afinity-method">
          <option value="Delivery" ${method === 'Delivery' ? 'selected' : ''}>Delivery</option>
          <option value="Pickup" ${method === 'Pickup' ? 'selected' : ''}>Pickup</option>
        </select>
      </div>
      ${method === 'Pickup' ? `
        <div class="afinity-modal-pickup-list">
          ${PICKUP_LOCATIONS.map(loc => `
            <label class="afinity-modal-pickup-item">
              <div class="afinity-modal-pickup-meta">
                <div class="afinity-modal-pickup-label">RETAIL LOCATION</div>
                <div class="afinity-modal-pickup-name">${loc.name} ${loc.address}</div>
              </div>
              <div class="afinity-modal-pickup-distance-container">
                <div class="afinity-modal-pickup-distance">${loc.distance} mi</div>
                <input type="radio" name="pickup-location" value="${loc.id}" ${selectedPickupLocationId === loc.id ? 'checked' : ''} />
              </div>
            </label>
          `).join('')}
        </div>
      ` : `
        <div class="afinity-modal-row">
          <label for="afinity-address">Address</label>
          <input id="afinity-address" type="text" placeholder="12345 Street Dr." value="${address1}" />
        </div>
        <div class="afinity-modal-row afinity-modal-address-row">
          <input id="afinity-city" type="text" placeholder="Anytown" style="flex:2; margin-right:8px;" value="${city}" />
          <select id="afinity-state" style="flex:1; margin-right:8px;">
            ${US_STATES.map(s => `<option value="${s.code}" ${state === s.code || state === s.name ? 'selected' : ''}>${s.code}</option>`).join('')}
          </select>
          <input id="afinity-zip" type="text" placeholder="12345" style="flex:1;" value="${zip}" />
        </div>
      `}
    `;
  }

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
    attachMethodSectionEvents();
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
            <label for="afinity-date">Date</label>
            <input id="afinity-date" type="date" value="${currentDeliveryDate}" />
          </div>
          <div class="afinity-modal-row">
            <label for="afinity-time">Time</label>
            <input id="afinity-time" type="time" value="${fulfillmentTime || '15:30'}" />
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
        <span class="afinity-modal-date">${formatDeliveryDate(currentDeliveryDate)} $${price}</span>
      </div>
      <div class="afinity-modal-card afinity-meals-header-card">
        <button class="afinity-modal-back">< Back</button>
        <div class="afinity-meals-title-group">
          <h2 class="afinity-meals-title">Update Subscription Meals</h2>
          <div class="afinity-meals-date-select">
            <label>Delivery Date</label>
            <input id="afinity-meals-date" type="date" value="${currentDeliveryDate}" />
          </div>
          <div class="afinity-meals-desc">Update your subscription meals. Remove or add more meals to your order.</div>
        </div>
      </div>
      <div class="afinity-meals-layout">
        <div class="afinity-meals-main">
          <h2 class="afinity-meals-section-title">Hot Meals</h2>
          <ul class="afinity-meals-grid">
            ${MEALS.map(meal => `
              <li class="recharge-meals-grid__item" style="display: block;"
                data-product-start-date="2025-01-01"
                data-product-end-date="2025-12-31"
                data-is-first-variant="true"
              >
                <div class="recharge-card" 
                  data-variant-id="${meal.id}"
                  data-collection-id="1"
                  data-product-id="${meal.id}"
                  data-catalog-id="demo-catalog-id"
                  data-selling-plan-groups="[]">
                  <div class="recharge-card__container">
                    <div class="recharge-card__image-link">
                      <img
                        src="${meal.img}"
                        alt="${meal.title}"
                        class="recharge-card__image"
                        loading="lazy"
                        width="220"
                        height="200"
                      >
                    </div>
                    <div class="recharge-card__details">
                      <h3 class="recharge-card__title">
                        <span class="recharge-card__title-link">
                          ${meal.title}
                        </span>
                      </h3>
                      <div class="recharge-card__footer">
                        <div class="price__container price-block" data-variant-id="${meal.id}">
                          <span class="recharge-card__price--discount price-item--regular" data-variant-id="${meal.id}">
                            $${meal.price.toFixed(2)}
                          </span>
                        </div>
                        <div class="price-action-wrapper" data-variant-id="${meal.id}">
                          ${selectedMeals.find(m=>m.id===meal.id&&m.qty>0) ? `
                            <button class="recharge-card__add-btn recharge-card__add-btn--smart recharge-card__remove-btn" type="button" data-meal-id="${meal.id}" style="background:#c0392b;">
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="4" y="9" width="12" height="2" rx="1" fill="white"/>
                              </svg>
                            </button>
                          ` : `
                            <button class="recharge-card__add-btn recharge-card__add-btn--smart" type="button" data-meal-id="${meal.id}">
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
            `).join('')}
          </ul>
        </div>
        <div class="afinity-modal-card afinity-meals-sidebar">
          <h3>Current Meals in Subscription</h3>
          <ul class="afinity-meals-sidebar-list">
            ${selectedMeals.filter(m=>m.qty>0).map(meal => `
              <li><img src="${meal.img}" alt="${meal.title}" /> ${meal.title} <span>x ${meal.qty}</span></li>
            `).join('')}
          </ul>
          <div class="afinity-meals-sidebar-title">New meals to your Subscription</div>
          <button class="afinity-meals-swap-btn">Swap Items <span class="afinity-meals-swap-count">0</span></button>
        </div>
      </div>
    `;
  }

  function attachModalEvents() {
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
      modalOverlay.style.display = 'none';
    };
    const cancelSubBtn = modalOverlay.querySelector('.afinity-cancel-subscription');
    if (cancelSubBtn) cancelSubBtn.onclick = (e) => {
      e.preventDefault();
      // TODO: Cancel subscription logic
      alert('Cancel subscription clicked');
    };
    // Meal add/remove
    modalOverlay.querySelectorAll('.recharge-card__remove-btn').forEach(btn => {
      btn.onclick = (e) => {
        const mealId = parseInt(btn.getAttribute('data-meal-id'));
        const idx = selectedMeals.findIndex(m => m.id === mealId);
        if (idx !== -1) {
          selectedMeals[idx].qty = 0;
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
      deliveryDate = e.target.value;
    };
    // Date input on meals page
    const mealsDateInput = modalOverlay.querySelector('#afinity-meals-date');
    if (mealsDateInput) mealsDateInput.onchange = (e) => {
      deliveryDate = e.target.value;
    };
  }

  function attachMethodSectionEvents() {
    const methodSelect = modalOverlay.querySelector('#afinity-method');
    if (methodSelect) {
      methodSelect.onchange = (e) => {
        fulfillmentMethod = e.target.value;
        // Only re-render the method section
        const section = modalOverlay.querySelector('#afinity-method-section');
        if (section) {
          section.innerHTML = renderMethodSection();
          attachMethodSectionEvents();
        }
      };
    }
    // Listen for pickup location change
    const pickupRadios = modalOverlay.querySelectorAll('input[name="pickup-location"]');
    pickupRadios.forEach(radio => {
      radio.onchange = (e) => {
        selectedPickupLocationId = parseInt(e.target.value);
        // Only re-render the method section
        const section = modalOverlay.querySelector('#afinity-method-section');
        if (section) {
          section.innerHTML = renderMethodSection();
          attachMethodSectionEvents();
        }
      };
    });
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
            
            const fulfillmentMethodAttr = payload.include.address.order_attributes.find(attr => 
              attr.name === 'Fulfillment Type'
            );
            if (fulfillmentMethodAttr) {
              fulfillmentMethod = fulfillmentMethodAttr.value;
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