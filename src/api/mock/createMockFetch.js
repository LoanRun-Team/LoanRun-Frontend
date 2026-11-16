// Endpoint handlers will be registered only after the Notion specification is accessible.
// This transport returns native Response objects, so mock and real calls use the same parser.
// 핸들러 경로는 명세 표기 그대로 `/api/loans/{loan_id}/` 처럼 쓸 수 있고, 값은 respond({ params }) 로 받는다.
function matchPath(pattern, pathname) {
  const names = []
  const source = pattern.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{(\w+)\}/g, (_, name) => { names.push(name); return '([^/]+)' })
  const match = pathname.match(new RegExp(`^${source}$`))
  return match ? Object.fromEntries(names.map((name, i) => [name, decodeURIComponent(match[i + 1])])) : null
}

export function createMockFetch({ handlers = [], delayMs = 150 } = {}) {
  return async function mockFetch(input, init = {}) {
    const url = new URL(typeof input === 'string' ? input : input.url, 'http://mock.invalid')
    const method = (init.method || 'GET').toUpperCase()
    let params = {}
    const handler = handlers.find(item => {
      if (item.method.toUpperCase() !== method) return false
      const matched = matchPath(item.path, url.pathname)
      if (matched) params = matched
      return Boolean(matched)
    })
    if (!handler) throw new Error('No specification-backed mock handler is registered for ' + method + ' ' + url.pathname)
    const signal = init.signal
    signal?.throwIfAborted()
    await new Promise((resolve, reject) => {
      const finish = () => { signal?.removeEventListener('abort', abort); resolve() }
      const timer = setTimeout(finish, Math.max(0, delayMs))
      function abort() {
        clearTimeout(timer)
        signal?.removeEventListener('abort', abort)
        reject(signal.reason || new DOMException('Aborted', 'AbortError'))
      }
      signal?.addEventListener('abort', abort, { once: true })
    })
    signal?.throwIfAborted()
    const result = await handler.respond({
      url,
      params,
      query: url.searchParams,
      headers: new Headers(init.headers),
      body: init.body ? JSON.parse(init.body) : undefined,
      signal,
    })
    signal?.throwIfAborted()
    return new Response(JSON.stringify(result.body), {
      status: result.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
