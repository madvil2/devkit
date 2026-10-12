import type { ReactNode } from 'react'
import type { SpaceToken } from '@/shared/config'
import { cx } from '@/shared/lib/cx'
import styles from './stack.module.css'

type StackProps = {
  as?: 'div' | 'section' | 'ul' | 'ol' | 'header' | 'footer' | 'main' | 'nav' | 'article' | 'aside'
  gap?: SpaceToken
  align?: 'start' | 'center' | 'end' | 'stretch'
  className?: string
  children: ReactNode
}

export const Stack = ({
  as: Tag = 'div',
  gap = 'md',
  align = 'stretch',
  className,
  children,
}: StackProps) => (
  <Tag className={cx(styles.root, className)} data-gap={gap} data-align={align}>
    {children}
  </Tag>
)
