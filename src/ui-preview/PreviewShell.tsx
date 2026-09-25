import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowSquareOut, ChartBar, CaretDown, CaretRight, Check, Circle, ClockCountdown, FileText, FolderSimple, MagnifyingGlass, SidebarSimple, SquaresFour, Tray, X } from '@phosphor-icons/react'
import { Badge, Button, Input, PageContainer, PreviewIcon } from './components/primitives'

const destinations = [
  { label: 'Workbasket', icon: SquaresFour, href: '/ui-preview/workbasket', description: 'Choose your next claim' },
  { label: 'Claims', icon: FolderSimple, href: '/ui-preview/claims', description: 'Find and manage claims' },
  { label: 'Claim workspace', icon: FileText, href: '/ui-preview/workspace', description: 'Process a claim' },
]
const navigation = [
  ...destinations.slice(0, 2),
  { label: 'Inbox', icon: Tray, href: '', description: '' },
  { label: 'Reminders', icon: ClockCountdown, href: '', description: '' },
  { label: 'Templates', icon: FileText, href: '', description: '' },
]

export function PreviewShell({ page, children }: { page: string; children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const activePage = page === 'Claim workspace' ? 'Claims' : page
  const matches = destinations.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        if (profileOpen) profileRef.current?.querySelector('button')?.focus()
        setProfileOpen(false)
        if (sidebarOpen) menuRef.current?.focus()
        setSidebarOpen(false)
      }
    }
    const dismiss = (event: PointerEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('pointerdown', dismiss)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('pointerdown', dismiss)
    }
  }, [profileOpen, sidebarOpen])

  useEffect(() => {
    if (sidebarOpen) sidebarRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
  }, [sidebarOpen])

  return <div className="ui-preview">
    <a className="pv-skip" href="#preview-content">Skip to content</a>
    {sidebarOpen && <button className="pv-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <aside ref={sidebarRef} id="preview-navigation" className={`pv-sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Application navigation"
      onKeyDown={event => {
        if (!sidebarOpen || event.key !== 'Tab') return
        const controls = sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
        if (!controls?.length) return
        const first = controls[0], last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }}>
      <a href="/ui-preview/workbasket" className="pv-brand" aria-label="Travel Claims preview home">
        <span className="pv-brand-mark"><PreviewIcon icon={FolderSimple} size="illustration" /></span>
        <span className="pv-brand-text">Travel Claims<span>ASSESSOR WORKSPACE</span></span>
      </a>
      <button className="pv-mobile-close" aria-label="Close navigation" onClick={() => { setSidebarOpen(false); menuRef.current?.focus() }}><PreviewIcon icon={X} /></button>
      <div className="pv-team"><span className="pv-team-avatar">TC</span><span>Travel operations<small>Malaysia · Claims team</small></span></div>
      <div className="pv-nav-section-label">WORKSPACE</div>
      <nav className="pv-nav" aria-label="Workspace">
        {navigation.map(item => item.href ? <a key={item.label} href={item.href} className={`pv-nav-item ${activePage === item.label ? 'is-active' : ''}`} aria-current={activePage === item.label ? 'page' : undefined}>
          <PreviewIcon icon={item.icon} size="navigation" /><span>{item.label}</span>{activePage === item.label && <span className="pv-active-dot" />}
        </a> : <button key={item.label} className="pv-nav-item" disabled title="Not included in this shell preview"><PreviewIcon icon={item.icon} size="navigation" /><span>{item.label}</span><small>Later</small></button>)}
      </nav>
      <div className="pv-nav-divider" />
      <nav className="pv-nav" aria-label="Reporting"><button className="pv-nav-item" disabled title="Not included in this shell preview"><PreviewIcon icon={ChartBar} size="navigation" /><span>Monitoring</span><small>Later</small></button></nav>
      <div className="pv-sidebar-bottom"><div className="pv-environment"><PreviewIcon icon={Circle} /><span>Design preview</span><span className="pv-mono">01</span></div><p>A separate space to explore.<br />Your live workspace is unchanged.</p></div>
    </aside>
    <div className="pv-app-frame">
      <header className="pv-header">
        <button ref={menuRef} className="pv-mobile-menu" aria-label="Open navigation" aria-expanded={sidebarOpen} aria-controls="preview-navigation" onClick={() => setSidebarOpen(true)}><PreviewIcon icon={SidebarSimple} size="navigation" /></button>
        <div className="pv-breadcrumb"><span>Workspace</span><PreviewIcon icon={CaretRight} /><strong>{page}</strong></div>
        <div className="pv-search" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false) }}>
          <div className="pv-search-field"><PreviewIcon icon={MagnifyingGlass} /><Input ref={searchRef} type="search" aria-label="Global search" placeholder="Search claims, policies, customers…" value={query} aria-expanded={searchOpen} aria-controls="preview-search-results" onFocus={() => setSearchOpen(true)} onChange={event => { setQuery(event.target.value); setSearchOpen(true) }} /><kbd>⌘ K</kbd></div>
          {searchOpen && <div className="pv-search-results" id="preview-search-results"><p className="pv-eyebrow">PREVIEW NAVIGATION</p><p className="pv-search-hint">Claim search will be connected in the next stage.</p>{matches.map(item => <a key={item.href} href={item.href}><PreviewIcon icon={item.icon} /><span>{item.label}<small>{item.description}</small></span><PreviewIcon icon={ArrowSquareOut} /></a>)}{!matches.length && <p role="status" className="pv-search-hint">No preview pages match “{query}”.</p>}</div>}
        </div>
        <div className="pv-header-end"><Badge tone="accent">Preview</Badge><div ref={profileRef} className="pv-profile-wrap"><button className="pv-profile" aria-label="Nurul Aisyah, profile" aria-expanded={profileOpen} aria-controls="preview-profile" onClick={() => setProfileOpen(!profileOpen)}><span className="pv-avatar">NA</span><span className="pv-profile-name">Nurul Aisyah<small>Claims assessor</small></span><PreviewIcon icon={CaretDown} /></button>
          {profileOpen && <section id="preview-profile" className="pv-profile-popover" aria-label="Preview profile"><span className="pv-eyebrow">PREVIEW PROFILE</span><h3>Nurul Aisyah</h3><p>Claims assessor · Malaysia</p><div><PreviewIcon icon={Check} /><span>Local demonstration profile</span></div><p className="pv-caption">Account settings are outside this shell preview.</p><Button variant="ghost" onClick={() => { setProfileOpen(false); profileRef.current?.querySelector('button')?.focus() }}>Close</Button></section>}
        </div></div>
      </header>
      <main id="preview-content" tabIndex={-1}><PageContainer>{children}</PageContainer></main>
      <footer className="pv-footer"><span>Travel Claims <span aria-hidden="true">/</span> Interface preview</span><span>Foundation <span className="pv-mono">v0.1</span></span></footer>
    </div>
  </div>
}
