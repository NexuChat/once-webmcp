import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('complete privacy-bounded assistance journey', async ({ page }, testInfo) => {
  const consoleErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('response', (response) => {
    if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`)
  })
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: /tell your story once\. keep every decision/i }),
  ).toBeVisible()
  await page.getByRole('button', { name: /build my plan/i }).click()
  await expect(page.getByText(/applications are staged/i)).toBeVisible()
  const proof = page.getByRole('region', { name: 'Coordination proof' })
  await expect(proof.getByText('Story told once')).toBeVisible()
  await expect(proof.getByText('Services staged')).toBeVisible()
  await expect(proof.getByText('Sent before approval')).toBeVisible()

  const journeyControls = page.getByRole('region', { name: 'Journey controls' })
  await expect(journeyControls).toBeInViewport()
  await page.getByText('Government ID · Blocked').scrollIntoViewIfNeeded()
  await expect(journeyControls).toBeInViewport()

  await page.getByRole('button', { name: /review disclosures/i }).click()
  await expect(page.getByText('Government ID · Blocked')).toBeVisible()

  await page.getByRole('button', { name: /approve selected applications/i }).click()
  await page.getByRole('button', { name: /commit approved plan/i }).click()
  await expect(page.getByRole('heading', { name: /applications committed/i })).toBeVisible()
  await page.screenshot({ path: `artifacts/${testInfo.project.name}-committed.png`, fullPage: true })
  expect(consoleErrors).toEqual([])
  expect(failedRequests).toEqual([])
})

test('layout has no horizontal overflow', async ({ page }, testInfo) => {
  await page.goto('/')

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  await page.screenshot({ path: `artifacts/${testInfo.project.name}-home.png`, fullPage: true })
})

test('has no automatically detectable WCAG A/AA violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  expect(results.violations).toEqual([])
})

test('Arabic experience preserves RTL layout and accessibility', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: /العربية/i }).click()

  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(
    page.getByRole('heading', { name: 'احكِ قصتك مرة واحدة. واحتفظ بكل قرار.' }),
  ).toBeVisible()
  await expect(page.getByText('محاكاة شبكة الخدمات')).toBeVisible()
  await expect(page.getByText('اسأل مرة واحدة')).toBeVisible()
  await expect(page.getByText('طرد غذائي مرن ثقافيًا ومناسب لحجم الأسرة.')).toBeVisible()

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(results.violations).toEqual([])

  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-arabic-home.png`,
    fullPage: true,
  })

  await page.getByRole('button', { name: 'أنشئ خطتي' }).click()
  await expect(page.getByText('غرفة عائلية لمدة 72 ساعة')).toBeVisible()
  await expect(page.getByRole('region', { name: 'دليل التنسيق' })).toBeVisible()
  await expect(page.getByText('تم تجنب تعارضين')).toBeVisible()
  await expect(page.getByText('تم تجهيز الخطة')).toBeVisible()
  await expect(page.getByText('مغلق')).toBeVisible()

  const plannedResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(plannedResults.violations).toEqual([])

  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-arabic-planned.png`,
    fullPage: true,
  })
})

test('keyboard-only users can complete the human authority journey', async ({ page }) => {
  await page.goto('/')

  const activateByKeyboard = async (name: RegExp) => {
    const target = page.getByRole('button', { name })
    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press('Tab')
      if (await target.evaluate((element) => element === document.activeElement)) {
        await page.keyboard.press('Enter')
        return
      }
    }
    throw new Error(`Keyboard focus did not reach ${name}`)
  }

  await activateByKeyboard(/build my plan/i)
  await expect(page.getByRole('heading', { name: /applications are staged/i })).toBeVisible()

  await activateByKeyboard(/review disclosures/i)
  await activateByKeyboard(/approve selected applications/i)
  await activateByKeyboard(/commit approved plan/i)

  await expect(page.getByRole('heading', { name: /applications committed/i })).toBeVisible()
})
