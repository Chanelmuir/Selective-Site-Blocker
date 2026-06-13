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
      const currentSite = window.location.hostname;
      const currentPath = window.location.pathname;
      const blockedSite = findBlockedSite(currentSite);

      // If site not in blocklist, skip
      if (!blockedSite) {
        console.log('Specific Site Blocker: no blocked entry for', currentSite, 'stored keys:', Object.keys(blockedData));
        return true;
      }

      const allowedRoutes = blockedSite;
      
      // Check if current path matches or starts with any allowed route
      return allowedRoutes.some(route => 
        currentPath === route || currentPath.startsWith(route)
      );
    }

    function enforce() {
      if (!isAllowed()) {
        console.log(`Access blocked for: ${window.location.href}`);
        const currentSite = window.location.hostname;
        const blockedSite = findBlockedSite(currentSite);
        const allowedRoutes = blockedSite || [];
        
        // Fallback destination: use the first allowed route
        const fallbackPath = allowedRoutes.length > 0 ? allowedRoutes[0] : "/";
        
        window.location.replace(`https://${currentSite}${fallbackPath}`);
        alert('Site Blocked! You have been redirected');
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
