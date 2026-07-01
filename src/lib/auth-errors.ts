export const AUTH_RATE_LIMIT_COOLDOWN_SECONDS = 60

export function getAuthErrorMessage(error: { code?: string; status?: number; message?: string }) {
  if (error.code === 'over_request_rate_limit' || error.status === 429) {
    return {
      code: 'rate_limited' as const,
      error: 'Too many authentication requests. Please wait one minute before trying again.',
      retryAfterSeconds: AUTH_RATE_LIMIT_COOLDOWN_SECONDS,
    }
  }

  if (error.code === 'invalid_credentials') {
    return {
      code: 'invalid_credentials' as const,
      error: 'The email or password is incorrect.',
    }
  }

  return {
    code: 'auth_error' as const,
    error: error.message || 'Sign in failed. Please try again.',
  }
}
