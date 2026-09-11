import type { Data } from '@generated/data'
import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import { UploadSimpleIcon } from '@phosphor-icons/react/UploadSimple'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { uploadPkg } from '../services/pkgs'

import styles from './PackageUpload.module.css'

const maxSize = 2 * 1024 * 1024 * 1024
// The archive magic decides the format on the server. The Dropzone "accept" prop is not used
// because browsers ignore extension-only entries, so the extension is checked here instead to
// give immediate feedback.
const extensions = ['.deb', '.rpm', '.appimage']

type PackageUploadProps = {
  appId: number
  /** Called after a package file was uploaded and turned into a package entry. */
  onUploaded: () => void
}

export default function PackageUpload({ appId, onUploaded }: PackageUploadProps) {
  const { t } = useTranslation()
  const [opened, setOpened] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState<Data.Pkg | null>(null)

  function close() {
    if (uploading) return
    setOpened(false)
    setError(null)
    setUploaded(null)
  }

  async function upload(files: File[]) {
    const file = files[0]
    if (!file) return

    if (!extensions.some((extension) => file.name.toLowerCase().endsWith(extension))) {
      setError(t('packages.uploadRejected'))
      return
    }

    try {
      setUploading(true)
      setError(null)
      setUploaded(null)
      const pkg = await uploadPkg(appId, file)
      setUploaded(pkg)
      onUploaded()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('packages.uploadError'))
    } finally {
      setUploading(false)
    }
  }

  const details = uploaded
    ? [uploaded.type, uploaded.version, uploaded.release, uploaded.arch].filter(Boolean).join(' · ')
    : ''

  return (
    <>
      <Button
        leftSection={<UploadSimpleIcon size={16} weight='bold' />}
        size='xs'
        variant='default'
        onClick={() => setOpened(true)}
      >
        {t('packages.uploadPackage')}
      </Button>
      <Modal opened={opened} onClose={close} size='lg' title={t('packages.uploadPackage')}>
        <Stack gap='md'>
          <Dropzone
            className={styles.dropzone}
            loading={uploading}
            maxSize={maxSize}
            multiple={false}
            onDrop={upload}
            onReject={() => setError(t('packages.uploadRejected'))}
          >
            <Dropzone.Idle>
              <Stack align='center' gap='xs'>
                <UploadSimpleIcon className={styles.icon} size={32} />
                <Text size='sm'>{t('packages.uploadDrop')}</Text>
              </Stack>
            </Dropzone.Idle>
            <Dropzone.Accept>
              <Text size='sm'>{t('packages.uploadAccept')}</Text>
            </Dropzone.Accept>
            <Dropzone.Reject>
              <Text c='red' size='sm'>
                {t('packages.uploadRejected')}
              </Text>
            </Dropzone.Reject>
          </Dropzone>
          <Text c='dimmed' size='xs'>
            {t('packages.uploadHint')}
          </Text>
          {error && <Alert color='red'>{error}</Alert>}
          {uploaded && (
            <Alert color='teal' title={t('packages.uploadSuccess', { name: uploaded.name })}>
              {details}
            </Alert>
          )}
          <Group justify='flex-end'>
            <Button disabled={uploading} variant='default' onClick={close}>
              {t('common.close')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
