'use client'

import { Button } from '@/shared/ui/button'
import { Heading } from '@/shared/ui/heading'
import { Stack } from '@/shared/ui/stack'
import { useErrorView } from './use-error-view'

type ErrorPageProps = {
  error: Error & { digest?: string }
  retry: () => void
}

const ErrorPage = ({ error, retry }: ErrorPageProps) => {
  const { t } = useErrorView(error)
  return (
    <main>
      <Stack gap="md">
        <Heading level={1}>{t.errors.generic}</Heading>
        <Button onClick={retry}>{t.common.retry}</Button>
      </Stack>
    </main>
  )
}

export default ErrorPage
