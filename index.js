/**
 * A little script to take screenshots of demo.bhi.ma using headless chrome. It
 * will loop through all values in the "PAGES_TO_SCREENSHOT" to generate screen
 * shots of the application.
 *
 * AUTHOR: jniles
 * LICENSE: MIT
 */

require('dotenv').config();
const puppeteer = require('puppeteer-core');

const webpage = process.env.SITE;

const NETWORK_OPTS = {
  waitUntil: ['domcontentloaded', 'networkidle0'],
  timeout: 60000,
};

// 1080p
const VIEWPORT = {
  width: 1366,
  height: 768,
};

const CHROME_OPTS = {
  headless: true,
  executablePath: process.env.CHROME_BIN,
};

const CREDENTIALS = {
  username: process.env.BH_USERNAME,
  password: process.env.BH_PASSWORD,
};

// pages to screenshot
// TODO(@jniles) - make filenames without spaces - potentially define the names here.  They
// are a pain to work with on the web - have to use encodeURIComponent() to get them to work.
const PAGES_TO_SCREENSHOT = [
  { url: '#!/patients/register', name: 'Patient Registration' },
  { url: '#!/invoices/patient', name: 'Invoicing' },
  { url: '#!/vouchers/complex', name: 'Complex Vouchers' },
  { url: '#!/vouchers/simple', name: 'Simple Vouchers' },
  { url: '#!/accounts', name: 'Account Management' },
  { url: '#!/debtors/groups/create', name: 'Debtor Group Creation' },
  { url: '#!/enterprises', name: 'Enterprise Management ' },
];


function delay(seconds) {
  return new Promise((resolve) => { setTimeout(() => resolve(), seconds * 1000); });
}

(async () => {
  try {
    const browser = await puppeteer.launch(CHROME_OPTS);

    // page setup
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    await page.emulateMedia('screen');

    console.log(`Going to: ${webpage}.`);

    await page.goto(webpage, NETWORK_OPTS);

    // intially take the screenshot of the login page since we can't come back here.
    console.log('Got to login page!  Taking a screenshot..');
    await page.screenshot({ path: 'screenshots/login.png', fullPage: true, type: 'png' });
    console.log('screenshot saved.');


    console.log('Reloading with debug information...');
    await page.evaluate(() => {
      window.angular.reloadWithDebugInfo();
    });

    await delay(35);

    console.log('done.');

    console.log('Logging into server...');
    await page.evaluate(login, CREDENTIALS);
    console.log('Done!');

    // loop through each URL, taking screenshots of it.
    for (const route of PAGES_TO_SCREENSHOT) {
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
function login(creds) {
  const qs = window.document.querySelector.bind(window.document);
  const { angular } = window;
  const $element = angular.element(qs('form[name="LoginForm"]'));

  const $scope = $element.scope();
  const $ctrl = $element.controller();

  angular.extend($ctrl.credentials, creds);

  $scope.$digest();

  qs('button[type=submit]').click();

  // make sure we wait for the thing to load.
  return new Promise((resolve) => { setTimeout(() => resolve(), 5000); });
}

/**
 * @function navigateAndScreenshot
 *
 * @descripton
 * This function navigates to awebpage and takes a full page PNG screenshot.  It expects
 * the route to define the value of the path.  Stores all values in a screenshots/ directory.
 */
const navigateAndScreenshot = (async (page, route) => {
  try {
    console.log(`[page] Navigating to ${webpage}${route.url}.`);

    await page.goto(`${webpage}${route.url}`, NETWORK_OPTS);

    await delay(15);

    const fname = `screenshots/${route.name.trim()}.png`;
    await page.screenshot({ path: fname, fullPage: true, type: 'png' });
    console.log(`[page] Screenshot of ${route.url} saved to ${fname}.`);
  } catch (e) {
    console.error(`ERR [route] ${route.name}: ${e.message}`);
  }
});
