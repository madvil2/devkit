import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './card.module.css'

type CardProps = {
  as?: 'div' | 'article' | 'section' | 'li'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  tone?: 'default' | 'subtle' | 'raised'
  className?: string
  children: ReactNode
}

export const Card = ({
  as: Tag = 'div',
  padding = 'md',
  tone = 'default',
  className,
  children,
}: CardProps) => (
  <Tag className={cx(styles.root, className)} data-padding={padding} data-tone={tone}>
    {children}
  </Tag>
)
