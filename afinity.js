// affinity.js - Standalone modal widget
(function() {
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

  function createModal() {
    // Remove any existing modal
    const old = document.getElementById('afinity-modal-overlay');
    if (old) old.remove();

    // Modal HTML
    const overlay = document.createElement('div');
    overlay.className = 'afinity-modal-overlay';
    overlay.id = 'afinity-modal-overlay';
    overlay.innerHTML = `
      <button class="afinity-modal-close" title="Close">&times;</button>
      <div class="afinity-modal-header">
        <span class="afinity-modal-date">Sun, June 29, 2025 $3.99</span>
        <span class="afinity-modal-desc">1 x Pollo Asado with Seasoned Rice</span>
      </div>
      <div class="afinity-modal-content">
        <div class="afinity-modal-card-frequency">
          <button class="afinity-modal-back">&#8592; Back</button>
          <div class="afinity-modal-card-frequency-content">
            <div class="afinity-modal-row">
              <label for="afinity-frequency">Frequency</label>
              <select id="afinity-frequency">
                <option>2 week subscription with 10% discount</option>
                <option>1 week subscription</option>
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
            <input id="afinity-date" type="date" value="2025-12-12" />
          </div>
          <div class="afinity-modal-row">
            <label for="afinity-time">Time</label>
            <input id="afinity-time" type="time" value="15:30" />
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
    createModal();
  });
})(); 