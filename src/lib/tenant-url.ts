function trimProtocol(value: string) {
  return value.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

export function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

export function getTenantUrl(subdomain?: string | null, customDomain?: string | null) {
  if (customDomain) return `https://${trimProtocol(customDomain)}`

  const appUrl = getAppBaseUrl()
  let parsed: URL
  try {
    parsed = new URL(appUrl)
  } catch {
    parsed = new URL('http://localhost:3000')
  }

  if (!subdomain) return parsed.toString().replace(/\/$/, '')

  const host = parsed.host
  const hostname = parsed.hostname
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'lvh.me' || hostname.endsWith('.lvh.me')

  if (isLocal) {
    const port = parsed.port ? `:${parsed.port}` : ''
    return `http://${subdomain}.lvh.me${port}`
  }

  return `${parsed.protocol}//${subdomain}.${host}`
}

export function getTenantUrlLabel(subdomain?: string | null, customDomain?: string | null) {
  return getTenantUrl(subdomain, customDomain).replace(/^https?:\/\//, '')
}
