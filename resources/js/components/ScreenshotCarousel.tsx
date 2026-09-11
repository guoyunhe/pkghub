import { ActionIcon } from '@mantine/core'
import { CaretLeftIcon } from '@phosphor-icons/react/CaretLeft'
import { CaretRightIcon } from '@phosphor-icons/react/CaretRight'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { localized, type AppStreamScreenshot } from '../utils/appstream'

import styles from './ScreenshotCarousel.module.css'

type ScreenshotCarouselProps = {
  screenshots: AppStreamScreenshot[]
}

export default function ScreenshotCarousel({ screenshots }: ScreenshotCarouselProps) {
  const { t, i18n } = useTranslation()
  const [index, setIndex] = useState(0)
  const total = screenshots.length

  useEffect(() => {
    setIndex((current) => (current < total ? current : 0))
  }, [total])

  if (total === 0) {
    return null
  }

  const active = Math.min(index, total - 1)

  function go(step: number) {
    setIndex((active + step + total) % total)
  }

  return (
    <div className={styles.carousel}>
      <div className={styles.viewport}>
        <div className={styles.track} style={{ transform: `translateX(-${active * 100}%)` }}>
          {screenshots.map((screenshot, position) => {
            const caption = localized(screenshot.caption, i18n.language)
            return (
              <figure
                aria-hidden={position !== active}
                className={styles.slide}
                key={`${screenshot.url}-${position}`}
              >
                <img
                  alt={caption ?? ''}
                  className={styles.image}
                  loading='lazy'
                  src={screenshot.url}
                />
                {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
              </figure>
            )
          })}
        </div>
        {total > 1 && (
          <>
            <ActionIcon
              aria-label={t('detail.previousScreenshot')}
              className={`${styles.nav} ${styles.previous}`}
              onClick={() => go(-1)}
              radius='xl'
              variant='default'
            >
              <CaretLeftIcon size={18} />
            </ActionIcon>
            <ActionIcon
              aria-label={t('detail.nextScreenshot')}
              className={`${styles.nav} ${styles.next}`}
              onClick={() => go(1)}
              radius='xl'
              variant='default'
            >
              <CaretRightIcon size={18} />
            </ActionIcon>
          </>
        )}
      </div>
      {total > 1 && (
        <div className={styles.dots}>
          {screenshots.map((screenshot, position) => (
            <button
              aria-label={t('detail.goToScreenshot', { index: position + 1 })}
              className={position === active ? `${styles.dot} ${styles.activeDot}` : styles.dot}
              key={`${screenshot.url}-dot-${position}`}
              onClick={() => setIndex(position)}
              type='button'
            />
          ))}
        </div>
      )}
    </div>
  )
}
