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

  // Change text of address payment
  const replacements = [
    {
      target: 'Your addresses & payment details',
      replacement: 'Your payment details',
    },
    {
      target: 'Address & payment details',
      replacement: 'Payment details',
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

  // Run once in case it's already rendered
  replaceTextContent();

  // Set up observer to handle dynamic rendering
  const addressObserver = new MutationObserver(() => {
    replaceTextContent();
  });

  addressObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
