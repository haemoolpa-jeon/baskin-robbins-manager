// Responsive check: screenshots the dense screens at phone/tablet × portrait/landscape.
// Prereq: `npm run demo` on :5173. Run: node scripts/demo-shots.mjs
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = new URL('../_shots/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
mkdirSync(OUT, { recursive: true })

const SIZES = [
  { name: 'phone-portrait', w: 390, h: 844 },
  { name: 'phone-landscape', w: 844, h: 390 },
  { name: 'tablet-portrait', w: 834, h: 1112 },
  { name: 'tablet-landscape', w: 1194, h: 834 },
]

const browser = await chromium.launch({ channel: 'chrome', headless: true })

for (const s of SIZES) {
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h } })
  const shot = (screen) => page.screenshot({ path: `${OUT}${s.name}--${screen}.png` })
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await page.waitForSelector('.cabinet', { timeout: 15000 })
  await shot('inventory')

  await page.locator('.nav-btn', { hasText: '근무' }).click()
  await page.waitForSelector('.cal')
  await shot('schedule')

  await page.locator('.nav-btn', { hasText: '주문' }).click()
  await page.waitForSelector('.stat-cards')
  await shot('order')

  await page.close()
  console.log(' •', s.name)
}

await browser.close()
console.log('done →', OUT)
