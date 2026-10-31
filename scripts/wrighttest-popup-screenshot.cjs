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
        const pages = context.pages();
        const newestPage = pages.at(-1);

        if (newestPage && newestPage !== page && !newestPage.isClosed()) {
          await newestPage.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
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
