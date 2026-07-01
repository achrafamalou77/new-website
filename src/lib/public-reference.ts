export function buildPublicReference(prefix: string, id: string | number | null | undefined) {
  const compactId = String(id ?? '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 10)
    .toUpperCase()

  if (!compactId) {
    return `${prefix}-PENDING`
  }

  return `${prefix}-${compactId}`
}
