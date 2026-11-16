import { useEffect, useState } from 'react'

// fn(signal) 을 deps 가 바뀔 때마다 호출한다. fn 이 null 을 돌려주면 요청 없이 ready(data=null).
// 이전 요청은 abort 되고, status: 'loading' | 'ready' | 'error'.
export function useRequest(fn, deps) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- deps 는 호출하는 쪽이 요청 조건으로 직접 넘긴다
  useEffect(() => {
    const controller = new AbortController()
    setState(s => ({ ...s, status: 'loading', error: null }))
    Promise.resolve(fn(controller.signal)).then(
      data => { if (!controller.signal.aborted) setState({ status: 'ready', data, error: null }) },
      error => { if (!controller.signal.aborted) setState({ status: 'error', data: null, error }) },
    )
    return () => controller.abort()
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- deps 는 호출하는 쪽이 요청 조건으로 직접 넘긴다
  }, deps)
  return state
}
