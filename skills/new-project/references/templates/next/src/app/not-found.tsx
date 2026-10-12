'use client'

import { Heading } from '@/shared/ui/heading'
import { Link } from '@/shared/ui/link'
import { Stack } from '@/shared/ui/stack'
import { useNotFoundView } from './use-not-found-view'

const NotFound = () => {
  const { t, homeHref } = useNotFoundView()
  return (
    <main>
      <Stack gap="md">
        <Heading level={1}>{t.errors.notFound}</Heading>
        <Link href={homeHref}>{t.common.appName}</Link>
      </Stack>
    </main>
  )
}

export default NotFound
