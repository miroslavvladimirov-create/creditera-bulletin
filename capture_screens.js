const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

const executablePath = chromePaths.find(p => fs.existsSync(p));

(async () => {
  if (!executablePath) {
    console.error('No browser executable found');
    process.exit(1);
  }
  const browser = await puppeteer.launch({ executablePath, headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  
  const artifactDir = 'C:\\Users\\miros\\.gemini\\antigravity\\brain\\f477464c-1ba1-4cc4-9cff-964e26b9ebbd';
  
  const pageStats = await page.evaluate(() => {
    const pages = document.querySelectorAll('.pdf-page');
    return Array.from(pages).map((p, i) => ({
      page: i + 1,
      id: p.id,
      scrollHeight: p.scrollHeight,
      clientHeight: p.clientHeight,
      overflow: p.scrollHeight > p.clientHeight + 2
    }));
  });

  console.log('Page stats:', JSON.stringify(pageStats, null, 2));

  const p1 = await page.$('#page-1');
  if (p1) await p1.screenshot({ path: path.join(artifactDir, 'page_1_preview.png') });
  const p11 = await page.$('#page-11');
  if (p11) await p11.screenshot({ path: path.join(artifactDir, 'page_11_preview.png') });
  const p12 = await page.$('#page-12');
  if (p12) await p12.screenshot({ path: path.join(artifactDir, 'page_12_preview.png') });

  // Test CreditERA brand
  await page.evaluate(() => {
    setBrand('creditera');
  });
  await new Promise(r => setTimeout(r, 500));
  if (p12) await p12.screenshot({ path: path.join(artifactDir, 'page_12_creditera_preview.png') });

  console.log('Screenshots saved successfully');
  await browser.close();
})();
