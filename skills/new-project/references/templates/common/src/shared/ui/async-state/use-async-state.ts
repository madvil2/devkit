export type AsyncStatus = 'pending' | 'error' | 'success'

type UseAsyncStateParams = {
  status: AsyncStatus
  isEmpty: boolean
  canRetry: boolean
}

export const useAsyncState = ({ status, isEmpty, canRetry }: UseAsyncStateParams) => ({
  showPending: status === 'pending',
  showError: status === 'error',
  showRetry: status === 'error' && canRetry,
  showEmpty: status === 'success' && isEmpty,
  showContent: status === 'success' && !isEmpty,
  busy: status === 'pending',
})
