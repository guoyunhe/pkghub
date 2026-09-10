export type PaginationMeta = {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

export type Paginated<T> = {
  data: T[]
  meta: PaginationMeta
}

export type SerializedPaginated<T> = {
  data: T[]
  metadata: PaginationMeta
}
