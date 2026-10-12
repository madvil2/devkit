import type { ReactNode } from 'react'
import type { TextSize } from '@/shared/config'
import { cx } from '@/shared/lib/cx'
import styles from './heading.module.css'
import type { HeadingLevel } from './use-heading'
import { useHeading } from './use-heading'

type HeadingProps = {
  level: HeadingLevel
  size?: TextSize
  align?: 'start' | 'center' | 'end'
  id?: string
  className?: string
  children: ReactNode
}

export const Heading = ({
  level,
  size,
  align = 'start',
  id,
  className,
  children,
}: HeadingProps) => {
  const { Tag, resolvedSize } = useHeading({ level, size })
  return (
    <Tag id={id} className={cx(styles.root, className)} data-size={resolvedSize} data-align={align}>
      {children}
    </Tag>
  )
}
