import type { ReactNode } from 'react'
import styles from './visually-hidden.module.css'

type VisuallyHiddenProps = {
  id?: string
  children: ReactNode
}

export const VisuallyHidden = ({ id, children }: VisuallyHiddenProps) => (
  <span id={id} className={styles.root}>
    {children}
  </span>
)
