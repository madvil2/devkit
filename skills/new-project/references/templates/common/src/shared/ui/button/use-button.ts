import type { MouseEvent, MouseEventHandler } from 'react'

type UseButtonParams = {
  loading: boolean
  blocked: boolean
  fullWidth: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
}

export const useButton = ({ loading, blocked, fullWidth, onClick }: UseButtonParams) => {
  const inert = loading || blocked
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (inert) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }
  return {
    inert: inert || undefined,
    dataLoading: loading ? '' : undefined,
    dataFull: fullWidth ? '' : undefined,
    handleClick,
  }
}
