import type { Data } from '@generated/data'
import { Alert, Button, Group, Loader, Stack, Text, TextInput, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { Redirect, useLocation, useRoute } from 'wouter'

import { useAuth } from '../auth'
import { createApp, getApp, updateApp, type AppPayload } from '../services/apps'

const emptyForm: AppPayload = { name: { en: '' }, summary: { en: '' } }

function formFromApp(app: Data.App): AppPayload {
  return {
    name: app.name,
    summary: app.summary,
    version: app.version ?? '',
    license: app.license ?? '',
    appstreamId: app.appstreamId ?? '',
    appstreamUrl: app.appstreamUrl ?? '',
    desktopUrl: app.desktopUrl ?? '',
  }
}

export default function AppFormPage() {
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [, params] = useRoute('/apps/:id/edit')
  const appId = params?.id ? Number(params.id) : undefined
  const [form, setForm] = useState<AppPayload>(emptyForm)
  const [loading, setLoading] = useState(Boolean(appId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!appId) return
    getApp(appId)
      .then((app) => setForm(formFromApp(app)))
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : 'Unable to load application'),
      )
      .finally(() => setLoading(false))
  }, [appId])

  if (!ready)
    return (
      <div className='loading-screen'>
        <Loader color='orange' />
      </div>
    )
  if (!user) return <Redirect to='/login' />
  if (loading)
    return (
      <div className='loading-screen'>
        <Loader color='orange' />
      </div>
    )

  async function save() {
    try {
      setSaving(true)
      if (appId) await updateApp(appId, form)
      else await createApp(form)
      navigate('/apps')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save application')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className='app-form-page'>
      <header className='app-form-header'>
        <div>
          <Text className='eyebrow'>{appId ? 'Catalog entry' : 'New catalog entry'}</Text>
          <Title order={1}>{appId ? 'Edit application' : 'Add application'}</Title>
        </div>
        <Button variant='default' onClick={() => navigate('/apps')}>
          Cancel
        </Button>
      </header>
      {error && (
        <Alert color='red' mb='lg'>
          {error}
        </Alert>
      )}
      <Stack className='app-form'>
        <TextInput
          label='Name (English)'
          required
          value={form.name.en}
          onChange={(event) =>
            setForm({ ...form, name: { ...form.name, en: event.currentTarget.value } })
          }
        />
        <TextInput
          label='Name (Chinese)'
          value={form.name.zh ?? ''}
          onChange={(event) =>
            setForm({ ...form, name: { ...form.name, zh: event.currentTarget.value } })
          }
        />
        <TextInput
          label='Summary (English)'
          required
          value={form.summary.en}
          onChange={(event) =>
            setForm({ ...form, summary: { ...form.summary, en: event.currentTarget.value } })
          }
        />
        <TextInput
          label='Summary (Chinese)'
          value={form.summary.zh ?? ''}
          onChange={(event) =>
            setForm({ ...form, summary: { ...form.summary, zh: event.currentTarget.value } })
          }
        />
        <TextInput
          label='Version'
          value={form.version ?? ''}
          onChange={(event) => setForm({ ...form, version: event.currentTarget.value })}
        />
        <TextInput
          label='License'
          value={form.license ?? ''}
          onChange={(event) => setForm({ ...form, license: event.currentTarget.value })}
        />
        <TextInput
          label='AppStream ID'
          value={form.appstreamId ?? ''}
          onChange={(event) => setForm({ ...form, appstreamId: event.currentTarget.value })}
        />
        <TextInput
          label='AppStream URL'
          value={form.appstreamUrl ?? ''}
          onChange={(event) => setForm({ ...form, appstreamUrl: event.currentTarget.value })}
        />
        <TextInput
          label='Desktop URL'
          value={form.desktopUrl ?? ''}
          onChange={(event) => setForm({ ...form, desktopUrl: event.currentTarget.value })}
        />
        <Group justify='flex-end'>
          <Button loading={saving} onClick={() => void save()}>
            Save application
          </Button>
        </Group>
      </Stack>
    </main>
  )
}
