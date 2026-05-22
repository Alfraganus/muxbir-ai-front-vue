function getTokenPayload() {
  const token = localStorage.getItem('access_token')
  if (!token) return null
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

export function isTokenValid() {
  const payload = getTokenPayload()
  if (!payload) return false
  return payload.exp * 1000 > Date.now() + 10_000
}

export function getUserRole() {
  const p = getTokenPayload()
  if (!p) return null
  return p.role || p.user_type || p.type || p.user?.role || null
}

export function resolveRole(userObj) {
  return (
    userObj?.role ||
    userObj?.user_type ||
    userObj?.type ||
    getUserRole() ||
    null
  )
}

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'platform_admin'])
const COMPANY_ROLES = new Set(['company', 'company_owner', 'company_admin', 'owner'])

export function isAdminRole(role) {
  return ADMIN_ROLES.has(role)
}

export function isCompanyRole(role) {
  return COMPANY_ROLES.has(role)
}

export function homePathForRole(role) {
  if (isAdminRole(role)) return '/admin/overview'
  if (isCompanyRole(role)) return '/client/overview'
  return '/signin'
}
