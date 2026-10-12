import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './field.module.css'
import { FieldContext } from './field-context'
import { useField } from './use-field'

type FieldProps = {
  label: string
  hint?: string
  error?: string
  requiredMark?: string
  id?: string
  className?: string
  children: ReactNode
}

export const Field = ({
  label,
  hint,
  error,
  requiredMark,
  id,
  className,
  children,
}: FieldProps) => {
  const { control, hintId, errorId, hasHint, hasError, dataInvalid } = useField({
    id,
    hint,
    error,
  })
  return (
    <FieldContext value={control}>
      <div className={cx(styles.root, className)} data-invalid={dataInvalid}>
        <label className={styles.label} htmlFor={control.controlId}>
          {label}
          {requiredMark && <span className={styles.required}>{requiredMark}</span>}
        </label>
        {children}
        {hasHint && (
          <span id={hintId} className={styles.hint}>
            {hint}
          </span>
        )}
        {hasError && (
          <span id={errorId} className={styles.error} role="alert">
            {error}
          </span>
        )}
      </div>
    </FieldContext>
  )
}
