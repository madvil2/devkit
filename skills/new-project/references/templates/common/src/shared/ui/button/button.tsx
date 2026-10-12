import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from '@/shared/lib/cx'
import { Spinner } from '@/shared/ui/spinner'
import styles from './button.module.css'
import { useButton } from './use-button'

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'type'> & {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  blocked?: boolean
  fullWidth?: boolean
  ref?: Ref<HTMLButtonElement>
  children: ReactNode
}

export const Button = ({
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  blocked = false,
  fullWidth = false,
  className,
  onClick,
  children,
  ...rest
}: ButtonProps) => {
  const { inert, dataLoading, dataFull, handleClick } = useButton({
    loading,
    blocked,
    fullWidth,
    onClick,
  })
  return (
    <button
      {...rest}
      type={type}
      className={cx(styles.root, className)}
      data-variant={variant}
      data-size={size}
      data-loading={dataLoading}
      data-full={dataFull}
      aria-disabled={inert}
      aria-busy={loading}
      onClick={handleClick}
    >
      {loading && <Spinner size="sm" />}
      <span className={styles.label}>{children}</span>
    </button>
  )
}
