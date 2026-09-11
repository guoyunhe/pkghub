import type { Data } from '@generated/data'
import {
  Alert,
  Button,
  Group,
  Loader,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { FloppyDiskIcon } from '@phosphor-icons/react/FloppyDisk'
import { XIcon } from '@phosphor-icons/react/X'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect, useLocation, useRoute } from 'wouter'

import { useAuth } from '../auth'
import IconUpload from '../components/IconUpload'
import { createApp, getApp, updateApp, type AppPayload } from '../services/apps'

import styles from './AppFormPage.module.css'

const emptyForm: AppPayload = {
  name: { en: '' },
  summary: { en: '' },
  version: '',
  license: '',
  appstreamId: '',
  appstreamUrl: '',
  appstreamContent: '',
  desktopUrl: '',
  desktopContent: '',
  iconId: null,
}

function formFromApp(app: Data.App): AppPayload {
  return {
    name: app.name,
    summary: app.summary,
    version: app.version ?? '',
    license: app.license ?? '',
    appstreamId: app.appstreamId ?? '',
    appstreamUrl: app.appstreamUrl ?? '',
    appstreamContent: app.appstreamContent ?? '',
    desktopUrl: app.desktopUrl ?? '',
    desktopContent: app.desktopContent ?? '',
    iconId: app.iconId,
  }
}

export default function AppFormPage() {
  const { t } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [, params] = useRoute('/apps/:id/edit')
  const appId = params?.id ? Number(params.id) : undefined
  const [form, setForm] = useState<AppPayload>(emptyForm)
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(appId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!appId) return
    getApp(appId)
      .then((app) => {
        setForm(formFromApp(app))
        setIconUrl(app.icon?.url ?? null)
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : t('form.loadError')))
      .finally(() => setLoading(false))
  }, [appId])

  if (!ready)
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )
  if (!user) return <Redirect to='/login' />
  if (user.role !== 'admin') return <Redirect to='/apps' />
  if (loading)
    return (
      <div className={styles.loading}>
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
      setError(reason instanceof Error ? reason.message : t('form.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{appId ? t('form.editEntry') : t('form.newEntry')}</Text>
          <Title order={1}>{appId ? t('form.editApp') : t('form.addApp')}</Title>
        </div>
        <Button
          leftSection={<XIcon size={18} />}
          variant='default'
          onClick={() => navigate('/apps')}
        >
          {t('common.cancel')}
        </Button>
      </header>
      {error && (
        <Alert color='red' mb='lg'>
          {error}
        </Alert>
      )}
      <Stack className={styles.form}>
        <IconUpload
          previewUrl={iconUrl}
          value={form.iconId ?? null}
          onChange={(iconId) => setForm((current) => ({ ...current, iconId }))}
        />
        <TextInput
          label={t('form.nameEn')}
          required
          value={form.name.en}
          onChange={(event) =>
            setForm({ ...form, name: { ...form.name, en: event.currentTarget.value } })
          }
        />
        <TextInput
          label={t('form.nameZh')}
          value={form.name.zh ?? ''}
          onChange={(event) =>
            setForm({ ...form, name: { ...form.name, zh: event.currentTarget.value } })
          }
        />
        <TextInput
          label={t('form.summaryEn')}
          required
          value={form.summary.en}
          onChange={(event) =>
            setForm({ ...form, summary: { ...form.summary, en: event.currentTarget.value } })
          }
        />
        <TextInput
          label={t('form.summaryZh')}
          value={form.summary.zh ?? ''}
          onChange={(event) =>
            setForm({ ...form, summary: { ...form.summary, zh: event.currentTarget.value } })
          }
        />
        <TextInput
          label={t('form.version')}
          value={form.version ?? ''}
          onChange={(event) => setForm({ ...form, version: event.currentTarget.value })}
        />
        <TextInput
          label={t('form.license')}
          value={form.license ?? ''}
          onChange={(event) => setForm({ ...form, license: event.currentTarget.value })}
        />
        <TextInput
          label={t('form.appstreamId')}
          value={form.appstreamId ?? ''}
          onChange={(event) => setForm({ ...form, appstreamId: event.currentTarget.value })}
        />
        <TextInput
          label={t('form.appstreamUrl')}
          value={form.appstreamUrl ?? ''}
          onChange={(event) => setForm({ ...form, appstreamUrl: event.currentTarget.value })}
        />
        <Textarea
          autosize
          description={t('form.appstreamContentHint')}
          label={t('form.appstreamContent')}
          minRows={4}
          value={form.appstreamContent ?? ''}
          onChange={(event) => setForm({ ...form, appstreamContent: event.currentTarget.value })}
        />
        <TextInput
          label={t('form.desktopUrl')}
          value={form.desktopUrl ?? ''}
          onChange={(event) => setForm({ ...form, desktopUrl: event.currentTarget.value })}
        />
        <Textarea
          autosize
          description={t('form.desktopContentHint')}
          label={t('form.desktopContent')}
          minRows={4}
          value={form.desktopContent ?? ''}
          onChange={(event) => setForm({ ...form, desktopContent: event.currentTarget.value })}
        />
        <Group justify='flex-end'>
          <Button
            leftSection={<FloppyDiskIcon size={18} />}
            loading={saving}
            onClick={() => void save()}
          >
            {t('form.save')}
          </Button>
        </Group>
      </Stack>
    </main>
  )
}
