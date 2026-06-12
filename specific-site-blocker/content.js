(function () {
  chrome.storage.local.get(['blockedData'], (result) => {
    const blockedData = result.blockedData || {};

    function isAllowed() {
      const currentSite = window.location.hostname;
      const currentPath = window.location.pathname;

      // If site not in blocklist, skip
      if (!blockedData[currentSite]) {
        return true; 
      }

      const allowedRoutes = blockedData[currentSite];
      
      // Check if current path matches or starts with any allowed route
      return allowedRoutes.some(route => 
        currentPath === route || currentPath.startsWith(route)
      );
    }

    function enforce() {
      if (!isAllowed()) {
        const currentSite = window.location.hostname;
        const allowedRoutes = blockedData[currentSite];
        
        // Fallback destination: use the first allowed route
        const fallbackPath = allowedRoutes.length > 0 ? allowedRoutes[0] : "/";
        
        window.location.replace(`https://${currentSite}${fallbackPath}`);
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
