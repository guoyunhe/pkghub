import type { Data } from '@generated/data'
import type { ReactNode } from 'react'

import AppListItem from './AppListItem'

import styles from './List.module.css'

type AppListProps = {
  apps: Data.App[]
  /** Extra controls per item, such as the favorite button. */
  renderActions?: (app: Data.App) => ReactNode
}

/** Grid of application rows, shared by the application list and the search results. */
export default function AppList({ apps, renderActions }: AppListProps) {
  return (
    <section className={styles.grid}>
      {apps.map((app) => (
        <AppListItem actions={renderActions?.(app)} app={app} key={app.id} />
      ))}
    </section>
  )
}
