const puppeteer = require('puppeteer');

async function testAuthFlow() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()));
  
  try {
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    
    // Wait for the page to load
    await page.waitForSelector('input[type="email"]', { visible: true });
    
    // Switch to password tab
    console.log('2. Switching to password tab...');
    await page.click('button[value="password"]');
    await page.waitForTimeout(500);
    
    // Fill in credentials
    console.log('3. Filling in credentials...');
    await page.type('input[type="email"]', 'will@dent.ly');
    await page.type('input[type="password"]', 'Odessa99!');
    
    // Take screenshot before login
    await page.screenshot({ path: 'before-login.png' });
    
    // Click sign in button
    console.log('4. Clicking sign in button...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.waitForTimeout(5000)
    ]);
    
    console.log('5. Current URL after login:', page.url());
    
    // Check cookies after login
    console.log('6. Checking cookies...');
    const cookies = await page.cookies();
    console.log('All cookies:', cookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...', domain: c.domain })));
    
    // Check Supabase auth cookies specifically
    const authCookies = cookies.filter(c => c.name.includes('sb-rntlhdlzijhdujpxsxzl'));
    console.log('Auth cookies found:', authCookies.length);
    authCookies.forEach(cookie => {
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 30)}...`);
    });
    
    // Check localStorage
    console.log('\n7. Checking localStorage...');
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.includes('supabase')) {
          items[key] = window.localStorage.getItem(key);
        }
      }
      return items;
    });
    console.log('LocalStorage items:', Object.keys(localStorage));
    
    // Try navigating to settings
    console.log('\n8. Navigating to /settings...');
    await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle0' });
    
    console.log('9. Current URL after settings navigation:', page.url());
    
    // Take screenshot after navigation
    await page.screenshot({ path: 'after-settings-nav.png' });
    
    // Check if we're still logged in
    const finalCookies = await page.cookies();
    const finalAuthCookies = finalCookies.filter(c => c.name.includes('sb-rntlhdlzijhdujpxsxzl'));
    console.log('\n10. Auth cookies after navigation:', finalAuthCookies.length);
    
    // Check for any error messages on the page
    const errorMessages = await page.evaluate(() => {
      const errors = [];
      document.querySelectorAll('[role="alert"], .error, .toast').forEach(el => {
        errors.push(el.textContent);
      });
      return errors;
    });
    if (errorMessages.length > 0) {
      console.log('Error messages found:', errorMessages);
    }
    
    // Wait a bit to observe the page
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
}

testAuthFlow();