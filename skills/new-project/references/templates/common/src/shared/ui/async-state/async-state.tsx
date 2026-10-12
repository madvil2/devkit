import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import { Button } from '@/shared/ui/button'
import { Text } from '@/shared/ui/text'
import { VisuallyHidden } from '@/shared/ui/visually-hidden'
import styles from './async-state.module.css'
import type { AsyncStatus } from './use-async-state'
import { useAsyncState } from './use-async-state'

type AsyncStateProps = {
  status: AsyncStatus
  isEmpty?: boolean
  skeleton: ReactNode
  empty?: ReactNode
  pendingLabel: string
  errorText: string
  retryLabel: string
  onRetry?: () => void
  className?: string
  children: ReactNode
}

export const AsyncState = ({
  status,
  isEmpty = false,
  skeleton,
  empty,
  pendingLabel,
  errorText,
  retryLabel,
  onRetry,
  className,
  children,
}: AsyncStateProps) => {
  const { showPending, showError, showRetry, showEmpty, showContent, busy } = useAsyncState({
    status,
    isEmpty,
    canRetry: Boolean(onRetry),
  })
  return (
    <div className={cx(styles.root, className)} aria-busy={busy} data-status={status}>
      {showPending && <VisuallyHidden>{pendingLabel}</VisuallyHidden>}
      {showPending && skeleton}
      {showError && (
        <div className={styles.error} role="alert">
          <Text tone="danger">{errorText}</Text>
          {showRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
        </div>
      )}
      {showEmpty && empty}
      {showContent && children}
    </div>
  )
}
