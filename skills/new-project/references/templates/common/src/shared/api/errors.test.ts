import { describe, expect, it } from 'vitest'
import { ApiError, errorKey, fieldErrors, NetworkError } from './errors'

describe('errorKey', () => {
  it('maps network failures', () => {
    expect(errorKey(new NetworkError())).toBe('network')
  })

  it('maps known statuses', () => {
    expect(errorKey(new ApiError(404, 'not_found'))).toBe('notFound')
    expect(errorKey(new ApiError(401, 'unauthorized'))).toBe('unauthorized')
  })

  it('falls back to generic', () => {
    expect(errorKey(new ApiError(500, 'internal'))).toBe('generic')
    expect(errorKey(new Error('boom'))).toBe('generic')
  })
})

describe('fieldErrors', () => {
  it('returns field keys from the API error', () => {
    const error = new ApiError(422, 'validation', { fields: { email: 'validation.invalid' } })
    expect(fieldErrors(error)).toEqual({ email: 'validation.invalid' })
  })

  it('returns an empty map otherwise', () => {
    expect(fieldErrors(new Error('x'))).toEqual({})
  })
})
