import { isXiorError } from 'xior'

type ErrorResponse = {
  message?: string
  errors?: Array<{ message?: string }>
}

/**
 * Extracts the message reported by the API, falling back to the error message or a generic one when
 * the request never reached the server.
 */
export function getErrorMessage(error: unknown) {
  if (isXiorError<ErrorResponse>(error)) {
    const body = error.response?.data
    if (body?.message ?? body?.errors?.[0]?.message) {
      return body.message ?? body.errors?.[0]?.message
    }
  }
  return error instanceof Error ? error.message : 'Request failed'
}
