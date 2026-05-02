// Web domain for GitHub Pages deployment.
// Update this when deploying to a custom domain.
const WEB_DOMAIN = "https://syueying.github.io/PostRay";

// Runtime extension detection — no build-time flag needed.
const isExtension =
  typeof chrome !== "undefined" && !!chrome.runtime?.getURL;

const extUrl = (page: string): string => {
  if (isExtension) {
    return chrome.runtime.getURL(page);
  }
  return `${WEB_DOMAIN}/${page}`;
};

export const PLANS_URL = extUrl("plans.html");
export const LANDING_URL = extUrl("landing.html");

export const CWS_URL = "https://TODO_CHROME_WEB_STORE_URL";
