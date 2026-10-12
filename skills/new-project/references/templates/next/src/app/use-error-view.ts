import { useEffect } from 'react'
import { useT } from '@/shared/i18n'

export const useErrorView = (error: Error & { digest?: string }) => {
  const t = useT()
  useEffect(() => {
    console.error(error)
  }, [error])
  return { t }
}
