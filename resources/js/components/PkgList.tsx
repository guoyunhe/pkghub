import type { Data } from '@generated/data'
import type { ReactNode } from 'react'

import PkgListItem from './PkgListItem'

import styles from './PkgList.module.css'

type PkgListProps = {
  pkgs: Data.Pkg[]
  /** Extra controls per item, such as the admin actions. */
  renderActions?: (pkg: Data.Pkg) => ReactNode
}

/** Grid of package rows, shared by the package list and the search results. */
export default function PkgList({ pkgs, renderActions }: PkgListProps) {
  return (
    <section className={styles.grid}>
      {pkgs.map((pkg) => (
        <PkgListItem actions={renderActions?.(pkg)} key={pkg.id} pkg={pkg} />
      ))}
    </section>
  )
}
