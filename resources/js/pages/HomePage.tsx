import type { Data } from '@generated/data'
import { Alert, Anchor, Loader, Text, Title } from '@mantine/core'
import { ArrowRightIcon } from '@phosphor-icons/react/ArrowRight'
import { useEffect, useState } from 'react'
import { Link } from 'wouter'

import HomeAppCard from '../components/home/HomeAppCard'
import HomeDistroCard from '../components/home/HomeDistroCard'
import { getApps, getDistros, type Distro } from '../services/apps'

import styles from './HomePage.module.css'

export default function HomePage() {
  const [apps, setApps] = useState<Data.App[]>([])
  const [distros, setDistros] = useState<Distro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getApps('', 1), getDistros()])
      .then(([appPage, distroList]) => {
        setApps(appPage.data.slice(0, 6))
        setDistros(distroList)
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : 'Unable to load catalog'),
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className={styles.page}>
      {error && (
        <Alert color='red' mb='lg'>
          {error}
        </Alert>
      )}
      {loading ? (
        <div className={styles.loading}>
          <Loader color='orange' />
        </div>
      ) : (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <Text className={styles.eyebrow}>Linux catalog</Text>
                <Title order={1}>Applications</Title>
              </div>
              <Anchor component={Link} href='/apps'>
                View all <ArrowRightIcon size={16} />
              </Anchor>
            </div>
            <div className={styles.appGrid}>
              {apps.map((app) => (
                <HomeAppCard app={app} key={app.id} />
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <Text className={styles.eyebrow}>Operating systems</Text>
                <Title order={2}>Distributions</Title>
              </div>
            </div>
            <div className={styles.distroGrid}>
              {distros.map((distro) => (
                <HomeDistroCard distro={distro} key={distro.id} />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}
