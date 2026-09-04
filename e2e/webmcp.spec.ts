import { expect, test } from '@playwright/test'

test('back-to-back WebMCP calls plan from the latest constraints', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(async () => (await document.modelContext?.getTools?.())?.length === 7)

  const results = await page.evaluate(async () => {
    const context = document.modelContext!
    const tools = await context.getTools!()
    const update = tools.find((candidate) => candidate.name === 'update_planning_constraints')!
    const prepare = tools.find((candidate) => candidate.name === 'prepare_assistance_plan')!
    const updateResult = await context.executeTool!(
      update,
      JSON.stringify({ adults: 1, children: 3, monthlyIncome: 1100, postalArea: 'East Quarter' }),
    )
    const prepareResult = await context.executeTool!(prepare, '{}')
    return [JSON.parse(updateResult as string), JSON.parse(prepareResult as string)]
  })

  expect(results).toEqual([
    expect.objectContaining({ status: 'planning-constraints-updated' }),
    expect.objectContaining({ status: 'staged', applications: 4 }),
  ])
  await expect(page.getByText('1 + 3')).toBeVisible()
  await expect(page.getByText('East Quarter').first()).toBeVisible()
  await expect(page.getByText('$1,100')).toHaveCount(2)
})

test('real WebMCP lifecycle requires visible human approval', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.waitForFunction(async () => (await document.modelContext?.getTools?.())?.length === 7)

  const initialNames = await page.evaluate(async () =>
    (await document.modelContext!.getTools!()).map((tool) => tool.name),
  )
  expect(initialNames).toContain('prepare_assistance_plan')
  expect(initialNames).toContain('update_planning_constraints')
  expect(initialNames).not.toContain('commit_approved_plan')

  const updateResult = await page.evaluate(async () => {
    const context = document.modelContext!
    const tools = await context.getTools!()
    const tool = tools.find((candidate) => candidate.name === 'update_planning_constraints')!
    return context.executeTool!(
      tool,
      JSON.stringify({ children: 3, monthlyIncome: 1100, postalArea: 'East Quarter' }),
    )
  })
  expect(JSON.parse(updateResult as string)).toMatchObject({
    status: 'planning-constraints-updated',
    sensitiveFieldsAccepted: false,
  })
  await expect(page.getByText('1 + 3')).toBeVisible()
  await expect(page.getByText('East Quarter')).toBeVisible()
  await expect(page.getByText('A safe week for a household of 4')).toBeVisible()

  const prepareResult = await page.evaluate(async () => {
    const context = document.modelContext!
    const tools = await context.getTools!()
    const tool = tools.find((candidate) => candidate.name === 'prepare_assistance_plan')!
    return context.executeTool!(tool, '{}')
  })
  expect(JSON.parse(prepareResult as string)).toMatchObject({
    status: 'staged',
    applications: 4,
    outcome: {
      storiesTold: 1,
      providerSimulationsStaged: 4,
      repeatedProviderIntakes: 0,
      conflictsAvoided: 2,
      unjustifiedFieldsBlocked: 1,
      applicationsSentBeforeApproval: 0,
    },
  })
  await expect(page.getByRole('heading', { name: /applications are staged/i })).toBeVisible()

  const stagedNames = await page.evaluate(async () =>
    (await document.modelContext!.getTools!()).map((tool) => tool.name),
  )
  expect(stagedNames).toContain('review_disclosures')
  expect(stagedNames).not.toContain('prepare_assistance_plan')
  expect(stagedNames).not.toContain('update_planning_constraints')
  expect(stagedNames).not.toContain('commit_approved_plan')

  await page.getByRole('button', { name: /review disclosures/i }).click()
  await page.getByRole('button', { name: /approve selected applications/i }).click()

  const commitResult = await page.evaluate(async () => {
    const context = document.modelContext!
    const tools = await context.getTools!()
    const tool = tools.find((candidate) => candidate.name === 'commit_approved_plan')!
    return context.executeTool!(tool, '{}')
  })
  expect(JSON.parse(commitResult as string)).toMatchObject({
    status: 'committed',
    receipts: expect.arrayContaining([expect.objectContaining({ provider: 'Harbor House' })]),
  })
  await expect(page.getByRole('heading', { name: /applications committed/i })).toBeVisible()

  const finalNames = await page.evaluate(async () =>
    (await document.modelContext!.getTools!()).map((tool) => tool.name),
  )
  expect(finalNames).not.toContain('commit_approved_plan')
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-agent-committed.png`,
    fullPage: true,
  })
})
