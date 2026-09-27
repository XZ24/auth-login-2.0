import { useContextDisclosure } from './useContextDisclosure'
import { EnvelopeSimple, User } from '@phosphor-icons/react'
import { PreviewIcon } from '../components/primitives'
import type { RegistryClaim } from '../data/registry'
import { customerEmail, incidentDate, money, shortDate, type WorkspaceState } from './model'

export function ContextPanel({ claim, state }: { claim: RegistryClaim; state: WorkspaceState }) {
  const disclosure = useContextDisclosure()
  return <details className="ws-side-panel ws-context" {...disclosure}><summary><h2>Claim context</h2><span>Context</span></summary><div className="ws-side-content"><div className="ws-context-person"><span><PreviewIcon icon={User} size="navigation" /></span><div><strong>{claim.customer}</strong><small>Claimant & insured</small></div></div><div className="ws-contact"><PreviewIcon icon={EnvelopeSimple} /><span>{customerEmail(claim)}</span></div><dl className="ws-context-fields"><div><dt>Contact</dt><dd>+60 12-000 {claim.claimNo.slice(-4)}<small>Demo contact</small></dd></div><div><dt>Policy</dt><dd className="pv-mono">{claim.policyNo}<small>TripCare 360 International</small></dd></div><div><dt>Claim type</dt><dd>{claim.claimType}</dd></div><div><dt>Loss / incident</dt><dd>{shortDate(incidentDate(claim))}</dd></div></dl><dl className="ws-financial-summary"><div><dt>Claimed</dt><dd>{money(state.assessment.claimed)}</dd></div><div><dt>Eligible <small>Provisional</small></dt><dd>{money(state.assessment.eligible)}</dd></div></dl><dl className="ws-context-fields"><div><dt>PIC</dt><dd>{state.pic}</dd></div><div><dt>Category</dt><dd>{state.category}</dd></div></dl></div></details>
}
