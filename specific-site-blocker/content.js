(function () {
  chrome.storage.local.get(['blockedData'], (result) => {
    const blockedData = result.blockedData || {};
    console.log('Specific Site Blocker loaded for', window.location.href, 'blockedData keys:', Object.keys(blockedData));

    function findBlockedSite(hostname) {
      const normalizedHost = hostname.toLowerCase().replace(/^www\./, '');
      const matchingKey = Object.keys(blockedData).find(key => {
        const normalizedKey = key.toLowerCase().replace(/^www\./, '');
        return normalizedHost === normalizedKey || normalizedHost.endsWith(`.${normalizedKey}`);
      });
      return matchingKey ? blockedData[matchingKey] : undefined;
    }

    function isAllowed() {
      if (window.location.search.includes('blockedRedirect=true')) {
        showNotification("Site Blocked! You have automatically been redirected");
        
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
      }

      const currentSite = window.location.hostname;
      const currentPath = window.location.pathname;
      const blockedSite = findBlockedSite(currentSite);

      // If site not in blocklist, skip
      if (!blockedSite) {
        console.log('Specific Site Blocker: no blocked entry for', currentSite, 'stored keys:', Object.keys(blockedData));
        return true;
      }

      const allowedRoutes = blockedSite;
      
      // If no routes, block entire site
      if (allowedRoutes.length === 0) { return false; }

      // Check if current path matches or starts with any allowed route
      return allowedRoutes.some(route => 
        currentPath === route || currentPath.startsWith(route)
      );
    }

    // Little popup notification for explaining redirects
    function showNotification(message) {
      const notification = document.createElement('div');
      notification.className = 'redirect-notification';
      notification.innerText = message;

      document.body.appendChild(notification);

      // Automatically remove after 3 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }

    function enforce() {
      if (!isAllowed()) {
        console.log(`Access blocked for: ${window.location.href}`);
        const currentSite = window.location.hostname;
        const blockedSite = findBlockedSite(currentSite);
        const allowedRoutes = blockedSite || [];
        
        // Fallback destination: use the first allowed route or go back
        if (allowedRoutes.length > 0) 
        {
          window.location.replace(`https://${currentSite}${allowedRoutes[0]}?blockedRedirect=true`);
        } 
        else { window.location.href = chrome.runtime.getURL("blocked.html"); }
      }
    }

    // Patch history API (pushState navigation on React etc.)
    ["pushState", "replaceState"].forEach((method) => {
      const orig = history[method];
      history[method] = function (...args) {
        orig.apply(this, args);
        enforce();
      };
    });

    // Back/forward buttons
    window.addEventListener("popstate", enforce);

    // Polling fallback — catches anything else
    let lastPath = location.pathname;
    setInterval(() => {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        enforce();
      }
    }, 200);

    enforce();
    });
  })();
