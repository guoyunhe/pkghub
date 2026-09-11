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
import FavoriteButton from '../components/FavoriteButton'
import ReviewForm from '../components/ReviewForm'
import ReviewList from '../components/ReviewList'
import { deleteApp, getApp, getAppPackages } from '../services/apps'
import { deleteReview, getAppReviews } from '../services/reviews'
import type { Paginated } from '../types/pagination'

import styles from './AppDetailPage.module.css'

const packageTypesWithIcons = new Set(['rpm', 'deb', 'appimage'])

function localized(translations: Record<string, string>, language: string) {
  return (
    translations[language] ??
    translations[language.split('-')[0]] ??
    translations.en ??
    Object.values(translations)[0]
  )
}

export default function AppDetailPage() {
  const { t, i18n } = useTranslation()
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
  const [reviews, setReviews] = useState<Paginated<Data.Review> | null>(null)
  const [reviewsPage, setReviewsPage] = useState(1)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewsError, setReviewsError] = useState<string | null>(null)
  const [reviewsRefresh, setReviewsRefresh] = useState(0)
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null)

  useEffect(() => {
    if (!appId) {
      setError(t('detail.invalidId'))
      return
    }
    getApp(appId)
      .then(setApp)
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : t('detail.loadAppError')),
      )
  }, [appId])

  useEffect(() => {
    if (!appId) return

    setPackagesLoading(true)
    setPackagesError(null)
    getAppPackages(appId, packagesPage)
      .then(setPackages)
      .catch((reason) =>
        setPackagesError(reason instanceof Error ? reason.message : t('detail.loadPackagesError')),
      )
      .finally(() => setPackagesLoading(false))
  }, [appId, packagesPage])

  useEffect(() => {
    if (!appId) return

    setReviewsLoading(true)
    setReviewsError(null)
    getAppReviews(appId, reviewsPage)
      .then(setReviews)
      .catch((reason) =>
        setReviewsError(reason instanceof Error ? reason.message : t('reviews.loadError')),
      )
      .finally(() => setReviewsLoading(false))
  }, [appId, reviewsPage, reviewsRefresh])

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
    if (!window.confirm(t('detail.deleteConfirm', { name }))) return
    try {
      await deleteApp(app.id)
      navigate('/apps')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('detail.deleteError'))
    }
  }

  function handleReviewSubmitted() {
    setReviewsPage(1)
    setReviewsRefresh((value) => value + 1)
  }

  async function handleDeleteReview(review: Data.Review) {
    if (!window.confirm(t('reviews.deleteConfirm'))) return
    setDeletingReviewId(review.id)
    try {
      await deleteReview(app!.id)
      setReviewsRefresh((value) => value + 1)
    } catch (reason) {
      setReviewsError(reason instanceof Error ? reason.message : t('reviews.deleteError'))
    } finally {
      setDeletingReviewId(null)
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
          {t('detail.backToApps')}
        </Button>
        {isAdmin && (
          <Group gap='xs'>
            <Button
              component={Link}
              href={`/apps/${app.id}/edit`}
              leftSection={<PencilSimpleIcon size={18} />}
              variant='default'
            >
              {t('detail.editApp')}
            </Button>
            <Button
              color='red'
              leftSection={<TrashIcon size={18} />}
              variant='subtle'
              onClick={() => void remove()}
            >
              {t('detail.deleteApp')}
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
          <Text className={styles.eyebrow}>{t('detail.eyebrow')}</Text>
          <Group align='center' gap='sm' wrap='nowrap'>
            <Title order={1}>{name}</Title>
            <FavoriteButton appId={app.id} favorite={app.isFavorite} size='xl' />
          </Group>
          <Text c='dimmed' size='lg'>
            {localized(app.summary, i18n.language)}
          </Text>
        </div>
      </section>

      <section className={styles.metadata}>
        <div>
          <Text size='sm' c='dimmed'>
            {t('detail.version')}
          </Text>
          <Text>{app.version ?? t('common.notSpecified')}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('detail.license')}
          </Text>
          <Text>{app.license ?? t('common.notSpecified')}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            {t('detail.appstreamId')}
          </Text>
          <Text>{app.appstreamId ?? t('common.notSpecified')}</Text>
        </div>
      </section>

      {(app.appstreamUrl || app.desktopUrl) && (
        <section className={styles.sources}>
          <Title order={2}>{t('detail.sources')}</Title>
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
                {t('detail.appstreamMetadata')}
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
                {t('detail.desktopEntry')}
              </Button>
            )}
          </Group>
        </section>
      )}

      <section className={styles.packages}>
        <Title order={2}>{t('detail.packages')}</Title>
        {packagesError && <Alert color='red'>{packagesError}</Alert>}
        {packagesLoading ? (
          <div className={styles.packagesLoading}>
            <Loader color='orange' size='sm' />
          </div>
        ) : packages?.data.length === 0 ? (
          <Text c='dimmed'>{t('detail.noPackages')}</Text>
        ) : (
          <>
            <div className={styles.packageList}>
              {packages?.data.map((pkg) => (
                <article className={styles.package} key={pkg.id}>
                  <div>
                    <Title order={3}>{pkg.name}</Title>
                    <div className={styles.packageMeta}>
                      <span className={styles.packageType}>
                        {packageTypesWithIcons.has(pkg.type) && (
                          <img
                            alt=''
                            className={styles.packageTypeIcon}
                            src={`/packages/${pkg.type}.svg`}
                          />
                        )}
                        {pkg.type}
                      </span>
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
                      {t('detail.download')}
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

      <section className={styles.reviews}>
        <Title order={2}>{t('reviews.title')}</Title>
        <ReviewForm appId={app.id} onSubmitted={handleReviewSubmitted} />
        {reviewsError && <Alert color='red'>{reviewsError}</Alert>}
        {reviewsLoading ? (
          <div className={styles.packagesLoading}>
            <Loader color='orange' size='sm' />
          </div>
        ) : reviews ? (
          <ReviewList
            currentUserId={user?.id}
            deletingId={deletingReviewId}
            language={i18n.language}
            onDelete={handleDeleteReview}
            onPageChange={setReviewsPage}
            page={reviewsPage}
            reviews={reviews}
            variant='app'
          />
        ) : null}
      </section>
    </main>
  )
}
