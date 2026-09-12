import type { Data } from '@generated/data'
import { Text, Title } from '@mantine/core'
import { ArrowRightIcon } from '@phosphor-icons/react/ArrowRight'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import { localized } from '../utils/appstream'
import AverageRating from './AverageRating'
import CategoryBadges from './CategoryBadges'

import styles from './List.module.css'

type AppListItemProps = {
  app: Data.App
  /** Extra controls rendered in the rightmost column, such as the favorite button. */
  actions?: ReactNode
}

/** A single application row: icon, localized name and summary, categories, rating and metadata. */
export default function AppListItem({ app, actions }: AppListItemProps) {
  const { i18n } = useTranslation()
  const name = localized(app.name, i18n.language)

  return (
    <article className={styles.item}>
      <Link aria-label={name} className={styles.iconLink} href={`/apps/${app.id}`}>
        {app.icon ? (
          <img alt='' className={styles.icon} src={app.icon.url} />
        ) : (
          <div className={`${styles.icon} ${styles.emptyIcon}`} />
        )}
      </Link>
      <div className={styles.copy}>
        <Title order={3}>
          <Link className={styles.link} href={`/apps/${app.id}`}>
            {name} <ArrowRightIcon size={18} weight='bold' />
          </Link>
        </Title>
        <Text c='dimmed'>{localized(app.summary, i18n.language)}</Text>
        <div className={styles.badges}>
          <AverageRating count={app.reviewCount} value={app.avgRating} />
          <CategoryBadges categories={app.categories} />
        </div>
        <div className={styles.meta}>
          {app.version && <span>{app.version}</span>}
          {app.license && <span>{app.license}</span>}
        </div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </article>
  )
}
