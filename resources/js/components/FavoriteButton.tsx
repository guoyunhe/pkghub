import { ActionIcon, Tooltip } from '@mantine/core'
import { HeartIcon } from '@phosphor-icons/react/Heart'
import { useEffect, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'wouter'

import { useAuth } from '../auth'
import { addFavorite, removeFavorite } from '../services/favorites'

type FavoriteButtonProps = {
  appId: number
  favorite: boolean
  onChange?: (favorite: boolean) => void
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function FavoriteButton({
  appId,
  favorite,
  onChange,
  size = 'lg',
}: FavoriteButtonProps) {
  const { t } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [active, setActive] = useState(favorite)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    setActive(favorite)
  }, [favorite])

  async function toggle(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (pending) return

    if (!ready || !user) {
      navigate('/login')
      return
    }

    const next = !active
    setActive(next)
    setPending(true)
    try {
      if (next) {
        await addFavorite(appId)
      } else {
        await removeFavorite(appId)
      }
      onChange?.(next)
    } catch {
      setActive(!next)
    } finally {
      setPending(false)
    }
  }

  const label = active ? t('favorites.remove') : t('favorites.add')

  return (
    <Tooltip label={label} position='bottom' withArrow>
      <ActionIcon
        aria-label={label}
        aria-pressed={active}
        color={active ? 'red' : 'gray'}
        loading={pending}
        size={size}
        variant={active ? 'transparent' : 'default'}
        onClick={(event) => void toggle(event)}
      >
        <HeartIcon
          color={active ? 'var(--mantine-color-red-6)' : 'currentColor'}
          size={size === 'sm' ? 16 : 20}
          weight={active ? 'fill' : 'regular'}
        />
      </ActionIcon>
    </Tooltip>
  )
}
