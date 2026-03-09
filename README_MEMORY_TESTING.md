# Memory Leak Testing - Reproduction Guide

This branch contains all the tools and results for comparing memory usage between @pdftron/webviewer v11.3.0 and v11.11.0.

## Quick Start

To reproduce the test results:

```bash
# 1. Clone and checkout this branch
git checkout test/memory-leak-v11.3-vs-v11.11

# 2. Install dependencies
yarn install

# 3. Start the dev server
yarn start

# In a new terminal:

# 4. Test v11.11.0 (current version)
node test-manual.js
npx memlab run --scenario ./memlab/webviewer.js

# 5. Switch to v11.3.0 baseline
yarn add @pdftron/webviewer@11.3.0

# 6. Restart dev server (Ctrl+C in first terminal, then yarn start)

# 7. Test v11.3.0 in second terminal
node test-manual.js
npx memlab run --scenario ./memlab/webviewer.js
```

---

## Test Files Included

### Test Scripts
- **`test-manual.js`** - Playwright memory profiling script (100 mount/unmount cycles)
- **`memlab/webviewer.js`** - MemLab heap snapshot scenario

### Test Results (Already Run)
- **`test-results-11.3.0.txt`** - Playwright results for v11.3.0
- **`test-results-11.11.0.txt`** - Playwright results for v11.11.0
- **`memlab-results-11.3.0.txt`** - MemLab results for v11.3.0
- **`memlab-results-11.11.0.txt`** - MemLab results for v11.11.0

### Documentation
- **`MEMORY_LEAK_COMPARISON.md`** - Full analysis and comparison report
- **`README_MEMORY_TESTING.md`** - This file

### Test Application
- **`src/App.js`** - Modified with Core config bug fix
- **`src/index.js`** - Entry point
- **`public/files/demo.pdf`** - Test PDF

---

## Manual Testing Steps

### Option 1: Playwright Memory Profiling (Recommended)

This test runs 100 mount/unmount cycles and measures memory with forced garbage collection.

**Prerequisites:**
- Dev server running on http://localhost:3000
- Node.js installed

**Steps:**

1. **Start dev server:**
   ```bash
   yarn start
   ```
   Wait for "Compiled successfully" message

2. **Run test in new terminal:**
   ```bash
   node test-manual.js
   ```

3. **Expected output:**
   ```
   Starting WebViewer Memory Test...
   Version: 11.11.0 (current)
   Running 100 mount/unmount cycles...
   ...
   ========================================
   RESULTS
   ========================================
   WebViewer Version: 11.11.0
   Cycles: 100
   Memory Delta: 4.86 MB (36.47%)
   Status: PASS ✅
   ========================================
   ```

4. **Switch version and repeat:**
   ```bash
   yarn add @pdftron/webviewer@11.3.0
   # Restart dev server (Ctrl+C and yarn start)
   node test-manual.js
   ```

**What it tests:**
- Initial vs final memory after 100 cycles
- Memory retained after forced garbage collection
- Percentage increase from baseline

**Duration:** ~8 minutes per version

---

### Option 2: MemLab Leak Detection

This test takes heap snapshots and identifies specific memory leak paths.

**Prerequisites:**
- Dev server running on http://localhost:3000
- MemLab installed (happens automatically via npx)

**Steps:**

1. **Start dev server:**
   ```bash
   yarn start
   ```

2. **Run memlab in new terminal:**
   ```bash
   npx memlab run --scenario ./memlab/webviewer.js
   ```

3. **Expected output:**
   ```
   page-load[7.3MB](baseline)[s1] > action-on-page[10.8MB](target)[s2] > revert[10.8MB](final)[s3]

   MemLab found 2 leak(s)

   --Similar leaks in this run: 586--
   --Retained size of leaked objects: 99.2KB--
   [Window / http://localhost:3000] (native) @53867
     --global_object --> [Window] (object)
     ...
   ```

4. **Switch version and repeat:**
   ```bash
   yarn add @pdftron/webviewer@11.3.0
   # Restart dev server
   npx memlab run --scenario ./memlab/webviewer.js
   ```

**What it tests:**
- Heap snapshot at baseline (page load)
- Heap snapshot after action (mount/unmount WebViewer)
- Heap snapshot after revert (should return to baseline)
- Identifies objects not garbage collected
- Shows retaining paths for leaked objects

**Duration:** ~1 minute per version

---

### Option 3: Manual Interactive Testing

Use the browser's DevTools to inspect memory manually.

**Steps:**

1. **Start dev server:**
   ```bash
   yarn start
   ```

2. **Open browser DevTools:**
   - Navigate to http://localhost:3000
   - Press F12 (Chrome DevTools)
   - Go to "Memory" tab

3. **Take baseline snapshot:**
   - Click "Take snapshot"
   - Label it "Baseline"

