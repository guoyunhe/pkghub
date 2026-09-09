import type { Data } from '@generated/data'
import { Alert, Button, Group, Loader, Modal, Stack, Text, TextInput, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'wouter'

import { useAuth } from '../auth'
import { createApp, deleteApp, getApps, updateApp, type AppPayload } from '../services/apps'

const emptyForm: AppPayload = { name: { en: '' }, summary: { en: '' } }

function localized(translations: Record<string, string>, language: string) {
  return (
    translations[language] ??
    translations[language.split('-')[0]] ??
    translations.en ??
    Object.values(translations)[0]
  )
}

export default function AppsPage() {
  const { i18n } = useTranslation()
  const { ready, user, logout } = useAuth()
  const [, navigate] = useLocation()
  const [apps, setApps] = useState<Data.App[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Data.App | null>(null)
  const [formOpened, setFormOpened] = useState(false)
  const [form, setForm] = useState<AppPayload>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function loadApps() {
    try {
      setLoading(true)
      setApps(await getApps())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadApps()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormOpened(true)
  }

  function openEdit(app: Data.App) {
    setEditing(app)
    setForm({
      name: app.name,
      summary: app.summary,
      version: app.version ?? '',
      license: app.license ?? '',
      appstreamId: app.appstreamId ?? '',
      appstreamUrl: app.appstreamUrl ?? '',
      desktopUrl: app.desktopUrl ?? '',
    })
    setFormOpened(true)
  }

  async function save() {
    try {
      setSaving(true)
      if (editing) await updateApp(editing.id, form)
      else await createApp(form)
      setFormOpened(false)
      await loadApps()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save application')
    } finally {
      setSaving(false)
    }
  }

  async function remove(app: Data.App) {
    if (!window.confirm(`Delete ${localized(app.name, i18n.language)}?`)) return
    try {
      await deleteApp(app.id)
      setApps((current) => current.filter((item) => item.id !== app.id))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to delete application')
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <main className='apps-page'>
      <header className='apps-header'>
        <div>
          <Text className='eyebrow'>Linux catalog</Text>
          <Title order={1}>Applications</Title>
          <Text c='dimmed'>Discover software metadata, launchers and upstream sources.</Text>
        </div>
        <Group gap='xs'>
          {ready && user ? (
            <>
              <Button onClick={openCreate}>Add application</Button>
              <Button variant='default' onClick={() => void handleLogout()}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button component={Link} href='/login' variant='default'>
                Sign in
              </Button>
              <Button component={Link} href='/register'>
                Create account
              </Button>
            </>
          )}
        </Group>
      </header>

      {error && (
        <Alert color='red' mb='lg'>
          {error}
        </Alert>
      )}
      {loading ? (
        <div className='loading-screen'>
          <Loader color='orange' />
        </div>
      ) : (
        <section className='apps-grid'>
          {apps.map((app) => (
            <article className='app-item' key={app.id}>
              {app.icon ? (
                <img alt='' className='app-icon' src={app.icon.url} />
              ) : (
                <div className='app-icon app-icon-empty' />
              )}
              <div className='app-copy'>
                <Title order={3}>{localized(app.name, i18n.language)}</Title>
                <Text c='dimmed'>{localized(app.summary, i18n.language)}</Text>
                <div className='app-meta'>
                  {app.version && <span>{app.version}</span>}
                  {app.license && <span>{app.license}</span>}
                </div>
              </div>
              {user && (
                <Group gap='xs' className='app-actions'>
                  <Button variant='subtle' size='compact-sm' onClick={() => openEdit(app)}>
                    Edit
                  </Button>
                  <Button
                    color='red'
                    variant='subtle'
                    size='compact-sm'
                    onClick={() => void remove(app)}
                  >
                    Delete
                  </Button>
                </Group>
              )}
            </article>
          ))}
        </section>
      )}

      <Modal
        opened={formOpened}
        onClose={() => setFormOpened(false)}
        title={editing ? 'Edit application' : 'Add application'}
      >
        <Stack>
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
            <Button variant='default' onClick={() => setFormOpened(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void save()}>
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </main>
  )
}
