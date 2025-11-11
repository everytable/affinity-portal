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
    const navContainer = existingLinks[0].closest('nav') || 
                        existingLinks[0].parentElement?.parentElement || 
                        existingLinks[0].parentElement;
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
    
    // Remove our container
    if (contactUsContainer && contactUsContainer.parentElement) {
      contactUsContainer.remove();
      contactUsContainer = null;
    }
  }

  function renderContactUsPage() {
    cleanupContactUsPage();
    
    let mainContent = null;
    
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      const text = div.textContent || '';
      if ((text.includes('Your next order') || text.includes('upcoming orders') || text.includes('Deliver to')) 
          && !text.includes('View upcoming orders') 
          && !text.includes('Manage subscriptions')) {
        let parent = div;
        while (parent && parent.parentElement) {
          const siblings = Array.from(parent.parentElement.children);
          const hasSidebarSibling = siblings.some(sibling => {
            return sibling !== parent && (
              sibling.textContent.includes('View upcoming orders') ||
              sibling.textContent.includes('Manage subscriptions')
            );
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

    if (!mainContent) {
      const contentSelectors = [
        'main[role="main"] > div:first-child',
        '[data-testid="main-content"] > div:first-child',
        'main > div:first-child',
      ];
      
      for (const selector of contentSelectors) {
        const el = document.querySelector(selector);
        if (el && !el.textContent.includes('View upcoming orders')) {
          mainContent = el;
          break;
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
    contactUsContainer.innerHTML = `
      <div style="max-width: 720px; margin: 0 auto; padding: 0;">
        <div style="background: #0d3c3a; color: #fff; padding: 24px; border-radius: 8px 8px 0 0; margin-bottom: 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #fff;">Contact us</h1>
        </div>

        <!-- Content -->
        <div style="background: #f7f6ef; padding: 32px 24px; border-radius: 0 0 8px 8px;">
          <div style="margin-bottom: 24px;">
            <h2 style="font-size: 32px; font-weight: 700; color: #222; margin: 0 0 8px 0;">Hi there,</h2>
            <p style="font-size: 16px; color: #666; margin: 0;">Here are the ways for you to get in touch.</p>
          </div>

          <!-- Contact Options -->
          <div style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            
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
})();
