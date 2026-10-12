import NextLink from 'next/link'
import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './link.module.css'
import { useLink } from './use-link'

type LinkProps = {
  href: string
  external?: boolean
  variant?: 'inline' | 'standalone'
  current?: boolean
  className?: string
  children: ReactNode
}

export const Link = ({
  href,
  external = false,
  variant = 'inline',
  current = false,
  className,
  children,
}: LinkProps) => {
  const { rel, target } = useLink(external)
  return (
    <NextLink
      href={href}
      rel={rel}
      target={target}
      aria-current={current ? 'page' : undefined}
      className={cx(styles.root, className)}
      data-variant={variant}
    >
      {children}
    </NextLink>
  )
}
