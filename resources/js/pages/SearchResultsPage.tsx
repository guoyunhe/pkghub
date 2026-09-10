import type { Data } from '@generated/data'
import { Alert, Loader, Pagination, Text, Title } from '@mantine/core'
import { ArrowRightIcon } from '@phosphor-icons/react/ArrowRight'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useSearchParams } from 'wouter'

import { getApps } from '../services/apps'
import type { Paginated } from '../types/pagination'

import styles from './AppsPage.module.css'

function localized(translations: Record<string, string>, language: string) {
  return (
    translations[language] ??
    translations[language.split('-')[0]] ??
    translations.en ??
    Object.values(translations)[0]
  )
}

export default function SearchResultsPage() {
  const { t, i18n } = useTranslation()
  const [, navigate] = useLocation()
  const [searchParams] = useSearchParams()
  const [result, setResult] = useState<Paginated<Data.App> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const query = searchParams.get('q')?.trim() ?? ''
  const page = Number(searchParams.get('page') ?? 1) || 1

  useEffect(() => {
    let active = true

    async function loadResults() {
      try {
        setLoading(true)
        setError(null)
        const results = await getApps(query, page)
        if (active) setResult(results)
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : t('search.loadError'))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadResults()
    return () => {
      active = false
    }
  }, [page, query])

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{t('search.eyebrow')}</Text>
          <Title order={1}>{t('search.title')}</Title>
          <Text c='dimmed'>{t('search.resultsFor', { query })}</Text>
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
      ) : result?.data.length === 0 ? (
        <Text c='dimmed'>{t('search.notFound')}</Text>
      ) : (
        <>
          <section className={styles.grid}>
            {result?.data.map((app: Data.App) => (
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
                  <div className={styles.metadata}>
                    {app.version && <span>{app.version}</span>}
                    {app.license && <span>{app.license}</span>}
                  </div>
                </div>
              </article>
            ))}
          </section>
          {result && result.meta.lastPage > 1 && (
            <Pagination
              className={styles.pagination}
              total={result.meta.lastPage}
              value={result.meta.currentPage}
              onChange={(nextPage) => {
                const params = new URLSearchParams({ q: query })
                if (nextPage > 1) params.set('page', String(nextPage))
                navigate(`/search?${params}`)
              }}
            />
          )}
        </>
      )}
    </main>
  )
}
