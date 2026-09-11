import type { Data } from '@generated/data'
import {
  Alert,
  Button,
  Group,
  Loader,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { FloppyDiskIcon } from '@phosphor-icons/react/FloppyDisk'
import { XIcon } from '@phosphor-icons/react/X'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect, useLocation, useRoute, useSearchParams } from 'wouter'

import { useAuth } from '../auth'
import { getApps } from '../services/apps'
import { createPkg, getPkg, updatePkg, type PkgPayload } from '../services/pkgs'

import styles from './AppFormPage.module.css'

const packageTypes = ['deb', 'rpm', 'appimage', 'flatpak', 'snap', 'tar.gz']
const checksumTypes = ['sha256', 'sha512', 'sha1', 'md5']

const emptyForm: PkgPayload = {
  appId: null,
  type: 'deb',
  name: '',
  version: '',
  release: '',
  arch: '',
  downloadUrl: '',
  checksum: '',
  checksumType: 'sha256',
  size: '',
  installCommand: '',
}

function formFromPkg(pkg: Data.Pkg): PkgPayload {
  return {
    appId: pkg.app?.id ?? null,
    type: pkg.type,
    name: pkg.name,
    version: pkg.version ?? '',
    release: pkg.release ?? '',
    arch: pkg.arch ?? '',
    downloadUrl: pkg.downloadUrl ?? '',
    checksum: pkg.checksum ?? '',
    checksumType: pkg.checksumType ?? '',
    size: pkg.size === null ? '' : String(pkg.size),
    installCommand: pkg.installCommand ?? '',
  }
}

function localized(translations: Record<string, string>, language: string) {
  return (
    translations[language] ??
    translations[language.split('-')[0]] ??
    translations.en ??
    Object.values(translations)[0]
  )
}

export default function PkgFormPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [, params] = useRoute('/packages/:id/edit')
  const [searchParams] = useSearchParams()
  const pkgId = params?.id ? Number(params.id) : undefined
  const presetAppId = searchParams.get('appId')

  const [form, setForm] = useState<PkgPayload>(emptyForm)
  const [apps, setApps] = useState<Data.App[]>([])
  const [loading, setLoading] = useState(Boolean(pkgId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getApps('', 1, 50)
      .then((res) => setApps(res.data))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!pkgId) return
    getPkg(pkgId)
      .then((pkg) => setForm(formFromPkg(pkg)))
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : t('packages.loadError')),
      )
      .finally(() => setLoading(false))
  }, [pkgId, t])

  useEffect(() => {
    if (pkgId || !presetAppId) return
    const id = Number(presetAppId)
    if (Number.isInteger(id) && id > 0) {
      setForm((current) => ({ ...current, appId: id }))
    }
  }, [pkgId, presetAppId])

  const appOptions = useMemo(
    () =>
      apps.map((app) => ({
        value: String(app.id),
        label: localized(app.name, i18n.language),
      })),
    [apps, i18n.language],
  )

  if (!ready)
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )
  if (!user) return <Redirect to='/login' />
  if (user.role !== 'admin') return <Redirect to='/packages' />
  if (loading)
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )

  function update<K extends keyof PkgPayload>(key: K, value: PkgPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save() {
    try {
      setSaving(true)
      if (pkgId) await updatePkg(pkgId, form)
      else await createPkg(form)
      navigate('/packages')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('packages.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>
            {pkgId ? t('packages.editEntry') : t('packages.newEntry')}
          </Text>
          <Title order={1}>{pkgId ? t('packages.editPackage') : t('packages.addPackage')}</Title>
        </div>
        <Button
          leftSection={<XIcon size={18} />}
          variant='default'
          onClick={() => navigate('/packages')}
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
          label={t('packages.fields.app')}
          required
          searchable
          data={appOptions}
          value={form.appId === null ? null : String(form.appId)}
          onChange={(value) => update('appId', value ? Number(value) : null)}
        />
        <Select
          label={t('packages.fields.type')}
          required
          allowDeselect={false}
          data={packageTypes}
          value={form.type}
          onChange={(value) => update('type', value ?? 'deb')}
        />
        <TextInput
          label={t('packages.fields.name')}
          required
          value={form.name}
          onChange={(event) => update('name', event.currentTarget.value)}
        />
        <TextInput
          label={t('packages.fields.version')}
          value={form.version}
          onChange={(event) => update('version', event.currentTarget.value)}
        />
        <TextInput
          label={t('packages.fields.release')}
          value={form.release}
          onChange={(event) => update('release', event.currentTarget.value)}
        />
        <TextInput
          label={t('packages.fields.arch')}
          value={form.arch}
          onChange={(event) => update('arch', event.currentTarget.value)}
        />
        <TextInput
          label={t('packages.fields.downloadUrl')}
          value={form.downloadUrl}
          onChange={(event) => update('downloadUrl', event.currentTarget.value)}
        />
        <TextInput
          label={t('packages.fields.checksum')}
          value={form.checksum}
          onChange={(event) => update('checksum', event.currentTarget.value)}
        />
        <Select
          label={t('packages.fields.checksumType')}
          clearable
          data={checksumTypes}
          value={form.checksumType || null}
          onChange={(value) => update('checksumType', value ?? '')}
        />
        <NumberInput
          label={t('packages.fields.size')}
          min={0}
          value={form.size === '' ? '' : Number(form.size)}
          onChange={(value) => update('size', value === '' ? '' : String(value))}
        />
        <TextInput
          label={t('packages.fields.installCommand')}
          value={form.installCommand}
          onChange={(event) => update('installCommand', event.currentTarget.value)}
        />
        <Group justify='flex-end'>
          <Button
            leftSection={<FloppyDiskIcon size={18} />}
            loading={saving}
            onClick={() => void save()}
          >
            {t('packages.save')}
          </Button>
        </Group>
      </Stack>
    </main>
  )
}
