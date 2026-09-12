import type { Data } from '@generated/data'
import { Alert, Badge, Button, Group, Loader, Pagination, Tabs, Text, Title } from '@mantine/core'
import { ArrowRightIcon } from '@phosphor-icons/react/ArrowRight'
import { DownloadSimpleIcon } from '@phosphor-icons/react/DownloadSimple'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'wouter'
import { Link } from 'wouter'

import CategoryBadges from '../components/CategoryBadges'
import CategoryFilter from '../components/CategoryFilter'
import PkgFilters, { useStoredPkgFilters } from '../components/PkgFilters'
import { getApps, searchPackages } from '../services/apps'
import type { Paginated } from '../types/pagination'
import { localized } from '../utils/appstream'

import styles from './AppsPage.module.css'

const packageTypesWithIcons = new Set(['rpm', 'deb', 'appimage'])

type SearchTab = 'apps' | 'packages'

function CountBadge({ count, loading }: { count?: number; loading: boolean }) {
  if (loading) {
    return <Loader color='orange' size={10} />
  }
  return (
    <Badge radius='sm' size='xs' variant='light'>
      {count ?? 0}
    </Badge>
  )
}

export default function SearchResultsPage() {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() ?? ''

  const [activeTab, setActiveTab] = useState<SearchTab>('apps')
  const [appsPage, setAppsPage] = useState(1)
  const [appsCategory, setAppsCategory] = useState<string | null>(null)
  const [pkgsPage, setPkgsPage] = useState(1)

  const [appsResult, setAppsResult] = useState<Paginated<Data.App> | null>(null)
  const [appsLoading, setAppsLoading] = useState(true)
  const [appsError, setAppsError] = useState<string | null>(null)

  const [pkgsResult, setPkgsResult] = useState<Paginated<Data.Pkg> | null>(null)
  const [pkgsLoading, setPkgsLoading] = useState(true)
  const [pkgsError, setPkgsError] = useState<string | null>(null)
  const [filters, setFilters] = useStoredPkgFilters()

  useEffect(() => {
    setAppsPage(1)
    setPkgsPage(1)
  }, [query])

  useEffect(() => {
    setPkgsPage(1)
  }, [filters])

  useEffect(() => {
    setAppsPage(1)
  }, [appsCategory])

  useEffect(() => {
    let active = true
    setAppsLoading(true)
    setAppsError(null)
    getApps(query, appsPage, 12, appsCategory)
      .then((result) => {
        if (active) setAppsResult(result)
      })
      .catch((reason) => {
        if (active) {
          setAppsError(reason instanceof Error ? reason.message : t('search.loadError'))
        }
      })
      .finally(() => {
        if (active) setAppsLoading(false)
      })
    return () => {
      active = false
    }
  }, [appsCategory, appsPage, query, t])

  useEffect(() => {
    let active = true
    setPkgsLoading(true)
    setPkgsError(null)
    searchPackages(query, pkgsPage, filters)
      .then((result) => {
        if (active) setPkgsResult(result)
      })
      .catch((reason) => {
        if (active) {
          setPkgsError(reason instanceof Error ? reason.message : t('search.loadPackagesError'))
        }
      })
      .finally(() => {
        if (active) setPkgsLoading(false)
      })
    return () => {
      active = false
    }
  }, [filters, pkgsPage, query, t])

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{t('search.eyebrow')}</Text>
          <Title order={1}>{t('search.title')}</Title>
          <Text c='dimmed'>{t('search.resultsFor', { query })}</Text>
        </div>
      </header>

      <Tabs mb='lg' value={activeTab} onChange={(value) => setActiveTab(value as SearchTab)}>
        <Tabs.List>
          <Tabs.Tab
            value='apps'
            rightSection={<CountBadge count={appsResult?.meta.total} loading={appsLoading} />}
          >
            {t('search.tabs.apps')}
          </Tabs.Tab>
          <Tabs.Tab
            value='packages'
            rightSection={<CountBadge count={pkgsResult?.meta.total} loading={pkgsLoading} />}
          >
            {t('search.tabs.packages')}
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {activeTab === 'packages' && <PkgFilters onChange={setFilters} value={filters} />}

      {activeTab === 'apps' && <CategoryFilter onChange={setAppsCategory} value={appsCategory} />}

      {activeTab === 'apps' &&
        (appsError ? (
          <Alert color='red'>{appsError}</Alert>
        ) : appsLoading ? (
          <div className={styles.loading}>
            <Loader color='orange' />
          </div>
        ) : appsResult && appsResult.data.length > 0 ? (
          <>
            <section className={styles.grid}>
              {appsResult.data.map((app) => (
                <article className={styles.item} key={app.id}>
                  {app.icon ? (
                    <img alt='' className={styles.icon} src={app.icon.url} />
                  ) : (
                    <div className={`${styles.icon} ${styles.emptyIcon}`} />
                  )}
                  <div className={styles.copy}>
                    <Title order={3}>
                      <Link className={styles.link} href={`/apps/${app.id}`}>
                        {localized(app.name, i18n.language)}{' '}
                        <ArrowRightIcon size={18} weight='bold' />
                      </Link>
                    </Title>
                    <Text c='dimmed'>{localized(app.summary, i18n.language)}</Text>
                    <CategoryBadges categories={app.categories} />
                    <div className={styles.meta}>
                      {app.version && <span>{app.version}</span>}
                      {app.license && <span>{app.license}</span>}
                    </div>
                  </div>
                </article>
              ))}
            </section>
            {appsResult.meta.lastPage > 1 && (
              <Pagination
                className={styles.pagination}
                total={appsResult.meta.lastPage}
                value={appsResult.meta.currentPage}
                onChange={setAppsPage}
              />
            )}
          </>
        ) : (
          <Text c='dimmed'>{t('search.notFound')}</Text>
        ))}

      {activeTab === 'packages' &&
        (pkgsError ? (
          <Alert color='red'>{pkgsError}</Alert>
        ) : pkgsLoading ? (
          <div className={styles.loading}>
            <Loader color='orange' />
          </div>
        ) : pkgsResult && pkgsResult.data.length > 0 ? (
          <>
            <section className={styles.grid}>
              {pkgsResult.data.map((pkg) => (
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
            {pkgsResult.meta.lastPage > 1 && (
              <Pagination
                className={styles.pagination}
                total={pkgsResult.meta.lastPage}
                value={pkgsResult.meta.currentPage}
                onChange={setPkgsPage}
              />
            )}
          </>
        ) : (
          <Text c='dimmed'>{t('search.packagesNotFound')}</Text>
        ))}
    </main>
  )
}
