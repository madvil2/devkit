import type { FormEvent, FormHTMLAttributes, ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './form.module.css'
import { useForm } from './use-form'

type FormProps = Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'noValidate'> & {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  children: ReactNode
}

export const Form = ({ onSubmit, className, children, ...rest }: FormProps) => {
  const { handleSubmit } = useForm({ onSubmit })
  return (
    <form {...rest} noValidate className={cx(styles.root, className)} onSubmit={handleSubmit}>
      {children}
    </form>
  )
}
