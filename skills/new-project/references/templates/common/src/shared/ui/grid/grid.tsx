import type { ReactNode } from 'react'
import type { SpaceToken } from '@/shared/config'
import { cx } from '@/shared/lib/cx'
import styles from './grid.module.css'

type GridProps = {
  as?: 'div' | 'section' | 'ul' | 'ol'
  gap?: SpaceToken
  min?: 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
}

export const Grid = ({
  as: Tag = 'div',
  gap = 'md',
  min = 'md',
  className,
  children,
}: GridProps) => (
  <Tag className={cx(styles.root, className)} data-gap={gap} data-min={min}>
    {children}
  </Tag>
)
