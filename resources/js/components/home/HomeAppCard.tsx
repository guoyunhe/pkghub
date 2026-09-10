import type { Data } from '@generated/data'
import { Card, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import styles from './HomeCards.module.css'

function localized(translations: Record<string, string>, language: string) {
  return (
    translations[language] ??
    translations[language.split('-')[0]] ??
    translations.en ??
    Object.values(translations)[0]
  )
}

type HomeAppCardProps = {
  app: Data.App
}

export default function HomeAppCard({ app }: HomeAppCardProps) {
  const { i18n } = useTranslation()

  return (
    <Card
      className={styles.appItem}
      component={Link}
      href={`/apps/${app.id}`}
      padding='md'
      radius='sm'
      withBorder
    >
      {app.icon ? (
        <img alt='' className={styles.icon} src={app.icon.url} />
      ) : (
        <div className={`${styles.icon} ${styles.emptyIcon}`} />
      )}
      <span>
        <Text fw={700}>{localized(app.name, i18n.language)}</Text>
        <Text c='dimmed' size='sm'>
          {localized(app.summary, i18n.language)}
        </Text>
      </span>
    </Card>
  )
}
