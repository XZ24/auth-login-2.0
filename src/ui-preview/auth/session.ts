// Demonstration credentials only. These keys are never read by production auth.
const SESSION = 'ui-preview:auth:session:v1'
const PASSWORD = 'ui-preview:auth:password:v1'
export const DEMO_STAFF = 'NA1001'
export const DEMO_PASSWORD = 'Claims123!'
const digest = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(byte => byte.toString(16).padStart(2, '0')).join('')

export function hasPreviewSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION) || localStorage.getItem(SESSION) || 'null')
    return session?.staff === DEMO_STAFF && Number.isFinite(session.expires) && session.expires > Date.now()
  } catch { return false }
}
export async function passwordMatches(password: string) {
  return await digest(password) === (localStorage.getItem(PASSWORD) || await digest(DEMO_PASSWORD))
}
export async function signIn(staff: string, password: string, remember: boolean) {
  if (![DEMO_STAFF.toLowerCase(), 'nurul@example.com'].includes(staff.trim().toLowerCase()) || !await passwordMatches(password)) return false
  const session = JSON.stringify({ staff: DEMO_STAFF, expires: Date.now() + (remember ? 30 : 1) * 86400000 })
  localStorage.removeItem(SESSION)
  sessionStorage.removeItem(SESSION)
  ;(remember ? localStorage : sessionStorage).setItem(SESSION, session)
  return true
}
export async function updatePassword(password: string) {
  localStorage.setItem(PASSWORD, await digest(password))
}
export function signOut() {
  localStorage.removeItem(SESSION)
  sessionStorage.removeItem(SESSION)
  window.location.replace('/ui-preview/login')
}