4. **Perform mount/unmount cycles:**
   - Click "Toggle viewer" button (mounts WebViewer)
   - Wait 3-5 seconds
   - Click "Toggle viewer" again (unmounts WebViewer)
   - Repeat 10-20 times

5. **Force garbage collection:**
   - Click garbage can icon in DevTools
   - Wait 2 seconds
   - Click again

6. **Take final snapshot:**
   - Click "Take snapshot"
   - Label it "After cycles"

7. **Compare snapshots:**
   - Select "Comparison" view
   - Compare "After cycles" to "Baseline"
   - Look at "# Delta" column for retained objects

**What to look for:**
- Detached DOM nodes (should be 0)
- Retained closures
- Event listeners not removed
- Worker objects

**Duration:** ~5 minutes

---

## Understanding the Results

### Playwright Test

**Good result:**
- Memory delta < 5 MB after 100 cycles
- Percentage increase < 35%

**Bad result:**
- Memory delta > 5 MB
- Percentage increase > 40%
- Memory growing linearly with cycles

**v11.3.0 baseline:** 4.10 MB delta (32.13%)
**v11.11.0 current:** 4.86 MB delta (36.47%)

### MemLab Test

**Good result:**
- MemLab found 0-1 leak(s)
- Final heap decreases from target heap
- Retained size < 200 KB

**Bad result:**
- MemLab found 2+ leak(s)
- Final heap same as target heap (no decrease)
- Retained size > 200 KB
- Multiple leak clusters

**v11.3.0 baseline:** 1 leak, 206.4 KB, heap decreased
**v11.11.0 current:** 2 leaks, 121.2 KB, heap did NOT decrease

---

## Troubleshooting

### Dev server won't start
```bash
# Kill any existing processes on port 3000
lsof -ti:3000 | xargs kill -9
yarn start
```

### Playwright test fails with "Cannot find module"
```bash
# Install dependencies
yarn install
# Make sure playwright is installed
yarn add -D playwright
```

### MemLab says "Connecting to web server" forever
- Make sure dev server is running first
- Check http://localhost:3000 loads in browser
- Try restarting dev server

### "WorkerManager has not been initialized" error
- This is expected and has been fixed in App.js
- The fix guards Core configuration to run only once
- Error should not appear with the committed code

---

## Test Configuration

### Changing Cycle Count

Edit `test-manual.js` line 48:

```javascript
const cycles = 100; // Change this number
```

Recommended values:
- 10 cycles: Quick smoke test (~1 minute)
- 100 cycles: Standard test (~8 minutes)
- 200 cycles: Extended test (~16 minutes)

### Using Different PDFs

Replace `public/files/demo.pdf` with your test PDF, or modify `src/App.js` line 18:

```javascript
documentViewer.loadDocument("/files/demo.pdf"); // Change path
```

### Adjusting Wait Times

Edit `test-manual.js` line 59:

```javascript
await page.waitForTimeout(5000); // Time to wait for WebViewer to load
```

Increase if WebViewer initialization is slow.

---

## Cleanup Code (Reference)

The cleanup code in `src/App.js` follows Apryse best practices:

```javascript
return () => {
  try {
    if (documentViewer && typeof documentViewer.unmount === 'function') {
      documentViewer.unmount(); // Recommended for v11+
    }
    scrollView.current = null;
    viewer.current = null;
  } catch (error) {
    console.error("Error during WebViewer cleanup:", error);
  }
};
```

**Note:** This cleanup is correct. Memory issues are in the library, not in this implementation.

---

## Files Modified from Original

### src/App.js
- Added Core config guard to prevent "WorkerManager" error
- Wrapped initialization in try/catch
- No cleanup changes (cleanup was already correct)

### package.json
- Added playwright as dev dependency
- Version will vary based on last test run

### New Files
- `test-manual.js` - Playwright test script
- `MEMORY_LEAK_COMPARISON.md` - Analysis document
- `README_MEMORY_TESTING.md` - This file
- `test-results-*.txt` - Test output files
- `memlab-results-*.txt` - MemLab output files

---

## Expected Test Duration

| Test Type | Per Version | Both Versions |
|-----------|-------------|---------------|
| Playwright (100 cycles) | ~8 min | ~16 min |
| MemLab | ~1 min | ~2 min |
| Manual DevTools | ~5 min | ~10 min |
| **Full suite** | **~15 min** | **~30 min** |

---

## Questions?

See `MEMORY_LEAK_COMPARISON.md` for:
- Full analysis and findings
- Root cause assessment
- Recommendations
- Contact information for Apryse support

---

**Branch:** `test/memory-leak-v11.3-vs-v11.11`
**Created:** 2026-03-09
**Purpose:** Reproducible memory leak testing and comparison
