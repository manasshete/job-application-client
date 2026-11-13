import http from 'node:http'
import net from 'node:net'
import type { AddressInfo } from 'node:net'
import { chromium as playwright, type Browser, type Page } from 'playwright-core'
import { BLOCKED_STATUSES, JobPageError, MAX_BYTES } from '@/lib/job-page'
import { resolvePublicAddress } from '@/lib/ssrf'

const NAVIGATION_TIMEOUT_MS = 15000
const RENDER_TIMEOUT_MS = 8000
const POLL_MS = 250
/** Visible characters that mean a posting has rendered, rather than a loading screen. */
const RENDERED_CHARS = 500
const ALLOWED_PORTS = new Set(['80', '443'])
const SKIPPED_RESOURCES = new Set(['image', 'media', 'font'])

/**
 * Local proxy that every browser connection goes through. It connects only to
 * IPs it has checked itself, so redirects, subresources, iframes and WebSockets
 * started by an untrusted page can't reach internal addresses such as cloud
 * metadata. Playwright's own request interception can't do this: it doesn't see
 * redirects, and the browser would do its own second DNS lookup.
 */
export async function startFilteringProxy() {
  const sockets = new Set<net.Socket>()
  const track = (socket: net.Socket) => {
    sockets.add(socket)
    socket.on('close', () => sockets.delete(socket))
    socket.on('error', () => socket.destroy())
    return socket
  }

  const server = http.createServer(async (req, res) => {
    const refuse = () => {
      res.writeHead(403)
      res.end()
    }
    let target: URL
    try {
      target = new URL(req.url ?? '')
    } catch {
      return refuse()
    }
    const port = target.port || '80'
    const address = target.protocol === 'http:' && ALLOWED_PORTS.has(port) ? await resolvePublicAddress(target.href) : null
    if (!address) return refuse()

    const headers = { ...req.headers }
    delete headers['proxy-connection']
    const upstream = http.request(
      { host: address, port, path: target.pathname + target.search, method: req.method, headers },
      (response) => {
        res.writeHead(response.statusCode ?? 502, response.rawHeaders)
        response.pipe(res)
      }
    )
    upstream.on('error', () => res.destroy())
    req.pipe(upstream)
  })

  server.on('connect', async (req, rawClient) => {
    const client = track(rawClient as net.Socket)
    let target: URL
    try {
      target = new URL(`https://${req.url}`)
    } catch {
      return client.destroy()
    }
    const port = target.port || '443'
    const address = ALLOWED_PORTS.has(port) ? await resolvePublicAddress(target.href) : null
    if (!address) return client.end('HTTP/1.1 403 Forbidden\r\n\r\n')

    const upstream = track(net.connect(Number(port), address, () => {
      client.write('HTTP/1.1 200 Connection Established\r\n\r\n')
      upstream.pipe(client)
      client.pipe(upstream)
    }))
    upstream.on('close', () => client.destroy())
    client.on('close', () => upstream.destroy())
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close() {
      for (const socket of sockets) socket.destroy()
      server.close()
      server.closeAllConnections()
    },
  }
}

async function launchBrowser(proxyUrl: string): Promise<Browser> {
  // Without this exclusion Chromium sends loopback straight past the proxy.
  const proxy = { server: proxyUrl, bypass: '<-loopback>' }
  // Stops WebRTC opening UDP connections, which wouldn't go through the proxy.
  const noDirectUdp = '--force-webrtc-ip-handling-policy=disable_non_proxied_udp'

  // @sparticuz/chromium is a Linux binary, so local development uses installed Chrome.
  if (!process.env.VERCEL) return playwright.launch({ channel: 'chrome', headless: true, proxy, args: [noDirectUdp] })

  const { default: serverless } = await import('@sparticuz/chromium')
  const executablePath = await serverless.executablePath()
  const { PATH, HOME, TMPDIR, LD_LIBRARY_PATH, FONTCONFIG_PATH } = process.env
  return playwright.launch({
    executablePath,
    headless: true,
    proxy,
    args: [...serverless.args, noDirectUdp],
    // Keep the app's secrets out of the process that runs untrusted pages.
    env: Object.fromEntries(
      Object.entries({ PATH, HOME, TMPDIR, LD_LIBRARY_PATH, FONTCONFIG_PATH }).filter(
        (entry): entry is [string, string] => entry[1] !== undefined
      )
    ),
  })
}

async function visibleChars(page: Page): Promise<number> {
  const lengths = await Promise.all(
    page.frames().map((frame) => frame.evaluate(() => document.body?.innerText.length ?? 0).catch(() => 0))
  )
  return lengths.reduce((sum, n) => sum + n, 0)
}

/**
 * Server-only. Loads a job posting in a headless browser and returns its HTML
 * once scripts have rendered it, including iframes (careers pages often embed
 * Greenhouse or Lever in one). This is for pages built by JavaScript: sites that
 * refuse automated visitors still refuse here, and we report that rather than
 * trying to get around it.
 */
export async function renderJobPage(url: string, signal?: AbortSignal): Promise<string> {
  const proxy = await startFilteringProxy()
  let browser: Browser | undefined
  const closeBrowser = () => void browser?.close().catch(() => {})
  signal?.addEventListener('abort', closeBrowser, { once: true })
  try {
    browser = await launchBrowser(proxy.url)
    if (signal?.aborted) throw new JobPageError('Cancelled.')

    // Service workers can make requests that context.route() doesn't see.
    const context = await browser.newContext({ serviceWorkers: 'block', acceptDownloads: false })
    await context.route('**/*', (route) =>
      SKIPPED_RESOURCES.has(route.request().resourceType()) ? route.abort() : route.continue()
    )

    const page = await context.newPage()
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS })
    if (!response || BLOCKED_STATUSES.has(response.status()) || response.headers()['cf-mitigated']) {
      throw new JobPageError(`${new URL(page.url()).hostname} blocks automatic reading.`)
    }
    if (!response.ok()) throw new JobPageError('Failed to fetch job posting.')

    const deadline = Date.now() + RENDER_TIMEOUT_MS
    while (Date.now() < deadline && (await visibleChars(page)) < RENDERED_CHARS) {
      await page.waitForTimeout(POLL_MS)
    }

    const frames = await Promise.all(page.frames().map((frame) => frame.content().catch(() => '')))
    const html = frames.join('\n')
    if (Buffer.byteLength(html) > MAX_BYTES) throw new JobPageError('Job posting content too large')
    return html
  } catch (error) {
    if (error instanceof JobPageError) throw error
    if (signal?.aborted) throw new JobPageError('Cancelled.')
    // Includes the browser failing to start, which is our fault rather than the site's.
    console.error('[job-page-browser] Render failed:', error)
    throw new JobPageError('Could not load this job page.')
  } finally {
    signal?.removeEventListener('abort', closeBrowser)
    await browser?.close().catch(() => {})
    proxy.close()
  }
}
