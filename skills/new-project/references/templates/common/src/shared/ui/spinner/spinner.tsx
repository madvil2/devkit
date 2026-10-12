import { cx } from '@/shared/lib/cx'
import styles from './spinner.module.css'

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Spinner = ({ size = 'md', className }: SpinnerProps) => (
  <span className={cx(styles.root, className)} data-size={size} aria-hidden="true" />
)
