import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './link.module.css'

type ExternalLinkProps = {
  href: string
  tone?: 'accent' | 'inherit' | 'muted'
  className?: string
  children: ReactNode
}

export const ExternalLink = ({ href, tone = 'accent', className, children }: ExternalLinkProps) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={cx(styles.root, className)}
    data-tone={tone}
  >
    {children}
  </a>
)
