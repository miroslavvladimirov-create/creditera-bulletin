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
  await page.goto('https://creditera-bulletin.web.app', { waitUntil: 'networkidle0' });
  
  const artifactDir = 'C:\\Users\\miros\\.gemini\\antigravity\\brain\\f477464c-1ba1-4cc4-9cff-964e26b9ebbd';
  
  const p1 = await page.$('#page-1');
  if (p1) await p1.screenshot({ path: path.join(artifactDir, 'page_1_preview.png') });
  const p2 = await page.$('#page-2');
  if (p2) await p2.screenshot({ path: path.join(artifactDir, 'page_2_preview.png') });
  const p3 = await page.$('#page-3');
  if (p3) await p3.screenshot({ path: path.join(artifactDir, 'page_3_preview.png') });

  console.log('Screenshots saved successfully');
  await browser.close();
})();
