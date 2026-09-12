import type { Data } from '@generated/data'
import type { ReactNode } from 'react'

import PkgListItem from './PkgListItem'

import styles from './PkgList.module.css'

type PkgListProps = {
  pkgs: Data.Pkg[]
  /** Extra controls per item, such as the admin actions. */
  renderActions?: (pkg: Data.Pkg) => ReactNode
  /** Render the longer package details (license, summary and install command). */
  showDetails?: boolean
}

/** Grid of package rows, shared by the package list, the search results and app details. */
export default function PkgList({ pkgs, renderActions, showDetails }: PkgListProps) {
  return (
    <section className={styles.grid}>
      {pkgs.map((pkg) => (
        <PkgListItem
          actions={renderActions?.(pkg)}
          key={pkg.id}
          pkg={pkg}
          showDetails={showDetails}
        />
      ))}
    </section>
  )
}
