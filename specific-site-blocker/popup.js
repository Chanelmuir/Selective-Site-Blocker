document.addEventListener('DOMContentLoaded', () => {
  const siteInput = document.getElementById('siteInput');
  const routeInput = document.getElementById('routeInput');
  const blockBtn = document.getElementById('blockBtn');
  const blockListBody = document.getElementById('blockListBody');

  // Load and display data when popup opens
  displayBlockedSites();

  // Handle button click to add a new blocked route
  blockBtn.addEventListener('click', () => {
    let site = siteInput.value.trim().toLowerCase();
    let route = routeInput.value.trim();

    if (!site) return alert('Please at least fill in the site field.');

    try {
      site = new URL(site.includes('://') ? site : `https://${site}`).hostname;
    } catch (e) {
      return alert('Please enter a valid site, e.g. instagram.com');
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
      });
    });
  });

  // Function to pull data from storage and render the list
  function displayBlockedSites() {
    chrome.storage.local.get(['blockedData'], (result) => {

      blockListBody.innerHTML = '';
      const blockedData = result.blockedData || {};

      for (const [site, routes] of Object.entries(blockedData)) {

        // So it still shows site that have no routes
        if (routes.length === 0) { routes.push(' '); }

        routes.forEach(route => {
          const tr = document.createElement('tr');
          const siteTd = document.createElement('td');
          const routeTd = document.createElement('td');
          const deleteTd = document.createElement('td');

          siteTd.textContent = site;
          routeTd.textContent = route;
          deleteTd.textContent = '🗑️';

          deleteTd.style.cursor = 'pointer';
          deleteTd.addEventListener('click', () => {
            const site = siteTd.textContent;
            const route = routeTd.textContent;

            chrome.storage.local.get(['blockedData'], (result) => {
              const blockedData = result.blockedData || {};

              // Subtract current route from array
              const newRoutes = blockedData[site].filter(r => r !== route);
              
              // Remove key if no routes left
              if (newRoutes.length === 0) {
                delete blockedData[site];
              } else {
                blockedData[site] = newRoutes;
              }
              chrome.storage.local.set({ blockedData }, () => {
                displayBlockedSites();
              });
            });
          });

          tr.appendChild(siteTd);
          tr.appendChild(routeTd);
          tr.appendChild(deleteTd);
          
          blockListBody.appendChild(tr);
        });
      }
    });
  }
});