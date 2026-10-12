import { cx } from '@/shared/lib/cx'
import styles from './skeleton.module.css'

type SkeletonProps = {
  shape?: 'text' | 'block' | 'circle'
  className?: string
}

export const Skeleton = ({ shape = 'text', className }: SkeletonProps) => (
  <span className={cx(styles.root, className)} data-shape={shape} aria-hidden="true" />
)
