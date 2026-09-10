import type { Data } from '@generated/data'
import { Alert, Button, Group, Loader, Pagination, Text, Title } from '@mantine/core'
import { DownloadSimpleIcon } from '@phosphor-icons/react/DownloadSimple'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import { searchPackages } from '../services/apps'
import type { Paginated } from '../types/pagination'

import styles from './AppsPage.module.css'

const packageTypesWithIcons = new Set(['rpm', 'deb', 'appimage'])

export default function PkgsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Paginated<Data.Pkg> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    searchPackages('', page)
      .then((res) => {
        if (active) setResult(res)
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : t('packages.loadError'))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [page, t])

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{t('packages.eyebrow')}</Text>
          <Title order={1}>{t('packages.title')}</Title>
          <Text c='dimmed'>{t('packages.subtitle')}</Text>
        </div>
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
      ) : result && result.data.length > 0 ? (
        <>
          <section className={styles.grid}>
            {result.data.map((pkg) => (
              <article className={styles.pkgItem} key={pkg.id}>
                {packageTypesWithIcons.has(pkg.type) ? (
                  <img alt='' className={styles.pkgTypeIcon} src={`/packages/${pkg.type}.svg`} />
                ) : (
                  <div className={styles.pkgTypeIcon} />
                )}
                <div className={styles.copy}>
                  <Title order={3}>
                    {pkg.app ? (
                      <Link className={styles.link} href={`/apps/${pkg.app.id}`}>
                        {pkg.name}
                      </Link>
                    ) : (
                      pkg.name
                    )}
                  </Title>
                  <div className={styles.meta}>
                    <span>{pkg.type}</span>
                    {pkg.version && <span>{pkg.version}</span>}
                    {pkg.release && <span>{pkg.release}</span>}
                    {pkg.arch && <span>{pkg.arch}</span>}
                  </div>
                </div>
                <Group>
                  {pkg.downloadUrl && (
                    <Button
                      component='a'
                      href={pkg.downloadUrl}
                      leftSection={<DownloadSimpleIcon size={16} />}
                      size='xs'
                      variant='default'
                    >
                      {t('common.download')}
                    </Button>
                  )}
                </Group>
              </article>
            ))}
          </section>
          {result.meta.lastPage > 1 && (
            <Pagination
              className={styles.pagination}
              total={result.meta.lastPage}
              value={result.meta.currentPage}
              onChange={setPage}
            />
          )}
        </>
      ) : (
        <Text c='dimmed'>{t('packages.notFound')}</Text>
      )}
    </main>
  )
}
