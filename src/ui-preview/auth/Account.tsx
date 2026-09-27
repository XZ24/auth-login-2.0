import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Eye, EyeSlash, FolderSimple, X } from '@phosphor-icons/react'
import { Button, Input, Panel, PreviewIcon } from '../components/primitives'
import { DEMO_PASSWORD, DEMO_STAFF, hasPreviewSession, passwordMatches, signIn, updatePassword } from './session'
import './auth.css'

function PasswordField({ id, label, value, change, error, autoComplete, children }: { id: string; label: string; value: string; change: (value: string) => void; error?: string; autoComplete: string; children?: ReactNode }) {
  const [visible, setVisible] = useState(false)
  return <div className="pa-field"><label htmlFor={id}>{label}</label><div className="pa-password"><Input id={id} type={visible ? 'text' : 'password'} autoComplete={autoComplete} value={value} required onChange={event => change(event.target.value)} aria-invalid={!!error} aria-describedby={[error ? `${id}-error` : '', children ? `${id}-help` : ''].filter(Boolean).join(' ') || undefined} /><button type="button" aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}><PreviewIcon icon={visible ? EyeSlash : Eye} /></button></div>{children && <div id={`${id}-help`}>{children}</div>}{error && <p id={`${id}-error`} className="pa-error" role="alert">{error}</p>}</div>
}

export function PreviewAuthGate({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(hasPreviewSession)
  useEffect(() => {
    const check = () => {
      if (!hasPreviewSession()) { setAuthenticated(false); window.location.replace('/ui-preview/login') }
    }
    check()
    window.addEventListener('pageshow', check)
    window.addEventListener('storage', check)
    window.addEventListener('focus', check)
    return () => { window.removeEventListener('pageshow', check); window.removeEventListener('storage', check); window.removeEventListener('focus', check) }
  }, [])
  return authenticated ? <>{children}</> : null
}

export function PreviewLogin() {
  const [staff, setStaff] = useState(''), [password, setPassword] = useState(''), [remember, setRemember] = useState(false)
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => { if (hasPreviewSession()) window.location.replace('/ui-preview/workbasket') }, [])
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return
    setBusy(true); setError('')
    try {
      if (await signIn(staff, password, remember)) window.location.replace('/ui-preview/workbasket')
      else { setError('Staff ID or password is incorrect.'); setBusy(false) }
    } catch { setError('Could not save the preview session. Allow browser storage and try again.'); setBusy(false) }
  }
  return <main className="ui-preview pa-login"><div className="pa-login-wrap"><div className="pa-brand"><span className="pv-brand-mark"><PreviewIcon icon={FolderSimple} size="illustration" /></span><div><strong>Travel Claims</strong><p className="pv-eyebrow">ASSESSOR WORKSPACE</p></div></div><Panel className="pa-login-panel"><h1>Sign in</h1><p className="pa-muted">Access your claims workspace.</p><form onSubmit={submit}><div className="pa-field"><label htmlFor="preview-staff">Staff ID or Email</label><Input id="preview-staff" autoComplete="username" value={staff} required onChange={event => setStaff(event.target.value)} /></div><PasswordField id="preview-password" label="Password" autoComplete="current-password" value={password} change={setPassword} /><label className="pa-remember"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} />Remember me<span>30 days</span></label>{error && <p className="pa-error" role="alert">{error}</p>}<Button variant="primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button></form></Panel><p className="pa-demo">Preview access: <strong>{DEMO_STAFF}</strong> / <strong>{DEMO_PASSWORD}</strong><br />Use your updated password after changing it.</p></div></main>
}

export function ChangePassword({ close, success }: { close: () => void; success: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [current, setCurrent] = useState(''), [next, setNext] = useState(''), [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({}), [busy, setBusy] = useState(false)
  useEffect(() => { const element = dialog.current!; element.showModal(); return () => element.close() }, [])
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return
    setBusy(true); setErrors({})
    try {
      const validation: Record<string, string> = {}
      if (!await passwordMatches(current)) validation.current = 'Current password is incorrect.'
      if (next.length < 8 || !/[A-Z]/.test(next) || !/[a-z]/.test(next) || !/[0-9]/.test(next)) validation.next = 'Use at least 8 characters, uppercase and lowercase letters, and a number.'
      if (next !== confirm) validation.confirm = 'Passwords do not match.'
      if (Object.keys(validation).length) { setErrors(validation); window.requestAnimationFrame(() => dialog.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()); return }
      await updatePassword(next); success()
    } catch { setErrors({ storage: 'Could not update the preview password. Allow browser storage and try again.' }) }
    finally { setBusy(false) }
  }
  return <dialog ref={dialog} className="pa-dialog" aria-labelledby="change-password-title" onCancel={event => { if (busy) event.preventDefault(); else close() }}><div className="pa-dialog-head"><h2 id="change-password-title">Change password</h2><Button variant="ghost" disabled={busy} aria-label="Close change password" onClick={close}><PreviewIcon icon={X} /></Button></div><form onSubmit={submit}><div className="pa-dialog-body"><PasswordField id="current-password" label="Current password" autoComplete="current-password" value={current} change={setCurrent} error={errors.current} /><PasswordField id="new-password" label="New password" autoComplete="new-password" value={next} change={setNext} error={errors.next}><ul className="pa-requirements"><li>At least 8 characters</li><li>Uppercase and lowercase</li><li>At least one number</li></ul></PasswordField><PasswordField id="confirm-password" label="Confirm new password" autoComplete="new-password" value={confirm} change={setConfirm} error={errors.confirm} />{errors.storage && <p className="pa-error" role="alert">{errors.storage}</p>}</div><div className="pa-dialog-footer"><Button disabled={busy} onClick={close}>Cancel</Button><Button variant="primary" type="submit" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</Button></div></form></dialog>
}
