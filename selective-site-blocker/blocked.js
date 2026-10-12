// Show which site was blocked, when the browser passes it along as the referrer
try {
  if (document.referrer) {
    document.getElementById('blockedHost').textContent = new URL(document.referrer).hostname;
  }
} catch (e) {}
