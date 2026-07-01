import type { CookieOptionsWithName } from '@supabase/ssr'

function hostWithoutPort(host?: string | null) {
  return (host || '').split(':')[0].replace(/^www\./, '').toLowerCase()
}

function envAppHost() {
  try {
    return hostWithoutPort(new URL(process.env.NEXT_PUBLIC_APP_URL || '').host)
  } catch {
    return ''
  }
}

function isShareableDomain(host: string, root: string) {
  return host === root || host.endsWith(`.${root}`)
}

export function getSupabaseCookieOptions(host?: string | null): CookieOptionsWithName {
  const cleanHost = hostWithoutPort(host)
  const configuredHost = envAppHost()
  const options: CookieOptionsWithName = {
    path: '/',
    sameSite: 'lax',
  }

  if (isShareableDomain(cleanHost, 'lvh.me')) {
    options.domain = '.lvh.me'
  } else if (
    configuredHost &&
    configuredHost !== 'localhost' &&
    configuredHost !== '127.0.0.1' &&
    isShareableDomain(cleanHost, configuredHost)
  ) {
    options.domain = `.${configuredHost}`
  }

  return options
}

