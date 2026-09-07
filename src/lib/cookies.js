// Minimal cookie helpers (used to persist the user's theme choice).

export function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

export function setCookie(name, value, maxAgeDays = 365) {
  const maxAge = Math.floor(maxAgeDays * 24 * 60 * 60)
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}
