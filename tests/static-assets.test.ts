import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('public presentation metadata', () => {
  it('publishes a valid crawler policy instead of falling back to the app shell', () => {
    expect(readFileSync('public/robots.txt', 'utf8')).toBe('User-agent: *\nAllow: /\n')
  })

  it('publishes concise agent-facing context with a heading and references', () => {
    const agentContext = readFileSync('public/llms.txt', 'utf8')

    expect(agentContext).toMatch(/^# ONCE/m)
    expect(agentContext).toContain('[WebMCP documentation]')
    expect(agentContext.length).toBeLessThanOrEqual(1_500)
  })

  it('provides complete social preview metadata', () => {
    const html = readFileSync('index.html', 'utf8')

    expect(html).toContain('property="og:title"')
    expect(html).toContain('property="og:description"')
    expect(html).toContain('property="og:type" content="website"')
    expect(html).toContain('property="og:url" content="https://once-story.vercel.app/"')
    expect(html).toContain('name="twitter:card" content="summary_large_image"')
    expect(html).toContain('content="https://once-story.vercel.app/once-preview.png"')
    expect(html).toContain('rel="canonical" href="https://once-story.vercel.app/"')
  })

  it('ships equivalent browser security boundaries for supported hosts', () => {
    const netlifyHeaders = readFileSync('public/_headers', 'utf8')
    const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
      headers: Array<{ headers: Array<{ key: string; value: string }> }>
    }
    const vercelHeaders = new Map(
      vercel.headers.flatMap((rule) => rule.headers.map(({ key, value }) => [key, value])),
    )

    for (const header of [
      'Content-Security-Policy',
      'Cross-Origin-Opener-Policy',
      'Permissions-Policy',
      'Referrer-Policy',
      'X-Content-Type-Options',
    ]) {
      expect(netlifyHeaders).toContain(`${header}:`)
      expect(vercelHeaders.has(header)).toBe(true)
    }
    expect(vercelHeaders.get('Content-Security-Policy')).toContain("default-src 'self'")
    expect(vercelHeaders.get('Content-Security-Policy')).toContain("frame-ancestors 'none'")
  })
})
