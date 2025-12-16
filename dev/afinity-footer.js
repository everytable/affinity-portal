(function () {
  // ============================================
  // INITIALIZATION GUARD - Wait for DOM and Recharge to be ready
  // ============================================
  
  let scriptInitialized = false;
  let initializationLoader = null;
  
  // Function to show initialization loader
  function showInitializationLoader() {
    if (initializationLoader) return; // Already showing
    
    initializationLoader = document.createElement('div');
    initializationLoader.id = 'et-init-loader';
    initializationLoader.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(13, 60, 58, 0.95);
      z-index: 99998;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Add spinner animation if not already added
    if (!document.getElementById('et-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'et-spinner-style';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    `;
    
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
      text-align: center;
    `;
    messageEl.textContent = 'Loading...';
    
    initializationLoader.appendChild(spinner);
    initializationLoader.appendChild(messageEl);
    
    // Only append if body exists
    if (document.body) {
      document.body.appendChild(initializationLoader);
    } else {
      // Wait for body
      const bodyObserver = new MutationObserver(() => {
        if (document.body && initializationLoader && !initializationLoader.parentElement) {
          document.body.appendChild(initializationLoader);
          bodyObserver.disconnect();
        }
      });
      bodyObserver.observe(document.documentElement, { childList: true });
    }
  }
  
  // Function to remove initialization loader
  function removeInitializationLoader() {
    if (initializationLoader && initializationLoader.parentElement) {
      initializationLoader.style.opacity = '0';
      initializationLoader.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        if (initializationLoader && initializationLoader.parentElement) {
          initializationLoader.remove();
        }
        initializationLoader = null;
      }, 300);
    }
  }
  
  // Function to check if Recharge is ready
  function isRechargeReady() {
    // Check if DOM is ready
    if (document.readyState === 'loading' || !document.body) {
      return false;
    }
    
    // Check if Recharge object exists
    const recharge = window.recharge || window.ReCharge || window.Recharge;
    
    // Check if Recharge UI elements are present (most reliable indicator)
    const rechargeElements = document.querySelectorAll('[data-testid*="recharge"], [class*="recharge"], [id*="recharge"]');
    const hasRechargeUI = rechargeElements.length > 0;
    
    // Check if subscription cards are present (indicates main content is loaded)
    const hasSubscriptionContent = document.querySelectorAll('*').length > 100 && 
                                   (document.body.textContent || '').includes('Deliver to') &&
                                   (document.body.textContent || '').includes('Subscription');
    
    // Check if Recharge has initialized (look for common methods/properties)
    const hasRechargeSDK = recharge && (recharge.session || recharge.auth || recharge.subscription || recharge.address);
    
    // Need at least UI elements OR SDK + subscription content
    if (hasRechargeUI || (hasRechargeSDK && hasSubscriptionContent)) {
      return true;
    }
    
    return false;
  }
  
  // Function to wait for DOM and Recharge to be ready
  function waitForReady(callback, maxWaitTime = 10000) {
    const startTime = Date.now();
    let loaderShown = false;
    
    const checkReady = () => {
      const elapsed = Date.now() - startTime;
      
      // Check if DOM is ready
      const domReady = document.readyState === 'complete' || document.readyState === 'interactive';
      const bodyReady = !!document.body;
      
      // Check if Recharge is ready
      const rechargeReady = isRechargeReady();
      
      // Show loader if not ready yet and we've waited a bit
      if (!loaderShown && (!domReady || !bodyReady || !rechargeReady) && elapsed > 500) {
        showInitializationLoader();
        loaderShown = true;
      }
      
      // If everything is ready
      if (domReady && bodyReady && rechargeReady) {
        if (loaderShown) {
          // Wait a bit more to ensure UI is fully rendered
          setTimeout(() => {
            removeInitializationLoader();
            callback();
          }, 300);
        } else {
          callback();
        }
        return;
      }
      
      // Timeout after maxWaitTime
      if (elapsed > maxWaitTime) {
        console.warn('[ET] Timeout waiting for page to be ready, proceeding anyway...');
        if (loaderShown) {
          removeInitializationLoader();
        }
        callback();
        return;
      }
      
      // Check again
      setTimeout(checkReady, 100);
    };
    
    // Start checking
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkReady);
    } else {
      checkReady();
    }
  }
  
  // Helper function to wait for Recharge UI elements to be present
  function waitForRechargeElements(selector, callback, maxWait = 5000, interval = 200) {
    const startTime = Date.now();
    const check = () => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        callback();
        return;
      }
      if (Date.now() - startTime < maxWait) {
        setTimeout(check, interval);
      } else {
        console.warn('[ET] Timeout waiting for elements:', selector);
        callback(); // Call anyway after timeout
      }
    };
    check();
  }
  
  // Helper function to safely run code after delay with readiness check
  function safeDelayedRun(callback, delay, description = '') {
    setTimeout(() => {
      // Double-check DOM is ready
      if (document.readyState === 'loading' || !document.body) {
        console.log(`[ET] Delaying ${description || 'operation'} - DOM not ready`);
        safeDelayedRun(callback, delay, description);
        return;
      }
      
      // Check if Recharge elements exist
      const hasRechargeElements = document.querySelectorAll('[data-testid*="recharge"], [class*="recharge"]').length > 0;
      if (!hasRechargeElements && delay < 3000) {
        console.log(`[ET] Delaying ${description || 'operation'} - Recharge elements not found`);
        safeDelayedRun(callback, delay + 500, description);
        return;
      }
      
      try {
        callback();
      } catch (e) {
        console.error(`[ET] Error in ${description || 'delayed operation'}:`, e);
      }
    }, delay);
  }
  
  // Main initialization function - wraps all script code
  function initializeScript() {
    if (scriptInitialized) return;
    scriptInitialized = true;
    
    console.log('[ET] Script initialization started');
    
    // Check if we need to show loader on page load (after reload)
    if (sessionStorage.getItem('et-show-reload-loader') === 'true') {
    const message = sessionStorage.getItem('et-reload-message') || 'Updating Order Summary...';
    const subMessage = sessionStorage.getItem('et-reload-submessage') || 'Please wait while we apply your discount';
    
    // Create loader overlay immediately
    const loaderOverlay = document.createElement('div');
    loaderOverlay.id = 'et-reload-loader';
    loaderOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(13, 60, 58, 0.95);
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Add spinner animation if not already added
    if (!document.getElementById('et-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'et-spinner-style';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    `;
    
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
      text-align: center;
    `;
    messageEl.textContent = message;
    
    const subMessageEl = document.createElement('div');
    subMessageEl.style.cssText = `
      font-size: 14px;
      opacity: 0.9;
      text-align: center;
      margin-top: 8px;
    `;
    subMessageEl.textContent = subMessage;
    
    loaderOverlay.appendChild(spinner);
    loaderOverlay.appendChild(messageEl);
    loaderOverlay.appendChild(subMessageEl);
    document.body.appendChild(loaderOverlay);
    
    // Remove loader once page is fully loaded
    const removeLoader = () => {
      setTimeout(() => {
        if (loaderOverlay.parentElement) {
          loaderOverlay.remove();
        }
        // Clear the flag
        sessionStorage.removeItem('et-show-reload-loader');
        sessionStorage.removeItem('et-reload-message');
        sessionStorage.removeItem('et-reload-submessage');
      }, 500); // Small delay to ensure content is rendered
    };
    
    if (document.readyState === 'complete') {
      removeLoader();
    } else {
      window.addEventListener('load', removeLoader);
    }
  }
  
  // Fetch interceptor to log ReCharge address data
  const originalFetch = window.fetch;
  window.fetch = async function () {
    const response = await originalFetch.apply(this, arguments);
    const clonedResponse = response.clone();
    clonedResponse.json().then(data => {
      // Check if the response contains ReCharge customer address data
      if (data?.data?.customer?.addresses?.length) {
        const address = data.data.customer.addresses[0];
        console.log("🔍 ReCharge Address Data Found:");
        console.log("➡️ Address ID:", address.id);
        console.log("➡️ Address 1:", address.address1);
        console.log("➡️ City:", address.city);
        console.log("➡️ Zip:", address.zip);
        console.log("➡️ Full object:", address);
      }
    }).catch(() => {});
    return response;
  };

  const selectors = [
    '.recharge-heading.recharge-heading-h1',
    '.recharge-heading.recharge-heading-h2',
  ];
  const combinedSelector = selectors.join(', ');

  const datePattern =
    /\b(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/;

  const TIMEZONE = 'America/Los_Angeles';

  console.log('👀 Watching Recharge headings...');

  function formatDatePlusDays(dateText, daysToAdd = 2) {
    const parsedDate = new Date(dateText);
    if (isNaN(parsedDate)) {
      console.warn('❌ Invalid date:', dateText);
      return null;
    }

    parsedDate.setDate(parsedDate.getDate() + daysToAdd);

    return new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE,
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(parsedDate);
  }

  function shouldSkipElement(el) {
    const id = el.id || '';
    const testid = el.getAttribute('data-testid') || '';
    const content = el.textContent || '';

    return (
      id === 'order-total-price' ||
      testid === 'order-summary-total' ||
      /\$\d/.test(content)
    );
  }

  function hideEditButtonNearby(el) {
    const editBtn = el.parentElement?.querySelector(
      '[data-testid="edit-button"], button[aria-label="Edit"]'
    );
    if (editBtn) {
      editBtn.style.display = 'none';
    }
  }

  function updateRechargeHeadings() {
    document.querySelectorAll(combinedSelector).forEach(el => {
      if (el.dataset.rechargeDateUpdated === 'true') return;
      if (shouldSkipElement(el)) return;

      const text = el.textContent.trim();
      const match = text.match(datePattern);
      if (!match) return;

      const originalDate = match[0];
      const newDate = formatDatePlusDays(originalDate, 2);
      if (!newDate) return;

      const updatedText = text.replace(originalDate, newDate);
      el.textContent = updatedText;
      el.dataset.rechargeDateUpdated = 'true';

      hideEditButtonNearby(el);

      console.log(
        `✅ Updated Recharge heading: "${originalDate}" → "${newDate}"`
      );
    });
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      const nodes = Array.from(mutation.addedNodes);
      const matching = nodes.some(
        node =>
          node.nodeType === 1 &&
          (node.matches?.(combinedSelector) ||
            node.querySelector?.(combinedSelector))
      );
      if (matching) {
        updateRechargeHeadings();
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also trigger at start (for already-loaded content)
  updateRechargeHeadings();

  // Remove Edit buttons
  const removeEditButtonsObserver = new MutationObserver(() => {
    const buttons = Array.from(document.querySelectorAll('button')).filter(
      btn => btn.textContent?.trim() === 'Edit'
    );

    buttons.forEach(btn => btn.remove());
  });

  removeEditButtonsObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  /// Show only 4 items in the div
  function limitUpcomingOrdersToFour() {
    const observer = new MutationObserver((mutations, obs) => {
      const upcomingOrdersDiv = Array.from(
        document.querySelectorAll('div')
      ).find(div => div.textContent.trim().toLowerCase() === 'upcoming orders');

      if (!upcomingOrdersDiv) {
        return;
      }
      const tableDiv = upcomingOrdersDiv.nextElementSibling;

      if (!tableDiv) {
        return;
      }

      // Get all direct child divs of the tableDiv (each card)
      const cardContainer = tableDiv.children[0]; // This is the actual container of the cards
      const cards = Array.from(cardContainer.children); // Get the individual cards

      if (cards.length > 4) {
        console.log('[Debug] More than 4 cards found, removing extras');

        // Remove all cards beyond the first 4
        cards.slice(4).forEach(card => {
          card.remove();
          console.log('[Debug] Removed a card');
        });

        // Once done, disconnect the observer to prevent further runs
        //obs.disconnect();
      } else {
        console.log('[Debug] 4 or fewer cards found, no removal needed');
      }
    });

    // Observe changes to the whole document body for dynamically loaded content
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Run the function to start observing
  limitUpcomingOrdersToFour();

  // Change text of address payment and discount
  const replacements = [
    {
      target: 'Your addresses & payment details',
      replacement: 'Your payment details',
    },
    {
      target: 'Address & payment details',
      replacement: 'Payment details',
    },
    {
      target: 'Add discount',
      replacement: 'Redeem Rewards or Apply Discount',
    },
    {
      target: 'Manage subscriptions',
      replacement: 'Manage',
    },
    {
      target: 'View your next order',
      replacement: 'Next Order',
    },
    {
      target: 'View upcoming orders',
      replacement: 'Upcoming Orders',
    },
    {
      target: 'View previous orders',
      replacement: 'Previous Orders',
    },
    {
      target: 'Payment details',
      replacement: 'Update Payment',
    },
  ];

  function replaceTextContent() {
    const elements = document.querySelectorAll('*');
    for (let el of elements) {
      if (
        el.childNodes.length === 1 &&
        el.childNodes[0].nodeType === Node.TEXT_NODE
      ) {
        const text = el.textContent.trim();
        for (const { target, replacement } of replacements) {
          if (text === target) {
            el.textContent = replacement;
          }
        }
      }
    }
  }

  // Handle discount modal/pop-up text replacements
  function replaceDiscountModalText() {
    const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, label, div, span');
    for (let el of elements) {
      const text = el.textContent?.trim() || '';
      
      // Replace modal title: "Apply a discount code" → "Redeem Rewards or Apply a Discount"
      if (text === 'Apply a discount code' && el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
        el.textContent = 'Redeem Rewards or Apply a Discount';
      }
      
      // Replace modal description
      if (text.includes('If you have a discount code, add it here') && 
          el.childNodes.length === 1 && 
          el.childNodes[0].nodeType === Node.TEXT_NODE) {
        el.textContent = 'Paste the reward points code copied from your rewards dashboard below or if you have a discount code, enter it below.';
      }
      
      // Also handle if the description is split differently
      if (text === 'If you have a discount code, add it here. This will apply to all orders that get sent to this address.' &&
          el.childNodes.length === 1 && 
          el.childNodes[0].nodeType === Node.TEXT_NODE) {
        el.textContent = 'Paste the reward points code copied from your rewards dashboard below or if you have a discount code, enter it below.';
      }
    }
    
    // Update input placeholders
    const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
    for (let input of inputs) {
      const placeholder = input.getAttribute('placeholder') || '';
      if (placeholder.toLowerCase().includes('discount code')) {
        input.setAttribute('placeholder', 'Reward points code or discount code');
      }
    }
  }

  // Run once in case it's already rendered
  replaceTextContent();
  replaceDiscountModalText();

  // Set up observer to handle dynamic rendering
  const addressObserver = new MutationObserver(() => {
    replaceTextContent();
    replaceDiscountModalText();
  });

  addressObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // ============================================
  // Navigation Reordering
  // ============================================
  
  let navReordered = false;

  function reorderNavigation() {
    // Use data-testid attributes to find Recharge navigation links (more reliable)
    const existingLinks = document.querySelectorAll(
      'a[data-testid*="recharge-internal"]'
    );
    if (existingLinks.length === 0) {
      console.log('[ET] Reorder: No Recharge navigation links found');
      return;
    }

    console.log('[ET] Reorder: Found', existingLinks.length, 'Recharge navigation links');

    // Find the container - it's the parent of the wrapper divs (div._18gma4r0)
    // Structure: container > div._18gma4r0 > a
    const firstLink = existingLinks[0];
    const wrapper = firstLink.parentElement; // This should be div._18gma4r0
    const navContainer = wrapper?.parentElement; // This should be the main container
    
    if (!navContainer) {
      console.log('[ET] Reorder: Could not find navigation container');
      return;
    }
    
    console.log('[ET] Reorder: Found container', navContainer.tagName, navContainer.className);

    // Find the three target links by data-testid
    // IMPORTANT: "Next order" uses recharge-internal-next-order and should NOT be reordered
    // "Upcoming Orders" uses recharge-internal-upcoming-orders
    const upcomingLink = Array.from(existingLinks).find(link => {
      const testId = link.getAttribute('data-testid') || '';
      return testId.includes('recharge-internal-upcoming-orders') || 
             testId.includes('recharge-internal-upcoming');
      // NOT include recharge-internal-next-order (that's "Next order" which should stay first)
    });
    
    const manageLink = Array.from(existingLinks).find(link => {
      const testId = link.getAttribute('data-testid') || '';
      return testId.includes('recharge-internal-manage') ||
             testId.includes('recharge-internal-subscriptions');
    });
    
    const previousOrderLink = Array.from(existingLinks).find(link => {
      const testId = link.getAttribute('data-testid') || '';
      return testId.includes('recharge-internal-previous-orders') ||
             testId.includes('recharge-internal-previous') ||
             testId.includes('recharge-internal-orders');
    });

    if (!upcomingLink || !manageLink || !previousOrderLink) {
      console.log('[ET] Reorder: Missing links', { 
        upcoming: !!upcomingLink, 
        manage: !!manageLink, 
        previous: !!previousOrderLink 
      });
      return;
    }

    console.log('[ET] Reorder: Found all three links');

    // Get the wrapper divs (div._18gma4r0) - these are direct children of navContainer
    const upcomingWrapper = upcomingLink.parentElement;
    const manageWrapper = manageLink.parentElement;
    const previousWrapper = previousOrderLink.parentElement;

    if (!upcomingWrapper || !manageWrapper || !previousWrapper) {
      console.log('[ET] Reorder: Could not find wrapper divs');
      return;
    }
    
    // Verify wrappers are direct children of container
    if (upcomingWrapper.parentElement !== navContainer ||
        manageWrapper.parentElement !== navContainer ||
        previousWrapper.parentElement !== navContainer) {
      console.log('[ET] Reorder: Wrappers are not direct children of container');
      return;
    }

    // Get all children of the container (these are the wrapper divs)
    const children = Array.from(navContainer.children);
    const upcomingIdx = children.indexOf(upcomingWrapper);
    const manageIdx = children.indexOf(manageWrapper);
    const previousIdx = children.indexOf(previousWrapper);

    console.log('[ET] Reorder: Current indices', { upcomingIdx, manageIdx, previousIdx });

    if (upcomingIdx === -1 || manageIdx === -1 || previousIdx === -1) {
      console.log('[ET] Reorder: Could not find wrapper indices');
      return;
    }

    // Desired order: Upcoming Orders → Manage → Previous Orders
    // Check if already in correct order (Manage right after Upcoming, Previous right after Manage)
    if (manageIdx === upcomingIdx + 1 && previousIdx === manageIdx + 1) {
      navReordered = true;
      console.log('[ET] Reorder: ✅ Already in correct order');
      return;
    }
    
    // Also check if Upcoming comes before both Manage and Previous (even if not consecutive)
    // This handles cases where other items might be in between
    if (upcomingIdx < manageIdx && upcomingIdx < previousIdx && manageIdx < previousIdx) {
      // Upcoming is first, Manage is before Previous - this might be acceptable
      // But we want them consecutive, so still reorder
      console.log('[ET] Reorder: Items in right relative order but not consecutive, reordering...');
    }

    console.log('[ET] Reorder: Reordering needed. Current order:', {
      upcoming: upcomingIdx,
      manage: manageIdx,
      previous: previousIdx
    });

    // Remove Manage and Previous from current positions (remove higher index first to avoid index shift)
    const indicesToRemove = [manageIdx, previousIdx].sort((a, b) => b - a);
    indicesToRemove.forEach(idx => {
      const wrapper = children[idx];
      if (wrapper && wrapper.parentElement === navContainer) {
        console.log('[ET] Reorder: Removing wrapper at index', idx);
        navContainer.removeChild(wrapper);
      }
    });

    // Find where Upcoming is now (after removals)
    const currentChildren = Array.from(navContainer.children);
    const newUpcomingIdx = currentChildren.indexOf(upcomingWrapper);
    console.log('[ET] Reorder: Upcoming is now at index', newUpcomingIdx);
    // Insert Manage right after Upcoming
    if (upcomingWrapper.nextSibling) {
      navContainer.insertBefore(manageWrapper, upcomingWrapper.nextSibling);
      console.log('[ET] Reorder: Inserted Manage after Upcoming');
    } else {
      navContainer.appendChild(manageWrapper);
      console.log('[ET] Reorder: Appended Manage to end');
    }
    // Insert Previous right after Manage
    if (manageWrapper.nextSibling) {
      navContainer.insertBefore(previousWrapper, manageWrapper.nextSibling);
      console.log('[ET] Reorder: Inserted Previous after Manage');
    } else {
      navContainer.appendChild(previousWrapper);
      console.log('[ET] Reorder: Appended Previous to end');
    }
    // Verify final order
    const finalChildren = Array.from(navContainer.children);
    const finalUpcomingIdx = finalChildren.indexOf(upcomingWrapper);
    const finalManageIdx = finalChildren.indexOf(manageWrapper);
    const finalPreviousIdx = finalChildren.indexOf(previousWrapper);
    console.log('[ET] Reorder: Final order indices', {
      upcoming: finalUpcomingIdx,
      manage: finalManageIdx,
      previous: finalPreviousIdx
    });
    navReordered = true;
    console.log('[ET] Reorder: ✅ Successfully reordered - Upcoming → Manage → Previous');
  }

  const navReorderObserver = new MutationObserver((mutations) => {
    // Check if any Recharge nav links were added/changed
    const hasNavChanges = mutations.some(mutation => {
      return Array.from(mutation.addedNodes).some(node => {
        if (node.nodeType !== 1) return false;
        return node.querySelector?.('a[data-testid*="recharge-internal"]') ||
               node.matches?.('a[data-testid*="recharge-internal"]');
      });
    });
    
    if (hasNavChanges && !navReordered) {
      // Small delay to ensure text replacement has completed first
      setTimeout(() => {
        if (!navReordered) {
          reorderNavigation();
        }
      }, 200);
    }
  });

  navReorderObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Run after text replacement has had time to complete
  // Multiple attempts to catch dynamic content - use safe delayed run
  safeDelayedRun(reorderNavigation, 1500, 'navigation reordering');
  safeDelayedRun(reorderNavigation, 2500, 'navigation reordering');
  safeDelayedRun(reorderNavigation, 4000, 'navigation reordering');
  safeDelayedRun(reorderNavigation, 6000, 'navigation reordering');

  // ============================================
  // Hide Logout Button
  // ============================================
  
  function hideLogoutButton() {
    // Find logout button/link using various selectors
    const logoutSelectors = [
      'a[href*="logout"]',
      'button[type="submit"]',
      'a[href*="/logout"]',
      'button:contains("Logout")',
      'button:contains("Log out")',
      'a:contains("Logout")',
      'a:contains("Log out")'
    ];

    logoutSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent?.trim().toLowerCase() || '';
          const href = el.getAttribute('href') || '';
          
          // Check if it's actually a logout element
          if (text.includes('logout') || text.includes('log out') || href.includes('logout')) {
            el.style.display = 'none';
            // Also mark it to prevent showing again
            el.dataset.etLogoutHidden = 'true';
          }
        });
      } catch (e) {
        // Some selectors like :contains might not work, skip them
      }
    });

    // Also check all buttons and links for logout text
    const allButtons = document.querySelectorAll('button, a');
    allButtons.forEach(el => {
      if (el.dataset.etLogoutHidden === 'true') return;
      
      const text = el.textContent?.trim().toLowerCase() || '';
      const href = el.getAttribute('href') || '';
      const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
      
      if (text.includes('logout') || 
          text.includes('log out') || 
          href.includes('logout') ||
          ariaLabel.includes('logout') ||
          ariaLabel.includes('log out')) {
        el.style.display = 'none';
        el.dataset.etLogoutHidden = 'true';
      }
    });
  }

  const logoutObserver = new MutationObserver(() => {
    hideLogoutButton();
  });

  logoutObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Run immediately and with delays to catch dynamic content
  hideLogoutButton();
  setTimeout(hideLogoutButton, 500);
  setTimeout(hideLogoutButton, 1500);

  // ============================================
  // Contact Us Tab Injection
  // ============================================
  
  let contactUsInjected = false;
  let contactUsContainer = null;
  let hiddenReactContent = null;
  let resizeHandler = null;

  function injectContactUsNav() {
    if (contactUsInjected) return;

    // Use the EXACT same approach as reorderNavigation to find the sidebar
    // This ensures we're targeting the same container that reordering uses
    const allRechargeLinks = document.querySelectorAll(
      'a[data-testid*="recharge-internal"]'
    );
    if (allRechargeLinks.length === 0) {
      console.log('[ET] Contact Us: No Recharge navigation links found');
      return;
    }

    console.log('[ET] Contact Us: Found', allRechargeLinks.length, 'total Recharge navigation links on page');

    // Find the sidebar container (not header):
    // - Container is parent of wrappers (div._18gma4r0)
    // - Must contain key Recharge links (manage/upcoming/previous/update payment)
    // - Must not be inside a header
    // - Must have at least 3 recharge-internal links
    let navContainer = null;
    let sidebarLink = null;

    const isSidebarContainer = (container) => {
      if (!container) return false;
      // Exclude header
      if (container.closest('header')) return false;

      const rechargeLinks = container.querySelectorAll(':scope > div._18gma4r0 > a[data-testid*="recharge-internal"]');
      if (rechargeLinks.length < 3) return false;

      // Must have key links
      const hasManage = container.querySelector('a[data-testid*="recharge-internal-manage"], a[data-testid*="recharge-internal-subscriptions"]');
      const hasUpcoming = container.querySelector('a[data-testid*="recharge-internal-upcoming-orders"], a[data-testid*="recharge-internal-upcoming"]');
      const hasPrevious = container.querySelector('a[data-testid*="recharge-internal-previous-orders"], a[data-testid*="recharge-internal-previous"], a[data-testid*="recharge-internal-orders"]');

      return !!(hasManage && hasUpcoming && hasPrevious);
    };

    // Try all links to find a valid sidebar container
    for (const link of allRechargeLinks) {
      const wrapper = link.parentElement;
      const container = wrapper?.parentElement;
      if (isSidebarContainer(container)) {
        navContainer = container;
        sidebarLink = link;
        console.log('[ET] Contact Us: Found sidebar container via', link.getAttribute('data-testid'));
        break;
      }
    }

    // Fallback: pick the first container that satisfies the checks
    if (!navContainer) {
      const candidateContainers = new Set();
      allRechargeLinks.forEach(link => {
        const wrapper = link.parentElement;
        const container = wrapper?.parentElement;
        if (container) candidateContainers.add(container);
      });
      for (const c of candidateContainers) {
        if (isSidebarContainer(c)) {
          navContainer = c;
          sidebarLink = null;
          console.log('[ET] Contact Us: Found sidebar container via fallback');
          break;
        }
      }
    }

    if (!navContainer) {
      console.log('[ET] Contact Us: Could not find navigation container');
      return;
    }

    const rechargeLinksInContainer = navContainer.querySelectorAll(':scope > div._18gma4r0 > a[data-testid*="recharge-internal"]');
    console.log('[ET] Contact Us: Using container', navContainer.tagName, navContainer.className, 'with', rechargeLinksInContainer.length, 'links');

    // Check if already exists
    if (document.querySelector('#et-contact-us-nav-link')) {
      contactUsInjected = true;
      return;
    }

    // Find a reference link to clone - ONLY from links in the verified sidebar container
    // Use rechargeLinksInContainer which we already verified is in the sidebar
    const sidebarLinks = Array.from(rechargeLinksInContainer);
    
    // Prefer using the sidebarLink we found, or find a good reference from sidebar links
    let referenceLink = sidebarLink && navContainer.contains(sidebarLink) ? sidebarLink : null;
    
    if (!referenceLink) {
      referenceLink = sidebarLinks.find(link => 
        link.getAttribute('data-testid')?.includes('recharge-internal-upcoming') ||
        link.getAttribute('data-testid')?.includes('recharge-internal-previous') ||
        link.getAttribute('data-testid')?.includes('recharge-internal-manage')
      ) || sidebarLinks[0];
    }
    
    if (!referenceLink) {
      console.log('[ET] Contact Us: Could not find reference link to clone');
      return;
    }

    console.log('[ET] Contact Us: Cloning reference link', referenceLink.getAttribute('data-testid'));

    // Clone the wrapper div structure: div._18gma4r0 > a
    const referenceWrapper = referenceLink.parentElement;
    if (!referenceWrapper) {
      console.log('[ET] Contact Us: Could not find wrapper div');
      return;
    }

    // Clone the wrapper div (div._18gma4r0)
    const contactWrapper = referenceWrapper.cloneNode(false);
    const contactLink = referenceLink.cloneNode(true);
    
    // Update the link
    contactLink.id = 'et-contact-us-nav-link';
    contactLink.href = '#contact-us';
    contactLink.removeAttribute('data-testid');
    contactLink.removeAttribute('data-active');
    contactLink.removeAttribute('aria-current');
    contactLink.setAttribute('aria-label', 'Contact us');
    
    // Update text content - find the span with recharge-heading class
    const textSpan = contactLink.querySelector('span.recharge-heading, span[role="heading"]') || 
                     contactLink.querySelector('span') || 
                     contactLink;
    if (textSpan) {
      textSpan.textContent = 'Contact us';
    }
    
    contactLink.addEventListener('click', function(e) {
      e.preventDefault();
      renderContactUsPage();
    });

    // Append the link to wrapper
    contactWrapper.appendChild(contactLink);

    // Insert before logout link if it exists, otherwise append to end (after Update Payment)
    const logoutLink = navContainer.querySelector('a[data-testid*="logout"], a[data-testid*="recharge-internal-logout"]');
    if (logoutLink && logoutLink.parentElement) {
      const logoutWrapper = logoutLink.parentElement;
      if (logoutWrapper.parentElement === navContainer) {
        navContainer.insertBefore(contactWrapper, logoutWrapper);
        console.log('[ET] Contact Us: Inserted before logout link');
      } else {
        // Find Update Payment link and insert after it
        const updatePaymentLink = navContainer.querySelector('a[data-testid*="recharge-internal-customer"], a[data-testid*="recharge-internal-update"]');
        if (updatePaymentLink && updatePaymentLink.parentElement) {
          const updatePaymentWrapper = updatePaymentLink.parentElement;
          if (updatePaymentWrapper.parentElement === navContainer && updatePaymentWrapper.nextSibling) {
            navContainer.insertBefore(contactWrapper, updatePaymentWrapper.nextSibling);
            console.log('[ET] Contact Us: Inserted after Update Payment');
          } else {
            navContainer.appendChild(contactWrapper);
            console.log('[ET] Contact Us: Appended to end');
          }
        } else {
          navContainer.appendChild(contactWrapper);
          console.log('[ET] Contact Us: Appended to end (no Update Payment found)');
        }
      }
    } else {
      // No logout link, insert after Update Payment or append to end
      const updatePaymentLink = navContainer.querySelector('a[data-testid*="recharge-internal-customer"], a[data-testid*="recharge-internal-update"]');
      if (updatePaymentLink && updatePaymentLink.parentElement) {
        const updatePaymentWrapper = updatePaymentLink.parentElement;
        if (updatePaymentWrapper.parentElement === navContainer && updatePaymentWrapper.nextSibling) {
          navContainer.insertBefore(contactWrapper, updatePaymentWrapper.nextSibling);
          console.log('[ET] Contact Us: Inserted after Update Payment');
        } else {
          navContainer.appendChild(contactWrapper);
          console.log('[ET] Contact Us: Appended to end');
        }
      } else {
        navContainer.appendChild(contactWrapper);
        console.log('[ET] Contact Us: Appended to end of container');
      }
    }

    contactUsInjected = true;
    console.log('[ET] Contact Us: ✅ Successfully injected into sidebar');
  }

  function cleanupContactUsPage() {
    // Show React content again
    if (hiddenReactContent) {
      hiddenReactContent.style.display = '';
      hiddenReactContent = null;
    }
    
    // Remove resize listener
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }
    
    // Remove our container
    if (contactUsContainer && contactUsContainer.parentElement) {
      contactUsContainer.remove();
      contactUsContainer = null;
    }
  }

  function renderContactUsPage() {
    cleanupContactUsPage();
    
    let mainContent = null;
    
    // Strategy 1: Look for the layout container with sidebar structure
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      const children = Array.from(div.children);
      
      // Check if this div has exactly 2 children where one is the sidebar
      if (children.length === 2) {
        // Helper function to identify if a child is the sidebar
        const isSidebar = (child) => {
          const text = child.textContent || '';
          return (text.includes('Next Order') || text.includes('Upcoming Orders')) &&
                 (text.includes('Manage') || text.includes('Previous Orders') || text.includes('Update Payment'));
        };
        
        const hasSidebar = children.some(isSidebar);
        
        if (hasSidebar) {
          // Find the main content (the child that's NOT the sidebar)
          mainContent = children.find(child => !isSidebar(child));
          break;
        }
      }
    }
    
    // Strategy 2: If no sidebar layout found, look for main content patterns
    if (!mainContent) {
      for (const div of allDivs) {
        const text = div.textContent || '';
        // Look for page-specific content indicators (avoid sidebar with renamed tabs)
        if ((text.includes('Your next order') || 
             text.includes('Deliver to') ||
             text.includes('Charge to card ending') ||
             text.includes('Order total') ||
             text.includes('Shipping:')) 
            && !text.includes('Upcoming Orders') 
            && !text.includes('Manage')
            && div.children.length > 0) {
          
          // Walk up the DOM to find the column wrapper (parent with sidebar sibling)
          let parent = div;
          while (parent && parent.parentElement) {
            const siblings = Array.from(parent.parentElement.children);
            const hasSidebarSibling = siblings.some(sibling => {
              if (sibling === parent) return false;
              const siblingText = sibling.textContent || '';
              return (siblingText.includes('Next Order') || siblingText.includes('Upcoming Orders')) &&
                     (siblingText.includes('Manage') || siblingText.includes('Previous Orders') || siblingText.includes('Update Payment'));
            });
            
            if (hasSidebarSibling) {
              mainContent = parent;
              break;
            }
            parent = parent.parentElement;
          }
          
          // If no sidebar sibling found, use the div itself
          if (!mainContent) {
            mainContent = div;
          }
          break;
        }
      }
    }

    // Strategy 3: Generic fallback selectors
    if (!mainContent) {
      const contentSelectors = [
        'main[role="main"] > div:first-child > div:first-child',
        'main[role="main"] > div:first-child',
        '[data-testid="main-content"] > div:first-child',
        'main > div:first-child > div:first-child',
        'main > div:first-child',
      ];
      
      for (const selector of contentSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const text = (el.textContent || '').toLowerCase();
          // Make sure it's not the sidebar or a wrapper containing the sidebar (case-insensitive)
          if (!text.includes('upcoming orders') && !text.includes('next order')) {
            mainContent = el;
            break;
          }
        }
      }
    }

    if (!mainContent) {
      console.error('❌ Could not find main content area');
      return;
    }

    // Hide React content instead of removing it (keeps React's DOM intact)
    hiddenReactContent = mainContent;
    mainContent.style.display = 'none';
    
    // Create our container as a sibling
    contactUsContainer = document.createElement('div');
    contactUsContainer.id = 'et-contact-us-container';
    // Responsive width: 100% on mobile (sidebar stacks below), 65.7% on desktop (sidebar beside)
    contactUsContainer.style.width = window.innerWidth < 1024 ? '100%' : '65.7%';
    contactUsContainer.style.minHeight = '600px';
    contactUsContainer.innerHTML = `
      <div style="background: #0d3c3a; color: #fff; padding: 24px; border-radius: 8px 8px 0 0; margin-bottom: 0;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #fff;">Contact us</h1>
      </div>

      <!-- Content -->
      <div style="background: #f7f6ef; padding: 32px 24px; border-radius: 0 0 8px 8px; min-height: 500px;">
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 32px; font-weight: 700; color: #222; margin: 0 0 8px 0;">Hi there,</h2>
          <p style="font-size: 16px; color: #666; margin: 0;">Here are the ways for you to get in touch.</p>
        </div>

        <!-- Contact Options -->
        <div style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); max-width: 600px;">
            
            <!-- Email Us -->
            <a href="mailto:support@everytable.com" style="display: flex; align-items: center; gap: 16px; padding: 24px 20px; border-bottom: 1px solid #f0f0f0; text-decoration: none; color: inherit; transition: background 0.2s; cursor: pointer;">
              <div style="width: 48px; height: 48px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0d3c3a" stroke-width="2">
                  <rect x="3" y="5" width="18" height="14" rx="2"/>
                  <path d="M3 7l9 6 9-6"/>
                </svg>
              </div>
              <div style="flex: 1;">
                <div style="font-size: 18px; font-weight: 600; color: #222; margin-bottom: 4px;">Email us</div>
                <div style="font-size: 14px; color: #666;">support@everytable.com</div>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </a>

            <!-- Schedule Callback -->
            <a href="https://calendly.com/everytable-support/30min" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 16px; padding: 24px 20px; border-bottom: 1px solid #f0f0f0; text-decoration: none; color: inherit; transition: background 0.2s; cursor: pointer;">
              <div style="width: 48px; height: 48px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0d3c3a" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div style="flex: 1;">
                <div style="font-size: 18px; font-weight: 600; color: #222; margin-bottom: 4px;">Schedule callback</div>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </a>

            <!-- FAQs -->
            <a href="https://everytable.com/pages/faqs" target="_blank" style="display: flex; align-items: center; gap: 16px; padding: 24px 20px; text-decoration: none; color: inherit; transition: background 0.2s; cursor: pointer;">
              <div style="width: 48px; height: 48px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0d3c3a" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <circle cx="12" cy="17" r="0.5" fill="#0d3c3a"/>
                </svg>
              </div>
              <div style="flex: 1;">
                <div style="font-size: 18px; font-weight: 600; color: #222; margin-bottom: 4px;">FAQs</div>
                <div style="font-size: 14px; color: #666;">Find answers to commonly asked questions.</div>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </a>

        </div>
      </div>
    `;

    // Insert our container after the hidden React content
    mainContent.parentElement.insertBefore(contactUsContainer, mainContent.nextSibling);

    const options = contactUsContainer.querySelectorAll('a[href*="mailto"], a[href*="callback"], a[href*="faq"]');
    options.forEach(option => {
      option.addEventListener('mouseenter', function() {
        this.style.background = '#f8f9fa';
      });
      option.addEventListener('mouseleave', function() {
        this.style.background = 'transparent';
      });
    });

    // Handle responsive width on window resize
    resizeHandler = () => {
      if (contactUsContainer) {
        contactUsContainer.style.width = window.innerWidth < 1024 ? '100%' : '65.7%';
      }
    };
    window.addEventListener('resize', resizeHandler);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const contactNavObserver = new MutationObserver((mutations) => {
    // Check if any Recharge nav links were added/changed
    const hasNavChanges = mutations.some(mutation => {
      return Array.from(mutation.addedNodes).some(node => {
        if (node.nodeType !== 1) return false;
        return node.querySelector?.('a[data-testid*="recharge-internal"]') ||
               node.matches?.('a[data-testid*="recharge-internal"]');
      });
    });
    
    if (hasNavChanges && !contactUsInjected) {
      // Delay to ensure reordering has completed first
      setTimeout(() => {
        if (!contactUsInjected) {
          injectContactUsNav();
        }
      }, 400);
    }
  });

  contactNavObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Multiple attempts to catch dynamic content - run after reordering
  safeDelayedRun(injectContactUsNav, 2000, 'contact us injection');
  safeDelayedRun(injectContactUsNav, 3500, 'contact us injection');
  safeDelayedRun(injectContactUsNav, 5000, 'contact us injection');
  safeDelayedRun(injectContactUsNav, 7000, 'contact us injection');
  
    document.addEventListener('Recharge::location::change', function() {
      cleanupContactUsPage();
      contactUsInjected = false;
      navReordered = false;
      safeDelayedRun(injectContactUsNav, 1000, 'contact us injection (location change)');
      // Run reordering after text replacement has completed
      safeDelayedRun(reorderNavigation, 1200, 'navigation reordering (location change)');
      safeDelayedRun(hideLogoutButton, 1500, 'hide logout button (location change)');
    }, true);

    document.addEventListener('click', function(e) {
      const link = e.target.closest('a[href*="/upcoming"], a[href*="/previous"], a[href*="/subscriptions"], a[href*="/customer"], a[href*="/overview"]');
      if (link && contactUsContainer) {
        cleanupContactUsPage();
      }
    }, true);
    // redeem loyalty
    let redeemRewardsInjected = false;
    let redeemRewardsContainer = null;
    let hiddenReactContentForRewards = null;
    let rewardResizeHandler = null;
    let loyaltyLionWidgetLoaded = false;
    function injectRedeemRewardsNav() {
      if (redeemRewardsInjected) return;
      const existingLinks = document.querySelectorAll('a[href*="/upcoming"], a[href*="/previous"], a[href*="/subscriptions"]');
      if (existingLinks.length === 0) return;
      let navContainer = existingLinks[0].parentElement?.parentElement || existingLinks[0].parentElement;
      if (!navContainer) return;
      if (document.querySelector('#et-redeem-rewards-nav-link')) {
        redeemRewardsInjected = true;
        return;
      }
      const referenceLink = navContainer.querySelector('a[href*="/upcoming"], a[href*="/subscriptions"]');
      if (referenceLink) {
        const redeemLink = referenceLink.cloneNode(true);
        redeemLink.id = 'et-redeem-rewards-nav-link';
        redeemLink.href = '#redeem-rewards';
        const textSpan = redeemLink.querySelector('span') || redeemLink;
        textSpan.textContent = 'Redeem Rewards';
        if (textSpan.style) {
          textSpan.style.color = '#222';
        }
        redeemLink.style.color = '#222';
        redeemLink.addEventListener('click', function(e) {
          e.preventDefault();
          renderRedeemRewardsPage();
        });
        const nextOrderLink = navContainer.querySelector('a[href*="/upcoming"]');
        if (nextOrderLink && nextOrderLink.parentElement) {
          const insertAfter = nextOrderLink.parentElement.nextSibling || nextOrderLink.parentElement;
          if (insertAfter && insertAfter.parentElement) {
            insertAfter.parentElement.insertBefore(redeemLink.parentElement || redeemLink, insertAfter.nextSibling);
          } else {
            navContainer.appendChild(redeemLink);
          }
        } else {
          navContainer.appendChild(redeemLink);
        }
        redeemRewardsInjected = true;
      }
    }
    function cleanupRedeemRewardsPage() {
      if (hiddenReactContentForRewards) {
        hiddenReactContentForRewards.style.display = '';
        hiddenReactContentForRewards = null;
      }
      if (rewardResizeHandler) {
        window.removeEventListener('resize', rewardResizeHandler);
        rewardResizeHandler = null;
      }
      if (redeemRewardsContainer && redeemRewardsContainer.parentElement) {
        redeemRewardsContainer.remove();
        redeemRewardsContainer = null;
      }
    }
    
    // Helper function to extract customer data from ReCharge object and scripts
    function getCustomerDataFromReCharge() {
      let customerData = null;
      
      // Try ReCharge object (new structure: window.ReCharge, old: window.Recharge)
      const rechargeObj = window.ReCharge || window.Recharge || window.recharge;
      
      if (rechargeObj) {
        // New structure: ReCharge.session
        if (rechargeObj.session && rechargeObj.session.customer_id) {
          customerData = {
            id: rechargeObj.session.customer_id,
            email: rechargeObj.customer?.email || null
          };
        }
        
        // Old structure: ReCharge.customer (backward compatibility)
        if (!customerData && rechargeObj.customer) {
          customerData = {
            id: rechargeObj.customer.id,
            email: rechargeObj.customer.email
          };
        }
      }
      
      // shopify_customer_id is NOT in ReCharge object - must get from scripts
      // Always parse scripts to find shopify_customer_id
      const scripts = document.querySelectorAll('script');
      let shopifyCustomerId = null;
      let foundInScript = false;
      
      for (const script of scripts) {
        const content = script.textContent || script.innerHTML || '';
        if (!content || content.length < 10) continue; // Skip empty or very short scripts
        
        // Try full JSON match first (shopify_customer_id, email, id) - more flexible pattern
        const fullJsonMatch = content.match(/"shopify_customer_id"\s*:\s*"([^"]+)"[^}]*"email"\s*:\s*"([^"]+)"[^}]*"id"\s*:\s*(\d+)/);
        if (fullJsonMatch) {
          shopifyCustomerId = fullJsonMatch[1];
          foundInScript = true;
          if (!customerData) {
            customerData = { 
              id: fullJsonMatch[3], 
              email: fullJsonMatch[2], 
              shopify_customer_id: fullJsonMatch[1] 
            };
          } else {
            customerData.shopify_customer_id = fullJsonMatch[1];
            if (!customerData.email) customerData.email = fullJsonMatch[2];
            if (!customerData.id) customerData.id = fullJsonMatch[3];
          }
          console.log('[ET] Found shopify_customer_id via full JSON match:', shopifyCustomerId);
          break;
        }
        
        // Try to find shopify_customer_id alone (multiple patterns)
        if (!shopifyCustomerId) {
          // Pattern 1: "shopify_customer_id": "value"
          let shopifyIdMatch = content.match(/"shopify_customer_id"\s*:\s*"([^"]+)"/i);
          // Pattern 2: shopify_customer_id: "value"
          if (!shopifyIdMatch) {
            shopifyIdMatch = content.match(/shopify_customer_id\s*:\s*"([^"]+)"/i);
          }
          // Pattern 3: 'shopify_customer_id': 'value'
          if (!shopifyIdMatch) {
            shopifyIdMatch = content.match(/['"]shopify_customer_id['"]\s*:\s*['"]([^'"]+)['"]/i);
          }
          // Pattern 4: shopifyCustomerId (camelCase)
          if (!shopifyIdMatch) {
            shopifyIdMatch = content.match(/"shopifyCustomerId"\s*:\s*"([^"]+)"/i);
          }
          if (!shopifyIdMatch) {
            shopifyIdMatch = content.match(/shopifyCustomerId\s*:\s*"([^"]+)"/i);
          }
          
          if (shopifyIdMatch) {
            shopifyCustomerId = shopifyIdMatch[1];
            foundInScript = true;
            if (customerData) {
              customerData.shopify_customer_id = shopifyIdMatch[1];
            } else {
              customerData = { shopify_customer_id: shopifyIdMatch[1] };
            }
            console.log('[ET] Found shopify_customer_id via pattern match:', shopifyCustomerId);
            break;
          }
        }
        
        // Try customer object match (more flexible)
        if (!customerData || !customerData.shopify_customer_id) {
          // Try to find larger customer object
          const jsonMatch = content.match(/(?:"customer"|customer)\s*:\s*(\{[^}]{0,2000}\})/);
          if (jsonMatch) {
            try {
              const customerObj = JSON.parse(jsonMatch[1]);
              const shopifyId = customerObj.shopify_customer_id || customerObj.shopifyCustomerId || customerObj.merchant_id || customerObj.external_id;
              if (shopifyId) {
                shopifyCustomerId = shopifyId;
                foundInScript = true;
                if (!customerData) {
                  customerData = { 
                    id: customerObj.id, 
                    email: customerObj.email, 
                    shopify_customer_id: shopifyId
                  };
                } else {
                  if (!customerData.email) customerData.email = customerObj.email;
                  if (!customerData.id) customerData.id = customerObj.id;
                  customerData.shopify_customer_id = shopifyId;
                }
                console.log('[ET] Found shopify_customer_id via customer object:', shopifyId);
                break;
              }
            } catch (e) {
              // Try to extract manually if JSON.parse fails
              const manualMatch = jsonMatch[1].match(/"shopify_customer_id"\s*:\s*"([^"]+)"/i);
              if (manualMatch) {
                shopifyCustomerId = manualMatch[1];
                foundInScript = true;
                if (customerData) {
                  customerData.shopify_customer_id = manualMatch[1];
                } else {
                  customerData = { shopify_customer_id: manualMatch[1] };
                }
                console.log('[ET] Found shopify_customer_id via manual extraction:', shopifyCustomerId);
                break;
              }
            }
          }
        }
        
        // Try customer match with id and email
        if (!customerData || !customerData.shopify_customer_id) {
          const customerMatch = content.match(/customer\s*:\s*\{[^}]*id\s*:\s*["']?([^"',\s}]+)["']?[^}]*email\s*:\s*["']([^"']+)["']/);
          if (customerMatch) {
            if (!customerData) {
              customerData = { id: customerMatch[1], email: customerMatch[2] };
            } else {
              if (!customerData.email) customerData.email = customerMatch[2];
              if (!customerData.id) customerData.id = customerMatch[1];
            }
            const shopifyIdMatch = content.match(/"shopify_customer_id"\s*:\s*"([^"]+)"/i);
            if (shopifyIdMatch) {
              customerData.shopify_customer_id = shopifyIdMatch[1];
              shopifyCustomerId = shopifyIdMatch[1];
              foundInScript = true;
              console.log('[ET] Found shopify_customer_id via customer match:', shopifyCustomerId);
              break;
            }
          }
        }
      }
      
      // If we have customerData but no shopify_customer_id, try one more comprehensive pass
      if (customerData && !customerData.shopify_customer_id) {
        for (const script of scripts) {
          const content = script.textContent || script.innerHTML || '';
          if (!content) continue;
          
          // Try all patterns again
          let shopifyIdMatch = content.match(/"shopify_customer_id"\s*:\s*"([^"]+)"/i);
          if (!shopifyIdMatch) {
            shopifyIdMatch = content.match(/shopify_customer_id\s*:\s*"([^"]+)"/i);
          }
          if (!shopifyIdMatch) {
            shopifyIdMatch = content.match(/"shopifyCustomerId"\s*:\s*"([^"]+)"/i);
          }
          if (!shopifyIdMatch) {
            shopifyIdMatch = content.match(/shopifyCustomerId\s*:\s*"([^"]+)"/i);
          }
          
          if (shopifyIdMatch) {
            customerData.shopify_customer_id = shopifyIdMatch[1];
            shopifyCustomerId = shopifyIdMatch[1];
            foundInScript = true;
            console.log('[ET] Found shopify_customer_id in final pass:', shopifyCustomerId);
            break;
          }
        }
      }
      
      // Debug logging
      if (!shopifyCustomerId) {
        console.warn('[ET] shopify_customer_id not found in scripts. Searched', scripts.length, 'scripts.');
        // Log a sample of script contents for debugging
        let sampleCount = 0;
        for (const script of scripts) {
          const content = script.textContent || script.innerHTML || '';
          if (content && content.length > 50 && content.includes('customer')) {
            console.log('[ET] Sample script with "customer":', content.substring(0, 200));
            sampleCount++;
            if (sampleCount >= 3) break;
          }
        }
      }
      
      return customerData;
    }
    function checkLoyaltyLionSDK() {
      return new Promise((resolve) => {
        if (window.loyaltylion && (typeof window.loyaltylion.getPoints === 'function' || typeof window.loyaltylion.getRewards === 'function')) {
          resolve(true);
          return;
        }
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.loyaltylion && (typeof window.loyaltylion.getPoints === 'function' || typeof window.loyaltylion.getRewards === 'function')) {
            clearInterval(checkInterval);
            resolve(true);
          } else if (attempts >= 30) {
            clearInterval(checkInterval);
            resolve(false);
          }
        }, 200);
      });
    }
    async function fetchRewardsFromAPI(customerData, container) {
      const LOYALTYLION_API_KEY = 'pat_792c5ad004fb46e3802c955a83f7ba15';
      const LOYALTYLION_API_BASE = 'https://api.loyaltylion.com/v2';
      if (!LOYALTYLION_API_KEY || !LOYALTYLION_API_KEY.startsWith('pat_') || LOYALTYLION_API_KEY.length <= 20) {
        const sdkAvailable = await checkLoyaltyLionSDK();
        if (sdkAvailable && window.loyaltylion) {
          await trySDKMethods(customerData, container);
          return;
        }
        await fetchRewardsFromPageHTML(customerData, container);
        return;
      }
      try {
        const authHeader = 'Bearer ' + LOYALTYLION_API_KEY;
        let loyaltyLionCustomerId = null;
        let merchantIdFromApi = null; // Store merchant_id from API response
        let points = 0;
        let pendingPoints = 0;
        if (customerData.shopify_customer_id) {
          try {
            const searchUrl = `${LOYALTYLION_API_BASE}/customers?merchant_id=${encodeURIComponent(customerData.shopify_customer_id)}`;
            const response = await fetch(searchUrl, {
              method: 'GET',
              headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
            });
            if (response.ok) {
              const data = await response.json();
              if (data.customers && data.customers.length > 0) {
                const customer = data.customers.find(c => {
                  const mid = c.merchant_id || c.shopify_customer_id || c.external_id;
                  return mid && String(mid) === String(customerData.shopify_customer_id);
                });
                if (customer) {
                  loyaltyLionCustomerId = customer.id;
                  // Store merchant_id from API response (this is what we need for endpoints)
                  merchantIdFromApi = customer.merchant_id || customer.shopify_customer_id || customer.external_id;
                  points = customer.points_approved || customer.points?.current || customer.points?.total || customer.points || customer.current_points || 0;
                  pendingPoints = customer.points_pending || customer.points?.pending || 0;
                }
              }
            } else {
              console.error('[ET] Customer search failed:', response.status, response.statusText);
              const errorText = await response.text();
              console.error('[ET] Search error details:', errorText);
            }
          } catch (e) {
            console.error('[ET] Customer search error:', e);
          }
        }
        if (!loyaltyLionCustomerId && customerData.email) {
          try {
            const searchUrl = `${LOYALTYLION_API_BASE}/customers?email=${encodeURIComponent(customerData.email)}`;
            const response = await fetch(searchUrl, {
              method: 'GET',
              headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
            });
            if (response.ok) {
              const data = await response.json();
              if (data.customers && data.customers.length > 0) {
                const customer = customerData.shopify_customer_id
                  ? data.customers.find(c => {
                      const mid = c.merchant_id || c.shopify_customer_id || c.external_id;
                      return mid && String(mid) === String(customerData.shopify_customer_id);
                    })
                  : data.customers[0];
                if (customer) {
                  loyaltyLionCustomerId = customer.id;
                  // Store merchant_id from API response (this is what we need for endpoints)
                  merchantIdFromApi = customer.merchant_id || customer.shopify_customer_id || customer.external_id;
                  points = customer.points_approved || customer.points?.current || customer.points?.total || customer.points || customer.current_points || 0;
                  pendingPoints = customer.points_pending || customer.points?.pending || 0;
                }
              }
            }
          } catch (e) {
            console.error('[ET] Email search error:', e);
          }
        }
        if (!loyaltyLionCustomerId) {
          throw new Error('Could not find customer in LoyaltyLion');
        }
        const pointsDisplay = document.getElementById('et-current-points');
        if (pointsDisplay) {
          pointsDisplay.textContent = points + ' points';
        }
        const pendingDisplay = document.getElementById('et-pending-points');
        if (pendingDisplay && pendingPoints > 0) {
          pendingDisplay.textContent = `(${pendingPoints} pending)`;
        }
        let rewards = [];
        let vouchers = [];
        const merchantIdForApi = merchantIdFromApi || customerData.shopify_customer_id;
        
        if (!merchantIdForApi) {
          console.error('[ET] No merchant_id available for API calls');
          throw new Error('Merchant ID required for API calls');
        }
        try {
          const rewardsUrl = `${LOYALTYLION_API_BASE}/customers/${merchantIdForApi}/available_rewards`;
          const response = await fetch(rewardsUrl, {
            method: 'GET',
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
          });
          if (response.ok) {
            const data = await response.json();
            let allRewards = [];
            if (data.rewards && Array.isArray(data.rewards)) {
              allRewards = data.rewards;
            } else if (Array.isArray(data)) {
              allRewards = data;
            } else if (data.data && Array.isArray(data.data)) {
              allRewards = data.data;
            }
            console.log('[ET] Total rewards from available_rewards API:', allRewards.length);
            if (allRewards.length > 0) {
              console.log('[ET] First reward structure:', JSON.stringify(allRewards[0], null, 2));
              console.log('[ET] First reward keys:', Object.keys(allRewards[0]));
            }
            rewards = allRewards.filter(r => {
              const requiredPoints = (r.point_cost !== undefined && r.point_cost !== null) 
                                    ? r.point_cost 
                                    : (r.points || r.points_required || 0);
              const isActive = !r.status || (r.status !== 'inactive' && r.status !== 'disabled' && 
                              r.status !== 'archived' && r.status !== 'deleted');
              const isNotClaimed = !r.claimed && !r.redeemed && r.status !== 'claimed';
              const purchaseTypeRaw = r.purchase_type || r.purchaseType || r.purchase_type_id || (r.purchase_type && typeof r.purchase_type === 'object' ? (r.purchase_type.name || r.purchase_type.value || r.purchase_type.id || '') : '') || '';
              const purchaseType = String(purchaseTypeRaw).toLowerCase();
              const rewardName = String(r.name || r.title || '').toLowerCase();
              const rewardDesc = String(r.description || '').toLowerCase();
              const isSubscription = purchaseType === 'subscription' || purchaseType === 'recurring' || purchaseType.includes('subscription') || rewardName.includes('subscription') || rewardDesc.includes('subscription') || rewardName.includes('new subscription') || rewardDesc.includes('new subscription') || rewardDesc.includes('all future payments');
              if (!isSubscription && isActive && isNotClaimed) {
                console.log('[ET] Reward filtered out (not subscription):', {
                  id: r.id,
                  name: r.name || r.title,
                  purchase_type_raw: purchaseTypeRaw,
                  purchase_type_lower: purchaseType
                });
              }
              return isActive && isNotClaimed && isSubscription;
            });
            console.log('[ET] Filtered subscription rewards:', rewards.length);
          } else {
            console.error('[ET] Available rewards API error:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('[ET] Error details:', errorText);
          }
        } catch (e) {
          console.error('[ET] Error fetching rewards:', e);
        }
            const formattedRewards = rewards.map(r => {
                const requiredPoints = (r.point_cost !== undefined && r.point_cost !== null) 
                                ? r.point_cost 
                                : (r.points || r.points_required || 0);
          const canAfford = points >= requiredPoints;
          
          const value = r.discount_amount || r.value || r.amount || '0';
          return {
            id: r.id, // CRITICAL: Use the actual reward ID from API - don't generate fallback IDs
            name: r.name || r.title || `$${value} voucher`,
            price: value,
            points: requiredPoints,
            canAfford: canAfford,
            description: r.description || '',
            code: r.code || r.voucher_code || ''
          };
        });
      const allItems = formattedRewards;
        if (allItems.length > 0) {
          renderRewardsList(allItems, container);
        } else {
          const widgetContainer = container.querySelector('[data-lion-rewards-list]') || container.querySelector('#et-lion-rewards-list') || document.getElementById('et-lion-rewards-list');
          if (widgetContainer) {
            widgetContainer.innerHTML = `<div style="text-align: center; padding: 40px 20px;"><div style="font-size: 16px; margin-bottom: 8px; color: #666;">No rewards available</div><div style="font-size: 14px; color: #999;">You currently have ${points} points. Check back later for new rewards!</div></div>`;
          }
        }
      } catch (error) {
        console.error('[ET] Error fetching from API:', error);
        const widgetContainer = container.querySelector('[data-lion-rewards-list]') || container.querySelector('#et-lion-rewards-list') || document.getElementById('et-lion-rewards-list');
        if (widgetContainer) {
          widgetContainer.innerHTML = `<div style="text-align: center; padding: 40px 20px;"><div style="font-size: 16px; margin-bottom: 8px; color: #d32f2f;">API Error</div><div style="font-size: 14px; color: #666;">${error.message || 'Failed to fetch rewards'}</div></div>`;
        }
        const sdkAvailable = await checkLoyaltyLionSDK();
        if (sdkAvailable && window.loyaltylion) {
          await trySDKMethods(customerData, container);
        } else {
          await fetchRewardsFromPageHTML(customerData, container);
        }
      }
    }
    async function trySDKMethods(customerData, container) {
      if (!window.loyaltylion) return false;
      try {
        if (typeof window.loyaltylion.getPoints === 'function') {
          const pointsData = await window.loyaltylion.getPoints();
          const pointsDisplay = document.getElementById('et-current-points');
          if (pointsDisplay && pointsData) {
            const points = pointsData.current || pointsData.total || 0;
            pointsDisplay.textContent = points + ' points';
            if (pointsData.pending) {
              const pendingDisplay = document.getElementById('et-pending-points');
              if (pendingDisplay) pendingDisplay.textContent = `(${pointsData.pending} pending)`;
            }
          }
        }
        if (typeof window.loyaltylion.getRewards === 'function') {
          const rewardsData = await window.loyaltylion.getRewards();
          if (rewardsData && Array.isArray(rewardsData) && rewardsData.length > 0) {
            renderRewardsList(rewardsData, container);
            return true;
          }
        }
      } catch (e) {
        console.error('[ET] SDK error:', e);
      }
      return false;
    }
    async function fetchRewardsFromPageHTML(customerData, container) {
      const currentUrl = window.location.href;
      let rewardsPageUrl = null;
      const urlPatterns = [];
      if (currentUrl.includes('myshopify.com')) {
        const storeMatch = currentUrl.match(/https?:\/\/([^\.]+)\.myshopify\.com/);
        if (storeMatch) {
          urlPatterns.push(`https://${storeMatch[1]}.myshopify.com/account/pages/42026b1f-3325-417d-853a-8da8af55312b`);
          urlPatterns.push(`https://${storeMatch[1]}.myshopify.com/pages/42026b1f-3325-417d-853a-8da8af55312b`);
          urlPatterns.push(`https://${storeMatch[1]}.myshopify.com/account/rewards`);
          urlPatterns.push(`https://${storeMatch[1]}.myshopify.com/rewards`);
        }
      } else if (currentUrl.includes('shopify.com')) {
        const match = currentUrl.match(/(https?:\/\/[^\/]+shopify\.com\/\d+\/account)/);
        if (match) {
          urlPatterns.push(match[1] + '/pages/42026b1f-3325-417d-853a-8da8af55312b');
          urlPatterns.push(match[1] + '/rewards');
        }
      }
      const rewardsLinks = Array.from(document.querySelectorAll('a')).filter(a => {
        const text = (a.textContent || '').toLowerCase();
        const href = (a.getAttribute('href') || '').toLowerCase();
        return (text.includes('reward') || href.includes('reward')) && !href.includes('#');
      });
      if (rewardsLinks.length > 0) {
        const href = rewardsLinks[0].getAttribute('href');
        if (href && !href.startsWith('#')) {
          const fullUrl = href.startsWith('http') ? href : new URL(href, window.location.origin).href;
          urlPatterns.unshift(fullUrl);
        }
      }
      if (urlPatterns.length === 0) {
        throw new Error('Could not determine rewards page URL');
      }
      for (const url of urlPatterns) {
        try {
          const response = await fetch(url, { credentials: 'include', headers: { 'Accept': 'text/html' } });
          if (response.ok) {
            rewardsPageUrl = url;
            break;
          }
        } catch (e) {}
      }
      if (!rewardsPageUrl) {
        throw new Error('Could not fetch rewards page');
      }
      try {
        const response = await fetch(rewardsPageUrl, {
          credentials: 'include',
          headers: {
            'Accept': 'text/html'
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const pointsText = doc.body.textContent || '';
        let points = null;
        const pointsMatch = pointsText.match(/(\d+)\s*points?/i);
        if (pointsMatch) {
          const candidate = parseInt(pointsMatch[1]);
          if (candidate >= 0 && candidate <= 10000) {
            points = candidate;
          }
        }
        if (points !== null) {
          const pointsDisplay = document.getElementById('et-current-points');
          if (pointsDisplay) {
            pointsDisplay.textContent = points + ' points';
          }
        }
        const rewards = [];
        const seenRewards = new Set();
        const currentPoints = parseInt(document.getElementById('et-current-points')?.textContent || '0');
        const rewardButtons = doc.querySelectorAll('button, a, [class*="reward"], [class*="redeem"], [data-reward], [data-points]');
        rewardButtons.forEach(btn => {
          const text = (btn.textContent || '').toLowerCase();
          const priceMatch = text.match(/\$(\d+(?:\.\d+)?)/);
          const pointsMatch = text.match(/(\d+)\s*points?/i);
          if (priceMatch && pointsMatch) {
            const price = priceMatch[1];
            const points = parseInt(pointsMatch[1]);
            if (points >= 100 && points <= 10000) {
              const rewardKey = `${price}-${points}`;
              if (!seenRewards.has(rewardKey)) {
                seenRewards.add(rewardKey);
                rewards.push({
                  id: `reward-${rewardKey}`,
                  name: `$${price} voucher`,
                  price: price,
                  points: points,
                  canAfford: currentPoints >= points
                });
              }
            }
          }
        });
        const rewardPatterns = [/\$(\d+(?:\.\d+)?)\s*(?:voucher|discount|reward|off)[^]{0,500}?(\d+)\s*points?/gi, /(\d+)\s*points?\s*(?:for|to|redeem)\s*\$(\d+(?:\.\d+)?)\s*(?:voucher|discount|reward)/gi];
        rewardPatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(pointsText)) !== null) {
            const price = match[1];
            const points = parseInt(match[2]);
            if (points >= 100 && points <= 10000 && price) {
              const rewardKey = `${price}-${points}`;
              if (!seenRewards.has(rewardKey)) {
                seenRewards.add(rewardKey);
                rewards.push({ id: `reward-${rewardKey}`, name: `$${price} voucher`, price: price, points: points, canAfford: currentPoints >= points });
              }
            }
          }
        });
        const scripts = doc.querySelectorAll('script[type="application/json"], script[type="application/ld+json"]');
        scripts.forEach(script => {
          try {
            const data = JSON.parse(script.textContent || '{}');
            const rewardsData = data.rewards || data.offers || (Array.isArray(data) ? data : []);
            if (Array.isArray(rewardsData)) {
              rewardsData.forEach(reward => {
                if (reward.points && reward.price) {
                  const rewardKey = `${reward.price}-${reward.points}`;
                  if (!seenRewards.has(rewardKey)) {
                    seenRewards.add(rewardKey);
                    rewards.push({ id: `reward-${rewardKey}`, name: reward.name || `$${reward.price} voucher`, price: reward.price.toString(), points: parseInt(reward.points), canAfford: currentPoints >= parseInt(reward.points) });
                  }
                }
              });
            }
          } catch (e) {}
        });
        const uniqueRewards = Array.from(new Map(rewards.map(r => [r.id, r])).values());
        uniqueRewards.sort((a, b) => a.points - b.points);
        if (uniqueRewards.length > 0) {
          renderRewardsList(uniqueRewards, container);
        } else {
          throw new Error('No rewards found on page');
        }
      } catch (error) {
        console.error('[ET] Error fetching rewards page:', error);
        throw error;
      }
    }
    
    // Function to render rewards list
    function renderRewardsList(rewards, container) {
      const widgetContainer = container.querySelector('[data-lion-rewards-list]') ||
                            container.querySelector('#et-lion-rewards-list') ||
                            document.getElementById('et-lion-rewards-list');
      if (!widgetContainer) return;
      widgetContainer.innerHTML = '';
      const currentPointsText = document.getElementById('et-current-points')?.textContent || '0 points';
      const currentPoints = parseInt(currentPointsText.match(/\d+/)?.[0] || '0');
      if (rewards.length === 0) {
        widgetContainer.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; color: #999;">
            <div style="font-size: 16px; margin-bottom: 8px;">No rewards available</div>
            <div style="font-size: 14px;">You need more points to redeem rewards, or rewards are not configured.</div>
          </div>
        `;
        return;
      }
      // Filter out rewards without IDs (they're invalid)
      const validRewards = rewards.filter(r => r.id);
      const uniqueRewards = Array.from(new Map(validRewards.map(r => [r.id, r])).values());
      const rewardsHTML = uniqueRewards.map(reward => {
        // Use canAfford from reward object (calculated correctly with point_cost)
        // Fall back to recalculating if not available
        const rewardPoints = reward.points || reward.points_required || 0;
        const canAfford = reward.canAfford !== undefined ? reward.canAfford : (currentPoints >= rewardPoints);
        const rewardName = reward.name || reward.title || `$${reward.price || reward.value || reward.amount} voucher`;
        // CRITICAL: Use the actual reward ID - don't generate fallback IDs
        const rewardId = reward.id;
        const hasCode = reward.code && reward.code.trim() !== '';
        return `
        <div class="lion-rewards-list" data-lion-widget="rewards-list"></div>
  
          <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background: ${canAfford || hasCode ? '#fff' : '#f9f9f9'}; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1;">
                <div style="font-size: 20px; font-weight: 700; color: #222; margin-bottom: 4px;">${rewardName}</div>
                ${rewardPoints > 0 ? `<div style="font-size: 14px; color: #666;">${rewardPoints} points required</div>` : ''}
                ${hasCode ? `
                  <div style="margin-top: 8px; padding: 8px 12px; background: #f0f8f7; border: 1px dashed #0d3c3a; border-radius: 4px; display: inline-block;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Voucher Code:</div>
                    <div style="font-size: 16px; font-weight: 700; color: #0d3c3a; font-family: monospace; letter-spacing: 1px;">${reward.code}</div>
                    <button onclick="window.etCopyCode('${reward.code.replace(/'/g, "\\'")}')" 
                            style="margin-top: 6px; padding: 4px 12px; background: #0d3c3a; color: #fff; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                      Copy Code
                    </button>
                  </div>
                ` : ''}
                ${reward.description ? `<div style="font-size: 12px; color: #999; margin-top: 4px;">${reward.description}</div>` : ''}
              </div>
              <div style="margin-left: 16px;">
                ${hasCode ? `
                  <button onclick="window.etApplyCode('${reward.code.replace(/'/g, "\\'")}')"
                          style="padding: 10px 20px; background: #0d3c3a; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; white-space: nowrap;">
                    Apply Code
                  </button>
                ` : canAfford ? `
                  <button onclick="window.etRedeemReward('${rewardId}', ${rewardPoints}, '${rewardName.replace(/'/g, "\\'")}')"
                          style="padding: 10px 20px; background: #0d3c3a; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; white-space: nowrap;">
                    Redeem
                  </button>
                ` : `
                  <div style="padding: 10px 20px; background: #e0e0e0; color: #999; border-radius: 6px; font-weight: 600; white-space: nowrap;">
                    More points needed
                  </div>
                `}
              </div>
            </div>
          </div>
        `;
      }).join('');
      widgetContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${rewardsHTML}
        </div>
      `;
    }
    
    // Function to show voucher code in a modal popup (like LoyaltyLion)
    // Define globally so it's accessible from anywhere
    window.showVoucherCodeModal = function(rewardName, voucherCode) {
        
        // Remove any existing modal
        const existingModal = document.getElementById('et-voucher-code-modal');
        if (existingModal) {
          existingModal.remove();
        }
        
        // Create modal overlay
        const modal = document.createElement('div');
        modal.id = 'et-voucher-code-modal';
        modal.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: rgba(0, 0, 0, 0.5) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 999999 !important;
        `;
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
          background: white !important;
          border-radius: 12px !important;
          padding: 0 !important;
          max-width: 500px !important;
          width: 90% !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
          position: relative !important;
          z-index: 1000000 !important;
        `;
        
        modalContent.innerHTML = `
          <div style="background: #0d3c3a; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 600;color: #fff;">${rewardName}</h2>
            <button id="et-close-voucher-modal" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">&times;</button>
          </div>
          <div style="padding: 32px 24px;">
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #666;">Your new voucher code is below. All your rewards can be viewed anytime on this page.</p>
            <div style="margin-bottom: 24px;">
              <label style="display: block; font-size: 14px; color: #666; margin-bottom: 8px; font-weight: 500;">Code</label>
              <div style="position: relative;">
                <input type="text" id="et-voucher-code-input" value="${voucherCode}" readonly 
                      style="width: 100%; padding: 12px 16px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 18px; font-weight: 700; font-family: monospace; letter-spacing: 2px; background: #f8f9fa; color: #0d3c3a; box-sizing: border-box;">
                <button id="et-copy-voucher-code" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: #0d3c3a; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600;">Copy</button>
              </div>
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button id="et-close-voucher-modal-btn" style="padding: 12px 24px; background: #0d3c3a; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">Close</button>
            </div>
          </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Force modal to be visible immediately
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        
        // Close modal handlers
        const closeModal = () => {
          modal.style.animation = 'fadeOut 0.3s ease';
          setTimeout(() => modal.remove(), 300);
        };
        
        document.getElementById('et-close-voucher-modal').addEventListener('click', closeModal);
        document.getElementById('et-close-voucher-modal-btn').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal();
        });
        
        // Copy code handler - auto-copy when modal opens
        const input = document.getElementById('et-voucher-code-input');
        const copyBtn = document.getElementById('et-copy-voucher-code');
        
        // Auto-select and copy code when modal opens
        setTimeout(() => {
          input.select();
          input.setSelectionRange(0, 99999); // For mobile devices
          try {
            document.execCommand('copy');
            copyBtn.textContent = 'Copied!';
            copyBtn.style.background = '#4caf50';
            setTimeout(() => {
              copyBtn.textContent = 'Copy';
              copyBtn.style.background = '#0d3c3a';
            }, 2000);
          } catch (err) {
            console.error('Auto-copy failed:', err);
          }
          
          // Close modal after copying (give user a moment to see it was copied)
          setTimeout(async () => {
            closeModal();
            
            // Auto-apply discount code immediately after modal closes
            const redemptionContext = etLastSubscriptionContext || null;
            if (typeof window.etApplyCode === 'function') {
              console.log('[ET] ===== Auto-applying discount code after modal close =====');
              console.log('[ET] Code:', voucherCode);
              console.log('[ET] Context:', redemptionContext);
              
              // Apply immediately after modal closes
              try {
                const applied = await window.etApplyCode(voucherCode, redemptionContext);
                if (applied) {
                  console.log('[ET] ✓✓✓ Discount code applied successfully!');
                } else {
                  console.warn('[ET] Failed to auto-apply discount code, user may need to apply manually');
                }
              } catch (error) {
                console.error('[ET] Error applying discount code:', error);
              }
            } else {
              console.warn('[ET] etApplyCode function not found, cannot auto-apply discount code');
            }
          }, 1000); // Close modal 1 second after copying (reduced from 1.5s for faster flow)
        }, 100);
        
        // Manual copy button handler
        copyBtn.addEventListener('click', () => {
          input.select();
          input.setSelectionRange(0, 99999); // For mobile devices
          try {
            document.execCommand('copy');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.background = '#4caf50';
            setTimeout(() => {
              copyBtn.textContent = originalText;
              copyBtn.style.background = '#0d3c3a';
            }, 2000);
          } catch (err) {
            // Fallback for modern browsers
            if (navigator.clipboard) {
              navigator.clipboard.writeText(voucherCode).then(() => {
                copyBtn.textContent = 'Copied!';
                copyBtn.style.background = '#4caf50';
                setTimeout(() => {
                  copyBtn.textContent = 'Copy';
                  copyBtn.style.background = '#0d3c3a';
                }, 2000);
              });
            }
          }
        });
      }
      
    window.etRedeemReward = async function(rewardId, pointsRequired, name) {
        // Don't check points before redemption - let the API handle it
        // The API will return an error if points are insufficient, and we'll handle that
        
        // Redeem reward directly using LoyaltyLion API
        const LOYALTYLION_API_KEY = 'pat_792c5ad004fb46e3802c955a83f7ba15';
        const LOYALTYLION_API_BASE = 'https://api.loyaltylion.com/v2';
        const authHeader = 'Bearer ' + LOYALTYLION_API_KEY;
        
        // Get merchant_id from customer data using helper function
        let customerData = getCustomerDataFromReCharge();
        let merchantId = customerData?.shopify_customer_id;
        
        // If shopify_customer_id not found, try to look it up via LoyaltyLion API
        if (!merchantId && customerData && customerData.email) {
          console.warn('[ET] shopify_customer_id not found in scripts. Looking up via LoyaltyLion API using email...');
          
          try {
            // Look up customer by email in LoyaltyLion API
            const searchUrl = `${LOYALTYLION_API_BASE}/customers?email=${encodeURIComponent(customerData.email)}`;
            const response = await fetch(searchUrl, {
              method: 'GET',
              headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.customers && data.customers.length > 0) {
                // Find the matching customer
                const customer = data.customers.find(c => {
                  // Match by email
                  return c.email && c.email.toLowerCase() === customerData.email.toLowerCase();
                }) || data.customers[0];
                
                if (customer) {
                  // Get the shopify_customer_id (merchant_id) from the API response
                  merchantId = customer.merchant_id || customer.shopify_customer_id || customer.external_id;
                  if (merchantId) {
                    customerData.shopify_customer_id = merchantId;
                    console.log('[ET] Found shopify_customer_id via LoyaltyLion API:', merchantId);
                  }
                }
              }
            } else {
              console.error('[ET] LoyaltyLion API lookup failed:', response.status, response.statusText);
            }
          } catch (e) {
            console.error('[ET] Error looking up customer via LoyaltyLion API:', e);
          }
        }
        
        // If still not found, try one more time to find shopify_customer_id in scripts with a delay
        if (!merchantId) {
          const rechargeObj = window.ReCharge || window.Recharge || window.recharge;
          if (rechargeObj?.session?.customer_id) {
            console.warn('[ET] shopify_customer_id still not found. Checking scripts again...');
            
            // Wait a bit and check scripts again
            await new Promise(resolve => setTimeout(resolve, 500));
            customerData = getCustomerDataFromReCharge();
            merchantId = customerData?.shopify_customer_id;
          }
        }
        
        if (!merchantId) {
          console.error('[ET] Customer ID extraction failed.');
          const rechargeObj = window.ReCharge || window.Recharge || window.recharge;
          console.error('[ET] ReCharge object:', rechargeObj);
          console.error('[ET] ReCharge.session:', rechargeObj?.session);
          console.error('[ET] ReCharge.customer:', rechargeObj?.customer);
          console.error('[ET] Customer data found:', customerData);
          console.error('[ET] Available window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('recharge')));
          
          alert('Unable to find customer ID. Please refresh the page and try again.');
          return;
        }
        
        // Show loading state
        const redeemButton = event?.target || document.querySelector(`button[onclick*="etRedeemReward('${rewardId}'"]`);
        const originalText = redeemButton?.textContent;
        if (redeemButton) {
          redeemButton.disabled = true;
          redeemButton.textContent = 'Redeeming...';
        }
        
        try {
          // Redeem the reward using LoyaltyLion API
          const redeemUrl = `${LOYALTYLION_API_BASE}/customers/${merchantId}/claimed_rewards`;
          const response = await fetch(redeemUrl, {
            method: 'POST',
            headers: { 
              'Authorization': authHeader, 
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
              reward_id: parseInt(rewardId) || rewardId,
              multiplier: 1
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            // Extract voucher code from redemption response
            // The API returns: { claimed_reward: { redeemable: { code: "..." } } }
            // This is the correct code that matches LoyaltyLion portal
            let voucherCode = null;
            
            // First, try the correct path from redemption response
            if (data.claimed_reward && data.claimed_reward.redeemable) {
              voucherCode = data.claimed_reward.redeemable.code || 
                          data.claimed_reward.redeemable.voucher_code;
            }
            
            // Fallback to other possible locations
            if (!voucherCode) {
              voucherCode = data.redeemable?.voucher_code || 
                          data.redeemable?.code ||
                          data.voucher_code || 
                          data.code || 
                          data.voucher?.code ||
                          data.voucher?.voucher_code ||
                          data.claim?.voucher_code ||
                          data.claim?.code;
            }
            
            // Validate voucher code
            if (voucherCode && typeof voucherCode === 'string' && voucherCode.trim() !== '') {
              console.log('[ET] ===== Reward redeemed successfully =====');
              console.log('[ET] Voucher code:', voucherCode);
              console.log('[ET] Voucher code type:', typeof voucherCode);
              console.log('[ET] Voucher code length:', voucherCode.length);
              console.log('[ET] Reward name:', name);
              
              // Close the rewards modal immediately
              const rewardsModal = document.getElementById('et-redeem-rewards-modal');
              if (rewardsModal) {
                console.log('[ET] Closing rewards modal...');
                rewardsModal.remove();
              }
              
              // Also close any voucher code modal that might be open
              const voucherModal = document.getElementById('et-voucher-code-modal');
              if (voucherModal) {
                console.log('[ET] Closing voucher code modal if open...');
                voucherModal.remove();
              }
              
              // Get the redemption context (subscription info)
              const redemptionContext = etLastSubscriptionContext || null;
              console.log('[ET] ===== Redemption context check =====');
              console.log('[ET] Redemption context:', redemptionContext);
              console.log('[ET] Context addressId:', redemptionContext?.addressId);
              console.log('[ET] Context subscriptionCard:', redemptionContext?.subscriptionCard ? 'present' : 'missing');
              
              // Automatically apply the discount code immediately
              // No need to show voucher code modal - apply directly
              if (typeof window.etApplyCode === 'function') {
                console.log('[ET] ===== Auto-applying discount code =====');
                console.log('[ET] Code to apply:', voucherCode);
                console.log('[ET] Code is valid string:', typeof voucherCode === 'string' && voucherCode.trim() !== '');
                console.log('[ET] Passing context to etApplyCode:', redemptionContext);
                
                // Apply immediately (no delay needed - modal is already closed)
                (async () => {
                  try {
                    console.log('[ET] ===== Calling etApplyCode NOW =====');
                    console.log('[ET] Code:', voucherCode);
                    console.log('[ET] Context:', redemptionContext);
                    const applied = await window.etApplyCode(voucherCode, redemptionContext);
                    if (applied) {
                      console.log('[ET] ✓✓✓✓✓ Discount code applied successfully!');
                    } else {
                      console.warn('[ET] ⚠️ etApplyCode returned false - discount may not have been applied');
                    }
                  } catch (error) {
                    console.error('[ET] ✗✗✗ Error applying discount code:', error);
                    console.error('[ET] Error stack:', error.stack);
                  }
                })();
              } else {
                console.error('[ET] ✗ etApplyCode function not found!');
              }
            } else {
              // Voucher code is null, empty, or invalid
              console.error('[ET] ✗ Invalid or missing voucher code:', voucherCode);
              console.error('[ET] Voucher code type:', typeof voucherCode);
              console.error('[ET] Full redemption response:', data);
              
              // Try to fetch the voucher code from the vouchers endpoint
              try {
                const vouchersUrl = `${LOYALTYLION_API_BASE}/vouchers?merchant_id=${merchantId}`;
                const vouchersResponse = await fetch(vouchersUrl, {
                  method: 'GET',
                  headers: { 
                    'Authorization': authHeader
                  }
                });
                
                if (vouchersResponse.ok) {
                  const vouchersData = await vouchersResponse.json();
                  // Find the most recent voucher for this reward
                  const vouchers = vouchersData.vouchers || vouchersData.data || vouchersData || [];
                  const recentVoucher = Array.isArray(vouchers) ? vouchers.find(v => 
                    v.reward_id === parseInt(rewardId) || v.reward?.id === parseInt(rewardId)
                  ) : null;
                  
                  if (recentVoucher) {
                    const foundCode = recentVoucher.code || recentVoucher.voucher_code || recentVoucher.code_value;
                    if (foundCode) {
                      console.log('[ET] Found voucher code from vouchers endpoint:', foundCode);
                      // Apply the code directly instead of showing modal
                      const redemptionContext = etLastSubscriptionContext || null;
                      if (typeof window.etApplyCode === 'function') {
                        console.log('[ET] Auto-applying found voucher code:', foundCode);
                        (async () => {
                          try {
                            const applied = await window.etApplyCode(foundCode, redemptionContext);
                            if (applied) {
                              console.log('[ET] ✓✓✓ Discount code applied successfully from vouchers endpoint!');
                            }
                          } catch (error) {
                            console.error('[ET] Error applying code from vouchers endpoint:', error);
                          }
                        })();
                        return;
                      }
                    }
                  }
                }
              } catch (voucherError) {
                console.error('[ET] Error fetching vouchers:', voucherError);
              }
              
              // If we still don't have a code, show alert
              alert(`${name} redeemed successfully! Please check your account for the voucher code.`);
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            }
          } else {
            const errorText = await response.text();
            let errorMessage = `Failed to redeem ${name}.`;
            
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.error && errorData.error.message) {
                if (errorData.error.message.includes('Insufficient points')) {
                  const currentPointsText = document.getElementById('et-current-points')?.textContent || '0 points';
                  const currentPoints = parseInt(currentPointsText.match(/\d+/)?.[0] || '0');
                  errorMessage = `Insufficient points!\n\nYou have ${currentPoints} points, but ${name} requires ${pointsRequired} points.\n\nYou need ${pointsRequired - currentPoints} more points to redeem this reward.`;
                } else {
                  errorMessage = `Failed to redeem ${name}.\n\nError: ${errorData.error.message}`;
                }
              }
            } catch (e) {
              // If error text is not JSON, use default message
            }
            
            console.error('[ET] Redemption error:', response.status, errorText);
            alert(errorMessage);
          }
        } catch (error) {
          console.error('[ET] Redemption error:', error);
          alert(`Error redeeming ${name}. Please try again.`);
        } finally {
          if (redeemButton) {
            redeemButton.disabled = false;
            redeemButton.textContent = originalText || 'Redeem';
          }
        }
      };
    window.etCopyCode = function(code) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(() => {
            alert(`Code "${code}" copied to clipboard!`);
          }).catch(() => fallbackCopyCode(code));
        } else {
          fallbackCopyCode(code);
        }
      };
    function fallbackCopyCode(code) {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          alert(`Code "${code}" copied to clipboard!`);
        } catch (err) {
          prompt('Copy this code:', code);
        }
        document.body.removeChild(textarea);
      }
    window.etApplyCode = async function(code, context) {
      console.log('[ET] ===== etApplyCode called =====');
      console.log('[ET] Code received:', code);
      console.log('[ET] Context received:', context);
      console.log('[ET] etLastSubscriptionContext:', etLastSubscriptionContext);
      
      const mergedContext = context || etLastSubscriptionContext || null;
      console.log('[ET] Merged context:', mergedContext);
      console.log('[ET] Merged context addressId:', mergedContext?.addressId);
      
      return await applyDiscountCode(code, mergedContext);
    };
    // Prevent multiple simultaneous API calls
    let isApplyingDiscount = false;
    let lastAppliedCode = null;
    
    // Function to force refresh Recharge UI components (simplified to avoid URL manipulation)
    function forceRechargeRefresh() {
      console.log('[ET] ===== Forcing Recharge UI refresh =====');
      
      // 1. Dispatch update events (avoid location::change to prevent URL manipulation)
      window.dispatchEvent(new CustomEvent('Recharge::update', { bubbles: true }));
      window.dispatchEvent(new CustomEvent('Recharge::order::updated', { bubbles: true }));
      if (lastAppliedCode) {
        window.dispatchEvent(new CustomEvent('Recharge::discount::applied', {
          detail: { code: lastAppliedCode },
          bubbles: true
        }));
      }
      window.dispatchEvent(new CustomEvent('Recharge::subscription::updated', { bubbles: true }));
      
      // 2. Call Recharge SDK methods if available
      const recharge = window.recharge || window.ReCharge || window.Recharge;
      if (recharge) {
        if (typeof recharge.update === 'function') {
          try {
            recharge.update();
            console.log('[ET] Called recharge.update()');
          } catch (e) {
            console.warn('[ET] recharge.update() failed:', e);
          }
        }
        if (typeof recharge.refresh === 'function') {
          try {
            recharge.refresh();
            console.log('[ET] Called recharge.refresh()');
          } catch (e) {
            console.warn('[ET] recharge.refresh() failed:', e);
          }
        }
      }
      
      // 3. Try to reload subscription data using SDK
      if (recharge && recharge.subscription && typeof recharge.subscription.listSubscriptions === 'function' && recharge.session) {
        try {
          recharge.subscription.listSubscriptions(recharge.session).then(() => {
            console.log('[ET] Subscription data reloaded');
            window.dispatchEvent(new CustomEvent('Recharge::update', { bubbles: true }));
            window.dispatchEvent(new CustomEvent('Recharge::order::updated', { bubbles: true }));
          }).catch(e => {
            console.warn('[ET] Failed to reload subscriptions:', e);
          });
        } catch (e) {
          console.warn('[ET] Error reloading subscriptions:', e);
        }
      }
      
      // 4. Force update of order summary component
      const orderSummary = document.querySelector('[class*="order"], [class*="summary"], [id*="order"]');
      if (orderSummary) {
        orderSummary.dispatchEvent(new CustomEvent('Recharge::update', { bubbles: true }));
        orderSummary.dispatchEvent(new CustomEvent('Recharge::order::updated', { bubbles: true }));
        
        // Trigger a small DOM change to force re-render
        orderSummary.setAttribute('data-refresh', Date.now().toString());
        setTimeout(() => {
          orderSummary.removeAttribute('data-refresh');
        }, 100);
      }
      
      console.log('[ET] ===== Refresh complete =====');
    }
    
    // Reusable function to extract addressId from subscription card
    function extractAddressIdFromCard(card) {
      if (!card) {
        console.log('[ET] No card provided for addressId extraction');
        return null;
      }
      
      console.log('[ET] ===== Extracting addressId from subscription card =====');
      
      // Strategy -1: Extract from card's React Fiber/State (Recharge stores data here)
      try {
        // Walk through all elements in the card to find React instances
        const allElements = card.querySelectorAll('*');
        for (const el of allElements) {
          // Check for React fiber
          const reactKey = Object.keys(el).find(key => key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance'));
          if (reactKey) {
            try {
              let fiber = el[reactKey];
              let depth = 0;
              while (fiber && depth < 15) {
                // Check memoizedProps
                if (fiber.memoizedProps) {
                  const props = fiber.memoizedProps;
                  // Look for addressId in props
                  for (const key in props) {
                    const keyLower = key.toLowerCase();
                    if ((keyLower.includes('address') && keyLower.includes('id')) || keyLower === 'addressid' || keyLower === 'address_id') {
                      const value = props[key];
                      if (value && (typeof value === 'string' || typeof value === 'number')) {
                        const addrId = String(value);
                        if (/^\d+$/.test(addrId)) {
                          console.log('[ET] ✓✓✓✓✓ Found addressId from React Fiber props (Strategy -1):', addrId);
                          return addrId;
                        }
                      }
                    }
                    // Also check if prop is an object with addressId
                    if (props[key] && typeof props[key] === 'object') {
                      const obj = props[key];
                      if (obj.addressId || obj.address_id || obj.addressId) {
                        const addrId = String(obj.addressId || obj.address_id || obj.addressId);
                        if (/^\d+$/.test(addrId)) {
                          console.log('[ET] ✓✓✓✓✓ Found addressId from React Fiber object prop (Strategy -1):', addrId);
                          return addrId;
                        }
                      }
                    }
                  }
                }
                
                // Check memoizedState
                if (fiber.memoizedState) {
                  let state = fiber.memoizedState;
                  while (state) {
                    if (state.memoizedState && typeof state.memoizedState === 'object') {
                      const stateObj = state.memoizedState;
                      if (stateObj.addressId || stateObj.address_id) {
                        const addrId = String(stateObj.addressId || stateObj.address_id);
                        if (/^\d+$/.test(addrId)) {
                          console.log('[ET] ✓✓✓✓✓ Found addressId from React Fiber state (Strategy -1):', addrId);
                          return addrId;
                        }
                      }
                    }
                    state = state.next;
                  }
                }
                
                fiber = fiber.return || fiber._owner || fiber.child;
                depth++;
              }
            } catch (e) {
              // React access might fail
            }
          }
        }
      } catch (e) {
        console.log('[ET] Strategy -1 error:', e);
      }
      
      // Strategy -0.5: Look for data attributes on the card itself (Recharge might add these)
      try {
        // Check all data attributes on the card
        for (const attr of card.attributes) {
          const attrName = attr.name.toLowerCase();
          if (attrName.includes('address') && attrName.includes('id')) {
            const match = attr.value.match(/(\d+)/);
            if (match && match[1] && /^\d+$/.test(match[1])) {
              console.log('[ET] ✓✓✓✓✓ Found addressId from card data attribute (Strategy -0.5):', match[1]);
              return match[1];
            }
          }
        }
        
        // Check for subscription data that might contain addressId
        const cardData = card.getAttribute('data-subscription') || card.getAttribute('data-subscription-data');
        if (cardData) {
          try {
            const subData = JSON.parse(cardData);
            if (subData.addressId || subData.address_id) {
              const addrId = String(subData.addressId || subData.address_id);
              if (/^\d+$/.test(addrId)) {
                console.log('[ET] ✓✓✓✓✓ Found addressId from card subscription data (Strategy -0.5):', addrId);
                return addrId;
              }
            }
          } catch (e) {
            // Not JSON, try regex
            const match = cardData.match(/address[_-]?id[=:](\d+)/i);
            if (match && match[1]) {
              console.log('[ET] ✓✓✓✓✓ Found addressId from card subscription data string (Strategy -0.5):', match[1]);
              return match[1];
            }
          }
        }
      } catch (e) {
        console.log('[ET] Strategy -0.5 error:', e);
      }
      
      // Strategy 0: Look for edit address button with data-testid (NEW - most reliable for Recharge)
      const editAddressButton = card.querySelector('[data-testid*="edit-address"], [data-testid*="edit-address-button"], [role="button"][data-testid*="address"], span[data-testid*="edit-address"]');
      if (editAddressButton) {
        console.log('[ET] Strategy 0: Found edit address button');
        console.log('[ET] Button element:', editAddressButton.tagName, editAddressButton.className);
        console.log('[ET] Button data-testid:', editAddressButton.getAttribute('data-testid'));
        
        // Check all data attributes on the button
        for (const attr of editAddressButton.attributes) {
          const attrName = attr.name.toLowerCase();
          const attrValue = attr.value;
          
          // Check for address ID in any data attribute
          if (attrName.includes('address') && attrName.includes('id')) {
            const match = attrValue.match(/(\d+)/);
            if (match && match[1]) {
              console.log('[ET] ✓✓✓✓✓ Found addressId from edit button attribute', attr.name, '(Strategy 0):', match[1]);
              return match[1];
            }
          }
          
          // Check if attribute value contains address ID pattern
          const addrIdMatch = attrValue.match(/address[_-]?id[=:](\d+)/i) || 
                             attrValue.match(/addresses\/(\d+)/) ||
                             attrValue.match(/addresses[\/=](\d+)/);
          if (addrIdMatch && addrIdMatch[1]) {
            console.log('[ET] ✓✓✓✓✓ Found addressId from edit button attribute', attr.name, '(Strategy 0):', addrIdMatch[1]);
            return addrIdMatch[1];
          }
        }
        
        // Check data attributes first
        const dataAddrId = editAddressButton.getAttribute('data-address-id') || 
                          editAddressButton.getAttribute('data-addressId') ||
                          editAddressButton.getAttribute('data-address_id') ||
                          editAddressButton.getAttribute('data-addressid');
        if (dataAddrId && /^\d+$/.test(dataAddrId)) {
          console.log('[ET] ✓✓✓✓✓ Found addressId from edit button data attribute (Strategy 0):', dataAddrId);
          return dataAddrId;
        }
        
        // Check if button has onclick or event handler that contains addressId
        const onclick = editAddressButton.getAttribute('onclick') || '';
        const onclickMatch = onclick.match(/address[_-]?id[=:](\d+)/i) || 
                            onclick.match(/addresses\/(\d+)/) ||
                            onclick.match(/addresses[\/=](\d+)/);
        if (onclickMatch && onclickMatch[1]) {
          console.log('[ET] ✓✓✓✓✓ Found addressId from edit button onclick (Strategy 0):', onclickMatch[1]);
          return onclickMatch[1];
        }
        
        // Check React props (if available) - React stores props in __reactInternalInstance or __reactFiber
        try {
          const reactKey = Object.keys(editAddressButton).find(key => key.startsWith('__react'));
          if (reactKey) {
            const reactInstance = editAddressButton[reactKey];
            if (reactInstance) {
              // Try to find addressId in React props
              let fiber = reactInstance;
              for (let i = 0; i < 10 && fiber; i++) {
                if (fiber.memoizedProps) {
                  const props = fiber.memoizedProps;
                  for (const key in props) {
                    if (key.toLowerCase().includes('address') && key.toLowerCase().includes('id')) {
                      const value = props[key];
                      if (typeof value === 'string' && /^\d+$/.test(value)) {
                        console.log('[ET] ✓✓✓✓✓ Found addressId from React props (Strategy 0):', value);
                        return value;
                      }
                    }
                  }
                }
                fiber = fiber.return || fiber._owner;
              }
            }
          }
        } catch (e) {
          // React props access might fail, that's okay
        }
        
        // Check parent elements for addressId (walk up DOM tree)
        let parent = editAddressButton.parentElement;
        let depth = 0;
        while (parent && depth < 8) {
          // Check all data attributes on parent
          for (const attr of parent.attributes) {
            const attrName = attr.name.toLowerCase();
            if (attrName.includes('address') && attrName.includes('id')) {
              const match = attr.value.match(/(\d+)/);
              if (match && match[1] && /^\d+$/.test(match[1])) {
                console.log('[ET] ✓✓✓✓✓ Found addressId from edit button parent', depth, 'levels up (Strategy 0):', match[1]);
                return match[1];
              }
            }
          }
          
          const parentDataAddrId = parent.getAttribute('data-address-id') || 
                                   parent.getAttribute('data-addressId') ||
                                   parent.getAttribute('data-address_id') ||
                                   parent.getAttribute('data-addressid');
          if (parentDataAddrId && /^\d+$/.test(parentDataAddrId)) {
            console.log('[ET] ✓✓✓✓✓ Found addressId from edit button parent (Strategy 0):', parentDataAddrId);
            return parentDataAddrId;
          }
          
          // Check parent's HTML for address ID patterns
          const parentHTML = parent.outerHTML || '';
          const htmlMatch = parentHTML.match(/address[_-]?id[=:](\d+)/i) || 
                           parentHTML.match(/addresses\/(\d+)/) ||
                           parentHTML.match(/addresses[\/=](\d+)/);
          if (htmlMatch && htmlMatch[1]) {
            console.log('[ET] ✓✓✓✓✓ Found addressId from parent HTML (Strategy 0):', htmlMatch[1]);
            return htmlMatch[1];
          }
          
          parent = parent.parentElement;
          depth++;
        }
      }
      
      // Strategy 1: Look for links with addresses/ID pattern (most reliable)
      const allLinks = card.querySelectorAll('a[href*="addresses/"], a[href*="/addresses/"], a[href*="addresses"]');
      console.log('[ET] Strategy 1: Found', allLinks.length, 'links with addresses pattern');
      for (const link of allLinks) {
        const href = link.getAttribute('href') || '';
        console.log('[ET] Checking link href:', href);
        // Try multiple patterns
        const match = href.match(/\/addresses\/(\d+)/) || 
                     href.match(/addresses\/(\d+)/) ||
                     href.match(/addresses[\/=](\d+)/) ||
                     href.match(/address[_-]?id[=:](\d+)/i);
        if (match && match[1]) {
          console.log('[ET] ✓✓✓✓✓ Found addressId from link (Strategy 1):', match[1]);
          return match[1];
        }
      }
      
      // Strategy 2: Look for buttons that trigger Recharge events
      const rechargeButtons = card.querySelectorAll('button[onclick*="manageSubscription"], button[data-subscription-id], button[data-address-id], button[onclick*="address"], [role="button"][data-testid*="address"]');
      console.log('[ET] Strategy 2: Found', rechargeButtons.length, 'Recharge buttons');
      for (const btn of rechargeButtons) {
        const onclick = btn.getAttribute('onclick') || '';
        const dataAddrId = btn.getAttribute('data-address-id') || btn.getAttribute('data-addressId');
        
        if (dataAddrId) {
          console.log('[ET] ✓✓✓✓✓ Found addressId from button data attribute (Strategy 2):', dataAddrId);
          return dataAddrId;
        }
        
        const onclickMatch = onclick.match(/address[_-]?id[=:](\d+)/i) || 
                            onclick.match(/addresses\/(\d+)/) ||
                            onclick.match(/addresses[\/=](\d+)/);
        if (onclickMatch && onclickMatch[1]) {
          console.log('[ET] ✓✓✓✓✓ Found addressId from button onclick (Strategy 2):', onclickMatch[1]);
          return onclickMatch[1];
        }
      }
      
      // Strategy 3: Look for manage subscription links
      const manageLinks = card.querySelectorAll('a[href*="manage"], a[href*="edit"], button[onclick*="address"], a[href*="/upcoming"], a[href*="/orders"], a[href*="subscription"]');
      console.log('[ET] Strategy 3: Found', manageLinks.length, 'manage/edit links');
      for (const link of manageLinks) {
        const href = link.getAttribute('href') || '';
        const onclick = link.getAttribute('onclick') || '';
        const combined = href + ' ' + onclick;
        const match = combined.match(/\/addresses\/(\d+)/) || 
                    combined.match(/addresses\/(\d+)/) ||
                    combined.match(/addresses[\/=](\d+)/) ||
                    combined.match(/address[_-]?id[=:](\d+)/i);
        if (match && match[1]) {
          console.log('[ET] ✓✓✓✓✓ Found addressId from manage/edit link (Strategy 3):', match[1]);
          return match[1];
        }
      }
      
      // Strategy 4: Look for data attributes on any element
      const dataElements = card.querySelectorAll('[data-address-id], [data-addressid], [data-address_id], [data-addressId], [data-address]');
      console.log('[ET] Strategy 4: Found', dataElements.length, 'elements with data attributes');
      for (const el of dataElements) {
        const addressId = el.getAttribute('data-address-id') || 
                         el.getAttribute('data-addressid') || 
                         el.getAttribute('data-address_id') ||
                         el.getAttribute('data-addressId') ||
                         el.getAttribute('data-address');
        if (addressId && /^\d+$/.test(addressId)) {
          console.log('[ET] ✓✓✓✓✓ Found addressId from data attribute (Strategy 4):', addressId);
          return addressId;
        }
      }
      
      // Strategy 4.5: Look for script tags with JSON data containing address information
      try {
        const scripts = document.querySelectorAll('script[type="application/json"], script[type="application/ld+json"]');
        const cardText = (card.textContent || '').trim();
        const addressMatch = cardText.match(/Deliver to\s+(.+?)(?:Edit|Redeem|Subscription|Bundle|Charge|$)/i);
        const targetAddress = addressMatch ? addressMatch[1].trim() : null;
        
        if (targetAddress && scripts.length > 0) {
          const targetParts = targetAddress.split(/\s+/).filter(p => p.length > 0);
          const streetNumber = targetParts[0];
          
          for (const script of scripts) {
            try {
              const data = JSON.parse(script.textContent || '{}');
              
              // Check if this script contains address data
              if (data.addresses && Array.isArray(data.addresses)) {
                for (const addr of data.addresses) {
                  const addr1 = (addr.address1 || '').trim().toLowerCase();
                  if (streetNumber && addr1 && addr1.includes(streetNumber.toLowerCase())) {
                    if (addr.id) {
                      console.log('[ET] ✓✓✓✓✓ Found addressId from script JSON (Strategy 4.5):', addr.id);
                      return String(addr.id);
                    }
                  }
                }
              }
              
              // Check subscriptions array
              if (data.subscriptions && Array.isArray(data.subscriptions)) {
                for (const sub of data.subscriptions) {
                  if (sub.address_id) {
                    // Try to match by checking if this subscription's address matches
                    const addrId = String(sub.address_id);
                    console.log('[ET] Found subscription with addressId in script:', addrId);
                    // We'll return this if we can't find a better match
                  }
                }
              }
            } catch (e) {
              // Not valid JSON or doesn't contain address data
            }
          }
        }
      } catch (e) {
        console.log('[ET] Strategy 4.5 error:', e);
      }
      
      // Strategy 5: Look in the card's HTML (search for any numeric ID that looks like an address ID)
      const cardHTML = card.outerHTML || '';
      const htmlMatch = cardHTML.match(/\/addresses\/(\d+)/) || 
                       cardHTML.match(/addresses\/(\d+)/) ||
                       cardHTML.match(/addresses[\/=](\d+)/) ||
                       cardHTML.match(/address[_-]?id[=:](\d+)/i);
      if (htmlMatch && htmlMatch[1]) {
        console.log('[ET] ✓✓✓✓✓ Found addressId from card HTML (Strategy 5):', htmlMatch[1]);
        return htmlMatch[1];
      }
      
      // Strategy 6: Look for any numeric IDs in URLs within the card (last resort)
      const allUrls = cardHTML.match(/\/addresses\/(\d+)/g) || [];
      if (allUrls.length > 0) {
        const firstMatch = allUrls[0].match(/(\d+)/);
        if (firstMatch && firstMatch[1]) {
          console.log('[ET] ✓✓✓✓✓ Found addressId from URL pattern in HTML (Strategy 6):', firstMatch[1]);
          return firstMatch[1];
        }
      }
      
      // Strategy 7: Search the ENTIRE PAGE for addressIds and match by proximity/address text
      console.log('[ET] Strategy 7: Searching entire page for addressIds...');
      const addressText = (card.textContent || '').trim();
      const addressMatch = addressText.match(/Deliver to\s+(.+?)(?:\n|$)/i);
      const targetAddress = addressMatch ? addressMatch[1].trim() : null;
      
      if (targetAddress) {
        console.log('[ET] Target address text:', targetAddress);
        
        // Find all links with addresses in the entire page
        const allPageLinks = Array.from(document.querySelectorAll('a[href*="addresses/"]'));
        console.log('[ET] Found', allPageLinks.length, 'links with addresses on entire page');
        
        for (const link of allPageLinks) {
          const href = link.getAttribute('href') || '';
          const match = href.match(/\/addresses\/(\d+)/) || href.match(/addresses\/(\d+)/);
          if (match && match[1]) {
            const addressId = match[1];
            
            // Check if this link is near our card (within reasonable DOM distance)
            const linkParent = link.closest('div, section, article, main');
            const cardParent = card.closest('div, section, article, main');
            
            // Check if link text or nearby text contains our address
            const linkText = (link.textContent || '').trim();
            const linkParentText = linkParent ? (linkParent.textContent || '').trim() : '';
            const combinedText = linkText + ' ' + linkParentText;
            
            // Check if the address matches (fuzzy match)
            const addressParts = targetAddress.toLowerCase().split(/\s+/);
            const matchesAddress = addressParts.some(part => 
              combinedText.toLowerCase().includes(part) && part.length > 3
            ) || combinedText.toLowerCase().includes(targetAddress.toLowerCase().substring(0, 10));
            
            // Also check DOM proximity
            const isNearby = linkParent && cardParent && (
              linkParent === cardParent ||
              linkParent.contains(card) ||
              card.contains(linkParent) ||
              (linkParent.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING) ||
              (card.compareDocumentPosition(linkParent) & Node.DOCUMENT_POSITION_FOLLOWING)
            );
            
            if (matchesAddress || isNearby) {
              console.log('[ET] ✓✓✓✓✓ Found addressId from page-wide search (Strategy 7):', addressId);
              console.log('[ET] Matched by:', matchesAddress ? 'address text' : 'DOM proximity');
              return addressId;
            }
          }
        }
      }
      
      // Strategy 8: Last resort - find ANY addressId on the page and use the first one
      // (This is risky but better than nothing)
      console.log('[ET] Strategy 8: Last resort - finding any addressId on page...');
      const anyLink = document.querySelector('a[href*="addresses/"]');
      if (anyLink) {
        const href = anyLink.getAttribute('href') || '';
        const match = href.match(/\/addresses\/(\d+)/) || href.match(/addresses\/(\d+)/);
        if (match && match[1]) {
          console.log('[ET] ⚠️ Using first addressId found on page (may not be correct):', match[1]);
          return match[1];
        }
      }
      
      console.log('[ET] ✗✗✗ Could not extract addressId from subscription card after trying all strategies');
      console.log('[ET] Card HTML preview:', cardHTML.substring(0, 500));
      return null;
    }
    
    // Extract subscription ID from card - comprehensive search
    function extractSubscriptionIdFromCard(card) {
      if (!card) return null;
      
      console.log('[ET] ===== Extracting subscription ID from card =====');
      
      // Strategy 1: Look for ALL data attributes with subscription ID (case-insensitive)
      const allElements = card.querySelectorAll('*');
      console.log('[ET] Checking', allElements.length, 'elements for subscription ID');
      
      for (const el of allElements) {
        // Check all data attributes
        for (const attr of el.attributes) {
          const attrName = attr.name.toLowerCase();
          if (attrName.includes('subscription') && attrName.includes('id')) {
            const match = attr.value.match(/(\d{6,})/); // Match 6+ digit numbers (subscription IDs are usually 9 digits)
            if (match && match[1]) {
              console.log('[ET] ✓ Found subscription ID from data attribute', attr.name, ':', match[1]);
              return match[1];
            }
          }
          // Also check for any data attribute with large numbers that might be subscription ID
          if (attrName.includes('id') && /^\d{6,}$/.test(attr.value)) {
            console.log('[ET] Found potential subscription ID in', attr.name, ':', attr.value);
            // Don't return yet, continue searching for more specific matches
          }
        }
      }
      
      // Strategy 2: Look for buttons with subscription ID
      const buttons = card.querySelectorAll('button, [role="button"]');
      for (const btn of buttons) {
        // Check data attributes
        const dataSubId = btn.getAttribute('data-subscription-id') || 
                         btn.getAttribute('data-subscriptionId') ||
                         btn.getAttribute('data-subscription_id') ||
                         btn.getAttribute('data-sub-id');
        if (dataSubId) {
          const match = dataSubId.match(/(\d+)/);
          if (match && match[1]) {
            console.log('[ET] Found subscription ID from button data attribute:', match[1]);
            return match[1];
          }
        }
        
        // Check onclick handlers
        const onclick = btn.getAttribute('onclick') || '';
        if (onclick) {
          const subIdMatch = onclick.match(/subscription[_-]?id[=:](\d+)/i) || 
                            onclick.match(/subscription[_-]?id[=:]['"](\d+)['"]/i) ||
                            onclick.match(/manageSubscription\(['"]?(\d+)['"]?\)/i) ||
                            onclick.match(/subscription[_-]?id['"]?\s*[:=]\s*['"]?(\d+)/i) ||
                            onclick.match(/(\d{9,})/); // Large numbers might be subscription IDs
          if (subIdMatch && subIdMatch[1]) {
            console.log('[ET] Found subscription ID from button onclick:', subIdMatch[1]);
            return subIdMatch[1];
          }
        }
      }
      
      // Strategy 3: Look for links with subscription ID
      const links = card.querySelectorAll('a[href]');
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        const subIdMatch = href.match(/subscription[\/=](\d+)/) || 
                          href.match(/subscriptions\/(\d+)/) ||
                          href.match(/\/manage[\/\?]?.*subscription[\/=](\d+)/i);
        if (subIdMatch && subIdMatch[1]) {
          console.log('[ET] Found subscription ID from link:', subIdMatch[1]);
          return subIdMatch[1];
        }
      }
      
      // Strategy 4: Search card HTML for subscription ID patterns (more comprehensive)
      const cardHTML = card.innerHTML || '';
      const cardOuterHTML = card.outerHTML || '';
      const allHTML = cardHTML + ' ' + cardOuterHTML;
      
      console.log('[ET] Searching HTML for subscription ID patterns...');
      
      // Try multiple patterns to find subscription ID
      const htmlMatches = [
        allHTML.match(/subscription[_-]?id['"]?\s*[:=]\s*['"]?(\d{6,})/i),
        allHTML.match(/data-subscription-id=['"](\d{6,})['"]/i),
        allHTML.match(/data-subscriptionId=['"](\d{6,})['"]/i),
        allHTML.match(/subscriptions\/(\d{6,})/i),
        allHTML.match(/subscription[\/=](\d{6,})/i),
        allHTML.match(/manageSubscription\(['"]?(\d{6,})['"]?\)/i),
        allHTML.match(/subscription[_-]?id\s*=\s*(\d{6,})/i),
        // Look for large numbers that might be subscription IDs (9 digits typically)
        allHTML.match(/\b(7\d{8})\b/), // Subscription IDs often start with 7
        allHTML.match(/\b(73\d{7})\b/), // Or start with 73
      ];
      
      for (let i = 0; i < htmlMatches.length; i++) {
        const match = htmlMatches[i];
        if (match && match[1]) {
          const subId = match[1];
          // Validate it looks like a subscription ID (6-10 digits)
          if (subId.length >= 6 && subId.length <= 10) {
            console.log('[ET] ✓ Found subscription ID from HTML pattern', i, ':', subId);
            return subId;
          }
        }
      }
      
      // Strategy 5: Look for data attributes on the card itself
      for (const attr of card.attributes) {
        if (attr.name.toLowerCase().includes('subscription') && attr.name.toLowerCase().includes('id')) {
          const match = attr.value.match(/(\d+)/);
          if (match && match[1]) {
            console.log('[ET] Found subscription ID from card attribute', attr.name, ':', match[1]);
            return match[1];
          }
        }
      }
      
      console.log('[ET] Could not extract subscription ID from card');
      return null;
    }
    
    // Get address ID from Recharge SDK
    async function getAddressIdFromSDK(addressText = null, subscriptionCard = null) {
      try {
        console.log('[ET] Attempting to get addressId from SDK...');
        if (addressText) {
          console.log('[ET] Matching address text:', addressText);
        }
        const recharge = window.recharge || window.ReCharge || window.Recharge;
        console.log('[ET] Recharge SDK object:', recharge ? 'found' : 'not found');
        
        if (!recharge) {
          console.warn('[ET] Recharge SDK object not found on window');
          return null;
        }
        
        // Get or create session
        let session = recharge.session;
        console.log('[ET] Session:', recharge);
        if (!session && recharge.auth && typeof recharge.auth.loginCustomerPortal === 'function') {
          console.log('[ET] No session found, authenticating...');
          try {
            session = await recharge.auth.loginCustomerPortal();
            console.log('[ET] Session obtained:', session ? 'success' : 'failed');
          } catch (authError) {
            console.warn('[ET] Authentication failed:', authError);
          }
        }
        
        if (!session) {
          console.warn('[ET] No session available for SDK calls');
          return null;
        }
        
        // PRIORITY 1: Try to get subscription ID from card first, then get that subscription's address_id
        if (subscriptionCard) {
          const subscriptionId = extractSubscriptionIdFromCard(subscriptionCard);
          if (subscriptionId) {
            console.log('[ET] Found subscription ID from card:', subscriptionId);
            
            // Try to get subscription using SDK getSubscription method if available
            if (recharge.subscription && typeof recharge.subscription.getSubscription === 'function') {
              try {
                console.log('[ET] Using SDK getSubscription method...');
                const subResponse = await recharge.subscription.getSubscription(session, subscriptionId);
                const sub = subResponse?.subscription || subResponse?.data?.subscription || subResponse;
                if (sub && sub.address_id) {
                  console.log('[ET] ✓✓✓ Got address_id from SDK getSubscription:', sub.address_id);
                  return sub.address_id;
                }
              } catch (e) {
                console.warn('[ET] SDK getSubscription failed, will try listSubscriptions:', e);
              }
            }
            
            // Use the subscriptions already fetched in PRIORITY 2 section
            // This will be handled below where we already have the subscriptions list
            console.log('[ET] Subscription ID found, will match in subscriptions list below');
            
            // Last resort: Try direct API call
            try {
              const url = window.location.href;
              const tokenMatch = url.match(/[?&]token=([^&]+)/);
              if (tokenMatch) {
                const token = tokenMatch[1];
                const apiUrl = `${window.location.origin}/tools/recurring/api/subscriptions/${subscriptionId}?token=${token}`;
                console.log('[ET] Trying direct API call to get subscription...');
                const response = await fetch(apiUrl, {
                  credentials: 'include',
                  headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                  const data = await response.json();
                  const sub = data?.subscription || data?.data?.subscription || data;
                  if (sub && sub.address_id) {
                    console.log('[ET] ✓✓✓ Got address_id from API:', sub.address_id);
                    return sub.address_id;
                  }
                }
              }
            } catch (e) {
              console.warn('[ET] Direct API call failed:', e);
            }
          }
        }
        
        // PRIORITY 2: Get all subscriptions and try to match by card properties
        if (recharge.subscription && typeof recharge.subscription.listSubscriptions === 'function') {
          console.log('[ET] Getting all subscriptions to match by properties...');
          try {
            // Get subscriptions and addresses in parallel for address matching
            const [subResponse, addrResponse] = await Promise.all([
              recharge.subscription.listSubscriptions(session),
              recharge.address && typeof recharge.address.listAddresses === 'function' 
                ? recharge.address.listAddresses(session) 
                : Promise.resolve(null)
            ]);
            
            const subscriptions = subResponse?.subscriptions || subResponse?.data?.subscriptions || (Array.isArray(subResponse) ? subResponse : []);
            const addresses = addrResponse?.addresses || addrResponse?.data?.addresses || (Array.isArray(addrResponse) ? addrResponse : []);
            
            console.log('[ET] Found',subscriptions, subscriptions.length, 'subscriptions and', addresses.length, 'addresses');
            
            // Create address map for address matching
            const addressMap = {};
            if (addresses && addresses.length > 0) {
              addresses.forEach(addr => {
                addressMap[addr.id] = addr;
              });
            }
            
            if (subscriptions.length > 0) {
              // PRIORITY 1.5: If we found subscription ID from card, match it in the subscriptions list
              if (subscriptionCard) {
                const subscriptionId = extractSubscriptionIdFromCard(subscriptionCard);
                if (subscriptionId) {
                  console.log('[ET] ✓✓✓ Found subscription ID from card:', subscriptionId);
                  const sub = subscriptions.find(s => String(s.id) === String(subscriptionId));
                  if (sub && sub.address_id) {
                    console.log('[ET] ✓✓✓✓✓ MATCHED! Subscription ID:', subscriptionId, '-> address_id:', sub.address_id);
                    console.log('[ET] Subscription details:', {
                      id: sub.id,
                      address_id: sub.address_id,
                      status: sub.status,
                      next_charge: sub.next_charge_scheduled_at
                    });
                    return sub.address_id;
                  } else {
                    console.warn('[ET] ⚠️ Subscription ID', subscriptionId, 'not found in subscriptions list');
                    console.log('[ET] Available subscription IDs:', subscriptions.map(s => s.id).join(', '));
                  }
                }
              }
              
              // PRIORITY 1.6: Match by address text FIRST (before card position) - more reliable
              if (addressText && addresses && addresses.length > 0) {
                console.log('[ET] PRIORITY 1.6: Matching by address text...');
                const addressMatch = addressText.match(/Deliver to\s+(.+?)(?:Edit|Redeem|Subscription|$)/i);
                const targetAddress = addressMatch ? addressMatch[1].trim() : addressText.replace(/Deliver to\s*/i, '').replace(/Edit.*$/i, '').replace(/Redeem.*$/i, '').trim();
                
                if (targetAddress) {
                  console.log('[ET] Target address from card:', targetAddress);
                  
                  // Extract street number and name
                  const targetParts = targetAddress.split(/\s+/).filter(p => p.length > 0);
                  const streetNumber = targetParts[0]; // e.g., "1800"
                  const streetName = targetParts.slice(1, 3).join(' ').toLowerCase(); // e.g., "north vermont"
                  
                  // Try to match each subscription's address
                  // Since addresses might be masked, we'll also match by subscription properties
                  let bestMatch = null;
                  let bestScore = 0;
                  
                  // Extract subscription properties from card for matching
                  const cardText = subscriptionCard ? (subscriptionCard.textContent || '').trim() : '';
                  const priceMatch = cardText.match(/\$(\d+\.?\d*)/);
                  const cardPrice = priceMatch ? parseFloat(priceMatch[1]).toFixed(2) : null;
                  const quantityMatch = cardText.match(/(\d+)\s*×/);
                  const cardQuantity = quantityMatch ? parseInt(quantityMatch[1]) : null;
                  
                  for (const sub of subscriptions) {
                    const addressId = sub.address_id;
                    if (!addressId) continue;
                    
                    const address = addressMap[addressId];
                    let addressScore = 0;
                    let propertyScore = 0;
                    
                    // Try to match by address (if not masked)
                    if (address) {
                      const addr1 = (address.address1 || '').trim().toLowerCase();
                      
                      // Match by street number (works even if masked like "1*******")
                      if (streetNumber && addr1) {
                        // Check if masked address starts with same number
                        const maskedMatch = addr1.match(/^(\d+)/);
                        if (maskedMatch && maskedMatch[1] === streetNumber) {
                          addressScore += 8; // Higher score for masked match
                        } else if (addr1.includes(streetNumber.toLowerCase())) {
                          addressScore += 5;
                        }
                      }
                      
                      // Match by street name (more specific, but might not work if masked)
                      if (streetName && addr1 && addr1.includes(streetName)) {
                        addressScore += 10;
                      }
                      
                      // Full address match (most reliable, but won't work if masked)
                      if (targetAddress && addr1 && addr1.includes(targetAddress.toLowerCase().substring(0, 15))) {
                        addressScore += 15;
                      }
                      
                      // Also check address2, city, zip for additional matching
                      const addr2 = (address.address2 || '').trim().toLowerCase();
                      const city = (address.city || '').trim().toLowerCase();
                      if (addr2 && targetAddress.toLowerCase().includes(addr2)) {
                        addressScore += 3;
                      }
                      if (city && targetAddress.toLowerCase().includes(city)) {
                        addressScore += 2;
                      }
                    }
                    
                    // Match by subscription properties (price, quantity) - more reliable when addresses are masked
                    if (cardPrice && sub.price) {
                      const subPrice = parseFloat(sub.price).toFixed(2);
                      if (subPrice === cardPrice) {
                        propertyScore += 10;
                      }
                    }
                    
                    if (cardQuantity && sub.quantity) {
                      if (sub.quantity === cardQuantity) {
                        propertyScore += 5;
                      }
                    }
                    
                    // Combined score (address + properties)
                    const totalScore = addressScore + propertyScore;
                    
                    if (totalScore > bestScore) {
                      bestScore = totalScore;
                      bestMatch = { addressId, subscription: sub, addressScore, propertyScore };
                    }
                  }
                  
                  if (bestMatch && bestScore >= 5) {
                    console.log('[ET] ✓✓✓✓✓ Matched subscription by address+properties (total score', bestScore, ', address:', bestMatch.addressScore, ', properties:', bestMatch.propertyScore, '):', bestMatch.subscription.id, '-> address_id:', bestMatch.addressId);
                    return bestMatch.addressId;
                  } else if (bestMatch) {
                    console.log('[ET] Address+property match score too low:', bestScore, 'for address_id:', bestMatch.addressId);
                  } else {
                    console.log('[ET] No address match found for:', targetAddress);
                  }
                }
              }
              
              // PRIORITY 2: Try to match by card position/index
              // Subscriptions might be displayed in the same order as returned by SDK
              if (subscriptionCard) {
                // First, find the actual top-level subscription card container
                // Walk up from subscriptionCard to find the container that has "Deliver to" as a direct child
                let cardContainer = subscriptionCard;
                let depth = 0;
                while (cardContainer && depth < 10) {
                  const text = (cardContainer.textContent || '').trim();
                  const hasDeliverTo = text.includes('Deliver to');
                  const hasSubscriptionContent = text.includes('Subscription') || 
                                                text.includes('Bundle contents') ||
                                                text.includes('Charge to');
                  const textLength = text.length;
                  
                  // Check if this is a top-level card container
                  // It should have "Deliver to" AND subscription content AND be a reasonable size
                  if (hasDeliverTo && hasSubscriptionContent && textLength > 100 && textLength < 3000) {
                    // Check if this container has "Deliver to" as a direct or near-direct child (not deeply nested)
                    const deliverToElements = cardContainer.querySelectorAll('span[role="heading"], h1, h2, h3, div');
                    const hasDirectDeliverTo = Array.from(deliverToElements).some(el => {
                      const elText = (el.textContent || '').trim();
                      return elText.includes('Deliver to') && elText.length < 100;
                    });
                    
                    if (hasDirectDeliverTo) {
                      // This looks like a top-level card container
                      break;
                    }
                  }
                  cardContainer = cardContainer.parentElement;
                  depth++;
                }
                
                if (!cardContainer) {
                  cardContainer = subscriptionCard;
                }
                
                // Now find all similar top-level subscription card containers on the page
                // Use a more specific approach: find containers that have the same structure
                const allCards = [];
                const allDivs = Array.from(document.querySelectorAll('div'));
                
                for (const div of allDivs) {
                  const text = (div.textContent || '').trim();
                  const hasDeliverTo = text.includes('Deliver to');
                  const hasSubscriptionContent = text.includes('Subscription') || 
                                                text.includes('Bundle contents') ||
                                                text.includes('Charge to');
                  const textLength = text.length;
                  
                  // Must be a reasonable size and have both required elements
                  if (hasDeliverTo && hasSubscriptionContent && textLength > 200 && textLength < 3000) {
                    // Check if this div has "Deliver to" as a direct/near-direct child
                    const deliverToElements = div.querySelectorAll('span[role="heading"], h1, h2, h3');
                    const hasDirectDeliverTo = Array.from(deliverToElements).some(el => {
                      const elText = (el.textContent || '').trim();
                      return elText.includes('Deliver to') && elText.length < 100;
                    });
                    
                    // Also check if it has the same class structure as our card
                    const hasSimilarClasses = cardContainer.className && div.className && 
                                           cardContainer.className.split(' ').some(cls => 
                                             div.className.includes(cls) && cls.length > 5
                                           );
                    
                    if (hasDirectDeliverTo || hasSimilarClasses) {
                      // Make sure this isn't a nested div (check if it's a sibling or top-level)
                      const isNested = Array.from(allCards).some(existingCard => 
                        existingCard.contains(div) || div.contains(existingCard)
                      );
                      
                      if (!isNested) {
                        allCards.push(div);
                      }
                    }
                  }
                }
                
                // Remove duplicates and nested cards
                const uniqueCards = [];
                for (const card of allCards) {
                  const isDuplicate = uniqueCards.some(existing => 
                    existing === card || existing.contains(card) || card.contains(existing)
                  );
                  if (!isDuplicate) {
                    uniqueCards.push(card);
                  }
                }
                
                console.log('[ET] Found', uniqueCards.length, 'unique subscription card containers on page');
                
                // Find the index of our card container
                let cardIndex = uniqueCards.findIndex(c => c === cardContainer || c.contains(cardContainer));
                
                // If not found, try to match by structure
                if (cardIndex === -1) {
                  // Extract address text from our card
                  const ourAddressText = (cardContainer.textContent || '').match(/Deliver to\s+(.+?)(?:Edit|Redeem|Subscription|$)/i);
                  const ourAddress = ourAddressText ? ourAddressText[1].trim() : '';
                  
                  if (ourAddress) {
                    // Try to find card with matching address
                    for (let i = 0; i < uniqueCards.length; i++) {
                      const cardText = (uniqueCards[i].textContent || '').trim();
                      const cardAddressMatch = cardText.match(/Deliver to\s+(.+?)(?:Edit|Redeem|Subscription|$)/i);
                      const cardAddress = cardAddressMatch ? cardAddressMatch[1].trim() : '';
                      
                      // Match by address (fuzzy match)
                      if (cardAddress && (
                        cardAddress.toLowerCase() === ourAddress.toLowerCase() ||
                        cardAddress.toLowerCase().includes(ourAddress.toLowerCase().substring(0, 10)) ||
                        ourAddress.toLowerCase().includes(cardAddress.toLowerCase().substring(0, 10))
                      )) {
                        cardIndex = i;
                        console.log('[ET] Matched card by address text:', ourAddress, '->', cardAddress);
                        break;
                      }
                    }
                  }
                }
                
                if (cardIndex >= 0 && cardIndex < subscriptions.length) {
                  const matchedSub = subscriptions[cardIndex];
                  if (matchedSub && matchedSub.address_id) {
                    console.log('[ET] ✓✓✓ Matched subscription by card position (index', cardIndex, '):', matchedSub.id, '-> address_id:', matchedSub.address_id);
                    return matchedSub.address_id;
                  }
                } else {
                  console.log('[ET] Could not determine card position, cardIndex:', cardIndex, 'subscriptions:', subscriptions.length, 'unique cards found:', uniqueCards.length);
                }
              }
              
              // PRIORITY 3: Try to match by visible card properties (price, quantity, next charge date)
              if (subscriptionCard) {
                const cardText = (subscriptionCard.textContent || '').trim();
                
                // Extract price from card (e.g., "$26.00")
                const priceMatch = cardText.match(/\$(\d+\.?\d*)/);
                const cardPrice = priceMatch ? parseFloat(priceMatch[1]).toFixed(2) : null;
                
                // Extract quantity (e.g., "Subscription1 ×" or "1 ×")
                const quantityMatch = cardText.match(/(\d+)\s*×/);
                const cardQuantity = quantityMatch ? parseInt(quantityMatch[1]) : null;
                
                // Extract frequency (e.g., "Every week")
                const hasWeekly = cardText.includes('Every week') || cardText.includes('week');
                
                // Extract next charge date (format: "Dec 15, 2025" or "2025-12-15")
                const dateMatch = cardText.match(/(\w+\s+\d{1,2},?\s+\d{4})|(\d{4}-\d{2}-\d{2})/);
                let cardDate = null;
                if (dateMatch) {
                  cardDate = dateMatch[1] || dateMatch[2];
                  // Normalize date format
                  if (cardDate.includes('-')) {
                    cardDate = cardDate; // Keep YYYY-MM-DD format
                  } else {
                    // Try to parse and convert to YYYY-MM-DD
                    try {
                      const parsed = new Date(cardDate);
                      if (!isNaN(parsed.getTime())) {
                        cardDate = parsed.toISOString().split('T')[0];
                      }
                    } catch (e) {
                      cardDate = null;
                    }
                  }
                }
                
                console.log('[ET] Card properties - Price:', cardPrice, 'Quantity:', cardQuantity, 'Weekly:', hasWeekly, 'Date:', cardDate);
                
                // Try to match subscriptions by these properties
                let bestMatch = null;
                let bestScore = 0;
                
                for (const sub of subscriptions) {
                  let matchScore = 0;
                  
                  // Match next charge date (most unique, highest weight)
                  if (cardDate && sub.next_charge_scheduled_at) {
                    const subDate = sub.next_charge_scheduled_at.split('T')[0]; // Get YYYY-MM-DD part
                    if (subDate === cardDate) {
                      matchScore += 20; // Highest weight for date match
                      console.log('[ET] Date match:', subDate, 'for subscription', sub.id);
                    }
                  }
                  
                  // Match price (high weight)
                  if (cardPrice && sub.price) {
                    const subPrice = parseFloat(sub.price).toFixed(2);
                    if (subPrice === cardPrice) {
                      matchScore += 10;
                      console.log('[ET] Price match:', subPrice, 'for subscription', sub.id);
                    }
                  }
                  
                  // Match quantity (medium weight)
                  if (cardQuantity && sub.quantity) {
                    if (sub.quantity === cardQuantity) {
                      matchScore += 5;
                      console.log('[ET] Quantity match:', sub.quantity, 'for subscription', sub.id);
                    }
                  }
                  
                  // Match frequency (low weight)
                  if (hasWeekly && sub.order_interval_unit === 'week') {
                    matchScore += 1;
                    console.log('[ET] Frequency match: week for subscription', sub.id);
                  }
                  
                  // Bonus: Price + Quantity together (very reliable combination)
                  if (cardPrice && cardQuantity && sub.price && sub.quantity) {
                    const subPrice = parseFloat(sub.price).toFixed(2);
                    if (subPrice === cardPrice && sub.quantity === cardQuantity) {
                      matchScore += 15; // Big bonus for both matching
                      console.log('[ET] Price+Quantity combo match for subscription', sub.id);
                    }
                  }
                  
                  if (matchScore > bestScore) {
                    bestScore = matchScore;
                    bestMatch = sub;
                  }
                }
                
                // If we have a good match (date match is most reliable, or price+quantity combo)
                if (bestMatch && bestScore >= 15 && bestMatch.address_id) {
                  console.log('[ET] ✓✓✓ Matched subscription by properties (score', bestScore, '):', bestMatch.id, '-> address_id:', bestMatch.address_id);
                  return bestMatch.address_id;
                } else if (bestMatch && bestScore >= 10 && bestMatch.address_id) {
                  console.log('[ET] ✓✓ Matched subscription by properties (score', bestScore, '):', bestMatch.id, '-> address_id:', bestMatch.address_id);
                  return bestMatch.address_id;
                } else if (bestMatch && bestScore >= 5 && bestMatch.address_id) {
                  console.log('[ET] ✓ Matched subscription by properties (score', bestScore, '):', bestMatch.id, '-> address_id:', bestMatch.address_id);
                  return bestMatch.address_id;
                }
                
                console.warn('[ET] ⚠️ Could not match subscription by card properties, best score:', bestScore);
              }
              
              // PRIORITY 4: If we have address text, try to match subscription by address (last resort)
              if (addressText) {
                // Extract the street address from "Deliver to 1800 North Vermont AvenueEdit"
                const addressMatch = addressText.match(/Deliver to\s+(.+?)(?:Edit|Redeem|$)/i);
                const targetAddress = addressMatch ? addressMatch[1].trim() : addressText.replace(/Deliver to\s*/i, '').replace(/Edit.*$/i, '').replace(/Redeem.*$/i, '').trim();
                console.log('[ET] Looking for subscription matching address:', targetAddress);
                
                // Extract street number and street name for matching
                const targetParts = targetAddress.split(/\s+/).filter(p => p.length > 0);
                const streetNumber = targetParts[0]; // e.g., "1800"
                const streetName = targetParts.slice(1, 3).join(' ').toLowerCase(); // e.g., "north vermont"
                
                // Try to match subscription by matching its address_id's address details
                let bestAddressMatch = null;
                let bestAddressScore = 0;
                
                for (const sub of subscriptions) {
                  const addressId = sub.address_id;
                  if (!addressId) continue;
                  
                  const address = addressMap[addressId];
                  if (!address) continue;
                  
                  const addr1 = (address.address1 || '').trim().toLowerCase();
                  let addressScore = 0;
                  
                  // Match by street number (works even if address is masked like "1*******")
                  if (streetNumber && addr1 && addr1.includes(streetNumber.toLowerCase())) {
                    addressScore += 5;
                    console.log('[ET] Street number match:', streetNumber, 'in', addr1, 'for subscription', sub.id);
                  }
                  
                  // Match by street name (more specific)
                  if (streetName && addr1 && addr1.includes(streetName)) {
                    addressScore += 10;
                    console.log('[ET] Street name match:', streetName, 'in', addr1, 'for subscription', sub.id);
                  }
                  
                  // Full address match (most reliable)
                  if (targetAddress && addr1 && addr1.includes(targetAddress.toLowerCase().substring(0, 15))) {
                    addressScore += 15;
                    console.log('[ET] Full address match for subscription', sub.id);
                  }
                  
                  if (addressScore > bestAddressScore) {
                    bestAddressScore = addressScore;
                    bestAddressMatch = addressId;
                  }
                }
                
                if (bestAddressMatch && bestAddressScore >= 5) {
                  console.log('[ET] ✓ Matched subscription by address (score', bestAddressScore, '):', bestAddressMatch);
                  return bestAddressMatch;
                }
                
                console.warn('[ET] ⚠️ Could not match subscription by address text, best score:', bestAddressScore);
              }
              
              // LAST RESORT: Use first active subscription
              const activeSub = subscriptions.find(s => s.status === 'ACTIVE' || s.status === 'active') || subscriptions[0];
              const addressId = activeSub?.address_id;
              if (addressId) {
                console.log('[ET] ⚠️ Using first active subscription as fallback:', addressId);
                return addressId;
              }
            }
          } catch (error) {
            console.warn('[ET] Failed to get subscriptions/addresses:', error);
          }
        }
        
        // Fallback: Try address.listAddresses() with session (addresses are masked, less reliable)
        if (recharge.address && typeof recharge.address.listAddresses === 'function') {
          console.log('[ET] Fallback: Trying address.listAddresses()...');
          try {
            const response = await recharge.address.listAddresses(session);
            console.log('[ET] SDK returned address response:', response);
            
            // Handle different response structures
            const addresses = response?.addresses || response?.data?.addresses || (Array.isArray(response) ? response : []);
            
            if (addresses && addresses.length > 0) {
              // Since addresses are masked, we can't reliably match by text
              // Just return the first address as last resort
              const addressId = addresses[0].id;
              console.log('[ET] ⚠️ Using first address (addresses are masked, matching not reliable):', addressId);
              return addressId;
            }
          } catch (addrError) {
            console.warn('[ET] address.listAddresses failed:', addrError);
          }
        }
        
        console.warn('[ET] SDK methods not available. Available namespaces:', Object.keys(recharge));
      } catch (e) {
        console.error('[ET] SDK call failed:', e);
      }
      return null;
    }
    
    // Function to show error message in UI - robust version
    function showDiscountError(message, type = 'error') {
      // Ensure DOM is ready - use multiple checks
      if (typeof document === 'undefined') {
        console.warn('[ET] Document not available, using alert fallback');
        alert(message);
        return;
      }
      
      // Wait for DOM to be ready if needed
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          showDiscountError(message, type);
        });
        return;
      }
      
      if (!document.body) {
        // Wait a bit for body to be available
        setTimeout(() => {
          if (document.body) {
            showDiscountError(message, type);
          } else {
            console.warn('[ET] Body not available, using alert fallback');
            alert(message);
          }
        }, 100);
        return;
      }
      
      // Remove any existing error messages immediately
      const existingError = document.getElementById('et-discount-error-message');
      if (existingError) {
        try {
          existingError.remove();
        } catch (e) {
          // Ignore removal errors, continue anyway
        }
      }
      
      // Clean message - handle object errors
      let displayMessage = message;
      if (typeof message === 'object') {
        if (message.error) {
          displayMessage = typeof message.error === 'string' ? message.error : (message.error.message || 'An error occurred');
        } else if (message.message) {
          displayMessage = message.message;
        } else {
          displayMessage = JSON.stringify(message);
        }
      }
      
      // Create error message element
      const errorDiv = document.createElement('div');
      errorDiv.id = 'et-discount-error-message';
      errorDiv.setAttribute('data-et-error', 'true');
      
      // Use inline styles for maximum compatibility
      errorDiv.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: ${type === 'error' ? '#d32f2f' : '#f57c00'} !important;
        color: white !important;
        padding: 16px 24px !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        z-index: 9999999 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        max-width: 400px !important;
        min-width: 300px !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        opacity: 0 !important;
        transform: translateX(100%) !important;
        transition: opacity 0.3s ease, transform 0.3s ease !important;
      `;
      
      // Add animation styles if not already added
      if (!document.getElementById('et-error-animation-style')) {
        const style = document.createElement('style');
        style.id = 'et-error-animation-style';
        style.textContent = `
          @keyframes etSlideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes etSlideOutRight {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }
      
      // Add icon
      const icon = document.createElement('span');
      icon.textContent = type === 'error' ? '⚠️' : 'ℹ️';
      icon.style.cssText = 'font-size: 20px !important; flex-shrink: 0 !important; line-height: 1 !important;';
      
      // Add message text
      const messageText = document.createElement('div');
      messageText.textContent = displayMessage;
      messageText.style.cssText = 'flex: 1 !important; line-height: 1.4 !important; word-wrap: break-word !important;';
      
      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.setAttribute('type', 'button');
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.style.cssText = `
        background: none !important;
        border: none !important;
        color: white !important;
        font-size: 24px !important;
        cursor: pointer !important;
        padding: 0 !important;
        width: 24px !important;
        height: 24px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        line-height: 1 !important;
        opacity: 0.8 !important;
        transition: opacity 0.2s !important;
        flex-shrink: 0 !important;
      `;
      
      const closeError = () => {
        errorDiv.style.opacity = '0';
        errorDiv.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (errorDiv.parentElement) {
            try {
              errorDiv.remove();
            } catch (e) {
              // Ignore removal errors
            }
          }
        }, 300);
      };
      
      closeBtn.addEventListener('click', closeError);
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.opacity = '1';
      });
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.opacity = '0.8';
      });
      
      errorDiv.appendChild(icon);
      errorDiv.appendChild(messageText);
      errorDiv.appendChild(closeBtn);
      
      // Append to body
      try {
        document.body.appendChild(errorDiv);
        
        // Trigger animation after a tiny delay
        setTimeout(() => {
          errorDiv.style.opacity = '1';
          errorDiv.style.transform = 'translateX(0)';
        }, 10);
      } catch (e) {
        // Fallback to alert if DOM manipulation fails
        console.error('[ET] Failed to show error in UI:', e);
        alert(displayMessage);
        return;
      }
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (errorDiv.parentElement) {
          closeError();
        }
      }, 5000);
    }
    
    async function applyDiscountCode(code, context = null) {
      console.log('[ET] ===== applyDiscountCode called =====');
      console.log('[ET] Raw code parameter:', code);
      console.log('[ET] Code type:', typeof code);
      console.log('[ET] Context:', context);
      
      // Clean and validate the code
      if (!code || typeof code !== 'string' || code.trim() === '') {
        console.error('[ET] ✗ Invalid discount code:', code);
        console.error('[ET] Code is empty or invalid!');
        alert('Invalid discount code. Please check the code and try again.');
        return false;
      }
      
      // Trim whitespace and convert to uppercase (some systems are case-sensitive)
      const cleanCode = code.trim().toUpperCase();
      console.log('[ET] Cleaned code:', cleanCode);
      console.log('[ET] Clean code length:', cleanCode.length);
      
      if (cleanCode === '') {
        console.error('[ET] ✗ Clean code is empty after trimming!');
        return false;
      }
      
      // Prevent multiple calls for the same code
      if (isApplyingDiscount) {
        console.log('[ET] Discount application already in progress, skipping duplicate call');
        return false;
      }
      
      // If same code was just applied, skip
      if (lastAppliedCode === cleanCode) {
        console.log('[ET] Same code was just applied, skipping duplicate call');
        return true;
      }
      
      console.log('[ET] ✓ Applying discount code:', cleanCode);
      isApplyingDiscount = true;
      
      const activeContext = context || etLastSubscriptionContext || null;
      console.log('[ET] Active context for discount application:', activeContext);
      console.log('[ET] Active context addressId:', activeContext?.addressId);
      
      // Define observeRechargeDiscount function early so it's available for direct API calls
      const observeRechargeDiscount = (discountCode) => {
        let discountDetected = false;
        const observer = new MutationObserver(() => {
          if (discountDetected) return;
          
          const allElements = Array.from(document.querySelectorAll('*'));
          const discountElement = allElements.find(el => {
            const text = (el.textContent || '').trim();
            return text.includes('Discount') && 
                   (text.includes(discountCode) || text.match(/LL-[A-Z0-9]+/)) &&
                   text.includes('$') &&
                   !el.classList.contains('et-discount-line-item');
          });
          
          if (discountElement) {
            console.log('[ET] ✓✓✓ Recharge has added the discount to the order summary!');
            discountDetected = true;
            observer.disconnect();
            isApplyingDiscount = false;
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true
        });
        
        setTimeout(() => {
          if (!discountDetected) {
            observer.disconnect();
            isApplyingDiscount = false;
          }
        }, 10000);
      };
      
      // If we have context but no addressId, try to extract it from subscription card
      if (activeContext && !activeContext.addressId) {
        if (activeContext.subscriptionCard) {
          console.log('[ET] Context has subscriptionCard but no addressId, extracting...');
          const extractedAddressId = extractAddressIdFromCard(activeContext.subscriptionCard);
          if (extractedAddressId) {
            console.log('[ET] ✓ Extracted addressId from subscription card:', extractedAddressId);
            activeContext.addressId = extractedAddressId;
          } else {
            console.warn('[ET] ⚠️ Could not extract addressId from subscription card');
          }
        }
        
        // If still no addressId, try to find it from the page URL or any subscription links
        if (!activeContext.addressId) {
          console.log('[ET] Trying to find addressId from page URL or links...');
          const url = window.location.href;
          const urlMatch = url.match(/\/addresses\/(\d+)/);
          if (urlMatch && urlMatch[1]) {
            console.log('[ET] ✓ Found addressId from URL:', urlMatch[1]);
            activeContext.addressId = urlMatch[1];
          } else {
            // Look for any links on the page with addresses - try to match by address text
            const addressText = activeContext.addressText || '';
            const allPageLinks = Array.from(document.querySelectorAll('a[href*="addresses/"]'));
            console.log('[ET] Found', allPageLinks.length, 'links with addresses on page');
            
            // Try to match by address text
            if (addressText) {
              const addressMatch = addressText.match(/Deliver to\s+(.+?)(?:\n|$|Edit)/i);
              const targetAddress = addressMatch ? addressMatch[1].trim() : addressText;
              console.log('[ET] Looking for addressId matching address:', targetAddress);
              
              for (const link of allPageLinks) {
                const href = link.getAttribute('href') || '';
                const match = href.match(/\/addresses\/(\d+)/) || href.match(/addresses\/(\d+)/);
                if (match && match[1]) {
                  // Check if link is near our subscription card or contains similar text
                  const linkText = (link.textContent || '').trim();
                  const linkParent = link.closest('div, section');
                  const cardParent = activeContext.subscriptionCard?.closest('div, section');
                  
                  const isNearby = linkParent && cardParent && (
                    linkParent === cardParent ||
                    linkParent.contains(activeContext.subscriptionCard) ||
                    activeContext.subscriptionCard?.contains(linkParent)
                  );
                  
                  const textMatches = targetAddress.length > 5 && (
                    linkText.toLowerCase().includes(targetAddress.toLowerCase().substring(0, 10)) ||
                    (linkParent && (linkParent.textContent || '').toLowerCase().includes(targetAddress.toLowerCase().substring(0, 10)))
                  );
                  
                  if (isNearby || textMatches) {
                    console.log('[ET] ✓ Found addressId from page link (matched):', match[1]);
                    activeContext.addressId = match[1];
                    break;
                  }
                }
              }
            }
            
            // If still no match, use the first addressId found (last resort)
            if (!activeContext.addressId && allPageLinks.length > 0) {
              const firstLink = allPageLinks[0];
              const href = firstLink.getAttribute('href') || '';
              const match = href.match(/\/addresses\/(\d+)/) || href.match(/addresses\/(\d+)/);
              if (match && match[1]) {
                console.log('[ET] ⚠️ Using first addressId found on page (may not be correct):', match[1]);
                activeContext.addressId = match[1];
              }
            }
          }
        }
      }
      
      // PRIORITY: If we have addressId from context, use direct API call immediately
      // This is the most reliable way to apply discount to the correct subscription
      if (activeContext && activeContext.addressId) {
        console.log('[ET] ===== DIRECT API CALL MODE (addressId available) =====');
        console.log('[ET] AddressId from context:', activeContext.addressId);
        
        // Extract URL parameters
        const url = window.location.href;
        const urlMatch = url.match(/\/portal\/([^\/]+)\//);
        const tokenMatch = url.match(/[?&]token=([^&]+)/);
        
        if (urlMatch && tokenMatch && activeContext.addressId) {
          const portalId = urlMatch[1];
          const token = tokenMatch[1];
          const addressId = activeContext.addressId;
          
          const apiUrl = `${window.location.origin}/tools/recurring/portal/${portalId}/addresses/${addressId}/apply_discount?client=affinity&token=${token}`;
          console.log('[ET] ===== Making DIRECT API call =====');
          console.log('[ET] API URL:', apiUrl);
          console.log('[ET] Discount code:', cleanCode);
          console.log('[ET] Request will be: {"discount_code":"' + cleanCode + '"}');
          
          try {
            const requestBody = JSON.stringify({
              discount_code: cleanCode
            });
            
            console.log('[ET] Request body:', requestBody);
            
            const response = await fetch(apiUrl, {
              method: 'POST',
              body: requestBody,
              credentials: 'include',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
            
            console.log('[ET] API Response status:', response.status);
            console.log('[ET] API Response ok:', response.ok);
            
            if (response.ok || response.status === 200) {
              console.log('[ET] ✓✓✓✓✓ Discount applied successfully via DIRECT API call!');
              
              // Parse response if available
              let responseData = null;
              try {
                responseData = await response.json();
                console.log('[ET] API Response data:', responseData);
              } catch (e) {
                console.log('[ET] API call succeeded (non-JSON response)');
              }
              
              // Mark code as applied
              markCodeAppliedToSubscription(cleanCode, activeContext);
              
              // Wait 2 seconds for API to process, then refresh the order summary
              // Using progressive approach: try events first, then soft navigation, then fallback to location reload
              setTimeout(async () => {
                console.log('[ET] Refreshing order summary to show applied discount...');
                
                const recharge = window.recharge || window.ReCharge || window.Recharge;
                let refreshSuccess = false;
                
                // Strategy 1: Try to fetch updated data and trigger events (non-intrusive)
                try {
                  if (recharge && recharge.subscription && recharge.session && typeof recharge.subscription.listSubscriptions === 'function') {
                    console.log('[ET] Strategy 1: Fetching updated subscription data...');
                    await recharge.subscription.listSubscriptions(recharge.session);
                    console.log('[ET] Updated subscription data fetched');
                  }
                  
                  // Trigger comprehensive Recharge events
                  window.dispatchEvent(new CustomEvent('Recharge::update', { bubbles: true }));
                  window.dispatchEvent(new CustomEvent('Recharge::order::updated', { bubbles: true }));
                  window.dispatchEvent(new CustomEvent('Recharge::subscription::updated', { bubbles: true }));
                  window.dispatchEvent(new CustomEvent('Recharge::discount::applied', {
                    detail: { code: cleanCode },
                    bubbles: true
                  }));
                  
                  // Call Recharge SDK methods
                  if (recharge) {
                    if (typeof recharge.update === 'function') recharge.update();
                    if (typeof recharge.refresh === 'function') recharge.refresh();
                  }
                  
                  // Check if discount appeared after 1 second
                  setTimeout(() => {
                    const orderSummary = document.querySelector('[class*="order"], [class*="summary"], [id*="order"]');
                    const hasDiscount = orderSummary && Array.from(orderSummary.querySelectorAll('*')).some(el => {
                      const text = (el.textContent || '').toLowerCase();
                      return text.includes('discount') && text.includes('$') && 
                             !text.includes('apply') && !text.includes('redeem');
                    });
                    
                    if (hasDiscount) {
                      console.log('[ET] ✓ Discount visible after Strategy 1 - refresh successful!');
                      refreshSuccess = true;
                      return;
                    }
                    
                    // Strategy 2: Soft navigation - navigate to same page using Recharge's router (triggers data refresh)
                    console.log('[ET] Strategy 2: Attempting soft navigation to refresh data...');
                    const currentPath = window.location.pathname;
                    const token = new URLSearchParams(window.location.search).get('token');
                    
                    // Trigger location change event which should cause Recharge to re-fetch data
                    window.dispatchEvent(new CustomEvent('Recharge::location::change', {
                      bubbles: true,
                      detail: { 
                        pathname: currentPath, 
                        url: window.location.href,
                        forceRefresh: true
                      }
                    }));
                    
                    // Also try using history API to trigger a soft navigation
                    const currentState = window.history.state;
                    window.history.replaceState({ ...currentState, _refresh: Date.now() }, '', window.location.href);
                    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
                    
                    // Check again after 1.5 seconds
                    setTimeout(() => {
                      const orderSummary2 = document.querySelector('[class*="order"], [class*="summary"], [id*="order"]');
                      const hasDiscount2 = orderSummary2 && Array.from(orderSummary2.querySelectorAll('*')).some(el => {
                        const text = (el.textContent || '').toLowerCase();
                        return text.includes('discount') && text.includes('$') && 
                               !text.includes('apply') && !text.includes('redeem');
                      });
                      
                      if (hasDiscount2) {
                        console.log('[ET] ✓ Discount visible after Strategy 2 - refresh successful!');
                        refreshSuccess = true;
                        return;
                      }
                      
                      // Strategy 3: Last resort - soft page reload (preserves scroll position, faster than full reload)
                      console.log('[ET] Strategy 3: Performing soft page reload to ensure discount is visible...');
                      
                      // Create a full-screen loader overlay
                      const loaderOverlay = document.createElement('div');
                      loaderOverlay.id = 'et-reload-loader';
                      loaderOverlay.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(13, 60, 58, 0.95);
                        z-index: 99999;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      `;
                      
                      // Create spinner
                      const spinner = document.createElement('div');
                      spinner.style.cssText = `
                        width: 50px;
                        height: 50px;
                        border: 4px solid rgba(255, 255, 255, 0.3);
                        border-top: 4px solid white;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin-bottom: 20px;
                      `;
                      
                      // Add spinner animation
                      const style = document.createElement('style');
                      style.textContent = `
                        @keyframes spin {
                          0% { transform: rotate(0deg); }
                          100% { transform: rotate(360deg); }
                        }
                      `;
                      document.head.appendChild(style);
                      
                      // Create message
                      const message = document.createElement('div');
                      message.style.cssText = `
                        font-size: 18px;
                        font-weight: 600;
                        margin-bottom: 8px;
                        text-align: center;
                      `;
                      message.textContent = 'Updating Order Summary...';
                      
                      const subMessage = document.createElement('div');
                      subMessage.style.cssText = `
                        font-size: 14px;
                        opacity: 0.9;
                        text-align: center;
                        margin-top: 8px;
                      `;
                      subMessage.textContent = 'Please wait while we apply your discount';
                      
                      loaderOverlay.appendChild(spinner);
                      loaderOverlay.appendChild(message);
                      loaderOverlay.appendChild(subMessage);
                      document.body.appendChild(loaderOverlay);
                      
                      // Set flag in sessionStorage to show loader on page reload
                      sessionStorage.setItem('et-show-reload-loader', 'true');
                      sessionStorage.setItem('et-reload-message', 'Updating Order Summary...');
                      sessionStorage.setItem('et-reload-submessage', 'Please wait while we apply your discount');
                      
                      // Small delay to ensure loader is visible, then reload
                      setTimeout(() => {
                        // Soft reload - this will refresh the page but maintain the session
                        window.location.reload();
                      }, 300);
                      
                    }, 1500);
                    
                  }, 1000);
                  
                } catch (e) {
                  console.warn('[ET] Error in refresh strategies:', e);
                  // Fallback: trigger events and then soft reload with loader
                  window.dispatchEvent(new CustomEvent('Recharge::update', { bubbles: true }));
                  window.dispatchEvent(new CustomEvent('Recharge::order::updated', { bubbles: true }));
                  
                  setTimeout(() => {
                    console.log('[ET] Fallback: Performing soft page reload...');
                    
                    // Create loader overlay for fallback
                    const loaderOverlay = document.createElement('div');
                    loaderOverlay.id = 'et-reload-loader';
                    loaderOverlay.style.cssText = `
                      position: fixed;
                      top: 0;
                      left: 0;
                      width: 100%;
                      height: 100%;
                      background: rgba(13, 60, 58, 0.95);
                      z-index: 99999;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                      color: white;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    `;
                    
                    const spinner = document.createElement('div');
                    spinner.style.cssText = `
                      width: 50px;
                      height: 50px;
                      border: 4px solid rgba(255, 255, 255, 0.3);
                      border-top: 4px solid white;
                      border-radius: 50%;
                      animation: spin 1s linear infinite;
                      margin-bottom: 20px;
                    `;
                    
                    const message = document.createElement('div');
                    message.style.cssText = `
                      font-size: 18px;
                      font-weight: 600;
                      margin-bottom: 8px;
                      text-align: center;
                    `;
                    message.textContent = 'Updating Order Summary...';
                    
                    const subMessage = document.createElement('div');
                    subMessage.style.cssText = `
                      font-size: 14px;
                      opacity: 0.9;
                      text-align: center;
                      margin-top: 8px;
                    `;
                    subMessage.textContent = 'Please wait while we apply your discount';
                    
                    loaderOverlay.appendChild(spinner);
                    loaderOverlay.appendChild(message);
                    loaderOverlay.appendChild(subMessage);
                    document.body.appendChild(loaderOverlay);
                    
                    // Set flag in sessionStorage to show loader on page reload
                    sessionStorage.setItem('et-show-reload-loader', 'true');
                    sessionStorage.setItem('et-reload-message', 'Updating Order Summary...');
                    sessionStorage.setItem('et-reload-submessage', 'Please wait while we apply your discount');
                    
                    setTimeout(() => {
                      window.location.reload();
                    }, 300);
                  }, 1000);
                }
              }, 2000);
              
              isApplyingDiscount = false;
              lastAppliedCode = cleanCode;
              console.log('[ET] ===== DIRECT API CALL COMPLETE - RETURNING TRUE =====');
              return true; // SUCCESS - return early, don't fall through to UI flow
            } else {
              const errorText = await response.text();
              console.error('[ET] ✗ Direct API call failed:', response.status);
              console.error('[ET] Error response:', errorText);
              
              // Try to parse error if it's JSON
              let errorMessage = 'Failed to apply discount code. Please try again.';
              try {
                const errorData = JSON.parse(errorText);
                console.error('[ET] Error details:', errorData);
                
                // Extract user-friendly error message
                if (errorData.error) {
                  if (typeof errorData.error === 'string') {
                    errorMessage = errorData.error;
                  } else if (errorData.error.message) {
                    errorMessage = errorData.error.message;
                  } else if (errorData.error.error) {
                    errorMessage = errorData.error.error;
                  }
                } else if (errorData.message) {
                  errorMessage = errorData.message;
                }
                
                // Check for "already applied" error
                const errorStr = JSON.stringify(errorData).toLowerCase();
                if (errorStr.includes('already applied') || errorStr.includes('already have') || errorStr.includes('discount already')) {
                  errorMessage = 'You already applied a discount code.';
                }
              } catch (e) {
                // Not JSON, check if error text contains "already applied"
                if (errorText.toLowerCase().includes('already applied') || errorText.toLowerCase().includes('already have')) {
                  errorMessage = 'You already applied a discount code.';
                }
              }
              
              // Show error message in UI
              showDiscountError(errorMessage, 'error');
              
              // Even if API call fails, don't fall through to UI flow - return false
              isApplyingDiscount = false;
              return false;
            }
          } catch (error) {
            console.error('[ET] ✗ Direct API call error:', error);
            showDiscountError('Failed to apply discount code. Please try again.', 'error');
            isApplyingDiscount = false;
            return false;
          }
        } else {
          console.error('[ET] ✗ Missing required parameters for direct API call');
          console.error('[ET] portalId:', urlMatch ? urlMatch[1] : 'missing');
          console.error('[ET] token:', tokenMatch ? 'present' : 'missing');
          console.error('[ET] addressId:', activeContext.addressId);
          // Try to find addressId from page if we have portalId and token
          if (urlMatch && tokenMatch) {
            console.log('[ET] Attempting to find addressId from page...');
            const allPageLinks = Array.from(document.querySelectorAll('a[href*="addresses/"]'));
            if (allPageLinks.length > 0) {
              const firstLink = allPageLinks[0];
              const href = firstLink.getAttribute('href') || '';
              const match = href.match(/\/addresses\/(\d+)/) || href.match(/addresses\/(\d+)/);
              if (match && match[1]) {
                console.log('[ET] Found addressId from page, retrying API call:', match[1]);
                activeContext.addressId = match[1];
                // Retry the API call with found addressId
                const portalId = urlMatch[1];
                const token = tokenMatch[1];
                const apiUrl = `${window.location.origin}/tools/recurring/portal/${portalId}/addresses/${match[1]}/apply_discount?client=affinity&token=${token}`;
                
                try {
                  const requestBody = JSON.stringify({ discount_code: cleanCode });
                  const response = await fetch(apiUrl, {
                    method: 'POST',
                    body: requestBody,
                    credentials: 'include',
                    headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (response.ok || response.status === 200) {
                    console.log('[ET] ✓✓✓✓✓ Discount applied successfully via retry API call!');
                    forceRechargeRefresh();
                    window.dispatchEvent(new CustomEvent('Recharge::update', { bubbles: true }));
                    window.dispatchEvent(new CustomEvent('Recharge::location::change', { bubbles: true }));
                    window.dispatchEvent(new CustomEvent('Recharge::discount::applied', {
                      detail: { code: cleanCode },
                      bubbles: true
                    }));
                    observeRechargeDiscount(cleanCode);
                    markCodeAppliedToSubscription(cleanCode, activeContext);
                    setTimeout(() => {
                      forceRechargeRefresh();
                      document.dispatchEvent(new CustomEvent('Recharge::update', { bubbles: true }));
                      if (window.recharge && typeof window.recharge.update === 'function') {
                        window.recharge.update();
                      }
                    }, 300);
                    setTimeout(() => forceRechargeRefresh(), 1500);
                    setTimeout(() => forceRechargeRefresh(), 3000);
                    isApplyingDiscount = false;
                    lastAppliedCode = cleanCode;
                    return true;
                  } else {
                    const errorText = await response.text();
                    console.error('[ET] Retry API call failed:', response.status, errorText);
                    
                    // Parse and show error message
                    let errorMessage = 'Failed to apply discount code. Please try again.';
                    try {
                      const errorData = JSON.parse(errorText);
                      if (errorData.error) {
                        if (typeof errorData.error === 'string') {
                          errorMessage = errorData.error;
                        } else if (errorData.error.message) {
                          errorMessage = errorData.error.message;
                        }
                      } else if (errorData.message) {
                        errorMessage = errorData.message;
                      }
                      
                      const errorStr = JSON.stringify(errorData).toLowerCase();
                      if (errorStr.includes('already applied') || errorStr.includes('already have')) {
                        errorMessage = 'You already applied a discount code.';
                      }
                    } catch (e) {
                      if (errorText.toLowerCase().includes('already applied') || errorText.toLowerCase().includes('already have')) {
                        errorMessage = 'You already applied a discount code.';
                      }
                    }
                    
                    showDiscountError(errorMessage, 'error');
                  }
                } catch (error) {
                  console.error('[ET] Retry API call also failed:', error);
                  showDiscountError('Failed to apply discount code. Please try again.', 'error');
                }
              }
            }
          }
          // Fall through to try extracting addressId from subscription card
        }
      } else {
        console.log('[ET] No addressId in context, will try to extract from subscription card or use UI flow');
      }
      
      // Helper function to find and click the apply button
      const findAndClickApplyButton = (inputElement) => {
        console.log('[ET] ===== Looking for Recharge Apply button =====');
        console.log('[ET] Input element:', inputElement);
        if (!inputElement) {
          console.log('[ET] ✗ No input element provided');
          return false;
        }
        
        // Strategy 1: Find button with exact text "Apply discount code" or "Apply"
        console.log('[ET] Strategy 1: Searching all buttons for "Apply discount code" text...');
        const allButtons = Array.from(document.querySelectorAll('button'));
        console.log('[ET] Found', allButtons.length, 'total buttons on page');
        
        // First, try exact match for "Apply discount code"
        let applyBtn = allButtons.find(btn => {
          const text = (btn.textContent || '').trim();
          return text === 'Apply discount code';
        });
        
        if (applyBtn) {
          console.log('[ET] ✓ Found exact match: "Apply discount code"');
        } else {
          // Try other variations
          applyBtn = allButtons.find(btn => {
            const text = (btn.textContent || '').trim().toLowerCase();
            const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
            const matches = text === 'apply' ||
                   text.includes('apply discount') ||
                   (text.includes('apply') && text.includes('discount')) ||
                   ariaLabel.includes('apply');
            if (matches) {
              console.log('[ET] Found matching button:', { text, ariaLabel });
            }
            return matches;
          });
        }
        
        // Strategy 2: Find button near the input (sibling or parent)
        if (!applyBtn) {
          console.log('[ET] Strategy 2: Looking for button near input...');
          applyBtn = inputElement.nextElementSibling ||
                    inputElement.previousElementSibling ||
                    inputElement.parentElement?.querySelector('button') ||
                    inputElement.closest('div')?.querySelector('button[type="submit"]') ||
                    inputElement.closest('form')?.querySelector('button[type="submit"]');
          if (applyBtn) {
            console.log('[ET] Found button near input:', applyBtn);
          }
        }
        
        // Strategy 3: Find any button with "apply" in text within the modal/form
        if (!applyBtn) {
          console.log('[ET] Strategy 3: Searching within modal/form...');
          const container = inputElement.closest('div, form, section, [role="dialog"]');
          if (container) {
            console.log('[ET] Container found:', container);
            const containerButtons = Array.from(container.querySelectorAll('button'));
            console.log('[ET] Found', containerButtons.length, 'buttons in container');
            applyBtn = containerButtons.find(btn => {
              const text = (btn.textContent || '').toLowerCase();
              const isVisible = btn.offsetParent !== null;
              const matches = text.includes('apply') && isVisible;
              if (matches) {
                console.log('[ET] Found matching button in container:', { text, isVisible });
              }
              return matches;
            });
          }
        }
        
        if (applyBtn) {
          console.log('[ET] ✓✓✓ Found Recharge Apply button!');
          console.log('[ET] Button details:', {
            text: applyBtn.textContent,
            ariaLabel: applyBtn.getAttribute('aria-label'),
            type: applyBtn.type,
            className: applyBtn.className,
            tagName: applyBtn.tagName,
            isVisible: applyBtn.offsetParent !== null
          });
          
          // Check if button is visible and enabled
          if (applyBtn.offsetParent === null) {
            console.log('[ET] ⚠️ Button is not visible, but trying to click anyway');
          }
          
          if (applyBtn.disabled) {
            console.log('[ET] ⚠️ Button is disabled, waiting a bit...');
            setTimeout(() => {
              if (!applyBtn.disabled) {
                console.log('[ET] Button is now enabled, clicking...');
                applyBtn.click();
                console.log('[ET] ✓✓✓ Apply button clicked!');
              } else {
                console.log('[ET] ⚠️ Button still disabled, clicking anyway...');
                applyBtn.click();
              }
            }, 300);
          } else {
            // Use a small delay to ensure Recharge has processed the input
            setTimeout(() => {
              console.log('[ET] Clicking Apply button...');
              applyBtn.click();
              console.log('[ET] ✓✓✓ Apply button clicked!');
            }, 200);
          }
          return true;
        }
        
        console.log('[ET] ✗ Could not find Apply button');
        console.log('[ET] Available buttons in modal:', Array.from(inputElement.closest('[role="dialog"], .modal')?.querySelectorAll('button') || []).map(b => ({
          text: b.textContent?.trim(),
          ariaLabel: b.getAttribute('aria-label'),
          type: b.type
        })));
        return false;
      };
      
      // REMOVED: All custom UI update code - We let Recharge handle everything natively
      // Recharge will automatically display the discount in the order summary after form submission
      // observeRechargeDiscount is defined earlier in this function
      
      // REMOVED: updateTotalWithDiscount - Recharge handles total updates
      // REMOVED: All custom discount line item creation - Recharge displays it natively
      
      // REMOVED: callApplyDiscountAPI - We should NOT call API directly
      // Only use Recharge's native form submission which handles everything
      
      // REMOVED: All the old custom UI update code - completely removed
      // REMOVED: callApplyDiscountAPI function - We should NOT call API directly
      // Only use Recharge's native form submission which handles everything
      
      // Helper to extract URL parameters for API call
      const extractRechargeParams = async () => {
        try {
          const url = window.location.href;
          const urlMatch = url.match(/\/portal\/([^\/]+)\//);
          const tokenMatch = url.match(/[?&]token=([^&]+)/);
          let addressId = null;
          
          // First, try to get addressId from context (subscription from which rewards were redeemed)
          if (activeContext && activeContext.addressId) {
            addressId = activeContext.addressId;
            console.log('[ET] Using addressId from context:', addressId);
          } else {
            // Fallback to URL
            const addressMatch = url.match(/\/addresses\/(\d+)/);
            addressId = addressMatch ? addressMatch[1] : null;
            console.log('[ET] Using addressId from URL:', addressId);
          }
          
          // If still no addressId, try SDK
          if (!addressId) {
            console.log('[ET] No addressId found, trying SDK...');
            const addressText = activeContext?.addressText || null;
            const subscriptionCard = activeContext?.subscriptionCard || null;
            addressId = await getAddressIdFromSDK(addressText, subscriptionCard);
            if (addressId) {
              console.log('[ET] ✓ Got addressId from SDK:', addressId);
            } else {
              console.warn('[ET] ⚠️ SDK did not return addressId');
            }
          }
          
          return {
            portalId: urlMatch ? urlMatch[1] : null,
            token: tokenMatch ? tokenMatch[1] : null,
            addressId: addressId
          };
        } catch (e) {
          console.error('[ET] Error extracting URL params:', e);
          return { portalId: null, token: null, addressId: null };
        }
      };
      
      // If we already handled it with direct API call above, don't continue
      // (The direct API call returns early if successful)
      
      // FALLBACK: Try to extract addressId from subscription card if we have context but no addressId
      if (activeContext && activeContext.subscriptionCard && !activeContext.addressId) {
        console.log('[ET] Attempting to extract addressId from subscription card...');
        const extractedAddressId = extractAddressIdFromCard(activeContext.subscriptionCard);
        if (extractedAddressId) {
          console.log('[ET] Found addressId from subscription card:', extractedAddressId);
          activeContext.addressId = extractedAddressId;
          
          // Retry with extracted addressId
          const url = window.location.href;
          const urlMatch = url.match(/\/portal\/([^\/]+)\//);
          const tokenMatch = url.match(/[?&]token=([^&]+)/);
          
          if (urlMatch && tokenMatch && extractedAddressId) {
            const portalId = urlMatch[1];
            const token = tokenMatch[1];
            const apiUrl = `${window.location.origin}/tools/recurring/portal/${portalId}/addresses/${extractedAddressId}/apply_discount?client=affinity&token=${token}`;
            
            console.log('[ET] Retrying with extracted addressId:', apiUrl);
            try {
              const requestBody = JSON.stringify({
                discount_code: cleanCode
              });
              
              const response = await fetch(apiUrl, {
                method: 'POST',
                body: requestBody,
                credentials: 'include',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok || response.status === 200) {
                console.log('[ET] ✓✓✓ Discount applied successfully via API (extracted addressId)!');
                
                forceRechargeRefresh();
                window.dispatchEvent(new CustomEvent('Recharge::update', { bubbles: true }));
                window.dispatchEvent(new CustomEvent('Recharge::location::change', { bubbles: true }));
                window.dispatchEvent(new CustomEvent('Recharge::discount::applied', {
                  detail: { code: cleanCode },
                  bubbles: true
                }));
                
                observeRechargeDiscount(cleanCode);
                markCodeAppliedToSubscription(cleanCode, activeContext);
                
                setTimeout(() => {
                  forceRechargeRefresh();
                  document.dispatchEvent(new CustomEvent('Recharge::update', { bubbles: true }));
                  if (window.recharge && typeof window.recharge.update === 'function') {
                    window.recharge.update();
                  }
                }, 500);
                setTimeout(() => forceRechargeRefresh(), 1500);
                setTimeout(() => forceRechargeRefresh(), 3000);
                
                isApplyingDiscount = false;
                lastAppliedCode = cleanCode;
                return true;
              } else {
                const errorText = await response.text();
                console.error('[ET] API call with extracted addressId failed:', response.status, errorText);
                
                // Parse and show error message
                let errorMessage = 'Failed to apply discount code. Please try again.';
                try {
                  const errorData = JSON.parse(errorText);
                  if (errorData.error) {
                    if (typeof errorData.error === 'string') {
                      errorMessage = errorData.error;
                    } else if (errorData.error.message) {
                      errorMessage = errorData.error.message;
                    }
                  } else if (errorData.message) {
                    errorMessage = errorData.message;
                  }
                  
                  const errorStr = JSON.stringify(errorData).toLowerCase();
                  if (errorStr.includes('already applied') || errorStr.includes('already have')) {
                    errorMessage = 'You already applied a discount code.';
                  }
                } catch (e) {
                  if (errorText.toLowerCase().includes('already applied') || errorText.toLowerCase().includes('already have')) {
                    errorMessage = 'You already applied a discount code.';
                  }
                }
                
                showDiscountError(errorMessage, 'error');
              }
            } catch (error) {
              console.error('[ET] API call with extracted addressId error:', error);
              showDiscountError('Failed to apply discount code. Please try again.', 'error');
            }
          }
        }
      }
      
      // If we don't have addressId, fall back to UI flow (opening modal, etc.)
      // This should rarely happen if addressId extraction is working
      console.log('[ET] ===== Falling back to UI flow (no addressId available) =====');
      
      try {
        // Use Recharge's native flow: Open modal, fill code, click Apply
        // This ensures Recharge handles the API call and UI update properly
        console.log('[ET] ===== Starting UI-based discount application flow =====');
        console.log('[ET] Code to apply:', cleanCode);
        console.log('[ET] Context:', context);
      
      // Step 1: Check if modal is already open
      console.log('[ET] Step 1: Checking for existing modal...');
      const existingModal = document.querySelector('[role="dialog"], .modal, [class*="modal"]');
      let discountInput = null;
      
      if (existingModal) {
        console.log('[ET] Found existing modal:', existingModal);
        // Modal is open, find input in modal
        const modalInputs = existingModal.querySelectorAll('input[type="text"], input:not([type]), input[type="email"]');
        console.log('[ET] Found', modalInputs.length, 'inputs in modal');
        for (const input of modalInputs) {
          const isVisible = input.offsetParent !== null && 
                          window.getComputedStyle(input).display !== 'none';
          const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();
          const isDiscountInput = placeholder.includes('discount') || 
                                 placeholder.includes('code') ||
                                 placeholder.includes('reward');
          console.log('[ET] Input:', { 
            visible: isVisible, 
            placeholder: input.getAttribute('placeholder'),
            isDiscountInput: isDiscountInput
          });
          if (!isVisible) continue;
          if (isDiscountInput || modalInputs.length === 1) {
            discountInput = input;
            console.log('[ET] ✓ Selected discount input:', discountInput);
            break;
          }
        }
      } else {
        console.log('[ET] No existing modal found');
      }
      
      // Step 2: If no input found, try to open the modal
      if (!discountInput) {
        console.log('[ET] Step 2: Discount input not found, trying to open discount modal...');
        const allButtons = Array.from(document.querySelectorAll('button, a, span[role="button"], [role="button"]'));
        console.log('[ET] Found', allButtons.length, 'total buttons/links');
        
        const redeemButtons = allButtons.filter(btn => {
          const text = (btn.textContent || '').toLowerCase().trim();
          const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
          const href = (btn.getAttribute('href') || '').toLowerCase();
          const matches = text.includes('redeem rewards') || 
                 text.includes('apply discount') || 
                 text.includes('redeem rewards or apply discount') ||
                 ariaLabel.includes('discount') ||
                 ariaLabel.includes('redeem') ||
                 href.includes('discount') ||
                 href.includes('redeem');
          if (matches) {
            console.log('[ET] Found redeem button:', { text, ariaLabel, href });
          }
          return matches;
        });
        
        console.log('[ET] Found', redeemButtons.length, 'redeem buttons');
        
        if (redeemButtons.length > 0) {
          const targetButton = redeemButtons[0];
          console.log('[ET] Clicking redeem button to open modal:', targetButton);
          console.log('[ET] Button details:', {
            tagName: targetButton.tagName,
            text: targetButton.textContent,
            href: targetButton.getAttribute('href'),
            className: targetButton.className
          });
          
          // Click the button
          targetButton.click();
          
          // Fallback: Direct API call if UI interaction fails
          const applyDiscountViaAPI = async () => {
            console.log('[ET] ===== Attempting direct API call as fallback =====');
            const params = await extractRechargeParams();
            
            if (!params.portalId || !params.token || !params.addressId) {
              console.error('[ET] ✗ Missing required URL parameters for API call');
              console.log('[ET] Params:', params);
              // Try to extract from current URL more aggressively
              const currentUrl = window.location.href;
              console.log('[ET] Current URL:', currentUrl);
              return false;
            }
            
            // Try POST method first (most common)
            const apiUrl = `${window.location.origin}/tools/recurring/portal/${params.portalId}/addresses/${params.addressId}/apply_discount?client=affinity&token=${params.token}`;
            console.log('[ET] API URL:', apiUrl);
            
            try {
              // Use JSON format as per Recharge API documentation (from curl example)
              const requestBody = JSON.stringify({
                discount_code: cleanCode
              });
              
              console.log('[ET] Request body:', requestBody);
              
              const response = await fetch(apiUrl, {
                method: 'POST',
                body: requestBody,
                credentials: 'include',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              });
              
              console.log('[ET] API Response status:', response.status);
              
              if (response.ok || response.status === 200) {
                console.log('[ET] ✓✓✓ Discount applied via API!');
                
                // Trigger comprehensive UI refresh
                forceRechargeRefresh();
                
                // Trigger Recharge UI update events
                window.dispatchEvent(new CustomEvent('Recharge::update', { bubbles: true }));
                window.dispatchEvent(new CustomEvent('Recharge::location::change', { bubbles: true }));
                window.dispatchEvent(new CustomEvent('Recharge::discount::applied', {
                  detail: { code: cleanCode },
                  bubbles: true
                }));
                
                // Start observing for Recharge to add discount
                observeRechargeDiscount(cleanCode);
                
                // Mark code as applied
                if (activeContext) {
                  markCodeAppliedToSubscription(cleanCode, activeContext);
                }
                
                // Try to trigger Recharge's native update mechanisms with multiple attempts
                setTimeout(() => {
                  forceRechargeRefresh();
                  document.dispatchEvent(new CustomEvent('Recharge::update', { bubbles: true }));
                  
                  // If Recharge has a refresh method, call it
                  if (window.recharge && typeof window.recharge.update === 'function') {
                    window.recharge.update();
                  }
                }, 500);
                
                setTimeout(() => {
                  forceRechargeRefresh();
                }, 1500);
                
                setTimeout(() => {
                  forceRechargeRefresh();
                }, 3000);
                
                isApplyingDiscount = false;
                lastAppliedCode = cleanCode;
                return true;
              } else {
                const errorText = await response.text();
                console.error('[ET] ✗ API call failed:', response.status, errorText);
                
                // Parse and show error message
                let errorMessage = 'Failed to apply discount code. Please try again.';
                try {
                  const errorData = JSON.parse(errorText);
                  if (errorData.error) {
                    if (typeof errorData.error === 'string') {
                      errorMessage = errorData.error;
                    } else if (errorData.error.message) {
                      errorMessage = errorData.error.message;
                    }
                  } else if (errorData.message) {
                    errorMessage = errorData.message;
                  }
                  
                  const errorStr = JSON.stringify(errorData).toLowerCase();
                  if (errorStr.includes('already applied') || errorStr.includes('already have')) {
                    errorMessage = 'You already applied a discount code.';
                  }
                } catch (e) {
                  if (errorText.toLowerCase().includes('already applied') || errorText.toLowerCase().includes('already have')) {
                    errorMessage = 'You already applied a discount code.';
                  }
                }
                
                showDiscountError(errorMessage, 'error');
                return false;
              }
            } catch (error) {
              console.error('[ET] ✗ API call error:', error);
              showDiscountError('Failed to apply discount code. Please try again.', 'error');
              return false;
            }
          };
          
          // Wait for modal to open and find input
          const waitForModal = (attempts = 0) => {
            if (attempts > 30) {
              console.error('[ET] ✗ Modal did not open after 30 attempts');
              console.log('[ET] Falling back to direct API call...');
              // Try API fallback
              applyDiscountViaAPI().then(success => {
                if (!success) {
                  console.error('[ET] ✗ Both UI interaction and API fallback failed');
                  isApplyingDiscount = false;
                }
              });
              return;
            }
            
            setTimeout(() => {
              console.log(`[ET] Attempt ${attempts + 1}: Looking for discount modal...`);
              
              // Strategy 1: Look for modals with discount/redeem rewards content (PRIORITY)
              const allModals = Array.from(document.querySelectorAll('[role="dialog"], .modal, [class*="modal"], [class*="Modal"]'));
              let modal = null;
              
              // Filter out cart drawer and find discount modal
              for (const candidateModal of allModals) {
                const modalText = (candidateModal.textContent || '').trim();
                const ariaLabel = (candidateModal.getAttribute('aria-label') || '').trim();
                const modalClasses = candidateModal.className || '';
                
                // Skip cart drawer
                if (ariaLabel.includes('Your cart') || ariaLabel.includes('cart') || 
                    modalClasses.includes('drawer_inner') || modalText.includes('Your cart')) {
                  console.log('[ET] Skipping cart drawer modal:', ariaLabel);
                  continue;
                }
                
                // Look for discount/redeem rewards modal by content
                const hasDiscountContent = modalText.includes('Redeem Rewards') || 
                                          modalText.includes('Apply Discount') ||
                                          modalText.includes('Paste the reward') ||
                                          modalText.includes('discount code') ||
                                          modalText.includes('Enter code');
                
                if (hasDiscountContent) {
                  modal = candidateModal;
                  console.log('[ET] ✓ Found discount modal by content:', modal);
          break;
        }
      }
      
              // Strategy 2: If not found, try generic selectors but exclude cart
              if (!modal) {
                const candidates = document.querySelectorAll('[role="dialog"]');
                for (const candidate of candidates) {
                  const ariaLabel = (candidate.getAttribute('aria-label') || '').trim();
                  const modalClasses = candidate.className || '';
                  if (!ariaLabel.includes('cart') && !modalClasses.includes('drawer_inner')) {
                    modal = candidate;
                    console.log('[ET] ✓ Found modal (excluding cart):', modal);
                    break;
                  }
                }
              }
              
              if (modal) {
                console.log('[ET] ✓ Modal found:', modal);
                console.log('[ET] Modal classes:', modal.className);
                console.log('[ET] Modal ID:', modal.id);
                console.log('[ET] Modal aria-label:', modal.getAttribute('aria-label'));
                console.log('[ET] Modal text preview:', (modal.textContent || '').substring(0, 200));
                
                // Look for discount input field - prioritize text inputs
                let modalInputs = Array.from(modal.querySelectorAll('input[type="text"]'));
                
                // If no text inputs, try inputs without type (defaults to text)
                if (modalInputs.length === 0) {
                  modalInputs = Array.from(modal.querySelectorAll('input:not([type])'));
                }
                
                // Also check for textarea (some modals use textarea)
                if (modalInputs.length === 0) {
                  const textareas = Array.from(modal.querySelectorAll('textarea'));
                  if (textareas.length > 0) {
                    console.log('[ET] Found textarea instead of input, using it');
                    modalInputs = textareas;
                  }
                }
                
                // Last resort: all inputs but filter by type
                if (modalInputs.length === 0) {
                  modalInputs = Array.from(modal.querySelectorAll('input')).filter(inp => {
                    const type = inp.type || 'text';
                    return type === 'text' || type === 'email' || !type;
                  });
                }
                
                console.log('[ET] Found', modalInputs.length, 'text inputs in modal');
                
                // Find the discount input - must be visible and look like a discount input
                for (const input of modalInputs) {
                  const computedStyle = window.getComputedStyle(input);
                  const isVisible = input.offsetParent !== null && 
                                  computedStyle.display !== 'none' &&
                                  computedStyle.visibility !== 'hidden' &&
                                  computedStyle.opacity !== '0' &&
                                  input.getBoundingClientRect().width > 0 &&
                                  input.getBoundingClientRect().height > 0;
                  
                  const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();
                  const inputValue = (input.value || '').trim();
                  const inputName = (input.getAttribute('name') || '').toLowerCase();
                  const inputId = (input.getAttribute('id') || '').toLowerCase();
                  
                  // Check if this looks like a discount input
                  const isDiscountInput = placeholder.includes('discount') || 
                                         placeholder.includes('code') ||
                                         placeholder.includes('reward') ||
                                         placeholder.includes('coupon') ||
                                         inputName.includes('discount') ||
                                         inputName.includes('code') ||
                                         inputId.includes('discount') ||
                                         inputId.includes('code') ||
                                         inputValue.startsWith('LL-');
                  
                  console.log('[ET] Input:', { 
                    visible: isVisible, 
                    placeholder: input.getAttribute('placeholder'),
                    value: inputValue,
                    name: input.getAttribute('name'),
                    id: input.getAttribute('id'),
                    type: input.type,
                    isDiscountInput: isDiscountInput,
                    width: input.getBoundingClientRect().width,
                    height: input.getBoundingClientRect().height
                  });
                  
                  if (!isVisible) {
                    console.log('[ET] Input is not visible, skipping');
                    continue;
                  }
                  
                  // Prefer discount inputs, but accept any visible text input if it's the only one
                  if (isDiscountInput || (modalInputs.length === 1 && isVisible)) {
            discountInput = input;
                    console.log('[ET] ✓✓✓ Selected discount input:', discountInput);
                    console.log('[ET] Input details:', {
                      value: discountInput.value,
                      placeholder: discountInput.getAttribute('placeholder'),
                      type: discountInput.type,
                      id: discountInput.id,
                      name: discountInput.getAttribute('name'),
                      className: discountInput.className
                    });
            break;
        }
      }
      
      if (discountInput) {
                  console.log('[ET] ✓✓✓ Found Recharge discount input in modal! Using native flow');
                  console.log('[ET] Input element:', discountInput);
                  console.log('[ET] Input value before:', discountInput.value);
                  
                  // Clear any existing value first
                  discountInput.value = '';
                  
        // Set the code value
        discountInput.value = cleanCode;
                  console.log('[ET] ✓ Set input value to:', discountInput.value);
                  
                  // Focus the input
        discountInput.focus();
                  console.log('[ET] ✓ Focused input');
        
                  // Trigger input events to let Recharge know the value changed
                  console.log('[ET] Triggering input events...');
                  discountInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                  discountInput.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                  discountInput.dispatchEvent(new Event('keyup', { bubbles: true }));
        
                  // Also trigger focus/blur to ensure Recharge processes it
                  discountInput.dispatchEvent(new Event('focus', { bubbles: true }));
        setTimeout(() => {
                    discountInput.dispatchEvent(new Event('blur', { bubbles: true }));
                  }, 50);
                  
                  // Start observing for Recharge to add discount (for logging only)
                  observeRechargeDiscount(cleanCode);
                  
                  // Wait for Recharge to fully initialize, then submit the form
                  setTimeout(() => {
                    console.log('[ET] ===== Submitting discount form =====');
                    
                    // Strategy 1: Find and submit the form (most reliable)
                    const form = discountInput.closest('form');
                    if (form) {
                      console.log('[ET] ✓ Found form, submitting it...');
                      console.log('[ET] Form details:', {
                        action: form.action,
                        method: form.method,
                        id: form.id,
                        className: form.className
                      });
                      
                      // Create and dispatch submit event
                      const submitEvent = new Event('submit', {
                        bubbles: true,
                        cancelable: true
                      });
                      
                      // Try to submit the form
                      try {
                        form.dispatchEvent(submitEvent);
                        // Also try actual form submission
                        if (!submitEvent.defaultPrevented) {
                          form.requestSubmit();
                        }
                        console.log('[ET] ✓✓✓ Form submitted! Recharge will handle API call and UI update.');
                        if (activeContext) {
                          markCodeAppliedToSubscription(cleanCode, activeContext);
                        }
                        return;
                      } catch (e) {
                        console.log('[ET] Form.requestSubmit() failed, trying button click:', e);
                      }
                    }
                    
                    // Strategy 2: Find and click "Apply discount code" button
                    console.log('[ET] Looking for Apply button...');
                    const allButtons = Array.from(document.querySelectorAll('button'));
                    const applyButton = allButtons.find(btn => {
                      const text = (btn.textContent || '').trim();
                      const isVisible = btn.offsetParent !== null;
                      return (text === 'Apply discount code' || text === 'Apply') && isVisible;
                    });
          
                    if (applyButton) {
                      console.log('[ET] ✓ Found Apply button:', applyButton.textContent);
                      console.log('[ET] Button details:', {
                        type: applyButton.type,
                        disabled: applyButton.disabled,
                        className: applyButton.className
                      });
                      
                      // Wait a tiny bit if button is disabled
                      if (applyButton.disabled) {
                        console.log('[ET] Button is disabled, waiting...');
                        setTimeout(() => {
                          if (!applyButton.disabled) {
                            applyButton.click();
                            console.log('[ET] ✓✓✓ Apply button clicked!');
          } else {
                            // Force click even if disabled
                            applyButton.click();
                            console.log('[ET] ✓✓✓ Apply button clicked (forced)!');
                          }
                        }, 200);
                      } else {
                        applyButton.click();
                        console.log('[ET] ✓✓✓ Apply button clicked!');
                      }
                      
                      if (activeContext) {
                        markCodeAppliedToSubscription(cleanCode, activeContext);
                      }
                      return;
                    }
                    
                    // Strategy 3: Try findAndClickApplyButton helper
                    const clicked = findAndClickApplyButton(discountInput);
                    if (clicked) {
                      console.log('[ET] ✓✓✓ Apply button clicked via helper!');
                      if (activeContext) {
                        markCodeAppliedToSubscription(cleanCode, activeContext);
                      }
                      return;
                    }
                    
                    // Strategy 4: Find submit button in form
                    if (form) {
                      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
                      if (submitBtn) {
                        console.log('[ET] ✓ Found form submit button, clicking');
                        submitBtn.click();
                        if (activeContext) {
                          markCodeAppliedToSubscription(cleanCode, activeContext);
                        }
                        return;
                      }
                    }
                    
                    // Strategy 5: Simulate Enter key press
                    console.log('[ET] Trying Enter key press as last resort...');
            const enterEvent = new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true,
              cancelable: true
            });
            discountInput.dispatchEvent(enterEvent);
            
            discountInput.dispatchEvent(new KeyboardEvent('keyup', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              bubbles: true
            }));
                    
                    console.log('[ET] ⚠️ All strategies attempted, Recharge should process the discount');
                  }, 800); // Give Recharge time to initialize the form
                  
                  return; // Exit waitForModal - we found and filled the input
                } else {
                  console.log('[ET] Input not found in modal, retrying... (attempt', attempts + 1, ')');
                  // If we've tried many times and still no input, try API fallback
                  if (attempts >= 25) {
                    console.log('[ET] Too many attempts without finding input, trying API fallback...');
                    applyDiscountViaAPI().then(success => {
                      if (success) {
                        return; // Success, exit
                      } else {
                        waitForModal(attempts + 1);
                      }
                    });
                    return;
                  }
                  waitForModal(attempts + 1);
                }
              } else {
                console.log('[ET] Modal not found yet, retrying...');
                // If we've tried many times and still no modal, try API fallback
                if (attempts >= 25) {
                  console.log('[ET] Too many attempts without finding modal, trying API fallback...');
                  applyDiscountViaAPI().then(success => {
                    if (success) {
                      return; // Success, exit
                    } else {
                      waitForModal(attempts + 1);
                    }
                  });
                  return;
                }
                waitForModal(attempts + 1);
              }
            }, 300); // Increased delay between attempts
          };
          
          waitForModal();
          return true;
        } else {
          console.error('[ET] ✗ No redeem buttons found!');
          console.log('[ET] Available buttons:', Array.from(document.querySelectorAll('button, a')).slice(0, 10).map(b => ({
            text: b.textContent?.trim(),
            href: b.getAttribute('href'),
            className: b.className
          })));
        }
      }
      
      // Step 3: If input found, use Recharge's native flow
      if (discountInput) {
        console.log('[ET] Found Recharge discount input, using native flow');
        
        // Clear any existing value
        discountInput.value = '';
        
        // Set the code value
        discountInput.value = cleanCode;
        discountInput.focus();
        
        // Trigger input events to let Recharge know the value changed
        discountInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        discountInput.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        
        // Also trigger focus/blur to ensure Recharge processes it
        discountInput.dispatchEvent(new Event('focus', { bubbles: true }));
        discountInput.dispatchEvent(new Event('blur', { bubbles: true }));
        
        // Wait for Recharge to fully initialize, then submit the form
        setTimeout(() => {
          console.log('[ET] ===== Submitting discount form (existing modal) =====');
          
          // Strategy 1: Find and submit the form (most reliable)
          const form = discountInput.closest('form');
          if (form) {
            console.log('[ET] ✓ Found form, submitting it...');
            console.log('[ET] Form details:', {
              action: form.action,
              method: form.method,
              id: form.id,
              className: form.className
            });
            
            // Create and dispatch submit event
            const submitEvent = new Event('submit', {
              bubbles: true,
              cancelable: true
            });
            
            // Try to submit the form
            try {
              form.dispatchEvent(submitEvent);
              // Also try actual form submission
              if (!submitEvent.defaultPrevented) {
                form.requestSubmit();
              }
              console.log('[ET] ✓✓✓ Form submitted!');
              if (activeContext) {
                markCodeAppliedToSubscription(cleanCode, activeContext);
              }
              return;
            } catch (e) {
              console.log('[ET] Form.requestSubmit() failed, trying button click:', e);
            }
          }
          
          // Strategy 2: Find and click "Apply discount code" button
          console.log('[ET] Looking for Apply button...');
          const allButtons = Array.from(document.querySelectorAll('button'));
          const applyButton = allButtons.find(btn => {
            const text = (btn.textContent || '').trim();
            const isVisible = btn.offsetParent !== null;
            return (text === 'Apply discount code' || text === 'Apply') && isVisible;
          });
          
          if (applyButton) {
            console.log('[ET] ✓ Found Apply button:', applyButton.textContent);
            console.log('[ET] Button details:', {
              type: applyButton.type,
              disabled: applyButton.disabled,
              className: applyButton.className
            });
            
            // Wait a tiny bit if button is disabled
            if (applyButton.disabled) {
              console.log('[ET] Button is disabled, waiting...');
              setTimeout(() => {
                if (!applyButton.disabled) {
                  applyButton.click();
                  console.log('[ET] ✓✓✓ Apply button clicked!');
                } else {
                  // Force click even if disabled
                  applyButton.click();
                  console.log('[ET] ✓✓✓ Apply button clicked (forced)!');
          }
        }, 200);
            } else {
              applyButton.click();
              console.log('[ET] ✓✓✓ Apply button clicked!');
            }
            
            if (activeContext) {
              markCodeAppliedToSubscription(cleanCode, activeContext);
            }
            return;
          }
          
          // Strategy 3: Try findAndClickApplyButton helper
          const clicked = findAndClickApplyButton(discountInput);
          if (clicked) {
            console.log('[ET] ✓✓✓ Apply button clicked via helper!');
            if (activeContext) {
              markCodeAppliedToSubscription(cleanCode, activeContext);
            }
            return;
          }
          
          // Strategy 4: Find submit button in form
          if (form) {
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            if (submitBtn) {
              console.log('[ET] ✓ Found form submit button, clicking');
              submitBtn.click();
              if (activeContext) {
                markCodeAppliedToSubscription(cleanCode, activeContext);
              }
              return;
            }
          }
          
          // Strategy 5: Simulate Enter key press
          console.log('[ET] Trying Enter key press as last resort...');
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          });
          discountInput.dispatchEvent(enterEvent);
          
          discountInput.dispatchEvent(new KeyboardEvent('keyup', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            bubbles: true
          }));
          
          console.log('[ET] ⚠️ All strategies attempted, Recharge should process the discount');
        }, 800); // Give Recharge time to initialize the form
        
        if (activeContext) {
          markCodeAppliedToSubscription(cleanCode, activeContext);
        }
        return true;
      }
      
        // Step 4: If all else fails, log error
        console.error('[ET] ✗ Could not find discount input or modal. Recharge native flow failed.');
        console.error('[ET] Cannot proceed - Recharge modal is required for native flow');
        isApplyingDiscount = false;
        return false;
      } finally {
        // Reset flag after a delay to allow for page reload
        setTimeout(() => {
          isApplyingDiscount = false;
        }, 2000);
      }
    }
    function setupOneClickRedemption() {
      const observer = new MutationObserver(() => {
        const redeemButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
          const text = (btn.textContent || '').toLowerCase();
          return text.includes('redeem') && (text.includes('$5') || text.includes('$10') || text.includes('5.00') || text.includes('10.00'));
        });
        redeemButtons.forEach(btn => {
          if (btn.dataset.etRewardHandler === 'true') return;
          btn.dataset.etRewardHandler = 'true';
          btn.addEventListener('click', async function(e) {
            setTimeout(() => {
              const codeElements = document.querySelectorAll('input[readonly], code, .code, [class*="code"]');
              let discountCode = null;
              for (const el of codeElements) {
                const value = el.value || el.textContent || '';
                if (value && value.length > 5 && /^[A-Z0-9-]+$/.test(value.trim())) {
                  discountCode = value.trim();
                  break;
                }
              }
              if (!discountCode) {
                const textElements = document.querySelectorAll('div, span, p');
                for (const el of textElements) {
                  const text = el.textContent || '';
                  if (text.includes('code') && /[A-Z0-9-]{6,}/.test(text)) {
                    const match = text.match(/[A-Z0-9-]{6,}/);
                    if (match) {
                      discountCode = match[0];
                      break;
                    }
                  }
                }
              }
              if (discountCode) {
                sessionStorage.setItem('et_redeemed_discount_code', discountCode);
                const nextOrderLink = document.querySelector('a[href*="/upcoming"], a[href*="/orders"]');
                if (nextOrderLink) {
                  cleanupRedeemRewardsPage();
                  nextOrderLink.click();
                  setTimeout(() => {
                    applyDiscountCode(discountCode);
                  }, 1500);
                } else {
                  applyDiscountCode(discountCode);
                }
              }
            }, 500);
          });
        });
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
    function renderRedeemRewardsPage() {
      cleanupRedeemRewardsPage();
      let mainContent = null;
      const allDivs = document.querySelectorAll('div');
      for (const div of allDivs) {
        const children = Array.from(div.children);
        if (children.length === 2) {
          const isSidebar = (child) => {
            const text = child.textContent || '';
            return (text.includes('Next Order') || text.includes('Upcoming Orders')) &&
                  (text.includes('Manage') || text.includes('Previous Orders') || text.includes('Update Payment'));
          };
          const hasSidebar = children.some(isSidebar);
          if (hasSidebar) {
            mainContent = children.find(child => !isSidebar(child));
            break;
          }
        }
      }
      if (!mainContent) {
        for (const div of allDivs) {
          const text = div.textContent || '';
          if ((text.includes('Your next order') ||
              text.includes('Deliver to') ||
              text.includes('Charge to card ending') ||
              text.includes('Order total'))
              && !text.includes('Upcoming Orders')
              && !text.includes('Manage')
              && div.children.length > 0) {
            let parent = div;
            while (parent && parent.parentElement) {
              const siblings = Array.from(parent.parentElement.children);
              const hasSidebarSibling = siblings.some(sibling => {
                if (sibling === parent) return false;
                const siblingText = sibling.textContent || '';
                return (siblingText.includes('Next Order') || siblingText.includes('Upcoming Orders')) &&
                      (siblingText.includes('Manage') || siblingText.includes('Previous Orders'));
              });
              if (hasSidebarSibling) {
                mainContent = parent;
                break;
              }
              parent = parent.parentElement;
            }
            if (!mainContent) {
              mainContent = div;
            }
            break;
          }
        }
      }
      if (!mainContent) {
        const contentSelectors = [
          'main[role="main"] > div:first-child > div:first-child',
          'main[role="main"] > div:first-child',
          '[data-testid="main-content"] > div:first-child',
          'main > div:first-child > div:first-child',
          'main > div:first-child',
        ];
        for (const selector of contentSelectors) {
          const el = document.querySelector(selector);
          if (el) {
            const text = (el.textContent || '').toLowerCase();
            if (!text.includes('upcoming orders') && !text.includes('next order')) {
              mainContent = el;
              break;
            }
          }
        }
      }
      if (!mainContent) return;
      hiddenReactContentForRewards = mainContent;
      mainContent.style.display = 'none';
      redeemRewardsContainer = document.createElement('div');
      redeemRewardsContainer.id = 'et-redeem-rewards-container';
      redeemRewardsContainer.style.width = window.innerWidth < 1024 ? '100%' : '65.7%';
      redeemRewardsContainer.style.minHeight = '600px';
      redeemRewardsContainer.innerHTML = `
        <div style="background: #0d3c3a; color: #fff; padding: 24px; border-radius: 8px 8px 0 0; margin-bottom: 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #fff;">Redeem Rewards</h1>
        </div>
        <div style="background: #f7f6ef; padding: 32px 24px; border-radius: 0 0 8px 8px; min-height: 500px;">
          <div style="margin-bottom: 24px;">
            <h2 style="font-size: 32px; font-weight: 700; color: #222; margin: 0 0 8px 0;">Redeem Your Points</h2>
            <p style="font-size: 16px; color: #666; margin: 0;">Choose your reward amount and we'll automatically apply it to your next order.</p>
          </div>
          <div id="et-loyaltylion-widget-container" style="background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <div style="margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
              <div style="font-size: 14px; color: #666; margin-bottom: 4px;">Your Points</div>
              <div id="et-current-points" style="font-size: 32px; font-weight: 700; color: #0d3c3a;">Loading...</div>
              <div id="et-pending-points" style="font-size: 12px; color: #999; margin-top: 4px;"></div>
            </div>
            <div data-lion-rewards-list="" id="et-lion-rewards-list" style="min-height: 300px;">
              <div style="text-align: center; padding: 40px 20px; color: #999;">
                <div style="font-size: 16px; margin-bottom: 8px;">Loading rewards...</div>
                <div style="font-size: 14px;">Please wait while we fetch your available rewards.</div>
              </div>
            </div>
          </div>
          <div style="margin-top: 24px; padding: 16px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>Note:</strong> After redeeming your points, you'll be automatically redirected back to your order page where the discount code will be applied.
            </p>
          </div>
        </div>
      `;
      mainContent.parentElement.insertBefore(redeemRewardsContainer, mainContent.nextSibling);
      const widgetContainer = document.getElementById('et-loyaltylion-widget-container');
      if (widgetContainer) {
        const customerData = getCustomerDataFromReCharge();
        
        if (!customerData || !customerData.email) {
          widgetContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
              <div style="font-size: 16px; margin-bottom: 8px; color: #d32f2f;">Unable to fetch customer data</div>
              <div style="font-size: 14px; color: #666;">Please make sure you're logged into the customer portal.</div>
            </div>
          `;
          return;
        }
        fetchRewardsFromAPI(customerData, widgetContainer);
      }
      setupOneClickRedemption();
      rewardResizeHandler = () => {
        if (redeemRewardsContainer) {
          redeemRewardsContainer.style.width = window.innerWidth < 1024 ? '100%' : '65.7%';
        }
      };
      window.addEventListener('resize', rewardResizeHandler);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Disabled navigation injection - we only want buttons next to subscription addresses
    // const redeemRewardsNavObserver = new MutationObserver(() => {
    //   if (!redeemRewardsInjected) {
    //     injectRedeemRewardsNav();
    //   }
    // });
    // redeemRewardsNavObserver.observe(document.body, {
    //   childList: true,
    //   subtree: true,
    // });
    // setTimeout(injectRedeemRewardsNav, 1000);
    // setTimeout(injectRedeemRewardsNav, 2000);
    
    // Function to remove any redeem buttons from sidebar/navigation
    function removeRedeemButtonsFromSidebar() {
      // Remove the navigation link if it exists
      const navLink = document.querySelector('#et-redeem-rewards-nav-link');
      if (navLink) {
        navLink.remove();
        redeemRewardsInjected = false;
      }
      
      // Find ALL redeem buttons/links on the page
      const allElements = Array.from(document.querySelectorAll('button, a'));
      allElements.forEach(el => {
        const text = (el.textContent || '').trim().toLowerCase();
        const isRedeem = text === 'redeem' || text === 'redeem rewards';
        if (!isRedeem) return;
        
        // Keep buttons that have our specific subscription button ID
        if (el.id && el.id.startsWith('et-redeem-subscription-btn')) {
          // Keep all buttons with our ID - they're the ones we created next to addresses
          return;
        }
        
        // Check if this button is in a sidebar/navigation/right column area
        const isInSidebar = el.closest('aside, nav, [class*="sidebar"], [class*="navigation"]');
        const isInRightColumn = el.closest('[class*="right"], [class*="column"]') && 
                                !el.closest('[class*="subscription"], [class*="order"]');
        
        // Check if it's in a container with navigation links (like "Previous orders", "Manage", etc.)
        const container = el.closest('div, section, aside');
        let isInNavContainer = false;
        if (container) {
          const containerText = (container.textContent || '').toLowerCase();
          const hasNavLinks = containerText.includes('previous orders') || 
                            containerText.includes('manage') || 
                            containerText.includes('update payment') ||
                            container.querySelector('a[href*="/previous"], a[href*="/manage"], a[href*="/payment"]');
          
          // Only consider it a nav container if it doesn't have subscription content
          if (hasNavLinks && !containerText.includes('deliver to') && !containerText.includes('subscription')) {
            isInNavContainer = true;
          }
        }
        
        // Check if button is near a "Deliver to" address (should keep these)
        let isNearAddress = false;
        let current = el.parentElement;
        let depth = 0;
        while (current && depth < 6) {
          const currentText = (current.textContent || '').trim();
          // Check if this container has "Deliver to" and is a subscription card
          if (currentText.includes('Deliver to') && 
              (currentText.includes('Subscription') || currentText.includes('Every week'))) {
            isNearAddress = true;
            break;
          }
          current = current.parentElement;
          depth++;
        }
        
        // Remove button if it's in sidebar/right column/nav container AND not near an address
        if ((isInSidebar || isInRightColumn || isInNavContainer) && !isNearAddress) {
          el.remove();
        }
      });
    }
    
    document.addEventListener('Recharge::location::change', function() {
      cleanupRedeemRewardsPage();
      redeemRewardsInjected = false;
      removeRedeemButtonsFromSidebar();
    }, true);
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a[href*="/upcoming"], a[href*="/previous"], a[href*="/subscriptions"], a[href*="/customer"], a[href*="/overview"]');
      if (link && redeemRewardsContainer) {
        cleanupRedeemRewardsPage();
      }
    }, true);
    const autoApplyObserver = new MutationObserver(() => {
      const url = window.location.href;
      if (url.includes('/upcoming') || url.includes('/orders')) {
        const storedCode = sessionStorage.getItem('et_redeemed_discount_code');
        if (storedCode) {
          sessionStorage.removeItem('et_redeemed_discount_code');
          setTimeout(() => applyDiscountCode(storedCode), 1000);
        }
      }
    });
    autoApplyObserver.observe(document.body, { childList: true, subtree: true });
    const subscriptionContextMap = new Map();
    let etLastSubscriptionContext = null;
    function getSubscriptionCardFromContext(context) {
      if (!context) return null;
      if (context.subscriptionCard && context.subscriptionCard.isConnected) {
        return context.subscriptionCard;
      }
      if (context.key && subscriptionContextMap.has(context.key)) {
        const mapped = subscriptionContextMap.get(context.key);
        if (mapped?.cardContainer && mapped.cardContainer.isConnected) {
          return mapped.cardContainer;
        }
      }
      if (context.redeemButton && context.redeemButton.isConnected) {
        const fromButton = context.redeemButton.closest('[class*="subscription"], [class*="order"], [class*="card"]');
        if (fromButton) return fromButton;
      }
      return null;
    }
    function markCodeAppliedToSubscription(code, context) {
      if (!context) return;
      // DO NOT create badge - discount will be shown in order summary section only
      // The discount will be displayed in the order summary (between Bundle contents and Shipping),
      // not as a badge next to the Redeem Rewards button
      return; // Exit early - no badge creation
    }
    // Function to add redeem button to each subscription card
    function addRedeemButtonsToSubscriptions() {
      // Find all subscription cards by looking for "Deliver to" text
      const allElements = Array.from(document.querySelectorAll('*'));
      const subscriptionCards = [];
      
      allElements.forEach(el => {
        const text = (el.textContent || '').trim();
        // Look for elements containing "Deliver to" which indicates a subscription card
        if (text.includes('Deliver to') && text.length < 500) {
          // Find the parent container that likely contains the full subscription card
          let cardContainer = el;
          let parent = el.parentElement;
          let depth = 0;
          
          // Walk up to find a reasonable container (not too small, not too large)
          while (parent && depth < 5) {
            const parentText = (parent.textContent || '').trim();
            // Check if parent contains subscription-related content
            if (parentText.includes('Subscription') || 
                parentText.includes('Every week') || 
                parentText.includes('Bundle contents') ||
                parentText.includes('Charge to')) {
              cardContainer = parent;
              break;
            }
            parent = parent.parentElement;
            depth++;
          }
          
          // Check if we already added a button to this card
          // Use a more specific check to avoid duplicates
          const addressText = (el.textContent || '').trim();
          const buttonId = `et-redeem-subscription-btn-${addressText.replace(/\s+/g, '-').substring(0, 50)}`;
          if (!cardContainer.querySelector(`[id^="et-redeem-subscription-btn"]`) && 
              !el.closest('[id^="et-redeem-subscription-btn"]')) {
            subscriptionCards.push({
              addressElement: el,
              cardContainer: cardContainer,
              buttonId: buttonId
            });
          }
        }
      });
      
      // Add redeem button to each subscription card
      subscriptionCards.forEach(({ addressElement, cardContainer, buttonId }) => {
        // Double-check we haven't already added a button to this address
        if (addressElement.closest('[id^="et-redeem-subscription-btn"]') || 
            addressElement.querySelector('[id^="et-redeem-subscription-btn"]')) {
          return;
        }
        
        // Verify this is actually a subscription address, not just any "Deliver to" text
        const addressText = (addressElement.textContent || '').trim();
        if (!addressText.includes('Deliver to') || addressText.length > 200) {
          return; // Skip if it's not a proper address or too long
        }
        
        // Make sure we're not in a sidebar or right column
        const isInSidebar = addressElement.closest('aside, nav, [class*="sidebar"], [class*="navigation"]');
        const isInRightColumn = addressElement.closest('[class*="right"], [class*="column"]') && 
                                !addressElement.closest('[class*="subscription"], [class*="order"]');
        
        if (isInSidebar || isInRightColumn) {
          return; // Don't add buttons in sidebar/right column
        }
        
        // Verify this is part of a subscription card (has subscription-related content nearby)
        const hasSubscriptionContent = cardContainer.textContent.includes('Subscription') || 
                                      cardContainer.textContent.includes('Every week') ||
                                      cardContainer.textContent.includes('Bundle contents');
        
        if (!hasSubscriptionContent) {
          return; // Skip if it's not actually a subscription card
        }
        
        // Find the address element's parent to add button next to it
        let addressContainer = addressElement.parentElement;
        
        // Try to find a flex container or suitable parent for the address
        let targetParent = addressElement;
        let current = addressElement;
        let attempts = 0;
        
        while (current && attempts < 3) {
          const style = window.getComputedStyle(current);
          if (style.display === 'flex' || 
              current.querySelector('a[href*="edit"], button') ||
              current.textContent.includes('Edit')) {
            targetParent = current;
            break;
          }
          current = current.parentElement;
          attempts++;
        }
        
        // Create redeem button with unique ID
        const redeemButton = document.createElement('button');
        redeemButton.id = buttonId || `et-redeem-subscription-btn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const subscriptionKey = redeemButton.id;
        subscriptionContextMap.set(subscriptionKey, {
          cardContainer,
          addressText,
          redeemButton
        });
        redeemButton.dataset.etSubscriptionKey = subscriptionKey;
        redeemButton.dataset.etSubscriptionAddress = addressText;
        redeemButton.textContent = 'Redeem Rewards';
        redeemButton.style.cssText = `
          margin-left: auto;
          padding: 8px 16px;
          background: #0d3c3a;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s;
        `;
        
        // Add hover effect
        redeemButton.addEventListener('mouseenter', () => {
          redeemButton.style.background = '#0a2f2d';
        });
        redeemButton.addEventListener('mouseleave', () => {
          redeemButton.style.background = '#0d3c3a';
        });
        
        // Extract addressId when button is created (using global function)
        let addressId = extractAddressIdFromCard(cardContainer);
        
        // If not found, try to extract from the entire page (maybe subscription card has links outside)
        if (!addressId) {
          console.log('[ET] AddressId not found in card, trying broader search...');
          // Look for any links in the page that might be related to this subscription
          const allPageLinks = document.querySelectorAll('a[href*="addresses/"]');
          for (const link of allPageLinks) {
            const href = link.getAttribute('href') || '';
            const match = href.match(/\/addresses\/(\d+)/) || href.match(/addresses\/(\d+)/);
            if (match && match[1]) {
              // Check if this link is near our subscription card
              const linkCard = link.closest('[class*="subscription"], [class*="order"], [class*="card"]');
              if (linkCard && (cardContainer.contains(linkCard) || linkCard.contains(cardContainer) || 
                  cardContainer.textContent.includes(addressText))) {
                addressId = match[1];
                console.log('[ET] ✓✓✓ Found addressId from nearby link:', addressId);
                break;
              }
            }
          }
        }
        
        // Store addressId in the button's dataset for later retrieval
        if (addressId) {
          redeemButton.dataset.etAddressId = addressId;
          console.log('[ET] Stored addressId in button dataset:', addressId);
        } else {
          console.warn('[ET] ⚠️ Could not extract addressId for subscription:', addressText);
        }
        
        // Add click handler to show modal
        redeemButton.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Try to get addressId one more time (in case DOM changed)
          let finalAddressId = addressId || 
                              redeemButton.dataset.etAddressId || 
                              extractAddressIdFromCard(cardContainer);
          
          // If still no addressId, try SDK
          if (!finalAddressId) {
            finalAddressId = await getAddressIdFromSDK(addressText, cardContainer);
          }
          
          console.log('[ET] Redeem button clicked, addressId:', finalAddressId);
          
          etLastSubscriptionContext = {
            key: subscriptionKey,
            subscriptionCard: cardContainer,
            addressText,
            redeemButton,
            addressId: finalAddressId
          };
          
          console.log('[ET] Stored context:', etLastSubscriptionContext);
          showRedeemRewardsModal();
        });
        
        // Try to insert button next to address
        // Strategy 1: If address element's parent is flex, append button
        const parentStyle = window.getComputedStyle(targetParent);
        if (parentStyle.display === 'flex') {
          targetParent.appendChild(redeemButton);
        } else {
          // Strategy 2: Wrap address and button in a flex container
          const flexWrapper = document.createElement('div');
          flexWrapper.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 12px;';
          
          // Move address element into wrapper
          const addressClone = addressElement.cloneNode(true);
          flexWrapper.appendChild(addressClone);
          flexWrapper.appendChild(redeemButton);
          
          // Replace address element with wrapper
          if (addressElement.parentElement) {
            addressElement.parentElement.insertBefore(flexWrapper, addressElement);
            addressElement.remove();
          }
        }
      });
      
      // After creating buttons, clean up any unwanted ones
      setTimeout(() => {
        removeRedeemButtonsFromSidebar();
      }, 100);
    }
    
    // Function to show rewards in a modal dialog
    function showRedeemRewardsModal() {
      // Remove any existing modal
      const existingModal = document.getElementById('et-redeem-rewards-modal');
      if (existingModal) {
        existingModal.remove();
      }
      
      // Create modal overlay
      const modal = document.createElement('div');
      modal.id = 'et-redeem-rewards-modal';
      modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.5) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 999999 !important;
        padding: 20px;
        box-sizing: border-box;
      `;
      
      // Create modal content
      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
        background: white !important;
        border-radius: 12px !important;
        padding: 0 !important;
        max-width: 800px !important;
        width: 100% !important;
        max-height: 90vh !important;
        overflow-y: auto !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
        position: relative !important;
        z-index: 1000000 !important;
      `;
      
      modalContent.innerHTML = `
        <div style="background: #0d3c3a; color: #fff; padding: 24px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #fff;">Redeem Code</h2>
          <button id="et-close-rewards-modal" style="background: none; border: none; color: white; font-size: 28px; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; line-height: 1;">&times;</button>
        </div>
        <div style="background: #f7f6ef; padding: 32px 24px; min-height: 400px;">
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 24px; font-weight: 700; color: #222; margin: 0 0 8px 0;">Redeem Your Points</h3>
            <p style="font-size: 16px; color: #666; margin: 0;">Choose your reward and it will be automatically applied to your subscription.</p>
          </div>
          <div id="et-loyaltylion-widget-container-modal" style="background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <div style="margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
              <div style="font-size: 14px; color: #666; margin-bottom: 4px;">Your Points</div>
              <div id="et-current-points-modal" style="font-size: 32px; font-weight: 700; color: #0d3c3a;">Loading...</div>
              <div id="et-pending-points-modal" style="font-size: 12px; color: #999; margin-top: 4px;"></div>
            </div>
            <div data-lion-rewards-list="" id="et-lion-rewards-list-modal" style="min-height: 200px;">
              <div style="text-align: center; padding: 40px 20px; color: #999;">
                <div style="font-size: 16px; margin-bottom: 8px;">Loading rewards...</div>
                <div style="font-size: 14px;">Please wait while we fetch your available rewards.</div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      modal.appendChild(modalContent);
      document.body.appendChild(modal);
      
      // Close modal handlers
      const closeModal = () => {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
      };
      
      document.getElementById('et-close-rewards-modal').addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
          const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          closeModal();
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);
      const customerData = getCustomerDataFromReCharge();
      
      if (!customerData || !customerData.email) {
        const widgetContainer = document.getElementById('et-loyaltylion-widget-container-modal');
        if (widgetContainer) {
          widgetContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
              <div style="font-size: 16px; margin-bottom: 8px; color: #d32f2f;">Unable to fetch customer data</div>
              <div style="font-size: 14px; color: #666;">Please make sure you're logged into the customer portal.</div>
            </div>
          `;
        }
        return;
      }
      fetchRewardsForModal(customerData, modalContent);
    }
      async function fetchRewardsForModal(customerData, modalContainer) {
      const LOYALTYLION_API_KEY = 'pat_792c5ad004fb46e3802c955a83f7ba15';
      const LOYALTYLION_API_BASE = 'https://api.loyaltylion.com/v2';
      
      if (!LOYALTYLION_API_KEY || !LOYALTYLION_API_KEY.startsWith('pat_') || LOYALTYLION_API_KEY.length <= 20) {
        const sdkAvailable = await checkLoyaltyLionSDK();
        if (sdkAvailable && window.loyaltylion) {
          await trySDKMethodsForModal(customerData, modalContainer);
          return;
        }
        await fetchRewardsFromPageHTMLForModal(customerData, modalContainer);
        return;
      }
      
      try {
        const authHeader = 'Bearer ' + LOYALTYLION_API_KEY;
        let loyaltyLionCustomerId = null;
        let merchantIdFromApi = null;
        let points = 0;
        let pendingPoints = 0;
        
        if (customerData.shopify_customer_id) {
          try {
            const searchUrl = `${LOYALTYLION_API_BASE}/customers?merchant_id=${encodeURIComponent(customerData.shopify_customer_id)}`;
            const response = await fetch(searchUrl, {
              method: 'GET',
              headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
            });
            if (response.ok) {
              const data = await response.json();
              if (data.customers && data.customers.length > 0) {
                const customer = data.customers.find(c => {
                  const mid = c.merchant_id || c.shopify_customer_id || c.external_id;
                  return mid && String(mid) === String(customerData.shopify_customer_id);
                });
                if (customer) {
                  loyaltyLionCustomerId = customer.id;
                  merchantIdFromApi = customer.merchant_id || customer.shopify_customer_id || customer.external_id;
                  points = customer.points_approved || customer.points?.current || customer.points?.total || customer.points || customer.current_points || 0;
                  pendingPoints = customer.points_pending || customer.points?.pending || 0;
                }
              }
            }
          } catch (e) {
            console.error('[ET] Customer search error:', e);
          }
        }
        
        if (!loyaltyLionCustomerId && customerData.email) {
          try {
            const searchUrl = `${LOYALTYLION_API_BASE}/customers?email=${encodeURIComponent(customerData.email)}`;
            const response = await fetch(searchUrl, {
              method: 'GET',
              headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
            });
            if (response.ok) {
              const data = await response.json();
              if (data.customers && data.customers.length > 0) {
                const customer = customerData.shopify_customer_id
                  ? data.customers.find(c => {
                      const mid = c.merchant_id || c.shopify_customer_id || c.external_id;
                      return mid && String(mid) === String(customerData.shopify_customer_id);
                    })
                  : data.customers[0];
                if (customer) {
                  loyaltyLionCustomerId = customer.id;
                  merchantIdFromApi = customer.merchant_id || customer.shopify_customer_id || customer.external_id;
                  points = customer.points_approved || customer.points?.current || customer.points?.total || customer.points || customer.current_points || 0;
                  pendingPoints = customer.points_pending || customer.points?.pending || 0;
                }
              }
            }
          } catch (e) {
            console.error('[ET] Email search error:', e);
          }
        }
        
        if (!loyaltyLionCustomerId) {
          throw new Error('Could not find customer in LoyaltyLion');
        }
              const pointsDisplay = document.getElementById('et-current-points-modal');
        if (pointsDisplay) {
          pointsDisplay.textContent = points + ' points';
        }
        const pendingDisplay = document.getElementById('et-pending-points-modal');
        if (pendingDisplay && pendingPoints > 0) {
          pendingDisplay.textContent = `(${pendingPoints} pending)`;
        }
        
        let rewards = [];
        const merchantIdForApi = merchantIdFromApi || customerData.shopify_customer_id;
        
        if (!merchantIdForApi) {
          console.error('[ET] No merchant_id available for API calls');
          throw new Error('Merchant ID required for API calls');
        }
        
        try {
          const rewardsUrl = `${LOYALTYLION_API_BASE}/customers/${merchantIdForApi}/available_rewards`;
          const response = await fetch(rewardsUrl, {
            method: 'GET',
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
          });
          if (response.ok) {
            const data = await response.json();
            let allRewards = [];
            if (data.rewards && Array.isArray(data.rewards)) {
              allRewards = data.rewards;
            } else if (Array.isArray(data)) {
              allRewards = data;
            } else if (data.data && Array.isArray(data.data)) {
              allRewards = data.data;
            }
            
            rewards = allRewards.filter(r => {
              const requiredPoints = (r.point_cost !== undefined && r.point_cost !== null) 
                                    ? r.point_cost 
                                    : (r.points || r.points_required || 0);
              const isActive = !r.status || (r.status !== 'inactive' && r.status !== 'disabled' && 
                              r.status !== 'archived' && r.status !== 'deleted');
              const isNotClaimed = !r.claimed && !r.redeemed && r.status !== 'claimed';
              const purchaseTypeRaw = r.purchase_type || r.purchaseType || r.purchase_type_id || (r.purchase_type && typeof r.purchase_type === 'object' ? (r.purchase_type.name || r.purchase_type.value || r.purchase_type.id || '') : '') || '';
              const purchaseType = String(purchaseTypeRaw).toLowerCase();
              const rewardName = String(r.name || r.title || '').toLowerCase();
              const rewardDesc = String(r.description || '').toLowerCase();
              const isSubscription = purchaseType === 'subscription' || purchaseType === 'recurring' || purchaseType.includes('subscription') || rewardName.includes('subscription') || rewardDesc.includes('subscription') || rewardName.includes('new subscription') || rewardDesc.includes('new subscription') || rewardDesc.includes('all future payments');
              return isActive && isNotClaimed && isSubscription;
            });
          }
        } catch (e) {
          console.error('[ET] Error fetching rewards:', e);
        }
        const formattedRewards = rewards.map(r => {
          const requiredPoints = (r.point_cost !== undefined && r.point_cost !== null) 
                              ? r.point_cost 
                              : (r.points || r.points_required || 0);
          const canAfford = points >= requiredPoints;
          
          const value = r.discount_amount || r.value || r.amount || '0';
          return {
            id: r.id,
            name: r.name || r.title || `$${value} voucher`,
            price: value,
            points: requiredPoints,
            canAfford: canAfford,
            description: r.description || '',
            code: r.code || r.voucher_code || ''
          };
        });
        
        const allItems = formattedRewards;
        if (allItems.length > 0) {
          renderRewardsListForModal(allItems, modalContainer, points);
          } else {
          const widgetContainer = modalContainer.querySelector('#et-lion-rewards-list-modal');
          if (widgetContainer) {
            widgetContainer.innerHTML = `<div style="text-align: center; padding: 40px 20px;"><div style="font-size: 16px; margin-bottom: 8px; color: #666;">No rewards available</div><div style="font-size: 14px; color: #999;">You currently have ${points} points. Check back later for new rewards!</div></div>`;
          }
        }
      } catch (error) {
        console.error('[ET] Error fetching from API:', error);
        const widgetContainer = modalContainer.querySelector('#et-lion-rewards-list-modal');
        if (widgetContainer) {
          widgetContainer.innerHTML = `<div style="text-align: center; padding: 40px 20px;"><div style="font-size: 16px; margin-bottom: 8px; color: #d32f2f;">API Error</div><div style="font-size: 14px; color: #666;">${error.message || 'Failed to fetch rewards'}</div></div>`;
        }
        const sdkAvailable = await checkLoyaltyLionSDK();
        if (sdkAvailable && window.loyaltylion) {
          await trySDKMethodsForModal(customerData, modalContainer);
      } else {
          await fetchRewardsFromPageHTMLForModal(customerData, modalContainer);
        }
      }
    }
    
    // Helper functions for modal
    async function trySDKMethodsForModal(customerData, modalContainer) {
      if (!window.loyaltylion) return false;
      try {
        if (typeof window.loyaltylion.getPoints === 'function') {
          const pointsData = await window.loyaltylion.getPoints();
          const pointsDisplay = document.getElementById('et-current-points-modal');
          if (pointsDisplay && pointsData) {
            const points = pointsData.current || pointsData.total || 0;
            pointsDisplay.textContent = points + ' points';
            if (pointsData.pending) {
              const pendingDisplay = document.getElementById('et-pending-points-modal');
              if (pendingDisplay) pendingDisplay.textContent = `(${pointsData.pending} pending)`;
            }
          }
        }
        if (typeof window.loyaltylion.getRewards === 'function') {
          const rewardsData = await window.loyaltylion.getRewards();
          if (rewardsData && Array.isArray(rewardsData) && rewardsData.length > 0) {
            const points = parseInt(document.getElementById('et-current-points-modal')?.textContent || '0');
            renderRewardsListForModal(rewardsData, modalContainer, points);
            return true;
          }
        }
      } catch (e) {
        console.error('[ET] SDK error:', e);
      }
      return false;
    }
    
    async function fetchRewardsFromPageHTMLForModal(customerData, modalContainer) {
      // Similar to fetchRewardsFromPageHTML but for modal
      // Implementation can be similar, just use modal-specific IDs
      console.log('[ET] Fetching rewards from page HTML for modal');
    }
    
    // Function to render rewards list in modal
    function renderRewardsListForModal(rewards, modalContainer, currentPoints) {
      const widgetContainer = modalContainer.querySelector('#et-lion-rewards-list-modal');
      if (!widgetContainer) return;
      
      widgetContainer.innerHTML = '';
      
      if (rewards.length === 0) {
        widgetContainer.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; color: #999;">
            <div style="font-size: 16px; margin-bottom: 8px;">No rewards available</div>
            <div style="font-size: 14px;">You need more points to redeem rewards, or rewards are not configured.</div>
          </div>
        `;
        return;
      }
      
      const validRewards = rewards.filter(r => r.id);
      const uniqueRewards = Array.from(new Map(validRewards.map(r => [r.id, r])).values());
      
      const rewardsHTML = uniqueRewards.map(reward => {
        const rewardPoints = reward.points || reward.points_required || 0;
        const canAfford = reward.canAfford !== undefined ? reward.canAfford : (currentPoints >= rewardPoints);
        const rewardName = reward.name || reward.title || `$${reward.price || reward.value || reward.amount} voucher`;
        const rewardId = reward.id;
        const hasCode = reward.code && reward.code.trim() !== '';
        
        return `
          <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background: ${canAfford || hasCode ? '#fff' : '#f9f9f9'}; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1;">
                <div style="font-size: 20px; font-weight: 700; color: #222; margin-bottom: 4px;">${rewardName}</div>
                ${rewardPoints > 0 ? `<div style="font-size: 14px; color: #666;">${rewardPoints} points required</div>` : ''}
                ${hasCode ? `
                  <div style="margin-top: 8px; padding: 8px 12px; background: #f0f8f7; border: 1px dashed #0d3c3a; border-radius: 4px; display: inline-block;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Voucher Code:</div>
                    <div style="font-size: 16px; font-weight: 700; color: #0d3c3a; font-family: monospace; letter-spacing: 1px;">${reward.code}</div>
                    <button onclick="window.etCopyCode('${reward.code.replace(/'/g, "\\'")}')" 
                            style="margin-top: 6px; padding: 4px 12px; background: #0d3c3a; color: #fff; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                      Copy Code
                    </button>
                  </div>
                ` : ''}
                ${reward.description ? `<div style="font-size: 12px; color: #999; margin-top: 4px;">${reward.description}</div>` : ''}
              </div>
              <div style="margin-left: 16px;">
                ${hasCode ? `
                  <button onclick="window.etApplyCode('${reward.code.replace(/'/g, "\\'")}'); document.getElementById('et-redeem-rewards-modal')?.remove();"
                          style="padding: 10px 20px; background: #0d3c3a; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; white-space: nowrap;">
                    Apply Code
                  </button>
                ` : canAfford ? `
                  <button onclick="window.etRedeemReward('${rewardId}', ${rewardPoints}, '${rewardName.replace(/'/g, "\\'")}');"
                          style="padding: 10px 20px; background: #0d3c3a; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; white-space: nowrap;">
                    Redeem
                  </button>
                ` : `
                  <div style="padding: 10px 20px; background: #e0e0e0; color: #999; border-radius: 6px; font-weight: 600; white-space: nowrap;">
                    More points needed
                  </div>
                `}
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      widgetContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${rewardsHTML}
        </div>
      `;
    }
    
    // Initialize redeem buttons on subscriptions
    // Cleanup happens inside addRedeemButtonsToSubscriptions after buttons are created
    safeDelayedRun(addRedeemButtonsToSubscriptions, 2000, 'redeem buttons initialization');
    safeDelayedRun(addRedeemButtonsToSubscriptions, 3500, 'redeem buttons initialization');
    safeDelayedRun(addRedeemButtonsToSubscriptions, 5000, 'redeem buttons initialization');
    safeDelayedRun(addRedeemButtonsToSubscriptions, 7000, 'redeem buttons initialization');
    
    const redeemButtonObserver = new MutationObserver(() => {
      // Create buttons first, cleanup happens inside the function
      addRedeemButtonsToSubscriptions();
    });
    redeemButtonObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Aggressive cleanup observer - removes any redeem buttons that don't have our ID
    const aggressiveCleanupObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Check if the added node is a redeem button
            if (node.tagName === 'BUTTON' || node.tagName === 'A') {
              const text = (node.textContent || '').trim().toLowerCase();
              if ((text === 'redeem' || text === 'redeem rewards') && 
                  (!node.id || !node.id.startsWith('et-redeem-subscription-btn'))) {
                
                // Check if it's near a "Deliver to" address (should keep)
                let isNearAddress = false;
                let current = node.parentElement;
                let depth = 0;
                while (current && depth < 6) {
                  const currentText = (current.textContent || '').trim();
                  if (currentText.includes('Deliver to') && 
                      (currentText.includes('Subscription') || currentText.includes('Every week'))) {
                    isNearAddress = true;
                    break;
                  }
                  current = current.parentElement;
                  depth++;
                }
                
                // Check if it's in sidebar/right column (should remove)
                const isInSidebar = node.closest('aside, nav, [class*="sidebar"], [class*="navigation"]');
                const isInRightColumn = node.closest('[class*="right"], [class*="column"]') && 
                                        !node.closest('[class*="subscription"], [class*="order"]');
                
                // Only remove if it's in wrong location AND not near address
                if ((isInSidebar || isInRightColumn) && !isNearAddress) {
                  node.remove();
                }
              }
            }
            
            // Check for redeem buttons inside the added node
            const redeemButtons = node.querySelectorAll && node.querySelectorAll('button, a');
            if (redeemButtons) {
              redeemButtons.forEach(btn => {
                const text = (btn.textContent || '').trim().toLowerCase();
                if ((text === 'redeem' || text === 'redeem rewards') && 
                    (!btn.id || !btn.id.startsWith('et-redeem-subscription-btn'))) {
                  
                  // Check if it's near a "Deliver to" address (should keep)
                  let isNearAddress = false;
                  let current = btn.parentElement;
                  let depth = 0;
                  while (current && depth < 6) {
                    const currentText = (current.textContent || '').trim();
                    if (currentText.includes('Deliver to') && 
                        (currentText.includes('Subscription') || currentText.includes('Every week'))) {
                      isNearAddress = true;
                      break;
                    }
                    current = current.parentElement;
                    depth++;
                  }
                  
                  // Check if it's in sidebar/right column (should remove)
                  const isInSidebar = btn.closest('aside, nav, [class*="sidebar"], [class*="navigation"]');
                  const isInRightColumn = btn.closest('[class*="right"], [class*="column"]') && 
                                          !btn.closest('[class*="subscription"], [class*="order"]');
                  
                  // Only remove if it's in wrong location AND not near address
                  if ((isInSidebar || isInRightColumn) && !isNearAddress) {
                    btn.remove();
                  }
                }
              });
            }
          }
        });
      });
    });
    aggressiveCleanupObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('[ET] Script initialization completed');
  } // End of initializeScript function
  
  // Start initialization - wait for DOM and Recharge to be ready
  waitForReady(initializeScript, 15000); // Max 15 seconds wait time
  
})();