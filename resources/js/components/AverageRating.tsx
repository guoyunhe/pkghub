import { Rating, Text } from '@mantine/core'

import styles from './AverageRating.module.css'

type AverageRatingProps = {
  value: number | null
  /** Number of ratings, shown in parentheses after the average. `null` hides it. */
  count?: number | null
  size?: 'sm' | 'md' | 'lg'
}

/** Average rating of an application with the number of ratings in parentheses. */
export default function AverageRating({ value, count, size = 'sm' }: AverageRatingProps) {
  const rating = value === null || value === undefined || Number.isNaN(value) ? 0 : value
  const rounded = Math.round(rating * 2) / 2

  return (
    <span className={styles.rating}>
      <Rating count={5} fractions={2} readOnly size={size} value={rounded} />
      <Text className={styles.value} size={size}>
        {rating.toFixed(1)}
        {count !== null && count !== undefined && ` (${count})`}
      </Text>
    </span>
  )
}
