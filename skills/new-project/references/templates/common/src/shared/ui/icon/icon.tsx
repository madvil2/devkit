import { cx } from '@/shared/lib/cx'
import styles from './icon.module.css'
import type { IconName } from './icons'
import { useIcon } from './use-icon'

type IconProps = {
  name: IconName
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

export const Icon = ({ name, size = 'md', label, className }: IconProps) => {
  const { Glyph, hidden, role } = useIcon({ name, label })
  return (
    <Glyph
      className={cx(styles.root, className)}
      data-size={size}
      aria-hidden={hidden}
      aria-label={label}
      role={role}
      focusable="false"
    />
  )
}
