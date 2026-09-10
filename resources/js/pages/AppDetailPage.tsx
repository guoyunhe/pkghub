import type { Data } from '@generated/data'
import { Alert, Button, Group, Loader, Pagination, Text, Title } from '@mantine/core'
import { ArrowLeftIcon } from '@phosphor-icons/react/ArrowLeft'
import { ArrowSquareOutIcon } from '@phosphor-icons/react/ArrowSquareOut'
import { PencilSimpleIcon } from '@phosphor-icons/react/PencilSimple'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useRoute } from 'wouter'

import { useAuth } from '../auth'
import { deleteApp, getApp, getAppPackages } from '../services/apps'
import type { Paginated } from '../types/pagination'

import styles from './AppDetailPage.module.css'

function localized(translations: Record<string, string>, language: string) {
  return (
    translations[language] ??
    translations[language.split('-')[0]] ??
    translations.en ??
    Object.values(translations)[0]
  )
}

export default function AppDetailPage() {
  const { i18n } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [, params] = useRoute('/apps/:id')
  const appId = params?.id ? Number(params.id) : undefined
  const [app, setApp] = useState<Data.App | null>(null)
  const [packages, setPackages] = useState<Paginated<Data.Pkg> | null>(null)
  const [packagesPage, setPackagesPage] = useState(1)
  const [packagesLoading, setPackagesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [packagesError, setPackagesError] = useState<string | null>(null)

  useEffect(() => {
    if (!appId) {
      setError('Invalid application ID')
      return
    }
    getApp(appId)
      .then(setApp)
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : 'Unable to load application'),
      )
  }, [appId])

  useEffect(() => {
    if (!appId) return

    setPackagesLoading(true)
    setPackagesError(null)
    getAppPackages(appId, packagesPage)
      .then(setPackages)
      .catch((reason) =>
        setPackagesError(reason instanceof Error ? reason.message : 'Unable to load packages'),
      )
      .finally(() => setPackagesLoading(false))
  }, [appId, packagesPage])

  if (error) {
    return (
      <main className={styles.page}>
        <Alert color='red'>{error}</Alert>
      </main>
    )
  }
  if (!app || !ready) {
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )
  }

  const name = localized(app.name, i18n.language)
  const isAdmin = user?.role === 'admin'

  async function remove() {
    if (!app) return
    if (!window.confirm(`Delete ${name}?`)) return
    try {
      await deleteApp(app.id)
      navigate('/apps')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to delete application')
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Button
          component={Link}
          href='/apps'
          leftSection={<ArrowLeftIcon size={18} />}
          variant='subtle'
        >
          Back to applications
        </Button>
        {isAdmin && (
          <Group gap='xs'>
            <Button
              component={Link}
              href={`/apps/${app.id}/edit`}
              leftSection={<PencilSimpleIcon size={18} />}
              variant='default'
            >
              Edit application
            </Button>
            <Button
              color='red'
              leftSection={<TrashIcon size={18} />}
              variant='subtle'
              onClick={() => void remove()}
            >
              Delete
            </Button>
          </Group>
        )}
      </header>

      <section className={styles.intro}>
        {app.icon ? (
          <img alt='' className={styles.icon} src={app.icon.url} />
        ) : (
          <div className={`${styles.icon} ${styles.emptyIcon}`} />
        )}
        <div>
          <Text className={styles.eyebrow}>Linux application</Text>
          <Title order={1}>{name}</Title>
          <Text c='dimmed' size='lg'>
            {localized(app.summary, i18n.language)}
          </Text>
        </div>
      </section>

      <section className={styles.metadata}>
        <div>
          <Text size='sm' c='dimmed'>
            Version
          </Text>
          <Text>{app.version ?? 'Not specified'}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            License
          </Text>
          <Text>{app.license ?? 'Not specified'}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            AppStream ID
          </Text>
          <Text>{app.appstreamId ?? 'Not specified'}</Text>
        </div>
      </section>

      {(app.appstreamUrl || app.desktopUrl) && (
        <section className={styles.sources}>
          <Title order={2}>Sources</Title>
          <Group gap='xs'>
            {app.appstreamUrl && (
              <Button
                component='a'
                href={app.appstreamUrl}
                rel='noreferrer'
                target='_blank'
                rightSection={<ArrowSquareOutIcon size={18} />}
                variant='default'
              >
                AppStream metadata
              </Button>
            )}
            {app.desktopUrl && (
              <Button
                component='a'
                href={app.desktopUrl}
                rel='noreferrer'
                target='_blank'
                rightSection={<ArrowSquareOutIcon size={18} />}
                variant='default'
              >
                Desktop entry
              </Button>
            )}
          </Group>
        </section>
      )}

      <section className={styles.packages}>
        <Title order={2}>Packages</Title>
        {packagesError && <Alert color='red'>{packagesError}</Alert>}
        {packagesLoading ? (
          <div className={styles.packagesLoading}>
            <Loader color='orange' size='sm' />
          </div>
        ) : packages?.data.length === 0 ? (
          <Text c='dimmed'>No packages available.</Text>
        ) : (
          <>
            <div className={styles.packageList}>
              {packages?.data.map((pkg) => (
                <article className={styles.package} key={pkg.id}>
                  <div>
                    <Title order={3}>{pkg.name}</Title>
                    <div className={styles.packageMeta}>
                      <span>{pkg.type}</span>
                      {pkg.version && <span>{pkg.version}</span>}
                      {pkg.release && <span>{pkg.release}</span>}
                      {pkg.arch && <span>{pkg.arch}</span>}
                    </div>
                    {pkg.installCommand && (
                      <Text className={styles.installCommand} component='code' size='sm'>
                        {pkg.installCommand}
                      </Text>
                    )}
                  </div>
                  {pkg.downloadUrl && (
                    <Button
                      component='a'
                      href={pkg.downloadUrl}
                      rel='noreferrer'
                      target='_blank'
                      rightSection={<ArrowSquareOutIcon size={18} />}
                      variant='default'
                    >
                      Download
                    </Button>
                  )}
                </article>
              ))}
            </div>
            {packages && packages.meta.lastPage > 1 && (
              <Pagination
                className={styles.pagination}
                total={packages.meta.lastPage}
                value={packages.meta.currentPage}
                onChange={setPackagesPage}
              />
            )}
          </>
        )}
      </section>
    </main>
  )
}
