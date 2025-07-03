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
  let deliveryDate = '2025-12-12'; // default, will be set from order attributes if available

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

  // Helper to format delivery date
  function formatDeliveryDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
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
  // Optionally, set a price variable if you want to show price
  let price = '3.99'; // Replace with real price if available

  function createModal(subscriptionData = null) {
    // Remove any existing modal
    const old = document.getElementById('afinity-modal-overlay');
    if (old) old.remove();

    console.log("subscriptionData", subscriptionData);
    // Use subscription data if available, otherwise use defaults
    const date = subscriptionData ? new Date(subscriptionData.next_charge_scheduled_at).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }): "N/A";
    const price = subscriptionData ? `$${parseFloat(subscriptionData.price).toFixed(2)}` : '$3.99';

    // Extract address data if available
    if (subscriptionData && subscriptionData.include && subscriptionData.include.address) {
      address1 = subscriptionData.include.address.address1 || '';
      city = subscriptionData.include.address.city || '';
      state = subscriptionData.include.address.province_code || subscriptionData.include.address.province || '';
      zip = subscriptionData.include.address.zip || '';
    }

    // Extract fulfillment date, time, and method from order note attributes
    if (subscriptionData?.order_attributes) {
      const fulfillmentDateAttr = subscriptionData.order_attributes.find(attr => 
        attr.name === 'Fulfillment Date' || 
        attr.name === 'Delivery Date' ||
        attr.name === 'delivery_date'
      );
      if (fulfillmentDateAttr) {
        const fulfillmentDateTime = fulfillmentDateAttr.value; // "2025-07-03T20:15:00-07:00"
        fulfillmentDate = fulfillmentDateTime.split('T')[0]; // "2025-07-03"
        fulfillmentTime = fulfillmentDateTime.split('T')[1].split('-')[0]; // "20:15:00" -> "20:15"
      }
      
      // Look for fulfillment method in order attributes
      const fulfillmentMethodAttr = subscriptionData.order_attributes.find(attr => 
        attr.name === '_fulfillmentMethod' || 
        attr.name === 'fulfillmentMethod' || 
        attr.name === 'Fulfillment Method' ||
        attr.name === 'delivery_method'
      );
      if (fulfillmentMethodAttr) {
        fulfillmentMethod = fulfillmentMethodAttr.value;
      }
    }

    // Determine frequency text based on subscription data
    const frequencyText = subscriptionData ? 
      `${subscriptionData.order_interval_frequency} ${subscriptionData.order_interval_unit} subscription` : 
      '1 week subscription';

    // Modal HTML
    const overlay = document.createElement('div');
    overlay.className = 'afinity-modal-overlay';
    overlay.id = 'afinity-modal-overlay';
    overlay.innerHTML = `
      <button class="afinity-modal-close" title="Close">&times;</button>
      <div class="afinity-modal-header">
        <span class="afinity-modal-date">${formatDeliveryDate(deliveryDate)} $${price}</span>
      </div>
      <div class="afinity-modal-content">
        <div class="afinity-modal-card-frequency">
          <button class="afinity-modal-back">< Back</button>
          <div class="afinity-modal-card-frequency-content">
            <div class="afinity-modal-row-frequency">
              <label class="afinity-modal-label" for="afinity-frequency">Frequency</label>
              <select id="afinity-frequency">
                <option ${subscriptionData?.order_interval_frequency === 2 ? 'selected' : ''}>2 week subscription with 10% discount</option>
                <option ${subscriptionData?.order_interval_frequency === 1 ? 'selected' : ''}>1 week subscription with 10% discount</option>
              </select>
            </div>
            <button class="afinity-modal-update-meals">Update meals</button>
          </div>
          <div class="afinity-modal-cart-list">
            <div class="afinity-modal-cart-item">
              <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=facearea&w=64&h=64" alt="Blueberry Maple Yogurt Parfait" />
              <div>
                <div class="afinity-modal-cart-title">Blueberry Maple Yogurt Parfait</div>
                <div class="afinity-modal-cart-qty">x 1</div>
              </div>
            </div>
            <div class="afinity-modal-cart-item">
              <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=facearea&w=64&h=64" alt="Monica's Breakfast Burrito" />
              <div>
                <div class="afinity-modal-cart-title">Monica's Breakfast Burrito</div>
                <div class="afinity-modal-cart-qty">x 1</div>
              </div>
            </div>
          </div>
        </div>
        <div class="afinity-modal-card">
          <div class="afinity-modal-card-title">Update Subscription Delivery or Pickup</div>
          <div class="afinity-modal-row">
            <label for="afinity-method">Method</label>
            <select id="afinity-method">
              <option value="Delivery" ${fulfillmentMethod === 'Delivery' ? 'selected' : ''}>Delivery</option>
              <option value="Pickup" ${fulfillmentMethod === 'Pickup' ? 'selected' : ''}>Pickup</option>
            </select>
          </div>
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
        </div>
        <div class="afinity-modal-card">
          <div class="afinity-modal-card-title">Update Subscription Date</div>
          <div class="afinity-modal-row">
            <label for="afinity-date">Date</label>
            <input id="afinity-date" type="date" value="${fulfillmentDate || deliveryDate}" />
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
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M3 6h10M5 6v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V6m-7 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path></svg>
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
    // Close logic
    overlay.querySelector('.afinity-modal-close').onclick = () => overlay.remove();
    overlay.querySelector('.afinity-modal-back').onclick = () => overlay.remove();
    overlay.querySelector('.afinity-modal-cancel-btn').onclick = () => overlay.remove();
    overlay.querySelector('.afinity-modal-save-btn').onclick = () => {
      // TODO: Implement save logic
      console.log('Save Changes clicked');
    };
    overlay.querySelector('.afinity-cancel-subscription').onclick = (e) => {
      e.preventDefault();
      // TODO: Implement cancel subscription logic
      console.log('Cancel subscription clicked');
    };
    // Add click handler for add extra meal
    overlay.querySelector('.afinity-modal-add-extra').onclick = (e) => {
      e.preventDefault();
      // TODO: Implement add extra meal logic
      console.log('Add extra meal clicked');
    };
    document.body.appendChild(overlay);
    // Animate in (already handled by CSS)
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
    return `
      <button class="afinity-modal-close" title="Close">&times;</button>
      <div class="afinity-modal-header">
        <span class="afinity-modal-date"><span class="afinity-modal-date-label">${formatDeliveryDate(deliveryDate)}</span> <span class="afinity-modal-price">$${price}</span></span>
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
          <div class="afinity-modal-row">
            <label for="afinity-method">Method</label>
            <select id="afinity-method">
              <option>Delivery</option>
              <option>Pickup</option>
            </select>
          </div>
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
        </div>
        <div class="afinity-modal-card">
          <div class="afinity-modal-card-title">Update Subscription Date</div>
          <div class="afinity-modal-row">
            <label for="afinity-date">Date</label>
            <input id="afinity-date" type="date" value="${fulfillmentDate || deliveryDate}" />
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
    return `
      <button class="afinity-modal-close" title="Close">&times;</button>
      <div class="afinity-modal-header">
        <span class="afinity-modal-date">${formatDeliveryDate(deliveryDate)} $${price}</span>
      </div>
      <div class="afinity-modal-card afinity-meals-header-card">
        <button class="afinity-modal-back">< Back</button>
        <div class="afinity-meals-title-group">
          <h2 class="afinity-meals-title">Update Subscription Meals</h2>
          <div class="afinity-meals-date-select">
            <label>Delivery Date</label>
            <input id="afinity-meals-date" type="date" value="${deliveryDate}" />
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
              attr.name === 'Fulfillment Date' || 
              attr.name === 'Delivery Date' ||
              attr.name === 'delivery_date' ||
              attr.name === '_selectedFulfillmentDate'
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
          if (payload.next_charge_scheduled_at) {
            deliveryDate = payload.next_charge_scheduled_at.split('T')[0];
          }
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