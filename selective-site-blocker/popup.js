document.addEventListener('DOMContentLoaded', () => {
  const blockForm = document.getElementById('blockForm');
  const siteInput = document.getElementById('siteInput');
  const routeInput = document.getElementById('routeInput');
  const blockList = document.getElementById('blockList');
  const formError = document.getElementById('formError');

  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Load and display data when popup opens
  displayBlockedSites();
  prefillCurrentSite();

  // Handle the button (or Enter in either field) to add a new blocked route
  blockForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addBlockedSite();
  });
  [siteInput, routeInput].forEach(input => {
    input.addEventListener('input', () => { formError.textContent = ''; });
  });

  function addBlockedSite() {
    let site = siteInput.value.trim().toLowerCase();
    let route = routeInput.value.trim();

    if (!site) return showError('Enter a site to block, e.g. instagram.com');

    try {
      site = new URL(site.includes('://') ? site : `https://${site}`).hostname;
    } catch (e) {
      return showError('That doesn\'t look like a site. Try something like instagram.com');
    }

    if (route.length > 0 && !route.startsWith('/')) {
      route = `/${route}`;
    }

    // Fetch existing data from storage
    chrome.storage.local.get(['blockedData'], (result) => {
      const blockedData = result.blockedData || {};

      // Initialize the array for the site if it doesn't exist
      if (!blockedData[site]) {
        blockedData[site] = [];
      }

      // Add route if it exists and is new
      if (route.length > 0 && !blockedData[site].includes(route)) {
        blockedData[site].push(route);
      }

      chrome.storage.local.set({ blockedData }, () => {
        displayBlockedSites();
        siteInput.value = '';
        routeInput.value = '';
        siteInput.focus();
      });
    });
  }

  function showError(message) {
    formError.textContent = message;
    siteInput.focus();
  }

  // Fill in the site of the tab the popup was opened from
  function prefillCurrentSite() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      try {
        const url = new URL(tabs[0].url);
        if (!['http:', 'https:'].includes(url.protocol) || siteInput.value) return;
        siteInput.value = url.hostname.replace(/^www\./, '');
        siteInput.select();
      } catch (e) {}
    });
  }

  // Stop allowing one route; the site itself stays blocked
  function removeRoute(site, route) {
    updateBlockedData(blockedData => {
      if (blockedData[site]) {
        blockedData[site] = blockedData[site].filter(r => r !== route);
      }
    });
  }

  // Unblock a site completely, along with any allowed routes
  function removeSite(site) {
    updateBlockedData(blockedData => { delete blockedData[site]; });
  }

  function updateBlockedData(change) {
    chrome.storage.local.get(['blockedData'], (result) => {
      const blockedData = result.blockedData || {};
      change(blockedData);
      chrome.storage.local.set({ blockedData }, () => {
        displayBlockedSites();
      });
    });
  }

  function icon(paths) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    svg.setAttribute('viewBox', '0 0 14 14');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.6');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', paths);
    svg.appendChild(path);
    return svg;
  }

  function removeButton(label, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'remove';
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.appendChild(icon('M4 4l6 6M10 4l-6 6'));
    btn.addEventListener('click', onClick);
    return btn;
  }

  function textSpan(className, text) {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    return span;
  }

  // Function to pull data from storage and render the list
  function displayBlockedSites() {
    chrome.storage.local.get(['blockedData'], (result) => {

      blockList.innerHTML = '';
      const blockedData = result.blockedData || {};
      const entries = Object.entries(blockedData);

      if (entries.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'empty';
        empty.textContent = 'No sites blocked yet. Add one above, and keep any pages you still need open.';
        blockList.appendChild(empty);
        return;
      }

      for (const [site, routes] of entries) {
        const li = document.createElement('li');
        li.className = 'site';

        const row = document.createElement('div');
        row.className = 'row';
        row.appendChild(textSpan('host', site));

        if (routes.length === 0) {
          row.appendChild(textSpan('whole', 'Whole site'));
        }
        row.appendChild(removeButton(`Unblock ${site}`, () => removeSite(site)));
        li.appendChild(row);

        if (routes.length > 0) {
          const routeList = document.createElement('ul');
          routeList.className = 'routes';

          routes.forEach(route => {
            const routeItem = document.createElement('li');
            routeItem.className = 'row route';
            routeItem.appendChild(icon('M3 7.5l2.5 2.5L11 4.5'));
            routeItem.appendChild(textSpan('path', route));
            routeItem.appendChild(removeButton(`Stop allowing ${route}`, () => removeRoute(site, route)));
            routeList.appendChild(routeItem);
          });
          li.appendChild(routeList);
        }

        blockList.appendChild(li);
      }
    });
  }
});
