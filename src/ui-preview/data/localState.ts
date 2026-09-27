// Preview-only persistence. No authentication keys or production data are read.
export const PIC_OPTIONS = ['Nurul Aisyah', 'Fatimah', 'Emmyra', 'Nurmasriza', 'Unassigned']
const ASSIGNMENTS_KEY = 'ui-preview:claim-assignments:v1'
export function readAssignments(): Record<string, string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    return Object.fromEntries(Object.entries(value).filter(([key, pic]) => /^TC-\d+$/.test(key) && typeof pic === 'string' && PIC_OPTIONS.includes(pic)))
  } catch { return {} }
}
export function saveAssignments(claimNos: string[], pic: string) {
  if (!PIC_OPTIONS.includes(pic)) throw new Error('Choose a valid assessor.')
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify({ ...readAssignments(), ...Object.fromEntries(claimNos.map(id => [id, pic])) }))
}
