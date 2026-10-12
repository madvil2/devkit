import type { ReactNode } from 'react'
import type { SpaceToken } from '@/shared/config'
import { cx } from '@/shared/lib/cx'
import styles from './row.module.css'

type RowProps = {
  as?: 'div' | 'section' | 'ul' | 'ol' | 'header' | 'footer' | 'nav'
  gap?: SpaceToken
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between'
  wrap?: boolean
  className?: string
  children: ReactNode
}

export const Row = ({
  as: Tag = 'div',
  gap = 'sm',
  align = 'center',
  justify = 'start',
  wrap = false,
  className,
  children,
}: RowProps) => (
  <Tag
    className={cx(styles.root, className)}
    data-gap={gap}
    data-align={align}
    data-justify={justify}
    data-wrap={wrap}
  >
    {children}
  </Tag>
)
