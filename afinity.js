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
              <img src="https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=facearea&w=64&h=64" alt="Monica's Breakfast Burrito" />
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
            <input id="afinity-date" type="date" value="${fulfillmentDate}" />
          </div>
          <div class="afinity-modal-row">
            <label for="afinity-time">Time</label>
            <input id="afinity-time" type="time" value="${fulfillmentTime}" />
          </div>
        </div>
        <button class="afinity-modal-add-extra">&#8853; Add extra meal to order</button>
      </div>
    `;
    // Close logic
    overlay.querySelector('.afinity-modal-close').onclick = () => overlay.remove();
    overlay.querySelector('.afinity-modal-back').onclick = () => overlay.remove();
    document.body.appendChild(overlay);
    // Animate in (already handled by CSS)
  }

  // Listen for the event on document
  document.addEventListener('Recharge::click::manageSubscription', function(event) {
    event.preventDefault();
    console.log("event", event);
    
    // Extract subscription ID from the event
    const subscriptionId = event.detail?.payload.subscriptionId;
    
    if (subscriptionId) {
      // Fetch subscription data from API
      fetch(`${API_URL}/subscription/${subscriptionId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(subscriptionData => {
          createModal(subscriptionData.data);
        })
        .catch(error => {
          console.error('Error fetching subscription data:', error);
          // Fallback to creating modal without data
          createModal();
        });
    } else {
      // No subscription ID found, create modal with default data
      console.warn('No subscription ID found in event');
      createModal();
    }
  });
})(); 