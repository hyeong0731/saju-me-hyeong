const SHARE_TOKEN_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function getShareTokenFromLocation() {
  try {
    const token = new URLSearchParams(window.location.search).get('share')
    if (!token || !SHARE_TOKEN_RE.test(token)) return null
    return token
  } catch {
    return null
  }
}

export function clearShareParamFromUrl() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('share')) return
  url.searchParams.delete('share')
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

export function shareUrlForToken(token) {
  return `${window.location.origin}/?share=${token}`
}
