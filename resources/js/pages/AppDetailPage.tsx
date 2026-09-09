import type { Data } from '@generated/data'
import { Alert, Button, Group, Loader, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useRoute } from 'wouter'

import { useAuth } from '../auth'
import { getApp } from '../services/apps'

function localized(translations: Record<string, string>, language: string) {
  return (
    translations[language] ??
    translations[language.split('-')[0]] ??
    translations.en ??
    Object.values(translations)[0]
  )
}

export default function AppDetailPage() {
  const { i18n } = useTranslation()
  const { ready, user } = useAuth()
  const [, params] = useRoute('/apps/:id')
  const appId = params?.id ? Number(params.id) : undefined
  const [app, setApp] = useState<Data.App | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!appId) {
      setError('Invalid application ID')
      return
    }
    getApp(appId)
      .then(setApp)
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : 'Unable to load application'),
      )
  }, [appId])

  if (error) {
    return (
      <main className='app-detail-page'>
        <Alert color='red'>{error}</Alert>
      </main>
    )
  }
  if (!app || !ready) {
    return (
      <div className='loading-screen'>
        <Loader color='orange' />
      </div>
    )
  }

  const name = localized(app.name, i18n.language)

  return (
    <main className='app-detail-page'>
      <header className='app-detail-header'>
        <Button component={Link} href='/apps' variant='subtle'>
          Back to applications
        </Button>
        {user && (
          <Button component={Link} href={`/apps/${app.id}/edit`} variant='default'>
            Edit application
          </Button>
        )}
      </header>

      <section className='app-detail-intro'>
        {app.icon ? (
          <img alt='' className='app-detail-icon' src={app.icon.url} />
        ) : (
          <div className='app-detail-icon app-icon-empty' />
        )}
        <div>
          <Text className='eyebrow'>Linux application</Text>
          <Title order={1}>{name}</Title>
          <Text c='dimmed' size='lg'>
            {localized(app.summary, i18n.language)}
          </Text>
        </div>
      </section>

      <section className='app-detail-metadata'>
        <div>
          <Text size='sm' c='dimmed'>
            Version
          </Text>
          <Text>{app.version ?? 'Not specified'}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            License
          </Text>
          <Text>{app.license ?? 'Not specified'}</Text>
        </div>
        <div>
          <Text size='sm' c='dimmed'>
            AppStream ID
          </Text>
          <Text>{app.appstreamId ?? 'Not specified'}</Text>
        </div>
      </section>

      {(app.appstreamUrl || app.desktopUrl) && (
        <section className='app-detail-sources'>
          <Title order={2}>Sources</Title>
          <Group gap='xs'>
            {app.appstreamUrl && (
              <Button
                component='a'
                href={app.appstreamUrl}
                rel='noreferrer'
                target='_blank'
                variant='default'
              >
                AppStream metadata
              </Button>
            )}
            {app.desktopUrl && (
              <Button
                component='a'
                href={app.desktopUrl}
                rel='noreferrer'
                target='_blank'
                variant='default'
              >
                Desktop entry
              </Button>
            )}
          </Group>
        </section>
      )}
    </main>
  )
}
