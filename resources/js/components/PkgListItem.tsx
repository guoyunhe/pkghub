import type { Data } from '@generated/data'
import { Button, Group, Title } from '@mantine/core'
import { DownloadSimpleIcon } from '@phosphor-icons/react/DownloadSimple'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import styles from './PkgListItem.module.css'

const packageTypesWithIcons = new Set(['rpm', 'deb', 'appimage'])

type PkgListItemProps = {
  pkg: Data.Pkg
  /** Extra controls rendered after the download button, such as the admin actions. */
  actions?: ReactNode
}

/** A single package row: type icon, name, metadata and the download (plus extra) actions. */
export default function PkgListItem({ pkg, actions }: PkgListItemProps) {
  const { t } = useTranslation()

  return (
    <article className={styles.pkgItem}>
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
      <Group gap='xs'>
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
        {actions}
      </Group>
    </article>
  )
}
