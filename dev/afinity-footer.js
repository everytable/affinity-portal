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
    const existingLinks = document.querySelectorAll('a[href*="/upcoming"], a[href*="/previous"], a[href*="/subscriptions"]');
    if (existingLinks.length === 0) return;

    // Find navigation container
    // Prioritize list elements (ul/ol) for list-based sidebars, matching contact-us injection logic
    const firstLink = existingLinks[0];
    let navContainer = null;
    
    // Check if parent or grandparent is a list element (for <nav><ul><li><a> structure)
    if (firstLink.parentElement?.parentElement?.tagName === 'UL' || 
        firstLink.parentElement?.parentElement?.tagName === 'OL') {
      navContainer = firstLink.parentElement.parentElement;
    } else if (firstLink.parentElement?.tagName === 'UL' || 
               firstLink.parentElement?.tagName === 'OL') {
      navContainer = firstLink.parentElement;
    } else {
      // Fall back to parent chain or nav element
      navContainer = firstLink.parentElement?.parentElement || 
                     firstLink.parentElement ||
                     firstLink.closest('nav');
    }
    
    if (!navContainer) return;

    // Get all navigation links (excluding Contact us)
    const allNavLinks = Array.from(navContainer.querySelectorAll('a')).filter(link => {
      if (link.id === 'et-contact-us-nav-link') return false;
      const href = link.getAttribute('href') || '';
      const text = link.textContent?.trim().toLowerCase();
      return href.includes('/upcoming') || 
             href.includes('/previous') || 
             href.includes('/subscriptions') ||
             text.includes('upcoming') ||
             text.includes('next order') ||
             text.includes('manage') ||
             text.includes('previous');
    });

    if (allNavLinks.length < 2) return;

    // Identify target links
    let manageLink = null;
    let previousOrderLink = null;

    allNavLinks.forEach(link => {
      const text = link.textContent?.trim().toLowerCase();
      const href = link.getAttribute('href') || '';
      
      if (!manageLink && (href.includes('/subscriptions') || text === 'manage' || (text.includes('manage') && !text.includes('previous')))) {
        manageLink = link;
      }
      
      if (!previousOrderLink && (href.includes('/previous') || text.includes('previous order') || (text.includes('previous') && !text.includes('manage')))) {
        previousOrderLink = link;
      }
    });

    if (!manageLink || !previousOrderLink) return;

    // Find the container that holds navigation items as direct children
    const findContainer = () => {
      // Get all unique immediate parents of navigation links
      const immediateParents = new Set(allNavLinks.map(link => link.parentElement).filter(Boolean));
      
      // If all links share the same immediate parent
      if (immediateParents.size === 1) {
        const commonParent = Array.from(immediateParents)[0];
        // Count how many of this parent's children contain nav links
        const navLinkContainers = Array.from(commonParent.children).filter(child => 
          allNavLinks.some(link => child === link || child.contains(link))
        );
        // If multiple children contain nav links, this is our container
        if (navLinkContainers.length >= 2) {
          return commonParent;
        }
      }
      
      // Fallback: use navContainer (links are direct children or more complex structure)
      return navContainer;
    };

    const container = findContainer();

    // Get the wrapper element that is a direct child of the container
    // This handles wrappers with single or multiple children (e.g., <div><icon/><a></a></div>)
    const getWrapperElement = (link) => {
      // If link is already a direct child of container, return it
      if (link.parentElement === container) {
        return link;
      }
      
      // Walk up the DOM tree until we find an element whose parent is the container
      let current = link;
      while (current) {
        const parent = current.parentElement;
        if (!parent) break;
        
        // Found the wrapper that's a direct child of container
        if (parent === container) {
          return current;
        }
        
        // Safety check: don't go beyond navContainer
        if (parent === navContainer && container !== navContainer) {
          return link;
        }
        
        current = parent;
      }
      
      // Fallback: return link itself
      return link;
    };

    const manageWrapper = getWrapperElement(manageLink);
    const previousWrapper = getWrapperElement(previousOrderLink);

    // Get all children of the container
    const children = Array.from(container.children);
    const manageIdx = children.indexOf(manageWrapper);
    const previousIdx = children.indexOf(previousWrapper);

    if (manageIdx === -1 || previousIdx === -1) return;

    // Check if already in correct positions (3rd and 4th, indices 2 and 3)
    if (manageIdx === 2 && previousIdx === 3) {
      navReordered = true;
      return;
    }

    // Remove from current positions (remove higher index first to avoid index shift)
    const childrenArray = [...children];
    if (manageIdx > previousIdx) {
      childrenArray.splice(manageIdx, 1);
      childrenArray.splice(previousIdx, 1);
    } else {
      childrenArray.splice(previousIdx, 1);
      childrenArray.splice(manageIdx, 1);
    }

    // Insert at positions 3 and 4 (index 2 and 3)
    const targetIndex = Math.min(2, childrenArray.length);
    childrenArray.splice(targetIndex, 0, manageWrapper, previousWrapper);

    // Apply reordering to DOM
    childrenArray.forEach((child, index) => {
      if (index === 0) {
        if (child !== container.firstChild) {
          container.insertBefore(child, container.firstChild);
        }
      } else {
        const prevChild = childrenArray[index - 1];
        if (prevChild.nextSibling !== child) {
          container.insertBefore(child, prevChild.nextSibling);
        }
      }
    });

    navReordered = true;
  }

  const navReorderObserver = new MutationObserver(() => {
    if (!navReordered) {
      // Small delay to ensure text replacement has completed first
      setTimeout(() => {
        if (!navReordered) {
          reorderNavigation();
        }
      }, 100);
    }
  });

  navReorderObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Run after text replacement has had time to complete
  setTimeout(reorderNavigation, 600);

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

    // Find the navigation sidebar (look for common patterns)
    const navSelectors = [
      'nav[data-testid="customer-portal-sidebar"]',
      '[data-testid="navigation"]',
      'nav[role="navigation"]',
      '.recharge-sidebar',
      // Look for the container that has links like "View upcoming orders"
      'a[href*="/upcoming"], a[href*="/orders"]'
    ];

    let navContainer = null;
    
    const existingLinks = document.querySelectorAll('a[href*="/upcoming"], a[href*="/previous"], a[href*="/subscriptions"]');
    if (existingLinks.length > 0) {
      navContainer = existingLinks[0].parentElement?.parentElement || existingLinks[0].parentElement;
    }

    if (!navContainer) {
      for (const selector of navSelectors) {
        navContainer = document.querySelector(selector);
        if (navContainer) break;
      } 
    }

    if (!navContainer) {
      return;
    }

    if (document.querySelector('#et-contact-us-nav-link')) {
      contactUsInjected = true;
      return;
    }

    const referenceLink = navContainer.querySelector('a[href*="/upcoming"], a[href*="/subscriptions"]');
    
    if (referenceLink) {
      const contactLink = referenceLink.cloneNode(true);
      contactLink.id = 'et-contact-us-nav-link';
      contactLink.href = '#contact-us';
      
      const textSpan = contactLink.querySelector('span') || contactLink;
      textSpan.textContent = 'Contact us';
      
      if (textSpan.style) {
        textSpan.style.color = '#222';
      }
      contactLink.style.color = '#222';
            
      contactLink.addEventListener('click', function(e) {
        e.preventDefault();
        renderContactUsPage();
      });

      const logoutLink = navContainer.querySelector('a[href*="logout"], button[type="submit"]');
      if (logoutLink && logoutLink.parentElement) {
        logoutLink.parentElement.parentElement.insertBefore(contactLink.parentElement || contactLink, logoutLink.parentElement);
      } else {
        navContainer.appendChild(contactLink);
      }

      contactUsInjected = true;
    }
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

  const contactNavObserver = new MutationObserver(() => {
    if (!contactUsInjected) {
      injectContactUsNav();
    }
  });

  contactNavObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  setTimeout(injectContactUsNav, 1000);
  setTimeout(injectContactUsNav, 2000);
  
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

  // ============================================
  // Redeem Rewards Tab Injection & One-Click Redemption
  // ============================================
  
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

      // Insert after "Next Order" / "Upcoming Orders" link, before other links
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
    // Show React content again
    if (hiddenReactContentForRewards) {
      hiddenReactContentForRewards.style.display = '';
      hiddenReactContentForRewards = null;
    }
    
    // Remove resize listener
    if (rewardResizeHandler) {
      window.removeEventListener('resize', rewardResizeHandler);
      rewardResizeHandler = null;
    }
    
    // Remove our container
    if (redeemRewardsContainer && redeemRewardsContainer.parentElement) {
      redeemRewardsContainer.remove();
      redeemRewardsContainer = null;
    }
  }

  function loadLoyaltyLionWidget() {
    if (loyaltyLionWidgetLoaded) return;
    
    // Check if LoyaltyLion script is already loaded
    if (window.LoyaltyLion || document.querySelector('script[src*="loyaltylion"]')) {
      loyaltyLionWidgetLoaded = true;
      return;
    }

    // Load LoyaltyLion widget script
    const script = document.createElement('script');
    script.src = 'https://cdn.loyaltylion.com/sdk.js';
    script.async = true;
    script.onload = function() {
      loyaltyLionWidgetLoaded = true;
      console.log('✅ LoyaltyLion widget loaded');
    };
    document.head.appendChild(script);
  }

  function applyDiscountCode(code) {
    // Find discount code input field
    const discountInputs = document.querySelectorAll('input[placeholder*="discount"], input[placeholder*="gift"], input[type="text"]');
    let discountInput = null;
    
    for (const input of discountInputs) {
      const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();
      const name = (input.getAttribute('name') || '').toLowerCase();
      if (placeholder.includes('discount') || placeholder.includes('code') || placeholder.includes('gift') || 
          name.includes('discount') || name.includes('code')) {
        discountInput = input;
        break;
      }
    }

    if (!discountInput) {
      // Try to find by looking for nearby "Apply" button
      const applyButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const text = (btn.textContent || '').toLowerCase().trim();
        return text === 'apply' || text.includes('apply');
      });
      
      for (const btn of applyButtons) {
        const input = btn.previousElementSibling || 
                     btn.parentElement?.querySelector('input[type="text"]') ||
                     btn.closest('div')?.querySelector('input[type="text"]');
        if (input) {
          discountInput = input;
          break;
        }
      }
    }

    if (discountInput) {
      discountInput.value = code;
      discountInput.dispatchEvent(new Event('input', { bubbles: true }));
      discountInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Find and click apply button
      setTimeout(() => {
        const applyBtn = discountInput.nextElementSibling ||
                        discountInput.parentElement?.querySelector('button') ||
                        discountInput.closest('div')?.querySelector('button');
        
        if (applyBtn && (applyBtn.textContent || '').toLowerCase().includes('apply')) {
          applyBtn.click();
        } else {
          // Try pressing Enter on the input
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            bubbles: true
          });
          discountInput.dispatchEvent(enterEvent);
        }
      }, 100);
      
      return true;
    }
    
    return false;
  }

  function setupOneClickRedemption() {
    // Monitor for reward redemption buttons and points display
    const observer = new MutationObserver(() => {
      // Look for "Redeem" buttons in the rewards section
      const redeemButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const text = (btn.textContent || '').toLowerCase();
        return text.includes('redeem') && (text.includes('$5') || text.includes('$10') || text.includes('5.00') || text.includes('10.00'));
      });

      redeemButtons.forEach(btn => {
        if (btn.dataset.etRewardHandler === 'true') return;
        btn.dataset.etRewardHandler = 'true';
        
        btn.addEventListener('click', async function(e) {
          // Wait a moment for redemption to process
          setTimeout(() => {
            // Look for generated discount code
            const codeElements = document.querySelectorAll('input[readonly], code, .code, [class*="code"]');
            let discountCode = null;
            
            for (const el of codeElements) {
              const value = el.value || el.textContent || '';
              if (value && value.length > 5 && /^[A-Z0-9-]+$/.test(value.trim())) {
                discountCode = value.trim();
                break;
              }
            }

            // Also check for copied-to-clipboard messages or code displays
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
              // Store code for auto-application
              sessionStorage.setItem('et_redeemed_discount_code', discountCode);
              
              // Navigate back to "View your next order" and apply code
              const nextOrderLink = document.querySelector('a[href*="/upcoming"], a[href*="/orders"]');
              if (nextOrderLink) {
                cleanupRedeemRewardsPage();
                nextOrderLink.click();
                
                // Wait for page to load, then apply discount
                setTimeout(() => {
                  applyDiscountCode(discountCode);
                }, 1500);
              } else {
                // Try to apply on current page if we're already on the order page
                applyDiscountCode(discountCode);
              }
            }
          }, 500);
        });
      });

      // Also look for points display to show quick redeem buttons
      const pointsDisplays = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return text.includes('points') && /\d+/.test(text) && !el.querySelector('button[data-et-reward-handler]');
      });

      pointsDisplays.forEach(display => {
        const text = display.textContent || '';
        const pointsMatch = text.match(/(\d+)\s*points?/i);
        if (pointsMatch) {
          const points = parseInt(pointsMatch[1]);
          if (points >= 500) {
            // Add quick redeem buttons if not already present
            if (!display.querySelector('.et-quick-redeem')) {
              const quickRedeemDiv = document.createElement('div');
              quickRedeemDiv.className = 'et-quick-redeem';
              quickRedeemDiv.style.cssText = 'margin-top: 12px; display: flex; gap: 8px;';
              
              if (points >= 1000) {
                const redeem10Btn = document.createElement('button');
                redeem10Btn.textContent = 'Redeem $10.00';
                redeem10Btn.style.cssText = 'padding: 8px 16px; background: #0d3c3a; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;';
                redeem10Btn.onclick = () => {
                  const select = display.closest('div')?.querySelector('select');
                  if (select) {
                    const option10 = Array.from(select.options).find(opt => opt.text.includes('10.00') || opt.text.includes('$10'));
                    if (option10) {
                      select.value = option10.value;
                      select.dispatchEvent(new Event('change', { bubbles: true }));
                      const redeemBtn = display.closest('div')?.querySelector('button');
                      if (redeemBtn) setTimeout(() => redeemBtn.click(), 100);
                    }
                  }
                };
                quickRedeemDiv.appendChild(redeem10Btn);
              }
              
              if (points >= 500) {
                const redeem5Btn = document.createElement('button');
                redeem5Btn.textContent = 'Redeem $5.00';
                redeem5Btn.style.cssText = 'padding: 8px 16px; background: #0d3c3a; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;';
                redeem5Btn.onclick = () => {
                  const select = display.closest('div')?.querySelector('select');
                  if (select) {
                    const option5 = Array.from(select.options).find(opt => opt.text.includes('5.00') || opt.text.includes('$5'));
                    if (option5) {
                      select.value = option5.value;
                      select.dispatchEvent(new Event('change', { bubbles: true }));
                      const redeemBtn = display.closest('div')?.querySelector('button');
                      if (redeemBtn) setTimeout(() => redeemBtn.click(), 100);
                    }
                  }
                };
                quickRedeemDiv.appendChild(redeem5Btn);
              }
              
              display.appendChild(quickRedeemDiv);
            }
          }
        }
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
    
    // Use same strategy as contact us page to find main content
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

    if (!mainContent) {
      console.error('❌ Could not find main content area for redeem rewards');
      return;
    }

    // Hide React content
    hiddenReactContentForRewards = mainContent;
    mainContent.style.display = 'none';
    
    // Create our container
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
          <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 18px; color: #666; margin-bottom: 16px;">Loading rewards...</div>
            <div style="font-size: 14px; color: #999;">If the rewards widget doesn't load, please refresh the page.</div>
          </div>
        </div>

        <div style="margin-top: 24px; padding: 16px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
          <p style="margin: 0; font-size: 14px; color: #856404;">
            <strong>Note:</strong> After redeeming your points, you'll be automatically redirected back to your order page where the discount code will be applied.
          </p>
        </div>
      </div>
    `;

    // Insert our container
    mainContent.parentElement.insertBefore(redeemRewardsContainer, mainContent.nextSibling);

    // Load LoyaltyLion widget
    loadLoyaltyLionWidget();
    
    // Setup one-click redemption handlers
    setupOneClickRedemption();

    // Try to find and inject LoyaltyLion widget if it exists on the page
    setTimeout(() => {
      const loyaltyLionContainer = document.querySelector('[id*="loyaltylion"], [class*="loyaltylion"], [data-loyaltylion]');
      if (loyaltyLionContainer) {
        const widgetContainer = document.getElementById('et-loyaltylion-widget-container');
        if (widgetContainer) {
          widgetContainer.innerHTML = '';
          widgetContainer.appendChild(loyaltyLionContainer.cloneNode(true));
        }
      }
    }, 1000);

    // Handle responsive width
    rewardResizeHandler = () => {
      if (redeemRewardsContainer) {
        redeemRewardsContainer.style.width = window.innerWidth < 1024 ? '100%' : '65.7%';
      }
    };
    window.addEventListener('resize', rewardResizeHandler);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Inject navigation tab
  const redeemRewardsNavObserver = new MutationObserver(() => {
    if (!redeemRewardsInjected) {
      injectRedeemRewardsNav();
    }
  });

  redeemRewardsNavObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  setTimeout(injectRedeemRewardsNav, 1000);
  setTimeout(injectRedeemRewardsNav, 2000);

  // Cleanup on navigation
  document.addEventListener('Recharge::location::change', function() {
    cleanupRedeemRewardsPage();
    redeemRewardsInjected = false;
  }, true);

  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[href*="/upcoming"], a[href*="/previous"], a[href*="/subscriptions"], a[href*="/customer"], a[href*="/overview"]');
    if (link && redeemRewardsContainer) {
      cleanupRedeemRewardsPage();
    }
  }, true);

  // Enhance rewards section on "View your next order" page with one-click redemption
  function enhanceOrderPageRewards() {
    const url = window.location.href;
    if (!url.includes('/upcoming') && !url.includes('/orders')) return;

    // Look for rewards/points section
    const rewardsSections = Array.from(document.querySelectorAll('div, section')).filter(el => {
      const text = el.textContent || '';
      return (text.includes('points') || text.includes('redeem') || text.includes('reward')) && 
             /\d+/.test(text) &&
             !el.dataset.etRewardsEnhanced;
    });

    rewardsSections.forEach(section => {
      section.dataset.etRewardsEnhanced = 'true';
      
      const text = section.textContent || '';
      const pointsMatch = text.match(/(\d+)\s*points?/i);
      
      if (pointsMatch) {
        const points = parseInt(pointsMatch[1]);
        
        // Find the select dropdown for reward amounts
        const select = section.querySelector('select');
        const redeemBtn = section.querySelector('button');
        
        if (select && redeemBtn && points >= 500) {
          // Add one-click redeem buttons
          if (!section.querySelector('.et-one-click-redeem')) {
            const oneClickDiv = document.createElement('div');
            oneClickDiv.className = 'et-one-click-redeem';
            oneClickDiv.style.cssText = 'margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;';
            
            if (points >= 1000) {
              const quickRedeem10 = document.createElement('button');
              quickRedeem10.textContent = 'Redeem $10.00';
              quickRedeem10.style.cssText = 'padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px; transition: background 0.2s;';
              quickRedeem10.onmouseenter = () => quickRedeem10.style.background = '#218838';
              quickRedeem10.onmouseleave = () => quickRedeem10.style.background = '#28a745';
              quickRedeem10.onclick = () => {
                const option10 = Array.from(select.options).find(opt => 
                  opt.text.includes('10.00') || opt.text.includes('$10') || opt.value.includes('1000')
                );
                if (option10) {
                  select.value = option10.value;
                  select.dispatchEvent(new Event('change', { bubbles: true }));
                  setTimeout(() => {
                    redeemBtn.click();
                    // After redemption, try to auto-apply the code
                    setTimeout(() => {
                      const codeInput = document.querySelector('input[readonly], code, .code');
                      if (codeInput) {
                        const code = codeInput.value || codeInput.textContent || '';
                        if (code && code.length > 5) {
                          applyDiscountCode(code.trim());
                        }
                      }
                    }, 1000);
                  }, 200);
                }
              };
              oneClickDiv.appendChild(quickRedeem10);
            }
            
            if (points >= 500) {
              const quickRedeem5 = document.createElement('button');
              quickRedeem5.textContent = 'Redeem $5.00';
              quickRedeem5.style.cssText = 'padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px; transition: background 0.2s;';
              quickRedeem5.onmouseenter = () => quickRedeem5.style.background = '#218838';
              quickRedeem5.onmouseleave = () => quickRedeem5.style.background = '#28a745';
              quickRedeem5.onclick = () => {
                const option5 = Array.from(select.options).find(opt => 
                  opt.text.includes('5.00') || opt.text.includes('$5') || opt.value.includes('500')
                );
                if (option5) {
                  select.value = option5.value;
                  select.dispatchEvent(new Event('change', { bubbles: true }));
                  setTimeout(() => {
                    redeemBtn.click();
                    // After redemption, try to auto-apply the code
                    setTimeout(() => {
                      const codeInput = document.querySelector('input[readonly], code, .code');
                      if (codeInput) {
                        const code = codeInput.value || codeInput.textContent || '';
                        if (code && code.length > 5) {
                          applyDiscountCode(code.trim());
                        }
                      }
                    }, 1000);
                  }, 200);
                }
              };
              oneClickDiv.appendChild(quickRedeem5);
            }
            
            // Insert after the redeem button or at the end of the section
            if (redeemBtn && redeemBtn.parentElement) {
              redeemBtn.parentElement.insertBefore(oneClickDiv, redeemBtn.nextSibling);
            } else {
              section.appendChild(oneClickDiv);
            }
          }
        }
      }
    });
  }

  // Auto-apply discount codes on "View your next order" page
  const autoApplyObserver = new MutationObserver(() => {
    // Check if we're on the order page and have a stored discount code
    const url = window.location.href;
    if (url.includes('/upcoming') || url.includes('/orders')) {
      const storedCode = sessionStorage.getItem('et_redeemed_discount_code');
      if (storedCode) {
        sessionStorage.removeItem('et_redeemed_discount_code');
        setTimeout(() => {
          if (applyDiscountCode(storedCode)) {
            console.log('✅ Automatically applied discount code:', storedCode);
          }
        }, 1000);
      }
      
      // Enhance rewards section with one-click buttons
      enhanceOrderPageRewards();
    }
  });

  autoApplyObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
  
  // Run immediately
  setTimeout(enhanceOrderPageRewards, 1500);

})();
