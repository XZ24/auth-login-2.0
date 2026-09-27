import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowsDownUp, ArrowUp, BookmarkSimple, Check, DownloadSimple, FunnelSimple, MagnifyingGlass, Plus, Trash, UserPlus, X } from '@phosphor-icons/react'
import { Badge, Button, Input, Panel, PreviewIcon, Table, Tabs } from './components/primitives'
import { PIC_OPTIONS, saveAssignments } from './data/localState'
import { WORKBASKET_AS_OF, sla } from './data/workbasket'
import { builtinViews, CLAIM_TYPES, defaultFilters, exportClaimsCsv, filterRegistry, isOpen, normalizeFilters, readSavedViews, registryClaims, registryParams, SAVED_VIEWS_KEY, STATUSES, type RegistryClaim, type RegistryFilters, type SavedView, type SortField } from './data/registry'
import './claims.css'

const PAGE_SIZE = 12
const money = new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const date = (value: string) => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Asia/Kuala_Lumpur' })
function readUrl() {
  const params = new URLSearchParams(window.location.search)
  return { filters: normalizeFilters(Object.fromEntries(params)), page: Math.max(1, Math.floor(Number(params.get('page')) || 1)) }
}

export function ClaimsPage() {
  const [state, setState] = useState(readUrl)
  const { filters } = state
  const [claims, setClaims] = useState(registryClaims)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [customViews, setCustomViews] = useState(readSavedViews)
  const [viewName, setViewName] = useState('')
  const [savingView, setSavingView] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [assignee, setAssignee] = useState('Nurul Aisyah')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const selectAll = useRef<HTMLInputElement>(null)
  const saveInput = useRef<HTMLInputElement>(null)
  const assignSelect = useRef<HTMLSelectElement>(null)
  const saveButton = useRef<HTMLButtonElement>(null)
  const rows = filterRegistry(claims, filters)
  const beforeStatus = filterRegistry(claims, filters, false)
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const page = Math.min(state.page, pages)
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const views = [...builtinViews, ...customViews]
  const activeView = views.find(view => JSON.stringify(view.filters) === JSON.stringify(filters))
  const allSelected = visible.length > 0 && visible.every(claim => selected.has(claim.claimNo))
  const hasFilters = filters.q || filters.pic || filters.type || filters.sla !== 'all' || filters.status !== 'All'

  useEffect(() => {
    if (selectAll.current) selectAll.current.indeterminate = selected.size > 0 && !allSelected
  }, [selected, allSelected])
  useEffect(() => {
    const query = registryParams(filters, page).toString()
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
  }, [filters, page])
  useEffect(() => {
    const restore = () => { setState(readUrl()); setSelected(new Set()); setAssigning(false) }
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [])
  useEffect(() => { if (savingView) saveInput.current?.focus() }, [savingView])
  useEffect(() => { if (assigning) assignSelect.current?.focus() }, [assigning])

  function updateFilters(next: Partial<RegistryFilters>) {
    setState(current => ({ filters: { ...current.filters, ...next }, page: 1 }))
    setSelected(new Set()); setAssigning(false); setError('')
  }
  function changePage(next: number) {
    setState(current => ({ ...current, page: next })); setSelected(new Set()); setAssigning(false)
  }
  function sortBy(field: SortField) {
    updateFilters({ sort: field, direction: filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc' })
  }
  function toggleClaim(id: string) {
    setSelected(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next })
    setAssigning(false)
  }
  function saveView(event: React.FormEvent) {
    event.preventDefault()
    const name = viewName.trim()
    if (!name) { setError('Enter a name for this view.'); return }
    if (views.some(view => view.name.toLowerCase() === name.toLowerCase())) { setError('A view with that name already exists.'); return }
    const next: SavedView[] = [...customViews, { id: `custom-${crypto.randomUUID()}`, name, filters: { ...filters } }]
    try {
      localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(next))
      setCustomViews(next); setSavingView(false); setViewName(''); setError(''); setNotice(`Saved “${name}” on this browser.`); saveButton.current?.focus()
    } catch { setError('This browser could not save the view. Allow local storage and try again.') }
  }
  function deleteView() {
    if (!activeView?.id.startsWith('custom-')) return
    const next = customViews.filter(view => view.id !== activeView.id)
    try { localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(next)); setCustomViews(next); setNotice(`Deleted saved view “${activeView.name}”. Your filters are still applied.`); setError('') }
    catch { setError('This browser could not delete the saved view.') }
  }
  function assign() {
    try {
      saveAssignments([...selected], assignee)
      setClaims(registryClaims()); setNotice(`${selected.size} ${selected.size === 1 ? 'claim' : 'claims'} ${assignee === 'Unassigned' ? 'marked unassigned' : `assigned to ${assignee}`}. Saved locally for this preview.`)
      setSelected(new Set()); setAssigning(false); setError('')
    } catch { setError('Assignment could not be saved in this browser. Allow local storage and try again.') }
  }
  function exportRows() {
    const records = selected.size ? rows.filter(claim => selected.has(claim.claimNo)) : rows
    const blob = new Blob([exportClaimsCsv(records)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob), anchor = document.createElement('a')
    anchor.href = url; anchor.download = `claims-${selected.size ? 'selected' : 'filtered'}-2026-09-25.csv`
    anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice(`Exported ${records.length} ${records.length === 1 ? 'claim' : 'claims'} to CSV.`)
  }
  function workspaceHref(claim: RegistryClaim) {
    const returnTo = `/ui-preview/claims?${registryParams(filters, page)}`
    const params = new URLSearchParams({ claim: claim.claimNo, from: 'claims', view: activeView?.name || 'Filtered claims',
      position: String(rows.findIndex(row => row.claimNo === claim.claimNo) + 1), total: String(rows.length),
      order: rows.map(row => row.claimNo).join(','), returnTo, asOf: WORKBASKET_AS_OF })
    if (isOpen(claim)) params.set('queue', claim.queue)
    return `/ui-preview/workspace?${params}`
  }
  function sortHeader(field: SortField, label: string) {
    return <th scope="col" aria-sort={filters.sort === field ? filters.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button type="button" onClick={() => sortBy(field)} aria-label={`Sort by ${label}`}><span>{label}</span><PreviewIcon icon={filters.sort === field ? filters.direction === 'asc' ? ArrowUp : ArrowDown : ArrowsDownUp} /></button></th>
  }

  return <div className="pv-registry">
    <div className="pv-page-heading"><div><div className="pv-eyebrow">CLAIM REGISTRY</div><h1>Claims</h1><p>Find, assign, and manage claims across every stage.</p></div><div className="cr-page-actions"><Badge>Mock data · 25 Sep 2026</Badge><Button onClick={exportRows} disabled={!rows.length}><PreviewIcon icon={DownloadSimple} />{selected.size ? `Export selected (${selected.size})` : 'Export results'}</Button></div></div>
    <div className="cr-saved-row"><PreviewIcon icon={BookmarkSimple} /><label htmlFor="claims-saved-view">Saved view</label><select id="claims-saved-view" value={activeView?.id || 'custom'} onChange={event => { const view = views.find(item => item.id === event.target.value); if (view) updateFilters(view.filters) }}><option value="custom" disabled>Custom filters</option>{views.map(view => <option key={view.id} value={view.id}>{view.name}</option>)}</select><button ref={saveButton} type="button" className="cr-save-button" onClick={() => { setSavingView(!savingView); setError('') }} aria-expanded={savingView} aria-controls="claims-save-view"><PreviewIcon icon={Plus} />Save view</button>{activeView?.id.startsWith('custom-') && <Button variant="ghost" onClick={deleteView} aria-label={`Delete saved view ${activeView.name}`}><PreviewIcon icon={Trash} /></Button>}<span className="cr-local-hint">Personal views · saved on this browser</span></div>
    {savingView && <form id="claims-save-view" className="cr-inline-form" onSubmit={saveView}><label htmlFor="claims-view-name">View name</label><Input ref={saveInput} id="claims-view-name" placeholder="e.g. My travel delay claims" value={viewName} maxLength={40} required onChange={event => setViewName(event.target.value)} /><Button type="submit" variant="primary">Save current filters</Button><Button onClick={() => { setSavingView(false); setError(''); saveButton.current?.focus() }}>Cancel</Button></form>}
    <Panel className="cr-panel" aria-label="Claims registry">
      <Tabs label="Claim status" items={['All', ...STATUSES].map(status => ({ id: status, label: `${status === 'All' ? 'All claims' : status} (${status === 'All' ? beforeStatus.length : beforeStatus.filter(claim => claim.status === status).length})` }))} value={filters.status} onChange={status => updateFilters({ status: status as RegistryFilters['status'] })}>
        <div className="cr-search-row"><div className="cr-search"><PreviewIcon icon={MagnifyingGlass} /><label className="pv-sr-only" htmlFor="claims-search">Search claims by claim number, policy number, or customer</label><Input id="claims-search" type="search" placeholder="Search claim number, policy number, or customer" value={filters.q} onChange={event => updateFilters({ q: event.target.value })} /></div><span className="cr-result-summary" role="status">{rows.length} of {claims.length} claims</span></div>
        <div className="cr-filters"><span className="cr-filter-label"><PreviewIcon icon={FunnelSimple} />Filters</span><label>PIC<select aria-label="Filter by PIC" value={filters.pic} onChange={event => updateFilters({ pic: event.target.value })}><option value="">All assessors</option>{PIC_OPTIONS.map(pic => <option key={pic}>{pic}</option>)}</select></label><label>Type<select aria-label="Filter by claim type" value={filters.type} onChange={event => updateFilters({ type: event.target.value })}><option value="">All claim types</option>{CLAIM_TYPES.map(type => <option key={type}>{type}</option>)}</select></label><label>SLA<select aria-label="Filter by SLA" value={filters.sla} onChange={event => updateFilters({ sla: event.target.value as RegistryFilters['sla'] })}><option value="all">Any SLA</option><option value="overdue">Overdue</option><option value="due-today">Due today</option><option value="upcoming">Upcoming</option></select></label>{hasFilters && <Button variant="ghost" onClick={() => updateFilters(defaultFilters)}><PreviewIcon icon={X} />Clear filters</Button>}</div>
        {selected.size > 0 && <div className="cr-bulk-bar"><span><strong>{selected.size}</strong> selected on this page</span><Button variant="primary" onClick={() => setAssigning(true)}><PreviewIcon icon={UserPlus} />Assign selected</Button><Button onClick={exportRows}><PreviewIcon icon={DownloadSimple} />Export selected</Button><Button variant="ghost" onClick={() => { setSelected(new Set()); setAssigning(false) }}>Clear selection</Button></div>}
        {assigning && selected.size > 0 && <div className="cr-inline-form cr-assignment"><label htmlFor="claims-assign">Assign {selected.size} {selected.size === 1 ? 'claim' : 'claims'} to</label><select ref={assignSelect} id="claims-assign" value={assignee} onChange={event => setAssignee(event.target.value)}>{PIC_OPTIONS.map(pic => <option key={pic}>{pic}</option>)}</select><Button variant="primary" onClick={assign}>Apply assignment</Button><Button onClick={() => setAssigning(false)}>Cancel</Button></div>}
        <Table label="Claim registry results"><thead><tr><th scope="col"><input ref={selectAll} type="checkbox" aria-label="Select all claims on this page" checked={allSelected} disabled={!visible.length} onChange={() => { setSelected(allSelected ? new Set() : new Set(visible.map(claim => claim.claimNo))); setAssigning(false) }} /></th>{sortHeader('claimNo', 'Claim No / Policy')}{sortHeader('customer', 'Customer')}<th scope="col">Claim Type</th><th scope="col">Status</th>{sortHeader('amount', 'Claimed · MYR')}{sortHeader('dueAt', 'SLA')}<th scope="col">PIC</th>{sortHeader('registeredAt', 'Registered')}<th scope="col"><span className="pv-sr-only">Open claim</span></th></tr></thead><tbody>{visible.map(claim => {
          const due = sla(claim), href = workspaceHref(claim)
          return <tr key={claim.claimNo} className={selected.has(claim.claimNo) ? 'is-selected' : ''} onClick={event => {
            if ((event.target as HTMLElement).closest('a, button, input, label') || window.getSelection()?.toString()) return
            window.location.assign(href)
          }}><td><input type="checkbox" aria-label={`Select ${claim.claimNo}`} checked={selected.has(claim.claimNo)} onChange={() => toggleClaim(claim.claimNo)} /></td><td><a className="cr-claim-link pv-mono" href={href} aria-label={`Open claim ${claim.claimNo} for ${claim.customer}`}>{claim.claimNo}</a><span className="cr-secondary pv-mono">{claim.policyNo}</span></td><td className="cr-customer">{claim.customer}</td><td>{claim.claimType}</td><td><span className={`cr-status cr-status--${claim.status.toLowerCase().replace(/ /g, '-')}`}><span />{claim.status}</span></td><td className="cr-amount">{money.format(claim.amount)}</td><td><span className={isOpen(claim) && due.overdue ? 'cr-overdue' : isOpen(claim) && due.urgent ? 'cr-due' : 'cr-muted'}>{isOpen(claim) ? due.label : 'Complete'}</span></td><td><button className={`cr-pic-button ${claim.pic === 'Unassigned' ? 'is-unassigned' : ''}`} aria-label={`Assign ${claim.claimNo}, currently ${claim.pic}`} onClick={() => { setSelected(new Set([claim.claimNo])); setAssignee(claim.pic); setAssigning(true) }}>{claim.pic}<PreviewIcon icon={UserPlus} /></button></td><td><time dateTime={claim.registeredAt}>{date(claim.registeredAt)}</time></td><td className="cr-row-arrow"><PreviewIcon icon={ArrowRight} /></td></tr>
        })}</tbody></Table>
        {!rows.length && <div className="cr-empty"><PreviewIcon icon={MagnifyingGlass} size="illustration" /><h2>No claims match these filters</h2><p>Try a different search, status, or assessor.</p><Button onClick={() => updateFilters(defaultFilters)}>Clear filters</Button></div>}
        <div className="cr-pagination"><span>{rows.length ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, rows.length)} of ${rows.length}` : '0'} claims<span className="cr-pagination-note"> · Selection applies to this page</span></span><div><Button disabled={page === 1} onClick={() => changePage(page - 1)}>Previous</Button><span className="pv-mono">{page} / {pages}</span><Button disabled={page === pages} onClick={() => changePage(page + 1)}>Next</Button></div></div>
      </Tabs>
    </Panel>
    <div className="cr-feedback">{error ? <p role="alert" className="cr-error">{error}</p> : <p role="status">{notice && <PreviewIcon icon={Check} />}{notice || 'Local preview data. Assignments and saved views stay on this browser.'}</p>}</div>
  </div>
}
