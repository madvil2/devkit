import type { AnchorHTMLAttributes, Ref } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './link.module.css'

export type LinkAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  tone?: 'accent' | 'inherit' | 'muted'
  ref?: Ref<HTMLAnchorElement>
}

export const LinkAnchor = ({ tone = 'accent', className, ...rest }: LinkAnchorProps) => (
  <a {...rest} className={cx(styles.root, className)} data-tone={tone} />
)
