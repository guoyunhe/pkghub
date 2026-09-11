import type { Data } from '@generated/data'
import {
  Alert,
  Button,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  Switch,
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
import { getDistros } from '../services/apps'
import { createRepo, getRepo, updateRepo, type RepoPayload } from '../services/repos'

import styles from './AppFormPage.module.css'

const emptyForm: RepoPayload = {
  type: 'deb',
  name: '',
  baseUrl: '',
  distroId: null,
  configContent: '',
  syncIntervalDays: '',
}

function formFromRepo(repo: Data.Repo): RepoPayload {
  return {
    type: repo.type,
    name: repo.name,
    baseUrl: repo.baseUrl,
    distroId: repo.distroId,
    configContent: repo.configContent ?? '',
    syncIntervalDays: repo.syncIntervalDays === null ? '' : String(repo.syncIntervalDays),
  }
}

export default function RepoFormPage() {
  const { t } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [, params] = useRoute('/repos/:id/edit')
  const repoId = params?.id ? Number(params.id) : undefined

  const [form, setForm] = useState<RepoPayload>(emptyForm)
  const [distros, setDistros] = useState<Data.Distro[]>([])
  const [loading, setLoading] = useState(Boolean(repoId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDistros()
      .then(setDistros)
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!repoId) return
    getRepo(repoId)
      .then((repo) => setForm(formFromRepo(repo)))
      .catch((reason) => setError(reason instanceof Error ? reason.message : t('repos.loadError')))
      .finally(() => setLoading(false))
  }, [repoId])

  if (!ready)
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )
  if (!user) return <Redirect to='/login' />
  if (user.role !== 'admin') return <Redirect to='/repos' />
  if (loading)
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )

  function update<K extends keyof RepoPayload>(key: K, value: RepoPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save() {
    try {
      setSaving(true)
      if (repoId) await updateRepo(repoId, form)
      else await createRepo(form)
      navigate('/repos')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('repos.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>
            {repoId ? t('repos.editEntry') : t('repos.newEntry')}
          </Text>
          <Title order={1}>{repoId ? t('repos.editRepo') : t('repos.addRepo')}</Title>
        </div>
        <Button
          leftSection={<XIcon size={18} />}
          variant='default'
          onClick={() => navigate('/repos')}
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
        <Select
          label={t('repos.fields.type')}
          required
          allowDeselect={false}
          data={[
            { value: 'deb', label: 'DEB (Debian/Ubuntu)' },
            { value: 'rpm', label: 'RPM (RHEL/openSUSE/Fedora)' },
            { value: 'flatpak', label: 'Flatpak' },
            { value: 'snap', label: 'Snap' },
          ]}
          value={form.type}
          onChange={(value) => update('type', value ?? 'deb')}
        />
        <TextInput
          label={t('repos.fields.name')}
          required
          value={form.name}
          onChange={(event) => update('name', event.currentTarget.value)}
        />
        <TextInput
          label={t('repos.fields.baseUrl')}
          required
          placeholder='https://deb.debian.org/debian/'
          value={form.baseUrl}
          onChange={(event) => update('baseUrl', event.currentTarget.value)}
        />
        <Select
          label={t('repos.fields.distro')}
          clearable
          searchable
          data={distros.map((distro) => ({
            value: String(distro.id),
            label: distro.name,
          }))}
          value={form.distroId === null ? null : String(form.distroId)}
          onChange={(value) => update('distroId', value ? Number(value) : null)}
        />
        <Textarea
          autosize
          label={t('repos.fields.configContent')}
          minRows={2}
          value={form.configContent}
          onChange={(event) => update('configContent', event.currentTarget.value)}
        />
        <NumberInput
          description={t('repos.syncIntervalHint')}
          label={t('repos.fields.syncIntervalDays')}
          min={0}
          value={form.syncIntervalDays === '' ? '' : Number(form.syncIntervalDays)}
          onChange={(value) => update('syncIntervalDays', value === '' ? '' : String(value))}
        />
        <Group justify='flex-end'>
          <Button
            leftSection={<FloppyDiskIcon size={18} />}
            loading={saving}
            onClick={() => void save()}
          >
            {t('repos.save')}
          </Button>
        </Group>
      </Stack>
    </main>
  )
}
