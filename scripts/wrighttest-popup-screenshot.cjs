const { chromium } = require('playwright');

const originalLaunch = chromium.launch.bind(chromium);

chromium.launch = async (...launchArguments) => {
  const browser = await originalLaunch(...launchArguments);
  const originalNewContext = browser.newContext.bind(browser);

  browser.newContext = async (...contextArguments) => {
    const context = await originalNewContext(...contextArguments);
    const originalNewPage = context.newPage.bind(context);

    context.newPage = async (...pageArguments) => {
      const page = await originalNewPage(...pageArguments);
      const originalScreenshot = page.screenshot.bind(page);

      page.screenshot = async (options) => {
        let pages = context.pages();
        if (pages.length === 1) {
          const popupExpected = await page.evaluate(() => (
            document.activeElement instanceof HTMLAnchorElement
            && document.activeElement.target === '_blank'
          )).catch(() => false);

          if (popupExpected) {
            pages = context.pages();
            if (pages.length === 1) {
              await context.waitForEvent('page', { timeout: 5_000 }).catch(() => {});
              pages = context.pages();
            }
          }
        }
        const newestPage = pages.at(-1);

        if (newestPage && newestPage !== page && !newestPage.isClosed()) {
          await newestPage.waitForURL(
            (url) => url.href !== 'about:blank',
            { waitUntil: 'domcontentloaded', timeout: 30_000 },
          );
          await newestPage.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
          await newestPage.evaluate(() => {
            const badge = document.createElement('div');
            badge.textContent = `Opened URL: ${window.location.href}`;
            badge.style.cssText = [
              'position:fixed',
              'top:8px',
              'left:8px',
              'z-index:2147483647',
              'max-width:calc(100vw - 16px)',
              'padding:8px 12px',
              'border:2px solid #111827',
              'border-radius:6px',
              'background:#ffffff',
              'color:#111827',
              'font:14px/1.4 monospace',
              'overflow-wrap:anywhere',
              'box-shadow:0 2px 8px rgba(0,0,0,.25)',
            ].join(';');
            document.documentElement.appendChild(badge);
          });
          return newestPage.screenshot(options);
        }

        return originalScreenshot(options);
      };

      return page;
    };

    return context;
  };

  return browser;
};
