import { Rating, Text } from '@mantine/core'

import styles from './AverageRating.module.css'

type AverageRatingProps = {
  value: number | null
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}

export default function AverageRating({
  value,
  size = 'sm',
  showValue = true,
}: AverageRatingProps) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null
  }

  const rounded = Math.round(value * 2) / 2

  return (
    <span className={styles.rating}>
      <Rating count={5} fractions={2} readOnly size={size} value={rounded} />
      {showValue && <Text className={styles.value}>{value.toFixed(1)}</Text>}
    </span>
  )
}
