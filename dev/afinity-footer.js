(function () {
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
    // Multiple attempts to catch dynamic content
    setTimeout(reorderNavigation, 800);
    setTimeout(reorderNavigation, 1800);
    setTimeout(reorderNavigation, 3000);
    setTimeout(reorderNavigation, 5000);
  
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
  
      // Find the container - EXACT same logic as reorderNavigation
      // Structure: container > div._18gma4r0 > a
      // Try multiple links to find the sidebar (not header)
      let navContainer = null;
      let sidebarLink = null;
      
      // Try to find a link that's in the sidebar (not header)
      for (const link of allRechargeLinks) {
        const wrapper = link.parentElement;
        const container = wrapper?.parentElement;
        
        if (!container) continue;
        
        // Check if this container is the sidebar (not header)
        const containerText = container.textContent || '';
        const hasHeaderNav = containerText.includes('Our Menu') && 
                             (containerText.includes('Find a Store') || containerText.includes('Food Service'));
        const hasRechargeSidebarItems = containerText.includes('Upcoming Orders') || 
                                        containerText.includes('Previous orders') ||
                                        containerText.includes('Manage');
        
        if (!hasHeaderNav && hasRechargeSidebarItems) {
          // This is the sidebar!
          navContainer = container;
          sidebarLink = link;
          console.log('[ET] Contact Us: Found sidebar container using link', link.getAttribute('data-testid'));
          break;
        }
      }
      
      // Fallback: use first link if sidebar not found yet
      if (!navContainer && allRechargeLinks.length > 0) {
        const firstLink = allRechargeLinks[0];
        const wrapper = firstLink.parentElement;
        navContainer = wrapper?.parentElement;
        sidebarLink = firstLink;
      }
      
      if (!navContainer) {
        console.log('[ET] Contact Us: Could not find navigation container');
        return;
      }
      
      console.log('[ET] Contact Us: Found container', navContainer.tagName, navContainer.className);
  
      // CRITICAL: Verify this is the Recharge sidebar, NOT the main header
      // Use multiple checks to be absolutely sure
      const containerText = navContainer.textContent || '';
      
      // Check 1: Does it have header navigation items?
      const hasHeaderNav = containerText.includes('Our Menu') && 
                           (containerText.includes('Find a Store') || containerText.includes('Food Service'));
      
      // Check 2: Does it have Recharge sidebar items?
      const hasRechargeSidebarItems = containerText.includes('Upcoming Orders') || 
                                      containerText.includes('Previous orders') ||
                                      containerText.includes('Manage') ||
                                      containerText.includes('Update Payment');
      
      // Check 3: Count Recharge links in this container
      const rechargeLinksInContainer = navContainer.querySelectorAll('a[data-testid*="recharge-internal"]');
      
      console.log('[ET] Contact Us: Container checks', {
        hasHeaderNav,
        hasRechargeSidebarItems,
        rechargeLinkCount: rechargeLinksInContainer.length
      });
      
      // If it has header nav, it's definitely the header - skip
      if (hasHeaderNav) {
        console.log('[ET] Contact Us: ❌ Container has header navigation items, skipping - this is the main header, not sidebar');
        return;
      }
      
      // If it doesn't have Recharge sidebar items AND doesn't have enough Recharge links, skip
      if (!hasRechargeSidebarItems && rechargeLinksInContainer.length < 3) {
        console.log('[ET] Contact Us: ❌ Container does not appear to be Recharge sidebar, skipping');
        return;
      }
      
      // If it has Recharge sidebar items OR has enough Recharge links, it's the sidebar
      if (hasRechargeSidebarItems || rechargeLinksInContainer.length >= 3) {
        console.log('[ET] Contact Us: ✅ Verified container is Recharge sidebar (has', rechargeLinksInContainer.length, 'Recharge nav links)');
      } else {
        console.log('[ET] Contact Us: ❌ Could not verify container is Recharge sidebar, skipping');
        return;
      }
  
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
    setTimeout(injectContactUsNav, 1200);
    setTimeout(injectContactUsNav, 2500);
    setTimeout(injectContactUsNav, 4000);
    setTimeout(injectContactUsNav, 6000);
    
      document.addEventListener('Recharge::location::change', function() {
        cleanupContactUsPage();
        contactUsInjected = false;
        navReordered = false;
        setTimeout(injectContactUsNav, 500);
        // Run reordering after text replacement has completed
        setTimeout(reorderNavigation, 700);
        setTimeout(hideLogoutButton, 800);
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
                          Redeem Rewards
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
                  <h2 style="margin: 0; font-size: 24px; font-weight: 600;">${rewardName}</h2>
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
              
              // Get merchant_id from customer data
              let merchantId = null;
              if (window.Recharge && window.Recharge.customer) {
                merchantId = window.Recharge.customer.shopify_customer_id || window.Recharge.customer.shopifyCustomerId;
              }
              
              // Try to get merchant_id from scripts if not available
              if (!merchantId) {
                const scripts = document.querySelectorAll('script');
                for (const script of scripts) {
                  const shopifyIdMatch = (script.textContent || script.innerHTML || '').match(/"shopify_customer_id"\s*:\s*"([^"]+)"/i);
                  if (shopifyIdMatch) {
                    merchantId = shopifyIdMatch[1];
                    break;
                  }
                }
              }
              
              if (!merchantId) {
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
                  
                  
                  if (voucherCode) {
                    // Close the rewards modal if it's open
                    const rewardsModal = document.getElementById('et-redeem-rewards-modal');
                    if (rewardsModal) {
                      rewardsModal.remove();
                    }
                    
                    // The voucher code from the redemption response is already correct
                    // The API returns: { claimed_reward: { redeemable: { code: "..." } } }
                    // This is the same code that appears in LoyaltyLion portal
                    // Show voucher code in a popup modal (like LoyaltyLion)
                    if (typeof window.showVoucherCodeModal === 'function') {
                      try {
                        window.showVoucherCodeModal(name, voucherCode);
                      } catch (error) {
                        console.error('[ET] Error calling modal function:', error);
                        // Fallback to alert
                        alert(`${name} redeemed successfully!\n\nVoucher Code: ${voucherCode}\n\nPlease copy this code and apply it to your cart.`);
                      }
                    } else {
                      console.error('[ET] showVoucherCodeModal function not found!');
                      // Fallback if modal function not available
                      const apply = confirm(`${name} redeemed successfully!\n\nVoucher Code: ${voucherCode}\n\nClick OK to apply this code to your cart, or Cancel to copy it manually.`);
                      if (apply && typeof window.etApplyCode === 'function') {
                        window.etApplyCode(voucherCode);
                      } else if (navigator.clipboard) {
                        navigator.clipboard.writeText(voucherCode);
                        alert(`Voucher code "${voucherCode}" copied to clipboard!`);
                      }
                    }
                    
                    // Don't auto-refresh - let user close modal manually
                    // User can refresh the page manually if needed
                  } else {
                    console.error('[ET] No voucher code found in response. Full response:', data);
                    
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
                            if (typeof window.showVoucherCodeModal === 'function') {
                              window.showVoucherCodeModal(name, foundCode);
                              setTimeout(() => {
                                window.location.reload();
                              }, 5000);
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
          window.etApplyCode = function(code) {
            applyDiscountCode(code);
          };
          function applyDiscountCode(code) {
            // Clean and validate the code
            if (!code || typeof code !== 'string') {
              console.error('[ET] Invalid discount code:', code);
              alert('Invalid discount code. Please check the code and try again.');
              return false;
            }
            
            // Trim whitespace and convert to uppercase (some systems are case-sensitive)
            const cleanCode = code.trim().toUpperCase();
            console.log('[ET] Applying discount code:', cleanCode);
            
            const discountInputs = document.querySelectorAll('input[placeholder*="discount"], input[placeholder*="gift"], input[type="text"], input[name*="discount"], input[name*="code"]');
            let discountInput = null;
            
            // First, try to find input by specific attributes
            for (const input of discountInputs) {
              const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();
              const name = (input.getAttribute('name') || '').toLowerCase();
              const id = (input.getAttribute('id') || '').toLowerCase();
              if (placeholder.includes('discount') || placeholder.includes('code') || placeholder.includes('gift') ||
                  name.includes('discount') || name.includes('code') ||
                  id.includes('discount') || id.includes('code')) {
                discountInput = input;
                break;
              }
            }
            
            // If not found, look for input near apply buttons
            if (!discountInput) {
              const applyButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
                const text = (btn.textContent || '').toLowerCase().trim();
                return text === 'apply' || text.includes('apply') || text.includes('discount');
              });
              for (const btn of applyButtons) {
                const input = btn.previousElementSibling ||
                             btn.parentElement?.querySelector('input[type="text"]') ||
                             btn.closest('div')?.querySelector('input[type="text"]') ||
                             btn.closest('form')?.querySelector('input[type="text"]');
                if (input) {
                  discountInput = input;
                  break;
                }
              }
            }
            
            if (discountInput) {
              // Set the code value
              discountInput.value = cleanCode;
              discountInput.focus();
              
              // Trigger input events
              discountInput.dispatchEvent(new Event('input', { bubbles: true }));
              discountInput.dispatchEvent(new Event('change', { bubbles: true }));
              
              // Try to find and click apply button
              setTimeout(() => {
                // Look for apply button in various locations
                const applyBtn = discountInput.nextElementSibling ||
                                discountInput.parentElement?.querySelector('button') ||
                                discountInput.closest('div')?.querySelector('button[type="submit"]') ||
                                discountInput.closest('form')?.querySelector('button[type="submit"]') ||
                                document.querySelector('button:has-text("Apply"), button[aria-label*="Apply"], button[aria-label*="apply"]');
                
                if (applyBtn && (applyBtn.textContent || '').toLowerCase().includes('apply')) {
                  console.log('[ET] Clicking apply button');
                  applyBtn.click();
                } else {
                  // Try pressing Enter
                  console.log('[ET] Simulating Enter key press');
                  const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                  });
                  discountInput.dispatchEvent(enterEvent);
                  
                  // Also try keyup and keypress
                  discountInput.dispatchEvent(new KeyboardEvent('keyup', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    bubbles: true
                  }));
                }
              }, 200);
              return true;
            } else {
              console.error('[ET] Could not find discount input field');
              alert(`Could not find discount code input field. Please manually enter the code: ${cleanCode}`);
              // Copy to clipboard as fallback
              if (navigator.clipboard) {
                navigator.clipboard.writeText(cleanCode);
                alert(`Code "${cleanCode}" copied to clipboard. Please paste it manually.`);
              }
              return false;
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
              let customerData = null;
              if (window.Recharge && window.Recharge.customer) {
                const rechargeCustomer = window.Recharge.customer;
                customerData = {
                  id: rechargeCustomer.id,
                  email: rechargeCustomer.email,
                  shopify_customer_id: rechargeCustomer.shopify_customer_id || rechargeCustomer.shopifyCustomerId
                };
              }
              if (!customerData) {
                const scripts = document.querySelectorAll('script');
                for (const script of scripts) {
                  const content = script.textContent || script.innerHTML || '';
                  const fullJsonMatch = content.match(/"shopify_customer_id"\s*:\s*"([^"]+)"[^}]*"email"\s*:\s*"([^"]+)"[^}]*"id"\s*:\s*(\d+)/);
                  if (fullJsonMatch) {
                    customerData = { id: fullJsonMatch[3], email: fullJsonMatch[2], shopify_customer_id: fullJsonMatch[1] };
                    break;
                  }
                  const jsonMatch = content.match(/(?:"customer"|customer)\s*:\s*(\{[^}]*"email"[^}]*\})/);
                  if (jsonMatch) {
                    try {
                      const customerObj = JSON.parse(jsonMatch[1]);
                      customerData = { id: customerObj.id, email: customerObj.email, shopify_customer_id: customerObj.shopify_customer_id || customerObj.shopifyCustomerId };
                      break;
                    } catch (e) {}
                  }
                  const customerMatch = content.match(/customer:\s*\{[^}]*id:\s*["']?([^"',\s}]+)["']?[^}]*email:\s*["']([^"']+)["']/);
                  if (customerMatch) {
                    customerData = { id: customerMatch[1], email: customerMatch[2] };
                    const shopifyIdMatch = content.match(/"shopify_customer_id"\s*:\s*"([^"]+)"/i);
                    if (shopifyIdMatch) customerData.shopify_customer_id = shopifyIdMatch[1];
                    break;
                  }
                }
              }
              if (customerData && customerData.email && !customerData.shopify_customer_id) {
                const scripts = document.querySelectorAll('script');
                for (const script of scripts) {
                  const shopifyIdMatch = (script.textContent || script.innerHTML || '').match(/"shopify_customer_id"\s*:\s*"([^"]+)"/i);
                  if (shopifyIdMatch) {
                    customerData.shopify_customer_id = shopifyIdMatch[1];
                    break;
                  }
                }
              }
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
              redeemButton.textContent = 'Redeem';
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
              
              // Add click handler to show modal
              redeemButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
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
                <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #fff;">Redeem Rewards</h2>
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
            let customerData = null;
            if (window.Recharge && window.Recharge.customer) {
              const rechargeCustomer = window.Recharge.customer;
              customerData = {
                id: rechargeCustomer.id,
                email: rechargeCustomer.email,
                shopify_customer_id: rechargeCustomer.shopify_customer_id || rechargeCustomer.shopifyCustomerId
              };
            }
            if (!customerData) {
              const scripts = document.querySelectorAll('script');
              for (const script of scripts) {
                const content = script.textContent || script.innerHTML || '';
                const fullJsonMatch = content.match(/"shopify_customer_id"\s*:\s*"([^"]+)"[^}]*"email"\s*:\s*"([^"]+)"[^}]*"id"\s*:\s*(\d+)/);
                if (fullJsonMatch) {
                  customerData = { id: fullJsonMatch[3], email: fullJsonMatch[2], shopify_customer_id: fullJsonMatch[1] };
                  break;
                }
                const jsonMatch = content.match(/(?:"customer"|customer)\s*:\s*(\{[^}]*"email"[^}]*\})/);
                if (jsonMatch) {
                  try {
                    const customerObj = JSON.parse(jsonMatch[1]);
                    customerData = { id: customerObj.id, email: customerObj.email, shopify_customer_id: customerObj.shopify_customer_id || customerObj.shopifyCustomerId };
                    break;
                  } catch (e) {}
                }
                const customerMatch = content.match(/customer:\s*\{[^}]*id:\s*["']?([^"',\s}]+)["']?[^}]*email:\s*["']([^"']+)["']/);
                if (customerMatch) {
                  customerData = { id: customerMatch[1], email: customerMatch[2] };
                  const shopifyIdMatch = content.match(/"shopify_customer_id"\s*:\s*"([^"]+)"/i);
                  if (shopifyIdMatch) customerData.shopify_customer_id = shopifyIdMatch[1];
                  break;
                }
              }
            }
            
            if (customerData && customerData.email && !customerData.shopify_customer_id) {
              const scripts = document.querySelectorAll('script');
              for (const script of scripts) {
                const shopifyIdMatch = (script.textContent || script.innerHTML || '').match(/"shopify_customer_id"\s*:\s*"([^"]+)"/i);
                if (shopifyIdMatch) {
                  customerData.shopify_customer_id = shopifyIdMatch[1];
                  break;
                }
              }
            }
            
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
          setTimeout(() => {
            addRedeemButtonsToSubscriptions();
          }, 500);
          setTimeout(() => {
            addRedeemButtonsToSubscriptions();
          }, 1000);
          setTimeout(() => {
            addRedeemButtonsToSubscriptions();
          }, 2000);
          setTimeout(() => {
            addRedeemButtonsToSubscriptions();
          }, 3000);
          
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
  })();
  