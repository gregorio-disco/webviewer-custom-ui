const playwright = require('playwright');

async function runTest() {
  console.log('Starting WebViewer Memory Test...');
  console.log('Version: 11.3.0 (baseline)');

  const browser = await playwright.chromium.launch({
    headless: false, // Show browser so we can see what's happening
    args: [
      '--enable-precise-memory-info',
      '--js-flags=--expose-gc'
    ]
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the app
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');

  // Wait for button to be ready
  await page.waitForSelector('#toggleViewer', { timeout: 10000 });
  console.log('Found toggle button');

  // Take initial memory measurement
  await page.evaluate(() => {
    if (window.gc) window.gc();
  });
  await page.waitForTimeout(1000);

  const memoryBefore = await page.evaluate(() => {
    if (window.performance && window.performance.memory) {
      return {
        usedJSHeapSize: window.performance.memory.usedJSHeapSize,
        totalJSHeapSize: window.performance.memory.totalJSHeapSize
      };
    }
    return null;
  });

  console.log('Initial memory:', {
    used: (memoryBefore.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
    total: (memoryBefore.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB'
  });

  // Run mount/unmount cycles
  const cycles = 100;
  console.log(`\nRunning ${cycles} mount/unmount cycles...`);

  for (let i = 0; i < cycles; i++) {
    console.log(`  Cycle ${i + 1}/${cycles}`);

    // Mount viewer
    await page.click('#toggleViewer', { timeout: 60000 });
    console.log('    - Clicked toggle (mounting viewer)');

    // Wait for WebViewer to initialize
    await page.waitForTimeout(5000); // Give time for WebViewer to load

    // Check for errors
    const errors = await page.evaluate(() => {
      return window.__webViewerErrors || [];
    });

    if (errors.length > 0) {
      console.log('    - Errors detected:', errors);
    }

    // Unmount viewer
    await page.click('#toggleViewer', { timeout: 60000 });
    console.log('    - Clicked toggle (unmounting viewer)');

    // Force GC
    await page.evaluate(() => {
      if (window.gc) window.gc();
    });

    await page.waitForTimeout(500);
  }

  // Final GC
  console.log('\nRunning final garbage collection...');
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => {
      if (window.gc) window.gc();
    });
    await page.waitForTimeout(200);
  }

  // Take final memory measurement
  const memoryAfter = await page.evaluate(() => {
    if (window.performance && window.performance.memory) {
      return {
        usedJSHeapSize: window.performance.memory.usedJSHeapSize,
        totalJSHeapSize: window.performance.memory.totalJSHeapSize
      };
    }
    return null;
  });

  console.log('\nFinal memory:', {
    used: (memoryAfter.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
    total: (memoryAfter.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB'
  });

  // Calculate delta
  const delta = memoryAfter.usedJSHeapSize - memoryBefore.usedJSHeapSize;
  const deltaMB = delta / 1024 / 1024;
  const deltaPercent = (delta / memoryBefore.usedJSHeapSize * 100).toFixed(2);

  console.log('\n========================================');
  console.log('RESULTS');
  console.log('========================================');
  console.log('WebViewer Version: 11.3.0');
  console.log('Cycles: ' + cycles);
  console.log('Memory Delta: ' + deltaMB.toFixed(2) + ' MB (' + deltaPercent + '%)');

  const jenkinsThreshold = 73400320; // 70MB
  const passed = Math.abs(delta) < jenkinsThreshold;

  console.log('Jenkins Threshold: ' + (jenkinsThreshold / 1024 / 1024).toFixed(2) + ' MB');
  console.log('Status: ' + (passed ? 'PASS ✅' : 'FAIL ❌'));
  console.log('========================================\n');

  // Keep browser open for inspection
  console.log('Browser staying open for 10 seconds for inspection...');
  await page.waitForTimeout(10000);

  await browser.close();

  return {
    version: '11.3.0',
    cycles,
    memoryBefore: memoryBefore.usedJSHeapSize,
    memoryAfter: memoryAfter.usedJSHeapSize,
    delta,
    deltaMB,
    passed
  };
}

runTest()
  .then(results => {
    console.log('Test completed successfully');
    process.exit(results.passed ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
