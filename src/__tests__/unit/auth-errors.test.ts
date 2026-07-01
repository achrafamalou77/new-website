import { describe, expect, it } from 'vitest'
import { AUTH_RATE_LIMIT_COOLDOWN_SECONDS, getAuthErrorMessage } from '@/lib/auth-errors'

describe('auth error messages', () => {
  it('turns Supabase rate limits into a timed retry response', () => {
    expect(getAuthErrorMessage({ code: 'over_request_rate_limit', status: 429 })).toEqual({
      code: 'rate_limited',
      error: 'Too many authentication requests. Please wait one minute before trying again.',
      retryAfterSeconds: AUTH_RATE_LIMIT_COOLDOWN_SECONDS,
    })
  })

  it('does not expose the raw invalid credentials message', () => {
    expect(getAuthErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toEqual({
      code: 'invalid_credentials',
      error: 'The email or password is incorrect.',
    })
  })
})
