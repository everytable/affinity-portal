// affinity.js - Standalone modal widget
(function() {

  const originalDispatchEvent = EventTarget.prototype.dispatchEvent;

  EventTarget.prototype.dispatchEvent = function(event) {
    if (event.type.includes("Recharge")) {
      console.log("Custom Event Fired:", event.type, event);
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
  
  // Helper function to update modalChanges with logging
  function updateModalChanges(key, value) {
    modalChanges[key] = value;
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

  // Add global variable for current time zone
  let currentTimeZone = 'America/Los_Angeles'; // default fallback

  // Update fetchAvailableDates to store the time zone from the payload
  async function fetchAvailableDates(zip, selectedPickupLocationId) {
    console.log('=== FETCH AVAILABLE DATES START ===');
    console.log('Fetching availability for zip:', zip);
    console.log('Selected pickup location ID:', selectedPickupLocationId);
    
    try {
      const url = `${API_URL}/search/availability/${encodeURIComponent(zip)}`;
      console.log('Fetching from URL:', url);
      
      const resp = await fetch(url);
      const data = await resp.json();
      console.log('Raw availability data:', data);
      
      // Store delivery days data globally for time options
      window.deliveryDaysData = data.deliveryDays || [];
      window.pickupLocationsData = data.pickupLocations || [];
      console.log('Stored deliveryDaysData:', window.deliveryDaysData);
      console.log('Stored pickupLocationsData:', window.pickupLocationsData);
      
      // Delivery dates
      allowedDeliveryDates = (data.deliveryDays || [])
        .filter(day => !day.isclosed)
        .map(day => day.date);
      console.log('Filtered delivery dates:', allowedDeliveryDates);
      
      // Pickup dates for the selected location
      if (selectedPickupLocationId) {
        console.log('Looking for pickup location with ID:', selectedPickupLocationId);
        const pickupLocation = (data.pickupLocations || []).find(
          loc => String(loc.location_id) === String(selectedPickupLocationId)
        );
        console.log('Found pickup location:', pickupLocation);
        
        if (pickupLocation && pickupLocation.pickupDates) {
          console.log('Pickup location has pickupDates:', pickupLocation.pickupDates);
          allowedPickupDates = pickupLocation.pickupDates
            .filter(day => !day.isclosed)
            .map(day => day.date);
          console.log('Filtered pickup dates:', allowedPickupDates);
        } else {
          console.log('No pickup dates found for location');
          allowedPickupDates = [];
        }
      } else {
        console.log('No selectedPickupLocationId provided');
        allowedPickupDates = [];
      }
      
      // Store the time zone from the payload
      if (data.locationTimeZone) {
        currentTimeZone = data.locationTimeZone;
        console.log('Set timezone from locationTimeZone:', currentTimeZone);
      } else if (data.time_zone) {
        currentTimeZone = data.time_zone;
        console.log('Set timezone from time_zone:', currentTimeZone);
      } else {
        console.log('No timezone found in data, keeping current:', currentTimeZone);
      }
      
      console.log('Final allowedDeliveryDates:', allowedDeliveryDates);
      console.log('Final allowedPickupDates:', allowedPickupDates);
      console.log('Final currentTimeZone:', currentTimeZone);
      console.log('=== FETCH AVAILABLE DATES COMPLETE ===');
    } catch (e) {
      console.error('Error in fetchAvailableDates:', e);
      allowedDeliveryDates = [];
      allowedPickupDates = [];
      window.deliveryDaysData = [];
      window.pickupLocationsData = [];
      console.log('Reset all dates to empty arrays due to error');
    }
  }

  // Helper to (re)initialize the date picker with allowed dates
  function setupDatePicker(fulfillmentType) {
    console.log('=== SETUP DATE PICKER START ===');
    console.log('Setting up date picker for fulfillment type:', fulfillmentType);
    
    const input = document.getElementById('afinity-date');
    if (!input) {
      console.log('Date input element not found');
      return;
    }
    if (typeof flatpickr === 'undefined') {
      console.log('Flatpickr not loaded yet');
      return;
    }
    
    // Destroy any previous instance
    if (input._flatpickr) {
      console.log('Destroying previous flatpickr instance');
      input._flatpickr.destroy();
    }
    
    let allowedDates = [];
    if (fulfillmentType === 'Delivery') {
      allowedDates = allowedDeliveryDates;
      console.log('Using delivery dates:', allowedDates);
    } else if (fulfillmentType === 'Pickup') {
      allowedDates = allowedPickupDates;
      console.log('Using pickup dates:', allowedDates);
    } else {
      console.log('Unknown fulfillment type:', fulfillmentType);
    }
    
    console.log('Configuring flatpickr with allowed dates:', allowedDates);
    
    // Get current date from subscription data
    const currentDate = modalChanges.deliveryDate || deliveryDate;
    console.log('Current date to set in picker:', currentDate);
    
    flatpickr(input, {
      dateFormat: "Y-m-d", // Keep ISO format for storage
      enable: allowedDates,
      defaultDate: currentDate || undefined, // Set default date if available
      onChange: function(selectedDates, dateStr) {
        console.log('Date picker onChange triggered');
        console.log('Selected date:', dateStr);
        updateModalChanges('deliveryDate', dateStr);
        deliveryDate = dateStr;
        
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
      console.log('Fetching available dates with pickup location ID:', pickupLocationId);
      await fetchAvailableDates(zip, pickupLocationId);
      setupDatePicker(modalChanges.fulfillmentMethod || fulfillmentMethod || 'Delivery');
    }catch(error){
      console.error('Error fetching subscription and pickup:', error);
    }
  }

  async function fetchFrequencies() {
    try {
      console.log('Fetching frequencies from:', `${API_URL}/subscription/frequencies`);
      const response = await fetch(`${API_URL}/subscription/frequencies`);
      const data = await response.json();
      availableFrequencies = data.frequencies || [];
      console.log('Fetched frequencies:', availableFrequencies);
    } catch (error) {
      console.error('Error fetching frequencies:', error);
      availableFrequencies = [];
    }
  }

  async function refreshSubscriptionData(subscriptionId) {
    try {
      // Fetch updated subscription data
      const response = await fetch(`${API_URL}/subscription/${subscriptionId}`);
      const data = await response.json();
      
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
          console.log('Set selectedFrequency from subscription data:', selectedFrequency);
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
    console.log('Rendering pickup locations section');
    const section = modalOverlay && modalOverlay.querySelector('#afinity-method-section');
    if (section) {
      section.innerHTML = renderMethodSection();
      // Always set the select value to the current fulfillmentMethod
      const methodSelect = section.querySelector('#afinity-method');
      if (methodSelect) {
        methodSelect.value = modalChanges.fulfillmentMethod || fulfillmentMethod || 'Delivery';
        methodSelect.addEventListener('change', async (e) => {
          console.log('Fulfillment method changed to:', e.target.value);
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
    if (!dateStr) return '';
    // dateStr is in ISO format (YYYY-MM-DD), convert to MM-DD-YYYY for display
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
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
        return fulfillmentDateTime.split('T')[0]; 
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
      renderFrequencyDropdown();
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

  // Helper to calculate the total price for the subscription
  function calculateSubscriptionTotal() {
    if (!currentSubscription || !currentSubscription.include || !currentSubscription.include.bundle_selections || !Array.isArray(currentSubscription.include.bundle_selections.items)) {
      return '0.00';
    }
    let totalCents = 0;
    currentSubscription.include.bundle_selections.items.forEach(item => {
      // Convert price to cents, multiply, then add
      const priceCents = Math.round(Number(item.price) * 100) || 0;
      const qty = parseInt(item.quantity) || 1;
      totalCents += priceCents * qty;
    });
    // Convert back to dollars
    return (totalCents / 100).toFixed(2);
  }

  function renderMainPage() {
    const currentDeliveryDate = getDeliveryDateFromSubscription();
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
            <input id="afinity-date" type="text" placeholder="Select delivery date" value="${currentDeliveryDate}" readonly />
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
              <input id="afinity-meals-date" type="text" placeholder="Select delivery date" value="${currentDeliveryDate}" style="font-size:16px;padding:6px 10px;border-radius:4px;border:1px solid #ccc;min-width:160px;" readonly />
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

  // Dedicated function to save date
  async function saveDate() {
    showModalLoading();
    try {
      const subscriptionId = currentSubscription?.id;
      if (!subscriptionId) {
        showToast('No subscription ID found', 'error');
        hideModalLoading();
        return;
      }
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
          hideModalLoading();
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
      
      if (modalChanges.deliveryDate) {
        // Update existing Fulfillment Date or add new one
        const existingIndex = orderAttributesArr.findIndex(attr => 
          Object.keys(attr)[0] === 'Fulfillment Date'
        );
        if (existingIndex !== -1) {
          orderAttributesArr[existingIndex] = { "Fulfillment Date": modalChanges.deliveryDate };
        } else {
          orderAttributesArr.push({ "Fulfillment Date": modalChanges.deliveryDate });
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
        hideModalLoading();
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
      const subscriptionResp = await fetch(`${API_URL}/subscription/${subscriptionId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });
      const subscriptionData = await subscriptionResp.json();
      if (!subscriptionData.success) {
        showToast(subscriptionData.error || 'Failed to update subscription', 'error');
        hideModalLoading();
        return;
      }
      showToast('All changes saved successfully!', 'success');
      await refreshSubscriptionData(subscriptionId);
      // modalOverlay.style.display = 'none';
    } catch (error) {
      showToast('Error saving changes', 'error');
    } finally {
      hideModalLoading();
    }
  }

  function attachModalEvents() {
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
   
    const saveBtn = modalOverlay.querySelector('.afinity-modal-save-btn');
    if (saveBtn) saveBtn.onclick = async () => {
      
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
            hideModalLoading();
            return;
          }
        }

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
        
        if (modalChanges.deliveryDate) {
          // Update existing Fulfillment Date or add new one
          const existingIndex = orderAttributesArr.findIndex(attr => 
            Object.keys(attr)[0] === 'Fulfillment Date'
          );
          if (existingIndex !== -1) {
            orderAttributesArr[existingIndex] = { "Fulfillment Date": modalChanges.deliveryDate };
          } else {
            orderAttributesArr.push({ "Fulfillment Date": modalChanges.deliveryDate });
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
          hideModalLoading();
          return;
        }
        if (isoString) {
          orderAttributesArr.push({ "Fulfillment Date": isoString });
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

        const subscriptionResponse = await fetch(`${API_URL}/subscription/${subscriptionId}/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload)
        });

        const subscriptionResult = await subscriptionResponse.json();
        if (subscriptionResult.success) {
          showToast('All changes saved successfully!', 'success');
          // Refresh subscription data to show updated information
          await refreshSubscriptionData(subscriptionId);
          modalOverlay.style.display = 'none';
        } else {
          console.error('Failed to save subscription changes:', subscriptionResult);
          showToast('Failed to save changes', 'error');
        }
      } catch (error) {
        console.error('Error saving changes:', error);
        showToast('Error saving changes', 'error');
      } finally {
        // Hide loading state
        hideModalLoading();
      }
    };
    const cancelSubBtn = modalOverlay.querySelector('.afinity-cancel-subscription');
    if (cancelSubBtn) cancelSubBtn.onclick = (e) => {
      e.preventDefault();
      const cancelBtn = modalOverlay.querySelector('.afinity-modal-cancel-btn');
      if (cancelBtn) cancelBtn.onclick = () => {
        // Dispatch custom event for cancel
        const cancelEvent = new CustomEvent('Recharge::click::cancellation_flow');
        document.dispatchEvent(cancelEvent);
        console.log('Dispatched Recharge::click::cancel event');
        
        // Hide the modal
        modalOverlay.style.display = 'none';
      };
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
          } else if (action === 'decrement') {
            selectedMeals[idx].qty--;
            if (selectedMeals[idx].qty <= 0) {
              selectedMeals[idx].qty = 0;
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
    // Initialize Flatpickr for date inputs
    const mainDateInput = modalOverlay.querySelector('#afinity-date');
    if (mainDateInput && typeof flatpickr !== 'undefined') {
      flatpickr(mainDateInput, {
        dateFormat: "Y-m-d",
        minDate: "today",
        disable: [
          function(date) {
            // Disable weekends (0 = Sunday, 6 = Saturday)
            return (date.getDay() === 0 || date.getDay() === 6);
          }
        ],
        onChange: function(selectedDates, dateStr) {
          updateModalChanges('deliveryDate', dateStr);
          deliveryDate = dateStr;
        }
      });
    }
    
    // Initialize Flatpickr for meals page date input
    const mealsDateInput = modalOverlay.querySelector('#afinity-meals-date');
    if (mealsDateInput && typeof flatpickr !== 'undefined') {
      flatpickr(mealsDateInput, {
        dateFormat: "Y-m-d",
        minDate: "today",
        disable: [
          function(date) {
            // Disable weekends (0 = Sunday, 6 = Saturday)
            return (date.getDay() === 0 || date.getDay() === 6);
          }
        ],
        onChange: function(selectedDates, dateStr) {
          updateModalChanges('deliveryDate', dateStr);
          deliveryDate = dateStr;
        }
      });
    }
    
    // Frequency input
    const frequencyInput = modalOverlay.querySelector('#afinity-frequency');
    if (frequencyInput) frequencyInput.onchange = (e) => {
      updateModalChanges('selectedFrequency', e.target.value);
      selectedFrequency = e.target.value;
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
    // Listen for fulfillment method change
    const methodSelect = modalOverlay.querySelector('#afinity-method');
    if (methodSelect) {
      methodSelect.onchange = async (e) => {
        const newMethod = e.target.value;
        console.log('=== FULFILLMENT METHOD CHANGE START ===');
        console.log('Changing fulfillment method to:', newMethod);
        console.log('Previous fulfillment method:', fulfillmentMethod);
        
        updateModalChanges('fulfillmentMethod', newMethod);
        fulfillmentMethod = newMethod;
        
        // Clear delivery date and time when switching methods to force new selection
        console.log('Clearing delivery date and time fields...');
        updateModalChanges('deliveryDate', '');
        updateModalChanges('fulfillmentTime', '');
        deliveryDate = '';
        fulfillmentTime = '';
        
        // Clear the input field values
        const dateInput = document.getElementById('afinity-date');
        if (dateInput) {
          dateInput.value = '';
          console.log('Cleared date input field');
        }
        
        if (fulfillmentMethod === 'Pickup') {
          console.log('Switching to Pickup method');
          // Use the selected pickup location, or default to the first one
          let pickupId = modalChanges.selectedPickupLocationId || selectedPickupLocationId;
          if (!pickupId && pickupLocations && pickupLocations.length > 0) {
            pickupId = pickupLocations[0].id;
            updateModalChanges('selectedPickupLocationId', pickupId);
            selectedPickupLocationId = pickupId;
            console.log('Defaulted to first pickup location ID:', pickupId);
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
          console.log('Re-initializing time picker for delivery...');
          if (timeInput && typeof jQuery !== 'undefined' && jQuery.fn.timepicker) {
            // Destroy existing timepicker instance
            if ($(timeInput).data('timepicker')) {
              $(timeInput).timepicker('remove');
              console.log('Destroyed existing timepicker instance');
            }
            
            // Re-initialize timepicker with default options
            // $(timeInput).timepicker({
            //   interval: 15,
            //   minTime: '9:00 AM',
            //   maxTime: '5:00 PM',
            //   defaultTime: '3:30 PM',
            //   startTime: '9:00 AM',
            //   dynamic: false,
            //   dropdown: true,
            //   scrollbar: true,
            //   change: function(time) {
            //     if (time) {
            //       // Convert 12-hour format to 24-hour format for storage
            //       const [timeStr, period] = time.split(' ');
            //       const [hour, minute] = timeStr.split(':');
            //       let hour24 = parseInt(hour);
            //       if (period === 'PM' && hour24 < 12) hour24 += 12;
            //       if (period === 'AM' && hour24 === 12) hour24 = 0;
            //       const time24Format = `${hour24.toString().padStart(2, '0')}:${minute}`;
            //       updateModalChanges('fulfillmentTime', time24Format);
            //       fulfillmentTime = time24Format;
            //       console.log('Time picker changed to:', time24Format);
            //     }
            //   }
            // });
            // console.log('Re-initialized time picker for delivery');
          }
        }
        
        // Re-render the modal to show cleared date/time fields
        console.log('Re-rendering modal...');
        renderModal();
        console.log('=== FULFILLMENT METHOD CHANGE COMPLETE ===');
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
    showModalLoading();
    // When modal is closed, the style is set to none, so we need to set it to block
    if(modalOverlay) {
      modalOverlay.style.display = 'block';
    }
    
    // Get subscription ID from the event
    const subscriptionId = event.detail?.payload?.subscriptionId || event.detail?.subscription_id || event.target?.getAttribute('data-subscription-id');
    
    if (subscriptionId) {
      // Fetch subscription data from API
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
          console.log('Raw subscription frequency data:', { intervalUnit, orderIntervalFrequency });
          if (intervalUnit && orderIntervalFrequency) {
            selectedFrequency = `${intervalUnit}-${orderIntervalFrequency}`;
            console.log('Set selectedFrequency from subscription data (initial load):', selectedFrequency);
          } else {
            console.log('Missing order_interval_unit or order_interval_frequency:', { intervalUnit, orderIntervalFrequency });
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
                        .then(variantsData => {
                          currentCatalogVariants = variantsData;
                          rerenderModalCartList();
                          renderModal();
                          hideModalLoading();
                          // <-- Place the picker initialization here!
                          initializeDateAndTimePickers();
                        })
                        .catch(err => {
                          currentCatalogVariants = null;
                          console.error('Failed to load catalog variants:', err);
                          hideModalLoading();
                        });
                    } else {
                    }
                  })
                  .catch(err => {
                    currentCatalogPayload = null;
                    console.error('Failed to load catalog payload:', err);
                    hideModalLoading();
                  });
              } else {
                currentCatalogPayload = null;
                console.error('No matching locationName found for locationId:', locationId);
                hideModalLoading();
              }
            }).catch(err => {
              currentCatalogPayload = null;
              console.error('Failed to fetch pickup locations for zip:', zip, err);
              hideModalLoading();
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
                      
                      // Fetch variants for this catalog
                      if (catalogPayload && catalogPayload.catalogId) {
                        const catalogId = catalogPayload.catalogId.replace('gid://shopify/MarketCatalog/', '');
                        fetch(`${API_URL}/subscriptions/${catalogId}/variants`)
                          .then(resp => resp.json())
                          .then(variantsData => {
                            currentCatalogVariants = variantsData;
                            rerenderModalCartList();
                            renderModal();
                            hideModalLoading();
                            // <-- Place the picker initialization here!
                            initializeDateAndTimePickers();
                          })
                          .catch(err => {
                            currentCatalogVariants = null;
                            console.error('Failed to load catalog variants:', err);
                            hideModalLoading();
                          });
                      }
                    })
                    .catch(err => {
                      currentCatalogPayload = null;
                      console.error('Failed to load catalog payload for first location:', err);
                      hideModalLoading();
                    });
                } else {
                  currentCatalogPayload = null;
                  hideModalLoading();
                }
              }).catch(err => {
                currentCatalogPayload = null;
                console.error('Failed to fetch pickup locations for zip:', zip, err);
              });
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

  function renderFrequencyDropdown() {
    console.log('=== RENDER FREQUENCY DROPDOWN START ===');
    console.log('selectedFrequency:', selectedFrequency);
    console.log('availableFrequencies:', availableFrequencies);
    console.log('modalChanges.selectedFrequency:', modalChanges.selectedFrequency);
    console.log('Current subscription data:', currentSubscription?.subscription_preferences);
    
    const frequencySelect = modalOverlay && modalOverlay.querySelector('#afinity-frequency');
    console.log('Frequency select element found:', !!frequencySelect);
    
    if (frequencySelect && availableFrequencies.length > 0 && selectedFrequency) {
      const optionsHtml = availableFrequencies.map(freq => 
        freq.options.map(option => {
          const optionValue = `${freq.unit}-${option}`;
          const isSelected = selectedFrequency === optionValue;
          console.log(`Option ${optionValue}: selected = ${isSelected}`);
          return `<option value="${optionValue}" ${isSelected ? 'selected' : ''}>
            ${option} ${freq.unit}${option > 1 ? 's' : ''} subscription
          </option>`;
        }).join('')
      ).join('');
      
      frequencySelect.innerHTML = optionsHtml;
      console.log('Frequency dropdown HTML updated');
      
      // Also set the value programmatically to ensure it's selected
      if (selectedFrequency) {
        frequencySelect.value = selectedFrequency;
        console.log('Set frequency select value to:', selectedFrequency);
      }
    } else {
      console.log('Frequency select not found or no frequencies available');
    }
    console.log('=== RENDER FREQUENCY DROPDOWN COMPLETE ===');
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
    console.log('=== GENERATE TIME OPTIONS START ===');
    console.log('Generating time options for date:', selectedDate);
    
    if (!selectedDate) {
      console.log('No selected date provided, returning empty array');
      return [];
    }
    
    const fulfillmentMethod = modalChanges.fulfillmentMethod || fulfillmentMethod;
    console.log('Current fulfillment method:', fulfillmentMethod);
    
    // Find the delivery day data for the selected date
    let dayData = null;
    if (fulfillmentMethod === 'Delivery') {
      console.log('Looking for delivery day data');
      dayData = (window.deliveryDaysData || []).find(day => day.date === selectedDate);
      console.log('Found delivery day data:', dayData);
    } else {
      // For pickup, find the selected location's pickup dates
      const selectedLocationId = modalChanges.selectedPickupLocationId || selectedPickupLocationId;
      console.log('Looking for pickup location with ID:', selectedLocationId);
      
      const selectedLocation = (window.pickupLocationsData || []).find(
        loc => String(loc.location_id) === String(selectedLocationId)
      );
      console.log('Found selected location:', selectedLocation);
      
      if (selectedLocation && selectedLocation.pickupDates) {
        console.log('Location has pickup dates:', selectedLocation.pickupDates);
        dayData = selectedLocation.pickupDates.find(day => day.date === selectedDate);
        console.log('Found pickup day data for selected date:', dayData);
      } else {
        console.log('No pickup dates found for selected location');
      }
    }
    
    if (!dayData) {
      console.log('No day data found for selected date');
      return [];
    }
    
    if (dayData.isClosed) {
      console.log('Day is closed');
      return [];
    }
    
    if (!dayData.open || !dayData.close) {
      console.log('No open/close times found in day data');
      return [];
    }
    
    console.log('Day data found - open:', dayData.open, 'close:', dayData.close);
    
    const [startHour, startMin] = parseTimeString(dayData.open);
    const [endHour, endMin] = parseTimeString(dayData.close);
    console.log('Parsed start time:', startHour + ':' + startMin);
    console.log('Parsed end time:', endHour + ':' + endMin);
    
    const slots = [];
    let currentHour = startHour;
    let currentMin = startMin;
    
    // Check if it's today and adjust for past times
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const isToday = selectedDate === todayStr;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    console.log('Is today:', isToday);
    console.log('Current time in minutes:', currentTime);
    
    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMin < endMin)
    ) {
      const slotTime = currentHour * 60 + currentMin;
      
      // Skip past times for today
      if (!isToday || slotTime > currentTime + 30) {
        const timeStr = `${currentHour % 12 || 12}:${currentMin.toString().padStart(2, '0')} ${currentHour >= 12 ? 'PM' : 'AM'}`;
        slots.push(timeStr);
      } else {
        console.log('Skipping past time slot:', `${currentHour}:${currentMin}`);
      }
      
      currentMin += 15;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour += 1;
      }
    }
    
    console.log('Generated time slots:', slots);
    console.log('=== GENERATE TIME OPTIONS COMPLETE ===');
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
    console.log('Changing from ehre');

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
    hideModalLoading();
  }

  // Add this new function to initialize date and time pickers with current values
  async function initializeDateAndTimePickers() {
    console.log('=== INITIALIZE DATE AND TIME PICKERS START ===');
    
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
    
    console.log('=== DATE/TIME SOURCE PRIORITY ===');
    console.log('Order attributes date:', orderAttributesDate);
    console.log('Order attributes time:', orderAttributesTime);
    console.log('ModalChanges date:', modalChanges.deliveryDate);
    console.log('ModalChanges time:', modalChanges.fulfillmentTime);
    console.log('Global deliveryDate:', deliveryDate);
    console.log('Global fulfillmentTime:', fulfillmentTime);
    console.log('Final selected date:', finalDate);
    console.log('Final selected time:', finalTime);
    console.log('Current method from subscription:', currentMethod);
    
    // Set up date picker with allowed dates
    setupDatePicker(currentMethod);
    
    // Set the date input value if we have a valid date
    const dateInput = document.getElementById('afinity-date');
    if (dateInput && finalDate) {
      dateInput.value = finalDate;
      console.log('Set date input value to:', finalDate);
      // Add this:
      reinitializeTimePicker();
    }
    
    // Initialize time picker with current time
    const timeInput = document.getElementById('timepicker');
    console.log('Time input element found:', !!timeInput);
    console.log('jQuery available:', typeof jQuery !== 'undefined');
    console.log('jQuery timepicker plugin available:', typeof jQuery !== 'undefined' && jQuery.fn.timepicker);
    console.log('jQuery version:', typeof jQuery !== 'undefined' ? jQuery.fn.jquery : 'not available');
    console.log('Timepicker plugin methods:', typeof jQuery !== 'undefined' && jQuery.fn.timepicker ? Object.keys(jQuery.fn.timepicker) : 'not available');
    console.log('Timepicker plugin prototype:', typeof jQuery !== 'undefined' && jQuery.fn.timepicker ? Object.keys(jQuery.fn.timepicker.prototype || {}) : 'not available');
    
    if (timeInput && typeof jQuery !== 'undefined' && jQuery.fn.timepicker) {
      // Remove existing timepicker if it exists
      if ($(timeInput).data('timepicker')) {
        $(timeInput).timepicker('remove');
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
        
        console.log('Current time in 12-hour format:', currentTime12);
        console.log('Available time options:', timeOptions);
        
        // Try to find an exact match first
        if (timeOptions.includes(currentTime12)) {
          defaultTime12 = currentTime12;
          console.log('Found exact match for current time:', defaultTime12);
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
      console.log('Set time input value to:', defaultTime12);
      
      // Update the modalChanges with the selected time (convert back to 24-hour format)
      if (defaultTime12 !== minTime || currentTime) {
        const [h, m] = parseTimeString(defaultTime12);
        const selectedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        updateModalChanges('fulfillmentTime', selectedTime);
        fulfillmentTime = selectedTime;
        console.log('Updated modalChanges.fulfillmentTime to:', selectedTime);
      }
      
      console.log('About to initialize timepicker with:', {
        interval: 15,
        minTime,
        maxTime,
        defaultTime: defaultTime12,
        startTime: minTime,
        timeOptions: timeOptions
      });
      console.log('Time options array:', timeOptions);
      console.log('Default time to set:', defaultTime12);
      console.log('Is default time in options?', timeOptions.includes(defaultTime12));
      
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
            updateModalChanges('fulfillmentTime', time24Format);
            fulfillmentTime = time24Format;
            console.log('Time picker changed to:', time24Format);
          }
        }
      });
      
      console.log('Timepicker initialized. Current input value:', timeInput.value);
      console.log('Timepicker data:', $(timeInput).data('timepicker'));
      console.log('Timepicker options:', $(timeInput).data('timepicker') ? $(timeInput).data('timepicker').options : 'not available');
      
      // Force the timepicker to show the selected time
      try {
        $(timeInput).timepicker('setTime', defaultTime12);
        console.log('Forced timepicker to set time:', defaultTime12);
        console.log('Timepicker instance exists:', $(timeInput).data('timepicker'));
        
              // Alternative approach: trigger the change event
      $(timeInput).trigger('change');
      console.log('Triggered change event on timepicker');
      
      // Also try to trigger the timepicker's show method to force it to update
      try {
        $(timeInput).timepicker('show');
        console.log('Triggered timepicker show method');
      } catch (error) {
        console.log('Could not trigger timepicker show method:', error);
      }
      
      // Also try to trigger the timepicker's hide method to force it to update
      try {
        $(timeInput).timepicker('hide');
        console.log('Triggered timepicker hide method');
      } catch (error) {
        console.log('Could not trigger timepicker hide method:', error);
      }
        
        // Also try to update the timepicker's internal state
        const timepickerInstance = $(timeInput).data('timepicker');
        if (timepickerInstance && timepickerInstance.setTime) {
          timepickerInstance.setTime(defaultTime12);
          console.log('Called setTime on timepicker instance');
        }
        
        // Check what methods are available on the timepicker instance
        if (timepickerInstance) {
          console.log('Available timepicker methods:', Object.keys(timepickerInstance));
          console.log('Timepicker time property:', timepickerInstance.time);
          console.log('Timepicker options:', timepickerInstance.options);
        }
      } catch (error) {
        console.error('Error setting timepicker time:', error);
        // Fallback: just set the input value directly
        timeInput.value = defaultTime12;
        console.log('Fallback: Set input value directly to:', defaultTime12);
      }
      
      // Ensure the time value is set after timepicker initialization
      setTimeout(() => {
        console.log('100ms timeout - checking timepicker state');
        console.log('Input value at 100ms:', timeInput.value);
        console.log('Expected value:', defaultTime12);
        console.log('Timepicker instance at 100ms:', $(timeInput).data('timepicker'));
        
        if (timeInput.value !== defaultTime12) {
          timeInput.value = defaultTime12;
          console.log('Re-set time input value to:', defaultTime12);
        }
        // Also try to trigger the timepicker to update its display
        try {
          $(timeInput).timepicker('setTime', defaultTime12);
          console.log('Re-forced timepicker to set time:', defaultTime12);
        } catch (error) {
          console.error('Error in 100ms timeout setTime:', error);
        }
      }, 100);
      
      // Additional timeout to ensure the timepicker is fully initialized
      setTimeout(() => {
        console.log('Final time input value:', timeInput.value);
        console.log('Expected time value:', defaultTime12);
        console.log('Timepicker instance at 300ms:', $(timeInput).data('timepicker'));
        if (timeInput.value !== defaultTime12) {
          timeInput.value = defaultTime12;
          $(timeInput).timepicker('setTime', defaultTime12);
          console.log('Final attempt to set time:', defaultTime12);
        }
        
        // Try to force the timepicker to update its display
        const timepickerInstance = $(timeInput).data('timepicker');
        if (timepickerInstance) {
          console.log('Timepicker instance found at 300ms');
          console.log('Timepicker time property:', timepickerInstance.time);
          console.log('Timepicker options:', timepickerInstance.options);
          
          // Try to manually update the timepicker's display
          if (timepickerInstance.time !== defaultTime12) {
            timepickerInstance.time = defaultTime12;
            console.log('Manually set timepicker.time to:', defaultTime12);
          }
        }
      }, 300);
      
      console.log('Time picker initialized with', timeOptions.length, 'time options. Default:', defaultTime12);
      console.log('Final timepicker state check:');
      console.log('- Input value:', timeInput.value);
      console.log('- Timepicker instance:', $(timeInput).data('timepicker'));
      console.log('- Timepicker time:', $(timeInput).data('timepicker') ? $(timeInput).data('timepicker').time : 'not available');
    } else {
      console.log('Timepicker plugin not available, will retry in 500ms');
      // Retry after a short delay in case the plugin is still loading
      setTimeout(() => {
        if (timeInput && typeof jQuery !== 'undefined' && jQuery.fn.timepicker) {
          console.log('Retrying timepicker initialization...');
          initializeDateAndTimePickers();
                 } else {
           console.log('Timepicker plugin still not available after retry');
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
               console.log('Fallback: Found exact match for current time:', selectedTime12);
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
               console.log('Fallback: Using closest available time:', selectedTime12, '(difference:', minDifference, 'minutes)');
             }
             
             timeInput.value = selectedTime12;
             console.log('Set time input value directly (fallback):', selectedTime12);
             
             // Update the modalChanges with the selected time
             const [selHour, selMin] = parseTimeString(selectedTime12);
             const selectedTime24 = `${selHour.toString().padStart(2, '0')}:${selMin.toString().padStart(2, '0')}`;
             updateModalChanges('fulfillmentTime', selectedTime24);
             fulfillmentTime = selectedTime24;
             console.log('Fallback: Updated modalChanges.fulfillmentTime to:', selectedTime24);
           }
         }
      }, 500);
    }
    
    console.log('=== INITIALIZE DATE AND TIME PICKERS COMPLETE ===');
    
    // Also ensure the frequency dropdown is properly set
    await loadInitialFrequency();
  }

  // New function to load initial frequency from currentSubscription
  async function loadInitialFrequency() {
    console.log('=== LOAD INITIAL FREQUENCY START ===');
    console.log('currentSubscription:', currentSubscription);
    
    if (!currentSubscription) {
      console.log('No currentSubscription available');
      return;
    }
    
    // Extract frequency from currentSubscription (on root level)
    let frequencyFromSubscription = null;
    const intervalUnit = currentSubscription.order_interval_unit;
    const orderIntervalFrequency = currentSubscription.order_interval_frequency;
    
    console.log('Subscription root level frequency data:');
    console.log('order_interval_unit:', intervalUnit);
    console.log('order_interval_frequency:', orderIntervalFrequency);
    
    if (intervalUnit && orderIntervalFrequency) {
      frequencyFromSubscription = `${intervalUnit}-${orderIntervalFrequency}`;
      console.log('Calculated frequency from subscription:', frequencyFromSubscription);
    } else {
      console.log('Missing order_interval_unit or order_interval_frequency in subscription');
    }
    
    // Set the global selectedFrequency
    if (frequencyFromSubscription) {
      selectedFrequency = frequencyFromSubscription;
      updateModalChanges('selectedFrequency', frequencyFromSubscription);
      console.log('Set selectedFrequency to:', selectedFrequency);
    }
    
    // Ensure frequencies are loaded
    if (availableFrequencies.length === 0) {
      console.log('No frequencies available, fetching them first...');
      await fetchFrequencies();
    }
    
    console.log('Available frequencies:', availableFrequencies);
    console.log('Final selectedFrequency:', selectedFrequency);
    
    // Render the frequency dropdown
    renderFrequencyDropdown();
    
    console.log('=== LOAD INITIAL FREQUENCY COMPLETE ===');
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
            updateModalChanges('fulfillmentTime', time24Format);
            fulfillmentTime = time24Format;
          }
        }
      });
      console.log('Time picker re-initialized with', timeOptions.length, 'time options. Default:', defaultTime12);
    }
  }
})();