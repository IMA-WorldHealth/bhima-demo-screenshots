/**
 * A little script to take screenshots of demo.bhi.ma using headless chrome. It
 * will loop through all values in the "PAGES_TO_SCREENSHOT" to generate screen
 * shots of the application.
 *
 * AUTHOR: jniles
 * LICENSE: MIT
 */

const puppeteer = require('puppeteer');

const webpage = 'http://demo.bhi.ma/';

const NETWORK_OPTS = {
  waitUntil : "networkidle",
  networkIdleTimeout : 15000,
};

// 1080p
const VIEWPORT = {
  width: 1366,
  height: 768,
};

const CHROME_OPTS = {
  headless: true,
  //   executablePath : '/usr/bin/google-chrome',
};

// pages to screenshot
const PAGES_TO_SCREENSHOT = [
  { url : '#!/patients/register', name : 'Patient Registration' },
  { url : '#!/invoices/patient', name : 'Invoicing' },
  { url : '#!/vouchers/complex', name : 'Complex Vouchers' },
  { url : '#!/vouchers/simple', name : 'Simple Vouchers' },
  { url : '#!/accounts', name : 'Account Management' },
  { url : '#!/debtors/groups/create', name : 'Debtor Group Creation' },
  { url : '#!/enterprises', name : 'Enterprise Management '},
];

(async () => {
  try {
    const browser = await puppeteer.launch(CHROME_OPTS);

    // page setup
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    await page.emulateMedia('screen');

    console.log(`Going to: ${webpage}.`);

    await page.goto(webpage, NETWORK_OPTS);

    console.log('Got to login page!  Taking a screenshot..');
    await page.screenshot({path: 'screenshots/login.png', fullPage: true});

    await page.evaluate(login);

    // loop through each URL, taking screenshots of it.
    for (let route of PAGES_TO_SCREENSHOT) {
      await navigateAndScreenshot(page, route);
    }

    console.log('All done! Closing chrome ...');

    await browser.close();
  } catch (error) {
    console.error(error);
  }
})();



/**
 * @function login
 *
 * @description
 * This function is slightly hacky, as it manipulates angular's digest loop
 * to register values.  Oh well.  Logs the browser in.
 */
const login = (async () => {
  const qs = window.document.querySelector.bind(window.document);
  const angular = window.angular;
  const $element = angular.element(qs('form[name="LoginForm"]'));

  const $scope = $element.scope();
  const $ctrl = $element.controller();

  angular.extend($ctrl.credentials, { username : 'admin', password: 'admin'});

  $scope.$digest();

  qs('button[type=submit]').click();

  // make sure we wait for the thing to load.
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), 5000);
  });
});

/**
 * @function navigateAndScreenshot
 *
 *
 */
const navigateAndScreenshot = (async (page, route) => {
  try {
    console.log(`[page] Navigating to ${route.url}.`);
    await page.goto(`${webpage}${route.url}`, NETWORK_OPTS);

    const fname = `screenshots/${route.name}.png`;
    await page.screenshot({path: fname, fullPage: true});
    console.log(`[page] Screenshot of ${route.url} saved to ${fname}.`);
  } catch (e) {
    console.error(`ERR [route] ${route.name}: ${e.message}`);
  }
});

