import { Button, Group, Stack, Text } from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { UploadSimpleIcon } from '@phosphor-icons/react/UploadSimple'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { uploadImage } from '../services/images'

import styles from './IconUpload.module.css'

const acceptedFormats = ['svg', 'png']
const maxSize = 10 * 1024 * 1024

type IconUploadProps = {
  /**
   * Id of the selected image, or null when the entry has no icon.
   */
  value: number | null
  /**
   * Url of the icon already stored on the entry. Uploading a file replaces it in the preview.
   */
  previewUrl?: string | null
  onChange: (iconId: number | null) => void
}

export default function IconUpload({ value, previewUrl = null, onChange }: IconUploadProps) {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const preview = value ? (uploadedUrl ?? previewUrl) : null

  async function upload(files: File[]) {
    const file = files[0]
    if (!file) return

    try {
      setUploading(true)
      setError(null)
      const image = await uploadImage(file, { acceptedFormats })
      setUploadedUrl(image.url)
      onChange(image.id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('form.iconUploadError'))
    } finally {
      setUploading(false)
    }
  }

  function remove() {
    setUploadedUrl(null)
    setError(null)
    onChange(null)
  }

  return (
    <Stack gap='xs'>
      <Text fw={500} size='sm'>
        {t('form.icon')}
      </Text>
      <Group align='flex-start' gap='lg' wrap='nowrap'>
        <Dropzone
          accept={['image/svg+xml', 'image/png']}
          className={styles.dropzone}
          loading={uploading}
          maxSize={maxSize}
          multiple={false}
          onDrop={upload}
          onReject={() => setError(t('form.iconRejected'))}
          p={0}
        >
          <Dropzone.Idle>
            {preview ? (
              <img alt='' className={styles.preview} src={preview} />
            ) : (
              <Stack align='center' gap={4} px='xs'>
                <UploadSimpleIcon size={24} />
                <Text c='dimmed' size='xs' ta='center'>
                  {t('form.iconDrop')}
                </Text>
              </Stack>
            )}
          </Dropzone.Idle>
          <Dropzone.Accept>
            <Text size='xs' ta='center'>
              {t('form.iconAccept')}
            </Text>
          </Dropzone.Accept>
          <Dropzone.Reject>
            <Text c='red' size='xs' ta='center'>
              {t('form.iconRejected')}
            </Text>
          </Dropzone.Reject>
        </Dropzone>
        <Stack className={styles.aside} gap='xs'>
          <Text c='dimmed' size='xs'>
            {t('form.iconHint')}
          </Text>
          {error && (
            <Text c='red' size='xs'>
              {error}
            </Text>
          )}
          {value !== null && (
            <Group>
              <Button
                leftSection={<TrashIcon size={16} />}
                onClick={remove}
                size='xs'
                variant='subtle'
              >
                {t('form.iconRemove')}
              </Button>
            </Group>
          )}
        </Stack>
      </Group>
    </Stack>
  )
}
