document.addEventListener('DOMContentLoaded', () => {
  const siteInput = document.getElementById('siteInput');
  const routeInput = document.getElementById('routeInput');
  const blockBtn = document.getElementById('blockBtn');
  const blockListBody = document.getElementById('blockListBody');

  // Load and display data when popup opens
  displayBlockedSites();

  // Handle button click to add a new blocked route
  blockBtn.addEventListener('click', () => {
    const site = siteInput.value.trim().toLowerCase();
    const route = routeInput.value.trim();

    if (!site || !route) return alert('Please fill in both fields.');

    // Fetch existing data from storage
    chrome.storage.local.get(['blockedData'], (result) => {
      const blockedData = result.blockedData || {};

      // Initialize the array for the site if it doesn't exist
      if (!blockedData[site]) {
        blockedData[site] = [];
      }

      // Add route if it's not a duplicate
      if (!blockedData[site].includes(route)) {
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
              blockedData[site] = blockedData[site].filter(r => r !== route);

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