// Token decoding is only for expiry UX; the backend verifies authentication.
export function tokenExpiry(token) {
  try {
    const encoded = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
    const { exp } = JSON.parse(atob(encoded));
    return Number.isFinite(exp) ? exp * 1000 : 0;
  } catch { return 0; }
}

export function sessionExpired(token, now = Date.now()) {
  return !token || tokenExpiry(token) <= now;
}
