import type { InputHTMLAttributes, Ref } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './input.module.css'
import { useInput } from './use-input'

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  size?: 'sm' | 'md' | 'lg'
  ref?: Ref<HTMLInputElement>
}

export const Input = ({ size = 'md', id, className, ...rest }: InputProps) => {
  const { controlId, describedBy, invalid } = useInput({ id })
  return (
    <input
      {...rest}
      id={controlId}
      aria-describedby={describedBy}
      aria-invalid={invalid}
      className={cx(styles.root, className)}
      data-size={size}
    />
  )
}
