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
  // Contact Us Tab Injection
  // ============================================
  
  let contactUsInjected = false;

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

  // Render Contact Us page content
  function renderContactUsPage() {
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

    mainContent.innerHTML = `
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

    const options = mainContent.querySelectorAll('a[href*="mailto"], a[href*="callback"], a[href*="faq"]');
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
    contactUsInjected = false;
    setTimeout(injectContactUsNav, 500);
  });
})();
