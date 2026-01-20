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
    initializationLoader.className = 'et-init-loader';
    
    const spinner = document.createElement('div');
    spinner.className = 'et-spinner';
    
    const messageEl = document.createElement('div');
    messageEl.className = 'et-loader-message';
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
      initializationLoader.classList.add('et-loader-fade-out');
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
  
  // Helper function to wait for subscription cards to be present in DOM
  function waitForSubscriptionCards(callback, maxWaitTime = 10000, checkInterval = 200) {
    const startTime = Date.now();
    
    const checkForCards = () => {
      const elapsed = Date.now() - startTime;
      
      // Check if DOM is ready
      if (document.readyState === 'loading' || !document.body) {
        if (elapsed < maxWaitTime) {
          setTimeout(checkForCards, checkInterval);
        } else {
          console.warn('[ET] Timeout waiting for DOM to be ready');
          callback();
        }
        return;
      }
      
      // Look for subscription cards - check for "Deliver to" text with subscription context
      const allElements = Array.from(document.querySelectorAll('*'));
      let foundSubscriptionCards = false;
      
      for (const el of allElements) {
        const text = (el.textContent || '').trim();
        if (text.includes('Deliver to') && text.length < 500) {
          // Verify it's actually a subscription card by checking parent context
          let parent = el.parentElement;
          let depth = 0;
          while (parent && depth < 5) {
            const parentText = (parent.textContent || '').trim();
            if (parentText.includes('Subscription') || 
                parentText.includes('Every week') || 
                parentText.includes('Bundle contents') ||
                parentText.includes('Charge to')) {
              foundSubscriptionCards = true;
              break;
            }
            parent = parent.parentElement;
            depth++;
          }
          if (foundSubscriptionCards) break;
        }
      }
      
      if (foundSubscriptionCards) {
        console.log('[ET] Subscription cards found, initializing redeem buttons');
        callback();
      } else if (elapsed < maxWaitTime) {
        // Continue checking
        setTimeout(checkForCards, checkInterval);
      } else {
        console.warn('[ET] Timeout waiting for subscription cards, proceeding anyway');
        callback();
      }
    };
    
    // Start checking after a small initial delay to let DOM settle
    setTimeout(checkForCards, 500);
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
    loaderOverlay.className = 'et-reload-loader';
    
    const spinner = document.createElement('div');
    spinner.className = 'et-spinner';
    
    const messageEl = document.createElement('div');
    messageEl.className = 'et-loader-message';
    messageEl.textContent = message;
    
    const subMessageEl = document.createElement('div');
    subMessageEl.className = 'et-loader-submessage';
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

  
    
    // Manage tab re-direct directly DA-1738
    async function fetchActiveSubscriptions() {
      const rechargeObj = window.recharge || window.ReCharge || window.Recharge;
      
      // Check if Recharge SDK is available
      if (!rechargeObj) {
        return [];
      }
      if (!rechargeObj.subscription || !rechargeObj.subscription.listSubscriptions) {
        return [];
      }
      
      // Get or create session
      let session = rechargeObj.session;
      if (!session && rechargeObj.auth && rechargeObj.auth.loginCustomerPortal) {
        try {
          session = await rechargeObj.auth.loginCustomerPortal();
        } catch (error) {
          return [];
        }
      }
      
      if (!session) {
        return [];
      }
      
      // Fetch active subscriptions using Recharge SDK
      try {
        const response = await rechargeObj.subscription.listSubscriptions(session, {
          limit: 100,
          status: 'Active' // Filter for active subscriptions only
        });
        
        // Extract subscriptions from response
        const subscriptions = response.subscriptions || response || [];
        return subscriptions;
      } catch (error) {
        return [];
      }
    }
    
    /**
     * Handles Manage button click with conditional navigation logic */
    async function handleManageButtonClick(event) {
      try {
        // Fetch active subscriptions using Recharge SDK
        const subscriptions = await fetchActiveSubscriptions();
        
        if (!subscriptions || subscriptions.length === 0) {
          // Allow default Recharge behavior - don't prevent default
          return false;
        }
        
        // If exactly one active subscription, auto-redirect to Edit Contents
        if (subscriptions.length === 1) {
          // Prevent default behavior since we're handling it ourselves
          event.preventDefault();
          event.stopPropagation();
          const subscription = subscriptions[0];
          const subscriptionId = subscription.id || subscription.subscription_id;
          const manageEvent = new CustomEvent('Recharge::click::manageSubscription', {
            bubbles: true,
            cancelable: true,
            detail: {
              payload: {
                subscriptionId: subscriptionId
              }
            }
          });
          document.dispatchEvent(manageEvent);
          setTimeout(() => {
            const modalOverlay = document.querySelector('.afinity-modal-overlay, [class*="modal-overlay"]');
            if (modalOverlay) {
              const editContentsBtn = modalOverlay.querySelector('.afinity-modal-update-meals');
              if (editContentsBtn) {
                editContentsBtn.click();
              }
            }
          }, 1000);
          
          return true; 
        }
        return false;
      } catch (error) {
        return false;
      }
    }

    function interceptManageButtonClicks() {
          const manageSelectors = [
        'a[data-testid*="recharge-internal-manage"]',
        'a[data-testid*="recharge-internal-subscriptions"]',
        'a[href*="/subscriptions"]',
        'a[href*="/manage"]'
      ];
            const attachHandlers = () => {
        manageSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            if (element.dataset.etNavIntercepted === 'true') {
              return;
            }
            
            element.dataset.etNavIntercepted = 'true';
            
            
            element.addEventListener('click', handleManageButtonClick, true);
          });
        });
      };
      attachHandlers();
            const observer = new MutationObserver(() => {
        attachHandlers();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      document.addEventListener('Recharge::location::change', () => {
        document.querySelectorAll('[data-et-nav-intercepted]').forEach(el => {
          el.dataset.etNavIntercepted = 'false';
        });
        setTimeout(attachHandlers, 500);
      });
    }
    
    safeDelayedRun(interceptManageButtonClicks, 1000, 'Manage button interception');
    safeDelayedRun(interceptManageButtonClicks, 3000, 'Manage button interception (retry)');
    safeDelayedRun(interceptManageButtonClicks, 5000, 'Manage button interception (retry 2)');
  } 
    waitForReady(initializeScript, 15000); 
  
})();
