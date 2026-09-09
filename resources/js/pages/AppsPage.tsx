import type { Data } from '@generated/data'
import { Alert, Button, Group, Loader, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'wouter'

import { useAuth } from '../auth'
import { deleteApp, getApps } from '../services/apps'

import styles from './AppsPage.module.css'

function localized(translations: Record<string, string>, language: string) {
  return (
    translations[language] ??
    translations[language.split('-')[0]] ??
    translations.en ??
    Object.values(translations)[0]
  )
}

export default function AppsPage() {
  const { i18n } = useTranslation()
  const { ready, user, logout } = useAuth()
  const [, navigate] = useLocation()
  const [apps, setApps] = useState<Data.App[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadApps() {
    try {
      setLoading(true)
      setApps(await getApps())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadApps()
  }, [])

  async function remove(app: Data.App) {
    if (!window.confirm(`Delete ${localized(app.name, i18n.language)}?`)) return
    try {
      await deleteApp(app.id)
      setApps((current) => current.filter((item) => item.id !== app.id))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to delete application')
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>Linux catalog</Text>
          <Title order={1}>Applications</Title>
          <Text c='dimmed'>Discover software metadata, launchers and upstream sources.</Text>
        </div>
        <Group gap='xs'>
          {ready && user ? (
            <>
              <Button component={Link} href='/apps/new'>
                Add application
              </Button>
              <Button variant='default' onClick={() => void handleLogout()}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button component={Link} href='/login' variant='default'>
                Sign in
              </Button>
              <Button component={Link} href='/register'>
                Create account
              </Button>
            </>
          )}
        </Group>
      </header>

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
        <section className={styles.grid}>
          {apps.map((app) => (
            <article className={styles.item} key={app.id}>
              {app.icon ? (
                <img alt='' className={styles.icon} src={app.icon.url} />
              ) : (
                <div className={`${styles.icon} ${styles.emptyIcon}`} />
              )}
              <div className={styles.copy}>
                <Title order={3}>
                  <Link className={styles.link} href={`/apps/${app.id}`}>
                    {localized(app.name, i18n.language)}
                  </Link>
                </Title>
                <Text c='dimmed'>{localized(app.summary, i18n.language)}</Text>
                <div className={styles.metadata}>
                  {app.version && <span>{app.version}</span>}
                  {app.license && <span>{app.license}</span>}
                </div>
              </div>
              {user && (
                <Group gap='xs' className={styles.actions}>
                  <Button
                    component={Link}
                    href={`/apps/${app.id}/edit`}
                    variant='subtle'
                    size='compact-sm'
                  >
                    Edit
                  </Button>
                  <Button
                    color='red'
                    variant='subtle'
                    size='compact-sm'
                    onClick={() => void remove(app)}
                  >
                    Delete
                  </Button>
                </Group>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
