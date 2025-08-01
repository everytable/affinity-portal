// affinity.js - Standalone modal widget
(function() {

  // Initialize Recharge client
  if (typeof recharge === 'undefined') {
    // Load Recharge client script
    const script = document.createElement('script');
    script.src = 'https://static.rechargecdn.com/assets/storefront/recharge-client-1.36.0.min.js';
    script.onload = function() {
      if (typeof apiToken !== 'undefined') {
        recharge.init({storefrontAccessToken: apiToken});
      } else {
        console.error('apiToken is not defined. Please ensure it is available globally.');
      }
    };
    document.head.appendChild(script);
  } else {
    // Recharge client already loaded, just initialize
    if (typeof apiToken !== 'undefined') {
      recharge.init({storefrontAccessToken: apiToken});
    } else {
      console.error('apiToken is not defined. Please ensure it is available globally.');
    }
  }

  const originalDispatchEvent = EventTarget.prototype.dispatchEvent;

  EventTarget.prototype.dispatchEvent = function(event) {
    if (event.type.includes("Recharge")) {
      // Event handling for debugging
    }
    return originalDispatchEvent.call(this, event);
  };
  
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
  let availableFrequencies = [];
  let selectedFrequency = null;
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
    { id: 14, title: 'Miso Soup & Rice', price: 5.5, img: MEAL_IMAGE, qty:   0 },
    { id: 15, title: 'Fruit & Nut Parfait', price: 6.8, img: MEAL_IMAGE, qty: 0 },
  ];
  let selectedMeals = []; // For one-time meals
  let updateModeMeals = []; // For subscription update mode
  let originalSubscriptionMeals = [];
  let currentCatalogPayload = null;

  // Helper function to get the current meals array based on mode
  function getCurrentMealsArray() {
    return mealsPageMode === 'update' ? updateModeMeals : selectedMeals;
  }

  // Helper function to update the current meals array based on mode
  function updateCurrentMealsArray(meals) {
    if (mealsPageMode === 'update') {
      updateModeMeals = meals;
    } else {
      selectedMeals = meals;
    }
  }
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
  let address2 = '';
  let city = '';
  let state = '';
  let zip = '';
  
  // Fulfillment state
  let fulfillmentTime = '';
  let fulfillmentMethod = '';
  let deliveryDate = '';

  // Add static pickup locations
  let selectedPickupLocationId = null;

  let pickupLocations = [];
  let pickupLocationsLoading = false;

  // Add at the top, after let pickupLocations = [];
  let pickupLocationsPromise = null;

  // Global object to store all requested changes
  let modalChanges = {};
  
  // Cache for offset days
  let cachedOffsetDays = null;
  
  // Add request tracking to prevent concurrent API calls
  let isUpdatingSubscription = false;
  let updateRequestQueue = [];
  
  // Recharge API integration for cancel subscription
  const rechargeAPI = {
    session: null,

    async authenticate() {
      try {
        if (this.session) {
          return this.session;
        }
        this.session = await recharge.auth.loginCustomerPortal();
        return this.session;
      } catch (error) {
        console.error("Could not authenticate:", error);
        throw error;
      }
    },

    async getActiveChurnLandingPageURL(subscriptionId) {
      try {
        const response = await recharge.customer.getActiveChurnLandingPageURL(this.session, subscriptionId, window.location.href);
        return response;
      } catch (error) {
        console.error("Could not get churn landing page URL:", error);
        throw error;
      }
    }
  };
  
  // Helper function to update modalChanges with logging
  function updateModalChanges(key, value) {
    modalChanges[key] = value;
  }
  
  // Cancel subscription functionality
  async function handleCancelSubscription() {
    try {
      const subscriptionId = currentSubscription?.id;
      if (!subscriptionId) {
        showToast('No subscription found', 'error');
        return;
      }

      showModalLoading();
      await rechargeAPI.authenticate();
      await redirectToChurnPage(subscriptionId);
    } catch (error) {
      console.error('Failed to handle cancel subscription:', error);
      showToast('Unable to process cancellation. Please try again or contact support.', 'error');
    } finally {
      hideModalLoading();
    }
  }

  async function redirectToChurnPage(subscriptionId) {
    try {
      const churnUrl = await rechargeAPI.getActiveChurnLandingPageURL(subscriptionId);
      window.location.href = churnUrl;
    } catch (error) {
      console.error('Failed to redirect to churn page:', error);
      showToast('Unable to process cancellation. Please try again or contact support.', 'error');
    }
  }



  // Function to fetch charges for the address
  async function fetchChargesForAddress(addressId) {
    try {
      // Fetch both queued and skipped charges
      const [queuedResponse, skippedResponse] = await Promise.all([
        fetch(`${API_URL}/subscription/charges/by-address?address_id=${addressId}&status=queued`),
        fetch(`${API_URL}/subscription/charges/by-address?address_id=${addressId}&status=skipped`)
      ]);

      if (!queuedResponse.ok || !skippedResponse.ok) {
        throw new Error('Failed to fetch charges');
      }

      const [queuedData, skippedData] = await Promise.all([
        queuedResponse.json(),
        skippedResponse.json()
      ]);

      // Combine both arrays and sort by scheduled date
      const allCharges = [
        ...(queuedData.charges || []),
        ...(skippedData.charges || [])
      ].sort((a, b) => {
        const dateA = new Date(a.scheduled_at || 0);
        const dateB = new Date(b.scheduled_at || 0);
        return dateA - dateB;
      });

      return allCharges;
    } catch (error) {
      console.error('Error fetching charges:', error);
      return [];
    }
  }

  // Function to render charges table
  async function renderChargesTable(charges) {
    if (!charges || charges.length === 0) {
      return '<div class="afinity-no-charges">No charges found.</div>';
    }

    const tableRows = charges.map(charge => {
      let scheduledDate = 'N/A';
      if (charge.scheduled_at) {
        // Parse the date components and add 2 days
        const [year, month, day] = charge.scheduled_at.split('-').map(Number);
        
        // Add 2 days to the day number
        let newDay = day + 2;
        let newMonth = month;
        let newYear = year;
        
        // Handle month boundaries
        const daysInMonth = new Date(year, month, 0).getDate(); // Get days in current month
        
        if (newDay > daysInMonth) {
          // If we exceed the current month, wrap to the next month
          newDay = newDay - daysInMonth;
          newMonth = month + 1;
          
          // Handle year boundary
          if (newMonth > 12) {
            newMonth = 1;
            newYear = year + 1;
          }
        }
        
        // Create the new date string
        const newDateStr = newYear + '-' + 
                          String(newMonth).padStart(2, '0') + '-' + 
                          String(newDay).padStart(2, '0');
        
        // Format for display
        const dateObj = new Date(newDateStr);
        scheduledDate = dateObj.toLocaleDateString();
      }
      const totalPrice = parseFloat(charge.total_price || 0).toFixed(2);
      const status = charge.status || 'unknown';
      const isSkipped = status === 'skipped';
      
      // Extract purchase_item_ids from line_items
      let purchaseItemIds = [];
      if (charge.line_items && charge.line_items.length > 0) {
        purchaseItemIds = [...new Set(charge.line_items.map(item => item.purchase_item_id))];
      }
      const purchaseItemIdsJson = JSON.stringify(purchaseItemIds);
      
      return `
        <tr class="afinity-charge-row" data-charge-id="${charge.id}">
          <td>${scheduledDate}</td>
          <td>$${totalPrice}</td>
          <td>
            <span class="afinity-charge-status afinity-status-${status}">${status}</span>
          </td>
          <td>
            ${isSkipped 
              ? `<button class="afinity-unskip-btn" data-charge-id="${charge.id}" data-purchase-item-ids='${purchaseItemIdsJson}'>Unskip</button>`
              : `<button class="afinity-skip-btn" data-charge-id="${charge.id}" data-purchase-item-ids='${purchaseItemIdsJson}'>Skip</button>`
            }
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="afinity-charges-table-wrapper">
        <table class="afinity-charges-table">
          <thead>
            <tr>
              <th>Scheduled Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  }

  // Function to handle skip charge
  async function handleSkipCharge(chargeId, purchaseItemIds) {
    try {
      const confirmed = confirm('Are you sure you want to skip this charge?');
      if (!confirmed) return;

      showModalLoading();

      const formData = new FormData();
      formData.append('charge_id', chargeId);
      if (purchaseItemIds && purchaseItemIds.length > 0) {
        formData.append('purchase_item_ids', JSON.stringify(purchaseItemIds));
      }

      const response = await fetch(`${API_URL}/subscription/charges/skip`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to skip charge');
      }

      hideModalLoading();
      showToast('Charge skipped successfully!', 'success');
      
      // Reload the entire subscription modal to reflect updated charge data
      const subscriptionId = currentSubscription?.id;
      if (subscriptionId) {
        await refreshSubscriptionData(subscriptionId);
        await renderModal();
      }
      
    } catch (error) {
      hideModalLoading();
      console.error('Error skipping charge:', error);
      showToast(error.message || 'Error skipping charge', 'error');
    }
  }

  // Function to handle unskip charge
  async function handleUnskipCharge(chargeId, purchaseItemIds) {
    try {
      const confirmed = confirm('Are you sure you want to unskip this charge?');
      if (!confirmed) return;

      showModalLoading();

      const formData = new FormData();
      formData.append('charge_id', chargeId);
      if (purchaseItemIds && purchaseItemIds.length > 0) {
        formData.append('purchase_item_ids', JSON.stringify(purchaseItemIds));
      }

      const response = await fetch(`${API_URL}/subscription/charges/unskip`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unskip charge');
      }

      hideModalLoading();
      showToast('Charge unskipped successfully!', 'success');
      
      // Reload the entire subscription modal to reflect updated charge data
      const subscriptionId = currentSubscription?.id;
      if (subscriptionId) {
        await refreshSubscriptionData(subscriptionId);
        await renderModal();
      }
      
    } catch (error) {
      hideModalLoading();
      console.error('Error unskipping charge:', error);
      showToast(error.message || 'Error unskipping charge', 'error');
    }
  }

  // Function to load and render charges table
  async function loadChargesTable() {
    const container = document.getElementById('afinity-charges-table-container');
    if (!container) return;

    try {
      container.innerHTML = '<div class="afinity-charges-loading">Loading charges...</div>';
      
      const addressId = currentSubscription?.address_id;
      if (!addressId) {
        container.innerHTML = '<div class="afinity-no-charges">No address ID found.</div>';
        return;
      }

      const charges = await fetchChargesForAddress(addressId);
      container.innerHTML = await renderChargesTable(charges);
      
      // Attach event listeners to skip/unskip buttons
      attachChargesTableEvents();
      
    } catch (error) {
      console.error('Error loading charges table:', error);
      container.innerHTML = '<div class="afinity-charges-error">Error loading charges.</div>';
    }
  }

  // Function to attach event listeners to charges table
  function attachChargesTableEvents() {
    const skipButtons = document.querySelectorAll('.afinity-skip-btn');
    const unskipButtons = document.querySelectorAll('.afinity-unskip-btn');

    skipButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const chargeId = parseInt(button.getAttribute('data-charge-id'));
        const purchaseItemIdsJson = button.getAttribute('data-purchase-item-ids');
        let purchaseItemIds = [];
        
        if (purchaseItemIdsJson) {
          try {
            purchaseItemIds = JSON.parse(purchaseItemIdsJson);
          } catch (error) {
            console.error('Error parsing purchase_item_ids:', error);
          }
        }
        
        handleSkipCharge(chargeId, purchaseItemIds);
      });
    });

    unskipButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const chargeId = parseInt(button.getAttribute('data-charge-id'));
        const purchaseItemIdsJson = button.getAttribute('data-purchase-item-ids');
        let purchaseItemIds = [];
        
        if (purchaseItemIdsJson) {
          try {
            purchaseItemIds = JSON.parse(purchaseItemIdsJson);
          } catch (error) {
            console.error('Error parsing purchase_item_ids:', error);
          }
        }
        
        handleUnskipCharge(chargeId, purchaseItemIds);
      });
    });
  }


  
  // Function to fetch offset days from API
  async function fetchOffsetDays() {
    if (cachedOffsetDays !== null) {
      return cachedOffsetDays;
    }
    
    try {
      const response = await fetch(`${API_URL}/subscription/offset-days`);
      const data = await response.json();
      
      if (data.success && data.offsetDays !== null) {
        cachedOffsetDays = data.offsetDays;
        return cachedOffsetDays;
      } else {
        // Fallback to default value
        cachedOffsetDays = 2;
        return cachedOffsetDays;
      }
    } catch (error) {
      console.error('Error fetching offset days:', error);
      // Fallback to default value
      cachedOffsetDays = 2;
      return cachedOffsetDays;
    } 
  }
  
  // Centralized function to update subscription with request debouncing
  async function updateSubscriptionSafely(subscriptionId, updatePayload) {
    // If already updating, queue this request
    if (isUpdatingSubscription) {
      return new Promise((resolve, reject) => {
        updateRequestQueue.push({ updatePayload, resolve, reject });
      });
    }
    
    isUpdatingSubscription = true;
    
    try {
      // Apply conditional fee logic before making the API call
      let finalUpdatePayload = { ...updatePayload };
      
      // Check if this is a fulfillment method change or bundle update
      const hasFulfillmentMethodChange = updatePayload.order_attributes && 
        updatePayload.order_attributes.some(attr => {
          const key = Object.keys(attr)[0];
          return key === 'Fulfillment Type';
        });
      
      const hasBundleUpdate = updatePayload.bundle_selections;
      
      if (hasFulfillmentMethodChange || hasBundleUpdate) {
        try {
          // Get the fulfillment type from the payload
          let fulfillmentType = 'Delivery'; // default
          if (updatePayload.order_attributes) {
            const fulfillmentTypeAttr = updatePayload.order_attributes.find(attr => {
              const key = Object.keys(attr)[0];
              return key === 'Fulfillment Type';
            });
            if (fulfillmentTypeAttr) {
              fulfillmentType = fulfillmentTypeAttr['Fulfillment Type'];
            }
          }
          
          // Get current subscription items (excluding fees)
          const currentItems = currentSubscription?.bundle_selections?.items || [];
          const itemsWithoutFees = currentItems.filter(item => {
            const productId = item.external_product_id || item.product_id;
            return productId !== '7927816716345' && productId !== '7933253517369';
          });
          
          // Create a mock modalChanges object with the fulfillment type from payload
          const mockModalChanges = {
            fulfillmentMethod: fulfillmentType
          };
          
          // Temporarily override the global modalChanges for fee calculation
          const originalModalChanges = modalChanges;
          modalChanges = mockModalChanges;
          
          // Apply conditional fee logic
          const updatedItems = await handleConditionalFees(itemsWithoutFees, subscriptionId);
          
          // Restore original modalChanges
          modalChanges = originalModalChanges;
          
          // Make separate API call to update bundle_selections with fees
          const bundleUpdatePayload = {
            items: updatedItems
          };
          
          const bundleResponse = await fetch(`${API_URL}/subscription/${subscriptionId}/bundle_selections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bundleUpdatePayload)
          });
          
          const bundleResult = await bundleResponse.json();
          if (!bundleResult.success) {
            console.warn('Failed to update bundle with conditional fees:', bundleResult.error);
          }
          
          // Remove bundle_selections from the main update payload since we handled it separately
          delete finalUpdatePayload.bundle_selections;
        } catch (error) {
          console.error('Error applying conditional fees:', error);
          // Continue with original payload if fee logic fails
        }
      }
      
      const response = await fetch(`${API_URL}/subscription/${subscriptionId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalUpdatePayload)
      });
      
      const result = await response.json();
      
      // Process any queued requests
      while (updateRequestQueue.length > 0) {
        const queuedRequest = updateRequestQueue.shift();
        try {
          const queuedResult = await updateSubscriptionSafely(subscriptionId, queuedRequest.updatePayload);
          queuedRequest.resolve(queuedResult);
        } catch (error) {
          queuedRequest.reject(error);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error updating subscription:', error);
      
      // Handle specific Recharge API errors
      if (error.message && error.message.includes('already in progress')) {
        // Wait 2 seconds and retry once
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          const retryResponse = await fetch(`${API_URL}/subscription/${subscriptionId}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalUpdatePayload)
          });
          const retryResult = await retryResponse.json();
          return retryResult;
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          throw retryError;
        }
      }
      
      throw error;
    } finally {
      isUpdatingSubscription = false;
    }
  }

  // Toast notification function
  function showToast(message, type = 'info') {
    // Remove any existing toasts
    const existingToast = document.querySelector('.afinity-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `afinity-toast afinity-toast-${type}`;
    
    // Set icon based on type
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    
    toast.innerHTML = `
      <span>${icon}</span>
      <span class="afinity-toast-message">${message}</span>
      <button class="afinity-toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 4000);
  }

  function showModalLoading() {
    console.log('showModalLoading');
    // Try to find modalOverlay if it doesn't exist
    if (!modalOverlay) {
      modalOverlay = document.getElementById('afinity-modal-overlay');
    }

    // If modal overlay doesn't exist, create a global loading overlay
    if (!modalOverlay || !modalOverlay.appendChild) {
      
      // Check if document.body exists
      if (!document.body) {
        return;
      }
      
      let globalLoading = document.getElementById('afinity-global-loading');
      if (!globalLoading) {
        globalLoading = document.createElement('div');
        globalLoading.id = 'afinity-global-loading';
        globalLoading.className = 'afinity-modal-loading';
        globalLoading.innerHTML = '<div class="afinity-modal-loading-spinner"></div><div class="afinity-modal-loading-text">Loading…</div>';
        
        try {
          document.body.appendChild(globalLoading);
        } catch (error) {
          console.error('showModalLoading: failed to create global loading overlay:', error);
          return;
        }
      }
      globalLoading.style.display = 'flex';
      return;
    }
    
    let loading = modalOverlay.querySelector('.afinity-modal-loading');
    if (!loading) {
      loading = document.createElement('div');
      loading.className = 'afinity-modal-loading';
      loading.innerHTML = '<div class="afinity-modal-loading-spinner"></div><div class="afinity-modal-loading-text">Loading…</div>';
      
      try {
        modalOverlay.appendChild(loading);
      } catch (error) {
        console.error('showModalLoading: failed to append loading element:', error);
        return;
      }
    }
    
    if (loading) {
      loading.style.display = 'flex';
    }
  }
  
  function hideModalLoading() {
    console.log('hideModalLoading');
    // Try to find modalOverlay if it doesn't exist
    if (!modalOverlay) {
      modalOverlay = document.getElementById('afinity-modal-overlay');
    }
    
    // Hide global loading overlay if it exists
    const globalLoading = document.getElementById('afinity-global-loading');
    if (globalLoading) {
      globalLoading.style.display = 'none';
    }
    
    // Hide modal loading overlay if it exists
    if (modalOverlay) {
      const loading = modalOverlay.querySelector('.afinity-modal-loading');
      if (loading) loading.style.display = 'none';
    }
  }

  // Global arrays to store allowed dates
  let allowedDeliveryDates = [];
  let allowedPickupDates = [];
  
  // Menu data for meals page
  let menuData = null;
  let selectedMenuCategory = null;
  
  // Track meals page mode: 'update' for editing subscription meals, 'onetime' for adding one-time meals
  let mealsPageMode = 'onetime';

  // Add global variable for current time zone
  let currentTimeZone = 'America/Los_Angeles'; // default fallback

  // Update fetchAvailableDates to store the time zone from the payload
  async function fetchAvailableDates(zip, selectedPickupLocationId) {
    
    try {
      const url = `${API_URL}/search/availability/${encodeURIComponent(zip)}`;
      
      const resp = await fetch(url);
      const data = await resp.json();
      
      // Store delivery days data globally for time options
      window.deliveryDaysData = data.deliveryDays || [];
      window.pickupLocationsData = data.pickupLocations || [];
      
      // Delivery dates
      allowedDeliveryDates = (data.deliveryDays || [])
        .filter(day => !day.isclosed && !day.isClosed)
        .map(day => day.date);
      
      // Pickup dates for the selected location
      if (selectedPickupLocationId) {
        const pickupLocation = (data.pickupLocations || []).find(
          loc => String(loc.location_id) === String(selectedPickupLocationId)
        );
        
        if (pickupLocation && pickupLocation.pickupDates) {
          allowedPickupDates = pickupLocation.pickupDates
            .filter(day => !day.isclosed && !day.isClosed)
            .map(day => day.date);
        } else {
          allowedPickupDates = [];
        }
      } else {
        allowedPickupDates = [];
      }
      
      // Store the time zone from the payload
      if (data.locationTimeZone) {
        currentTimeZone = data.locationTimeZone;
      } else if (data.time_zone) {
        currentTimeZone = data.time_zone;
      } 
      
    } catch (e) {
      console.error('Error in fetchAvailableDates:', e);
      allowedDeliveryDates = [];
      allowedPickupDates = [];
      window.deliveryDaysData = [];
      window.pickupLocationsData = [];
    }finally{
      hideModalLoading();
    }
  }

  // Helper function to generate frequency-based restricted dates
  function getRestrictedDates() {
    const today = new Date();
    const restrictedDates = [];
    
    // Get current frequency from modal changes or global variable
    const currentFrequency = modalChanges.selectedFrequency || selectedFrequency;
    
    if (currentFrequency) {
      const frequencyData = parseFrequency(currentFrequency);
      if (frequencyData) {
        const { order_interval_unit, order_interval_frequency } = frequencyData;
        
        // Calculate the number of days to restrict based on frequency
        let daysToRestrict = 0;
        
        switch (order_interval_unit) {
          case 'week':
            // For weekly subscriptions, restrict the next week's worth of days
            daysToRestrict = 7 * order_interval_frequency;
            break;
          case 'month':
            // For monthly subscriptions, restrict the next month's worth of days
            daysToRestrict = 30 * order_interval_frequency;
            break;
          case 'day':
            // For daily subscriptions, restrict the next day's worth of days
            daysToRestrict = order_interval_frequency;
            break;
          default:
            // Fallback to 3 days for unknown units
            daysToRestrict = 3;
        }
        
        // Add restricted dates based on frequency
        for (let i = 0; i < daysToRestrict; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          // Use local timezone instead of UTC to avoid date offset issues
          const dateStr = date.getFullYear() + '-' + 
                         String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(date.getDate()).padStart(2, '0');
          restrictedDates.push(dateStr);
        }
      } else {
        // Fallback to 3 days if frequency parsing fails
        for (let i = 0; i < 3; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          // Use local timezone instead of UTC to avoid date offset issues
          const dateStr = date.getFullYear() + '-' + 
                         String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(date.getDate()).padStart(2, '0');
          restrictedDates.push(dateStr);
        }
      }
    } else {
      // Fallback to 3 days if no frequency is set
      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        // Use local timezone instead of UTC to avoid date offset issues
        const dateStr = date.getFullYear() + '-' + 
                       String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(date.getDate()).padStart(2, '0');
        restrictedDates.push(dateStr);
      }
    }
    
    return restrictedDates;
  }

  // Helper to (re)initialize the date picker with allowed dates
  function setupDatePicker(fulfillmentType) {
    
    const input = document.getElementById('afinity-date');
    if (!input) {
      return;
    }
    if (typeof flatpickr === 'undefined') {
      return;
    }
    
    // Destroy any previous instance
    if (input._flatpickr) {
      input._flatpickr.destroy();
    }
    
    let allowedDates = [];
    if (fulfillmentType === 'Delivery') {
      allowedDates = allowedDeliveryDates;
    } else if (fulfillmentType === 'Pickup') {
      allowedDates = allowedPickupDates;
    }
    // Get frequency-based restricted dates
    const restrictedDates = getRestrictedDates();
    
    // Filter out restricted dates from allowed dates
    const filteredAllowedDates = allowedDates.filter(date => !restrictedDates.includes(date));
    
    // Get current date from subscription data
    const currentDate = modalChanges.deliveryDate || deliveryDate;
    
    // Check if current date is in restricted dates
    if (currentDate && restrictedDates.includes(currentDate)) {
      updateModalChanges('deliveryDate', '');
      deliveryDate = '';
      // Clear the input field
      if (input) {
        input.value = '';
      }
    }
    
    flatpickr(input, {
      dateFormat: "Y-m-d", // Keep ISO format for internal storage
      enable: filteredAllowedDates,
      defaultDate: (currentDate && !restrictedDates.includes(currentDate)) ? currentDate : undefined, // Set default date if available and not restricted
      onChange: function(selectedDates, dateStr, instance) {
        
        // Check if this is a different date from the original
        const originalDate = getDeliveryDateFromSubscription();
        if (dateStr && dateStr !== originalDate) {
          // Show a warning toast about the consequences
          showToast('Note: Moving the fulfillment date will affect the charge date on all upcoming orders.', 'info');
        }
        
        updateModalChanges('deliveryDate', dateStr);
        deliveryDate = dateStr;
        
        // Update the display value to show MM-DD-YYYY format
        if (instance.input) {
          instance.input.value = formatDeliveryDate(dateStr);
        }
        
        // Re-initialize time picker with new date-specific time options
        reinitializeTimePicker();
      }
    });
    // Also, if the time input exists, always initialize it with 15-minute increments by default
  }

  async function fetchSubscriptionAndPickup(subscriptionId, zip) {
    showModalLoading();
    try {
      await Promise.all([
        // Subscription fetch is already happening elsewhere, so just fetch pickup locations here
        fetchPickupLocations(zip),
        fetchFrequencies()
      ]);
      // Fetch available dates for the current fulfillment type and pickup location
      const pickupLocationId = modalChanges.selectedPickupLocationId || selectedPickupLocationId;
      await fetchAvailableDates(zip, pickupLocationId);
      setupDatePicker(modalChanges.fulfillmentMethod || fulfillmentMethod || 'Delivery');
    }catch(error){
      console.error('Error fetching subscription and pickup:', error);
    }
  }

  async function fetchFrequencies() {
    try {
      const response = await fetch(`${API_URL}/subscription/frequencies`);
      const data = await response.json();
      availableFrequencies = data.frequencies || [];
    } catch (error) {
      console.error('Error fetching frequencies:', error);
      availableFrequencies = [];
    }
  }

  async function fetchMenuData() {
    try {
      
      showModalLoading();
      
      const response = await fetch(`${API_URL}/menu`);
      const data = await response.json();
      
      if (data.success && data.menu) {
        menuData = data.menu;
        // Set the first category as default if none selected
        if (!selectedMenuCategory && menuData.items && menuData.items.length > 0) {
          selectedMenuCategory = menuData.items[0].id;
        }
        
        // Re-render the modal to show the menu data
        if (currentPage === 'meals') {
          renderModal();
        }
      } else {
        console.error('Failed to fetch menu data:', data.error);
        menuData = null;
      }
    } catch (error) {
      console.error('Error fetching menu data:', error);
      menuData = null;
    } finally {
      hideModalLoading();
    }
  }

  async function refreshSubscriptionData(subscriptionId) {
    try {
      // Fetch updated subscription data
      showModalLoading();
      const response = await fetch(`${API_URL}/subscription/${subscriptionId}`);
      const data = await response.json();
      
      // Ensure catalog variants are loaded for meal data mapping
      if (!currentCatalogVariants || !currentCatalogVariants.variants) {
        await getCatalogVariants();
      }
      
      // Fetch delivery fee threshold settings for conditional fee calculations
      try {
        await fetchDeliveryFeeThreshold();
      } catch (error) {
        console.error('Error fetching delivery fee threshold:', error);
      }
      
      if (data.data) {
        const payload = data.data;
        currentSubscription = payload;
        
        // Update address data
        const address = payload.include.address;
        address1 = address.address1 || '';
        address2 = address.address2 || '';
        city = address.city || '';
        state = getStateCode(address.province || '');
        zip = address.zip || '';
        
        deliveryDate = getDeliveryDateFromSubscription();
        
        // Update fulfillment method
        if (payload?.include?.address?.order_attributes) {
          let fulfillmentTypeAttr;
          for (const attr of payload.include.address.order_attributes) {
            if (attr && typeof attr === 'object') {
              // If it's { name, value }
              if ('name' in attr && 'value' in attr) {
                if (attr.name === 'Fulfillment Type') {
                  fulfillmentTypeAttr = attr;
                  break;
                }
              } else {
                // If it's { "Fulfillment Type": "Delivery" }
                const key = Object.keys(attr)[0];
                if (key === 'Fulfillment Type') {
                  fulfillmentTypeAttr = { name: key, value: attr[key] };
                  break;
                }
              }
            }
          }
          if (fulfillmentTypeAttr) {
            fulfillmentMethod = fulfillmentTypeAttr.value.trim().toLowerCase() === 'pickup' ? 'Pickup' : 'Delivery';
          }
        }
        
        // Update frequency
        const intervalUnit = payload.order_interval_unit;
        const orderIntervalFrequency = payload.order_interval_frequency;
        if (intervalUnit && orderIntervalFrequency) {
          selectedFrequency = `${intervalUnit}-${orderIntervalFrequency}`;
        }
        
        // Update originalSubscriptionMeals with fresh bundle selections data (excluding hidden fees)
        if (payload.include && payload.include.bundle_selections && payload.include.bundle_selections.items) {
          originalSubscriptionMeals = payload.include.bundle_selections.items
            .filter(item => {
              // Filter out packaging fee (product ID: 7927816716345) and delivery fee (product ID: 7933253517369)
              const productId = item.external_product_id || item.product_id;
              return productId !== '7927816716345' && productId !== '7933253517369';
            })
            .map(item => {
            // Find variant information from catalog data
            let variant = null;
            let title = item.title || 'Meal';
            let price = parseFloat(item.price) || 0;
            let img = MEAL_IMAGE;
            
            if (currentCatalogVariants && currentCatalogVariants.variants) {
              variant = currentCatalogVariants.variants.find(v => 
                String(v.id) === String(item.external_variant_id) ||
                String(v.id) === String(item.external_variant_id).replace('gid://shopify/ProductVariant/', '') ||
                String(v.id).replace('gid://shopify/ProductVariant/', '') === String(item.external_variant_id)
              );
              
              if (variant) {
                title = variant.title || variant.product?.title || 'Meal';
                if (variant.price) {
                  if (typeof variant.price === 'string') price = parseFloat(variant.price);
                  else if (typeof variant.price === 'number') price = variant.price;
                  else if (variant.price.amount) price = parseFloat(variant.price.amount);
                }
                img = getVariantImageFromVariantsData(variant);
              }
            }
            
            return {
              id: item.external_variant_id,
              qty: item.quantity || 0,
              title: title,
              price: price,
              img: img
            };
          });
        }
        
        // Update modalChanges with fresh data
        updateModalChanges('address1', address1);
        updateModalChanges('address2', address2);
        updateModalChanges('city', city);
        updateModalChanges('state', state);
        updateModalChanges('zip', zip);
        updateModalChanges('fulfillmentMethod', fulfillmentMethod);
        updateModalChanges('deliveryDate', deliveryDate);
        updateModalChanges('selectedFrequency', selectedFrequency);
        
        // Re-render the modal to show updated data
        renderModal();
        
      } else {
        console.error('No data received when refreshing subscription');
      }
    } catch (error) {
      console.error('Error refreshing subscription data:', error);
    } finally {
      hideModalLoading(); 
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
      }).finally(() => {
        hideModalLoading();
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
    // Get the original LocationID from the subscription/order attributes
    let originalLocationId = null;
    if (currentSubscription && currentSubscription.include && currentSubscription.include.address && currentSubscription.include.address.order_attributes) {
      for (const attr of currentSubscription.include.address.order_attributes) {
        if (attr && typeof attr === 'object') {
          if ('name' in attr && attr.name === 'LocationID') originalLocationId = attr.value;
          else if ('LocationID' in attr) originalLocationId = attr['LocationID'];
        }
      }
    }
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
                <input type="radio" name="pickup-location" value="${loc.id}" ${(modalChanges.selectedPickupLocationId || selectedPickupLocationId || originalLocationId) == loc.id ? 'checked' : ''} />
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
          <input id="afinity-address" type="text" placeholder="Street Address" value="${modalChanges.address1 || address1}" />
        </div>
        <div class="afinity-modal-row">
          <input id="afinity-address2" type="text" placeholder="Address Line 2 (optional)" value="${modalChanges.address2 || ''}" />
        </div>
        <div class="afinity-modal-row afinity-modal-address-row">
          <input id="afinity-city" type="text" placeholder="City" style="flex:2; margin-right:8px;" value="${modalChanges.city || city}" />
          <select id="afinity-state" style="flex:1; margin-right:8px;">
            <option value="">State</option>
            ${US_STATES.map(s => `<option value="${s.code}" ${(modalChanges.state || state) === s.code || (modalChanges.state || state) === s.name ? 'selected' : ''}>${s.code}</option>`).join('')}
          </select>
          <input id="afinity-zip" type="text" placeholder="Zip / Postal Code" style="flex:1;" value="${modalChanges.zip || zip}" />
        </div>
      `}
    `;
  }

  // Helper to format delivery date
  function formatDeliveryDate(dateStr) {
    if (!dateStr) return 'Loading...';
    // dateStr is in ISO format (YYYY-MM-DD), convert to MM-DD-YYYY - DayOfWeek for display
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const formatted = `${month}-${day}-${year} - ${dayOfWeek}`;
    return formatted;
  }
  
  // Helper to format time for display (24-hour to 12-hour)
  function formatTimeForDisplay(timeStr) {
    if (!timeStr) return '';
    // timeStr is in 24-hour format (HH:MM), convert to 12-hour for display
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
  
  // Helper to convert state name to code
  function getStateCode(stateName) {
    if (!stateName) return '';
    const state = US_STATES.find(s => s.name === stateName || s.code === stateName);
    return state ? state.code : stateName;
  }
  
  // Helper to get delivery date calculated from next charge date
  async function getNextChargeDateFromSubscription() {
    if (!currentSubscription?.next_charge_scheduled_at) {
      return deliveryDate; 
    }
    
    const nextChargeDate = currentSubscription.next_charge_scheduled_at;
    
    // Extract date part if it includes time
    let dateStr = nextChargeDate;
    if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }
    
    // Parse the date components
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Add 2 days to the day number
    let newDay = day + 2;
    let newMonth = month;
    let newYear = year;
    
    // Handle month boundaries
    const daysInMonth = new Date(year, month, 0).getDate(); // Get days in current month
    
    if (newDay > daysInMonth) {
      // If we exceed the current month, wrap to the next month
      newDay = newDay - daysInMonth;
      newMonth = month + 1;
      
      // Handle year boundary
      if (newMonth > 12) {
        newMonth = 1;
        newYear = year + 1;
      }
    }
    
    // Format the result
    return newYear + '-' + 
           String(newMonth).padStart(2, '0') + '-' + 
           String(newDay).padStart(2, '0');
  }
  
  // Helper to get delivery date from currentSubscription order attributes
  function getDeliveryDateFromSubscription() {
    if (!currentSubscription?.include?.address?.order_attributes) {
      return deliveryDate; 
    }
    
    // Look for Fulfillment Date in order attributes
    let fulfillmentDateAttr = null;
    
    // Handle both {name, value} and {"Key": "Value"} formats
    for (const attr of currentSubscription.include.address.order_attributes) {
      if (attr && typeof attr === 'object') {
        if ('name' in attr && 'value' in attr) {
          if (attr.name === 'Fulfillment Date') {
            fulfillmentDateAttr = attr;
            break;
          }
        } else {
          // It's already in {"Key": "Value"} format
          const key = Object.keys(attr)[0];
          if (key === 'Fulfillment Date') {
            fulfillmentDateAttr = { name: key, value: attr[key] };
            break;
          }
        }
      }
    }
    
    if (fulfillmentDateAttr) {
      const fulfillmentDateTime = fulfillmentDateAttr.value;
      
      if (fulfillmentDateTime.includes('T')) {
        const dateOnly = fulfillmentDateTime.split('T')[0];
        return dateOnly; 
      } else {
        return fulfillmentDateTime; 
      }
    }
    
    // No Fulfillment Date found, return empty string to force user selection
    return '';
  }
  
  // Helper to get fulfillment time from currentSubscription order attributes
  function getFulfillmentTimeFromSubscription() {
    if (!currentSubscription?.include?.address?.order_attributes) {
      return fulfillmentTime; 
    }
    
    const fulfillmentDateEntry = currentSubscription.include.address.order_attributes.find(
      obj => obj.hasOwnProperty("Fulfillment Date")
    );
    const fulfillmentDateAttr = fulfillmentDateEntry ? fulfillmentDateEntry["Fulfillment Date"] : null;
    if (fulfillmentDateAttr && fulfillmentDateAttr.includes('T')) {
      const fulfillmentDateTime = fulfillmentDateAttr;
      if (fulfillmentDateTime.includes('T')) {
        // Extract time and convert to 24-hour format
        const timePart = fulfillmentDateTime.split('T')[1];
        const timeWithOffset = timePart.split('-')[0]; // Remove timezone offset
        const [hours, minutes] = timeWithOffset.split(':');
        return `${hours}:${minutes}`;
      }
    }
    
    return fulfillmentTime; // fallback
  }

  async function renderModal() {
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
    contentRoot.innerHTML = await renderModalContent();
    attachModalEvents();
    // Always re-render the method section if on main page
    if (currentPage === 'main') {
      renderPickupLocationsSection();
      renderFrequencyDropdown();
    }
    attachMethodSectionEvents();
  }

  async function renderModalContent() {
    if (currentPage === 'main') {
      return await renderMainPage();
    } else if (currentPage === 'meals') {
      return await renderMealsPage();
    }
    return '';
  }

  // Helper function to get delivery instructions from include section
  function getDeliveryInstructions() {
    if (!currentSubscription || !currentSubscription.include || !currentSubscription.include.address || !currentSubscription.include.address.order_attributes) {
      return '';
    }
    
    const orderAttributes = currentSubscription.include.address.order_attributes;
    const deliveryInstructionsAttr = orderAttributes.find(attr => {
      // Handle both {name, value} and {"Key": "Value"} formats
      if (attr && typeof attr === 'object') {
        if ('name' in attr && 'value' in attr) {
          return attr.name === 'Delivery Instructions';
        } else {
          // It's in {"Key": "Value"} format
          return Object.keys(attr)[0] === 'Delivery Instructions';
        }
      }
      return false;
    });
    
    if (deliveryInstructionsAttr) {
      // Handle both formats
      if ('name' in deliveryInstructionsAttr && 'value' in deliveryInstructionsAttr) {
        return deliveryInstructionsAttr.value;
      } else {
        // It's in {"Key": "Value"} format
        return deliveryInstructionsAttr['Delivery Instructions'];
      }
    }
    
    return '';
  }

  // Helper function to get hidden fees (packaging and delivery)
  function getHiddenFees() {
    if (!currentSubscription || !currentSubscription.include || !currentSubscription.include.bundle_selections || !Array.isArray(currentSubscription.include.bundle_selections.items)) {
      return { deliveryFee: 0, packagingFee: 0 };
    }
    
    let deliveryFee = 0;
    let packagingFee = 0;
    
    currentSubscription.include.bundle_selections.items
      .filter(item => {
        // Only include packaging fee (product ID: 7927816716345) and delivery fee (product ID: 7933253517369)
        const productId = item.external_product_id || item.product_id;
        return productId === '7927816716345' || productId === '7933253517369';
      })
      .forEach(item => {
        const price = Number(item.price) || 0;
        const qty = parseInt(item.quantity) || 1;
        const total = price * qty;
        
        const productId = item.external_product_id || item.product_id;
        if (productId === '7933253517369') {
          deliveryFee = total;
        } else if (productId === '7927816716345') {
          packagingFee = total;
        }
      });
    
    return { deliveryFee, packagingFee };
  }

  // Helper to calculate the total price for the subscription
  function calculateSubscriptionTotal() {
    if (!currentSubscription || !currentSubscription.include || !currentSubscription.include.bundle_selections || !Array.isArray(currentSubscription.include.bundle_selections.items)) {
      return '0.00';
    }
    let totalCents = 0;
    
    // Add subscription items (excluding packaging and delivery fees from display, but including in total)
    currentSubscription.include.bundle_selections.items
      .filter(item => {
        // Filter out packaging fee (product ID: 7927816716345) and delivery fee (product ID: 7933253517369)
        const productId = item.external_product_id || item.product_id;
        return productId !== '7927816716345' && productId !== '7933253517369';
      })
      .forEach(item => {
        // Convert price to cents, multiply, then add
        const price = Number(item.price) || 0;
        const priceCents = Math.round(price * 100);
        const qty = parseInt(item.quantity) || 1;
        totalCents += priceCents * qty;
      });
    
    // Add hidden fees to total (packaging and delivery fees)
    currentSubscription.include.bundle_selections.items
      .filter(item => {
        // Only include packaging fee (product ID: 7927816716345) and delivery fee (product ID: 7933253517369)
        const productId = item.external_product_id || item.product_id;
        return productId === '7927816716345' || productId === '7933253517369';
      })
      .forEach(item => {
        // Convert price to cents, multiply, then add
        const price = Number(item.price) || 0;
        const priceCents = Math.round(price * 100);
        const qty = parseInt(item.quantity) || 1;
        totalCents += priceCents * qty;
      });
    
    // Add one-time items
    if (currentSubscription.include.onetimes && Array.isArray(currentSubscription.include.onetimes)) {
      currentSubscription.include.onetimes.forEach(onetime => {
        const price = Number(onetime.price) || 0;
        const priceCents = Math.round(price * 100);
        const qty = parseInt(onetime.quantity) || 1;
        totalCents += priceCents * qty;
      });
    }
    
    // Convert back to dollars
    return (totalCents / 100).toFixed(2);
  }

  // Helper function to handle conditional fees for meals page updates
  async function handleConditionalFees(items, subscriptionId) {
    try {
      // Fetch settings to get the delivery fee waiver threshold
      const settingsResponse = await fetch(`${API_URL}/settings`);
      const settings = await settingsResponse.json();
      const subscriptionDeliveryFeeWaiverThreshold = parseFloat(settings.find((s) => s.key === 'subscription_delivery_fee_waiver_threshold')?.value || '0');
      
      // Calculate the total of items (excluding fees)
      let total = 0;
      items.forEach(item => {
        // Get price from catalog variants or fallback to item price
        let price = 0;
        if (currentCatalogVariants && currentCatalogVariants.variants && currentCatalogVariants.variants.length > 0) {
          const variant = currentCatalogVariants.variants.find(v => String(v.id) === String(item.external_variant_id));
          if (variant && variant.price) {
            if (typeof variant.price === 'string') {
              price = parseFloat(variant.price);
            } else if (variant.price.amount) {
              price = parseFloat(variant.price.amount);
            } else if (typeof variant.price === 'number') {
              price = variant.price;
            }
          }
        }
        
        // Fallback to item price if not found in catalog
        if (price === 0) {
          price = item.price || 0;
        }
        
        total += price * item.quantity;
      });
      
      // Get current fulfillment method
      const currentFulfillmentMethod = modalChanges.fulfillmentMethod || fulfillmentMethod || 'Delivery';
      
      // Always add packaging fee for delivery (1 quantity max)
      if (currentFulfillmentMethod === 'Delivery') {
        const packagingFee = {
          collection_id: '308869562425',
          external_product_id: '7927816716345',
          external_variant_id: '44558969372729',
          quantity: 1
        };
        items.push(packagingFee);
      }
      
      // Conditionally add delivery fee based on threshold
      if (total < subscriptionDeliveryFeeWaiverThreshold) {
        const deliveryFee = {
          collection_id: '308869562425',
          external_product_id: '7933253517369',
          external_variant_id: '44578774089785',
          quantity: 1
        };
        items.push(deliveryFee);
      }
      
      return items;
    } catch (error) {
      console.error('Error handling conditional fees:', error);
      // Return original items if there's an error
      return items;
    }
  }

  // Calculate total for meals page based on current selections
  // Calculate conditional fees based on current meal selections and fulfillment method
  // Global variable to cache the delivery fee threshold
  let cachedDeliveryFeeThreshold = 50; // Default threshold

  // Function to fetch and cache the delivery fee threshold
  async function fetchDeliveryFeeThreshold() {
    try {
      const response = await fetch(`${API_URL}/settings`);
      if (response.ok) {
        const settings = await response.json();
        cachedDeliveryFeeThreshold = settings.subscription_delivery_fee_waiver_threshold || 50;
      }
    } catch (error) {
      console.error('Error fetching delivery fee threshold:', error);
    }
  }

  // Synchronous function for template rendering
  function calculateConditionalFeesForMealsPage() {
    // Calculate the total of items (excluding fees)
    let total = 0;
    const currentMeals = getCurrentMealsArray();
    
    currentMeals.forEach(meal => {
      if (meal.qty > 0) {
        let price = 0;
        
        // Get price from catalog variants or fallback to meal price
        if (currentCatalogVariants && currentCatalogVariants.variants && currentCatalogVariants.variants.length > 0) {
          const variant = currentCatalogVariants.variants.find(v => String(v.id) === String(meal.id));
          if (variant && variant.price) {
            if (typeof variant.price === 'string') {
              price = parseFloat(variant.price);
            } else if (variant.price.amount) {
              price = parseFloat(variant.price.amount);
            } else if (typeof variant.price === 'number') {
              price = variant.price;
            }
          }
        }
        
        // Fallback to meal price if not found in catalog
        if (price === 0) {
          price = meal.price || 0;
        }
        
        total += price * meal.qty;
      }
    });
    
    // Get current fulfillment method
    const currentFulfillmentMethod = modalChanges.fulfillmentMethod || fulfillmentMethod || 'Delivery';
    
    let deliveryFee = 0;
    let packagingFee = 0;
    let shouldStrikeThroughDelivery = false;
    
    // Only add fees for delivery method
    if (currentFulfillmentMethod === 'Delivery') {
      // Always add packaging fee for delivery (1 quantity max)
      packagingFee = 2.99; // $2.99 packaging fee
      
      // Conditionally add delivery fee based on threshold
      if (total < cachedDeliveryFeeThreshold) {
        deliveryFee = 3.99; // $3.99 delivery fee
      } else {
        // Show delivery fee with strike-through when threshold is met
        shouldStrikeThroughDelivery = true;
      }
    }
    
    return { 
      deliveryFee, 
      packagingFee, 
      shouldStrikeThroughDelivery,
      threshold: cachedDeliveryFeeThreshold,
      subtotal: total
    };
  }

  function calculateMealsPageTotal() {
    let totalCents = 0;
    
    // Calculate total for all selected meals (both original and new selections)
    const currentMeals = getCurrentMealsArray();
    currentMeals.forEach(meal => {
      if (meal.qty > 0) {
        let price = 0;
        
        // Always use catalog variants data as the primary source
        if (currentCatalogVariants && currentCatalogVariants.variants && currentCatalogVariants.variants.length > 0) {
          const variant = currentCatalogVariants.variants.find(v => String(v.id) === String(meal.id));
          if (variant && variant.price) {
            // Try different price formats
            if (typeof variant.price === 'string') {
              price = parseFloat(variant.price);
            } else if (variant.price.amount) {
              price = parseFloat(variant.price.amount);
            } else if (typeof variant.price === 'number') {
              price = variant.price;
            }
          } 
        }
        
        // Final fallback to meal price
        if (price === 0) {
          price = meal.price || 0;
        }
        
        // Use original price for header total calculation (discount already applied in subscription data)
        // Convert price to cents, multiply by quantity, then add
        const priceCents = Math.round(price * 100);
        const mealTotal = priceCents * meal.qty;
        totalCents += mealTotal;
        
      }
    });
    
    // Add conditional fees to total (packaging and delivery fees)
    const conditionalFees = calculateConditionalFeesForMealsPage();
    const deliveryFeeCents = Math.round(conditionalFees.deliveryFee * 100);
    const packagingFeeCents = Math.round(conditionalFees.packagingFee * 100);
    totalCents += deliveryFeeCents + packagingFeeCents;
    
    const total = (totalCents / 100).toFixed(2);
    // Convert back to dollars
    return total;
  }

  // Get the appropriate total for meals page - use subscription total if no changes, otherwise use calculated total
  function getMealsPageHeaderTotal() {
    // Check if any changes have been made to the meals
    const currentMeals = getCurrentMealsArray();
    const hasChanges = currentMeals.some(meal => {
      const originalMeal = originalSubscriptionMeals.find(orig => String(orig.id) === String(meal.id));
      if (!originalMeal) {
        // New meal added
        return meal.qty > 0;
      }
      // Quantity changed
      return meal.qty !== originalMeal.qty;
    });
    
    // Also check if any original meals were removed (qty = 0)
    const hasRemovals = originalSubscriptionMeals.some(origMeal => {
      const selectedMeal = currentMeals.find(sel => String(sel.id) === String(origMeal.id));
      return !selectedMeal || selectedMeal.qty === 0;
    });
    
    if (hasChanges || hasRemovals) {
      // User has made changes, show calculated total
      return calculateMealsPageTotal();
    } else {
      // No changes, show subscription total
      return calculateSubscriptionTotal();
    }
  }

  async function renderMainPage() {
    const currentDeliveryDate = await getNextChargeDateFromSubscription();
    // Calculate total price for header
    const headerTotal = calculateSubscriptionTotal();
    // Determine method
    return `
      <button class="afinity-modal-close" title="Close">&times;</button>
      <div class="afinity-modal-header">
        <span class="afinity-modal-date"><span class="afinity-modal-date-label">${formatDeliveryDate(currentDeliveryDate)}</span> <span class="afinity-modal-price">$${headerTotal}</span></span>
      </div>
      <div class="afinity-modal-content">
        <div class="afinity-modal-card-frequency">
          <button class="afinity-modal-back">< Back</button>
          <div class="afinity-modal-card-frequency-content">
            <div class="afinity-modal-row-frequency">
              <label class="afinity-modal-label-frequency" for="afinity-frequency">Frequency</label>
              <select id="afinity-frequency">
                ${availableFrequencies.length > 0 
                  ? availableFrequencies.map(freq => 
                      freq.options.map(option => 
                        `<option value="${freq.unit}-${option}" ${selectedFrequency === `${freq.unit}-${option}` ? 'selected' : ''}>
                          ${option} ${freq.unit}${option > 1 ? 's' : ''} subscription
                        </option>`
                      ).join('')
                    ).join('')
                  : '<option>Loading frequencies...</option>'
                }
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
                ? currentSubscription.include.bundle_selections.items
                    .filter(item => {
                      // Filter out packaging fee (product ID: 7927816716345) and delivery fee (product ID: 7933253517369)
                      const productId = item.external_product_id || item.product_id;
                      return productId !== '7927816716345' && productId !== '7933253517369';
                    })
                    .map(item => {
                    const variant = getVariantById(item.external_variant_id);
                    if (!variant) return '';
                    const img =
                      (variant?.product?.featuredMedia?.preview?.image?.url) ||
                      (variant?.product?.featuredMedia?.preview?.url) ||
                      (variant?.image?.url) ||
                      MEAL_IMAGE;
                    const title = variant ? (variant.product?.title || variant.sku || 'Meal') : (item.title || item.external_variant_id);
                    const qty = item.quantity || 1;
                    
                    // Get the price from subscription data (no discount on main page)
                    // Always use subscription price, not variant price
                    const price = Number(item.price) || 0;
                    
                    return `
                      <div class="afinity-modal-cart-item">
                        <img src="${img}" alt="${title}" />
                        <div>
                          <div class="afinity-modal-cart-title">${title}</div>
                          <div class="afinity-modal-cart-details">
                            <div class="afinity-modal-cart-qty">x ${qty}</div>
                            <div class="afinity-modal-cart-price">$${price.toFixed(2)}</div>
                          </div>
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
            <input id="afinity-date" type="text" placeholder="Select delivery date" value="${formatDeliveryDate(currentDeliveryDate)}" readonly />
          </div>
          <div class="afinity-modal-row">
            <label for="afinity-time" class="afinity-modal-select-label">Time</label>
            <input id="timepicker" class="timepicker" type="text" placeholder="Select delivery time" value="${formatTimeForDisplay(modalChanges.fulfillmentTime || fulfillmentTime || getFulfillmentTimeFromSubscription())}"/>
          </div>
          <div style="display:flex; justify-content:flex-end; margin-top:8px;">
            <button id="afinity-save-date-btn" class="afinity-modal-save-btn" type="button" onclick="saveDate()">Save</button>
          </div>
        </div>
        <div class="afinity-modal-card">
          <div class="afinity-modal-card-title">Delivery Instructions</div>
          <div class="afinity-modal-row">
            <label for="afinity-delivery-instructions" class="afinity-modal-select-label">Instructions</label>
            <textarea id="afinity-delivery-instructions" placeholder="Enter delivery instructions (e.g., gate code, building access, special instructions)" rows="3" maxlength="280">${getDeliveryInstructions()}</textarea>
          </div>
          <div style="display:flex; justify-content:flex-start; align-items:center; margin-top:8px;">
            <div class="afinity-character-count">
              <span id="afinity-instructions-char-count"> Character limit: ${getDeliveryInstructions().length}</span>/280 characters
            </div>
          </div>
        </div>
        <div class="afinity-modal-card">
          <a href="#" class="afinity-modal-add-extra">&#8853; <span>Add extra meal to order</span></a>
        </div>
        
        <!-- Charges Table Section -->
        <div class="afinity-modal-card">
          <div class="afinity-modal-card-title">Manage Your Upcoming Deliveries or Pickups</div>
          <div class="afinity-modal-row">
            <p style="margin: 0; color: #666; font-size: 14px;">
              View and manage your upcoming Deliveries or Pickups. Skip or unskip individual Deliveries or Pickups as needed.
            </p>
          </div>
          <div id="afinity-charges-table-container">
            <div class="afinity-charges-loading">Loading charges...</div>
          </div>
        </div>
        
        <!-- One-time Items Section -->
        ${currentSubscription?.include?.onetimes && currentSubscription.include.onetimes.length > 0 ? `
          <div class="afinity-modal-card">
            <div class="afinity-modal-card-title">One off items to next Order</div>
            <div class="afinity-modal-onetime-list">
              ${currentSubscription.include.onetimes.map(onetime => {
                // Try to find variant in catalog data to get proper image and title
                let variant = null;
                let img = MEAL_IMAGE; // Default fallback
                let title = onetime.product_title || 'One-time Item';
                let price = parseFloat(onetime.price) || 0;
                const qty = onetime.quantity || 1;
                
                // Look for variant in catalog data using external_variant_id
                if (currentCatalogVariants && currentCatalogVariants.variants && currentCatalogVariants.variants.length > 0) {
                  // Extract the variant ID from the one-time item data
                  let variantId = null;
                  if (onetime.external_variant_id) {
                    if (typeof onetime.external_variant_id === 'object' && onetime.external_variant_id.ecommerce) {
                      // Format: {ecommerce: "44637278863417"}
                      variantId = onetime.external_variant_id.ecommerce;
                    } else if (typeof onetime.external_variant_id === 'string') {
                      // Format: "44637278863417" or "gid://shopify/ProductVariant/44637278863417"
                      variantId = onetime.external_variant_id.replace('gid://shopify/ProductVariant/', '');
                    }
                  }
                  
                  if (variantId) {
                    variant = currentCatalogVariants.variants.find(v => 
                      String(v.id) === String(variantId) ||
                      String(v.id) === String(variantId).replace('gid://shopify/ProductVariant/', '') ||
                      String(v.id).replace('gid://shopify/ProductVariant/', '') === String(variantId)
                    );
                  }
                }
                
                if (variant) {
                  img = getVariantImageFromVariantsData(variant);
                  title = variant.title || variant.product?.title || onetime.product_title || 'One-time Item';
                  // For one-time items, always use the price from the subscription, not the variant price
                  // price is already set to parseFloat(onetime.price) || 0 above
                }
                
                return `
                  <div class="afinity-modal-onetime-item" data-onetime-id="${onetime.id}">
                    <img src="${img}" alt="${title}" />
                    <div class="afinity-modal-onetime-details">
                      <div class="afinity-modal-onetime-title">${title}</div>
                      <div class="afinity-modal-onetime-meta">
                        <div class="afinity-modal-onetime-qty">x ${qty}</div>
                        <div class="afinity-modal-onetime-price">$${price.toFixed(2)}</div>
                      </div>
                    </div>
                    <button class="afinity-modal-onetime-delete" data-onetime-id="${onetime.id}" title="Remove item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                      </svg>
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
        <div class="afinity-modal-card afinity-modal-footer-card">
          <div class="afinity-modal-footer-actions">
            <div style="display:flex;">
              <a href="#" class="afinity-cancel-subscription">
                Cancel subscription
              </a>
            </div>
            <div>
              <button class="afinity-modal-cancel-btn" type="button">Cancel</button>
                              <button class="afinity-modal-save-btn afinity-modal-footer-save-btn" type="button">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function renderMealsPage() {
    // Fetch delivery fee threshold when meals page loads
    await fetchDeliveryFeeThreshold();
    
    const currentDeliveryDate = await getNextChargeDateFromSubscription();
    
    // Get appropriate total for header - subscription total if no changes, calculated total if changes made
    const headerTotal = getMealsPageHeaderTotal();
    
    // Set title and description based on mode
    const pageTitle = mealsPageMode === 'update' ? 'Update Subscription Meals' : 'Add one time meal to next Subscription Charge';
    const pageDescription = mealsPageMode === 'update' ? 'Update your subscription meals. Add, remove, or change quantities of your regular meals.' : 'Add one time meal to your next Charge. Remove or add one time meals to your next order.';
    
    return `
      <button class="afinity-modal-close" title="Close">&times;</button>
      <div class="afinity-modal-header">
        <span class="afinity-modal-date"><span class="afinity-modal-date-label">${formatDeliveryDate(currentDeliveryDate)}</span> <span class="afinity-modal-price">$${headerTotal}</span></span>
      </div>
      <div class="afinity-modal-content">
        <div class="afinity-modal-card afinity-meals-header-card">
          <button class="afinity-modal-back">< Back</button>
          <div class="afinity-meals-header-flex" style="display:flex;align-items:flex-start;justify-content:space-between;gap:2rem;width:100%;">
            <div class="afinity-meals-header-left" style="flex:1;min-width:0;">
              <h2 class="afinity-meals-title">${pageTitle}</h2>
              <div class="afinity-meals-desc">${pageDescription}</div>
            </div>
            <div class="afinity-meals-date-select" style="font-size:16px;min-width:220px;max-width:260px;display:flex;flex-direction:column;align-items:flex-end;">
              <label class="afinity-modal-select-label">Delivery Date</label>
              <input id="afinity-meals-date" type="text" placeholder="Select delivery date" value="${formatDeliveryDate(currentDeliveryDate)}" style="font-size:16px;padding:6px 10px;border-radius:4px;border:1px solid #ccc;min-width:160px;background-color:#f5f5f5;cursor:not-allowed;" readonly disabled />
            </div>
          </div>
        </div>
        <div class="afinity-meals-layout">
          <div class="afinity-meals-main">
            ${menuData ? `
              <div class="afinity-meals-categories">
                <h2 class="afinity-meals-section-title">Menu Categories</h2>
                <div class="afinity-meals-category-tabs">
                  ${menuData.items.map(category => `
                    <button class="afinity-meals-category-tab ${selectedMenuCategory === category.id ? 'active' : ''}" 
                            data-category-id="${category.id}">
                      ${category.title}
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : `
              <div class="afinity-meals-loading">
                <div class="afinity-meals-loading-spinner"></div>
                <h2 class="afinity-meals-section-title">Loading Menu Data...</h2>
              </div>
            `}
            <div class="afinity-meals-content">${renderMealsGrid()}</div>
          </div>
          <div class="afinity-modal-card afinity-meals-sidebar">
            ${mealsPageMode === 'update' ? `
              <!-- Update Mode: Show all meals as editable -->
              <h3>Current Meals in Subscription</h3>
              <ul class="afinity-meals-sidebar-list subscription-meals">
                ${originalSubscriptionMeals.map(origMeal => {
                  // Find the current quantity from current meals array
                  const currentMeals = getCurrentMealsArray();
                  const sel = currentMeals.find(m => String(m.id) === String(origMeal.id));
                  const qty = sel ? sel.qty : origMeal.qty;
                  
                  // Only show if quantity > 0
                  if (qty <= 0) return '';
                  
                  let meal = { ...origMeal, qty: qty };
                  let variant = null;
                  let img = MEAL_IMAGE;
                  let title = 'Meal';
                  let price = 0;
                  
                  // Try to find variant in all catalog variants with different ID formats
                  if (currentCatalogVariants && currentCatalogVariants.variants && currentCatalogVariants.variants.length > 0) {
                    variant = currentCatalogVariants.variants.find(v => 
                      String(v.id) === String(meal.id) ||
                      String(v.id) === String(meal.id).replace('gid://shopify/ProductVariant/', '') ||
                      String(v.id).replace('gid://shopify/ProductVariant/', '') === String(meal.id)
                    );
                  }
                  
                  if (variant) {
                    img = getVariantImageFromVariantsData(variant);
                    title = variant.title || variant.product?.title || 'Meal';
                    if (variant.price) {
                      if (typeof variant.price === 'string') price = parseFloat(variant.price);
                      else if (typeof variant.price === 'number') price = variant.price;
                      else if (variant.price.amount) price = parseFloat(variant.price.amount);
                    }
                    price = isNaN(price) ? 0 : price;
                  } else {
                    // Use meal data from subscription
                    title = meal.title || 'Meal';
                    price = meal.price || 0;
                    img = meal.img || MEAL_IMAGE;
                  }
                  
                  // Apply 10% discount to the price
                  const discountedPrice = getDiscountedPrice(price);
                  
                  return `
                    <li class="afinity-meals-sidebar-item" data-meal-id="${meal.id}">
                      <img src="${img}" alt="${title}" />
                      <div class="afinity-meals-sidebar-details">
                        <div class="afinity-meals-sidebar-title">${title}</div>
                        <div class="afinity-meals-sidebar-price">$${discountedPrice.toFixed(2)}</div>
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

              <h3>New meals to your Subscription</h3>
              <ul class="afinity-meals-sidebar-list swap-meals">
                ${getCurrentMealsArray().filter(m => m.qty > 0 && !originalSubscriptionMeals.some(o => String(o.id) === String(m.id))).map(meal => {
                  let variant = null;
                  let img = MEAL_IMAGE;
                  let title = 'Meal';
                  let price = 0;
                  
                  // Try to find variant in all catalog variants with different ID formats
                  if (currentCatalogVariants && currentCatalogVariants.variants && currentCatalogVariants.variants.length > 0) {
                    variant = currentCatalogVariants.variants.find(v => 
                      String(v.id) === String(meal.id) ||
                      String(v.id) === String(meal.id).replace('gid://shopify/ProductVariant/', '') ||
                      String(v.id).replace('gid://shopify/ProductVariant/', '') === String(meal.id)
                    );
                  }
                  
                  if (variant) {
                    img = getVariantImageFromVariantsData(variant);
                    title = variant.title || variant.product?.title || 'Meal';
                    if (variant.price) {
                      if (typeof variant.price === 'string') price = parseFloat(variant.price);
                      else if (typeof variant.price === 'number') price = variant.price;
                      else if (variant.price.amount) price = parseFloat(variant.price.amount);
                    }
                    price = isNaN(price) ? 0 : price;
                  } else {
                    // Use meal data from subscription
                    title = meal.title || 'Meal';
                    price = meal.price || 0;
                    img = meal.img || MEAL_IMAGE;
                  }
                  
                  // Apply 10% discount to the price
                  const discountedPrice = getDiscountedPrice(price);
                  
                  return `
                    <li class="afinity-meals-sidebar-item" data-meal-id="${meal.id}">
                      <img src="${img}" alt="${title}" />
                      <div class="afinity-meals-sidebar-details">
                        <div class="afinity-meals-sidebar-title">${title}</div>
                        <div class="afinity-meals-sidebar-price">$${discountedPrice.toFixed(2)}</div>
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
            ` : `
              <!-- One-time Mode: Show current meals as read-only and one-time meals as editable -->
              <h3 style="color: #999; opacity: 0.6;">Current Meals in Subscription</h3>
              <ul class="afinity-meals-sidebar-list current-meals" style="opacity: 0.6; pointer-events: none;">
                ${originalSubscriptionMeals.map(origMeal => {
                  const variant = getVariantById(origMeal.id);
                  const img = variant ? getVariantImageByCatalog(variant) : MEAL_IMAGE;
                  const title = variant ? (variant.product?.title || variant.sku || 'Meal') : origMeal.title;
                  const sel = selectedMeals.find(m => m.id === origMeal.id);
                  const qty = sel ? sel.qty : origMeal.qty;
                  
                  // Get the price and apply 10% discount
                  let price = 0;
                  if (variant && variant.price) {
                    if (typeof variant.price === 'string') {
                      price = parseFloat(variant.price);
                    } else if (variant.price.amount) {
                      price = parseFloat(variant.price.amount);
                    } else if (typeof variant.price === 'number') {
                      price = variant.price;
                    }
                  } else {
                    price = origMeal.price || 0;
                  }
                  
                  // Apply 10% discount
                  const discountedPrice = getDiscountedPrice(price);
                  
                  return `
                    <li class="afinity-meals-sidebar-item" data-meal-id="${origMeal.id}">
                      <img src="${img}" alt="${title}" />
                      <div class="afinity-meals-sidebar-details">
                        <div class="afinity-meals-sidebar-title">${title}</div>
                        <div class="afinity-meals-sidebar-price">$${discountedPrice.toFixed(2)}</div>
                      </div>
                      <div class="afinity-meals-sidebar-qty-controls">
                        <button class="afinity-meals-sidebar-qty-btn" data-action="decrement" data-meal-id="${origMeal.id}" disabled>-</button>
                        <span class="afinity-meals-sidebar-qty">${qty}</span>
                        <button class="afinity-meals-sidebar-qty-btn" data-action="increment" data-meal-id="${origMeal.id}" disabled>+</button>
                      </div>
                    </li>
                  `;
                }).join('')}
              </ul>
              <h3>Add one time items to your next subscription charge</h3>
              <ul class="afinity-meals-sidebar-list swap-meals">
                ${selectedMeals.filter(m => !originalSubscriptionMeals.some(o => String(o.id) === String(m.id))).map(meal => {
                  let variant = null;
                  let img = MEAL_IMAGE;
                  let title = 'Meal';
                  let price = 0;
                  
                  // Try to find variant in all catalog variants with different ID formats
                  if (currentCatalogVariants && currentCatalogVariants.variants && currentCatalogVariants.variants.length > 0) {
                    variant = currentCatalogVariants.variants.find(v => 
                      String(v.id) === String(meal.id) ||
                      String(v.id) === String(meal.id).replace('gid://shopify/ProductVariant/', '') ||
                      String(v.id).replace('gid://shopify/ProductVariant/', '') === String(meal.id)
                    );
                  }
                  
                  if (variant) {
                    img = getVariantImageFromVariantsData(variant);
                    title = variant.title || variant.product?.title || 'Meal';
                    if (variant.price) {
                      if (typeof variant.price === 'string') price = parseFloat(variant.price);
                      else if (typeof variant.price === 'number') price = variant.price;
                      else if (variant.price.amount) price = parseFloat(variant.price.amount);
                    }
                    price = isNaN(price) ? 0 : price;
                  } else {
                    // Use meal data from selection
                    title = meal.title || 'Meal';
                    price = meal.price || 0;
                    img = meal.img || MEAL_IMAGE;
                  }
                  
                  // Apply 10% discount to the price
                  const discountedPrice = getDiscountedPrice(price);
                  
                  return `
                    <li class="afinity-meals-sidebar-item" data-meal-id="${meal.id}">
                      <img src="${img}" alt="${title}" />
                      <div class="afinity-meals-sidebar-details">
                        <div class="afinity-meals-sidebar-title">${title}</div>
                        <div class="afinity-meals-sidebar-price">$${discountedPrice.toFixed(2)}</div>
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
            `}
            <div class="afinity-meals-sidebar-footer">
              <div class="afinity-meals-sidebar-total">
                ${(() => {
                  const hiddenFees = getHiddenFees();
                  const hasFees = hiddenFees.deliveryFee > 0 || hiddenFees.packagingFee > 0;
                  return hasFees ? `
                    ${hiddenFees.deliveryFee > 0 ? `
                      <div class="afinity-meals-sidebar-fee">
                        <span>Delivery Fee:</span>
                        <span>$${hiddenFees.deliveryFee.toFixed(2)}</span>
                      </div>
                    ` : ''}
                    ${hiddenFees.packagingFee > 0 ? `
                      <div class="afinity-meals-sidebar-fee">
                        <span>Packaging Fee:</span>
                        <span>$${hiddenFees.packagingFee.toFixed(2)}</span>
                      </div>
                    ` : ''}
                  ` : '';
                })()}
                <div class="afinity-meals-sidebar-total-row">
                  <span>Total:</span>
                  <span class="afinity-meals-sidebar-total-price">$${calculateSidebarTotal().toFixed(2)}</span>
                </div>
              </div>
              <button class="afinity-meals-swap-btn" ${mealsPageMode === 'update' ? 
                (() => {
                  // Check if there are any changes to save
                  const currentMeals = getCurrentMealsArray();
                  const hasChanges = currentMeals.some(meal => {
                    const originalMeal = originalSubscriptionMeals.find(orig => String(orig.id) === String(meal.id));
                    if (!originalMeal) {
                      // New meal added
                      return meal.qty > 0;
                    }
                    // Quantity changed
                    return meal.qty !== originalMeal.qty;
                  });
                  
                  // Also check if any original meals were removed (qty = 0)
                  const hasRemovals = originalSubscriptionMeals.some(origMeal => {
                    const selectedMeal = currentMeals.find(sel => String(sel.id) === String(origMeal.id));
                    return !selectedMeal || selectedMeal.qty === 0;
                  });
                  
                  return (!hasChanges && !hasRemovals) ? 'disabled' : '';
                })() : 
                (getCurrentMealsArray().filter(m=>m.qty>0 && !originalSubscriptionMeals.some(o => String(o.id) === String(m.id))).length === 0 ? 'disabled' : '')}>
                ${mealsPageMode === 'update' ? 'Update Subscription' : 'Add One Time Meals'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderMealsGrid() {
    if (!menuData || !menuData.items || menuData.items.length === 0) {
      return '<div class="afinity-meals-grid-loading">Loading menu data…</div>';
    }

    if (!currentCatalogVariants || !currentCatalogVariants.variants || currentCatalogVariants.variants.length === 0) {
      return '<div class="afinity-meals-grid-loading">Loading meal details…</div>';
    }
    // If a specific category is selected, show only that collection
    if (selectedMenuCategory) {
      const selectedCategory = menuData.items.find(cat => cat.id === selectedMenuCategory);
      
      if (selectedCategory && selectedCategory.collection) {
        return renderCollectionMealsWithVariants(selectedCategory.collection, selectedCategory.title);
      }
    }
    const collectionsWithProducts = menuData.items.filter(item => item.collection && item.collection.products);
    
    const allCollectionsHtml = collectionsWithProducts
      .map(item => renderCollectionSectionWithVariants(item.collection, item.title))
      .join('');
    
    return allCollectionsHtml;
  }

  function renderCollectionSectionWithVariants(collection, collectionTitle) {
    if (!collection.products || !collection.products.edges || collection.products.edges.length === 0) {
      return '';
    }

    if (!currentCatalogVariants || !currentCatalogVariants.variants || currentCatalogVariants.variants.length === 0) {
      return '';
    }

    const products = collection.products.edges.map(edge => edge.node);
    const productMealsHtml = products.map(product => renderProductMealsWithVariants(product)).join('');
    
    return `
      <div class="afinity-collection-section">
        <h3 class="afinity-collection-title">${collectionTitle}</h3>
        <div class="afinity-meals-grid">
          ${productMealsHtml}
        </div>
      </div>
    `;
  }

  function renderCollectionMealsWithVariants(collection, collectionTitle) {
    if (!collection.products || !collection.products.edges || collection.products.edges.length === 0) {
      return '<div class="afinity-meals-grid-empty">No meals found in this collection.</div>';
    }

    if (!currentCatalogVariants || !currentCatalogVariants.variants || currentCatalogVariants.variants.length === 0) {
      return '<div class="afinity-meals-grid-empty">Loading meal details...</div>';
    }

    const products = collection.products.edges.map(edge => edge.node);
    
    const productMealsHtml = products.map(product => renderProductMealsWithVariants(product)).join('');
    
    return `
      <div class="afinity-collection-section">
        <h3 class="afinity-collection-title">${collectionTitle}</h3>
        <div class="afinity-meals-grid">
          ${productMealsHtml}
        </div>
      </div>
    `;
  }

  function renderProductMealsWithVariants(product) {
    
    if (!product.variants || !product.variants.edges || product.variants.edges.length === 0) {
      return '';
    }

    if (!currentCatalogVariants || !currentCatalogVariants.variants || currentCatalogVariants.variants.length === 0) {
      return '';
    }

    // Get the catalog ID from currentCatalogPayload
    const catalogId = currentCatalogPayload?.catalogId ? 
      currentCatalogPayload.catalogId.replace('gid://shopify/MarketCatalog/', '') : null;
    
    const collectionVariants = product.variants.edges.map(edge => edge.node);
    
    // Filter variants to only include those that match the catalog ID
    const filteredVariants = collectionVariants.filter(collectionVariant => {
      if (!catalogId) {
        return true;
      }
      
      const variantCatalogId = collectionVariant.metafield?.value;
      
      const matches = variantCatalogId === catalogId;
      if (!matches) {
      }
      return matches;
    });
    
    // Use catalog variants data as the primary source for all meal information
    const variantCardsHtml = filteredVariants.map(collectionVariant => {
      // Find matching variant in currentCatalogVariants
      const matchingVariant = currentCatalogVariants.variants.find(variant => 
        String(variant.id) === String(collectionVariant.id)
      );
      
      if (matchingVariant) {
        // Use catalog variant data as the primary source
        return renderMealCardFromVariantsData(matchingVariant, product);
      } else {
        console.log('No matching variant found for collection variant:', collectionVariant.id);
        // If no matching catalog variant, skip this variant entirely
        return '';
      }
    }).join('');
    
    return variantCardsHtml;
  }

  function renderMealCardFromVariantsData(variant, product) {
    // Use variants data for actual details (price, image, etc.)
    const img = getVariantImageFromVariantsData(variant);
    const title = variant.title || variant.product?.title || product?.title || 'Meal';
    
    // Try different price formats
    let price = 0;
    if (variant.price) {
      if (typeof variant.price === 'string') {
        price = parseFloat(variant.price);
      } else if (variant.price.amount) {
        price = parseFloat(variant.price.amount);
      } else if (typeof variant.price === 'number') {
        price = variant.price;
      }
    }
    
    // Apply 10% discount to the price
    const discountedPrice = getDiscountedPrice(price);
    
    // Check if this variant is in selectedMeals
    const isActive = selectedMeals.find(m => String(m.id) === String(variant.id) && m.qty > 0);
    return `
      <li class="afinity-r-meals-grid__item" style="display: block;"
        data-product-start-date="2025-01-01"
        data-product-end-date="2025-12-31"
        data-is-first-variant="true"
      >
        <div class="afinity-r-card${isActive ? ' afinity-r-card--active' : ''}" 
          data-variant-id="${variant.id}"
          data-collection-id="1"
          data-product-id="${product.id}"
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
                    $${discountedPrice.toFixed(2)}
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

  function getVariantImageFromVariantsData(variant) {
    if (variant?.image?.url) return variant.image.url;
    if (variant?.product?.featuredMedia?.preview?.image?.url) return variant.product.featuredMedia.preview.image.url;
    if (variant?.product?.featuredMedia?.preview?.url) return variant.product.featuredMedia.preview.url;
    return MEAL_IMAGE;
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

  // Helper function to get discounted price (10% off)
  function getDiscountedPrice(originalPrice) {
    if (!originalPrice || originalPrice === 0) return 0;
    return originalPrice * 0.9;
  }

  // Helper to get all catalog variants for the current catalog
  function getCatalogVariants() {
    if (!currentCatalogVariants || !currentCatalogVariants.variants || !currentCatalogPayload) return [];
    return currentCatalogVariants.variants.filter(
      v => v.metafield && String(v.metafield.value) === String(currentCatalogPayload.catalogId.toString().split('gid://shopify/MarketCatalog/')[1])
    );
  }

  // Helper function to calculate sidebar total
  function calculateSidebarTotal() {
    let totalCents = 0;
    
    // Calculate total for all selected meals (both original and new selections)
    const currentMeals = getCurrentMealsArray();
    currentMeals.forEach(meal => {
      if (meal.qty > 0) {
        let price = 0;
        
        // Try to find variant in all catalog variants with different ID formats
        if (currentCatalogVariants && currentCatalogVariants.variants && currentCatalogVariants.variants.length > 0) {
          const variant = currentCatalogVariants.variants.find(v => 
            String(v.id) === String(meal.id) ||
            String(v.id) === String(meal.id).replace('gid://shopify/ProductVariant/', '') ||
            String(v.id).replace('gid://shopify/ProductVariant/', '') === String(meal.id)
          );
          if (variant && variant.price) {
            // Try different price formats
            if (typeof variant.price === 'string') {
              price = parseFloat(variant.price);
            } else if (variant.price.amount) {
              price = parseFloat(variant.price.amount);
            } else if (typeof variant.price === 'number') {
              price = variant.price;
            }
          }
        }
        
        // Final fallback to meal price from subscription data
        if (price === 0) {
          price = meal.price || 0;
        }
        
        // Apply 10% discount to the price before calculating total
        const discountedPrice = getDiscountedPrice(price);
        // Convert discounted price to cents, multiply by quantity, then add
        const priceCents = Math.round(discountedPrice * 100);
        totalCents += priceCents * meal.qty;
      }
    });
    
    // Add conditional fees to total (packaging and delivery fees)
    const conditionalFees = calculateConditionalFeesForMealsPage();
    const deliveryFeeCents = Math.round(conditionalFees.deliveryFee * 100);
    const packagingFeeCents = Math.round(conditionalFees.packagingFee * 100);
    totalCents += deliveryFeeCents + packagingFeeCents;
    
    // Convert back to dollars
    return totalCents / 100;
  }

  // Helper function to check if fulfillment date or time has changed and show confirmation
  async function confirmFulfillmentDateChange() {
    // Get original delivery date and time from subscription
    const originalDate = getDeliveryDateFromSubscription();
    const originalTime = getFulfillmentTimeFromSubscription();
    const newDate = modalChanges.deliveryDate;
    const newTime = modalChanges.fulfillmentTime;
    
    // Check if date or time has changed
    const dateChanged = newDate && newDate !== originalDate;
    const timeChanged = newTime && newTime !== originalTime;
    
    // If neither date nor time has changed, no confirmation needed
    if (!dateChanged && !timeChanged) {
      return true;
    }
    
    // Show confirmation popup
    return confirm('Moving a fulfillment date or time will move the charge date on all upcoming orders. Are you sure you want to continue?');
  }


  async function saveDate() {
    // Check for fulfillment date changes and get confirmation
    if (!(await confirmFulfillmentDateChange())) {
      return; // User cancelled, don't proceed
    }
    showModalLoading();
    try {
      const subscriptionId = currentSubscription?.id;
      if (!subscriptionId) {
        showToast('No subscription ID found', 'error');
        return;
      }

      // Update subscription with all changes
      // For Delivery, update address first
      if ((modalChanges.fulfillmentMethod || fulfillmentMethod) === 'Delivery') {
        const addressResp = await fetch(`${API_URL}/subscription/address`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriptionId,
            address1: modalChanges.address1,
            address2: modalChanges.address2,
            city: modalChanges.city,
            state: modalChanges.state,
            zip: modalChanges.zip
          })
        });
        const addressData = await addressResp.json();
        if (!addressData.success) {
          showToast(addressData.error || (addressData.recharge && addressData.recharge.error) || 'Failed to update address', 'error');
          
          return;
        }
      }

      // Always update fulfillment/order attributes
      const orderAttributesArr = [];
      
      // First, get all existing order attributes from the current subscription
      if (currentSubscription?.include?.address?.order_attributes) {
        // Convert existing order attributes to the format we need
        currentSubscription.include.address.order_attributes.forEach(attr => {
          if (attr && typeof attr === 'object') {
            // Handle both {name, value} and {"Key": "Value"} formats
            if ('name' in attr && 'value' in attr) {
              orderAttributesArr.push({ [attr.name]: attr.value });
            } else {
              // It's already in {"Key": "Value"} format
              orderAttributesArr.push(attr);
            }
          }
        });
      }
      
      // Now update or add the specific attributes we're changing
      if (modalChanges.fulfillmentMethod || fulfillmentMethod) {
        // Update existing Fulfillment Type or add new one
        const existingIndex = orderAttributesArr.findIndex(attr => 
          Object.keys(attr)[0] === 'Fulfillment Type'
        );
        if (existingIndex !== -1) {
          orderAttributesArr[existingIndex] = { "Fulfillment Type": modalChanges.fulfillmentMethod || fulfillmentMethod };
        } else {
          orderAttributesArr.push({ "Fulfillment Type": modalChanges.fulfillmentMethod || fulfillmentMethod });
        }
      }
      
      // Always include LocationID
      let locationIdToSend = null;
      if ((modalChanges.fulfillmentMethod || fulfillmentMethod) === 'Pickup') {
        locationIdToSend = modalChanges.selectedPickupLocationId || selectedPickupLocationId;
      } else {
        // For Delivery, use the delivery location ID from subscription
        locationIdToSend = currentSubscription?.deliveryLocation?.location_id;
      }
      
      if (locationIdToSend) {
        // Update existing LocationID or add new one
        const existingIndex = orderAttributesArr.findIndex(attr => 
          Object.keys(attr)[0] === 'LocationID'
        );
        if (existingIndex !== -1) {
          orderAttributesArr[existingIndex] = { "LocationID": locationIdToSend };
        } else {
          orderAttributesArr.push({ "LocationID": locationIdToSend });
        }
      }
      
      // Compute ISO string for Fulfillment Date
      let timeZone = '';
      if ((modalChanges.fulfillmentMethod || fulfillmentMethod) === 'Pickup') {
        // Try to get from selected pickup location
        const pickupLoc = (pickupLocations || []).find(loc => String(loc.id) === String(modalChanges.selectedPickupLocationId || selectedPickupLocationId));
        timeZone = pickupLoc && pickupLoc.locationTimeZone ? pickupLoc.locationTimeZone : 'America/Los_Angeles';
      } else {
        // Delivery
        timeZone = (currentSubscription && currentSubscription.deliveryLocation && currentSubscription.deliveryLocation.locationTimeZone) ? currentSubscription.deliveryLocation.locationTimeZone : 'America/Los_Angeles';
      }
      
      // If fulfillmentTime is empty, get it from the original subscription
      let timeToUse = modalChanges.fulfillmentTime || fulfillmentTime;
      if (!timeToUse && currentSubscription?.include?.address?.order_attributes) {
        const fulfillmentDateEntry = currentSubscription.include.address.order_attributes.find(
          obj => obj.hasOwnProperty("Fulfillment Date")
        );
        const fulfillmentDateAttr = fulfillmentDateEntry ? fulfillmentDateEntry["Fulfillment Date"] : null;
        if (fulfillmentDateAttr && fulfillmentDateAttr.includes('T')) {
          const timePart = fulfillmentDateAttr.split('T')[1];
          const timeWithOffset = timePart.split('-')[0]; // Remove timezone offset
          const [hours, minutes] = timeWithOffset.split(':');
          timeToUse = `${hours}:${minutes}`;
        }
      }
      let isoString = '';
      try {
        const timeStr = toAmPm(timeToUse);
        isoString = getLocalISOFromDateAndTime(
          modalChanges.deliveryDate,
          timeStr,
          currentTimeZone
        );
      } catch (e) {
        showToast('Invalid date or time format', 'error');
        
        return;
      }
      if (isoString) {
        // Update existing Fulfillment Date with the ISO string
        const existingIndex = orderAttributesArr.findIndex(attr => 
          Object.keys(attr)[0] === 'Fulfillment Date'
        );
        if (existingIndex !== -1) {
          orderAttributesArr[existingIndex] = { "Fulfillment Date": isoString };
        } else {
          orderAttributesArr.push({ "Fulfillment Date": isoString });
        }
      }
      
      // Parse frequency if changed
      let frequencyData = null;
      if (modalChanges.selectedFrequency && modalChanges.selectedFrequency !== selectedFrequency) {
        frequencyData = parseFrequency(modalChanges.selectedFrequency);
      }
      
      const updatePayload = {
        order_attributes: orderAttributesArr,
        deliveryDate: modalChanges.deliveryDate,
        fulfillmentTime: modalChanges.fulfillmentTime,
        selectedFrequency: modalChanges.selectedFrequency,
        ...(frequencyData && { subscription_preferences: frequencyData })
      };
      
      const subscriptionData = await updateSubscriptionSafely(subscriptionId, updatePayload);
      if (!subscriptionData.success) {
        showToast(subscriptionData.error || 'Failed to update subscription', 'error');
        
        return;
      }

      showToast('All changes saved successfully!', 'success');
      // Add a small delay before refreshing to ensure the update has processed
      setTimeout(async () => {
        await refreshSubscriptionData(subscriptionId);
      }, 1000);
    } catch (error) {
      showToast('Error saving changes', 'error');
    } finally {
      hideModalLoading();
    }
  }

  async function attachModalEvents() {
    if (modalLoading) return;
    // Close modal
    modalOverlay.querySelector('.afinity-modal-close').onclick = () => {
      modalOverlay.style.display = 'none';
      // Refresh the window when modal is closed
      window.location.reload();
    };
    // Back button
    const backBtn = modalOverlay.querySelector('.afinity-modal-back');
    if (backBtn) backBtn.onclick = () => {
      if (currentPage === 'meals') {
        currentPage = 'main';
        renderModal(); // force rerender to main page
      } else {
        modalOverlay.style.display = 'none';
        // Refresh the window when modal is closed via back button
        window.location.reload();
      }
    };
    // Edit contents or add extra meal
    const editBtn = modalOverlay.querySelector('.afinity-modal-update-meals');
    if (editBtn) editBtn.onclick = async () => {
      showModalLoading();
      mealsPageMode = 'update'; // Set mode to update subscription meals
      
      currentPage = 'meals';
      renderModal();
      
      // Fetch fresh subscription data and update originalSubscriptionMeals
      const subscriptionId = currentSubscription?.id;
      if (subscriptionId) {
        await refreshSubscriptionData(subscriptionId);
        
        // Initialize update mode meals with fresh original subscription meals
        updateModeMeals = originalSubscriptionMeals.map(meal => ({ ...meal }));
        
        // Re-render the modal with fresh data
        renderModal();
      }
      
      // Fetch menu data when switching to meals page
      await fetchMenuData();
      
      // Header total is set when page initially renders and stays static
    };
    const addExtraMeal = modalOverlay.querySelector('.afinity-modal-add-extra');
    if (addExtraMeal) addExtraMeal.onclick = async (e) => {
      e.preventDefault();
      mealsPageMode = 'onetime'; // Set mode to add one-time meals
      
      currentPage = 'meals';
      renderModal();
      
      // Fetch fresh subscription data to get updated one-time meals
      const subscriptionId = currentSubscription?.id;
      if (subscriptionId) {
        await refreshSubscriptionData(subscriptionId);
        
        // Clear one-time meals when switching to one-time mode
        selectedMeals = [];
        
        // Re-render the modal with fresh data
        renderModal();
      }
      
      // Fetch menu data when switching to meals page
      await fetchMenuData();
      
      // Header total is set when page initially renders and stays static
    };
   
    const saveBtn = modalOverlay.querySelector('.afinity-modal-footer-save-btn');
    if (saveBtn) saveBtn.onclick = async () => {
      
      // Check for fulfillment date changes and get confirmation
      if (!(await confirmFulfillmentDateChange())) {
        return; // User cancelled, don't proceed
      }
      
      // Show loading state
      showModalLoading();
      
      try {
        const subscriptionId = currentSubscription?.id;
        if (!subscriptionId) {
          showToast('No subscription ID found', 'error');
          return;
        }

        // Update address using the dedicated address endpoint
        if (modalChanges.address1 || modalChanges.address2 || modalChanges.city || modalChanges.state || modalChanges.zip) {
          const addressData = {
            subscriptionId: subscriptionId,
            address1: modalChanges.address1,
            address2: modalChanges.address2,
            city: modalChanges.city,
            state: modalChanges.state,
            zip: modalChanges.zip
          };

          const addressResponse = await fetch(`${API_URL}/subscription/address`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(addressData)
          });

          const addressResult = await addressResponse.json();
          if (!addressResult.success) {
            console.error('Failed to update address:', addressResult);
            showToast(addressResult.error || 'Failed to update address', 'error');
            
            return;
          }
        }

        // Update subscription with all changes
        // Always update fulfillment type and related fields
        const orderAttributesArr = [];
        
        // First, get all existing order attributes from the current subscription
        if (currentSubscription?.include?.address?.order_attributes) {
          // Convert existing order attributes to the format we need
          currentSubscription.include.address.order_attributes.forEach(attr => {
            if (attr && typeof attr === 'object') {
              // Handle both {name, value} and {"Key": "Value"} formats
              if ('name' in attr && 'value' in attr) {
                orderAttributesArr.push({ [attr.name]: attr.value });
              } else {
                // It's already in {"Key": "Value"} format
                orderAttributesArr.push(attr);
              }
            }
          });
        }
        
        // Now update or add the specific attributes we're changing
        if (modalChanges.fulfillmentMethod || fulfillmentMethod) {
          // Update existing Fulfillment Type or add new one
          const existingIndex = orderAttributesArr.findIndex(attr => 
            Object.keys(attr)[0] === 'Fulfillment Type'
          );
          if (existingIndex !== -1) {
            orderAttributesArr[existingIndex] = { "Fulfillment Type": modalChanges.fulfillmentMethod || fulfillmentMethod };
          } else {
            orderAttributesArr.push({ "Fulfillment Type": modalChanges.fulfillmentMethod || fulfillmentMethod });
          }
        }
        
        // Always include LocationID
        let locationIdToSend = null;
        if ((modalChanges.fulfillmentMethod || fulfillmentMethod) === 'Pickup') {
          locationIdToSend = modalChanges.selectedPickupLocationId || selectedPickupLocationId;
        } else {
          // For Delivery, use the delivery location ID from subscription
          locationIdToSend = currentSubscription?.deliveryLocation?.location_id;
        }
        
        if (locationIdToSend) {
          // Update existing LocationID or add new one
          const existingIndex = orderAttributesArr.findIndex(attr => 
            Object.keys(attr)[0] === 'LocationID'
          );
          if (existingIndex !== -1) {
            orderAttributesArr[existingIndex] = { "LocationID": locationIdToSend };
          } else {
            orderAttributesArr.push({ "LocationID": locationIdToSend });
          }
        }
        
        // Compute ISO string for Fulfillment Date
        let timeZone = '';
        if ((modalChanges.fulfillmentMethod || fulfillmentMethod) === 'Pickup') {
          // Try to get from selected pickup location
          const pickupLoc = (pickupLocations || []).find(loc => String(loc.id) === String(modalChanges.selectedPickupLocationId || selectedPickupLocationId));
          timeZone = pickupLoc && pickupLoc.locationTimeZone ? pickupLoc.locationTimeZone : 'America/Los_Angeles';
        } else {
          // Delivery
          timeZone = (currentSubscription && currentSubscription.deliveryLocation && currentSubscription.deliveryLocation.locationTimeZone) ? currentSubscription.deliveryLocation.locationTimeZone : 'America/Los_Angeles';
        }
        
        // If fulfillmentTime is empty, get it from the original subscription
        let timeToUse = modalChanges.fulfillmentTime || fulfillmentTime;

        if (!timeToUse && currentSubscription?.include?.address?.order_attributes) {
          const fulfillmentDateEntry = currentSubscription.include.address.order_attributes.find(
            obj => obj.hasOwnProperty("Fulfillment Date")
          );
          const fulfillmentDateAttr = fulfillmentDateEntry ? fulfillmentDateEntry["Fulfillment Date"] : null;
          if (fulfillmentDateAttr && fulfillmentDateAttr.includes('T')) {
            const timePart = fulfillmentDateAttr.split('T')[1];
            const timeWithOffset = timePart.split('-')[0]; // Remove timezone offset
            const [hours, minutes] = timeWithOffset.split(':');
            timeToUse = `${hours}:${minutes}`;
          }
        }
        
        let isoString = '';
        try {
          const timeStr = toAmPm(timeToUse || '15:30');
          isoString = getLocalISOFromDateAndTime(
            modalChanges.deliveryDate,
            timeStr,
            currentTimeZone
          );
        } catch (e) {
          showToast('Invalid date or time format', 'error');
          
          return;
        }
        if (isoString) {
          // Update existing Fulfillment Date or add new one
          const existingIndex = orderAttributesArr.findIndex(attr => 
            Object.keys(attr)[0] === 'Fulfillment Date'
          );
          if (existingIndex !== -1) {
            orderAttributesArr[existingIndex] = { "Fulfillment Date": isoString };
          } else {
            orderAttributesArr.push({ "Fulfillment Date": isoString });
          }
        }
        
        // Add delivery instructions if changed
        if (modalChanges.deliveryInstructions !== undefined) {
          // Update existing Delivery Instructions or add new one
          const existingIndex = orderAttributesArr.findIndex(attr => 
            Object.keys(attr)[0] === 'Delivery Instructions'
          );
          if (existingIndex !== -1) {
            orderAttributesArr[existingIndex] = { "Delivery Instructions": modalChanges.deliveryInstructions };
          } else {
            orderAttributesArr.push({ "Delivery Instructions": modalChanges.deliveryInstructions });
          }
        }
        
        // Parse frequency if changed
        let frequencyData = null;
        if (modalChanges.selectedFrequency && modalChanges.selectedFrequency !== selectedFrequency) {
          frequencyData = parseFrequency(modalChanges.selectedFrequency);
        }
        
        const updatePayload = {
          order_attributes: orderAttributesArr,
          deliveryDate: modalChanges.deliveryDate,
          fulfillmentTime: modalChanges.fulfillmentTime,
          selectedFrequency: modalChanges.selectedFrequency,
          ...(frequencyData && { subscription_preferences: frequencyData })
        };

        const subscriptionResult = await updateSubscriptionSafely(subscriptionId, updatePayload);
        if (subscriptionResult.success) {
          showToast('All changes saved successfully!', 'success');
          // Add a small delay before refreshing to ensure the update has processed
          setTimeout(async () => {
            await refreshSubscriptionData(subscriptionId);
          }, 1000);
        } else {
          console.error('Failed to save subscription changes:', subscriptionResult);
          showToast('Failed to save changes', 'error');
        }
      } catch (error) {
        console.error('Error saving changes:', error);
        showToast('Error saving changes', 'error');
      } finally {
        hideModalLoading();
      }
    };
    
    // Handle the Cancel button to close the modal
    const cancelBtn = modalOverlay.querySelector('.afinity-modal-cancel-btn');
    if (cancelBtn) cancelBtn.onclick = () => {
      modalOverlay.style.display = 'none';
      // Refresh the window when modal is closed
      window.location.reload();
    };
    
    const cancelSubBtn = modalOverlay.querySelector('.afinity-cancel-subscription');
    if (cancelSubBtn) cancelSubBtn.onclick = async (e) => {
      e.preventDefault();
      await handleCancelSubscription();
    };



    // Load charges table
    if (currentPage === 'main') {
      await loadChargesTable();
    }
    // Attach meal card events
    attachMealCardEvents();
    // Attach sidebar quantity controls
    attachSidebarQuantityEvents();
    
    // Menu category tabs
    modalOverlay.querySelectorAll('.afinity-meals-category-tab').forEach(tab => {
      tab.onclick = (e) => {
        const categoryId = e.target.getAttribute('data-category-id');
        selectedMenuCategory = categoryId;
        
        // Update active tab
        modalOverlay.querySelectorAll('.afinity-meals-category-tab').forEach(t => 
          t.classList.remove('active')
        );
        e.target.classList.add('active');
        
        // Re-render the meals grid
        const mealsGrid = modalOverlay.querySelector('.afinity-meals-content');
        if (mealsGrid) {
          mealsGrid.innerHTML = renderMealsGrid();
        }
        
        // Re-attach meal card events
        attachMealCardEvents();
      };
    });
    
    // Swap Items
    const swapBtn = modalOverlay.querySelector('.afinity-meals-swap-btn');
    if (swapBtn) {
      swapBtn.onclick = async () => {
      if (mealsPageMode === 'update') {
        // Handle subscription meal updates
        
        // Check if there are any changes to save
        const currentMeals = getCurrentMealsArray();
        const hasChanges = currentMeals.some(meal => {
          const originalMeal = originalSubscriptionMeals.find(orig => String(orig.id) === String(meal.id));
          if (!originalMeal) {
            // New meal added
            return meal.qty > 0;
          }
          // Quantity changed
          return meal.qty !== originalMeal.qty;
        });
        
        // Also check if any original meals were removed (qty = 0)
        const hasRemovals = originalSubscriptionMeals.some(origMeal => {
          const selectedMeal = currentMeals.find(sel => String(sel.id) === String(origMeal.id));
          return !selectedMeal || selectedMeal.qty === 0;
        });
        
        if (!hasChanges && !hasRemovals) {
          showToast('No changes to save', 'info');
          return;
        }
        
        showModalLoading();
        
        try {
          const subscriptionId = currentSubscription?.id;
          if (!subscriptionId) {
            showToast('No subscription ID found', 'error');
            
            return;
          }
          
          // Prepare items for bundle selection update (all meals with qty > 0)
          const items = currentMeals.filter(meal => meal.qty > 0).map(meal => {
            // Find the collection ID from menuData
            let collectionId = null;
            let externalProductId = null;
            
            if (menuData && menuData.items) {
              for (const category of menuData.items) {
                if (category.collection && category.collection.products) {
                  const productNode = category.collection.products.edges.find(edge => {
                    const product = edge.node;
                    if (product.variants && product.variants.edges) {
                      return product.variants.edges.some(variantEdge => 
                        String(variantEdge.node.id.replace('gid://shopify/ProductVariant/', '')) === String(meal.id.replace('gid://shopify/ProductVariant/', '')  )
                      );
                    }
                    return false;
                  });
                  
                  if (productNode) {
                    // Extract the numeric ID from the Shopify GID format using resourceId
                    collectionId = category.resourceId.replace('gid://shopify/Collection/', '');
                    externalProductId = productNode.node.id.replace('gid://shopify/Product/', '');
                    break;
                  }
                }
              }
            }
            
            return {
              collection_id: '308869562425',
              external_product_id: externalProductId,
              external_variant_id: meal.id.replace('gid://shopify/ProductVariant/', ''),
              quantity: meal.qty
            };
          });
          
          // Validate that all items have required fields
          const invalidItems = items.filter(item => !item.collection_id || !item.external_product_id || !item.external_variant_id);
          if (invalidItems.length > 0) {
            console.error('Invalid subscription items found:', invalidItems);
            showToast('Some meals could not be mapped to collections. Please try again.', 'error');
            
            return;
          }
          
          // Call the bundle selections endpoint
          const response = await fetch(`${API_URL}/subscription/${subscriptionId}/bundle_selections`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items })
          });
          
          const result = await response.json();
          
          if (result.success) {
            showToast('Subscription meals updated successfully!', 'success');
            
            // Refresh subscription data to show updated meals
            setTimeout(async () => {
              await refreshSubscriptionData(subscriptionId);
            }, 1000);
            
            // Go back to main page
            currentPage = 'main';
            renderModal();
          } else {
            showToast(result.error || 'Failed to update subscription meals', 'error');
          }
        } catch (error) {
          console.error('Error updating subscription meals:', error);
          showToast('Error updating subscription meals', 'error');
        }
      } else {
        // Handle one-time meal additions
        
        // Check if there are any one-time meals to add
        const currentMeals = getCurrentMealsArray();
        const oneTimeMeals = currentMeals.filter(meal => meal.qty > 0);
        
        if (oneTimeMeals.length === 0) {
          showToast('No one-time meals to add', 'info');
          return;
        }
        
        showModalLoading();
        
        try {
          const subscriptionId = currentSubscription?.id;
          if (!subscriptionId) {
            showToast('No subscription ID found', 'error');
            
            return;
          }
          
          // Use the already filtered one-time meals
          // Note: In one-time mode, all meals in currentMeals are one-time meals
        
        // Prepare the items array for the one-time meals
        const items = oneTimeMeals.map(meal => {
          // Find the collection ID from menuData
          let collectionId = null;
          let externalProductId = null;
          let productTitle = null;
          let variantTitle = null;
          let price = null;
          
          if (menuData && menuData.items) {
            for (const category of menuData.items) {
              if (category.collection && category.collection.products) {
                const productNode = category.collection.products.edges.find(edge => {
                  const product = edge.node;
                  if (product.variants && product.variants.edges) {
                    return product.variants.edges.some(variantEdge => 
                      String(variantEdge.node.id.replace('gid://shopify/ProductVariant/', '')) === String(meal.id.replace('gid://shopify/ProductVariant/', '')  )
                    );
                  }
                  return false;
                });
                
                if (productNode) {
                  // Extract the numeric ID from the Shopify GID format using resourceId
                  collectionId = category.resourceId.replace('gid://shopify/Collection/', '');
                  externalProductId = productNode.node.id.replace('gid://shopify/Product/', '');
                  
                  // Get product and variant details
                  const product = productNode.node;
                  const variant = product.variants.edges.find(variantEdge => 
                    String(variantEdge.node.id.replace('gid://shopify/ProductVariant/', '')) === String(meal.id.replace('gid://shopify/ProductVariant/', ''))
                  )?.node;
                  
                  if (product) {
                    productTitle = product.title;
                  }
                  
                  if (variant) {
                    variantTitle = variant.title;
                    // Get price from variant
                    if (variant.price) {
                      if (typeof variant.price === 'string') {
                        price = parseFloat(variant.price);
                      } else if (variant.price.amount) {
                        price = parseFloat(variant.price.amount);
                      } else if (typeof variant.price === 'number') {
                        price = variant.price;
                      }
                    }
                    // Apply 10% discount to the price
                    if (price && !isNaN(price)) {
                      price = getDiscountedPrice(price);
                    }
                  }
                  break;
                }
              }
            }
          }
          
          return {
            collection_id: '308869562425',
            external_product_id: externalProductId,
            external_variant_id: meal.id.replace('gid://shopify/ProductVariant/', ''),
            product_title: productTitle,
            variant_title: variantTitle,
            price: price ? price.toString() : null,
            quantity: meal.qty
          };
        });
        
        // Validate that all items have required fields
        const invalidItems = items.filter(item => !item.collection_id || !item.external_product_id || !item.external_variant_id);
        if (invalidItems.length > 0) {
          console.error('Invalid one-time items found:', invalidItems);
          showToast('Some one-time meals could not be mapped to collections. Please try again.', 'error');
          
          return;
        }
        
        const response = await fetch(`${API_URL}/subscription/${subscriptionId}/onetime-meals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items })
        });
       
       const result = await response.json();
        if (result.success) {
          showToast('One-time meals added successfully!', 'success');
          
          // Refresh subscription data to show updated meals
          setTimeout(async () => {
            await refreshSubscriptionData(subscriptionId);
          }, 1000);
          
          // Go back to main page
          currentPage = 'main';
          renderModal();
        } else {
          showToast(result.error || 'Failed to add one-time meals', 'error');
        }
      } catch (error) {
        console.error('Error adding one-time meals:', error);
        showToast('Error adding one-time meals', 'error');
              } finally {
          
        }
      }
    };
    }
    // Initialize Flatpickr for date inputs
    const mainDateInput = modalOverlay.querySelector('#afinity-date');
    if (mainDateInput && typeof flatpickr !== 'undefined') {
      // Get frequency-based restricted dates
      const restrictedDates = getRestrictedDates();
      
      flatpickr(mainDateInput, {
        dateFormat: "Y-m-d", // Keep ISO format for internal storage
        minDate: "today",
        disable: [
          function(date) {
            // Disable weekends (0 = Sunday, 6 = Saturday)
            const isWeekend = (date.getDay() === 0 || date.getDay() === 6);
            
            // Disable frequency-based restricted dates
            // Use local timezone instead of UTC to avoid date offset issues
            const dateStr = date.getFullYear() + '-' + 
                           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(date.getDate()).padStart(2, '0');
            const isRestricted = restrictedDates.includes(dateStr);
            
            return isWeekend || isRestricted;
          }
        ],
        onChange: function(selectedDates, dateStr, instance) {
          
          updateModalChanges('deliveryDate', dateStr);
          deliveryDate = dateStr;
          
          // Update the display value to show MM-DD-YYYY format
          if (instance.input) {
            instance.input.value = formatDeliveryDate(dateStr);
          }
        }
      });
    }
    // Frequency input
    const frequencyInput = modalOverlay.querySelector('#afinity-frequency');
    if (frequencyInput) frequencyInput.onchange = (e) => {
      updateModalChanges('selectedFrequency', e.target.value);
      selectedFrequency = e.target.value;
      
      // Reinitialize date picker with new frequency-based restrictions
      const currentFulfillmentMethod = modalChanges.fulfillmentMethod || fulfillmentMethod || 'Delivery';
      setupDatePicker(currentFulfillmentMethod);
    };
    // Address inputs - ensure they update modalChanges
    const addressInput = modalOverlay.querySelector('#afinity-address');
    if (addressInput) {
      addressInput.oninput = (e) => { 
        updateModalChanges('address1', e.target.value); 
        address1 = e.target.value; 
      };
    }
    const address2Input = modalOverlay.querySelector('#afinity-address2');
    if (address2Input) {
      address2Input.oninput = (e) => {
        updateModalChanges('address2', e.target.value);
      };
    }
    const cityInput = modalOverlay.querySelector('#afinity-city');
    if (cityInput) {
      cityInput.oninput = (e) => { 
        updateModalChanges('city', e.target.value); 
        city = e.target.value; 
      };
    }
    const stateInput = modalOverlay.querySelector('#afinity-state');
    if (stateInput) {
      stateInput.onchange = (e) => { 
        updateModalChanges('state', e.target.value); 
        state = e.target.value; 
      };
    }
    const zipInput = modalOverlay.querySelector('#afinity-zip');
    if (zipInput) {
      zipInput.oninput = (e) => { 
        updateModalChanges('zip', e.target.value); 
        zip = e.target.value; 
      };
    }
    // Save button for Date section
    const saveDateBtn = modalOverlay.querySelector('#afinity-save-date-btn');
    if (saveDateBtn) saveDateBtn.onclick = saveDate;
    
    // One-time item delete buttons
    const onetimeDeleteButtons = modalOverlay.querySelectorAll('.afinity-modal-onetime-delete');
    onetimeDeleteButtons.forEach(button => {
      button.onclick = async (e) => {
        e.preventDefault();
        const onetimeId = button.getAttribute('data-onetime-id');
        const subscriptionId = currentSubscription?.id;
        
        if (!onetimeId || !subscriptionId) {
          showToast('Error: Missing data for deletion', 'error');
          return;
        }
        
        if (confirm('Are you sure you want to remove this one-time item?')) {
          showModalLoading();
          
          try {
            const response = await fetch(`${API_URL}/subscription/${subscriptionId}/onetime-meals/${onetimeId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            
            const result = await response.json();
            
            if (result.success) {
              showToast('One-time item removed successfully!', 'success');
              
              // Refresh subscription data to update the display
              setTimeout(async () => {
                await refreshSubscriptionData(subscriptionId);
              }, 1000);
            } else {
              showToast(result.error || 'Failed to remove one-time item', 'error');
            }
          } catch (error) {
            console.error('Error deleting one-time item:', error);
            showToast('Error removing one-time item', 'error');
          } finally {
            
          }
        }
      };
    });
    // Listen for fulfillment method change
    const methodSelect = modalOverlay.querySelector('#afinity-method');
    if (methodSelect) {
      methodSelect.onchange = async (e) => {
        const newMethod = e.target.value;
        
        updateModalChanges('fulfillmentMethod', newMethod);
        fulfillmentMethod = newMethod;
        
        // Clear delivery date and time when switching methods to force new selection
        updateModalChanges('deliveryDate', '');
        updateModalChanges('fulfillmentTime', '');
        deliveryDate = '';
        fulfillmentTime = '';
        
        // Clear the input field values
        const dateInput = document.getElementById('afinity-date');
        if (dateInput) {
          dateInput.value = '';
        }
        
        if (fulfillmentMethod === 'Pickup') {
          // Use the selected pickup location, or default to the first one
          let pickupId = modalChanges.selectedPickupLocationId || selectedPickupLocationId;
          if (!pickupId && pickupLocations && pickupLocations.length > 0) {
            pickupId = pickupLocations[0].id;
            updateModalChanges('selectedPickupLocationId', pickupId);
            selectedPickupLocationId = pickupId;
            // Also clear and reset date/time for this location
            await clearAndResetDateTimeForPickupLocation(pickupId);
          } else if (pickupId) {
            // If already selected, still reset date/time for this location
            await clearAndResetDateTimeForPickupLocation(pickupId);
          }
          console.log('Fetching available dates for pickup location:', pickupId);
          await fetchAvailableDates(zip, pickupId);
          setupDatePicker('Pickup');
          // Re-initialize time picker for pickup
          reinitializeTimePicker();
        } else {
          console.log('Switching to Delivery method');
          await fetchAvailableDates(zip, null);
          setupDatePicker('Delivery');
          
          // Re-initialize time picker for delivery
          if (timeInput && typeof jQuery !== 'undefined' && jQuery.fn.timepicker) {
            // Destroy existing timepicker instance
            if ($(timeInput).data('timepicker')) {
              $(timeInput).timepicker('remove');
            }
          }
        }
        
        // If we're on the meals page, refresh the sidebar to update fees
        if (currentPage === 'meals') {
          rerenderSidebarMeals();
        }
        
        // Re-render the modal to show cleared date/time fields
        renderModal();
      };
    }
    // Listen for pickup location change
    const pickupRadios = modalOverlay.querySelectorAll('input[name="pickup-location"]');
    pickupRadios.forEach(radio => {
      radio.onchange = async (e) => {
        updateModalChanges('selectedPickupLocationId', parseInt(e.target.value));
        selectedPickupLocationId = parseInt(e.target.value);
        renderPickupLocationsSection();
      };
    });
    // Initialize Flatpickr for date input (main)
    setupDatePicker(modalChanges.fulfillmentMethod || fulfillmentMethod || 'Delivery');

    const saveAllBtn = modalOverlay.querySelector('#afinity-save-all-btn');
    if (saveAllBtn) {
      saveAllBtn.onclick = saveDate;
    }
    
    
    // Update all date input fields with properly formatted dates
    const dateInputs = modalOverlay.querySelectorAll('#afinity-date, #afinity-meals-date');
    dateInputs.forEach(async (input) => {
      try {
        const deliveryDate = await getNextChargeDateFromSubscription();
        if (deliveryDate) {
          input.value = formatDeliveryDate(deliveryDate);
        }
      } catch (error) {
        console.error('Error updating date input:', error);
      }
    });
    
    // Update date labels in headers
    const dateLabels = modalOverlay.querySelectorAll('.afinity-modal-date-label');
    dateLabels.forEach(async (label) => {
      try {
        const deliveryDate = await getNextChargeDateFromSubscription();
        if (deliveryDate) {
          label.textContent = formatDeliveryDate(deliveryDate);
        }
      } catch (error) {
        console.error('Error updating date label:', error);
      }
    });
    
    // Add character count for delivery instructions
    const instructionsTextarea = modalOverlay.querySelector('#afinity-delivery-instructions');
    const charCountSpan = modalOverlay.querySelector('#afinity-instructions-char-count');
    if (instructionsTextarea && charCountSpan) {
      instructionsTextarea.addEventListener('input', function() {
        const currentLength = this.value.length;
        charCountSpan.textContent = ` Character limit: ${currentLength}`;
        
        // Store delivery instructions in modalChanges for saving
        updateModalChanges('deliveryInstructions', this.value);
        
        // Optional: Add visual feedback when approaching limit
        if (currentLength >= 250) {
          charCountSpan.style.color = '#ff6b6b';
        } else if (currentLength >= 200) {
          charCountSpan.style.color = '#ffa726';
        } else {
          charCountSpan.style.color = '';
        }
      });
    }
  }

  function attachMethodSectionEvents() {
    if (modalLoading) return;
    // Listen for pickup location change
    const pickupRadios = modalOverlay.querySelectorAll('input[name="pickup-location"]');
    pickupRadios.forEach(radio => {
      radio.onchange = async (e) => {
        updateModalChanges('selectedPickupLocationId', parseInt(e.target.value));
        selectedPickupLocationId = parseInt(e.target.value);
        renderPickupLocationsSection();
        await clearAndResetDateTimeForPickupLocation(parseInt(e.target.value));
        reinitializeTimePicker();
      };
    });
    // Listen for address, city, state, zip changes
    const addressInput = modalOverlay.querySelector('#afinity-address');
    if (addressInput) addressInput.oninput = (e) => { 
      updateModalChanges('address1', e.target.value); 
      address1 = e.target.value; 
    };
    const address2Input = modalOverlay.querySelector('#afinity-address2');
    if (address2Input) address2Input.oninput = (e) => {
      updateModalChanges('address2', e.target.value);
    };
    const cityInput = modalOverlay.querySelector('#afinity-city');
    if (cityInput) cityInput.oninput = (e) => { 
      updateModalChanges('city', e.target.value); 
      city = e.target.value; 
    };
    const stateInput = modalOverlay.querySelector('#afinity-state');
    if (stateInput) stateInput.onchange = (e) => { 
      updateModalChanges('state', e.target.value); 
      state = e.target.value; 
    };
    const zipInput = modalOverlay.querySelector('#afinity-zip');
    if (zipInput) zipInput.oninput = (e) => { 
      updateModalChanges('zip', e.target.value); 
      zip = e.target.value; 
    };
  }

  // Listen for the event on document
  document.addEventListener('Recharge::click::manageSubscription', function(event) {
    event.preventDefault();
    showModalLoading
    // When modal is closed, the style is set to none, so we need to set it to block
    if(modalOverlay) {
      modalOverlay.style.display = 'block';
    }
    
    // Get subscription ID from the event
    const subscriptionId = event.detail?.payload?.subscriptionId || event.detail?.subscription_id || event.target?.getAttribute('data-subscription-id');
    
    if (subscriptionId) {
      // Fetch subscription data from API
      showModalLoading();
      fetch(`${API_URL}/subscription/${subscriptionId}`)
        .then(response => response.json())
        .then(async data => {
          const payload = data.data;
          currentSubscription = payload
          const address = payload.include.address;
          // Extract data from API response
          address1 = address.address1 || '';
          address2 = address.address2 || '';
          city = address.city || '';
          state = getStateCode(address.province || '');
          zip = address.zip || '';
          
          // Extract fulfillment date, time, and method from order attributes
          if (payload?.include?.address?.order_attributes) {
            // Look for Fulfillment Date in order attributes
            let fulfillmentDateAttr = null;
            
            // Handle both {name, value} and {"Key": "Value"} formats
            for (const attr of payload.include.address.order_attributes) {
              if (attr && typeof attr === 'object') {
                if ('name' in attr && 'value' in attr) {
                  if (attr.name === 'Fulfillment Date') {
                    fulfillmentDateAttr = attr;
                    break;
                  }
                } else {
                  // It's already in {"Key": "Value"} format
                  const key = Object.keys(attr)[0];
                  if (key === 'Fulfillment Date') {
                    fulfillmentDateAttr = { name: key, value: attr[key] };
                    break;
                  }
                }
              }
            }
            
            if (fulfillmentDateAttr) {
              const fulfillmentDateTime = fulfillmentDateAttr.value;
              if (fulfillmentDateTime.includes('T')) {
                // Format: "2025-07-03T20:15:00-07:00"
                const [datePart, timePart] = fulfillmentDateTime.split('T');
                deliveryDate = datePart;
                // Extract time and convert to 24-hour format
                const timeWithOffset = timePart.split('-')[0]; // Remove timezone offset
                const [hours, minutes] = timeWithOffset.split(':');
                fulfillmentTime = `${hours}:${minutes}`;
              } else {
                // Format: "2025-07-03"
                deliveryDate = fulfillmentDateTime;
                fulfillmentTime = '15:30'; // Default time
              }
            } else {
              // No Fulfillment Date found, set empty values to force user selection
              deliveryDate = '';
              fulfillmentTime = '';
            }
            
            let fulfillmentTypeAttr;
            for (const attr of payload.include.address.order_attributes) {
              if (attr && typeof attr === 'object') {
                // If it's { name, value }
                if ('name' in attr && 'value' in attr) {
                  if (attr.name === 'Fulfillment Type') {
                    fulfillmentTypeAttr = attr;
                    break;
                  }
                } else {
                  // If it's { "Fulfillment Type": "Delivery" }
                  const key = Object.keys(attr)[0];
                  if (key === 'Fulfillment Type') {
                    fulfillmentTypeAttr = { name: key, value: attr[key] };
                    break;
                  }
                }
              }
            }
            if (fulfillmentTypeAttr) {
              fulfillmentMethod = fulfillmentTypeAttr.value.trim().toLowerCase() === 'pickup' ? 'Pickup' : 'Delivery';
            } else {
              fulfillmentMethod = 'Delivery';
            }
          }
          // Update price from subscription data
          if (payload.price) {
            price = parseFloat(payload.price).toFixed(2);
          }
          
          // Set current frequency from subscription data
          const intervalUnit = payload.order_interval_unit;
          const orderIntervalFrequency = payload.order_interval_frequency;
          if (intervalUnit && orderIntervalFrequency) {
            selectedFrequency = `${intervalUnit}-${orderIntervalFrequency}`;
          } 
          // Initialize modalChanges from subscription data
          modalChanges = {};
          updateModalChanges('address1', address1);
          updateModalChanges('address2', address2);
          updateModalChanges('city', city);
          updateModalChanges('state', state);
          updateModalChanges('zip', zip);
          updateModalChanges('fulfillmentMethod', fulfillmentMethod);
          updateModalChanges('deliveryDate', deliveryDate);
          updateModalChanges('fulfillmentTime', fulfillmentTime);
          updateModalChanges('selectedFrequency', selectedFrequency);
          updateModalChanges('selectedMeals', JSON.parse(JSON.stringify(selectedMeals)));
          
          // Set pickup location ID if it exists in order attributes
          if (payload?.include?.address?.order_attributes) {
            for (const attr of payload.include.address.order_attributes) {
              if (attr && typeof attr === 'object') {
                if ('name' in attr && 'value' in attr) {
                  if (attr.name === 'LocationID') {
                    selectedPickupLocationId = parseInt(attr.value);
                    updateModalChanges('selectedPickupLocationId', selectedPickupLocationId);
                    break;
                  }
                } else {
                  const key = Object.keys(attr)[0];
                  if (key === 'LocationID') {
                    selectedPickupLocationId = parseInt(attr[key]);
                    updateModalChanges('selectedPickupLocationId', selectedPickupLocationId);
                    break;
                  }
                }
              }
            }
          }
          
          // Fetch delivery fee threshold settings for conditional fee calculations
          try {
            await fetchDeliveryFeeThreshold();
          } catch (err) {
            console.error("Error fetching delivery fee threshold:", err);
          }

          currentPage = 'main';
          if (modalOverlay) {
            modalOverlay.style.display = '';
          }
          renderModal();
          
          // Now fetch available dates and times, then initialize pickers
          try {
            await fetchSubscriptionAndPickup(subscriptionId, zip);
            // After fetching available dates, initialize the date and time pickers with current values
            await initializeDateAndTimePickers();
          } catch (err) {
            console.error("Error in fetchSubscriptionAndPickup", err);
          }

          if (payload && payload.include && payload.include.bundle_selections && Array.isArray(payload.include.bundle_selections.items)) {
            originalSubscriptionMeals = payload.include.bundle_selections.items
              .filter(item => {
                // Filter out packaging fee (product ID: 7927816716345) and delivery fee (product ID: 7933253517369)
                const productId = item.external_product_id || item.product_id;
                return productId !== '7927816716345' && productId !== '7933253517369';
              })
              .map(item => {
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
            
            // Initialize selectedMeals with current subscription meals
            selectedMeals = originalSubscriptionMeals.map(meal => ({
              id: meal.id,
              title: meal.title,
              price: meal.price,
              img: meal.img,
              qty: meal.qty
            }));
          } else {
            originalSubscriptionMeals = [];
            selectedMeals = [];
          }
          let locationId = null;
          let locationName = null;
          if (payload && payload.include && payload.include.address && payload.include.address.order_attributes) {
            // Robustly extract LocationID and Location Name from both {name, value} and {"LocationID": value} formats
            for (const attr of payload.include.address.order_attributes) {
              if (attr && typeof attr === 'object') {
                // Format: { name, value }
                if ('name' in attr && 'value' in attr) {
                  if (attr.name === 'LocationID') locationId = attr.value;
                  if (attr.name === 'Location Name') locationName = attr.value;
                } else {
                  // Format: { "LocationID": value } or { "Location Name": value }
                  const key = Object.keys(attr)[0];
                  if (key === 'LocationID') locationId = attr[key];
                  if (key === 'Location Name') locationName = attr[key];
                }
              }
            }
          }

          if (locationId && zip) {
            fetchPickupLocations(zip).then(pickupLocations => {
              const matchedLocation = pickupLocations.find(loc => String(loc.id) === String(locationId));
              const locationName = matchedLocation ? matchedLocation.name : null;
              if (locationName) {
                showModalLoading();
                fetch(`${API_URL}/location/catalog/${locationId}/${encodeURIComponent(locationName)}`)
                  .then(resp => resp.json())
                  .then(catalogPayload => {
                    currentCatalogPayload = catalogPayload;
                    
                    // Fetch variants for this catalog
                    if (catalogPayload && catalogPayload.catalogId) {
                      showModalLoading();
                      const catalogId = catalogPayload.catalogId.replace('gid://shopify/MarketCatalog/', '');
                      fetch(`${API_URL}/subscriptions/${catalogId}/variants`)
                        .then(resp => resp.json())
                        .then(async (variantsData) => {
                          currentCatalogVariants = variantsData;
                          rerenderModalCartList();
                          await renderModal();
                          initializeDateAndTimePickers();
                        })
                        .catch(err => {
                          currentCatalogVariants = null;
                          console.error('Failed to load catalog variants:', err);
                        }).finally(() => {
                          hideModalLoading();
                        });
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
            // If no LocationID, fetch pickup locations and select the first one by default
            if (zip) {
              fetchPickupLocations(zip).then(pickupLocations => {
                if (pickupLocations && pickupLocations.length > 0) {
                  const firstLocation = pickupLocations[0];
                  locationId = firstLocation.id;
                  locationName = firstLocation.name;
                  showModalLoading();
                  // Load catalog for the first location
                  fetch(`${API_URL}/location/catalog/${locationId}/${encodeURIComponent(locationName)}`)
                    .then(resp => resp.json())
                    .then(catalogPayload => {
                      currentCatalogPayload = catalogPayload;
                      if (catalogPayload && catalogPayload.catalogId) {
                        const catalogId = catalogPayload.catalogId.replace('gid://shopify/MarketCatalog/', '');
                        fetch(`${API_URL}/subscriptions/${catalogId}/variants`)
                          .then(resp => resp.json())
                          .then(async (variantsData) => {
                            currentCatalogVariants = variantsData;
                            rerenderModalCartList();
                            await renderModal();
                            initializeDateAndTimePickers();
                          })
                          .catch(err => {
                            currentCatalogVariants = null;
                            console.error('Failed to load catalog variants:', err);
                          })
                      }
                    })
                    .catch(err => {
                      currentCatalogPayload = null;
                      console.error('Failed to load catalog payload for first location:', err);
                    })
                } else {
                  currentCatalogPayload = null;
                }
              }).catch(err => {
                currentCatalogPayload = null;
                console.error('Failed to fetch pickup locations for zip:', zip, err);
              })
            } else {
              currentCatalogPayload = null;
            }
          }
        })
        .catch(error => {
          console.error('Error fetching subscription data:', error);
          currentPage = 'main';
          if (modalOverlay) {
            modalOverlay.style.display = '';
          }
          renderModal();
        })
    } else {
      currentPage = 'main';
      if (modalOverlay) {
        modalOverlay.style.display = '';
      }
      renderModal();
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
    // Use bundle_selections.items as the source, but filter out packaging and delivery fees
    const items = (currentSubscription && currentSubscription.include && currentSubscription.include.bundle_selections && Array.isArray(currentSubscription.include.bundle_selections.items))
      ? currentSubscription.include.bundle_selections.items.filter(item => {
          // Filter out packaging fee (product ID: 7927816716345) and delivery fee (product ID: 7933253517369)
          const productId = item.external_product_id || item.product_id;
          return productId !== '7927816716345' && productId !== '7933253517369';
        })
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
      
      // Get the price from subscription data (no discount on main page)
      // Always use subscription price, not variant price
      const price = Number(item.price) || 0;
      
      return `
        <div class="afinity-modal-cart-item">
          <img src="${img}" alt="${title}" />
          <div>
            <div class="afinity-modal-cart-title">${title}</div>
            <div class="afinity-modal-cart-details">
              <div class="afinity-modal-cart-qty">x ${qty}</div>
              <div class="afinity-modal-cart-price">$${price.toFixed(2)}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Update rerenderSidebarMeals and renderSidebarMeals to recalculate and update the cart total
  function renderSidebarMeals() {
    // Current Meals in Subscription (Read Only)
    const sidebarList = document.querySelector('.afinity-meals-sidebar-list.current-meals');
    if (sidebarList) {
      sidebarList.innerHTML = originalSubscriptionMeals.map(origMeal => {
        
        // Always use catalog variants data as the primary source
        let variant = null;
        let img = MEAL_IMAGE; // Default fallback image
        let title = 'Meal'; // Default title
        let price = 0;
        
        if (currentCatalogVariants && currentCatalogVariants.variants && currentCatalogVariants.variants.length > 0) {
          variant = currentCatalogVariants.variants.find(v => {
            return String(v.id.replace('gid://shopify/ProductVariant/', '')) === String(origMeal.id.replace('gid://shopify/ProductVariant/', ''));
          });
          
          if (variant) {
            img = getVariantImageFromVariantsData(variant);
            // Use product title as primary, fallback to variant title, then default
            title = variant.product?.title || variant.title || 'Meal';
            // Try different price formats
            if (variant.price) {
              if (typeof variant.price === 'string') {
                price = parseFloat(variant.price);
              } else if (variant.price.amount) {
                price = parseFloat(variant.price.amount);
              } else if (typeof variant.price === 'number') {
                price = variant.price;
              }
            }
          } else {
            title = origMeal.title || 'Meal';
            price = origMeal.price || 0;
          }
        } else {
          title = origMeal.title || 'Meal';
          price = origMeal.price || 0;
        }
        
        // Apply 10% discount to the price
        const discountedPrice = getDiscountedPrice(price);
        
        const sel = selectedMeals.find(m => String(m.id) === String(origMeal.id));
        const qty = sel ? sel.qty : origMeal.qty;
        
        return `
          <li class="afinity-meals-sidebar-item" data-meal-id="${origMeal.id}">
            <img src="${img}" alt="${title}" />
            <div class="afinity-meals-sidebar-details">
              <div class="afinity-meals-sidebar-title">${title}</div>
              <div class="afinity-meals-sidebar-price">$${discountedPrice.toFixed(2)}</div>
            </div>
            <div class="afinity-meals-sidebar-qty-controls">
              <button class="afinity-meals-sidebar-qty-btn" data-action="decrement" data-meal-id="${origMeal.id}" disabled>-</button>
              <span class="afinity-meals-sidebar-qty">${qty}</span>
              <button class="afinity-meals-sidebar-qty-btn" data-action="increment" data-meal-id="${origMeal.id}" disabled>+</button>
            </div>
          </li>
        `;
      }).join('');
    }
    
    // Swap Meals
    const swapList = document.querySelector('.afinity-meals-sidebar-list.swap-meals');
    if (swapList) {
      swapList.innerHTML = selectedMeals.filter(m => m.qty > 0 && !originalSubscriptionMeals.some(o => String(o.id) === String(m.id))).map(meal => {
        let variant = null;
        let img = MEAL_IMAGE; // Default fallback image
        let title = 'Meal';
        let price = 0;
        if (currentCatalogVariants && currentCatalogVariants.variants && currentCatalogVariants.variants.length > 0) {
          variant = currentCatalogVariants.variants.find(v => String(v.id) === String(meal.id));
          if (variant) {
            img = getVariantImageFromVariantsData(variant);
            // Use product title as primary, fallback to variant title, then default
            title = variant.product?.title || variant.title || 'Meal';
            if (variant.price) {
              if (typeof variant.price === 'string') price = parseFloat(variant.price);
              else if (typeof variant.price === 'number') price = variant.price;
              else if (variant.price.amount) price = parseFloat(variant.price.amount);
            }
            price = isNaN(price) ? 0 : price;
          } else {
            title = meal.title || 'Meal';
            price = meal.price || 0;
          }
        } else {
          title = meal.title || 'Meal';
          price = meal.price || 0;
        }
        
        // Apply 10% discount to the price
        const discountedPrice = getDiscountedPrice(price);
        return `
          <li class="afinity-meals-sidebar-item" data-meal-id="${meal.id}">
            <img src="${img}" alt="${title}" />
            <div class="afinity-meals-sidebar-details">
              <div class="afinity-meals-sidebar-title">${title}</div>
              <div class="afinity-meals-sidebar-price">$${discountedPrice.toFixed(2)}</div>
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
    
    // Calculate total using the same logic as calculateSidebarTotal
    const total = calculateSidebarTotal();
    // Update total in DOM
    const totalEl = document.querySelector('.afinity-meals-sidebar-total-price');
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  }

  // Helper function to render just the sidebar content for meals page
  function renderMealsPageSidebar() {
    return `
      ${mealsPageMode === 'update' ? `
        <!-- Update Mode: Show all meals as editable -->
        <h3>Current Meals in Subscription</h3>
        <ul class="afinity-meals-sidebar-list subscription-meals">
          ${originalSubscriptionMeals.map(origMeal => {
            // Find the current quantity from current meals array
            const currentMeals = getCurrentMealsArray();
            const sel = currentMeals.find(m => String(m.id) === String(origMeal.id));
            const qty = sel ? sel.qty : origMeal.qty;
            
            // Only show if quantity > 0
            if (qty <= 0) return '';
            
            let meal = { ...origMeal, qty: qty };
            let variant = null;
            let img = MEAL_IMAGE;
            let title = 'Meal';
            let price = 0;
            
            // Try to find variant in all catalog variants with different ID formats
            if (currentCatalogVariants && currentCatalogVariants.variants && currentCatalogVariants.variants.length > 0) {
              variant = currentCatalogVariants.variants.find(v => 
                String(v.id) === String(meal.id) ||
                String(v.id) === String(meal.id).replace('gid://shopify/ProductVariant/', '') ||
                String(v.id).replace('gid://shopify/ProductVariant/', '') === String(meal.id)
              );
            }
            
            if (variant) {
              img = getVariantImageFromVariantsData(variant);
              title = variant.title || variant.product?.title || 'Meal';
              if (variant.price) {
                if (typeof variant.price === 'string') price = parseFloat(variant.price);
                else if (typeof variant.price === 'number') price = variant.price;
                else if (variant.price.amount) price = parseFloat(variant.price.amount);
              }
              price = isNaN(price) ? 0 : price;
            } else {
              // Use meal data from subscription
              title = meal.title || 'Meal';
              price = meal.price || 0;
              img = meal.img || MEAL_IMAGE;
            }
            
            // Apply 10% discount to the price
            const discountedPrice = getDiscountedPrice(price);
            
            return `
              <li class="afinity-meals-sidebar-item" data-meal-id="${meal.id}">
                <img src="${img}" alt="${title}" />
                <div class="afinity-meals-sidebar-details">
                  <div class="afinity-meals-sidebar-title">${title}</div>
                  <div class="afinity-meals-sidebar-price">$${discountedPrice.toFixed(2)}</div>
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

        <h3>New meals to your Subscription</h3>
        <ul class="afinity-meals-sidebar-list swap-meals">
          ${getCurrentMealsArray().filter(m => m.qty > 0 && !originalSubscriptionMeals.some(o => String(o.id) === String(m.id))).map(meal => {
            let variant = null;
            let img = MEAL_IMAGE;
            let title = 'Meal';
            let price = 0;
            
            // Try to find variant in all catalog variants with different ID formats
            if (currentCatalogVariants && currentCatalogVariants.variants && currentCatalogVariants.variants.length > 0) {
              variant = currentCatalogVariants.variants.find(v => 
                String(v.id) === String(meal.id) ||
                String(v.id) === String(meal.id).replace('gid://shopify/ProductVariant/', '') ||
                String(v.id).replace('gid://shopify/ProductVariant/', '') === String(meal.id)
              );
            }
            
            if (variant) {
              img = getVariantImageFromVariantsData(variant);
              title = variant.title || variant.product?.title || 'Meal';
              if (variant.price) {
                if (typeof variant.price === 'string') price = parseFloat(variant.price);
                else if (typeof variant.price === 'number') price = variant.price;
                else if (variant.price.amount) price = parseFloat(variant.price.amount);
              }
              price = isNaN(price) ? 0 : price;
            } else {
              // Use meal data from selection
              title = meal.title || 'Meal';
              price = meal.price || 0;
              img = meal.img || MEAL_IMAGE;
            }
            
            // Apply 10% discount to the price
            const discountedPrice = getDiscountedPrice(price);
            
            return `
              <li class="afinity-meals-sidebar-item" data-meal-id="${meal.id}">
                <img src="${img}" alt="${title}" />
                <div class="afinity-meals-sidebar-details">
                  <div class="afinity-meals-sidebar-title">${title}</div>
                  <div class="afinity-meals-sidebar-price">$${discountedPrice.toFixed(2)}</div>
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
      ` : `
        <!-- One-time Mode: Show current meals as read-only and one-time meals as editable -->
        <h3 style="color: #999; opacity: 0.6;">Current Meals in Subscription</h3>
        <ul class="afinity-meals-sidebar-list current-meals" style="opacity: 0.6; pointer-events: none;">
          ${originalSubscriptionMeals.map(origMeal => {
            const variant = getVariantById(origMeal.id);
            const img = variant ? getVariantImageByCatalog(variant) : MEAL_IMAGE;
            const title = variant ? (variant.product?.title || variant.sku || 'Meal') : origMeal.title;
            const sel = selectedMeals.find(m => m.id === origMeal.id);
            const qty = sel ? sel.qty : origMeal.qty;
            
            // Get the price and apply 10% discount
            let price = 0;
            if (variant && variant.price) {
              if (typeof variant.price === 'string') {
                price = parseFloat(variant.price);
              } else if (variant.price.amount) {
                price = parseFloat(variant.price.amount);
              } else if (typeof variant.price === 'number') {
                price = variant.price;
              }
            } else {
              price = origMeal.price || 0;
            }
            
            // Apply 10% discount
            const discountedPrice = getDiscountedPrice(price);
            
            return `
              <li class="afinity-meals-sidebar-item" data-meal-id="${origMeal.id}">
                <img src="${img}" alt="${title}" />
                <div class="afinity-meals-sidebar-details">
                  <div class="afinity-meals-sidebar-title">${title}</div>
                  <div class="afinity-meals-sidebar-price">$${discountedPrice.toFixed(2)}</div>
                </div>
                <div class="afinity-meals-sidebar-qty-controls">
                  <button class="afinity-meals-sidebar-qty-btn" data-action="decrement" data-meal-id="${origMeal.id}" disabled>-</button>
                  <span class="afinity-meals-sidebar-qty">${qty}</span>
                  <button class="afinity-meals-sidebar-qty-btn" data-action="increment" data-meal-id="${origMeal.id}" disabled>+</button>
                </div>
              </li>
            `;
          }).join('')}
        </ul>
        <h3>Add one time Meals to your next subscription charge</h3>
        <ul class="afinity-meals-sidebar-list swap-meals">
          ${getCurrentMealsArray().filter(m => !originalSubscriptionMeals.some(o => String(o.id) === String(m.id))).map(meal => {
            let variant = null;
            let img = MEAL_IMAGE;
            let title = 'Meal';
            let price = 0;
            
            // Try to find variant in all catalog variants with different ID formats
            if (currentCatalogVariants && currentCatalogVariants.variants && currentCatalogVariants.variants.length > 0) {
              variant = currentCatalogVariants.variants.find(v => 
                String(v.id) === String(meal.id) ||
                String(v.id) === String(meal.id).replace('gid://shopify/ProductVariant/', '') ||
                String(v.id).replace('gid://shopify/ProductVariant/', '') === String(meal.id)
              );
            }
            
            if (variant) {
              img = getVariantImageFromVariantsData(variant);
              title = variant.title || variant.product?.title || 'Meal';
              if (variant.price) {
                if (typeof variant.price === 'string') price = parseFloat(variant.price);
                else if (typeof variant.price === 'number') price = variant.price;
                else if (variant.price.amount) price = parseFloat(variant.price.amount);
              }
              price = isNaN(price) ? 0 : price;
            } else {
              // Use meal data from selection
              title = meal.title || 'Meal';
              price = meal.price || 0;
              img = meal.img || MEAL_IMAGE;
            }
            
            // Apply 10% discount to the price
            const discountedPrice = getDiscountedPrice(price);
            
            return `
              <li class="afinity-meals-sidebar-item" data-meal-id="${meal.id}">
                <img src="${img}" alt="${title}" />
                <div class="afinity-meals-sidebar-details">
                  <div class="afinity-meals-sidebar-title">${title}</div>
                  <div class="afinity-meals-sidebar-price">$${discountedPrice.toFixed(2)}</div>
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
      `}
      <div class="afinity-meals-sidebar-footer">
        <div class="afinity-meals-sidebar-total">
          ${(() => {
            const conditionalFees = calculateConditionalFeesForMealsPage();
            let feesHtml = '';
            
            // Show delivery fee with strike-through when threshold is met
            if (conditionalFees.shouldStrikeThroughDelivery) {
              feesHtml += `
                <div class="afinity-meals-sidebar-fee-row" style="display: flex; justify-content: space-between; align-items: center;">
                  <span>Delivery Fee:</span>
                  <span style="text-decoration: line-through; color: #999;">$${3.99.toFixed(2)}</span>
                </div>
              `;
            } else if (conditionalFees.deliveryFee > 0) {
              feesHtml += `
                <div class="afinity-meals-sidebar-fee-row" style="display: flex; justify-content: space-between; align-items: center;">
                  <span>Delivery Fee:</span>
                  <span>$${conditionalFees.deliveryFee.toFixed(2)}</span>
                </div>
              `;
            }
            
            if (conditionalFees.packagingFee > 0) {
              feesHtml += `
                <div class="afinity-meals-sidebar-fee-row" style="display: flex; justify-content: space-between; align-items: center;">
                  <span>Packaging Fee:</span>
                  <span>$${conditionalFees.packagingFee.toFixed(2)}</span>
                </div>
              `;
            }
            
            return feesHtml;
          })()}
          

          
          <div class="afinity-meals-sidebar-total-row">
            <span>Total:</span>
            <span class="afinity-meals-sidebar-total-price">$${calculateSidebarTotal().toFixed(2)}</span>
          </div>
        </div>
        <button class="afinity-meals-swap-btn" ${mealsPageMode === 'update' ? 
          (() => {
            // Check if there are any changes to save
            const currentMeals = getCurrentMealsArray();
            
            // Check if cart is empty (no meals with qty > 0)
            const hasMealsInCart = currentMeals.some(meal => meal.qty > 0);
            if (!hasMealsInCart) {
              return 'disabled';
            }
            
            const hasChanges = currentMeals.some(meal => {
              const originalMeal = originalSubscriptionMeals.find(orig => String(orig.id) === String(meal.id));
              if (!originalMeal) {
                // New meal added
                return meal.qty > 0;
              }
              // Quantity changed
              return meal.qty !== originalMeal.qty;
            });
            
            // Also check if any original meals were removed (qty = 0)
            const hasRemovals = originalSubscriptionMeals.some(origMeal => {
              const selectedMeal = currentMeals.find(sel => String(sel.id) === String(origMeal.id));
              return !selectedMeal || selectedMeal.qty === 0;
            });
            
            return (!hasChanges && !hasRemovals) ? 'disabled' : '';
          })() : 
          (() => {
            const currentMeals = getCurrentMealsArray();
            const oneTimeMeals = currentMeals.filter(m => m.qty > 0 && !originalSubscriptionMeals.some(o => String(o.id) === String(m.id)));
            return oneTimeMeals.length === 0 ? 'disabled' : '';
          })()}>
          ${mealsPageMode === 'update' ? 'Update Subscription' : 'Add One Time Meals'}
          </button>
      </div>
    `;
  }

  function rerenderSidebarMeals() {
    // If we're on the meals page, update the sidebar content and re-attach events
    if (currentPage === 'meals') {
      // Update the sidebar content directly
      const sidebar = modalOverlay && modalOverlay.querySelector('.afinity-meals-sidebar');
      if (sidebar) {
        // Re-render just the sidebar content
        const sidebarContent = renderMealsPageSidebar();
        sidebar.innerHTML = sidebarContent;
      }
      
      // Header total stays static and doesn't update during meal selection
      
      // Re-attach sidebar quantity events
      attachSidebarQuantityEvents();
      
      // Re-attach swap button event handler
      const swapBtn = modalOverlay.querySelector('.afinity-meals-swap-btn');
      if (swapBtn) {
        swapBtn.onclick = async () => {
          if (mealsPageMode === 'update') {
            
            // Check if there are any changes to save
            const currentMeals = getCurrentMealsArray();
            
            // Check if cart is empty (no meals with qty > 0)
            const hasMealsInCart = currentMeals.some(meal => meal.qty > 0);
            if (!hasMealsInCart) {
              showToast('Cannot save empty cart. Please add meals before updating.', 'error');
              return;
            }
            
            const hasChanges = currentMeals.some(meal => {
              const originalMeal = originalSubscriptionMeals.find(orig => String(orig.id) === String(meal.id));
              if (!originalMeal) {
                // New meal added
                return meal.qty > 0;
              }
              // Quantity changed
              return meal.qty !== originalMeal.qty;
            });
            
            // Also check if any original meals were removed (qty = 0)
            const hasRemovals = originalSubscriptionMeals.some(origMeal => {
              const selectedMeal = currentMeals.find(sel => String(sel.id) === String(origMeal.id));
              return !selectedMeal || selectedMeal.qty === 0;
            });
            
            if (!hasChanges && !hasRemovals) {
              showToast('No changes to save', 'info');
              return;
            }
            
            showModalLoading();
            
            try {
              const subscriptionId = currentSubscription?.id;
              if (!subscriptionId) {
                showToast('No subscription ID found', 'error');
                
                return;
              }
              
              // Prepare items for bundle selection update (all meals with qty > 0)
              let items = currentMeals.filter(meal => meal.qty > 0).map(meal => {
                // Find the collection ID from menuData
                let collectionId = null;
                let externalProductId = null;
                
                if (menuData && menuData.items) {
                  for (const category of menuData.items) {
                    if (category.collection && category.collection.products) {
                      const productNode = category.collection.products.edges.find(edge => {
                        const product = edge.node;
                        if (product.variants && product.variants.edges) {
                          return product.variants.edges.some(variantEdge => 
                            String(variantEdge.node.id.replace('gid://shopify/ProductVariant/', '')) === String(meal.id.replace('gid://shopify/ProductVariant/', '')  )
                          );
                        }
                        return false;
                      });
                      
                      if (productNode) {
                        // Extract the numeric ID from the Shopify GID format using resourceId
                        collectionId = category.resourceId.replace('gid://shopify/Collection/', '');
                        externalProductId = productNode.node.id.replace('gid://shopify/Product/', '');
                        break;
                      }
                    }
                  }
                }
                
                return {
                  collection_id: '308869562425',
                  external_product_id: externalProductId,
                  external_variant_id: meal.id.replace('gid://shopify/ProductVariant/', ''),
                  quantity: meal.qty,
                  price: meal.price || 0
                };
              });
              
              // Validate that all items have required fields
              const invalidItems = items.filter(item => !item.collection_id || !item.external_product_id || !item.external_variant_id);
              if (invalidItems.length > 0) {
                console.error('Invalid subscription items found:', invalidItems);
                showToast('Some meals could not be mapped to collections. Please try again.', 'error');
                
                return;
              }
              
              // Apply conditional fee logic
              items = await handleConditionalFees(items, subscriptionId);
              
              // Call the bundle selections endpoint
              const response = await fetch(`${API_URL}/subscription/${subscriptionId}/bundle_selections`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ items })
              });
              
              const result = await response.json();
              
              if (result.success) {
                showToast('Subscription meals updated successfully!', 'success');
                
                // Refresh subscription data to show updated meals
                setTimeout(async () => {
                  await refreshSubscriptionData(subscriptionId);
                }, 1000);
                
                // Go back to main page
                currentPage = 'main';
                renderModal();
              } else {
                showToast(result.error || 'Failed to update subscription meals', 'error');
              }
            } catch (error) {
              console.error('Error updating subscription meals:', error);
              showToast('Error updating subscription meals', 'error');
            } finally {
              
            }
          } else {
            // Handle one-time meal additions
            
            // Check if there are any one-time meals to add
            const currentMeals = getCurrentMealsArray();
            const oneTimeMeals = currentMeals.filter(meal => meal.qty > 0);
            
            if (oneTimeMeals.length === 0) {
              showToast('Cannot save empty cart. Please add meals before saving.', 'error');
              return;
            }
            
            showModalLoading();
            
            try {
              const subscriptionId = currentSubscription?.id;
              if (!subscriptionId) {
                showToast('No subscription ID found', 'error');
                
                return;
              }
              
              // Use the already filtered one-time meals
              // Note: In one-time mode, all meals in currentMeals are one-time meals
              
              // Prepare the items array for the one-time meals
              const items = oneTimeMeals.map(meal => {
                // Find the collection ID from menuData
                let collectionId = null;
                let externalProductId = null;
                let productTitle = null;
                let variantTitle = null;
                let price = null;
                
                if (menuData && menuData.items) {
                  for (const category of menuData.items) {
                    if (category.collection && category.collection.products) {
                      const productNode = category.collection.products.edges.find(edge => {
                        const product = edge.node;
                        if (product.variants && product.variants.edges) {
                          return product.variants.edges.some(variantEdge => 
                            String(variantEdge.node.id.replace('gid://shopify/ProductVariant/', '')) === String(meal.id.replace('gid://shopify/ProductVariant/', '')  )
                          );
                        }
                        return false;
                      });
                      
                      if (productNode) {
                        // Extract the numeric ID from the Shopify GID format using resourceId
                        collectionId = category.resourceId.replace('gid://shopify/Collection/', '');
                        externalProductId = productNode.node.id.replace('gid://shopify/Product/', '');
                        
                        // Get product and variant titles
                        productTitle = productNode.node.title || 'Meal';
                        const variant = productNode.node.variants.edges.find(variantEdge => 
                          String(variantEdge.node.id.replace('gid://shopify/ProductVariant/', '')) === String(meal.id.replace('gid://shopify/ProductVariant/', ''))
                        );
                        variantTitle = variant ? variant.node.title : 'Default';
                        
                        // Get price from variant
                        if (variant && variant.node.price) {
                          if (typeof variant.node.price === 'string') {
                            price = parseFloat(variant.node.price);
                          } else if (variant.node.price.amount) {
                            price = parseFloat(variant.node.price.amount);
                          } else if (typeof variant.node.price === 'number') {
                            price = variant.node.price;
                          }
                        }
                        break;
                      }
                    }
                  }
                }
                
                return {
                  collection_id: '308869562425',
                  external_product_id: externalProductId,
                  external_variant_id: meal.id.replace('gid://shopify/ProductVariant/', ''),
                  quantity: meal.qty,
                  product_title: productTitle,
                  variant_title: variantTitle,
                  price: price || meal.price || 0
                };
              });
              
              
              // Validate that all items have required fields
              const invalidItems = items.filter(item => !item.collection_id || !item.external_product_id || !item.external_variant_id);
              if (invalidItems.length > 0) {
                console.error('Invalid one-time items found:', invalidItems);
                showToast('Some one-time meals could not be mapped to collections. Please try again.', 'error');
                
                return;
              }
              
              // Call the one-time meals endpoint
              const response = await fetch(`${API_URL}/subscription/${subscriptionId}/onetime-meals`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ items })
              });
             
             const result = await response.json();
              
              if (result.success) {
                showToast('One-time meals added successfully!', 'success');
                
                // Refresh subscription data to show updated meals
                setTimeout(async () => {
                  await refreshSubscriptionData(subscriptionId);
                }, 1000);
                
                // Go back to main page
                currentPage = 'main';
                renderModal();
              } else {
                showToast(result.error || 'Failed to add one-time meals', 'error');
              }
            } catch (error) {
              console.error('Error adding one-time meals:', error);
              showToast('Error adding one-time meals', 'error');
            } finally {
              
            }
          }
        };
      }
    } else {
      // For other pages, just update the sidebar
      renderSidebarMeals();
      attachSidebarQuantityEvents();
    }
  }

  // Function to attach event handlers to meal cards
  function attachMealCardEvents() {
    // Meal add/remove
    const mealButtons = modalOverlay && modalOverlay.querySelectorAll('.afinity-r-card__add-btn');
    
    if (mealButtons) {
      mealButtons.forEach(btn => {
        btn.onclick = (e) => {
          const mealId = btn.getAttribute('data-meal-id');
          const currentMeals = getCurrentMealsArray();
          let sel = currentMeals.find(m => String(m.id) === String(mealId));
          if (btn.classList.contains('afinity-r-card__remove-btn')) {
            // Remove from current meals array
            if (sel) {
              sel.qty = 0;
              // Optionally remove from array entirely:
              // currentMeals = currentMeals.filter(m => String(m.id) !== String(mealId));
            }
          } else {
            // Add or increment
            if (!sel) {
              // Get the meal card element to find product information
              const mealCard = btn.closest('.afinity-r-card');
              let product = null;
              
              if (mealCard) {
                const productId = mealCard.getAttribute('data-product-id');
                // Try to find product information from menuData
                if (menuData && menuData.items) {
                  for (const category of menuData.items) {
                    if (category.collection && category.collection.products) {
                      const productNode = category.collection.products.edges.find(edge => 
                        String(edge.node.id) === String(productId)
                      );
                      if (productNode) {
                        product = productNode.node;
                        break;
                      }
                    }
                  }
                }
              }
              
              // Always use catalog variants data as the primary source
              const mealData = getMealDataFromVariantsData(mealId, product);
              currentMeals.push(mealData);
            } else {
              sel.qty++;
            }
          }
          updateCurrentMealsArray(currentMeals);
          updateModalChanges(mealsPageMode === 'update' ? 'updateModeMeals' : 'selectedMeals', JSON.parse(JSON.stringify(currentMeals)));
          rerenderSidebarMeals();
        };
      });
    }
  }

  // Helper function to get meal data from variants data
  function getMealDataFromVariantsData(variantId, product = null) {
    if (!currentCatalogVariants || !currentCatalogVariants.variants || currentCatalogVariants.variants.length === 0) {
      return {
        id: variantId,
        qty: 1,
        title: 'Meal',
        price: 0,
        img: MEAL_IMAGE
      };
    }
    
    // Try to find variant with different ID formats
    const variant = currentCatalogVariants.variants.find(v => 
      String(v.id) === String(variantId) ||
      String(v.id) === String(variantId).replace('gid://shopify/ProductVariant/', '') ||
      String(v.id).replace('gid://shopify/ProductVariant/', '') === String(variantId)
    );
    
    if (variant) {
      let price = 0;
      if (variant.price) {
        if (typeof variant.price === 'string') price = parseFloat(variant.price);
        else if (typeof variant.price === 'number') price = variant.price;
        else if (variant.price.amount) price = parseFloat(variant.price.amount);
      }
      
      // Apply 10% discount to the price
      const discountedPrice = getDiscountedPrice(price);
      
      // Use product title as primary, fallback to variant title, then product parameter, then default
      const title = variant.product?.title || variant.title || (product ? product.title : null) || 'Meal';
      
      return {
        id: variantId,
        qty: 1,
        title: title,
        price: isNaN(discountedPrice) ? 0 : discountedPrice,
        img: getVariantImageFromVariantsData(variant)
      };
    }
    return {
      id: variantId,
      qty: 1,
      title: 'Meal',
      price: 0,
      img: MEAL_IMAGE
    };
  }

  // Function to attach event handlers to sidebar quantity controls
  function attachSidebarQuantityEvents() {
    
    // Attach event handlers to quantity buttons in both subscription-meals and swap-meals sections
    const quantityButtons = modalOverlay && modalOverlay.querySelectorAll('.afinity-meals-sidebar-list .afinity-meals-sidebar-qty-btn:not([disabled])');
    
    if (quantityButtons) {
      quantityButtons.forEach(btn => {
        btn.onclick = (e) => {
          const action = btn.getAttribute('data-action');
          const mealId = btn.getAttribute('data-meal-id'); // Don't parse as integer, keep as string
          const currentMeals = getCurrentMealsArray();
          const idx = currentMeals.findIndex(m => String(m.id) === String(mealId));
          
          if (idx !== -1) {
            // Preserve existing meal data and only update quantity
            let updatedMeal = { ...currentMeals[idx] };
            if (action === 'increment') {
              updatedMeal.qty++;
            } else if (action === 'decrement') {
              updatedMeal.qty--;
              if (updatedMeal.qty < 0) updatedMeal.qty = 0;
            }
            currentMeals[idx] = updatedMeal;
            updateCurrentMealsArray(currentMeals);
            updateModalChanges(mealsPageMode === 'update' ? 'updateModeMeals' : 'selectedMeals', JSON.parse(JSON.stringify(currentMeals)));
            rerenderSidebarMeals();
          } else {
            console.log('Meal not found in current meals array');
            console.log('Available meal IDs:', currentMeals.map(m => m.id));
          }
        };
      });
    }
  }

  function renderFrequencyDropdown() {
    const frequencySelect = modalOverlay && modalOverlay.querySelector('#afinity-frequency');
    
    if (frequencySelect && availableFrequencies.length > 0 && selectedFrequency) {
      const optionsHtml = availableFrequencies.map(freq => 
        freq.options.map(option => {
          const optionValue = `${freq.unit}-${option}`;
          const isSelected = selectedFrequency === optionValue;
          return `<option value="${optionValue}" ${isSelected ? 'selected' : ''}>
            ${option} ${freq.unit}${option > 1 ? 's' : ''} subscription
          </option>`;
        }).join('')
      ).join('');
      
      frequencySelect.innerHTML = optionsHtml;
      
      // Also set the value programmatically to ensure it's selected
      if (selectedFrequency) {
        frequencySelect.value = selectedFrequency;
      }
    } 
  }

  // Helper to convert 24-hour time to 12-hour format for utility functions
  function toAmPm(timeStr) {
    if (!timeStr) return '3:30 PM'; // Default fallback
    // timeStr is in 24-hour format (HH:MM), convert to 12-hour format
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
  
  // Helper to parse frequency string and return interval unit and frequency
  function parseFrequency(frequencyStr) {
    if (!frequencyStr) return null;
    const parts = frequencyStr.split('-');
    if (parts.length === 2) {
      return {
        order_interval_unit: parts[0],
        order_interval_frequency: parseInt(parts[1])
      };
    }
    return null;
  }
  
  // Helper to convert date and 12-hour time to ISO string with timezone
  function getLocalISOFromDateAndTime(dateStr, timeStr, timeZone) {
    // dateStr: "2025-07-03", timeStr: "4:30 PM", timeZone: "America/Los_Angeles"
    const [yyyy, mm, dd] = dateStr.split("-");
    
    // Handle "4:30 PM" → { hour: "4", min: "30", period: "PM" }
    const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!timeMatch) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }
    
    let [, hourStr, minStr, period] = timeMatch;
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);
    const isPM = period.toUpperCase() === "PM";
    
    // Convert to 24-hour time
    if (isPM && hour < 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    
    const jsDate = new Date(
      `${yyyy}-${mm}-${dd}T${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`
    );
    
    // Get offset for zone
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    });
    
    const parts = dtf.formatToParts(jsDate);
    const filled = {};
    for (const { type, value } of parts) filled[type] = value;
    
    const asUTC = Date.UTC(
      parseInt(filled.year), 
      parseInt(filled.month) - 1, 
      parseInt(filled.day),
      parseInt(filled.hour), 
      parseInt(filled.minute), 
      parseInt(filled.second)
    );
    
    const offsetMinutes = (asUTC - jsDate.getTime()) / 60000;
    const sign = offsetMinutes <= 0 ? "+" : "-";
    const abs = Math.abs(offsetMinutes);
    const hh = String(Math.floor(abs / 60)).padStart(2, "0");
    const mmOff = String(abs % 60).padStart(2, "0");
    const offset = `${sign}${hh}:${mmOff}`;
    
    return `${yyyy}-${mm}-${dd}T${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00${offset}`;
  }
  
  // Helper to parse time string (e.g., "9:00 AM" -> [9, 0])
  function parseTimeString(timeStr) {
    if (!timeStr) return [9, 0]; // Default fallback
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return [9, 0];
    
    let [, hourStr, minStr, period] = match;
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);
    const isPM = period.toUpperCase() === "PM";
    
    // Convert to 24-hour
    if (isPM && hour < 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    
    return [hour, minute];
  }
  
  // Helper to generate time options based on open/close times
  function generateTimeOptions(selectedDate) {
    
    if (!selectedDate) {
      return [];
    }
    
    // Check if the selected date is in frequency-based restricted dates
    const restrictedDates = getRestrictedDates();
    if (restrictedDates.includes(selectedDate)) {
      return [];
    }
    
    const fulfillmentMethod = modalChanges.fulfillmentMethod || fulfillmentMethod;
    
    // Find the delivery day data for the selected date
    let dayData = null;
    if (fulfillmentMethod === 'Delivery') {
      dayData = (window.deliveryDaysData || []).find(day => day.date === selectedDate);
    } else {
      // For pickup, find the selected location's pickup dates
      const selectedLocationId = modalChanges.selectedPickupLocationId || selectedPickupLocationId;
      
      const selectedLocation = (window.pickupLocationsData || []).find(
        loc => String(loc.location_id) === String(selectedLocationId)
      );
      
      if (selectedLocation && selectedLocation.pickupDates) {
        dayData = selectedLocation.pickupDates.find(day => day.date === selectedDate);
      } 
    }
    
    if (!dayData) {
      return [];
    }
    
    if (dayData.isClosed || dayData.isclosed) {
      return [];
    }
    
    if (!dayData.open || !dayData.close) {
      return [];
    }
    
    
    const [startHour, startMin] = parseTimeString(dayData.open);
    const [endHour, endMin] = parseTimeString(dayData.close);
    
    const slots = [];
    let currentHour = startHour;
    let currentMin = startMin;
    
    // Check if it's today and adjust for past times
    // Use local timezone instead of UTC to avoid date offset issues
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0');
    const isToday = selectedDate === todayStr;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMin < endMin)
    ) {
      const slotTime = currentHour * 60 + currentMin;
      
      // Skip past times for today
      if (!isToday || slotTime > currentTime + 30) {
        const timeStr = `${currentHour % 12 || 12}:${currentMin.toString().padStart(2, '0')} ${currentHour >= 12 ? 'PM' : 'AM'}`;
        slots.push(timeStr);
      }
      
      currentMin += 15;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour += 1;
      }
    }
    
    return slots;
  }

  // Add this new function near other helpers
  async function clearAndResetDateTimeForPickupLocation(locationId, fulfillmentType = 'Pickup') {
    showModalLoading();
    // 1. Clear date and time in state
    updateModalChanges('deliveryDate', '');
    updateModalChanges('fulfillmentTime', '');
    deliveryDate = '';
    fulfillmentTime = '';

    // 2. Clear the input fields in the UI
    const dateInput = document.getElementById('afinity-date');
    if (dateInput) dateInput.value = '';
    
    const timeInput = document.getElementById('timepicker');
    if (timeInput) timeInput.value = '';
    // 3. Fetch new available dates and reset pickers
    await fetchAvailableDates(zip, locationId);
    setupDatePicker(fulfillmentType);
    // Always re-initialize the time picker after everything else
    reinitializeTimePicker();
  }

  // Add this new function to initialize date and time pickers with current values
  async function initializeDateAndTimePickers() {
    
    // Get current values from subscription data - ALWAYS prioritize order_attributes
    const currentDate = modalChanges.deliveryDate || deliveryDate;
    const currentTime = modalChanges.fulfillmentTime || fulfillmentTime;
    const currentMethod = modalChanges.fulfillmentMethod || fulfillmentMethod;
    
    // Ensure we're using the values from order_attributes as the primary source
    const orderAttributesDate = getDeliveryDateFromSubscription();
    const orderAttributesTime = getFulfillmentTimeFromSubscription();
    
    // Use order_attributes values if available, otherwise fall back to modalChanges/global variables
    const finalDate = orderAttributesDate || currentDate;
    const finalTime = orderAttributesTime || currentTime;
    
    // Set up date picker with allowed dates
    setupDatePicker(currentMethod);
    
    // Set the date input value if we have a valid date and it's not restricted
    const dateInput = document.getElementById('afinity-date');
    if (dateInput && finalDate) {
      // Check if the final date is in restricted dates (3 days out)
      const restrictedDates = getRestrictedDates();
      if (restrictedDates.includes(finalDate)) {
        dateInput.value = '';
        updateModalChanges('deliveryDate', '');
        deliveryDate = '';
        updateModalChanges('fulfillmentTime', '');
        fulfillmentTime = '';
      } else {
        // Set display value as MM-DD-YYYY but keep actual value as YYYY-MM-DD for backend
        const displayValue = formatDeliveryDate(finalDate);
        dateInput.value = displayValue;
        
        // Also update the flatpickr instance if it exists to ensure consistency
        if (dateInput._flatpickr) {
          dateInput._flatpickr.setDate(finalDate, false, 'Y-m-d');
          // Force the display value
          dateInput._flatpickr.input.value = displayValue;
        }
        
        // Add this:
        reinitializeTimePicker();
      }
    }
    
    // Initialize time picker with current time
    const timeInput = document.getElementById('timepicker');
    
    if (timeInput && typeof jQuery !== 'undefined' && jQuery.fn.timepicker) {
      // Remove existing timepicker if it exists
      if ($(timeInput).data('timepicker')) {
        $(timeInput).timepicker('remove');
      }
      
      // Check if the final date is in frequency-based restricted dates
      const restrictedDates = getRestrictedDates();
      if (finalDate && restrictedDates.includes(finalDate)) {
        timeInput.value = '';
        updateModalChanges('fulfillmentTime', '');
        fulfillmentTime = '';
        return; // Don't initialize time picker for restricted dates
      }
      
      // Generate time options based on the current date
      let timeOptions = [];
      if (finalDate) {
        timeOptions = generateTimeOptions(finalDate);
      }
      
      // Fallback to default if empty
      if (timeOptions.length === 0) {
        timeOptions = [
          '9:00 AM', '9:15 AM', '9:30 AM', '9:45 AM',
          '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
          '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
          '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
          '1:00 PM', '1:15 PM', '1:30 PM', '1:45 PM',
          '2:00 PM', '2:15 PM', '2:30 PM', '2:45 PM',
          '3:00 PM', '3:15 PM', '3:30 PM', '3:45 PM',
          '4:00 PM', '4:15 PM', '4:30 PM', '4:45 PM',
          '5:00 PM'
        ];
      }
      
      // Set min/max from the generated options
      const minTime = timeOptions[0];
      const maxTime = timeOptions[timeOptions.length - 1];
      
      // Convert current time to 12-hour format for display and find the best match
      let defaultTime12 = minTime; // fallback
      let selectedTime24 = finalTime; // store the 24-hour time for later use
      
      if (finalTime) {
        const [h, m] = finalTime.split(':');
        let hour = parseInt(h, 10);
        const minute = m;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        let displayHour = hour % 12;
        if (displayHour === 0) displayHour = 12;
        const currentTime12 = `${displayHour}:${minute} ${ampm}`;
        
        // Try to find an exact match first
        if (timeOptions.includes(currentTime12)) {
          defaultTime12 = currentTime12;
        } else {
          // Find the closest available time
          const currentTimeMinutes = hour * 60 + parseInt(minute);
          let closestTime = minTime;
          let minDifference = Infinity;
          
          for (const option of timeOptions) {
            const [optHour, optMin] = parseTimeString(option);
            const optionMinutes = optHour * 60 + optMin;
            const difference = Math.abs(optionMinutes - currentTimeMinutes);
            
            if (difference < minDifference) {
              minDifference = difference;
              closestTime = option;
            }
          }
          
          defaultTime12 = closestTime;
          console.log('Using closest available time:', defaultTime12, '(difference:', minDifference, 'minutes)');
        }
      }
      
      // Set the time input value BEFORE initializing timepicker
      timeInput.value = defaultTime12;
      // Update the modalChanges with the selected time (convert back to 24-hour format)
      if (defaultTime12 !== minTime || currentTime) {
        const [h, m] = parseTimeString(defaultTime12);
        const selectedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        updateModalChanges('fulfillmentTime', selectedTime);
        fulfillmentTime = selectedTime;
      }
      
      // Initialize timepicker
      $(timeInput).timepicker({
        interval: 15,
        minTime,
        maxTime,
        defaultTime: defaultTime12,
        startTime: minTime,
        dynamic: false,
        dropdown: true,
        scrollbar: true,
        change: function(time) {
          if (time) {
            // Convert 12-hour format to 24-hour format for storage
            const [timeStr, period] = time.split(' ');
            const [hour, minute] = timeStr.split(':');
            let hour24 = parseInt(hour);
            if (period === 'PM' && hour24 < 12) hour24 += 12;
            if (period === 'AM' && hour24 === 12) hour24 = 0;
            const time24Format = `${hour24.toString().padStart(2, '0')}:${minute}`;
            
            // Check if this is a different time from the original
            const originalTime = getFulfillmentTimeFromSubscription();
            if (time24Format && time24Format !== originalTime) {
              // Show a warning toast about the consequences
              showToast('Note: Moving the fulfillment time will affect the charge date on all upcoming orders.', 'info');
            }
            
            updateModalChanges('fulfillmentTime', time24Format);
            fulfillmentTime = time24Format;
            console.log('Time picker changed to:', time24Format);
          }
        }
      });
      
      // Force the timepicker to show the selected time
      try {
        $(timeInput).timepicker('setTime', defaultTime12);
        $(timeInput).trigger('change');
      try {
        $(timeInput).timepicker('show');
      } catch (error) {
        console.log('Could not trigger timepicker show method:', error);
      }
      
      // Also try to trigger the timepicker's hide method to force it to update
      try {
        $(timeInput).timepicker('hide');
      } catch (error) {
        console.log('Could not trigger timepicker hide method:', error);
      }
        
        // Also try to update the timepicker's internal state
        const timepickerInstance = $(timeInput).data('timepicker');
        if (timepickerInstance && timepickerInstance.setTime) {
          timepickerInstance.setTime(defaultTime12);
        }
        
      } catch (error) {
        console.error('Error setting timepicker time:', error);
        // Fallback: just set the input value directly
        timeInput.value = defaultTime12;
        console.log('Fallback: Set input value directly to:', defaultTime12);
      }
      
      // Ensure the time value is set after timepicker initialization
      setTimeout(() => {
        if (timeInput.value !== defaultTime12) {
          timeInput.value = defaultTime12;
        }
        // Also try to trigger the timepicker to update its display
        try {
          $(timeInput).timepicker('setTime', defaultTime12);
        } catch (error) {
          console.error('Error in 100ms timeout setTime:', error);
        }
      }, 100);
      
      // Additional timeout to ensure the timepicker is fully initialized
      setTimeout(() => {
        if (timeInput.value !== defaultTime12) {
          timeInput.value = defaultTime12;
          $(timeInput).timepicker('setTime', defaultTime12);
        }
        
        // Try to force the timepicker to update its display
        const timepickerInstance = $(timeInput).data('timepicker');
        if (timepickerInstance) {
          
          // Try to manually update the timepicker's display
          if (timepickerInstance.time !== defaultTime12) {
            timepickerInstance.time = defaultTime12;
          }
        }
      }, 300);
    } else {
      // Retry after a short delay in case the plugin is still loading
      setTimeout(() => {
        if (timeInput && typeof jQuery !== 'undefined' && jQuery.fn.timepicker) {
          initializeDateAndTimePickers();
                 } else {
           // Set the time value directly in the input as fallback
           if (timeInput && finalTime) {
                        // Generate time options for the current date
           let timeOptions = [];
           if (finalDate) {
             timeOptions = generateTimeOptions(finalDate);
           }
             
             // Fallback to default if empty
             if (timeOptions.length === 0) {
               timeOptions = [
                 '9:00 AM', '9:15 AM', '9:30 AM', '9:45 AM',
                 '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
                 '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
                 '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
                 '1:00 PM', '1:15 PM', '1:30 PM', '1:45 PM',
                 '2:00 PM', '2:15 PM', '2:30 PM', '2:45 PM',
                 '3:00 PM', '3:15 PM', '3:30 PM', '3:45 PM',
                 '4:00 PM', '4:15 PM', '4:30 PM', '4:45 PM',
                 '5:00 PM'
               ];
             }
             
             const minTime = timeOptions[0];
             
             // Convert current time to 12-hour format and find best match
             const [h, m] = finalTime.split(':');
             let hour = parseInt(h, 10);
             const minute = m;
             const ampm = hour >= 12 ? 'PM' : 'AM';
             let displayHour = hour % 12;
             if (displayHour === 0) displayHour = 12;
             const currentTime12 = `${displayHour}:${minute} ${ampm}`;
             
             let selectedTime12 = minTime; // fallback
             
             // Try to find an exact match first
             if (timeOptions.includes(currentTime12)) {
               selectedTime12 = currentTime12;
             } else {
               // Find the closest available time
               const currentTimeMinutes = hour * 60 + parseInt(minute);
               let closestTime = minTime;
               let minDifference = Infinity;
               
               for (const option of timeOptions) {
                 const [optHour, optMin] = parseTimeString(option);
                 const optionMinutes = optHour * 60 + optMin;
                 const difference = Math.abs(optionMinutes - currentTimeMinutes);
                 
                 if (difference < minDifference) {
                   minDifference = difference;
                   closestTime = option;
                 }
               }
               
               selectedTime12 = closestTime;
             }
             
             timeInput.value = selectedTime12;
             
             // Update the modalChanges with the selected time
             const [selHour, selMin] = parseTimeString(selectedTime12);
             const selectedTime24 = `${selHour.toString().padStart(2, '0')}:${selMin.toString().padStart(2, '0')}`;
             updateModalChanges('fulfillmentTime', selectedTime24);
             fulfillmentTime = selectedTime24;
           }
         }
      }, 500);
    }
    
    // Also ensure the frequency dropdown is properly set
    await loadInitialFrequency();
  }

  // New function to load initial frequency from currentSubscription
  async function loadInitialFrequency() {
    
    if (!currentSubscription) {
      return;
    }
    
    // Extract frequency from currentSubscription (on root level)
    let frequencyFromSubscription = null;
    const intervalUnit = currentSubscription.order_interval_unit;
    const orderIntervalFrequency = currentSubscription.order_interval_frequency;
    
    if (intervalUnit && orderIntervalFrequency) {
      frequencyFromSubscription = `${intervalUnit}-${orderIntervalFrequency}`;
    } 
    // Set the global selectedFrequency
    if (frequencyFromSubscription) {
      selectedFrequency = frequencyFromSubscription;
      updateModalChanges('selectedFrequency', frequencyFromSubscription);
    }
    
    // Ensure frequencies are loaded
    if (availableFrequencies.length === 0) {
      await fetchFrequencies();
    }
    
    // Render the frequency dropdown
    renderFrequencyDropdown();
  }

  // Add this new function near other helpers
  function reinitializeTimePicker() {
    const timeInput = document.getElementById('timepicker');
    if (timeInput && typeof jQuery !== 'undefined' && jQuery.fn.timepicker) {
      if ($(timeInput).data('timepicker')) {
        $(timeInput).timepicker('remove');
      }

      // Generate time options based on the selected date
      const selectedDate = modalChanges.deliveryDate || deliveryDate;
      let timeOptions = [];
      if (selectedDate) {
        timeOptions = generateTimeOptions(selectedDate);
      }

      // Check if the selected date is in frequency-based restricted dates
      const restrictedDates = getRestrictedDates();
      if (selectedDate && restrictedDates.includes(selectedDate)) {
        timeInput.value = '';
        updateModalChanges('fulfillmentTime', '');
        fulfillmentTime = '';
        return; // Don't initialize time picker for restricted dates
      }

      // Fallback to default if empty
      if (timeOptions.length === 0) {
        timeOptions = [
          '9:00 AM', '9:15 AM', '9:30 AM', '9:45 AM',
          '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
          '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
          '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
          '1:00 PM', '1:15 PM', '1:30 PM', '1:45 PM',
          '2:00 PM', '2:15 PM', '2:30 PM', '2:45 PM',
          '3:00 PM', '3:15 PM', '3:30 PM', '3:45 PM',
          '4:00 PM', '4:15 PM', '4:30 PM', '4:45 PM',
          '5:00 PM'
        ];
      }

      // Set min/max from the generated options
      const minTime = timeOptions[0];
      const maxTime = timeOptions[timeOptions.length - 1];

      // Determine the correct default time (from modalChanges, fallback to fulfillmentTime, fallback to minTime)
      let defaultTime24 = modalChanges.fulfillmentTime || fulfillmentTime;
      let defaultTime12 = minTime; // fallback
      if (defaultTime24) {
        // Convert 24-hour format (e.g., '15:30') to 12-hour format (e.g., '3:30 PM')
        const [h, m] = defaultTime24.split(':');
        let hour = parseInt(h, 10);
        const minute = m;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        let displayHour = hour % 12;
        if (displayHour === 0) displayHour = 12;
        defaultTime12 = `${displayHour}:${minute} ${ampm}`;
      }

      // If the default time is not in the available options, fallback to minTime
      if (!timeOptions.includes(defaultTime12)) {
        defaultTime12 = minTime;
      }


      $(timeInput).timepicker({
        interval: 15,
        minTime,
        maxTime,
        defaultTime: defaultTime12,
        startTime: minTime,
        dynamic: false,
        dropdown: true,
        scrollbar: true,
        change: function(time) {
          if (time) {
            // Convert 12-hour format to 24-hour format for storage
            const [timeStr, period] = time.split(' ');
            const [hour, minute] = timeStr.split(':');
            let hour24 = parseInt(hour);
            if (period === 'PM' && hour24 < 12) hour24 += 12;
            if (period === 'AM' && hour24 === 12) hour24 = 0;
            const time24Format = `${hour24.toString().padStart(2, '0')}:${minute}`;
            
            // Check if this is a different time from the original
            const originalTime = getFulfillmentTimeFromSubscription();
            if (time24Format && time24Format !== originalTime) {
              // Show a warning toast about the consequences
              showToast('Note: Moving the fulfillment time will affect the charge date on all upcoming orders.', 'info');
            }
            
            updateModalChanges('fulfillmentTime', time24Format);
            fulfillmentTime = time24Format;
          }
        }
      });
    }
  }
})();