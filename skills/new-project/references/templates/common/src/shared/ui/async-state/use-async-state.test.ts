import { describe, expect, it } from 'vitest'
import { useAsyncState } from './use-async-state'

describe('useAsyncState', () => {
  it('never shows the empty state while pending', () => {
    const view = useAsyncState({ status: 'pending', isEmpty: true, canRetry: true })
    expect(view.showEmpty).toBe(false)
    expect(view.showPending).toBe(true)
  })

  it('shows the empty state only after success', () => {
    expect(useAsyncState({ status: 'success', isEmpty: true, canRetry: false }).showEmpty).toBe(
      true,
    )
    expect(useAsyncState({ status: 'error', isEmpty: true, canRetry: false }).showEmpty).toBe(false)
  })

  it('offers retry only with a handler', () => {
    expect(useAsyncState({ status: 'error', isEmpty: false, canRetry: false }).showRetry).toBe(
      false,
    )
    expect(useAsyncState({ status: 'error', isEmpty: false, canRetry: true }).showRetry).toBe(true)
  })
})
