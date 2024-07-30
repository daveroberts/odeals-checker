const { Builder, Browser, By, Key, until } = require("selenium-webdriver");

(async function example() {
  let driver = await new Builder().forBrowser(Browser.EDGE).build();
  try {
    await driver.get("https://www.meta.com/experiences/2180753588712484/");
    await new Promise((r) => setTimeout(r, 5000));
  } finally {
    await driver.quit();
  }
})();
