import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../src/App'

describe('human approval journey', () => {
  it('states the product identity and privacy boundaries clearly', () => {
    render(<App />)

    expect(document.documentElement.lang).toBe('en')
    expect(document.documentElement.dir).toBe('ltr')
    expect(screen.getByRole('link', { name: 'ONCE home' })).toBeVisible()
    expect(screen.getAllByText('ONCE')).toHaveLength(2)
    expect(screen.getByText('A life-event workspace with privacy boundaries')).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Tell your story once. Keep every decision.' }),
    ).toBeVisible()
    expect(
      screen.getByText(
        'Your chosen agent can read planning constraints. Providers receive only approved fields.',
      ),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Service network simulation' })).toBeVisible()
  })

  it('keeps applications staged until the person explicitly approves', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /tell your story once\. keep every decision/i }),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: /build my plan/i }))

    expect(screen.getByText(/applications are staged/i)).toBeVisible()
    const proof = screen.getByRole('region', { name: 'Coordination proof' })
    expect(within(proof).getByText('Story told once')).toBeVisible()
    expect(within(proof).getByText('Services staged')).toBeVisible()
    expect(within(proof).getByText('Conflicts avoided')).toBeVisible()
    expect(within(proof).getByText('Overreach blocked')).toBeVisible()
    expect(within(proof).getByText('Sent before approval')).toBeVisible()
    expect(within(proof).getAllByText('0')).toHaveLength(1)
    expect(screen.getByText('Room capacity')).toBeVisible()
    expect(screen.getAllByText('$1,240')).toHaveLength(2)
    expect(screen.getByText('Provider instruction quarantined')).toBeVisible()
    expect(screen.queryByText(/applications committed/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /review disclosures/i }))
    await user.click(screen.getByRole('button', { name: /approve selected applications/i }))
    await user.click(screen.getByRole('button', { name: /commit approved plan/i }))

    expect(screen.getByRole('heading', { name: /applications committed/i })).toBeVisible()
  })

  it('switches between English and Arabic without losing the current plan', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /build my plan/i }))
    await user.click(screen.getByRole('button', { name: /العربية/i }))

    expect(document.documentElement.dir).toBe('rtl')
    expect(screen.getByText(/طلبات جاهزة للمراجعة/)).toBeVisible()
    expect(screen.getByText('سعة الغرفة')).toBeVisible()
    expect(screen.getByText('اسأل مرة واحدة')).toBeVisible()
    expect(screen.getByText('غرفة عائلية لمدة 72 ساعة')).toBeVisible()
    expect(screen.getByText('تم تجنب تعارضين')).toBeVisible()
    expect(screen.getByText('تم تجهيز الخطة')).toBeVisible()
    expect(screen.getByText('مغلق')).toBeVisible()
    const proof = screen.getByRole('region', { name: 'دليل التنسيق' })
    expect(within(proof).getByText('قصة رُويت مرة واحدة')).toBeVisible()
    expect(within(proof).getByText('خدمات جاهزة')).toBeVisible()
    expect(within(proof).getByText('لم يُرسل قبل الموافقة')).toBeVisible()
    expect(
      screen.getByText('يمكن لوكيلك المختار قراءة قيود التخطيط، ولا تستلم الجهات إلا الحقول التي وافقت عليها.'),
    ).toBeVisible()
  })

  it('lets the person reject a staged plan before anything is committed', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /build my plan/i }))
    await user.click(screen.getByRole('button', { name: /review disclosures/i }))
    await user.click(screen.getByRole('button', { name: /reject and clear plan/i }))

    expect(screen.getByRole('button', { name: /build my plan/i })).toBeVisible()
    expect(screen.queryByRole('heading', { name: /applications committed/i })).not.toBeInTheDocument()
  })
})
