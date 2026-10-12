import type { FormEvent } from 'react'

type UseFormParams = {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export const useForm = ({ onSubmit }: UseFormParams) => ({
  handleSubmit: (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(event)
  },
})
