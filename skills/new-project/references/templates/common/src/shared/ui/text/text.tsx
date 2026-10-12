import type { ReactNode } from 'react'
import type { TextSize, Tone } from '@/shared/config'
import { cx } from '@/shared/lib/cx'
import styles from './text.module.css'

export type TextProps = {
  as?: 'span' | 'p' | 'div' | 'strong' | 'small'
  size?: TextSize
  tone?: Tone
  weight?: 'regular' | 'medium' | 'semibold' | 'bold'
  align?: 'start' | 'center' | 'end'
  id?: string
  className?: string
  children: ReactNode
}

export const Text = ({
  as: Tag = 'span',
  size = 'md',
  tone = 'default',
  weight = 'regular',
  align = 'start',
  id,
  className,
  children,
}: TextProps) => (
  <Tag
    id={id}
    className={cx(styles.root, className)}
    data-size={size}
    data-tone={tone}
    data-weight={weight}
    data-align={align}
  >
    {children}
  </Tag>
)
