import { useId } from 'react'
import type { FieldControl } from './field-context'

type UseFieldParams = {
  id?: string
  hint?: string
  error?: string
}

export const useField = ({ id, hint, error }: UseFieldParams) => {
  const generated = useId()
  const controlId = id ?? `${generated}-control`
  const hintId = `${controlId}-hint`
  const errorId = `${controlId}-error`
  const hasHint = Boolean(hint)
  const hasError = Boolean(error)
  const describedBy = [hasHint ? hintId : null, hasError ? errorId : null].filter(Boolean).join(' ')
  const control: FieldControl = {
    controlId,
    describedBy: describedBy || undefined,
    invalid: hasError,
  }
  return {
    control,
    hintId,
    errorId,
    hasHint,
    hasError,
    dataInvalid: hasError ? '' : undefined,
  }
}
