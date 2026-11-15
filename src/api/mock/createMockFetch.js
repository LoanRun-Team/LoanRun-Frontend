// Endpoint handlers will be registered only after the Notion specification is accessible.
// This transport returns native Response objects, so mock and real calls use the same parser.
export function createMockFetch({ handlers = [], delayMs = 150 } = {}) {
  return async function mockFetch(input, init = {}) {
    const url = new URL(typeof input === 'string' ? input : input.url, 'http://mock.invalid')
    const method = (init.method || 'GET').toUpperCase()
    const handler = handlers.find(item => item.method.toUpperCase() === method && item.path === url.pathname)
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
