import type { Data } from '@generated/data'
import { ActionIcon, Group, Pagination, Rating, Text, Tooltip } from '@mantine/core'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import type { Paginated } from '../types/pagination'
import { localized } from '../utils/appstream'

import styles from './ReviewList.module.css'

function formatDate(value: string | null, language: string) {
  if (!value) return null
  const date = new Date(value)
  return date.toLocaleDateString(language.startsWith('zh') ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

type ReviewListProps = {
  reviews: Paginated<Data.Review>
  page: number
  onPageChange: (page: number) => void
  variant: 'app' | 'user'
  language: string
  currentUserId?: number
  deletingId?: number | null
  onDelete?: (review: Data.Review) => void
}

export default function ReviewList({
  reviews,
  page,
  onPageChange,
  variant,
  language,
  currentUserId,
  deletingId,
  onDelete,
}: ReviewListProps) {
  const { t } = useTranslation()

  if (reviews.data.length === 0) {
    return (
      <Text c='dimmed' mt='md'>
        {t('reviews.empty')}
      </Text>
    )
  }

  return (
    <div>
      <div className={styles.list}>
        {reviews.data.map((review) => {
          const isOwn = currentUserId !== undefined && review.user?.id === currentUserId
          const date = formatDate(review.createdAt, language)
          return (
            <article className={styles.item} key={review.id}>
              <Group justify='space-between' wrap='nowrap'>
                <div className={styles.heading}>
                  {variant === 'app' ? (
                    review.user ? (
                      <Link className={styles.link} href={`/users/${review.user.id}`}>
                        {review.user.name}
                      </Link>
                    ) : (
                      <Text c='dimmed' size='sm'>
                        {t('reviews.deletedUser')}
                      </Text>
                    )
                  ) : review.app ? (
                    <Link className={styles.link} href={`/apps/${review.app.id}`}>
                      {localized(review.app.name, language)}
                    </Link>
                  ) : null}
                  {date && (
                    <Text c='dimmed' size='xs'>
                      {date}
                    </Text>
                  )}
                </div>
                <Group gap='xs' wrap='nowrap'>
                  <Rating count={5} readOnly value={review.rating} />
                  {isOwn && onDelete && (
                    <Tooltip label={t('reviews.delete')} position='bottom' withArrow>
                      <ActionIcon
                        aria-label={t('reviews.delete')}
                        color='red'
                        loading={deletingId === review.id}
                        size='sm'
                        variant='subtle'
                        onClick={() => onDelete(review)}
                      >
                        <TrashIcon size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              </Group>
              {review.comment && (
                <Text className={styles.comment} size='sm'>
                  {review.comment}
                </Text>
              )}
            </article>
          )
        })}
      </div>
      {reviews.meta.lastPage > 1 && (
        <Pagination
          className={styles.pagination}
          onChange={onPageChange}
          total={reviews.meta.lastPage}
          value={page}
        />
      )}
    </div>
  )
}
