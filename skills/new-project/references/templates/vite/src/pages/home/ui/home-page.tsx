import { Heading } from '@/shared/ui/heading'
import { Stack } from '@/shared/ui/stack'
import { Text } from '@/shared/ui/text'
import { useHomePage } from '../model/use-home-page'
import styles from './home-page.module.css'

export const HomePage = () => {
  const { t } = useHomePage()
  return (
    <main className={styles.root}>
      <Stack gap="sm">
        <Heading level={1}>{t.home.title}</Heading>
        <Text tone="muted">{t.home.lead}</Text>
      </Stack>
    </main>
  )
}
