import type { Data } from '@generated/data'
import { Alert, Anchor, Card, Loader, Text, Title } from '@mantine/core'
import { ArrowRightIcon } from '@phosphor-icons/react/ArrowRight'
import { useEffect, useState } from 'react'
import { Link } from 'wouter'

import { getApps, getDistros, type Distro } from '../services/apps'

import styles from './HomePage.module.css'

function localized(translations: Record<string, string>, language: string) {
  return (
    translations[language] ??
    translations[language.split('-')[0]] ??
    translations.en ??
    Object.values(translations)[0]
  )
}

export default function HomePage() {
  const [apps, setApps] = useState<Data.App[]>([])
  const [distros, setDistros] = useState<Distro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getApps('', 1), getDistros()])
      .then(([appPage, distroList]) => {
        setApps(appPage.data.slice(0, 6))
        setDistros(distroList)
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : 'Unable to load catalog'),
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className={styles.page}>
      {error && (
        <Alert color='red' mb='lg'>
          {error}
        </Alert>
      )}
      {loading ? (
        <div className={styles.loading}>
          <Loader color='orange' />
        </div>
      ) : (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <Text className={styles.eyebrow}>Linux catalog</Text>
                <Title order={1}>Applications</Title>
              </div>
              <Anchor component={Link} href='/apps'>
                View all <ArrowRightIcon size={16} />
              </Anchor>
            </div>
            <div className={styles.appGrid}>
              {apps.map((app) => (
                <Card
                  className={styles.appItem}
                  component={Link}
                  href={`/apps/${app.id}`}
                  key={app.id}
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
                    <Text fw={700}>{localized(app.name, 'en')}</Text>
                    <Text c='dimmed' size='sm'>
                      {localized(app.summary, 'en')}
                    </Text>
                  </span>
                </Card>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <Text className={styles.eyebrow}>Operating systems</Text>
                <Title order={2}>Distributions</Title>
              </div>
            </div>
            <div className={styles.distroGrid}>
              {distros.map((distro) => (
                <Card
                  className={styles.distroItem}
                  key={distro.id}
                  padding='md'
                  radius='sm'
                  withBorder
                >
                  <div className={styles.distroHeading}>
                    <img
                      alt=''
                      className={styles.distroIcon}
                      src={`/distros/${encodeURIComponent(distro.name)}.svg`}
                    />
                    <Text className={styles.distroName} fw={700}>
                      {distro.name}
                    </Text>
                    <Text className={styles.distroVersion} fw={700}>
                      {distro.version ?? '∞'}
                    </Text>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}
