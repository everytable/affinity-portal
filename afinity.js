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
    }
  ];
  let selectedMeals = [...MEALS];

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
    const address = subscriptionData?.include?.address;
    const address1 = address?.address1 || '';
    const city = address?.city || '';
    const state = address?.province || '';
    const zip = address?.zip || '';

    // Extract fulfillment date, time, and method from order attributes
    let fulfillmentDate = '';
    let fulfillmentTime = '';
    let fulfillmentMethod = ''; // Default to delivery
    
    if (address?.order_attributes) {
      const fulfillmentDateAttr = address.order_attributes.find(attr => attr.name === 'Fulfillment Date');
      if (fulfillmentDateAttr) {
        const fulfillmentDateTime = fulfillmentDateAttr.value; // "2025-07-03T20:15:00-07:00"
        fulfillmentDate = fulfillmentDateTime.split('T')[0]; // "2025-07-03"
        fulfillmentTime = fulfillmentDateTime.split('T')[1].split('-')[0]; // "20:15:00" -> "20:15"
      }
      
      // Look for fulfillment method in order attributes
      const fulfillmentMethodAttr = address.order_attributes.find(attr => 
        attr.name === '_fulfillmentMethod' || 
        attr.name === 'fulfillmentMethod' || 
        attr.name === 'Fulfillment Method'
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
        <span class="afinity-modal-date">${date} ${price}</span>
      </div>
      <div class="afinity-modal-content">
        <div class="afinity-modal-card-frequency">
          <button class="afinity-modal-back">&#8592; Back</button>
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
              <option value="AL" ${state === 'Alabama' ? 'selected' : ''}>AL</option>
              <option value="AK" ${state === 'Alaska' ? 'selected' : ''}>AK</option>
              <option value="AZ" ${state === 'Arizona' ? 'selected' : ''}>AZ</option>
              <option value="AR" ${state === 'Arkansas' ? 'selected' : ''}>AR</option>
              <option value="CA" ${state === 'California' ? 'selected' : ''}>CA</option>
              <option value="CO" ${state === 'Colorado' ? 'selected' : ''}>CO</option>
              <option value="CT" ${state === 'Connecticut' ? 'selected' : ''}>CT</option>
              <option value="DE" ${state === 'Delaware' ? 'selected' : ''}>DE</option>
              <option value="FL" ${state === 'Florida' ? 'selected' : ''}>FL</option>
              <option value="GA" ${state === 'Georgia' ? 'selected' : ''}>GA</option>
              <option value="HI" ${state === 'Hawaii' ? 'selected' : ''}>HI</option>
              <option value="ID" ${state === 'Idaho' ? 'selected' : ''}>ID</option>
              <option value="IL" ${state === 'Illinois' ? 'selected' : ''}>IL</option>
              <option value="IN" ${state === 'Indiana' ? 'selected' : ''}>IN</option>
              <option value="IA" ${state === 'Iowa' ? 'selected' : ''}>IA</option>
              <option value="KS" ${state === 'Kansas' ? 'selected' : ''}>KS</option>
              <option value="KY" ${state === 'Kentucky' ? 'selected' : ''}>KY</option>
              <option value="LA" ${state === 'Louisiana' ? 'selected' : ''}>LA</option>
              <option value="ME" ${state === 'Maine' ? 'selected' : ''}>ME</option>
              <option value="MD" ${state === 'Maryland' ? 'selected' : ''}>MD</option>
              <option value="MA" ${state === 'Massachusetts' ? 'selected' : ''}>MA</option>
              <option value="MI" ${state === 'Michigan' ? 'selected' : ''}>MI</option>
              <option value="MN" ${state === 'Minnesota' ? 'selected' : ''}>MN</option>
              <option value="MS" ${state === 'Mississippi' ? 'selected' : ''}>MS</option>
              <option value="MO" ${state === 'Missouri' ? 'selected' : ''}>MO</option>
              <option value="MT" ${state === 'Montana' ? 'selected' : ''}>MT</option>
              <option value="NE" ${state === 'Nebraska' ? 'selected' : ''}>NE</option>
              <option value="NV" ${state === 'Nevada' ? 'selected' : ''}>NV</option>
              <option value="NH" ${state === 'New Hampshire' ? 'selected' : ''}>NH</option>
              <option value="NJ" ${state === 'New Jersey' ? 'selected' : ''}>NJ</option>
              <option value="NM" ${state === 'New Mexico' ? 'selected' : ''}>NM</option>
              <option value="NY" ${state === 'New York' ? 'selected' : ''}>NY</option>
              <option value="NC" ${state === 'North Carolina' ? 'selected' : ''}>NC</option>
              <option value="ND" ${state === 'North Dakota' ? 'selected' : ''}>ND</option>
              <option value="OH" ${state === 'Ohio' ? 'selected' : ''}>OH</option>
              <option value="OK" ${state === 'Oklahoma' ? 'selected' : ''}>OK</option>
              <option value="OR" ${state === 'Oregon' ? 'selected' : ''}>OR</option>
              <option value="PA" ${state === 'Pennsylvania' ? 'selected' : ''}>PA</option>
              <option value="RI" ${state === 'Rhode Island' ? 'selected' : ''}>RI</option>
              <option value="SC" ${state === 'South Carolina' ? 'selected' : ''}>SC</option>
              <option value="SD" ${state === 'South Dakota' ? 'selected' : ''}>SD</option>
              <option value="TN" ${state === 'Tennessee' ? 'selected' : ''}>TN</option>
              <option value="TX" ${state === 'Texas' ? 'selected' : ''}>TX</option>
              <option value="UT" ${state === 'Utah' ? 'selected' : ''}>UT</option>
              <option value="VT" ${state === 'Vermont' ? 'selected' : ''}>VT</option>
              <option value="VA" ${state === 'Virginia' ? 'selected' : ''}>VA</option>
              <option value="WA" ${state === 'Washington' ? 'selected' : ''}>WA</option>
              <option value="WV" ${state === 'West Virginia' ? 'selected' : ''}>WV</option>
              <option value="WI" ${state === 'Wisconsin' ? 'selected' : ''}>WI</option>
              <option value="WY" ${state === 'Wyoming' ? 'selected' : ''}>WY</option>
            </select>
            <input id="afinity-zip" type="text" placeholder="12345" style="flex:1;" value="${zip}" />
          </div>
        </div>
        <div class="afinity-modal-card">
          <div class="afinity-modal-card-title">Update Subscription Date</div>
          <div class="afinity-modal-row">
            <label for="afinity-date">Date</label>
            <input id="afinity-date" type="date" value="${deliveryDate}" />
          </div>
          <div class="afinity-modal-row">
            <label for="afinity-time">Time</label>
            <input id="afinity-time" type="time" value="${fulfillmentTime}" />
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
    // Remove any existing modal
    if (modalOverlay) modalOverlay.remove();
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'afinity-modal-overlay';
    modalOverlay.id = 'afinity-modal-overlay';
    modalOverlay.innerHTML = renderModalContent();
    document.body.appendChild(modalOverlay);
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
    // ...existing main modal content, but replace 'Add extra meal to order' with a link that sets currentPage = 'meals' and re-renders...
    return `
      <button class="afinity-modal-close" title="Close">&times;</button>
      <div class="afinity-modal-header">
        <span class="afinity-modal-date">Subscription Details</span>
      </div>
      <div class="afinity-modal-content">
        <div class="afinity-modal-card-frequency">
          <button class="afinity-modal-back">&#8592; Back</button>
          <div class="afinity-modal-card-frequency-content">
            <div class="afinity-modal-row-frequency">
              <label for="afinity-frequency">Frequency</label>
              <select id="afinity-frequency">
                <option>2 week subscription with 10% discount</option>
                <option>1 week subscription</option>
              </select>
            </div>
            <button class="afinity-modal-update-meals">Edit contents</button>
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
            <input id="afinity-address" type="text" placeholder="12345 Street Dr." />
          </div>
          <div class="afinity-modal-row afinity-modal-address-row">
            <input id="afinity-city" type="text" placeholder="Anytown" style="flex:2; margin-right:8px;" />
            <select id="afinity-state" style="flex:1; margin-right:8px;">
              <option>CA</option>
              <option>NY</option>
            </select>
            <input id="afinity-zip" type="text" placeholder="12345" style="flex:1;" />
          </div>
        </div>
        <div class="afinity-modal-card">
          <div class="afinity-modal-card-title">Update Subscription Date</div>
          <div class="afinity-modal-row">
            <label for="afinity-date">Date</label>
            <input id="afinity-date" type="date" value="${deliveryDate}" />
          </div>
          <div class="afinity-modal-row">
            <label for="afinity-time">Time</label>
            <input id="afinity-time" type="time" value="15:30" />
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
  }

  function renderMealsPage() {
    return `
      <div class="afinity-modal-card afinity-meals-header-card">
        <button class="afinity-modal-back">&lt; Back</button>
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
    modalOverlay.querySelector('.afinity-modal-close').onclick = () => modalOverlay.remove();
    // Back button
    const backBtn = modalOverlay.querySelector('.afinity-modal-back');
    if (backBtn) backBtn.onclick = () => {
      if (currentPage === 'meals') {
        currentPage = 'main';
        renderModal(); // force rerender to main page
      } else {
        modalOverlay.remove();
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
    if (cancelBtn) cancelBtn.onclick = () => modalOverlay.remove();
    const saveBtn = modalOverlay.querySelector('.afinity-modal-save-btn');
    if (saveBtn) saveBtn.onclick = () => {
      // TODO: Save logic
      modalOverlay.remove();
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
    currentPage = 'main';
    renderModal();
  });
})(); 